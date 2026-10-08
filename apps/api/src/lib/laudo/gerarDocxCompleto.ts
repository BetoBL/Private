import {
  AlignmentType, BorderStyle, Document, Footer, Header, HorizontalPositionAlign, HorizontalPositionRelativeFrom, ImageRun, LevelFormat, Packer, PageNumber,
  Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, TextWrappingType, VerticalAlign, VerticalPositionAlign, VerticalPositionRelativeFrom, WidthType,
} from "docx";
import { obterTabelaClassificacaoPercentil, type SistemaClassificacaoPercentil } from "../classificacaoPercentil";
import { classificarPercentil } from "./classificacao";
import { siglasDe } from "./dominios";
import { pngDoGrafico, PALETA, type GraficoImg } from "./graficoSvg";
import type { AplicacaoLaudo } from "./montar";
import { estruturaDoSistema, MODELO_PADRAO_ID, resolverMarcadores, type EstruturaModelo } from "./modelos";

// Modelo completo de laudo (MentEssence): 10 seções, papel timbrado do cadastro da clínica, tabelas e gráficos como imagem.
export interface DadosLaudoCompleto {
  clinica: { nome: string; endereco?: string | null; bairro?: string | null; cidade?: string | null; estado?: string | null; cep?: string | null; telefone?: string | null; whatsapp?: string | null; instagram?: string | null; slogan?: string | null; logoUrl?: string | null; marcaDaguaUrl?: string | null; corPrimaria?: string | null; corSecundaria?: string | null };
  profissional: { nome: string; crp: string; email?: string | null; formacao?: string | null; especialidades: string[]; assinaturaUrl?: string | null; tituloLaudo?: string | null };
  paciente: { nome: string; cpf?: string | null; dataNascimento: Date; idadeTexto: string };
  laudo: { descricaoDemanda: string; anamnese: string; observacaoClinica: string; procedimento: string; analise: string; conclusao: string; referencias: string; iaUtilizada: boolean; interpretacoes?: Record<string, string>; hipoteseDiagnostica?: string; secoesExtras?: Record<string, string> };
  modelo?: EstruturaModelo; // estrutura do modelo escolhido; sem ele vale a do laudo neuropsicológico padrão
  aplicacoes: AplicacaoLaudo[];
  sistema: SistemaClassificacaoPercentil;
  data: Date;
}

const FONTE = "Calibri";
const LARG_PAG = 9638; // twips úteis (A4 com margens de 2 cm)
const PECHE = "FCD5B4"; // pêssego dos cabeçalhos de tabela
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const VERMELHO = "C00000";
const REGEX_ABAIXO = /\d+(?:,\d+)?%\s+(Média inferior|Limítrofe|Deficitário|Abaixo da média|Excepcionalmente baixo)/i;

// ---------- imagens (data URL) ----------
function dataUrl(url?: string | null): { dados: Buffer; tipo: "png" | "jpg"; w: number; h: number } | null {
  const m = /^data:image\/(png|jpe?g);base64,(.+)$/.exec(url ?? "");
  if (!m) return null;
  const dados = Buffer.from(m[2], "base64");
  if (m[1] === "png") return dados.length > 24 ? { dados, tipo: "png", w: dados.readUInt32BE(16), h: dados.readUInt32BE(20) } : null;
  for (let i = 2; i + 9 < dados.length; ) { // JPEG: procura o marcador SOF
    if (dados[i] !== 0xff) { i++; continue; }
    const marc = dados[i + 1];
    if (marc >= 0xc0 && marc <= 0xcf && marc !== 0xc4 && marc !== 0xc8 && marc !== 0xcc) return { dados, tipo: "jpg", h: dados.readUInt16BE(i + 5), w: dados.readUInt16BE(i + 7) };
    i += 2 + dados.readUInt16BE(i + 2);
  }
  return null;
}
const cmPx = (cm: number) => Math.round((cm / 2.54) * 96);

function imagemInline(url: string | null | undefined, alturaCm: number, larguraMaxCm = 16): ImageRun | null {
  const im = dataUrl(url);
  if (!im || !im.w || !im.h) return null;
  let h = cmPx(alturaCm), w = Math.round((h * im.w) / im.h);
  if (w > cmPx(larguraMaxCm)) { w = cmPx(larguraMaxCm); h = Math.round((w * im.h) / im.w); }
  return new ImageRun({ type: im.tipo, data: im.dados, transformation: { width: w, height: h } });
}

