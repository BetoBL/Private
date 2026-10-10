import { Router } from "express";
import { z } from "zod";
import { danfseDaNota } from "../lib/fiscal/danfseNota";
import { criarRascunho, criarRascunhoDeLote, emitirNota, ErroFiscal, excluirRascunho, gerarRascunhosDoMes, marcarComoEmitida, simulando, verificarNoPortal } from "../lib/fiscal/emissao";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

// Notas fiscais: só o administrador vê e emite (a nota é da clínica, não de um profissional).
export const notasRouter = Router();

notasRouter.use((req, res, next) => {
  if (req.profissional?.papel !== "ADMIN") { res.status(403).json({ error: "Só o administrador acessa as notas fiscais." }); return; }
  next();
});

// converte o erro de negócio em resposta clara
const tratar = (fn: Parameters<typeof asyncHandler>[0]) => asyncHandler(async (req, res, next) => {
  try { await fn(req, res, next); } catch (e) {
    if (e instanceof ErroFiscal) { res.status(e.status).json({ error: e.message, codigo: e.codigo }); return; }
    throw e;
  }
});

const sem = { xmlDps: false, xmlNfse: false } as const;
const listar = { select: { id: true, origem: true, status: true, ambiente: true, serie: true, numero: true, numeroNfse: true, competencia: true, tomadorNome: true, tomadorDocumento: true, tomadorConvenioId: true, valor: true, descricao: true, datasServico: true, chaveAcesso: true, erro: true, emitidaEm: true, criadoEm: true, tentativas: true, avisos: true, _count: { select: { cobrancas: true } } } } as const;
void sem;

notasRouter.get("/", tratar(async (req, res) => {
  const { status, mes } = req.query as Record<string, string | undefined>;
  const m = /^(\d{4})-(\d{2})$/.exec(mes ?? "");
  const notas = await prisma.notaFiscal.findMany({
    where: { clinicaId: req.profissional!.clinicaId, ...(status ? { status } : {}), ...(m ? { competencia: { gte: new Date(Date.UTC(+m[1], +m[2] - 1, 1)), lt: new Date(Date.UTC(+m[1], +m[2], 1)) } } : {}) },
    orderBy: [{ criadoEm: "desc" }], take: 300, ...listar,
  });
  const cfg = await prisma.configFiscal.findUnique({ where: { clinicaId: req.profissional!.clinicaId }, select: { ambiente: true, emissaoAtiva: true } });
  res.json({ notas, emissaoAtiva: !!cfg?.emissaoAtiva, ambiente: cfg?.ambiente ?? "HOMOLOGACAO", simulacao: cfg ? simulando(cfg.ambiente) : false });
}));

notasRouter.get("/:id", tratar(async (req, res) => {
  const nota = await prisma.notaFiscal.findFirst({ where: { id: req.params.id, clinicaId: req.profissional!.clinicaId }, include: { cobrancas: { select: { id: true, descricao: true, valor: true, status: true, pagoEm: true, vencimento: true, paciente: { select: { nome: true } } } } } });
  if (!nota) { res.status(404).json({ error: "Nota não encontrada" }); return; }
  const { xmlDps, xmlNfse, ...resto } = nota;
  res.json({ ...resto, temXmlDps: !!xmlDps, temXmlNfse: !!xmlNfse });
}));

notasRouter.get("/:id/xml", tratar(async (req, res) => {
  const nota = await prisma.notaFiscal.findFirst({ where: { id: req.params.id, clinicaId: req.profissional!.clinicaId }, select: { xmlDps: true, xmlNfse: true, numero: true } });
  const qual = req.query.tipo === "dps" ? nota?.xmlDps : nota?.xmlNfse ?? nota?.xmlDps;
  if (!qual) { res.status(404).json({ error: "Esta nota não tem XML." }); return; }
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="nota-${nota?.numero ?? "sem-numero"}.xml"`);
  res.send(qual);
}));

// PDF da nota (DANFSe), no leiaute do Portal Nacional
notasRouter.get("/:id/pdf", tratar(async (req, res) => {
  const { pdf, nome } = await danfseDaNota(req.params.id, req.profissional!.clinicaId);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${nome}"`);
  res.send(pdf);
}));

// prepara UMA nota com as cobranças escolhidas (mesmo paciente); "lote" junta cobranças de um mesmo convênio
notasRouter.post("/rascunho", validateBody(z.object({ cobrancaIds: z.array(z.string().uuid()).min(1), lote: z.boolean().optional() })), tratar(async (req, res) => {
  const clinicaId = req.profissional!.clinicaId;
  const nota = req.body.lote ? await criarRascunhoDeLote(clinicaId, req.body.cobrancaIds) : await criarRascunho(clinicaId, req.body.cobrancaIds);
  res.status(201).json(nota);
}));

notasRouter.post("/gerar-do-mes", validateBody(z.object({ mes: z.string() })), tratar(async (req, res) => {
  res.json(await gerarRascunhosDoMes(req.profissional!.clinicaId, req.body.mes));
}));

notasRouter.post("/:id/emitir", tratar(async (req, res) => {
  const nota = await emitirNota(req.params.id, req.profissional!.clinicaId);
  res.json({ id: nota.id, status: nota.status, erro: nota.erro, numero: nota.numero, numeroNfse: nota.numeroNfse, ambiente: nota.ambiente });
}));

notasRouter.post("/:id/verificar", tratar(async (req, res) => { res.json(await verificarNoPortal(req.params.id, req.profissional!.clinicaId)); }));

notasRouter.post("/:id/marcar-emitida", validateBody(z.object({ chaveAcesso: z.string().min(10), numeroNfse: z.string().optional() })), tratar(async (req, res) => {
  const n = await marcarComoEmitida(req.params.id, req.profissional!.clinicaId, req.body.chaveAcesso, req.body.numeroNfse);
  res.json({ id: n.id, status: n.status });
}));

notasRouter.delete("/:id", tratar(async (req, res) => { await excluirRascunho(req.params.id, req.profissional!.clinicaId); res.status(204).send(); }));
