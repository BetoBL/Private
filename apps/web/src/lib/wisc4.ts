// Tipos e constantes do WISC-IV na tela (espelham os extras de apps/api/src/lib/wisc4.ts).
export interface GrupoWisc4 {
  chave: "icv" | "iop" | "imo" | "ivp";
  titulo: string;
  sigla: string;
  principais: string[];
  suplementares: string[];
}

export const GRUPOS_WISC4: GrupoWisc4[] = [
  { chave: "icv", titulo: "Compreensão Verbal", sigla: "ICV", principais: ["sm", "vc", "co"], suplementares: ["in", "rp"] },
  { chave: "iop", titulo: "Organização Perceptual", sigla: "IOP", principais: ["cb", "cn", "rm"], suplementares: ["cf"] },
  { chave: "imo", titulo: "Memória Operacional", sigla: "IMO", principais: ["dg", "snl"], suplementares: ["ar"] },
  { chave: "ivp", titulo: "Velocidade de Processamento", sigla: "IVP", principais: ["cd", "ps"], suplementares: ["ca"] },
];
export const SUBTESTES_WISC4 = GRUPOS_WISC4.flatMap((g) => [...g.principais, ...g.suplementares]);
export const PROCESSO_WISC4 = ["cusb", "diod", "dioi", "caa", "cae", "udiod", "udioi"];

export const NOME_SUBTESTE_WISC4: Record<string, string> = {
  sm: "Semelhanças", vc: "Vocabulário", co: "Compreensão", in: "Informação", rp: "Raciocínio com Palavras",
  cb: "Cubos", cn: "Conceitos Figurativos", rm: "Raciocínio Matricial", cf: "Completar Figuras",
  dg: "Dígitos", snl: "Sequência de Números e Letras", ar: "Aritmética",
  cd: "Código", ps: "Procurar Símbolos", ca: "Cancelamento",
  cusb: "Cubos sem Tempo de Bônus", diod: "Dígitos — Ordem Direta", dioi: "Dígitos — Ordem Inversa",
  caa: "Cancelamento Aleatório", cae: "Cancelamento Estruturado", udiod: "Maior Sequência de Dígitos OD", udioi: "Maior Sequência de Dígitos OI",
};

export interface DiscrepanciaIndiceWisc { par: string; a: string; b: string; pontosA: number; pontosB: number; diferenca: number; valorCritico: number; significativa: string; frequencia: string }
export interface DiscrepanciaSubtesteWisc { linha: number; grupo: string; par: string; a: string; b: string; pontosA: number; pontosB: number; diferenca: number; valorCritico: number; significativa: string; frequencia: string }
export interface FacilidadeWisc { chave: string; linha: number; ponderado: number; media: number; diferenca: number; valorCritico: number; significativa: string; facilidadeDificuldade: string; frequencia: string }
export interface ComparacaoProcessoWisc { linha: number; par: string; a: string; b: string; pontosA: number; pontosB: number; diferenca: number; valorCritico: number; significativa: string; frequencia: string }
export interface DiferencaUdioWisc { diferenca: number; frequenciaAcumulada: number | null; z: number; percentil: number; classificacao: string }
export interface ClusterWisc {
  chave: string; sigla: string; rotulo: string; linha: number;
  itens: Array<{ chave: string; ponderado: number | null }>;
  calculado: boolean; diferenca?: number; interpretavel?: boolean; soma?: number | null; composto?: number | null; ic95?: string | null; percentil?: number | null; classificacao?: string | null;
}
export interface ComparacaoClinicaWisc {
  linha: number; a: string; b: string; valorCritico: number; tituloEsquerda: string; tituloDireita: string; calculada: boolean; motivo?: string;
  compostoA?: number; compostoB?: number; diferenca?: number; sentido?: ">" | "<" | "="; raro?: string; hipotese?: string | null; sugestao?: string | null;
}
export interface HabilidadeWisc { numero: number; nome: string; grupo: string; subtestes: string[]; marcas: Record<string, "P" | "N" | "0" | null>; p: number; n: number; zero: number; total: number; completa: boolean; interpretacao: string }
export interface IdadeMentalWisc {
  subtestes: Record<string, { meses: number; texto: string; sinal: "<" | ">" | "" }>;
  indices: Record<string, { meses: number; texto: string } | null>;
  total: { meses: number; texto: string } | null;
  avisos: string[];
}
export interface IntraindividualWisc {
  itens: Array<{ chave: string; nome: string; ponderado: number; media: number; diferenca: number }>;
  medias: Record<string, number | null>;
  maiorPositiva: { chave: string; nome: string; diferenca: number } | null;
  maiorNegativa: { chave: string; nome: string; diferenca: number } | null;
}
export interface ExtrasWisc4 {
  discrepanciasIndices?: DiscrepanciaIndiceWisc[];
  discrepanciasSubtestes?: DiscrepanciaSubtesteWisc[];
  facilidades?: FacilidadeWisc[];
  comparacoesProcesso?: ComparacaoProcessoWisc[];
  diferencaUdio?: DiferencaUdioWisc | null;
  clusters?: ClusterWisc[];
  comparacoesClinicas?: ComparacaoClinicaWisc[];
  gaiCpi?: { gai: number; cpi: number; diferenca: number } | null;
  habilidades?: { medias: Record<string, number | null>; itens: HabilidadeWisc[] };
  idadeMental?: IdadeMentalWisc;
  intraindividual?: IntraindividualWisc;
}
