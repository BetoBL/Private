import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, type EventoAgenda } from "../lib/api";
import { CORES_SESSAO } from "./ModalAgendarSessao";

// Visão geral da home: números clicáveis, atalhos, a agenda de hoje e a semana em um relance.
interface Props { pacientes: number; evolucoesPendentes: number; laudosParaRevisar: number; alertas: number; temLaudos: boolean }

const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const mesmoDia = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

function Numero({ para, ancora, icone, valor, rotulo, tom, destaque }: { para?: string; ancora?: string; icone: string; valor: number | string; rotulo: string; tom: "laranja" | "verde" | "neutro" | "alerta"; destaque?: boolean }) {
  const fundo = { laranja: "from-[#fbe8d9] to-white", verde: "from-[#e4efe7] to-white", neutro: "from-mist to-white", alerta: "from-ember/15 to-white" }[tom];
  const cor = { laranja: "text-sage-deep", verde: "text-[#2f5d3a]", neutro: "text-ink", alerta: "text-ember" }[tom];
  const corpo = (
    <>
      <span className="text-xl" aria-hidden>{icone}</span>
      <span className={`mt-2 block font-serif text-4xl leading-none ${cor}`}>{valor}</span>
      <span className="mt-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">{rotulo}</span>
    </>
  );
  const classe = `group block rounded-2xl border bg-gradient-to-br ${fundo} p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${destaque ? "border-ember/40 ring-2 ring-ember/20" : "border-mist"}`;
  return para ? <Link to={para} className={classe}>{corpo}</Link> : <a href={`#${ancora}`} className={classe}>{corpo}</a>;
}

