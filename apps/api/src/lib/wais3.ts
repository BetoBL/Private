// Cálculo do WAIS-III espelhando a planilha da psicóloga (aba WAIS-III + WAIS-NORMAS). Função pura.
// Dados normativos: docs/testes/WAIS-III-planilha.json (gerado por scripts/gerar-wais3-planilha.mjs).
//
// Fluxo (igual ao da planilha):
//   1. bruto de cada subteste -> ponderado, pela tabela da FAIXA ETÁRIA do paciente (escolhida pelos
//      DIAS de vida na data da aplicação, como a planilha faz);
//   2. soma dos ponderados de cada escala/índice -> ponto composto, percentil e IC 90/95%;
//   3. classificação pelo PERCENTIL.
//
// Diferença deliberada em relação à planilha: ela soma o que houver e converte mesmo com subteste
// faltando (um QI "plausível e errado"). Aqui um índice só é calculado quando TODOS os subtestes que o
// compõem foram lançados (com as substituições previstas na planilha); senão volta "não calculado".
import type { FaixaConversao, ResultadoPorCampo } from "./motorCalculo";

export interface Wais3Planilha {
  tipo: "wais3_planilha";
  bandasEtarias: Array<{ rotulo: string; diasMin: number }>;
  a1: Record<string, Record<string, Array<{ min: number; max?: number; ponderado: number | null }>>>;
  somaParaComposto: Record<
    string,
    Array<{ min: number; max?: number; composto: string | number | null; percentil: string | number | null; ic90: string | number | null; ic95: string | number | null }>
  >;
  indices: Record<string, string>;
  // Análise avançada (planilha, colunas K-S): valor crítico por faixa de idade e limite de "raro" por índice.
  valoresCriticos?: Array<{ anosMin: number; icv: number; iop: number; imo: number; ivp: number }>;
  limitesRaro?: Record<string, number>;
  // Facilidades e dificuldades por subteste (Tabela B.3) e comparação entre discrepâncias (Tabelas B.1/B.2).
  subtestesVsMedia?: Array<{
    id: string;
    rotulo: string;
    mediaTotal: boolean;
    subtestes: Record<string, { critico15: number | null; critico05: number | null; taxas: { p1: number | null; p2: number | null; p5: number | null; p10: number | null; p25: number | null } }>;
  }>;
  habilidades?: Array<{ numero: number | null; nome: string; grupo: string; subtestes: string[] }>;
  processo?: {
    spam: Record<string, { direta: TabelaSpam; inversa: TabelaSpam }>;
    diferenca: Record<string, { linhas: Array<{ dif: number; pct: number | null }>; media: number | null; dp: number | null }>;
  };
  clusters?: Array<{
    chave: string;
    sigla: string;
    rotulo: string;
    subtestes: string[];
    tabela: Array<{ min: number; max?: number; composto: number | null; ic95: string | null; percentil: number | null }>;
  }>;
  comparacoesClinicas?: Array<{ a: string; b: string; rotulo: string; valorCritico: number }>;
  hipoteses?: Array<{ maior: string; menor: string; titulo: string; texto: string }>;
  discrepancias?: {
    pares: Array<[string, string]>;
    valoresCriticos: Array<{ rotulo: string; anosMin: number | null; n15: Record<string, number | null>; n05: Record<string, number | null> }>;
    frequencia: Array<Record<string, number | null>>;
  };
}

type Bruto = Record<string, number>;
type TabelaSpam = { linhas: Array<{ spam: number; pct: number | null }>; media: number | null; dp: number | null };

// Entradas da aba "escores de processo" (Dígitos). Não são subtestes: não passam pela tabela de ponderados.
export const CHAVES_PROCESSO = ["digitosSpamDireta", "digitosSpamInversa", "digitosPontosDireta", "digitosPontosInversa"];

const SUBTESTES_VERBAIS_TITULARES = ["vocabulario", "semelhancas", "aritmetica", "informacao", "compreensao"];
const EXECUCAO_TITULARES = ["completarFiguras", "cubos", "raciocinioMatricial", "arranjoFiguras"];

function numeroOuNull(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace(",", "."));
    if (v.trim() !== "" && !Number.isNaN(n)) return n;
  }
  return null;
}

// Último degrau com min <= x (LOOKUP do Excel sobre vetor ordenado). Abaixo do primeiro: não existe.
export function degrau<T extends { min: number }>(tabela: T[], x: number): T | null {
  let achado: T | null = null;
  for (const d of tabela) {
    if (d.min <= x) achado = d;
    else break;
  }
  return achado;
}

// Distribuição normal padrão acumulada (equivale a NORM.S.DIST(z; VERDADEIRO) do Excel; erro < 1,5e-7).
export function normalAcumulada(z: number): number {
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-x * x);
  return z >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
}

// Classificação de UM SUBTESTE pela planilha (coluna P): pelo ponto ponderado.
export function classificarPonderado(p: number): string {
  if (p >= 16) return "Muito Superior";
  if (p >= 14) return "Superior";
  if (p >= 12) return "Média Superior";
  if (p >= 8) return "Média";
  if (p >= 6) return "Média Inferior";
  if (p >= 4) return "Limítrofe";
  return "Deficitário";
}