// ---------- texto ----------
function runs(texto: string, base: { size?: number; italics?: boolean; color?: string } = {}): TextRun[] {
  return texto.split("**").map((parte, i) => {
    const negrito = i % 2 === 1;
    const vermelho = negrito && REGEX_ABAIXO.test(parte);
    return new TextRun({ text: parte, bold: negrito, font: FONTE, size: base.size ?? 22, italics: base.italics, color: vermelho ? VERMELHO : base.color });
  }).filter((r) => (r as unknown as { root: unknown[] }).root !== undefined);
}

const corpo = (texto: string) => new Paragraph({ children: runs(texto), alignment: AlignmentType.JUSTIFIED, spacing: { line: 360, after: 80 }, indent: { firstLine: 567 } });
const linhaSimples = (texto: string, depois = 60) => new Paragraph({ children: runs(texto), alignment: AlignmentType.JUSTIFIED, spacing: { line: 360, after: depois } });
const titulo = (texto: string) => new Paragraph({ children: [new TextRun({ text: texto, bold: true, font: FONTE, size: 22 })], spacing: { before: 300, after: 120, line: 300 }, keepNext: true });
const subtitulo = (texto: string) => new Paragraph({ children: [new TextRun({ text: texto, bold: true, font: FONTE, size: 22 })], spacing: { before: 200, after: 100, line: 300 }, keepNext: true, indent: { left: 170 } });
const legenda = (texto: string) => new Paragraph({ children: [new TextRun({ text: texto, font: FONTE, size: 17 })], spacing: { before: 100, after: 60 }, indent: { left: 700 }, keepNext: true });
const bullet = (texto: string) => new Paragraph({ children: runs(texto), numbering: { reference: "setas", level: 0 }, alignment: AlignmentType.JUSTIFIED, spacing: { line: 336, after: 40 } });

// ---------- tabelas ----------
const borda = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
const bordas = { top: borda, bottom: borda, left: borda, right: borda };
function celula(texto: string, o: { largura: number; fundo?: string; negrito?: boolean; centro?: boolean; cor?: string; destaque?: boolean; tam?: number }): TableCell {
  return new TableCell({
    width: { size: o.largura, type: WidthType.DXA }, borders: bordas, verticalAlign: VerticalAlign.CENTER,
    shading: o.fundo ? { type: ShadingType.CLEAR, color: "auto", fill: o.fundo } : undefined,
    margins: { top: 30, bottom: 30, left: 80, right: 80 },
    children: [new Paragraph({ alignment: o.centro ? AlignmentType.CENTER : AlignmentType.LEFT, children: [new TextRun({ text: texto, font: FONTE, size: o.tam ?? 20, bold: o.negrito, color: o.cor, highlight: o.destaque ? "yellow" : undefined })] })],
  });
}
function tabela(cabecalho: string[] | null, linhas: string[][], larguras: number[], o: { tituloMesclado?: string; destacarUltima?: boolean; centroDe?: number; vermelhoSe?: (l: string[]) => boolean } = {}): Table {
  const soma = larguras.reduce((a, b) => a + b, 0);
  const rows: TableRow[] = [];
  if (o.tituloMesclado) rows.push(new TableRow({ children: [new TableCell({ columnSpan: larguras.length, width: { size: soma, type: WidthType.DXA }, borders: bordas, shading: { type: ShadingType.CLEAR, color: "auto", fill: PECHE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: o.tituloMesclado, bold: true, font: FONTE, size: 20 })] })] })] }));
  if (cabecalho) rows.push(new TableRow({ tableHeader: true, children: cabecalho.map((c, i) => celula(c, { largura: larguras[i], fundo: PECHE, negrito: true, centro: true })) }));
  linhas.forEach((l, li) => {
    const ultima = o.destacarUltima && li === linhas.length - 1;
    const vermelho = o.vermelhoSe?.(l);
    rows.push(new TableRow({ cantSplit: true, children: l.map((c, i) => celula(c, { largura: larguras[i], fundo: ultima ? PECHE : undefined, centro: i >= (o.centroDe ?? 1), destaque: ultima && i > 0, cor: vermelho && i > 0 ? VERMELHO : undefined })) }));
  });
  return new Table({ width: { size: soma, type: WidthType.DXA }, columnWidths: larguras, alignment: AlignmentType.CENTER, rows });
}
const espaco = () => new Paragraph({ spacing: { after: 120 }, children: [] });

