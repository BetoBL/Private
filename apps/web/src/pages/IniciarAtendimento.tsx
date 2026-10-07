import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BotaoVoltar } from "../components/BotaoVoltar";
import { api, type ConflitoCronograma, type Paciente, type TipoAtendimento } from "../lib/api";
import { sessoes as sessoesPlural, testes as testesPlural } from "../lib/plural";

function paraInputLocal(data: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}T${pad(data.getHours())}:${pad(data.getMinutes())}`;
}

// Padrão: daqui a 7 dias, às 9h.
function dataPadrao(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(9, 0, 0, 0);
  return d;
}

const inputCls = "w-full rounded-lg border border-mist px-3 py-2 text-sm";

export function IniciarAtendimento() {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [tipos, setTipos] = useState<TipoAtendimento[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const [pacienteId, setPacienteId] = useState("");
  const [tipoId, setTipoId] = useState("");
  const [primeira, setPrimeira] = useState("");
  const [intervaloDias, setIntervaloDias] = useState(7);
  const [duracaoMinutos, setDuracaoMinutos] = useState(60);
  // Horários que o usuário ajustou à mão, por índice de sessão. Mudar a data da 1ª sessão, o
  // intervalo ou o tipo recalcula o cronograma e descarta esses ajustes.
  const [editadas, setEditadas] = useState<Record<number, string>>({});

  const [criando, setCriando] = useState(false);
  const [conflitos, setConflitos] = useState<ConflitoCronograma[]>([]);
  const [resultado, setResultado] = useState<{ mensagem: string; total: number } | null>(null);

  useEffect(() => {
    api.listPacientes().then(setPacientes).catch((e) => setErro(e.message));
    api.listTiposAtendimento().then(setTipos).catch((e) => setErro(e.message));
  }, []);

  const pacienteEscolhido = pacientes.find((p) => p.id === pacienteId);
  const tipoEscolhido = tipos.find((t) => t.id === tipoId);

  const datas = useMemo(() => {
    if (!tipoEscolhido) return [];
    const base = primeira ? new Date(primeira) : dataPadrao();
    return Array.from({ length: tipoEscolhido.numeroSessoes }, (_, i) => {
      if (editadas[i]) return editadas[i];
      const d = new Date(base);
      d.setDate(d.getDate() + i * intervaloDias);
      return Number.isNaN(d.getTime()) ? "" : paraInputLocal(d);
    });
  }, [tipoEscolhido, primeira, intervaloDias, editadas]);

  function recalcular<T>(setter: (v: T) => void, valor: T) {
    setter(valor);
    setEditadas({});
    setConflitos([]);
  }

  async function iniciar(forcar = false) {
    if (!pacienteId || !tipoId || datas.length === 0) return;
    if (datas.some((d) => !d || Number.isNaN(new Date(d).getTime()))) {
      setErro("Preencha uma data e hora válidas para todas as sessões.");
      return;
    }
    setErro(null);
    setCriando(true);
    try {
      const r = await api.iniciarAtendimento({
        pacienteId,
        tipoAtendimentoId: tipoId,
        duracaoMinutos,
        sessoes: datas.map((d) => ({ dataHora: new Date(d).toISOString() })),
        forcar,
      });
      if (r.conflito) {
        setConflitos(r.conflitos);
        return;
      }
      setConflitos([]);
      setResultado({ mensagem: r.mensagem, total: r.sessoes.length });
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCriando(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <BotaoVoltar />
      <h1 className="mb-1 font-serif text-2xl text-ink">Iniciar Atendimento</h1>
      <p className="mb-8 text-sm text-ink/60">
        Escolha o paciente e o tipo de atendimento. As sessões são criadas e já entram na Agenda; você ajusta cada horário antes de confirmar.
      </p>

      {erro && <div className="mb-6 rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}

      {resultado ? (
        <section className="rounded-2xl border border-sage-deep/30 bg-sage-deep/10 p-6 text-center">
          <div className="mb-2 text-3xl">✓</div>
          <div className="font-semibold text-sage-deep">Atendimento iniciado</div>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink/70">{resultado.mensagem}</p>
          <div className="mt-5 flex justify-center gap-3">
            <Link to="/agenda" className="rounded-lg bg-sage-deep px-5 py-2.5 text-sm font-semibold text-paper">
              Ver na Agenda
            </Link>
            <button
              className="rounded-lg border border-mist px-5 py-2.5 text-sm font-semibold text-ink/70"
              onClick={() => navigate(`/pacientes/${pacienteId}`)}
            >
              Abrir ficha do paciente
            </button>
          </div>
        </section>
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl border border-mist bg-white p-5">
            <div className="mb-3 text-sm font-bold uppercase tracking-wide text-sage-deep">1 · Paciente</div>
            <select className={inputCls} value={pacienteId} onChange={(e) => recalcular(setPacienteId, e.target.value)}>
              <option value="">— Escolha um paciente —</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
            {pacienteEscolhido && (
              <div className="mt-3 rounded-lg bg-paper p-3 text-xs text-ink/60">
                {new Date(pacienteEscolhido.dataNascimento).toLocaleDateString("pt-BR")}
                {pacienteEscolhido.sexo && ` • ${pacienteEscolhido.sexo === "MASCULINO" ? "Masculino" : "Feminino"}`}
              </div>
            )}
          </section>

          {pacienteId && (
            <section className="rounded-2xl border border-mist bg-white p-5">
              <div className="mb-3 text-sm font-bold uppercase tracking-wide text-sage-deep">2 · Tipo de atendimento</div>
              <select className={inputCls} value={tipoId} onChange={(e) => recalcular(setTipoId, e.target.value)}>
                <option value="">— Escolha um tipo —</option>
                {tipos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome} ({sessoesPlural(t.numeroSessoes)})
                  </option>
                ))}
              </select>
              {tipoEscolhido && (
                <div className="mt-3 rounded-lg bg-paper p-3 text-sm">
                  {tipoEscolhido.descricao && <div className="mb-1 text-xs text-ink/60">{tipoEscolhido.descricao}</div>}
                  <div className="flex items-center gap-4 text-xs text-ink/60">
                    <span>📅 {sessoesPlural(tipoEscolhido.numeroSessoes)}</span>
                    <span>🧪 {testesPlural(tipoEscolhido.testeIds.length)}</span>
                  </div>
                </div>
              )}
            </section>
          )}

          {tipoEscolhido && (
            <section className="rounded-2xl border border-mist bg-white p-5">
              <div className="mb-3 text-sm font-bold uppercase tracking-wide text-sage-deep">3 · Cronograma</div>
              <div className="mb-4 grid grid-cols-3 gap-4">
                <label className="text-sm">
                  <span className="mb-1 block font-semibold text-ink/70">1ª sessão</span>
                  <input
                    type="datetime-local"
                    className={inputCls}
                    value={primeira || paraInputLocal(dataPadrao())}
                    onChange={(e) => recalcular(setPrimeira, e.target.value)}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-semibold text-ink/70">Intervalo (dias)</span>
                  <input
                    type="number"
                    min={1}
                    className={inputCls}
                    value={intervaloDias}
                    onChange={(e) => recalcular(setIntervaloDias, Math.max(1, Number(e.target.value) || 1))}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-semibold text-ink/70">Duração (min)</span>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    className={inputCls}
                    value={duracaoMinutos}
                    onChange={(e) => setDuracaoMinutos(Math.max(5, Number(e.target.value) || 60))}
                  />
                </label>
              </div>

              <div className="space-y-2">
                {datas.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg bg-paper px-3 py-2">
                    <div className="w-24 shrink-0 text-sm font-semibold text-ink">Sessão {i + 1}</div>
                    <input
                      type="datetime-local"
                      className="flex-1 rounded-lg border border-mist bg-white px-3 py-1.5 text-sm"
                      value={d}
                      onChange={(e) => {
                        setEditadas((prev) => ({ ...prev, [i]: e.target.value }));
                        setConflitos([]);
                      }}
                    />
                    {editadas[i] && <span className="shrink-0 text-[11px] text-clay">ajustada</span>}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-ink/50">
                Cada sessão vira um compromisso na Agenda do profissional responsável pelo paciente. Depois de criada, o horário também
                pode ser mudado direto na Agenda.
              </p>
            </section>
          )}

          {conflitos.length > 0 && (
            <section className="rounded-2xl border border-ember/30 bg-ember/10 p-5 text-sm text-ember">
              <p className="mb-2 font-semibold">Conflito de horário com compromissos já agendados:</p>
              <ul className="mb-3 list-disc pl-5">
                {conflitos.map((c, i) => (
                  <li key={i}>
                    Sessão {c.sessao} × {c.titulo}
                    {c.paciente && ` — ${c.paciente}`} ({new Date(c.inicio).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })})
                  </li>
                ))}
              </ul>
              <p className="mb-3 text-xs">Ajuste os horários acima ou agende mesmo assim.</p>
              <button
                className="rounded-lg bg-ember px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
                disabled={criando}
                onClick={() => iniciar(true)}
              >
                Agendar mesmo assim
              </button>
            </section>
          )}

          <div className="flex gap-3">
            <button
              className="flex-1 rounded-lg bg-sage-deep px-6 py-3 font-semibold text-paper disabled:opacity-40"
              disabled={!pacienteId || !tipoId || criando}
              onClick={() => iniciar(false)}
            >
              {criando ? "Agendando…" : "Iniciar atendimento e agendar sessões"}
            </button>
            <button className="rounded-lg border border-mist px-6 py-3 font-semibold text-ink/70" onClick={() => navigate(-1)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
