// Normas do FDT (Teste dos Cinco Dígitos) para o seed do catálogo. Mesmo princípio do
// wisc4-normas.ts: os dados são LIDOS de docs/testes/FDT-tabelas.json (fonte única, gerada por
// scripts/extrair-normas-fdt.mjs), não duplicados aqui — duplicar criaria duas cópias que divergem
// na primeira correção.
//
// FONTE ÚNICA, SEM CONFERÊNCIA CRUZADA: diferente do BRIEF2/WISC-IV, não temos o manual do FDT em
// PDF — a aba "FDT - NORMAS" do Excel legado da psicóloga é a única fonte disponível. Ver
// `_fonte` dentro do próprio JSON e a memória do usuário project_neurologic_riscos_normas.
//
// Fluxo de cálculo do FDT (ver docs/testes/FDT.md):
//   1. Lançamento: 4 tempos brutos (segundos) + 4 contagens de erro — Leitura, Contagem, Escolha,
//      Alternância — pela idade do paciente na data da sessão (9 faixas, sem estratificação por
//      sexo).
//   2. Cada um dos 4 tempos e 4 erros já tem sua própria tabela bruto -> faixa de percentil
//      (`faixasPorCampo`).
//   3. Inibição e Flexibilidade (só em TEMPO — não há contagem de erro própria para elas) são
//      `camposDerivados` por SUBTRAÇÃO do bruto de entrada (não de um campo de saída já
//      convertido — por isso `campoValor: "valorBruto"`, ver motorCalculo.ts):
//        Inibição      = tempo(Escolha) - tempo(Contagem)
//        Flexibilidade = tempo(Alternância) - tempo(Escolha)
//      e têm sua PRÓPRIA tabela bruto -> percentil (não reaproveita a de Escolha/Contagem/etc).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { CampoDerivado, FaixaConversao } from "../src/lib/motorCalculo";

const DOCS_TESTES = join(__dirname, "..", "..", "..", "docs", "testes");

function lerJson<T>(arquivo: string): T {
  return JSON.parse(readFileSync(join(DOCS_TESTES, arquivo), "utf8")) as T;
}

interface FaixaPercentilJson {
  min: number;
  max?: number;
  percentil: string;
}

interface FaixaEtariaJson {
  tabela: string;
  faixaMin: number;
  faixaMax: number | null;
  n: number | null;
  descricao: string;
  tempo: Record<string, FaixaPercentilJson[]>;
  erros: Record<string, FaixaPercentilJson[]>;
}

interface ArquivoFdt {
  _fonte: string;
  faixasEtarias: FaixaEtariaJson[];
}

const ARQUIVO = lerJson<ArquivoFdt>("FDT-tabelas.json");

export const FDT_FONTE = ARQUIVO._fonte;

export const FDT_SUBTESTES_TEMPO = ["leitura", "contagem", "escolha", "alternancia", "inibicao", "flexibilidade"] as const;
export const FDT_SUBTESTES_ERRO = ["leitura", "contagem", "escolha", "alternancia"] as const;

// Nomes de campo do formulário/motor: "tempoLeitura"/"errosLeitura", não "leitura" sozinho — um
// mesmo nome de subteste existe nas duas unidades (tempo em segundos, erro em contagem), e
// `faixasPorCampo` é uma tabela só por chave.
export function campoTempo(subteste: string): string {
  return `tempo${subteste[0].toUpperCase()}${subteste.slice(1)}`;
}
export function campoErros(subteste: string): string {
  return `erros${subteste[0].toUpperCase()}${subteste.slice(1)}`;
}

export interface FaixaEtariaFdt {
  faixaMin: number;
  // Faixa aberta (76+) vira um teto bem alto, não `null`: `escolherTabelaNormativa` só compara
  // tabelas com faixaMin/faixaMax numéricos — `null` tiraria essa faixa da disputa por idade.
  faixaMax: number;
  faixaLabel: string;
  n: number | null;
  faixasPorCampo: Record<string, FaixaConversao[]>;
}

const TETO_FAIXA_ABERTA = 999;

