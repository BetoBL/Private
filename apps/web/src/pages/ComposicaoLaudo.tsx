import { useEffect, useState } from "react";
import { PlaceholderBadge } from "../components/PlaceholderBadge";
import {
  api,
  type AplicacaoDeTeste,
  type Laudo,
  type Paciente,
  type Profissional,
} from "../lib/api";

const SECOES: Array<{ chave: keyof Pick<Laudo, "descricaoDemanda" | "procedimento" | "analise" | "conclusao" | "referencias">; titulo: string }> = [
  { chave: "descricaoDemanda", titulo: "2. Descrição da demanda" },
  { chave: "procedimento", titulo: "3. Procedimento" },
  { chave: "analise", titulo: "4. Análise" },
  { chave: "conclusao", titulo: "5. Conclusão" },
  { chave: "referencias", titulo: "6. Referências" },
];

export function ComposicaoLaudo() {
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);

  const [pacienteId, setPacienteId] = useState("");
  const [aplicacoes, setAplicacoes] = useState<AplicacaoDeTeste[]>([]);

  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [laudoId, setLaudoId] = useState("");
  const [laudo, setLaudo] = useState<Laudo | null>(null);

  const [novaDemanda, setNovaDemanda] = useState("");
  const [novoProcedimento, setNovoProcedimento] = useState("");

  const [perfilForm, setPerfilForm] = useState({
    abordagemTeorica: "",
    tomDeEscrita: "",
    regrasDePrudencia: "",
    vocabularioRecorrente: "",
  });

  useEffect(() => {
    api.listProfissionais().then(setProfissionais).catch((e) => setErro(e.message));
    api.listPacientes().then(setPacientes).catch((e) => setErro(e.message));
  }, []);

  const profissionalAtual = profissionais[0];

  useEffect(() => {
    if (!profissionalAtual) return;
    api
      .getPerfilDeAtuacao(profissionalAtual.id)
      .then((p) => {
        if (p) {
          setPerfilForm({
            abordagemTeorica: p.abordagemTeorica ?? "",
            tomDeEscrita: p.tomDeEscrita ?? "",
            regrasDePrudencia: p.regrasDePrudencia ?? "",
            vocabularioRecorrente: p.vocabularioRecorrente ?? "",
          });
        }
      })
      .catch((e) => setErro(e.message));
  }, [profissionalAtual]);

  useEffect(() => {
    if (!pacienteId) {
      setLaudos([]);
      setLaudoId("");
      setAplicacoes([]);
      return;
    }
    api.listLaudos(pacienteId).then(setLaudos).catch((e) => setErro(e.message));
    api.listAplicacoesPorPaciente(pacienteId).then(setAplicacoes).catch((e) => setErro(e.message));
  }, [pacienteId]);

  useEffect(() => {
    if (!laudoId) {
      setLaudo(null);
      return;
    }
    const encontrado = laudos.find((l) => l.id === laudoId) ?? null;
    setLaudo(encontrado);
  }, [laudoId, laudos]);

  const paciente = pacientes.find((p) => p.id === pacienteId);
  const contemPlaceholder = aplicacoes.some((a) => a.teste.isPlaceholder);

  async function criarLaudo() {
    if (!paciente || !profissionalAtual || !novaDemanda || !novoProcedimento) return;
    setErro(null);
    try {
      const criado = await api.createLaudo({
        pacienteId: paciente.id,
        profissionalId: profissionalAtual.id,
        identificacao: { paciente: paciente.nome, profissional: profissionalAtual.nome },
        descricaoDemanda: novaDemanda,
        procedimento: novoProcedimento,
      });
      setLaudos((prev) => [criado, ...prev]);
      setLaudoId(criado.id);
      setNovaDemanda("");
      setNovoProcedimento("");
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function salvarSecao(chave: keyof Laudo, valor: string) {
    if (!laudo) return;
    setErro(null);
    try {
      const atualizado = await api.updateLaudo(laudo.id, { [chave]: valor } as Partial<Laudo>);
      setLaudo(atualizado);
      setLaudos((prev) => prev.map((l) => (l.id === atualizado.id ? atualizado : l)));
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function gerarRascunho() {
    if (!laudo) return;
    setErro(null);
    setMensagem(null);
    setGerando(true);
    try {
      const atualizado = await api.gerarRascunho(laudo.id);
      setLaudo(atualizado);
      setLaudos((prev) => prev.map((l) => (l.id === atualizado.id ? atualizado : l)));
      setMensagem("Rascunho gerado. Revise antes de finalizar.");
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setGerando(false);
    }
  }

  async function alternarRevisao(valor: boolean) {
    if (!laudo) return;
    setErro(null);
    try {
      const atualizado = await api.updateLaudo(laudo.id, { iaRevisadaPeloProf: valor });
      setLaudo(atualizado);
      setLaudos((prev) => prev.map((l) => (l.id === atualizado.id ? atualizado : l)));
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function finalizar() {
    if (!laudo) return;
    setErro(null);
    setMensagem(null);
    try {
      const atualizado = await api.updateLaudo(laudo.id, { status: "FINALIZADO" });
      setLaudo(atualizado);
      setLaudos((prev) => prev.map((l) => (l.id === atualizado.id ? atualizado : l)));
      setMensagem("Laudo finalizado.");
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function baixarDocx() {
    if (!laudo) return;
    setErro(null);
    setMensagem(null);
    try {
      const { blob, filename } = await api.exportarLaudoDocx(laudo.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function salvarPerfil() {
    if (!profissionalAtual) return;
    setErro(null);
    try {
      await api.salvarPerfilDeAtuacao({ profissionalId: profissionalAtual.id, ...perfilForm });
      setMensagem("Perfil de Atuação salvo.");
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-1 font-serif text-2xl text-ink">Laudo Psicológico</h1>
      <p className="mb-8 text-sm text-ink/60">Composição do laudo conforme Resolução CFP nº 06/2019, com rascunho assistido por IA.</p>

      {erro && <div className="mb-6 rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
      {mensagem && <div className="mb-6 rounded-lg border border-sage-deep/30 bg-sage-deep/10 px-4 py-3 text-sm text-sage-deep">{mensagem}</div>}

      {/* Perfil de Atuação */}
      <section className="mb-8 rounded-2xl border border-mist bg-white p-5">
        <details>
          <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-sage-deep">Meu Perfil de Atuação</summary>
          <div className="mt-3 flex flex-col gap-3 text-sm">
            <label>
              <span className="mb-1 block font-semibold text-ink/70">Abordagem teórica</span>
              <textarea
                className="w-full rounded-lg border border-mist px-3 py-2"
                value={perfilForm.abordagemTeorica}
                onChange={(e) => setPerfilForm((p) => ({ ...p, abordagemTeorica: e.target.value }))}
              />
            </label>
            <label>
              <span className="mb-1 block font-semibold text-ink/70">Tom de escrita</span>
              <textarea
                className="w-full rounded-lg border border-mist px-3 py-2"
                value={perfilForm.tomDeEscrita}
                onChange={(e) => setPerfilForm((p) => ({ ...p, tomDeEscrita: e.target.value }))}
              />
            </label>
            <label>
              <span className="mb-1 block font-semibold text-ink/70">Regras de prudência clínica</span>
              <textarea
                className="w-full rounded-lg border border-mist px-3 py-2"
                value={perfilForm.regrasDePrudencia}
                onChange={(e) => setPerfilForm((p) => ({ ...p, regrasDePrudencia: e.target.value }))}
              />
            </label>
            <label>
              <span className="mb-1 block font-semibold text-ink/70">Vocabulário recorrente</span>
              <textarea
                className="w-full rounded-lg border border-mist px-3 py-2"
                value={perfilForm.vocabularioRecorrente}
                onChange={(e) => setPerfilForm((p) => ({ ...p, vocabularioRecorrente: e.target.value }))}
              />
            </label>
            <button className="self-start rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper" onClick={salvarPerfil}>
              Salvar perfil
            </button>
          </div>
        </details>
      </section>

      {/* Paciente */}
      <section className="mb-8 rounded-2xl border border-mist bg-white p-5">
        <div className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">1. Paciente</div>
        <select
          className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
          value={pacienteId}
          onChange={(e) => setPacienteId(e.target.value)}
        >
          <option value="">Selecione um paciente...</option>
          {pacientes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
        {pacienteId && contemPlaceholder && (
          <div className="mt-3">
            <PlaceholderBadge />
          </div>
        )}
      </section>

      {/* Laudo */}
      {pacienteId && (
        <section className="mb-8 rounded-2xl border border-mist bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wide text-sage-deep">Laudos deste paciente</div>
          </div>
          <select
            className="mb-3 w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
            value={laudoId}
            onChange={(e) => setLaudoId(e.target.value)}
          >
            <option value="">Selecione um laudo...</option>
            {laudos.map((l) => (
              <option key={l.id} value={l.id}>
                {new Date(l.criadoEm).toLocaleString("pt-BR")} — {l.status}
              </option>
            ))}
          </select>
          <details>
            <summary className="cursor-pointer text-sm text-sage-deep">+ Novo laudo</summary>
            <div className="mt-3 flex flex-col gap-2">
              <textarea
                className="w-full rounded-lg border border-mist px-3 py-2 text-sm"
                placeholder="Descrição da demanda"
                value={novaDemanda}
                onChange={(e) => setNovaDemanda(e.target.value)}
              />
              <textarea
                className="w-full rounded-lg border border-mist px-3 py-2 text-sm"
                placeholder="Procedimento (testes usados, sessões, datas)"
                value={novoProcedimento}
                onChange={(e) => setNovoProcedimento(e.target.value)}
              />
              <button
                className="self-start rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper disabled:opacity-40"
                disabled={!novaDemanda || !novoProcedimento}
                onClick={criarLaudo}
              >
                Criar laudo
              </button>
            </div>
          </details>
        </section>
      )}

      {/* Composição */}
      {laudo && (
        <>
          <section className="mb-8 rounded-2xl border border-mist bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full bg-mist px-3 py-1 text-xs font-bold text-sage-deep">{laudo.status}</span>
              <div className="flex items-center gap-3">
                <button
                  className="rounded-lg bg-clay px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                  disabled={gerando}
                  onClick={gerarRascunho}
                >
                  {gerando ? "Gerando..." : "✦ Gerar rascunho com IA"}
                </button>
                <button className="rounded-lg border border-sage-deep px-4 py-2 text-sm font-semibold text-sage-deep" onClick={baixarDocx}>
                  Baixar DOCX
                </button>
                <button className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper" onClick={finalizar}>
                  Finalizar
                </button>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={laudo.iaRevisadaPeloProf} onChange={(e) => alternarRevisao(e.target.checked)} />
              Revisei o rascunho de IA (obrigatório para finalizar)
            </label>
          </section>

          <section className="rounded-2xl border border-mist bg-white p-5">
            <div className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">1. Identificação</div>
            <pre className="mb-6 whitespace-pre-wrap rounded-lg bg-paper p-3 text-xs text-ink/70">
              {JSON.stringify(laudo.identificacao, null, 2)}
            </pre>

            {SECOES.map((secao) => (
              <div key={secao.chave} className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wide text-sage-deep">{secao.titulo}</div>
                  {secao.chave === "analise" && contemPlaceholder && <PlaceholderBadge />}
                </div>
                <textarea
                  className="w-full rounded-lg border border-mist px-3 py-2 text-sm"
                  rows={secao.chave === "analise" || secao.chave === "conclusao" ? 6 : 3}
                  value={laudo[secao.chave]}
                  onChange={(e) => setLaudo({ ...laudo, [secao.chave]: e.target.value })}
                  onBlur={(e) => salvarSecao(secao.chave, e.target.value)}
                />
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
