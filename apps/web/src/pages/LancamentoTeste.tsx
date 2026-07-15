import { useEffect, useState } from "react";
import { PlaceholderBadge } from "../components/PlaceholderBadge";
import { ResultadoResumo } from "../components/ResultadoResumo";
import { api, type AplicacaoDeTeste, type Paciente, type Profissional, type Sessao, type Teste } from "../lib/api";

export function LancamentoTeste() {
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [testes, setTestes] = useState<Teste[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const [pacienteId, setPacienteId] = useState<string>("");
  const [novoPacienteNome, setNovoPacienteNome] = useState("");
  const [novoPacienteNascimento, setNovoPacienteNascimento] = useState("");

  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [sessaoId, setSessaoId] = useState<string>("");

  const [testeId, setTesteId] = useState<string>("");
  const [escores, setEscores] = useState<Record<string, string>>({});

  const [aplicacoes, setAplicacoes] = useState<AplicacaoDeTeste[]>([]);
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    api.listProfissionais().then(setProfissionais).catch((e) => setErro(e.message));
    api.listPacientes().then(setPacientes).catch((e) => setErro(e.message));
    api.listTestes().then(setTestes).catch((e) => setErro(e.message));
  }, []);

  useEffect(() => {
    if (!pacienteId) {
      setSessoes([]);
      setSessaoId("");
      return;
    }
    api.listSessoes(pacienteId).then(setSessoes).catch((e) => setErro(e.message));
  }, [pacienteId]);

  useEffect(() => {
    if (!sessaoId) {
      setAplicacoes([]);
      return;
    }
    api.listAplicacoes(sessaoId).then(setAplicacoes).catch((e) => setErro(e.message));
  }, [sessaoId]);

  const profissionalAtual = profissionais[0];
  const paciente = pacientes.find((p) => p.id === pacienteId);
  const teste = testes.find((t) => t.id === testeId);
  const campos = teste?.algoritmoCorrecao.campos ?? [];

  async function criarPaciente() {
    if (!profissionalAtual || !novoPacienteNome || !novoPacienteNascimento) return;
    setErro(null);
    try {
      const criado = await api.createPaciente({
        clinicaId: profissionalAtual.clinicaId,
        profissionalId: profissionalAtual.id,
        nome: novoPacienteNome,
        dataNascimento: novoPacienteNascimento,
      });
      setPacientes((prev) => [criado, ...prev]);
      setPacienteId(criado.id);
      setNovoPacienteNome("");
      setNovoPacienteNascimento("");
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function criarSessao() {
    if (!paciente) return;
    setErro(null);
    try {
      const criada = await api.createSessao({
        pacienteId: paciente.id,
        profissionalId: paciente.profissionalId,
        dataHora: new Date().toISOString(),
      });
      setSessoes((prev) => [criada, ...prev]);
      setSessaoId(criada.id);
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  function selecionarTeste(id: string) {
    setTesteId(id);
    setEscores({});
    setMensagem(null);
  }

  async function lancarResultado() {
    if (!sessaoId || !testeId) return;
    setErro(null);
    setMensagem(null);
    try {
      const escoresBrutos: Record<string, number> = {};
      for (const campo of campos) {
        escoresBrutos[campo.chave] = Number(escores[campo.chave] ?? 0);
      }
      const criada = await api.createAplicacao({ sessaoId, testeId, escoresBrutos });
      setAplicacoes((prev) => [criada, ...prev]);
      setMensagem(`${criada.teste.sigla} lançado com sucesso. Selecione outro teste ou revise os valores acima.`);
      setEscores({});
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
        <select
          className="mb-3 w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
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
          <div className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">2. Sessão</div>
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
            <div className="text-xs font-bold uppercase tracking-wide text-sage-deep">4. Lançamento de escores — {teste.sigla}</div>
            {teste.isPlaceholder && <PlaceholderBadge />}
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
          <button className="mt-4 rounded-lg bg-sage-deep px-5 py-2.5 text-sm font-semibold text-paper" onClick={lancarResultado}>
            Salvar lançamento
          </button>
          {mensagem && <p className="mt-3 text-sm font-semibold text-sage-deep">{mensagem}</p>}
        </section>
      )}

      {/* Lançamentos desta sessão */}
      {sessaoId && aplicacoes.length > 0 && (
        <section className="rounded-2xl border border-mist bg-white p-5">
          <div className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">Testes lançados nesta sessão</div>
          <ul className="flex flex-col gap-3">
            {aplicacoes.map((a) => (
              <li key={a.id} className="rounded-lg border border-mist p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{a.teste.sigla}</span>
                  {a.teste.isPlaceholder && <PlaceholderBadge />}
                </div>
                <ResultadoResumo resultado={a.resultadoCalculado} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
