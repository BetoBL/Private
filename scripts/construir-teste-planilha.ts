// Constrói a definição do "motor de planilha" de um teste a partir da planilha da psicóloga e de uma SPEC escrita à mão.
//
//   npx --prefix apps/api tsx scripts/construir-teste-planilha.ts <planilha.xlsm> <spec.json> [--saida <arquivo.json>] [--smoke N]
//
// A spec (docs/testes/planilha/specs/<SIGLA>.spec.json) diz: aba do teste, quais células são entradas/opções/saídas, de onde vêm
// os dados do paciente, o layout das tabelas de resultado e correções de fórmula (para defeitos da planilha). O script extrai só o
// necessário: as fórmulas da aba, as constantes que elas referenciam e as células de norma que elas leem (nada de dado de paciente).
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { calcularPlanilha, type DefinicaoPlanilha } from "../apps/api/src/lib/planilha/motor";

const [, , xlsm, specPath, ...resto] = process.argv;
if (!xlsm || !specPath) { console.error("Uso: tsx scripts/construir-teste-planilha.ts <planilha.xlsm> <spec.json> [--saida arq] [--smoke N]"); process.exit(1); }
const opt = (n: string) => { const i = resto.indexOf(n); return i >= 0 ? resto[i + 1] : undefined; };
const spec = JSON.parse(readFileSync(specPath, "utf8"));
const saida = opt("--saida") ?? join("docs", "testes", "planilha", `${spec.sigla}.json`);

type Celula = { c: string; v: unknown; f: string | null; s: string | null; t: string | null; u?: boolean };
const colNum = (l: string) => [...l].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
const numCol = (n: number) => { let s = ""; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
const parseEnd = (a: string) => { const m = /^(\$?)([A-Z]{1,3})(\$?)(\d+)$/.exec(a)!; return { cAbs: !!m[1], c: colNum(m[2]), rAbs: !!m[3], r: Number(m[4]) }; };

const dirTmp = mkdtempSync(join(tmpdir(), "planilha-"));
process.on("exit", () => { try { rmSync(dirTmp, { recursive: true, force: true }); } catch { /* ignora */ } });
const extrair = (abas: string[]): Record<string, { celulas: Celula[] }> => {
  const arq = join(dirTmp, `x${Math.random().toString(36).slice(2)}.json`);
  execFileSync("node", ["scripts/extrair-abas-xlsm.mjs", xlsm, arq, ...abas], { stdio: "pipe" });
  return JSON.parse(readFileSync(arq, "utf8"));
};

// 1) aba do teste + CADASTRO
const base = extrair([spec.aba, "CADASTRO"]);
const aba: Celula[] = base[spec.aba].celulas;
const porEnd = new Map(aba.map((c) => [c.c, c]));
const mestres = new Map(aba.filter((c) => c.s != null && c.f && !String(c.f).startsWith("(f")).map((c) => [String(c.s), c]));

// correções de fórmula da spec
for (const corr of spec.correcoes ?? []) {
  const c = porEnd.get(corr.celula);
  if (!c) throw new Error(`correção: célula ${corr.celula} não existe`);
  c.f = corr.formula; c.s = null;
}

// 2) referências de cada fórmula (com deslocamento nas compartilhadas)
type Ref = { aba: string; a: string; b: string };
const RE = /(?:(?:'((?:[^']|'')+)'|([A-Za-z_][A-Za-z0-9_.]*))!)?(\$?[A-Z]{1,3}\$?\d+)(?::(\$?[A-Z]{1,3}\$?\d+))?(?![A-Za-z0-9_(])/g;
const deslocar = (a: string, dr: number, dc: number) => { const p = parseEnd(a); return `${numCol(p.cAbs ? p.c : p.c + dc)}${p.rAbs ? p.r : p.r + dr}`; };
function refsDe(c: Celula): Ref[] {
  let texto = String(c.f ?? ""), dr = 0, dc = 0;
  if (c.s != null && texto.startsWith("(f")) {
    const m = mestres.get(String(c.s));
    if (!m) return [];
    texto = m.f!;
    const pm = parseEnd(m.c), pc = parseEnd(c.c);
    dr = pc.r - pm.r; dc = pc.c - pm.c;
  }
  texto = texto.replace(/"(?:[^"]|"")*"/g, '""'); // ignora textos
  const out: Ref[] = [];
  for (const m of texto.matchAll(RE)) {
    if (m.index! > 0 && /[A-Za-z0-9_.]/.test(texto[m.index! - 1]) && !m[1] && !m[2]) continue;
    const nome = (m[1] ?? m[2] ?? spec.aba).replace(/''/g, "'");
    out.push({ aba: nome, a: deslocar(m[3], dr, dc), b: m[4] ? deslocar(m[4], dr, dc) : deslocar(m[3], dr, dc) });
  }
  return out;
}
const todasRefs = aba.filter((c) => c.f).flatMap(refsDe);
// ID-Usuário traz dados do profissional (nome, CRP): não vai para a definição; as fórmulas que a leem (cabeçalho) ficam vazias.
const EXCLUIDAS = (n: string) => n === spec.aba || n === "CADASTRO" || /^ID-Usu/i.test(n);
const abasExternas = [...new Set(todasRefs.map((r) => r.aba).filter((n) => !EXCLUIDAS(n)))];
const ext = abasExternas.length ? extrair(abasExternas) : {};

