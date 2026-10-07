// Acrescenta ao docs/testes/WISC-IV-planilha.json a seção "idadeMental": a tabela bruto → idade equivalente em meses de cada subteste
// (colunas AD10:AD24, tabelas QB:QU de WISC-NORMAS) e os limites que a planilha usa para marcar "<" / ">" (coluna Q).
// Reproduz a busca binária do LOOKUP. Roda DEPOIS dos outros geradores do WISC-IV.
//
// Uso:  node scripts/gerar-wisc4-idade-mental.mjs <wb.json (WISC-IV e WISC-NORMAS)> [planilha.json]
import { readFileSync, writeFileSync } from "node:fs";

const [, , arqWb, arqSaida = "docs/testes/WISC-IV-planilha.json"] = process.argv;
if (!arqWb) {
  console.error("Uso: node scripts/gerar-wisc4-idade-mental.mjs <wb.json> [planilha.json]");
  process.exit(1);
}
const wb = JSON.parse(readFileSync(arqWb, "utf8"));
const W = new Map(wb["WISC-IV"].celulas.map((c) => [c.c, c]));
const N = new Map(wb["WISC-NORMAS"].celulas.map((c) => [c.c, c]));
const formula = (end) => String(W.get(end)?.f ?? "").replace(/\s+/g, " ");
const numero = (end) => {
  const c = N.get(end);
  if (!c || c.t === "s" || c.t === "str" || c.v === null || c.v === undefined || c.v === "") return null;
  const n = Number(c.v);
  return Number.isNaN(n) ? null : n;
};
const col = (letras, l1, l2) => { const o = []; for (let r = l1; r <= l2; r++) o.push(numero(`${letras}${r}`)); return o; };

const faixasPorBusca = (chaves, valores) => {
  const lista = [];
  chaves.forEach((k, i) => { if (k !== null) lista.push({ k, v: valores[i] }); });
  const busca = (x) => { let lo = 0, hi = lista.length - 1, a = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (lista[m].k <= x) { a = m; lo = m + 1; } else hi = m - 1; } return a; };
  const min = Math.min(...lista.map((e) => e.k)), max = Math.max(...lista.map((e) => e.k));
  const out = [];
  for (let b = min; b <= max + 1; b++) {
    const i = busca(b);
    if (i < 0) continue;
    const v = lista[i].v;
    if (out.length && out[out.length - 1].meses === v) continue;
    out.push({ min: b, meses: v });
  }
  return out;
};

const SUBTESTES = [[10, "cb"], [11, "sm"], [12, "dg"], [13, "cn"], [14, "cd"], [15, "vc"], [16, "snl"], [17, "rm"], [18, "co"], [19, "ps"], [20, "cf"], [21, "ca"], [22, "in"], [23, "ar"], [24, "rp"]];
const subtestes = {};
for (const [lin, chave] of SUBTESTES) {
  const f = formula(`AD${lin}`);
  const refs = [...f.matchAll(/LOOKUP\(E\d+,'WISC-NORMAS'!([A-Z]+)(\d+):[A-Z]+(\d+),'WISC-NORMAS'!([A-Z]+)\d+:[A-Z]+\d+\)/g)];
  if (refs.length === 0) throw new Error(`AD${lin}: fórmula inesperada`);
  const tabelas = refs.map((m, i) => ({
    // CD e PS têm duas tabelas: até 2919 dias (6-7 anos) e a partir de 2920 (8-16 anos)
    diasMax: refs.length === 2 ? (i === 0 ? 2919 : null) : null,
    tabela: faixasPorBusca(col(m[1], Number(m[2]), Number(m[3])), col(m[4], Number(m[2]), Number(m[3]))),
  }));
  // limites de sinalização (coluna Q)
  const q = formula(`Q${lin}`);
  let limites;
  if (refs.length === 2) {
    const m = [...q.matchAll(/AND\(P5(<=|>=)(\d+),E\d+(<=|>=)(\d+)\),"([<>]?)"/g)].map((x) => ({ idade: x[1], dias: Number(x[2]), op: x[3], n: Number(x[4]), sinal: x[5] }));
    const pega = (idade, sinal) => m.find((x) => x.idade === idade && x.sinal === sinal)?.n;
    limites = [
      { diasMax: 2919, inf: pega("<=", "<"), sup: pega("<=", ">") },
      { diasMin: 2920, inf: pega(">=", "<"), sup: pega(">=", ">") },
    ];
  } else {
    const inf = /E\d+<=(\d+),"<"/.exec(q)?.[1];
    const sup = /E\d+>=(\d+),">"/.exec(q)?.[1];
    limites = [{ inf: Number(inf), sup: Number(sup) }];
  }
  if (limites.some((l) => !Number.isFinite(l.inf) || !Number.isFinite(l.sup))) throw new Error(`Q${lin}: limites não lidos (${q})`);
  subtestes[chave] = { tabelas, limites };
}

const dados = JSON.parse(readFileSync(arqSaida, "utf8"));
dados.idadeMental = { subtestes };
writeFileSync(arqSaida, JSON.stringify(dados, null, 1));
console.log(`idade mental: ${Object.keys(subtestes).length} subtestes; tabelas de CD/PS: ${subtestes.cd.tabelas.length}/${subtestes.ps.tabelas.length}`);
console.log("limites:", Object.entries(subtestes).map(([k, v]) => `${k}:${v.limites.map((l) => `${l.inf}/${l.sup}`).join(",")}`).join(" "));
