import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type GravacaoSessao, type SalaVirtual } from "../lib/api";

interface SalaVirtualProps {
  sessaoId: string;
  dataHora: string;
}

const ROTULO_GRAVACAO: Record<string, string> = { GRAVANDO: "Gravando", CONCLUIDA: "Concluída", INCOMPLETA: "Incompleta", REVOGADA: "Interrompida (paciente retirou a autorização)", APAGADA: "Áudio apagado" };
const mmss = (s: number | null) => (s === null ? "" : `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`);

// Gravações da sessão: ouvir (o áudio é decifrado só na hora, e o acesso fica registrado) e apagar
function GravacoesDaSessao({ sessaoId }: { sessaoId: string }) {
  const [lista, setLista] = useState<GravacaoSessao[]>([]);
  const [ouvindo, setOuvindo] = useState<{ id: string; url: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const carregar = () => api.listarGravacoes({ sessaoId }).then(setLista).catch(() => undefined);
  useEffect(() => { carregar(); }, [sessaoId]);
  if (lista.length === 0) return null;
  async function ouvir(g: GravacaoSessao) {
    setErro(null);
    try { if (ouvindo) URL.revokeObjectURL(ouvindo.url); setOuvindo({ id: g.id, url: URL.createObjectURL(await api.baixarAudioGravacao(g.id)) }); } catch (e) { setErro((e as Error).message); }
  }
  async function apagar(g: GravacaoSessao) {
    if (!confirm("Apagar o áudio desta gravação? Isso não pode ser desfeito.")) return;
    try { await api.apagarGravacao(g.id); setOuvindo(null); await carregar(); } catch (e) { setErro((e as Error).message); }
  }
  return (
    <div className="mt-3 rounded-xl border border-mist bg-white p-3">
      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-sage-deep">Gravações desta sessão</div>
      {erro && <div className="mb-2 text-xs text-ember">{erro}</div>}
      <ul className="space-y-2">
        {lista.map((g) => (
          <li key={g.id} className="text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>{new Date(g.iniciadaEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} <span className="text-xs text-ink/55">· {ROTULO_GRAVACAO[g.status] ?? g.status}{g.duracaoSeg !== null ? ` · ${mmss(g.duracaoSeg)}` : ""}</span></span>
              <span className="flex gap-3 text-xs font-semibold">
                {g.temAudio && g.status !== "GRAVANDO" && <button className="text-sage-deep hover:underline" onClick={() => ouvir(g)}>Ouvir</button>}
                {g.temAudio && g.status !== "GRAVANDO" && <button className="text-ember hover:underline" onClick={() => apagar(g)}>Apagar áudio</button>}
              </span>
            </div>
            {g.temAudio && g.apagarAudioEm && g.status !== "GRAVANDO" && <div className="text-[11px] text-ink/45">O áudio é apagado automaticamente em {new Date(g.apagarAudioEm).toLocaleDateString("pt-BR")}.</div>}
            {ouvindo?.id === g.id && <audio controls autoPlay src={ouvindo.url} className="mt-2 w-full" />}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SalaVirtualComponent({ sessaoId }: SalaVirtualProps) {
  const navigate = useNavigate();
  const [sala, setSala] = useState<SalaVirtual | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    api.listSalasVirtuais(sessaoId).then((salas) => { const aberta = salas.find((s) => s.statusSala !== "encerrada"); if (aberta) setSala(aberta); }).catch(() => undefined);
  }, [sessaoId]);

  async function criarSala() {
    setCarregando(true); setErro(null);
    try { setSala(await api.criarSalaVirtual({ sessaoId })); } catch (e) { setErro((e as Error).message); } finally { setCarregando(false); }
  }

  async function entrarSala() {
    if (!sala) return;
    if (sala.provedor === "LIVEKIT") { navigate(`/sala/${sala.id}`); return; }
    // sala antiga (link público do Jitsi)
    try {
      if (!sala.inicioReal) await api.atualizarSalaVirtual(sala.id, { statusSala: "em_andamento", inicioReal: new Date().toISOString(), profissionalPresente: true });
      window.open(sala.urlJitsi, "_blank");
    } catch (e) { setErro((e as Error).message); }
  }

  async function encerrarSala() {
    if (!sala) return;
    try { await api.atualizarSalaVirtual(sala.id, { statusSala: "encerrada", fimReal: new Date().toISOString() }); setSala(null); } catch (e) { setErro((e as Error).message); }
  }

  async function copiarLink() {
    if (!sala?.linkPaciente) return;
    try { await navigator.clipboard.writeText(sala.linkPaciente); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { setErro("Não consegui copiar. Selecione o link e copie."); }
  }

  return (
    <div className="space-y-3">
      {erro && <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}

      {!sala ? (
        <div className="rounded-2xl border border-mist bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-ink">Atendimento online (telepsicologia)</div>
              <p className="mt-1 text-xs text-ink/60">Videochamada protegida, aberta dentro do sistema. O paciente entra por um link, sem precisar de login.</p>
            </div>
            <button className="shrink-0 rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper disabled:opacity-40" disabled={carregando} onClick={criarSala}>{carregando ? "Criando…" : "✦ Criar sala"}</button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-sage-deep/50 bg-sage-deep/5 p-4">
          <div className="mb-3">
            <div className="font-semibold text-ink">Sala {sala.statusSala === "em_andamento" ? "em andamento" : "pronta"}</div>
            {sala.provedor !== "LIVEKIT" && <p className="mt-0.5 text-xs text-amber-800">Sala no link público antigo (sem gravação e sem consentimento no sistema). A videochamada dentro do sistema ainda não está configurada neste servidor.</p>}
            {sala.linkPaciente && (
              <div className="mt-2 rounded-lg bg-white/60 p-2">
                <div className="text-[11px] font-semibold text-ink/55">Link para enviar ao paciente</div>
                <div className="break-all font-mono text-[11px] text-ink/70">{sala.linkPaciente}</div>
                <button className="mt-1 text-xs font-semibold text-sage-deep hover:underline" onClick={copiarLink}>{copiado ? "Copiado ✓" : "Copiar link"}</button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button className="flex-1 rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper" onClick={entrarSala}>🎥 Entrar na sala</button>
            <button className="rounded-lg border border-mist px-4 py-2 text-sm font-semibold text-ember" onClick={encerrarSala}>Encerrar sala</button>
          </div>
          <div className="mt-3 text-xs text-ink/50">
            Criada: {new Date(sala.criadoEm).toLocaleString("pt-BR")}
            {sala.inicioReal && ` • Iniciada: ${new Date(sala.inicioReal).toLocaleTimeString("pt-BR")}`}
            {sala.pacientePresente && " • Paciente já entrou"}
          </div>
        </div>
      )}
      <GravacoesDaSessao sessaoId={sessaoId} />
    </div>
  );
}
