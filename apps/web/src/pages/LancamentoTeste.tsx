import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PlaceholderBadge } from "../components/PlaceholderBadge";
import { ResultadoResumo } from "../components/ResultadoResumo";
import { SeletorPaciente } from "../components/SeletorPaciente";
import { useAuth } from "../context/AuthContext";
import {
  api,
  ROTULO_RESPONDENTE,
  type AplicacaoDeTeste,
  type Paciente,
  type Sessao,
  type Teste,
  type TipoRespondente,
} from "../lib/api";

export function LancamentoTeste() {
  const { profissional } = useAuth();
  const [searchParams] = useSearchParams();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [testes, setTestes] = useState<Teste[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const [pacienteId, setPacienteId] = useState<string>(searchParams.get("pacienteId") ?? "");
  const [novoPacienteNome, setNovoPacienteNome] = useState("");
  const [novoPacienteNascimento, setNovoPacienteNascimento] = useState("");

  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [sessaoId, setSessaoId] = useState<string>("");
  const [buscaData, setBuscaData] = useState("");
  const [listaSessoesAberta, setListaSessoesAberta] = useState(false);

  const [testeId, setTesteId] = useState<string>("");
  const [escores, setEscores] = useState<Record<string, string>>({});
  const [editandoAplicacaoId, setEditandoAplicacaoId] = useState<string | null>(null);

  const [respondenteTipo, setRespondenteTipo] = useState<TipoRespondente>("PACIENTE");
  const [respondenteNome, setRespondenteNome] = useState("");
  const [respondenteRelacao, setRespondenteRelacao] = useState("");

  const [aplicacoes, setAplicacoes] = useState<AplicacaoDeTeste[]>([]);
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    api.listPacientes().then(setPacientes).catch((e) => setErro(e.message));
    api.listTestes().then(setTestes).catch((e) => setErro(e.message));
  }, []);

  // Vindo da Biblioteca de Instrumentos (?teste=SIGLA): pré-seleciona assim que a lista carrega,
  // sem exigir que o usuário clique de novo no mesmo teste que já escolheu lá.
  useEffect(() => {
    const siglaAlvo = searchParams.get("teste");
    if (!siglaAlvo || testeId) return;
    const alvo = testes.find((t) => t.sigla === siglaAlvo);
    if (alvo) selecionarTeste(alvo.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testes, searchParams]);

  // Guarda contra corrida: uma resposta de uma sessão antiga pode chegar depois
  // de o usuário já ter trocado de sessão, fazendo a lista "misturar" dados.
  useEffect(() => {
    if (!pacienteId) {
      setSessoes([]);
      setSessaoId("");
      return;
    }
    let cancelado = false;
    api.listSessoes(pacienteId).then((s) => !cancelado && setSessoes(s)).catch((e) => !cancelado && setErro(e.message));
    return () => {
      cancelado = true;
    };
  }, [pacienteId]);

  useEffect(() => {
    if (!sessaoId) {
      setAplicacoes([]);
      return;
    }
    let cancelado = false;
    api.listAplicacoes(sessaoId).then((a) => !cancelado && setAplicacoes(a)).catch((e) => !cancelado && setErro(e.message));
    return () => {
      cancelado = true;
    };
  }, [sessaoId]);

  const paciente = pacientes.find((p) => p.id === pacienteId);
  const teste = testes.find((t) => t.id === testeId);
  const campos = teste?.algoritmoCorrecao.campos ?? [];

  const sessoesFiltradas = buscaData
    ? sessoes.filter((s) => new Date(s.dataHora).toLocaleDateString("pt-BR").includes(buscaData))
    : sessoes;

  async function criarPaciente() {
    if (!profissional || !novoPacienteNome || !novoPacienteNascimento) return;
    setErro(null);
    setMensagem(null);
    try {
      const criado = await api.createPaciente({
        profissionalId: profissional.id,
        nome: novoPacienteNome,
        dataNascimento: novoPacienteNascimento,
      });
      setPacientes((prev) => [criado, ...prev]);
      setPacienteId(criado.id);
      setNovoPacienteNome("");
      setNovoPacienteNascimento("");
      setMensagem(`Paciente ${criado.nome} criado.`);
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function criarSessao() {
    if (!paciente) return;
    setErro(null);
    setMensagem(null);
    try {
      const criada = await api.createSessao({
        pacienteId: paciente.id,
        dataHora: new Date().toISOString(),
      });
      setSessoes((prev) => [criada, ...prev]);
      setSessaoId(criada.id);
      setMensagem("Sessão criada.");
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  function limparRespondente() {
    setRespondenteTipo("PACIENTE");
    setRespondenteNome("");
    setRespondenteRelacao("");
  }

  function selecionarTeste(id: string) {
    setTesteId(id);
    setEscores({});
    setMensagem(null);
    setEditandoAplicacaoId(null);
    limparRespondente();
  }

  function editarLancamento(aplicacao: AplicacaoDeTeste) {
    setTesteId(aplicacao.testeId);
    const valores: Record<string, string> = {};
    for (const [chave, valor] of Object.entries(aplicacao.escoresBrutos)) {
      valores[chave] = String(valor);
    }
    setEscores(valores);
    setEditandoAplicacaoId(aplicacao.id);
    setRespondenteTipo(aplicacao.respondenteTipo);
    setRespondenteNome(aplicacao.respondenteNome ?? "");
    setRespondenteRelacao(aplicacao.respondenteRelacao ?? "");
    setMensagem(null);
  }

  async function salvarLancamento() {
    if (!sessaoId || !testeId) return;
    setErro(null);
    setMensagem(null);
    try {
      const escoresBrutos: Record<string, number> = {};
      for (const campo of campos) {
        escoresBrutos[campo.chave] = Number(escores[campo.chave] ?? 0);
      }
      // Nome e relação só fazem sentido quando o respondente não é o próprio paciente; mandar
      // vazio evita deixar resíduo de um lançamento anterior gravado num PACIENTE.
      const respondente = {
        respondenteTipo,
        respondenteNome: respondenteTipo === "PACIENTE" ? "" : respondenteNome,
        respondenteRelacao: respondenteTipo === "PACIENTE" ? "" : respondenteRelacao,
      };
      if (editandoAplicacaoId) {
        const atualizada = await api.updateAplicacao(editandoAplicacaoId, { escoresBrutos, ...respondente });
        setAplicacoes((prev) => prev.map((a) => (a.id === atualizada.id ? atualizada : a)));
        setMensagem(`${atualizada.teste.sigla} atualizado com sucesso.`);
      } else {
        const criada = await api.createAplicacao({ sessaoId, testeId, escoresBrutos, ...respondente });
        setAplicacoes((prev) => [criada, ...prev]);
        setMensagem(
          `${criada.teste.sigla} lançado com sucesso. Para outro informante, lance o mesmo teste de novo trocando o respondente.`
        );
      }
      setEscores({});
      setEditandoAplicacaoId(null);
      limparRespondente();
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-1 font-serif text-2xl text-ink">Testes &amp; Correção</h1>
      <p className="mb-8 text-sm text-ink/60">Lançamento de resultado de teste, com cálculo automático de percentil/classificação a partir da norma do instrumento.</p>

      {erro && <div className="mb-6 rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}

      {/* Paciente */}
      <section className="mb-8 rounded-2xl border border-mist bg-white p-5">
        <div className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">1. Paciente</div>
        <div className="mb-3">
          <SeletorPaciente pacientes={pacientes} value={pacienteId} onChange={setPacienteId} />
        </div>
        <details className="text-sm">
          <summary className="cursor-pointer text-sage-deep">+ Novo paciente</summary>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              className="flex-1 rounded-lg border border-mist px-3 py-2 text-sm"
              placeholder="Nome completo"
              value={novoPacienteNome}
              onChange={(e) => setNovoPacienteNome(e.target.value)}
            />
            <input
              type="date"
              className="rounded-lg border border-mist px-3 py-2 text-sm"
              value={novoPacienteNascimento}
              onChange={(e) => setNovoPacienteNascimento(e.target.value)}
            />
            <button
              className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper disabled:opacity-40"
              disabled={!novoPacienteNome || !novoPacienteNascimento}
              onClick={criarPaciente}
            >
              Criar
            </button>
          </div>
        </details>
      </section>

      {/* Sessão */}
      {pacienteId && (
        <section className="mb-8 rounded-2xl border border-mist bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wide text-sage-deep">2. Sessão</div>
            <button className="text-xs font-semibold text-sage-deep" onClick={() => setListaSessoesAberta((v) => !v)}>
              {listaSessoesAberta ? "Recolher lista ▲" : `Ver todas (${sessoes.length}) ▾`}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="flex-1 rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
              value={sessaoId}
              onChange={(e) => setSessaoId(e.target.value)}
            >
              <option value="">Selecione uma sessão...</option>
              {sessoes.map((s) => (
                <option key={s.id} value={s.id}>
                  {new Date(s.dataHora).toLocaleString("pt-BR")}
                </option>
              ))}
            </select>
            <button className="rounded-lg border border-sage-deep px-4 py-2 text-sm font-semibold text-sage-deep" onClick={criarSessao}>
              + Nova sessão agora
            </button>
          </div>

          {listaSessoesAberta && (
            <div className="mt-3 rounded-lg border border-mist p-3">
              <input
                className="mb-2 w-full rounded-lg border border-mist px-3 py-1.5 text-xs"
                placeholder="Buscar por data (ex: 15/07)..."
                value={buscaData}
                onChange={(e) => setBuscaData(e.target.value)}
              />
              <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
                {sessoesFiltradas.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSessaoId(s.id)}
                    className={`rounded-lg px-3 py-2 text-left text-xs ${
                      sessaoId === s.id ? "bg-sage-deep/10 font-semibold text-sage-deep" : "hover:bg-paper"
                    }`}
                  >
                    {new Date(s.dataHora).toLocaleString("pt-BR")}
                  </button>
                ))}
                {sessoesFiltradas.length === 0 && <p className="px-3 py-2 text-xs text-ink/50">Nenhuma sessão encontrada.</p>}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Testes já lançados nesta sessão — cartão próprio, separado do card de sessão (item 2)
          e do de teste (item 3), para não dar a impressão de que faz parte de um dos dois
          (bug relatado pelo usuário: parecia que "Ver todas" não recolhia por causa disso). */}
      {sessaoId && aplicacoes.length > 0 && (
        <section className="mb-8 rounded-2xl border border-mist bg-paper/60 p-5">
          <div className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">Testes lançados nesta sessão</div>
          <ul className="flex flex-col gap-2">
            {aplicacoes.map((a) => (
              <li key={a.id} className="rounded-lg border border-mist bg-white p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {a.teste.sigla}
                    {/* Só mostra o respondente quando NÃO é o próprio paciente: em teste de
                        aplicação direta (WISC-IV, RAVLT) a informação é ruído. */}
                    {a.respondenteTipo !== "PACIENTE" && (
                      <span className="ml-2 rounded-full bg-sage-deep/10 px-2 py-0.5 text-[11px] font-semibold text-sage-deep">
                        {a.respondenteNome || ROTULO_RESPONDENTE[a.respondenteTipo]}
                        {a.respondenteRelacao && ` · ${a.respondenteRelacao}`}
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {a.teste.isPlaceholder && <PlaceholderBadge />}
                    <button className="text-xs font-semibold text-sage-deep" onClick={() => editarLancamento(a)}>
                      editar
                    </button>
                  </div>
                </div>
                <ResultadoResumo
                  resultado={a.resultadoCalculado}
                  direcao={a.teste.direcao}
                  campos={[...(a.teste.algoritmoCorrecao.campos ?? []), ...(a.teste.algoritmoCorrecao.camposCalculados ?? [])]}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Teste picker */}
      {sessaoId && (
        <section className="mb-8 rounded-2xl border border-mist bg-white p-5">
          <div className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">3. Teste</div>
          <div className="flex flex-wrap gap-2">
            {testes.map((t) => (
              <button
                key={t.id}
                onClick={() => selecionarTeste(t.id)}
                className={`rounded-xl border px-4 py-2 text-left text-sm font-semibold ${
                  testeId === t.id ? "border-sage-deep bg-sage-deep/10 text-sage-deep" : "border-mist bg-white text-ink"
                }`}
              >
                {t.sigla}
                {t.isPlaceholder && <span className="ml-2 text-[10px] font-bold text-ember">PROVISÓRIO</span>}
                <span className="block text-[11px] font-normal text-ink/50">{t.dominio}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Formulário genérico dirigido por metadado */}
      {teste && (
        <section className="mb-8 rounded-2xl border border-mist bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wide text-sage-deep">
              4. {editandoAplicacaoId ? "Editar lançamento" : "Lançamento de escores"} — {teste.sigla}
            </div>
            {teste.isPlaceholder && <PlaceholderBadge />}
          </div>
          {/* Quem respondeu. Fica ANTES dos escores de propósito: em escala de informante, a
              mesma criança pode ser avaliada por mãe, pai e professor, e cada protocolo é um
              lançamento. Saber de quem são os números antes de digitá-los evita atribuir a
              resposta à pessoa errada — e depois não há como descobrir. */}
          <div className="mb-5 rounded-xl border border-mist bg-paper/50 p-4">
            <span className="mb-2 block text-sm font-semibold text-ink/70">Quem respondeu?</span>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(ROTULO_RESPONDENTE) as TipoRespondente[]).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setRespondenteTipo(tipo)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                    respondenteTipo === tipo
                      ? "border-sage-deep bg-sage-deep/10 text-sage-deep"
                      : "border-mist bg-white text-ink/70"
                  }`}
                >
                  {ROTULO_RESPONDENTE[tipo]}
                </button>
              ))}
            </div>
            {respondenteTipo !== "PACIENTE" && (
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  className="flex-1 rounded-lg border border-mist px-3 py-2 text-sm"
                  placeholder="Nome de quem respondeu"
                  value={respondenteNome}
                  onChange={(e) => setRespondenteNome(e.target.value)}
                />
                <input
                  className="flex-1 rounded-lg border border-mist px-3 py-2 text-sm"
                  placeholder="Vínculo (ex: avó materna, professora de matemática)"
                  value={respondenteRelacao}
                  onChange={(e) => setRespondenteRelacao(e.target.value)}
                />
              </div>
            )}
          </div>

          {campos.length === 0 ? (
            <p className="text-sm text-ink/60">Este teste não tem campos de lançamento definidos.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {campos.map((campo) => (
                <label key={campo.chave} className="text-sm">
                  <span className="mb-1 block font-semibold text-ink/70">{campo.label}</span>
                  <input
                    type="number"
                    className="w-full rounded-lg border border-mist px-3 py-2"
                    value={escores[campo.chave] ?? ""}
                    onChange={(e) => setEscores((prev) => ({ ...prev, [campo.chave]: e.target.value }))}
                  />
                </label>
              ))}
            </div>
          )}
          <div className="mt-4 flex items-center gap-3">
            <button className="rounded-lg bg-sage-deep px-5 py-2.5 text-sm font-semibold text-paper" onClick={salvarLancamento}>
              {editandoAplicacaoId ? "Salvar edição" : "Salvar lançamento"}
            </button>
            {editandoAplicacaoId && (
              <button
                className="text-sm text-ink/60"
                onClick={() => {
                  setEditandoAplicacaoId(null);
                  setEscores({});
                  setTesteId("");
                }}
              >
                Cancelar edição
              </button>
            )}
          </div>
          {mensagem && <p className="mt-3 text-sm font-semibold text-sage-deep">{mensagem}</p>}
        </section>
      )}
    </div>
  );
}
