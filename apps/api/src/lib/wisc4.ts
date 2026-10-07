// Cálculo do WISC-IV espelhando a planilha da psicóloga (aba WISC-IV + WISC-NORMAS). Função pura.
// Dados normativos: docs/testes/WISC-IV-planilha.json (gerado por scripts/gerar-wisc4-planilha.mjs).
//
// Fluxo (igual ao da planilha):
//   1. idade em DIAS = anos×365 + meses×30 + dias (mês de 30 dias) → faixa de 4 meses (33 faixas, 6:0 a 16:11);
//   2. bruto → ponderado pela tabela da faixa (+ Z, ponto composto, percentil, classificação por subteste);
//   3. soma dos ponderados de cada índice (com os substitutos da planilha) → composto, percentil, IC 90/95%;
//      QI Total = soma dos 4 índices; GAI = ICV + IOP; CPI = IMO + IVP;
//   4. análise avançada (interpretabilidade, facilidade/dificuldade, valor crítico, raro) — mesma lógica do WAIS-III.
//
// Diferença deliberada em relação à planilha: ela soma o que houver e converte mesmo com subteste faltando; aqui um
// índice só é calculado quando TODOS os subtestes que o compõem foram lançados (com a substituição da planilha: o
// suplementar entra no lugar de UM principal que falte).
import type { FaixaConversao, ResultadoPorCampo } from "./motorCalculo";
import { arredondar, degrau, normalAcumulada } from "./wais3";

type Linha = { min: number; max?: number; composto: string | number | null; percentil: string | number | null; ic90: string | number | null; ic95: string | number | null };

export interface Wisc4Planilha {
  tipo: "wisc4_planilha";
  bandasEtarias: Array<{ rotulo: string; diasMin: number }>;
  a1: Record<string, Record<string, Array<{ min: number; max?: number; ponderado: number | null }>>>;
  composicao: Record<string, string[]>;
  substituicoes: Array<{ subteste: string; indice: string; entraSe: string; de: string[] }>;
  somaParaComposto: Record<string, Linha[]>;
  valoresCriticos: Array<{ anos: number | null; rotulo: string; icv: number | null; iop: number | null; imo: number | null; ivp: number | null }>;
  limitesRaro: Record<string, number>;
  discrepancias?: DadosDiscrepancias;
  facilidades?: DadosFacilidade[];
  processo?: DadosProcesso;
  clusters?: DadosClusters;
  habilidades?: DadosHabilidadeWisc[];
  idadeMental?: DadosIdadeMental;
}

export interface DadosIdadeMental {
  subtestes: Record<string, {
    tabelas: Array<{ diasMax: number | null; tabela: Array<{ min: number; meses: number | null }> }>;
    limites: Array<{ diasMax?: number; diasMin?: number; inf: number; sup: number }>;
  }>;
}

export interface DadosHabilidadeWisc {
  numero: number;
  nome: string;
  grupo: string;
  subtestes: string[];
  n: number;
  k: number | null;
  fraquezaDefeituosa: boolean;
}

export interface DadosClusters {
  clusters: Array<{ chave: string; sigla: string; rotulo: string; linha: number; subtestes: string[]; tabela: Array<{ min: number; composto: number | null; ic95: string | null; percentil: number | null }> }>;
  comparacoes: Array<{ linha: number; a: string; b: string; valorCritico: number; tituloEsquerda: string; tituloDireita: string; hipoteseMaior: string | null; hipoteseMenor: string | null; sugestaoMaior: string | null; sugestaoMenor: string | null }>;
}

export interface DadosFacilidade {
  chave: string;
  linha: number;
  criticos: Array<number | null>; // por código L100: 1 = 90%/não, 2 = 95%/não, 3 = 90%/sim, 4 = 95%/sim
  regras: Array<{ op: string; n: number; niveis: number[]; texto: string }>;
}
type PorIdade<T> = T & { diasMin: number };
type TabelaFreqIdade = PorIdade<{ chaves: number[]; valores: Array<number | null> }>;
type ZIdade = PorIdade<{ media: number | null; dp: number | null }>;
export interface DadosProcesso {
  ponderado: Record<string, Array<PorIdade<{ tabela: Array<{ min: number; ponderado: number | null }> }>>>;
  udio: Record<string, { freq: TabelaFreqIdade[]; z: ZIdade[] }>;
  difUdio: { freq: TabelaFreqIdade[]; z: ZIdade[] };
  comparacoes: Array<{ linha: number; rotulo: string; a: string; b: string; criticos: Array<number | null>; frequencia: { chaves: number[]; neg: Array<number | null>; pos: Array<number | null> } }>;
}

// Chaves de entrada dos escores de processo (não são subtestes das tabelas A.1)
export const CHAVES_PROCESSO_WISC = ["cusb", "diod", "dioi", "caa", "cae", "udiod", "udioi"] as const;

type TabelaFreq = { chaves: number[]; valores: Array<number | null> };
type FreqSinais = { neg: TabelaFreq; pos: TabelaFreq };
export interface DadosDiscrepancias {
  indices: Array<{ linha: number; rotulo: string; a: string; b: string; criticos: Array<{ diasMin: number; v: number[] }>; frequencia: Record<string, FreqSinais> }>;
  subtestes: Array<{ linha: number; grupo: string; rotulo: string; a: string; b: string; criticos: number[]; frequencia?: FreqSinais }>;
}

// Opções da tela da planilha: H36 (intervalo de confiança) e J62 (base de comparação).
export interface OpcoesWisc4 {
  confianca?: "90%" | "95%";
  base?: "Amostra Geral" | "Nível de Habilidade";
}

type Bruto = Record<string, number>;

