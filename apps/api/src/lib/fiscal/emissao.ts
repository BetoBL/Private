import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { assinarDps } from "./nfse/assinatura";
import { carregarCertificadoDaClinica, ErroCertificado } from "./nfse/certificado";
import { dpsJaEnviada, enviarDps } from "./nfse/client";
import { ErroDps, montarDps, montarIdDps } from "./nfse/dpsBuilder";
import { aliquotaEfetivaSimples } from "./nfse/simples";
import { montarDescricao, pendenciasFiscais } from "./config";
import { regraDeEmissao, type PadraoFiscal, type RegraEmissao } from "./regra";

// Orquestra a nota fiscal: cobrança → rascunho → emissão. A ordem que governa tudo (porte do orquestrador do Infinity):
//   1. o NÚMERO é reservado de forma atômica ANTES do envio e nunca retrocede;
//   2. se o Portal respondeu recusando, a nota fica REJEITADA com o motivo (o número está gasto: buraco se declara, não se reaproveita);
//   3. se o envio falhou SEM resposta, a DPS pode ter chegado: a nota fica PENDENTE e não é reenviada sozinha (reenviar duplicaria);
//   4. nada é emitido com a emissão desligada (Dados fiscais) nem com configuração incompleta.

export class ErroFiscal extends Error { constructor(public codigo: string, mensagem: string, public status = 409) { super(mensagem); } }

type CobrancaCompleta = Prisma.CobrancaGetPayload<{ include: { sessao: true; paciente: true; convenio: true } }>;

// dia do calendário em São Paulo, como meia-noite UTC (é assim que as datas entram em montarDescricao e nas colunas DATE)
export function diaSaoPaulo(d: Date): Date {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  return new Date(`${p}T00:00:00.000Z`);
}

export function simulando(ambiente: string): boolean { return process.env.NFSE_SIMULAR === "1" && ambiente === "HOMOLOGACAO"; }

// ---------- rascunho ----------
export async function criarRascunho(clinicaId: string, cobrancaIds: string[]) {
  if (cobrancaIds.length === 0) throw new ErroFiscal("SEM_COBRANCA", "Escolha ao menos uma cobrança.", 400);
  const [cfg, clinica, cobrancas] = await Promise.all([
    prisma.configFiscal.findUnique({ where: { clinicaId } }),
    prisma.clinica.findUnique({ where: { id: clinicaId } }),
    prisma.cobranca.findMany({ where: { id: { in: cobrancaIds }, clinicaId }, include: { sessao: true, paciente: true, convenio: true } }),
  ]);
  if (!cfg || !clinica) throw new ErroFiscal("SEM_CONFIG", "Preencha e salve os dados fiscais antes de preparar notas.");
  if (cobrancas.length !== new Set(cobrancaIds).size) throw new ErroFiscal("COBRANCA_NAO_ENCONTRADA", "Alguma cobrança não foi encontrada nesta clínica.", 404);
  const ruim = cobrancas.find((c) => c.status === "CANCELADA");
  if (ruim) throw new ErroFiscal("COBRANCA_CANCELADA", `A cobrança “${ruim.descricao}” está cancelada.`);
  const jaTem = cobrancas.find((c) => c.notaFiscalId);
  if (jaTem) throw new ErroFiscal("JA_TEM_NOTA", `A cobrança “${jaTem.descricao}” já está em uma nota.`);
  const pac = cobrancas[0].paciente;
  if (cobrancas.some((c) => c.pacienteId !== pac.id)) throw new ErroFiscal("PACIENTES_DIFERENTES", "Uma nota junta cobranças de um único paciente (ou de um único convênio, no lote mensal).");
  const convenioId = cobrancas[0].convenioId;
  if (cobrancas.some((c) => c.convenioId !== convenioId)) throw new ErroFiscal("CONVENIOS_DIFERENTES", "As cobranças escolhidas são de convênios diferentes.");
  return montarRascunho(cfg, clinica.nomeFantasia || clinica.razaoSocial, cobrancas);
}

