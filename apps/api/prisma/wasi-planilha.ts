// Dados do WASI para o seed. Fonte única: docs/testes/WASI-planilha.json (gerado por scripts/gerar-wasi-planilha.mjs a partir da
// planilha da psicóloga). O cálculo está em src/lib/wasi.ts.
import { readFileSync } from "node:fs";
import { join } from "node:path";

const arquivo = join(__dirname, "..", "..", "..", "docs", "testes", "WASI-planilha.json");
const planilha = JSON.parse(readFileSync(arquivo, "utf8")) as Record<string, unknown>;

export const WASI_PLANILHA_CAMPOS = [
  { chave: "vc", label: "VC — Vocabulário (escore bruto)" },
  { chave: "cb", label: "CB — Cubos (escore bruto)" },
  { chave: "sm", label: "SM — Semelhanças (escore bruto)" },
  { chave: "rm", label: "RM — Raciocínio Matricial (escore bruto)" },
];

export const WASI_PLANILHA_CALCULADOS = [
  { chave: "qiv", label: "QI Verbal (VC + SM)" },
  { chave: "qie", label: "QI de Execução (CB + RM)" },
  { chave: "qit4", label: "QI Total — 4 subtestes" },
  { chave: "qit2", label: "QI Total — 2 subtestes (VC + RM)" },
];

// Uma única tabela cobre as 45 faixas etárias (6:0 a 85+): a faixa é escolhida por DIAS de vida dentro do cálculo.
export const WASI_PLANILHA_CONVERSAO = { tipo: "wasi_planilha", ...planilha };
export const WASI_PLANILHA_IDADE_MIN = 6;
export const WASI_PLANILHA_IDADE_MAX = 89;