// Anos, meses e dias completos entre as datas (como DATEDIF "y", "ym", "md" da planilha).
export function decomporIdade(nascimento: Date, referencia: Date): { anos: number; meses: number; dias: number } {
  let anos = referencia.getUTCFullYear() - nascimento.getUTCFullYear();
  let meses = referencia.getUTCMonth() - nascimento.getUTCMonth();
  let dias = referencia.getUTCDate() - nascimento.getUTCDate();
  if (dias < 0) {
    meses -= 1;
    dias += new Date(Date.UTC(referencia.getUTCFullYear(), referencia.getUTCMonth(), 0)).getUTCDate();
  }
  if (meses < 0) {
    anos -= 1;
    meses += 12;
  }
  return { anos, meses, dias };
}

// Convenção da planilha (S3:S5 = 365, 30, 1): idade em dias = anos×365 + meses×30 + dias.
export function idadeWisc4EmDias(nascimento: Date, referencia: Date): number {
  const { anos, meses, dias } = decomporIdade(nascimento, referencia);
  return anos * 365 + meses * 30 + dias;
}

// Classificação de UM SUBTESTE (coluna O): pelo ponderado.
export function classificarPonderadoWisc(p: number): string {
  if (p >= 16) return "Muito Superior";
  if (p >= 14) return "Superior";
  if (p >= 12) return "Média Superior";
  if (p >= 8) return "Média";
  if (p >= 6) return "Média Inferior";
  if (p >= 4) return "Limítrofe";
  return "Deficitário";
}

// Classificação dos ÍNDICES/QI (coluna I): pelo PONTO COMPOSTO (diferente do WAIS-III, que usa o percentil).
export function classificarCompostoWisc(composto: number): string {
  if (composto >= 130) return "Muito Superior";
  if (composto >= 120) return "Superior";
  if (composto >= 110) return "Média Superior";
  if (composto >= 90) return "Média";
  if (composto >= 80) return "Média Inferior";
  if (composto >= 70) return "Limítrofe";
  return "Deficitário";
}

const numeroOuNull = (v: unknown): number | null => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace(",", ".").replace(/[<>\s]/g, ""));
    if (v.trim() !== "" && !Number.isNaN(n)) return n;
  }
  return null;
};

const INDICES_FATORIAIS = ["icv", "iop", "imo", "ivp"] as const;
const AVISO_QIT =
  "Atenção! Talvez o 'Q.I.' não represente adequadamente o desempenho cognitivo do Paciente, pois há uma discrepância ≥ a 23 pts compostos entre o MAIOR e o MENOR Índice. Considere a possibilidade de analisar o GAI ou CPI e os Clusters.";
const AVISO_GAI_DISCREPANCIA =
  "Atenção! Talvez o GAI não represente adequadamente o desempenho cognitivo do paciente, pois há uma discrepância ≥ 23 pts compostos entre o ICV e o IOP. Considere a possibilidade de analisar mais atentamente os Clusters.";
const AVISO_GAI_SUBTESTES =
  "Atenção! Apesar de não haver uma discrepância ≥ 23 pts compostos entre o ICV e o IOP, há uma discrepância ≥ a 5 pts compostos entre os Subtestes que compoem os Índices. Considere a possibilidade de analisar mais atentamente os Clusters.";
const AVISO_CPI_DISCREPANCIA =
  "Atenção! Talvez o CPI não represente adequadamente o desempenho cognitivo do paciente, pois há uma discrepância ≥ 23 pts compostos entre o IMO e o IVP. Considere a possibilidade de analisar mais atentamente os Clusters.";
const AVISO_CPI_SUBTESTES =
  "Atenção! Apesar de não haver uma discrepância ≥ 23 pts compostos entre o IMO e o IVP, há uma discrepância ≥ 5 pts poderados entre os Subtestes que compôe os Índices. Considere a possibilidade de analisar mais atentamente os Clusters.";

function converterSoma(dados: Wisc4Planilha, indice: string, soma: number): FaixaConversao | null {
  const linha = degrau(dados.somaParaComposto[indice] ?? [], soma);
  const composto = numeroOuNull(linha?.composto);
  if (!linha || composto === null) return null;
  // Percentil: números viram número; "<0,1" e ">99,9" ficam como TEXTO (o sinal faz parte da informação).
  const percentilTexto = linha.percentil;
  const percentil = typeof percentilTexto === "string" && /^\s*[<>]/.test(percentilTexto) ? percentilTexto : numeroOuNull(percentilTexto) ?? percentilTexto;
  return {
    composto,
    percentil: percentil ?? undefined,
    ic90: linha.ic90 ?? undefined,
    ic95: linha.ic95 ?? undefined,
    classificacao: classificarCompostoWisc(composto),
  } as FaixaConversao;
}

