// Testes do "motor de planilha": cada arquivo docs/testes/planilha/<SIGLA>.json (gerado por scripts/construir-teste-planilha.ts) vira
// um Teste do catálogo com UMA tabela normativa cuja conversão é a definição completa (tipo "planilha"). O cálculo roda em
// src/lib/planilha/motor.ts.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DominioCognitivo } from "@prisma/client";

const pasta = join(__dirname, "..", "..", "..", "docs", "testes", "planilha");

export interface TesteSeedPlanilha {
  nome: string;
  sigla: string;
  dominio: DominioCognitivo;
  descricao: string;
  algoritmoCorrecao: Record<string, unknown>;
  referenciaBibliografica: string;
  isPlaceholder: false;
  direcao: "MAIOR_MELHOR";
  tabelasNormativas: Array<{ criterio: string; faixaMin: number; faixaMax: number; conversao: Record<string, unknown> }>;
}

export function carregarTestesPlanilha(): TesteSeedPlanilha[] {
  return readdirSync(pasta)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => {
      const d = JSON.parse(readFileSync(join(pasta, f), "utf8")) as Record<string, any>;
      const { nome, dominio, descricao, referencia, idade, _fonte, ...def } = d;
      void _fonte;
      return {
        nome,
        sigla: def.sigla,
        dominio: dominio as DominioCognitivo,
        descricao,
        algoritmoCorrecao: {
          aviso: "Cálculo executado a partir das fórmulas da planilha da psicóloga (motor de planilha). Campos em branco não entram no cálculo.",
          campos: def.entradas.map((e: { chave: string; rotulo: string }) => ({ chave: e.chave, label: e.rotulo })),
          camposCalculados: def.saidas.map((s: { chave: string; rotulo: string }) => ({ chave: s.chave, label: s.rotulo })),
          // Layout da tela genérica (entradas por grupo, opções e tabelas de resultado)
          layout: { entradas: def.entradas, opcoes: def.opcoes, tabelas: def.tabelas },
        },
        referenciaBibliografica: referencia ?? "",
        isPlaceholder: false as const,
        direcao: "MAIOR_MELHOR" as const,
        tabelasNormativas: [{ criterio: "geral", faixaMin: idade[0], faixaMax: idade[1], conversao: def }],
      };
    });
}
