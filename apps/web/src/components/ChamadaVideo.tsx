import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";

// Chamada de vídeo (LiveKit) ocupando o espaço da página. A sessão só conecta quando há token; ao sair, avisa quem chamou.
export function ChamadaVideo({ url, token, onSaiu, onErro }: { url: string; token: string; onSaiu: () => void; onErro?: (msg: string) => void }) {
  return (
    <LiveKitRoom
      serverUrl={url} token={token} connect video audio data-lk-theme="default" style={{ height: "100%" }}
      onDisconnected={onSaiu} onError={(e) => onErro?.(e.message)} onMediaDeviceFailure={() => onErro?.("Não consegui acessar a câmera ou o microfone. Permita o acesso no navegador e tente de novo.")}
    >
      <VideoConference />
    </LiveKitRoom>
  );
}
