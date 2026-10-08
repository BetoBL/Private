// Extrai os GRÁFICOS de uma aba de um .xlsm/.xlsx: tipo, título, eixo e, por série, as referências de nome/categorias/valores.
// Lê só as entradas pequenas do zip (workbook, relações, desenhos, gráficos): não descompacta a planilha inteira.
//
// Uso: node scripts/extrair-graficos-xlsm.mjs <arquivo.xlsm> <saida.json> "<aba1>" "<aba2>" ...
// Saída: { "<aba>": [ { titulo, ancora:{linha,coluna}, eixo:{min?,max?}, series:[ { tipo, direcao?, nome:{ref|texto}, cat:"ref", val:"ref" } ] } ] }
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [, , arquivo, saida, ...abas] = process.argv;
if (!arquivo || !saida) { console.error('Uso: node scripts/extrair-graficos-xlsm.mjs <arquivo.xlsm> <saida.json> "<aba>" ...'); process.exit(1); }

const dir = mkdtempSync(join(tmpdir(), "graf-"));
process.on("exit", () => { try { rmSync(dir, { recursive: true, force: true }); } catch { /* ignora */ } });
const copia = join(dir, "copia.zip");
const ps = `
$ErrorActionPreference='Stop'
Copy-Item -LiteralPath '${arquivo.replace(/'/g, "''")}' -Destination '${copia}'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$z=[System.IO.Compression.ZipFile]::OpenRead('${copia}')
foreach($e in $z.Entries){ if($e.FullName -match '^xl/(workbook\\.xml|_rels/workbook\\.xml\\.rels|worksheets/_rels/[^/]+\\.rels|drawings/[^/]+\\.xml|drawings/_rels/[^/]+\\.rels|charts/chart\\d+\\.xml)$'){
  $d=Join-Path '${join(dir, "x")}' $e.FullName; New-Item -ItemType Directory -Force -Path (Split-Path $d) | Out-Null
  [System.IO.Compression.ZipFileExtensions]::ExtractToFile($e,$d,$true) } }
$z.Dispose()`;
execFileSync("powershell", ["-NoProfile", "-Command", ps], { stdio: "pipe" });
const ler = (p) => readFileSync(join(dir, "x", p), "utf8");
const existe = (p) => existsSync(join(dir, "x", p));
const dec = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const relacoes = (xml) => {
  const m = {};
  for (const r of xml.matchAll(/<Relationship\b[^>]*>/g)) {
    const id = /Id="([^"]+)"/.exec(r[0])?.[1], alvo = /Target="([^"]+)"/.exec(r[0])?.[1];
    if (id && alvo) m[id] = alvo;
  }
  return m;
};

const wbRel = relacoes(ler("xl/_rels/workbook.xml.rels"));
const folhas = {};
for (const m of ler("xl/workbook.xml").matchAll(/<sheet\b[^>]*>/g)) {
  const nome = /name="([^"]+)"/.exec(m[0])?.[1], rid = /r:id="([^"]+)"/.exec(m[0])?.[1];
  if (nome && rid && wbRel[rid]) folhas[dec(nome)] = wbRel[rid].split("/").pop();
}

const texto = (x) => [...x.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => dec(m[1])).join("");

function lerGrafico(xml) {
  const titulo = /<c:title>([\s\S]*?)<\/c:title>/.exec(xml);
  const eixo = {};
  const min = /<c:scaling>[\s\S]*?<c:min val="([^"]+)"/.exec(xml)?.[1], max = /<c:scaling>[\s\S]*?<c:max val="([^"]+)"/.exec(xml)?.[1];
  if (min !== undefined) eixo.min = Number(min);
  if (max !== undefined) eixo.max = Number(max);
  const series = [];
  for (const g of xml.matchAll(/<c:(bar|line|radar|area|pie|doughnut|scatter)(?:3D)?Chart>([\s\S]*?)<\/c:\1(?:3D)?Chart>/g)) {
    const tipo = g[1] === "doughnut" ? "pie" : g[1];
    const direcao = /<c:barDir val="(\w+)"/.exec(g[2])?.[1];
    for (const s of g[2].matchAll(/<c:ser>([\s\S]*?)<\/c:ser>/g)) {
      const b = s[1];
      const tx = /<c:tx>([\s\S]*?)<\/c:tx>/.exec(b)?.[1] ?? "";
      const nome = /<c:f>([^<]*)<\/c:f>/.exec(tx) ? { ref: dec(/<c:f>([^<]*)<\/c:f>/.exec(tx)[1]) } : /<c:v>([^<]*)<\/c:v>/.exec(tx) ? { texto: dec(/<c:v>([^<]*)<\/c:v>/.exec(tx)[1]) } : null;
      const cat = /<c:(?:cat|xVal)>[\s\S]*?<c:f>([^<]*)<\/c:f>/.exec(b)?.[1];
      const val = /<c:(?:val|yVal)>[\s\S]*?<c:f>([^<]*)<\/c:f>/.exec(b)?.[1];
      if (!val) continue;
      series.push({ tipo, ...(direcao ? { direcao } : {}), nome, cat: cat ? dec(cat) : null, val: dec(val) });
    }
  }
  return { titulo: titulo ? texto(titulo[1]) : "", eixo, series };
}

const out = {};
for (const aba of abas) {
  const arq = folhas[aba];
  if (!arq) { console.error("aba não encontrada:", aba, "→", Object.keys(folhas).join(", ")); process.exit(1); }
  const relFolha = `xl/worksheets/_rels/${arq}.rels`;
  const lista = [];
  if (existe(relFolha)) {
    for (const alvo of Object.values(relacoes(ler(relFolha)))) {
      if (!/drawings\/drawing/.test(alvo)) continue;
      const nomeDes = alvo.split("/").pop();
      const des = ler(`xl/drawings/${nomeDes}`);
      const rels = existe(`xl/drawings/_rels/${nomeDes}.rels`) ? relacoes(ler(`xl/drawings/_rels/${nomeDes}.rels`)) : {};
      for (const a of des.matchAll(/<xdr:(?:twoCellAnchor|oneCellAnchor)\b[\s\S]*?<\/xdr:(?:twoCellAnchor|oneCellAnchor)>/g)) {
        const rid = /<c:chart\b[^>]*r:id="([^"]+)"/.exec(a[0])?.[1];
        if (!rid || !rels[rid]) continue;
        const col = Number(/<xdr:from>\s*<xdr:col>(\d+)/.exec(a[0])?.[1] ?? 0), linha = Number(/<xdr:from>[\s\S]*?<xdr:row>(\d+)/.exec(a[0])?.[1] ?? 0);
        lista.push({ ancora: { linha: linha + 1, coluna: col + 1 }, ...lerGrafico(ler(`xl/charts/${rels[rid].split("/").pop()}`)) });
      }
    }
  }
  lista.sort((x, y) => x.ancora.linha - y.ancora.linha || x.ancora.coluna - y.ancora.coluna);
  out[aba] = lista;
  console.log(`${aba}: ${lista.length} gráfico(s)`);
}
writeFileSync(saida, JSON.stringify(out, null, 1));