export const arredondar = (n: number, casas: number) => Math.round(n * 10 ** casas) / 10 ** casas;

// Classificação da planilha (I34): por percentil.
export function classificarPorPercentil(percentil: string | number | null): string | null {
  if (percentil === null || percentil === undefined) return null;
  if (typeof percentil === "string") {
    const t = percentil.trim();
    if (t === "> 99,9") return "Muito Superior";
    if (t === "< 0,1") return "Deficitário";
  }
  const p = numeroOuNull(percentil);
  if (p === null) return null;
  if (p >= 98) return "Muito Superior";
  if (p >= 91) return "Superior";
  if (p >= 75) return "Média Superior";
  if (p >= 25) return "Média";
  if (p >= 9) return "Média Inferior";
  if (p >= 2) return "Limítrofe";
  return "Deficitário";
}

function converterSoma(dados: Wais3Planilha, indice: string, soma: number): FaixaConversao | null {
  const linha = degrau(dados.somaParaComposto[indice] ?? [], soma);
  if (!linha) return null;
  const composto = numeroOuNull(linha.composto);
  // linhas "-" / vazias das bordas da tabela = soma fora da faixa normatizada
  if (composto === null) return null;
  const percentil = typeof linha.percentil === "string" && Number.isNaN(Number(linha.percentil.replace(",", "."))) ? linha.percentil : numeroOuNull(linha.percentil);
  return {
    composto,
    percentil: percentil ?? undefined,
    ic90: linha.ic90 ?? undefined,
    ic95: linha.ic95 ?? undefined,
    classificacao: classificarPorPercentil(percentil) ?? undefined,
  } as FaixaConversao;
}

export function calcularWais3(
  brutos: Bruto,
  dados: Wais3Planilha,
  idadeDias: number,
  idadeAnos: number = Math.floor(idadeDias / 365.25)
): { modo: "por_campo"; porCampo: Record<string, ResultadoPorCampo>; extras: Record<string, unknown> } {
  const porCampo: Record<string, ResultadoPorCampo> = {};
  const banda = [...dados.bandasEtarias].reverse().find((b) => idadeDias >= b.diasMin) ?? null;

  // 1) ponderados
  const ponderado: Record<string, number | null> = {};
  for (const [chave, bruto] of Object.entries(brutos)) {
    if (CHAVES_PROCESSO.includes(chave)) continue;
    const tabela = banda ? dados.a1[banda.rotulo]?.[chave] : undefined;
    const faixa = tabela ? degrau(tabela, bruto) : null;
    ponderado[chave] = faixa?.ponderado ?? null;
    // Colunas M-P da planilha: Z = (ponderado-10)/3; ponto composto = Z*15+100; percentil = NORM.S.DIST(Z)*100.
    const p = faixa?.ponderado ?? null;
    const extras =
      p !== null
        ? { z: arredondar((p - 10) / 3, 3), pontoComposto: arredondar(((p - 10) / 3) * 15 + 100, 2), percentil: arredondar(normalAcumulada((p - 10) / 3) * 100, 3), classificacao: classificarPonderado(p) }
        : {};
    porCampo[chave] = { valorBruto: bruto, faixa: faixa ? ({ ...faixa, ...extras } as FaixaConversao) : null };
  }
  const tem = (c: string) => brutos[c] !== undefined && ponderado[c] !== null;
  const p = (c: string) => ponderado[c] as number;

  // 2) somas, com as substituições da planilha
  const somar = (chaves: string[]): number | null => (chaves.every(tem) ? chaves.reduce((a, c) => a + p(c), 0) : null);

  const somaIcv = somar(["vocabulario", "semelhancas", "informacao"]);
  const somaIop = somar(["completarFiguras", "cubos", "raciocinioMatricial"]);
  const somaImo = somar(["aritmetica", "digitos", "sequenciaNumerosLetras"]);
  const somaIvp = somar(["codigos", "procurarSimbolos"]);

  // Verbal: 5 titulares + Dígitos (ou Sequência de Números e Letras no lugar dele, só se Dígitos faltar).
  let somaQiv: number | null = null;
  if (SUBTESTES_VERBAIS_TITULARES.every(tem)) {
    const sexto = tem("digitos") ? "digitos" : tem("sequenciaNumerosLetras") ? "sequenciaNumerosLetras" : null;
    if (sexto) somaQiv = SUBTESTES_VERBAIS_TITULARES.reduce((a, c) => a + p(c), 0) + p(sexto);
  }

  // Execução: Compl. Figuras, Cubos, Rac. Matricial, Arranjo de Figuras + Códigos (ou Procurar Símbolos no
  // lugar de Códigos). Armar Objetos entra no lugar de UM titular que falte (a planilha o soma quando algum
  // dos quatro falta); com mais de um faltando, não calcula.
  let somaQie: number | null = null;
  const quintoCodigos = tem("codigos") ? "codigos" : tem("procurarSimbolos") ? "procurarSimbolos" : null;
  const faltantes = EXECUCAO_TITULARES.filter((c) => !tem(c));
  if (quintoCodigos && faltantes.length <= 1 && (faltantes.length === 0 || tem("armarObjetos"))) {
    somaQie =
      EXECUCAO_TITULARES.filter(tem).reduce((a, c) => a + p(c), 0) + p(quintoCodigos) + (faltantes.length === 1 ? p("armarObjetos") : 0);
  }

  const somaQit = somaQiv !== null && somaQie !== null ? somaQiv + somaQie : null;
  const somaGai = somaIcv !== null && somaIop !== null ? somaIcv + somaIop : null;

  const somas: Record<string, number | null> = { icv: somaIcv, iop: somaIop, imo: somaImo, ivp: somaIvp, qiv: somaQiv, qie: somaQie, qit: somaQit, gai: somaGai };
  const MEMBROS: Record<string, string[]> = {
    icv: ["vocabulario", "semelhancas", "informacao"],
    iop: ["completarFiguras", "cubos", "raciocinioMatricial"],
    imo: ["aritmetica", "digitos", "sequenciaNumerosLetras"],
    ivp: ["codigos", "procurarSimbolos"],
  };
  for (const [indice, soma] of Object.entries(somas)) {
    if (soma === null) {
      porCampo[indice] = { valorBruto: null, faixa: null };
      continue;
    }
    let faixa = converterSoma(dados, indice, soma);
    // Linhas 26-28 da planilha (só para os 4 índices fatoriais): média dos ponderados (M.P.P.), diferença
    // entre o maior e o menor e se o índice é homogêneo/unitário (diferença < 5).
    const membros = MEMBROS[indice];
    if (membros) {
      const valores = membros.map(p);
      const diferenca = Math.max(...valores) - Math.min(...valores);
      faixa = { ...(faixa ?? {}), mpp: arredondar(soma / membros.length, 2), diferenca, homogeneo: diferenca < 5 ? "SIM" : "NÃO" } as FaixaConversao;
    }
    porCampo[indice] = { valorBruto: soma, faixa };
  }
  analisarAvancado(porCampo, dados, idadeAnos);
  const lancadosComNorma = new Set(Object.keys(brutos).filter((c) => ponderado[c] !== null && ponderado[c] !== undefined));
  const extras: Record<string, unknown> = {};
  const determinacao = determinarFacilidadesPorSubteste(ponderado, lancadosComNorma, dados);
  if (determinacao) extras.determinacao = determinacao;
  const discrepancias = compararDiscrepancias(porCampo, dados, idadeAnos);
  if (discrepancias) extras.discrepancias = discrepancias;
  const analiseClusters = analisarClusters(ponderado, lancadosComNorma, dados);
  if (analiseClusters) extras.clusters = analiseClusters;
  const processo = analisarProcesso(brutos, dados, banda?.rotulo ?? null);
  if (processo) extras.processo = processo;
  const habilidades = analisarHabilidades(ponderado, lancadosComNorma, dados, determinacao?.recomendacao.opcoes[0] ?? null);
  if (habilidades) extras.habilidades = habilidades;
  return { modo: "por_campo", porCampo, extras };
}

