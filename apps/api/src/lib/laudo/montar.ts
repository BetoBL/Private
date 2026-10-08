import type { SistemaClassificacaoPercentil } from "../classificacaoPercentil";
import { abaixoDaMedia, classificarPercentil, formatarPercentil } from "./classificacao";
import { COMPLEMENTARES, DOMINIOS, GRUPOS, siglasDe, type Fonte, type GrupoMapa, type ItemMapa } from "./dominios";
import type { BlocoModelo, DominioModelo, ItemExtraModelo } from "./modelos";
import { descricaoParaLaudo, nomeParaLaudo, referenciaParaLaudo } from "./descricoes";

// Estruturas mínimas (só o que o laudo lê): evita acoplar o laudo ao motor de cálculo.
export interface LayoutResumo {
  tabelas?: Array<{ titulo: string; colunas: string[]; linhas: Array<{ rotulo: string; valores: Array<string | null> }> }>;
  graficos?: Array<{ titulo: string; eixo: { min?: number; max?: number }; ancora: { linha: number; coluna: number }; series: Array<{ tipo: string; direcao?: string; nome: unknown; cats: unknown[]; vals: Array<string | null> }> }>;
}
export type ResultadoResumo =
  | { modo: "soma"; escoreBrutoTotal: number; faixa: Record<string, unknown> | null }
  | { modo: "por_campo"; porCampo: Record<string, { valorBruto: number | null; faixa: Record<string, unknown> | null }>; extras?: Record<string, unknown> }
  | { modo: "planilha"; saidas: Record<string, string | number | boolean | null> };

export interface AplicacaoLaudo {
  sigla: string;
  nome: string;
  descricao: string | null;
  referenciaBibliografica: string | null;
  resultado: ResultadoResumo | null;
  layout?: LayoutResumo;
  dataSessao: Date;
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v.replace(",", "."))) ? Number(v.replace(",", ".")) : null);

// o mesmo teste pode ter mais de uma aplicação (reavaliação ou informantes diferentes): usa a mais recente
function maisRecente(apps: AplicacaoLaudo[], teste: string): AplicacaoLaudo | undefined {
  const siglas = siglasDe(teste).map(norm);
  return apps.filter((a) => siglas.includes(norm(a.sigla))).sort((a, b) => b.dataSessao.getTime() - a.dataSessao.getTime())[0];
}

export function percentilDe(app: AplicacaoLaudo, fonte: Fonte): number | null {
  const r = app.resultado;
  if (!r) return null;
  if ("campo" in fonte) return r.modo === "por_campo" ? num(r.porCampo[fonte.campo]?.faixa?.percentil) : null;
  if (r.modo !== "planilha" || !app.layout?.tabelas) return null;
  const alvo = norm(fonte.linha);
  for (const t of app.layout.tabelas) {
    const linha = t.linhas.find((l) => norm(l.rotulo) === alvo && l.valores.some((k) => k && num(r.saidas[k]) !== null));
    if (!linha) continue;
    // colunas "Percentil": a numérica é a que vem logo antes da "Classificação (Guilmette)" (as anteriores são faixas em texto, como "> 95")
    const idxClass = (() => { const g = t.colunas.findIndex((c) => /guilmette|classifica/i.test(c) && /guilmette/i.test(c)); return g >= 0 ? g : t.colunas.length; })();
    const candidatas = t.colunas.map((c, i) => (/percentil/i.test(c) && i < idxClass ? i : -1)).filter((i) => i >= 0).reverse();
    for (const i of candidatas) {
      const k = linha.valores[i];
      const v = k ? num(r.saidas[k]) : null;
      if (v !== null) return v;
    }
  }
  return null;
}

function linhaDoItem(item: ItemMapa, p: number, sistema: SistemaClassificacaoPercentil): string {
  const trecho = `percentil **${formatarPercentil(p)}% ${classificarPercentil(p, sistema)}**`;
  return item.rotulo ? `- **${item.rotulo}:** ${item.descricao}, ${trecho}.` : `- ${item.descricao}, ${trecho}.`;
}

export interface EstruturaLaudo {
  procedimento: string; // seção 5 (markdown)
  analise: string; // seção 7 (markdown com tokens [[tabela:...]] / [[grafico:...]])
  referencias: string; // seção 10
  semMapa: string[]; // testes aplicados que ainda não têm linha no mapa de domínios
}

// Parte do modelo que muda a análise por domínio: nomes/ordem/introdução dos domínios, itens extras e blocos (tabela/gráfico/resultados de um teste).
export interface ConfigAnalise { dominios?: DominioModelo[]; itensExtras?: ItemExtraModelo[]; blocos?: BlocoModelo[] }

// domínios na ordem do modelo (ou a padrão), já com nome e introdução próprios
export function dominiosDoModelo(config?: ConfigAnalise): Array<{ chave: string; titulo: string; intro?: string }> {
  const padrao = new Map(DOMINIOS.map((d) => [d.chave as string, d]));
  if (!config?.dominios?.length) return DOMINIOS.map((d) => ({ ...d }));
  return config.dominios.filter((d) => d.ativo !== false).map((d) => {
    const base = padrao.get(d.chave);
    const intro = d.intro !== undefined ? d.intro : base?.intro;
    return { chave: d.chave, titulo: d.titulo?.trim() || base?.titulo || d.chave, intro: intro || undefined };
  });
}

