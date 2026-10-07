import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { calcularPlanilha, normalizarEscolaridade, type DefinicaoPlanilha } from "./motor";

test("motor de planilha: escolaridade do cadastro vira um dos níveis da planilha", () => {
  assert.equal(normalizarEscolaridade("Ensino Médio completo"), "Ensino Médio");
  assert.equal(normalizarEscolaridade("Superior incompleto"), "Ensino Superior");
  assert.equal(normalizarEscolaridade("Pós-graduação"), "Ensino Superior");
  assert.equal(normalizarEscolaridade("Fundamental I"), "Ensino Fundamental");
  assert.equal(normalizarEscolaridade("EJA"), "EJA - Ensino de Jovens e Adultos");
  assert.equal(normalizarEscolaridade(""), undefined);
});

test("motor de planilha: D2-R calcula totais e converte pelas tabelas da própria planilha", () => {
  const def = JSON.parse(readFileSync(join(__dirname, "..", "..", "..", "..", "..", "docs", "testes", "planilha", "D2-R.json"), "utf8")) as DefinicaoPlanilha;
  const escores: Record<string, number> = { tabela: 0 };
  for (let i = 0; i < 12; i++) { escores[`l${2 + i}_oap`] = 25; escores[`l${2 + i}_eo`] = 2; escores[`l${2 + i}_et`] = 1; }
  const r = calcularPlanilha(def, escores, { dataNascimento: new Date("2012-04-10T00:00:00Z"), dataReferencia: new Date("2026-07-28T12:00:00Z"), escolaridade: "Ensino Fundamental", sexo: "MASCULINO", nome: "Teste" });
  assert.equal(r.saidas.tot_oap, 300);
  assert.equal(r.saidas.tot_eo, 24);
  assert.equal(r.saidas.tot_et, 12);
  assert.equal(r.saidas.tot_dc, 264); // OAP - EO - ET
  assert.equal(r.saidas.epc_total, 12); // (EO+ET)/OAP*100
  assert.equal(r.erros, undefined);
  const vazio = calcularPlanilha(def, {}, { dataNascimento: new Date("2012-04-10T00:00:00Z"), dataReferencia: new Date("2026-07-28T12:00:00Z") });
  assert.equal(vazio.saidas.oap_percentil, null);
});
