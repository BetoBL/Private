import assert from "node:assert/strict";
import { test } from "node:test";
import { ESCALAS, escalaPorCodigo } from "./definicoes";
import { pontuar, validarRespostas, type Respostas } from "./pontuar";

const todas = (e: { itens: Array<{ id: number }> }, v: number | ((id: number) => number)): Respostas => Object.fromEntries(e.itens.map((i) => [String(i.id), typeof v === "number" ? v : v(i.id)]));

test("catálogo: códigos únicos, itens numerados em sequência, faixas crescentes e cobrindo o máximo", () => {
  assert.equal(new Set(ESCALAS.map((e) => e.codigo)).size, ESCALAS.length);
  for (const e of ESCALAS) {
    e.itens.forEach((it, i) => assert.equal(it.id, i + 1, `${e.codigo} item fora de ordem`));
    assert.ok(e.opcoes.length >= 2 && e.instrucao.length > 10 && e.fonte.length > 10);
    const grupos = [e.faixasTotal, ...(e.subescalas ?? []).map((s) => s.faixas)].filter(Boolean) as Array<Array<{ ate: number }>>;
    for (const faixas of grupos) { for (let i = 1; i < faixas.length; i++) assert.ok(faixas[i].ate > faixas[i - 1].ate); }
    if (e.faixasTotal) assert.equal(e.faixasTotal[e.faixasTotal.length - 1].ate, e.maxTotal);
  }
});

test("PHQ-9: soma, faixas e alerta pelo item 9", () => {
  const e = escalaPorCodigo("PHQ9")!;
  assert.equal(pontuar(e, todas(e, 0)).total, 0);
  assert.equal(pontuar(e, todas(e, 0)).faixa?.rotulo, "Mínima");
  assert.equal(pontuar(e, todas(e, 0)).alertaRisco, false);
  const max = pontuar(e, todas(e, 3));
  assert.equal(max.total, 27); assert.equal(max.faixa?.rotulo, "Grave"); assert.equal(max.alertaRisco, true);
  assert.equal(pontuar(e, todas(e, (id) => (id <= 5 ? 2 : 0))).total, 10);
  assert.equal(pontuar(e, todas(e, (id) => (id <= 5 ? 2 : 0))).faixa?.rotulo, "Moderada");
  assert.equal(pontuar(e, todas(e, (id) => (id === 9 ? 1 : 0))).alertaRisco, true); // só o item 9 já alerta
  assert.equal(pontuar(e, todas(e, 1)).faixa?.rotulo, "Leve"); // 9
  assert.equal(pontuar(e, todas(e, (id) => (id <= 7 ? 2 : id === 8 ? 1 : 0))).faixa?.rotulo, "Moderadamente grave"); // 15
});

test("GAD-7: limites das faixas 4/5, 9/10, 14/15", () => {
  const e = escalaPorCodigo("GAD7")!;
  const com = (n: number) => pontuar(e, todas(e, (id) => (id <= n ? 1 : 0)));
  assert.equal(com(4).faixa?.rotulo, "Mínima"); assert.equal(com(5).faixa?.rotulo, "Leve");
  assert.equal(com(9 > 7 ? 7 : 9).total, 7);
  assert.equal(pontuar(e, todas(e, 3)).total, 21); assert.equal(pontuar(e, todas(e, 3)).faixa?.rotulo, "Grave");
  assert.equal(pontuar(e, todas(e, (id) => (id <= 5 ? 2 : 1))).total, 12); // moderada
});

test("DASS-21: soma por subescala vezes 2, com as faixas publicadas (confere o caso conferido na referência)", () => {
  const e = escalaPorCodigo("DASS21")!;
  // padrão usado na conferência: valor do item n = ((n-1)*3) % 4
  const r = pontuar(e, todas(e, (id) => ((id - 1) * 3) % 4));
  const s = Object.fromEntries(r.subescalas.map((x) => [x.chave, x]));
  assert.equal(s.D.valor, 12); assert.equal(s.D.faixa?.rotulo, "Leve");
  assert.equal(s.A.valor, 22); assert.equal(s.A.faixa?.rotulo, "Extremamente severa");
  assert.equal(s.S.valor, 26); assert.equal(s.S.faixa?.rotulo, "Severa");
  const itens = (c: string) => e.itens.filter((i) => i.subescala === c).map((i) => i.id).sort((a, b) => a - b);
  assert.deepEqual(itens("D"), [3, 5, 10, 13, 16, 17, 21]); assert.deepEqual(itens("A"), [2, 4, 7, 9, 15, 19, 20]); assert.deepEqual(itens("S"), [1, 6, 8, 11, 12, 14, 18]);
  assert.equal(pontuar(e, todas(e, 3)).subescalas[0].valor, 42);
  assert.equal(pontuar(e, todas(e, 0)).subescalas.every((x) => x.faixa?.rotulo === "Normal"), true);
  assert.equal(pontuar(e, todas(e, (id) => (id === 21 ? 1 : 0))).alertaRisco, true);
});