// lote mensal de convênio: cobranças de pacientes diferentes, do mesmo convênio
export async function criarRascunhoDeLote(clinicaId: string, cobrancaIds: string[]) {
  const [cfg, clinica, cobrancas] = await Promise.all([
    prisma.configFiscal.findUnique({ where: { clinicaId } }), prisma.clinica.findUnique({ where: { id: clinicaId } }),
    prisma.cobranca.findMany({ where: { id: { in: cobrancaIds }, clinicaId, status: { not: "CANCELADA" }, notaFiscalId: null }, include: { sessao: true, paciente: true, convenio: true } }),
  ]);
  if (!cfg || !clinica) throw new ErroFiscal("SEM_CONFIG", "Preencha e salve os dados fiscais antes de preparar notas.");
  if (cobrancas.length === 0 || !cobrancas[0].convenio) throw new ErroFiscal("SEM_COBRANCA", "Não há cobranças de convênio livres para o lote.");
  return montarRascunho(cfg, clinica.nomeFantasia || clinica.razaoSocial, cobrancas, true);
}

async function montarRascunho(cfg: NonNullable<Awaited<ReturnType<typeof prisma.configFiscal.findUnique>>>, clinicaNome: string, cobrancas: CobrancaCompleta[], lote = false) {
  const pac = cobrancas[0].paciente, convenio = cobrancas[0].convenio;
  const regra = regraDeEmissao(cfg as unknown as PadraoFiscal, pac, convenio);
  if (!regra.emite) throw new ErroFiscal("NAO_EMITE", `${pac.nome} está marcado para não emitir nota fiscal.`);
  // a data da sessão é um instante (vira o dia em São Paulo); vencimento e pagamento já são dias do calendário (coluna DATE) e não se deslocam
  const datas = cobrancas.map((c) => (c.sessao ? diaSaoPaulo(c.sessao.dataHora) : c.pagoEm ?? c.vencimento)).sort((a, b) => a.getTime() - b.getTime());
  const competencia = new Date(Date.UTC(datas[0].getUTCFullYear(), datas[0].getUTCMonth(), 1));
  const descricao = montarDescricao(cfg.descricaoPadrao, { datas, competencia, convenioNome: convenio?.nomeOperadora, clinicaNome });
  const valor = cobrancas.reduce((s, c) => s + Number(c.valor), 0);
  const origem = lote ? "CONVENIO_LOTE" : convenio ? "CONVENIO_CASO" : regra.modo === "POR_LAUDO" ? "LAUDO" : cobrancas[0].sessaoId ? "SESSAO" : "MANUAL";
  const tomador = lote ? { nome: convenio!.razaoSocial?.trim() || convenio!.nomeOperadora, documento: convenio!.cnpj ?? null } : { nome: regra.tomador.nome, documento: regra.tomador.documento };
  const avisos = avisosDoRascunho(regra, tomador.documento, convenio?.nomeOperadora);

  return prisma.$transaction(async (tx) => {
    const nota = await tx.notaFiscal.create({
      data: { clinicaId: cfg.clinicaId, origem, status: "RASCUNHO", ambiente: cfg.ambiente, competencia, tomadorNome: tomador.nome, tomadorDocumento: tomador.documento, tomadorConvenioId: lote || convenio ? convenio!.id : null, valor, descricao, datasServico: datas.map((d) => d.toISOString().slice(0, 10)), avisos },
    });
    // só liga cobranças ainda livres: se outra pessoa ligou alguma entre a checagem e agora, desfaz tudo (a transação inteira volta)
    const ligadas = await tx.cobranca.updateMany({ where: { id: { in: cobrancas.map((c) => c.id) }, notaFiscalId: null }, data: { notaFiscalId: nota.id } });
    if (ligadas.count !== cobrancas.length) throw new ErroFiscal("CONCORRENCIA", "Outra pessoa mexeu nessas cobranças ao mesmo tempo. Tente de novo.");
    return nota;
  });
}

function avisosDoRascunho(regra: RegraEmissao, documento: string | null, convenioNome?: string): string[] {
  const a: string[] = [];
  if (!documento?.replace(/\D/g, "")) a.push(regra.tomador.tipo === "CONVENIO" ? `Falta o CNPJ do convênio ${convenioNome ?? ""} (Dados da clínica › Convênios aceitos).` : "O tomador da nota está sem CPF/CNPJ (cadastro do paciente).");
  return a;
}

