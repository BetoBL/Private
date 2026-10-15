import { useEffect, type Dispatch, type SetStateAction } from "react";
import { SeletorPaciente } from "./SeletorPaciente";
import type { ConflitoAgenda, Paciente, Profissional } from "../lib/api";

// Janela de "Agendar sessão" (e de bloqueio de horário). A lógica de salvar fica na Agenda; aqui só a tela.
export interface FormSessao { pacienteId: string; titulo: string; tipo: string; inicio: string; fim: string; observacoes: string; profissionalId: string; modalidade: "PRESENCIAL" | "ONLINE"; cor: string; linkVideo: string }
export type Repeticao = "" | "SEMANAL" | "QUINZENAL" | "A_CADA_4_SEMANAS";

export const CORES_SESSAO: Record<string, { nome: string; ponto: string; chip: string }> = {
  laranja: { nome: "Laranja", ponto: "bg-[#e66a1f]", chip: "bg-[#FBE8D9] text-[#a8480f]" },
  verde: { nome: "Verde", ponto: "bg-[#4f8a5b]", chip: "bg-[#E4EFE7] text-[#2F5D3A]" },
  azul: { nome: "Azul", ponto: "bg-[#3f6fb5]", chip: "bg-[#E1EAF6] text-[#27508c]" },
  lavanda: { nome: "Lavanda", ponto: "bg-[#8b6fc4]", chip: "bg-[#EAE4F6] text-[#5b3fa0]" },
  rosa: { nome: "Rosa", ponto: "bg-[#c9578a]", chip: "bg-[#F7E1EC] text-[#9b2f63]" },
  cinza: { nome: "Cinza", ponto: "bg-[#8a8a85]", chip: "bg-mist text-ink/70" },
};
const DURACOES = [30, 45, 50, 60, 75, 90, 120];
const pad = (n: number) => String(n).padStart(2, "0");
const paraInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

const entrada = "w-full rounded-xl border border-mist bg-white px-3 py-2 text-sm outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20";
const rotulo = "mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/50";
const Secao = ({ n, titulo, dica }: { n: string; titulo: string; dica: string }) => (
  <div className="mb-3 flex items-baseline gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-sage/15 text-[11px] font-bold text-sage-deep">{n}</span><h4 className="font-serif text-base text-ink">{titulo}</h4><span className="hidden text-xs text-ink/45 sm:inline">{dica}</span></div>
);

interface Props {
  editando: boolean; form: FormSessao; setForm: Dispatch<SetStateAction<FormSessao>>;
  pacientes: Paciente[]; colegas: Profissional[]; logado: { id: string; nome: string } | null;
  aoEscolherPaciente: (id: string) => void;
  repetir: Repeticao; setRepetir: (r: Repeticao) => void; vezes: number; setVezes: (n: number) => void;
  conflitos: ConflitoAgenda[]; salvando: boolean;
  aoSalvar: (forcar: boolean) => void; aoCancelar: () => void; aoDuplicar: () => void; aoExcluir: () => void;
}

