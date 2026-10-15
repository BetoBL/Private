import { Router } from "express";
import { z } from "zod";
import { AVISO_SEGURANCA, catalogoParaPaciente, familiaDaEmocao, FAMILIAS, normalizarConfig, sofrimentoIntenso, validarCartao, VERSAO_CATALOGO } from "../lib/diario/catalogo";
import { escalaPorCodigo } from "../lib/escalas/definicoes";
import { validarRespostas } from "../lib/escalas/pontuar";
import { prisma } from "../lib/prisma";
import { registrarResposta } from "./escalas.routes";
import { registrarRespostaFormulario } from "./formularios.routes";
import { asyncHandler, validateBody } from "../lib/validate";

// Diário do paciente, lado do PACIENTE: sem login, protegido pelo segredo do link que o psicólogo gerou.
// Mostra só o necessário (primeiro nome, clínica, profissional, o catálogo e os últimos registros do próprio paciente).
export const diarioPublicoRouter = Router();

const janela = new Map<string, { n: number; ate: number }>();
diarioPublicoRouter.use((req, res, next) => {
  const ip = req.ip ?? "?", agora = Date.now(), j = janela.get(ip);
  if (!j || j.ate < agora) janela.set(ip, { n: 1, ate: agora + 60_000 });
  else if (++j.n > 60) { res.status(429).json({ error: "Muitas tentativas. Aguarde um minuto." }); return; }
  next();
});

const naoEncontrado = (res: { status: (c: number) => { json: (b: unknown) => void } }) => res.status(404).json({ error: "Este link não está mais ativo. Peça um novo link ao(à) seu(sua) psicólogo(a)." });

async function acessoDoLink(segredo: string) {
  const a = await prisma.acessoDiario.findUnique({ where: { segredo } });
  if (!a || a.revogadoEm) return null;
  const [paciente, clinica, profissional] = await Promise.all([
    prisma.paciente.findUnique({ where: { id: a.pacienteId }, select: { nome: true } }),
    prisma.clinica.findUnique({ where: { id: a.clinicaId }, select: { nomeFantasia: true, razaoSocial: true } }),
    prisma.profissional.findUnique({ where: { id: a.profissionalId }, select: { nome: true } }),
  ]);
  return { a, paciente, clinica, profissional };
}

diarioPublicoRouter.get("/:segredo", asyncHandler(async (req, res) => {
  const r = await acessoDoLink(req.params.segredo);
  if (!r) { naoEncontrado(res); return; }
  await prisma.acessoDiario.update({ where: { id: r.a.id }, data: { ultimoUsoEm: new Date() } });
  const recentes = await prisma.cartaoDiario.findMany({ where: { pacienteId: r.a.pacienteId }, orderBy: [{ ocorridoEm: "desc" }, { registradoEm: "desc" }], take: 14, select: { ocorridoEm: true, emocao: true, familia: true, intensidade: true } });
  const cfgBanco = await prisma.configDiario.findUnique({ where: { pacienteId: r.a.pacienteId } });
  const cfg = normalizarConfig(cfgBanco ? { etapas: cfgBanco.etapas, emocoesOcultas: cfgBanco.emocoesOcultas } : null);
  const hoje = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
  const pendentes = await prisma.solicitacaoEscala.findMany({ where: { pacienteId: r.a.pacienteId, status: "PENDENTE", excluidaEm: null, prazo: { lte: hoje } }, orderBy: { prazo: "asc" }, take: 10 });
  const escalas = pendentes.map((s) => ({ id: s.id, nome: escalaPorCodigo(s.escala)?.nome ?? s.escala, tempo: escalaPorCodigo(s.escala)?.tempo ?? "", prazo: s.prazo.toISOString().slice(0, 10) }));
  const forms = await prisma.formularioPaciente.findMany({ where: { pacienteId: r.a.pacienteId, modo: "LINK", status: "PENDENTE", excluidoEm: null }, orderBy: { criadoEm: "asc" }, take: 10, select: { id: true, nome: true, tipo: true } });
  res.json({ formularios: forms, paciente: (r.paciente?.nome ?? "").split(" ")[0], clinica: r.clinica?.nomeFantasia || r.clinica?.razaoSocial || "", profissional: r.profissional?.nome ?? "", catalogo: catalogoParaPaciente(cfg), recentes, escalas });
}));

// Escalas pedidas pelo profissional. O paciente vê as perguntas e responde; NUNCA recebe pontuação nem faixa (só um cuidado, se houver sinal de risco).
diarioPublicoRouter.get("/:segredo/escalas/:id", asyncHandler(async (req, res) => {
  const r = await acessoDoLink(req.params.segredo);
  if (!r) { naoEncontrado(res); return; }
  const s = await prisma.solicitacaoEscala.findFirst({ where: { id: req.params.id, pacienteId: r.a.pacienteId, status: "PENDENTE", excluidaEm: null } });
  const e = s && escalaPorCodigo(s.escala);
  if (!s || !e) { res.status(404).json({ error: "Esta escala não está mais disponível." }); return; }
  res.json({ id: s.id, nome: e.nome, instrucao: e.instrucao, opcoes: e.opcoes, itens: e.itens.map((i) => ({ id: i.id, texto: i.texto })), itemFuncional: e.itemFuncional ?? null });
}));

