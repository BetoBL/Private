// Gera docs/testes/WAIS-III-planilha.json a partir da extração (scripts/exportar-para-colar.ps1) das
// abas WAIS-III e WAIS-NORMAS do Excel da psicóloga. A planilha é a REFERÊNCIA DE RESULTADO
// (ver memória project_neurologic_espelhar_excel): este gerador só reformata o que ela já calcula.
//
// Uso:  node scripts/gerar-wais3-planilha.mjs <export-wais3.json> <export-wais-normas.json> [saida.json]
//   - os dois .json são o conteúdo decodificado (gunzip+base64) das partes coladas/geradas pelo .ps1
//     (formato { "<aba>": { celulas: [{c, v, f}] , ... } }).
import { readFileSync, writeFileSync } from "node:fs";

const [, , arqWais, arqNormas, saida = "docs/testes/WAIS-III-planilha.json", arqWiscNormas] = process.argv;
if (!arqWais || !arqNormas) {
  console.error("Uso: node scripts/gerar-wais3-planilha.mjs <export-wais3.json> <export-wais-normas.json> [saida.json]");
  process.exit(1);
}
const wais = JSON.parse(readFileSync(arqWais, "utf8"))["WAIS-III"];
const normas = JSON.parse(readFileSync(arqNormas, "utf8"))["WAIS-NORMAS"];
const W = new Map(wais.celulas.map((c) => [c.c, c]));
const N = new Map(normas.celulas.map((c) => [c.c, c]));
const WN = arqWiscNormas ? new Map(JSON.parse(readFileSync(arqWiscNormas, "utf8"))["WISC-NORMAS"].celulas.map((c) => [c.c, c])) : null;

const num = (v) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)) ? Number(v) : null);

// --- subtestes (linhas 10-23 da aba WAIS-III) ---
const CHAVES = {
  10: "completarFiguras", 11: "vocabulario", 12: "codigos", 13: "semelhancas", 14: "cubos",
  15: "aritmetica", 16: "raciocinioMatricial", 17: "digitos", 18: "informacao", 19: "arranjoFiguras",
  20: "compreensao", 21: "procurarSimbolos", 22: "sequenciaNumerosLetras", 23: "armarObjetos",
};

// Faixas etárias: a planilha escolhe por DIAS de vida (Q5 = data de aplicação - nascimento).
const BANDAS = [
  { rotulo: "16-17", diasMin: 5840, anosMin: 16, anosMax: 17 },
  { rotulo: "18-19", diasMin: 6570, anosMin: 18, anosMax: 19 },
  { rotulo: "20-29", diasMin: 7300, anosMin: 20, anosMax: 29 },
  { rotulo: "30-39", diasMin: 10950, anosMin: 30, anosMax: 39 },
  { rotulo: "40-49", diasMin: 14600, anosMin: 40, anosMax: 49 },
  { rotulo: "50-59", diasMin: 18250, anosMin: 50, anosMax: 59 },
  { rotulo: "60-64", diasMin: 21900, anosMin: 60, anosMax: 64 },
  { rotulo: "65-89", diasMin: 23725, anosMin: 65, anosMax: 89 },
];

// Emula LOOKUP(x, vetor, resultado) do Excel sobre coluna ESPARSA: valores em branco são ignorados e
// vale o último valor <= x. Aqui só transformamos a coluna em degraus ordenados {min, resultado}.
function degraus(colVetor, linhaIni, linhaFim, colunasResultado) {
  const out = [];
  let ultimo = -Infinity;
  const avisos = [];
  for (let r = linhaIni; r <= linhaFim; r++) {
    const v = num(N.get(`${colVetor}${r}`)?.v);
    if (v === null) continue;
    if (v < ultimo) avisos.push(`${colVetor}${r}: ${v} < anterior ${ultimo} (fora de ordem)`);
    ultimo = Math.max(ultimo, v);
    const reg = { min: v };
    for (const [nome, col] of Object.entries(colunasResultado)) {
      const cel = N.get(`${col}${r}`);
      reg[nome] = cel === undefined ? null : cel.v;
    }
    out.push(reg);
  }
  return { degraus: out, avisos };
}