// ---------------------------------------------------------------------------------------------
// Determinação das facilidades e dificuldades por subteste (planilha, linhas 100-125).
// Cada subteste é comparado com a MÉDIA dos ponderados (de todos os lançados, ou só dos verbais/de execução,
// conforme o modo), com valor crítico e frequência acumulada da Tabela B.3 do modo escolhido.
// A planilha deixa o modo a cargo de uma lista suspensa; aqui calculamos TODOS os modos e indicamos o
// recomendado (regra da célula B25), para a tela alternar sem nova chamada.
// ---------------------------------------------------------------------------------------------
const ORDEM_SUBTESTES = [
  "vocabulario", "semelhancas", "aritmetica", "digitos", "informacao", "compreensao", "sequenciaNumerosLetras",
  "completarFiguras", "codigos", "cubos", "raciocinioMatricial", "arranjoFiguras", "procurarSimbolos", "armarObjetos",
];
const SUBTESTES_VERBAIS = new Set(["vocabulario", "semelhancas", "aritmetica", "digitos", "informacao", "compreensao", "sequenciaNumerosLetras"]);

// Frequência acumulada do desvio (coluna K da planilha): compara |diferença| com os limites 25%, 10%, 5%, 2%, 1%.
function textoFrequencia(abs: number, t: { p1: number | null; p2: number | null; p5: number | null; p10: number | null; p25: number | null }): string {
  const { p1, p2, p5, p10, p25 } = t;
  if (p1 === null || p2 === null || p5 === null || p10 === null || p25 === null) return "";
  if (abs === p25) return "25%";
  if (abs < p10) return "> 10% e < 25%";
  if (abs === p10) return "10%";
  if (abs < p5) return "> 5% e < 10%";
  if (abs === p5) return "5%";
  if (abs < p2) return "> 2% e < 5%";
  if (abs === p2) return "2%";
  if (abs < p1) return "> 1% e < 2%";
  if (abs === p1) return "1%";
  return "< 1%";
}

