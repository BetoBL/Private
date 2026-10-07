// Gera spec (rascunho revisável) + definição + teste de fumaça para vários testes de uma vez.
// Uso: node scripts/lote-planilha.mjs <planilha.xlsm> <lote.json>   (lote = [{aba, sigla, nome, dominio, idade, descricao, referencia}])
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const [, , xlsm, lotePath] = process.argv;
const lote = JSON.parse(readFileSync(lotePath, "utf8"));
const tmp = mkdtempSync(join(tmpdir(), "lote-"));
const extr = join(tmp, "x.json");
execFileSync("node", ["scripts/extrair-abas-xlsm.mjs", xlsm, extr, ...lote.map((t) => t.aba)], { stdio: "pipe" });
for (const t of lote) {
  const meta = { nome: t.nome, dominio: t.dominio, idade: t.idade, descricao: t.descricao, referencia: t.referencia, grupoPorColuna: t.grupoPorColuna };
  const spec = execFileSync("node", ["scripts/rascunho-spec-planilha.mjs", extr, t.aba, t.sigla, JSON.stringify(meta)], { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 });
  const dest = `docs/testes/planilha/specs/${t.sigla}.spec.json`;
  writeFileSync(dest, spec);
  const d = JSON.parse(spec);
  console.log(`\n### ${t.sigla}: ${d.entradas.length} entradas, ${d.opcoes.length} opções, ${d.saidas.length} saídas, data=${d.contexto.dataAplicacao}`);
  try {
    console.log(execFileSync(process.execPath, ["node_modules/tsx/dist/cli.mjs", "scripts/construir-teste-planilha.ts", xlsm, dest, "--smoke", "100"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 50 * 1024 * 1024 }).trim());
  } catch (e) { console.log("FALHA no build:", String(e.stderr || e.message).split("\n").slice(0, 4).join(" | ")); }
}