export function calcularWisc4(brutos: Bruto, dados: Wisc4Planilha, nascimento: Date, referencia: Date, opcoes: OpcoesWisc4 = {}): { modo: "por_campo"; porCampo: Record<string, ResultadoPorCampo>; extras: Record<string, unknown> } {
  const porCampo: Record<string, ResultadoPorCampo> = {};
  const { anos } = decomporIdade(nascimento, referencia);
  const dias = idadeWisc4EmDias(nascimento, referencia);
  const banda = [...dados.bandasEtarias].reverse().find((b) => dias >= b.diasMin) ?? null;
  // A planilha não valida a idade (usa a última faixa para qualquer idade acima de 16:8); o sistema só calcula até 16:11.
  if (anos > 16) return { modo: "por_campo", porCampo: Object.fromEntries(Object.entries(brutos).map(([k, v]) => [k, { valorBruto: v, faixa: null }])), extras: { foraDaFaixa: true } };

  // 1) ponderados por subteste (colunas F, L, M, N, O da planilha)
  const ponderado: Record<string, number | null> = {};
  for (const [chave, bruto] of Object.entries(brutos)) {
    if ((CHAVES_PROCESSO_WISC as readonly string[]).includes(chave)) continue;
    const tabela = banda ? dados.a1[banda.rotulo]?.[chave] : undefined;
    const faixa = tabela ? degrau(tabela, bruto) : null;
    const p = faixa?.ponderado ?? null;
    ponderado[chave] = p;
    const extras =
      p !== null && p > 0
        ? { z: arredondar((p - 10) / 3, 3), pontoComposto: arredondar(((p - 10) / 3) * 15 + 100, 2), percentil: arredondar(normalAcumulada((p - 10) / 3) * 100, 3), classificacao: classificarPonderadoWisc(p) }
        : {};
    porCampo[chave] = { valorBruto: bruto, faixa: faixa ? ({ ...faixa, ...extras } as FaixaConversao) : null };
  }
  const tem = (c: string) => brutos[c] !== undefined && ponderado[c] !== null && ponderado[c] !== undefined;
  const p = (c: string) => ponderado[c] as number;

  // 2) somas por índice, com a substituição da planilha (suplementar no lugar de UM principal que falte)
  const somas: Record<string, number | null> = {};
  const membros: Record<string, number[]> = {};
  for (const indice of INDICES_FATORIAIS) {
    const principais = dados.composicao[indice] ?? [];
    const presentes = principais.filter(tem);
    const faltam = principais.length - presentes.length;
    const sub = dados.substituicoes.find((s) => s.indice === indice);
    let valores = presentes.map(p);
    if (faltam === 1 && sub && tem(sub.subteste)) valores = [...valores, p(sub.subteste)];
    else if (faltam > 0) {
      somas[indice] = null;
      membros[indice] = [];
      continue;
    }
    membros[indice] = valores;
    somas[indice] = valores.reduce((a, v) => a + v, 0);
  }
  const todosOsQuatro = INDICES_FATORIAIS.every((i) => somas[i] !== null);
  somas.qit = todosOsQuatro ? INDICES_FATORIAIS.reduce((a, i) => a + (somas[i] as number), 0) : null;
  somas.gai = somas.icv !== null && somas.iop !== null ? somas.icv + somas.iop : null;
  somas.cpi = somas.imo !== null && somas.ivp !== null ? somas.imo + somas.ivp : null;

  for (const [indice, soma] of Object.entries(somas)) {
    if (soma === null) {
      porCampo[indice] = { valorBruto: null, faixa: null };
      continue;
    }
    let faixa = converterSoma(dados, indice, soma);
    if ((INDICES_FATORIAIS as readonly string[]).includes(indice)) {
      const vs = membros[indice];
      const diferenca = Math.max(...vs) - Math.min(...vs);
      faixa = { ...(faixa ?? {}), mpp: arredondar(soma / vs.length, 2), diferenca, homogeneo: diferenca < 5 ? "SIM" : "NÃO" } as FaixaConversao;
    }
    porCampo[indice] = { valorBruto: soma, faixa };
  }

  analisarAvancadoWisc(porCampo, dados, anos);
  const extras: Record<string, unknown> = {};
  if (dados.discrepancias) {
    const d = analisarDiscrepanciasWisc(dados.discrepancias, porCampo, ponderado, dias, opcoes);
    extras.discrepanciasIndices = d.indices;
    extras.discrepanciasSubtestes = d.subtestes;
    if (dados.facilidades) extras.facilidades = analisarFacilidadesWisc(dados.facilidades, ponderado, somas, d.indices, opcoes);
  }
  extras.intraindividual = analisarIntraindividualWisc(ponderado, somas, tem);
  if (dados.idadeMental) extras.idadeMental = analisarIdadeMentalWisc(dados.idadeMental, brutos, dias, porCampo);
  if (dados.habilidades) extras.habilidades = analisarHabilidadesWisc(dados.habilidades, ponderado, somas, tem);
  if (dados.clusters) {
    const c = analisarClustersWisc(dados.clusters, ponderado, porCampo);
    extras.clusters = c.clusters;
    extras.comparacoesClinicas = c.comparacoes;
    extras.gaiCpi = c.gaiCpi;
  }
  if (dados.processo) {
    const pr = analisarProcessoWisc(dados.processo, brutos, ponderado, porCampo, dias, opcoes);
    extras.comparacoesProcesso = pr.comparacoes;
    extras.diferencaUdio = pr.diferencaUdio;
  }
  return { modo: "por_campo", porCampo, extras };
}

