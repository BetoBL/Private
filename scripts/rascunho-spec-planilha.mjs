// Gera um RASCUNHO de spec do motor de planilha a partir de uma aba extraída (scripts/extrair-abas-xlsm.mjs):
//   - entradas: células sem fórmula lidas por fórmulas (vazias ou numéricas), com rótulo = texto mais próximo (à esquerda ou acima);
//   - opções: células comparadas com textos fixos nas fórmulas (ex.: Q5="Escolaridade");
//   - saídas: células com fórmula que nenhuma outra fórmula lê (folhas), com o mesmo tipo de rótulo;
//   - data de aplicação: a célula usada como 2º argumento de DATEDIF.
// O rascunho precisa de revisão (rótulos, agrupamento, layout das tabelas) antes de virar spec.
// Uso: node scripts/rascunho-spec-planilha.mjs <extraido.json> "<aba>" <SIGLA> > docs/testes/planilha/specs/<SIGLA>.rascunho.json
import { readFileSync } from "node:fs";

const [, , arq, nomeAba, sigla, metaJson] = process.argv;
const meta = metaJson ? JSON.parse(metaJson) : {};
const aba = JSON.parse(readFileSync(arq, "utf8"))[nomeAba];
if (!aba) { console.error("aba não encontrada"); process.exit(1); }
const cel = new Map(aba.celulas.map((c) => [c.c, c]));
const colNum = (l) => [...l].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
const numCol = (n) => { let s = ""; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
const parse = (a) => { const m = /^(\$?)([A-Z]{1,3})(\$?)(\d+)$/.exec(a); return { cAbs: !!m[1], c: colNum(m[2]), rAbs: !!m[3], r: Number(m[4]) }; };
const desloc = (a, dr, dc) => { const p = parse(a); return `${numCol(p.cAbs ? p.c : p.c + dc)}${p.rAbs ? p.r : p.r + dr}`; };
const mestres = new Map(aba.celulas.filter((c) => c.s != null && c.f && !String(c.f).startsWith("(f")).map((c) => [String(c.s), c]));

const lidas = new Set(); // células da aba lidas por fórmulas
const comparacoes = new Map(); // célula -> Set(textos)
const datedifSegundos = new Map();
for (const c of aba.celulas) {
  if (!c.f) continue;
  let texto = String(c.f), dr = 0, dc = 0;
  if (c.s != null && texto.startsWith("(f")) { const m = mestres.get(String(c.s)); if (!m) continue; texto = m.f; const pm = parse(m.c), pc = parse(c.c); dr = pc.r - pm.r; dc = pc.c - pm.c; }
  const sem = texto.replace(/"(?:[^"]|"")*"/g, '""');
  for (const m of sem.matchAll(/(?:(?:'((?:[^']|'')+)'|([A-Za-z_][A-Za-z0-9_.]*))!)?(\$?[A-Z]{1,3}\$?\d+)(?::(\$?[A-Z]{1,3}\$?\d+))?(?![A-Za-z0-9_(])/g)) {
    if (m[1] || m[2]) continue; // outra aba
    if (m.index > 0 && /[A-Za-z0-9_.!]/.test(sem[m.index - 1])) continue;
    const a = parse(desloc(m[3], dr, dc)), b = m[4] ? parse(desloc(m[4], dr, dc)) : a;
    if ((Math.abs(b.c - a.c) + 1) * (Math.abs(b.r - a.r) + 1) > 400) continue;
    for (let cc = Math.min(a.c, b.c); cc <= Math.max(a.c, b.c); cc++) for (let rr = Math.min(a.r, b.r); rr <= Math.max(a.r, b.r); rr++) lidas.add(`${numCol(cc)}${rr}`);
  }
  for (const m of texto.matchAll(/(\$?[A-Z]{1,3}\$?\d+)\s*=\s*"([^"]+)"/g)) { const k = desloc(m[1], dr, dc).replace(/\$/g, ""); (comparacoes.get(k) ?? comparacoes.set(k, new Set()).get(k)).add(m[2]); }
  for (const m of texto.matchAll(/DATEDIF\(\s*\$?([A-Z]+\$?\d+)\s*,\s*\$?([A-Z]+\$?\d+)/g)) { const k = desloc(m[2], dr, dc).replace(/\$/g, ""); datedifSegundos.set(k, (datedifSegundos.get(k) ?? 0) + 1); }
}
const limpar = (e) => e.replace(/\$/g, "");
const lidasLimpas = new Set([...lidas].map(limpar));

const textoDe = (c) => (c && !c.f && c.v !== "" && c.v !== null && (c.t === "s" || c.t === "str") ? String(c.v).replace(/\s+/g, " ").trim() : null);
function rotulo(end) {
  const p = parse(end);
  for (let c = p.c - 1; c >= Math.max(1, p.c - 6); c--) { const t = textoDe(cel.get(`${numCol(c)}${p.r}`)); if (t) return t.slice(0, 50); }
  for (let r = p.r - 1; r >= Math.max(1, p.r - 6); r--) { const t = textoDe(cel.get(`${numCol(p.c)}${r}`)); if (t) return t.slice(0, 50); }
  return end;
}

const rotuloGrade = (end) => { const p = parse(end); let l = null, h = null; for (let c = p.c - 1; c >= 1 && !l; c--) l = textoDe(cel.get(`${numCol(c)}${p.r}`)); for (let r = p.r - 1; r >= Math.max(1, p.r - 12) && !h; r--) h = textoDe(cel.get(`${numCol(p.c)}${r}`)); return [l, h].filter(Boolean).map((x) => x.slice(0, 40)).join(" — ") || end; };
const dataAplicacao = [...datedifSegundos.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
const entradas = [], opcoes = [], saidas = [];
for (const end of [...lidasLimpas].sort((a, b) => parse(a).r - parse(b).r || parse(a).c - parse(b).c)) {
  const c = cel.get(end);
  if (c?.f) continue;
  if (end === dataAplicacao) continue;
  const comp = comparacoes.get(end);
  if (comp && comp.size) { opcoes.push({ chave: `opcao_${end}`, celula: end, rotulo: rotulo(end), valores: [...comp], padrao: 0 }); continue; }
  const v = c && c.v !== "" && c.v !== null ? Number(c.v) : null;
  if (c && c.v !== "" && c.v !== null && Number.isNaN(v)) continue; // texto fixo
  if (c && v !== null) continue; // constante numérica (parâmetro da planilha)
  const col = numCol(parse(end).c);
  const grupo = meta.grupoPorColuna?.[col];
  entradas.push({ chave: `in_${end}`, celula: end, rotulo: (grupo ? grupo + " — " : "") + rotuloGrade(end), ...(grupo ? { grupo } : {}), min: 0 });
}
// opções que o cadastro do paciente não tem (ex.: tipo de escola = CADASTRO!D7): células-espelho do cadastro comparadas com textos nas fórmulas
for (const c of aba.celulas) {
  if (!c.f || !/^=\s*(IF\([^,]*,\s*"",\s*)?CADASTRO!\$?D\$?7\b/.test(String(c.f).replace(/\s+/g, " "))) continue;
  const comp = comparacoes.get(c.c);
  if (comp && comp.size && !opcoes.some((o) => o.celula === c.c)) opcoes.push({ chave: `opcao_${c.c}`, celula: c.c, rotulo: rotulo(c.c).replace(/:$/, ""), valores: [...comp], padrao: 0 });
}
// saídas: células com fórmula na região de resultados (a partir da primeira linha de entrada), exceto cabeçalho do paciente (CADASTRO)
const primeiraLinha = Math.min(...entradas.map((e) => parse(e.celula).r), 999);
const cabecalhoColuna = (end) => { const p = parse(end); for (let r = p.r - 1; r >= Math.max(1, p.r - 12); r--) { const t = textoDe(cel.get(`${numCol(p.c)}${r}`)); if (t) return t.slice(0, 40); } return null; };
const rotuloLinha = (end) => { const p = parse(end); for (let c = p.c - 1; c >= 1; c--) { const t = textoDe(cel.get(`${numCol(c)}${p.r}`)); if (t) return t.slice(0, 40); } return null; };
const grade = [];
for (const c of aba.celulas) {
  if (!c.f || String(c.f).includes("CADASTRO!")) continue;
  const p = parse(c.c);
  if (p.r < primeiraLinha) continue;
  const linha = rotuloLinha(c.c), colh = cabecalhoColuna(c.c);
  saidas.push({ chave: `out_${c.c}`, celula: c.c, rotulo: [linha, colh].filter(Boolean).join(" — ") || c.c });
  grade.push({ chave: `out_${c.c}`, r: p.r, c: p.c, linha, colh });
}
const colunas = [...new Set(grade.map((g) => g.c))].sort((x, y) => x - y);
const linhasR = [...new Set(grade.map((g) => g.r))].sort((x, y) => x - y);
const tabelas = grade.length ? [{
  titulo: "Resultado",
  colunas: colunas.map((c) => grade.find((g) => g.c === c)?.colh ?? numCol(c)),
  linhas: linhasR.map((r) => ({ rotulo: grade.find((g) => g.r === r)?.linha ?? String(r), valores: colunas.map((c) => grade.find((g) => g.r === r && g.c === c)?.chave ?? null) })),
}] : [];
console.log(JSON.stringify({
  sigla, nome: meta.nome ?? sigla, dominio: meta.dominio ?? "ATENCAO", descricao: meta.descricao ?? "", referencia: meta.referencia ?? "", aba: nomeAba, idade: meta.idade ?? [6, 89], escolaridadePadrao: "Ensino Médio",
  contexto: { dataAplicacao, dataNascimento: "CADASTRO!D4", escolaridade: "CADASTRO!D6", sexo: "CADASTRO!D5", nome: "CADASTRO!D3" },
  entradas, opcoes, saidas, tabelas,
}, null, 1));
