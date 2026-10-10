import { SignedXml } from "xml-crypto";

// Assinatura digital da DPS (NFS-e padrão nacional). Porte do assinador do sistema Infinity.
//
// O `infDPS` TEM atributo `Id` e a assinatura precisa referenciá-lo (`URI="#DPS…"`); assinar o documento inteiro (`URI=""`) produziria uma
// assinatura sintaticamente válida e semanticamente errada, que parece funcionar até a SEFIN recusar. A assinatura fica DENTRO de <DPS>,
// como irmã de <infDPS>.
//
// SHA-1 é o algoritmo do padrão de documentos fiscais brasileiros (como na NF-e): não é escolha de segurança nossa, é o que o schema exige.

const ALGORITMO_ASSINATURA = "http://www.w3.org/2000/09/xmldsig#rsa-sha1";
const ALGORITMO_DIGEST = "http://www.w3.org/2000/09/xmldsig#sha1";
const C14N = "http://www.w3.org/TR/2001/REC-xml-c14n-20010315";
const ENVELOPED = "http://www.w3.org/2000/09/xmldsig#enveloped-signature";

export const idDoInfDps = (xml: string): string | null => /<infDPS[^>]*\sId="([^"]+)"/.exec(xml)?.[1] ?? null;

export function assinarDps(xmlDps: string, privateKeyPem: string, certPem: string): string {
  const id = idDoInfDps(xmlDps);
  if (!id) throw new Error("Não encontrei o atributo Id em infDPS: a assinatura precisa referenciá-lo.");
  const sig = new SignedXml({ privateKey: privateKeyPem, publicCert: certPem, signatureAlgorithm: ALGORITMO_ASSINATURA, canonicalizationAlgorithm: C14N });
  sig.addReference({
    xpath: "//*[local-name(.)='infDPS']",
    digestAlgorithm: ALGORITMO_DIGEST,
    // enveloped primeiro, canonicalização depois: a ordem das transformações faz parte do que é assinado
    transforms: [ENVELOPED, C14N],
  });
  // a assinatura entra como irmã de infDPS, dentro de DPS
  sig.computeSignature(xmlDps, { location: { reference: "//*[local-name(.)='infDPS']", action: "after" } });
  return sig.getSignedXml();
}

// Confere uma assinatura já aplicada: serve ao teste e a diagnosticar recusa da SEFIN sem reenviar.
export function verificarAssinaturaDps(xmlAssinado: string, certPem: string): { valida: boolean; motivo: string | null } {
  const m = /<(?:\w+:)?Signature[\s\S]*<\/(?:\w+:)?Signature>/.exec(xmlAssinado);
  if (!m) return { valida: false, motivo: "Nenhuma assinatura encontrada no XML." };
  const sig = new SignedXml({ publicCert: certPem });
  sig.loadSignature(m[0]);
  const valida = sig.checkSignature(xmlAssinado);
  return { valida, motivo: valida ? null : sig.getSignedReferences().length === 0 ? "Assinatura inválida." : "Assinatura inválida (digest ou chave não conferem)." };
}
