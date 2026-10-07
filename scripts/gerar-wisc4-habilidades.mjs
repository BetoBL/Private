// Acrescenta ao docs/testes/WISC-IV-planilha.json a seção "habilidades": as habilidades compartilhadas (Kaufman & Lichtenberger),
// com os subtestes de cada uma (células AH:AV das linhas 64+) e a regra de interpretação lida da coluna AW. Roda DEPOIS dos
// outros geradores do WISC-IV.
//
// Uso:  node scripts/gerar-wisc4-habilidades.mjs <wb.json (aba WISC-IV)> [planilha.json]
import { readFileSync, writeFileSync } from "node:fs";

const [, , arqWb, arqSaida = "docs/testes/WISC-IV-planilha.json"] = process.argv;
if (!arqWb) {
  console.error("Uso: node scripts/gerar-wisc4-habilidades.mjs <wb.json> [planilha.json]");
  process.exit(1);
}
const wb = JSON.parse(readFileSync(arqWb, "utf8"));
const W = new Map(wb["WISC-IV"].celulas.map((c) => [c.c, c]));
const formula = (end) => String(W.get(end)?.f ?? "").replace(/\s+/g, " ");
const valor = (end) => { const c = W.get(end); return c && c.v !== null && c.v !== undefined && c.v !== "" ? String(c.v).trim() : null; };

// AA60..AA74 (diferença da média) na ordem da coluna AB; as colunas AH..AV seguem a mesma ordem
const SUBTESTES = ["sm", "vc", "co", "in", "rp", "cb", "cn", "rm", "cf", "dg", "snl", "ar", "cd", "ps", "ca"];
const col = (n) => { let s = ""; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
const COL_AH = 34; // AH
const avisos = [];

const habilidades = [];
let grupo = "";
for (let r = 64; r <= 145; r++) {
  const g = valor(`AC${r}`);
  if (g !== null && Number.isNaN(Number(g))) grupo = g;
  const numero = Number(valor(`AD${r}`));
  const nome = valor(`AE${r}`);
  if (!numero || !nome) continue;
  const subtestes = [];
  for (let i = 0; i < 15; i++) {
    const f = formula(`${col(COL_AH + i)}${r}`);
    if (!f) continue;
    // Defeito da planilha: em 4 habilidades a coluna do RM aponta para $G$95 (célula em branco) em vez de AA67 e sempre dá "Neutro".
    if (/\$G\$95/.test(f)) { avisos.push(`${col(COL_AH + i)}${r}: referência errada $G$95 lida como AA67 (RM)`); subtestes.push("rm"); continue; }
    const m = /AA(\d+)>=1/.exec(f);
    if (!m) { avisos.push(`${col(COL_AH + i)}${r}: fórmula inesperada`); continue; }
    if (Number(m[1]) - 60 !== i) avisos.push(`${col(COL_AH + i)}${r}: aponta para AA${m[1]} (esperado AA${60 + i})`);
    subtestes.push(SUBTESTES[Number(m[1]) - 60]);
  }
  const aw = formula(`AW${r}`);
  const n = Number(/AX\d+=(\d+)/.exec(aw)?.[1]);
  const k = /AX\d+>=(\d+)/.exec(aw)?.[1];
  if (n !== subtestes.length) avisos.push(`habilidade ${numero}: AW espera ${n} subtestes mas há ${subtestes.length} marcados`);
  // Defeito de digitação: em várias linhas o teste "quase todos negativos" usa AY=0 no lugar de AX=0, e a condição nunca ocorre.
  // Cada regra "quase todos" deve ter as duas variantes {outro=1, neutro=0} e {outro=0, neutro=1}; senão a linha está com defeito.
  const regraCerta = (lado, outro) => {
    const clausulas = [...aw.matchAll(new RegExp(`AND\\(${lado}\\d+>=\\d+,([^)]*)\\)`, "g"))].map((m) => m[1].split(",").map((x) => x.trim().replace(/\d+/, "")).sort().join(","));
    const esperadas = [[`${outro}=1`, "AZ=0"], [`${outro}=0`, "AZ=1"]].map((x) => x.sort().join(","));
    return k === undefined || (clausulas.length === 2 && esperadas.every((e) => clausulas.includes(e)));
  };
  const fraquezaDefeituosa = !regraCerta("AY", "AX");
  const forcaDefeituosa = !regraCerta("AX", "AY");
  habilidades.push({ numero, nome, grupo, subtestes, n, k: k === undefined ? null : Number(k), fraquezaDefeituosa, forcaDefeituosa });
}
if (habilidades.length < 75) throw new Error(`poucas habilidades: ${habilidades.length}`);

const dados = JSON.parse(readFileSync(arqSaida, "utf8"));
dados.habilidades = habilidades;
writeFileSync(arqSaida, JSON.stringify(dados, null, 1));
console.log(`habilidades: ${habilidades.length} (grupos: ${[...new Set(habilidades.map((h) => h.grupo))].join(" | ")}); regras com defeito: fraqueza em ${habilidades.filter((h) => h.fraquezaDefeituosa).length}, força em ${habilidades.filter((h) => h.forcaDefeituosa).length}`);
console.log("avisos:", avisos.length ? avisos.slice(0, 20) : "nenhum");
