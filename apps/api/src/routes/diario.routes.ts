import { randomBytes } from "node:crypto";
import type { Request } from "express";
import { Router } from "express";
import { z } from "zod";
import { CATALOGO, CONFIG_PADRAO, normalizarConfig } from "../lib/diario/catalogo";
import { resumirCartoes } from "../lib/diario/resumo";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";
import { baseDoSite } from "./salasVirtuais.routes";

// Diário do paciente, lado do PSICÓLOGO: gera e revoga o acesso do paciente e lê os cartões. Só o profissional responsável pelo paciente
// (ou o administrador da clínica) vê os cartões.
export const diarioRouter = Router();

type Usuario = { sub: string; clinicaId: string; papel: string };
const u = (req: Request) => req.profissional as Usuario;

async function pacienteDoUsuario(req: Request, pacienteId: string) {
  const me = u(req);
  return prisma.paciente.findFirst({ where: { id: pacienteId, clinicaId: me.clinicaId, ...(me.papel === "ADMIN" ? {} : { profissionalId: me.sub }) }, select: { id: true, nome: true } });
}
const linkDoDiario = (req: Request, segredo: string) => `${baseDoSite(req)}/diario/${segredo}`;

diarioRouter.get("/catalogo", (_req, res) => { res.json(CATALOGO); });

// Configuração por paciente: etapas opcionais e emoções escondidas (valem para os próximos registros).
diarioRouter.get("/config/:pacienteId", asyncHandler(async (req, res) => {
  if (!(await pacienteDoUsuario(req, req.params.pacienteId))) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  const c = await prisma.configDiario.findUnique({ where: { pacienteId: req.params.pacienteId } });
  res.json(c ? normalizarConfig({ etapas: c.etapas, emocoesOcultas: c.emocoesOcultas }) : CONFIG_PADRAO);
}));
diarioRouter.put("/config/:pacienteId", validateBody(z.object({ etapas: z.object({ pesos: z.boolean(), impulso: z.boolean() }), emocoesOcultas: z.array(z.string()).max(40) })), asyncHandler(async (req, res) => {
  if (!(await pacienteDoUsuario(req, req.params.pacienteId))) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  const cfg = normalizarConfig(req.body);
  const dados = { etapas: cfg.etapas as object, emocoesOcultas: cfg.emocoesOcultas };
  await prisma.configDiario.upsert({ where: { pacienteId: req.params.pacienteId }, create: { pacienteId: req.params.pacienteId, clinicaId: u(req).clinicaId, ...dados }, update: dados });
  res.json(cfg);
}));

// ---- acesso do paciente ----
diarioRouter.get("/acessos/:pacienteId", asyncHandler(async (req, res) => {
  if (!(await pacienteDoUsuario(req, req.params.pacienteId))) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  const a = await prisma.acessoDiario.findFirst({ where: { pacienteId: req.params.pacienteId, revogadoEm: null }, orderBy: { criadoEm: "desc" } });
  res.json(a ? { ativo: true, link: linkDoDiario(req, a.segredo), criadoEm: a.criadoEm, ultimoUsoEm: a.ultimoUsoEm } : { ativo: false });
}));

// gerar um acesso novo revoga o anterior (um link ativo por paciente)
diarioRouter.post("/acessos", validateBody(z.object({ pacienteId: z.string().uuid() })), asyncHandler(async (req, res) => {
  const p = await pacienteDoUsuario(req, req.body.pacienteId);
  if (!p) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  const novo = await prisma.$transaction(async (tx) => {
    await tx.acessoDiario.updateMany({ where: { pacienteId: p.id, revogadoEm: null }, data: { revogadoEm: new Date() } });
    return tx.acessoDiario.create({ data: { clinicaId: u(req).clinicaId, pacienteId: p.id, profissionalId: u(req).sub, segredo: randomBytes(24).toString("base64url") } });
  });
  res.status(201).json({ ativo: true, link: linkDoDiario(req, novo.segredo), criadoEm: novo.criadoEm, ultimoUsoEm: null });
}));

diarioRouter.delete("/acessos/:pacienteId", asyncHandler(async (req, res) => {
  if (!(await pacienteDoUsuario(req, req.params.pacienteId))) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  await prisma.acessoDiario.updateMany({ where: { pacienteId: req.params.pacienteId, revogadoEm: null }, data: { revogadoEm: new Date() } });
  res.status(204).send();
}));

// ---- leitura ----
diarioRouter.get("/pacientes/:pacienteId/cartoes", asyncHandler(async (req, res) => {
  if (!(await pacienteDoUsuario(req, req.params.pacienteId))) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  const dias = Math.min(365, Math.max(7, Number(req.query.dias) || 90));
  const desde = new Date(Date.now() - dias * 86_400_000);
  const cartoes = await prisma.cartaoDiario.findMany({ where: { pacienteId: req.params.pacienteId, ocorridoEm: { gte: desde } }, orderBy: [{ ocorridoEm: "desc" }, { registradoEm: "desc" }], take: 500 });
  res.json({ cartoes, resumo: resumirCartoes(cartoes) });
}));

// o que os pacientes pediram para levar à sessão e ainda não foi conversado (Painel do dia)
diarioRouter.get("/pendentes", asyncHandler(async (req, res) => {
  const me = u(req);
  const itens = await prisma.cartaoDiario.findMany({
    where: { clinicaId: me.clinicaId, levarParaSessao: true, conversadoEm: null, ...(me.papel === "ADMIN" ? {} : { pacienteId: { in: (await prisma.paciente.findMany({ where: { clinicaId: me.clinicaId, profissionalId: me.sub }, select: { id: true } })).map((p) => p.id) } }) },
    orderBy: { ocorridoEm: "desc" }, take: 30,
  });
  const nomes = new Map((await prisma.paciente.findMany({ where: { id: { in: [...new Set(itens.map((i) => i.pacienteId))] } }, select: { id: true, nome: true } })).map((p) => [p.id, p.nome]));
  res.json(itens.map((i) => ({ id: i.id, pacienteId: i.pacienteId, paciente: nomes.get(i.pacienteId) ?? "", ocorridoEm: i.ocorridoEm, emocao: i.emocao, familia: i.familia, intensidade: i.intensidade, fechamento: i.fechamento })));
}));

async function cartaoDoUsuario(req: Request) {
  const c = await prisma.cartaoDiario.findUnique({ where: { id: req.params.id } });
  if (!c || !(await pacienteDoUsuario(req, c.pacienteId))) return null;
  return c;
}
diarioRouter.post("/cartoes/:id/lido", asyncHandler(async (req, res) => {
  const c = await cartaoDoUsuario(req);
  if (!c) { res.status(404).json({ error: "Cartão não encontrado" }); return; }
  await prisma.cartaoDiario.update({ where: { id: c.id }, data: { lidoEm: c.lidoEm ?? new Date() } });
  res.status(204).send();
}));
diarioRouter.post("/cartoes/:id/conversado", validateBody(z.object({ conversado: z.boolean() })), asyncHandler(async (req, res) => {
  const c = await cartaoDoUsuario(req);
  if (!c) { res.status(404).json({ error: "Cartão não encontrado" }); return; }
  await prisma.cartaoDiario.update({ where: { id: c.id }, data: { conversadoEm: req.body.conversado ? new Date() : null, lidoEm: c.lidoEm ?? new Date() } });
  res.status(204).send();
}));