// 3) células a incluir
const ehEntrada = new Set<string>([...spec.entradas.map((e: { celula: string }) => e.celula), ...(spec.opcoes ?? []).map((o: { celula: string }) => o.celula)]);
for (const c of aba) if (c.u) ehEntrada.add(c.c); // células de digitação: sem valor na definição (podem trazer um protocolo de exemplo)
for (const k of Object.values(spec.contexto ?? {})) { const s = String(k); if (!s.includes("!")) ehEntrada.add(s); }
const incluidas = new Map<string, Celula>();
for (const c of aba) if (c.f) incluidas.set(c.c, { ...c, v: "" }); // o valor em cache pode ter dado de paciente (ex.: nome): zera
const planilhas: DefinicaoPlanilha["planilhas"] = { [spec.aba]: { celulas: [] }, CADASTRO: { celulas: base.CADASTRO.celulas.filter((c) => c.f).map((c) => ({ ...c, v: "" })) } };
// abas de norma: compacta por coluna (números como número, textos como texto)
const compactar = (celulas: Celula[]) => {
  const porCol = new Map<string, Map<number, string | number>>();
  for (const c of celulas) {
    const p = parseEnd(c.c); const col = numCol(p.c);
    const m = porCol.get(col) ?? new Map<number, string | number>();
    const ehTexto = c.t === "s" || c.t === "str" || Number.isNaN(Number(c.v));
    m.set(p.r, ehTexto ? String(c.v) : Number(c.v));
    porCol.set(col, m);
  }
  const colunas: Record<string, { r0: number; v: Array<string | number | null> }> = {};
  for (const [col, m] of porCol) { const rs = [...m.keys()]; const r0 = Math.min(...rs), r1 = Math.max(...rs); colunas[col] = { r0, v: Array.from({ length: r1 - r0 + 1 }, (_, i) => m.get(r0 + i) ?? null) }; }
  return colunas;
};
// índice por endereço (as abas grandes, como as do Vineland, tornavam a varredura quadrática lenta demais)
const indices = new WeakMap<Celula[], Map<string, Celula>>();
const noIntervalo = (celulas: Celula[], r: Ref) => {
  let idx = indices.get(celulas);
  if (!idx) { idx = new Map(celulas.map((c) => [c.c, c])); indices.set(celulas, idx); }
  const a = parseEnd(r.a), b = parseEnd(r.b);
  const out: Celula[] = [];
  for (let cc = Math.min(a.c, b.c); cc <= Math.max(a.c, b.c); cc++) for (let rr = Math.min(a.r, b.r); rr <= Math.max(a.r, b.r); rr++) { const x = idx.get(`${numCol(cc)}${rr}`); if (x) out.push(x); }
  return out;
};
const mantidasExt = new Map<string, Map<string, Celula>>();
for (const r of todasRefs) {
  if (r.aba === spec.aba) {
    for (const c of noIntervalo(aba, r)) if (!c.f && !ehEntrada.has(c.c) && c.v !== "" && c.v !== null) incluidas.set(c.c, c);
  } else if (!EXCLUIDAS(r.aba)) {
    const fonte = ext[r.aba]?.celulas;
    if (!fonte) throw new Error(`aba referenciada não extraída: ${r.aba}`);
    const m = mantidasExt.get(r.aba) ?? new Map<string, Celula>();
    for (const c of noIntervalo(fonte, r)) if (c.v !== "" && c.v !== null) m.set(c.c, { c: c.c, v: c.v, f: null, s: null, t: c.t });
    mantidasExt.set(r.aba, m);
  }
}
planilhas[spec.aba].celulas = [...incluidas.values()];
for (const [nome, m] of mantidasExt) planilhas[nome] = { colunas: compactar([...m.values()]) };