// A planilha dela só corta em 5/25/50/75/95 (ver `_rotulos_percentil` no JSON) — não nos pontos
// de um sistema de classificação diferente (ex.: o placeholder anterior usava 2/8/24/74/90/97,
// que não é desta fonte). Por isso o rótulo descritivo aqui é um quinteto simétrico nesses MESMOS
// cortes, não um esquema emprestado de outro lugar. Serve só para a barra/cor do laudo
// (`ResultadoResumo.tsx` lê `classificacao`, não `percentil`) — o rótulo de percentil exato
// (">95", "95", ...) continua disponível à parte, sem perda de granularidade.
// Os 2 pontos de fronteira que tocam uma cauda aberta (exatos 95 e 5) entram na categoria mais
// extrema correspondente (>=95 vira "Muito Superior", <=5 vira "Muito Baixo") — é a leitura clínica
// usual desses dois pontos de corte. Os 3 do meio (75/50/25) não têm essa assimetria; entram na
// faixa imediatamente melhor só por convenção de desempate.
const CLASSIFICACAO_POR_LIMITES: Record<string, string> = {
  "95": "Muito Superior",
  "75-95": "Superior",
  "75": "Superior",
  "50-75": "Médio",
  "50": "Médio",
  "25-50": "Médio",
  "25": "Médio",
  "5-25": "Inferior",
  "5": "Muito Baixo",
};

function classificacaoDoPercentil(percentil: string): string | undefined {
  const numeros = [...percentil.matchAll(/\d+/g)].map((m) => Number(m[0]));
  if (percentil.trim().startsWith("<")) return "Muito Baixo"; // "< 5": cauda pior, sem limite inferior
  if (numeros.length === 0) return undefined;
  if (numeros.length === 1) return CLASSIFICACAO_POR_LIMITES[String(numeros[0])];
  const par = [...numeros].sort((a, b) => a - b).join("-");
  return CLASSIFICACAO_POR_LIMITES[par];
}

function paraFaixaConversao(faixas: FaixaPercentilJson[]): FaixaConversao[] {
  return faixas.map((f) => ({ min: f.min, max: f.max, percentil: f.percentil, classificacao: classificacaoDoPercentil(f.percentil) }));
}

// Inibição/Flexibilidade são sempre a mesma subtração de bruto, em qualquer faixa etária — só a
// tabela bruto -> percentil que as classifica muda por faixa (já em `faixasPorCampo` acima).
export const FDT_CAMPOS_DERIVADOS: Record<string, CampoDerivado> = {
  [campoTempo("inibicao")]: {
    fontes: [campoTempo("escolha"), campoTempo("contagem")],
    campoValor: "valorBruto",
    operacao: "subtracao",
  },
  [campoTempo("flexibilidade")]: {
    fontes: [campoTempo("alternancia"), campoTempo("escolha")],
    campoValor: "valorBruto",
    operacao: "subtracao",
  },
};

export const FDT_FAIXAS_ETARIAS: FaixaEtariaFdt[] = ARQUIVO.faixasEtarias.map((faixa) => {
  const faixasPorCampo: Record<string, FaixaConversao[]> = {};
  for (const subteste of FDT_SUBTESTES_TEMPO) {
    const dados = faixa.tempo[subteste];
    if (dados?.length) faixasPorCampo[campoTempo(subteste)] = paraFaixaConversao(dados);
  }
  for (const subteste of FDT_SUBTESTES_ERRO) {
    const dados = faixa.erros[subteste];
    if (dados?.length) faixasPorCampo[campoErros(subteste)] = paraFaixaConversao(dados);
  }
  const faixaMax = faixa.faixaMax ?? TETO_FAIXA_ABERTA;
  return {
    faixaMin: faixa.faixaMin,
    faixaMax,
    faixaLabel: faixa.faixaMax !== null ? `${faixa.faixaMin} a ${faixa.faixaMax} anos` : `${faixa.faixaMin} anos ou mais`,
    n: faixa.n,
    faixasPorCampo,
  };
});
