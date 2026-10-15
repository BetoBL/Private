import assert from "node:assert/strict";
import { test } from "node:test";
import { MODELOS, MODULOS_BASE, PROFISSOES, modeloPermitido, profissaoDe, validarCampos } from "./modelos";

test("catálogo: chaves únicas, toda profissão só aponta para modelos que existem e inclui a base", () => {
  const chaves = MODELOS.map((m) => m.chave);
  assert.equal(new Set(chaves).size, chaves.length);
  for (const p of PROFISSOES) {
    for (const m of p.modelos) assert.ok(chaves.includes(m), `${p.chave} usa ${m} que não existe`);
    assert.ok(p.modelos.includes("LIVRE"), `${p.chave} precisa de anotação livre`);
    for (const mod of MODULOS_BASE) assert.ok(p.modulos.includes(mod), `${p.chave} sem módulo base ${mod}`);
  }
  for (const m of MODELOS) assert.equal(new Set(m.campos.map((c) => c.chave)).size, m.campos.length);
});

test("profissões: psicólogo tem DBT e foco, médico tem consulta, e profissão desconhecida cai em psicólogo", () => {
  assert.ok(modeloPermitido("PSICOLOGO", "DBT"));
  assert.ok(!modeloPermitido("MEDICO", "DBT"));
  assert.ok(modeloPermitido("MEDICO", "CONSULTA"));
  assert.ok(modeloPermitido("FISIOTERAPEUTA", "REABILITACAO"));
  assert.ok(!modeloPermitido("PSICOLOGO", "CONSULTA"));
  assert.equal(profissaoDe("XYZ").chave, "PSICOLOGO");
  assert.ok(profissaoDe("NEUROPSICOLOGO").modulos.includes("laudos"));
  assert.ok(!profissaoDe("MEDICO").modulos.includes("laudos"));
});

test("validação de campos: aceita o que o modelo conhece, ignora o resto e recusa tipo ou tamanho errado", () => {
  const ok = validarCampos("SOAP", { s: "relato", o: "obs", intruso: "x" });
  assert.deepEqual(ok.campos, { s: "relato", o: "obs" });
  assert.deepEqual(ok.erros, []);
  assert.equal(validarCampos("SOAP", { s: 5 }).erros.length, 1);
  assert.equal(validarCampos("SOAP", { s: "a".repeat(8001) }).erros.length, 1);
  assert.equal(validarCampos("INEXISTENTE", {}).erros.length, 1);
  assert.deepEqual(validarCampos("LIVRE", { qualquer: "x" }).campos, {});
});

test("validação de campos: a lista de pontos limpa vazios e respeita os limites", () => {
  assert.deepEqual(validarCampos("FOCO", { agenda: [" a ", "", "b"] }).campos, { agenda: ["a", "b"] });
  assert.equal(validarCampos("FOCO", { agenda: Array(21).fill("x") }).erros.length, 1);
  assert.equal(validarCampos("FOCO", { agenda: "texto" }).erros.length, 1);
  assert.equal(validarCampos("FOCO", { agenda: ["x".repeat(301)] }).erros.length, 1);
});
