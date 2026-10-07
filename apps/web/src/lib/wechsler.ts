import type { ResultadoCalculado } from "./api";

// Organização dos subtestes do WAIS-III na tela (ordem do eixo do gráfico de perfil da planilha).
// `complementar`: não faz parte dos 4 índices fatoriais (entra só nos QIs Verbal/Execução).
export interface SubtesteWechsler {
  chave: string;
  sigla: string;
  complementar?: boolean;
}
export interface GrupoWechsler {
  chave: "icv" | "imo" | "iop" | "ivp";
  titulo: string;
  sigla: string;
  subtestes: SubtesteWechsler[];
}

export const GRUPOS_WAIS3: GrupoWechsler[] = [
  {
    chave: "icv", titulo: "Compreensão Verbal", sigla: "ICV",
    subtestes: [
      { chave: "vocabulario", sigla: "VC" }, { chave: "semelhancas", sigla: "SM" },
      { chave: "informacao", sigla: "IN" }, { chave: "compreensao", sigla: "CO", complementar: true },
    ],
  },
  {
    chave: "imo", titulo: "Memória Operacional", sigla: "IMO",
    subtestes: [{ chave: "aritmetica", sigla: "AR" }, { chave: "digitos", sigla: "DG" }, { chave: "sequenciaNumerosLetras", sigla: "SNL" }],
  },
  {
    chave: "iop", titulo: "Organização Perceptual", sigla: "IOP",
    subtestes: [
      { chave: "completarFiguras", sigla: "CF" }, { chave: "cubos", sigla: "CB" }, { chave: "raciocinioMatricial", sigla: "RM" },
      { chave: "arranjoFiguras", sigla: "AF", complementar: true }, { chave: "armarObjetos", sigla: "AO", complementar: true },
    ],
  },
  {
    chave: "ivp", titulo: "Velocidade de Processamento", sigla: "IVP",
    subtestes: [{ chave: "codigos", sigla: "CD" }, { chave: "procurarSimbolos", sigla: "PS" }],
  },
];

export const ESCALA_VERBAL = ["vocabulario", "semelhancas", "aritmetica", "digitos", "informacao", "compreensao", "sequenciaNumerosLetras"];
export const ESCALA_EXECUCAO = ["completarFiguras", "codigos", "cubos", "raciocinioMatricial", "arranjoFiguras", "procurarSimbolos", "armarObjetos"];

// Faixas do ponto ponderado (1-19). Fundo suave (a área), traço saturado (linha e pontos).
export interface ZonaPonderado { de: number; ate: number; rotulo: string; fundo: string; traco: string }
export const ZONAS_PONDERADO: ZonaPonderado[] = [
  // Mesmos limiares da coluna Classificação da planilha: >=16, >=14, >=12, >=8, >=6, >=4, resto.
  { de: 16, ate: 19, rotulo: "Muito superior", fundo: "#d9d4f0", traco: "#5b4bb7" },
  { de: 14, ate: 15, rotulo: "Superior", fundo: "#d3dcf3", traco: "#3a63b8" },
  { de: 12, ate: 13, rotulo: "Média superior", fundo: "#d2e6f3", traco: "#2f7fb3" },
  { de: 8, ate: 11, rotulo: "Média", fundo: "#dcefd9", traco: "#3f8f5b" },
  { de: 6, ate: 7, rotulo: "Média inferior", fundo: "#faefc4", traco: "#b78b0f" },
  { de: 4, ate: 5, rotulo: "Limítrofe", fundo: "#f8dfc7", traco: "#d9822b" },
  { de: 1, ate: 3, rotulo: "Deficitário", fundo: "#f4cfc9", traco: "#c0392b" },
];
export function zonaDoPonderado(p: number): ZonaPonderado {
  return ZONAS_PONDERADO.find((z) => p >= z.de && p <= z.ate) ?? ZONAS_PONDERADO[ZONAS_PONDERADO.length - 1];
}

// Classificação (a da planilha, por percentil) -> cor do selo.
export const COR_CLASSIFICACAO: Record<string, string> = {
  "Muito Superior": "#5b4bb7", Superior: "#3a63b8", "Média Superior": "#2f7fb3", Média: "#3f8f5b",
  "Média Inferior": "#b78b0f", Limítrofe: "#d9822b", Deficitário: "#c0392b",
};