diarioPublicoRouter.post("/:segredo/escalas/:id", validateBody(z.object({ respostas: z.record(z.string(), z.number()) })), asyncHandler(async (req, res) => {
  const r = await acessoDoLink(req.params.segredo);
  if (!r) { naoEncontrado(res); return; }
  const s = await prisma.solicitacaoEscala.findFirst({ where: { id: req.params.id, pacienteId: r.a.pacienteId, status: "PENDENTE", excluidaEm: null } });
  const e = s && escalaPorCodigo(s.escala);
  if (!s || !e) { res.status(404).json({ error: "Esta escala não está mais disponível." }); return; }
  const erros = validarRespostas(e, req.body.respostas);
  if (erros.length) { res.status(400).json({ error: erros[0], erros }); return; }
  const feito = await registrarResposta(s.id, req.body.respostas);
  if (!feito) { res.status(409).json({ error: "Esta escala já foi respondida." }); return; }
  res.status(201).json({ ok: true, cuidado: feito.resultado.alertaRisco ? AVISO_SEGURANCA.intenso : null });
}));

// Formulários e anamneses pedidos pelo profissional (o paciente responde pelo mesmo link).
diarioPublicoRouter.get("/:segredo/formularios/:id", asyncHandler(async (req, res) => {
  const r = await acessoDoLink(req.params.segredo);
  if (!r) { naoEncontrado(res); return; }
  const f = await prisma.formularioPaciente.findFirst({ where: { id: req.params.id, pacienteId: r.a.pacienteId, modo: "LINK", status: "PENDENTE", excluidoEm: null } });
  if (!f) { res.status(404).json({ error: "Este formulário não está mais disponível." }); return; }
  res.json({ id: f.id, nome: f.nome, perguntas: f.perguntas });
}));
diarioPublicoRouter.post("/:segredo/formularios/:id", validateBody(z.object({ respostas: z.unknown() })), asyncHandler(async (req, res) => {
  const r = await acessoDoLink(req.params.segredo);
  if (!r) { naoEncontrado(res); return; }
  const feito = await registrarRespostaFormulario(req.params.id, r.a.pacienteId, req.body.respostas);
  if ("erro" in feito) { res.status(feito.erro === "invalido" ? 400 : 404).json({ error: feito.erro === "invalido" ? feito.erros?.[0] : "Este formulário não está mais disponível.", erros: feito.erro === "invalido" ? feito.erros : undefined }); return; }
  res.status(201).json({ ok: true });
}));

const corpo = z.object({
  ocorridoEm: z.string(), emocao: z.string(), intensidade: z.number().int(),
  contexto: z.string().nullable().optional(), notaContexto: z.string().max(1200).nullable().optional(),
  primeiraAcao: z.string().nullable().optional(), pesos: z.array(z.string()).max(12).optional(), impulso: z.string().nullable().optional(), acaoImpulso: z.string().nullable().optional(), acoesQueAjudaram: z.array(z.string()).max(12).optional(), ajudou: z.string().nullable().optional(), notaCuidado: z.string().max(1200).nullable().optional(),
  fechamento: z.string().nullable().optional(), levarParaSessao: z.boolean().optional(), notaFinal: z.string().max(1200).nullable().optional(),
});

diarioPublicoRouter.post("/:segredo/cartoes", validateBody(corpo), asyncHandler(async (req, res) => {
  const r = await acessoDoLink(req.params.segredo);
  if (!r) { naoEncontrado(res); return; }
  const erros = validarCartao(req.body);
  if (erros.length) { res.status(400).json({ error: erros[0], erros }); return; }
  // freio contra abuso: no máximo 20 cartões por dia por paciente
  const hoje = new Date(Date.now() - 86_400_000);
  if ((await prisma.cartaoDiario.count({ where: { pacienteId: r.a.pacienteId, registradoEm: { gte: hoje } } })) >= 20) { res.status(429).json({ error: "Você já fez muitos registros hoje. Volte amanhã." }); return; }
  const familia = familiaDaEmocao(req.body.emocao)!;
  const t = (s: string | null | undefined) => (s && s.trim() ? s.trim() : null);
  const c = await prisma.cartaoDiario.create({
    data: {
      clinicaId: r.a.clinicaId, pacienteId: r.a.pacienteId, ocorridoEm: new Date(`${req.body.ocorridoEm}T00:00:00.000Z`), emocao: req.body.emocao, familia, intensidade: req.body.intensidade,
      contexto: req.body.contexto ?? null, notaContexto: t(req.body.notaContexto), primeiraAcao: req.body.primeiraAcao ?? null, pesos: req.body.pesos ?? [], impulso: req.body.impulso ?? null, acaoImpulso: req.body.acaoImpulso ?? null, acoesQueAjudaram: req.body.acoesQueAjudaram ?? [], ajudou: req.body.ajudou ?? null, notaCuidado: t(req.body.notaCuidado),
      fechamento: req.body.fechamento ?? null, levarParaSessao: !!req.body.levarParaSessao, notaFinal: t(req.body.notaFinal), versaoCatalogo: VERSAO_CATALOGO,
    },
  });
  const intenso = sofrimentoIntenso(familia, req.body.intensidade);
  res.status(201).json({ id: c.id, intenso, apoio: FAMILIAS.find((f) => f.chave === familia)?.apoio ?? [], aviso: intenso ? AVISO_SEGURANCA.intenso : AVISO_SEGURANCA.curto });
}));