// Comparações entre índices (linhas 70-75) e entre subtestes (linhas 78-93). O valor crítico vem da tabela por idade; o código
// L64 da planilha escolhe a coluna: 1 = 90%/nível, 2 = 95%/nível, 3 = 90%/amostra, 4 = 95%/amostra (subtestes só distinguem 90/95).
// A frequência acumulada só existe quando a diferença é significativa; a leitura é "maior chave <= |diferença|" (LOOKUP).
function analisarDiscrepanciasWisc(d: DadosDiscrepancias, porCampo: Record<string, ResultadoPorCampo>, ponderado: Record<string, number | null>, dias: number, opcoes: OpcoesWisc4) {
  const confianca = opcoes.confianca ?? "95%";
  const base = opcoes.base ?? "Amostra Geral";
  const l64 = base === "Nível de Habilidade" ? (confianca === "90%" ? 1 : 2) : confianca === "90%" ? 3 : 4;
  const composto = (k: string) => (typeof porCampo[k]?.faixa?.composto === "number" ? (porCampo[k].faixa!.composto as number) : null);
  const qit = composto("qit");
  const texto = (tab: TabelaFreq, x: number) => {
    const i = degrau(tab.chaves.map((k, idx) => ({ min: k, idx })), x)?.idx;
    if (i === undefined) return "";
    const v = tab.valores[i];
    return v === null ? "%" : `${String(v).replace(".", ",")}%`;
  };

  const indices = d.indices.flatMap((par) => {
    const ca = composto(par.a);
    const cb = composto(par.b);
    if (ca === null || cb === null) return [];
    const faixaIdade = [...par.criticos].reverse().find((c) => dias >= c.diasMin);
    if (!faixaIdade) return [];
    const diferenca = ca - cb;
    const valorCritico = faixaIdade.v[l64 - 1];
    const significativa = Math.abs(diferenca) >= valorCritico;
    let frequencia = "";
    if (significativa && diferenca !== 0) {
      // Em "Nível de Habilidade" a tabela depende do QI Total; sem QIT a planilha cai num ramo arbitrário, então não informamos.
      const grupo = base === "Amostra Geral" ? "amostra" : qit === null ? null : qit <= 79 ? "ate79" : qit <= 89 ? "ate89" : qit <= 109 ? "ate109" : qit <= 119 ? "ate119" : "a120";
      const tab = grupo ? par.frequencia[grupo]?.[diferenca > 0 ? "pos" : "neg"] : undefined;
      if (tab) frequencia = texto(tab, Math.abs(diferenca));
    }
    return [{ par: par.rotulo, a: par.a, b: par.b, pontosA: ca, pontosB: cb, diferenca, valorCritico, significativa: significativa ? "Sim" : "Não", frequencia }];
  });

  const subtestes = d.subtestes.flatMap((par) => {
    const pa = ponderado[par.a];
    const pb = ponderado[par.b];
    if (pa === null || pa === undefined || pb === null || pb === undefined) return [];
    const diferenca = pa - pb;
    const valorCritico = par.criticos[(l64 - 1) % 2];
    const significativa = Math.abs(diferenca) >= valorCritico;
    let frequencia = "";
    if (significativa && diferenca !== 0 && par.frequencia) frequencia = texto(par.frequencia[diferenca < 0 ? "neg" : "pos"], Math.abs(diferenca));
    return [{ linha: par.linha, grupo: par.grupo, par: par.rotulo, a: par.a, b: par.b, pontosA: pa, pontosB: pb, diferenca, valorCritico, significativa: significativa ? "Sim" : "Não", frequencia }];
  });
  return { indices, subtestes };
}

// "Análise avançada" (colunas K-S das linhas 37-43). Mesma lógica do WAIS-III; aqui a coluna Recurso/Preocupação FUNCIONA na
// planilha (os rótulos abreviados "Fac. Norm." / "Fac. Indiv." coincidem entre as colunas), então é reproduzida.
function analisarAvancadoWisc(porCampo: Record<string, ResultadoPorCampo>, dados: Wisc4Planilha, anos: number) {
  const composto = (k: string) => (typeof porCampo[k]?.faixa?.composto === "number" ? (porCampo[k].faixa!.composto as number) : null);
  const compostos = INDICES_FATORIAIS.map(composto);
  const temOsQuatro = compostos.every((c) => c !== null);
  const media = temOsQuatro ? (compostos as number[]).reduce((a, c) => a + c, 0) / 4 : null;
  const linhaCritica = dados.valoresCriticos.find((v) => v.anos === anos);
  // Nos índices ICV e IOP a planilha usa "<" (e não "<=") no primeiro teste de rarefação: na igualdade exata o campo fica vazio.
  const estrito = new Set(["icv", "iop"]);

  for (const k of INDICES_FATORIAIS) {
    const c = composto(k);
    const faixa = porCampo[k]?.faixa;
    if (c === null || !faixa) continue;
    const interpretavel = faixa.homogeneo === "SIM";
    const dfNormativa = c < 85 ? "Dificuldade Normativa" : c < 115 ? "Média" : "Facilidade Normativa";
    const extras: Record<string, number | string> = { interpretavel: interpretavel ? "SIM" : "NÃO", dfNormativa };
    if (!interpretavel) {
      extras.observacao = "Não interpretável: há uma discrepância ≥ 5 pontos ponderados entre o MAIOR e o MENOR subteste que compõem o índice.";
    } else if (media !== null) {
      const dif = c - media;
      const vc = linhaCritica?.[k] ?? undefined;
      extras.mediaIndices = arredondar(media, 2);
      extras.diferencaMedia = arredondar(dif, 2);
      if (vc !== undefined) {
        const abs = Math.abs(dif);
        const limite = dados.limitesRaro[k];
        extras.valorCritico = vc;
        const dfIndividual = abs >= vc ? (dif > 0 ? "Facilidade Individual" : "Dificuldade Individual") : "";
        extras.dfIndividual = dfIndividual;
        const emLimite = abs === limite;
        const raro = abs > limite ? "Raro" : estrito.has(k) && emLimite ? "" : abs > vc ? "Não Raro" : "";
        extras.raro = raro;
        if (raro === "Raro" && dfIndividual === "Facilidade Individual" && dfNormativa === "Facilidade Normativa") extras.recursoPreocupacao = "Recurso";
        else if (raro === "Raro" && dfIndividual === "Dificuldade Individual" && dfNormativa === "Dificuldade Normativa") extras.recursoPreocupacao = "Preocupação";
      }
    }
    porCampo[k].faixa = { ...faixa, ...extras } as FaixaConversao;
  }

  const qit = porCampo.qit?.faixa;
  if (qit && temOsQuatro) {
    const amplitude = Math.max(...(compostos as number[])) - Math.min(...(compostos as number[]));
    porCampo.qit.faixa = { ...qit, interpretavel: amplitude >= 23 ? "NÃO" : "SIM", ...(amplitude >= 23 ? { aviso: AVISO_QIT } : {}) } as FaixaConversao;
  }
  const par = (chave: "gai" | "cpi", a: string, b: string, avisoDiscrepancia: string, avisoSubtestes: string) => {
    const f = porCampo[chave]?.faixa;
    const ca = composto(a);
    const cb = composto(b);
    if (!f || ca === null || cb === null) return;
    const discrepante = Math.abs(ca - cb) >= 23;
    const subtestes = porCampo[a].faixa?.homogeneo === "NÃO" || porCampo[b].faixa?.homogeneo === "NÃO";
    const aviso = discrepante ? avisoDiscrepancia : subtestes ? avisoSubtestes : "";
    porCampo[chave].faixa = { ...f, interpretavel: discrepante ? "NÃO" : "SIM", ...(aviso ? { aviso } : {}) } as FaixaConversao;
  };
  par("gai", "icv", "iop", AVISO_GAI_DISCREPANCIA, AVISO_GAI_SUBTESTES);
  par("cpi", "imo", "ivp", AVISO_CPI_DISCREPANCIA, AVISO_CPI_SUBTESTES);
}

