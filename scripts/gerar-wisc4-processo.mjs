// Acrescenta ao docs/testes/WISC-IV-planilha.json as seções "facilidades" (linhas 100-109 da aba WISC-IV) e "processo"
// (linhas 116-140: escores de processo CUSB/DIOD/DIOI/CAA/CAE, maior sequência de dígitos e comparações). Lê as fórmulas da planilha
// para descobrir as células de WISC-NORMAS usadas. Roda DEPOIS de gerar-wisc4-planilha.mjs.
//
// Uso:  node scripts/gerar-wisc4-processo.mjs <wb.json (com WISC-IV e WISC-NORMAS, com tipos)> [planilha.json]
import { readFileSync, writeFileSync } from "node:fs";

const [, , arqWb, arqSaida = "docs/testes/WISC-IV-planilha.json"] = process.argv;
if (!arqWb) {
  console.error("Uso: node scripts/gerar-wisc4-processo.mjs <wb.json> [planilha.json]");
  process.exit(1);
}
const wb = JSON.parse(readFileSync(arqWb, "utf8"));
const W = new Map(wb["WISC-IV"].celulas.map((c) => [c.c, c]));
const N = new Map(wb["WISC-NORMAS"].celulas.map((c) => [c.c, c]));
const formula = (end) => String(W.get(end)?.f ?? "").replace(/\s+/g, " ");
const avisos = [];
// valor numérico de uma célula de WISC-NORMAS (texto, mesmo numérico, vira null: o Excel também o ignora numa busca numérica)
const numero = (end) => {
  const c = N.get(end);
  if (!c || c.v === null || c.v === undefined || c.v === "") return null;
  if (c.t === "s" || c.t === "str") {
    if (!Number.isNaN(Number(c.v)) && String(c.v).trim() !== "") avisos.push(`${end}: número gravado como texto (${c.v})`);
    return null;
  }
  const n = Number(c.v);
  return Number.isNaN(n) ? null : Number(n.toPrecision(15));
};
const col = (letras, l1, l2) => { const o = []; for (let r = l1; r <= l2; r++) o.push(numero(`${letras}${r}`)); return o; };

// Reproduz o LOOKUP do Excel (busca binária ignorando chaves não numéricas) para cada bruto inteiro; devolve faixas sequenciais.
const faixasPorBusca = (chaves, valores) => {
  const lista = [];
  chaves.forEach((k, i) => { if (k !== null) lista.push({ k, v: valores[i] }); });
  if (!lista.length) return [];
  const busca = (x) => { let lo = 0, hi = lista.length - 1, a = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (lista[m].k <= x) { a = m; lo = m + 1; } else hi = m - 1; } return a; };
  const min = Math.min(...lista.map((e) => e.k)), max = Math.max(...lista.map((e) => e.k));
  const out = [];
  for (let b = min; b <= max + 1; b++) {
    const i = busca(b);
    if (i < 0) continue;
    const v = lista[i].v;
    if (out.length && out[out.length - 1].valor === v) continue;
    out.push({ min: b, valor: v });
  }
  return out;
};

// Lista [{diasMin, ...}] a partir de IF(P5>=N, <trecho>, ...) com o regex do trecho
const porIdade = (f, reTrecho) => {
  const out = [];
  for (const m of f.matchAll(reTrecho)) out.push({ diasMin: Number(m[1]), m });
  return out.sort((a, b) => a.diasMin - b.diasMin);
};

// ===== escores de processo: bruto -> ponderado (linhas 116-120) =====
const PROCESSOS = [["cusb", 116], ["diod", 117], ["dioi", 118], ["caa", 119], ["cae", 120]];
const processoPond = {};
for (const [chave, lin] of PROCESSOS) {
  const f = formula(`F${lin}`);
  const itens = porIdade(f, /P5>=(\d+),LOOKUP\(E\d+,'WISC-NORMAS'!([A-Z]+)232:([A-Z]+)347,'WISC-NORMAS'!([A-Z]+)232:[A-Z]+347\)/g);
  if (itens.length !== 33) throw new Error(`${chave}: esperava 33 faixas, achei ${itens.length}`);
  processoPond[chave] = itens.map(({ diasMin, m }) => {
    let colunaChave = m[2];
    // Defeito da planilha (CUSB, faixa a partir de 3405 dias): a chave é o intervalo bidimensional IB:IG; o correto é a coluna IB.
    if (m[3] !== m[2]) { avisos.push(`F${lin} faixa ${diasMin}: chave bidimensional ${m[2]}:${m[3]} — usada só ${m[2]}`); colunaChave = m[2]; }
    const tabela = faixasPorBusca(col(colunaChave, 232, 347), col(m[4], 232, 347)).map((x) => ({ min: x.min, ponderado: x.valor }));
    return { diasMin, tabela };
  });
}

