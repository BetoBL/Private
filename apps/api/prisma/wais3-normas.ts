// Dados do WAIS-III para o seed. Como no WISC-IV, a fonte única é o JSON em `docs/testes/`
// (WAIS-III-planilha.json, gerado por scripts/gerar-wais3-planilha.mjs a partir da planilha da
// psicóloga); este módulo só o lê e monta os campos do catálogo. O cálculo está em src/lib/wais3.ts.
import { readFileSync } from "node:fs";
import { join } from "node:path";

const arquivo = join(__dirname, "..", "..", "..", "docs", "testes", "WAIS-III-planilha.json");
const planilha = JSON.parse(readFileSync(arquivo, "utf8")) as {
  _fonte: string;
  bandasEtarias: Array<{ rotulo: string; diasMin: number; anosMin: number; anosMax: number }>;
  subtestes: Array<{ chave: string; label: string }>;
  indices: Record<string, string>;
} & Record<string, unknown>;

// Ordem de lançamento = ordem da planilha (linhas 10-23).
export const WAIS3_CAMPOS = planilha.subtestes.map((s) => ({ chave: s.chave, label: s.label }));

export const WAIS3_CAMPOS_CALCULADOS = [
  { chave: "icv", label: planilha.indices.icv },
  { chave: "iop", label: planilha.indices.iop },
  { chave: "imo", label: planilha.indices.imo },
  { chave: "ivp", label: planilha.indices.ivp },
  { chave: "qit", label: planilha.indices.qit },
  { chave: "qiv", label: planilha.indices.qiv },
  { chave: "qie", label: planilha.indices.qie },
  { chave: "gai", label: planilha.indices.gai },
];

// Uma única TabelaNormativa cobre as 8 faixas etárias: a planilha escolhe a faixa por DIAS de vida,
// e isso acontece dentro do cálculo (contexto.idadeDias), não em escolherTabelaNormativa.
export const WAIS3_CONVERSAO = { tipo: "wais3_planilha", ...planilha };
export const WAIS3_IDADE_MIN = planilha.bandasEtarias[0].anosMin;
export const WAIS3_IDADE_MAX = planilha.bandasEtarias[planilha.bandasEtarias.length - 1].anosMax;
