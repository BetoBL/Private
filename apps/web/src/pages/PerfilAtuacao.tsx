import { useEffect, useState } from "react";
import { api, type RespostaPerfil } from "../lib/api";

const CAMPOS_TECNICOS: Array<{ chave: keyof typeof CAMPO_INICIAL; label: string; ajuda: string; presets: string[] }> = [
  {
    chave: "abordagemTeorica",
    label: "Abordagem teórica",
    ajuda: "Ex: neuropsicologia cognitivo-comportamental",
    presets: ["Neuropsicologia cognitivo-comportamental", "Psicanalítica", "Sistêmica", "Cognitivo-comportamental (TCC)"],
  },
  {
    chave: "tomDeEscrita",
    label: "Tom de escrita",
    ajuda: "Ex: técnico, porém acessível ao leigo",
    presets: ["Técnico e formal", "Técnico, porém acessível ao leigo", "Caloroso e narrativo"],
  },
  {
    chave: "regrasDePrudencia",
    label: "Regras de prudência clínica",
    ajuda: "Ex: nunca fechar TEA sem encaminhar avaliação médica",
    presets: [
      "Nunca fechar hipótese de TEA sem encaminhar para avaliação médica",
      "Sempre sugerir reavaliação em 12 meses para casos limítrofes",
      "Evitar linguagem determinista sobre prognóstico",
    ],
  },
  {
    chave: "vocabularioRecorrente",
    label: "Vocabulário recorrente",
    ajuda: "Expressões que você costuma usar",
    presets: ["Funcionamento executivo", "Perfil cognitivo", "Demandas de aprendizagem"],
  },
];

const CAMPO_INICIAL = {
  abordagemTeorica: "",
  tomDeEscrita: "",
  regrasDePrudencia: "",
  vocabularioRecorrente: "",
};

interface PerguntaPessoal {
  id: string;
  texto: string;
  opcoes: string[];
}

const PERGUNTAS_PESSOAIS: PerguntaPessoal[] = [
  {
    id: "publico_preferido",
    texto: "Com qual público você se sente mais confiante para atender?",
    opcoes: ["Infantil", "Adolescente", "Adulto", "Idoso", "Todos, sem preferência"],
  },
  {
    id: "casos_confianca",
    texto: "Em que tipo de caso você se sente mais confiante?",
    opcoes: ["TDAH", "TEA", "Dificuldades de aprendizagem", "Avaliação cognitiva geral", "Questões emocionais associadas"],
  },
  {
    id: "comunicacao_familia",
    texto: "Como você prefere se comunicar com famílias ansiosas?",
    opcoes: [
      "Explicações bem detalhadas e didáticas",
      "Direto ao ponto, com resumo objetivo",
      "Acolher emocionalmente antes de entrar nos dados técnicos",
    ],
  },
  {
    id: "energiza",
    texto: "O que mais te energiza no seu trabalho?",
    opcoes: ["Investigação diagnóstica complexa", "Devolutiva e vínculo com a família", "Impacto direto na vida escolar/social do paciente", "Prefiro descrever com minhas palavras"],
  },
];

