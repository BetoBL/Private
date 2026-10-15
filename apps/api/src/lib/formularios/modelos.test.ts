import assert from "node:assert/strict";
import { test } from "node:test";
import { MODELOS_SISTEMA, validarPerguntas, validarRespostasFormulario, type Pergunta } from "./modelos";

test("modelos do sistema: chaves únicas, perguntas válidas, ids únicos por modelo e cada profissão tem uma anamnese", () => {
  assert.equal(new Set(MODELOS_SISTEMA.map((m) => m.chave)).size, MODELOS_SISTEMA.length);
  for (const m of MODELOS_SISTEMA) {
    assert.equal(validarPerguntas(m.perguntas).erros.length, 0, m.chave);
    assert.equal(new Set(m.perguntas.map((p) => p.id)).size, m.perguntas.length, `${m.chave} com id repetido`);
  }
  for (const prof of ["PSICOLOGO", "NEUROPSICOLOGO", "MEDICO", "FISIOTERAPEUTA", "NUTRICIONISTA", "FONOAUDIOLOGO", "TERAPEUTA_OCUPACIONAL", "OUTRO"]) assert.ok(MODELOS_SISTEMA.some((m) => m.paraQuem.includes(prof)), prof);
});

test("validarPerguntas: recusa vazio, tipo ruim, escolha sem opções e escala inválida; limpa e gera ids", () => {
  assert.equal(validarPerguntas([]).erros.length, 1);
  assert.equal(validarPerguntas([{ tipo: "texto", rotulo: "" }]).erros.length, 1);
  assert.equal(validarPerguntas([{ tipo: "xx", rotulo: "a" }]).erros.length, 1);
  assert.equal(validarPerguntas([{ tipo: "escolha", rotulo: "a", opcoes: ["só uma"] }]).erros.length, 1);
  assert.equal(validarPerguntas([{ tipo: "escala", rotulo: "a", min: 5, max: 2 }]).erros.length, 1);
  const ok = validarPerguntas([{ tipo: "texto", rotulo: "  Nome  " }, { tipo: "escolha", rotulo: "Cor", opcoes: [" azul ", "", "verde"] }, { tipo: "escala", rotulo: "Dor", min: 0, max: 10 }]);
  assert.deepEqual(ok.erros, []);
  assert.deepEqual(ok.perguntas.map((p) => p.id), ["p1", "p2", "p3"]);
  assert.equal(ok.perguntas[0].rotulo, "Nome");
  assert.deepEqual(ok.perguntas[1].opcoes, ["azul", "verde"]);
});

const P: Pergunta[] = [
  { id: "a", tipo: "texto", rotulo: "A", obrigatoria: true }, { id: "b", tipo: "escolha", rotulo: "B", opcoes: ["x", "y"] }, { id: "c", tipo: "multipla", rotulo: "C", opcoes: ["x", "y", "z"] },
  { id: "d", tipo: "escala", rotulo: "D", min: 1, max: 5 }, { id: "e", tipo: "sim_nao", rotulo: "E" }, { id: "f", tipo: "data", rotulo: "F" },
];

test("validarRespostasFormulario: aceita o válido, ignora o que não é pergunta e exige obrigatórias só quando pedido", () => {
  const r = validarRespostasFormulario(P, { a: " oi ", b: "x", c: ["x", "z"], d: 3, e: false, f: "2026-10-15", intruso: 1 }, true);
  assert.deepEqual(r.erros, []);
  assert.deepEqual(r.respostas, { a: "oi", b: "x", c: ["x", "z"], d: 3, e: false, f: "2026-10-15" });
  assert.equal(validarRespostasFormulario(P, {}, true).erros.length, 1); // "a" é obrigatória
  assert.equal(validarRespostasFormulario(P, {}, false).erros.length, 0); // rascunho do profissional pode ficar incompleto
});

test("validarRespostasFormulario: recusa opção fora da lista, escala fora do intervalo, tipo errado e data inválida", () => {
  const erro = (resp: Record<string, unknown>) => validarRespostasFormulario(P, { a: "ok", ...resp }, true).erros.length;
  assert.equal(erro({ b: "w" }), 1); assert.equal(erro({ c: ["q"] }), 1); assert.equal(erro({ d: 9 }), 1); assert.equal(erro({ d: 2.5 }), 1);
  assert.equal(erro({ e: "sim" }), 1); assert.equal(erro({ f: "15/10/2026" }), 1); assert.equal(erro({ a: 5 }), 1);
  assert.equal(erro({ a: "x".repeat(8001) }), 1);
});
