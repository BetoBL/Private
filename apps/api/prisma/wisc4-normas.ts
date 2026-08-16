// Normas do WISC-IV para o seed do catálogo. Diferente de adl2-normas.ts / brief2-normas.ts, que
// embutem os números no próprio .ts, aqui os dados são LIDOS dos JSON já transcritos e validados em
// `docs/testes/` — são ~9.400 valores (Anexo A completo), e duplicá-los num .ts gerado criaria duas
// cópias que divergem na primeira correção. O JSON é a fonte única; este módulo só reformata.
//
// Isso acopla o seed ao layout do repositório (`docs/` na raiz), o que é aceitável porque o seed é
// script de dev/fixture rodado via `prisma db seed` de dentro do repo — não entra no build de
// produção (`tsc` compila só `src`).
//
// Fluxo de cálculo do WISC-IV (Cap. 4 do manual, ver docs/testes/WISC-IV.md):
//   1. bruto de cada subteste -> ponto ponderado (1-19), pela Tabela A.1.x da FAIXA ETÁRIA da
//      criança (33 faixas de 4 meses, 6:0 a 16:11) — daí `criterio: "idade_meses"`.
//   2. soma dos ponderados dos subtestes principais de cada índice -> Ponto Composto + Rank
//      Percentil + IC 90/95, pelas Tabelas A.2-A.6, que NÃO variam por idade (a normalização por
//      idade já aconteceu no passo 1). No motor isso é um `campoDerivado` (soma do `ponderado`
//      extraído da faixa de outros campos), com `exigeTodasFontes` ligado — ver nota abaixo.
//
// Por que `exigeTodasFontes: true`: se um subteste principal não for lançado, somar 0 no lugar dele
// produziria um QI Total plausível e errado. Com a flag, o índice afetado volta "não calculado" em
// vez de um número silenciosamente inválido.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Prisma } from "@prisma/client";

const DOCS_TESTES = join(__dirname, "..", "..", "..", "docs", "testes");

function lerJson<T>(arquivo: string): T {
  return JSON.parse(readFileSync(join(DOCS_TESTES, arquivo), "utf8")) as T;
}

// --- Tabelas A.1.x: bruto -> ponderado, por subteste e faixa etária ---

// No JSON de origem a chave é o PONTO PONDERADO e o valor é o intervalo de escore bruto que leva a
// ele ("4-6", "0", ou "-" quando nenhum bruto mapeia para aquele ponderado nessa faixa). O motor
// precisa do sentido inverso: localizar a faixa pelo bruto lançado. É essa inversão que este
// módulo faz.
type TabelaA1 = Record<string, Record<string, Record<string, string>> & { _fonte?: string }>;

interface ArquivoA1 {
  _subtestes_principais: string[];
  _subtestes_suplementares: string[];
  faixas: TabelaA1;
}

// [soma, composto, rankPercentil, ic90, ic95]
type LinhaComposto = [number, number, string, string, string];

interface TabelaComposto {
  titulo: string;
  indice: string;
  nome: string;
  subtestesPrincipais: string[];
  linhas: LinhaComposto[];
}

interface ArquivoA2A7 {
  A2_ICV: TabelaComposto;
  A3_IOP: TabelaComposto;
  A4_IMO: TabelaComposto;
  A5_IVP: TabelaComposto;
  A6_QIT: TabelaComposto;
  A7_PRO_RATA: { linhas: Array<[number, number]> };
}

const A1 = lerJson<ArquivoA1>("WISC-IV-tabelas-A1.json");
const A2A7 = lerJson<ArquivoA2A7>("WISC-IV-tabelas-A2-A7.json");

// Siglas do manual (CB, SM, ...) viram chaves de campo minúsculas, que é o formato usado pelos
// outros testes do catálogo e pelo formulário de lançamento.
export const WISC4_PRINCIPAIS = A1._subtestes_principais.map((s) => s.toLowerCase());
export const WISC4_SUPLEMENTARES = A1._subtestes_suplementares.map((s) => s.toLowerCase());

export const WISC4_LABEL_SUBTESTE: Record<string, string> = {
  cb: "Cubos",
  sm: "Semelhanças",
  dg: "Dígitos",
  cn: "Conceitos Figurativos",
  cd: "Código",
  vc: "Vocabulário",
  snl: "Sequência de Números e Letras",
  rm: "Raciocínio Matricial",
  co: "Compreensão",
  ps: "Procurar Símbolos",
  cf: "Completar Figuras",
  ca: "Cancelamento",
  in: "Informação",
  ar: "Aritmética",
  rp: "Raciocínio com Palavras",
};

