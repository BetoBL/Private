import type { Request } from "express";
import { Router } from "express";
import { z } from "zod";
import { MODELOS_SISTEMA, modeloDoSistema, validarPerguntas, validarRespostasFormulario, type Pergunta } from "../lib/formularios/modelos";
import { profissaoDe } from "../lib/prontuario/modelos";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

// Formulários e anamneses: modelos do sistema + próprios, pedido ao paciente (link) ou preenchimento na sessão.
// Só o profissional responsável (ou o administrador) lê as respostas; modelos próprios são do autor.
export const formulariosRouter = Router();

type Usuario = { sub: string; clinicaId: string; papel: string };
const u = (req: Request) => req.profissional as Usuario;
async function pacienteDoUsuario(req: Request, pacienteId: string) {
  const me = u(req);
  return prisma.paciente.findFirst({ where: { id: pacienteId, clinicaId: me.clinicaId, ...(me.papel === "ADMIN" ? {} : { profissionalId: me.sub }) }, select: { id: true } });
}
const meuModelo = (req: Request, id: string) => prisma.modeloFormulario.findFirst({ where: { id, clinicaId: u(req).clinicaId, profissionalId: u(req).sub, arquivadoEm: null } });

// Biblioteca: modelos do sistema (os da profissão primeiro) e os próprios.
formulariosRouter.get("/modelos", asyncHandler(async (req, res) => {
  const prof = await prisma.profissional.findUnique({ where: { id: u(req).sub }, select: { categoria: true } });
  const cat = profissaoDe(prof?.categoria).chave;
  const proprios = await prisma.modeloFormulario.findMany({ where: { clinicaId: u(req).clinicaId, profissionalId: u(req).sub, arquivadoEm: null }, orderBy: { atualizadoEm: "desc" } });
  const sistema = MODELOS_SISTEMA.map((m) => ({ origem: "SISTEMA" as const, ref: `sistema:${m.chave}`, nome: m.nome, descricao: m.descricao, tipo: m.tipo, perguntas: m.perguntas, recomendado: m.paraQuem.includes(cat), especifico: m.paraQuem.includes(cat) && m.paraQuem.length < 8 })).sort((a, b) => Number(b.especifico) * 2 + Number(b.recomendado) - (Number(a.especifico) * 2 + Number(a.recomendado))).map(({ especifico: _e, ...resto }) => resto);
  res.json([...sistema, ...proprios.map((m) => ({ origem: "PROPRIO" as const, ref: m.id, nome: m.nome, descricao: m.descricao ?? "", tipo: m.tipo, perguntas: m.perguntas as unknown as Pergunta[], recomendado: false }))]);
}));

const modeloSchema = z.object({ nome: z.string().trim().min(1, "Dê um nome ao modelo.").max(120), descricao: z.string().trim().max(400).optional(), tipo: z.enum(["ANAMNESE", "FORMULARIO"]).default("FORMULARIO"), perguntas: z.unknown() });
formulariosRouter.post("/modelos", validateBody(modeloSchema), asyncHandler(async (req, res) => {
  const v = validarPerguntas(req.body.perguntas);
  if (v.erros.length) { res.status(400).json({ error: v.erros[0], erros: v.erros }); return; }
  const m = await prisma.modeloFormulario.create({ data: { clinicaId: u(req).clinicaId, profissionalId: u(req).sub, nome: req.body.nome, descricao: req.body.descricao || null, tipo: req.body.tipo, perguntas: v.perguntas as unknown as object } });
  res.status(201).json({ ref: m.id });
}));
formulariosRouter.put("/modelos/:id", validateBody(modeloSchema), asyncHandler(async (req, res) => {
  const m = await meuModelo(req, req.params.id);
  if (!m) { res.status(404).json({ error: "Modelo não encontrado" }); return; }
  const v = validarPerguntas(req.body.perguntas);
  if (v.erros.length) { res.status(400).json({ error: v.erros[0], erros: v.erros }); return; }
  await prisma.modeloFormulario.update({ where: { id: m.id }, data: { nome: req.body.nome, descricao: req.body.descricao || null, tipo: req.body.tipo, perguntas: v.perguntas as unknown as object } });
  res.json({ ref: m.id });
}));
formulariosRouter.delete("/modelos/:id", asyncHandler(async (req, res) => {
  const m = await meuModelo(req, req.params.id);
  if (!m) { res.status(404).json({ error: "Modelo não encontrado" }); return; }
  await prisma.modeloFormulario.update({ where: { id: m.id }, data: { arquivadoEm: new Date() } });
  res.status(204).end();
}));
// copiar um modelo (do sistema ou próprio) para editar à vontade
formulariosRouter.post("/modelos/copiar", validateBody(z.object({ ref: z.string(), nome: z.string().trim().max(120).optional() })), asyncHandler(async (req, res) => {
  let nome: string, descricao: string | null, tipo: string, perguntas: unknown;
  if (req.body.ref.startsWith("sistema:")) {
    const s = modeloDoSistema(req.body.ref.slice(8));
    if (!s) { res.status(404).json({ error: "Modelo não encontrado" }); return; }
    ({ nome, descricao, tipo, perguntas } = { nome: s.nome, descricao: s.descricao, tipo: s.tipo, perguntas: s.perguntas });
  } else {
    const m = await meuModelo(req, req.body.ref);
    if (!m) { res.status(404).json({ error: "Modelo não encontrado" }); return; }
    ({ nome, descricao, tipo, perguntas } = { nome: m.nome, descricao: m.descricao, tipo: m.tipo, perguntas: m.perguntas });
  }
  const c = await prisma.modeloFormulario.create({ data: { clinicaId: u(req).clinicaId, profissionalId: u(req).sub, nome: req.body.nome || `${nome} (cópia)`, descricao, tipo, perguntas: perguntas as object, copiadoDe: req.body.ref } });
  res.status(201).json({ ref: c.id });
}));

