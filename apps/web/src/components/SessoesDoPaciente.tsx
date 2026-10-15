import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type LinhaSessoes, type ItemSessao } from "../lib/api";
import { CORES_SESSAO } from "./ModalAgendarSessao";

// Aba "Sessões" da ficha: linha do tempo por mês com o que já foi feito em cada sessão (evolução, IA, laudo).
const ROTULO_TIPO: Record<string, string> = { sessao: "Sessão", avaliacao: "Avaliação", anamnese: "Anamnese", outro: "Compromisso" };
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function linkDaSessao(pacienteId: string, i: ItemSessao): string | null {
  if (i.evolucao) return `/pacientes/${pacienteId}/sessao?evolucao=${i.evolucao.id}`;
  if (i.eventoId) return `/pacientes/${pacienteId}/sessao?evento=${i.eventoId}&inicio=${encodeURIComponent(i.inicio)}`;
  return null;
}

export function SessoesDoPaciente({ pacienteId, fazLaudo }: { pacienteId: string; fazLaudo: boolean }) {
  const navigate = useNavigate();
  const [dados, setDados] = useState<LinhaSessoes | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<"TODAS" | "PROXIMAS" | "HISTORICO" | "LAUDO">("TODAS");
  useEffect(() => { api.linhaSessoes(pacienteId).then(setDados).catch((e) => setErro((e as Error).message)); }, [pacienteId]);

  const grupos = useMemo(() => {
    const itens = (dados?.itens ?? []).filter((i) => filtro === "TODAS" || (filtro === "PROXIMAS" && !i.passada) || (filtro === "HISTORICO" && i.passada) || (filtro === "LAUDO" && i.laudo));
    const m = new Map<string, ItemSessao[]>();
    for (const i of itens) { const d = new Date(i.inicio); const k = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`; m.set(k, [...(m.get(k) ?? []), i]); }
    return [...m.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [dados, filtro]);

  const pill = (ativo: boolean) => `rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${ativo ? "bg-sage-deep text-white shadow" : "bg-white text-ink/60 border border-mist hover:border-sage"}`;
  const temLaudo = (dados?.itens ?? []).some((i) => i.laudo);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-mist bg-gradient-to-br from-white to-mist/40 p-5 shadow-[0_8px_24px_-12px_rgba(38,38,36,0.12)]">
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-xl text-ink">Sessões</h2>
          <p className="text-sm text-ink/55">Cada sessão com a sua evolução. Abra uma para anotar e gerar a evolução com IA.</p>
        </div>
        <button className="rounded-full bg-gradient-to-r from-sage-deep to-sage px-5 py-2 text-sm font-semibold text-white shadow-md shadow-sage/30 transition hover:brightness-105" onClick={() => navigate(`/agenda?novo=1&pacienteId=${pacienteId}`)}>＋ Nova sessão</button>
      </div>

      {erro && <div className="rounded-xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}

      {dados && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {([["Próximas", dados.totais.proximas, "text-sage-deep"], ["No histórico", dados.totais.historico, "text-ink"], ["Evoluções faltando", dados.totais.evolucoesFaltando, dados.totais.evolucoesFaltando ? "text-ember" : "text-ink/40"]] as const).map(([r, n, cor]) => (
              <div key={r} className="rounded-2xl border border-mist bg-white p-4 text-center shadow-sm"><div className={`font-serif text-3xl ${cor}`}>{n}</div><div className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink/45">{r}</div></div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={pill(filtro === "TODAS")} onClick={() => setFiltro("TODAS")}>Todas</button>
            <button className={pill(filtro === "PROXIMAS")} onClick={() => setFiltro("PROXIMAS")}>Próximas</button>
            <button className={pill(filtro === "HISTORICO")} onClick={() => setFiltro("HISTORICO")}>Histórico</button>
            {(fazLaudo || temLaudo) && <button className={pill(filtro === "LAUDO")} onClick={() => setFiltro("LAUDO")}>Só de laudo</button>}
          </div>

          {grupos.length === 0 && <p className="rounded-2xl border border-dashed border-mist px-4 py-10 text-center text-sm text-ink/45">Nenhuma sessão por aqui ainda. Use "Nova sessão" para agendar a primeira.</p>}

          {grupos.map(([k, itens]) => {
            const [ano, mes] = k.split("-").map(Number);
            return (
              <section key={k}>
                <h3 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-clay">{MESES[mes]} de {ano}</h3>
                <ul className="space-y-2.5">
                  {itens.map((i) => {
                    const d = new Date(i.inicio);
                    const link = linkDaSessao(pacienteId, i);
                    const cor = (i.cor && CORES_SESSAO[i.cor]?.ponto) || (i.laudo ? "bg-[#c25716]" : "bg-sage");
                    const ev = i.evolucao;
                    const faltando = i.passada && !(ev?.temTexto);
                    return (
                      <li key={i.chave} className="flex items-stretch gap-4 rounded-2xl border border-mist bg-white p-3 pr-4 shadow-sm transition hover:shadow-md">
                        <div className={`flex w-16 shrink-0 flex-col items-center justify-center rounded-xl text-white ${cor}`}>
                          <span className="font-serif text-2xl leading-none">{d.getDate()}</span>
                          <span className="text-[11px] font-semibold uppercase">{d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="truncate font-semibold text-ink">{i.titulo}</span>
                            <span className="text-sm text-ink/50">{d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                            <span className="rounded-full bg-mist px-2 py-0.5 text-ink/60">{ROTULO_TIPO[i.tipo] ?? i.tipo}</span>
                            {i.modalidade && <span className="rounded-full bg-mist px-2 py-0.5 text-ink/60">{i.modalidade === "ONLINE" ? "🎥 Online" : "📍 Presencial"}</span>}
                            {i.laudo && <span className="rounded-full bg-[#FBE8D9] px-2 py-0.5 text-[#a8480f]">Laudo</span>}
                            {!i.passada && <span className="rounded-full bg-sage/15 px-2 py-0.5 text-sage-deep">Agendada</span>}
                            {ev?.status === "FINALIZADA" && <span className="rounded-full bg-[#E4EFE7] px-2 py-0.5 text-[#2F5D3A]">✓ Evolução finalizada</span>}
                            {ev && ev.status === "RASCUNHO" && ev.temTexto && <span className="rounded-full bg-mist px-2 py-0.5 text-ink/60">Rascunho</span>}
                            {ev?.geradaPorIA && <span className="rounded-full bg-[#EAE4F6] px-2 py-0.5 text-[#5b3fa0]">✨ com apoio de IA</span>}
                            {faltando && <span className="rounded-full bg-ember/10 px-2 py-0.5 text-ember">Evolução faltando</span>}
                          </div>
                        </div>
                        <div className="flex items-center">
                          {link ? <Link to={link} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${faltando || (ev && ev.status === "RASCUNHO") ? "bg-gradient-to-r from-sage-deep to-sage text-white shadow-md shadow-sage/30" : "border border-mist bg-white text-ink/70 hover:border-sage hover:text-sage-deep"}`}>{faltando ? "Registrar" : ev ? "Abrir" : "Iniciar"}</Link> : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
