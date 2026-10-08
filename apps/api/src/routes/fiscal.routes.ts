import { Router } from "express";
import { z } from "zod";
import { AMBIENTES, MODOS_CONVENIO, MODOS_PARTICULAR, montarDescricao, pendenciasFiscais, QUANDO_EMITIR, REGIMES, VARIAVEIS_DESCRICAO } from "../lib/fiscal/config";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

export const fiscalRouter = Router();

const vazioNulo = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);
const texto = (max: number) => z.preprocess(vazioNulo, z.string().trim().max(max).nullable().optional());
const numero = z.preprocess((v) => (v === "" || v === undefined ? undefined : v === null ? null : Number(v)), z.number().nonnegative().nullable().optional());

const configSchema = z.object({
  emissaoAtiva: z.boolean().optional(),
  ambiente: z.enum(AMBIENTES).optional(),
  regime: z.enum(REGIMES).optional(),
  inscricaoMunicipal: texto(30),
  codigoMunicipioIbge: z.preprocess(vazioNulo, z.string().regex(/^\d{7}$/, "O código IBGE tem 7 dígitos").nullable().optional()),
  localPrestacaoIbge: z.preprocess(vazioNulo, z.string().regex(/^\d{7}$/, "O código IBGE tem 7 dígitos").nullable().optional()),
  cTribNac: texto(12),
  nbs: texto(20),
  descricaoPadrao: z.string().trim().min(3).max(1000).optional(),
  aliquotaModo: z.enum(["FIXA", "SIMPLES"]).optional(),
  aliquotaIss: numero,
  rbt12: numero,
  issRetido: z.boolean().optional(),
  serieDps: z.string().trim().min(1).max(10).optional(),
  proximoNumeroDps: z.number().int().min(1).optional(),
  modoParticular: z.enum(MODOS_PARTICULAR).optional(),
  quandoEmitir: z.enum(QUANDO_EMITIR).optional(),
  modoConvenio: z.enum(MODOS_CONVENIO).optional(),
  exigeDataPagamento: z.boolean().optional(),
});

async function resposta(clinicaId: string) {
  const [cfg, clinica] = await Promise.all([prisma.configFiscal.findUnique({ where: { clinicaId } }), prisma.clinica.findUnique({ where: { id: clinicaId } })]);
  if (!clinica) return null;
  const exemplo = montarDescricao(cfg?.descricaoPadrao ?? "Prestação de serviços em atendimento de Psicologia {{sessao.data}}", { datas: [new Date("2026-07-31T00:00:00Z")], competencia: new Date("2026-07-01T00:00:00Z"), convenioNome: "Convênio Exemplo", profissionalNome: "Profissional Exemplo", clinicaNome: clinica.nomeFantasia || clinica.razaoSocial });
  const { pendencias, prontoParaTeste, prontoParaEmitir } = pendenciasFiscais(cfg as never, clinica);
  return { config: cfg, clinica: { razaoSocial: clinica.razaoSocial, nomeFantasia: clinica.nomeFantasia, cnpj: clinica.cnpj, endereco: clinica.endereco, bairro: clinica.bairro, cep: clinica.cep, cidade: clinica.cidade, estado: clinica.estado, telefone: clinica.telefone }, exemploDescricao: exemplo, variaveis: VARIAVEIS_DESCRICAO, pendencias, prontoParaTeste, prontoParaEmitir };
}

fiscalRouter.get("/config", asyncHandler(async (req, res) => {
  const r = await resposta(req.profissional!.clinicaId);
  if (!r) { res.status(404).json({ error: "Clínica não encontrada" }); return; }
  res.json(r);
}));

fiscalRouter.put("/config", validateBody(configSchema), asyncHandler(async (req, res) => {
  if (req.profissional!.papel !== "ADMIN") { res.status(403).json({ error: "Só o administrador altera a configuração fiscal." }); return; }
  const clinicaId = req.profissional!.clinicaId;
  const dados = req.body as Record<string, unknown>;
  const atual = await prisma.configFiscal.findUnique({ where: { clinicaId } });
  // retroceder o número pode repetir uma nota já emitida: só com aviso explícito do usuário
  if (typeof dados.proximoNumeroDps === "number" && atual && dados.proximoNumeroDps < atual.proximoNumeroDps) {
    const emitidas = await prisma.notaFiscal.count({ where: { clinicaId, status: "EMITIDA", serie: atual.serieDps, ambiente: atual.ambiente, numero: { gte: dados.proximoNumeroDps } } });
    if (emitidas > 0) { res.status(409).json({ error: "Já existem notas emitidas pelo sistema com número igual ou maior que esse. Não é possível voltar a numeração." }); return; }
  }
  await prisma.configFiscal.upsert({ where: { clinicaId }, update: dados as never, create: { clinicaId, ...dados } as never });
  res.json(await resposta(clinicaId));
}));
