import { anthropic } from "./anthropic";

// Ver política de placeholder na memória do projeto (project_placeholder_tests_policy):
// o aviso precisa viajar dentro do texto gerado, não só como badge de UI.
export const AVISO_PLACEHOLDER_LAUDO = "[RASCUNHO DE TESTE — BASEADO EM DADOS PROVISÓRIOS, NÃO CLÍNICOS]";

// JSON Schema puro (não Zod — o projeto está em Zod v3 e o helper zodOutputFormat do SDK exige v4).
const RASCUNHO_LAUDO_JSON_SCHEMA = {
  type: "object",
  properties: {
    analise: { type: "string" },
    conclusao: { type: "string" },
  },
  required: ["analise", "conclusao"],
  additionalProperties: false,
} as const;

interface RascunhoLaudo {
  analise: string;
  conclusao: string;
}

export interface TesteAplicadoResumo {
  sigla: string;
  dominio: string;
  resultadoCalculado: unknown;
}

export interface PerfilAtuacaoResumo {
  abordagemTeorica: string | null;
  tomDeEscrita: string | null;
  regrasDePrudencia: string | null;
  vocabularioRecorrente: string | null;
}

export interface GerarRascunhoLaudoInput {
  anamnese: unknown;
  descricaoDemanda: string;
  testesAplicados: TesteAplicadoResumo[];
  perfilDeAtuacao: PerfilAtuacaoResumo | null;
  contemTestePlaceholder: boolean;
}

function montarSystemPrompt(input: GerarRascunhoLaudoInput): string {
  const perfil = input.perfilDeAtuacao;
  const linhasPerfil = [
    perfil?.abordagemTeorica && `- Abordagem teórica do profissional: ${perfil.abordagemTeorica}`,
    perfil?.tomDeEscrita && `- Tom de escrita preferido pelo profissional: ${perfil.tomDeEscrita}`,
    perfil?.regrasDePrudencia && `- Regras de prudência clínica definidas pelo profissional: ${perfil.regrasDePrudencia}`,
    perfil?.vocabularioRecorrente && `- Vocabulário/expressões recorrentes do profissional: ${perfil.vocabularioRecorrente}`,
  ].filter(Boolean);

  return `Você é um assistente de redação técnica que ajuda psicólogos a montar o RASCUNHO das seções "Análise" e "Conclusão" de um Laudo Psicológico (Resolução CFP nº 06/2019), a partir de resultados de testes já calculados e da anamnese do paciente.

Regras obrigatórias:
- Você NUNCA afirma um diagnóstico fechado. Toda hipótese diagnóstica precisa vir com ressalva técnica e menção explícita de que cabe validação e revisão do profissional responsável.
- Este é sempre um RASCUNHO — nunca um texto final. O profissional sempre revisa, edita e assina antes de qualquer uso.
- Cruze os resultados de TODOS os testes fornecidos com a anamnese/descrição da demanda para produzir uma análise clínica integrada, não uma lista de resultados teste a teste.
- Escreva em português do Brasil, tom técnico.
${linhasPerfil.length > 0 ? linhasPerfil.join("\n") : ""}
${
  input.contemTestePlaceholder
    ? `- ATENÇÃO CRÍTICA: um ou mais testes usados nesta bateria têm dados PROVISÓRIOS/placeholder (algoritmo e normas simplificados só para validar o fluxo técnico, não validados clinicamente). Você DEVE abrir o campo "analise" exatamente com o texto "${AVISO_PLACEHOLDER_LAUDO}" antes de qualquer outra frase.`
    : ""
}`;
}

function montarUserPrompt(input: GerarRascunhoLaudoInput): string {
  return `Descrição da demanda:
${input.descricaoDemanda}

Anamnese:
${JSON.stringify(input.anamnese ?? {}, null, 2)}

Testes aplicados e resultados já calculados (percentis/escores/classificações — não são escores brutos):
${JSON.stringify(input.testesAplicados, null, 2)}

Gere o rascunho de "Análise" (interpretação técnica integrada dos dados) e "Conclusão" (resposta à demanda, com fundamentação técnico-científica e as ressalvas apropriadas).`;
}

export async function gerarRascunhoLaudo(input: GerarRascunhoLaudoInput): Promise<RascunhoLaudo> {
  const response = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 4096,
    output_config: {
      effort: "high",
      format: { type: "json_schema", schema: RASCUNHO_LAUDO_JSON_SCHEMA },
    },
    system: montarSystemPrompt(input),
    messages: [{ role: "user", content: montarUserPrompt(input) }],
  });

  const textBlock = response.content.find((bloco) => bloco.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("A IA não retornou texto");
  }

  return JSON.parse(textBlock.text) as RascunhoLaudo;
}
