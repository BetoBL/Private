import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";
import forge from "node-forge";
import { assinarDps, idDoInfDps, verificarAssinaturaDps } from "./assinatura";
import { cifrar, decifrar, lerPfx } from "./certificado";
import { comprimirParaEnvio, descomprimirDaResposta, interpretar } from "./client";
import { dataHoraComFuso, ErroDps, montarDps, montarIdDps, type EntradaDps } from "./dpsBuilder";
import { aliquotaEfetivaSimples } from "./simples";

// certificado autoassinado só para teste (sem validade fiscal)
function certificadoDeTeste(senha: string, diasDeValidade = 365) {
  const keys = forge.pki.rsa.generateKeyPair(1024);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = "01";
  cert.validity.notBefore = new Date(Date.now() - 86_400_000 * 2);
  cert.validity.notAfter = new Date(Date.now() + diasDeValidade * 86_400_000);
  const attrs = [{ name: "commonName", value: "CLINICA TESTE LTDA:45614597000100" }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());
  const asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], senha, { algorithm: "3des" });
  return { pfx: Buffer.from(forge.asn1.toDer(asn1).getBytes(), "binary"), certPem: forge.pki.certificateToPem(cert), keyPem: forge.pki.privateKeyToPem(keys.privateKey) };
}

const entrada: EntradaDps = {
  prestador: { cnpj: "45.614.597/0001-00", inscricaoMunicipal: "167297", codigoMunicipioIbge: "3530607", opSimplesNacional: "3", ambiente: "homologacao" },
  tomador: { documento: "000.000.000-00", nome: "Tomador de Teste" },
  numero: 235, serie: "49998", valorServico: 260, descricao: "Prestação de serviços em atendimento de Psicologia 31/07", cTribNac: "04.16.01", cNBS: "1.2301.98.00",
  dataEmissao: new Date("2026-10-10T15:30:00Z"), dataCompetencia: "2026-07-31", percentualTotalTributos: 8.08,
};

test("Simples: alíquota efetiva pela receita dos 12 meses (anexo III e V) e casos sem cálculo", () => {
  const r = aliquotaEfetivaSimples("3", 300_000);
  assert.ok(r.aliquota !== null && r.aliquota === 8.08 && r.faixa === 2);
  assert.equal(aliquotaEfetivaSimples("3", 100_000).aliquota, 6);
  assert.equal(aliquotaEfetivaSimples("5", 100_000).aliquota, 15.5);
  assert.equal(aliquotaEfetivaSimples("3", null).aliquota, null);
  assert.match((aliquotaEfetivaSimples("3", 5_000_000) as { motivo: string }).motivo, /teto/);
  assert.match((aliquotaEfetivaSimples("9", 100_000) as { motivo: string }).motivo, /não está cadastrado/);
});

test("DPS: Id, fuso, campos obrigatórios, ordem e tributação do Simples", () => {
  const d = montarDps(entrada);
  assert.equal(d.idDps, "DPS3530607" + "2" + "45614597000100" + "49998" + "000000000000235");
  assert.equal(idDoInfDps(d.xml), d.idDps);
  assert.match(d.xml, /<tpAmb>2<\/tpAmb>/);
  assert.match(d.xml, /<dhEmi>2026-10-10T12:30:00-03:00<\/dhEmi>/); // servidor em UTC, nota no fuso de São Paulo
  assert.match(d.xml, /<dCompet>2026-07-31<\/dCompet>/);
  assert.match(d.xml, /<cTribNac>041601<\/cTribNac>/);
  assert.match(d.xml, /<cNBS>123019800<\/cNBS>/);
  assert.match(d.xml, /<vServ>260\.00<\/vServ>/);
  assert.match(d.xml, /<opSimpNac>3<\/opSimpNac><regApTribSN>1<\/regApTribSN>/);
  assert.match(d.xml, /<tribISSQN>1<\/tribISSQN><tpRetISSQN>1<\/tpRetISSQN><\/tribMun><totTrib><pTotTribSN>8\.08<\/pTotTribSN>/);
  assert.doesNotMatch(d.xml, /pAliq/); // Simples sem retenção: alíquota na DPS é erro de layout
  const ordem = ["<tpAmb>", "<dhEmi>", "<serie>", "<nDPS>", "<dCompet>", "<tpEmit>", "<cLocEmi>", "<prest>", "<toma>", "<serv>", "<valores>"].map((t) => d.xml.indexOf(t));
  assert.deepEqual([...ordem].sort((a, b) => a - b), ordem);
  assert.match(montarDps({ ...entrada, percentualTotalTributos: null }).xml, /<indTotTrib>0<\/indTotTrib>/);
  assert.match(montarDps({ ...entrada, issRetido: true, prestador: { ...entrada.prestador, aliquotaIssPercentual: 2.41 } }).xml, /<pAliq>2\.41<\/pAliq>/);
  assert.match(montarDps({ ...entrada, prestador: { ...entrada.prestador, ambiente: "producao" } }).xml, /<tpAmb>1<\/tpAmb>/);
});

