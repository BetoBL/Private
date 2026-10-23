import type { Request } from "express";
import { Router } from "express";
import { z } from "zod";
import { METRICAS, metricaDe } from "../lib/saude/metricas";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

// Saúde do paciente (pacote médico): problemas, medicamentos e métricas. Só o profissional responsável (ou o administrador) acessa.
export const saudeRouter = Router();

type Usuario = { sub: string; clinicaId: string; papel: string };
const u = (req: Request) => req.profissional as Usuario;
async function pacienteDoUsuario(req: Request, pacienteId: string) {
  const me = u(req);
  return prisma.paciente.findFirst({ where: { id: pacienteId, clinicaId: me.clinicaId, ...(me.papel === "ADMIN" ? {} : { profissionalId: me.sub }) }, select: { id: true } });
}

const dataOpc = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional();
const dt = (s: string | null | undefined) => (s ? new Date(`${s}T00:00:00.000Z`) : s === null ? null : undefined);
const dia = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);
const txt = z.string().trim().max(500).nullable().optional();

saudeRouter.get("/metricas", (_req, res) => { res.json(METRICAS); });

saudeRouter.get("/:pacienteId", asyncHandler(async (req, res) => {
  const me = u(req);
  const pacienteId = req.params.pacienteId;
  if (!(await pacienteDoUsuario(req, pacienteId))) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  const onde = { pacienteId, clinicaId: me.clinicaId, excluidaEm: null };
  const [problemas, medicamentos, metricas] = await Promise.all([
    prisma.problemaPaciente.findMany({ where: onde, orderBy: [{ status: "asc" }, { criadoEm: "desc" }] }),
    prisma.medicamentoPaciente.findMany({ where: onde, orderBy: [{ status: "desc" }, { criadoEm: "desc" }] }),
    prisma.metricaPaciente.findMany({ where: onde, orderBy: [{ data: "asc" }, { criadoEm: "asc" }] }),
  ]);
  res.json({
    problemas: problemas.map((p) => ({ id: p.id, descricao: p.descricao, cid: p.cid, status: p.status, inicio: dia(p.inicio), observacao: p.observacao })),
    medicamentos: medicamentos.map((m) => ({ id: m.id, nome: m.nome, dose: m.dose, posologia: m.posologia, motivo: m.motivo, status: m.status, inicio: dia(m.inicio), fim: dia(m.fim), observacao: m.observacao })),
    metricas: metricas.map((m) => ({ id: m.id, tipo: m.tipo, valor: m.valor, valor2: m.valor2, data: dia(m.data), observacao: m.observacao })),
  });
}));

const problemaSchema = z.object({ descricao: z.string().trim().min(2).max(200), cid: z.string().trim().max(20).nullable().optional(), status: z.enum(["ATIVO", "RESOLVIDO"]).optional(), inicio: dataOpc, observacao: txt });
const medicamentoSchema = z.object({ nome: z.string().trim().min(2).max(200), dose: z.string().trim().max(100).nullable().optional(), posologia: txt, motivo: txt, status: z.enum(["EM_USO", "SUSPENSO"]).optional(), inicio: dataOpc, fim: dataOpc, observacao: txt });
const metricaSchema = z.object({ tipo: z.string(), valor: z.number().finite(), valor2: z.number().finite().nullable().optional(), data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), observacao: z.string().trim().max(200).nullable().optional() });

// Os dois cadastros têm as mesmas colunas de controle (id, clinicaId, pacienteId, excluidaEm), então compartilham as rotas.
type Delegate = { create: (a: { data: Record<string, unknown> }) => Promise<{ id: string }>; findFirst: (a: { where: Record<string, unknown> }) => Promise<{ id: string } | null>; update: (a: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown> };
function recurso(caminho: string, modelo: "problemaPaciente" | "medicamentoPaciente") {
  const delegate = () => prisma[modelo] as unknown as Delegate;
  const schema = modelo === "problemaPaciente" ? problemaSchema : medicamentoSchema;
  const camposData = modelo === "problemaPaciente" ? ["inicio"] : ["inicio", "fim"];
  const dados = (b: Record<string, unknown>) => {
    const d: Record<string, unknown> = { ...b };
    for (const c of camposData) if (c in b) d[c] = dt(b[c] as string | null | undefined);
    return d;
  };
  const registro = (req: Request) => delegate().findFirst({ where: { id: req.params.id, pacienteId: req.params.pacienteId, clinicaId: u(req).clinicaId, excluidaEm: null } });

  saudeRouter.post(`/:pacienteId/${caminho}`, validateBody(schema), asyncHandler(async (req, res) => {
    const me = u(req);
    if (!(await pacienteDoUsuario(req, req.params.pacienteId))) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
    const c = await delegate().create({ data: { ...dados(req.body), clinicaId: me.clinicaId, pacienteId: req.params.pacienteId, profissionalId: me.sub } });
    res.status(201).json({ id: c.id });
  }));
  saudeRouter.put(`/:pacienteId/${caminho}/:id`, validateBody(schema.partial()), asyncHandler(async (req, res) => {
    if (!(await pacienteDoUsuario(req, req.params.pacienteId))) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
    const atual = await registro(req);
    if (!atual) { res.status(404).json({ error: "Registro não encontrado" }); return; }
    await delegate().update({ where: { id: atual.id }, data: dados(req.body) });
    res.json({ ok: true });
  }));
  saudeRouter.delete(`/:pacienteId/${caminho}/:id`, asyncHandler(async (req, res) => {
    if (!(await pacienteDoUsuario(req, req.params.pacienteId))) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
    const atual = await registro(req);
    if (!atual) { res.status(404).json({ error: "Registro não encontrado" }); return; }
    await delegate().update({ where: { id: atual.id }, data: { excluidaEm: new Date() } });
    res.json({ ok: true });
  }));
}
recurso("problemas", "problemaPaciente");
recurso("medicamentos", "medicamentoPaciente");

saudeRouter.post("/:pacienteId/metricas", validateBody(metricaSchema), asyncHandler(async (req, res) => {
  const me = u(req);
  if (!(await pacienteDoUsuario(req, req.params.pacienteId))) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  const m = metricaDe(req.body.tipo);
  if (!m) { res.status(400).json({ error: "Métrica desconhecida." }); return; }
  const { valor, valor2 } = req.body as { valor: number; valor2?: number | null };
  if (valor < m.min || valor > m.max) { res.status(400).json({ error: `${m.rotulo}: valor fora do intervalo possível (${m.min} a ${m.max} ${m.unidade}).` }); return; }
  if (m.duplo && (valor2 == null || valor2 < m.min || valor2 > m.max)) { res.status(400).json({ error: `${m.rotulo}: informe os dois valores (máxima e mínima).` }); return; }
  const c = await prisma.metricaPaciente.create({ data: { clinicaId: me.clinicaId, pacienteId: req.params.pacienteId, profissionalId: me.sub, tipo: m.chave, valor, valor2: m.duplo ? valor2 ?? null : null, data: dt(req.body.data)!, observacao: req.body.observacao ?? null } });
  res.status(201).json({ id: c.id });
}));
saudeRouter.delete("/:pacienteId/metricas/:id", asyncHandler(async (req, res) => {
  const me = u(req);
  if (!(await pacienteDoUsuario(req, req.params.pacienteId))) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  const r = await prisma.metricaPaciente.updateMany({ where: { id: req.params.id, pacienteId: req.params.pacienteId, clinicaId: me.clinicaId, excluidaEm: null }, data: { excluidaEm: new Date() } });
  if (!r.count) { res.status(404).json({ error: "Registro não encontrado" }); return; }
  res.json({ ok: true });
}));