// Faixas do ponto composto (escala 40-160) para o gráfico de índices.
export const ZONAS_COMPOSTO = [
  { de: 40, ate: 69, rotulo: "Deficitário", fundo: "#f4cfc9" },
  { de: 70, ate: 79, rotulo: "Limítrofe", fundo: "#f8dfc7" },
  { de: 80, ate: 89, rotulo: "Média inferior", fundo: "#faefc4" },
  { de: 90, ate: 109, rotulo: "Média", fundo: "#dcefd9" },
  { de: 110, ate: 119, rotulo: "Média superior", fundo: "#d2e6f3" },
  { de: 120, ate: 129, rotulo: "Superior", fundo: "#d3dcf3" },
  { de: 130, ate: 160, rotulo: "Muito superior", fundo: "#d9d4f0" },
];

export interface IndiceLido {
  chave: string;
  mpp: number | null; // média dos ponderados (só índices fatoriais)
  diferenca: number | null; // maior - menor ponderado
  homogeneo: string | null; // "SIM" | "NÃO"
  // Análise avançada (colunas K-S da planilha)
  interpretavel: string | null;
  dfNormativa: string | null;
  mediaIndices: number | null;
  diferencaMedia: number | null;
  valorCritico: number | null;
  dfIndividual: string | null;
  raro: string | null;
  aviso: string | null;
  observacao: string | null;
  soma: number | null;
  composto: number | null;
  percentil: string | number | null;
  ic90: string | null;
  ic95: string | null;
  classificacao: string | null;
}

export function lerPorCampo(resultado: ResultadoCalculado | null | undefined) {
  return resultado && resultado.modo === "por_campo" ? resultado.porCampo : {};
}

export interface SubtesteLido {
  bruto: number;
  ponderado: number | null; // null = lançado, mas sem norma para a idade/valor
  z: number | null;
  pontoComposto: number | null;
  percentil: number | null;
  classificacao: string | null;
}

// Subtestes lançados com as colunas da planilha: ponderado, Z, ponto composto, percentil e classificação.
export function lerPonderados(resultado: ResultadoCalculado | null | undefined, chaves: string[]): Record<string, SubtesteLido> {
  const porCampo = lerPorCampo(resultado);
  const out: Record<string, SubtesteLido> = {};
  for (const chave of chaves) {
    const v = porCampo[chave];
    if (!v || v.valorBruto === null) continue;
    const p = v.faixa?.ponderado;
    const n = (x: unknown) => (typeof x === "number" ? x : null);
    out[chave] = {
      bruto: v.valorBruto,
      ponderado: typeof p === "number" ? p : null,
      z: n(v.faixa?.z),
      pontoComposto: n(v.faixa?.pontoComposto),
      percentil: n(v.faixa?.percentil),
      classificacao: typeof v.faixa?.classificacao === "string" ? v.faixa.classificacao : null,
    };
  }
  return out;
}

export function lerIndice(resultado: ResultadoCalculado | null | undefined, chave: string): IndiceLido {
  const v = lerPorCampo(resultado)[chave];
  const f = v?.faixa;
  return {
    chave,
    mpp: typeof f?.mpp === "number" ? f.mpp : null,
    diferenca: typeof f?.diferenca === "number" ? f.diferenca : null,
    homogeneo: typeof f?.homogeneo === "string" ? f.homogeneo : null,
    interpretavel: typeof f?.interpretavel === "string" ? f.interpretavel : null,
    dfNormativa: typeof f?.dfNormativa === "string" ? f.dfNormativa : null,
    mediaIndices: typeof f?.mediaIndices === "number" ? f.mediaIndices : null,
    diferencaMedia: typeof f?.diferencaMedia === "number" ? f.diferencaMedia : null,
    valorCritico: typeof f?.valorCritico === "number" ? f.valorCritico : null,
    dfIndividual: typeof f?.dfIndividual === "string" ? f.dfIndividual : null,
    raro: typeof f?.raro === "string" ? f.raro : null,
    aviso: typeof f?.aviso === "string" ? f.aviso : null,
    observacao: typeof f?.observacao === "string" ? f.observacao : null,
    soma: v?.valorBruto ?? null,
    composto: typeof f?.composto === "number" ? f.composto : null,
    percentil: (f?.percentil as string | number | undefined) ?? null,
    ic90: (f?.ic90 as string | undefined) ?? null,
    ic95: (f?.ic95 as string | undefined) ?? null,
    classificacao: (f?.classificacao as string | undefined) ?? null,
  };
}

