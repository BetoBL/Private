import bcrypt from "bcryptjs";
import { PrismaClient, DominioCognitivo, EscopoTeste, PapelProfissional, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const DEV_PROFISSIONAL_EMAIL = "dev@mentessence.local";

const AVISO_PLACEHOLDER =
  "PLACEHOLDER — algoritmo/norma simplificados para validar o fluxo técnico. " +
  "Não reproduz o manual oficial do instrumento. Substituir antes de qualquer uso clínico.";

interface FaixaNormativaSeed {
  criterio: string;
  faixaMin?: number;
  faixaMax?: number;
  faixaLabel?: string;
  sexo?: "MASCULINO" | "FEMININO" | null;
  conversao: Prisma.InputJsonValue;
}

interface TesteSeed {
  nome: string;
  sigla: string;
  dominio: DominioCognitivo;
  descricao: string;
  algoritmoCorrecao: Prisma.InputJsonValue;
  referenciaBibliografica: string;
  tabelasNormativas: FaixaNormativaSeed[];
  // false só quando a tabela normativa vem de um manual real conferido (ver docs/testes/*.md) —
  // todo o resto do MVP continua isPlaceholder=true até a lista definitiva da psicóloga.
  isPlaceholder?: boolean;
}

// --- RAVLT: normas reais (Paula & Malloy-Diniz, Vetor 2018, N=1458) — ver docs/testes/RAVLT.md ---
// Cada campo tem sua própria tabela de pontos percentílicos (5/25/50/75/95) por faixa etária —
// as 5 medidas derivadas (EscoreTotal, ALT, VelocidadeEsquecimento, InterferênciaProativa/Retroativa)
// são calculadas pelo formulário de lançamento a partir dos 9 valores brutos (A1-A5, B1, A6, A7,
// Reconhecimento) usando as fórmulas do algoritmoCorrecao, e chegam aqui já prontas para conversão —
// o motor de cálculo só converte valor -> percentil/classificação, não agrega (mesmo princípio já
// usado no WAIS-III para os índices fatoriais).
const RAVLT_CAMPOS = [
  "a1", "a2", "a3", "a4", "a5", "b1", "a6", "a7", "reconhecimento",
  "escoreTotal", "alt", "velocidadeEsquecimento", "interferenciaProativa", "interferenciaRetroativa",
] as const;

type RavltCampo = (typeof RAVLT_CAMPOS)[number];

const RAVLT_CAMPOS_CONTINUOS = new Set<RavltCampo>([
  "velocidadeEsquecimento",
  "interferenciaProativa",
  "interferenciaRetroativa",
]);

type PontosPercentil = [p5: number, p25: number, p50: number, p75: number, p95: number];

interface RavltFaixaEtaria {
  faixaMin: number;
  faixaMax: number;
  faixaLabel: string;
  n: number;
  percentis: Record<RavltCampo, PontosPercentil>;
}

// Constrói as 6 faixas percentílicas (<5, 5-25, 25-50, 50-75, 75-95, >95) a partir dos 5 pontos
// tabelados, replicando a mesma convenção do "Guia de interpretação dos percentis" do manual.
// Nota: quando dois pontos consecutivos empatam (ex: p25==p50 em algumas células da tabela real),
// o valor empatado cai na faixa seguinte (ex: "50-75" em vez de "25-50") — cosmético apenas, pois
// "25-50" e "50-75" mapeiam para a mesma `classificacao` ("Típico") no guia de interpretação.
function criarFaixasPercentilRAVLT(pontos: PontosPercentil, continuo: boolean): Prisma.InputJsonValue[] {
  const [p5, p25, p50, p75, p95] = pontos;
  const passo = continuo ? 0.001 : 1;
  return [
    { max: p5 - passo, percentil: "<5", classificacao: "Inferior" },
    { min: p5, max: p25 - passo, percentil: "5-25", classificacao: "Média Inferior" },
    { min: p25, max: p50 - passo, percentil: "25-50", classificacao: "Típico" },
    { min: p50, max: p75 - passo, percentil: "50-75", classificacao: "Típico" },
    { min: p75, max: p95 - passo, percentil: "75-95", classificacao: "Típico" },
    { min: p95, percentil: ">95", classificacao: "Superior" },
  ];
}

const RAVLT_NORMAS: RavltFaixaEtaria[] = [
  {
    faixaMin: 6, faixaMax: 8, faixaLabel: "6 a 8 anos", n: 96,
    percentis: {
      a1: [2, 3, 4, 5, 8], a2: [3, 5, 6, 7, 10], a3: [4, 5, 7, 9, 12], a4: [4, 6, 8, 10, 13], a5: [4, 7, 8, 10, 13],
      b1: [2, 3, 4, 5, 7], a6: [3, 5, 7, 8, 13], a7: [3, 6, 7, 9, 13], reconhecimento: [-2, 8, 10, 15, 15],
      escoreTotal: [19, 26, 33, 40, 52], alt: [-4, 6, 12, 16, 23],
      velocidadeEsquecimento: [0.67, 0.89, 1.00, 1.20, 1.75],
      interferenciaProativa: [0.50, 0.75, 1.00, 1.29, 2.00],
      interferenciaRetroativa: [0.50, 0.71, 0.88, 1.00, 1.25],
    },
  },
  {
    faixaMin: 9, faixaMax: 11, faixaLabel: "9 a 11 anos", n: 119,
    percentis: {
      a1: [3, 4, 5, 7, 8], a2: [4, 6, 7, 9, 11], a3: [3, 6, 9, 11, 13], a4: [4, 8, 9, 11, 14], a5: [5, 8, 10, 12, 14],
      b1: [3, 4, 5, 6, 8], a6: [4, 7, 9, 11, 12], a7: [4, 7, 9, 11, 13], reconhecimento: [2, 11, 14, 15, 15],
      escoreTotal: [24, 32, 40, 46, 58], alt: [-1, 8, 13, 19, 26],
      velocidadeEsquecimento: [0.75, 0.90, 1.00, 1.11, 1.33],
      interferenciaProativa: [0.50, 0.71, 0.86, 1.20, 2.00],
      interferenciaRetroativa: [0.56, 0.73, 0.85, 1.00, 1.38],
    },
  },
  {
    faixaMin: 12, faixaMax: 14, faixaLabel: "12 a 14 anos", n: 55,
    percentis: {
      a1: [4, 5, 6, 8, 9], a2: [4, 6, 8, 10, 12], a3: [4, 7, 10, 12, 14], a4: [3, 9, 10, 12, 15], a5: [6, 10, 11, 13, 14],
      b1: [3, 4, 6, 7, 9], a6: [5, 9, 10, 11, 13], a7: [5, 7, 10, 12, 14], reconhecimento: [0, 12, 15, 15, 15],
      escoreTotal: [28, 39, 46, 51, 59], alt: [-2, 7, 13, 20, 25],
      velocidadeEsquecimento: [0.60, 0.89, 1.00, 1.11, 1.40],
      interferenciaProativa: [0.50, 0.73, 0.88, 1.13, 1.50],
      interferenciaRetroativa: [0.60, 0.80, 0.90, 1.00, 1.22],
    },
  },
  {
    faixaMin: 15, faixaMax: 17, faixaLabel: "15 a 17 anos", n: 40,
    percentis: {
      a1: [4, 5, 6, 7, 8], a2: [4, 7, 8, 9, 11], a3: [4, 8, 10, 11, 13], a4: [6, 10, 11, 13, 14], a5: [7, 10, 11, 14, 14],
      b1: [3, 4, 5, 6, 9], a6: [5, 9, 10, 13, 14], a7: [6, 9, 11, 12, 14], reconhecimento: [4, 11, 13, 15, 15],
      escoreTotal: [34, 41, 46, 53, 58], alt: [2, 13, 17, 21, 26],
      velocidadeEsquecimento: [0.79, 0.90, 1.00, 1.11, 1.35],
      interferenciaProativa: [0.54, 0.69, 0.86, 1.06, 1.42],
      interferenciaRetroativa: [0.64, 0.82, 0.93, 1.00, 1.23],
    },
  },
  {
    faixaMin: 18, faixaMax: 20, faixaLabel: "18 a 20 anos", n: 157,
    percentis: {
      a1: [4, 6, 7, 8, 10], a2: [6, 8, 9, 11, 13], a3: [8, 10, 11, 13, 14], a4: [8, 10, 12, 14, 15], a5: [8, 11, 12, 14, 15],
      b1: [4, 5, 6, 7, 9], a6: [6, 9, 12, 13, 15], a7: [6, 9, 11, 13, 15], reconhecimento: [-1, 5, 13, 15, 15],
      escoreTotal: [36, 46, 52, 58, 65], alt: [6, 12, 18, 22, 29],
      velocidadeEsquecimento: [0.75, 0.91, 1.00, 1.10, 1.33],
      interferenciaProativa: [0.56, 0.73, 0.89, 1.10, 1.50],
      interferenciaRetroativa: [0.63, 0.82, 0.92, 1.00, 1.18],
    },
  },
  {
    faixaMin: 21, faixaMax: 30, faixaLabel: "21 a 30 anos", n: 252,
    percentis: {
      a1: [4, 5, 7, 8, 9], a2: [5, 7, 9, 10, 12], a3: [6, 9, 11, 12, 14], a4: [7, 10, 12, 13, 15], a5: [8, 11, 13, 14, 15],
      b1: [3, 4, 6, 7, 9], a6: [6, 9, 11, 13, 15], a7: [6, 9, 11, 13, 15], reconhecimento: [1, 11, 13, 14, 15],
      escoreTotal: [34, 44, 50, 56, 63], alt: [5, 13, 17, 21, 27],
      velocidadeEsquecimento: [0.75, 0.91, 1.00, 1.09, 1.33],
      interferenciaProativa: [0.50, 0.68, 0.86, 1.00, 1.50],
      interferenciaRetroativa: [0.63, 0.80, 0.91, 1.00, 1.10],
    },
  },
  {
    faixaMin: 31, faixaMax: 40, faixaLabel: "31 a 40 anos", n: 158,
    percentis: {
      a1: [4, 5, 6, 7, 9], a2: [5, 7, 9, 10, 12], a3: [6, 9, 10, 12, 14], a4: [7, 10, 11, 13, 15], a5: [8, 11, 12, 14, 15],
      b1: [2, 4, 5, 6, 8], a6: [6, 9, 11, 12, 14], a7: [6, 9, 11, 12, 14], reconhecimento: [-2, 10, 13, 14, 15],
      escoreTotal: [35, 43, 49, 54, 60], alt: [6, 14, 18, 23, 29],
      velocidadeEsquecimento: [0.75, 0.86, 0.93, 1.08, 1.29],
      interferenciaProativa: [0.50, 0.67, 0.86, 1.00, 1.50],
      interferenciaRetroativa: [0.58, 0.80, 0.91, 0.93, 1.18],
    },
  },
  {
    faixaMin: 41, faixaMax: 50, faixaLabel: "41 a 50 anos", n: 116,
    percentis: {
      a1: [4, 5, 6, 7, 9], a2: [5, 7, 8, 10, 12], a3: [5, 8, 11, 11, 14], a4: [6, 9, 11, 14, 15], a5: [7, 10, 12, 12, 15],
      b1: [3, 4, 5, 6, 8], a6: [5, 8, 10, 11, 14], a7: [5, 7, 10, 14, 14], reconhecimento: [-3, 8, 12, 14, 15],
      escoreTotal: [29, 40, 49, 53, 61], alt: [5, 12, 16, 22, 27],
      velocidadeEsquecimento: [0.71, 0.85, 1.00, 1.10, 1.38],
      interferenciaProativa: [0.40, 0.67, 0.80, 1.00, 1.50],
      interferenciaRetroativa: [0.54, 0.73, 0.86, 0.97, 1.13],
    },
  },
  {
    faixaMin: 51, faixaMax: 60, faixaLabel: "51 a 60 anos", n: 106,
    percentis: {
      a1: [3, 5, 6, 7, 9], a2: [5, 6, 8, 10, 12], a3: [5, 8, 10, 11, 14], a4: [7, 9, 11, 12, 15], a5: [8, 10, 12, 13, 15],
      b1: [2, 4, 5, 6, 8], a6: [5, 7, 10, 12, 14], a7: [4, 8, 10, 12, 14], reconhecimento: [-2, 10, 13, 14, 15],
      escoreTotal: [31, 37, 47, 53, 61], alt: [4, 12, 15, 19, 26],
      velocidadeEsquecimento: [0.80, 0.90, 1.00, 1.11, 1.38],
      interferenciaProativa: [0.40, 0.63, 0.80, 1.00, 1.40],
      interferenciaRetroativa: [0.45, 0.67, 0.84, 1.00, 1.08],
    },
  },
  {
    faixaMin: 61, faixaMax: 70, faixaLabel: "61 a 70 anos", n: 180,
    percentis: {
      a1: [3, 5, 5, 6, 8], a2: [5, 6, 8, 9, 11], a3: [6, 8, 9, 10, 12], a4: [7, 9, 10, 12, 13], a5: [8, 10, 11, 13, 14],
      b1: [2, 4, 5, 5, 7], a6: [4, 8, 10, 11, 13], a7: [5, 8, 10, 11, 14], reconhecimento: [3, 9, 11, 13, 15],
      escoreTotal: [30, 40, 44, 49, 58], alt: [6, 13, 17, 20, 27],
      velocidadeEsquecimento: [0.78, 0.90, 1.00, 1.10, 1.38],
      interferenciaProativa: [0.50, 0.67, 0.83, 1.00, 1.40],
      interferenciaRetroativa: [0.55, 0.74, 0.86, 0.93, 1.04],
    },
  },
  {
    faixaMin: 71, faixaMax: 79, faixaLabel: "71 a 79 anos", n: 110,
    percentis: {
      a1: [3, 4, 5, 6, 8], a2: [5, 6, 7, 8, 10], a3: [5, 7, 8, 9, 11], a4: [5, 8, 9, 11, 13], a5: [7, 9, 10, 12, 14],
      b1: [1, 3, 4, 5, 7], a6: [3, 7, 8, 10, 12], a7: [4, 7, 8, 9, 12], reconhecimento: [1, 6, 7, 10, 14],
      escoreTotal: [25, 35, 39, 44, 55], alt: [4, 10, 14, 18, 24],
      velocidadeEsquecimento: [0.25, 0.60, 0.80, 1.00, 1.75],
      interferenciaProativa: [0.46, 0.73, 0.80, 0.91, 1.11],
      interferenciaRetroativa: [0.73, 0.88, 1.00, 1.11, 1.50],
    },
  },
  {
    faixaMin: 80, faixaMax: 150, faixaLabel: "80 anos ou mais", n: 69,
    percentis: {
      a1: [2, 3, 4, 5, 6], a2: [4, 5, 6, 7, 9], a3: [5, 6, 7, 7, 10], a4: [6, 7, 8, 9, 11], a5: [7, 8, 10, 11, 13],
      b1: [0, 2, 3, 4, 6], a6: [4, 6, 8, 9, 11], a7: [4, 6, 7, 8, 10], reconhecimento: [-2, 3, 6, 9, 14],
      escoreTotal: [24, 31, 34, 36, 47], alt: [5, 11, 13, 17, 22],
      velocidadeEsquecimento: [0.64, 0.75, 0.89, 1.00, 1.20],
      interferenciaProativa: [0.00, 0.57, 0.80, 1.00, 1.50],
      interferenciaRetroativa: [0.45, 0.67, 0.78, 0.89, 1.13],
    },
  },
];

// Vários testes (BPA, ETDAH-PAIS) usam manuais com muitos pontos percentílicos por medida, mas o
// próprio guia de interpretação de cada um colapsa isso em 5 faixas de classificação a partir de
// só 4 pontos de corte (p20/p40/p60/p80): Inferior / Médio Inferior / Médio / Médio Superior /
// Superior. Reaproveitamos essa simplificação em vez de modelar as ~13-21 bandas completas.
// Limitação conhecida: como as tabelas originais têm pontos intermediários (p25, p75 etc.) que
// às vezes empatam com p20/p80 (ex: ETDAH-PAIS, caso "Caio" do manual — Comportamento Adaptativo
// = 60 é tabelado como percentil 75 "Média Superior", mas aqui cai em ">80 Superior" porque p80
// também vale 60 nessa tabela), a classificação reportada pode ficar 1 faixa acima/abaixo do
// manual perto dessas bordas. Resolver exigiria modelar todos os pontos percentílicos, não só 4.
type PontosQuartis = [p20: number, p40: number, p60: number, p80: number];

function criarFaixasQuartis(pontos: PontosQuartis, continuo: boolean): Prisma.InputJsonValue[] {
  const [p20, p40, p60, p80] = pontos;
  const passo = continuo ? 0.01 : 1;
  return [
    { max: p20 - passo, percentil: "<20", classificacao: "Inferior" },
    { min: p20, max: p40 - passo, percentil: "20-40", classificacao: "Médio Inferior" },
    { min: p40, max: p60 - passo, percentil: "40-60", classificacao: "Médio" },
    { min: p60, max: p80 - passo, percentil: "60-80", classificacao: "Médio Superior" },
    { min: p80, percentil: ">80", classificacao: "Superior" },
  ];
}

// --- BPA: normas reais (Rueda, padronização 2011, N=1759) — ver docs/testes/BPA.md ---
// Só o critério "idade" foi modelado aqui — o manual também oferece normas por escolaridade
// (docs/testes/BPA.md, Tabelas 27-30), mas escolher entre os dois critérios por paciente é uma
// seleção categórica (não numérica) que o motor ainda não suporta — ver pendência no doc.
const BPA_CAMPOS = ["ac", "ad", "aa", "atencaoGeral"] as const;
type BpaCampo = (typeof BPA_CAMPOS)[number];

interface BpaFaixaEtaria {
  faixaMin: number;
  faixaMax: number;
  faixaLabel: string;
  n: number;
  pontos: Record<BpaCampo, PontosQuartis>;
}

const BPA_NORMAS: BpaFaixaEtaria[] = [
  {
    faixaMin: 6, faixaMax: 10, faixaLabel: "6 a 10 anos", n: 115,
    pontos: { ac: [34, 41, 48, 59], ad: [19, 32, 42, 56], aa: [31, 40, 47, 58], atencaoGeral: [91, 120, 136, 160] },
  },
  {
    faixaMin: 11, faixaMax: 17, faixaLabel: "11 a 17 anos", n: 235,
    pontos: { ac: [50, 69, 80, 96], ad: [32, 47, 62, 80], aa: [48, 65, 83, 100], atencaoGeral: [146, 187, 225, 256] },
  },
  {
    faixaMin: 18, faixaMax: 25, faixaLabel: "18 a 25 anos", n: 591,
    pontos: { ac: [81, 92, 103, 114], ad: [70, 82, 94, 104], aa: [86, 103, 112, 118], atencaoGeral: [247, 276, 299, 322] },
  },
  {
    faixaMin: 26, faixaMax: 30, faixaLabel: "26 a 30 anos", n: 196,
    pontos: { ac: [77, 88, 99, 110], ad: [52, 68, 80, 94], aa: [72, 87, 98, 111], atencaoGeral: [211, 243, 274, 304] },
  },
  {
    faixaMin: 31, faixaMax: 50, faixaLabel: "31 a 50 anos", n: 358,
    pontos: { ac: [66, 84, 98, 109], ad: [38, 60, 74, 90], aa: [58, 80, 95, 108], atencaoGeral: [175, 231, 265, 297] },
  },
  {
    faixaMin: 51, faixaMax: 150, faixaLabel: "51 anos ou mais", n: 264,
    pontos: { ac: [45, 61, 79, 94], ad: [12, 31, 46, 68], aa: [38, 56, 71, 88], atencaoGeral: [104, 153, 194, 244] },
  },
];

// --- ETDAH-PAIS: normas reais (Benczik, Memnon 2018, N=203, coleta 2014) — ver docs/testes/ETDAH-PAIS.md ---
// Estratificado por sexo + 4 faixas etárias (2-5, 6-9, 10-13, 14-17), mais uma tabela geral
// (sexo indefinido) usada como fallback quando o paciente não tem sexo cadastrado.
const ETDAH_PAIS_CAMPOS = ["escoreGeral", "regulacaoEmocional", "hiperatividadeImpulsividade", "comportamentoAdaptativo", "atencao"] as const;
type EtdahPaisCampo = (typeof ETDAH_PAIS_CAMPOS)[number];

interface EtdahPaisFaixa {
  faixaMin: number;
  faixaMax: number;
  faixaLabel: string;
  sexo: "MASCULINO" | "FEMININO" | null;
  // N por subgrupo sexo×idade não está detalhado no manual (só o N=203 da amostra geral) —
  // por isso é opcional aqui, ao contrário do RAVLT/BPA onde o N por faixa é conhecido.
  n?: number;
  pontos: Record<EtdahPaisCampo, PontosQuartis>;
}

const ETDAH_PAIS_NORMAS: EtdahPaisFaixa[] = [
  {
    faixaMin: 2, faixaMax: 5, faixaLabel: "Feminino, 2 a 5 anos", sexo: "FEMININO",
    pontos: {
      escoreGeral: [127.4, 139.6, 173.8, 209], regulacaoEmocional: [36, 41.8, 53, 57.6],
      hiperatividadeImpulsividade: [25.4, 30.8, 35.2, 67.4], comportamentoAdaptativo: [37, 46, 51, 63.4],
      atencao: [18.8, 23.4, 28.2, 35.6],
    },
  },
  {
    faixaMin: 6, faixaMax: 9, faixaLabel: "Feminino, 6 a 9 anos", sexo: "FEMININO",
    pontos: {
      escoreGeral: [124.4, 144, 176, 192.8], regulacaoEmocional: [34.8, 45, 49.4, 61],
      hiperatividadeImpulsividade: [25, 29.2, 34, 50.6], comportamentoAdaptativo: [29, 47.2, 55.8, 60.2],
      atencao: [22.8, 26, 29.6, 35],
    },
  },
  {
    faixaMin: 10, faixaMax: 13, faixaLabel: "Feminino, 10 a 13 anos", sexo: "FEMININO",
    pontos: {
      escoreGeral: [106, 134.8, 156, 194.6], regulacaoEmocional: [30, 39, 48.2, 55.8],
      hiperatividadeImpulsividade: [20.2, 25, 28.6, 38.2], comportamentoAdaptativo: [33.2, 43.4, 49.6, 57],
      atencao: [19.4, 23.4, 32.4, 38.6],
    },
  },
  {
    faixaMin: 14, faixaMax: 17, faixaLabel: "Feminino, 14 a 17 anos", sexo: "FEMININO",
    pontos: {
      escoreGeral: [95.2, 111.8, 122, 149.2], regulacaoEmocional: [26.4, 33, 36.2, 39.2],
      hiperatividadeImpulsividade: [18.6, 23.6, 29, 33.6], comportamentoAdaptativo: [24.4, 36, 40.2, 46.6],
      atencao: [14, 21, 24.4, 33.4],
    },
  },
  {
    faixaMin: 2, faixaMax: 5, faixaLabel: "Masculino, 2 a 5 anos", sexo: "MASCULINO",
    pontos: {
      escoreGeral: [151.4, 162.6, 168, 183], regulacaoEmocional: [33.4, 40, 47, 52.6],
      hiperatividadeImpulsividade: [25.6, 36.6, 45, 52.8], comportamentoAdaptativo: [47, 52.4, 55.8, 61.6],
      atencao: [21, 25.2, 31.6, 35.4],
    },
  },
  {
    faixaMin: 6, faixaMax: 9, faixaLabel: "Masculino, 6 a 9 anos", sexo: "MASCULINO",
    pontos: {
      escoreGeral: [129, 145.4, 165.2, 214.8], regulacaoEmocional: [30, 37, 45, 61.8],
      hiperatividadeImpulsividade: [26, 30, 35.4, 46.8], comportamentoAdaptativo: [38.6, 48, 51, 60],
      atencao: [20, 31, 34.4, 44],
    },
  },
  {
    faixaMin: 10, faixaMax: 13, faixaLabel: "Masculino, 10 a 13 anos", sexo: "MASCULINO",
    pontos: {
      escoreGeral: [134.2, 155.6, 175.6, 222.8], regulacaoEmocional: [30.9, 36.1, 47.6, 60],
      hiperatividadeImpulsividade: [28, 35, 40, 51.2], comportamentoAdaptativo: [44.4, 51.4, 54.6, 60],
      atencao: [22.6, 30, 37.2, 43],
    },
  },
  {
    faixaMin: 14, faixaMax: 17, faixaLabel: "Masculino, 14 a 17 anos", sexo: "MASCULINO",
    pontos: {
      escoreGeral: [112.4, 132.2, 143, 188.6], regulacaoEmocional: [25.8, 32.4, 39.6, 55.4],
      hiperatividadeImpulsividade: [21.2, 28, 35.2, 38.6], comportamentoAdaptativo: [34, 43, 52.6, 53.8],
      atencao: [17.4, 26, 31.8, 36.4],
    },
  },
  {
    // Amostra geral (N=203), sem separar sexo/idade — usada só quando o paciente não tem sexo cadastrado.
    faixaMin: 2, faixaMax: 17, faixaLabel: "Amostra geral (2 a 17 anos)", sexo: null, n: 203,
    pontos: {
      escoreGeral: [121, 144, 166, 193], regulacaoEmocional: [31, 38, 47, 56],
      hiperatividadeImpulsividade: [24.8, 29, 35, 44], comportamentoAdaptativo: [37, 46, 53, 60],
      atencao: [21, 26, 32, 39],
    },
  },
];

// --- SCARED (versão Autorrelato): normas reais (Isolan et al. 2011, Porto Alegre-RS, N=2410) ---
// ver docs/testes/SCARED.md. Diferente de RAVLT/BPA/ETDAH-PAIS, o protocolo só fornece
// média±DP por grupo (não pontos percentílicos diretos) — convertemos para os mesmos limites de
// escore bruto usando os z-scores padrão das bandas do próprio protocolo (<10, 10-25, 25-75,
// 75-90, >90 percentil): z10=-1,2816, z25=-0,6745, z75=+0,6745, z90=+1,2816; limite = média + z×DP.
// Isso evita ensinar o motor de cálculo a fazer estatística em tempo real — os limites já vêm
// prontos como faixas normais, mesmo formato usado nos outros testes.
const SCARED_AUTORRELATO_CAMPOS = [
  "total", "panicoSomatico", "ansiedadeGeneralizada", "ansiedadeSeparacao", "fobiaSocial", "evitacaoEscolar",
] as const;
type ScaredCampo = (typeof SCARED_AUTORRELATO_CAMPOS)[number];
type MediaDP = [media: number, dp: number];

function criarFaixasZScore(mediaDp: MediaDP): Prisma.InputJsonValue[] {
  const [media, dp] = mediaDp;
  const Z10 = -1.2816, Z25 = -0.6745, Z75 = 0.6745, Z90 = 1.2816;
  const p10 = media + Z10 * dp;
  const p25 = media + Z25 * dp;
  const p75 = media + Z75 * dp;
  const p90 = media + Z90 * dp;
  return [
    { max: p10, percentil: "<10", classificacao: "Muito abaixo da média" },
    { min: p10, max: p25, percentil: "10-25", classificacao: "Abaixo da média" },
    { min: p25, max: p75, percentil: "25-75", classificacao: "Média" },
    { min: p75, max: p90, percentil: "75-90", classificacao: "Acima da média" },
    { min: p90, percentil: ">90", classificacao: "Muito acima da média — atenção clínica" },
  ];
}

interface ScaredFaixa {
  faixaMin: number;
  faixaMax: number;
  faixaLabel: string;
  sexo: "MASCULINO" | "FEMININO";
  pontos: Record<ScaredCampo, MediaDP>;
}

// ⚠️ O protocolo não define o corte etário exato "Criança" vs "Adolescente" (ver pendência no
// doc) — usamos a convenção mais comum na literatura de origem (Birmaher et al.): 9-12 Criança,
// 13-18 Adolescente. Confirmar com a psicóloga antes de uso clínico real.
const SCARED_AUTORRELATO_NORMAS: ScaredFaixa[] = [
  {
    faixaMin: 9, faixaMax: 12, faixaLabel: "Menino, 9 a 12 anos (Criança)", sexo: "MASCULINO",
    pontos: {
      total: [22.60, 10.45], panicoSomatico: [4.16, 3.80], ansiedadeGeneralizada: [7.24, 3.57],
      ansiedadeSeparacao: [4.98, 2.65], fobiaSocial: [4.98, 2.83], evitacaoEscolar: [1.24, 1.19],
    },
  },
  {
    faixaMin: 9, faixaMax: 12, faixaLabel: "Menina, 9 a 12 anos (Criança)", sexo: "FEMININO",
    pontos: {
      total: [26.55, 12.21], panicoSomatico: [5.36, 4.69], ansiedadeGeneralizada: [8.03, 3.70],
      ansiedadeSeparacao: [6.03, 3.22], fobiaSocial: [5.74, 2.92], evitacaoEscolar: [1.39, 1.30],
    },
  },
  {
    faixaMin: 13, faixaMax: 18, faixaLabel: "Menino, 13 a 18 anos (Adolescente)", sexo: "MASCULINO",
    pontos: {
      total: [19.73, 10.41], panicoSomatico: [3.29, 3.40], ansiedadeGeneralizada: [7.51, 3.73],
      ansiedadeSeparacao: [3.55, 2.36], fobiaSocial: [4.43, 2.95], evitacaoEscolar: [0.94, 1.14],
    },
  },
  {
    faixaMin: 13, faixaMax: 18, faixaLabel: "Menina, 13 a 18 anos (Adolescente)", sexo: "FEMININO",
    pontos: {
      total: [25.69, 12.17], panicoSomatico: [5.34, 4.58], ansiedadeGeneralizada: [8.87, 3.78],
      ansiedadeSeparacao: [4.78, 2.86], fobiaSocial: [5.46, 3.20], evitacaoEscolar: [1.24, 1.21],
    },
  },
];

// Classificação qualitativa padrão Wechsler (Tabela 5.24 do manual WAIS-III, WECHSLER &
// NASCIMENTO 2004, amostra brasileira N=788) — compartilhada entre WAIS-III e WASI, que remete
// explicitamente à mesma tabela (docs/testes/WASI.md). Percentil = ponto médio da frequência
// acumulada de cada faixa de classificação.
const WECHSLER_CLASSIFICACAO_FAIXAS: Prisma.InputJsonValue[] = [
  { max: 69, percentil: 2, classificacao: "Extremamente Baixo" },
  { min: 70, max: 79, percentil: 8, classificacao: "Limítrofe" },
  { min: 80, max: 89, percentil: 20, classificacao: "Média Inferior" },
  { min: 90, max: 109, percentil: 49, classificacao: "Média" },
  { min: 110, max: 119, percentil: 82, classificacao: "Média Superior" },
  { min: 120, max: 129, percentil: 97, classificacao: "Superior" },
  { min: 130, percentil: 99.9, classificacao: "Muito Superior" },
];

const TESTES_PLACEHOLDER: TesteSeed[] = [
  {
    nome: "Escala Wechsler de Inteligência para Adultos — 3ª ed.",
    sigla: "WAIS-III",
    dominio: DominioCognitivo.INTELIGENCIA,
    descricao:
      "Avalia o funcionamento intelectual em 4 índices fatoriais (Compreensão Verbal, Organização " +
      "Perceptual, Memória Operacional, Velocidade de Processamento) + QI Total. Classificação real " +
      "da Tabela 5.24 do manual brasileiro (amostra N=788).",
    algoritmoCorrecao: {
      // Modelo de 4 índices fatoriais (o que a prática clínica real usa), não o antigo QI Verbal/Execução.
      // O profissional lança os índices já convertidos pelas tabelas do manual oficial (proprietário,
      // 7 faixas etárias x 13 subtestes — ver docs/testes/WAIS-III.md) — este motor só converte
      // índice -> percentil/classificação, não agrega subtestes brutos.
      indicesFatoriais: {
        ICV: ["Vocabulário", "Semelhanças", "Informação"],
        IOP: ["Cubos", "Raciocínio Matricial"],
        IMO: ["Dígitos", "Sequência de Números e Letras"],
        IVP: ["Código", "Procurar Símbolos"],
      },
      campos: [
        { chave: "icv", label: "ICV — Índice de Compreensão Verbal" },
        { chave: "iop", label: "IOP — Índice de Organização Perceptual" },
        { chave: "imo", label: "IMO — Índice de Memória Operacional" },
        { chave: "ivp", label: "IVP — Índice de Velocidade de Processamento" },
        { chave: "qit", label: "QIT — Quociente Intelectual Total" },
      ],
    },
    referenciaBibliografica: "WECHSLER, D.; NASCIMENTO, E. Escala de Inteligência Wechsler para Adultos – WAIS-III: manual técnico. São Paulo: CasaPsi Livraria e Editora, 2004.",
    isPlaceholder: false,
    tabelasNormativas: [
      {
        // Classificação é a mesma para QIT/QIV/QIE e para os 4 índices fatoriais, independente da
        // idade exata dentro da faixa normatizada (16-89 anos) — por isso uma única tabela "geral"
        // basta aqui, mesmo com escolherTabelaNormativa aceitando faixaMin/faixaMax.
        criterio: "geral",
        faixaMin: 16,
        faixaMax: 89,
        conversao: {
          tipo: "percentil_por_campo",
          fonte: "Tabela 5.24 do manual (WECHSLER & NASCIMENTO, 2004), amostra brasileira N=788 — percentil = ponto médio da faixa acumulada de cada classificação.",
          faixas: WECHSLER_CLASSIFICACAO_FAIXAS,
        },
      },
    ],
  },
  {
    nome: "Escala Wechsler Abreviada de Inteligência",
    sigla: "WASI",
    dominio: DominioCognitivo.INTELIGENCIA,
    descricao:
      "Versão abreviada do WAIS, 4 subtestes (Vocabulário, Semelhanças, Cubos, Raciocínio " +
      "Matricial) ou 2 (versão rápida: Vocabulário + Raciocínio Matricial). Escore de subteste em " +
      "Escore T (média 50, DP 10); QI Total/Verbal/Execução usam a mesma classificação Wechsler " +
      "padrão do WAIS-III.",
    algoritmoCorrecao: {
      // Mesmo princípio do WAIS-III: o profissional lança os escores T dos subtestes e os QIs já
      // convertidos pelas tabelas oficiais do manual (23 faixas etárias — ver docs/testes/WASI.md,
      // Tabelas A.1.1-A.1.23 para escore T por subteste, A.3-A.6 para soma de T -> QI). Este motor
      // só classifica o QI já calculado, não agrega subtestes.
      subtestes: {
        versaoCompleta: ["Vocabulário", "Semelhanças", "Cubos", "Raciocínio Matricial"],
        versaoRapida: ["Vocabulário", "Raciocínio Matricial"],
      },
      campos: [
        { chave: "vocabulario", label: "Vocabulário (Escore T, 20-80)" },
        { chave: "semelhancas", label: "Semelhanças (Escore T, 20-80) — só na versão completa" },
        { chave: "cubos", label: "Cubos (Escore T, 20-80) — só na versão completa" },
        { chave: "raciocinioMatricial", label: "Raciocínio Matricial (Escore T, 20-80)" },
        { chave: "qiVerbal", label: "QI Verbal (Tabela A.3, Vocabulário+Semelhanças) — só na versão completa" },
        { chave: "qiExecucao", label: "QI Execução (Tabela A.4, Cubos+Rac.Matricial) — só na versão completa" },
        { chave: "qiTotal", label: "QI Total (Tabela A.5 versão completa ou A.6 versão rápida)" },
      ],
    },
    referenciaBibliografica:
      "WECHSLER, D. WASI: Escala Wechsler Abreviada de Inteligência — manual profissional. " +
      "Adaptação e normatização brasileira. São Paulo: Pearson/Casa do Psicólogo.",
    isPlaceholder: false,
    tabelasNormativas: [
      {
        criterio: "geral",
        faixaMin: 6,
        faixaMax: 89,
        conversao: {
          tipo: "percentil_por_campo",
          fonte:
            "Classificação Wechsler padrão (mesma Tabela 5.24 do WAIS-III — o manual WASI remete " +
            "explicitamente a ela, ver docs/testes/WASI.md) aplicada a qiTotal/qiVerbal/qiExecucao.",
          faixasPorCampo: {
            qiTotal: WECHSLER_CLASSIFICACAO_FAIXAS,
            qiVerbal: WECHSLER_CLASSIFICACAO_FAIXAS,
            qiExecucao: WECHSLER_CLASSIFICACAO_FAIXAS,
          },
        },
      },
    ],
  },
  {
    nome: "Teste de Aprendizagem Auditivo-Verbal de Rey",
    sigla: "RAVLT",
    dominio: DominioCognitivo.MEMORIA,
    descricao:
      "Memória episódica verbal — 5 tentativas de aprendizagem da Lista A (A1-A5), lista de " +
      "interferência B (B1), evocação imediata pós-interferência (A6), evocação tardia (A7) e " +
      "reconhecimento. Normas brasileiras reais (Paula & Malloy-Diniz, Vetor 2018, N=1458, 12 " +
      "faixas etárias de 6 a 80+ anos, sem estratificação por sexo).",
    algoritmoCorrecao: {
      etapas: [
        "A1 a A5 (aprendizagem, mesma lista repetida 5x)",
        "B1 (lista de interferência, 1 apresentação)",
        "A6 (evocação imediata pós-interferência, sem reler a lista)",
        "A7 (evocação tardia, após ~20min de intervalo)",
        "Reconhecimento (lê-se 50 palavras: 15 da lista A + 15 da lista B + 20 distratores)",
      ],
      // 9 campos lançados diretamente pelo profissional; os 5 campos derivados são calculados
      // pelo formulário de lançamento (fórmulas abaixo) e chegam ao motor já prontos para
      // conversão em percentil — o motor de cálculo não agrega, só converte (ver docs/testes/RAVLT.md).
      campos: [
        { chave: "a1", label: "A1 — 1ª tentativa, palavras corretas (0-15)" },
        { chave: "a2", label: "A2 — 2ª tentativa (0-15)" },
        { chave: "a3", label: "A3 — 3ª tentativa (0-15)" },
        { chave: "a4", label: "A4 — 4ª tentativa (0-15)" },
        { chave: "a5", label: "A5 — 5ª tentativa (0-15)" },
        { chave: "b1", label: "B1 — lista de interferência, palavras corretas (0-15)" },
        { chave: "a6", label: "A6 — evocação imediata pós-interferência (0-15)" },
        { chave: "a7", label: "A7 — evocação tardia (0-15)" },
        { chave: "reconhecimento", label: "Reconhecimento — (acertos entre as 50 palavras) - 35" },
        { chave: "escoreTotal", label: "Escore Total = A1+A2+A3+A4+A5 (calculado)" },
        { chave: "alt", label: "ALT (Aprendizagem ao Longo das Tentativas) = Escore Total - (5×A1) (calculado)" },
        { chave: "velocidadeEsquecimento", label: "Velocidade de Esquecimento = A7/A6 (calculado)" },
        { chave: "interferenciaProativa", label: "Interferência Proativa = B1/A1 (calculado)" },
        { chave: "interferenciaRetroativa", label: "Interferência Retroativa = A6/A5 (calculado)" },
      ],
    },
    referenciaBibliografica:
      "PAULA, J. J. de; MALLOY-DINIZ, L. F. RAVLT: Teste de Aprendizagem Auditivo-Verbal de Rey " +
      "— Livro de Instruções. 1. ed. São Paulo: Vetor Editora, 2018. Coleção RAVLT, v.1.",
    isPlaceholder: false,
    tabelasNormativas: RAVLT_NORMAS.map((faixa) => ({
      criterio: "idade",
      faixaMin: faixa.faixaMin,
      faixaMax: faixa.faixaMax,
      faixaLabel: faixa.faixaLabel,
      conversao: {
        tipo: "percentil_por_campo",
        fonte: `Normas brasileiras RAVLT (Paula & Malloy-Diniz, 2018), faixa ${faixa.faixaLabel}, n=${faixa.n}.`,
        faixasPorCampo: Object.fromEntries(
          RAVLT_CAMPOS.map((campo) => [
            campo,
            criarFaixasPercentilRAVLT(faixa.percentis[campo], RAVLT_CAMPOS_CONTINUOS.has(campo)),
          ])
        ),
      },
    })),
  },
  {
    nome: "Bateria Psicológica para Avaliação da Atenção",
    sigla: "BPA",
    dominio: DominioCognitivo.ATENCAO,
    descricao:
      "Atenção Concentrada (AC), Dividida (AD) e Alternada (AA), mais a medida composta Atenção " +
      "Geral. Normas brasileiras reais (Rueda, padronização 2011, N=1759, 6 faixas etárias de 6 a " +
      "51+ anos, critério idade).",
    algoritmoCorrecao: {
      subtestes: ["AC", "AD", "AA"],
      formulaEscoreBruto: "P = A - (E + O), por subteste, dentro do tempo cronometrado (AC 2min, AD 4min, AA 2min30s)",
      // Atenção Geral é calculada pelo formulário de lançamento (soma dos 3 subtestes) e chega
      // ao motor já pronta para conversão, mesmo princípio já usado no RAVLT/WAIS-III.
      campos: [
        { chave: "ac", label: "AC — Atenção Concentrada (P = A - (E+O))" },
        { chave: "ad", label: "AD — Atenção Dividida (P = A - (E+O))" },
        { chave: "aa", label: "AA — Atenção Alternada (P = A - (E+O))" },
        { chave: "atencaoGeral", label: "Atenção Geral = AC + AD + AA (calculado)" },
      ],
    },
    referenciaBibliografica:
      "RUEDA, F. J. M. Bateria Psicológica para Avaliação da Atenção (BPA): manual técnico. " +
      "São Paulo: Vetor Editora, 2013.",
    isPlaceholder: false,
    tabelasNormativas: BPA_NORMAS.map((faixa) => ({
      criterio: "idade",
      faixaMin: faixa.faixaMin,
      faixaMax: faixa.faixaMax,
      faixaLabel: faixa.faixaLabel,
      conversao: {
        tipo: "percentil_por_campo",
        fonte: `Normas brasileiras BPA (Rueda, 2011), faixa ${faixa.faixaLabel}, n=${faixa.n}.`,
        faixasPorCampo: Object.fromEntries(
          BPA_CAMPOS.map((campo) => [campo, criarFaixasQuartis(faixa.pontos[campo], false)])
        ),
      },
    })),
  },
  {
    nome: "Escala de Responsividade Social — 2ª ed.",
    sigla: "SRS-2",
    dominio: DominioCognitivo.RASTREIO_TEA,
    descricao: `Rastreio quantitativo de traços do espectro autista em 5 subescalas + escore composto + escore T total. ${AVISO_PLACEHOLDER}`,
    algoritmoCorrecao: {
      aviso: AVISO_PLACEHOLDER,
      // A prática real reporta escore T por fator (não soma tudo em 1 total) — modo "por_campo".
      campos: [
        { chave: "percepcaoSocial", label: "Percepção Social (escore T)" },
        { chave: "cognicaoSocial", label: "Cognição Social (escore T)" },
        { chave: "comunicacaoSocial", label: "Comunicação Social (escore T)" },
        { chave: "motivacaoSocial", label: "Motivação Social (escore T)" },
        { chave: "padroesRestritosRepetitivos", label: "Padrões Restritos e Repetitivos (escore T)" },
        { chave: "comunicacaoEInteracaoSocial", label: "Comunicação e Interação Social — composto (escore T)" },
        { chave: "escoreTotal", label: "Pontuação SRS-2 Total (escore T)" },
      ],
    },
    referenciaBibliografica: "CONSTANTINO, J. N.; GRUBER, C. P. Escala de Responsividade Social – Segunda Edição (SRS-2). Torrance, CA: Western Psychological Services, 2012.",
    tabelasNormativas: [
      {
        criterio: "idade",
        faixaMin: 18,
        faixaMax: 90,
        conversao: {
          aviso: AVISO_PLACEHOLDER,
          tipo: "escoreT_por_campo",
          faixas: [
            { min: 0, max: 59, classificacao: "Dentro dos limites normais" },
            { min: 60, max: 65, classificacao: "Nível Leve" },
            { min: 66, max: 75, classificacao: "Nível Moderado" },
            { min: 76, max: 999, classificacao: "Nível Severo" },
          ],
        },
      },
    ],
  },
  {
    nome: "Quociente do Espectro Autista",
    sigla: "AQ-50",
    dominio: DominioCognitivo.RASTREIO_TEA,
    descricao: `Autorrelato de 50 itens em 5 subescalas de traços autísticos. ${AVISO_PLACEHOLDER}`,
    algoritmoCorrecao: {
      aviso: AVISO_PLACEHOLDER,
      subescalas: ["Habilidade social", "Troca de atenção", "Atenção a detalhes", "Comunicação", "Imaginação"],
      formulaEscoreBruto: "1 ponto por item respondido na direção 'concordo com o traço autístico', soma total 0-50",
      campos: [{ chave: "escoreTotal", label: "Escore total (soma dos 50 itens, 0-50)" }],
    },
    referenciaBibliografica: "Baron-Cohen, S. et al. — Autism-Spectrum Quotient (AQ). (referência a confirmar)",
    tabelasNormativas: [
      {
        criterio: "idade",
        faixaMin: 16,
        faixaMax: 90,
        conversao: {
          aviso: AVISO_PLACEHOLDER,
          tipo: "ponto_de_corte_por_soma_total",
          faixas: [
            { min: 0, max: 25, classificacao: "Abaixo do ponto de corte" },
            { min: 26, max: 999, classificacao: "Acima do ponto de corte — traços significativos" },
          ],
        },
      },
    ],
  },
  {
    nome: "Escala de Avaliação de Comportamentos Infantojuvenis no TDAH em Ambiente Familiar — Versão para Pais",
    sigla: "ETDAH-PAIS",
    dominio: DominioCognitivo.RASTREIO_TDAH,
    descricao:
      "Rastreio (respondido pelos pais/cuidadores) de comportamentos relacionados ao TDAH no " +
      "ambiente familiar, 2 a 17 anos, 58 itens em 4 fatores: Regulação Emocional, Hiperatividade/" +
      "Impulsividade, Comportamento Adaptativo, Atenção. Normas brasileiras reais (Benczik, Memnon " +
      "2018, N=203, coleta 2014), estratificadas por sexo + 4 faixas etárias.",
    algoritmoCorrecao: {
      fatores: ["Regulação Emocional", "Hiperatividade/Impulsividade", "Comportamento Adaptativo", "Atenção"],
      escalaResposta: "Likert 1-6 (Nunca a Muito Frequentemente), sobre os últimos 6 meses",
      // Todos os itens do Fator 3 (Comportamento Adaptativo) + o item 1 do Fator 4 são de conteúdo
      // protetivo e devem ter a pontuação invertida (7 - valor assinalado) ANTES de somar — feito
      // pelo formulário de lançamento, não pelo motor de cálculo (mesmo princípio das demais provas).
      inversaoDeEscore: "Fator 3 (todos os itens) + Fator 4 item 1: pontuação invertida = 7 - valor assinalado",
      formulaEscoreBruto: "soma simples dos itens de cada fator (já com a inversão aplicada onde necessário)",
      campos: [
        { chave: "regulacaoEmocional", label: "Fator 1 — Regulação Emocional (bruto, 19 itens)" },
        { chave: "hiperatividadeImpulsividade", label: "Fator 2 — Hiperatividade/Impulsividade (bruto, 13 itens)" },
        { chave: "comportamentoAdaptativo", label: "Fator 3 — Comportamento Adaptativo (bruto já invertido, 14 itens)" },
        { chave: "atencao", label: "Fator 4 — Atenção (bruto já invertido no item 1, 12 itens)" },
        { chave: "escoreGeral", label: "Escore Geral = soma dos 4 fatores (calculado)" },
      ],
    },
    referenciaBibliografica:
      "BENCZIK, E. B. P. ETDAH-PAIS: Escala de Avaliação de Comportamentos Infantojuvenis no " +
      "Transtorno de Déficit de Atenção/Hiperatividade em Ambiente Familiar — Versão para Pais: " +
      "manual. São Paulo: Memnon, 2018.",
    isPlaceholder: false,
    tabelasNormativas: ETDAH_PAIS_NORMAS.map((faixa) => ({
      criterio: "idade+sexo",
      faixaMin: faixa.faixaMin,
      faixaMax: faixa.faixaMax,
      faixaLabel: faixa.faixaLabel,
      sexo: faixa.sexo,
      conversao: {
        tipo: "percentil_por_campo",
        fonte:
          `Normas brasileiras ETDAH-PAIS (Benczik, 2018), faixa ${faixa.faixaLabel}` +
          (faixa.n ? `, n=${faixa.n}.` : " (N do subgrupo não detalhado no manual)."),
        faixasPorCampo: Object.fromEntries(
          ETDAH_PAIS_CAMPOS.map((campo) => [campo, criarFaixasQuartis(faixa.pontos[campo], true)])
        ),
      },
    })),
  },
  {
    nome: "Teste dos Cinco Dígitos",
    sigla: "FDT",
    dominio: DominioCognitivo.FUNCOES_EXECUTIVAS,
    descricao: `Velocidade de processamento, controle inibitório e flexibilidade cognitiva a partir de 4 etapas com dígitos. ${AVISO_PLACEHOLDER}`,
    algoritmoCorrecao: {
      aviso: AVISO_PLACEHOLDER,
      etapas: ["Leitura", "Contagem", "Escolha (inibição)", "Alternância (flexibilidade)"],
      campos: [
        { chave: "inibicao", label: "FDT Inibição (percentil)" },
        { chave: "flexibilidade", label: "FDT Flexibilidade (percentil)" },
      ],
    },
    referenciaBibliografica: "SEDÓ, M. A. Five Digit Test (FDT): manual. Madrid: TEA Ediciones, 2007.",
    tabelasNormativas: [
      {
        criterio: "idade+escolaridade",
        conversao: {
          aviso: AVISO_PLACEHOLDER,
          tipo: "percentil_por_campo",
          faixas: [
            { min: 0, max: 2, classificacao: "Deficitário" },
            { min: 3, max: 8, classificacao: "Limítrofe" },
            { min: 9, max: 24, classificacao: "Médio Inferior" },
            { min: 25, max: 74, classificacao: "Médio" },
            { min: 75, max: 90, classificacao: "Médio Superior" },
            { min: 91, max: 97, classificacao: "Superior" },
            { min: 98, max: 100, classificacao: "Muito Superior" },
          ],
        },
      },
    ],
  },
  {
    nome: "Inventário de Ansiedade de Beck",
    sigla: "BAI",
    dominio: DominioCognitivo.SINTOMAS_EMOCIONAIS,
    descricao: `Autorrelato de 21 itens para severidade de sintomas de ansiedade. ${AVISO_PLACEHOLDER}`,
    algoritmoCorrecao: {
      aviso: AVISO_PLACEHOLDER,
      formulaEscoreBruto: "soma dos 21 itens (0-3 cada), total 0-63",
      campos: [{ chave: "escoreTotal", label: "Escore total BAI (soma dos 21 itens, 0-63)" }],
    },
    referenciaBibliografica:
      "BECK, A. T.; EPSTEIN, N.; BROWN, G.; STEER, R. A. An inventory for measuring clinical anxiety: Psychometric properties. Journal of Consulting and Clinical Psychology, v. 56, n. 6, p. 893–897, 1988.",
    tabelasNormativas: [
      {
        criterio: "geral",
        conversao: {
          aviso: AVISO_PLACEHOLDER,
          tipo: "ponto_de_corte_por_soma_total",
          faixas: [
            { min: 0, max: 10, classificacao: "Sintomas Mínimos" },
            { min: 11, max: 19, classificacao: "Sintomas Leves" },
            { min: 20, max: 30, classificacao: "Sintomas Moderados" },
            { min: 31, max: 63, classificacao: "Sintomas Graves" },
          ],
        },
      },
    ],
  },
  {
    nome: "Escala de Depressão de Beck — 2ª ed.",
    sigla: "BDI-II",
    dominio: DominioCognitivo.SINTOMAS_EMOCIONAIS,
    descricao: `Autorrelato de 21 itens para severidade de sintomas depressivos. ${AVISO_PLACEHOLDER}`,
    algoritmoCorrecao: {
      aviso: AVISO_PLACEHOLDER,
      formulaEscoreBruto: "soma dos 21 itens (0-3 cada), total 0-63",
      campos: [{ chave: "escoreTotal", label: "Escore total BDI-II (soma dos 21 itens, 0-63)" }],
    },
    referenciaBibliografica: "BECK, A. T.; STEER, R. A.; BROWN, G. K. Manual for the Beck Depression Inventory-II. San Antonio, TX: Psychological Corporation, 1996.",
    tabelasNormativas: [
      {
        criterio: "geral",
        conversao: {
          aviso: AVISO_PLACEHOLDER,
          tipo: "ponto_de_corte_por_soma_total",
          faixas: [
            { min: 0, max: 13, classificacao: "Sintomas Mínimos" },
            { min: 14, max: 19, classificacao: "Sintomas Leves" },
            { min: 20, max: 28, classificacao: "Sintomas Moderados" },
            { min: 29, max: 63, classificacao: "Sintomas Graves" },
          ],
        },
      },
    ],
  },
  {
    nome: "Bateria Fatorial de Personalidade",
    sigla: "BFP",
    dominio: DominioCognitivo.PERSONALIDADE,
    descricao: `Personalidade a partir do modelo dos Cinco Grandes Fatores: Extroversão, Socialização, Realização, Neuroticismo e Abertura. ${AVISO_PLACEHOLDER}`,
    algoritmoCorrecao: {
      aviso: AVISO_PLACEHOLDER,
      campos: [
        { chave: "extroversao", label: "Extroversão (percentil)" },
        { chave: "socializacao", label: "Socialização (percentil)" },
        { chave: "realizacao", label: "Realização (percentil)" },
        { chave: "neuroticismo", label: "Neuroticismo (percentil)" },
        { chave: "abertura", label: "Abertura (percentil)" },
      ],
    },
    referenciaBibliografica: "NUNES, C. H. S. S.; HUTZ, C. S.; NUNES, M. F. O. Bateria Fatorial de Personalidade (BFP): manual técnico. São Paulo: Casa do Psicólogo, 2010.",
    tabelasNormativas: [
      {
        criterio: "geral",
        conversao: {
          aviso: AVISO_PLACEHOLDER,
          tipo: "percentil_por_campo",
          faixas: [
            { min: 0, max: 24, classificacao: "Baixo" },
            { min: 25, max: 74, classificacao: "Médio" },
            { min: 75, max: 100, classificacao: "Alto" },
          ],
        },
      },
    ],
  },
  {
    nome: "Screen for Child Anxiety Related Emotional Disorders — Versão Pais/Cuidadores",
    sigla: "SCARED-PAIS",
    dominio: DominioCognitivo.SINTOMAS_EMOCIONAIS,
    descricao:
      "Rastreio de ansiedade respondido pelos pais/cuidadores sobre a criança/adolescente, 41 " +
      "itens em 5 subescalas (Pânico/Sintomas Somáticos, Ansiedade Generalizada, Ansiedade de " +
      "Separação, Fobia Social, Evitação Escolar) + Total. Classificação por nota de corte fixa " +
      "(Birmaher et al. 1999), sem estratificação por idade/sexo — diferente da versão Autorrelato.",
    algoritmoCorrecao: {
      subescalas: {
        panicoSomatico: { itens: [1, 6, 9, 12, 15, 18, 19, 22, 24, 27, 30, 34, 38], maximo: 26 },
        ansiedadeGeneralizada: { itens: [5, 7, 14, 21, 23, 28, 33, 35, 37], maximo: 18 },
        ansiedadeSeparacao: { itens: [4, 8, 13, 16, 20, 25, 29, 31], maximo: 16 },
        fobiaSocial: { itens: [3, 10, 26, 32, 39, 40, 41], maximo: 14 },
        evitacaoEscolar: { itens: [2, 11, 17, 36], maximo: 8 },
      },
      formulaEscoreBruto: "soma simples dos itens (Likert 0-2) de cada subescala",
      campos: [
        { chave: "panicoSomatico", label: "Pânico/Sintomas Somáticos (bruto, 0-26)" },
        { chave: "ansiedadeGeneralizada", label: "Ansiedade Generalizada (bruto, 0-18)" },
        { chave: "ansiedadeSeparacao", label: "Ansiedade de Separação (bruto, 0-16)" },
        { chave: "fobiaSocial", label: "Fobia Social (bruto, 0-14)" },
        { chave: "evitacaoEscolar", label: "Evitação Escolar (bruto, 0-8)" },
        { chave: "total", label: "Total = soma das 5 subescalas (calculado, 0-82)" },
      ],
    },
    referenciaBibliografica:
      "BIRMAHER, B. et al. Psychometric properties of the Screen for Child Anxiety Related " +
      "Emotional Disorders (SCARED). J Am Acad Child Adolesc Psychiatry, 1999. Validação " +
      "brasileira: ISOLAN, L. et al. Psychometric properties of the SCARED in Brazilian children " +
      "and adolescents. Journal of Anxiety Disorders, 25, 741-748, 2011.",
    isPlaceholder: false,
    tabelasNormativas: [
      {
        criterio: "fixo",
        conversao: {
          tipo: "percentil_por_campo",
          fonte: "Notas de corte fixas (Birmaher et al., 1999), sem estratificação por idade/sexo.",
          faixasPorCampo: {
            panicoSomatico: [
              { max: 6, classificacao: "Não clínico" },
              { min: 7, classificacao: "Clínico" },
            ],
            ansiedadeGeneralizada: [
              { max: 8, classificacao: "Não clínico" },
              { min: 9, classificacao: "Clínico" },
            ],
            ansiedadeSeparacao: [
              { max: 4, classificacao: "Não clínico" },
              { min: 5, classificacao: "Clínico" },
            ],
            fobiaSocial: [
              { max: 7, classificacao: "Não clínico" },
              { min: 8, classificacao: "Clínico" },
            ],
            evitacaoEscolar: [
              { max: 2, classificacao: "Não clínico" },
              { min: 3, classificacao: "Clínico" },
            ],
            total: [
              { max: 24, classificacao: "Não clínico" },
              { min: 25, classificacao: "Clínico" },
            ],
          },
        },
      },
    ],
  },
  {
    nome: "Screen for Child Anxiety Related Emotional Disorders — Versão Autorrelato",
    sigla: "SCARED-AUTORRELATO",
    dominio: DominioCognitivo.SINTOMAS_EMOCIONAIS,
    descricao:
      "Rastreio de ansiedade respondido pela própria criança/adolescente (9-18 anos), mesmos 41 " +
      "itens/5 subescalas do SCARED-PAIS, mas com correção por Z-score contra norma brasileira " +
      "(Isolan et al. 2011, Porto Alegre-RS, N=2410) estratificada por idade (Criança/Adolescente) " +
      "e sexo — diferente da versão Pais, que usa nota de corte fixa.",
    algoritmoCorrecao: {
      subescalas: {
        panicoSomatico: { itens: [1, 6, 9, 12, 15, 18, 19, 22, 24, 27, 30, 34, 38], maximo: 26 },
        ansiedadeGeneralizada: { itens: [5, 7, 14, 21, 23, 28, 33, 35, 37], maximo: 18 },
        ansiedadeSeparacao: { itens: [4, 8, 13, 16, 20, 25, 29, 31], maximo: 16 },
        fobiaSocial: { itens: [3, 10, 26, 32, 39, 40, 41], maximo: 14 },
        evitacaoEscolar: { itens: [2, 11, 17, 36], maximo: 8 },
      },
      formulaEscoreBruto: "soma simples dos itens (Likert 0-2) de cada subescala",
      campos: [
        { chave: "panicoSomatico", label: "Pânico/Sintomas Somáticos (bruto, 0-26)" },
        { chave: "ansiedadeGeneralizada", label: "Ansiedade Generalizada (bruto, 0-18)" },
        { chave: "ansiedadeSeparacao", label: "Ansiedade de Separação (bruto, 0-16)" },
        { chave: "fobiaSocial", label: "Fobia Social (bruto, 0-14)" },
        { chave: "evitacaoEscolar", label: "Evitação Escolar (bruto, 0-8)" },
        { chave: "total", label: "Total = soma das 5 subescalas (calculado, 0-82)" },
      ],
    },
    referenciaBibliografica:
      "ISOLAN, L.; SALUM, G. A.; OSOWSKI, A. T.; AMARO, E.; MANFRO, G. G. Psychometric properties " +
      "of the Screen for Child Anxiety Related Emotional Disorders (SCARED) in Brazilian children " +
      "and adolescents. Journal of Anxiety Disorders, 25, 741-748, 2011.",
    isPlaceholder: false,
    tabelasNormativas: SCARED_AUTORRELATO_NORMAS.map((faixa) => ({
      criterio: "idade+sexo",
      faixaMin: faixa.faixaMin,
      faixaMax: faixa.faixaMax,
      faixaLabel: faixa.faixaLabel,
      sexo: faixa.sexo,
      conversao: {
        tipo: "percentil_por_campo",
        fonte: `Norma brasileira SCARED-Autorrelato (Isolan et al., 2011), ${faixa.faixaLabel}. Corte etário Criança/Adolescente (9-12 / 13-18) é convenção da literatura, não confirmado no protocolo — ver pendência.`,
        faixasPorCampo: Object.fromEntries(
          SCARED_AUTORRELATO_CAMPOS.map((campo) => [campo, criarFaixasZScore(faixa.pontos[campo])])
        ),
      },
    })),
  },
];

async function main() {
  console.log("Removendo catálogo fixo de testes anterior (se houver)...");
  // Recria o catálogo fixo inteiro a cada seed (placeholders e testes já reais) — é um script
  // de dev/fixture, não uma migração; AplicacaoDeTeste referencia testeId, então isso é seguro
  // só em ambiente local sem dados de produção reais.
  await prisma.tabelaNormativa.deleteMany({ where: { teste: { escopo: EscopoTeste.FIXO } } });
  await prisma.teste.deleteMany({ where: { escopo: EscopoTeste.FIXO } });

  for (const t of TESTES_PLACEHOLDER) {
    const isPlaceholder = t.isPlaceholder ?? true;
    const criado = await prisma.teste.create({
      data: {
        nome: t.nome,
        sigla: t.sigla,
        dominio: t.dominio,
        escopo: EscopoTeste.FIXO,
        descricao: t.descricao,
        algoritmoCorrecao: t.algoritmoCorrecao,
        referenciaBibliografica: t.referenciaBibliografica,
        isPlaceholder,
        tabelasNormativas: {
          create: t.tabelasNormativas.map((f) => ({
            criterio: f.criterio,
            faixaMin: f.faixaMin,
            faixaMax: f.faixaMax,
            faixaLabel: f.faixaLabel,
            sexo: f.sexo,
            conversao: f.conversao,
          })),
        },
      },
    });
    console.log(`  ✓ ${criado.sigla} — ${criado.nome} (isPlaceholder=${isPlaceholder})`);
  }

  console.log(`\n${TESTES_PLACEHOLDER.length} testes semeados.`);

  // Fixture de desenvolvimento local: garante 1 Clínica + 1 Profissional para
  // exercitar as telas sem precisar de UI de cadastro ainda. Idempotente.
  const existente = await prisma.profissional.findUnique({ where: { email: DEV_PROFISSIONAL_EMAIL } });
  if (!existente) {
    const clinica = await prisma.clinica.create({
      data: {
        razaoSocial: "MentEssence Neuropsicologia e Avaliação (dev)",
        corPrimaria: "#E66A1F",
        corSecundaria: "#737373",
      },
    });
    const senhaHash = await bcrypt.hash("dev12345", 10);
    const profissional = await prisma.profissional.create({
      data: {
        clinicaId: clinica.id,
        nome: "Dra. Exemplo (dev)",
        crp: "06/000000",
        email: DEV_PROFISSIONAL_EMAIL,
        senhaHash,
        papel: PapelProfissional.ADMIN,
      },
    });
    console.log(`\nFixture de dev criada: clínica "${clinica.razaoSocial}" + profissional "${profissional.nome}" (${profissional.email}).`);
  } else {
    console.log("\nFixture de dev já existia — não recriada.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