// ---------- resolução dos blocos [[tabela:...]] e [[grafico:...]] ----------
interface Ctx { apps: AplicacaoLaudo[]; sistema: SistemaClassificacaoPercentil; nTabela: number; nGrafico: number; interpretacoes: Record<string, string> }
const maisRecente = (apps: AplicacaoLaudo[], teste: string) => { const s = siglasDe(teste).map(norm); return apps.filter((a) => s.includes(norm(a.sigla))).sort((a, b) => b.dataSessao.getTime() - a.dataSessao.getTime())[0]; };
const numero = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v.replace(",", "."))) ? Number(v.replace(",", ".")) : null);

const INDICES_WAIS: Array<[string, string]> = [["icv", "ICV"], ["iop", "IOP"], ["imo", "IMO"], ["ivp", "IVP"], ["qiv", "QI Verbal"], ["qie", "QI Execução"], ["gai", "GAI"], ["qit", "QI Total"]];
const NOMES_INDICES: Record<string, string> = { icv: "ICV – Índice de Compreensão Verbal", iop: "IOP – Índice de Organização Perceptual", imo: "IMO – Índice de Memória Operacional", ivp: "IVP – Índice de Velocidade de Processamento", qit: "QIT – Quociente Intelectual Total" };

function tabelaWaisIndices(ctx: Ctx): Array<Paragraph | Table> {
  const app = maisRecente(ctx.apps, "WAIS-III");
  if (!app || app.resultado?.modo !== "por_campo") return [];
  const pc = app.resultado.porCampo;
  const linhas = Object.keys(NOMES_INDICES).map((k) => { const f = pc[k]?.faixa; const p = numero(f?.percentil), c = numero(f?.composto); return p === null || c === null ? null : [NOMES_INDICES[k], String(Math.round(c)), String(Math.round(p)), classificarPercentil(p, ctx.sistema)]; }).filter(Boolean) as string[][];
  if (linhas.length === 0) return [];
  return [legenda(`Tabela ${++ctx.nTabela}: Índices Fatoriais do WAIS-III`), tabela(["INSTRUMENTO", "PONTOS", "PERCENT%", "CLASSIFICAÇÃO"], linhas, [4400, 1100, 1300, 2300], { tituloMesclado: "ÍNDICES FATORIAIS WAIS-III", destacarUltima: true }), espaco()];
}

function graficoWaisIndices(ctx: Ctx): Array<Paragraph> {
  const app = maisRecente(ctx.apps, "WAIS-III");
  if (!app || app.resultado?.modo !== "por_campo") return [];
  const pc = app.resultado.porCampo;
  const pares = INDICES_WAIS.map(([k, rot]) => [rot, numero(pc[k]?.faixa?.composto)] as const).filter((x) => x[1] !== null);
  if (pares.length === 0) return [];
  // barra de erro FIXA de ±7,5 pontos, como no gráfico do laudo-modelo (decisão de 08/10/2026; a psicóloga será avisada)
  const g: GraficoImg = { tipo: "colunas", categorias: pares.map((p) => p[0]), series: [{ nome: "Pontos", tipo: "bar", valores: pares.map((p) => p[1]) }], eixo: { min: 40, max: 160 }, barraErro: 7.5, coresPorPonto: ["#7EA1D4", "#D17B79", "#B6CC83", "#9B86B8", "#7BC3D6", "#F9AE6C", "#3E5F8E", "#8E3E3B"], rotulos: "base", legenda: false, altura: 255 };
  return imagemDoGrafico(ctx, g, "Índices fatoriais WAIS-III");
}

function imagemDoGrafico(ctx: Ctx, g: GraficoImg, legendaTexto: string): Paragraph[] {
  const png = pngDoGrafico(g);
  const larg = 16, alt = (larg * (g.altura ?? 320)) / (g.largura ?? 720);
  return [legenda(`Gráfico ${++ctx.nGrafico}: ${legendaTexto}`), new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [new ImageRun({ type: "png", data: png, transformation: { width: cmPx(larg), height: cmPx(alt) } })] })];
}

const rotuloRef = (r: unknown, saidas: Record<string, unknown>): string => (typeof r === "string" ? r : r && typeof r === "object" && "k" in r ? String(saidas[(r as { k: string }).k] ?? "") : "");
const LEGENDA_GRAFICO: Array<[RegExp, string]> = [
  [/quantidade de palavras/i, "Curva de aprendizagem do RAVLT – número de palavras evocadas"],
  [/perfil do respondente/i, "Perfil do BFP – percentil por fator"],
  [/^tempo$/i, "FDT – desempenho em tempo (percentil)"],
  [/bateria psicol[oó]gica/i, "BPA – percentil por tipo de atenção"],
];

