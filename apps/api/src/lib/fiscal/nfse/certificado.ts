import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import forge from "node-forge";
import { prisma } from "../../prisma";
import type { CertificadoPem } from "./client";

// Certificado digital A1 da clínica. O .pfx e a senha ficam CIFRADOS no banco (AES-256-GCM) com a chave FISCAL_CRYPTO_KEY do servidor
// (32 bytes em base64 ou 64 caracteres hex); sem a chave configurada o envio é recusado, nunca guardado sem proteção.
// O .pfx é lido com o node-forge (o parser do Node/OpenSSL 3 recusa certificados ICP-Brasil antigos).

export class ErroCertificado extends Error { constructor(public codigo: "SEM_CHAVE" | "SENHA" | "FORMATO" | "VENCIDO" | "SEM_CERTIFICADO", mensagem: string) { super(mensagem); } }

function chave(): Buffer {
  const bruta = process.env.FISCAL_CRYPTO_KEY?.trim();
  if (!bruta) throw new ErroCertificado("SEM_CHAVE", "O servidor ainda não tem a chave de proteção do certificado (FISCAL_CRYPTO_KEY). Peça a quem administra o servidor para configurá-la antes de enviar o certificado.");
  const b = /^[0-9a-fA-F]{64}$/.test(bruta) ? Buffer.from(bruta, "hex") : Buffer.from(bruta, "base64");
  if (b.length !== 32) throw new ErroCertificado("SEM_CHAVE", "FISCAL_CRYPTO_KEY inválida: precisa ter 32 bytes (base64) ou 64 caracteres hexadecimais.");
  return b;
}

export function cifrar(textoPuro: Buffer | string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", chave(), iv);
  const dados = Buffer.concat([c.update(textoPuro), c.final()]);
  return ["v1", iv.toString("base64"), c.getAuthTag().toString("base64"), dados.toString("base64")].join(":");
}
export function decifrar(valor: string): Buffer {
  const [v, iv, tag, dados] = valor.split(":");
  if (v !== "v1" || !iv || !tag || !dados) throw new ErroCertificado("FORMATO", "Dado cifrado em formato desconhecido.");
  const d = createDecipheriv("aes-256-gcm", chave(), Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(dados, "base64")), d.final()]);
}

export interface CertificadoLido extends CertificadoPem { titular: string; validoAte: Date; validoDesde: Date }

// Abre o .pfx: devolve chave e certificado em PEM, titular e validade. Erra com mensagem clara para senha errada, arquivo inválido e vencido.
export function lerPfx(pfx: Buffer, senha: string): CertificadoLido {
  let p12: forge.pkcs12.Pkcs12Pfx;
  try {
    p12 = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(forge.util.createBuffer(pfx.toString("binary"))), false, senha);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/password|mac|invalid/i.test(msg) && /password|mac/i.test(msg)) throw new ErroCertificado("SENHA", "Senha do certificado incorreta.");
    throw new ErroCertificado("FORMATO", "Não consegui abrir o arquivo. Envie o certificado A1 em formato .pfx ou .p12.");
  }
  const chaves = [
    ...(p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag] ?? []),
    ...(p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag] ?? []),
  ];
  const certs = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag] ?? [];
  const chave = chaves.find((b) => b.key)?.key as forge.pki.rsa.PrivateKey | undefined;
  if (!chave) throw new ErroCertificado("FORMATO", "O arquivo não contém uma chave privada. Envie o certificado A1 completo (.pfx com a chave).");
  // o certificado do emitente é o que casa com a chave privada (o .pfx pode trazer também a cadeia)
  const dele = certs.map((b) => b.cert).filter((c): c is forge.pki.Certificate => !!c).find((c) => (c.publicKey as forge.pki.rsa.PublicKey).n.equals(chave.n));
  if (!dele) throw new ErroCertificado("FORMATO", "Não achei, no arquivo, o certificado que corresponde à chave privada.");
  if (dele.validity.notAfter.getTime() < Date.now()) throw new ErroCertificado("VENCIDO", `Certificado vencido em ${dele.validity.notAfter.toLocaleDateString("pt-BR")}.`);
  const cn = dele.subject.getField("CN")?.value as string | undefined;
  return { privateKeyPem: forge.pki.privateKeyToPem(chave), certPem: forge.pki.certificateToPem(dele), titular: cn ?? "(sem nome)", validoAte: dele.validity.notAfter, validoDesde: dele.validity.notBefore };
}

// Valida e guarda (cifrado) o certificado da clínica
export async function guardarCertificado(clinicaId: string, pfx: Buffer, senha: string): Promise<{ titular: string; validoAte: Date }> {
  const lido = lerPfx(pfx, senha); // valida antes de guardar
  const dados = { certificadoCifrado: cifrar(pfx), certificadoSenhaCifrada: cifrar(senha), certificadoTitular: lido.titular, certificadoValidoAte: lido.validoAte };
  await prisma.configFiscal.upsert({ where: { clinicaId }, update: dados, create: { clinicaId, ...dados } });
  return { titular: lido.titular, validoAte: lido.validoAte };
}

export async function removerCertificado(clinicaId: string): Promise<void> {
  await prisma.configFiscal.updateMany({ where: { clinicaId }, data: { certificadoCifrado: null, certificadoSenhaCifrada: null, certificadoTitular: null, certificadoValidoAte: null } });
}

export async function carregarCertificadoDaClinica(clinicaId: string): Promise<CertificadoLido> {
  const cfg = await prisma.configFiscal.findUnique({ where: { clinicaId }, select: { certificadoCifrado: true, certificadoSenhaCifrada: true } });
  if (!cfg?.certificadoCifrado || !cfg.certificadoSenhaCifrada) throw new ErroCertificado("SEM_CERTIFICADO", "A clínica ainda não enviou o certificado digital A1.");
  return lerPfx(decifrar(cfg.certificadoCifrado), decifrar(cfg.certificadoSenhaCifrada).toString("utf8"));
}
