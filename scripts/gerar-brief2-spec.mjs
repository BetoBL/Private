// Spec do BRIEF-2 (aba "BRIEF-2"): parte do rascunho automático e acerta o que ele não entende:
//  - respostas por letra (N/A/F) viram entradas com "letras" (8 informantes × 63 itens, uma linha por item);
//  - o nome/grau de cada informante (H9…N12) vira "porta": o motor o preenche sozinho quando a coluna tem resposta;
//  - tabelas de resultado por escala (informantes em colunas) e das escalas de validade.
// Uso: node scripts/gerar-brief2-spec.mjs <extraido.json> > docs/testes/planilha/specs/BRIEF2.spec.json
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const [, , arq] = process.argv;
const aba = JSON.parse(readFileSync(arq, "utf8"))["BRIEF-2"];
const cel = new Map(aba.celulas.map((c) => [c.c, c]));
const txt = (end) => { const c = cel.get(end); return c && !c.f && c.v !== "" && c.v !== null ? String(c.v).replace(/\s+/g, " ").trim() : ""; };

const base = JSON.parse(execFileSync(process.execPath, ["scripts/rascunho-spec-planilha.mjs", arq, "BRIEF-2", "BRIEF2", JSON.stringify({
  nome: "BRIEF-2 — Inventário de Avaliação Comportamental das Funções Executivas",
  dominio: "FUNCOES_EXECUTIVAS",
  idade: [5, 18],
  descricao: "BRIEF-2: escalas clínicas, índices (regulação comportamental, emocional, cognitiva) e Índice Executivo Global por informante (até 3 cuidadores, 4 professores e auto-relato a partir dos 11 anos), em T-score, percentil, intervalo de confiança e classificação. Cálculo executado a partir das fórmulas da planilha da psicóloga.",
  referencia: "GIOIA, G. A.; ISQUITH, P. K.; GUY, S. C.; KENWORTHY, L. BRIEF-2 — Behavior Rating Inventory of Executive Function, 2nd ed. PAR, 2015 (normas conforme planilha da psicóloga).",
})], { encoding: "utf8", maxBuffer: 100 * 1024 * 1024 }));

const INFORMANTES = { C: "Cuidador 1", D: "Cuidador 2", E: "Cuidador 3", F: "Professor 1", G: "Professor 2", H: "Professor 3", I: "Professor 4", J: "Auto-relato" };
const PORTAS = { C: "H9", D: "H10", E: "H11", F: "N9", G: "N10", H: "N11", I: "N12" }; // J (auto-relato) é automático pela idade (H12)

// texto de cada item pelo número ("01. É inquieto" nas colunas O/U/AB)
const itens = new Map();
for (const col of ["O", "U", "AB"]) for (let r = 1; r < 300; r++) {
  const m = /^(\d{2})\.\s*(.+)$/.exec(txt(`${col}${r}`));
  if (m && !itens.has(Number(m[1]))) itens.set(Number(m[1]), m[2]);
}

// item n está na linha 20+n (B21 = 1 … B83 = 63) e cada coluna C..J é um informante
const entradas = [];
for (let r = 21; r <= 83; r++) {
  const n = Number(txt("B" + r));
  if (!n) continue;
  for (const col of Object.keys(INFORMANTES)) entradas.push({ chave: "in_" + col + r, celula: col + r, rotulo: String(n).padStart(2, "0") + ". " + (itens.get(n) ?? "(item só da escala de validade)"), letras: ["N", "A", "F"], min: 1, max: 3 });
}

// tabelas de resultado
const saidasPorCel = new Map(base.saidas.map((s) => [s.celula, s]));
const ch = (c) => (saidasPorCel.has(c) ? saidasPorCel.get(c).chave : null);
const tabelas = [];
const blocos = [];
for (let r = 1; r < 260; r++) if (txt(`Q${r}`).startsWith("Total Pontos Brutos")) blocos.push(r);
const nomeEscala = (r) => { for (let x = r; x > 0; x--) { const m = /^\d\.\s*(.+)$/.exec(txt(`O${x}`)); if (m) return m[1]; } return "Escala"; };
const COLS_ESCALA = [["R", "Cuidador 1"], ["S", "Cuidador 2"], ["T", "Cuidador 3"], ["X", "Professor 1"], ["Y", "Professor 2"], ["Z", "Professor 3"], ["AA", "Professor 4"], ["AE", "Auto-relato"]];
const ROTULOS = ["Pontos brutos", "Percentil", "T-score", "Intervalo de confiança", "Classificação", "Observação"];
for (const r of blocos) {
  tabelas.push({ titulo: nomeEscala(r), colunas: COLS_ESCALA.map(([, n]) => n), linhas: ROTULOS.map((rot, i) => ({ rotulo: rot, valores: COLS_ESCALA.map(([c]) => ch(`${c}${r + i}`)) })) });
}
// índices: "Pontos Brutos:" em Q (cuidadores), W (professores), AD (auto-relato)
for (let r = 195; r < 260; r++) {
  if (txt(`Q${r}`) !== "Pontos Brutos:") continue;
  tabelas.push({ titulo: txt(`O${r}`) || "Índice", colunas: COLS_ESCALA.map(([, n]) => n), linhas: ROTULOS.map((rot, i) => ({ rotulo: rot, valores: COLS_ESCALA.map(([c]) => ch(`${c}${r + i}`)) })) });
}
// escalas de validade (B/F/K): linha "TOTAL:" seguida de Percentil e Classificação
const COLS_VAL = [["C", "Cuidador 1"], ["D", "Cuidador 2"], ["E", "Cuidador 3"], ["G", "Professor 1"], ["H", "Professor 2"], ["I", "Professor 3"], ["J", "Professor 4"], ["L", "Auto-relato"]];
for (let r = 80; r < 140; r++) {
  if (txt(`B${r}`) !== "TOTAL:") continue;
  let nome = "Escala de validade";
  for (let x = r; x > 80; x--) { const t = txt(`B${x}`); if (/^Escala de/.test(t)) { nome = t.replace(/\s*\(.*$/, ""); break; } }
  tabelas.push({ titulo: nome, colunas: COLS_VAL.map(([, n]) => n), linhas: [["Total", 0], ["Percentil", 1], ["Classificação", 2]].map(([rot, i]) => ({ rotulo: rot, valores: COLS_VAL.map(([c]) => ch(`${c}${r + i}`)) })) });
}

const usadas = new Set(tabelas.flatMap((t) => t.linhas.flatMap((l) => l.valores.filter(Boolean))));
const saidas = base.saidas.filter((s) => usadas.has(s.chave));
console.log(JSON.stringify({ ...base, escolaridadePadrao: base.escolaridadePadrao, portas: PORTAS, cabecalhos: INFORMANTES, entradas, opcoes: [], saidas, tabelas }, null, 1));
