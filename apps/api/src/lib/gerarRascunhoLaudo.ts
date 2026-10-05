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

// Como cada tipo de respondente é descrito para a IA. Só o PAPEL, nunca o nome: o nome do
// informante é dado pessoal de um terceiro e não acrescenta nada à análise clínica — mesma regra
// já aplicada a CPF/endereço do paciente (ver CLAUDE.md, "Fluxo da chamada de IA").
export const DESCRICAO_RESPONDENTE: Record<string, string> = {
  PACIENTE: "o próprio paciente",
  MAE: "a mãe",
  PAI: "o pai",
  CONJUGE: "o cônjuge/parceiro(a)",
  FILHO: "um(a) filho(a)",
  IRMAO: "um(a) irmão/irmã",
  CUIDADOR: "um cuidador/responsável",
  PROFESSOR: "um(a) professor(a)",
  PROFISSIONAL: "outro profissional que acompanha o paciente",
  OUTRO: "outro informante",
};

export interface TesteAplicadoResumo {
  sigla: string;
  dominio: string;
  resultadoCalculado: unknown;
  // Quem respondeu, quando NÃO foi o próprio paciente. Sem isto, dois lançamentos do mesmo
  // instrumento por informantes diferentes chegam indistinguíveis na IA, que então os funde num
  // único parágrafo — e some justamente a discrepância entre informantes, que é achado clínico.
  respondente?: string;
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

  return `Você é um assistente de redação técnica que ajuda psicólogos a montar o RASCUNHO das seções "Análise" e "Conclusão" de um Laudo Psicológico com enfoque neuropsicológico (Resolução CFP nº 06/2019), a partir de resultados de testes já calculados e da anamnese do paciente.

Regras obrigatórias:
- Você NUNCA afirma um diagnóstico fechado. Toda hipótese diagnóstica precisa vir com ressalva técnica e menção explícita de que cabe validação e revisão do profissional responsável.
- Este é sempre um RASCUNHO — nunca um texto final. O profissional sempre revisa, edita e assina antes de qualquer uso.
- Cruze os resultados de TODOS os testes fornecidos com a anamnese/descrição da demanda para produzir uma análise clínica integrada, não uma lista de resultados teste a teste.
- Escreva em português do Brasil, tom técnico.
- Ao citar um resultado, use exatamente o percentil e a classificação já presentes em "resultadoCalculado" (não invente rótulos de classificação novos nem recalcule percentis).

Formato de "analise" (siga esta convenção — é o padrão real de laudo usado nesta clínica):
- Organize por domínio cognitivo/emocional, um subtítulo markdown "## " por domínio, cobrindo apenas os domínios para os quais há teste na bateria informada (ex.: "## Funções Intelectuais", "## Linguagem", "## Memória", "## Funções Executivas", "## Funções Atencionais", "## Aspectos Emocionais", "## Aspectos Psicoafetivos/Personalidade", "## Outras Escalas" — adapte os títulos aos domínios realmente presentes).
- Dentro de cada subtítulo, uma frase breve situando o construto avaliado, seguida de bullets ("- ") citando o(s) resultado(s) (percentil + classificação) de cada teste/subteste daquele domínio, e uma frase de síntese indicando se o resultado está dentro do esperado ou representa dificuldade.
- Alguns resultados trazem o campo "respondente": são escalas respondidas por um informante SOBRE o paciente, não aplicadas nele. Nunca funda resultados de respondentes diferentes do mesmo instrumento numa afirmação só, nem tire média entre eles — atribua cada resultado a quem respondeu ("na percepção da mãe...", "segundo o professor..."). Quando o mesmo instrumento for respondido por mais de uma pessoa e os resultados divergirem, aponte a divergência explicitamente e trate-a como achado a ser interpretado (pode indicar que a dificuldade é específica de um contexto), nunca como erro de medida.

Formato de "conclusao" (mesma convenção):
- Parágrafo(s) de síntese integrando os achados de todos os domínios com a anamnese.
- Subtítulo "## Hipótese Diagnóstica": se e somente se os dados sustentarem, cite a hipótese com o código CID-10 correspondente, sempre com a ressalva de que cabe validação por profissional habilitado e/ou médico quando aplicável. Nunca afirme com certeza absoluta.
- Subtítulo "## Sugestões e Encaminhamentos": bullets ("- ") com recomendações práticas (ex.: reavaliação em X meses, encaminhamentos, acompanhamento terapêutico) coerentes com os achados.
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
