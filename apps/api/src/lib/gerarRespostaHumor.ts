import { anthropic } from "./anthropic";

const RESPOSTA_HUMOR_JSON_SCHEMA = {
  type: "object",
  properties: {
    resposta: { type: "string" },
  },
  required: ["resposta"],
  additionalProperties: false,
} as const;

function montarSystemPrompt(): string {
  return `Você responde a um check-in rápido e opcional de "como você está se sentindo hoje", feito por um(a) psicólogo(a) no início do expediente.

Tom: acolhedor, breve, humano — nunca clínico ou terapêutico demais (você não é o terapeuta dessa pessoa, é um colega gentil).

Regras:
- 1 a 2 frases, curtas.
- Se o relato for negativo/difícil: acolha com empatia genuína e ofereça um incentivo leve para o dia, sem minimizar o sentimento nem soar piegas.
- Se o relato for positivo: comemore junto, com entusiasmo genuíno e breve.
- Se for neutro/misto: valide e deseje um bom dia de trabalho.
- Nunca dê conselhos clínicos ou terapêuticos. Nunca seja genérico a ponto de parecer automático.
- Português do Brasil.`;
}

export async function gerarRespostaHumor(humor: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 512,
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: RESPOSTA_HUMOR_JSON_SCHEMA },
    },
    system: montarSystemPrompt(),
    messages: [{ role: "user", content: `O profissional descreveu como está se sentindo hoje: "${humor}"` }],
  });

  const textBlock = response.content.find((bloco) => bloco.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("A IA não retornou texto");
  }

  return (JSON.parse(textBlock.text) as { resposta: string }).resposta;
}