// ---------- emissão ----------
export interface OpcoesEmissao { enviar?: typeof enviarDps }

export async function emitirNota(notaId: string, clinicaId: string, opcoes: OpcoesEmissao = {}) {
  const nota = await prisma.notaFiscal.findFirst({ where: { id: notaId, clinicaId }, include: { cobrancas: true } });
  if (!nota) throw new ErroFiscal("NOTA_NAO_ENCONTRADA", "Nota não encontrada.", 404);
  if (nota.status === "EMITIDA") throw new ErroFiscal("JA_EMITIDA", "Esta nota já foi emitida.");
  if (nota.status === "PENDENTE") throw new ErroFiscal("PENDENTE", "O envio anterior ficou sem resposta do Portal. Confira no Portal Nacional antes de emitir de novo (botão “Verificar no Portal”).");
  if (nota.status === "CANCELADA") throw new ErroFiscal("CANCELADA", "Esta nota está cancelada.");

  const [cfg, clinica] = await Promise.all([prisma.configFiscal.findUnique({ where: { clinicaId } }), prisma.clinica.findUnique({ where: { id: clinicaId } })]);
  if (!cfg || !clinica) throw new ErroFiscal("SEM_CONFIG", "Preencha e salve os dados fiscais antes de emitir.");
  if (!cfg.emissaoAtiva) throw new ErroFiscal("EMISSAO_DESLIGADA", "A emissão está desligada. Ative em Configurações › Dados fiscais quando quiser emitir.");
  const simular = simulando(cfg.ambiente);
  const { pendencias } = pendenciasFiscais(cfg as never, clinica, !!cfg.certificadoCifrado || simular);
  if (pendencias.length) throw new ErroFiscal("CONFIG_INCOMPLETA", `Falta preencher: ${pendencias.map((p) => p.mensagem).join("; ")}.`);
  if (!nota.tomadorDocumento?.replace(/\D/g, "")) throw new ErroFiscal("SEM_DOCUMENTO", "O tomador da nota está sem CPF/CNPJ. Preencha no cadastro do paciente (ou do convênio) e tente de novo.");
  if (!(Number(nota.valor) > 0)) throw new ErroFiscal("VALOR_INVALIDO", "O valor da nota precisa ser maior que zero.");
  // a data de pagamento é exigida em atendimento particular; convênio é faturado antes de pagar
  if (cfg.exigeDataPagamento && !nota.tomadorConvenioId && nota.cobrancas.some((c) => c.status !== "PAGA" || !c.pagoEm)) {
    throw new ErroFiscal("SEM_PAGAMENTO", "Esta nota só pode ser emitida depois do pagamento: dê baixa na cobrança com a data de pagamento (ou desligue essa exigência em Dados fiscais).");
  }

  let cert: Awaited<ReturnType<typeof carregarCertificadoDaClinica>> | null = null;
  if (!simular) {
    try { cert = await carregarCertificadoDaClinica(clinicaId); } catch (e) { if (e instanceof ErroCertificado) throw new ErroFiscal(e.codigo, e.message); throw e; }
  } else if (cfg.certificadoCifrado) { try { cert = await carregarCertificadoDaClinica(clinicaId); } catch { cert = null; } }

  // 1. reserva o número (atômico: duas emissões ao mesmo tempo nunca recebem o mesmo)
  const reservado = await prisma.configFiscal.update({ where: { clinicaId }, data: { proximoNumeroDps: { increment: 1 } }, select: { proximoNumeroDps: true, serieDps: true } });
  const numero = reservado.proximoNumeroDps - 1;
  const ambiente = cfg.ambiente;
  // numeração fiscal com buraco se DECLARA: ao tentar de novo uma nota recusada, o número gasto antes fica registrado nos avisos da nota
  const historico = Array.isArray(nota.avisos) ? (nota.avisos as string[]) : [];
  const avisos = nota.status === "REJEITADA" && nota.numero ? [...historico, `O número ${nota.numero} (série ${nota.serie}) foi usado numa tentativa recusada pelo Portal e não será reaproveitado. Motivo: ${nota.erro ?? "não informado"}`] : historico;
  await prisma.notaFiscal.update({ where: { id: nota.id }, data: { numero, serie: reservado.serieDps, ambiente, tentativas: { increment: 1 }, erro: null, avisos } });

  // 2. monta e assina a DPS; qualquer falha aqui acontece antes de falar com o Portal (o número gasto fica declarado como rejeitada)
  const rejeitar = async (erro: string) => prisma.notaFiscal.update({ where: { id: nota.id }, data: { status: "REJEITADA", erro } });
  const simples = cfg.regime === "SIMPLES_NACIONAL" && cfg.aliquotaModo === "SIMPLES" ? aliquotaEfetivaSimples(cfg.anexoSimples, cfg.rbt12 ? Number(cfg.rbt12) : null) : null;
  let xml: string, idDps: string;
  try {
    const dps = montarDps({
      prestador: { cnpj: clinica.cnpj ?? "", inscricaoMunicipal: cfg.inscricaoMunicipal ?? "", codigoMunicipioIbge: cfg.codigoMunicipioIbge ?? "", telefone: clinica.telefone, opSimplesNacional: cfg.regime === "MEI" ? "2" : cfg.regime === "SIMPLES_NACIONAL" ? "3" : "1", regApuracaoSn: cfg.regApuracaoSn, regimeEspecial: cfg.regimeEspecial, ambiente: ambiente === "PRODUCAO" ? "producao" : "homologacao", aliquotaIssPercentual: cfg.aliquotaIss ? Number(cfg.aliquotaIss) : null },
      tomador: { documento: nota.tomadorDocumento, nome: nota.tomadorNome },
      numero, serie: reservado.serieDps, valorServico: Number(nota.valor), descricao: nota.descricao, cTribNac: cfg.cTribNac ?? "", cNBS: cfg.nbs, issRetido: cfg.issRetido,
      dataCompetencia: nota.competencia, percentualTotalTributos: simples && simples.aliquota !== null ? simples.aliquota : null,
      codigoMunicipioPrestacao: cfg.localPrestacaoIbge,
    });
    idDps = dps.idDps;
    xml = cert ? assinarDps(dps.xml, cert.privateKeyPem, cert.certPem) : dps.xml;
  } catch (e) {
    return rejeitar(e instanceof ErroDps ? e.message : `Não consegui montar a DPS: ${e instanceof Error ? e.message : "erro"}`);
  }
  await prisma.notaFiscal.update({ where: { id: nota.id }, data: { xmlDps: xml } });

  // 3. envia
  if (simular) {
    const chave = `SIMULADA${String(numero).padStart(8, "0")}${Date.now()}`;
    return prisma.notaFiscal.update({ where: { id: nota.id }, data: { status: "EMITIDA", chaveAcesso: chave, numeroNfse: String(numero), emitidaEm: new Date(), xmlNfse: `<!-- NFS-e SIMULADA (homologação, sem validade): ${idDps} -->`, erro: null } });
  }
  let r;
  try { r = await (opcoes.enviar ?? enviarDps)({ xmlAssinado: xml, cert: cert!, ambiente: ambiente === "PRODUCAO" ? "producao" : "homologacao" }); } catch (e) {
    return prisma.notaFiscal.update({ where: { id: nota.id }, data: { status: "PENDENTE", erro: `O envio ficou sem resposta (${e instanceof Error ? e.message : "erro de rede"}). A DPS pode ter chegado ao Portal: confira antes de emitir de novo.` } });
  }
  if (!r.ok) {
    const duplicada = "duplicada" in r && r.duplicada;
    return prisma.notaFiscal.update({ where: { id: nota.id }, data: { status: duplicada ? "PENDENTE" : "REJEITADA", erro: r.erro } });
  }
  const numeroNfse = r.nfseXml ? /<nNFSe>(\d+)<\/nNFSe>/.exec(r.nfseXml)?.[1] ?? null : null;
  return prisma.notaFiscal.update({ where: { id: nota.id }, data: { status: "EMITIDA", chaveAcesso: r.chaveAcesso, numeroNfse: numeroNfse ?? String(numero), emitidaEm: new Date(), xmlNfse: r.nfseXml, erro: null } });
}