// 5) gráficos: os do Excel (scripts/extrair-graficos-xlsm.mjs) com as referências de célula trocadas por chaves de saída.
// Célula com fórmula vira saída (acrescentada se ainda não for); célula fixa (rótulo) vira texto literal.
type Ref1 = string | { k: string } | null;
interface GraficoDef { titulo: string; eixo: { min?: number; max?: number }; ancora: { linha: number; coluna: number }; series: Array<{ tipo: string; direcao?: string; nome: Ref1; cats: Ref1[]; vals: Array<string | null> }> }
const saidasFinais: Array<{ chave: string; celula: string; rotulo: string; casas?: number }> = [...spec.saidas];
let graficos: GraficoDef[] = [];
const chaveDe = (end: string) => {
  let s = saidasFinais.find((x) => x.celula === end);
  if (!s) { s = { chave: "out_" + end, celula: end, rotulo: end }; saidasFinais.push(s); }
  return s.chave;
};
if (spec.graficos && !spec.graficosIgnorarExcel) {
  const arqG = join(dirTmp, "graficos.json");
  execFileSync("node", ["scripts/extrair-graficos-xlsm.mjs", xlsm, arqG, spec.aba], { stdio: "pipe" });
  const brutos = JSON.parse(readFileSync(arqG, "utf8"))[spec.aba] as Array<{ titulo: string; eixo: { min?: number; max?: number }; ancora: { linha: number; coluna: number }; series: Array<{ tipo: string; direcao?: string; nome: { ref?: string; texto?: string } | null; cat: string | null; val: string }> }>;
  // "'Aba'!$A$1:$B$3" → células da própria aba (linha a linha); null se a referência é de outra aba ou não é intervalo simples
  const celulasDe = (ref: string): string[][] | null => {
    const m = /^(?:'((?:[^']|'')+)'|([^!']+))!\$?([A-Z]{1,3})\$?(\d+)(?::\$?([A-Z]{1,3})\$?(\d+))?$/.exec(ref.trim());
    if (!m) return null;
    if ((m[1]?.replace(/''/g, "'") ?? m[2]) !== spec.aba) return null;
    const a = parseEnd(m[3] + m[4]), b = parseEnd((m[5] ?? m[3]) + (m[6] ?? m[4]));
    const linhas: string[][] = [];
    for (let r = Math.min(a.r, b.r); r <= Math.max(a.r, b.r); r++) { const l: string[] = []; for (let c = Math.min(a.c, b.c); c <= Math.max(a.c, b.c); c++) l.push(numCol(c) + r); linhas.push(l); }
    return linhas;
  };
  const textoDe = (end: string): Ref1 => {
    const c = porEnd.get(end);
    if (c?.f) return { k: chaveDe(end) };
    return c && c.v !== "" && c.v !== null ? String(c.v).replace(/\s+/g, " ").trim() : null;
  };
  for (const g of brutos) {
    const series: GraficoDef["series"] = [];
    let ok = true;
    for (const s of g.series) {
      const vals = celulasDe(s.val)?.flat();
      const cats = s.cat ? celulasDe(s.cat) : null;
      if (!vals || (s.cat && !cats)) { ok = false; break; }
      // categorias em mais de uma coluna (ex.: rótulo em duas células mescladas): usa a primeira célula preenchida da linha
      const rotulos: Ref1[] = (cats ?? vals.map((_, i) => [String(i + 1)])).map((linha) => { for (const e of [...linha].reverse()) { const t = textoDe(e); if (t !== null) return t; } return null; }); // 2 colunas (ex.: "Subescalas" | "Perc.S"): vale a da direita
      const nome: Ref1 = s.nome?.texto ?? (s.nome?.ref ? (celulasDe(s.nome.ref) ? textoDe(celulasDe(s.nome.ref)![0][0]) : null) : null);
      series.push({ tipo: s.tipo, ...(s.direcao ? { direcao: s.direcao } : {}), nome, cats: rotulos, vals: vals.map((e) => { const c = porEnd.get(e); return c?.f ? chaveDe(e) : null; }) });
    }
    if (!ok) { console.log("  (gráfico ignorado, referência fora da aba: " + (g.titulo || "sem título") + ")"); continue; }
    graficos.push({ titulo: g.titulo, eixo: g.eixo, ancora: g.ancora, series });
  }
  console.log("  " + graficos.length + " gráfico(s) do Excel");
}
// gráficos PRÓPRIOS (spec.graficosProprios): para testes cujos gráficos do Excel não servem. Cada série lista as células calculadas.
//   { titulo, tipo: "line"|"bar", eixo: {min,max}, categorias: ["texto", ...], series: [{ nome, celulas: ["F158", ...] }] }
for (const g of spec.graficosProprios ?? []) {
  graficos.push({
    titulo: g.titulo, eixo: g.eixo ?? {}, ancora: { linha: 9999, coluna: 1 },
    series: g.series.map((s: { nome: string; celulas: string[] }) => ({ tipo: g.tipo ?? "line", nome: s.nome, cats: g.categorias, vals: s.celulas.map((e) => (porEnd.get(e)?.f ? chaveDe(e) : null)) })),
  });
}

