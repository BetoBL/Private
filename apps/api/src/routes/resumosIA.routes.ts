import type { Request, Response } from "express";
import { Router } from "express";
import { modeloDe } from "../lib/prontuario/modelos";
import { prisma } from "../lib/prisma";
import { resumirCaso, resumirSessao, type SaidaCaso } from "../lib/resumoIA";
import { asyncHandler } from "../lib/validate";
import { EMOCOES } from "../lib/diario/catalogo";

// Resumos por IA do prontuário (rascunhos). Exigem o consentimento do paciente para tecnologias de apoio (Resolução CFP 09/2024).
// Só o profissional responsável (ou o administrador) usa; as anotações PRIVADAS só entram no resumo da sessão do próprio autor.
export const resumosIARouter = Router();

type Usuario = { sub: string; clinicaId: string; papel: string };
const u = (req: Request) => req.profissional as Usuario;

const idadeDe = (d: Date) => { const h = new Date(); let i = h.getUTCFullYear() - d.getUTCFullYear(); if (h.getUTCMonth() < d.getUTCMonth() || (h.getUTCMonth() === d.getUTCMonth() && h.getUTCDate() < d.getUTCDate())) i--; return i >= 0 ? i : null; };
const dia = (d: Date) => d.toISOString().slice(0, 10);

async function pacienteComConsentimento(req: Request, res: Response, pacienteId: string) {
  const me = u(req);
  const p = await prisma.paciente.findFirst({ where: { id: pacienteId, clinicaId: me.clinicaId, ...(me.papel === "ADMIN" ? {} : { profissionalId: me.sub }) }, select: { id: true, nome: true, dataNascimento: true, consentimentoTDIC: true } });
  if (!p) { res.status(404).json({ error: "Paciente não encontrado" }); return null; }
  if (!p.consentimentoTDIC) { res.status(409).json({ error: "Para usar a IA, registre antes o consentimento do paciente para tecnologias de apoio (aba Dados)." }); return null; }
  return p;
}
const semChave = (res: Response) => { res.status(503).json({ error: "A IA não está configurada neste servidor." }); };
const falhaIA = (res: Response, e: unknown) => { console.error("[resumo-ia]", (e as Error).message); res.status(502).json({ error: "Não foi possível gerar o resumo agora. Tente de novo em instantes; nada foi alterado." }); };

// Resumo de uma sessão: lê as anotações privadas do autor e grava o rascunho na evolução (campos vazios e texto).
resumosIARouter.post("/sessao/:evolucaoId", asyncHandler(async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) { semChave(res); return; }
  const me = u(req);
  const ev = await prisma.evolucao.findFirst({ where: { id: req.params.evolucaoId, clinicaId: me.clinicaId, excluidaEm: null, profissionalId: me.sub } });
  if (!ev) { res.status(404).json({ error: "Evolução não encontrada" }); return; }
  if (ev.status === "FINALIZADA") { res.status(409).json({ error: "Reabra a evolução para gerar um novo resumo." }); return; }
  const anotacoes = (ev.anotacoes ?? "").trim();
  if (anotacoes.length < 20) { res.status(400).json({ error: "Escreva as anotações da sessão primeiro (pelo menos algumas linhas)." }); return; }
  const p = await pacienteComConsentimento(req, res, ev.pacienteId);
  if (!p) return;
  const modelo = modeloDe(ev.modelo);
  const camposAtuais = Object.fromEntries(Object.entries((ev.campos ?? {}) as Record<string, string | string[]>).filter(([, v]) => (Array.isArray(v) ? v.length : String(v).trim())));
  const planos = await prisma.itemContinuidade.findMany({ where: { pacienteId: p.id, status: "ANDAMENTO", excluidoEm: null }, select: { texto: true }, take: 30 });
  try {
    const r = await resumirSessao({ modeloRotulo: modelo?.rotulo ?? "Livre", campos: modelo?.campos ?? [], camposAtuais, anotacoes, paciente: { primeiroNome: p.nome.split(" ")[0], idade: idadeDe(p.dataNascimento) }, planosEmAndamento: planos.map((x) => x.texto) });
    const novos = { ...((ev.campos ?? {}) as Record<string, string | string[]>) };
    for (const c of r.campos) {
      const def = modelo?.campos.find((x) => x.chave === c.chave);
      if (!def || !c.texto.trim() || camposAtuais[c.chave] !== undefined) continue; // só chaves do modelo e só campos que estavam vazios
      novos[c.chave] = def.lista ? c.texto.split("\n").map((l) => l.replace(/^[-•\s]+/, "").trim()).filter(Boolean) : c.texto.trim();
    }
    const atualizada = await prisma.evolucao.update({ where: { id: ev.id }, data: { evolucao: r.evolucao.trim(), campos: novos, geradaPorIA: true } });
    res.json({ evolucao: atualizada.evolucao, campos: atualizada.campos, sugestoes: r.sugestoes.slice(0, 4) });
  } catch (e) { falhaIA(res, e); }
}));

