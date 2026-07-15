import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function PerfilAtuacao() {
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [form, setForm] = useState({
    abordagemTeorica: "",
    tomDeEscrita: "",
    regrasDePrudencia: "",
    vocabularioRecorrente: "",
  });

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
      await api.salvarPerfilDeAtuacao(form);
      setMensagem("Perfil de Atuação salvo.");
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  const campos: Array<{ chave: keyof typeof form; label: string; ajuda: string }> = [
    { chave: "abordagemTeorica", label: "Abordagem teórica", ajuda: "Ex: neuropsicologia cognitivo-comportamental" },
    { chave: "tomDeEscrita", label: "Tom de escrita", ajuda: "Ex: técnico, porém acessível ao leigo" },
    { chave: "regrasDePrudencia", label: "Regras de prudência clínica", ajuda: "Ex: nunca fechar TEA sem encaminhar avaliação médica" },
    { chave: "vocabularioRecorrente", label: "Vocabulário recorrente", ajuda: "Expressões que você costuma usar" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-1 font-serif text-2xl text-ink">Meu Perfil de Atuação</h1>
      <p className="mb-8 max-w-xl text-sm text-ink/60">
        Orienta como a IA redige os rascunhos de laudo no seu estilo — abordagem teórica, tom, vocabulário e cuidados clínicos. Você pode
        ajustar isso a qualquer momento.
      </p>

      {erro && <div className="mb-6 rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
      {mensagem && <div className="mb-6 rounded-lg border border-sage-deep/30 bg-sage-deep/10 px-4 py-3 text-sm text-sage-deep">{mensagem}</div>}

      <div className="flex flex-col gap-4">
        {campos.map((campo) => (
          <div key={campo.chave} className="rounded-2xl border border-mist bg-white p-5">
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-sage-deep">{campo.label}</div>
            <p className="mb-2 text-xs text-ink/50">{campo.ajuda}</p>
            <textarea
              className="w-full rounded-lg border border-mist px-3 py-2 text-sm"
              rows={3}
              value={form[campo.chave]}
              onChange={(e) => setForm((prev) => ({ ...prev, [campo.chave]: e.target.value }))}
            />
          </div>
        ))}
      </div>

      <button className="mt-6 rounded-lg bg-sage-deep px-5 py-2.5 text-sm font-semibold text-paper" onClick={salvar}>
        Salvar perfil
      </button>
    </div>
  );
}
