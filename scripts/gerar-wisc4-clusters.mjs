// Acrescenta ao docs/testes/WISC-IV-planilha.json a seção "clusters": os 8 clusters (linhas 148-172), as comparações clínicas
// (linhas 175-181) e os textos de hipótese/sugestão de intervenção (WISC-NORMAS A852:J962). Lê as fórmulas da planilha para
// descobrir as colunas de WISC-NORMAS. Roda DEPOIS de gerar-wisc4-planilha.mjs.
//
// Uso:  node scripts/gerar-wisc4-clusters.mjs <wb.json (WISC-IV e WISC-NORMAS)> [planilha.json]
import { readFileSync, writeFileSync } from "node:fs";

const [, , arqWb, arqSaida = "docs/testes/WISC-IV-planilha.json"] = process.argv;
if (!arqWb) {
  console.error("Uso: node scripts/gerar-wisc4-clusters.mjs <wb.json> [planilha.json]");
  process.exit(1);
}
const wb = JSON.parse(readFileSync(arqWb, "utf8"));
const W = new Map(wb["WISC-IV"].celulas.map((c) => [c.c, c]));
const N = new Map(wb["WISC-NORMAS"].celulas.map((c) => [c.c, c]));
const formula = (end) => String(W.get(end)?.f ?? "").replace(/\s+/g, " ");
const valor = (end) => { const c = N.get(end); return c && c.v !== null && c.v !== undefined && c.v !== "" ? c.v : null; };
const numero = (end) => { const v = valor(end); if (v === null) return null; const n = Number(v); return Number.isNaN(n) ? null : Number(n.toPrecision(15)); };
const texto = (end) => { const v = valor(end); return v === null ? null : String(v).trim(); };

// Reproduz o LOOKUP do Excel (busca binária) para cada soma inteira
const tabelaCluster = (colChave, colComposto, colIc, colPerc, l1, l2) => {
  const lista = [];
  for (let r = l1; r <= l2; r++) {
    const k = numero(`${colChave}${r}`);
    if (k !== null) lista.push({ k, composto: numero(`${colComposto}${r}`), ic95: texto(`${colIc}${r}`), percentil: numero(`${colPerc}${r}`) });
  }
  const busca = (x) => { let lo = 0, hi = lista.length - 1, a = -1; while (lo <= hi) { const m = (lo + hi) >> 1; if (lista[m].k <= x) { a = m; lo = m + 1; } else hi = m - 1; } return a; };
  const min = Math.min(...lista.map((e) => e.k)), max = Math.max(...lista.map((e) => e.k));
  const out = [];
  for (let s = min; s <= max + 1; s++) {
    const i = busca(s);
    if (i < 0) continue;
    const { composto, ic95, percentil } = lista[i];
    const ant = out[out.length - 1];
    if (ant && ant.composto === composto && ant.ic95 === ic95 && ant.percentil === percentil) continue;
    out.push({ min: s, composto, ic95, percentil });
  }
  return out;
};

const CLUSTERS = [
  [148, "gf", "Gf", ["rm", "cn", "ar"]], [152, "gv", "Gv", ["cb", "cf"]], [155, "gf_nonverbal", "Gf-nonverbal", ["rm", "cn"]],
  [158, "gf_verbal", "Gf-verbal", ["sm", "rp"]], [161, "gc_vl", "Gc-VL", ["rp", "vc"]], [164, "gc_ko", "Gc-K0", ["co", "in"]],
  [167, "gc_lm", "Gc-LM", ["vc", "in"]], [170, "gsm_wm", "Gsm-WM", ["snl", "dg"]],
];
const clusters = CLUSTERS.map(([linha, chave, sigla, subtestes]) => {
  const rotulo = String(W.get(`B${linha}`).v).trim();
  const refs = {};
  for (const col of ["I", "J", "K"]) {
    const m = /LOOKUP\(H\d+,'WISC-NORMAS'!([A-Z]+)632:[A-Z]+(\d+),'WISC-NORMAS'!([A-Z]+)632:/.exec(formula(`${col}${linha}`));
    if (!m) throw new Error(`fórmula ${col}${linha} inesperada`);
    refs[col] = { chave: m[1], valor: m[3], fim: Number(m[2]) };
  }
  if (refs.I.chave !== refs.J.chave || refs.I.chave !== refs.K.chave) throw new Error(`colunas-chave diferentes em ${linha}`);
  return { chave, sigla, rotulo, linha, subtestes, tabela: tabelaCluster(refs.I.chave, refs.I.valor, refs.J.valor, refs.K.valor, 632, refs.I.fim) };
});

// comparações clínicas (linhas 175-180) + GAI x CPI (181)
const COMP = [[175, "gf", "gv"], [176, "gf_nonverbal", "gv"], [177, "gf_nonverbal", "gf_verbal"], [178, "gc_vl", "gc_ko"], [179, "gc_lm", "gsm_wm"], [180, "gc_lm", "gf_verbal"]];
const BASES = { 175: 852, 176: 872, 177: 892, 178: 912, 179: 932, 180: 952 };
const comparacoes = COMP.map(([linha, a, b]) => {
  const m = /ABS\(I\d+\)>=(\d+)/.exec(formula(`J${linha}`));
  if (!m) throw new Error(`valor crítico da linha ${linha} não achado`);
  const titulo = /CONCATENATE\("([^"]*)"\s*&\s*M\d+\s*&\s*"([^"]*)"\)/.exec(formula(`${["B", "E", "I", "M", "R", "V"][linha - 175]}184`));
  if (!titulo) throw new Error(`título da linha ${linha} não achado`);
  const base = BASES[linha];
  return {
    linha, a, b, valorCritico: Number(m[1]), tituloEsquerda: titulo[1].trim(), tituloDireita: titulo[2].trim(),
    // ">" = o primeiro cluster é o maior; "<" = o segundo é o maior
    hipoteseMaior: texto(`A${base}`), hipoteseMenor: texto(`A${base + 10}`),
    sugestaoMaior: texto(`J${base}`), sugestaoMenor: texto(`J${base + 10}`),
  };
});
// Defeito da planilha na linha 180 (Gc-LM x Gf-verbal): o texto A952 descreve "raciocínio melhor que conhecimento" (Gc-LM MENOR) mas a
// fórmula o mostra quando Gc-LM é MAIOR (B185/V185 usa ">" → A952); a sugestão (V188) usa "<" → J952, que é o sentido certo.
// Aqui os textos seguem o sentido real: "<" (Gc-LM menor) → A952/J952; ">" → A962/J962.
const c180 = comparacoes.find((c) => c.linha === 180);
[c180.hipoteseMaior, c180.hipoteseMenor] = [c180.hipoteseMenor, c180.hipoteseMaior];
[c180.sugestaoMaior, c180.sugestaoMenor] = [c180.sugestaoMenor, c180.sugestaoMaior];

const dados = JSON.parse(readFileSync(arqSaida, "utf8"));
dados.clusters = { clusters, comparacoes };
writeFileSync(arqSaida, JSON.stringify(dados, null, 1));
console.log(`clusters: ${clusters.map((c) => `${c.sigla}(${c.tabela.length})`).join(" ")}; comparações: ${comparacoes.map((c) => c.valorCritico).join("/")}`);
console.log("textos vazios:", comparacoes.flatMap((c) => ["hipoteseMaior", "hipoteseMenor", "sugestaoMaior", "sugestaoMenor"].filter((k) => !c[k]).map((k) => `${c.linha}.${k}`)));