async function resolverModelo(req: Request, ref: string) {
  if (ref.startsWith("sistema:")) { const s = modeloDoSistema(ref.slice(8)); return s ? { nome: s.nome, tipo: s.tipo, perguntas: s.perguntas } : null; }
  const m = await meuModelo(req, ref);
  return m ? { nome: m.nome, tipo: m.tipo, perguntas: m.perguntas as unknown as Pergunta[] } : null;
}

formulariosRouter.get("/paciente/:pacienteId", asyncHandler(async (req, res) => {
  if (!(await pacienteDoUsuario(req, req.params.pacienteId))) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  const lista = await prisma.formularioPaciente.findMany({ where: { pacienteId: req.params.pacienteId, clinicaId: u(req).clinicaId, excluidoEm: null }, orderBy: { criadoEm: "desc" }, take: 200, select: { id: true, nome: true, tipo: true, modo: true, status: true, respondidoPor: true, respondidoEm: true, criadoEm: true } });
  res.json(lista);
}));

formulariosRouter.post("/solicitar", validateBody(z.object({ pacienteId: z.string().uuid(), ref: z.string(), modo: z.enum(["LINK", "AQUI"]) })), asyncHandler(async (req, res) => {
  const me = u(req);
  if (!(await pacienteDoUsuario(req, req.body.pacienteId))) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  const m = await resolverModelo(req, req.body.ref);
  if (!m) { res.status(404).json({ error: "Modelo não encontrado" }); return; }
  const f = await prisma.formularioPaciente.create({ data: { clinicaId: me.clinicaId, pacienteId: req.body.pacienteId, profissionalId: me.sub, nome: m.nome, tipo: m.tipo, modeloRef: req.body.ref, perguntas: m.perguntas as unknown as object, modo: req.body.modo } });
  res.status(201).json({ id: f.id });
}));

async function doUsuario(req: Request) {
  const me = u(req);
  return prisma.formularioPaciente.findFirst({ where: { id: req.params.id, clinicaId: me.clinicaId, excluidoEm: null, ...(me.papel === "ADMIN" ? {} : { profissionalId: me.sub }) } });
}
formulariosRouter.get("/:id", asyncHandler(async (req, res) => {
  const f = await doUsuario(req);
  if (!f) { res.status(404).json({ error: "Formulário não encontrado" }); return; }
  res.json({ id: f.id, nome: f.nome, tipo: f.tipo, modo: f.modo, status: f.status, perguntas: f.perguntas, respostas: f.respostas, respondidoPor: f.respondidoPor, respondidoEm: f.respondidoEm });
}));
// preenchimento pelo profissional (na sessão); pode salvar incompleto
formulariosRouter.put("/:id/respostas", validateBody(z.object({ respostas: z.unknown(), concluir: z.boolean().optional() })), asyncHandler(async (req, res) => {
  const f = await doUsuario(req);
  if (!f) { res.status(404).json({ error: "Formulário não encontrado" }); return; }
  const v = validarRespostasFormulario(f.perguntas as unknown as Pergunta[], req.body.respostas, false);
  if (v.erros.length) { res.status(400).json({ error: v.erros[0], erros: v.erros }); return; }
  const r = await prisma.formularioPaciente.update({ where: { id: f.id }, data: { respostas: v.respostas, status: req.body.concluir ? "RESPONDIDO" : f.status, ...(req.body.concluir ? { respondidoPor: "PROFISSIONAL", respondidoEm: new Date() } : {}) } });
  res.json({ status: r.status });
}));
formulariosRouter.delete("/:id", asyncHandler(async (req, res) => {
  const f = await doUsuario(req);
  if (!f) { res.status(404).json({ error: "Formulário não encontrado" }); return; }
  await prisma.formularioPaciente.update({ where: { id: f.id }, data: { excluidoEm: new Date() } });
  res.status(204).end();
}));

// usado pela rota pública quando o paciente responde
export async function registrarRespostaFormulario(id: string, pacienteId: string, respostas: unknown) {
  const f = await prisma.formularioPaciente.findFirst({ where: { id, pacienteId, modo: "LINK", status: "PENDENTE", excluidoEm: null } });
  if (!f) return { erro: "nao_encontrado" as const };
  const v = validarRespostasFormulario(f.perguntas as unknown as Pergunta[], respostas, true);
  if (v.erros.length) return { erro: "invalido" as const, erros: v.erros };
  await prisma.formularioPaciente.update({ where: { id: f.id }, data: { respostas: v.respostas, status: "RESPONDIDO", respondidoPor: "PACIENTE", respondidoEm: new Date() } });
  return { ok: true as const };
}