// Facilidades e dificuldades por subteste (linhas 100-109): ponderado do subteste contra a média dos 10 principais (QI Total) ou, se
// ICV e IOP diferem significativamente (código L100 = 3/4), contra a média do próprio grupo (verbais: ICV/3; executivos: IOP/3) e só
// para os 6 subtestes verbais/executivos. A frequência acumulada vem de limites fixos sobre a diferença arredondada a 2 casas.
function analisarFacilidadesWisc(dados: DadosFacilidade[], ponderado: Record<string, number | null>, somas: Record<string, number | null>, indices: Array<{ par: string; significativa: string }>, opcoes: OpcoesWisc4) {
  if (somas.qit === null || somas.qit === undefined || somas.icv === null || somas.iop === null) return [];
  const parIcvIop = indices.find((i) => i.par === "ICV - IOP");
  if (!parIcvIop) return [];
  const confianca = opcoes.confianca ?? "95%";
  const l100 = parIcvIop.significativa === "Sim" ? (confianca === "90%" ? 3 : 4) : confianca === "90%" ? 1 : 2;
  const mediaTotal = somas.qit / 10;
  const mediaVerbal = somas.icv / 3;
  const mediaExecutiva = somas.iop / 3;
  const GRUPO: Record<string, number> = { cb: mediaExecutiva, cn: mediaExecutiva, rm: mediaExecutiva, sm: mediaVerbal, vc: mediaVerbal, co: mediaVerbal };
  const linhas: Array<Record<string, unknown>> = [];
  for (const d of dados) {
    const pond = ponderado[d.chave];
    if (pond === null || pond === undefined) continue;
    const media = l100 <= 2 ? mediaTotal : GRUPO[d.chave];
    if (media === undefined) continue;
    const diferenca = pond - media;
    const valorCritico = d.criticos[l100 - 1];
    if (valorCritico === null) continue;
    const significativa = Math.abs(diferenca) >= valorCritico;
    const fd = significativa ? (diferenca > 0 ? "F" : diferenca < 0 ? "D" : "") : "";
    let frequencia = "";
    if (fd) {
      const ab = Math.abs(arredondar(diferenca, 2));
      const regra = d.regras.find((r) => r.niveis.includes(l100) && (r.op === ">" ? ab > r.n : r.op === "=" ? ab === r.n : ab < r.n));
      frequencia = regra?.texto ?? "";
    }
    linhas.push({ chave: d.chave, linha: d.linha, ponderado: pond, media, diferenca, valorCritico, significativa: significativa ? "Sim" : "Não", facilidadeDificuldade: fd, frequencia });
  }
  return linhas;
}

