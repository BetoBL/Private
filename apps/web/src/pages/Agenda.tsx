import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SeletorPaciente } from "../components/SeletorPaciente";
import { useAuth } from "../context/AuthContext";
import { api, type ConflitoAgenda, type EventoAgenda, type Paciente, type Profissional } from "../lib/api";

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const TIPOS = [
  { valor: "avaliacao", label: "Avaliação" },
  { valor: "outro", label: "Outro compromisso" },
  { valor: "bloqueio", label: "Bloqueio (indisponível)" },
];

function inicioDaSemana(referencia: Date): Date {
  const diaSemana = referencia.getDay(); // 0=domingo
  const deslocamento = diaSemana === 0 ? -6 : 1 - diaSemana;
  const segunda = new Date(referencia);
  segunda.setDate(referencia.getDate() + deslocamento);
  segunda.setHours(0, 0, 0, 0);
  return segunda;
}

function paraInputLocal(data: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}T${pad(data.getHours())}:${pad(data.getMinutes())}`;
}

const CORES_TIPO: Record<string, string> = {
  avaliacao: "bg-[#FBE8D9] text-sage-deep",
  outro: "bg-mist text-ink/70",
  bloqueio: "bg-ember/10 text-ember",
};

export function Agenda() {
  const { profissional: logado } = useAuth();
  const ehAdmin = logado?.papel === "ADMIN";

  const [referencia, setReferencia] = useState(new Date());
  const [eventos, setEventos] = useState<EventoAgenda[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [colegas, setColegas] = useState<Profissional[]>([]);
  const [profissionalFiltro, setProfissionalFiltro] = useState<string>("");
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [conflitos, setConflitos] = useState<ConflitoAgenda[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ pacienteId: "", titulo: "", tipo: "avaliacao", inicio: "", fim: "", observacoes: "" });

  const segunda = inicioDaSemana(referencia);
  const domingo = new Date(segunda);
  domingo.setDate(segunda.getDate() + 7);

  useEffect(() => {
    api.listPacientes().then(setPacientes).catch((e) => setErro(e.message));
    if (ehAdmin) api.listProfissionais().then(setColegas).catch((e) => setErro(e.message));
  }, [ehAdmin]);

  useEffect(() => {
    let cancelado = false;
    api
      .listEventosAgenda({
        inicio: segunda.toISOString(),
        fim: domingo.toISOString(),
        ...(profissionalFiltro ? { profissionalId: profissionalFiltro } : {}),
      })
      .then((e) => !cancelado && setEventos(e))
      .catch((e) => !cancelado && setErro(e.message));
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segunda.getTime(), profissionalFiltro]);

  const dias = DIAS.map((label, i) => {
    const data = new Date(segunda);
    data.setDate(segunda.getDate() + i);
    return { label, data };
  });

  function eventosDoDia(data: Date) {
    return eventos
      .filter((ev) => {
        const d = new Date(ev.inicio);
        return d.getFullYear() === data.getFullYear() && d.getMonth() === data.getMonth() && d.getDate() === data.getDate();
      })
      .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
  }

  function abrirNovoEvento(data?: Date) {
    setEditandoId(null);
    setConflitos([]);
    const base = data ? new Date(data) : new Date();
    base.setHours(9, 0, 0, 0);
    const fim = new Date(base);
    fim.setHours(base.getHours() + 1);
    setForm({ pacienteId: "", titulo: "", tipo: "avaliacao", inicio: paraInputLocal(base), fim: paraInputLocal(fim), observacoes: "" });
    setMostrarForm(true);
  }

  function abrirEdicao(ev: EventoAgenda) {
    setEditandoId(ev.id);
    setConflitos([]);
    setForm({
      pacienteId: ev.pacienteId ?? "",
      titulo: ev.titulo,
      tipo: ev.tipo,
      inicio: paraInputLocal(new Date(ev.inicio)),
      fim: paraInputLocal(new Date(ev.fim)),
      observacoes: ev.observacoes ?? "",
    });
    setMostrarForm(true);
  }

  async function salvar(forcar = false) {
    if (!form.titulo || !form.inicio || !form.fim || salvando) return;
    setErro(null);
    setMensagem(null);
    setSalvando(true);
    const payload = {
      titulo: form.titulo,
      tipo: form.tipo,
      inicio: new Date(form.inicio).toISOString(),
      fim: new Date(form.fim).toISOString(),
      observacoes: form.observacoes || undefined,
      pacienteId: form.pacienteId || undefined,
      forcar,
    };
    try {
      const resultado = editandoId ? await api.editarEventoAgenda(editandoId, payload) : await api.criarEventoAgenda(payload);
      if (resultado.conflito) {
        setConflitos(resultado.conflitos);
        return;
      }
      setEventos((prev) => {
        const semAntigo = prev.filter((e) => e.id !== resultado.evento.id);
        return [...semAntigo, resultado.evento];
      });
      setMostrarForm(false);
      setEditandoId(null);
      setConflitos([]);
      setMensagem(editandoId ? "Evento atualizado." : "Evento criado.");
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este evento da agenda?")) return;
    setErro(null);
    setMensagem(null);
    try {
      await api.deletarEventoAgenda(id);
      setEventos((prev) => prev.filter((e) => e.id !== id));
      if (editandoId === id) setMostrarForm(false);
      setMensagem("Evento excluído.");
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 font-serif text-2xl text-ink">Agenda</h1>
          <p className="text-sm text-ink/60">
            {segunda.toLocaleDateString("pt-BR")} – {new Date(domingo.getTime() - 86400000).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ehAdmin && (
            <select
              className="rounded-lg border border-mist bg-white px-3 py-2 text-sm"
              value={profissionalFiltro}
              onChange={(e) => setProfissionalFiltro(e.target.value)}
            >
              <option value="">Todos os profissionais</option>
              {colegas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          )}
          <button
            className="rounded-lg border border-mist px-3 py-2 text-sm font-semibold text-ink/70"
            onClick={() => setReferencia((d) => new Date(d.getTime() - 7 * 86400000))}
          >
            ← Semana anterior
          </button>
          <button className="rounded-lg border border-mist px-3 py-2 text-sm font-semibold text-ink/70" onClick={() => setReferencia(new Date())}>
            Hoje
          </button>
          <button
            className="rounded-lg border border-mist px-3 py-2 text-sm font-semibold text-ink/70"
            onClick={() => setReferencia((d) => new Date(d.getTime() + 7 * 86400000))}
          >
            Próxima semana →
          </button>
          <button
            className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper disabled:opacity-40"
            disabled={salvando}
            onClick={() => abrirNovoEvento()}
          >
            + Novo evento
          </button>
        </div>
      </div>

      {erro && <div className="mb-6 rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
      {mensagem && <div className="mb-6 rounded-lg border border-sage-deep/30 bg-sage-deep/10 px-4 py-3 text-sm text-sage-deep">{mensagem}</div>}

      {mostrarForm && (
        <div className="mb-6 rounded-2xl border border-mist bg-white p-5">
          <div className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">{editandoId ? "Editar evento" : "Novo evento"}</div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-ink/70">Título</span>
              <input
                className="w-full rounded-lg border border-mist px-3 py-2"
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-ink/70">Tipo</span>
              <select
                className="w-full rounded-lg border border-mist px-3 py-2"
                value={form.tipo}
                onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
              >
                {TIPOS.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-ink/70">Paciente (opcional)</span>
              <SeletorPaciente
                pacientes={pacientes}
                value={form.pacienteId}
                onChange={(id) => setForm((f) => ({ ...f, pacienteId: id }))}
                placeholder="Buscar paciente..."
              />
            </label>
            <div className="flex items-end text-xs text-ink/50">
              {form.pacienteId &&
                (() => {
                  const prefs = pacientes.find((p) => p.id === form.pacienteId)?.preferenciasAgenda;
                  if (!prefs || (!prefs.diasPreferidos?.length && !prefs.horarioPreferido && !prefs.observacoes)) return null;
                  return (
                    <span>
                      Preferências: {[prefs.diasPreferidos?.join("/"), prefs.horarioPreferido, prefs.observacoes].filter(Boolean).join(" · ")}
                    </span>
                  );
                })()}
            </div>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-ink/70">Início</span>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-mist px-3 py-2"
                value={form.inicio}
                onChange={(e) => setForm((f) => ({ ...f, inicio: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-ink/70">Fim</span>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-mist px-3 py-2"
                value={form.fim}
                onChange={(e) => setForm((f) => ({ ...f, fim: e.target.value }))}
              />
            </label>
            <label className="col-span-2 text-sm">
              <span className="mb-1 block font-semibold text-ink/70">Observações</span>
              <input
                className="w-full rounded-lg border border-mist px-3 py-2"
                value={form.observacoes}
                onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
              />
            </label>
          </div>

          {conflitos.length > 0 && (
            <div className="mt-3 rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">
              <p className="mb-1 font-semibold">Conflito de horário com:</p>
              <ul className="mb-2 list-disc pl-5">
                {conflitos.map((c) => (
                  <li key={c.id}>
                    {c.titulo} {c.paciente && `— ${c.paciente}`} ({new Date(c.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    –{new Date(c.fim).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })})
                  </li>
                ))}
              </ul>
              <button
                className="rounded-lg bg-ember px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                disabled={salvando}
                onClick={() => salvar(true)}
              >
                {salvando ? "Criando..." : "Criar mesmo assim"}
              </button>
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper disabled:opacity-40"
              disabled={salvando}
              onClick={() => salvar(false)}
            >
              {salvando ? "Salvando..." : "Salvar"}
            </button>
            {editandoId && (
              <button className="text-sm font-semibold text-ember" onClick={() => excluir(editandoId)}>
                Excluir
              </button>
            )}
            <button
              className="text-sm text-ink/60"
              onClick={() => {
                setMostrarForm(false);
                setConflitos([]);
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-7 gap-3">
        {dias.map(({ label, data }) => (
          <div key={label} className="rounded-2xl border border-mist bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-serif text-sm">
                {label} {data.getDate()}
              </h4>
              <button className="text-xs text-ink/40 hover:text-sage-deep" onClick={() => abrirNovoEvento(data)}>
                +
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {eventosDoDia(data).map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => abrirEdicao(ev)}
                  className={`block w-full rounded-lg px-2.5 py-2 text-left text-[11.5px] font-semibold ${CORES_TIPO[ev.tipo] ?? CORES_TIPO.outro}`}
                >
                  {ev.titulo}
                  <span className="mt-0.5 block text-[10px] font-normal opacity-70">
                    {new Date(ev.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    {ev.paciente && (
                      <>
                        {" · "}
                        <Link to={`/pacientes/${ev.paciente.id}`} onClick={(e) => e.stopPropagation()} className="underline">
                          {ev.paciente.nome}
                        </Link>
                      </>
                    )}
                  </span>
                </button>
              ))}
              {eventosDoDia(data).length === 0 && <div className="text-[11px] text-ink/40">Sem eventos</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
