// Dados do WISC-IV para o seed. Fonte única: docs/testes/WISC-IV-planilha.json (gerado pelos scripts
// gerar-wisc4-*.mjs a partir da planilha da psicóloga). O cálculo está em src/lib/wisc4.ts.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { WISC4_LABEL_SUBTESTE, WISC4_PRINCIPAIS, WISC4_SUPLEMENTARES } from "./wisc4-normas";

const arquivo = join(__dirname, "..", "..", "..", "docs", "testes", "WISC-IV-planilha.json");
const planilha = JSON.parse(readFileSync(arquivo, "utf8")) as Record<string, unknown>;

// Ordem de lançamento: 10 principais, 5 suplementares e os escores de processo (que não entram nos índices).
export const WISC4_PLANILHA_CAMPOS = [
  ...WISC4_PRINCIPAIS.map((chave) => ({ chave, label: `${chave.toUpperCase()} — ${WISC4_LABEL_SUBTESTE[chave]} (principal, escore bruto)` })),
  ...WISC4_SUPLEMENTARES.map((chave) => ({ chave, label: `${chave.toUpperCase()} — ${WISC4_LABEL_SUBTESTE[chave]} (suplementar, escore bruto)` })),
  { chave: "cusb", label: "CUSB — Cubos sem Tempo de Bônus (escore de processo, bruto)" },
  { chave: "diod", label: "DIOD — Dígitos em Ordem Direta (escore de processo, bruto)" },
  { chave: "dioi", label: "DIOI — Dígitos em Ordem Inversa (escore de processo, bruto)" },
  { chave: "caa", label: "CAA — Cancelamento Aleatório (escore de processo, bruto)" },
  { chave: "cae", label: "CAE — Cancelamento Estruturado (escore de processo, bruto)" },
  { chave: "udiod", label: "UDIOD — Maior Sequência de Dígitos, Ordem Direta (escore de processo, bruto)" },
  { chave: "udioi", label: "UDIOI — Maior Sequência de Dígitos, Ordem Inversa (escore de processo, bruto)" },
];

export const WISC4_PLANILHA_CALCULADOS = [
  { chave: "icv", label: "Índice de Compreensão Verbal (ICV)" },
  { chave: "iop", label: "Índice de Organização Perceptual (IOP)" },
  { chave: "imo", label: "Índice de Memória Operacional (IMO)" },
  { chave: "ivp", label: "Índice de Velocidade de Processamento (IVP)" },
  { chave: "qit", label: "QI Total (QIT)" },
  { chave: "gai", label: "Índice de Habilidade Geral (GAI)" },
  { chave: "cpi", label: "Índice de Proficiência Cognitiva (CPI)" },
];

// Uma única tabela cobre as 33 faixas de 4 meses: a faixa é escolhida por DIAS de vida dentro do cálculo.
export const WISC4_PLANILHA_CONVERSAO = { tipo: "wisc4_planilha", ...planilha };
export const WISC4_PLANILHA_IDADE_MIN = 6;
export const WISC4_PLANILHA_IDADE_MAX = 16;
