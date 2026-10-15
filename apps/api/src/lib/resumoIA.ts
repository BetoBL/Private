import { anthropic } from "./anthropic";

// Resumos por IA para o prontuário. Sempre RASCUNHO: o profissional lê, edita e decide. A IA não diagnostica, não inventa e usa só o que foi enviado.
// O modelo pode ser trocado por MODELO_IA no servidor sem mexer no código.
const MODELO = () => process.env.MODELO_IA || "claude-sonnet-5-5";

const REGRAS = `Regras que valem sempre:
- Use SOMENTE o que está nos dados enviados. Não invente fatos, falas, datas, medicamentos ou resultados.
- Não dê diagnóstico, não prescreva e não faça previsão. Descreva o observado e, quando útil, hipóteses de trabalho marcadas como "a confirmar".
- Se algo estiver ausente ou ambíguo, escreva "não informado" ou "[conferir]" em vez de completar.
- Português do Brasil, linguagem técnica clara e sóbria, sem adjetivos desnecessários, sem emojis.
- O texto é um rascunho para o profissional revisar; ele é o responsável pelo registro.`;

async function pedirJson<T>(sistema: string, usuario: string, schema: object, maxTokens: number): Promise<T> {
  const r = await anthropic.messages.create({
    model: MODELO(),
    max_tokens: maxTokens,
    output_config: { effort: "medium", format: { type: "json_schema", schema } },
    system: sistema,
    messages: [{ role: "user", content: usuario }],
  } as never) as { content: Array<{ type: string; text?: string }>; stop_reason?: string };
  const texto = r.content.filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
  if (!texto) throw new Error("A IA não devolveu texto.");
  return JSON.parse(texto) as T;
}

// ---- resumo de UMA sessão ----
export interface EntradaSessao {
  modeloRotulo: string;
  campos: Array<{ chave: string; rotulo: string; dica: string; lista?: boolean }>;
  camposAtuais: Record<string, string | string[]>;
  anotacoes: string;
  paciente: { primeiroNome: string; idade: number | null };
  planosEmAndamento: string[];
}
export interface SaidaSessao { evolucao: string; campos: Array<{ chave: string; texto: string }>; sugestoes: Array<{ tipo: "PLANO" | "TOPICO"; texto: string }> }

export function resumirSessao(e: EntradaSessao): Promise<SaidaSessao> {
  const schema = {
    type: "object",
    properties: {
      evolucao: { type: "string" },
      campos: { type: "array", items: { type: "object", properties: { chave: { type: "string" }, texto: { type: "string" } }, required: ["chave", "texto"], additionalProperties: false } },
      sugestoes: { type: "array", items: { type: "object", properties: { tipo: { type: "string", enum: ["PLANO", "TOPICO"] }, texto: { type: "string" } }, required: ["tipo", "texto"], additionalProperties: false } },
    },
    required: ["evolucao", "campos", "sugestoes"],
    additionalProperties: false,
  };
  const sistema = `Você ajuda um(a) profissional de saúde a transformar as anotações rápidas que fez DURANTE a sessão em um registro de evolução do prontuário.

Entregue:
1. "evolucao": o texto corrido da evolução da sessão (de 1 a 4 parágrafos curtos), fiel às anotações.
2. "campos": para cada campo do modelo "${e.modeloRotulo}" que as anotações permitam preencher, um item com a "chave" exata do campo e o "texto". Campos de lista devem vir com um item por linha. Não inclua campo sem base nas anotações.
3. "sugestoes": até 4 itens para a continuidade do cuidado. "PLANO" é algo que o paciente ou o profissional vai fazer; "TOPICO" é algo a retomar na próxima sessão. Só o que as anotações sustentam.

${REGRAS}`;
  const usuario = `Paciente: ${e.paciente.primeiroNome}${e.paciente.idade != null ? `, ${e.paciente.idade} anos` : ""}

Campos do modelo (chave | nome | o que registrar):
${e.campos.map((c) => `${c.chave} | ${c.rotulo}${c.lista ? " (lista)" : ""} | ${c.dica}`).join("\n")}

Campos já preenchidos pelo profissional (não sobrescreva):
${Object.keys(e.camposAtuais).length ? JSON.stringify(e.camposAtuais) : "(nenhum)"}

Planos já em andamento (não repita):
${e.planosEmAndamento.length ? e.planosEmAndamento.map((p) => `- ${p}`).join("\n") : "(nenhum)"}

Anotações da sessão:
"""
${e.anotacoes}
"""`;
  return pedirJson<SaidaSessao>(sistema, usuario, schema, 3000);
}