// Regra da célula B25 da planilha: qual média é recomendada conforme os subtestes aplicados.
function modoRecomendadoB25(tem: (c: string) => boolean): number | null {
  const v = tem("vocabulario"), se = tem("semelhancas"), ar = tem("aritmetica"), di = tem("digitos"), inf = tem("informacao"), co = tem("compreensao"), snl = tem("sequenciaNumerosLetras");
  const cf = tem("completarFiguras"), cd = tem("codigos"), cb = tem("cubos"), rm = tem("raciocinioMatricial"), af = tem("arranjoFiguras"), ps = tem("procurarSimbolos"), ao = tem("armarObjetos");
  if (cf && v && cd && se && cb && ar && rm && di && inf && af && co && !ps && !snl && !ao) return 1;
  if (cf && v && cd && se && cb && ar && rm && di && inf && !af && !co && ps && snl && !ao) return 2;
  if (cf && v && cd && se && cb && ar && rm && !di && inf && !af && co && ps && snl && !ao) return 2;
  if (cf && v && cd && se && cb && ar && rm && di && inf && af && co && ps && snl && !ao) return 3;
  if (cf && v && cd && se && !cb && ar && rm && di && inf && af && co && ps && snl && ao) return 3;
  if (cf && v && !cd && se && cb && ar && rm && di && inf && af && co && ps && snl && ao) return 3;
  if (cf && v && cd && se && cb && ar && rm && di && inf && af && co && ps && snl && ao) return 4;
  return null;
}

const RECOMENDACAO: Record<number, { texto: string; opcoes: string[] }> = {
  1: { texto: "Usar a média dos 6 Subtestes verbais e dos 5 subtestes de Execução 'OU' a Média dos 11 subtestes para os QI", opcoes: ["m65", "m11qi"] },
  2: { texto: "Usar 'APENAS' a média dos 11 Subtestes para os Índices fatoriais", opcoes: ["m11fat"] },
  3: { texto: "Usar 'APENAS' a média dos 13 Subtestes", opcoes: ["m13"] },
  4: { texto: "Usar a média dos 7 subtestes Verbais e 7 subtestes Execução 'OU' a média dos 14 subtestes", opcoes: ["m77", "m14"] },
};

function determinarFacilidadesPorSubteste(ponderado: Record<string, number | null>, lancados: Set<string>, dados: Wais3Planilha) {
  if (!dados.subtestesVsMedia || lancados.size === 0) return null;
  const p = (c: string) => ponderado[c] as number;
  const grupos = (filtro: (c: string) => boolean) => {
    const cs = ORDEM_SUBTESTES.filter((c) => lancados.has(c) && filtro(c));
    return { n: cs.length, soma: cs.reduce((a, c) => a + p(c), 0) };
  };
  const verbal = grupos((c) => SUBTESTES_VERBAIS.has(c));
  const execucao = grupos((c) => !SUBTESTES_VERBAIS.has(c));
  const geral = { n: verbal.n + execucao.n, soma: verbal.soma + execucao.soma };
  const media = (g: { n: number; soma: number }) => (g.n > 0 ? g.soma / g.n : null);
  const mediaVerbal = media(verbal);
  const mediaExec = media(execucao);
  const mediaGeral = media(geral);

  const modoB25 = modoRecomendadoB25((c) => lancados.has(c));
  const recomendacao = modoB25
    ? { modo: modoB25, ...RECOMENDACAO[modoB25] }
    : { modo: null, texto: "Verificar a quantidade de testes (Verbais / Execução) utilizados", opcoes: [] as string[] };

  const modos = dados.subtestesVsMedia.map((m) => ({
    id: m.id,
    rotulo: m.rotulo,
    mediaTotal: m.mediaTotal,
    linhas: ORDEM_SUBTESTES.filter((c) => lancados.has(c)).map((chave) => {
      const mediaDoSubteste = m.mediaTotal ? mediaGeral : SUBTESTES_VERBAIS.has(chave) ? mediaVerbal : mediaExec;
      const diferenca = mediaDoSubteste === null ? null : p(chave) - mediaDoSubteste;
      const norma = m.subtestes[chave];
      const nivel = (critico: number | null | undefined) => {
        if (diferenca === null || critico === null || critico === undefined) return { critico: critico ?? null, significativo: false, df: "", frequencia: "" };
        const significativo = Math.abs(diferenca) >= critico;
        const df = significativo ? (diferenca > 0 ? "F" : diferenca < 0 ? "D" : "") : "";
        return { critico, significativo, df, frequencia: df && norma ? textoFrequencia(Math.abs(diferenca), norma.taxas) : "" };
      };
      return {
        chave,
        ponderado: p(chave),
        media: mediaDoSubteste === null ? null : arredondar(mediaDoSubteste, 4),
        diferenca: diferenca === null ? null : arredondar(diferenca, 4),
        n05: nivel(norma?.critico05),
        n15: nivel(norma?.critico15),
      };
    }),
  }));

  return {
    resumo: {
      verbal: { n: verbal.n, soma: verbal.soma, media: mediaVerbal === null ? null : arredondar(mediaVerbal, 4) },
      execucao: { n: execucao.n, soma: execucao.soma, media: mediaExec === null ? null : arredondar(mediaExec, 4) },
      geral: { n: geral.n, soma: geral.soma, media: mediaGeral === null ? null : arredondar(mediaGeral, 4) },
    },
    recomendacao,
    modos,
  };
}

