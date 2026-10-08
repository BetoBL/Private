import assert from "node:assert/strict";
import { test } from "node:test";
import { montarDescricao, pendenciasFiscais, type ConfigFiscalDados } from "./config";

const comp = new Date("2026-07-01T00:00:00Z");

test("descrição da nota: data da sessão, várias datas, período e variável desconhecida", () => {
  const modelo = "Prestação de serviços em atendimento de Psicologia {{sessao.data}}";
  assert.equal(montarDescricao(modelo, { datas: [new Date("2026-07-31T00:00:00Z")], competencia: comp }), "Prestação de serviços em atendimento de Psicologia 31/07");
  assert.equal(montarDescricao("{{quantidade}} atendimentos em {{periodo}}: {{sessao.datas}}", { datas: [new Date("2026-07-19T00:00:00Z"), new Date("2026-07-05T00:00:00Z"), new Date("2026-07-12T00:00:00Z")], competencia: comp }), "3 atendimentos em julho/2026: 05/07, 12/07 e 19/07");
  assert.equal(montarDescricao("{{convenio.nome}} {{nao.existe}}", { datas: [], competencia: comp, convenioNome: "Amil" }), "Amil {{nao.existe}}");
});

test("pendências fiscais: o que falta para testar e para emitir", () => {
  const clinica = { razaoSocial: "Clínica Exemplo Ltda", cnpj: "00.000.000/0001-00", endereco: "Rua A, 1", cep: "08710-020", cidade: "Mogi das Cruzes", estado: "SP" };
  const vazio = pendenciasFiscais(null, clinica);
  assert.equal(vazio.prontoParaTeste, false);
  assert.ok(vazio.pendencias.some((p) => p.campo === "inscricaoMunicipal") && vazio.pendencias.some((p) => p.campo === "certificado"));
  const cfg: ConfigFiscalDados = { emissaoAtiva: true, ambiente: "PRODUCAO", regime: "SIMPLES_NACIONAL", inscricaoMunicipal: "1", codigoMunicipioIbge: "3530607", cTribNac: "04.16.01", nbs: null, descricaoPadrao: "x", aliquotaModo: "FIXA", aliquotaIss: 2.41, rbt12: null, serieDps: "1", proximoNumeroDps: 1 };
  const ok = pendenciasFiscais(cfg, clinica, false);
  assert.equal(ok.prontoParaTeste, true);
  assert.equal(ok.prontoParaEmitir, false); // falta o certificado
  assert.equal(pendenciasFiscais(cfg, clinica, true).prontoParaEmitir, true);
  assert.ok(pendenciasFiscais({ ...cfg, aliquotaModo: "SIMPLES" }, clinica, true).pendencias.some((p) => p.campo === "rbt12"));
});
