// Motor de planilha: executa, dentro do sistema, as fórmulas da aba do teste na planilha da psicóloga (definição gerada por
// scripts/construir-teste-planilha.ts a partir de uma "spec" por teste). O avaliador (./avaliador.ts) é o mesmo validado contra
// WAIS-III, WISC-IV e WASI. Defeitos da planilha são corrigidos EDITANDO a fórmula na spec (campo `correcoes`), não aqui.
import { Err, Planilhas } from "./avaliador";

export interface CelulaPlanilha {
  c: string;
  v: unknown;
  f: string | null;
  s: string | null;
  t: string | null;
}

export interface EntradaPlanilha {
  chave: string;
  celula: string; // na aba do teste
  rotulo: string;
  grupo?: string;
  min?: number;
  max?: number;
}
export interface OpcaoPlanilha {
  chave: string;
  celula: string;
  rotulo: string;
  valores: string[]; // o sistema envia o ÍNDICE (0-based) da opção escolhida
  padrao?: number;
}
export interface SaidaPlanilha {
  chave: string;
  celula: string;
  rotulo: string;
  casas?: number;
}
export interface TabelaPlanilha {
  titulo: string;
  colunas: string[];
  linhas: Array<{ rotulo: string; valores: Array<string | null> }>; // chaves de saída (null = vazio)
}
export interface DefinicaoPlanilha {
  tipo: "planilha";
  versao: string;
  sigla: string;
  aba: string;
  // aba do teste e CADASTRO: células completas; abas de norma: formato compacto por coluna (só valores)
  planilhas: Record<string, { celulas?: CelulaPlanilha[]; colunas?: Record<string, { r0: number; v: Array<string | number | null> }> }>;
  // células da planilha preenchidas pelo sistema: "aba!A1"
  contexto: { dataAplicacao?: string; dataNascimento?: string; escolaridade?: string; sexo?: string; nome?: string; anoSerie?: string };
  entradas: EntradaPlanilha[];
  opcoes: OpcaoPlanilha[];
  saidas: SaidaPlanilha[];
  tabelas: TabelaPlanilha[];
}

export interface ContextoPlanilha {
  dataNascimento?: Date;
  dataReferencia?: Date;
  escolaridade?: string | null;
  sexo?: string | null;
  nome?: string | null;
}

export type ValorSaida = string | number | boolean | null;
export interface ResultadoPlanilha {
  modo: "planilha";
  saidas: Record<string, ValorSaida>;
  erros?: string[];
}

// A planilha só entende 5 níveis de escolaridade; o cadastro do paciente é texto livre, então normaliza (sem acento, por palavra-chave).
export function normalizarEscolaridade(texto: string | null | undefined): string | undefined {
  if (!texto) return undefined;
  const t = texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/\beja\b|jovens e adultos/.test(t)) return "EJA - Ensino de Jovens e Adultos";
  if (/fundamental/.test(t) && /adult/.test(t)) return "FA - Ensino Fundamental de Adultos";
  if (/superior|graduac|faculdade|universit|\bpos\b|mestrado|doutorado|especializ/.test(t)) return "Ensino Superior";
  if (/medio|colegial/.test(t)) return "Ensino Médio";
  if (/fundamental|primario|ginasio|\b[1-9]\s*(o|º)?\s*ano\b/.test(t)) return "Ensino Fundamental";
  return texto;
}

const cache = new Map<string, Planilhas>();
const serial = (d: Date) => Math.round((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(1899, 11, 30)) / 86400000);

// Formato compacto das abas de norma: colunas com linha inicial e valores (números ou texto; null = vazio)
function expandirColunas(colunas: Record<string, { r0: number; v: Array<string | number | null> }>): CelulaPlanilha[] {
  const out: CelulaPlanilha[] = [];
  for (const [col, { r0, v }] of Object.entries(colunas)) {
    v.forEach((x, i) => {
      if (x === null || x === "") return;
      out.push(typeof x === "number" ? { c: `${col}${r0 + i}`, v: String(x), f: null, s: null, t: null } : { c: `${col}${r0 + i}`, v: x, f: null, s: null, t: "s" });
    });
  }
  return out;
}

function motorDe(def: DefinicaoPlanilha): Planilhas {
  const chave = `${def.sigla}:${def.versao}`;
  let p = cache.get(chave);
  if (!p) {
    // abas de norma e auxiliares só têm valores; a aba do teste é avaliada por fórmula
    const soValores = Object.keys(def.planilhas).filter((n) => n !== def.aba && n !== "CADASTRO");
    const abas: Record<string, { celulas: CelulaPlanilha[] }> = {};
    for (const [nome, a] of Object.entries(def.planilhas)) abas[nome] = { celulas: a.celulas ?? expandirColunas(a.colunas ?? {}) };
    p = new (Planilhas as any)(abas, soValores) as Planilhas;
    cache.set(chave, p);
  }
  p.limparEntradas();
  return p;
}

function endereco(def: DefinicaoPlanilha, ref: string): [string, string] {
  const i = ref.indexOf("!");
  return i < 0 ? [def.aba, ref] : [ref.slice(0, i), ref.slice(i + 1)];
}

export function calcularPlanilha(def: DefinicaoPlanilha, escores: Record<string, number>, ctx: ContextoPlanilha): ResultadoPlanilha {
  const p = motorDe(def);
  const por = (ref: string | undefined, valor: unknown) => {
    if (!ref || valor === undefined || valor === null) return;
    const [aba, cel] = endereco(def, ref);
    p.entrada(aba, cel, valor);
  };
  if (ctx.dataReferencia) por(def.contexto.dataAplicacao, serial(ctx.dataReferencia));
  if (ctx.dataNascimento) por(def.contexto.dataNascimento, serial(ctx.dataNascimento));
  por(def.contexto.escolaridade, normalizarEscolaridade(ctx.escolaridade));
  por(def.contexto.sexo, ctx.sexo === "MASCULINO" ? "Masculino" : ctx.sexo === "FEMININO" ? "Feminino" : undefined);
  por(def.contexto.nome, ctx.nome ?? undefined);

  for (const o of def.opcoes) {
    const idx = escores[o.chave] ?? o.padrao ?? 0;
    por(`${def.aba}!${o.celula}`, o.valores[idx] ?? o.valores[0]);
  }
  for (const e of def.entradas) {
    const v = escores[e.chave];
    if (v !== undefined && Number.isFinite(v)) por(`${def.aba}!${e.celula}`, v);
  }

  const saidas: Record<string, ValorSaida> = {};
  const erros: string[] = [];
  for (const s of def.saidas) {
    try {
      const v = p.valor(def.aba, s.celula);
      if (v instanceof Err) { saidas[s.chave] = null; continue; }
      if (v === null || v === "") { saidas[s.chave] = null; continue; }
      saidas[s.chave] = typeof v === "number" && s.casas !== undefined ? Math.round(v * 10 ** s.casas) / 10 ** s.casas : (v as ValorSaida);
    } catch (e) {
      saidas[s.chave] = null;
      erros.push(`${s.chave}: ${(e as Error).message}`);
    }
  }
  return { modo: "planilha", saidas, ...(erros.length ? { erros } : {}) };
}
