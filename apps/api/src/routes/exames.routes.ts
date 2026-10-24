import type { Request } from "express";
import { Router } from "express";
import { z } from "zod";
import { buscarExames, exameDe, GRUPOS_EXAME, KITS } from "../lib/exames/catalogo";
import { extrairExame, metricaDoResultado, nomeConfere } from "../lib/exames/extrair";
import { metricaDe } from "../lib/saude/metricas";
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

// ---- importação de exames (PDF ou foto) por IA, sempre com conferência do médico ----
const TIPOS_ARQUIVO = ["application/pdf", "image/png", "image/jpeg", "image/webp"] as const;
const importarSchema = z.object({ arquivo: z.string().min(100).max(14_000_000), tipoMime: z.enum(TIPOS_ARQUIVO) });

examesRouter.post("/importar/:pacienteId", validateBody(importarSchema), asyncHandler(async (req, res) => {
  const me = u(req);
  const p = await prisma.paciente.findFirst({ where: { id: req.params.pacienteId, clinicaId: me.clinicaId, ...(me.papel === "ADMIN" ? {} : { profissionalId: me.sub }) }, select: { nome: true, consentimentoTDIC: true } });
  if (!p) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  if (!p.consentimentoTDIC) { res.status(409).json({ error: "Para ler o exame com IA, registre antes o consentimento do paciente para tecnologias de apoio (aba Dados)." }); return; }
  let r;
  try { r = await extrairExame(req.body.arquivo, req.body.tipoMime); } catch (e) {
    console.error("[exames/importar]", e instanceof Error ? e.message : e);
    res.status(502).json({ error: "Não foi possível ler este arquivo agora. Tente de novo ou digite os resultados." }); return;
  }
  res.json({ ...r, nomeConfere: nomeConfere(p.nome, r.nomeNoDocumento) });
}));

const resultadoSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  laboratorio: z.string().trim().max(200).nullable().optional(),
  origem: z.enum(["IA", "MANUAL"]).default("IA"),
  itens: z.array(z.object({
    nome: z.string().trim().min(2).max(200), tipo: z.enum(["NUMERICO", "LAUDO"]), valor: z.number().finite().nullable().optional(), valorTexto: z.string().max(4000).nullable().optional(),
    unidade: z.string().trim().max(30).nullable().optional(), referencia: z.string().trim().max(200).nullable().optional(), fora: z.boolean().nullable().optional(),
  })).min(1).max(150),
});

examesRouter.get("/resultados/:pacienteId", asyncHandler(async (req, res) => {
  const me = u(req);
  if (!(await pacienteDoUsuario(req, req.params.pacienteId))) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  const lista = await prisma.resultadoExame.findMany({ where: { pacienteId: req.params.pacienteId, clinicaId: me.clinicaId, excluidaEm: null }, orderBy: [{ data: "asc" }, { criadoEm: "asc" }] });
  res.json(lista.map((r) => ({ id: r.id, data: r.data.toISOString().slice(0, 10), laboratorio: r.laboratorio, nome: r.nome, tipo: r.tipo, valor: r.valor, valorTexto: r.valorTexto, unidade: r.unidade, referencia: r.referencia, fora: r.fora })));
}));

examesRouter.post("/resultados/:pacienteId", validateBody(resultadoSchema), asyncHandler(async (req, res) => {
  const me = u(req);
  if (!(await pacienteDoUsuario(req, req.params.pacienteId))) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  const data = new Date(`${req.body.data}T00:00:00.000Z`);
  if (data.getTime() > Date.now() + 86_400_000) { res.status(400).json({ error: "A data do exame não pode estar no futuro." }); return; }
  type Item = z.infer<typeof resultadoSchema>["itens"][number];
  const comValor = (req.body.itens as Item[]).filter((i) => (i.tipo === "NUMERICO" ? i.valor != null || !!i.valorTexto?.trim() : !!i.valorTexto?.trim()));
  if (!comValor.length) { res.status(400).json({ error: "Nenhum resultado com valor para salvar." }); return; }
  // importar o mesmo exame duas vezes não repete os resultados (mesmo exame, mesma data e mesmo valor)
  const jaSalvos = await prisma.resultadoExame.findMany({ where: { pacienteId: req.params.pacienteId, clinicaId: me.clinicaId, data, excluidaEm: null }, select: { nome: true, valor: true, valorTexto: true } });
  const chave = (n: string, v: number | null | undefined, t: string | null | undefined) => `${n.toLowerCase()}|${v ?? ""}|${(t ?? "").trim()}`;
  const existentes = new Set(jaSalvos.map((r) => chave(r.nome, r.valor, r.valorTexto)));
  const itens = comValor.filter((i) => !existentes.has(chave(i.nome, i.valor, i.valorTexto)));
  if (!itens.length) { res.status(200).json({ salvos: 0, metricas: 0 }); return; }
  let metricas = 0;
  await prisma.$transaction(async (tx) => {
    await tx.resultadoExame.createMany({ data: itens.map((i) => ({ clinicaId: me.clinicaId, pacienteId: req.params.pacienteId, profissionalId: me.sub, data, laboratorio: req.body.laboratorio ?? null, nome: i.nome, tipo: i.tipo, valor: i.valor ?? null, valorTexto: i.valorTexto ?? null, unidade: i.unidade ?? null, referencia: i.referencia ?? null, fora: i.fora ?? null, origem: req.body.origem })) });
    // o que já tem gráfico na aba Saúde entra também como medida, sem repetir a mesma medida no mesmo dia
    for (const i of itens) {
      const chave = i.tipo === "NUMERICO" && i.valor != null ? metricaDoResultado(i.nome, i.unidade ?? null) : null;
      const m = chave ? metricaDe(chave) : undefined;
      if (!chave || !m || i.valor == null || i.valor < m.min || i.valor > m.max) continue;
      const ja = await tx.metricaPaciente.findFirst({ where: { pacienteId: req.params.pacienteId, tipo: chave, data, excluidaEm: null } });
      if (ja) continue;
      await tx.metricaPaciente.create({ data: { clinicaId: me.clinicaId, pacienteId: req.params.pacienteId, profissionalId: me.sub, tipo: chave, valor: i.valor, data, observacao: "Do exame importado" } });
      metricas++;
    }
  });
  res.status(201).json({ salvos: itens.length, metricas });
}));

examesRouter.delete("/resultados/:pacienteId/:id", asyncHandler(async (req, res) => {
  const me = u(req);
  if (!(await pacienteDoUsuario(req, req.params.pacienteId))) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  const r = await prisma.resultadoExame.updateMany({ where: { id: req.params.id, pacienteId: req.params.pacienteId, clinicaId: me.clinicaId, excluidaEm: null }, data: { excluidaEm: new Date() } });
  if (!r.count) { res.status(404).json({ error: "Resultado não encontrado" }); return; }
  res.json({ ok: true });
}));
