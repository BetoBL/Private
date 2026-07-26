import { useEffect, useState } from "react";
import { api, type RespostaPerfil, type SistemaClassificacaoPercentil } from "../lib/api";

const OPCOES_CLASSIFICACAO: Array<{ valor: SistemaClassificacaoPercentil; label: string; ajuda: string }> = [
  {
    valor: "GUILMETTE_2020",
    label: "Guilmette et al. (2020) — consenso AACN",
    ajuda: "Rótulos e cortes percentílicos do consenso da American Academy of Clinical Neuropsychology (padrão internacional).",
  },
  {
    valor: "MIOTTO_2017",
    label: "Miotto (2017)",
    ajuda: "Adaptação usada em manuais de neuropsicologia no Brasil.",
  },
];

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
    opcoes: [
      "Investigação diagnóstica complexa",
      "Devolutiva e vínculo com a família",
      "Impacto direto na vida escolar/social do paciente",
      "Prefiro descrever com minhas palavras",
    ],
  },
];

export function PerfilAtuacao() {
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [form, setForm] = useState(CAMPO_INICIAL);
  const [presetsAtivos, setPresetsAtivos] = useState<Record<string, string[]>>({});
  const [respostas, setRespostas] = useState<Record<string, RespostaPerfil>>({});
  const [sistemaClassificacao, setSistemaClassificacao] = useState<SistemaClassificacaoPercentil>("GUILMETTE_2020");

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
        setSistemaClassificacao(p.sistemaClassificacaoPercentil ?? "GUILMETTE_2020");
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
      await api.salvarPerfilDeAtuacao({ ...form, respostas, sistemaClassificacaoPercentil: sistemaClassificacao });
      setMensagem("Perfil de Atuação salvo.");
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  function alternarPreset(chave: keyof typeof CAMPO_INICIAL, preset: string) {
    const atuais = presetsAtivos[chave] ?? [];
    const novos = atuais.includes(preset) ? atuais.filter((p) => p !== preset) : [...atuais, preset];
    setPresetsAtivos((prev) => ({ ...prev, [chave]: novos }));
    setForm((prev) => ({ ...prev, [chave]: novos.join("; ") }));
  }

  function alternarOpcao(perguntaId: string, opcao: string) {
    setRespostas((prev) => {
      const atuais = prev[perguntaId]?.opcoes ?? [];
      const novas = atuais.includes(opcao) ? atuais.filter((o) => o !== opcao) : [...atuais, opcao];
      return { ...prev, [perguntaId]: { opcoes: novas, complemento: prev[perguntaId]?.complemento ?? "" } };
    });
  }

  function editarComplemento(perguntaId: string, complemento: string) {
    setRespostas((prev) => ({ ...prev, [perguntaId]: { opcoes: prev[perguntaId]?.opcoes ?? [], complemento } }));
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-1 font-serif text-2xl text-ink">Meu Perfil de Atuação</h1>
      <p className="mb-8 max-w-xl text-sm text-ink/60">
        Orienta como a IA redige os rascunhos de laudo no seu estilo — abordagem teórica, tom, vocabulário e cuidados clínicos. Escolha uma
        ou mais sugestões rápidas (elas ficam marcadas) e complete com suas próprias palavras se quiser.
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
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    (presetsAtivos[campo.chave] ?? []).includes(preset)
                      ? "border-sage-deep bg-sage-deep/10 text-sage-deep"
                      : "border-mist text-ink/60 hover:border-sage-deep hover:text-sage-deep"
                  }`}
                  onClick={() => alternarPreset(campo.chave, preset)}
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

      <div className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">Classificação por percentil no laudo</div>
      <p className="mb-2 max-w-xl text-xs text-ink/50">
        Existe mais de uma convenção aceita na área — escolha a que você usa. Isso define a tabela de referência e a citação que aparecem
        no DOCX exportado.
      </p>
      <div className="mb-8 flex flex-col gap-2">
        {OPCOES_CLASSIFICACAO.map((opcao) => (
          <label
            key={opcao.valor}
            className={`flex cursor-pointer flex-col gap-1 rounded-2xl border p-4 ${
              sistemaClassificacao === opcao.valor ? "border-sage-deep bg-sage-deep/5" : "border-mist bg-white"
            }`}
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-ink">
              <input
                type="radio"
                name="sistemaClassificacaoPercentil"
                checked={sistemaClassificacao === opcao.valor}
                onChange={() => setSistemaClassificacao(opcao.valor)}
              />
              {opcao.label}
            </span>
            <span className="text-xs text-ink/50">{opcao.ajuda}</span>
          </label>
        ))}
      </div>

      <div className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">Perfil pessoal (uso interno da clínica)</div>
      <p className="mb-4 max-w-xl text-xs text-ink/50">
        Não entra no laudo. Ajuda a clínica a entender melhor seu jeito de trabalhar para futuras alocações de pacientes. Pode marcar mais
        de uma opção.
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
                    (respostas[pergunta.id]?.opcoes ?? []).includes(opcao)
                      ? "border-sage-deep bg-sage-deep/10 text-sage-deep"
                      : "border-mist text-ink/60 hover:border-sage-deep hover:text-sage-deep"
                  }`}
                  onClick={() => alternarOpcao(pergunta.id, opcao)}
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
