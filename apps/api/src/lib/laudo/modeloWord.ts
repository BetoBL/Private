import { AlignmentType, BorderStyle, Document, Packer, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import JSZip from "jszip";
import { gerarBlocosDocx, type DadosLaudoCompleto } from "./gerarDocxCompleto";
import { MARCADORES, resolverMarcadores, valoresMarcadores, type DadosMarcadores, type EstruturaModelo } from "./modelos";

// Modelo Word da clínica: um .docx com o papel timbrado e marcadores {{...}} que o sistema preenche.
//  - campos e texto das seções:      {{paciente.nome}}, {{secao.demanda}}
//  - blocos dos testes (parágrafo só com o marcador):
//      {{tabela:resultados|WAIS-III}}  {{tabela:layout|SIGLA|título}}  {{tabela:wais-indices}}
//      {{grafico:SIGLA|título}}        {{grafico:wais-indices}}
//      {{linha:SIGLA|c:campo}}         {{linha:SIGLA|l:Linha da tabela}}
// Os blocos só aparecem se o paciente fez o teste.

const xmlEsc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const xmlDes = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const RE_PARAGRAFO = /<w:p[ >][\s\S]*?<\/w:p>/g;
const RE_BLOCO = /^\s*(?:\{\{|\[\[)\s*((?:tabela|grafico|linha):[^\]}]+?)\s*(?:\}\}|\]\])\s*$/;

export interface TextosDoLaudo { demanda: string; anamnese: string; observacao: string; instrumentos: string; analise: string; conclusao: string; referencias: string; extras: Record<string, string> }
export type DadosDoWord = DadosMarcadores & Partial<Pick<DadosLaudoCompleto, "aplicacoes" | "sistema" | "laudo">>;

// markdown leve do laudo → texto simples (sem tokens de tabela/gráfico)
export function textoSimples(md: string): string {
  return md.split("\n").map((l) => l.trim()).filter((l) => l && !/^\[\[[^\]]+\]\]$/.test(l)).map((l) => (l.startsWith("## ") ? l.slice(3) : l.startsWith("- ") ? `• ${l.slice(2)}` : l)).join("\n").replace(/\*\*/g, "");
}

// valores que cada marcador {{secao.<id>}} recebe
export function valoresDasSecoes(e: EstruturaModelo, t: TextosDoLaudo, d: DadosMarcadores): Record<string, string> {
  const v: Record<string, string> = {};
  for (const s of e.secoes) {
    const fixo = Array.isArray(s.texto) ? s.texto.join("\n") : s.texto ?? "";
    const base: Record<string, string> = { demanda: t.demanda, anamnese: t.anamnese, observacao: t.observacao, instrumentos: textoSimples(t.instrumentos), analise: textoSimples(t.analise), conclusao: textoSimples(t.conclusao), referencias: t.referencias };
    v[`secao.${s.id}`] = (s.tipo === "livre" || s.tipo === "documento") ? resolverMarcadores((t.extras[s.id] ?? "").trim() ? t.extras[s.id] : fixo, d) : s.tipo in base ? base[s.tipo] : resolverMarcadores(fixo, d);
  }
  return v;
}

const textoDoParagrafo = (p: string) => xmlDes([...p.matchAll(/<w:t(?: [^>]*)?>([\s\S]*?)<\/w:t>/g)].map((m) => m[1]).join(""));

function preencherXml(xml: string, valores: Record<string, string>, blocos: Map<number, string>): string {
  let n = -1;
  return xml.replace(RE_PARAGRAFO, (p) => {
    const texto = textoDoParagrafo(p);
    if (!texto.includes("{{") && !texto.includes("[[")) return p;
    if (RE_BLOCO.test(texto)) { n++; return blocos.get(n) ?? ""; } // bloco: troca o parágrafo inteiro (vazio se o teste não foi aplicado)
    if (!texto.includes("{{") || p.includes("<w:drawing")) return p; // sem marcador (ou com figura no mesmo parágrafo): não mexe
    const rPr = /<w:r\b[^>]*>\s*(<w:rPr>[\s\S]*?<\/w:rPr>)/.exec(p)?.[1] ?? "";
    const pPr = /<w:pPr>[\s\S]*?<\/w:pPr>/.exec(p)?.[0] ?? "";
    const novo = texto.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (m, k: string) => (k in valores ? valores[k] : m));
    return novo.split("\n").map((l) => `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${xmlEsc(l)}</w:t></w:r></w:p>`).join("");
  });
}

