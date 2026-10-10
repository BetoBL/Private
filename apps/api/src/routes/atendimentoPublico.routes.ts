import { timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { estadoDoConsentimento, TEXTO_CONSENTIMENTO, VERSAO_TEXTO_CONSENTIMENTO } from "../lib/video/consentimento";
import { revogarGravacoesDaSala } from "../lib/video/gravacao";
import { tokenDaSala, VideoIndisponivel } from "../lib/video/livekit";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

// Entrada do PACIENTE na videochamada: sem login, protegida por um segredo de 32 bytes no próprio link.
// Só expõe o mínimo (nome da clínica, do profissional e horário); nunca dados clínicos.
export const atendimentoPublicoRouter = Router();

// limite simples por IP (60 pedidos por minuto): o segredo do link já impede adivinhação, isto só freia abuso
const janela = new Map<string, { n: number; ate: number }>();
atendimentoPublicoRouter.use((req, res, next) => {
  const ip = req.ip ?? "?", agora = Date.now(), j = janela.get(ip);
  if (!j || j.ate < agora) janela.set(ip, { n: 1, ate: agora + 60_000 });
  else if (++j.n > 60) { res.status(429).json({ error: "Muitas tentativas. Aguarde um minuto." }); return; }
  next();
});

const iguais = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

async function salaDoLink(codigo: string, segredo: string) {
  const sala = await prisma.salaVirtual.findUnique({ where: { codigoSala: codigo }, include: { sessao: { include: { paciente: { select: { nome: true, clinicaId: true, dataNascimento: true } }, profissional: { select: { nome: true } } } } } });
  if (!sala || sala.provedor !== "LIVEKIT" || !sala.segredoPaciente || !iguais(sala.segredoPaciente, segredo)) return null;
  const clinica = await prisma.clinica.findUnique({ where: { id: sala.sessao.paciente.clinicaId }, select: { nomeFantasia: true, razaoSocial: true, planoVideo: true } });
  return { sala, clinica };
}

const naoEncontrada = (res: { status: (c: number) => { json: (b: unknown) => void } }) => res.status(404).json({ error: "Link de atendimento inválido ou expirado. Peça um novo link ao profissional." });

atendimentoPublicoRouter.get("/:codigo/:segredo", asyncHandler(async (req, res) => {
  const r = await salaDoLink(req.params.codigo, req.params.segredo);
  if (!r) { naoEncontrada(res); return; }
  const { sala, clinica } = r;
  const completo = clinica?.planoVideo === "COMPLETO";
  const consentimentos = completo ? await prisma.consentimentoGravacao.findMany({ where: { salaId: sala.id } }) : [];
  res.json({
    clinica: clinica?.nomeFantasia || clinica?.razaoSocial || "Clínica", profissional: sala.sessao.profissional.nome, paciente: sala.sessao.paciente.nome.split(" ")[0],
    inicioAgendado: sala.inicioAgendado, encerrada: sala.statusSala === "encerrada",
    gravacaoDisponivel: completo, consentimento: completo ? estadoDoConsentimento(consentimentos) : null,
    texto: completo ? { ...TEXTO_CONSENTIMENTO, versao: VERSAO_TEXTO_CONSENTIMENTO } : null,
  });
}));

// Resposta do consentimento. Cada resposta vira um registro; a mais recente de cada tipo é a que vale.
atendimentoPublicoRouter.post("/:codigo/:segredo/consentimento", validateBody(z.object({
  aceitaGravacao: z.boolean(), aceitaIa: z.boolean(),
  declaradoPor: z.enum(["PACIENTE", "RESPONSAVEL"]), nomeDeclarante: z.string().trim().min(3, "Informe o nome de quem está respondendo").max(200),
})), asyncHandler(async (req, res) => {
  const r = await salaDoLink(req.params.codigo, req.params.segredo);
  if (!r) { naoEncontrada(res); return; }
  if (r.clinica?.planoVideo !== "COMPLETO") { res.status(409).json({ error: "Esta clínica não usa gravação." }); return; }
  if (r.sala.statusSala === "encerrada") { res.status(409).json({ error: "Esta sala já foi encerrada." }); return; }
  const base = { salaId: r.sala.id, sessaoId: r.sala.sessaoId, declaradoPor: req.body.declaradoPor, nomeDeclarante: req.body.nomeDeclarante, versaoTexto: VERSAO_TEXTO_CONSENTIMENTO, ip: req.ip ?? null, userAgent: (req.headers["user-agent"] ?? "").slice(0, 300) || null };
  // a IA só pode ser autorizada junto com a gravação
  await prisma.consentimentoGravacao.createMany({ data: [{ ...base, tipo: "GRAVACAO", concedido: req.body.aceitaGravacao }, { ...base, tipo: "TRANSCRICAO_IA", concedido: req.body.aceitaGravacao && req.body.aceitaIa }] });
  res.json(estadoDoConsentimento(await prisma.consentimentoGravacao.findMany({ where: { salaId: r.sala.id } })));
}));

// Revogar: não apaga nada, marca os consentimentos concedidos como revogados e registra a recusa
atendimentoPublicoRouter.post("/:codigo/:segredo/revogar", asyncHandler(async (req, res) => {
  const r = await salaDoLink(req.params.codigo, req.params.segredo);
  if (!r) { naoEncontrada(res); return; }
  await prisma.consentimentoGravacao.updateMany({ where: { salaId: r.sala.id, concedido: true, revogadoEm: null }, data: { revogadoEm: new Date() } });
  await revogarGravacoesDaSala(r.sala.id, req.ip); // revogar para a gravação em andamento e apaga o áudio já guardado
  res.json(estadoDoConsentimento(await prisma.consentimentoGravacao.findMany({ where: { salaId: r.sala.id } })));
}));

// Estado ao vivo para a página do paciente: se está sendo gravado e o que ele autorizou
atendimentoPublicoRouter.get("/:codigo/:segredo/estado", asyncHandler(async (req, res) => {
  const r = await salaDoLink(req.params.codigo, req.params.segredo);
  if (!r) { naoEncontrada(res); return; }
  const [consentimentos, ativa] = await Promise.all([prisma.consentimentoGravacao.findMany({ where: { salaId: r.sala.id } }), prisma.gravacao.findFirst({ where: { salaId: r.sala.id, status: "GRAVANDO" }, select: { id: true } })]);
  res.json({ consentimento: estadoDoConsentimento(consentimentos), gravando: !!ativa, encerrada: r.sala.statusSala === "encerrada" });
}));

// Entrar: devolve o token da chamada. O paciente pode entrar antes do profissional (fica aguardando na sala).
atendimentoPublicoRouter.post("/:codigo/:segredo/entrar", asyncHandler(async (req, res) => {
  const r = await salaDoLink(req.params.codigo, req.params.segredo);
  if (!r) { naoEncontrada(res); return; }
  if (r.sala.statusSala === "encerrada") { res.status(409).json({ error: "Este atendimento já foi encerrado." }); return; }
  try {
    const { token, url } = await tokenDaSala({ sala: r.sala.codigoSala, identidade: `paciente-${r.sala.id}`, nome: r.sala.sessao.paciente.nome.split(" ")[0] });
    await prisma.salaVirtual.update({ where: { id: r.sala.id }, data: { pacientePresente: true } });
    res.json({ token, url });
  } catch (e) {
    if (e instanceof VideoIndisponivel) { res.status(503).json({ error: "A videochamada está indisponível no momento. Avise o profissional." }); return; }
    throw e;
  }
}));