// itens extras e blocos do modelo viram grupos como os do mapa padrão
function gruposExtras(config?: ConfigAnalise): GrupoMapa[] {
  const porDominio = new Map<string, GrupoMapa>();
  const grupo = (dominio: string) => { let g = porDominio.get(dominio); if (!g) { g = { dominio, chave: "extras-" + dominio, itens: [], blocos: [] }; porDominio.set(dominio, g); } return g; };
  for (const i of config?.itensExtras ?? []) grupo(i.dominio).itens.push({ teste: i.teste, fonte: i.fonte.campo ? { campo: i.fonte.campo } : { linha: i.fonte.linha ?? "" }, descricao: i.descricao, rotulo: i.rotulo });
  for (const b of config?.blocos ?? []) {
    const token = b.tipo === "grafico" ? `grafico:${b.teste}|${b.ref ?? ""}` : b.tipo === "tabela" ? `tabela:layout|${b.teste}|${b.ref ?? ""}` : `tabela:resultados|${b.teste}`;
    grupo(b.dominio).blocos!.push({ teste: b.teste, token });
  }
  return [...porDominio.values()];
}

export function montarEstruturaLaudo(apps: AplicacaoLaudo[], opcoes: { sistema: SistemaClassificacaoPercentil; primeiroNome: string; config?: ConfigAnalise }): EstruturaLaudo {
  const { sistema, primeiroNome, config } = opcoes;
  const todosGrupos = [...GRUPOS, ...gruposExtras(config)];
  const usadas = new Set<string>();

  // ---- seção 5: instrumentos ----
  const unicos = new Map<string, AplicacaoLaudo>();
  for (const a of [...apps].sort((x, y) => y.dataSessao.getTime() - x.dataSessao.getTime())) if (!unicos.has(norm(a.sigla))) unicos.set(norm(a.sigla), a);
  const linhaInstr = (a: AplicacaoLaudo) => `- **${nomeParaLaudo(a.sigla, a.nome)};** ${descricaoParaLaudo(a.sigla, a.descricao)}`.trim();
  const principais = [...unicos.values()].filter((a) => !COMPLEMENTARES.has(a.sigla) && !COMPLEMENTARES.has(a.sigla.replace(/-(ADULTOS|ESCOLAR|PRE-ESCOLAR)$/, "")));
  const complementares = [...unicos.values()].filter((a) => !principais.includes(a));
  const procedimento = [
    ...principais.map(linhaInstr),
    "## Instrumentos clínicos complementares",
    "- Observação qualitativa clínica;",
    "- Entrevista de anamnese",
    ...complementares.map(linhaInstr),
  ].join("\n");

  // ---- seção 7: análise por domínio ----
  const blocos: string[] = [];
  for (const dom of dominiosDoModelo(config)) {
    const grupos = todosGrupos.filter((g) => g.dominio === dom.chave);
    const partes: string[] = [];
    const sintese: Array<{ rotulo: string; p: number }> = [];
    for (const g of grupos) {
      const linhas: string[] = [];
      for (const item of g.itens) {
        const app = maisRecente(apps, item.teste);
        if (!app) continue;
        const p = percentilDe(app, item.fonte);
        if (p === null) continue;
        usadas.add(norm(app.sigla));
        linhas.push(linhaDoItem(item, p, sistema));
        if (g.sintese) sintese.push({ rotulo: item.rotulo ?? item.descricao, p });
      }
      const tokens = (g.blocos ?? []).filter((b) => maisRecente(apps, b.teste)).map((b) => { usadas.add(norm(maisRecente(apps, b.teste)!.sigla)); return `[[${b.token}]]`; });
      if (linhas.length === 0 && tokens.length === 0) continue;
      if (g.intro) partes.push(g.intro);
      partes.push(...linhas, ...tokens);
    }
    if (partes.length === 0) continue;
    if (sintese.length > 0) {
      const ruins = sintese.filter((s) => abaixoDaMedia(s.p)).map((s) => s.rotulo.toLowerCase());
      const todos = [...new Set(sintese.map((s) => s.rotulo.toLowerCase()))];
      partes.push(
        ruins.length > 0
          ? `De acordo com os resultados acima, ${primeiroNome} apresenta dificuldades em ${[...new Set(ruins)].join(", ")}.`
          : `De acordo com os resultados acima, ${primeiroNome} não apresenta dificuldades. Resultados dentro do esperado foram encontrados em ${todos.join(", ")}.`
      );
    }
    // [[interpretacao:domínio]] marca onde entra a interpretação escrita pelo profissional (fica guardada à parte e sobrevive a "montar de novo")
    blocos.push([`## ${dom.titulo}`, dom.intro && !grupos.some((g) => g.intro) ? dom.intro : "", ...partes, `[[interpretacao:${dom.chave}]]`].filter(Boolean).join("\n"));
  }
  const semMapa = [...unicos.values()].filter((a) => !usadas.has(norm(a.sigla))).map((a) => a.nome);

  // ---- seção 10: referências (uma por teste usado, ordem alfabética) ----
  const referencias = [...new Set([...unicos.values()].map((a) => referenciaParaLaudo(a.referenciaBibliografica)).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")).join("\n");

  return { procedimento, analise: blocos.join("\n\n"), referencias, semMapa };
}
