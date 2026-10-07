// Acrescenta a seção "discrepancias" ao docs/testes/WISC-IV-planilha.json: tabelas de valor crítico e de frequência acumulada
// das comparações entre índices (linhas 70-75) e entre subtestes (linhas 78-93) da aba WISC-IV. Lê as próprias fórmulas da
// planilha para descobrir QUAL célula de WISC-NORMAS cada caso usa (nada digitado à mão além dos pares).
//
// Uso:  node scripts/gerar-wisc4-discrepancias.mjs <export-wisc4.json> <export-wisc-normas.json> [planilha.json]
import { readFileSync, writeFileSync } from "node:fs";

const [, , arqWisc, arqNormas, arqSaida = "docs/testes/WISC-IV-planilha.json"] = process.argv;
if (!arqWisc || !arqNormas) {
  console.error("Uso: node scripts/gerar-wisc4-discrepancias.mjs <export-wisc4.json> <export-wisc-normas.json> [planilha.json]");
  process.exit(1);
}
const W = new Map(JSON.parse(readFileSync(arqWisc, "utf8"))["WISC-IV"].celulas.map((c) => [c.c, c]));
const N = new Map(JSON.parse(readFileSync(arqNormas, "utf8"))["WISC-NORMAS"].celulas.map((c) => [c.c, c]));
const formula = (end) => String(W.get(end)?.f ?? "").replace(/\s+/g, " ");
const num = (v) => {
  if (typeof v === "number") return Number(v.toPrecision(15));
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(Number(v).toPrecision(15));
  return null;
};
const celula = (col, lin) => num(N.get(`${col}${lin}`)?.v);

// --- valores críticos: IF(L64=n, 'WISC-NORMAS'!X###) ---
const criticosDaLinha = (lin) => {
  const f = formula(`I${lin}`);
  const porIdade = new Map(); // diasMin -> [v1..v4]
  for (const m of f.matchAll(/P5>=(\d+),L64=(\d)\),\('WISC-NORMAS'!([A-Z]+)(\d+)\)/g)) {
    const dias = Number(m[1]);
    const v = porIdade.get(dias) ?? [null, null, null, null];
    v[Number(m[2]) - 1] = celula(m[3], Number(m[4]));
    porIdade.set(dias, v);
  }
  return [...porIdade.entries()].sort((a, b) => a[0] - b[0]).map(([diasMin, v]) => ({ diasMin, v }));
};
const criticosSimples = (lin) => {
  const f = formula(`I${lin}`);
  const v = [null, null, null, null];
  for (const m of f.matchAll(/L64=(\d),'WISC-NORMAS'!([A-Z]+)(\d+)/g)) v[Number(m[1]) - 1] = celula(m[2], Number(m[3]));
  return v;
};

// --- frequência acumulada: LOOKUP(ABS(H), chaves, coluna&"%") ---
const tabelaFreq = (colChave, colValor, l1, l2) => {
  const chaves = [], valores = [];
  for (let r = l1; r <= l2; r++) {
    const k = num(N.get(`${colChave}${r}`)?.v);
    if (k === null) continue;
    chaves.push(k);
    valores.push(num(N.get(`${colValor}${r}`)?.v)); // nulo = célula vazia/" " (a planilha mostra só "%")
  }
  return { chaves, valores };
};

// Índices (K70..K75): grupos pela condição (Amostra Geral ou nível do QIT).
const GRUPOS_QIT = [["amostra", /J62="Amostra Geral"/], ["ate79", /F41<=79/], ["ate89", /F41<=89/], ["ate109", /F41<=109/], ["ate119", /F41<=119/], ["a120", /F41>=120/]];
const freqIndice = (lin) => {
  const f = formula(`K${lin}`);
  const out = {};
  for (const m of f.matchAll(/AND\(([^()]*)\),LOOKUP\(ABS\(H\d+\),'WISC-NORMAS'!([A-Z]+)421:[A-Z]+461,'WISC-NORMAS'!([A-Z]+)421/g)) {
    const grupo = GRUPOS_QIT.find(([, re]) => re.test(m[1]))?.[0];
    const sinal = /H\d+>0/.test(m[1]) ? "pos" : "neg";
    (out[grupo] ??= {})[sinal] = tabelaFreq(m[2], m[3], 421, 461);
  }
  return out;
};

const PARES_INDICES = [
  [70, "ICV - IOP", "icv", "iop"], [71, "ICV - IMO", "icv", "imo"], [72, "ICV - IVP", "icv", "ivp"],
  [73, "IOP - IMO", "iop", "imo"], [74, "IOP - IVP", "iop", "ivp"], [75, "IMO - IVP", "imo", "ivp"],
];
const indices = PARES_INDICES.map(([linha, rotulo, a, b]) => ({ linha, rotulo, a, b, criticos: criticosDaLinha(linha), frequencia: freqIndice(linha) }));
for (const i of indices) {
  if (i.criticos.length !== 11 || i.criticos.some((x) => x.v.some((y) => y === null))) throw new Error(`valores críticos de índices incompletos (linha ${i.linha})`);
  if (Object.keys(i.frequencia).length !== 6 || Object.values(i.frequencia).some((g) => !g.neg || !g.pos)) throw new Error(`frequência de índices incompleta (linha ${i.linha})`);
}

const PARES_SUBTESTES = [
  [78, "Gv", "CB - CF", "cb", "cf"], [79, "Gf", "RM - CN", "rm", "cn"], [80, "Gf", "CN - AR", "cn", "ar"], [81, "Gf", "RM - AR", "rm", "ar"],
  [82, "Gf-Nonverbal", "RM - CN", "rm", "cn"], [83, "Gf-Verbal", "SM - RP", "sm", "rp"], [84, "Gc-K0", "CO - IN", "co", "in"],
  [85, "Gc-VL", "RP - VC", "rp", "vc"], [86, "Gc-LM", "VC - IN", "vc", "in"], [87, "Gsm-WM", "DG - SNL", "dg", "snl"],
  [88, "Gsm-WM", "DG - AR", "dg", "ar"], [89, "Gsm-WM", "SNL - AR", "snl", "ar"], [90, "Gs-P", "CD - CA", "cd", "ca"],
  [91, "Gs-P", "PS - CA", "ps", "ca"], [92, "Gs-P", "CD - PS", "cd", "ps"], [93, "Gf", "SM - CN", "sm", "cn"],
];
const subtestes = PARES_SUBTESTES.map(([linha, grupo, rotulo, a, b]) => {
  const item = { linha, grupo, rotulo, a, b, criticos: criticosSimples(linha) };
  const f = formula(`K${linha}`);
  if (f) {
    const freq = {};
    for (const m of f.matchAll(/H\d+([<>])0\)?,LOOKUP\(ABS\(H\d+\),'WISC-NORMAS'!([A-Z]+)501:[A-Z]+519,'WISC-NORMAS'!([A-Z]+)501/g)) freq[m[1] === "<" ? "neg" : "pos"] = tabelaFreq(m[2], m[3], 501, 519);
    if (!freq.neg || !freq.pos) throw new Error(`frequência incompleta na linha ${linha}`);
    item.frequencia = freq;
  }
  if (item.criticos.some((v) => v === null)) throw new Error(`valor crítico incompleto na linha ${linha}`);
  return item;
});

const dados = JSON.parse(readFileSync(arqSaida, "utf8"));
dados.discrepancias = { indices, subtestes };
writeFileSync(arqSaida, JSON.stringify(dados, null, 1));
console.log(`discrepâncias: ${indices.length} pares de índices, ${subtestes.length} pares de subtestes (${subtestes.filter((s) => s.frequencia).length} com frequência)`);