// "6:0-6:3" -> { faixaMin: 72, faixaMax: 75 } (idade em meses completos).
// Ressalva: o manual manda calcular a idade cronológica com mês = 30 dias e sem arredondar,
// enquanto `calcularIdadeEmMeses` (motorCalculo.ts) conta meses de calendário. As duas contas só
// divergem em casos de borda (criança a poucos dias de mudar de faixa de 4 meses); registrado em
// docs/testes/WISC-IV.md como pendência conhecida, não corrigido aqui.
function faixaEtariaEmMeses(rotulo: string): { faixaMin: number; faixaMax: number } {
  const [inicio, fim] = rotulo.split("-");
  const paraMeses = (parte: string) => {
    const [anos, meses] = parte.split(":").map(Number);
    return anos * 12 + meses;
  };
  return { faixaMin: paraMeses(inicio), faixaMax: paraMeses(fim) };
}

// "4-6" -> {min:4,max:6}; "0" -> {min:0,max:0}; "-" -> null (ponderado inatingível nessa faixa).
function intervaloBruto(texto: string): { min: number; max: number } | null {
  const limpo = texto.trim();
  if (limpo === "" || limpo === "-") return null;
  const [minTexto, maxTexto] = limpo.split("-");
  const min = Number(minTexto);
  const max = maxTexto === undefined ? min : Number(maxTexto);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return { min, max };
}

function faixasDoSubteste(coluna: Record<string, string>): Prisma.InputJsonValue[] {
  return Object.entries(coluna)
    .map(([ponderado, bruto]) => {
      const intervalo = intervaloBruto(bruto);
      return intervalo === null ? null : { ...intervalo, ponderado: Number(ponderado) };
    })
    .filter((f): f is { min: number; max: number; ponderado: number } => f !== null)
    .sort((a, b) => a.min - b.min);
}

export interface Wisc4FaixaEtaria {
  faixaLabel: string;
  faixaMin: number;
  faixaMax: number;
  faixasPorSubteste: Record<string, Prisma.InputJsonValue[]>;
}

export const WISC4_FAIXAS_ETARIAS: Wisc4FaixaEtaria[] = Object.entries(A1.faixas).map(([rotulo, subtestes]) => {
  const { faixaMin, faixaMax } = faixaEtariaEmMeses(rotulo);
  const faixasPorSubteste: Record<string, Prisma.InputJsonValue[]> = {};
  for (const [sigla, coluna] of Object.entries(subtestes)) {
    if (sigla.startsWith("_")) continue; // metadados do JSON (_fonte), não são subtestes
    faixasPorSubteste[sigla.toLowerCase()] = faixasDoSubteste(coluna as Record<string, string>);
  }
  return { faixaLabel: rotulo, faixaMin, faixaMax, faixasPorSubteste };
});

// --- Tabelas A.2-A.6: soma dos ponderados -> composto + percentil + IC ---

// Não é emitida `classificacao` de propósito. Nenhuma tabela de classificação qualitativa
// ("Muito Superior"/"Médio"/...) foi encontrada na adaptação brasileira deste manual — ela é
// citada como estando no Manual Técnico, que não temos. Inventar os rótulos Wechsler-padrão aqui
// seria atribuir ao manual algo que não foi conferido nele. O laudo classifica pelo percentil,
// usando o sistema escolhido pelo profissional (ver src/lib/classificacaoPercentil.ts).
function faixasDoIndice(tabela: TabelaComposto): Prisma.InputJsonValue[] {
  return tabela.linhas.map(([soma, composto, percentil, ic90, ic95]) => ({
    min: soma,
    max: soma,
    composto,
    percentil,
    ic90,
    ic95,
  }));
}

export interface Wisc4Indice {
  chave: string;
  label: string;
  fontes: string[];
  faixas: Prisma.InputJsonValue[];
}

export const WISC4_INDICES: Wisc4Indice[] = [
  ["icv", A2A7.A2_ICV],
  ["iop", A2A7.A3_IOP],
  ["imo", A2A7.A4_IMO],
  ["ivp", A2A7.A5_IVP],
  ["qit", A2A7.A6_QIT],
].map(([chave, tabela]) => {
  const t = tabela as TabelaComposto;
  return {
    chave: chave as string,
    label: `${t.indice} — ${t.nome}`,
    fontes: t.subtestesPrincipais.map((s) => s.toLowerCase()),
    faixas: faixasDoIndice(t),
  };
});

// Tabela A.7 (soma pró-rata para derivar ICV/IOP com 2 dos 3 subtestes). Exposta para o catálogo
// registrar que o dado existe, mas NÃO aplicada automaticamente: decidir quando usar pró-rata é
// julgamento clínico (o manual manda evitar sempre que houver suplementar disponível e marcar
// "PRO" no protocolo), e o motor hoje não modela substituição de subteste. Ver docs/testes/WISC-IV.md.
export const WISC4_PRO_RATA: Array<[number, number]> = A2A7.A7_PRO_RATA.linhas;