// 6) tabelas por BLOCOS (iguais ao desenho da planilha): cada bloco = linhas + colunas da aba, linha de cabeçalho e coluna de rótulo.
//    spec.blocos: [{ titulo, linhas: [r1, r2] | [r, r, ...], colunas: ["F","G"], cabecalho?: <linha>, rotulo?: "B", cabecalhos?: ["a","b"] }]
let tabelasFinais = spec.tabelas ?? [];
if (spec.blocos) {
  const textoFixo = (end: string) => { const c = porEnd.get(end); return c && !c.f && c.v !== "" && c.v !== null && (c.t === "s" || c.t === "str" || Number.isNaN(Number(c.v))) ? String(c.v).replace(/\s+/g, " ").trim() : ""; };
  tabelasFinais = spec.blocos.map((b: { titulo: string; linhas: number[]; colunas: string[]; cabecalho?: number; rotulo?: string; cabecalhos?: string[]; rotulos?: string[] }) => {
    const linhas = b.linhas.length === 2 && b.linhas[1] - b.linhas[0] > 1 ? Array.from({ length: b.linhas[1] - b.linhas[0] + 1 }, (_, i) => b.linhas[0] + i) : b.linhas;
    return {
      titulo: b.titulo,
      colunas: b.cabecalhos ?? b.colunas.map((c) => (b.cabecalho ? textoFixo(c + b.cabecalho) : "")),
      linhas: linhas.map((r, i) => {
        const rotEnd = b.rotulo ? b.rotulo + r : "";
        const rotCel = rotEnd ? porEnd.get(rotEnd) : undefined;
        const rotulo = b.rotulos?.[i] ?? (rotCel?.f ? "=" + chaveDe(rotEnd) : rotEnd ? textoFixo(rotEnd) : "");
        return { rotulo, valores: b.colunas.map((c) => (porEnd.get(c + r)?.f ? chaveDe(c + r) : null)) };
      }),
    };
  });
}

