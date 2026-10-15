import { randomUUID } from "node:crypto";
import type { Request } from "express";
import { Router } from "express";
import { z } from "zod";
import { ESCALAS, escalaPorCodigo } from "../lib/escalas/definicoes";
import { pontuar, type Resultado } from "../lib/escalas/pontuar";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

// Escalas de triagem, lado do PROFISSIONAL: escolher a escala, pedir ao paciente (prazo e recorrência) e ler os resultados.
// O paciente responde pelo link do Diário (ver diarioPublico.routes). Só o profissional responsável (ou o administrador) vê pontuação.
export const escalasRouter = Router();

type Usuario = { sub: string; clinicaId: string; papel: string };
const u = (req: Request) => req.profissional as Usuario;
async function pacienteDoUsuario(req: Request, pacienteId: string) {
  const me = u(req);
  return prisma.paciente.findFirst({ where: { id: pacienteId, clinicaId: me.clinicaId, ...(me.papel === "ADMIN" ? {} : { profissionalId: me.sub }) }, select: { id: true, nome: true } });
}

export const FREQUENCIAS: Record<string, number> = { UNICA: 0, SEMANAL: 7, QUINZENAL: 14, MENSAL: 30 };

// metadados (sem os itens) para a biblioteca
escalasRouter.get("/catalogo", (_req, res) => {
  res.json(ESCALAS.map((e) => ({ codigo: e.codigo, nome: e.nome, sigla: e.sigla, construto: e.construto, uso: e.uso, tempo: e.tempo, fonte: e.fonte, itens: e.itens.length, frequenciaSugerida: e.frequenciaSugerida, notaClinica: "Triagem, não diagnóstico", graficoMax: e.maxTotal ?? 0, pontosDeCorte: e.pontosDeCorte ?? [], porSubescala: (e.subescalas?.length ?? 0) > 0 })));
});
// a escala inteira (para o profissional conferir as perguntas antes de pedir)
escalasRouter.get("/catalogo/:codigo", (req, res) => {
  const e = escalaPorCodigo(req.params.codigo);
  if (!e) { res.status(404).json({ error: "Escala não encontrada" }); return; }
  res.json(e);
});

const dia = (d: Date) => d.toISOString().slice(0, 10);

escalasRouter.get("/paciente/:pacienteId", asyncHandler(async (req, res) => {
  if (!(await pacienteDoUsuario(req, req.params.pacienteId))) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  const lista = await prisma.solicitacaoEscala.findMany({ where: { pacienteId: req.params.pacienteId, clinicaId: u(req).clinicaId, excluidaEm: null }, orderBy: [{ prazo: "desc" }, { criadoEm: "desc" }], take: 300 });
  res.json(lista.map((s) => ({ id: s.id, escala: s.escala, prazo: dia(s.prazo), frequencia: s.frequencia, status: s.status, respondidaEm: s.respondidaEm, alertaRisco: s.alertaRisco, pontuacao: s.pontuacao as Resultado | null, criadoEm: s.criadoEm })));
}));

const solicitarSchema = z.object({ pacienteId: z.string().uuid(), escala: z.string(), prazo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), frequencia: z.enum(["UNICA", "SEMANAL", "QUINZENAL", "MENSAL"]).default("UNICA") });
escalasRouter.post("/", validateBody(solicitarSchema), asyncHandler(async (req, res) => {
  const me = u(req);
  if (!(await pacienteDoUsuario(req, req.body.pacienteId))) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  if (!escalaPorCodigo(req.body.escala)) { res.status(400).json({ error: "Escala desconhecida." }); return; }
  const hoje = dia(new Date());
  const prazo = req.body.prazo ?? hoje;
  if (prazo < hoje) { res.status(400).json({ error: "O prazo não pode ser no passado." }); return; }
  const s = await prisma.solicitacaoEscala.create({ data: { clinicaId: me.clinicaId, pacienteId: req.body.pacienteId, profissionalId: me.sub, escala: req.body.escala, prazo: new Date(`${prazo}T00:00:00.000Z`), frequencia: req.body.frequencia, serieId: req.body.frequencia === "UNICA" ? null : randomUUID() } });
  res.status(201).json({ id: s.id, escala: s.escala, prazo, frequencia: s.frequencia, status: s.status });
}));

// o resultado completo: respostas item a item mais a pontuação
escalasRouter.get("/:id", asyncHandler(async (req, res) => {
  const me = u(req);
  const s = await prisma.solicitacaoEscala.findFirst({ where: { id: req.params.id, clinicaId: me.clinicaId, excluidaEm: null, ...(me.papel === "ADMIN" ? {} : { profissionalId: me.sub }) } });
  if (!s) { res.status(404).json({ error: "Solicitação não encontrada" }); return; }
  const e = escalaPorCodigo(s.escala);
  res.json({ id: s.id, escala: e, status: s.status, prazo: dia(s.prazo), respondidaEm: s.respondidaEm, respostas: s.respostas, pontuacao: s.pontuacao as Resultado | null, alertaRisco: s.alertaRisco });
}));

// apagar = esconder (recuperável pelo suporte); uma série recorrente para de gerar novas
escalasRouter.delete("/:id", asyncHandler(async (req, res) => {
  const me = u(req);
  const s = await prisma.solicitacaoEscala.findFirst({ where: { id: req.params.id, clinicaId: me.clinicaId, excluidaEm: null, ...(me.papel === "ADMIN" ? {} : { profissionalId: me.sub }) } });
  if (!s) { res.status(404).json({ error: "Solicitação não encontrada" }); return; }
  await prisma.solicitacaoEscala.update({ where: { id: s.id }, data: { excluidaEm: new Date(), ...(s.serieId ? { frequencia: "UNICA" } : {}) } });
  if (s.serieId) await prisma.solicitacaoEscala.updateMany({ where: { serieId: s.serieId, status: "PENDENTE", excluidaEm: null }, data: { frequencia: "UNICA" } });
  res.status(204).end();
}));

// usado pela rota pública quando o paciente responde
export async function registrarResposta(solicitacaoId: string, respostas: Record<string, number>) {
  const s = await prisma.solicitacaoEscala.findUnique({ where: { id: solicitacaoId } });
  if (!s || s.status !== "PENDENTE" || s.excluidaEm) return null;
  const e = escalaPorCodigo(s.escala)!;
  const r = pontuar(e, respostas);
  const feita = await prisma.solicitacaoEscala.update({ where: { id: s.id }, data: { status: "CONCLUIDA", respostas, pontuacao: r as object, alertaRisco: r.alertaRisco, respondidaEm: new Date() } });
  const passo = FREQUENCIAS[s.frequencia] ?? 0;
  if (passo > 0 && s.serieId) {
    const proximo = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() + passo));
    await prisma.solicitacaoEscala.create({ data: { clinicaId: s.clinicaId, pacienteId: s.pacienteId, profissionalId: s.profissionalId, escala: s.escala, prazo: proximo, frequencia: s.frequencia, serieId: s.serieId } });
  }
  return { solicitacao: feita, resultado: r };
}
