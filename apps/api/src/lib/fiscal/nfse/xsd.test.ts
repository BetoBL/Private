import assert from "node:assert/strict";
import { test } from "node:test";
import forge from "node-forge";
import { assinarDps } from "./assinatura";
import { montarDps, type EntradaDps } from "./dpsBuilder";
import { validarContraXsd } from "./validarXsd";

// A DPS que o sistema monta precisa passar nos esquemas OFICIAIS do Portal Nacional (v1.00 e v1.01), assinada ou não.

const base: EntradaDps = {
  prestador: { cnpj: "45.614.597/0001-00", inscricaoMunicipal: "167297", codigoMunicipioIbge: "3530607", telefone: "(11) 96077-7615", email: "contato@exemplo.com.br", opSimplesNacional: "3", ambiente: "homologacao" },
  tomador: { documento: "111.222.333-44", nome: "Tomador de Teste" },
  numero: 235, serie: "49998", valorServico: 260, descricao: "Prestação de serviços em atendimento de Psicologia 31/07", cTribNac: "04.16.01", cNBS: "1.2301.98.00",
  dataEmissao: new Date("2026-10-10T15:30:00Z"), dataCompetencia: "2026-07-31", percentualTotalTributos: 8.08,
};

const variacoes: Array<[string, EntradaDps]> = [
  ["Simples ME/EPP com carga total (caso da Mentessence)", base],
  ["Simples sem carga total informada (indTotTrib)", { ...base, percentualTotalTributos: null }],
  ["tomador pessoa jurídica (convênio)", { ...base, tomador: { documento: "29.309.127/0001-79", nome: "Convênio Exemplo Assistência Médica Ltda" } }],
  ["tomador com endereço completo", { ...base, tomador: { documento: "111.222.333-44", nome: "Tomador de Teste", logradouro: "Rua Exemplo", numero: "10", complemento: "Sala 2", bairro: "Centro", codigoMunicipioIbge: "3530607", cep: "08710-020", email: "t@exemplo.com" } }],
  ["ISS retido pelo tomador", { ...base, issRetido: true, prestador: { ...base.prestador, aliquotaIssPercentual: 2.41 } }],
  ["MEI", { ...base, prestador: { ...base.prestador, opSimplesNacional: "2" }, percentualTotalTributos: null }],
  ["ambiente de produção", { ...base, prestador: { ...base.prestador, ambiente: "producao" } }],
  ["com informações complementares", { ...base, informacoesComplementares: "Atendimento realizado em 31/07/2026." }],
];

for (const versao of ["1.00", "1.01"] as const) {
  for (const [nome, entrada] of variacoes) {
    test(`XSD ${versao}: ${nome}`, async () => {
      const r = await validarContraXsd(montarDps({ ...entrada, versaoLeiaute: versao }).xml, "DPS", versao);
      assert.deepEqual(r.erros, []);
      assert.equal(r.valida, true);
    });
  }
}

test("XSD: a DPS assinada também é válida e um erro de estrutura é apontado com o campo", async () => {
  const keys = forge.pki.rsa.generateKeyPair(1024);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey; cert.serialNumber = "01";
  cert.validity.notBefore = new Date(Date.now() - 172800000); cert.validity.notAfter = new Date(Date.now() + 86400000 * 30);
  const attrs = [{ name: "commonName", value: "TESTE" }]; cert.setSubject(attrs); cert.setIssuer(attrs); cert.sign(keys.privateKey, forge.md.sha256.create());
  const assinada = assinarDps(montarDps(base).xml, forge.pki.privateKeyToPem(keys.privateKey), forge.pki.certificateToPem(cert));
  const ok = await validarContraXsd(assinada, "DPS", "1.01");
  assert.deepEqual(ok.erros, []);

  const semCtrib = montarDps(base).xml.replace(/<cTribNac>\d+<\/cTribNac>/, "");
  const ruim = await validarContraXsd(semCtrib, "DPS", "1.01");
  assert.equal(ruim.valida, false);
  assert.match(ruim.erros.join(" "), /cTribNac|cServ/);

  const fora = montarDps(base).xml.replace("<tpAmb>2</tpAmb><dhEmi>", "<dhEmi>").replace("<verAplic>", "<tpAmb>2</tpAmb><verAplic>");
  assert.equal((await validarContraXsd(fora, "DPS", "1.01")).valida, false, "ordem dos elementos errada deve ser recusada");
});
