import { useAviso } from "../lib/aviso";
import { sessoes, testes as testesPlural } from "../lib/plural";
import { useEffect, useState } from "react";
import { BotaoVoltar } from "../components/BotaoVoltar";
import { api, type TipoAtendimento, type Teste } from "../lib/api";

export function CadastroTiposAtendimento() {
  const [tipos, setTipos] = useState<TipoAtendimento[]>([]);
  const [testes, setTestes] = useState<Teste[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useAviso();

  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [visualizandoId, setVisualizandoId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    numeroSessoes: 1,
    testeIds: [] as string[],
  });

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const [tiposData, testesData] = await Promise.all([
        api.listTiposAtendimento(),
        api.listTestes(),
      ]);
      setTipos(tiposData);
      setTestes(testesData);
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function salvar() {
    if (!form.nome || form.numeroSessoes < 1) {
      setErro("Nome e número de sessões são obrigatórios");
      return;
    }

    setErro(null);
    setMensagem(null);

    try {
      if (editandoId) {
        const atualizado = await api.updateTipoAtendimento(editandoId, form);
        setTipos((prev) => prev.map((t) => (t.id === atualizado.id ? atualizado : t)));
        setMensagem("Tipo de atendimento atualizado com sucesso.");
      } else {
        const criado = await api.createTipoAtendimento(form);
        setTipos((prev) => [criado, ...prev]);
        setMensagem("Tipo de atendimento criado com sucesso.");
      }
      setForm({ nome: "", descricao: "", numeroSessoes: 1, testeIds: [] });
      setEditandoId(null);
      setMostrarForm(false);
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function deletar(id: string) {
    if (!confirm("Tem certeza que deseja deletar este tipo de atendimento?")) return;

    setErro(null);
    try {
      await api.deleteTipoAtendimento(id);
      setTipos((prev) => prev.filter((t) => t.id !== id));
      setMensagem("Tipo de atendimento deletado.");
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  function abrirEdicao(tipo: TipoAtendimento) {
    setForm({
      nome: tipo.nome,
      descricao: tipo.descricao || "",
      numeroSessoes: tipo.numeroSessoes,
      testeIds: tipo.testeIds,
    });
    setEditandoId(tipo.id);
    setMostrarForm(true);
  }

  function alternarTeste(testeId: string) {
    setForm((f) => ({
      ...f,
      testeIds: f.testeIds.includes(testeId)
        ? f.testeIds.filter((id) => id !== testeId)
        : [...f.testeIds, testeId],
    }));
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <BotaoVoltar />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 font-serif text-2xl text-ink">Tipos de Atendimento</h1>
          <p className="text-sm text-ink/60">Configure modelos de atendimento (sessões + testes) para sua clínica.</p>
        </div>
        <button className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper" onClick={() => { setMostrarForm(!mostrarForm); if (mostrarForm) setEditandoId(null); }}>
          {mostrarForm ? "Cancelar" : "+ Novo tipo"}
        </button>
      </div>

      {erro && <div className="mb-6 rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
      {mensagem && <div className="mb-6 rounded-lg border border-sage-deep/30 bg-sage-deep/10 px-4 py-3 text-sm text-sage-deep">{mensagem}</div>}

      {mostrarForm && (
        <section className="mb-8 rounded-2xl border border-mist bg-white p-5">
          <div className="mb-4 text-xs font-bold uppercase tracking-wide text-sage-deep">
            {editandoId ? "Editar tipo" : "Novo tipo de atendimento"}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-ink/70">Nome *</span>
              <input
                className="w-full rounded-lg border border-mist px-3 py-2"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Avaliação Neuropsicológica Completa"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-ink/70">Nº de Sessões *</span>
              <input
                type="number"
                min="1"
                className="w-full rounded-lg border border-mist px-3 py-2"
                value={form.numeroSessoes}
                onChange={(e) => setForm((f) => ({ ...f, numeroSessoes: parseInt(e.target.value) || 1 }))}
              />
            </label>
          </div>

          <label className="mb-4 block text-sm">
            <span className="mb-1 block font-semibold text-ink/70">Descrição</span>
            <textarea
              className="w-full rounded-lg border border-mist px-3 py-2"
              rows={2}
              value={form.descricao}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              placeholder="Descrição do tipo de atendimento..."
            />
          </label>

          <div className="mb-4">
            <span className="mb-2 block text-sm font-semibold text-ink/70">Testes Associados</span>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-mist bg-paper/50 p-3">
              {testes.length === 0 ? (
                <p className="text-sm text-ink/50">Carregando testes...</p>
              ) : (
                testes.map((teste) => (
                  <label key={teste.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.testeIds.includes(teste.id)}
                      onChange={() => alternarTeste(teste.id)}
                      className="rounded"
                    />
                    <span className="text-ink/70">{teste.sigla}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper"
              onClick={salvar}
            >
              {editandoId ? "Salvar edição" : "Criar tipo"}
            </button>
            <button
              className="text-sm text-ink/60"
              onClick={() => {
                setMostrarForm(false);
                setEditandoId(null);
                setForm({ nome: "", descricao: "", numeroSessoes: 1, testeIds: [] });
              }}
            >
              Cancelar
            </button>
          </div>
        </section>
      )}

      <div className="flex flex-col gap-3">
        {tipos.length === 0 && <p className="text-sm text-ink/50">Nenhum tipo de atendimento cadastrado.</p>}
        {tipos.map((tipo) => (
          <div key={tipo.id} className="rounded-lg border border-mist bg-white p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-ink">{tipo.nome}</h3>
                {tipo.descricao && <p className="mt-1 text-sm text-ink/70">{tipo.descricao}</p>}
                <div className="mt-2 flex items-center gap-4 text-xs text-ink/60">
                  <span>📅 {sessoes(tipo.numeroSessoes)}</span>
                  <span>🧪 {testesPlural(tipo.testeIds.length)}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  className="text-sm font-semibold text-ink/70 hover:underline"
                  onClick={() => setVisualizandoId(visualizandoId === tipo.id ? null : tipo.id)}
                >
                  {visualizandoId === tipo.id ? "Ocultar" : "Ver"}
                </button>
                <button
                  className="text-sm font-semibold text-sage-deep hover:underline"
                  onClick={() => abrirEdicao(tipo)}
                >
                  Editar
                </button>
                <button
                  className="text-sm font-semibold text-ember hover:underline"
                  onClick={() => deletar(tipo.id)}
                >
                  Deletar
                </button>
              </div>
            </div>
            {visualizandoId === tipo.id && (
              <div className="mt-3 rounded-lg bg-paper p-3 text-sm">
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-sage-deep">Testes deste atendimento</div>
                {tipo.testeIds.length === 0 ? (
                  <p className="text-xs text-ink/50">Nenhum teste vinculado.</p>
                ) : (
                  <ul className="space-y-1">
                    {tipo.testeIds.map((tid) => {
                      const t = testes.find((x) => x.id === tid);
                      return (
                        <li key={tid} className="text-xs text-ink/80">
                          <span className="font-semibold">{t?.sigla ?? "Teste removido"}</span>
                          {t && <span className="text-ink/60"> — {t.nome}</span>}
                        </li>
                      );
                    })}
                  </ul>
                )}
                <p className="mt-3 text-xs text-ink/50">
                  {sessoes(tipo.numeroSessoes)} · criado em {new Date(tipo.criadoEm).toLocaleDateString("pt-BR")}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
