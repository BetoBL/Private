import assert from "node:assert/strict";
import { test } from "node:test";
import { buscarExames, EXAMES, exameDe, KITS } from "./catalogo";

test("catálogo carrega os exames da TUSS e cada código é único", () => {
  assert.ok(EXAMES.length > 2500);
  assert.equal(new Set(EXAMES.map((e) => e.codigo)).size, EXAMES.length);
});

test("todo item de kit existe no catálogo", () => {
  for (const k of KITS) for (const i of k.itens) assert.ok(exameDe(i.codigo), `${k.chave}: código ${i.codigo} não existe`);
});

test("busca ignora acento e entende abreviações", () => {
  assert.ok(buscarExames("ecg").some((e) => e.codigo === "40101010"));
  assert.ok(buscarExames("eletrocardiograma").some((e) => e.codigo === "40101010"));
  assert.ok(buscarExames("tomografia coerencia").some((e) => e.codigo === "41501144"));
  assert.ok(buscarExames("ressonancia cranio").some((e) => e.codigo === "41101014"));
  assert.ok(buscarExames("paquimetria").length >= 2);
  assert.ok(buscarExames("abdome total").some((e) => e.codigo === "40901122"));
  assert.ok(buscarExames("colesterol ldl").some((e) => e.codigo === "40301591"));
});

test("busca filtra por grupo e respeita o limite", () => {
  const r = buscarExames("", { grupo: "Ultrassonografia", limite: 5 });
  assert.equal(r.length, 5);
  assert.ok(r.every((e) => e.grupo === "Ultrassonografia"));
});
