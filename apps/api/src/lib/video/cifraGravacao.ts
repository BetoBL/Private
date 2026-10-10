import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Cifra do áudio gravado (criptografia em envelope):
//   - cada gravação tem uma chave própria de 256 bits (gerada aqui, nunca reaproveitada);
//   - cada PARTE do áudio é cifrada com AES-256-GCM usando essa chave; o número da parte e o id da gravação entram como dado autenticado,
//     então trocar, repetir ou mover partes entre gravações faz a leitura falhar;
//   - a chave da gravação fica guardada no banco CIFRADA pela chave mestra do servidor (GRAVACAO_CRYPTO_KEY: 32 bytes em base64 ou 64 hex).
// Sem a chave mestra, nada é gravado (nunca se grava sem proteção).

export class ErroCifra extends Error { constructor(public codigo: "SEM_CHAVE" | "FORMATO", m: string) { super(m); } }

function chaveMestra(): Buffer {
  const bruta = process.env.GRAVACAO_CRYPTO_KEY?.trim();
  if (!bruta) throw new ErroCifra("SEM_CHAVE", "O servidor ainda não tem a chave de proteção das gravações (GRAVACAO_CRYPTO_KEY).");
  const b = /^[0-9a-fA-F]{64}$/.test(bruta) ? Buffer.from(bruta, "hex") : Buffer.from(bruta, "base64");
  if (b.length !== 32) throw new ErroCifra("SEM_CHAVE", "GRAVACAO_CRYPTO_KEY inválida: precisa ter 32 bytes (base64) ou 64 caracteres hexadecimais.");
  return b;
}

export const chaveMestraConfigurada = () => { try { chaveMestra(); return true; } catch { return false; } };

export const novaChaveDeGravacao = () => randomBytes(32);

// chave da gravação ⇄ texto guardado no banco
export function envolverChave(chave: Buffer): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", chaveMestra(), iv);
  const dados = Buffer.concat([c.update(chave), c.final()]);
  return ["v1", iv.toString("base64"), c.getAuthTag().toString("base64"), dados.toString("base64")].join(":");
}
export function desenvolverChave(texto: string): Buffer {
  const [v, iv, tag, dados] = texto.split(":");
  if (v !== "v1" || !iv || !tag || !dados) throw new ErroCifra("FORMATO", "Chave da gravação em formato desconhecido.");
  const d = createDecipheriv("aes-256-gcm", chaveMestra(), Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(dados, "base64")), d.final()]);
}

const aad = (gravacaoId: string, parte: number) => Buffer.from(`${gravacaoId}:${parte}`);

// parte do áudio → iv(12) + tag(16) + dados cifrados
export function cifrarParte(chave: Buffer, gravacaoId: string, parte: number, claro: Buffer): Buffer {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", chave, iv);
  c.setAAD(aad(gravacaoId, parte));
  const dados = Buffer.concat([c.update(claro), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), dados]);
}
export function decifrarParte(chave: Buffer, gravacaoId: string, parte: number, cifrado: Buffer): Buffer {
  if (cifrado.length < 28) throw new ErroCifra("FORMATO", "Parte da gravação corrompida.");
  const d = createDecipheriv("aes-256-gcm", chave, cifrado.subarray(0, 12));
  d.setAAD(aad(gravacaoId, parte));
  d.setAuthTag(cifrado.subarray(12, 28));
  return Buffer.concat([d.update(cifrado.subarray(28)), d.final()]);
}