const def: DefinicaoPlanilha = {
  tipo: "planilha", versao: new Date().toISOString().slice(0, 10), sigla: spec.sigla, aba: spec.aba, planilhas,
  contexto: spec.contexto ?? {}, ...(spec.portas ? { portas: spec.portas } : {}), ...(spec.datas ? { datas: spec.datas } : {}), ...(spec.cabecalhos ? { cabecalhos: spec.cabecalhos } : {}), entradas: spec.entradas, opcoes: spec.opcoes ?? [], saidas: saidasFinais, tabelas: tabelasFinais, ...(graficos.length ? { graficos } : {}),
};
mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, JSON.stringify({ _fonte: `Planilha da psicóloga (aba ${spec.aba}) — extraído por scripts/construir-teste-planilha.ts. Referência de RESULTADO.`, nome: spec.nome, dominio: spec.dominio, descricao: spec.descricao, referencia: spec.referencia, idade: spec.idade, ...def }));
const tam = (JSON.stringify(def).length / 1024).toFixed(0);
console.log(`${spec.sigla}: ${planilhas[spec.aba].celulas!.length} células na aba, ${Object.entries(planilhas).filter(([n]) => n !== spec.aba && n !== "CADASTRO").map(([n, v]) => `${n}(${Object.keys(v.colunas ?? {}).length} colunas)`).join(" ") || "sem abas de norma"}; ${tam} KB → ${saida}`);

// 4) teste de fumaça: entradas aleatórias, sem exceções do avaliador e com saídas preenchidas
const n = Number(opt("--smoke") ?? 0);
if (n > 0) {
  let s = 12345;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  let excecoes = 0, preenchidos = 0, total = 0;
  const exemplos = new Set<string>();
  for (let i = 0; i < n; i++) {
    const escores: Record<string, number> = {};
    for (const e of def.entradas) if (rnd() < 0.85) escores[e.chave] = e.letras ? 1 + Math.floor(rnd() * e.letras.length) : Math.floor((e.min ?? 0) + rnd() * ((e.max ?? 60) - (e.min ?? 0) + 1));
    for (const o of def.opcoes) if (o.padrao !== undefined || rnd() < 0.7) escores[o.chave] = Math.floor(rnd() * o.valores.length);
    const anos = spec.idade ? spec.idade[0] + Math.floor(rnd() * (spec.idade[1] - spec.idade[0] + 1)) : 30;
    const ref = new Date(Date.UTC(2026, 6, 28));
    const nasc = new Date(Date.UTC(2026 - anos, Math.floor(rnd() * 12), 1 + Math.floor(rnd() * 28)));
    const r = calcularPlanilha(def, escores, { dataNascimento: nasc, dataReferencia: ref, escolaridade: spec.escolaridadePadrao ?? "Ensino Médio", sexo: rnd() < 0.5 ? "MASCULINO" : "FEMININO", nome: "Teste" });
    for (const e of r.erros ?? []) { excecoes++; exemplos.add(e.slice(0, 120)); }
    for (const v of Object.values(r.saidas)) { total++; if (v !== null) preenchidos++; }
  }
  console.log(`fumaça (${n} casos): ${excecoes} exceção(ões); ${preenchidos}/${total} saídas preenchidas${exemplos.size ? "\n  " + [...exemplos].slice(0, 5).join("\n  ") : ""}`);
}
