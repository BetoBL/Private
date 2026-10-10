import assert from "node:assert/strict";
import { test } from "node:test";
import { dadosDoXmlNfse, gerarDanfse, type DanfseDados } from "./danfse";

const base: DanfseDados = {
  chave: "35306071245614597000100000000000023526109999999999", numeroNfse: "235", competencia: new Date("2026-07-01T00:00:00Z"), emissaoNfse: new Date("2026-10-10T15:30:00Z"), numeroDps: 235, serieDps: "49998", emissaoDps: new Date("2026-10-10T15:29:00Z"),
  ambiente: "producao", simulada: false, situacao: "NFS-e Gerada",
  prestador: { nome: "CLÍNICA EXEMPLO LTDA", cnpj: "45.614.597/0001-00", inscricaoMunicipal: "167297", telefone: "(11) 90000-0000", email: "contato@exemplo.com.br", endereco: "Rua Exemplo, 10", cep: "08710-020", municipio: "Mogi das Cruzes", uf: "SP", ibge: "3530607", regime: "Optante - ME/EPP" },
  tomador: { nome: "Tomador de Exemplo", documento: "111.222.333-44", email: null, telefone: null },
  servico: { cTribNac: "04.16.01", nbs: "1.2301.98.00", localPrestacao: "Mogi das Cruzes / SP / BRASIL", descricao: "Prestação de serviços em atendimento de Psicologia 31/07" },
  valores: { servico: 260, baseCalculo: 260, aliquotaIss: 2.41, issApurado: 6.27, issRetido: false, liquido: 260, descontoIncondicionado: null }, informacoesComplementares: null,
};

test("DANFSe: gera um PDF válido de uma página, com QR de consulta só quando há chave real", async () => {
  const pdf = await gerarDanfse(base);
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  assert.match(pdf.subarray(-8).toString(), /%%EOF/);
  assert.equal((pdf.toString("latin1").match(/\/Type \/Page\b/g) ?? []).length, 1);
  assert.match(pdf.toString("latin1"), /\/Subtype \/Image/); // QR code
  const simulada = await gerarDanfse({ ...base, simulada: true, ambiente: "homologacao", chave: "SIMULADA0000023517916" });
  assert.doesNotMatch(simulada.toString("latin1"), /\/Subtype \/Image/); // simulada não tem consulta pública
  assert.ok(simulada.length > 1000);
});

test("DANFSe: descrição longa não corta a nota e continua em uma ou mais páginas sem erro", async () => {
  const pdf = await gerarDanfse({ ...base, servico: { ...base.servico, descricao: "Atendimento psicológico. ".repeat(80) }, informacoesComplementares: "Observação adicional. ".repeat(60) });
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
});

test("DANFSe: lê do XML da NFS-e o que o Portal apurou", () => {
  const xml = "<NFSe><infNFSe><nNFSe>1234</nNFSe><dhProc>2026-10-10T12:30:00-03:00</dhProc><valores><vBC>260.00</vBC><pAliqAplic>2.41</pAliqAplic><vISSQN>6.27</vISSQN><vLiq>260.00</vLiq></valores></infNFSe></NFSe>";
  const r = dadosDoXmlNfse(xml);
  assert.deepEqual([r.numero, r.aliquota, r.iss, r.liquido, r.bc], ["1234", 2.41, 6.27, 260, 260]);
  assert.equal(r.processadoEm?.toISOString(), "2026-10-10T15:30:00.000Z");
  assert.equal(dadosDoXmlNfse("<!-- simulada -->").numero, undefined);
  assert.deepEqual(dadosDoXmlNfse(null), {});
});
