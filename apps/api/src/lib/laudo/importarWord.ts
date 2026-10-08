import mammoth from "mammoth";
import { DOMINIOS } from "./dominios";
import type { BlocoIdentificacao, BlocoModelo, DominioModelo, EstruturaModelo, SecaoModelo, TipoSecao } from "./modelos";

// Lê um laudo em Word e propõe um modelo: títulos viram seções (com o tipo reconhecido pelo nome), campos comuns viram marcadores {{...}},
// e testes/domínios citados no texto viram relações para a clínica revisar. Não lê imagens, gráficos nem o desenho das tabelas.

export interface TesteCatalogo { sigla: string; nome: string }
export interface ResultadoImportacao {
  estrutura: EstruturaModelo;
  secoesLidas: Array<{ titulo: string; tipo: TipoSecao; motivo: string }>;
  testesDetectados: Array<{ sigla: string; nome: string; secao: string }>;
  dominiosDetectados: string[];
  marcadoresInseridos: Array<{ marcador: string; trecho: string }>;
  avisos: string[];
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const semTags = (h: string) => h.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();

interface Linha { texto: string; titulo: boolean }

function lerLinhas(html: string): Linha[] {
  const out: Linha[] = [];
  for (const m of html.matchAll(/<(h[1-6]|p|li)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
    const texto = semTags(m[2]);
    if (!texto) continue;
    const todoNegrito = /^<strong>[\s\S]*<\/strong>$/.test(m[2].trim()) && !/<\/strong>[\s\S]*<strong>/.test(m[2]);
    const numerado = /^\d+(\.\d+)*[.)]?\s+\S/.test(texto);
    const maiusculo = texto.length <= 90 && texto === texto.toUpperCase() && /[A-ZÀ-Ú]{3}/.test(texto);
    const titulo = /^h[1-6]$/.test(m[1]) || (texto.length <= 90 && ((todoNegrito && (numerado || maiusculo)) || (numerado && maiusculo)));
    out.push({ texto, titulo });
  }
  return out;
}

const TIPOS: Array<[RegExp, TipoSecao, string]> = [
  [/identific/, "identificacao", "o título fala em identificação"],
  [/demanda|queixa|motivo|solicita/, "demanda", "o título fala em demanda/queixa/motivo"],
  [/anamnese|historico/, "anamnese", "o título fala em anamnese/histórico"],
  [/observa/, "observacao", "o título fala em observação"],
  [/instrument|procedimento|materiais|testes aplicados/, "instrumentos", "o título fala em instrumentos/procedimento"],
  [/referencial|metodolog|fundamenta/, "referencial", "o título fala em referencial/metodologia"],
  [/analise|resultados|discussao/, "analise", "o título fala em análise/resultados"],
  [/sugest|encaminh|recomenda|orienta/, "sugestoes", "o título fala em sugestões/encaminhamentos"],
  [/conclus|consideracoes finais/, "conclusao", "o título fala em conclusão"],
  [/referencias|bibliograf/, "referencias", "o título fala em referências"],
  [/sigilo/, "aviso_sigilo", "o título fala em sigilo"],
  [/validade/, "aviso_validade", "o título fala em validade"],
];

// campos comuns do paciente/profissional: o texto fixo leva o marcador no lugar do valor
const CAMPOS: Array<[RegExp, string]> = [
  [/^(nome( completo)?( do\(a\)| do| da)?( paciente| avaliando| avaliada| avaliado)?)\s*:\s*\S.*$/i, "paciente.nome"],
  [/^(data de nascimento|nascimento|dt\.? nasc\.?)\s*:\s*\S.*$/i, "paciente.nascimento"],
  [/^idade\s*:\s*\S.*$/i, "paciente.idade"],
  [/^cpf\s*:\s*\S.*$/i, "paciente.cpf"],
  [/^(autor|autora|autor\(a\)|psic[oó]log[oa]|profissional|neuropsic[oó]log[oa])\s*:\s*\S.*$/i, "profissional.nome"],
  [/^crp\s*:?\s*[\d/]+.*$/i, "profissional.crp"],
  [/^(local e data|data)\s*:\s*\S.*$/i, "local.data"],
];

function comMarcadores(texto: string, achados: ResultadoImportacao["marcadoresInseridos"]): string {
  let t = texto;
  const cpf = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g;
  if (cpf.test(t)) { achados.push({ marcador: "paciente.cpf", trecho: (t.match(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/) ?? [""])[0] }); t = t.replace(cpf, "{{paciente.cpf}}"); }
  for (const [re, marc] of CAMPOS) {
    if (!re.test(t)) continue;
    const rotulo = t.slice(0, t.indexOf(":") + 1);
    achados.push({ marcador: marc, trecho: t });
    t = `${rotulo} {{${marc}}}`;
    break;
  }
  return t;
}

export async function importarLaudoWord(buffer: Buffer, catalogo: TesteCatalogo[]): Promise<ResultadoImportacao> {
  const { value: html } = await mammoth.convertToHtml({ buffer });
  const linhas = lerLinhas(html);
  const avisos: string[] = [];
  const marcadoresInseridos: ResultadoImportacao["marcadoresInseridos"] = [];
  if (linhas.length === 0) throw new Error("O arquivo não tem texto legível. Envie um documento Word (.docx) com o laudo.");

  const primeiroTitulo = linhas.findIndex((l) => l.titulo);
  const antes = primeiroTitulo < 0 ? linhas : linhas.slice(0, primeiroTitulo);
  const cabecalho = antes.filter((l) => l.texto.length <= 70 && l.texto === l.texto.toUpperCase()).map((l) => l.texto);
  const tituloDoDocumento = (b: { titulo: string; corpo: string[] }) => b.corpo.length === 0 && !/^\d/.test(b.titulo);
  const abertura = antes.find((l) => l.texto.length > 70)?.texto;
  if (primeiroTitulo < 0) avisos.push("Não encontrei títulos de seção (numerados, em negrito ou em maiúsculas). O documento inteiro virou uma seção de texto: separe-a no editor.");

  // blocos por título
  const blocos: Array<{ titulo: string; corpo: string[] }> = [];
  if (primeiroTitulo >= 0) {
    for (const l of linhas.slice(primeiroTitulo)) {
      if (l.titulo) blocos.push({ titulo: l.texto, corpo: [] });
      else blocos[blocos.length - 1].corpo.push(l.texto);
    }
  } else blocos.push({ titulo: "TEXTO", corpo: antes.map((l) => l.texto) });

  // títulos sem texto no início ("LAUDO PSICOLÓGICO") são o cabeçalho do documento, não uma seção
  while (blocos.length > 1 && tituloDoDocumento(blocos[0])) cabecalho.push(blocos.shift()!.titulo);
  const secoes: SecaoModelo[] = [];
  const secoesLidas: ResultadoImportacao["secoesLidas"] = [];
  const dominiosDetectados: string[] = [];
  const dominiosModelo: DominioModelo[] = [];
  const blocosModelo: BlocoModelo[] = [];
  const testesDetectados: ResultadoImportacao["testesDetectados"] = [];
  let numerar = false;

  const acharTestes = (texto: string, secao: string) => {
    const t = ` ${norm(texto)} `;
    for (const c of catalogo) {
      const sig = norm(c.sigla).replace(/[-_]/g, " ");
      const reSigla = new RegExp(`[^a-z0-9]${sig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "[ -]?")}[^a-z0-9]`);
      if (reSigla.test(t) || (norm(c.nome).length > 12 && t.includes(norm(c.nome)))) if (!testesDetectados.some((x) => x.sigla === c.sigla)) testesDetectados.push({ sigla: c.sigla, nome: c.nome, secao });
    }
  };

  blocos.forEach((b, i) => {
    const semNumero = b.titulo.replace(/^\d+(\.\d+)*[.)]?\s+/, "");
    if (/^\d+[.)]?\s/.test(b.titulo)) numerar = true;
    const n = norm(semNumero);
    // subtítulos numerados (1.1, 5.2...) pertencem à seção anterior
    if (/^\d+\.\d+/.test(b.titulo) && secoes.length) {
      const ant = secoes[secoes.length - 1];
      if (ant.tipo === "texto" || ant.tipo === "referencial") ant.texto = [...(Array.isArray(ant.texto) ? ant.texto : [ant.texto ?? ""]), b.titulo, ...b.corpo];
      if (norm(ant.titulo).includes("analise")) { const dom = DOMINIOS.find((d) => n.includes(norm(d.titulo))); if (dom) { dominiosDetectados.push(dom.titulo); dominiosModelo.push({ chave: dom.chave }); } }
      acharTestes(b.corpo.join(" "), ant.titulo);
      return;
    }
    const reg = TIPOS.find(([re]) => re.test(n));
    let tipo: TipoSecao = reg?.[1] ?? (b.corpo.length ? "texto" : "livre");
    const motivo = reg?.[2] ?? (b.corpo.length ? "título não reconhecido: ficou como texto fixo do modelo" : "título sem texto: ficou como texto preenchido por paciente");
    const s: SecaoModelo = { id: `${tipo}-${i + 1}`, tipo, titulo: semNumero };
    if (tipo === "identificacao") {
      const prof: string[] = [], pac: string[] = [], campos: Array<{ id: string; rotulo: string }> = [];
      for (const linha of b.corpo) {
        const m = /^([^:]{2,40}):/.exec(linha);
        if (!m) continue;
        const rot = m[1].trim();
        if (/^(autor|autora|autor\(a\)|profissional|psic|neuropsic|crp|e-?mail)/i.test(rot)) prof.push(linha);
        else if (/^(nome|data de nasc|idade|cpf|paciente|nascimento)/i.test(rot)) pac.push(linha);
        else campos.push({ id: norm(rot).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), rotulo: rot });
      }
      const ids: BlocoIdentificacao[] = [];
      if (campos.length) ids.push({ tipo: "campos", campos });
      if (prof.length || !pac.length) ids.push({ tipo: "profissional", titulo: "IDENTIFICAÇÃO PROFISSIONAL" });
      ids.push({ tipo: "paciente", titulo: "IDENTIFICAÇÃO DO(A) PACIENTE" });
      s.identificacao = ids;
      if (campos.length) avisos.push(`Na identificação, os campos "${campos.map((c) => c.rotulo).join('", "')}" viram campos preenchidos por paciente.`);
    } else if (tipo === "texto" || tipo === "referencial" || tipo.startsWith("aviso_")) {
      s.texto = b.corpo.map((l) => comMarcadores(l, marcadoresInseridos));
    } else if (tipo === "livre") {
      s.texto = "";
    }
    if (tipo === "instrumentos" || tipo === "analise") acharTestes(b.corpo.join(" "), semNumero);
    if (tipo === "analise") {
      // domínios citados no corpo da análise, em linhas curtas (subtítulos sem numeração)
      for (const l of b.corpo) {
        const dom = DOMINIOS.find((d) => l.length <= 60 && norm(l).replace(/^[\d. ]+/, "") === norm(d.titulo));
        if (dom && !dominiosDetectados.includes(dom.titulo)) { dominiosDetectados.push(dom.titulo); dominiosModelo.push({ chave: dom.chave }); }
      }
    }
    secoes.push(s);
    secoesLidas.push({ titulo: b.titulo, tipo, motivo });
  });

  // o laudo sempre fecha com local/data/assinatura: coloca o fecho antes das referências, ou no fim
  if (!secoes.some((s) => s.tipo === "fecho")) {
    const iRef = secoes.findIndex((s) => s.tipo === "referencias");
    secoes.splice(iRef >= 0 ? iRef : secoes.length, 0, { id: "fecho", tipo: "fecho", titulo: "" });
    avisos.push("Acrescentei o fecho (local, data, assinatura, nome e CRP), que sai do cadastro do profissional.");
  }
  if (dominiosModelo.length) {
    const resto = DOMINIOS.filter((d) => !dominiosModelo.some((x) => x.chave === d.chave)).map((d) => ({ chave: d.chave }));
    dominiosModelo.push(...resto);
    avisos.push(`Domínios citados na análise, na ordem do documento: ${dominiosDetectados.join(", ")}. Os demais ficaram no fim da lista.`);
  }
  if (testesDetectados.length) avisos.push(`Testes citados no texto: ${testesDetectados.map((t) => t.sigla).join(", ")}. Confira em que domínio cada resultado deve aparecer.`);
  avisos.push("Gráficos, imagens e o desenho das tabelas do Word não são lidos: coloque-os em cada domínio pela biblioteca de blocos do editor.");

  return {
    estrutura: { cabecalho: cabecalho.length ? cabecalho : ["LAUDO PSICOLÓGICO"], abertura, numerar, secoes, ...(dominiosModelo.length ? { dominios: dominiosModelo } : {}), blocos: blocosModelo },
    secoesLidas, testesDetectados, dominiosDetectados, marcadoresInseridos, avisos,
  };
}