// ---------------------------------------------------------------------------------------------
// Habilidades compartilhadas (planilha, linhas 45-131; Kaufman & Lichtenberger, 2002): 82 habilidades, cada uma composta
// por 2 a 8 subtestes. Cada subteste é marcado pela sua DIFERENÇA DA MÉDIA (a mesma da determinação por subteste):
// >= +1 → "P" (positivo/força), <= −1 → "N" (negativo/fraqueza), senão "0". A interpretação depende de quantos subtestes a
// habilidade tem (n): todos P → Força; todos N → Fraqueza; e, quando n >= 3, quase todos (k de n, com no máximo um "0" ou um
// do sinal oposto) também contam (k = 2, 3, 4, 4, 4, 4 para n = 3 a 8).
//
// Diferenças em relação à planilha (que tem dois defeitos):
//  1. Subteste NÃO lançado: a planilha compara texto vazio com número e marca "P" (ex.: Armar Objetos, que raramente é
//     aplicado, aparece como "P" em todas as 24 habilidades em que entra) — isso infla as contagens e a interpretação.
//     Aqui o subteste não lançado fica sem marca e a habilidade só é interpretada quando TODOS os seus subtestes foram lançados.
//  2. A interpretação da habilidade 77 (Persistência) aponta para a linha 26 e nunca mostra nada; aqui segue a regra de n = 4.
// A média de comparação pode ser a de todos os subtestes ("total") ou a dos verbais/de execução ("verbalExecucao"), como a
// lista suspensa da planilha; o recomendado vem da regra B25 da determinação por subteste.
// ---------------------------------------------------------------------------------------------
const LIMIAR_QUASE_TODOS: Record<number, number> = { 3: 2, 4: 3, 5: 4, 6: 4, 7: 4, 8: 4 };

function interpretarHabilidade(n: number, p: number, neg: number, zero: number): string {
  if (p === n) return "Força";
  if (neg === n) return "Fraqueza";
  const k = LIMIAR_QUASE_TODOS[n];
  if (k === undefined) return "";
  if (p >= k && ((neg === 1 && zero === 0) || (neg === 0 && zero === 1))) return "Força";
  if (neg >= k && ((p === 1 && zero === 0) || (p === 0 && zero === 1))) return "Fraqueza";
  return "";
}

function analisarHabilidades(ponderado: Record<string, number | null>, lancados: Set<string>, dados: Wais3Planilha, primeiroModoRecomendado: string | null) {
  if (!dados.habilidades || lancados.size === 0) return null;
  const p = (c: string) => ponderado[c] as number;
  const media = (filtro: (c: string) => boolean) => {
    const cs = ORDEM_SUBTESTES.filter((c) => lancados.has(c) && filtro(c));
    return cs.length ? cs.reduce((a, c) => a + p(c), 0) / cs.length : null;
  };
  const mediaGeral = media(() => true);
  const mediaVerbal = media((c) => SUBTESTES_VERBAIS.has(c));
  const mediaExec = media((c) => !SUBTESTES_VERBAIS.has(c));
  const difDe = (chave: string, total: boolean): number | null => {
    const m = total ? mediaGeral : SUBTESTES_VERBAIS.has(chave) ? mediaVerbal : mediaExec;
    return m === null ? null : p(chave) - m;
  };
  const variante = (total: boolean) =>
    dados.habilidades!.map((h) => {
      const marcas: Record<string, "P" | "N" | "0" | null> = {};
      let pos = 0;
      let neg = 0;
      let zero = 0;
      for (const sub of h.subtestes) {
        const dif = lancados.has(sub) ? difDe(sub, total) : null;
        if (dif === null) {
          marcas[sub] = null;
          continue;
        }
        const marca = dif >= 1 ? "P" : dif <= -1 ? "N" : "0";
        marcas[sub] = marca;
        if (marca === "P") pos++;
        else if (marca === "N") neg++;
        else zero++;
      }
      const lancadosDaHabilidade = pos + neg + zero;
      const completa = lancadosDaHabilidade === h.subtestes.length;
      return { marcas, p: pos, n: neg, zero, total: lancadosDaHabilidade, completa, interpretacao: completa ? interpretarHabilidade(h.subtestes.length, pos, neg, zero) : "" };
    });
  return {
    lista: dados.habilidades,
    total: variante(true),
    verbalExecucao: variante(false),
    recomendado: primeiroModoRecomendado === "m65" || primeiroModoRecomendado === "m77" ? "verbalExecucao" : "total",
  };
}

