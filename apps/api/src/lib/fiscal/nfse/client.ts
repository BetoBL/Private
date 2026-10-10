import https from "node:https";
import { promisify } from "node:util";
import zlib from "node:zlib";

// Cliente da API do Emissor Nacional da NFS-e (SEFIN Nacional). Porte do cliente do sistema Infinity, já exercitado em produção restrita.
//
// O corpo NÃO é o XML: é JSON com o XML da DPS assinado, comprimido em GZip e em Base64: { "dpsXmlGZipB64": "…" }. A resposta de sucesso traz
// a NFS-e no mesmo formato (`nfseXmlGZipB64`). Autenticação é mTLS com o certificado ICP-Brasil A1; 403 quase sempre é cadeia de certificado
// incompleta, não credencial errada. A chave de acesso da NFS-e tem 50 caracteres (a da NF-e tem 44).
//
// O transporte usa key/cert em PEM, não pfx/passphrase: o parser de PKCS#12 do Node (OpenSSL 3) recusa certificados ICP-Brasil antigos
// ("Unsupported PKCS12 PFX data"), enquanto o node-forge os lê (ver certificado.ts).

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

export type AmbienteNfse = "homologacao" | "producao";
export const BASES: Record<AmbienteNfse, string> = {
  homologacao: "https://sefin.producaorestrita.nfse.gov.br/SefinNacional",
  producao: "https://sefin.nfse.gov.br/SefinNacional",
};
const TIMEOUT_MS = 60_000;

export interface CertificadoPem { privateKeyPem: string; certPem: string }
interface Resposta { status: number; corpo: Record<string, unknown> | null; texto: string }

export function baseDoAmbiente(ambiente: string): string {
  const base = BASES[ambiente as AmbienteNfse];
  if (!base) throw new Error(`Ambiente desconhecido: ${ambiente}. Use 'homologacao' ou 'producao'.`);
  return base;
}

export async function comprimirParaEnvio(xml: string): Promise<string> {
  if (!xml || !String(xml).trim()) throw new Error("XML vazio.");
  return (await gzip(Buffer.from(String(xml), "utf8"))).toString("base64");
}
export async function descomprimirDaResposta(base64: unknown): Promise<string | null> {
  if (!base64) return null;
  return (await gunzip(Buffer.from(String(base64), "base64"))).toString("utf8");
}

function requisicao(a: { url: string; metodo: string; corpo?: unknown; cert: CertificadoPem }): Promise<Resposta> {
  return new Promise((resolve, reject) => {
    const u = new URL(a.url);
    const dados = a.corpo ? Buffer.from(JSON.stringify(a.corpo), "utf8") : null;
    const req = https.request(
      { hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, method: a.metodo, key: a.cert.privateKeyPem, cert: a.cert.certPem, timeout: TIMEOUT_MS,
        headers: { Accept: "application/json", ...(dados ? { "Content-Type": "application/json", "Content-Length": dados.length } : {}) } },
      (res) => {
        const pedacos: Buffer[] = [];
        res.on("data", (d: Buffer) => pedacos.push(d));
        res.on("end", () => {
          const texto = Buffer.concat(pedacos).toString("utf8");
          let corpo: Record<string, unknown> | null = null;
          try { corpo = texto ? JSON.parse(texto) : null; } catch { /* resposta que não é JSON */ }
          resolve({ status: res.statusCode ?? 0, corpo, texto });
        });
      }
    );
    req.on("timeout", () => { req.destroy(); reject(new Error(`A SEFIN Nacional não respondeu em ${TIMEOUT_MS / 1000}s.`)); });
    req.on("error", reject);
    if (dados) req.write(dados);
    req.end();
  });
}

// Formato do erro da SEFIN: { "erro": { "codigo": "E2401", "descricao": "…" } } (um erro ou uma lista).
function erroDaSefin(corpo: Record<string, unknown> | null): string | null {
  const e = corpo?.erro as unknown;
  if (!e) return null;
  const lista = (Array.isArray(e) ? e : [e]) as Array<{ codigo?: string; descricao?: string }>;
  const textos = lista.map((x) => [x.codigo, x.descricao].filter(Boolean).join(" — ")).filter(Boolean);
  return textos.length ? textos.join(" | ") : null;
}

