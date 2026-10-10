import { RoomEvent, Track } from "livekit-client";
import { useRoomContext } from "@livekit/components-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

// Gravador da sessão (só profissional, plano completo). Fica DENTRO da chamada: mistura o áudio do profissional e do paciente num só,
// grava em pedaços de 10 s e envia cada pedaço ao servidor, que o cifra antes de guardar. Nada é gravado sem o consentimento do paciente;
// se ele for retirado, o servidor recusa o próximo pedaço, apaga o que já guardou e o gravador para sozinho.

interface Props { salaId: string; pronta: boolean; motivo: string | null; consentiu: boolean; ativaId: string | null; onMudou: () => void }

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const PEDACO_MS = 10_000;

export function GravadorSessao({ salaId, pronta, motivo, consentiu, ativaId, onMudou }: Props) {
  const room = useRoomContext();
  const [estado, setEstado] = useState<"parado" | "gravando" | "finalizando">("parado");
  const [segundos, setSegundos] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const g = useRef<{ ctx: AudioContext; dest: MediaStreamAudioDestinationNode; rec: MediaRecorder; id: string; n: number; fila: Promise<void>; fontes: Map<string, MediaStreamAudioSourceNode>; inicio: number; parouLocal: boolean } | null>(null);

  const conectar = useCallback((track: MediaStreamTrack | undefined) => {
    const s = g.current;
    if (!s || !track || s.fontes.has(track.id)) return;
    const src = s.ctx.createMediaStreamSource(new MediaStream([track]));
    src.connect(s.dest);
    s.fontes.set(track.id, src);
  }, []);
  const varrer = useCallback(() => {
    conectar(room.localParticipant.getTrackPublication(Track.Source.Microphone)?.track?.mediaStreamTrack);
    room.remoteParticipants.forEach((p) => p.audioTrackPublications.forEach((pub) => conectar(pub.track?.mediaStreamTrack)));
  }, [room, conectar]);

  useEffect(() => {
    // quem entra ou liga o microfone depois da gravação começar também entra na mistura
    const eventos = [RoomEvent.TrackSubscribed, RoomEvent.LocalTrackPublished, RoomEvent.ParticipantConnected, RoomEvent.TrackUnmuted];
    eventos.forEach((e) => room.on(e, varrer));
    return () => { eventos.forEach((e) => room.off(e, varrer)); };
  }, [room, varrer]);

  async function enviarParte(n: number, blob: Blob): Promise<void> {
    for (let tentativa = 1; tentativa <= 4; tentativa++) {
      const r = await api.enviarParteGravacao(g.current!.id, n, blob);
      if (r.ok) return;
      if (r.codigo === "REVOGADA" || r.status === 409 || r.status === 404) { pararLocal(r.erro ?? "A gravação foi interrompida."); return; }
      await new Promise((ok) => setTimeout(ok, 1500 * tentativa));
    }
    setAviso("Não consegui enviar um trecho da gravação (conexão). A gravação continua; confira a conexão.");
  }

  function limpar() {
    const s = g.current;
    if (!s) return;
    s.fontes.forEach((f) => f.disconnect());
    void s.ctx.close().catch(() => undefined);
    g.current = null;
  }
  function pararLocal(mensagem: string) {
    const s = g.current;
    if (!s) return;
    s.parouLocal = true;
    if (s.rec.state !== "inactive") s.rec.stop();
    limpar();
    setEstado("parado"); setAviso(mensagem); onMudou();
  }

  async function iniciar() {
    setAviso(null);
    try {
      const gravacao = await api.iniciarGravacao(salaId);
      const ctx = new AudioContext();
      const dest = ctx.createMediaStreamDestination();
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const rec = new MediaRecorder(dest.stream, { mimeType: mime, audioBitsPerSecond: 32_000 });
      g.current = { ctx, dest, rec, id: gravacao.id, n: 0, fila: Promise.resolve(), fontes: new Map(), inicio: Date.now(), parouLocal: false };
      varrer();
      rec.ondataavailable = (e) => { const s = g.current; if (s && e.data.size > 0) { const n = s.n++; s.fila = s.fila.then(() => enviarParte(n, e.data)); } };
      rec.start(PEDACO_MS);
      setSegundos(0); setEstado("gravando"); onMudou();
    } catch (e) { setAviso((e as Error).message); limpar(); }
  }

  async function parar() {
    const s = g.current;
    if (!s) return;
    setEstado("finalizando");
    const duracao = Math.round((Date.now() - s.inicio) / 1000);
    const id = s.id;
    await new Promise<void>((ok) => { s.rec.addEventListener("stop", () => ok(), { once: true }); s.rec.stop(); });
    await s.fila; // espera os últimos pedaços chegarem ao servidor
    limpar();
    await api.encerrarGravacao(id, duracao).catch(() => undefined);
    setEstado("parado"); onMudou();
  }

  // o paciente retirou o consentimento durante a gravação
  useEffect(() => { if (estado === "gravando" && !consentiu) pararLocal("O paciente retirou a autorização: a gravação foi interrompida e o áudio guardado foi apagado."); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [consentiu, estado]);
  useEffect(() => {
    if (estado !== "gravando") return;
    const t = setInterval(() => setSegundos(Math.round((Date.now() - (g.current?.inicio ?? Date.now())) / 1000)), 1000);
    const avisar = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", avisar);
    return () => { clearInterval(t); window.removeEventListener("beforeunload", avisar); };
  }, [estado]);
  useEffect(() => () => { if (g.current) { g.current.parouLocal = true; if (g.current.rec.state !== "inactive") g.current.rec.stop(); limpar(); } }, []);

  const caixa = "absolute right-3 top-3 z-20 max-w-xs rounded-xl border border-paper/20 bg-ink/90 px-3 py-2 text-xs text-paper shadow-lg backdrop-blur";
  if (!pronta) return <div className={caixa}>Gravação indisponível neste servidor{motivo ? `: ${motivo}` : ""}.</div>;
  return (
    <div className={caixa}>
      {estado === "gravando" ? (
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-semibold"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />Gravando {mmss(segundos)}</span>
          <button className="rounded-lg bg-paper px-3 py-1.5 font-semibold text-ink" onClick={parar}>Parar</button>
        </div>
      ) : estado === "finalizando" ? <span>Finalizando a gravação…</span> : ativaId && !g.current ? (
        <div>Há uma gravação em andamento aberta em outra tela. <button className="ml-1 font-semibold underline" onClick={async () => { await api.encerrarGravacao(ativaId).catch(() => undefined); onMudou(); }}>Encerrar essa gravação</button></div>
      ) : (
        <button className="w-full rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white disabled:bg-paper/20 disabled:text-paper/60" disabled={!consentiu} onClick={iniciar}>
          {consentiu ? "● Iniciar gravação" : "Aguardando a autorização do paciente"}
        </button>
      )}
      {aviso && <div className="mt-2 text-amber-300">{aviso}</div>}
    </div>
  );
}