// ---------------------------------------------------------------------------------------------
// Escores de processo (planilha, linhas 128-142): Dígitos.
//  - Maior sequência (spam) em ordem direta/inversa: porcentagem cumulativa (só com as duas), média e desvio-padrão da faixa
//    etária, Z = (valor − média)/DP, ponderado = Z×3+10, percentil = Φ(Z)×100 e classificação pelo Z.
//  - Diferença entre as ordens (pontos brutos OD − OI): frequência acumulada da faixa, Z = (média − diferença)/DP
//    (a planilha inverte o sinal: quanto MENOR a diferença, maior o Z), percentil e classificação.
//  - Aviso quando OD + OI não fecha com o escore bruto total de Dígitos.
// ---------------------------------------------------------------------------------------------
function classificarPorZ(z: number): string {
  if (z >= 2) return "Muito Superior";
  if (z >= 1.333) return "Superior";
  if (z >= 0.666) return "Média Superior";
  if (z >= -0.667) return "Média";
  if (z >= -1.333) return "Média Inferior";
  if (z >= -2) return "Limítrofe";
  return "Deficitário";
}

function estatisticasDoZ(z: number) {
  return { z: arredondar(z, 3), ponderado: arredondar(z * 3 + 10, 2), percentil: arredondar(normalAcumulada(z) * 100, 2), classificacao: classificarPorZ(z) };
}

function analisarProcesso(brutos: Bruto, dados: Wais3Planilha, banda: string | null) {
  const p = dados.processo;
  const tem = (c: string) => typeof brutos[c] === "number";
  if (!p || !banda || !CHAVES_PROCESSO.some(tem)) return null;
  const tabSpam = p.spam[banda];
  const tabDif = p.diferenca[banda];
  const spamDe = (tab: TabelaSpam | undefined, valor: number, pctCumulativo: boolean) => {
    if (!tab || tab.media === null || tab.dp === null || tab.dp === 0) return null;
    const linha = pctCumulativo ? degrau(tab.linhas.map((l) => ({ min: l.spam, pct: l.pct })), valor) : null;
    return { valor, media: tab.media, dp: tab.dp, porcentagemCumulativa: linha?.pct ?? null, ...estatisticasDoZ((valor - tab.media) / tab.dp) };
  };
  const temAsDuas = tem("digitosSpamDireta") && tem("digitosSpamInversa");
  const spam = {
    direta: tem("digitosSpamDireta") ? spamDe(tabSpam?.direta, brutos.digitosSpamDireta, temAsDuas) : null,
    inversa: tem("digitosSpamInversa") ? spamDe(tabSpam?.inversa, brutos.digitosSpamInversa, temAsDuas) : null,
  };

  let diferenca: Record<string, unknown> | null = null;
  let aviso: string | null = null;
  if (tem("digitosPontosDireta") && tem("digitosPontosInversa") && tabDif && tabDif.media !== null && tabDif.dp !== null && tabDif.dp !== 0) {
    const dif = brutos.digitosPontosDireta - brutos.digitosPontosInversa;
    const linha = degrau(tabDif.linhas.map((l) => ({ min: l.dif, pct: l.pct })), dif);
    diferenca = {
      direta: brutos.digitosPontosDireta,
      inversa: brutos.digitosPontosInversa,
      diferenca: dif,
      frequenciaAcumulada: linha?.pct ?? null,
      media: tabDif.media,
      dp: tabDif.dp,
      ...estatisticasDoZ((tabDif.media - dif) / tabDif.dp),
    };
    if (tem("digitos") && brutos.digitosPontosDireta + brutos.digitosPontosInversa !== brutos.digitos) {
      aviso = "A soma de Dígitos Ordem Direta e Ordem Inversa é diferente do total de Dígitos lançado na aba 1.";
    }
  }
  if (!spam.direta && !spam.inversa && !diferenca) return null;
  return { faixa: banda, spam, diferenca, aviso };
}

// ---------------------------------------------------------------------------------------------
// Clusters (planilha, linhas 147-182): soma dos ponderados de 2-3 subtestes → composto, IC 95% e percentil pela tabela
// própria de cada cluster; interpretável quando a diferença entre o maior e o menor ponderado é < 5. Em seguida as
// "comparações clínicas" (diferença entre dois clusters contra um valor crítico fixo) e a hipótese que corresponde ao
// SENTIDO da diferença.
//
// Diferença em relação à planilha (que tem um defeito): a fórmula do texto de hipótese (B186:V186) testa a célula M177,
// que contém sempre o NOME do cluster (ex.: "Gf") e nunca ">" — então a planilha mostra SEMPRE o texto do sentido
// oposto ("menor") ao que a comparação indica, e nunca mostra "Não interpretável". Aqui o texto é escolhido pelo
// sentido real da diferença, só quando os dois clusters são interpretáveis e a diferença não é zero.
// ---------------------------------------------------------------------------------------------
function classificarCluster(percentil: number): string {
  if (percentil >= 97.72) return "Muito Superior";
  if (percentil >= 90.88) return "Superior";
  if (percentil >= 75) return "Média Superior";
  if (percentil >= 25) return "Média";
  if (percentil >= 9) return "Média Inferior";
  if (percentil >= 2) return "Limítrofe";
  return "Deficitário";
}

