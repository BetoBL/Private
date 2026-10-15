import type { Request } from "express";
import { Router } from "express";
import { z } from "zod";
import { MODELOS, PROFISSOES, modeloPermitido, profissaoDe, validarCampos } from "../lib/prontuario/modelos";
import { gerarProntuarioPdf } from "../lib/prontuario/pdf";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

// Prontuário: evolução da sessão e continuidade do cuidado. Vale para qualquer profissional da saúde; o modelo define os campos.
// Quem vê: o profissional responsável pelo paciente e o administrador da clínica. As ANOTAÇÕES (folha privada) só o autor lê.
export const evolucoesRouter = Router();
export const continuidadeRouter = Router();

type Usuario = { sub: string; clinicaId: string; papel: string };
const u = (req: Request) => req.profissional as Usuario;

async function pacienteDoUsuario(req: Request, pacienteId: string) {
  const me = u(req);
  return prisma.paciente.findFirst({ where: { id: pacienteId, clinicaId: me.clinicaId, ...(me.papel === "ADMIN" ? {} : { profissionalId: me.sub }) }, select: { id: true, nome: true } });
}
async function categoriaDoUsuario(req: Request) {
  const p = await prisma.profissional.findUnique({ where: { id: u(req).sub }, select: { categoria: true } });
  return p?.categoria ?? "PSICOLOGO";
}

type EvolucaoBanco = NonNullable<Awaited<ReturnType<typeof prisma.evolucao.findFirst>>>;
function paraResposta(req: Request, e: EvolucaoBanco) {
  const meu = e.profissionalId === u(req).sub;
  const { versoes, ...resto } = e;
  return { ...resto, anotacoes: meu ? e.anotacoes : null, anotacoesPrivadas: !meu, totalVersoes: Array.isArray(versoes) ? versoes.length : 0 };
}
async function carregar(req: Request, id: string) {
  const me = u(req);
  return prisma.evolucao.findFirst({ where: { id, clinicaId: me.clinicaId, excluidaEm: null, ...(me.papel === "ADMIN" ? {} : { profissionalId: me.sub }) } });
}

// Catálogo: os modelos que o profissional pode usar e o que a profissão dele acrescenta (para montar o menu).
evolucoesRouter.get("/catalogo", asyncHandler(async (req, res) => {
  const cat = await categoriaDoUsuario(req);
  const prof = profissaoDe(cat);
  res.json({ profissao: { chave: prof.chave, rotulo: prof.rotulo, registro: prof.registro, modulos: prof.modulos }, modelos: MODELOS.filter((m) => prof.modelos.includes(m.chave)), profissoes: PROFISSOES.map((p) => ({ chave: p.chave, rotulo: p.rotulo, registro: p.registro })) });
}));

evolucoesRouter.get("/", asyncHandler(async (req, res) => {
  const pacienteId = String(req.query.pacienteId ?? "");
  if (!pacienteId || !(await pacienteDoUsuario(req, pacienteId))) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  const lista = await prisma.evolucao.findMany({ where: { pacienteId, clinicaId: u(req).clinicaId, excluidaEm: null }, orderBy: { dataHora: "desc" }, take: 300 });
  res.json(lista.map((e) => paraResposta(req, e)));
}));

const criarSchema = z.object({ pacienteId: z.string().uuid(), modelo: z.string().default("LIVRE"), dataHora: z.coerce.date().optional(), eventoAgendaId: z.string().uuid().nullish() });
evolucoesRouter.post("/", validateBody(criarSchema), asyncHandler(async (req, res) => {
  const me = u(req);
  if (!(await pacienteDoUsuario(req, req.body.pacienteId))) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  if (!modeloPermitido(await categoriaDoUsuario(req), req.body.modelo)) { res.status(400).json({ error: "Esse modelo não está disponível para o seu tipo de profissional." }); return; }
  const e = await prisma.evolucao.create({ data: { clinicaId: me.clinicaId, pacienteId: req.body.pacienteId, profissionalId: me.sub, modelo: req.body.modelo, dataHora: req.body.dataHora ?? new Date(), eventoAgendaId: req.body.eventoAgendaId ?? null } });
  res.status(201).json(paraResposta(req, e));
}));