// Confere no Portal se a DPS de uma nota PENDENTE chegou (não reenvia nada)
export async function verificarNoPortal(notaId: string, clinicaId: string) {
  const [nota, cfg, clinica] = await Promise.all([prisma.notaFiscal.findFirst({ where: { id: notaId, clinicaId } }), prisma.configFiscal.findUnique({ where: { clinicaId } }), prisma.clinica.findUnique({ where: { id: clinicaId } })]);
  if (!nota || !cfg || !clinica) throw new ErroFiscal("NOTA_NAO_ENCONTRADA", "Nota não encontrada.", 404);
  if (!nota.numero || !nota.serie) throw new ErroFiscal("SEM_NUMERO", "Esta nota ainda não tem número reservado: não há o que verificar.");
  if (simulando(nota.ambiente)) return { existe: false, status: 0, leitura: "Modo de simulação: não há Portal para consultar." };
  const cert = await carregarCertificadoDaClinica(clinicaId).catch((e) => { throw new ErroFiscal("SEM_CERTIFICADO", e instanceof Error ? e.message : "Sem certificado."); });
  const idDps = montarIdDps({ cLocEmi: cfg.codigoMunicipioIbge ?? "", cnpj: clinica.cnpj ?? "", serie: nota.serie, nDPS: nota.numero });
  const r = await dpsJaEnviada({ idDps, cert, ambiente: nota.ambiente === "PRODUCAO" ? "producao" : "homologacao" });
  return { ...r, leitura: r.existe ? "A DPS está no Portal Nacional. Localize a NFS-e no portal e informe a chave de acesso em “Marcar como emitida”." : "O Portal não tem esta DPS: o envio não chegou. Pode emitir de novo (será usado um novo número)." };
}