function analisarClusters(ponderado: Record<string, number | null>, lancados: Set<string>, dados: Wais3Planilha) {
  if (!dados.clusters) return null;
  const clusters = dados.clusters.map((c) => {
    const completo = c.subtestes.every((x) => lancados.has(x));
    const itens = c.subtestes.map((x) => ({ chave: x, ponderado: lancados.has(x) ? (ponderado[x] as number) : null }));
    if (!completo) return { chave: c.chave, sigla: c.sigla, rotulo: c.rotulo, itens, calculado: false as const };
    const valores = itens.map((i) => i.ponderado as number);
    const diferenca = Math.max(...valores) - Math.min(...valores);
    const interpretavel = diferenca < 5;
    const soma = valores.reduce((a, v) => a + v, 0);
    const linha = interpretavel ? degrau(c.tabela, soma) : null;
    const composto = linha?.composto ?? null;
    const percentil = linha?.percentil ?? null;
    return {
      chave: c.chave,
      sigla: c.sigla,
      rotulo: c.rotulo,
      itens,
      calculado: true as const,
      diferenca,
      interpretavel,
      soma: interpretavel ? soma : null,
      composto,
      ic95: linha?.ic95 ?? null,
      percentil,
      classificacao: percentil !== null ? classificarCluster(percentil) : null,
    };
  });
  if (!clusters.some((c) => c.calculado)) return null;

  const porChave = Object.fromEntries(clusters.map((c) => [c.chave, c]));
  const comparacoes = (dados.comparacoesClinicas ?? []).map((cc) => {
    const A = porChave[cc.a];
    const B = porChave[cc.b];
    const ok = A?.calculado && B?.calculado && A.interpretavel && B.interpretavel && A.composto !== null && B.composto !== null;
    const base = { a: cc.a, b: cc.b, rotulo: cc.rotulo, valorCritico: cc.valorCritico, siglaA: A?.sigla ?? cc.a, siglaB: B?.sigla ?? cc.b };
    if (!ok) return { ...base, calculada: false as const, motivo: A?.calculado && B?.calculado ? "Algum dos clusters não é interpretável (diferença ≥ 5 entre subtestes)." : "Faltam subtestes para um dos clusters." };
    const compostoA = (A as { composto: number }).composto;
    const compostoB = (B as { composto: number }).composto;
    const diferenca = compostoA - compostoB;
    const sentido: ">" | "<" | "=" = diferenca > 0 ? ">" : diferenca < 0 ? "<" : "=";
    const maior = sentido === ">" ? cc.a : sentido === "<" ? cc.b : null;
    const menor = sentido === ">" ? cc.b : sentido === "<" ? cc.a : null;
    const hip = maior && menor ? dados.hipoteses?.find((h) => h.maior === maior && h.menor === menor) : undefined;
    return {
      ...base,
      calculada: true as const,
      compostoA,
      compostoB,
      diferenca,
      sentido,
      raro: Math.abs(diferenca) >= cc.valorCritico ? "Raro" : "Não Raro",
      hipotese: hip ? { titulo: hip.titulo, texto: hip.texto } : null,
    };
  });
  return { clusters, comparacoes };
}

// ---------------------------------------------------------------------------------------------
// Comparação entre discrepâncias (planilha, linhas 86-98): diferença entre dois índices/QIs contra o valor crítico
// (Tabela B.1, por faixa de idade, nível de significância 0,05/0,15 e amostra "Nível de Habilidade"/"Amostra Geral")
// e, se significativa, a frequência acumulada daquela diferença (Tabela B.2).
// ---------------------------------------------------------------------------------------------
function compararDiscrepancias(porCampo: Record<string, ResultadoPorCampo>, dados: Wais3Planilha, idadeAnos: number) {
  const d = dados.discrepancias;
  if (!d) return null;
  const composto = (k: string) => (typeof porCampo[k]?.faixa?.composto === "number" ? (porCampo[k].faixa!.composto as number) : null);
  const pares = d.pares.filter(([a, b]) => composto(a) !== null && composto(b) !== null);
  if (pares.length === 0) return null;
  const bandaIdade = [...d.valoresCriticos].filter((b) => b.anosMin !== null).reverse().find((b) => idadeAnos >= (b.anosMin as number));
  const bandaGeral = d.valoresCriticos.find((b) => b.anosMin === null);
  const combos: Record<string, unknown[]> = {};
  for (const nivel of ["0.05", "0.15"] as const) {
    for (const amostra of ["habilidade", "geral"] as const) {
      const banda = amostra === "habilidade" ? bandaIdade : bandaGeral;
      combos[`${nivel}|${amostra}`] = pares.map(([a, b]) => {
        const ca = composto(a) as number;
        const cb = composto(b) as number;
        const diferenca = ca - cb;
        const chave = `${a}-${b}`;
        const critico = banda ? (nivel === "0.05" ? banda.n05[chave] : banda.n15[chave]) ?? null : null;
        const significativo = critico !== null && Math.abs(diferenca) >= critico;
        let frequencia = "";
        if (significativo) {
          const linha = [...d.frequencia].reverse().find((f) => f.tamanho !== null && (f.tamanho as number) <= Math.abs(diferenca));
          const valor = linha?.[chave];
          if (valor !== null && valor !== undefined) frequencia = `${valor}%`;
        }
        return { a, b, valorA: ca, valorB: cb, diferenca, valorCritico: critico, significativo, frequencia };
      });
    }
  }
  return { combos };
}

