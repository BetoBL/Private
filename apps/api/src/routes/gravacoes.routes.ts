import express, { Router } from "express";
import { z } from "zod";
import { apagarGravacao, audioDecifrado, encerrarGravacao, ErroGravacao, gravacaoPronta, iniciarGravacao, LIMITE_PARTE_BYTES, receberParte, RETENCAO_DIAS } from "../lib/video/gravacao";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

// Gravações de sessões online (plano completo). Só o profissional responsável (ou o administrador) acessa; tudo é auditado.
export const gravacoesRouter = Router();

const tratar = (fn: Parameters<typeof asyncHandler>[0]) => asyncHandler(async (req, res, next) => {
  try { await fn(req, res, next); } catch (e) {
    if (e instanceof ErroGravacao) { res.status(e.status).json({ error: e.message, codigo: e.codigo }); return; }
    throw e;
  }
});
const usuario = (req: express.Request) => req.profissional as { sub: string; clinicaId: string; papel: string };

const publica = (g: { id: string; sessaoId: string; status: string; partes: number; bytes: number; duracaoSeg: number | null; iniciadaEm: Date; encerradaEm: Date | null; apagarAudioEm: Date | null; audioApagadoEm: Date | null }) =>
  ({ id: g.id, sessaoId: g.sessaoId, status: g.status, partes: g.partes, bytes: g.bytes, duracaoSeg: g.duracaoSeg, iniciadaEm: g.iniciadaEm, encerradaEm: g.encerradaEm, apagarAudioEm: g.apagarAudioEm, audioApagadoEm: g.audioApagadoEm, temAudio: !g.audioApagadoEm && g.partes > 0 });

gravacoesRouter.get("/disponibilidade", (_req, res) => { res.json({ ...gravacaoPronta(), retencaoDias: RETENCAO_DIAS }); });

gravacoesRouter.get("/", tratar(async (req, res) => {
  const u = usuario(req);
  const { sessaoId, pacienteId } = req.query as Record<string, string | undefined>;
  const lista = await prisma.gravacao.findMany({
    where: { clinicaId: u.clinicaId, ...(u.papel === "ADMIN" ? {} : { profissionalId: u.sub }), ...(sessaoId ? { sessaoId } : {}), ...(pacienteId ? { pacienteId } : {}) },
    orderBy: { iniciadaEm: "desc" }, take: 100,
  });
  res.json(lista.map(publica));
}));

gravacoesRouter.post("/iniciar", validateBody(z.object({ salaId: z.string().uuid() })), tratar(async (req, res) => {
  const g = await iniciarGravacao(req.body.salaId, usuario(req), req.ip);
  res.status(201).json(publica(g));
}));

// uma parte do áudio (corpo binário); idempotente: reenviar a mesma parte a substitui
gravacoesRouter.put("/:id/partes/:n", express.raw({ type: "application/octet-stream", limit: LIMITE_PARTE_BYTES }), tratar(async (req, res) => {
  if (!Buffer.isBuffer(req.body)) { res.status(400).json({ error: "Envie a parte do áudio como application/octet-stream." }); return; }
  await receberParte(req.params.id, Number(req.params.n), req.body, usuario(req));
  res.status(204).send();
}));

gravacoesRouter.post("/:id/encerrar", validateBody(z.object({ duracaoSeg: z.number().int().min(0).max(86_400).optional() })), tratar(async (req, res) => {
  res.json(publica(await encerrarGravacao(req.params.id, req.body.duracaoSeg, usuario(req), req.ip)));
}));

gravacoesRouter.get("/:id/audio", tratar(async (req, res) => {
  const { audio, formato } = await audioDecifrado(req.params.id, usuario(req), req.ip);
  res.setHeader("Content-Type", formato);
  res.setHeader("Cache-Control", "no-store");
  res.send(audio);
}));

gravacoesRouter.get("/:id/acessos", tratar(async (req, res) => {
  const u = usuario(req);
  const g = await prisma.gravacao.findFirst({ where: { id: req.params.id, clinicaId: u.clinicaId, ...(u.papel === "ADMIN" ? {} : { profissionalId: u.sub }) }, select: { id: true } });
  if (!g) { res.status(404).json({ error: "Gravação não encontrada." }); return; }
  res.json(await prisma.gravacaoAcesso.findMany({ where: { gravacaoId: g.id }, orderBy: { criadoEm: "asc" }, select: { acao: true, criadoEm: true, profissionalId: true } }));
}));

gravacoesRouter.delete("/:id", tratar(async (req, res) => { await apagarGravacao(req.params.id, usuario(req), req.ip); res.status(204).send(); }));