// A nota existe no Portal mas o sistema não soube: o usuário informa a chave e a nota passa a EMITIDA
export async function marcarComoEmitida(notaId: string, clinicaId: string, chaveAcesso: string, numeroNfse?: string) {
  const nota = await prisma.notaFiscal.findFirst({ where: { id: notaId, clinicaId } });
  if (!nota) throw new ErroFiscal("NOTA_NAO_ENCONTRADA", "Nota não encontrada.", 404);
  if (!["PENDENTE", "REJEITADA", "RASCUNHO"].includes(nota.status)) throw new ErroFiscal("STATUS", "Só notas pendentes, rejeitadas ou rascunhos podem ser marcadas como emitidas.");
  if (!/^\d{50}$/.test(chaveAcesso.replace(/\s/g, ""))) throw new ErroFiscal("CHAVE_INVALIDA", "A chave de acesso da NFS-e tem 50 dígitos.", 400);
  return prisma.notaFiscal.update({ where: { id: nota.id }, data: { status: "EMITIDA", chaveAcesso: chaveAcesso.replace(/\s/g, ""), numeroNfse: numeroNfse ?? null, emitidaEm: new Date(), erro: null } });
}

export async function excluirRascunho(notaId: string, clinicaId: string) {
  const nota = await prisma.notaFiscal.findFirst({ where: { id: notaId, clinicaId } });
  if (!nota) throw new ErroFiscal("NOTA_NAO_ENCONTRADA", "Nota não encontrada.", 404);
  if (nota.status !== "RASCUNHO") throw new ErroFiscal("STATUS", "Só rascunhos podem ser excluídos. Nota com número reservado fica no histórico.");
  await prisma.$transaction([prisma.cobranca.updateMany({ where: { notaFiscalId: nota.id }, data: { notaFiscalId: null } }), prisma.notaFiscal.delete({ where: { id: nota.id } })]);
}

