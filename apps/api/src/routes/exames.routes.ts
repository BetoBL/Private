import type { Request } from "express";
import { Router } from "express";
import { z } from "zod";
import { buscarExames, exameDe, GRUPOS_EXAME, KITS } from "../lib/exames/catalogo";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

// Exames e pedidos (pacote médico): catálogo da TUSS, modelos de pedido gravados pelo médico e pedidos feitos ao paciente.
export const examesRouter = Router();

type Usuario = { sub: string; clinicaId: string; papel: string };
const u = (req: Request) => req.profissional as Usuario;
async function pacienteDoUsuario(req: Request, pacienteId: string) {
  const me = u(req);
  return prisma.paciente.findFirst({ where: { id: pacienteId, clinicaId: me.clinicaId, ...(me.papel === "ADMIN" ? {} : { profissionalId: me.sub }) }, select: { id: true } });
}

export const TIPOS_PEDIDO = ["PEDIDO_EXAMES", "PEDIDO_MEDICO", "INDICACAO_MEDICACAO"] as const;
const itemSchema = z.object({ codigo: z.string().max(20).nullable().optional(), nome: z.string().trim().min(2).max(300), detalhe: z.string().trim().max(300).nullable().optional() });
const itensSchema = z.array(itemSchema).max(60);

// ---- catálogo ----
examesRouter.get("/catalogo", (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const grupo = typeof req.query.grupo === "string" && req.query.grupo ? req.query.grupo : undefined;
  if (q.trim().length < 2 && !grupo) { res.json([]); return; }
  res.json(buscarExames(q, { grupo, limite: 40 }));
});
examesRouter.get("/grupos", (_req, res) => { res.json(GRUPOS_EXAME); });

// kits do sistema, com os exames já resolvidos; `recomendado` quando serve à especialidade do usuário
examesRouter.get("/kits", asyncHandler(async (req, res) => {
  const p = await prisma.profissional.findUnique({ where: { id: u(req).sub }, select: { especialidadeMedica: true } });
  res.json(KITS.map((k) => ({
    chave: k.chave, nome: k.nome, especialidades: k.especialidades, recomendado: !!p?.especialidadeMedica && k.especialidades.includes(p.especialidadeMedica),
    itens: k.itens.map((i) => ({ codigo: i.codigo, nome: exameDe(i.codigo)?.nome ?? i.codigo, detalhe: i.detalhe ?? null })),
  })));
}));

// ---- modelos gravados ----
const modeloSchema = z.object({ nome: z.string().trim().min(2).max(120), tipo: z.enum(TIPOS_PEDIDO), itens: itensSchema.default([]), texto: z.string().max(4000).nullable().optional(), compartilhado: z.boolean().optional() });

examesRouter.get("/modelos", asyncHandler(async (req, res) => {
  const me = u(req);
  const tipo = typeof req.query.tipo === "string" ? req.query.tipo : undefined;
  const lista = await prisma.modeloPedido.findMany({
    where: { clinicaId: me.clinicaId, excluidaEm: null, ...(tipo ? { tipo } : {}), OR: [{ profissionalId: me.sub }, { compartilhado: true }] },
    orderBy: { nome: "asc" },
  });
  res.json(lista.map((m) => ({ id: m.id, nome: m.nome, tipo: m.tipo, itens: m.itens, texto: m.texto, compartilhado: m.compartilhado, meu: m.profissionalId === me.sub })));
}));
examesRouter.post("/modelos", validateBody(modeloSchema), asyncHandler(async (req, res) => {
  const me = u(req);
  const m = await prisma.modeloPedido.create({ data: { clinicaId: me.clinicaId, profissionalId: me.sub, nome: req.body.nome, tipo: req.body.tipo, itens: req.body.itens, texto: req.body.texto ?? null, compartilhado: !!req.body.compartilhado } });
  res.status(201).json({ id: m.id });
}));
examesRouter.put("/modelos/:id", validateBody(modeloSchema.partial()), asyncHandler(async (req, res) => {
  const me = u(req);
  const r = await prisma.modeloPedido.updateMany({ where: { id: req.params.id, clinicaId: me.clinicaId, profissionalId: me.sub, excluidaEm: null }, data: req.body });
  if (!r.count) { res.status(404).json({ error: "Modelo não encontrado (só o autor edita)." }); return; }
  res.json({ ok: true });
}));
examesRouter.delete("/modelos/:id", asyncHandler(async (req, res) => {
  const me = u(req);
  const r = await prisma.modeloPedido.updateMany({ where: { id: req.params.id, clinicaId: me.clinicaId, profissionalId: me.sub, excluidaEm: null }, data: { excluidaEm: new Date() } });
  if (!r.count) { res.status(404).json({ error: "Modelo não encontrado (só o autor apaga)." }); return; }
  res.json({ ok: true });
}));

// ---- pedidos feitos ao paciente ----
const pedidoSchema = z.object({ tipo: z.enum(TIPOS_PEDIDO), itens: itensSchema.default([]), texto: z.string().max(4000).nullable().optional(), indicacao: z.string().trim().max(500).nullable().optional() })
  .refine((p) => p.itens.length > 0 || !!p.texto?.trim(), { message: "Inclua ao menos um item ou escreva o texto do pedido." });

examesRouter.get("/pedidos/:pacienteId", asyncHandler(async (req, res) => {
  const me = u(req);
  if (!(await pacienteDoUsuario(req, req.params.pacienteId))) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  const lista = await prisma.pedidoPaciente.findMany({ where: { pacienteId: req.params.pacienteId, clinicaId: me.clinicaId, excluidaEm: null }, orderBy: { criadoEm: "desc" } });
  res.json(lista.map((p) => ({ id: p.id, tipo: p.tipo, itens: p.itens, texto: p.texto, indicacao: p.indicacao, criadoEm: p.criadoEm })));
}));
examesRouter.post("/pedidos/:pacienteId", validateBody(pedidoSchema), asyncHandler(async (req, res) => {
  const me = u(req);
  if (!(await pacienteDoUsuario(req, req.params.pacienteId))) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  const p = await prisma.pedidoPaciente.create({ data: { clinicaId: me.clinicaId, pacienteId: req.params.pacienteId, profissionalId: me.sub, tipo: req.body.tipo, itens: req.body.itens, texto: req.body.texto ?? null, indicacao: req.body.indicacao ?? null } });
  res.status(201).json({ id: p.id });
}));
examesRouter.delete("/pedidos/:pacienteId/:id", asyncHandler(async (req, res) => {
  const me = u(req);
  if (!(await pacienteDoUsuario(req, req.params.pacienteId))) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  const r = await prisma.pedidoPaciente.updateMany({ where: { id: req.params.id, pacienteId: req.params.pacienteId, clinicaId: me.clinicaId, excluidaEm: null }, data: { excluidaEm: new Date() } });
  if (!r.count) { res.status(404).json({ error: "Pedido não encontrado" }); return; }
  res.json({ ok: true });
}));