// Escores de processo (linhas 116-140). Cada um vira um campo em porCampo (como um subteste): bruto → ponderado → Z/percentil/classificação;
// as maiores sequências de dígitos (UDIOD/UDIOI) usam frequência acumulada e Z por média/DP da faixa etária.
function analisarProcessoWisc(d: DadosProcesso, brutos: Bruto, ponderado: Record<string, number | null>, porCampo: Record<string, ResultadoPorCampo>, dias: number, opcoes: OpcoesWisc4) {
  const idade = <T extends { diasMin: number }>(lista: T[]) => [...lista].reverse().find((x) => dias >= x.diasMin);
  const texto = (v: number | null | undefined) => (v === null || v === undefined ? "%" : `${String(v).replace(".", ",")}%`);
  const classZ = (z: number, quirk = false) => (z >= 2 ? "Muito Superior" : z >= 1.333 ? "Superior" : z >= 0.666 ? "Média Superior" : z >= -0.667 ? "Média" : z >= (quirk ? -1.332 : -1.333) ? "Média Inferior" : z >= -2 ? "Limítrofe" : "Deficitário");
  const pondProc: Record<string, number | null> = {};

  for (const chave of ["cusb", "diod", "dioi", "caa", "cae"]) {
    if (brutos[chave] === undefined) continue;
    const faixaIdade = idade(d.ponderado[chave] ?? []);
    const p = faixaIdade ? (degrau(faixaIdade.tabela, brutos[chave])?.ponderado ?? null) : null;
    pondProc[chave] = p;
    const z = p !== null ? (p - 10) / 3 : null;
    porCampo[chave] = {
      valorBruto: brutos[chave],
      faixa: p === null || z === null ? null : ({ ponderado: p, z: arredondar(z, 3), percentil: arredondar(normalAcumulada(z) * 100, 3), classificacao: classificarPonderadoWisc(p) } as unknown as FaixaConversao),
    };
  }

  for (const chave of ["udiod", "udioi"]) {
    if (brutos[chave] === undefined) continue;
    const t = d.udio[chave];
    const fi = idade(t.freq);
    const zi = idade(t.z);
    if (!fi || !zi || zi.media === null || zi.dp === null) { porCampo[chave] = { valorBruto: brutos[chave], faixa: null }; continue; }
    const i = degrau(fi.chaves.map((k, idx) => ({ min: k, idx })), brutos[chave])?.idx;
    const z = (brutos[chave] - zi.media) / zi.dp;
    porCampo[chave] = { valorBruto: brutos[chave], faixa: { frequenciaAcumulada: i === undefined ? null : (fi.valores[i] ?? 0), z: arredondar(z, 3), percentil: arredondar(normalAcumulada(z) * 100, 3), classificacao: classZ(z) } as unknown as FaixaConversao };
  }

  let diferencaUdio: Record<string, unknown> | null = null;
  if (brutos.udiod !== undefined && brutos.udioi !== undefined) {
    const g = brutos.udiod - brutos.udioi;
    const fi = idade(d.difUdio.freq);
    const zi = idade(d.difUdio.z);
    if (fi && zi && zi.media !== null && zi.dp !== null) {
      const i = degrau(fi.chaves.map((k, idx) => ({ min: k, idx })), g)?.idx;
      const z = (zi.media - g) / zi.dp;
      diferencaUdio = { diferenca: g, frequenciaAcumulada: i === undefined ? null : (fi.valores[i] ?? 0), z: arredondar(z, 3), percentil: arredondar(normalAcumulada(z) * 100, 3), classificacao: classZ(z, true) };
    }
  }

  // Comparações: Cubos × CUSB, DIOD × DIOI, CAA × CAE. L138 da planilha: 0,15 (90%) → 1; caso contrário 2.
  const nivel = (opcoes.confianca ?? "95%") === "90%" ? 0 : 1;
  const comparacoes = d.comparacoes.flatMap((c) => {
    const pa = c.a === "cb" ? ponderado.cb : pondProc[c.a];
    const pb = pondProc[c.b];
    if (pa === null || pa === undefined || pb === null || pb === undefined) return [];
    const diferenca = pa - pb;
    const valorCritico = c.criticos[nivel];
    if (valorCritico === null) return [];
    const significativa = Math.abs(diferenca) >= valorCritico;
    let frequencia = "";
    if (significativa && diferenca !== 0) {
      const tab = diferenca < 0 ? c.frequencia.neg : c.frequencia.pos;
      const i = degrau(c.frequencia.chaves.map((k, idx) => ({ min: k, idx })), Math.abs(diferenca))?.idx;
      frequencia = i === undefined ? "" : texto(tab[i]);
    }
    return [{ linha: c.linha, par: c.rotulo, a: c.a, b: c.b, pontosA: pa, pontosB: pb, diferenca, valorCritico, significativa: significativa ? "Sim" : "Não", frequencia }];
  });
  return { comparacoes, diferencaUdio };
}

// Clusters (linhas 148-172): soma dos ponderados de 2-3 subtestes → composto, IC 95% e percentil pela tabela própria de cada cluster;
// interpretável quando a diferença entre o maior e o menor ponderado é < 5 (a planilha trata subteste não lançado como 0; aqui o
// cluster só é calculado com todos os seus subtestes). Depois as comparações clínicas (diferença de compostos contra um valor
// crítico fixo) e o texto de hipótese/sugestão correspondente ao SENTIDO real da diferença (a planilha não mostra hipótese em empate).
function analisarClustersWisc(d: DadosClusters, ponderado: Record<string, number | null>, porCampo: Record<string, ResultadoPorCampo>) {
  const tem = (c: string) => ponderado[c] !== null && ponderado[c] !== undefined;
  const clusters = d.clusters.map((c) => {
    const itens = c.subtestes.map((chave) => ({ chave, ponderado: tem(chave) ? (ponderado[chave] as number) : null }));
    if (!c.subtestes.every(tem)) return { chave: c.chave, sigla: c.sigla, rotulo: c.rotulo, linha: c.linha, itens, calculado: false as const };
    const valores = itens.map((i) => i.ponderado as number);
    const diferenca = Math.max(...valores) - Math.min(...valores);
    const interpretavel = diferenca < 5;
    const soma = valores.reduce((a, v) => a + v, 0);
    const linha = interpretavel ? degrau(c.tabela, soma) : null;
    const composto = linha?.composto ?? null;
    return {
      chave: c.chave, sigla: c.sigla, rotulo: c.rotulo, linha: c.linha, itens, calculado: true as const, diferenca, interpretavel,
      soma: interpretavel ? soma : null, composto, ic95: linha?.ic95 ?? null, percentil: linha?.percentil ?? null,
      classificacao: composto !== null ? classificarCompostoWisc(composto) : null,
    };
  });
  const porChave = Object.fromEntries(clusters.map((c) => [c.chave, c]));
  const comparacoes = d.comparacoes.map((cc) => {
    const A = porChave[cc.a];
    const B = porChave[cc.b];
    const base = { linha: cc.linha, a: cc.a, b: cc.b, valorCritico: cc.valorCritico, tituloEsquerda: cc.tituloEsquerda, tituloDireita: cc.tituloDireita };
    const ok = A?.calculado && B?.calculado && A.interpretavel && B.interpretavel && A.composto !== null && B.composto !== null;
    if (!ok) return { ...base, calculada: false as const, motivo: A?.calculado && B?.calculado ? "Algum dos clusters não é interpretável (diferença ≥ 5 entre subtestes)." : "Faltam subtestes para um dos clusters." };
    const compostoA = (A as { composto: number }).composto;
    const compostoB = (B as { composto: number }).composto;
    const diferenca = compostoA - compostoB;
    const sentido: ">" | "<" | "=" = diferenca > 0 ? ">" : diferenca < 0 ? "<" : "=";
    return {
      ...base, calculada: true as const, compostoA, compostoB, diferenca, sentido,
      raro: Math.abs(diferenca) >= cc.valorCritico ? "Raro" : "Não Raro",
      hipotese: sentido === ">" ? cc.hipoteseMaior : sentido === "<" ? cc.hipoteseMenor : null,
      sugestao: sentido === ">" ? cc.sugestaoMaior : sentido === "<" ? cc.sugestaoMenor : null,
    };
  });
  const gai = typeof porCampo.gai?.faixa?.composto === "number" ? (porCampo.gai.faixa.composto as number) : null;
  const cpi = typeof porCampo.cpi?.faixa?.composto === "number" ? (porCampo.cpi.faixa.composto as number) : null;
  const gaiCpi = gai !== null && cpi !== null ? { gai, cpi, diferenca: gai - cpi } : null;
  return { clusters, comparacoes, gaiCpi };
}