export function PerfilAtuacao() {
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [form, setForm] = useState(CAMPO_INICIAL);
  const [respostas, setRespostas] = useState<Record<string, RespostaPerfil>>({});

  useEffect(() => {
    let cancelado = false;
    api
      .getPerfilDeAtuacao()
      .then((p) => {
        if (cancelado || !p) return;
        setForm({
          abordagemTeorica: p.abordagemTeorica ?? "",
          tomDeEscrita: p.tomDeEscrita ?? "",
          regrasDePrudencia: p.regrasDePrudencia ?? "",
          vocabularioRecorrente: p.vocabularioRecorrente ?? "",
        });
        setRespostas(p.respostas ?? {});
      })
      .catch((e) => !cancelado && setErro(e.message));
    return () => {
      cancelado = true;
    };
  }, []);

  async function salvar() {
    setErro(null);
    setMensagem(null);
    try {
      await api.salvarPerfilDeAtuacao({ ...form, respostas });
      setMensagem("Perfil de Atuação salvo.");
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  function escolherOpcao(perguntaId: string, opcao: string) {
    setRespostas((prev) => ({ ...prev, [perguntaId]: { opcao, complemento: prev[perguntaId]?.complemento ?? "" } }));
  }

  function editarComplemento(perguntaId: string, complemento: string) {
    setRespostas((prev) => ({ ...prev, [perguntaId]: { opcao: prev[perguntaId]?.opcao ?? "", complemento } }));
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-1 font-serif text-2xl text-ink">Meu Perfil de Atuação</h1>
      <p className="mb-8 max-w-xl text-sm text-ink/60">
        Orienta como a IA redige os rascunhos de laudo no seu estilo — abordagem teórica, tom, vocabulário e cuidados clínicos. Escolha uma
        sugestão rápida ou escreva com suas próprias palavras.
      </p>

      {erro && <div className="mb-6 rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
      {mensagem && <div className="mb-6 rounded-lg border border-sage-deep/30 bg-sage-deep/10 px-4 py-3 text-sm text-sage-deep">{mensagem}</div>}

      <div className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">Estilo técnico (usado pela IA)</div>
      <div className="mb-8 flex flex-col gap-4">
        {CAMPOS_TECNICOS.map((campo) => (
          <div key={campo.chave} className="rounded-2xl border border-mist bg-white p-5">
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-sage-deep">{campo.label}</div>
            <p className="mb-2 text-xs text-ink/50">{campo.ajuda}</p>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {campo.presets.map((preset) => (
                <button
                  key={preset}
                  className="rounded-full border border-mist px-3 py-1 text-xs font-semibold text-ink/60 hover:border-sage-deep hover:text-sage-deep"
                  onClick={() => setForm((prev) => ({ ...prev, [campo.chave]: preset }))}
                >
                  {preset}
                </button>
              ))}
            </div>
            <textarea
              className="w-full rounded-lg border border-mist px-3 py-2 text-sm"
              rows={3}
              placeholder="Ou complete com o que quiser..."
              value={form[campo.chave]}
              onChange={(e) => setForm((prev) => ({ ...prev, [campo.chave]: e.target.value }))}
            />
          </div>
        ))}
      </div>

      <div className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">Perfil pessoal (uso interno da clínica)</div>
      <p className="mb-4 max-w-xl text-xs text-ink/50">
        Não entra no laudo. Ajuda a clínica a entender melhor seu jeito de trabalhar para futuras alocações de pacientes.
      </p>
      <div className="mb-8 flex flex-col gap-4">
        {PERGUNTAS_PESSOAIS.map((pergunta) => (
          <div key={pergunta.id} className="rounded-2xl border border-mist bg-white p-5">
            <div className="mb-2 text-sm font-semibold text-ink">{pergunta.texto}</div>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {pergunta.opcoes.map((opcao) => (
                <button
                  key={opcao}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    respostas[pergunta.id]?.opcao === opcao
                      ? "border-sage-deep bg-sage-deep/10 text-sage-deep"
                      : "border-mist text-ink/60 hover:border-sage-deep hover:text-sage-deep"
                  }`}
                  onClick={() => escolherOpcao(pergunta.id, opcao)}
                >
                  {opcao}
                </button>
              ))}
            </div>
            <input
              className="w-full rounded-lg border border-mist px-3 py-2 text-sm"
              placeholder="Quer completar com suas palavras? (opcional)"
              value={respostas[pergunta.id]?.complemento ?? ""}
              onChange={(e) => editarComplemento(pergunta.id, e.target.value)}
            />
          </div>
        ))}
      </div>

      <button className="mt-2 rounded-lg bg-sage-deep px-5 py-2.5 text-sm font-semibold text-paper" onClick={salvar}>
        Salvar perfil
      </button>
    </div>
  );
}
