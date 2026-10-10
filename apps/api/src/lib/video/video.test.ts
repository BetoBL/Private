import assert from "node:assert/strict";
import { test } from "node:test";
import { estadoDoConsentimento, type RegistroConsentimento } from "./consentimento";
import { configLivekit, nomeDaSala, novoSegredoDoLink, tokenDaSala, VideoIndisponivel } from "./livekit";

const t = (min: number) => new Date(Date.UTC(2026, 9, 10, 12, min));
const reg = (tipo: string, concedido: boolean, min: number, revogadoEm: Date | null = null): RegistroConsentimento => ({ tipo, concedido, criadoEm: t(min), revogadoEm, nomeDeclarante: "Maria Exemplo", declaradoPor: "RESPONSAVEL" });

test("consentimento: sem resposta nada é autorizado", () => {
  assert.deepEqual(estadoDoConsentimento([]), { gravacao: false, ia: false, nome: null, declaradoPor: null, em: null });
});

test("consentimento: gravação sem IA, gravação com IA, e a IA nunca vale sem a gravação", () => {
  assert.deepEqual([estadoDoConsentimento([reg("GRAVACAO", true, 1), reg("TRANSCRICAO_IA", false, 1)])].map((e) => [e.gravacao, e.ia])[0], [true, false]);
  assert.deepEqual([estadoDoConsentimento([reg("GRAVACAO", true, 1), reg("TRANSCRICAO_IA", true, 1)])].map((e) => [e.gravacao, e.ia])[0], [true, true]);
  assert.deepEqual([estadoDoConsentimento([reg("GRAVACAO", false, 1), reg("TRANSCRICAO_IA", true, 1)])].map((e) => [e.gravacao, e.ia])[0], [false, false]);
});

test("consentimento: vale a resposta mais recente, e revogar tira a autorização sem apagar o histórico", () => {
  const mudouDeIdeia = estadoDoConsentimento([reg("GRAVACAO", true, 1), reg("GRAVACAO", false, 5), reg("TRANSCRICAO_IA", true, 1)]);
  assert.equal(mudouDeIdeia.gravacao, false);
  const revogado = estadoDoConsentimento([reg("GRAVACAO", true, 1, t(9)), reg("TRANSCRICAO_IA", true, 1, t(9))]);
  assert.deepEqual([revogado.gravacao, revogado.ia], [false, false]);
  const quemEQuando = estadoDoConsentimento([reg("GRAVACAO", true, 3)]);
  assert.deepEqual([quemEQuando.nome, quemEQuando.declaradoPor, quemEQuando.em?.toISOString()], ["Maria Exemplo", "RESPONSAVEL", t(3).toISOString()]);
});

test("LiveKit: token só vale para a sala pedida, com identidade e nome, e some sem configuração", async () => {
  delete process.env.LIVEKIT_URL; delete process.env.LIVEKIT_API_KEY; delete process.env.LIVEKIT_API_SECRET;
  assert.equal(configLivekit(), null);
  await assert.rejects(() => tokenDaSala({ sala: "x", identidade: "a", nome: "A" }), VideoIndisponivel);
  process.env.LIVEKIT_URL = "ws://localhost:7880"; process.env.LIVEKIT_API_KEY = "devkey"; process.env.LIVEKIT_API_SECRET = "secret-de-teste-com-mais-de-32-caracteres";
  const { token, url } = await tokenDaSala({ sala: "sala-1", identidade: "paciente-1", nome: "Maria" });
  assert.equal(url, "ws://localhost:7880");
  const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
  assert.equal(claims.iss, "devkey"); assert.equal(claims.sub, "paciente-1"); assert.equal(claims.name, "Maria");
  assert.equal(claims.video.room, "sala-1"); assert.equal(claims.video.roomJoin, true);
  assert.ok(claims.exp - claims.nbf > 0 && claims.exp - claims.nbf <= 4 * 3600 + 5, "token curto (poucas horas)");
  assert.equal(claims.video.roomAdmin, undefined); // quem entra não administra a sala
});

test("link: segredo longo e imprevisível, e nome de sala sem dado pessoal", () => {
  const a = novoSegredoDoLink(), b = novoSegredoDoLink();
  assert.notEqual(a, b);
  assert.match(a, /^[A-Za-z0-9_-]{32}$/);
  assert.match(nomeDaSala("ABCDEF12-0000", "98765432-1111"), /^neurologic-abcdef12-98765432$/);
});