function graficoDoLayout(ctx: Ctx, teste: string, trecho: string): Paragraph[] {
  const app = maisRecente(ctx.apps, teste);
  if (!app || app.resultado?.modo !== "planilha" || !app.layout?.graficos) return [];
  const saidas = app.resultado.saidas;
  const alvo = norm(trecho);
  const def = app.layout.graficos.find((g) => (alvo === "" || norm(g.titulo).includes(alvo)) && g.series.some((s) => s.vals.some((k) => k && numero(saidas[k]) !== null)));
  if (!def) return [];
  let series = def.series.filter((s) => s.vals.some((k) => k && numero(saidas[k]) !== null)); // séries auxiliares vazias do Excel ficam de fora
  if (/quantidade de palavras/i.test(def.titulo)) series = series.filter((s) => /paciente|m[eé]dia/i.test(rotuloRef(s.nome, saidas))); // como no laudo-modelo: só Paciente e Média
  const tipo0 = series[0].tipo;
  const tipo: GraficoImg["tipo"] = tipo0 === "radar" ? "radar" : tipo0 === "pie" ? "pizza" : tipo0 === "bar" ? (series[0].direcao === "bar" ? "barras-h" : "colunas") : "linhas";
  const cats = (series[0].cats ?? []).map((c) => rotuloRef(c, saidas));
  const cores = ["#FFC000", "#1F3864", ...PALETA];
  const manter = cats.map((c, i) => c !== "" || series.some((s) => numero(saidas[s.vals[i] ?? ""]) !== null));
  const filtra = <T,>(a: T[]) => a.filter((_, i) => manter[i] ?? true);
  const g: GraficoImg = {
    tipo, categorias: filtra(cats),
    series: series.map((s, i) => ({ nome: rotuloRef(s.nome, saidas) || `Série ${i + 1}`, tipo: s.tipo === "bar" ? "bar" : "line", cor: /quantidade de palavras/i.test(def.titulo) ? cores[i] : PALETA[i % PALETA.length], marcador: /quantidade de palavras/i.test(def.titulo) ? i === 0 : undefined, valores: filtra(s.vals.map((k) => (k ? numero(saidas[k]) : null))) })),
    eixo: def.eixo, rotulos: tipo === "colunas" ? "topo" : "nenhum", altura: tipo === "radar" || tipo === "pizza" ? 300 : 250,
  };
  const leg = LEGENDA_GRAFICO.find(([re]) => re.test(def.titulo))?.[1] ?? `${app.sigla} – ${def.titulo || "gráfico"}`;
  return imagemDoGrafico(ctx, g, leg);
}

function tabelaBeck(ctx: Ctx, sigla: string, rotulo: string): Array<Paragraph | Table> {
  const app = maisRecente(ctx.apps, sigla);
  if (!app || app.resultado?.modo !== "soma") return [];
  const classif = String(app.resultado.faixa?.classificacao ?? "—");
  return [legenda(`Tabela ${++ctx.nTabela}: Resultados ${sigla}`), new Table({ width: { size: 6500, type: WidthType.DXA }, columnWidths: [2400, 1200, 2900], alignment: AlignmentType.CENTER, rows: [new TableRow({ children: [celula(rotulo, { largura: 2400, fundo: PECHE }), celula(String(app.resultado.escoreBrutoTotal), { largura: 1200, centro: true, cor: VERMELHO }), celula(classif, { largura: 2900, cor: VERMELHO, destaque: true })] })] }), espaco()];
}

function tabelaSrs(ctx: Ctx): Array<Paragraph | Table> {
  const app = maisRecente(ctx.apps, "SRS2");
  if (!app || app.resultado?.modo !== "planilha" || !app.layout?.tabelas) return [];
  const saidas = app.resultado.saidas;
  for (const t of app.layout.tabelas) {
    const iT = t.colunas.findIndex((c) => /t-score/i.test(c)), iC = t.colunas.findIndex((c) => /classifica/i.test(c));
    if (iT < 0 || iC < 0) continue;
    const linhas = t.linhas.map((l) => { const kt = l.valores[iT], kc = l.valores[iC]; const v = kt ? numero(saidas[kt]) : null; return v === null ? null : [l.rotulo.replace(/\s*\([^)]*\)\s*$/, ""), String(Math.round(v)), String(kc ? saidas[kc] ?? "" : "")]; }).filter(Boolean) as string[][];
    if (linhas.length === 0) continue;
    return [legenda(`Tabela ${++ctx.nTabela}: Resultados SRS-2${t.titulo ? ` (${t.titulo})` : ""}`), tabela(["Fator", "T-Score", "Classificação"], linhas, [4200, 1800, 3000], { destacarUltima: true }), espaco()];
  }
  return [];
}

