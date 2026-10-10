import { Router } from "express";
import { z } from "zod";
import { AMBIENTES, MODOS_CONVENIO, MODOS_PARTICULAR, montarDescricao, pendenciasFiscais, QUANDO_EMITIR, REGIMES, VARIAVEIS_DESCRICAO } from "../lib/fiscal/config";
import { assinarDps, verificarAssinaturaDps } from "../lib/fiscal/nfse/assinatura";
import { carregarCertificadoDaClinica, ErroCertificado, guardarCertificado, removerCertificado } from "../lib/fiscal/nfse/certificado";
import { dpsJaEnviada } from "../lib/fiscal/nfse/client";
import { ErroDps, LEIAUTE_PADRAO, montarDps } from "../lib/fiscal/nfse/dpsBuilder";
import { validarContraXsd } from "../lib/fiscal/nfse/validarXsd";
import { aliquotaEfetivaSimples } from "../lib/fiscal/nfse/simples";
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
  anexoSimples: z.enum(["3", "5"]).optional(),
  regApuracaoSn: z.enum(["1", "2", "3"]).optional(),
  regimeEspecial: z.string().trim().max(2).optional(),
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
  const { pendencias, prontoParaTeste, prontoParaEmitir } = pendenciasFiscais(cfg as never, clinica, !!cfg?.certificadoCifrado);
  // o certificado (cifrado) e a senha NUNCA saem do servidor: a tela recebe só o titular e a validade
  const { certificadoCifrado, certificadoSenhaCifrada, certificadoTitular, certificadoValidoAte, ...publico } = cfg ?? ({} as NonNullable<typeof cfg>);
  const certificado = certificadoCifrado ? { titular: certificadoTitular, validoAte: certificadoValidoAte, diasParaVencer: certificadoValidoAte ? Math.floor((certificadoValidoAte.getTime() - Date.now()) / 86_400_000) : null } : null;
  void certificadoSenhaCifrada;
  return { config: cfg ? publico : null, certificado, clinica: { razaoSocial: clinica.razaoSocial, nomeFantasia: clinica.nomeFantasia, cnpj: clinica.cnpj, endereco: clinica.endereco, bairro: clinica.bairro, cep: clinica.cep, cidade: clinica.cidade, estado: clinica.estado, telefone: clinica.telefone }, exemploDescricao: exemplo, variaveis: VARIAVEIS_DESCRICAO, pendencias, prontoParaTeste, prontoParaEmitir };
}

