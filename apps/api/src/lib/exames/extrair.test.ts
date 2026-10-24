import assert from "node:assert/strict";
import { test } from "node:test";
import { metricaDoResultado, nomeConfere } from "./extrair";

test("nome do documento confere com o do paciente, ignorando acento e nomes do meio", () => {
  assert.equal(nomeConfere("José da Silva Santos", "JOSE SILVA SANTOS"), true);
  assert.equal(nomeConfere("Marina Alves", "Marina Souza Alves"), true);
  assert.equal(nomeConfere("Marina Alves", "Carolina Alves"), false);
  assert.equal(nomeConfere("Marina Alves", null), null);
});

test("resultados que viram métricas de gráfico", () => {
  assert.equal(metricaDoResultado("Hemoglobina glicada (HbA1c)", "%"), "HBA1C");
  assert.equal(metricaDoResultado("Colesterol LDL", "mg/dL"), "LDL");
  assert.equal(metricaDoResultado("Colesterol VLDL", "mg/dL"), null);
  assert.equal(metricaDoResultado("Glicose em jejum", "mg/dL"), "GLICEMIA");
  assert.equal(metricaDoResultado("Glicemia pós-prandial", "mg/dL"), null);
  assert.equal(metricaDoResultado("Glicose", "mmol/L"), null);
  assert.equal(metricaDoResultado("Hemograma", null), null);
});
