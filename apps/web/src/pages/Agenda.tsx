import { useAviso } from "../lib/aviso";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BotaoVoltar } from "../components/BotaoVoltar";
import { useAuth } from "../context/AuthContext";
import { CORES_SESSAO, ModalAgendarSessao, type FormSessao } from "../components/ModalAgendarSessao";
import { api, type ConflitoAgenda, type EventoAgenda, type Paciente, type Profissional } from "../lib/api";

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const TIPOS = [
  { valor: "sessao", label: "Sessão" },
  { valor: "avaliacao", label: "Avaliação" },
  { valor: "anamnese", label: "Anamnese" },
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
  sessao: "bg-[#E4EFE7] text-[#2F5D3A]",
  avaliacao: "bg-[#FBE8D9] text-sage-deep",
  anamnese: "bg-[#E4EFE7] text-[#2F5D3A]",
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
  const [profissionalFiltro, setProfissionalFiltro] = useState<string>(logado?.id ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useAviso();

  const [mostrarForm, setMostrarForm] = useState(false);
  const [params, setParams] = useSearchParams();
  // atalho da ficha: /agenda?novo=1&pacienteId=... abre a janela já com o paciente
  useEffect(() => {
    if (params.get("novo") !== "1" || pacientes.length === 0) return;
    const pid = params.get("pacienteId") ?? "";
    abrirNovoEventoComProfissional();
    if (pid) atualizarPacienteComPreferencias(pid);
    setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, pacientes.length]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [conflitos, setConflitos] = useState<ConflitoAgenda[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<FormSessao>({ pacienteId: "", titulo: "", tipo: "sessao", inicio: "", fim: "", observacoes: "", profissionalId: logado?.id ?? "", modalidade: "PRESENCIAL", cor: "", linkVideo: "" });
  const [repetir, setRepetir] = useState<"" | "SEMANAL" | "QUINZENAL" | "A_CADA_4_SEMANAS">("");
  const [vezes, setVezes] = useState(12);

  function atualizarPacienteComPreferencias(pacienteId: string) {
    setForm((f) => {
      const paciente = pacientes.find((p) => p.id === pacienteId);
      const prefs = paciente?.preferenciasAgenda;
      let novoForm = { ...f, pacienteId };

      if (prefs?.horarioPreferido && !f.inicio) {
        const [horas, minutos] = prefs.horarioPreferido.split(":").map(Number);
        const inicio = new Date();
        inicio.setHours(horas, minutos, 0, 0);
        const fim = new Date(inicio);
        fim.setHours(fim.getHours() + 1);
        novoForm = { ...novoForm, inicio: paraInputLocal(inicio), fim: paraInputLocal(fim) };
      }
      return novoForm;
    });
  }

  function abrirNovoEventoComProfissional(data?: Date, profId?: string) {
    setEditandoId(null);
    setConflitos([]);
    const base = data ? new Date(data) : new Date();
    base.setHours(9, 0, 0, 0);
    const fim = new Date(base);
    fim.setHours(base.getHours() + 1);
    setForm({
      pacienteId: "",
      titulo: "",
      tipo: "sessao",
      inicio: paraInputLocal(base),
      fim: paraInputLocal(fim),
      observacoes: "",
      profissionalId: profId ?? logado?.id ?? "",
      modalidade: "PRESENCIAL",
      cor: "",
      linkVideo: "",
    });
    setMostrarForm(true);
  }

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
      profissionalId: ev.profissionalId,
      modalidade: ev.modalidade ?? "PRESENCIAL",
      cor: ev.cor ?? "",
      linkVideo: ev.linkVideo ?? "",
    });
    setMostrarForm(true);
  }

  async function salvar(forcar = false) {
    if (!form.inicio || !form.fim || salvando) return;
    const nomePaciente = pacientes.find((p) => p.id === form.pacienteId)?.nome;
    const tituloFinal = form.titulo.trim() || (form.tipo === "bloqueio" ? "Indisponível" : nomePaciente ? `${TIPOS.find((x) => x.valor === form.tipo)?.label ?? "Sessão"} · ${nomePaciente}` : "");
    if (!tituloFinal) return;
    setErro(null);
    setMensagem(null);
    setSalvando(true);
    const payload = {
      titulo: tituloFinal,
      tipo: form.tipo,
      modalidade: form.tipo === "bloqueio" ? null : form.modalidade,
      cor: form.cor || null,
      linkVideo: form.modalidade === "ONLINE" ? form.linkVideo.trim() || null : null,
      inicio: new Date(form.inicio).toISOString(),
      fim: new Date(form.fim).toISOString(),
      observacoes: form.observacoes || undefined,
      pacienteId: form.pacienteId || undefined,
      profissionalId: form.profissionalId || logado?.id,
      forcar,
    };
    try {
      const resultado = editandoId ? await api.editarEventoAgenda(editandoId, payload) : await api.criarEventoAgenda({ ...payload, ...(repetir ? { recorrencia: { frequencia: repetir, ocorrencias: vezes } } : {}) });
      if (resultado.conflito) {
        setConflitos(resultado.conflitos);
        return;
      }
      setEventos((prev) => {
        const novos = resultado.eventos ?? [resultado.evento];
        const semAntigo = prev.filter((e) => !novos.some((n) => n.id === e.id));
        return [...semAntigo, ...novos.filter((n) => new Date(n.fim) >= segunda && new Date(n.inicio) <= domingo)];
      });
      setMostrarForm(false);
      setEditandoId(null);
      setConflitos([]);
      setMensagem(editandoId ? "Compromisso atualizado." : resultado.eventos ? `${resultado.eventos.length} sessões criadas na série.` : form.tipo === "bloqueio" ? "Horário bloqueado." : "Sessão criada.");
      setRepetir("");
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id: string) {
    const ev = eventos.find((e) => e.id === id);
    const serie = !!ev?.serieId && confirm("Este evento faz parte de uma recorrência.\n\nOK = excluir este e os próximos da série.\nCancelar = escolher outra opção.");
    if (!serie && !confirm("Excluir apenas este evento da agenda?")) return;
    setErro(null);
    setMensagem(null);
    try {
      await api.deletarEventoAgenda(id, serie);
      setEventos((prev) => prev.filter((e) => (serie && ev?.serieId ? !(e.serieId === ev.serieId && new Date(e.inicio) >= new Date(ev.inicio)) : e.id !== id)));
      if (editandoId === id) setMostrarForm(false);
      setMensagem("Evento excluído.");
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  function duplicarEvento(id: string) {
    const evento = eventos.find((e) => e.id === id);
    if (!evento) return;
    setEditandoId(null);
    setConflitos([]);
    const inicio = new Date(evento.inicio);
    const fim = new Date(evento.fim);
    setForm({
      pacienteId: evento.pacienteId ?? "",
      titulo: evento.titulo,
      tipo: evento.tipo,
      inicio: paraInputLocal(inicio),
      fim: paraInputLocal(fim),
      observacoes: evento.observacoes ?? "",
      profissionalId: evento.profissionalId,
      modalidade: evento.modalidade ?? "PRESENCIAL",
      cor: evento.cor ?? "",
      linkVideo: evento.linkVideo ?? "",
    });
    setMostrarForm(true);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <BotaoVoltar />
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
            onClick={() => abrirNovoEventoComProfissional()}
          >
            + Agendar sessão
          </button>
        </div>
      </div>

      {erro && <div className="mb-6 rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
      {mensagem && <div className="mb-6 rounded-lg border border-sage-deep/30 bg-sage-deep/10 px-4 py-3 text-sm text-sage-deep">{mensagem}</div>}

      {mostrarForm && (
        <ModalAgendarSessao
          editando={!!editandoId} form={form} setForm={setForm} pacientes={pacientes} colegas={colegas} logado={logado ? { id: logado.id, nome: logado.nome } : null}
          aoEscolherPaciente={atualizarPacienteComPreferencias} repetir={repetir} setRepetir={setRepetir} vezes={vezes} setVezes={setVezes}
          conflitos={conflitos} salvando={salvando} aoSalvar={salvar} aoCancelar={() => { setMostrarForm(false); setConflitos([]); setEditandoId(null); }}
          aoDuplicar={() => editandoId && duplicarEvento(editandoId)} aoExcluir={() => editandoId && excluir(editandoId)}
        />
      )}

      <div className="grid grid-cols-7 gap-3">
        {dias.map(({ label, data }) => (
          <div key={label} className="rounded-2xl border border-mist bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-serif text-sm">
                {label} {data.getDate()}
              </h4>
              <button className="text-xs text-ink/40 hover:text-sage-deep" onClick={() => abrirNovoEventoComProfissional(data)}>
                +
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {eventosDoDia(data).map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => abrirEdicao(ev)}
                  className={`block w-full rounded-lg px-2.5 py-2 text-left text-[11.5px] font-semibold ${(ev.cor && CORES_SESSAO[ev.cor]?.chip) || CORES_TIPO[ev.tipo] || CORES_TIPO.outro}`}
                >
                  {ev.modalidade === "ONLINE" ? "🎥 " : ""}{ev.titulo}
                  <span className="mt-0.5 block text-[10px] font-normal opacity-70">
                    {new Date(ev.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    {ev.paciente && (
                      <>
                        {" · "}
                        <Link to={`/pacientes/${ev.paciente.id}`} onClick={(e) => e.stopPropagation()} className="underline">
                          {ev.paciente.nome}
                        </Link>
                        {ev.tipo !== "anamnese" && (
                          <>
                            {" · "}
                            <Link to={`/pacientes/${ev.paciente.id}/sessao?evento=${ev.id}&inicio=${encodeURIComponent(ev.inicio)}`} onClick={(e) => e.stopPropagation()} className="font-semibold underline">
                              evolução →
                            </Link>
                          </>
                        )}
                        {ev.tipo === "anamnese" && (
                          <>
                            {" · "}
                            <Link to={`/pacientes/${ev.paciente.id}?aba=anamnese`} onClick={(e) => e.stopPropagation()} className="font-semibold underline">
                              preencher anamnese →
                            </Link>
                          </>
                        )}
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