const humanizar = (k: string) => k.replace(/([a-z])([A-Z0-9])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
const fmtNum = (v: unknown): string => { const x = numero(v); return x === null ? String(v ?? "") : Number.isInteger(x) ? String(x) : String(Math.round(x * 100) / 100).replace(".", ","); };

// Tabela de um teste qualquer, montada do que o teste calcula: tabelas do layout (filtradas por título) ou, nos demais modos, o resumo dos resultados.
function tabelaGenerica(ctx: Ctx, sigla: string, ref: string | null): Array<Paragraph | Table> {
  const app = maisRecente(ctx.apps, sigla);
  if (!app?.resultado) return [];
  const r = app.resultado;
  if (r.modo === "planilha") {
    const alvo = ref ? norm(ref) : "";
    const out: Array<Paragraph | Table> = [];
    for (const t of app.layout?.tabelas ?? []) {
      if (alvo && !norm(t.titulo).includes(alvo)) continue;
      const linhas = t.linhas.map((l) => [l.rotulo, ...t.colunas.map((_, i) => { const k = l.valores[i]; return k ? fmtNum(r.saidas[k]) : ""; })]).filter((l) => l.slice(1).some((c) => c !== "") && !l[0].startsWith("="));
      if (linhas.length === 0) continue;
      const nCol = t.colunas.length + 1, primeira = nCol > 4 ? 2600 : 3200, resto = Math.floor((LARG_PAG - primeira) / (nCol - 1));
      out.push(legenda(`Tabela ${++ctx.nTabela}: ${app.sigla}${t.titulo && t.titulo !== "Resultado" ? ` – ${t.titulo}` : ""}`), tabela([t.titulo || "Resultado", ...t.colunas], linhas, [primeira, ...t.colunas.map(() => resto)]), espaco());
      if (alvo) break;
    }
    return out;
  }
  if (r.modo === "soma") {
    return [legenda(`Tabela ${++ctx.nTabela}: Resultados ${app.sigla}`), tabela(["ESCORE TOTAL", "CLASSIFICAÇÃO"], [[String(r.escoreBrutoTotal), String(r.faixa?.classificacao ?? "—")]], [3000, 4000]), espaco()];
  }
  const linhas = Object.entries(r.porCampo).map(([k, v]) => { const f = v.faixa ?? {}; return [humanizar(k), fmtNum(v.valorBruto), fmtNum(f.ponderado ?? f.composto ?? f.tScore ?? ""), fmtNum(f.percentil ?? ""), String(f.classificacao ?? "")]; }).filter((l) => l[1] !== "" || l[3] !== "");
  if (linhas.length === 0) return [];
  return [legenda(`Tabela ${++ctx.nTabela}: Resultados ${app.sigla}`), tabela(["RESULTADO", "BRUTO", "ESCORE", "PERCENTIL", "CLASSIFICAÇÃO"], linhas, [3000, 1100, 1300, 1300, 2938]), espaco()];
}

function resolverToken(token: string, ctx: Ctx): Array<Paragraph | Table> {
  const [tipo, resto] = [token.slice(0, token.indexOf(":")), token.slice(token.indexOf(":") + 1)];
  // interpretação do profissional para o domínio: parágrafos livres (linhas em branco separam)
  if (tipo === "interpretacao") return (ctx.interpretacoes[resto] ?? "").split(/\n+/).filter((l) => l.trim()).map(corpo);
  if (tipo === "tabela") {
    if (resto === "wais-indices") return tabelaWaisIndices(ctx);
    if (resto === "bai") return tabelaBeck(ctx, "BAI", "Ansiedade");
    if (resto === "bdi") return tabelaBeck(ctx, "BDI-II", "Depressão");
    if (resto === "srs2") return tabelaSrs(ctx);
    const [modo, sigla, ref] = resto.split("|");
    if ((modo === "layout" || modo === "resultados") && sigla) return tabelaGenerica(ctx, sigla, ref || null);
  }
  if (tipo === "grafico") {
    if (resto === "wais-indices") return graficoWaisIndices(ctx);
    const [teste, trecho] = resto.split("|");
    return graficoDoLayout(ctx, teste, trecho ?? "");
  }
  return [];
}

// ---------- markdown leve → parágrafos ----------
function renderMarkdown(md: string, ctx: Ctx, numerarSub?: string): Array<Paragraph | Table> {
  const out: Array<Paragraph | Table> = [];
  let n = 0;
  for (const linha of md.split("\n")) {
    const t = linha.trim();
    if (!t) continue;
    const tok = /^\[\[([^\]]+)\]\]$/.exec(t);
    if (tok) out.push(...resolverToken(tok[1], ctx));
    else if (t.startsWith("## ")) out.push(subtitulo(`${numerarSub ? `${numerarSub}${++n} ` : ""}${numerarSub ? t.slice(3).toUpperCase() : t.slice(3)}`));
    else if (t.startsWith("- ")) out.push(bullet(t.slice(2)));
    else out.push(corpo(t));
  }
  return out;
}

