import type { DirecaoMelhorPior } from "./api";

// Posição do texto da classificação no espectro baixo↔alto, só pelo que a palavra diz — não tem
// noção de "bom/ruim" ainda. Isso é resolvido depois, combinando com Teste.direcao (ver
// inferirSeveridade), porque a mesma palavra ("Superior", "Alto") significa coisas opostas num
// teste de habilidade (RAVLT, WAIS) e numa escala de sintoma (SCARED, ETDAH-PAIS, BRIEF2).
type PosicaoTexto = -2 | -1 | 0 | 1 | 2;

// Ordem importa: frases mais específicas/extremas primeiro, senão uma frase genérica ("baixo")
// bate antes por substring numa frase mais específica que já deveria ter parado num nível
// diferente ("muito baixo", "médio inferior").
const REGRAS_POSICAO: Array<{ contem: string[]; naoContem?: string[]; posicao: PosicaoTexto }> = [
  {
    contem: [
      "muito acima da média",
      "atenção clínica",
      "traços significativos",
      "sintomas graves",
      "nível severo",
      "muito superior",
      "muito alto",
      "excepcionalmente elevado",
    ],
    posicao: 2,
  },
  { contem: ["clínico"], naoContem: ["não clínico", "não-clínico", "potencialmente", "moderadamente"], posicao: 2 },
  { contem: ["médio inferior", "média inferior"], posicao: -1 },
  { contem: ["médio superior", "média superior"], posicao: 1 },
  {
    contem: ["extremamente baixo", "muito abaixo da média", "muito baixo", "deficitário", "sintomas mínimos"],
    posicao: -2,
  },
  {
    contem: ["abaixo da média", "abaixo do ponto de corte", "limítrofe", "nível leve", "sintomas leves", "inferior", "baixo"],
    posicao: -1,
  },
  { contem: ["potencialmente clínico", "moderadamente clínico"], posicao: 1 },
  { contem: ["acima da média", "acima do ponto de corte", "superior", "alto"], posicao: 1 },
  {
    contem: [
      "médio",
      "média",
      "típico",
      "dentro dos limites normais",
      "dentro da média",
      "nível moderado",
      "sintomas moderados",
      "não clínico",
    ],
    posicao: 0,
  },
];

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function posicaoTextoClassificacao(classificacao: string | undefined): PosicaoTexto | null {
  if (!classificacao) return null;
  const texto = normalizar(classificacao);
  for (const regra of REGRAS_POSICAO) {
    const bateAlgumaFrase = regra.contem.some((frase) => texto.includes(normalizar(frase)));
    if (!bateAlgumaFrase) continue;
    const bateExclusao = regra.naoContem?.some((frase) => texto.includes(normalizar(frase))) ?? false;
    if (bateExclusao) continue;
    return regra.posicao;
  }
  return null;
}

export interface SeveridadeVisual {
  barra: string; // classe Tailwind de fundo para a barra/marcador
  badge: string; // classes de fundo+texto+borda para um badge/pill
}

const VISUAL_POR_POSICAO_EFETIVA: Record<PosicaoTexto, SeveridadeVisual> = {
  [-2]: { barra: "bg-red-600", badge: "bg-red-50 text-red-700 border-red-200" },
  [-1]: { barra: "bg-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  [0]: { barra: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  [1]: { barra: "bg-sky-500", badge: "bg-sky-50 text-sky-700 border-sky-200" },
  [2]: { barra: "bg-sky-700", badge: "bg-sky-50 text-sky-800 border-sky-300" },
};

const VISUAL_NEUTRO: SeveridadeVisual = { barra: "bg-clay", badge: "bg-mist text-ink/70 border-mist" };

// Nunca aplica cor de "bom/ruim" quando direcao é NEUTRO (ex: facetas de personalidade do BFP) ou
// quando não dá pra ler uma posição no texto da classificação (ex: BRIEF2 hoje só tem T-score
// numérico, sem rótulo de classificação) — nesses casos mostra sempre neutro, nunca adivinha.
export function inferirSeveridade(classificacao: string | undefined, direcao: DirecaoMelhorPior): SeveridadeVisual {
  const posTexto = posicaoTextoClassificacao(classificacao);
  if (posTexto === null || direcao === "NEUTRO") return VISUAL_NEUTRO;
  const efetiva = (direcao === "MENOR_MELHOR" ? -posTexto : posTexto) as PosicaoTexto;
  return VISUAL_POR_POSICAO_EFETIVA[efetiva];
}