function exigirAdmin(req: { profissional?: { papel: string } }, res: { status: (c: number) => { json: (b: unknown) => void } }): boolean {
  if (req.profissional?.papel === "ADMIN") return true;
  res.status(403).json({ error: "Só o administrador altera a configuração fiscal." });
  return false;
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

// ---- certificado digital A1 ----
fiscalRouter.post("/certificado", validateBody(z.object({ pfxBase64: z.string().min(100), senha: z.string().min(1) })), asyncHandler(async (req, res) => {
  if (!exigirAdmin(req, res)) return;
  const pfx = Buffer.from(req.body.pfxBase64.replace(/^data:[^,]+,/, ""), "base64");
  try {
    const r = await guardarCertificado(req.profissional!.clinicaId, pfx, req.body.senha);
    res.json({ ...(await resposta(req.profissional!.clinicaId)), enviado: r });
  } catch (e) {
    if (e instanceof ErroCertificado) { res.status(e.codigo === "SEM_CHAVE" ? 503 : 422).json({ error: e.message }); return; }
    throw e;
  }
}));

fiscalRouter.delete("/certificado", asyncHandler(async (req, res) => {
  if (!exigirAdmin(req, res)) return;
  await removerCertificado(req.profissional!.clinicaId);
  res.json(await resposta(req.profissional!.clinicaId));
}));

// ---- DPS de teste: monta (e assina, se há certificado) uma DPS fictícia com a configuração atual. Não envia nada e não gasta número. ----
fiscalRouter.post("/dps-teste", asyncHandler(async (req, res) => {
  if (!exigirAdmin(req, res)) return;
  const clinicaId = req.profissional!.clinicaId;
  const [cfg, clinica] = await Promise.all([prisma.configFiscal.findUnique({ where: { clinicaId } }), prisma.clinica.findUnique({ where: { id: clinicaId } })]);
  if (!cfg || !clinica) { res.status(409).json({ error: "Preencha e salve os dados fiscais primeiro." }); return; }
  const simples = cfg.regime === "SIMPLES_NACIONAL" && cfg.aliquotaModo === "SIMPLES" ? aliquotaEfetivaSimples(cfg.anexoSimples, cfg.rbt12 ? Number(cfg.rbt12) : null) : null;
  try {
    const dps = montarDps({
      prestador: { cnpj: clinica.cnpj ?? "", inscricaoMunicipal: cfg.inscricaoMunicipal ?? "", codigoMunicipioIbge: cfg.codigoMunicipioIbge ?? "", telefone: clinica.telefone, opSimplesNacional: cfg.regime === "MEI" ? "2" : cfg.regime === "SIMPLES_NACIONAL" ? "3" : "1", regApuracaoSn: cfg.regApuracaoSn, regimeEspecial: cfg.regimeEspecial, ambiente: "homologacao", aliquotaIssPercentual: cfg.aliquotaIss ? Number(cfg.aliquotaIss) : null },
      tomador: { documento: "00000000000", nome: "TOMADOR DE TESTE" },
      numero: cfg.proximoNumeroDps, serie: cfg.serieDps, valorServico: 100, cTribNac: cfg.cTribNac ?? "", cNBS: cfg.nbs, issRetido: cfg.issRetido,
      descricao: (cfg.descricaoPadrao || "Serviço de teste").replace(/\{\{[^}]+\}\}/g, "TESTE"), percentualTotalTributos: simples && simples.aliquota !== null ? simples.aliquota : null,
    });
    const xsd = await validarContraXsd(dps.xml, "DPS", LEIAUTE_PADRAO).catch((e) => ({ valida: false, erros: [e instanceof Error ? e.message : "Não consegui validar."] }));
    let xml = dps.xml, assinada = false, verificacao: { valida: boolean; motivo: string | null } | null = null;
    const avisos: string[] = [];
    if (simples && simples.aliquota === null) avisos.push(simples.motivo);
    if (cfg.certificadoCifrado) {
      try { const cert = await carregarCertificadoDaClinica(clinicaId); xml = assinarDps(dps.xml, cert.privateKeyPem, cert.certPem); assinada = true; verificacao = verificarAssinaturaDps(xml, cert.certPem); } catch (e) { avisos.push(e instanceof Error ? e.message : "Não consegui assinar."); }
    } else avisos.push("Sem certificado: a DPS foi montada, mas não assinada.");
    res.json({ xml, idDps: dps.idDps, assinada, verificacao, avisos, ambiente: "homologacao", xsd: { ...xsd, leiaute: LEIAUTE_PADRAO } });
  } catch (e) {
    if (e instanceof ErroDps) { res.status(422).json({ error: e.message }); return; }
    throw e;
  }
}));

// ---- prova de conexão com o Portal Nacional (homologação): handshake mTLS com o certificado da clínica; não emite nem grava nada ----
fiscalRouter.post("/testar-conexao", asyncHandler(async (req, res) => {
  if (!exigirAdmin(req, res)) return;
  let cert;
  try { cert = await carregarCertificadoDaClinica(req.profissional!.clinicaId); } catch (e) {
    if (e instanceof ErroCertificado) { res.status(409).json({ error: e.message }); return; }
    throw e;
  }
  try {
    const r = await dpsJaEnviada({ idDps: "DPS000000000000000000000000000000000000000000000", cert, ambiente: "homologacao" });
    const leitura = r.status === 403 ? "O Portal recusou o certificado (403). Quase sempre é cadeia de certificado incompleta ou certificado de outro CNPJ." : r.status === 401 ? "O Portal não reconheceu a autenticação (401)." : r.status >= 500 ? `O Portal respondeu com erro (${r.status}). Tente de novo mais tarde.` : "Conexão com o Portal Nacional (homologação) estabelecida e certificado aceito.";
    res.json({ ok: r.status < 400 || r.status === 404, status: r.status, leitura });
  } catch (e) {
    res.json({ ok: false, status: 0, leitura: `Não consegui conectar ao Portal: ${e instanceof Error ? e.message : "erro de rede"}` });
  }
}));
