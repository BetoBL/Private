import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// Onde ficam as partes JÁ CIFRADAS da gravação. Duas opções, escolhidas pelo servidor:
//   S3 (Cloudflare R2, Backblaze B2, AWS…): GRAVACAO_S3_ENDPOINT, GRAVACAO_S3_BUCKET, GRAVACAO_S3_ACCESS_KEY_ID, GRAVACAO_S3_SECRET_ACCESS_KEY
//   LOCAL (só desenvolvimento): GRAVACAO_DIR=<pasta>; recusado em produção, onde o disco do servidor não é permanente.
// O armazenamento só vê dado cifrado: quem o acessar sem a chave da gravação não entende nada.

export interface Armazenamento {
  nome: "LOCAL" | "S3";
  guardar(chave: string, dados: Buffer): Promise<void>;
  ler(chave: string): Promise<Buffer>;
  apagar(chave: string): Promise<void>;
}

class ArmazenamentoLocal implements Armazenamento {
  nome = "LOCAL" as const;
  constructor(private pasta: string) {}
  private caminho(chave: string) {
    const p = path.resolve(this.pasta, chave);
    if (!p.startsWith(path.resolve(this.pasta) + path.sep)) throw new Error("Caminho fora da pasta de gravações.");
    return p;
  }
  async guardar(chave: string, dados: Buffer) { const p = this.caminho(chave); await mkdir(path.dirname(p), { recursive: true }); await writeFile(p, dados); }
  async ler(chave: string) { return readFile(this.caminho(chave)); }
  async apagar(chave: string) { await rm(this.caminho(chave), { force: true }); }
}

class ArmazenamentoS3 implements Armazenamento {
  nome = "S3" as const;
  private cliente: S3Client;
  constructor(endpoint: string, private bucket: string, accessKeyId: string, secretAccessKey: string) {
    this.cliente = new S3Client({ region: "auto", endpoint, credentials: { accessKeyId, secretAccessKey }, forcePathStyle: true });
  }
  async guardar(chave: string, dados: Buffer) { await this.cliente.send(new PutObjectCommand({ Bucket: this.bucket, Key: chave, Body: dados, ContentType: "application/octet-stream" })); }
  async ler(chave: string) {
    const r = await this.cliente.send(new GetObjectCommand({ Bucket: this.bucket, Key: chave }));
    return Buffer.from(await r.Body!.transformToByteArray());
  }
  async apagar(chave: string) { await this.cliente.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: chave })); }
}

let usado: Armazenamento | null | undefined;
export function armazenamentoDeGravacoes(): Armazenamento | null {
  if (usado !== undefined) return usado;
  const e = process.env;
  if (e.GRAVACAO_S3_ENDPOINT && e.GRAVACAO_S3_BUCKET && e.GRAVACAO_S3_ACCESS_KEY_ID && e.GRAVACAO_S3_SECRET_ACCESS_KEY) usado = new ArmazenamentoS3(e.GRAVACAO_S3_ENDPOINT, e.GRAVACAO_S3_BUCKET, e.GRAVACAO_S3_ACCESS_KEY_ID, e.GRAVACAO_S3_SECRET_ACCESS_KEY);
  else if (e.GRAVACAO_DIR && e.NODE_ENV !== "production") usado = new ArmazenamentoLocal(e.GRAVACAO_DIR);
  else usado = null;
  return usado;
}
// para testes
export const redefinirArmazenamento = () => { usado = undefined; };
export const criarArmazenamentoLocal = (pasta: string): Armazenamento => new ArmazenamentoLocal(pasta);
