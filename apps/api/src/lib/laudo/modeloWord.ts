import JSZip from "jszip";
import { resolverMarcadores, valoresMarcadores, type DadosMarcadores, type EstruturaModelo } from "./modelos";

// Modelo Word da clínica: um .docx com o papel timbrado e marcadores {{...}} que o sistema preenche (campos comuns e o texto de cada seção).
// Tabelas e gráficos dos testes não entram neste caminho: ele serve a documentos de texto (declaração, atestado, parecer, relatório curto).

const xmlEsc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const xmlDes = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");

export interface TextosDoLaudo { demanda: string; anamnese: string; observacao: string; instrumentos: string; analise: string; conclusao: string; referencias: string; extras: Record<string, string> }

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
    v[`secao.${s.id}`] = s.tipo === "livre" ? resolverMarcadores((t.extras[s.id] ?? "").trim() ? t.extras[s.id] : fixo, d) : s.tipo in base ? base[s.tipo] : resolverMarcadores(fixo, d);
  }
  return v;
}

function preencherXml(xml: string, valores: Record<string, string>): string {
  return xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, (p) => {
    const texto = [...p.matchAll(/<w:t(?: [^>]*)?>([\s\S]*?)<\/w:t>/g)].map((m) => m[1]).join("");
    if (!texto.includes("{{") || p.includes("<w:drawing")) return p; // sem marcador (ou com figura no mesmo parágrafo): não mexe
    const rPr = /<w:r\b[^>]*>\s*(<w:rPr>[\s\S]*?<\/w:rPr>)/.exec(p)?.[1] ?? "";
    const pPr = /<w:pPr>[\s\S]*?<\/w:pPr>/.exec(p)?.[0] ?? "";
    const novo = xmlDes(texto).replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (m, k: string) => (k in valores ? valores[k] : m));
    return novo.split("\n").map((l) => `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${xmlEsc(l)}</w:t></w:r></w:p>`).join("");
  });
}

export async function preencherModeloWord(base64: string, e: EstruturaModelo, t: TextosDoLaudo, d: DadosMarcadores): Promise<Buffer> {
  const zip = await JSZip.loadAsync(Buffer.from(base64, "base64"));
  const valores = { ...valoresMarcadores(d), ...valoresDasSecoes(e, t, d) };
  for (const nome of Object.keys(zip.files).filter((n) => /^word\/(document|header\d*|footer\d*)\.xml$/.test(n))) {
    zip.file(nome, preencherXml(await zip.files[nome].async("string"), valores));
  }
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

// marcadores {{...}} que existem no arquivo (para avisar quais o sistema não conhece)
export async function marcadoresDoArquivo(base64: string): Promise<string[]> {
  const zip = await JSZip.loadAsync(Buffer.from(base64, "base64"));
  const achados = new Set<string>();
  for (const nome of Object.keys(zip.files).filter((n) => /^word\/(document|header\d*|footer\d*)\.xml$/.test(n))) {
    const xml = await zip.files[nome].async("string");
    for (const p of xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) ?? []) {
      const texto = xmlDes([...p.matchAll(/<w:t(?: [^>]*)?>([\s\S]*?)<\/w:t>/g)].map((m) => m[1]).join(""));
      for (const m of texto.matchAll(/\{\{\s*([\w.-]+)\s*\}\}/g)) achados.add(m[1]);
    }
  }
  return [...achados];
}