// ---- resumo do CASO (visão longitudinal) ----
export interface EntradaCaso {
  paciente: { primeiroNome: string; idade: number | null };
  sessoes: Array<{ data: string; modelo: string; texto: string }>;
  escalas: Array<{ data: string; escala: string; resultado: string }>;
  diario: { dias: number; registros: number; porEmocao: Array<{ emocao: string; vezes: number }>; intensos: number } | null;
  continuidade: Array<{ tipo: string; texto: string }>;
}
export interface SaidaCaso { resumo: string; evolucaoDoQuadro: string; pontosDeAtencao: string[]; perguntasProximaSessao: string[] }

export function resumirCaso(e: EntradaCaso): Promise<SaidaCaso> {
  const lista = { type: "array", items: { type: "string" } };
  const schema = {
    type: "object",
    properties: { resumo: { type: "string" }, evolucaoDoQuadro: { type: "string" }, pontosDeAtencao: lista, perguntasProximaSessao: lista },
    required: ["resumo", "evolucaoDoQuadro", "pontosDeAtencao", "perguntasProximaSessao"],
    additionalProperties: false,
  };
  const sistema = `Você prepara, para um(a) profissional de saúde, uma visão resumida do caso de um paciente a partir do histórico registrado.

Entregue:
- "resumo": de 1 a 3 parágrafos curtos com o panorama do acompanhamento até aqui.
- "evolucaoDoQuadro": 2 a 5 frases sobre o que mudou ao longo do tempo (melhora, piora, estabilidade), citando as escalas e o Diário quando houver dado.
- "pontosDeAtencao": até 5 itens objetivos (riscos, padrões que se repetem, planos parados). Se houver sofrimento intenso no Diário ou resposta crítica em escala, o primeiro item deve apontar isso.
- "perguntasProximaSessao": de 3 a 6 perguntas abertas que o profissional pode fazer na próxima sessão, ligadas ao que apareceu nos dados.

${REGRAS}`;
  const usuario = `Paciente: ${e.paciente.primeiroNome}${e.paciente.idade != null ? `, ${e.paciente.idade} anos` : ""}

Sessões finalizadas (da mais antiga para a mais recente):
${e.sessoes.length ? e.sessoes.map((s) => `[${s.data}] (${s.modelo}) ${s.texto}`).join("\n\n") : "(nenhuma ainda)"}

Escalas respondidas:
${e.escalas.length ? e.escalas.map((s) => `[${s.data}] ${s.escala}: ${s.resultado}`).join("\n") : "(nenhuma)"}

Diário emocional:
${e.diario ? `${e.diario.registros} registros em ${e.diario.dias} dias; emoções mais frequentes: ${e.diario.porEmocao.map((x) => `${x.emocao} (${x.vezes})`).join(", ") || "nenhuma"}; registros de sofrimento intenso: ${e.diario.intensos}` : "(sem registros)"}

Planos e tópicos em andamento:
${e.continuidade.length ? e.continuidade.map((c) => `- ${c.tipo === "PLANO" ? "Plano" : "Tópico"}: ${c.texto}`).join("\n") : "(nenhum)"}`;
  return pedirJson<SaidaCaso>(sistema, usuario, schema, 3000);
}