// --- A.1: bruto -> ponderado, por subteste e faixa etária ---
const subtestes = [];
const a1 = Object.fromEntries(BANDAS.map((b) => [b.rotulo, {}]));
const avisosGerais = [];
for (const [linha, chave] of Object.entries(CHAVES)) {
  const f = W.get(`F${linha}`)?.f ?? "";
  const re = /IF\(\$Q\$5>=(\d+),LOOKUP\(E\d+,'WAIS-NORMAS'!([A-Z]+)\$11:[A-Z]+\$(\d+),'WAIS-NORMAS'!\$A\$11:\$A\$207\)/g;
  const achados = [...f.matchAll(re)];
  if (achados.length !== BANDAS.length) throw new Error(`Linha ${linha} (${chave}): esperava ${BANDAS.length} faixas na fórmula, achei ${achados.length}`);
  subtestes.push({ chave, label: W.get(`B${linha}`).v, linha: Number(linha) });
  for (const [, dias, col, fim] of achados) {
    const banda = BANDAS.find((b) => b.diasMin === Number(dias));
    if (!banda) throw new Error(`Linha ${linha}: limiar de dias desconhecido ${dias}`);
    const { degraus: d, avisos } = degraus(col, 11, Number(fim), { ponderado: "A" });
    avisos.forEach((a) => avisosGerais.push(`A.1 ${banda.rotulo}/${chave}: ${a}`));
    // funde degraus consecutivos de mesmo ponderado e converte para faixas {min, max, ponderado}
    const fundidos = [];
    for (const x of d) {
      const p = num(x.ponderado);
      if (fundidos.length && fundidos[fundidos.length - 1].ponderado === p) continue;
      fundidos.push({ min: x.min, ponderado: p });
    }
    a1[banda.rotulo][chave] = fundidos.map((x, i) => ({
      min: x.min,
      ...(i + 1 < fundidos.length ? { max: fundidos[i + 1].min - 1 } : {}),
      ponderado: x.ponderado,
    }));
  }
}

// --- quais subtestes compõem cada soma (grade G..L da aba WAIS-III) + regras de substituição ---
const colunasSoma = { qiv: "G", qie: "H", icv: "I", iop: "J", imo: "K", ivp: "L" };
const composicao = {};
for (const [soma, col] of Object.entries(colunasSoma)) {
  composicao[soma] = Object.entries(CHAVES).filter(([linha]) => W.get(`${col}${linha}`)?.f).map(([, chave]) => chave);
}
// Substituições lidas das fórmulas G22 / H21 / H23 (subteste suplementar só entra se o titular falta).
const substituicoes = [
  { soma: "qiv", subteste: "sequenciaNumerosLetras", entraSe: "ausente", de: ["digitos"], fonte: "G22: IF(E17=\"\",F22,\"\")" },
  { soma: "qie", subteste: "procurarSimbolos", entraSe: "ausente", de: ["codigos"], fonte: "H21: IF(E12=\"\",F21,\"\")" },
  { soma: "qie", subteste: "armarObjetos", entraSe: "algumAusente", de: ["completarFiguras", "cubos", "raciocinioMatricial", "arranjoFiguras"], fonte: "H23: IF(OR(E10=\"\",E14=\"\",E16=\"\",E19=\"\"),F23,\"\")" },
];
const sub = new Set(substituicoes.map((s) => `${s.soma}:${s.subteste}`));
for (const [soma, lista] of Object.entries(composicao)) composicao[soma] = lista.filter((c) => !sub.has(`${soma}:${c}`) || true);

// --- soma -> ponto composto / percentil / IC (tabelas A.3-A.9 da planilha) ---
const TABELAS_SOMA = {
  icv: { vetor: "X", ini: 221, fim: 276, res: { composto: "Y", percentil: "Z", ic90: "AA", ic95: "AB" } },
  iop: { vetor: "X", ini: 221, fim: 276, res: { composto: "AC", percentil: "AD", ic90: "AE", ic95: "AF" } },
  imo: { vetor: "X", ini: 221, fim: 276, res: { composto: "AG", percentil: "AH", ic90: "AI", ic95: "AJ" } },
  ivp: { vetor: "X", ini: 221, fim: 276, res: { composto: "AK", percentil: "AL", ic90: "AM", ic95: "AN" } },
  qit: { vetor: "J", ini: 221, fim: 432, res: { composto: "K", percentil: "L", ic90: "M", ic95: "N" } },
  qiv: { vetor: "A", ini: 213, fim: 320, res: { composto: "B", percentil: "C", ic90: "D", ic95: "E" } },
  qie: { vetor: "A", ini: 213, fim: 320, res: { composto: "F", percentil: "G", ic90: "H", ic95: "I" } },
  gai: { vetor: "A", ini: 601, fim: 709, res: { composto: "B", percentil: "C", ic90: "D", ic95: "E" } },
};
const somaParaComposto = {};
for (const [chave, t] of Object.entries(TABELAS_SOMA)) {
  const { degraus: d, avisos } = degraus(t.vetor, t.ini, t.fim, t.res);
  avisos.forEach((a) => avisosGerais.push(`${chave}: ${a}`));
  somaParaComposto[chave] = d.map((x, i) => ({
    min: x.min,
    ...(i + 1 < d.length ? { max: d[i + 1].min - 1 } : {}),
    composto: x.composto, percentil: x.percentil, ic90: x.ic90, ic95: x.ic95,
  }));
}

// --- Análise avançada: valores críticos por faixa de idade (WAIS-NORMAS 721-733) e limites de "raro" ---
// A planilha escolhe a linha pelos ANOS COMPLETOS (DATEDIF "y") na escada: >=85, 80, 75, 70, 65, 55, 45, 35, 30, 25, 20, 18, 16.
const LINHAS_CRITICOS = [[721, 16], [722, 18], [723, 20], [724, 25], [725, 30], [726, 35], [727, 45], [728, 55], [729, 65], [730, 70], [731, 75], [732, 80], [733, 85]];
const valoresCriticos = LINHAS_CRITICOS.map(([linha, anosMin]) => ({
  anosMin,
  rotulo: String(N.get(`A${linha}`).v),
  icv: num(N.get(`B${linha}`).v), iop: num(N.get(`C${linha}`).v), imo: num(N.get(`D${linha}`).v), ivp: num(N.get(`E${linha}`).v),
}));
// Limite de "Raro" de cada índice: constante dentro da fórmula da coluna R (R34..R37).
const limitesRaro = {};
for (const [indice, linha] of [["icv", 34], ["iop", 35], ["imo", 36], ["ivp", 37]]) {
  const m = /ABS\(N\d+\)<=([\d.]+)/.exec(W.get(`R${linha}`)?.f ?? "");
  if (!m) throw new Error(`limite de raro não achado em R${linha}`);
  limitesRaro[indice] = Number(m[1]);
}

// --- Determinação das facilidades e dificuldades por subteste: Tabela B.3 (WAIS-NORMAS 437-494) ---
// 6 modos de "média de comparação". Cada modo traz, por subteste, o valor crítico nos níveis 0,15 e 0,05 e os limites de
// frequência acumulada (1%, 2%, 5%, 10%, 25%). "-" ou célula vazia = o subteste não participa desse modo.
const ORDEM_SUBTESTES = ["vocabulario", "semelhancas", "aritmetica", "digitos", "informacao", "compreensao", "sequenciaNumerosLetras", "completarFiguras", "codigos", "cubos", "raciocinioMatricial", "arranjoFiguras", "procurarSimbolos", "armarObjetos"];
const linhasB3 = {
  b1: [...Array(7).keys()].map((k) => 441 + k).concat([...Array(7).keys()].map((k) => 451 + k)),
  b2: [...Array(14).keys()].map((k) => 461 + k),
  b3: [...Array(14).keys()].map((k) => 481 + k),
};
const MODOS = [
  { id: "m65", rotulo: "Média dos 6 Subtestes Verbais e 5 Subtestes Execução", crit: ["B", "C"], taxas: ["D", "E", "F", "G", "H"], b: "b1", mediaTotal: false },
  { id: "m77", rotulo: "Média dos 7 Subtestes Verbais e 7 Subtestes Execução", crit: ["I", "J"], taxas: ["K", "L", "M", "N", "O"], b: "b1", mediaTotal: false },
  { id: "m11qi", rotulo: "Média dos 11 Subtestes para os QI", crit: ["B", "C"], taxas: ["D", "E", "F", "G", "H"], b: "b2", mediaTotal: true },
  { id: "m11fat", rotulo: "Média dos 11 Subtestes para os Índices Fatoriais", crit: ["I", "J"], taxas: ["K", "L", "M", "N", "O"], b: "b2", mediaTotal: true },
  { id: "m13", rotulo: "Média dos 13 Subtestes", crit: ["B", "C"], taxas: ["D", "E", "F", "G", "H"], b: "b3", mediaTotal: true },
  { id: "m14", rotulo: "Média dos 14 Subtestes", crit: ["I", "J"], taxas: ["K", "L", "M", "N", "O"], b: "b3", mediaTotal: true },
];
const subtestesVsMedia = MODOS.map((m) => {
  const subs = {};
  ORDEM_SUBTESTES.forEach((chave, k) => {
    const linha = linhasB3[m.b][k];
    const crit15 = num(N.get(`${m.crit[0]}${linha}`)?.v);
    const crit05 = num(N.get(`${m.crit[1]}${linha}`)?.v);
    if (crit15 === null && crit05 === null) return;
    const t = m.taxas.map((c) => num(N.get(`${c}${linha}`)?.v));
    subs[chave] = { critico15: crit15, critico05: crit05, taxas: { p1: t[0], p2: t[1], p5: t[2], p10: t[3], p25: t[4] } };
  });
  return { id: m.id, rotulo: m.rotulo, mediaTotal: m.mediaTotal, subtestes: subs };
});

// --- Comparação entre discrepâncias: Tabela B.1 (valor crítico por idade/nível, linhas 361-378) e B.2 (frequência, 391-431) ---
const PARES = [["qiv", "qie", "C"], ["icv", "iop", "D"], ["icv", "imo", "E"], ["iop", "ivp", "F"], ["icv", "ivp", "G"], ["iop", "imo", "H"], ["imo", "ivp", "I"]];
const BANDAS_DISC = [["16-17", 16, 361], ["18-19", 18, 363], ["20-29", 20, 365], ["30-39", 30, 367], ["40-49", 40, 369], ["50-59", 50, 371], ["60-64", 60, 373], ["65-89", 65, 375], ["Todas as idades", null, 377]];
const linhaPares = (r) => Object.fromEntries(PARES.map(([a, b, col]) => [`${a}-${b}`, num(N.get(`${col}${r}`)?.v)]));
const discrepancias = {
  pares: PARES.map(([a, b]) => [a, b]),
  valoresCriticos: BANDAS_DISC.map(([rotulo, anosMin, r]) => ({ rotulo, anosMin, n15: linhaPares(r), n05: linhaPares(r + 1) })),
  frequencia: [...Array(41).keys()].map((k) => ({ tamanho: num(N.get(`B${391 + k}`)?.v), ...linhaPares(391 + k) })),
};

// --- Clusters (aba WAIS-III linhas 147-182 + tabelas WAIS-NORMAS 601-655) ---
// Cada cluster soma os ponderados de 2 ou 3 subtestes; é interpretável se maior−menor < 5; a soma vira composto/IC95/percentil
// pela tabela PRÓPRIA do cluster. Colunas das tabelas: [soma, composto, IC95, percentil].
const CLUSTERS = [
  { chave: "gf", linha: 150, subtestes: ["raciocinioMatricial", "arranjoFiguras", "aritmetica"], cols: ["G", "H", "I", "J"], fim: 655 },
  { chave: "gv", linha: 154, subtestes: ["cubos", "completarFiguras"], cols: ["L", "M", "N", "O"], fim: 637 },
  { chave: "gfNaoVerbal", linha: 157, subtestes: ["raciocinioMatricial", "arranjoFiguras"], cols: ["Q", "R", "S", "T"], fim: 637 },
  { chave: "gfVerbal", linha: 160, subtestes: ["semelhancas", "compreensao"], cols: ["V", "W", "X", "Y"], fim: 637 },
  { chave: "gcVL", linha: 163, subtestes: ["semelhancas", "vocabulario"], cols: ["AA", "AB", "AC", "AD"], fim: 637 },
  { chave: "gcKO", linha: 166, subtestes: ["compreensao", "informacao"], cols: ["AF", "AG", "AH", "AI"], fim: 637 },
  { chave: "gcLM", linha: 169, subtestes: ["vocabulario", "informacao"], cols: ["AK", "AL", "AM", "AN"], fim: 637 },
  { chave: "gsmWM", linha: 172, subtestes: ["sequenciaNumerosLetras", "digitos"], cols: ["AP", "AQ", "AR", "AS"], fim: 637 },
];
const clusters = CLUSTERS.map((c) => {
  const { degraus: d, avisos } = degraus(c.cols[0], 601, c.fim, { composto: c.cols[1], ic95: c.cols[2], percentil: c.cols[3] });
  avisos.forEach((a) => avisosGerais.push(`cluster ${c.chave}: ${a}`));
  return {
    chave: c.chave,
    sigla: String(W.get(`E${c.linha}`).v).replace(/\s+/g, ""),
    rotulo: String(W.get(`B${c.linha}`).v),
    subtestes: c.subtestes,
    tabela: d.map((x, i) => ({ min: x.min, ...(i + 1 < d.length ? { max: d[i + 1].min - 1 } : {}), composto: num(x.composto), ic95: x.ic95 ?? null, percentil: num(x.percentil) })),
  };
});

// Comparações clínicas (linhas 177-182): valor crítico é CONSTANTE na planilha (coluna J, sem fórmula).
const PARES_CLINICOS = [["gf", "gv", 177], ["gfNaoVerbal", "gv", 178], ["gfNaoVerbal", "gfVerbal", 179], ["gcVL", "gcKO", 180], ["gcLM", "gsmWM", 181], ["gcLM", "gfVerbal", 182]];
const comparacoesClinicas = PARES_CLINICOS.map(([a, b, linha]) => {
  const critico = num(W.get(`J${linha}`)?.v);
  if (critico === null) throw new Error(`valor crítico clínico não achado em J${linha}`);
  return { a, b, rotulo: String(W.get(`B${linha}`).v), valorCritico: critico };
});

// Textos de hipótese: biblioteca na aba WISC-NORMAS (A851..A962), um título e um texto por SENTIDO ("X > Y" e "Y > X").
const CHAVE_POR_SIGLA = { gf: "gf", gv: "gv", "gf-nonverbal": "gfNaoVerbal", "gf-verbal": "gfVerbal", "gc-vl": "gcVL", "gc-ko": "gcKO", "gc-ltm": "gcLM", "gsm-wm": "gsmWM" };
const hipoteses = [];
if (WN) {
  for (let k = 0; k < 12; k++) {
    const linha = 851 + 10 * k;
    const titulo = String(WN.get(`A${linha}`)?.v ?? "").replace(/\s+/g, " ").trim();
    const texto = String(WN.get(`A${linha + 1}`)?.v ?? "").replace(/\s+/g, " ").trim();
    const siglas = [...titulo.matchAll(/\(([^)]+)\)/g)].map((m) => CHAVE_POR_SIGLA[m[1].trim().toLowerCase()]);
    if (siglas.length !== 2 || siglas.some((x) => !x)) throw new Error(`título de hipótese não reconhecido (A${linha}): ${titulo}`);
    if (!texto) throw new Error(`texto de hipótese vazio (A${linha + 1})`);
    hipoteses.push({ maior: siglas[0], menor: siglas[1], titulo, texto });
  }
}