const AVISO_QIT =
  "Atenção! Talvez o 'Q.I.' não represente adequadamente o desempenho cognitivo do Paciente, pois há uma discrepância ≥ a 23 pts compostos entre o MAIOR e o MENOR Índice. Considere a possibilidade de analisar o GAI ou CPI e os Clusters.";
const AVISO_GAI_DISCREPANCIA =
  "Atenção! Talvez o GAI não represente adequadamente o desempenho cognitivo do paciente, pois há uma discrepância ≥ 23 pts compostos entre o ICV e o IOP. Considere a possibilidade de analisar mais atentamente os Clusters.";
const AVISO_GAI_SUBTESTES =
  "Atenção! Apesar de não haver uma discrepância ≥ 23 pts compostos entre o ICV e o IOP, há uma discrepância ≥ a 5 pts compostos entre os Subtestes que compoem os Índices (ICV e/ou IOP). Considere a possibilidade de analisar mais atentamente os Clusters.";

// "Análise avançada" da planilha (colunas K-S, linhas 34-39). Acrescenta campos à faixa de cada índice.
//  - Facilidade/Dificuldade NORMATIVA: composto < 85 dificuldade; < 115 média; senão facilidade.
//  - Só se o índice é interpretável (diferença entre maior e menor ponderado < 5): média dos 4 índices,
//    diferença do índice para essa média, valor crítico (pela idade), F/D INDIVIDUAL e raro/não raro.
//  - QI Total e GAI: interpretáveis se a discrepância entre os índices for < 23 pontos compostos.
// A coluna "Recurso/Preocupação" da planilha NÃO é reproduzida: a fórmula compara com rótulos abreviados
// ("Fac. Norm.") que nunca batem com os rótulos usados nas colunas L e P, então ela nunca mostra nada.
function analisarAvancado(porCampo: Record<string, ResultadoPorCampo>, dados: Wais3Planilha, idadeAnos: number) {
  const chaves = ["icv", "iop", "imo", "ivp"] as const;
  const composto = (k: string) => (typeof porCampo[k]?.faixa?.composto === "number" ? (porCampo[k].faixa!.composto as number) : null);
  const compostos = chaves.map(composto);
  const temOsQuatro = compostos.every((c) => c !== null);
  const mediaIndices = temOsQuatro ? (compostos as number[]).reduce((a, c) => a + c, 0) / 4 : null;
  const linhaCritica = [...(dados.valoresCriticos ?? [])].reverse().find((v) => idadeAnos >= v.anosMin);

  for (const k of chaves) {
    const c = composto(k);
    const faixa = porCampo[k]?.faixa;
    if (c === null || !faixa) continue;
    const interpretavel = faixa.homogeneo === "SIM";
    const extras: Record<string, number | string> = {
      interpretavel: interpretavel ? "SIM" : "NÃO",
      dfNormativa: c < 85 ? "Dificuldade Normativa" : c < 115 ? "Média" : "Facilidade Normativa",
    };
    if (!interpretavel) {
      extras.observacao = "Não interpretável: há uma discrepância ≥ 5 pontos ponderados entre o MAIOR e o MENOR subteste que compõem o índice.";
    } else if (mediaIndices !== null) {
      const dif = c - mediaIndices;
      const vc = linhaCritica?.[k];
      extras.mediaIndices = arredondar(mediaIndices, 2);
      extras.diferencaMedia = arredondar(dif, 2);
      if (vc !== undefined) {
        extras.valorCritico = vc;
        extras.dfIndividual = Math.abs(dif) >= vc ? (dif > 0 ? "Facilidade Individual" : "Dificuldade Individual") : "";
        const limite = dados.limitesRaro?.[k];
        extras.raro = limite !== undefined && Math.abs(dif) > limite ? "Raro" : Math.abs(dif) > vc ? "Não Raro" : "";
      }
    }
    porCampo[k].faixa = { ...faixa, ...extras } as FaixaConversao;
  }

  const qit = porCampo.qit?.faixa;
  if (qit && temOsQuatro) {
    const amplitude = Math.max(...(compostos as number[])) - Math.min(...(compostos as number[]));
    porCampo.qit.faixa = { ...qit, interpretavel: amplitude >= 23 ? "NÃO" : "SIM", ...(amplitude >= 23 ? { aviso: AVISO_QIT } : {}) } as FaixaConversao;
  }
  const gai = porCampo.gai?.faixa;
  const icv = composto("icv");
  const iop = composto("iop");
  if (gai && icv !== null && iop !== null) {
    const discrepante = Math.abs(icv - iop) >= 23;
    const subtestesDiscrepantes = porCampo.icv.faixa?.homogeneo === "NÃO" || porCampo.iop.faixa?.homogeneo === "NÃO";
    const aviso = discrepante ? AVISO_GAI_DISCREPANCIA : subtestesDiscrepantes ? AVISO_GAI_SUBTESTES : "";
    porCampo.gai.faixa = { ...gai, interpretavel: discrepante ? "NÃO" : "SIM", ...(aviso ? { aviso } : {}) } as FaixaConversao;
  }
}