export function ModalAgendarSessao(p: Props) {
  const { form, setForm } = p;
  const bloqueio = form.tipo === "bloqueio";
  const paciente = p.pacientes.find((x) => x.id === form.pacienteId);
  const ini = form.inicio ? new Date(form.inicio) : new Date();
  const fim = form.fim ? new Date(form.fim) : new Date(ini.getTime() + 3_600_000);
  const duracao = Math.max(15, Math.round((fim.getTime() - ini.getTime()) / 60000));
  const data = form.inicio.slice(0, 10), hora = form.inicio.slice(11, 16);
  const duracoes = DURACOES.includes(duracao) ? DURACOES : [...DURACOES, duracao].sort((a, b) => a - b);

  function periodo(novaData: string, novaHora: string, minutos: number) {
    if (!novaData || !novaHora) return;
    const i = new Date(`${novaData}T${novaHora}`);
    setForm((f) => ({ ...f, inicio: paraInput(i), fim: paraInput(new Date(i.getTime() + minutos * 60000)) }));
  }
  useEffect(() => { const t = (e: KeyboardEvent) => { if (e.key === "Escape") p.aoCancelar(); }; window.addEventListener("keydown", t); return () => window.removeEventListener("keydown", t); }, [p]);

  const tiposSessao = [{ v: "sessao", r: "Sessão" }, ...(paciente?.fazLaudo || form.tipo === "avaliacao" || form.tipo === "anamnese" ? [{ v: "avaliacao", r: "Avaliação (laudo)" }, { v: "anamnese", r: "Anamnese (laudo)" }] : []), { v: "outro", r: "Outro compromisso" }];
  const aba = (ativa: boolean) => `flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${ativa ? "bg-white text-sage-deep shadow" : "text-ink/50 hover:text-ink"}`;
  const seg = (ativa: boolean) => `flex-1 rounded-full px-3 py-1.5 text-sm font-semibold transition ${ativa ? "bg-white text-sage-deep shadow" : "text-ink/50"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm sm:items-center" onMouseDown={(e) => { if (e.target === e.currentTarget) p.aoCancelar(); }} role="dialog" aria-modal="true" aria-label={p.editando ? "Editar sessão" : "Agendar sessão"}>
      <div className="w-full max-w-2xl rounded-3xl border border-mist bg-paper p-6 shadow-2xl">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="flex-1 font-serif text-2xl text-ink">{p.editando ? "Editar compromisso" : bloqueio ? "Bloquear horário" : "Agendar sessão"}</h2>
          <button type="button" aria-label="Fechar" className="flex h-9 w-9 items-center justify-center rounded-full border border-mist bg-white text-ink/60 hover:text-ink" onClick={p.aoCancelar}>✕</button>
        </div>

        <div className="mb-5 flex rounded-full bg-mist/70 p-1">
          <button type="button" className={aba(!bloqueio)} onClick={() => setForm((f) => ({ ...f, tipo: f.tipo === "bloqueio" ? "sessao" : f.tipo }))}>Agendar sessão</button>
          <button type="button" className={aba(bloqueio)} onClick={() => setForm((f) => ({ ...f, tipo: "bloqueio", pacienteId: "" }))}>Bloquear horário</button>
        </div>

        <div className="space-y-6">
          <section>
            <Secao n="1" titulo={bloqueio ? "Quando" : "Paciente"} dica={bloqueio ? "o horário fica indisponível" : "quem será atendido e quando começa"} />
            <div className="grid gap-3 sm:grid-cols-2">
              {bloqueio ? (
                <label className="sm:col-span-2"><span className={rotulo}>Motivo (opcional)</span><input className={entrada} placeholder="Ex.: férias, congresso, almoço" value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} /></label>
              ) : (
                <label className="sm:col-span-2"><span className={rotulo}>Paciente</span><SeletorPaciente pacientes={p.pacientes} value={form.pacienteId} onChange={p.aoEscolherPaciente} placeholder="Buscar paciente..." /></label>
              )}
              <label><span className={rotulo}>Data</span><input type="date" className={entrada} value={data} onChange={(e) => periodo(e.target.value, hora || "09:00", duracao)} /></label>
              <div className="grid grid-cols-2 gap-3">
                <label><span className={rotulo}>Hora</span><input type="time" step={300} className={entrada} value={hora} onChange={(e) => periodo(data, e.target.value, duracao)} /></label>
                <label><span className={rotulo}>Duração</span><select className={entrada} value={duracao} onChange={(e) => periodo(data, hora, Number(e.target.value))}>{duracoes.map((m) => <option key={m} value={m}>{m >= 60 && m % 60 === 0 ? `${m / 60}h` : `${m} min`}</option>)}</select></label>
              </div>
              {!bloqueio && (
                <>
                  <label><span className={rotulo}>Tipo</span><select className={entrada} value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}>{tiposSessao.map((t) => <option key={t.v} value={t.v}>{t.r}</option>)}</select></label>
                  <div><span className={rotulo}>Como será</span><div className="flex rounded-full border border-mist bg-mist/40 p-1"><button type="button" className={seg(form.modalidade === "PRESENCIAL")} onClick={() => setForm((f) => ({ ...f, modalidade: "PRESENCIAL" }))}>📍 Presencial</button><button type="button" className={seg(form.modalidade === "ONLINE")} onClick={() => setForm((f) => ({ ...f, modalidade: "ONLINE" }))}>🎥 Online</button></div></div>
                </>
              )}
              {p.colegas.length > 0 && (
                <label className="sm:col-span-2"><span className={rotulo}>Profissional responsável</span><select className={entrada} value={form.profissionalId} onChange={(e) => setForm((f) => ({ ...f, profissionalId: e.target.value }))}><option value={p.logado?.id ?? ""}>{p.logado?.nome} (você)</option>{p.colegas.filter((c) => c.id !== p.logado?.id).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
              )}
            </div>
            {paciente?.preferenciasAgenda && (paciente.preferenciasAgenda.diasPreferidos?.length || paciente.preferenciasAgenda.horarioPreferido || paciente.preferenciasAgenda.observacoes) && (
              <p className="mt-2 rounded-lg bg-sage/10 px-3 py-2 text-xs text-sage-deep">Preferências do paciente: {[paciente.preferenciasAgenda.diasPreferidos?.join("/"), paciente.preferenciasAgenda.horarioPreferido, paciente.preferenciasAgenda.observacoes].filter(Boolean).join(" · ")}</p>
            )}
          </section>

          {!p.editando && (
            <section>
              <Secao n="2" titulo="Recorrência" dica="quando o mesmo horário vira uma sequência" />
              <div className="flex rounded-full border border-mist bg-mist/40 p-1 sm:w-72"><button type="button" className={seg(!p.repetir)} onClick={() => p.setRepetir("")}>Evento único</button><button type="button" className={seg(!!p.repetir)} onClick={() => p.setRepetir(p.repetir || "SEMANAL")}>Recorrente</button></div>
              {p.repetir && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label><span className={rotulo}>Repetir</span><select className={entrada} value={p.repetir} onChange={(e) => p.setRepetir(e.target.value as Repeticao)}><option value="SEMANAL">Toda semana</option><option value="QUINZENAL">A cada 2 semanas</option><option value="A_CADA_4_SEMANAS">A cada 4 semanas</option></select></label>
                  <label><span className={rotulo}>Quantas vezes (com este)</span><input type="number" min={2} max={52} className={entrada} value={p.vezes} onChange={(e) => p.setVezes(Math.max(2, Math.min(52, Number(e.target.value) || 2)))} /></label>
                </div>
              )}
            </section>
          )}

          <section>
            <Secao n={p.editando ? "2" : "3"} titulo="Detalhes" dica="cor, notas e recursos online" />
            <div className="space-y-3">
              <div><span className={rotulo}>Cor na agenda</span><div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setForm((f) => ({ ...f, cor: "" }))} className={`rounded-full border px-3 py-1 text-xs font-semibold ${!form.cor ? "border-sage-deep text-sage-deep" : "border-mist text-ink/50"}`}>Automática</button>
                {Object.entries(CORES_SESSAO).map(([k, c]) => <button key={k} type="button" title={c.nome} aria-label={c.nome} onClick={() => setForm((f) => ({ ...f, cor: k }))} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${form.cor === k ? "border-sage-deep text-ink" : "border-mist text-ink/50"}`}><span className={`h-3 w-3 rounded-full ${c.ponto}`} />{c.nome}</button>)}
              </div></div>
              {!bloqueio && form.modalidade === "ONLINE" && (
                <label className="block rounded-xl border border-sage/30 bg-sage/5 p-3"><span className={rotulo}>Link da videochamada (opcional)</span><input className={entrada} placeholder="Cole o link do Meet, Zoom ou outro. Se deixar vazio, use a sala do MentEssence na hora da sessão." value={form.linkVideo} onChange={(e) => setForm((f) => ({ ...f, linkVideo: e.target.value }))} /></label>
              )}
              {!bloqueio && <label className="block"><span className={rotulo}>Título (opcional)</span><input className={entrada} placeholder="Se vazio, usamos o nome do paciente" value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} /></label>}
              <label className="block"><span className={rotulo}>Notas</span><textarea rows={3} className={entrada} value={form.observacoes} onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))} /></label>
            </div>
          </section>
        </div>

        {p.conflitos.length > 0 && (
          <div className="mt-5 rounded-xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">
            <p className="mb-1 font-semibold">Conflito de horário com:</p>
            <ul className="mb-2 list-disc pl-5">{p.conflitos.map((c) => <li key={c.id}>{c.titulo} {c.paciente && `— ${c.paciente}`} ({new Date(c.inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}–{new Date(c.fim).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })})</li>)}</ul>
            <button type="button" className="rounded-full bg-ember px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40" disabled={p.salvando} onClick={() => p.aoSalvar(true)}>{p.salvando ? "Criando..." : "Criar mesmo assim"}</button>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button type="button" className="rounded-full bg-gradient-to-r from-sage-deep to-sage px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-sage/30 transition hover:brightness-105 disabled:opacity-50" disabled={p.salvando || !form.inicio || (!bloqueio && !form.pacienteId && !form.titulo.trim())} onClick={() => p.aoSalvar(false)}>
            {p.salvando ? "Salvando…" : p.editando ? "Salvar" : bloqueio ? "Bloquear horário" : "＋ Criar sessão"}
          </button>
          <button type="button" className="rounded-full border border-mist bg-white px-4 py-2 text-sm font-semibold text-ink/65" onClick={p.aoCancelar}>Cancelar</button>
          {p.editando && <><button type="button" className="text-sm font-semibold text-sage-deep" onClick={p.aoDuplicar}>Duplicar</button><button type="button" className="text-sm font-semibold text-ember" onClick={p.aoExcluir}>Excluir</button></>}
        </div>
      </div>
    </div>
  );
}
