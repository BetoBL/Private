// Valida o avaliador de fórmulas contra os valores em CACHE da própria planilha: avalia todas as fórmulas de uma aba com as
// entradas que ela já tem e compara com o que o Excel gravou. Uso:
//   node scripts/validar-avaliador.mjs <wb.json> [aba=WAIS-III]
import { readFileSync } from "node:fs";
import { Err, Planilhas } from "./avaliador-planilha.mjs";

const [, , arq, abaAlvo = "WAIS-III"] = process.argv;
const dados = JSON.parse(readFileSync(arq, "utf8"));
const pl = new Planilhas(dados, ["WAIS-NORMAS", "WISC-NORMAS", "Tab_Conversao", "ID-Usuário"]);
const aba = dados[abaAlvo];

let total = 0, iguais = 0;
const divergentes = [];
for (const c of aba.celulas) {
  if (!c.f) continue;
  total++;
  const obtido = pl.valor(abaAlvo, c.c);
  const esperado = c.t === "e" ? String(c.v) : c.t === "str" || c.t === "s" ? (c.v === null ? "" : String(c.v)) : typeof c.v === "boolean" ? c.v : c.v === null || c.v === "" ? "" : Number(c.v);
  let ok;
  if (obtido instanceof Err) ok = c.t === "e" && String(esperado) === obtido.codigo;
  else if (typeof esperado === "number" && typeof obtido === "number") ok = Math.abs(esperado - obtido) <= 1e-9 * Math.max(1, Math.abs(esperado));
  else if (typeof esperado === "string" && typeof obtido === "number") ok = Number(esperado) === obtido && esperado !== "";
  else ok = String(esperado) === String(obtido) || (esperado === "" && (obtido === 0 || obtido === ""));
  if (ok) iguais++;
  else divergentes.push({ c: c.c, esperado, obtido: obtido instanceof Err ? obtido.codigo : obtido, f: String(c.f).replace(/\s+/g, " ").slice(0, 140) });
}
console.log(`${abaAlvo}: ${iguais}/${total} fórmulas iguais ao valor em cache do Excel (${divergentes.length} divergentes)`);
for (const d of divergentes.slice(0, 40)) console.log(` ${d.c}: esperado=${JSON.stringify(d.esperado)} obtido=${JSON.stringify(d.obtido)} | ${d.f}`);