// marcadores de bloco que o documento tem, na ordem em que aparecem
function blocosDoXml(xml: string): string[] {
  const out: string[] = [];
  for (const p of xml.match(RE_PARAGRAFO) ?? []) { const m = RE_BLOCO.exec(textoDoParagrafo(p)); if (m) out.push(m[1].trim()); }
  return out;
}

const NS = { "xmlns:w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main", "xmlns:r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships", "xmlns:wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing", "xmlns:a": "http://schemas.openxmlformats.org/drawingml/2006/main", "xmlns:pic": "http://schemas.openxmlformats.org/drawingml/2006/picture" };

// Leva o corpo de um .docx gerado (tabelas, parágrafos e imagens) para dentro do pacote do modelo da clínica: copia as imagens e refaz as relações.
async function corpoParaModelo(modelo: JSZip, bloco: Buffer, k: number, ids: { docPr: number }): Promise<string> {
  const z = await JSZip.loadAsync(bloco);
  let corpo = await z.files["word/document.xml"].async("string");
  const ini = corpo.indexOf("<w:body>") + 8;
  const fim = corpo.lastIndexOf("<w:sectPr");
  corpo = corpo.slice(ini, fim > ini ? fim : corpo.lastIndexOf("</w:body>"));
  const relsBloco = await z.files["word/_rels/document.xml.rels"].async("string");
  let relsModelo = await modelo.files["word/_rels/document.xml.rels"].async("string");
  let tipos = await modelo.files["[Content_Types].xml"].async("string");
  let i = 0;
  for (const m of relsBloco.matchAll(/<Relationship\b[^>]*>/g)) {
    const id = /Id="([^"]+)"/.exec(m[0])?.[1], alvo = /Target="([^"]+)"/.exec(m[0])?.[1];
    if (!id || !alvo || !/media\//.test(alvo) || !corpo.includes(`"${id}"`)) continue;
    const ext = alvo.split(".").pop()!.toLowerCase();
    const novoNome = `blk${k}_${++i}.${ext}`, novoId = `rIdBlk${k}_${i}`;
    modelo.file(`word/media/${novoNome}`, await z.files[`word/${alvo}`].async("nodebuffer"));
    relsModelo = relsModelo.replace("</Relationships>", `<Relationship Id="${novoId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${novoNome}"/></Relationships>`);
    corpo = corpo.split(`"${id}"`).join(`"${novoId}"`);
    if (!new RegExp(`Extension="${ext}"`, "i").test(tipos)) tipos = tipos.replace("<Override", `<Default Extension="${ext}" ContentType="image/${ext === "jpg" ? "jpeg" : ext}"/><Override`);
  }
  corpo = corpo.replace(/<wp:docPr id="\d+"/g, () => `<wp:docPr id="${ids.docPr++}"`); // ids de figura únicos no documento
  modelo.file("word/_rels/document.xml.rels", relsModelo);
  modelo.file("[Content_Types].xml", tipos);
  return corpo;
}

export async function preencherModeloWord(base64: string, e: EstruturaModelo, t: TextosDoLaudo, d: DadosDoWord): Promise<Buffer> {
  const zip = await JSZip.loadAsync(Buffer.from(base64, "base64"));
  const valores = { ...valoresMarcadores(d), ...valoresDasSecoes(e, t, d) };
  const partes = Object.keys(zip.files).filter((n) => /^word\/(document|header\d*|footer\d*)\.xml$/.test(n));
  for (const nome of partes) {
    let xml = await zip.files[nome].async("string");
    const blocos = new Map<number, string>();
    if (nome === "word/document.xml") {
      const tokens = blocosDoXml(xml);
      if (tokens.length && d.aplicacoes && d.sistema && d.laudo) {
        const gerados = await gerarBlocosDocx(d as unknown as DadosLaudoCompleto, tokens);
        const ids = { docPr: 9000 };
        for (const [k, buf] of gerados.entries()) blocos.set(k, buf ? await corpoParaModelo(zip, buf, k, ids) : "");
        for (const [prefixo, uri] of Object.entries(NS)) if (!xml.includes(`${prefixo}=`)) xml = xml.replace("<w:document ", `<w:document ${prefixo}="${uri}" `);
      } else for (const k of tokens.keys()) blocos.set(k, ""); // sem dados dos testes: o marcador some em vez de ficar no documento
    }
    zip.file(nome, preencherXml(xml, valores, blocos));
  }
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

// marcadores {{...}} que existem no arquivo (para avisar quais o sistema não conhece)
export async function marcadoresDoArquivo(base64: string): Promise<string[]> {
  const zip = await JSZip.loadAsync(Buffer.from(base64, "base64"));
  const achados = new Set<string>();
  for (const nome of Object.keys(zip.files).filter((n) => /^word\/(document|header\d*|footer\d*)\.xml$/.test(n))) {
    const xml = await zip.files[nome].async("string");
    for (const p of xml.match(RE_PARAGRAFO) ?? []) {
      const texto = textoDoParagrafo(p);
      const bloco = RE_BLOCO.exec(texto);
      if (bloco) { achados.add(bloco[1].trim()); continue; }
      for (const m of texto.matchAll(/\{\{\s*([\w.-]+)\s*\}\}/g)) achados.add(m[1]);
    }
  }
  return [...achados];
}

// ---------- Word de exemplo + guia de marcadores ----------
export interface TesteDoGuia { sigla: string; nome: string; tabelas: string[]; graficos: string[]; campos: Array<{ chave: string; label: string }> }

const F = "Calibri";
const par = (texto: string, o: { negrito?: boolean; tam?: number; cor?: string; mono?: boolean; depois?: number } = {}) => new Paragraph({ spacing: { after: o.depois ?? 100 }, children: [new TextRun({ text: texto, bold: o.negrito, size: o.tam ?? 22, color: o.cor, font: o.mono ? "Consolas" : F })] });
const borda = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
const celula = (texto: string, largura: number, cab = false, mono = false) => new TableCell({ width: { size: largura, type: WidthType.DXA }, borders: { top: borda, bottom: borda, left: borda, right: borda }, shading: cab ? { type: ShadingType.CLEAR, color: "auto", fill: "FCD5B4" } : undefined, margins: { top: 40, bottom: 40, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: texto, bold: cab, size: 19, font: mono ? "Consolas" : F })] })] });
const tabelaDe = (cab: [string, string], linhas: Array<[string, string]>) => new Table({ width: { size: 9638, type: WidthType.DXA }, columnWidths: [4300, 5338], rows: [new TableRow({ tableHeader: true, children: [celula(cab[0], 4300, true), celula(cab[1], 5338, true)] }), ...linhas.map(([a, b]) => new TableRow({ cantSplit: true, children: [celula(a, 4300, false, true), celula(b, 5338)] }))] });