export async function gerarDocxLaudoCompleto(d: DadosLaudoCompleto): Promise<Buffer> {
  const ctx: Ctx = { apps: d.aplicacoes, sistema: d.sistema, nTabela: 1, nGrafico: 0, interpretacoes: d.laudo.interpretacoes ?? {} }; // a Tabela 1 é a de classificação
  const cor = (d.clinica.corSecundaria || "E8691E").replace("#", "");
  const tabelaClass = obterTabelaClassificacaoPercentil(d.sistema);

  // conclusão: a parte "## Sugestões…" vira a seção 9
  const idxSug = d.laudo.conclusao.search(/^##\s*Sugest/im);
  const conclusao = idxSug >= 0 ? d.laudo.conclusao.slice(0, idxSug).trim() : d.laudo.conclusao.trim();
  const sugestoes = idxSug >= 0 ? d.laudo.conclusao.slice(idxSug).replace(/^##[^\n]*\n?/, "").trim() : "";

  // ---- cabeçalho (logotipo + frase) e marca-d'água ----
  const logo = imagemInline(d.clinica.logoUrl, 2.4, 6);
  const marca = dataUrl(d.clinica.marcaDaguaUrl);
  const semBorda = { top: { style: BorderStyle.NONE, size: 0, color: "auto" }, bottom: { style: BorderStyle.NONE, size: 0, color: "auto" }, left: { style: BorderStyle.NONE, size: 0, color: "auto" }, right: { style: BorderStyle.NONE, size: 0, color: "auto" } };
  const filhosCabecalho: Array<Paragraph | Table> = [
    new Table({ width: { size: LARG_PAG, type: WidthType.DXA }, columnWidths: [3600, 6038], borders: { ...semBorda, insideHorizontal: semBorda.top, insideVertical: semBorda.top }, rows: [new TableRow({ children: [
      new TableCell({ width: { size: 3600, type: WidthType.DXA }, borders: semBorda, children: [new Paragraph({ children: logo ? [logo] : [new TextRun({ text: d.clinica.nome, bold: true, font: FONTE, size: 26, color: "595959" })] })] }),
      new TableCell({ width: { size: 6038, type: WidthType.DXA }, borders: semBorda, verticalAlign: VerticalAlign.BOTTOM, children: [new Paragraph({ children: d.clinica.slogan ? [new TextRun({ text: d.clinica.slogan, italics: true, font: "Brush Script MT", size: 26, color: cor })] : [] })] }),
    ] })] }),
  ];
  if (marca && marca.w && marca.h) {
    const w = cmPx(14), h = Math.round((w * marca.h) / marca.w);
    filhosCabecalho.push(new Paragraph({ children: [new ImageRun({ type: marca.tipo, data: marca.dados, transformation: { width: w, height: h }, floating: { horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, align: HorizontalPositionAlign.CENTER }, verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, align: VerticalPositionAlign.CENTER }, behindDocument: true, allowOverlap: true, wrap: { type: TextWrappingType.NONE } } })] }));
  }

  // ---- rodapé: endereço, whatsapp, instagram e página ----
  const c = d.clinica;
  const enderecoLinha = [[c.endereco, c.bairro, c.cidade].filter(Boolean).join(", "), c.cep ? `CEP: ${c.cep}` : ""].filter(Boolean).join(", ");
  const linhasRodape = [enderecoLinha, c.whatsapp || c.telefone ? `${c.whatsapp || c.telefone}` : "", c.instagram ?? ""].filter(Boolean);
  const rodape = new Footer({ children: [
    new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 8, color: "4F81BD", space: 4 } }, children: [] }),
    new Table({ width: { size: LARG_PAG, type: WidthType.DXA }, columnWidths: [8200, 1438], borders: { ...semBorda, insideHorizontal: semBorda.top, insideVertical: semBorda.top }, rows: [new TableRow({ children: [
      new TableCell({ width: { size: 8200, type: WidthType.DXA }, borders: semBorda, children: linhasRodape.map((l) => new Paragraph({ children: [new TextRun({ text: l, font: FONTE, size: 18, color: cor })] })) }),
      new TableCell({ width: { size: 1438, type: WidthType.DXA }, borders: semBorda, verticalAlign: VerticalAlign.BOTTOM, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT], font: "Times New Roman", size: 20 })] })] }),
    ] })] }),
  ] });

  // ---- corpo: seções na ordem, com os títulos e textos do modelo ----
  const modelo = d.modelo ?? estruturaDoSistema(MODELO_PADRAO_ID)!;
  const extras = d.laudo.secoesExtras ?? {};
  const marc = (t: string) => resolverMarcadores(t, d);
  const paragrafosDe = (t?: string | string[]) => (Array.isArray(t) ? t : (t ?? "").split(/\n+/)).map((l) => marc(l)).filter((l) => l.trim());
  // linha sob o nome: a que o profissional escreveu no cadastro; sem ela, uma neutra montada com as especialidades
  const titEspecialista = d.profissional.tituloLaudo?.trim() || `Psicólogo(a)${d.profissional.especialidades.length ? ` especialista em ${d.profissional.especialidades.join(", ")}` : ""}`;
  const rotuloAutor = /^psic[oó]loga/i.test(titEspecialista) ? "Autora" : /^psic[oó]logo\b/i.test(titEspecialista) ? "Autor" : "Autor(a)";
  const identificacaoProf = [
    linhaSimples(`**${rotuloAutor}:** ${d.profissional.nome}`),
    ...(d.profissional.formacao ? d.profissional.formacao.split(/\n+/).map((l) => linhaSimples(l)) : []),
    ...(d.profissional.email ? [linhaSimples(`Email: ${d.profissional.email}`)] : []),
  ];
  const nasc = d.paciente.dataNascimento.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  const identificacaoPac = [
    linhaSimples(`**Nome:** ${d.paciente.nome}`),
    linhaSimples(`${d.paciente.cpf ? `**CPF:** ${d.paciente.cpf}   ` : ""}**Idade:** ${d.paciente.idadeTexto}`),
    linhaSimples(`**Data de nascimento:** ${nasc}`),
  ];
  const textoOuTraco = (t: string) => (t.trim() ? t.split(/\n+/).filter((l) => l.trim()).map(corpo) : [corpo("—")]);
  const mdOuTraco = (md: string, sub?: string) => { const r = md.trim() ? renderMarkdown(md, ctx, sub) : []; return r.length ? r : [corpo("—")]; };
  const dataExtenso = d.data.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  const assinatura = imagemInline(d.profissional.assinaturaUrl, 1.8, 7);
  const refs = d.laudo.referencias.split("\n").filter((l) => l.trim());

  const corpoDoc: Array<Paragraph | Table> = [
    ...modelo.cabecalho.map((linha, i) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: i === 0 ? 200 : 0, after: i === modelo.cabecalho.length - 1 ? 240 : 0 }, children: [new TextRun({ text: linha, bold: true, font: FONTE, size: 22 })] })),
    ...(modelo.abertura ? [new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { line: 300, after: 160 }, children: [new TextRun({ text: marc(modelo.abertura), bold: true, font: FONTE, size: 22 })] })] : []),
  ];
  let n = 0;
  for (const s of modelo.secoes) {
    if (s.ativo === false) continue;
    if ((s.tipo === "sugestoes" && !sugestoes) || (s.tipo === "aviso_ia" && !d.laudo.iaUtilizada)) continue;
    const numero = s.titulo && modelo.numerar ? `${++n}.` : "";
    const rotulo = `${numero ? `${numero} ` : ""}${s.titulo}`;
    const cab = s.titulo ? [s.quebraPagina ? new Paragraph({ pageBreakBefore: true, children: [new TextRun({ text: rotulo, bold: true, font: FONTE, size: 22 })], spacing: { after: 160 } }) : titulo(rotulo)] : [];
    const sub = numero || undefined;
    switch (s.tipo) {
      case "identificacao": {
        let k = 0;
        corpoDoc.push(...cab);
        for (const b of s.identificacao ?? []) {
          if (b.titulo) corpoDoc.push(subtitulo(`${numero ? `${numero}${++k} ` : ""}${b.titulo}`));
          if (b.tipo === "profissional") corpoDoc.push(...identificacaoProf);
          else if (b.tipo === "paciente") corpoDoc.push(...identificacaoPac);
          else for (const c of b.campos ?? []) corpoDoc.push(linhaSimples(`**${c.rotulo}:** ${(extras[c.id] ?? "").trim() || "—"}`));
        }
        break;
      }
      case "demanda": corpoDoc.push(...cab, ...textoOuTraco(d.laudo.descricaoDemanda)); break;
      case "anamnese": corpoDoc.push(...cab, ...textoOuTraco(d.laudo.anamnese)); break;
      case "observacao": corpoDoc.push(...cab, ...textoOuTraco(d.laudo.observacaoClinica)); break;
      case "instrumentos": corpoDoc.push(...cab, ...mdOuTraco(d.laudo.procedimento, sub)); break;
      case "referencial":
        corpoDoc.push(...cab, ...paragrafosDe(s.texto).map(corpo));
        if (s.classificacao) corpoDoc.push(legenda("Tabela 1: classificação por percentil"), tabela(["CLASSIFICAÇÃO", "PERCENTIL %"], tabelaClass.linhas.map(([a, b]) => [a, b]), [3800, 2400], { centroDe: 0 }), espaco());
        break;
      case "analise": corpoDoc.push(...cab, ...mdOuTraco(d.laudo.analise, sub)); break;
      case "conclusao":
        corpoDoc.push(...cab, ...mdOuTraco(conclusao));
        if (d.laudo.hipoteseDiagnostica?.trim()) corpoDoc.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { line: 360, after: 80 }, indent: { firstLine: 567 }, children: [new TextRun({ text: "Hipótese Diagnóstica: ", bold: true, font: FONTE, size: 22 }), ...runs(d.laudo.hipoteseDiagnostica.trim())] }));
        break;
      case "sugestoes": corpoDoc.push(...cab, ...renderMarkdown(sugestoes, ctx)); break;
      case "referencias": corpoDoc.push(...cab, ...(refs.length ? refs.map((r) => new Paragraph({ children: [new TextRun({ text: r, font: FONTE, size: 22 })], alignment: AlignmentType.JUSTIFIED, spacing: { line: 336, after: 100 } })) : [corpo("—")])); break;
      case "fecho":
        corpoDoc.push(
          new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 360, after: 360 }, children: [new TextRun({ text: `${d.clinica.cidade ? `${d.clinica.cidade}, ` : ""}${dataExtenso}.`, font: FONTE, size: 22 })] }),
          ...(assinatura ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [assinatura] })] : [new Paragraph({ spacing: { before: 400 }, children: [] })]),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "___________________________________________________", font: FONTE, size: 22 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: d.profissional.nome, bold: true, font: FONTE, size: 22 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: titEspecialista, bold: true, font: FONTE, size: 22 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: `CRP ${d.profissional.crp}`, bold: true, font: FONTE, size: 22 })] })
        );
        break;
      case "aviso_sigilo": corpoDoc.push(...paragrafosDe(s.texto).map((t) => new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 100 }, keepLines: true, keepNext: true, children: [new TextRun({ text: t, font: FONTE, size: 16 })] }))); break;
      case "aviso_validade": corpoDoc.push(...paragrafosDe(s.texto).map((t) => new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 100 }, keepLines: true, children: [new TextRun({ text: t, font: FONTE, size: 16 })] }))); break;
      case "aviso_ia": corpoDoc.push(...paragrafosDe(s.texto).map((t) => new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: t, font: FONTE, size: 16, italics: true })] }))); break;
      case "texto": corpoDoc.push(...cab, ...paragrafosDe(s.texto).map(corpo)); break;
      case "livre": corpoDoc.push(...cab, ...paragrafosDe((extras[s.id] ?? "").trim() ? extras[s.id] : s.texto).map(corpo)); break;
    }
  }

  const doc = new Document({
    creator: d.profissional.nome, title: `${modelo.cabecalho[0] ?? "Laudo psicológico"} — ${d.paciente.nome}`,
    numbering: { config: [{ reference: "setas", levels: [{ level: 0, format: LevelFormat.BULLET, text: "➢", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 567, hanging: 340 } }, run: { color: "00B050", font: "Segoe UI Symbol" } } }] }] },
    styles: { default: { document: { run: { font: FONTE, size: 22 } } } },
    sections: [{ properties: { page: { margin: { top: 2100, bottom: 1700, left: 1134, right: 1134, header: 300, footer: 300 } } }, headers: { default: new Header({ children: filhosCabecalho }) }, footers: { default: rodape }, children: corpoDoc }],
  });
  return Packer.toBuffer(doc);
}