export function VisaoGeral({ pacientes, evolucoesPendentes, laudosParaRevisar, alertas, temLaudos }: Props) {
  const [eventos, setEventos] = useState<EventoAgenda[]>([]);
  const hoje = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  useEffect(() => {
    const fim = new Date(hoje.getTime() + 7 * 86_400_000);
    api.listEventosAgenda({ inicio: hoje.toISOString(), fim: fim.toISOString() }).then(setEventos).catch(() => undefined);
  }, [hoje]);

  const reais = eventos.filter((e) => e.tipo !== "bloqueio");
  const deHoje = reais.filter((e) => mesmoDia(new Date(e.inicio), hoje)).sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
  const semana = Array.from({ length: 7 }, (_, i) => { const d = new Date(hoje.getTime() + i * 86_400_000); return { d, n: reais.filter((e) => mesmoDia(new Date(e.inicio), d)).length }; });
  const agora = Date.now();
  const proximo = deHoje.find((e) => new Date(e.fim).getTime() > agora);

  const atalho = "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition";
  return (
    <div className="mb-8 space-y-5">
      <div className="flex flex-wrap gap-2.5">
        <Link to="/agenda?novo=1" className={`${atalho} bg-gradient-to-r from-sage-deep to-sage text-white shadow-md shadow-sage/30 hover:brightness-105`}>＋ Agendar sessão</Link>
        <Link to="/pacientes?novo=1" className={`${atalho} border border-mist bg-white text-ink/70 shadow-sm hover:border-sage hover:text-sage-deep`}>👤 Novo paciente</Link>
        <Link to="/iniciar-atendimento" className={`${atalho} border border-mist bg-white text-ink/70 shadow-sm hover:border-sage hover:text-sage-deep`}>▶ Iniciar atendimento</Link>
        <Link to="/notas" className={`${atalho} border border-mist bg-white text-ink/70 shadow-sm hover:border-sage hover:text-sage-deep`}>📓 Notas</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Numero para="/agenda" icone="📅" valor={deHoje.length} rotulo="Sessões hoje" tom="laranja" />
        <Numero ancora="evolucoes-pendentes" icone="📝" valor={evolucoesPendentes} rotulo="Evoluções a concluir" tom={evolucoesPendentes ? "alerta" : "verde"} />
        <Numero para="/pacientes" icone="👥" valor={pacientes} rotulo="Pacientes" tom="neutro" />
        {temLaudos ? <Numero para="/laudos" icone="📄" valor={laudosParaRevisar} rotulo="Laudos para revisar" tom="verde" /> : <Numero ancora="avisos" icone="🔔" valor={alertas} rotulo="Precisam de atenção" tom={alertas ? "alerta" : "verde"} destaque={alertas > 0} />}
      </div>
      {temLaudos && alertas > 0 && <a href="#avisos" className="block rounded-2xl border border-ember/40 bg-ember/5 px-4 py-3 text-sm font-semibold text-ember ring-2 ring-ember/10 hover:bg-ember/10">🔔 {alertas} paciente(s) precisam da sua atenção. Ver agora</a>}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-mist bg-white p-5 shadow-[0_8px_24px_-12px_rgba(38,38,36,0.12)]">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-serif text-lg text-ink">Hoje na agenda</h2><Link to="/agenda" className="text-sm font-semibold text-sage-deep hover:underline">Abrir agenda</Link></div>
          {deHoje.length === 0 ? <p className="rounded-xl border border-dashed border-mist px-4 py-8 text-center text-sm text-ink/45">Nada agendado para hoje. Um bom dia para organizar prontuários.</p> : (
            <ul className="space-y-2">
              {deHoje.map((e) => {
                const passou = new Date(e.fim).getTime() < agora;
                const emCurso = !passou && new Date(e.inicio).getTime() <= agora;
                const ponto = (e.cor && CORES_SESSAO[e.cor]?.ponto) || "bg-sage";
                return (
                  <li key={e.id} className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 ${emCurso ? "border-sage bg-sage/10" : "border-mist"} ${passou ? "opacity-60" : ""}`}>
                    <span className={`h-10 w-1.5 rounded-full ${ponto}`} />
                    <div className="w-24 shrink-0 text-sm"><span className="font-semibold text-ink">{hora(e.inicio)}</span><span className="text-ink/40"> – {hora(e.fim)}</span></div>
                    <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-ink">{e.modalidade === "ONLINE" ? "🎥 " : ""}{e.titulo}</div>{emCurso && <div className="text-xs font-semibold text-sage-deep">em andamento</div>}{proximo?.id === e.id && !emCurso && <div className="text-xs font-semibold text-sage-deep">próxima</div>}</div>
                    {e.linkVideo && <a href={e.linkVideo} target="_blank" rel="noreferrer" className="rounded-full border border-mist px-3 py-1 text-xs font-semibold text-ink/70 hover:border-sage">Entrar na chamada</a>}
                    {e.paciente && e.tipo !== "outro" && <Link to={`/pacientes/${e.paciente.id}/sessao?evento=${e.id}&inicio=${encodeURIComponent(e.inicio)}`} className="rounded-full bg-gradient-to-r from-sage-deep to-sage px-4 py-1.5 text-xs font-semibold text-white shadow shadow-sage/30">{passou ? "Registrar" : "Abrir sessão"}</Link>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-mist bg-white p-5 shadow-[0_8px_24px_-12px_rgba(38,38,36,0.12)]">
          <h2 className="mb-3 font-serif text-lg text-ink">Próximos 7 dias</h2>
          <div className="grid grid-cols-7 gap-1.5">
            {semana.map(({ d, n }, i) => (
              <Link key={i} to="/agenda" className={`flex flex-col items-center rounded-xl px-1 py-3 text-center transition hover:-translate-y-0.5 hover:shadow ${i === 0 ? "bg-sage-deep text-white" : n ? "bg-sage/10 text-sage-deep" : "bg-mist/60 text-ink/40"}`}>
                <span className="text-[10px] font-bold uppercase">{DIAS[d.getDay()]}</span>
                <span className="font-serif text-xl leading-tight">{d.getDate()}</span>
                <span className="mt-1 text-[10px] font-semibold">{n ? `${n} sess.` : "livre"}</span>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink/50">{semana.reduce((s, x) => s + x.n, 0)} sessão(ões) nesta semana. Toque num dia para abrir a agenda.</p>
        </section>
      </div>
    </div>
  );
}