export async function gerarWordDeExemplo(nomeModelo: string, e: EstruturaModelo | null, testes: TesteDoGuia[]): Promise<Buffer> {
  const secoes = (e?.secoes ?? []).filter((s) => !["fecho", "aviso_sigilo", "aviso_validade", "aviso_ia", "identificacao"].includes(s.tipo));
  const filhos: Array<Paragraph | Table> = [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "TÍTULO DO DOCUMENTO", bold: true, size: 26, font: F })] }),
    par("(Este é um exemplo. Apague o que não quiser, mude a formatação, coloque o seu papel timbrado no cabeçalho e o seu texto. O sistema só troca o que estiver entre chaves duplas.)", { cor: "7F7F7F", tam: 19 }),
    par("Identificação", { negrito: true, tam: 24 }),
    par("Paciente: {{paciente.nome}}"), par("CPF: {{paciente.cpf}}    Idade: {{paciente.idade}}"), par("Data de nascimento: {{paciente.nascimento}}"),
    par("Profissional: {{profissional.nome}}  ·  CRP {{profissional.crp}}"),
    ...secoes.flatMap((s) => [par(s.titulo || "Texto", { negrito: true, tam: 24 }), par(`{{secao.${s.id}}}`)]),
    ...testes.slice(0, 4).flatMap((t) => [par(`Resultados – ${t.sigla}`, { negrito: true, tam: 24 }), par(`{{tabela:resultados|${t.sigla}}}`), ...(t.graficos[0] ? [par(`{{grafico:${t.sigla}|${t.graficos[0]}}}`)] : [])]),
    par("{{local.data}}", { depois: 400 }), par("{{profissional.nome}}", { negrito: true }), par("{{profissional.titulo}} · CRP {{profissional.crp}}"),
    new Paragraph({ pageBreakBefore: true, children: [new TextRun({ text: "GUIA DE MARCADORES", bold: true, size: 26, font: F })], spacing: { after: 160 } }),
    par("Escreva o marcador exatamente como abaixo, em um parágrafo próprio quando for tabela, gráfico ou resultado. Tabelas e gráficos só aparecem no documento se o paciente fez o teste. Esta página do guia pode ser apagada do seu modelo."),
    par("Dados do paciente, do profissional e da clínica", { negrito: true, tam: 24 }),
    tabelaDe(["Marcador", "O que entra"], MARCADORES.map((m) => [`{{${m.marcador}}}`, m.descricao])),
    par("", { depois: 120 }),
    ...(e ? [par(`Texto de cada seção do modelo “${nomeModelo}”`, { negrito: true, tam: 24 }), tabelaDe(["Marcador", "Seção"], e.secoes.filter((s) => s.tipo !== "fecho").map((s) => [`{{secao.${s.id}}}`, s.titulo || s.tipo])), par("", { depois: 120 })] : []),
    par("Tabelas, gráficos e resultados dos testes", { negrito: true, tam: 24 }),
    tabelaDe(["Marcador", "O que entra"], [["{{tabela:resultados|SIGLA}}", "Quadro com os resultados do teste"], ["{{tabela:layout|SIGLA|título}}", "Uma tabela específica do teste"], ["{{grafico:SIGLA|título}}", "Um gráfico do teste"], ["{{linha:SIGLA|c:campo}}", "Uma linha: “Resultado: percentil NN% Classificação”"], ["{{tabela:wais-indices}}", "Tabela dos índices do WAIS-III"], ["{{grafico:wais-indices}}", "Gráfico dos índices do WAIS-III"]]),
    par("", { depois: 120 }),
    ...(testes.length ? [par("Marcadores prontos para os testes deste modelo", { negrito: true, tam: 24 }), tabelaDe(["Marcador", "O que entra"], testes.flatMap((t): Array<[string, string]> => [[`{{tabela:resultados|${t.sigla}}}`, `${t.sigla} – quadro de resultados`], ...t.tabelas.slice(0, 6).map((x): [string, string] => [`{{tabela:layout|${t.sigla}|${x}}}`, `${t.sigla} – tabela “${x}”`]), ...t.graficos.slice(0, 6).map((x): [string, string] => [`{{grafico:${t.sigla}|${x}}}`, `${t.sigla} – gráfico “${x}”`]), ...t.campos.slice(0, 8).map((c): [string, string] => [`{{linha:${t.sigla}|c:${c.chave}}}`, `${t.sigla} – ${c.label}`])]))] : [par("Escolha os testes do modelo (aba “Testes do modelo”) e baixe este guia de novo: ele traz os marcadores prontos de cada teste.", { cor: "7F7F7F" })]),
  ];
  return Packer.toBuffer(new Document({ styles: { default: { document: { run: { font: F, size: 22 } } } }, sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children: filhos }] }));
}