// Habilidades compartilhadas (linhas 64-145; Kaufman & Lichtenberger): cada subteste é marcado pela diferença entre o seu ponderado e a média do
// índice a que pertence (verbais: SM+VC+CO ÷ 3; executivos: CB+CN+RM ÷ 3 com CF no lugar de um ausente; MO: DG+SNL ÷ 2; VP: CD+PS ÷ 2):
// >= +1 → "P", <= −1 → "N", senão "0". A habilidade é "Força"/"Fraqueza" quando todos os subtestes têm o mesmo sinal ou quase todos
// (k de n, com um único "0" ou um do sinal oposto). Só é interpretada com TODOS os seus subtestes marcados.
//
// Diferenças em relação à planilha: (1) em 4 habilidades a coluna do RM aponta para $G$95 (em branco) e vira sempre "Neutro";
// (2) na maioria das linhas o teste "quase todos negativos" tem AY=0 no lugar de AX=0 e nunca se cumpre — aqui a regra é a mesma
// para Força e Fraqueza.
function analisarHabilidadesWisc(lista: DadosHabilidadeWisc[], ponderado: Record<string, number | null>, somas: Record<string, number | null>, tem: (c: string) => boolean) {
  const medias = mediasDosIndicesWisc(ponderado, somas, tem);
  const marca = (c: string): "P" | "N" | "0" | null => {
    if (!tem(c)) return null;
    const m = medias[GRUPO_INDICE_WISC[c]];
    if (m === null || m === undefined) return null;
    const dif = (ponderado[c] as number) - m;
    return dif >= 1 ? "P" : dif <= -1 ? "N" : "0";
  };
  const itens = lista.map((h) => {
    const marcas: Record<string, "P" | "N" | "0" | null> = {};
    let p = 0, n = 0, z = 0;
    for (const s of h.subtestes) {
      const m = marca(s);
      marcas[s] = m;
      if (m === "P") p++; else if (m === "N") n++; else if (m === "0") z++;
    }
    const total = p + n + z;
    const completa = total === h.subtestes.length;
    let interpretacao = "";
    if (completa) {
      const k = h.k;
      const quase = (a: number, b: number, c: number) => k !== null && a >= k && ((b === 1 && c === 0) || (b === 0 && c === 1));
      if (p === h.n || quase(p, n, z)) interpretacao = "Força";
      else if (n === h.n || quase(n, p, z)) interpretacao = "Fraqueza";
    }
    return { numero: h.numero, nome: h.nome, grupo: h.grupo, subtestes: h.subtestes, marcas, p, n, zero: z, total, completa, interpretacao };
  });
  return { medias, itens };
}

const GRUPO_INDICE_WISC: Record<string, string> = { sm: "icv", vc: "icv", co: "icv", in: "icv", rp: "icv", cb: "iop", cn: "iop", rm: "iop", cf: "iop", dg: "imo", snl: "imo", ar: "imo", cd: "ivp", ps: "ivp", ca: "ivp" };
const ORDEM_SUBTESTES_WISC = ["sm", "vc", "co", "in", "rp", "cb", "cn", "rm", "cf", "dg", "snl", "ar", "cd", "ps", "ca"];
const NOMES_SUBTESTES_WISC: Record<string, string> = {
  sm: "SM - Semelhanças", vc: "VC - Vocabulário", co: "CO - Compreensão", in: "IN - Informação", rp: "RP - Raciocínio com Palavras", cb: "CB - Cubos",
  cn: "CN - Conceitos Figurativos", rm: "RM - Raciocínio Matricial", cf: "CF - Completar Figuras", dg: "DG - Dígitos", snl: "SNL - Sequência Números e Letras",
  ar: "AR - Aritmética", cd: "CD - Códigos", ps: "PS - Procurar Símbolos", ca: "CA - Cancelamento",
};

// Médias de comparação da planilha (G26:J26): verbais = (SM+VC+CO)/3; executivos = soma do IOP/3; MO = soma do IMO/2; VP = soma do IVP/2.
function mediasDosIndicesWisc(ponderado: Record<string, number | null>, somas: Record<string, number | null>, tem: (c: string) => boolean): Record<string, number | null> {
  const principaisIcv = ["sm", "vc", "co"];
  return {
    icv: principaisIcv.every(tem) ? principaisIcv.reduce((a, c) => a + (ponderado[c] as number), 0) / 3 : null,
    iop: somas.iop !== null && somas.iop !== undefined ? somas.iop / 3 : null,
    imo: somas.imo !== null && somas.imo !== undefined ? somas.imo / 2 : null,
    ivp: somas.ivp !== null && somas.ivp !== undefined ? somas.ivp / 2 : null,
  };
}

