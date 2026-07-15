import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type AnamneseData, type AplicacaoDeTeste, type Anexo, type Paciente, type Sessao } from "../lib/api";

type Aba = "dados" | "anamnese" | "linha" | "anexos";

const TIPOS_ANEXO = ["documento", "laudo_externo", "exame", "foto"];

export function FichaPaciente() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [aba, setAba] = useState<Aba>("dados");
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const [dadosForm, setDadosForm] = useState({ nome: "", dataNascimento: "", responsavelLegal: "", contato: "", escolaridade: "" });
  const [anamneseForm, setAnamneseForm] = useState<AnamneseData>({});

  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [aplicacoes, setAplicacoes] = useState<AplicacaoDeTeste[]>([]);

  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [novoAnexo, setNovoAnexo] = useState({ tipo: TIPOS_ANEXO[0], url: "", descricao: "" });

  useEffect(() => {
    if (!id) return;
    // Guarda contra corrida: no StrictMode (dev) este efeito roda 2x, e uma resposta
    // antiga pode chegar depois de o usuário já ter salvo uma edição, sobrescrevendo-a.
    let cancelado = false;
    api
      .getPaciente(id)
      .then((p) => {
        if (cancelado) return;
        setPaciente(p);
        setDadosForm({
          nome: p.nome,
          dataNascimento: p.dataNascimento.slice(0, 10),
          responsavelLegal: p.responsavelLegal ?? "",
          contato: p.contato ?? "",
          escolaridade: p.escolaridade ?? "",
        });
        setAnamneseForm(p.anamnese ?? {});
      })
      .catch((e) => !cancelado && setErro(e.message));
    api.listSessoes(id).then((s) => !cancelado && setSessoes(s)).catch((e) => !cancelado && setErro(e.message));
    api.listAplicacoesPorPaciente(id).then((a) => !cancelado && setAplicacoes(a)).catch((e) => !cancelado && setErro(e.message));
    api.listAnexos(id).then((a) => !cancelado && setAnexos(a)).catch((e) => !cancelado && setErro(e.message));
    return () => {
      cancelado = true;
    };
  }, [id]);

  async function salvarDados() {
    if (!id) return;
    setErro(null);
    setMensagem(null);
    try {
      const atualizado = await api.updatePaciente(id, dadosForm);
      setPaciente(atualizado);
      setMensagem("Dados salvos.");
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function salvarAnamnese() {
    if (!id) return;
    setErro(null);
    setMensagem(null);
    try {
      const atualizado = await api.updatePaciente(id, { anamnese: anamneseForm });
      setPaciente(atualizado);
      setMensagem("Anamnese salva.");
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function adicionarAnexo() {
    if (!id || !novoAnexo.url) return;
    setErro(null);
    try {
      const criado = await api.createAnexo({ pacienteId: id, ...novoAnexo });
      setAnexos((prev) => [criado, ...prev]);
      setNovoAnexo({ tipo: TIPOS_ANEXO[0], url: "", descricao: "" });
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function removerAnexo(anexoId: string) {
    setErro(null);
    try {
      await api.deleteAnexo(anexoId);
      setAnexos((prev) => prev.filter((a) => a.id !== anexoId));
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  if (!paciente) {
    return <div className="px-6 py-10 text-sm text-ink/60">{erro ?? "Carregando..."}</div>;
  }

  const timeline = [...sessoes]
    .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
    .map((s) => ({ sessao: s, testes: aplicacoes.filter((a) => a.sessaoId === s.id) }));

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-mist text-xl font-bold text-sage-deep">
            {paciente.nome
              .split(" ")
              .slice(0, 2)
              .map((n) => n[0])
              .join("")}
          </span>
          <div>
            <h1 className="font-serif text-2xl text-ink">{paciente.nome}</h1>
            <div className="text-sm text-ink/60">
              <Link to="/pacientes" className="hover:underline">
                ← Voltar para pacientes
              </Link>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-lg border border-sage-deep px-4 py-2 text-sm font-semibold text-sage-deep"
            onClick={() => navigate(`/laudo?pacienteId=${id}`)}
          >
            Ir para o laudo
          </button>
          <button className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper" onClick={() => navigate(`/testes?pacienteId=${id}`)}>
            Registrar teste desta sessão
          </button>
        </div>
      </div>

      {erro && <div className="mb-6 rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
      {mensagem && <div className="mb-6 rounded-lg border border-sage-deep/30 bg-sage-deep/10 px-4 py-3 text-sm text-sage-deep">{mensagem}</div>}

      <div className="mb-6 flex gap-1 border-b border-mist">
        {([
          ["dados", "Dados"],
          ["anamnese", "Anamnese"],
          ["linha", "Linha do tempo"],
          ["anexos", "Anexos"],
        ] as const).map(([valor, label]) => (
          <button
            key={valor}
            className={`-mb-px border-b-2 px-1 py-2.5 mr-6 text-sm font-semibold ${
              aba === valor ? "border-sage-deep text-sage-deep" : "border-transparent text-ink/50"
            }`}
            onClick={() => setAba(valor)}
          >
            {label}
          </button>
        ))}
      </div>

      {aba === "dados" && (
        <div>
          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-ink/70">Nome completo</span>
              <input
                className="w-full rounded-lg border border-mist px-3 py-2"
                value={dadosForm.nome}
                onChange={(e) => setDadosForm((f) => ({ ...f, nome: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-ink/70">Data de nascimento</span>
              <input
                type="date"
                className="w-full rounded-lg border border-mist px-3 py-2"
                value={dadosForm.dataNascimento}
                onChange={(e) => setDadosForm((f) => ({ ...f, dataNascimento: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-ink/70">Responsável legal (se menor)</span>
              <input
                className="w-full rounded-lg border border-mist px-3 py-2"
                value={dadosForm.responsavelLegal}
                onChange={(e) => setDadosForm((f) => ({ ...f, responsavelLegal: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-ink/70">Contato</span>
              <input
                className="w-full rounded-lg border border-mist px-3 py-2"
                value={dadosForm.contato}
                onChange={(e) => setDadosForm((f) => ({ ...f, contato: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-ink/70">Escolaridade</span>
              <input
                className="w-full rounded-lg border border-mist px-3 py-2"
                value={dadosForm.escolaridade}
                onChange={(e) => setDadosForm((f) => ({ ...f, escolaridade: e.target.value }))}
              />
            </label>
          </div>
          <button className="mt-4 rounded-lg border border-mist px-4 py-2 text-sm font-semibold text-ink/70" onClick={salvarDados}>
            Salvar dados
          </button>
        </div>
      )}

      {aba === "anamnese" && (
        <div>
          <div className="flex flex-col gap-4">
            {([
              ["queixaPrincipal", "Queixa principal"],
              ["historicoEscolar", "Histórico escolar"],
              ["historicoMedico", "Histórico médico"],
              ["historicoFamiliar", "Histórico familiar"],
            ] as const).map(([chave, label]) => (
              <label key={chave} className="text-sm">
                <span className="mb-1 block font-semibold text-ink/70">{label}</span>
                <textarea
                  className="w-full rounded-lg border border-mist px-3 py-2"
                  rows={3}
                  value={anamneseForm[chave] ?? ""}
                  onChange={(e) => setAnamneseForm((f) => ({ ...f, [chave]: e.target.value }))}
                />
              </label>
            ))}
          </div>
          <button className="mt-4 rounded-lg border border-mist px-4 py-2 text-sm font-semibold text-ink/70" onClick={salvarAnamnese}>
            Salvar anamnese
          </button>
        </div>
      )}

      {aba === "linha" && (
        <div className="flex flex-col gap-5 border-l-2 border-mist pl-6">
          {timeline.length === 0 && <p className="text-sm text-ink/50">Nenhuma sessão registrada ainda.</p>}
          {timeline.map(({ sessao, testes }) => (
            <div key={sessao.id} className="relative">
              <div className="absolute -left-[29px] top-1 h-3 w-3 rounded-full border-2 border-paper bg-sage" />
              <div className="mb-0.5 text-xs font-bold text-sage-deep">{new Date(sessao.dataHora).toLocaleString("pt-BR")}</div>
              {testes.length === 0 ? (
                <div className="text-sm text-ink/60">Sessão sem testes lançados.</div>
              ) : (
                testes.map((t) => (
                  <div key={t.id} className="text-sm text-ink/70">
                    {t.teste.sigla} aplicado {t.teste.isPlaceholder && <span className="text-ember">(provisório)</span>}
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}

      {aba === "anexos" && (
        <div>
          <div className="mb-4 flex flex-col gap-2">
            {anexos.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-mist bg-paper px-4 py-2.5 text-sm">
                <a href={a.url} target="_blank" rel="noreferrer" className="text-sage-deep hover:underline">
                  📎 {a.descricao || a.url} <span className="text-ink/40">({a.tipo})</span>
                </a>
                <button className="text-xs font-semibold text-ember" onClick={() => removerAnexo(a.id)}>
                  remover
                </button>
              </div>
            ))}
            {anexos.length === 0 && <p className="text-sm text-ink/50">Nenhum anexo ainda.</p>}
          </div>
          <div className="flex flex-wrap items-end gap-2 rounded-lg border border-mist p-3">
            <select
              className="rounded-lg border border-mist px-3 py-2 text-sm"
              value={novoAnexo.tipo}
              onChange={(e) => setNovoAnexo((a) => ({ ...a, tipo: e.target.value }))}
            >
              {TIPOS_ANEXO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              className="min-w-[220px] flex-1 rounded-lg border border-mist px-3 py-2 text-sm"
              placeholder="URL do documento"
              value={novoAnexo.url}
              onChange={(e) => setNovoAnexo((a) => ({ ...a, url: e.target.value }))}
            />
            <input
              className="min-w-[160px] flex-1 rounded-lg border border-mist px-3 py-2 text-sm"
              placeholder="Descrição"
              value={novoAnexo.descricao}
              onChange={(e) => setNovoAnexo((a) => ({ ...a, descricao: e.target.value }))}
            />
            <button className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper" onClick={adicionarAnexo}>
              + Adicionar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
