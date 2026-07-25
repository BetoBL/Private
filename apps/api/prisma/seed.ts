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

// --- BPA: normas reais (Rueda, padronização 2011, N=1759) — ver docs/testes/BPA.md ---
// O manual tabela 13 pontos percentílicos por medida; simplificamos para 4 pontos de corte
// (p20/p40/p60/p80) que reproduzem a classificação de 5 faixas do próprio guia de interpretação
// (Inferior / Médio Inferior / Médio / Médio Superior / Superior) sem precisar de 13 bandas.
// Só o critério "idade" foi modelado aqui — o manual também oferece normas por escolaridade
// (docs/testes/BPA.md, Tabelas 27-30), mas escolher entre os dois critérios por paciente é uma
// seleção categórica (não numérica) que o motor ainda não suporta — ver pendência no doc.
const BPA_CAMPOS = ["ac", "ad", "aa", "atencaoGeral"] as const;
type BpaCampo = (typeof BPA_CAMPOS)[number];
type PontosQuartis = [p20: number, p40: number, p60: number, p80: number];

interface BpaFaixaEtaria {
  faixaMin: number;
  faixaMax: number;
  faixaLabel: string;
  n: number;
  pontos: Record<BpaCampo, PontosQuartis>;
}

function criarFaixasBPA(pontos: PontosQuartis): Prisma.InputJsonValue[] {
  const [p20, p40, p60, p80] = pontos;
  return [
    { max: p20 - 1, percentil: "<20", classificacao: "Inferior" },
    { min: p20, max: p40 - 1, percentil: "20-40", classificacao: "Médio Inferior" },
    { min: p40, max: p60 - 1, percentil: "40-60", classificacao: "Médio" },
    { min: p60, max: p80 - 1, percentil: "60-80", classificacao: "Médio Superior" },
    { min: p80, percentil: ">80", classificacao: "Superior" },
  ];
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

const TESTES_PLACEHOLDER: TesteSeed[] = [
  {
    nome: "Escala Wechsler de Inteligência para Adultos — 3ª ed.",
    sigla: "WAIS-III",
    dominio: DominioCognitivo.INTELIGENCIA,
    descricao: `Avalia o funcionamento intelectual em 4 índices fatoriais (Compreensão Verbal, Organização Perceptual, Memória Operacional, Velocidade de Processamento) + QI Total. ${AVISO_PLACEHOLDER}`,
    algoritmoCorrecao: {
      aviso: AVISO_PLACEHOLDER,
      // Modelo de 4 índices fatoriais (o que a prática clínica real usa), não o antigo QI Verbal/Execução.
      // O profissional lança os índices já convertidos pelas tabelas do manual oficial (proprietário) —
      // este motor só converte índice -> percentil/classificação, não agrega subtestes.
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
    tabelasNormativas: [
      {
        criterio: "idade",
        faixaMin: 18,
        faixaMax: 90,
        conversao: {
          aviso: AVISO_PLACEHOLDER,
          tipo: "percentil_por_indice",
          faixas: [
            { min: 0, max: 69, percentil: 2, classificacao: "Deficitário" },
            { min: 70, max: 79, percentil: 8, classificacao: "Limítrofe" },
            { min: 80, max: 89, percentil: 20, classificacao: "Médio Inferior" },
            { min: 90, max: 109, percentil: 50, classificacao: "Médio" },
            { min: 110, max: 119, percentil: 82, classificacao: "Médio Superior" },
            { min: 120, max: 129, percentil: 95, classificacao: "Superior" },
            { min: 130, max: 999, percentil: 99, classificacao: "Muito Superior" },
          ],
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
          BPA_CAMPOS.map((campo) => [campo, criarFaixasBPA(faixa.pontos[campo])])
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
    nome: "Escala de Transtorno de Déficit de Atenção/Hiperatividade — 2ª ed.",
    sigla: "ETDAH-2",
    dominio: DominioCognitivo.RASTREIO_TDAH,
    descricao: `Rastreio de sintomas de desatenção, hiperatividade e impulsividade. ${AVISO_PLACEHOLDER}`,
    algoritmoCorrecao: {
      aviso: AVISO_PLACEHOLDER,
      fatores: ["Desatenção", "Hiperatividade", "Impulsividade"],
      formulaEscoreBruto: "soma dos itens de cada fator, respondente pais/professor/autorrelato",
      campos: [
        { chave: "desatencao", label: "Desatenção (bruto)" },
        { chave: "hiperatividade", label: "Hiperatividade (bruto)" },
        { chave: "impulsividade", label: "Impulsividade (bruto)" },
      ],
    },
    referenciaBibliografica: "Mattos, P. et al. — ETDAH-2. (referência a confirmar)",
    tabelasNormativas: [
      {
        criterio: "idade",
        faixaMin: 6,
        faixaMax: 90,
        conversao: {
          aviso: AVISO_PLACEHOLDER,
          tipo: "percentil_por_fator",
          faixas: [
            { min: 0, max: 30, percentil: 30, classificacao: "Não sugestivo" },
            { min: 31, max: 60, percentil: 70, classificacao: "Sugestivo — investigar" },
            { min: 61, max: 999, percentil: 95, classificacao: "Fortemente sugestivo" },
          ],
        },
      },
    ],
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
