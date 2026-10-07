import type { Teste } from "./api";

// Testes que têm componentes customizados com abas específicas.
// Resto usa TesteGenerico.
export const TESTES_CUSTOMIZADOS = new Set(["WAIS-III", "WISC-IV", "WASI"]);

/**
 * Retorna o nome do componente que deve renderizar este teste.
 * Usado para escolher entre TesteGenerico ou Teste[Sigla].
 *
 * @param teste - Teste a renderizar
 * @returns "generico" ou o nome do componente específico (ex: "waisIII")
 */
export function escolherComponenteTeste(teste: Teste): "generico" | "waisIII" | "wiscIV" | "wasi" | "planilha" {
  switch (teste.sigla) {
    case "WAIS-III":
      return "waisIII";
    case "WISC-IV":
      return "wiscIV";
    case "WASI":
      return "wasi";
    default:
      // testes do motor de planilha trazem o layout no próprio catálogo
      return (teste.algoritmoCorrecao as unknown as { layout?: unknown }).layout ? "planilha" : "generico";
  }
}

/**
 * Descreve o layout de uma aba dentro de um teste customizado.
 */
export interface ConfiguracaoAba {
  id: string;
  label: string;
  tipo: "entrada" | "tabela" | "analise" | "grafico" | "matriz";
  conteudo?: unknown;
}

/**
 * Retorna as abas que o teste deve mostrar.
 * (Pode vir do BD no futuro; por agora está hardcoded.)
 */
export function obterAbasPorTeste(sigla: string): ConfiguracaoAba[] {
  switch (sigla) {
    case "WAIS-III":
      return [
        { id: "brutos", label: "1. Escores Brutos", tipo: "entrada" },
        { id: "ponderados", label: "2. Ponderados", tipo: "tabela" },
        { id: "indices", label: "3. Índices Compostos", tipo: "tabela" },
        { id: "facilidades", label: "4. Facilidades/Dificuldades", tipo: "grafico" },
        { id: "intraindividual", label: "5. Análise Intraindividual", tipo: "analise" },
        { id: "clusters", label: "6. Clusters", tipo: "analise" },
        { id: "processo", label: "7. Escores de Processo", tipo: "tabela" },
        { id: "habilidades", label: "8. Habilidades", tipo: "matriz" },
      ];
    case "WISC-IV":
      return [
        { id: "brutos", label: "1. Escores Brutos", tipo: "entrada" },
        { id: "ponderados", label: "2. Ponderados", tipo: "tabela" },
        { id: "indices", label: "3. Índices Compostos", tipo: "tabela" },
        { id: "facilidades", label: "4. Facilidades/Dificuldades", tipo: "grafico" },
        { id: "intraindividual", label: "5. Análise Intraindividual", tipo: "analise" },
      ];
    default:
      // Testes genéricos não têm abas — só uma entrada + resultado
      return [];
  }
}
