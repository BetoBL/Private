// Extrai abas de um .xlsm/.xlsx (inclusive ocultas/protegidas) para o mesmo JSON que o avaliador de fórmulas
// (scripts/avaliador-planilha.mjs) e os geradores gerar-*.mjs consomem: { "<aba>": { celulas: [{c, v, f, s, t}], mesclagens } }.
// Lê direto os XMLs do zip: NÃO precisa do Excel e NÃO executa macros. A planilha da psicóloga NÃO é alterada (só lida).
//
// Uso:  node scripts/extrair-abas-xlsm.mjs <arquivo.xlsm> <saida.json> "<aba1>" "<aba2>" ...
//       node scripts/extrair-abas-xlsm.mjs <arquivo.xlsm> --listar
//
// PROTEÇÃO DE DADO PESSOAL: as abas de LANÇAMENTO (ex.: WISC-IV, BRIEF-2) trazem nome/idade/respostas de pessoas reais nas
// células de entrada. Grave a saída FORA do repositório (ex.: pasta temporária) e nunca a versione. Os geradores só copiam
// para docs/ a estrutura e as tabelas de norma, não as respostas.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [, , arquivo, saida, ...abas] = process.argv;
if (!arquivo || !saida) {
  console.error('Uso: node scripts/extrair-abas-xlsm.mjs <arquivo.xlsm> <saida.json | --listar> "<aba>" ...');
  process.exit(1);
}

// descompacta uma CÓPIA (o original não é tocado e pode estar aberto no Excel: o Copy-Item lê com compartilhamento)
const dir = mkdtempSync(join(tmpdir(), "xlsm-"));
const copia = join(dir, "copia.zip");
execFileSync("powershell", ["-NoProfile", "-Command", `Copy-Item -LiteralPath '${arquivo.replace(/'/g, "''")}' -Destination '${copia}'; Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('${copia}', '${join(dir, "x")}')`], { stdio: "inherit" });
const ler = (p) => readFileSync(join(dir, "x", p), "utf8");
const decodificar = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));

const wb = ler("xl/workbook.xml");
const rels = ler("xl/_rels/workbook.xml.rels");
const relPorId = Object.fromEntries([...rels.matchAll(/<Relationship\b[^>]*>/g)].map((m) => [/Id="([^"]+)"/.exec(m[0])[1], /Target="([^"]+)"/.exec(m[0])[1]]));
const planilhas = [...wb.matchAll(/<sheet\b[^>]*>/g)].map((m) => ({
  nome: decodificar(/name="([^"]*)"/.exec(m[0])[1]),
  estado: /state="([^"]*)"/.exec(m[0])?.[1] ?? "visível",
  arquivo: relPorId[/r:id="([^"]+)"/.exec(m[0])[1]].replace(/^\//, "").replace(/^xl\//, "xl/").replace(/^(?!xl\/)/, "xl/"),
}));

if (saida === "--listar") {
  for (const p of planilhas) console.log(`${p.nome} [${p.estado}]`);
  process.exit(0);
}

const ss = existsSync(join(dir, "x", "xl/sharedStrings.xml")) ? ler("xl/sharedStrings.xml") : "";
const strs = [...ss.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => decodificar([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join("")));

const resultado = {};
for (const nome of abas) {
  const p = planilhas.find((x) => x.nome === nome);
  if (!p) { console.error(`Aba não encontrada: ${nome}`); process.exit(1); }
  const xml = ler(p.arquivo);
  const celulas = [];
  for (const m of xml.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const attrs = m[1];
    const c = /\br="([A-Z]+\d+)"/.exec(attrs)?.[1];
    if (!c) continue;
    const corpo = m[2] ?? "";
    const tipoXml = /\bt="(\w+)"/.exec(attrs)?.[1];
    const vBruto = /<v>([\s\S]*?)<\/v>/.exec(corpo)?.[1];
    const fTag = /<f\b([^>]*?)(?:\/>|>([\s\S]*?)<\/f>)/.exec(corpo);
    if (vBruto === undefined && !fTag) continue;
    let v = vBruto === undefined ? "" : decodificar(vBruto);
    let t = null;
    if (tipoXml === "s") { v = strs[Number(vBruto)] ?? ""; t = "s"; }
    else if (tipoXml === "str") t = "str";
    else if (tipoXml === "e") t = "e";
    else if (tipoXml === "b") t = "b";
    else if (tipoXml === "inlineStr") { v = decodificar([...corpo.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join("")); t = "s"; }
    let f = null, s = null;
    if (fTag) {
      const fa = fTag[1];
      const texto = fTag[2] === undefined ? "" : decodificar(fTag[2]);
      const si = /\bsi="(\d+)"/.exec(fa)?.[1];
      if (/\bt="shared"/.test(fa)) {
        s = si ?? null;
        f = texto ? "=" + texto : `(fórmula compartilhada #${si})`;
      } else f = "=" + texto;
    }
    celulas.push({ c, v, f, s, t });
  }
  const mesclagens = [...xml.matchAll(/<mergeCell\b[^>]*ref="([^"]+)"/g)].map((m) => m[1]);
  resultado[nome] = { estado: p.estado, mesclagens, celulas };
  console.log(`${nome}: ${celulas.length} células, ${celulas.filter((x) => x.f).length} fórmulas`);
}
writeFileSync(saida, JSON.stringify(resultado));
console.log(`Gravado em ${saida}`);
