// Gera docs/testes/WISC-IV-planilha.json a partir da extração (scripts/exportar-para-colar.ps1) das abas WISC-IV e
// WISC-NORMAS do Excel da psicóloga. A planilha é a REFERÊNCIA DE RESULTADO (ver memória project_neurologic_espelhar_excel):
// este gerador só reformata o que ela já calcula.
//
// Uso:  node scripts/gerar-wisc4-planilha.mjs <export-wisc4.json> <export-wisc-normas.json> [saida.json]
import { readFileSync, writeFileSync } from "node:fs";

const [, , arqWisc, arqNormas, saida = "docs/testes/WISC-IV-planilha.json"] = process.argv;
if (!arqWisc || !arqNormas) {
  console.error("Uso: node scripts/gerar-wisc4-planilha.mjs <export-wisc4.json> <export-wisc-normas.json> [saida.json]");
  process.exit(1);
}
const W = new Map(JSON.parse(readFileSync(arqWisc, "utf8"))["WISC-IV"].celulas.map((c) => [c.c, c]));
const N = new Map(JSON.parse(readFileSync(arqNormas, "utf8"))["WISC-NORMAS"].celulas.map((c) => [c.c, c]));
const num = (v) => (typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v)) ? Number(v) : null);
const avisos = [];

// --- subtestes (linhas 10-24 da aba WISC-IV) ---
const SUBTESTES = [
  [10, "cb", "Cubos"], [11, "sm", "Semelhanças"], [12, "dg", "Dígitos"], [13, "cn", "Conceitos Figurativos"], [14, "cd", "Código"],
  [15, "vc", "Vocabulário"], [16, "snl", "Sequência de Números e Letras"], [17, "rm", "Raciocínio Matricial"], [18, "co", "Compreensão"],
  [19, "ps", "Procurar Símbolos"], [20, "cf", "Completar Figuras"], [21, "ca", "Cancelamento"], [22, "in", "Informação"],
  [23, "ar", "Aritmética"], [24, "rp", "Raciocínio com Palavras"],
].map(([linha, chave, label]) => ({ linha, chave, label }));

// A planilha escolhe a faixa etária (33 faixas de 4 meses) por DIAS: anos×365 + meses×30 + dias (mês = 30 dias).
const re = /IF\(P5>=(\d+),LOOKUP\(E\d+,'WISC-NORMAS'!([A-Z]+)8:[A-Z]+222,'WISC-NORMAS'!([A-Z]+)8:[A-Z]+222\)/g;
const lookupEmCol = (colB, colA) => {
  const out = [];
  let ultimo = -Infinity;
  for (let r = 8; r <= 222; r++) {
    const b = num(N.get(`${colB}${r}`)?.v);
    if (b === null) continue;
    // Coluna fora de ordem (erro de digitação na planilha): registra o aviso e mantém a entrada; a lista é ordenada depois,
    // o que equivale a "maior valor <= bruto" (empate: a linha mais baixa da planilha). O resultado REAL do Excel nesses pontos
    // (busca binária em coluna desordenada) é incerto — ver docs/testes/WISC-IV-divergencias-planilha.md.
    if (b < ultimo) avisos.push(`${colB}${r}: ${b} < anterior ${ultimo} (fora de ordem)`);
    ultimo = Math.max(ultimo, b);
    out.push({ min: b, ponderado: num(N.get(`${colA}${r}`)?.v) });
  }
  // Reproduz a busca binária do LOOKUP do Excel (mesma rotina do avaliador) para cada bruto; em coluna desordenada ela difere
  // de "maior valor <= bruto" (ex.: Cubos 8:0, Informação 12:8). Resultado: faixas sequenciais por bruto, fiéis à planilha.
  const buscaBinaria = (x) => {
    let lo = 0, hi = out.length - 1, achado = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (out[mid].min <= x) { achado = mid; lo = mid + 1; } else hi = mid - 1;
    }
    return achado;
  };
  const minimo = Math.min(...out.map((x) => x.min)), maximo = Math.max(...out.map((x) => x.min));
  const porBruto = [];
  for (let b = minimo; b <= maximo + 1; b++) { const i = buscaBinaria(b); if (i >= 0) porBruto.push({ min: b, ponderado: out[i].ponderado }); }
  out.length = 0;
  out.push(...porBruto);
  const fundidos = [];
  for (const x of out) {
    if (fundidos.length && fundidos[fundidos.length - 1].ponderado === x.ponderado) continue;
    fundidos.push(x);
  }
  return fundidos.map((x, i) => ({ min: x.min, ...(i + 1 < fundidos.length ? { max: fundidos[i + 1].min - 1 } : {}), ponderado: x.ponderado }));
};

const rotuloDaFaixa = (dias) => {
  const anos = Math.floor(dias / 365);
  const meses = Math.round((dias - anos * 365) / 30);
  const fim = anos * 12 + meses + 3;
  return `${anos}:${meses}-${Math.floor(fim / 12)}:${fim % 12}`;
};
const bandasPorDias = new Map();
const a1 = {};
for (const s of SUBTESTES) {
  const f = String(W.get(`F${s.linha}`)?.f ?? "").replace(/\s+/g, " ");
  const achados = [...f.matchAll(re)];
  if (achados.length !== 33) throw new Error(`${s.chave}: esperava 33 faixas na fórmula, achei ${achados.length}`);
  for (const [, dias, colB, colA] of achados) {
    const d = Number(dias);
    const rotulo = rotuloDaFaixa(d);
    bandasPorDias.set(d, rotulo);
    (a1[rotulo] ??= {})[s.chave] = lookupEmCol(colB, colA);
  }
}
const bandasEtarias = [...bandasPorDias.entries()].sort((x, y) => x[0] - y[0]).map(([diasMin, rotulo]) => ({ rotulo, diasMin }));