test("DPS: recusa o que falta antes de qualquer envio", () => {
  const cod = (f: () => unknown) => { try { f(); return "ok"; } catch (e) { return (e as ErroDps).codigo; } };
  assert.equal(cod(() => montarDps({ ...entrada, prestador: { ...entrada.prestador, inscricaoMunicipal: "" } })), "SEM_IM");
  assert.equal(cod(() => montarDps({ ...entrada, cTribNac: "" })), "SEM_CTRIBNAC");
  assert.equal(cod(() => montarDps({ ...entrada, valorServico: 0 })), "VALOR_INVALIDO");
  assert.equal(cod(() => montarDps({ ...entrada, descricao: " " })), "SEM_DESCRICAO");
  assert.equal(cod(() => montarDps({ ...entrada, prestador: { ...entrada.prestador, cnpj: "123" } })), "SEM_CNPJ");
  assert.equal(montarIdDps({ cLocEmi: "3530607", cnpj: "45614597000100", serie: "1", nDPS: 5 }).length, 3 + 7 + 1 + 14 + 5 + 15);
  assert.equal(dataHoraComFuso(new Date("2026-10-10T15:30:00Z"), "America/Manaus"), "2026-10-10T11:30:00-04:00");
});

test("assinatura: referencia o Id do infDPS, confere, e acusa adulteração", () => {
  const c = certificadoDeTeste("segredo");
  const { xml } = montarDps(entrada);
  const assinado = assinarDps(xml, c.keyPem, c.certPem);
  assert.match(assinado, /<Reference URI="#DPS\d+"/);
  assert.ok(assinado.indexOf("</infDPS><Signature") > 0, "a assinatura é irmã de infDPS, dentro de DPS");
  assert.deepEqual(verificarAssinaturaDps(assinado, c.certPem), { valida: true, motivo: null });
  assert.equal(verificarAssinaturaDps(assinado.replace("<vServ>260.00</vServ>", "<vServ>1.00</vServ>"), c.certPem).valida, false);
});

test("certificado: lê o .pfx, recusa senha errada e vencido, e cifra o que vai ao banco", () => {
  const c = certificadoDeTeste("segredo");
  const lido = lerPfx(c.pfx, "segredo");
  assert.match(lido.titular, /CLINICA TESTE/);
  assert.ok(lido.validoAte.getTime() > Date.now());
  assert.throws(() => lerPfx(c.pfx, "errada"), (e: { codigo?: string }) => e.codigo === "SENHA");
  assert.throws(() => lerPfx(Buffer.from("isto não é um pfx"), "x"), (e: { codigo?: string }) => e.codigo === "FORMATO");
  assert.throws(() => lerPfx(certificadoDeTeste("s", -1).pfx, "s"), (e: { codigo?: string }) => e.codigo === "VENCIDO");

  delete process.env.FISCAL_CRYPTO_KEY;
  assert.throws(() => cifrar("x"), (e: { codigo?: string }) => e.codigo === "SEM_CHAVE");
  process.env.FISCAL_CRYPTO_KEY = randomBytes(32).toString("base64");
  const guardado = cifrar(c.pfx);
  assert.ok(!guardado.includes(c.pfx.toString("base64").slice(0, 40)));
  assert.deepEqual(decifrar(guardado), c.pfx);
  const chaveCerta = process.env.FISCAL_CRYPTO_KEY;
  process.env.FISCAL_CRYPTO_KEY = randomBytes(32).toString("base64");
  assert.throws(() => decifrar(guardado)); // chave diferente não abre
  process.env.FISCAL_CRYPTO_KEY = chaveCerta;
});

test("cliente: embalagem GZip/Base64 e tradução dos erros da SEFIN", async () => {
  const xml = "<DPS>ação</DPS>";
  assert.equal(await descomprimirDaResposta(await comprimirParaEnvio(xml)), xml);
  await assert.rejects(() => comprimirParaEnvio(" "));
  assert.match((interpretar({ status: 403, corpo: null }) as { erro: string }).erro, /cadeia de certificado/);
  const e400 = interpretar({ status: 400, corpo: { erro: { codigo: "E0310", descricao: "Campo obrigatório ausente." } } }) as { erro: string; codigoSefin: string };
  assert.match(e400.erro, /E0310 — Campo obrigatório ausente/);
  assert.equal(e400.codigoSefin, "E0310");
  assert.equal((interpretar({ status: 409, corpo: null }) as { duplicada: boolean }).duplicada, true);
  assert.equal(interpretar({ status: 201, corpo: { chaveAcesso: "x" } }).ok, true);
  assert.match((interpretar({ status: 500, corpo: { erro: [{ codigo: "A", descricao: "b" }, { codigo: "C", descricao: "d" }] } }) as { erro: string }).erro, /A — b \| C — d/);
});