// Evoluções em rascunho do profissional (as "pendentes" do painel do dia): só as dele, mais antigas primeiro.
evolucoesRouter.get("/pendentes", asyncHandler(async (req, res) => {
  const me = u(req);
  const lista = await prisma.evolucao.findMany({ where: { clinicaId: me.clinicaId, profissionalId: me.sub, status: "RASCUNHO", excluidaEm: null }, orderBy: { dataHora: "asc" }, take: 20, include: { paciente: { select: { id: true, nome: true } } } });
  res.json(lista.map((e) => ({ id: e.id, pacienteId: e.pacienteId, paciente: e.paciente.nome, dataHora: e.dataHora, modelo: e.modelo, comTexto: !!(e.evolucao ?? "").trim() })));
}));

// Prontuário geral em PDF: as evoluções escolhidas (ids separados por vírgula; sem ids = todas as finalizadas). Anotações privadas nunca entram.
evolucoesRouter.get("/prontuario/pdf", asyncHandler(async (req, res) => {
  const me = u(req);
  const pacienteId = String(req.query.pacienteId ?? "");
  const paciente = pacienteId ? await prisma.paciente.findFirst({ where: { id: pacienteId, clinicaId: me.clinicaId, ...(me.papel === "ADMIN" ? {} : { profissionalId: me.sub }) } }) : null;
  if (!paciente) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  const ids = String(req.query.ids ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const evolucoes = await prisma.evolucao.findMany({ where: { pacienteId, clinicaId: me.clinicaId, excluidaEm: null, ...(ids.length ? { id: { in: ids } } : { status: "FINALIZADA" }) }, orderBy: { dataHora: "asc" }, include: { profissional: { select: { nome: true } } } });
  const [clinica, prof] = await Promise.all([prisma.clinica.findUnique({ where: { id: me.clinicaId } }), prisma.profissional.findUnique({ where: { id: me.sub }, select: { nome: true, crp: true, categoria: true } })]);
  const pdf = await gerarProntuarioPdf({
    clinica: { nome: clinica?.nomeFantasia || clinica?.razaoSocial || "Clínica", cnpj: clinica?.cnpj ?? null, endereco: [clinica?.endereco, clinica?.cidade && clinica?.estado ? `${clinica.cidade}/${clinica.estado}` : null].filter(Boolean).join(", ") || null, telefone: clinica?.telefone ?? null },
    paciente: { nome: paciente.nome, nascimento: paciente.dataNascimento ?? null, cpf: paciente.cpf ?? null },
    profissional: { nome: prof?.nome ?? "", registroRotulo: profissaoDe(prof?.categoria).registro, registro: prof?.crp ?? "" },
    geradoEm: new Date(),
    evolucoes: evolucoes.map((e) => ({ dataHora: e.dataHora, modelo: e.modelo, campos: (e.campos as Record<string, string | string[]> | null) ?? null, evolucao: e.evolucao, finalizada: e.status === "FINALIZADA", profissional: e.profissional.nome })),
  });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="prontuario-${paciente.nome.normalize("NFD").replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}.pdf"`);
  res.send(pdf);
}));

evolucoesRouter.get("/:id", asyncHandler(async (req, res) => {
  const e = await carregar(req, req.params.id);
  if (!e) { res.status(404).json({ error: "Evolução não encontrada" }); return; }
  res.json(paraResposta(req, e));
}));

const editarSchema = z.object({ modelo: z.string().optional(), dataHora: z.coerce.date().optional(), campos: z.unknown().optional(), anotacoes: z.string().max(40000).nullish(), evolucao: z.string().max(40000).nullish() });
evolucoesRouter.put("/:id", validateBody(editarSchema), asyncHandler(async (req, res) => {
  const me = u(req);
  const atual = await carregar(req, req.params.id);
  if (!atual) { res.status(404).json({ error: "Evolução não encontrada" }); return; }
  if (atual.profissionalId !== me.sub) { res.status(403).json({ error: "Só quem escreveu a evolução pode alterá-la." }); return; }
  const modelo = req.body.modelo ?? atual.modelo;
  if (!modeloPermitido(await categoriaDoUsuario(req), modelo)) { res.status(400).json({ error: "Esse modelo não está disponível para o seu tipo de profissional." }); return; }
  let campos = atual.campos;
  if (req.body.campos !== undefined || modelo !== atual.modelo) {
    const v = validarCampos(modelo, req.body.campos ?? (modelo === atual.modelo ? atual.campos : {}));
    if (v.erros.length) { res.status(400).json({ error: v.erros[0], erros: v.erros }); return; }
    campos = v.campos;
  }
  // depois de finalizada, a versão anterior fica guardada (nada é reescrito sem rastro)
  const versoes = Array.isArray(atual.versoes) ? [...(atual.versoes as unknown[])] : [];
  if (atual.status === "FINALIZADA") versoes.push({ em: new Date().toISOString(), modelo: atual.modelo, campos: atual.campos, anotacoes: atual.anotacoes, evolucao: atual.evolucao });
  const e = await prisma.evolucao.update({
    where: { id: atual.id },
    data: {
      modelo, campos: (campos ?? {}) as object, ...(req.body.dataHora ? { dataHora: req.body.dataHora } : {}),
      ...(req.body.anotacoes !== undefined ? { anotacoes: req.body.anotacoes } : {}), ...(req.body.evolucao !== undefined ? { evolucao: req.body.evolucao } : {}),
      ...(atual.status === "FINALIZADA" ? { versoes: versoes as object[] } : {}),
    },
  });
  res.json(paraResposta(req, e));
}));

evolucoesRouter.post("/:id/finalizar", asyncHandler(async (req, res) => {
  const atual = await carregar(req, req.params.id);
  if (!atual) { res.status(404).json({ error: "Evolução não encontrada" }); return; }
  if (atual.profissionalId !== u(req).sub) { res.status(403).json({ error: "Só quem escreveu a evolução pode finalizá-la." }); return; }
  const vazia = !(atual.evolucao ?? "").trim() && !Object.values((atual.campos as Record<string, unknown>) ?? {}).some((v) => (Array.isArray(v) ? v.length : String(v ?? "").trim()));
  if (vazia) { res.status(400).json({ error: "Escreva a evolução (ou preencha os campos do modelo) antes de finalizar." }); return; }
  res.json(paraResposta(req, await prisma.evolucao.update({ where: { id: atual.id }, data: { status: "FINALIZADA", finalizadaEm: new Date() } })));
}));

evolucoesRouter.post("/:id/reabrir", asyncHandler(async (req, res) => {
  const atual = await carregar(req, req.params.id);
  if (!atual) { res.status(404).json({ error: "Evolução não encontrada" }); return; }
  if (atual.profissionalId !== u(req).sub) { res.status(403).json({ error: "Só quem escreveu a evolução pode reabri-la." }); return; }
  res.json(paraResposta(req, await prisma.evolucao.update({ where: { id: atual.id }, data: { status: "RASCUNHO", finalizadaEm: null } })));
}));

evolucoesRouter.get("/:id/versoes", asyncHandler(async (req, res) => {
  const e = await carregar(req, req.params.id);
  if (!e) { res.status(404).json({ error: "Evolução não encontrada" }); return; }
  const meu = e.profissionalId === u(req).sub;
  const versoes = (Array.isArray(e.versoes) ? (e.versoes as Array<Record<string, unknown>>) : []).map((v) => (meu ? v : { ...v, anotacoes: null }));
  res.json(versoes);
}));

// Excluir = esconder (recuperável): o prontuário não perde histórico sem querer.
evolucoesRouter.delete("/:id", asyncHandler(async (req, res) => {
  const atual = await carregar(req, req.params.id);
  if (!atual) { res.status(404).json({ error: "Evolução não encontrada" }); return; }
  if (atual.profissionalId !== u(req).sub && u(req).papel !== "ADMIN") { res.status(403).json({ error: "Sem permissão para excluir esta evolução." }); return; }
  await prisma.evolucao.update({ where: { id: atual.id }, data: { excluidaEm: new Date() } });
  res.status(204).end();
}));

evolucoesRouter.post("/:id/restaurar", asyncHandler(async (req, res) => {
  const me = u(req);
  const e = await prisma.evolucao.findFirst({ where: { id: req.params.id, clinicaId: me.clinicaId, excluidaEm: { not: null }, ...(me.papel === "ADMIN" ? {} : { profissionalId: me.sub }) } });
  if (!e) { res.status(404).json({ error: "Evolução excluída não encontrada" }); return; }
  res.json(paraResposta(req, await prisma.evolucao.update({ where: { id: e.id }, data: { excluidaEm: null } })));
}));

// ---- continuidade do cuidado ----
continuidadeRouter.get("/", asyncHandler(async (req, res) => {
  const pacienteId = String(req.query.pacienteId ?? "");
  if (!pacienteId || !(await pacienteDoUsuario(req, pacienteId))) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  const status = req.query.status === "CONCLUIDO" ? "CONCLUIDO" : "ANDAMENTO";
  res.json(await prisma.itemContinuidade.findMany({ where: { pacienteId, clinicaId: u(req).clinicaId, status, excluidoEm: null }, orderBy: { criadoEm: "desc" }, take: 200 }));
}));

const itemSchema = z.object({ pacienteId: z.string().uuid(), tipo: z.enum(["PLANO", "TOPICO"]), texto: z.string().trim().min(1, "Escreva o texto.").max(1000), evolucaoId: z.string().uuid().nullish() });
continuidadeRouter.post("/", validateBody(itemSchema), asyncHandler(async (req, res) => {
  const me = u(req);
  if (!(await pacienteDoUsuario(req, req.body.pacienteId))) { res.status(404).json({ error: "Paciente não encontrado" }); return; }
  if (req.body.evolucaoId && !(await prisma.evolucao.findFirst({ where: { id: req.body.evolucaoId, pacienteId: req.body.pacienteId, clinicaId: me.clinicaId } }))) { res.status(400).json({ error: "Evolução inválida para este paciente." }); return; }
  res.status(201).json(await prisma.itemContinuidade.create({ data: { clinicaId: me.clinicaId, pacienteId: req.body.pacienteId, profissionalId: me.sub, tipo: req.body.tipo, texto: req.body.texto, evolucaoId: req.body.evolucaoId ?? null } }));
}));

const itemEditarSchema = z.object({ texto: z.string().trim().min(1).max(1000).optional(), status: z.enum(["ANDAMENTO", "CONCLUIDO"]).optional() });
async function itemDoUsuario(req: Request) {
  const me = u(req);
  return prisma.itemContinuidade.findFirst({ where: { id: req.params.id, clinicaId: me.clinicaId, excluidoEm: null, ...(me.papel === "ADMIN" ? {} : { profissionalId: me.sub }) } });
}
continuidadeRouter.put("/:id", validateBody(itemEditarSchema), asyncHandler(async (req, res) => {
  const it = await itemDoUsuario(req);
  if (!it) { res.status(404).json({ error: "Item não encontrado" }); return; }
  const { texto, status } = req.body;
  res.json(await prisma.itemContinuidade.update({ where: { id: it.id }, data: { ...(texto ? { texto } : {}), ...(status ? { status, concluidoEm: status === "CONCLUIDO" ? new Date() : null } : {}) } }));
}));
continuidadeRouter.delete("/:id", asyncHandler(async (req, res) => {
  const it = await itemDoUsuario(req);
  if (!it) { res.status(404).json({ error: "Item não encontrado" }); return; }
  await prisma.itemContinuidade.update({ where: { id: it.id }, data: { excluidoEm: new Date() } });
  res.status(204).end();
}));