// ---------- rascunhos do mês, segundo a regra de cada paciente/convênio ----------
export async function gerarRascunhosDoMes(clinicaId: string, mes: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(mes);
  if (!m) throw new ErroFiscal("MES_INVALIDO", "Informe o mês no formato AAAA-MM.", 400);
  const cfg = await prisma.configFiscal.findUnique({ where: { clinicaId } });
  if (!cfg) throw new ErroFiscal("SEM_CONFIG", "Preencha e salve os dados fiscais primeiro.");
  const intervalo = { gte: new Date(Date.UTC(+m[1], +m[2] - 1, 1)), lt: new Date(Date.UTC(+m[1], +m[2], 1)) };
  const cobrancas = await prisma.cobranca.findMany({ where: { clinicaId, status: { not: "CANCELADA" }, notaFiscalId: null, vencimento: intervalo }, include: { sessao: true, paciente: true, convenio: true }, orderBy: { vencimento: "asc" } });
  const criadas: Array<{ id: string; tomador: string; valor: number; origem: string }> = [];
  const puladas: Array<{ cobrancaId: string; paciente: string; motivo: string }> = [];
  const lotes = new Map<string, CobrancaCompleta[]>();
  for (const c of cobrancas) {
    const regra = regraDeEmissao(cfg as unknown as PadraoFiscal, c.paciente, c.convenio);
    const pula = (motivo: string) => puladas.push({ cobrancaId: c.id, paciente: c.paciente.nome, motivo });
    if (!regra.emite) { pula("paciente marcado para não emitir nota"); continue; }
    if (regra.modo === "CONVENIO_LOTE_MENSAL") { lotes.set(c.convenioId!, [...(lotes.get(c.convenioId!) ?? []), c]); continue; }
    if (regra.modo === "POR_LAUDO" || regra.modo === "MANUAL") { pula(regra.modo === "POR_LAUDO" ? "nota por laudo: escolha as cobranças do laudo (sinal e término) e prepare à mão" : "emissão manual para este paciente"); continue; }
    if (cfg.exigeDataPagamento && !c.convenioId && (c.status !== "PAGA" || !c.pagoEm)) { pula("aguardando o pagamento"); continue; }
    try { const n = await criarRascunho(clinicaId, [c.id]); criadas.push({ id: n.id, tomador: n.tomadorNome, valor: Number(n.valor), origem: n.origem }); } catch (e) { pula(e instanceof Error ? e.message : "erro"); }
  }
  for (const grupo of lotes.values()) {
    try { const n = await criarRascunhoDeLote(clinicaId, grupo.map((c) => c.id)); criadas.push({ id: n.id, tomador: n.tomadorNome, valor: Number(n.valor), origem: n.origem }); } catch (e) { for (const c of grupo) puladas.push({ cobrancaId: c.id, paciente: c.paciente.nome, motivo: e instanceof Error ? e.message : "erro" }); }
  }
  return { criadas, puladas };
}

// Gancho do financeiro: ao lançar a cobrança ou dar baixa, prepara (e, com a emissão ativa, emite) a nota de quem pediu isso no cadastro.
// Nunca derruba a operação financeira: qualquer falha aqui é registrada e ignorada.
export async function aposEventoFinanceiro(cobrancaId: string, evento: "COBRANCA" | "BAIXA"): Promise<void> {
  try {
    const c = await prisma.cobranca.findUnique({ where: { id: cobrancaId }, include: { sessao: true, paciente: true, convenio: true } });
    if (!c || c.notaFiscalId || c.status === "CANCELADA") return;
    const cfg = await prisma.configFiscal.findUnique({ where: { clinicaId: c.clinicaId } });
    if (!cfg) return;
    const regra = regraDeEmissao(cfg as unknown as PadraoFiscal, c.paciente, c.convenio);
    if (!regra.emite || !["POR_SESSAO", "CONVENIO_INDIVIDUAL"].includes(regra.modo)) return; // por laudo, lote e manual são preparados à mão
    if (regra.quando !== (evento === "BAIXA" ? "NA_BAIXA" : "NA_COBRANCA")) return;
    const nota = await criarRascunho(c.clinicaId, [c.id]);
    if (cfg.emissaoAtiva) await emitirNota(nota.id, c.clinicaId).catch((e) => console.error("[fiscal] emissão automática não concluída:", e instanceof Error ? e.message : e));
  } catch (e) {
    console.error("[fiscal] gancho do financeiro:", e instanceof Error ? e.message : e);
  }
}