const conteudoDe = (j: unknown) => j as SaidaCaso;
resumosIARouter.get("/caso/:pacienteId", asyncHandler(async (req, res) => {
  const me = u(req);
  const p = await prisma.paciente.findFirst({ where: { id: req.params.pacienteId, clinicaId: me.clinicaId, ...(me.papel === "ADMIN" ? {} : { profissionalId: me.sub }) }, select: { id: true } });
  if (!p) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  const r = await prisma.resumoCasoIA.findFirst({ where: { pacienteId: p.id }, orderBy: { geradoEm: "desc" } });
  res.json(r ? { ...conteudoDe(r.conteudo), geradoEm: r.geradoEm, sessoesConsideradas: r.sessoesConsideradas } : null);
}));

// Resumo do caso: usa só o que está finalizado (texto da evolução, sem as anotações privadas), as escalas, o Diário e a continuidade.
resumosIARouter.post("/caso/:pacienteId", asyncHandler(async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) { semChave(res); return; }
  const me = u(req);
  const p = await pacienteComConsentimento(req, res, req.params.pacienteId);
  if (!p) return;
  const sessoes = await prisma.evolucao.findMany({ where: { pacienteId: p.id, clinicaId: me.clinicaId, excluidaEm: null, status: "FINALIZADA" }, orderBy: { dataHora: "desc" }, take: 20, select: { dataHora: true, modelo: true, evolucao: true, campos: true } });
  const escalas = await prisma.solicitacaoEscala.findMany({ where: { pacienteId: p.id, clinicaId: me.clinicaId, excluidaEm: null, status: "CONCLUIDA" }, orderBy: { respondidaEm: "desc" }, take: 12, select: { escala: true, respondidaEm: true, pontuacao: true, alertaRisco: true } });
  const desde = new Date(Date.now() - 60 * 86_400_000);
  const cartoes = await prisma.cartaoDiario.findMany({ where: { pacienteId: p.id, clinicaId: me.clinicaId, ocorridoEm: { gte: desde } }, select: { emocao: true, intensidade: true, familia: true } });
  const plano = await prisma.itemContinuidade.findMany({ where: { pacienteId: p.id, status: "ANDAMENTO", excluidoEm: null }, select: { tipo: true, texto: true }, take: 30 });
  if (!sessoes.length && !escalas.length && !cartoes.length) { res.status(400).json({ error: "Ainda não há sessões finalizadas, escalas ou registros do Diário para resumir." }); return; }

  const contagem = new Map<string, number>();
  for (const c of cartoes) { const nome = EMOCOES.find((e) => e.chave === c.emocao)?.rotulo ?? c.emocao; contagem.set(nome, (contagem.get(nome) ?? 0) + 1); }
  const intensos = cartoes.filter((c) => c.intensidade >= 4 && ["baixa", "distante", "inquieta"].includes(c.familia)).length;
  try {
    const r = await resumirCaso({
      paciente: { primeiroNome: p.nome.split(" ")[0], idade: idadeDe(p.dataNascimento) },
      sessoes: sessoes.reverse().map((s) => ({ data: dia(s.dataHora), modelo: s.modelo, texto: (s.evolucao ?? "").slice(0, 1800) || JSON.stringify(s.campos ?? {}).slice(0, 1800) })),
      escalas: escalas.reverse().map((s) => { const pt = s.pontuacao as { total?: number | null; faixa?: { rotulo: string } | null } | null; return { data: s.respondidaEm ? dia(s.respondidaEm) : "", escala: s.escala, resultado: `${pt?.total ?? "—"}${pt?.faixa ? ` (${pt.faixa.rotulo})` : ""}${s.alertaRisco ? " — resposta crítica marcada" : ""}` }; }),
      diario: cartoes.length ? { dias: 60, registros: cartoes.length, porEmocao: [...contagem].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([emocao, vezes]) => ({ emocao, vezes })), intensos } : null,
      continuidade: plano,
    });
    const salvo = await prisma.resumoCasoIA.create({ data: { clinicaId: me.clinicaId, pacienteId: p.id, profissionalId: me.sub, conteudo: r as object, sessoesConsideradas: sessoes.length } });
    res.status(201).json({ ...r, geradoEm: salvo.geradoEm, sessoesConsideradas: salvo.sessoesConsideradas });
  } catch (e) { falhaIA(res, e); }
}));
