// Gera docs/testes/WASI-planilha.json a partir das abas WASI e WASI-Normas da planilha da psicóloga (extraídas com
// scripts/extrair-abas-xlsm.mjs). A planilha é a REFERÊNCIA DE RESULTADO: o gerador só reformata o que ela já calcula, lendo as
// próprias fórmulas para achar as colunas de WASI-Normas e reproduzindo a busca binária do LOOKUP do Excel nas tabelas.
//
// Uso:  node scripts/gerar-wasi-planilha.mjs <wb.json> [saida.json]
import { readFileSync, writeFileSync } from "node:fs";

const [, , arqWb, saida = "docs/testes/WASI-planilha.json"] = process.argv;
if (!arqWb) {
  console.error("Uso: node scripts/gerar-wasi-planilha.mjs <wb.json> [saida.json]");
  process.exit(1);
}
const wb = JSON.parse(readFileSync(arqWb, "utf8"));
const W = new Map(wb.WASI.celulas.map((c) => [c.c, c]));
const N = new Map(wb["WASI-Normas"].celulas.map((c) => [c.c, c]));
// fórmulas compartilhadas: o seguidor usa o texto do mestre (as referências usadas aqui são absolutas)
const mestres = new Map(wb.WASI.celulas.filter((c) => c.s != null && c.f && !String(c.f).startsWith("(f")).map((c) => [String(c.s), c.f]));
const formula = (end) => {
  const c = W.get(end);
  let f = String(c?.f ?? "");
  if (c && c.s != null && f.startsWith("(f")) f = mestres.get(String(c.s)) ?? f;
  return f.replace(/\s+/g, " ");
};
const avisos = [];
const celula = (end) => { const c = N.get(end); return c && c.v !== null && c.v !== undefined && c.v !== "" ? c : null; };
const num = (end) => { const c = celula(end); if (!c || c.t === "s" || c.t === "str") return null; const n = Number(c.v); return Number.isNaN(n) ? null : Number(n.toPrecision(15)); };
// valor "como o Excel mostra": número ou texto (ex.: "< 0,1", "43 - 57")
const valor = (end) => { const c = celula(end); if (!c) return null; if (c.t === "s" || c.t === "str") return String(c.v).trim(); const n = Number(c.v); return Number.isNaN(n) ? String(c.v).trim() : Number(n.toPrecision(15)); };
const col = (letras, l1, l2, f = num) => { const o = []; for (let r = l1; r <= l2; r++) o.push(f(`${letras}${r}`)); return o; };

const busca = (lista, x) => { let lo = 0, hi = lista.length - 1, a = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (lista[m].k <= x) { a = m; lo = m + 1; } else hi = m - 1; } return a; };

// bruto -> escore T: faixas sequenciais por bruto (busca binária emulada)
const tabelaT = (colChave) => {
  const chaves = col(colChave, 11, 173), ts = col("A", 11, 173);
  const lista = []; chaves.forEach((k, i) => { if (k !== null) lista.push({ k, v: ts[i] }); });
  const out = [];
  const min = Math.min(...lista.map((e) => e.k)), max = Math.max(...lista.map((e) => e.k));
  for (let b = min; b <= max + 1; b++) { const i = busca(lista, b); if (i < 0) continue; const v = lista[i].v; if (out.length && out[out.length - 1].t === v) continue; out.push({ min: b, t: v }); }
  return out;
};
const SUBS = [["vc", "F10"], ["cb", "G11"], ["sm", "F12"], ["rm", "G13"]];
const porSub = {};
for (const [chave, end] of SUBS) {
  const f = formula(end);
  const achados = [...f.matchAll(/\$P\$5>=(\d+),LOOKUP\(\$E\d+,'WASI-Normas'!\$([A-Z]+)\$11:\$[A-Z]+\$173,'WASI-Normas'!\$A\$11:\$A\$173\)/g)];
  if (achados.length < 30) throw new Error(`${chave}: poucas faixas (${achados.length})`);
  porSub[chave] = achados.map((m) => ({ diasMin: Number(m[1]), tabela: tabelaT(m[2]) })).sort((a, b) => a.diasMin - b.diasMin);
}
const diasA = porSub.vc.map((x) => x.diasMin).join();
for (const k of Object.keys(porSub)) if (porSub[k].map((x) => x.diasMin).join() !== diasA) throw new Error("faixas de idade diferentes entre subtestes");

// escore T -> ponderado (GO:GP)
const ponderado = (() => {
  const chaves = col("GO", 11, 71), vs = col("GP", 11, 71);
  const lista = []; chaves.forEach((k, i) => { if (k !== null) lista.push({ k, v: vs[i] }); });
  const out = [];
  const min = Math.min(...lista.map((e) => e.k)), max = Math.max(...lista.map((e) => e.k));
  for (let b = min; b <= max + 1; b++) { const i = busca(lista, b); if (i < 0) continue; const v = lista[i].v; if (out.length && out[out.length - 1].ponderado === v) continue; out.push({ min: b, ponderado: v }); }
  return out;
})();

