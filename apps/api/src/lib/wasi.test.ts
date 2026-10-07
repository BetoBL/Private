import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { calcularResultado, type ConversaoNormativa } from "./motorCalculo";
import { classificarQiWasi, classificarZWasi, type WasiPlanilha } from "./wasi";

const dados = { tipo: "wasi_planilha", ...JSON.parse(readFileSync(join(__dirname, "..", "..", "..", "..", "docs", "testes", "WASI-planilha.json"), "utf8")) } as WasiPlanilha;
const conversao = dados as unknown as ConversaoNormativa;
const NASC = new Date("2018-03-10T00:00:00Z");
const REF = new Date("2026-07-28T12:00:00Z");

function calcular(brutos: Record<string, number>, nasc = NASC, ref = REF) {
  const r = calcularResultado(brutos, conversao, { dataNascimento: nasc, dataReferencia: ref });
  assert.equal(r.modo, "por_campo");
  return r.modo === "por_campo" ? r : { porCampo: {} as Record<string, import("./motorCalculo").ResultadoPorCampo>, extras: {} as Record<string, unknown> };
}

test("WASI classificação: subteste por Z e QI por ponto composto", () => {
  assert.equal(classificarZWasi(2), "Muito Superior");
  assert.equal(classificarZWasi(-0.666), "Média");
  assert.equal(classificarZWasi(-2.1), "Deficitário");
  assert.equal(classificarQiWasi(130), "Muito Superior");
  assert.equal(classificarQiWasi(89), "Média Inferior");
  assert.equal(classificarQiWasi(69), "Extremamente Baixo");
});

test("WASI: subteste vira T, Z, composto, percentil e ponderado; QI só com todos os subtestes da escala", () => {
  const r = calcular({ vc: 30, sm: 16, cb: 20, rm: 14 });
  const vc = r.porCampo.vc.faixa as unknown as Record<string, number | string>;
  assert.equal(typeof vc.escoreT, "number");
  assert.equal(vc.z, Math.round((((vc.escoreT as number) - 50) / 10) * 1000) / 1000);
  assert.equal(vc.pontoComposto, Math.round((((vc.escoreT as number) - 50) / 10) * 15 * 100 + 10000) / 100);
  for (const k of ["qiv", "qie", "qit4", "qit2"]) assert.equal(typeof (r.porCampo[k].faixa as unknown as { composto: number }).composto, "number", k);
  const parcial = calcular({ vc: 30, sm: 16 });
  assert.equal(typeof (parcial.porCampo.qiv.faixa as unknown as { composto: number }).composto, "number");
  assert.equal(parcial.porCampo.qie.faixa, null);
  assert.equal(parcial.porCampo.qit4.faixa, null);
});

test("WASI: habilidades (56) e intraindividual só com os 4 subtestes; idade mental do QIT-2", () => {
  const r = calcular({ vc: 30, sm: 16, cb: 20, rm: 14 });
  const e = r.extras as Record<string, any>;
  assert.equal(e.habilidades.length, 56);
  assert.ok(e.habilidades.every((h: any) => h.completa));
  assert.ok(e.intraindividual.maiorPositiva.diferenca >= e.intraindividual.maiorNegativa.diferenca);
  assert.match(e.idadeMental.qit2.texto, /^\d+a, \d+m$/);
  const sem = calcular({ vc: 30, sm: 16, cb: 20 }).extras as Record<string, any>;
  assert.ok(sem.habilidades.every((h: any) => !h.completa || h.subtestes.every((s: string) => s !== "rm")));
  assert.equal(sem.intraindividual.itens.length, 0);
});

test("WASI: menor de 6 anos não tem norma", () => {
  const r = calcular({ vc: 10, sm: 8 }, new Date("2022-01-01T00:00:00Z"), REF);
  assert.equal(r.porCampo.vc.faixa, null);
});
