import { create } from "xmlbuilder2";

// Monta o XML da DPS (Declaração de Prestação de Serviços), que o Emissor Nacional transforma em NFS-e.
// Porte do montador já validado em produção restrita no sistema Infinity. Layout: Manual de Integração Webservice NFS-e Padrão Nacional v1.01
// (seção 10.3). A ORDEM DOS ELEMENTOS IMPORTA: o schema é uma sequence, e campo certo em posição errada é rejeição sem dizer qual campo.
//
// - `cTribNac` (6 dígitos) é o código de tributação NACIONAL (não o código de serviço do município); `cNBS` (9 dígitos) vai à parte.
// - A inscrição municipal do prestador é obrigatória. Nome e endereço do prestador NÃO vão na DPS (vêm do cadastro nacional).
// - Empresa do Simples não informa alíquota de ISS nem calcula o imposto; informar a alíquota é erro de layout, exceto com retenção na fonte.
// - Este módulo não assina, não comprime e não envia: devolve texto, testável sem certificado e sem rede.

const NAMESPACE = "http://www.sped.fazenda.gov.br/nfse";
// Leiaute da DPS. A 1.01 (pacote de esquemas de 09/02/2026) é a vigente e substituiu a 1.00; a ORDEM de alguns elementos mudou entre as duas
// (no ISS, pAliq vem ANTES de tpRetISSQN na 1.00 e DEPOIS na 1.01). Padrão: 1.01; NFSE_LEIAUTE=1.00 volta ao leiaute anterior.
export type VersaoLeiaute = "1.00" | "1.01";
export const LEIAUTE_PADRAO: VersaoLeiaute = process.env.NFSE_LEIAUTE === "1.00" ? "1.00" : "1.01";

export interface PrestadorDps {
  cnpj: string; inscricaoMunicipal: string; codigoMunicipioIbge: string; telefone?: string | null; email?: string | null;
  opSimplesNacional: "1" | "2" | "3"; // 1 = não optante, 2 = MEI, 3 = ME/EPP
  regApuracaoSn?: string; regimeEspecial?: string; ambiente: "homologacao" | "producao";
  aliquotaIssPercentual?: number | null; // só vai na DPS com retenção na fonte
}
export interface TomadorDps {
  documento?: string | null; nome: string; inscricaoMunicipal?: string | null;
  logradouro?: string | null; numero?: string | null; complemento?: string | null; bairro?: string | null; codigoMunicipioIbge?: string | null; cep?: string | null;
  telefone?: string | null; email?: string | null;
}
export interface EntradaDps {
  prestador: PrestadorDps; tomador?: TomadorDps | null; numero: number; serie: string;
  valorServico: number; descricao: string; cTribNac: string; cNBS?: string | null; cTribMun?: string | null;
  dataEmissao?: Date; dataCompetencia?: Date | string | null; codigoMunicipioPrestacao?: string | null; issRetido?: boolean;
  percentualTotalTributos?: number | null; informacoesComplementares?: string | null;
  versaoAplicativo?: string; fuso?: string; versaoLeiaute?: VersaoLeiaute;
}
export interface DpsMontada { xml: string; idDps: string; numero: number; serie: string; valorServico: number; ambiente: "homologacao" | "producao" }

export class ErroDps extends Error { constructor(public codigo: string, mensagem: string) { super(mensagem); } }

const digitos = (v: unknown) => String(v ?? "").replace(/\D/g, "");
const texto = (v: unknown, max?: number) => { const s = String(v ?? "").replace(/\s+/g, " ").trim(); return max && s.length > max ? s.slice(0, max) : s; };
const dec = (v: unknown, casas = 2) => { const n = Number(v || 0); return (Number.isFinite(n) ? n : 0).toFixed(casas); };
const zeros = (v: unknown, tam: number) => digitos(v).padStart(tam, "0").slice(-tam);