const OBRIGATORIOS_INDICE: Record<string, string[]> = {
  icv: ["vocabulario", "semelhancas", "informacao"],
  iop: ["completarFiguras", "cubos", "raciocinioMatricial"],
  imo: ["aritmetica", "digitos", "sequenciaNumerosLetras"],
  ivp: ["codigos", "procurarSimbolos"],
};

// O que falta lançar para o índice sair (mesmas regras de lib/wais3.ts no backend). null = completo.
export function faltaParaIndice(chave: string, lancados: Set<string>, rotulo: (c: string) => string): string | null {
  const tem = (c: string) => lancados.has(c);
  const lista = (cs: string[]) => cs.map(rotulo).join(", ");
  if (OBRIGATORIOS_INDICE[chave]) {
    const f = OBRIGATORIOS_INDICE[chave].filter((c) => !tem(c));
    return f.length ? `faltam ${lista(f)}` : null;
  }
  if (chave === "qiv") {
    const f = ["vocabulario", "semelhancas", "aritmetica", "informacao", "compreensao"].filter((c) => !tem(c));
    const partes = f.length ? [lista(f)] : [];
    if (!tem("digitos") && !tem("sequenciaNumerosLetras")) partes.push(`${rotulo("digitos")} (ou ${rotulo("sequenciaNumerosLetras")})`);
    return partes.length ? `faltam ${partes.join(", ")}` : null;
  }
  if (chave === "qie") {
    const f = ["completarFiguras", "cubos", "raciocinioMatricial", "arranjoFiguras"].filter((c) => !tem(c));
    const partes: string[] = [];
    if (f.length) partes.push(lista(f));
    if (f.length === 1 && !tem("armarObjetos")) partes[0] += ` (ou ${rotulo("armarObjetos")} no lugar)`;
    if (f.length > 1) partes[0] += " — Armar Objetos só substitui um";
    if (!tem("codigos") && !tem("procurarSimbolos")) partes.push(`${rotulo("codigos")} (ou ${rotulo("procurarSimbolos")})`);
    return partes.length ? `faltam ${partes.join("; ")}` : null;
  }
  if (chave === "qit") return faltaParaIndice("qiv", lancados, rotulo) || faltaParaIndice("qie", lancados, rotulo) ? "precisa do QI Verbal e do QI de Execução" : null;
  if (chave === "gai") return faltaParaIndice("icv", lancados, rotulo) || faltaParaIndice("iop", lancados, rotulo) ? "precisa do ICV e do IOP" : null;
  return null;
}

// "94 - 106" -> [94, 106]
export function parseIntervalo(ic: string | null): [number, number] | null {
  const m = ic?.match(/(\d+)\s*-\s*(\d+)/);
  return m ? [Number(m[1]), Number(m[2])] : null;
}

export function faixaEtariaWais3(idadeAnos: number): string | null {
  const faixas: Array<[number, number, string]> = [[16, 17, "16-17"], [18, 19, "18-19"], [20, 29, "20-29"], [30, 39, "30-39"], [40, 49, "40-49"], [50, 59, "50-59"], [60, 64, "60-64"], [65, 89, "65-89"]];
  return faixas.find(([a, b]) => idadeAnos >= a && idadeAnos <= b)?.[2] ?? null;
}