// Análise intraindividual (linhas 59-75): diferença de cada subteste para a média do seu índice (colunas Y:AA) e os subtestes de MAIOR
// diferença positiva e negativa. Diferenças em relação à planilha: ela só calcula com os 15 subtestes lançados (texto vazio − número dá
// erro) e a busca da maior diferença NEGATIVA usa o intervalo deslocado AA61:AB75 (falha se o menor for o SM); aqui usa os lançados e o
// intervalo certo. Empate: vale o primeiro na ordem da planilha.
function analisarIntraindividualWisc(ponderado: Record<string, number | null>, somas: Record<string, number | null>, tem: (c: string) => boolean) {
  const medias = mediasDosIndicesWisc(ponderado, somas, tem);
  const itens = ORDEM_SUBTESTES_WISC.flatMap((chave) => {
    const m = medias[GRUPO_INDICE_WISC[chave]];
    if (!tem(chave) || m === null || m === undefined) return [];
    const pond = ponderado[chave] as number;
    return [{ chave, nome: NOMES_SUBTESTES_WISC[chave], ponderado: pond, media: m, diferenca: pond - m }];
  });
  const extremo = (sinal: 1 | -1) => {
    let melhor: (typeof itens)[number] | null = null;
    for (const i of itens) if (melhor === null || (sinal === 1 ? i.diferenca > melhor.diferenca : i.diferenca < melhor.diferenca)) melhor = i;
    return melhor;
  };
  return { itens, medias, maiorPositiva: extremo(1), maiorNegativa: extremo(-1) };
}

// Idade mental (linhas 10-24 col. AD/Q/R, 16-21 col. AG/AM): cada subteste tem uma idade EQUIVALENTE em meses pela tabela do bruto
// (CD e PS usam duas tabelas: até 2919 dias e a partir de 2920). A idade de cada índice é a média das idades dos seus subtestes, com a
// substituição da planilha (primeiro principal ausente é trocado pelo suplementar); a "idade mental estimada" é a média de TODOS os
// subtestes lançados. A planilha mostra "5a, 12m" por arredondamento do mês; aqui o mês 12 vira o ano seguinte.
function analisarIdadeMentalWisc(d: DadosIdadeMental, brutos: Bruto, dias: number, porCampo: Record<string, ResultadoPorCampo>) {
  const texto = (meses: number) => {
    let a = Math.floor(meses / 12);
    let m = arredondar(meses - a * 12, 0);
    if (m === 12) { a += 1; m = 0; }
    return `${a}a, ${m}m`;
  };
  const subtestes: Record<string, { meses: number; texto: string; sinal: "<" | ">" | "" }> = {};
  for (const [chave, cfg] of Object.entries(d.subtestes)) {
    const bruto = brutos[chave];
    if (bruto === undefined) continue;
    const tabela = cfg.tabelas.length === 2 ? (dias <= 2919 ? cfg.tabelas[0] : cfg.tabelas[1]) : cfg.tabelas[0];
    const meses = degrau(tabela.tabela, bruto)?.meses ?? null;
    if (meses === null) continue;
    const lim = cfg.limites.length === 2 ? (dias <= 2919 ? cfg.limites[0] : cfg.limites[1]) : cfg.limites[0];
    subtestes[chave] = { meses, texto: `${Math.floor(meses / 12)}a, ${Math.floor(meses % 12)}m`, sinal: bruto <= lim.inf ? "<" : bruto >= lim.sup ? ">" : "" };
  }
  const media = (chaves: string[]) => {
    const vs = chaves.filter((c) => subtestes[c]).map((c) => subtestes[c].meses);
    return vs.length ? vs.reduce((a, v) => a + v, 0) / vs.length : null;
  };
  const tem = (c: string) => brutos[c] !== undefined;
  const conjuntoIcv = !tem("sm") ? ["vc", "co", "rp"] : !tem("vc") ? ["sm", "co", "rp"] : !tem("co") ? ["sm", "vc", "rp"] : ["sm", "vc", "co"];
  const conjuntoIop = !tem("cb") ? ["cn", "rm", "cf"] : !tem("cn") ? ["cb", "rm", "cf"] : !tem("rm") ? ["cb", "cn", "cf"] : ["cb", "cn", "rm"];
  const conjuntoImo = !tem("dg") ? ["snl", "ar"] : !tem("snl") ? ["dg", "ar"] : ["dg", "snl"];
  const conjuntoIvp = !tem("cd") ? ["ps", "ca"] : !tem("ps") ? ["cd", "ca"] : ["cd", "ps"];
  const comTexto = (meses: number | null) => (meses === null ? null : { meses, texto: texto(meses) });
  const indices = { icv: comTexto(media(conjuntoIcv)), iop: comTexto(media(conjuntoIop)), imo: comTexto(media(conjuntoImo)), ivp: comTexto(media(conjuntoIvp)) };
  const total = comTexto(media(Object.keys(subtestes)));
  const qit = porCampo.qit?.faixa;
  const avisos: string[] = [];
  const classQit = qit?.classificacao as string | undefined;
  const compQit = typeof qit?.composto === "number" ? (qit.composto as number) : null;
  if (classQit && ["Limítrofe", "Deficitário", "Superior", "Muito Superior"].includes(classQit)) avisos.push("Considerar mais atentamente a IDADE MENTAL ESTIMADA!");
  if (compQit !== null && (compQit >= 120 || compQit <= 80)) avisos.push("É bom fazer uma análise mais detalhada da IDADE MENTAL ESTIMADA!");
  return { subtestes, indices, total, avisos };
}
