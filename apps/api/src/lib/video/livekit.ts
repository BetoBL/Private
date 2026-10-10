import { randomBytes } from "node:crypto";
import { AccessToken } from "livekit-server-sdk";

// Videochamada pelo LiveKit (nuvem ou servidor próprio). Configuração por variáveis de ambiente do servidor:
//   LIVEKIT_URL         wss://<projeto>.livekit.cloud  (ou ws://localhost:7880 em desenvolvimento)
//   LIVEKIT_API_KEY / LIVEKIT_API_SECRET
// Sem elas a chamada dentro do sistema fica indisponível (a sala volta ao link público antigo).

export interface ConfigLivekit { url: string; apiKey: string; apiSecret: string }

export function configLivekit(): ConfigLivekit | null {
  const url = process.env.LIVEKIT_URL?.trim(), apiKey = process.env.LIVEKIT_API_KEY?.trim(), apiSecret = process.env.LIVEKIT_API_SECRET?.trim();
  return url && apiKey && apiSecret ? { url, apiKey, apiSecret } : null;
}

export class VideoIndisponivel extends Error { constructor() { super("A videochamada dentro do sistema ainda não foi configurada no servidor (LIVEKIT_URL, LIVEKIT_API_KEY e LIVEKIT_API_SECRET)."); } }

// Token de entrada na sala: vale poucas horas e só para a sala indicada
export async function tokenDaSala(a: { sala: string; identidade: string; nome: string; ttlHoras?: number }): Promise<{ token: string; url: string }> {
  const cfg = configLivekit();
  if (!cfg) throw new VideoIndisponivel();
  const t = new AccessToken(cfg.apiKey, cfg.apiSecret, { identity: a.identidade, name: a.nome, ttl: `${a.ttlHoras ?? 4}h` });
  t.addGrant({ roomJoin: true, room: a.sala, canPublish: true, canSubscribe: true, canPublishData: true });
  return { token: await t.toJwt(), url: cfg.url };
}

export const novoSegredoDoLink = () => randomBytes(24).toString("base64url");
export const nomeDaSala = (clinicaId: string, sessaoId: string) => `neurologic-${clinicaId.slice(0, 8)}-${sessaoId.slice(0, 8)}`.toLowerCase();