// Cores dos 8 índices/QIs nos gráficos (as mesmas do gráfico da planilha).
export const COR_INDICE: Record<string, string> = {
  icv: "#3f6ea7", iop: "#c0504d", imo: "#77933c", ivp: "#8064a2", qiv: "#4bacc6", qie: "#f79646", gai: "#2f5597", qit: "#7b2d26",
};
export const ROTULO_INDICE: Record<string, string> = {
  icv: "ICV", iop: "IOP", imo: "IMO", ivp: "IVP", qiv: "QI Verbal", qie: "QI Execução", gai: "GAI", qit: "QI Total",
};
// Limite de "raro" por índice, como na planilha (constantes das fórmulas R34:R37).
export const LIMITE_RARO: Record<string, number> = { icv: 15.5, iop: 14.8, imo: 15.8, ivp: 17.7 };

// ---- Extras do WAIS-III: determinação por subteste e comparação entre discrepâncias ----
export interface NivelSubteste { critico: number | null; significativo: boolean; df: string; frequencia: string }
export interface LinhaDeterminacao { chave: string; ponderado: number; media: number | null; diferenca: number | null; n05: NivelSubteste; n15: NivelSubteste }
export interface Determinacao {
  resumo: Record<"verbal" | "execucao" | "geral", { n: number; soma: number; media: number | null }>;
  recomendacao: { modo: number | null; texto: string; opcoes: string[] };
  modos: Array<{ id: string; rotulo: string; mediaTotal: boolean; linhas: LinhaDeterminacao[] }>;
}
export interface LinhaDiscrepancia { a: string; b: string; valorA: number; valorB: number; diferenca: number; valorCritico: number | null; significativo: boolean; frequencia: string }
export interface Discrepancias { combos: Record<string, LinhaDiscrepancia[]> }

export interface ClusterLido {
  chave: string;
  sigla: string;
  rotulo: string;
  itens: Array<{ chave: string; ponderado: number | null }>;
  calculado: boolean;
  diferenca?: number;
  interpretavel?: boolean;
  soma?: number | null;
  composto?: number | null;
  ic95?: string | null;
  percentil?: number | null;
  classificacao?: string | null;
}
export interface ComparacaoClinica {
  a: string;
  b: string;
  rotulo: string;
  siglaA: string;
  siglaB: string;
  valorCritico: number;
  calculada: boolean;
  motivo?: string;
  compostoA?: number;
  compostoB?: number;
  diferenca?: number;
  sentido?: ">" | "<" | "=";
  raro?: string;
  hipotese?: { titulo: string; texto: string } | null;
}
export interface AnaliseClusters { clusters: ClusterLido[]; comparacoes: ComparacaoClinica[] }

export interface EstatisticaZ { z: number; ponderado: number; percentil: number; classificacao: string }
export interface SpamLido extends EstatisticaZ { valor: number; media: number; dp: number; porcentagemCumulativa: number | null }
export interface DiferencaSpamLida extends EstatisticaZ { direta: number; inversa: number; diferenca: number; frequenciaAcumulada: number | null; media: number; dp: number }
export interface ProcessoLido { faixa: string; spam: { direta: SpamLido | null; inversa: SpamLido | null }; diferenca: DiferencaSpamLida | null; aviso: string | null }

// Chaves de entrada da aba "escores de processo" (vão no mesmo mapa de escores brutos, mas não são subtestes).
export const CHAVES_PROCESSO = { spamDireta: "digitosSpamDireta", spamInversa: "digitosSpamInversa", pontosDireta: "digitosPontosDireta", pontosInversa: "digitosPontosInversa" } as const;

export type MarcaHabilidade = "P" | "N" | "0" | null;
export interface ResultadoHabilidade { marcas: Record<string, MarcaHabilidade>; p: number; n: number; zero: number; total: number; completa: boolean; interpretacao: string }
export interface MatrizHabilidades {
  lista: Array<{ numero: number | null; nome: string; grupo: string; subtestes: string[] }>;
  total: ResultadoHabilidade[];
  verbalExecucao: ResultadoHabilidade[];
  recomendado: "total" | "verbalExecucao";
}

export interface ExtrasWais3 { determinacao?: Determinacao; discrepancias?: Discrepancias; clusters?: AnaliseClusters; processo?: ProcessoLido; habilidades?: MatrizHabilidades }
export function lerExtras(resultado: ResultadoCalculado | null | undefined): ExtrasWais3 {
  return resultado && resultado.modo === "por_campo" && resultado.extras ? (resultado.extras as ExtrasWais3) : {};
}