// soma dos escores T -> QI/percentil/IC (linhas 25-28)
const ESCALAS = [[25, "qiv", "HA", 131], [26, "qie", "IA", 131], [27, "qit4", "JA", 251], [28, "qit2", "KA", 131]];
const escalas = {};
for (const [lin, chave, ka, fim] of ESCALAS) {
  const base = ka[0]; // H/I/J/K
  const letra = (o) => `${base}${String.fromCharCode(ka.charCodeAt(1) + o)}`; // A=0 B=1 C=2 D=3 E=4 F=5 G=6
  const chaves = col(ka, 11, fim);
  const lista = []; chaves.forEach((k, i) => { if (k !== null) lista.push({ k, r: 11 + i }); });
  const faixas = [];
  const min = Math.min(...lista.map((e) => e.k)), max = Math.max(...lista.map((e) => e.k));
  for (let s = min; s <= max + 1; s++) {
    const i = busca(lista, s);
    if (i < 0) continue;
    const r = lista[i].r;
    const item = { min: s, qi: valor(`${letra(1)}${r}`), percentil: valor(`${letra(2)}${r}`), ic: { c90: valor(`${letra(3)}${r}`), c95: valor(`${letra(4)}${r}`), a90: valor(`${letra(5)}${r}`), a95: valor(`${letra(6)}${r}`) } };
    const ant = faixas[faixas.length - 1];
    if (ant && JSON.stringify({ ...ant, min: 0 }) === JSON.stringify({ ...item, min: 0 })) continue;
    faixas.push(item);
  }
  escalas[chave] = faixas;
}
// confere que as fórmulas de IC usam as colunas esperadas (D,E = 6-16 anos 90/95; F,G = 17-89 anos 90/95)
if (!/\$HD\$11:\$HD\$131.*\$HE\$11.*\$HF\$11.*\$HG\$11/.test(formula("I25"))) avisos.push("I25: colunas de IC diferentes do esperado");

// teste-idade (idade equivalente): bruto -> texto e meses
const IDADE = [["vc", "LC"], ["sm", "LD"], ["cb", "LE"], ["rm", "LF"]];
const idadeEquivalente = {};
for (const [chave, kc] of IDADE) {
  const chaves = col(kc, 11, 101);
  const lista = []; chaves.forEach((k, i) => { if (k !== null) lista.push({ k, r: 11 + i }); });
  const out = [];
  const min = Math.min(...lista.map((e) => e.k)), max = Math.max(...lista.map((e) => e.k));
  for (let b = min; b <= max + 1; b++) {
    const i = busca(lista, b);
    if (i < 0) continue;
    const r = lista[i].r;
    const item = { min: b, texto: valor(`LA${r}`), meses: num(`LB${r}`) };
    const ant = out[out.length - 1];
    if (ant && ant.texto === item.texto && ant.meses === item.meses) continue;
    out.push(item);
  }
  idadeEquivalente[chave] = out;
}

// habilidades compartilhadas (linhas 46-101): quais dos 4 subtestes (G=SM, H=VC, I=CB, J=RM) cada uma usa
const COLUNAS_HAB = [["G", "sm", 39], ["H", "vc", 40], ["I", "cb", 41], ["J", "rm", 42]];
const habilidades = [];
let grupo = "";
for (let r = 45; r <= 101; r++) {
  const g = W.get(`B${r}`); const gv = g && g.v !== null && g.v !== "" ? String(g.v).trim() : "";
  if (gv && Number.isNaN(Number(gv))) grupo = gv;
  const numero = Number(W.get(`C${r}`)?.v ?? (r === 45 ? W.get("B45")?.v : NaN));
  const nome = W.get(`D${r}`)?.v ? String(W.get(`D${r}`).v).trim() : null;
  if (!nome || !numero) continue;
  const subtestes = [];
  for (const [c, chave, linhaO] of COLUNAS_HAB) {
    const f = formula(`${c}${r}`);
    if (!f) continue;
    const m = /\$?O\$?(\d+)>=1/.exec(f);
    if (!m) { avisos.push(`${c}${r}: fórmula inesperada`); continue; }
    if (Number(m[1]) !== linhaO) avisos.push(`${c}${r}: aponta para O${m[1]} (esperado O${linhaO})`);
    subtestes.push(chave);
  }
  // A regra da coluna K da planilha (Força/Fraqueza) vale para N subtestes; se N difere do número de subtestes da linha, a regra está inadequada (defeito).
  const nRegra = Number(/L\d+=(\d)/.exec(formula(`K${r}`))?.[1] ?? NaN);
  habilidades.push({ numero, linha: r, nome, grupo, subtestes, nRegra });
}

// textos fixos das observações e avisos (copiados das fórmulas, para o módulo não digitar nada à mão)
const textos = (end) => [...formula(end).matchAll(/"([^"]{20,})"/g)].map((m) => m[1].replace(/''/g, '"'));
const observacoes = { u25: textos("U25"), u26: textos("U26"), m27: textos("M27"), m28: textos("M28") };

const dados = {
  _fonte: "Planilha da psicóloga (aba WASI e WASI-Normas) — extraído por scripts/extrair-abas-xlsm.mjs. Referência de RESULTADO: espelha o que a planilha calcula.",
  faixasT: porSub,
  ponderado,
  escalas,
  idadeEquivalente,
  habilidades,
  observacoes,
};
writeFileSync(saida, JSON.stringify(dados, null, 1));
console.log(`WASI: ${porSub.vc.length} faixas de idade; escalas: ${Object.entries(escalas).map(([k, v]) => `${k}(${v.length})`).join(" ")}; habilidades: ${habilidades.length}`);
console.log("textos:", Object.entries(observacoes).map(([k, v]) => `${k}:${v.length}`).join(" "));
console.log("avisos:", avisos.length ? avisos.slice(0, 20) : "nenhum");
