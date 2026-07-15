import { anthropic } from "./anthropic";

const RESUMO_DO_DIA_JSON_SCHEMA = {
  type: "object",
  properties: {
    resumo: { type: "string" },
  },
  required: ["resumo"],
  additionalProperties: false,
} as const;

export interface CasoDoDia {
  pacienteNome: string;
  horario: string;
  tituloEvento: string;
  statusUltimoLaudo: string | null;
  temLaudoAguardandoRevisao: boolean;
}

export interface GerarResumoDoDiaInput {
  profissionalNome: string;
  casosDeHoje: CasoDoDia[];
  totalLaudosAguardandoRevisao: number;
}

function montarSystemPrompt(): string {
  return `Você escreve um resumo curto e humano para abrir o dia de trabalho de um(a) psicólogo(a) numa clínica de avaliação neuropsicológica.

Tom: caloroso, próximo, encorajador — como um colega de confiança que se importa, não como um sistema corporativo. Nunca robótico, nunca genérico demais.

Regras:
- 2 a 4 frases no total. Direto ao ponto, mas com calor humano.
- Cite os pacientes de hoje pelo primeiro nome e, quando fizer sentido, a etapa em que o caso está (ex: "aguardando sua revisão", "primeira sessão", "laudo já finalizado").
- Se não houver nada agendado hoje, reconheça isso de forma leve e positiva (ex: dia mais tranquilo, bom momento para revisar laudos pendentes).
- Nunca invente informação clínica que não foi fornecida.
- Português do Brasil.`;
}

function montarUserPrompt(input: GerarResumoDoDiaInput): string {
  return `Profissional: ${input.profissionalNome}

Casos agendados para hoje:
${input.casosDeHoje.length === 0 ? "(nenhum evento agendado hoje)" : JSON.stringify(input.casosDeHoje, null, 2)}

Total de laudos aguardando revisão do profissional (não necessariamente de hoje): ${input.totalLaudosAguardandoRevisao}

Escreva o resumo de abertura do dia.`;
}

export async function gerarResumoDoDia(input: GerarResumoDoDiaInput): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: RESUMO_DO_DIA_JSON_SCHEMA },
    },
    system: montarSystemPrompt(),
    messages: [{ role: "user", content: montarUserPrompt(input) }],
  });

  const textBlock = response.content.find((bloco) => bloco.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("A IA não retornou texto");
  }

  return (JSON.parse(textBlock.text) as { resumo: string }).resumo;
}