export type Interpretacao =
  | { ok: true; status: number; corpo: Record<string, unknown> | null }
  | { ok: false; status: number; erro: string; duplicada?: boolean; codigoSefin?: string | null; detalhe: unknown };

// Traduz a resposta HTTP em algo que a tela entenda; 403, 400 e 409 têm causa conhecida e mensagem própria.
export function interpretar(r: { status: number; corpo: Record<string, unknown> | null }): Interpretacao {
  const { status, corpo } = r;
  const daSefin = erroDaSefin(corpo);
  const codigoSefin = ((corpo?.erro as { codigo?: string } | undefined)?.codigo) ?? null;
  if (status === 403) return { ok: false, status, erro: "A SEFIN recusou o certificado (403). Quase sempre é cadeia de certificado incompleta, não senha errada: confira se o A1 está completo e dentro da validade.", detalhe: corpo };
  if (status === 400) return { ok: false, status, erro: daSefin ? `A SEFIN recusou (400): ${daSefin}` : "A SEFIN recusou o conteúdo (400): XML fora do schema ou embalagem GZip/Base64 incorreta.", codigoSefin, detalhe: corpo };
  if (status === 409) return { ok: false, status, erro: "Esta DPS já foi enviada antes (409). Consulte a NFS-e existente em vez de reenviar.", duplicada: true, detalhe: corpo };
  if (status >= 200 && status < 300) return { ok: true, status, corpo };
  return { ok: false, status, erro: daSefin || `A SEFIN respondeu ${status}.`, codigoSefin, detalhe: corpo };
}

export async function enviarDps(a: { xmlAssinado: string; cert: CertificadoPem; ambiente: AmbienteNfse }) {
  const dpsXmlGZipB64 = await comprimirParaEnvio(a.xmlAssinado);
  const r = interpretar(await requisicao({ url: `${baseDoAmbiente(a.ambiente)}/nfse`, metodo: "POST", corpo: { dpsXmlGZipB64 }, cert: a.cert }));
  if (!r.ok) return r;
  return { ok: true as const, status: r.status, chaveAcesso: (r.corpo?.chaveAcesso as string | undefined) ?? null, nfseXml: await descomprimirDaResposta(r.corpo?.nfseXmlGZipB64), corpo: r.corpo };
}

export async function consultarNfse(a: { chaveAcesso: string; cert: CertificadoPem; ambiente: AmbienteNfse }) {
  const r = interpretar(await requisicao({ url: `${baseDoAmbiente(a.ambiente)}/nfse/${encodeURIComponent(a.chaveAcesso)}`, metodo: "GET", cert: a.cert }));
  if (!r.ok) return r;
  return { ok: true as const, status: r.status, nfseXml: await descomprimirDaResposta(r.corpo?.nfseXmlGZipB64), corpo: r.corpo };
}

// Registra um evento (cancelamento inclusive): o XML do evento também vai assinado e embalado como a DPS.
export async function registrarEvento(a: { chaveAcesso: string; xmlEventoAssinado: string; cert: CertificadoPem; ambiente: AmbienteNfse }) {
  const pedidoRegistroEventoXmlGZipB64 = await comprimirParaEnvio(a.xmlEventoAssinado);
  const r = interpretar(await requisicao({ url: `${baseDoAmbiente(a.ambiente)}/nfse/${encodeURIComponent(a.chaveAcesso)}/eventos`, metodo: "POST", corpo: { pedidoRegistroEventoXmlGZipB64 }, cert: a.cert }));
  if (!r.ok) return r;
  return { ok: true as const, status: r.status, eventoXml: await descomprimirDaResposta(r.corpo?.eventoXmlGZipB64 ?? r.corpo?.nfseXmlGZipB64), corpo: r.corpo };
}

// Confere se uma DPS já foi recebida, sem reenviar: a defesa contra duplicidade quando um envio falhou sem resposta clara.
// Também serve de prova de conexão: o aperto de mãos mTLS só passa com certificado aceito.
export async function dpsJaEnviada(a: { idDps: string; cert: CertificadoPem; ambiente: AmbienteNfse }) {
  const r = await requisicao({ url: `${baseDoAmbiente(a.ambiente)}/dps/${encodeURIComponent(a.idDps)}`, metodo: "HEAD", cert: a.cert });
  return { existe: r.status >= 200 && r.status < 300, status: r.status };
}
