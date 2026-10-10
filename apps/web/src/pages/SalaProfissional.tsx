import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChamadaVideo } from "../components/ChamadaVideo";
import { GravadorSessao } from "../components/GravadorSessao";
import { api, type AcessoSala, type EstadoConsentimento } from "../lib/api";

// Tela cheia da chamada, do lado do profissional: vídeo, link para o paciente, plano da clínica e estado do consentimento.
export function SalaProfissional() {
  const { salaId } = useParams<{ salaId: string }>();
  const navigate = useNavigate();
  const [acesso, setAcesso] = useState<AcessoSala | null>(null);
  const [consent, setConsent] = useState<EstadoConsentimento | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [encerrando, setEncerrando] = useState(false);

  useEffect(() => {
    if (!salaId) return;
    api.acessoSala(salaId).then((a) => { setAcesso(a); setConsent(a.consentimento); }).catch((e) => setErro(e.message));
  }, [salaId]);

  // enquanto espera o paciente, acompanha o consentimento (só no plano completo)
  useEffect(() => {
    if (!salaId || acesso?.plano !== "COMPLETO") return;
    const t = setInterval(() => api.consentimentoSala(salaId).then(setConsent).catch(() => undefined), 4000);
    return () => clearInterval(t);
  }, [salaId, acesso?.plano]);

  async function encerrar() {
    if (!salaId || !confirm("Encerrar o atendimento? A sala será fechada para os dois.")) return;
    setEncerrando(true);
    try { await api.atualizarSalaVirtual(salaId, { statusSala: "encerrada", fimReal: new Date().toISOString() }); } catch (e) { setErro((e as Error).message); }
    navigate(-1);
  }
  async function copiar() {
    if (!acesso?.linkPaciente) return;
    try { await navigator.clipboard.writeText(acesso.linkPaciente); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { setErro("Não consegui copiar. Selecione o link abaixo e copie."); }
  }

  if (erro && !acesso) return <div className="mx-auto max-w-lg px-6 py-16 text-center"><p className="rounded-xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</p><button className="mt-4 text-sm font-semibold text-sage-deep hover:underline" onClick={() => navigate(-1)}>← Voltar</button></div>;
  if (!acesso) return <div className="px-6 py-16 text-center text-sm text-ink/55">Preparando a sala…</div>;

  return (
    <div className="flex h-screen flex-col bg-ink text-paper">
      <header className="flex flex-wrap items-center gap-3 border-b border-paper/10 px-4 py-2.5 text-sm">
        <button className="font-semibold text-paper/70 hover:text-paper" onClick={() => navigate(-1)}>← Sair da tela</button>
        <span className="font-serif text-base">Atendimento com {acesso.paciente}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${acesso.plano === "COMPLETO" ? "bg-sage-deep text-paper" : "bg-paper/15 text-paper/80"}`}>{acesso.plano === "COMPLETO" ? "Plano completo" : "Plano básico · sem gravação"}</span>
        {acesso.plano === "COMPLETO" && (
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${consent?.gravacao ? "bg-emerald-600/80" : "bg-amber-500/80 text-ink"}`}>
            {consent?.gravacao ? `Consentimento de gravação dado por ${consent.nome ?? "o paciente"}${consent.ia ? " (com IA)" : " (sem IA)"}` : "Aguardando o consentimento do paciente"}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {acesso.linkPaciente && <button className="rounded-lg border border-paper/30 px-3 py-1.5 font-semibold hover:bg-paper/10" onClick={copiar}>{copiado ? "Link copiado ✓" : "Copiar link do paciente"}</button>}
          <button className="rounded-lg bg-ember px-3 py-1.5 font-semibold text-white disabled:opacity-50" disabled={encerrando} onClick={encerrar}>Encerrar atendimento</button>
        </div>
      </header>
      {erro && <div className="bg-ember/20 px-4 py-2 text-sm text-ember">{erro}</div>}
      {acesso.linkPaciente && <div className="border-b border-paper/10 bg-paper/5 px-4 py-1.5 text-xs text-paper/60">Link do paciente: <span className="select-all font-mono">{acesso.linkPaciente}</span></div>}
      <main className="min-h-0 flex-1"><ChamadaVideo url={acesso.url} token={acesso.token} onSaiu={() => undefined} onErro={setErro}>
          {acesso.plano === "COMPLETO" && <GravadorSessao salaId={salaId!} pronta={acesso.gravacao.pronta} motivo={acesso.gravacao.motivo} consentiu={!!consent?.gravacao} ativaId={consent?.gravandoId ?? acesso.gravacao.ativaId} onMudou={() => api.consentimentoSala(salaId!).then(setConsent).catch(() => undefined)} />}
        </ChamadaVideo></main>
    </div>
  );
}
