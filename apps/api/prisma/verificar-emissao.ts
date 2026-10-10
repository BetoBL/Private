// Verificação manual: caminhos de falha do orquestrador contra o banco LOCAL, com envio simulado por código.
//   DATABASE_URL=postgresql://postgres:postgres@localhost:5544/neurologic_local FISCAL_CRYPTO_KEY=<32 bytes base64> npx tsx prisma/verificar-emissao.ts
// Recusa rodar fora do banco local. Cria e apaga as próprias cobranças/notas de teste e restaura o próximo número.
import assert from "node:assert/strict";
import forge from "node-forge";
import { criarRascunho, emitirNota, ErroFiscal } from "../src/lib/fiscal/emissao";
import { guardarCertificado, removerCertificado } from "../src/lib/fiscal/nfse/certificado";
import { prisma } from "../src/lib/prisma";

async function main() {
  const host = (process.env.DATABASE_URL ?? "").replace(/^.*@/, "").replace(/\/.*$/, "");
  assert.equal(host, "localhost:5544", "só roda no banco local");
  const cfg0 = await prisma.configFiscal.findFirstOrThrow();
  const clinicaId = cfg0.clinicaId;
  await prisma.configFiscal.update({ where: { clinicaId }, data: { emissaoAtiva: true } }); // o script liga a emissão e restaura no fim
  const pac = await prisma.paciente.findFirstOrThrow({ where: { clinicaId, cpf: { not: null } } });

  const keys = forge.pki.rsa.generateKeyPair(1024);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey; cert.serialNumber = "01";
  cert.validity.notBefore = new Date(Date.now() - 172800000); cert.validity.notAfter = new Date(Date.now() + 86400000 * 300);
  const attrs = [{ name: "commonName", value: "TESTE LOCAL" }]; cert.setSubject(attrs); cert.setIssuer(attrs); cert.sign(keys.privateKey, forge.md.sha256.create());
  const pfx = Buffer.from(forge.asn1.toDer(forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], "x", { algorithm: "3des" })).getBytes(), "binary");
  await guardarCertificado(clinicaId, pfx, "x");

  const novaNota = async (desc: string) => {
    const c = await prisma.cobranca.create({ data: { clinicaId, pacienteId: pac.id, descricao: desc, valor: 100, vencimento: new Date("2026-10-10T00:00:00Z"), status: "PAGA", valorPago: 100, pagoEm: new Date("2026-10-10T00:00:00Z") } });
    return criarRascunho(clinicaId, [c.id]);
  };
  const ok = async () => ({ ok: true as const, status: 200, chaveAcesso: "3530607" + "1".repeat(43), nfseXml: "<NFSe><nNFSe>77</nNFSe></NFSe>", corpo: {} });
  const recusa = async () => ({ ok: false as const, status: 400, erro: "A SEFIN recusou (400): E0310 — Campo obrigatório ausente.", detalhe: null });
  const semResposta = async () => { throw new Error("socket hang up"); };

  const antes = (await prisma.configFiscal.findUniqueOrThrow({ where: { clinicaId } })).proximoNumeroDps;
  // 1) autorizada
  const n1 = await emitirNota((await novaNota("teste NF 1")).id, clinicaId, { enviar: ok as never });
  assert.equal(n1.status, "EMITIDA"); assert.equal(n1.numero, antes); assert.equal(n1.numeroNfse, "77"); assert.equal(n1.chaveAcesso?.length, 50);
  assert.match(n1.xmlDps ?? "", /<Signature/); // saiu assinada
  // 2) recusada: número gasto, motivo gravado, e dá para tentar de novo com outro número
  const n2 = await emitirNota((await novaNota("teste NF 2")).id, clinicaId, { enviar: recusa as never });
  assert.equal(n2.status, "REJEITADA"); assert.equal(n2.numero, antes + 1); assert.match(n2.erro ?? "", /E0310/);
  const n2b = await emitirNota(n2.id, clinicaId, { enviar: ok as never });
  assert.equal(n2b.status, "EMITIDA"); assert.match(JSON.stringify(n2b.avisos), new RegExp(`número ${antes + 1} .* recusada`)); assert.equal(n2b.numero, antes + 2); assert.equal(n2b.tentativas, 2);
  // 3) sem resposta: PENDENTE e não reenvia sozinho
  const n3 = await emitirNota((await novaNota("teste NF 3")).id, clinicaId, { enviar: semResposta as never });
  assert.equal(n3.status, "PENDENTE");
  await assert.rejects(() => emitirNota(n3.id, clinicaId, { enviar: ok as never }), (e: unknown) => e instanceof ErroFiscal && e.codigo === "PENDENTE");
  // 3b) fora do esquema oficial: recusada ANTES de gastar número
  const antesXsd = (await prisma.configFiscal.findUniqueOrThrow({ where: { clinicaId } })).proximoNumeroDps;
  await prisma.configFiscal.update({ where: { clinicaId }, data: { regApuracaoSn: "9" } }); // valor que o XSD não aceita
  await assert.rejects(async () => emitirNota((await novaNota("teste NF xsd")).id, clinicaId, { enviar: ok as never }), (e: unknown) => e instanceof ErroFiscal && e.codigo === "FORA_DO_ESQUEMA");
  await prisma.configFiscal.update({ where: { clinicaId }, data: { regApuracaoSn: cfg0.regApuracaoSn } });
  assert.equal((await prisma.configFiscal.findUniqueOrThrow({ where: { clinicaId } })).proximoNumeroDps, antesXsd, "nota inválida não pode gastar número");
  // 4) duas emissões ao mesmo tempo nunca repetem número
  const [a, b] = await Promise.all([novaNota("teste NF 4a"), novaNota("teste NF 4b")]);
  const [ea, eb] = await Promise.all([emitirNota(a.id, clinicaId, { enviar: ok as never }), emitirNota(b.id, clinicaId, { enviar: ok as never })]);
  assert.notEqual(ea.numero, eb.numero);
  const numeros = (await prisma.notaFiscal.findMany({ where: { clinicaId, serie: cfg0.serieDps, ambiente: "HOMOLOGACAO", numero: { gte: antes } }, select: { numero: true } })).map((n) => n.numero);
  assert.equal(new Set(numeros).size, numeros.length, "nenhum número repetido");
  console.log("OK: autorizada, recusada+nova tentativa, pendente bloqueada, fora do esquema sem gastar número, concorrência sem número repetido. Números:", numeros.sort().join(","));

  // limpeza do que o teste criou (banco local)
  const testes = await prisma.cobranca.findMany({ where: { clinicaId, descricao: { startsWith: "teste NF" } }, select: { id: true, notaFiscalId: true } });
  await prisma.cobranca.deleteMany({ where: { id: { in: testes.map((t) => t.id) } } });
  await prisma.notaFiscal.deleteMany({ where: { id: { in: testes.map((t) => t.notaFiscalId).filter((x): x is string => !!x) } } });
  await removerCertificado(clinicaId);
  await prisma.configFiscal.update({ where: { clinicaId }, data: { proximoNumeroDps: antes, emissaoAtiva: cfg0.emissaoAtiva } });
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