// Data e hora com o fuso do local (padrão: São Paulo), no formato AAAA-MM-DDThh:mm:ssTZD. `toISOString()` daria Z e a nota sairia deslocada;
// e o servidor (Render) roda em UTC, então o fuso é sempre explícito, nunca o da máquina.
export function dataHoraComFuso(data: Date, fuso = "America/Sao_Paulo"): string {
  const partes = (d: Date, tz: string) => Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(d).map((p) => [p.type, p.value])) as Record<string, string>;
  const l = partes(data, fuso);
  const comoUtc = Date.UTC(+l.year, +l.month - 1, +l.day, +l.hour, +l.minute, +l.second);
  const minutos = Math.round((comoUtc - Math.floor(data.getTime() / 1000) * 1000) / 60000);
  const sinal = minutos >= 0 ? "+" : "-";
  const abs = Math.abs(minutos);
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${l.year}-${l.month}-${l.day}T${l.hour}:${l.minute}:${l.second}${sinal}${p2(Math.floor(abs / 60))}:${p2(abs % 60)}`;
}

// AAAA-MM-DD: texto já neste formato passa direto; Date de coluna DATE (meia-noite UTC) usa as partes UTC.
const dataIso = (d: Date | string | null | undefined) => (!d ? null : typeof d === "string" ? d.slice(0, 10) : d.toISOString().slice(0, 10));

// Id da DPS: "DPS" + cLocEmi(7) + tpInsc(1) + inscrição(14) + série(5) + nDPS(15).
// ATENÇÃO: composição documentada em várias implementações, mas não explícita na tabela de layout consultada. VALIDAR contra o XSD oficial
// na primeira chamada em homologação: Id errado é rejeição na porta.
export function montarIdDps(a: { cLocEmi: string; cnpj?: string; cpf?: string; serie: string; nDPS: number }): string {
  const tpInsc = a.cnpj ? "2" : "1"; // 1 = CPF, 2 = CNPJ
  return `DPS${zeros(a.cLocEmi, 7)}${tpInsc}${zeros(a.cnpj || a.cpf, 14)}${zeros(a.serie, 5)}${zeros(a.nDPS, 15)}`;
}

function prest(p: PrestadorDps) {
  const r: Record<string, unknown> = { CNPJ: zeros(p.cnpj, 14), IM: texto(p.inscricaoMunicipal, 15) };
  if (digitos(p.telefone)) r.fone = digitos(p.telefone);
  if (texto(p.email)) r.email = texto(p.email, 80);
  r.regTrib = {
    opSimpNac: p.opSimplesNacional,
    // Só existe para ME/EPP: para não optante e MEI o campo não cabe, e mandar campo que não cabe é rejeição.
    ...(p.opSimplesNacional === "3" ? { regApTribSN: p.regApuracaoSn || "1" } : {}),
    regEspTrib: p.regimeEspecial ?? "0",
  };
  return r;
}

function toma(t: TomadorDps) {
  const doc = digitos(t.documento);
  const r: Record<string, unknown> = {};
  if (doc.length === 14) r.CNPJ = doc; else if (doc.length === 11) r.CPF = doc;
  if (texto(t.inscricaoMunicipal)) r.IM = texto(t.inscricaoMunicipal, 15);
  r.xNome = texto(t.nome, 150);
  if (texto(t.logradouro) && digitos(t.codigoMunicipioIbge)) {
    r.end = {
      endNac: { cMun: zeros(t.codigoMunicipioIbge, 7), CEP: zeros(t.cep, 8) },
      xLgr: texto(t.logradouro, 255), nro: texto(t.numero || "S/N", 60),
      ...(texto(t.complemento) ? { xCpl: texto(t.complemento, 156) } : {}), xBairro: texto(t.bairro, 60),
    };
  }
  if (digitos(t.telefone)) r.fone = digitos(t.telefone);
  if (texto(t.email)) r.email = texto(t.email, 80);
  return r;
}

export function montarDps(e: EntradaDps): DpsMontada {
  if (digitos(e.prestador.cnpj).length !== 14) throw new ErroDps("SEM_CNPJ", "CNPJ do prestador é obrigatório (14 dígitos).");
  if (!texto(e.prestador.inscricaoMunicipal)) throw new ErroDps("SEM_IM", "A inscrição municipal do prestador é obrigatória na DPS.");
  if (!digitos(e.prestador.codigoMunicipioIbge)) throw new ErroDps("SEM_MUNICIPIO", "O código IBGE do município do prestador é obrigatório.");
  if (digitos(e.cTribNac).length < 6) throw new ErroDps("SEM_CTRIBNAC", "Código de tributação nacional (6 dígitos, ex.: 04.16.01) é obrigatório: não é o código de serviço do município.");
  if (!texto(e.descricao)) throw new ErroDps("SEM_DESCRICAO", "A descrição do serviço é obrigatória.");
  if (!(Number(e.valorServico) > 0)) throw new ErroDps("VALOR_INVALIDO", `Valor do serviço inválido (${e.valorServico}).`);
  if (!Number.isInteger(e.numero) || e.numero < 1) throw new ErroDps("NUMERO_INVALIDO", "Número da DPS inválido.");

  const cLocEmi = zeros(e.prestador.codigoMunicipioIbge, 7);
  const idDps = montarIdDps({ cLocEmi, cnpj: e.prestador.cnpj, serie: e.serie, nDPS: e.numero });
  const emissao = e.dataEmissao ?? new Date();
  const fuso = e.fuso ?? "America/Sao_Paulo";
  const homolog = e.prestador.ambiente !== "producao";

  // tributação: sem retenção, nada de alíquota (erro de layout para o Simples); a carga total vai em pTotTribSN, ou indTotTrib = 0 se não informada
  const versao = e.versaoLeiaute ?? LEIAUTE_PADRAO;
  const pAliq = e.issRetido && Number(e.prestador.aliquotaIssPercentual) > 0 ? dec(e.prestador.aliquotaIssPercentual, 2) : null;
  const tribMun: Record<string, unknown> = versao === "1.00"
    ? { tribISSQN: "1", ...(pAliq ? { pAliq } : {}), tpRetISSQN: e.issRetido ? "2" : "1" }
    : { tribISSQN: "1", tpRetISSQN: e.issRetido ? "2" : "1", ...(pAliq ? { pAliq } : {}) };
  const totTrib = e.percentualTotalTributos != null ? { pTotTribSN: dec(e.percentualTotalTributos, 2) } : { indTotTrib: "0" };

  const infDPS: Record<string, unknown> = {
    "@Id": idDps, tpAmb: homolog ? "2" : "1", dhEmi: dataHoraComFuso(emissao, fuso), verAplic: texto(e.versaoAplicativo ?? "NeuroLogic", 20),
    serie: String(e.serie), nDPS: String(e.numero), dCompet: dataIso(e.dataCompetencia) ?? dataHoraComFuso(emissao, fuso).slice(0, 10),
    tpEmit: "1", cLocEmi, prest: prest(e.prestador),
  };
  if (e.tomador) infDPS.toma = toma(e.tomador);
  infDPS.serv = {
    locPrest: { cLocPrestacao: zeros(e.codigoMunicipioPrestacao || e.prestador.codigoMunicipioIbge, 7) },
    cServ: { cTribNac: zeros(e.cTribNac, 6), ...(e.cTribMun ? { cTribMun: zeros(e.cTribMun, 3) } : {}), xDescServ: texto(e.descricao, 2000), ...(e.cNBS ? { cNBS: zeros(e.cNBS, 9) } : {}) },
    ...(texto(e.informacoesComplementares) ? { infoCompl: { xInfComp: texto(e.informacoesComplementares, 2000) } } : {}),
  };
  infDPS.valores = { vServPrest: { vServ: dec(e.valorServico) }, trib: { tribMun, totTrib } };

  const doc = create({ version: "1.0", encoding: "UTF-8" }, { DPS: { "@xmlns": NAMESPACE, "@versao": versao, infDPS } });
  return { xml: doc.end({ prettyPrint: false }), idDps, numero: e.numero, serie: e.serie, valorServico: Math.round(Number(e.valorServico) * 100) / 100, ambiente: homolog ? "homologacao" : "producao" };
}