// --- Escores de processo (Dígitos): Tabelas B.6 (maior sequência, 556-568) e B.7 (diferença direta − inversa, 577-591) ---
// Valor digitado com erro na planilha (ex.: "74,,1" em B584): lido como 74,1 e registrado em "avisos".
const numTolerante = (cel, onde) => {
  const bruto = cel?.v;
  const n = num(bruto);
  if (n !== null || bruto === undefined || bruto === null || bruto === "") return n;
  const t = String(bruto).trim().replace(",,", ".").replace(",", ".");
  const corrigido = Number(t);
  if (Number.isNaN(corrigido)) return null;
  avisosGerais.push(`valor com erro de digitação em ${onde}: "${bruto}" lido como ${corrigido}`);
  return corrigido;
};
const lerLinhas = (colunaChave, colunaValor, r0, r1, nomeChave) => {
  const out = [];
  for (let r = r0; r <= r1; r++) {
    const chave = num(N.get(`${colunaChave}${r}`)?.v);
    if (chave === null) continue;
    out.push({ [nomeChave]: chave, pct: numTolerante(N.get(`${colunaValor}${r}`), `${colunaValor}${r}`) });
  }
  return out;
};
const COLS_SPAM = ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q"];
const COLS_DIF = ["B", "C", "D", "E", "F", "G", "H", "I"];
const processo = { spam: {}, diferenca: {} };
BANDAS.forEach((b, i) => {
  const cd = COLS_SPAM[2 * i];
  const ci = COLS_SPAM[2 * i + 1];
  processo.spam[b.rotulo] = {
    direta: { linhas: lerLinhas("A", cd, 556, 565, "spam"), media: num(N.get(`${cd}566`)?.v), dp: num(N.get(`${cd}567`)?.v) },
    inversa: { linhas: lerLinhas("A", ci, 556, 565, "spam"), media: num(N.get(`${ci}566`)?.v), dp: num(N.get(`${ci}567`)?.v) },
  };
  const c = COLS_DIF[i];
  processo.diferenca[b.rotulo] = { linhas: lerLinhas("A", c, 577, 588, "dif"), media: num(N.get(`${c}589`)?.v), dp: num(N.get(`${c}590`)?.v) };
});

