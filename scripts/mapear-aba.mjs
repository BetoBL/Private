// Mapa compacto de uma aba (para escrever a spec do motor de planilha): por linha, os textos fixos e as células com fórmula.
// Uso: node scripts/mapear-aba.mjs <saida-do-extrair-abas.json> "<aba>" [linhaIni] [linhaFim]
import { readFileSync } from "node:fs";
const [, , arq, aba, ini = "1", fim = "9999"] = process.argv;
const a = JSON.parse(readFileSync(arq, "utf8"))[aba];
if (!a) { console.error("aba não encontrada:", Object.keys(JSON.parse(readFileSync(arq, "utf8"))).join(", ")); process.exit(1); }
const linhas = {};
for (const c of a.celulas) { const r = Number(/\d+/.exec(c.c)[0]); (linhas[r] ??= []).push(c); }
const col = (e) => { const l = /^[A-Z]+/.exec(e)[0]; return [...l].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0); };
for (const r of Object.keys(linhas).map(Number).sort((x, y) => x - y)) {
  if (r < Number(ini) || r > Number(fim)) continue;
  const cs = linhas[r].sort((x, y) => col(x.c) - col(y.c));
  const t = cs.filter((c) => !c.f && c.v !== "" && c.v !== null && (c.t === "s" || c.t === "str")).map((c) => `${c.c}=${String(c.v).replace(/\s+/g, " ").slice(0, 30)}`).join(" | ");
  const n = cs.filter((c) => !c.f && c.v !== "" && c.v !== null && c.t !== "s" && c.t !== "str").map((c) => `${c.c}=${c.v}`).join(" ");
  const f = cs.filter((c) => c.f).map((c) => c.c).join(",");
  if (t || n || f) console.log(`${r}: ${t}${n ? "  [num: " + n + "]" : ""}${f ? "  [f: " + f + "]" : ""}`.slice(0, 400));
}
