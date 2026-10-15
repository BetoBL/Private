import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_OCORRENCIAS, gerarOcorrencias } from "./recorrencia";

const ini = new Date("2026-10-15T13:00:00Z"), fim = new Date("2026-10-15T13:50:00Z");

test("recorrência semanal: 4 ocorrências, mesmo horário e mesma duração, de 7 em 7 dias", () => {
  const o = gerarOcorrencias(ini, fim, { frequencia: "SEMANAL", ocorrencias: 4 });
  assert.equal(o.length, 4);
  assert.equal(o[0].inicio.toISOString(), "2026-10-15T13:00:00.000Z");
  assert.equal(o[1].inicio.toISOString(), "2026-10-22T13:00:00.000Z");
  assert.equal(o[3].inicio.toISOString(), "2026-11-05T13:00:00.000Z");
  for (const x of o) assert.equal(x.fim.getTime() - x.inicio.getTime(), 50 * 60 * 1000);
});

test("quinzenal e a cada 4 semanas usam 14 e 28 dias", () => {
  assert.equal(gerarOcorrencias(ini, fim, { frequencia: "QUINZENAL", ocorrencias: 2 })[1].inicio.toISOString(), "2026-10-29T13:00:00.000Z");
  assert.equal(gerarOcorrencias(ini, fim, { frequencia: "A_CADA_4_SEMANAS", ocorrencias: 2 })[1].inicio.toISOString(), "2026-11-12T13:00:00.000Z");
});

test("padrão de 12 ocorrências, data final e teto de 52", () => {
  assert.equal(gerarOcorrencias(ini, fim, { frequencia: "SEMANAL" }).length, 12);
  const ate = gerarOcorrencias(ini, fim, { frequencia: "SEMANAL", ate: new Date("2026-11-05T13:00:00Z") });
  assert.equal(ate.length, 4); // 15/10, 22/10, 29/10 e 05/11 (a data final entra)
  assert.equal(gerarOcorrencias(ini, fim, { frequencia: "SEMANAL", ocorrencias: 500 }).length, MAX_OCORRENCIAS);
  assert.equal(gerarOcorrencias(ini, fim, { frequencia: "SEMANAL", ate: new Date("2099-01-01") }).length, MAX_OCORRENCIAS);
});