// --- Habilidades compartilhadas (aba WAIS-III linhas 48-131; fonte: Kaufman & Lichtenberger, 2002, p. 456) ---
// Cada habilidade lista os subtestes que a compõem (as células com fórmula da matriz). A interpretação (Força/Fraqueza)
// depende de quantos subtestes a habilidade tem; conferimos aqui que a fórmula da planilha de cada linha corresponde a esse número.
const COL_SUBTESTE = { T: "informacao", U: "semelhancas", V: "aritmetica", W: "vocabulario", X: "compreensao", Y: "digitos", Z: "sequenciaNumerosLetras", AB: "completarFiguras", AC: "codigos", AD: "arranjoFiguras", AE: "cubos", AF: "armarObjetos", AG: "procurarSimbolos", AH: "raciocinioMatricial" };
const habilidades = [];
let grupoAtual = "";
for (let r = 50; r <= 131; r++) {
  const g = W.get(`O${r}`)?.v;
  if (typeof g === "string" && g.trim()) grupoAtual = g.replace(/\s+/g, " ").trim();
  const nome = W.get(`Q${r}`)?.v;
  if (typeof nome !== "string" || !nome.trim()) continue;
  const subtestes = Object.entries(COL_SUBTESTE).filter(([col]) => W.get(`${col}${r}`)?.f).map(([, chave]) => chave);
  const fAI = String(W.get(`AI${r}`)?.f ?? "").replace(/\s+/g, " ");
  const alvo = /=\s*IF\(AJ\d+=(\d+),/.exec(fAI);
  if (!alvo) throw new Error(`fórmula de interpretação não reconhecida na linha ${r}`);
  const refRow = /AJ(\d+)=/.exec(fAI)?.[1];
  if (Number(alvo[1]) !== subtestes.length) throw new Error(`linha ${r}: a fórmula espera ${alvo[1]} subtestes, mas a matriz tem ${subtestes.length}`);
  if (refRow && Number(refRow) !== r) avisosGerais.push(`habilidade da linha ${r} ("${nome.trim()}"): a fórmula de interpretação aponta para a linha ${refRow} (defeito da planilha; ignorado)`);
  habilidades.push({ numero: num(W.get(`P${r}`)?.v), nome: nome.replace(/\s+/g, " ").trim(), grupo: grupoAtual, subtestes });
}

const resultado = {
  _fonte: "Planilha da psicóloga (planilha-da-psicologa.xlsm), abas WAIS-III e WAIS-NORMAS — extraído por scripts/exportar-para-colar.ps1. Referência de RESULTADO: espelha o que a planilha calcula.",
  _classificacao: "Pela planilha (I34): por PERCENTIL — ≥98 Muito Superior; ≥91 Superior; ≥75 Média Superior; ≥25 Média; ≥9 Média Inferior; ≥2 Limítrofe; <2 Deficitário; '> 99,9' Muito Superior; '< 0,1' Deficitário.",
  bandasEtarias: BANDAS,
  subtestes,
  composicao,
  substituicoes,
  indices: { qiv: "QI Verbal", qie: "QI Execução", qit: "QI Total", icv: "Índice de Compreensão Verbal", iop: "Índice de Organização Perceptual", imo: "Índice de Memória Operacional", ivp: "Índice de Velocidade de Processamento", gai: "Índice de Habilidades Gerais" },
  a1,
  somaParaComposto,
  valoresCriticos,
  limitesRaro,
  subtestesVsMedia,
  discrepancias,
  clusters,
  comparacoesClinicas,
  hipoteses,
  processo,
  habilidades,
};
writeFileSync(saida, JSON.stringify(resultado, null, 1));
console.log("gerado:", saida);
console.log("bandas:", BANDAS.length, "subtestes:", subtestes.length);
for (const [b, t] of Object.entries(a1)) console.log(" ", b, Object.entries(t).map(([k, v]) => `${k}:${v.length}`).join(" "));
for (const [k, v] of Object.entries(somaParaComposto)) console.log(" soma->", k, v.length, "linhas; 1ª:", JSON.stringify(v[0]), "última:", JSON.stringify(v[v.length - 1]));
console.log("valoresCriticos:", valoresCriticos.length, "limitesRaro:", JSON.stringify(limitesRaro));
console.log("subtestesVsMedia:", subtestesVsMedia.map((m) => m.id + "=" + Object.keys(m.subtestes).length).join(" "), "| discrepancias:", discrepancias.valoresCriticos.length, "bandas,", discrepancias.frequencia.length, "linhas de frequência");
console.log("clusters:", clusters.map((c) => c.chave + "=" + c.tabela.length).join(" "), "| comparações clínicas:", comparacoesClinicas.length, "| hipóteses:", hipoteses.length);
console.log("processo: spam", Object.keys(processo.spam).length, "bandas; diferença", Object.keys(processo.diferenca).length, "bandas");
console.log("habilidades:", habilidades.length, "| por nº de subtestes:", JSON.stringify(habilidades.reduce((a, h) => ((a[h.subtestes.length] = (a[h.subtestes.length] || 0) + 1), a), {})), "| grupos:", [...new Set(habilidades.map((h) => h.grupo))].join(" / "));
console.log("composição:", JSON.stringify(composicao));
console.log("avisos (", avisosGerais.length, "):", avisosGerais.slice(0, 15));