test("validação das respostas: exige todos os itens e opção válida", () => {
  const e = escalaPorCodigo("GAD7")!;
  assert.deepEqual(validarRespostas(e, todas(e, 1)), []);
  assert.equal(validarRespostas(e, { ...todas(e, 1), "3": 7 }).length, 1);
  const falta = { ...todas(e, 1) }; delete falta["2"];
  assert.equal(validarRespostas(e, falta).length, 1);
  assert.equal(validarRespostas(e, null).length, 1);
  assert.equal(validarRespostas(e, { ...todas(e, 1), funcional: 9 }).length, 1);
  assert.deepEqual(validarRespostas(e, { ...todas(e, 1), funcional: 2 }), []);
});

test("AUDIT: opções próprias por item, soma e faixas da OMS", () => {
  const e = escalaPorCodigo("AUDIT")!;
  assert.equal(e.itens.length, 10);
  assert.deepEqual(validarRespostas(e, todas(e, 0)), []);
  assert.equal(validarRespostas(e, { ...todas(e, 0), "9": 1 }).length, 1); // o item 9 só aceita 0, 2 ou 4
  assert.deepEqual(validarRespostas(e, { ...todas(e, 0), "9": 2, "10": 4 }), []);
  assert.equal(pontuar(e, todas(e, 0)).faixa?.rotulo, "Baixo risco");
  assert.equal(pontuar(e, todas(e, (id) => (id <= 7 ? 1 : 0))).total, 7);
  assert.equal(pontuar(e, todas(e, (id) => (id <= 8 ? 1 : 0))).faixa?.rotulo, "Uso de risco"); // 8
  assert.equal(pontuar(e, todas(e, (id) => (id <= 8 ? 2 : 0))).faixa?.rotulo, "Uso nocivo"); // 16
  assert.equal(pontuar(e, todas(e, 4)).total, 40);
  assert.equal(pontuar(e, todas(e, 4)).faixa?.rotulo, "Provável dependência");
});

test("PCL-5: total de 0 a 80, ponto de corte 31 e os quatro grupos de sintomas", () => {
  const e = escalaPorCodigo("PCL5")!;
  assert.equal(e.itens.length, 20);
  assert.equal(pontuar(e, todas(e, 0)).total, 0);
  assert.equal(pontuar(e, todas(e, 4)).total, 80);
  assert.equal(pontuar(e, todas(e, (id) => (id <= 15 ? 2 : 0)))?.faixa?.rotulo, "Abaixo do ponto de corte"); // 30
  assert.equal(pontuar(e, todas(e, (id) => (id <= 15 ? 2 : id === 16 ? 1 : 0))).faixa?.rotulo, "Acima do ponto de corte (31 ou mais)"); // 31
  const g = Object.fromEntries(pontuar(e, todas(e, 1)).subescalas.map((s) => [s.chave, s.valor]));
  assert.deepEqual(g, { B: 5, C: 2, D: 7, E: 6 });
  assert.ok(pontuar(e, todas(e, 1)).subescalas.every((s) => s.faixa === null));
});

test("WHO-5 (soma x 4, 0 a 100) e SWLS (5 a 35)", () => {
  const w = escalaPorCodigo("WHO5")!;
  assert.equal(pontuar(w, todas(w, 5)).total, 100); assert.equal(pontuar(w, todas(w, 5)).faixa?.rotulo, "Adequado");
  assert.equal(pontuar(w, todas(w, 0)).total, 0); assert.equal(pontuar(w, todas(w, 0)).faixa?.rotulo, "Muito baixo (rastrear depressão)");
  assert.equal(pontuar(w, todas(w, (id) => (id <= 3 ? 2 : 1))).total, 32); // 8 x 4 -> baixo
  assert.equal(pontuar(w, todas(w, (id) => (id <= 3 ? 2 : 1))).faixa?.rotulo, "Baixo");
  assert.equal(pontuar(w, todas(w, (id) => (id <= 2 ? 3 : 2))).total, 48); // 12 x 4
  const s = escalaPorCodigo("SWLS")!;
  assert.equal(pontuar(s, todas(s, 1)).total, 5); assert.equal(pontuar(s, todas(s, 1)).faixa?.rotulo, "Extremamente insatisfeito(a)");
  assert.equal(pontuar(s, todas(s, 4)).total, 20); assert.equal(pontuar(s, todas(s, 4)).faixa?.rotulo, "Neutro");
  assert.equal(pontuar(s, todas(s, 7)).total, 35); assert.equal(pontuar(s, todas(s, 7)).faixa?.rotulo, "Extremamente satisfeito(a)");
  assert.equal(validarRespostas(s, todas(s, 0)).length, 5); // 0 não é opção da SWLS (1 a 7)
});