// ===== maior sequência de dígitos (linhas 126-127) e diferença (133) =====
const tabelaLookup = (f, chaveCol, l1, l2) => {
  const re = new RegExp(`P5>=(\\d+),LOOKUP\\([A-Z]+\\d+,'WISC-NORMAS'!${chaveCol}${l1}:${chaveCol}${l2},'WISC-NORMAS'!([A-Z]+)${l1}:[A-Z]+${l2}\\)`, "g");
  const chaves = col(chaveCol, l1, l2);
  return porIdade(f, re).map(({ diasMin, m }) => ({ diasMin, chaves: chaves.filter((k) => k !== null), valores: col(m[2], l1, l2).filter((_, i) => chaves[i] !== null) }));
};
// z = (bruto - média)/DP  (inverso: (média - diferença)/DP, caso da diferença UDIOD-UDIOI)
const zPorIdade = (f, linMedia, linDp, inverso) => {
  const re = inverso
    ? new RegExp("P5>=(\\d+),\\(\\('WISC-NORMAS'!([A-Z]+)" + linMedia + "-G133\\)/'WISC-NORMAS'!([A-Z]+)" + linDp + "\\)", "g")
    : new RegExp("P5>=(\\d+),\\(\\(E\\d+-'WISC-NORMAS'!([A-Z]+)" + linMedia + "\\)/'WISC-NORMAS'!([A-Z]+)" + linDp + "\\)", "g");
  return porIdade(f, re).map(({ diasMin, m }) => ({ diasMin, media: numero(`${m[2]}${linMedia}`), dp: numero(`${m[3]}${linDp}`) }));
};
const udio = {};
for (const [chave, lin] of [["udiod", 126], ["udioi", 127]]) {
  udio[chave] = { freq: tabelaLookup(formula(`F${lin}`), "A", 552, 562), z: zPorIdade(formula(`G${lin}`), 563, 564, false) };
  if (udio[chave].freq.length !== 11 || udio[chave].z.length !== 11) throw new Error(`${chave}: faixas incompletas`);
}
const fDif = formula("H133");
const difUdio = { freq: tabelaLookup(fDif, "A", 572, 582), z: zPorIdade(formula("I133"), 583, 584, true) };
if (difUdio.freq.length !== 11 || difUdio.z.length !== 11) throw new Error("diferença UDIOD-UDIOI: faixas incompletas");

// ===== comparações CB×CUSB, DIOD×DIOI, CAA×CAE (linhas 138-140) =====
const comparacoes = [
  { linha: 138, rotulo: "Cubos - Cubos s/ tempo Bônus", a: "cb", b: "cusb", celulas: ["C593", "C594"], freq: ["B", "C"] },
  { linha: 139, rotulo: "Dig. Ord. Dir. - Dig. Ord. Inv.", a: "diod", b: "dioi", celulas: ["D595", "D596"], freq: ["D", "E"] },
  { linha: 140, rotulo: "Cancelamento Aleatório-Estruturado", a: "caa", b: "cae", celulas: ["E597", "E598"], freq: ["F", "G"] },
].map((c) => {
  const f = formula(`I${c.linha}`);
  const refs = [...f.matchAll(/L138=(\d),'WISC-NORMAS'!([A-Z]+\d+)/g)].map((m) => m[2]);
  if (refs.join() !== c.celulas.join()) throw new Error(`linha ${c.linha}: células esperadas ${c.celulas}, achei ${refs}`);
  return { linha: c.linha, rotulo: c.rotulo, a: c.a, b: c.b, criticos: c.celulas.map(numero), frequencia: { chaves: col("A", 608, 625).filter((k) => k !== null), neg: col(c.freq[0], 608, 625), pos: col(c.freq[1], 608, 625) } };
});

// ===== facilidades e dificuldades (linhas 100-109) =====
const SUBS = ["cb", "sm", "dg", "cn", "cd", "vc", "snl", "rm", "co", "ps"];
const facilidades = SUBS.map((chave, i) => {
  const lin = 100 + i;
  const g = [...formula(`G${lin}`).matchAll(/L100=(\d),'WISC-NORMAS'!([A-Z]+\d+)/g)];
  const criticos = [null, null, null, null];
  for (const m of g) criticos[Number(m[1]) - 1] = numero(m[2]);
  const j = formula(`J${lin}`);
  // Defeito da planilha: em CN (níveis 3/4) o limite está digitado "4,33" (vírgula = separador de argumentos); o correto é 4.33.
  // Também há "=2%" em vez de "2%" nas regras de igualdade dos níveis 3/4.
  const regras = [...j.matchAll(/AND\(ABS\(AB\d+\)([<>=]+)([\d.]+(?:,\d+)?),OR\(L100=(\d),L100=(\d)\),OR\(I\d+="F",I\d+="D"\)\),"([^"]*)"/g)].map((m) => {
    if (m[2].includes(",")) avisos.push(`J${lin}: limite "${m[2]}" lido como ${m[2].replace(",", ".")}`);
    return { op: m[1], n: Number(m[2].replace(",", ".")), niveis: [Number(m[3]), Number(m[4])], texto: m[5] === "=2%" ? "2%" : m[5] };
  });
  return { chave, linha: lin, criticos, regras };
});
if (facilidades[0].regras.length !== 22) throw new Error(`regras de frequência de CB: ${facilidades[0].regras.length}`);

const dados = JSON.parse(readFileSync(arqSaida, "utf8"));
dados.facilidades = facilidades;
dados.processo = { ponderado: processoPond, udio, difUdio, comparacoes };
writeFileSync(arqSaida, JSON.stringify(dados, null, 1));
console.log("facilidades:", facilidades.map((f) => `${f.chave}:${f.regras.length}r/${f.criticos.filter((x) => x !== null).length}c`).join(" "));
console.log("avisos:", avisos.length ? avisos.slice(0, 20) : "nenhum");