// --- soma dos ponderados -> composto / percentil / IC (WISC-NORMAS) ---
// colunas: [soma, composto, percentil, IC90, IC95]
const TABELAS = {
  icv: ["A", "B", "C", "D", "E", 232, 286],
  iop: ["AA", "AB", "AC", "AD", "AE", 232, 286],
  imo: ["BA", "BB", "BC", "BD", "BE", 232, 268],
  ivp: ["CA", "CB", "CC", "CD", "CE", 232, 268],
  qit: ["DA", "DB", "DC", "DD", "DE", 232, 412],
  gai: ["A", "B", "C", "D", "E", 632, 740],
  cpi: ["A", "B", "C", "D", "E", 752, 824],
};
const somaParaComposto = {};
for (const [chave, [cs, cc, cp, c90, c95, r0, r1]] of Object.entries(TABELAS)) {
  const linhas = [];
  for (let r = r0; r <= r1; r++) {
    const soma = num(N.get(`${cs}${r}`)?.v);
    if (soma === null) continue;
    linhas.push({ min: soma, composto: N.get(`${cc}${r}`)?.v ?? null, percentil: N.get(`${cp}${r}`)?.v ?? null, ic90: N.get(`${c90}${r}`)?.v ?? null, ic95: N.get(`${c95}${r}`)?.v ?? null });
  }
  somaParaComposto[chave] = linhas.map((x, i) => ({ ...x, ...(i + 1 < linhas.length ? { max: linhas[i + 1].min - 1 } : {}) }));
}

// --- valores críticos por idade (Tabela 4.2, WISC-NORMAS 832-843) e limites de "raro" ---
const valoresCriticos = [];
for (let r = 832; r <= 843; r++) {
  const rotulo = String(N.get(`A${r}`)?.v ?? "");
  const anos = num(N.get(`A${r}`)?.v);
  valoresCriticos.push({ anos, rotulo, icv: num(N.get(`B${r}`)?.v), iop: num(N.get(`C${r}`)?.v), imo: num(N.get(`D${r}`)?.v), ivp: num(N.get(`E${r}`)?.v) });
}
const limitesRaro = {};
for (const [indice, linha] of [["icv", 37], ["iop", 38], ["imo", 39], ["ivp", 40]]) {
  const m = /ABS\(N\d+\)<=([\d.]+)/.exec(String(W.get(`R${linha}`)?.f ?? ""));
  if (!m) throw new Error(`limite de raro não achado em R${linha}`);
  limitesRaro[indice] = Number(m[1]);
}

const resultado = {
  _fonte: "Planilha da psicóloga (planilha-da-psicologa.xlsm), abas WISC-IV e WISC-NORMAS — extraído por scripts/exportar-para-colar.ps1. Referência de RESULTADO: espelha o que a planilha calcula.",
  _idade: "A planilha calcula a idade em DIAS como anos×365 + meses×30 + dias (mês = 30 dias) e escolhe a faixa de 4 meses por esse número (diasMin de cada faixa).",
  bandasEtarias,
  subtestes: SUBTESTES,
  composicao: { icv: ["sm", "vc", "co"], iop: ["cb", "cn", "rm"], imo: ["dg", "snl"], ivp: ["cd", "ps"] },
  // Substitutos reproduzidos da planilha (colunas G-J das linhas 20, 21, 23): entram na soma do índice só se falta um principal.
  substituicoes: [
    { subteste: "cf", indice: "iop", entraSe: "algumAusente", de: ["cb", "cn", "rm"], fonte: "H20: IF(OR(E10=\"\",E13=\"\",E17=\"\"),F20,\"\")" },
    { subteste: "ca", indice: "ivp", entraSe: "algumAusente", de: ["cd", "ps"], fonte: "J21: IF(OR(E19=\"\",E14=\"\"),F21,\"\")" },
    { subteste: "ar", indice: "imo", entraSe: "algumAusente", de: ["dg", "snl"], fonte: "I23: IF(OR(E12=\"\",E16=\"\"),F23,\"\")" },
  ],
  indices: { icv: "Compreensão Verbal", iop: "Organização Perceptual", imo: "Memória Operacional", ivp: "Velocidade de Processamento", qit: "QI Total", gai: "Habilidades Gerais (ICV + IOP)", cpi: "Proficiência Cognitiva (IMO + IVP)" },
  a1,
  somaParaComposto,
  valoresCriticos,
  limitesRaro,
};
writeFileSync(saida, JSON.stringify(resultado, null, 1));
console.log("gerado:", saida);
console.log("faixas:", bandasEtarias.length, `(${bandasEtarias[0].rotulo} … ${bandasEtarias[bandasEtarias.length - 1].rotulo})`, "| subtestes:", SUBTESTES.length);
for (const [k, v] of Object.entries(somaParaComposto)) console.log(" soma->", k, v.length, "linhas;", JSON.stringify(v[0]), "…", JSON.stringify(v[v.length - 1]));
console.log("valoresCriticos:", valoresCriticos.length, "| limitesRaro:", JSON.stringify(limitesRaro));
console.log("avisos (", avisos.length, "):", avisos.slice(0, 10));
