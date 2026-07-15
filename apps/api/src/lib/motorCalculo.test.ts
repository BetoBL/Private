import assert from "node:assert/strict";
import { test } from "node:test";
import { calcularResultado, localizarFaixa, type ConversaoNormativa } from "./motorCalculo";

test("localizarFaixa: encontra a faixa correta, limites inclusivos", () => {
  const faixas = [
    { min: 0, max: 10, classificacao: "Baixo" },
    { min: 11, max: 20, classificacao: "Médio" },
    { min: 21, max: 999, classificacao: "Alto" },
  ];
  assert.equal(localizarFaixa(0, faixas)?.classificacao, "Baixo");
  assert.equal(localizarFaixa(10, faixas)?.classificacao, "Baixo");
  assert.equal(localizarFaixa(11, faixas)?.classificacao, "Médio");
  assert.equal(localizarFaixa(20, faixas)?.classificacao, "Médio");
  assert.equal(localizarFaixa(21, faixas)?.classificacao, "Alto");
  assert.equal(localizarFaixa(500, faixas)?.classificacao, "Alto");
});

test("localizarFaixa: retorna null quando nenhuma faixa cobre o valor", () => {
  const faixas = [{ min: 10, max: 20, classificacao: "Médio" }];
  assert.equal(localizarFaixa(5, faixas), null);
});

test("localizarFaixa: lista vazia retorna null", () => {
  assert.equal(localizarFaixa(5, []), null);
});

// --- Fixtures espelhando prisma/seed.ts (cópia intencional — o teste não deve depender do seed) ---

const SRS2_CONVERSAO: ConversaoNormativa = {
  tipo: "escoreT_por_soma_total",
  faixas: [
    { min: 0, max: 59, escoreT: 50, classificacao: "Não clínico" },
    { min: 60, max: 75, escoreT: 65, classificacao: "Faixa leve a moderada" },
    { min: 76, max: 999, escoreT: 75, classificacao: "Faixa clínica" },
  ],
};

const BPA2_CONVERSAO: ConversaoNormativa = {
  tipo: "percentil_por_subteste",
  faixas: [
    { min: 0, max: 20, percentil: 10, classificacao: "Inferior" },
    { min: 21, max: 40, percentil: 40, classificacao: "Médio" },
    { min: 41, max: 60, percentil: 70, classificacao: "Médio Superior" },
    { min: 61, max: 999, percentil: 90, classificacao: "Superior" },
  ],
};

const AQ50_CONVERSAO: ConversaoNormativa = {
  tipo: "ponto_de_corte_por_soma_total",
  faixas: [
    { min: 0, max: 25, classificacao: "Abaixo do ponto de corte" },
    { min: 26, max: 999, classificacao: "Acima do ponto de corte — traços significativos" },
  ],
};

const ETDAH2_CONVERSAO: ConversaoNormativa = {
  tipo: "percentil_por_fator",
  faixas: [
    { min: 0, max: 30, percentil: 30, classificacao: "Não sugestivo" },
    { min: 31, max: 60, percentil: 70, classificacao: "Sugestivo — investigar" },
    { min: 61, max: 999, percentil: 95, classificacao: "Fortemente sugestivo" },
  ],
};

test("calcularResultado: modo soma (SRS-2) soma as 5 subescalas e localiza faixa clínica", () => {
  const escoresBrutos = {
    conscienciaSocial: 14,
    cognicaoSocial: 18,
    comunicacaoSocial: 22,
    motivacaoSocial: 11,
    maneirismos: 16,
  };
  const resultado = calcularResultado(escoresBrutos, SRS2_CONVERSAO);
  assert.equal(resultado.modo, "soma");
  if (resultado.modo !== "soma") throw new Error("esperado modo soma");
  assert.equal(resultado.escoreBrutoTotal, 81); // 14+18+22+11+16
  assert.equal(resultado.faixa?.classificacao, "Faixa clínica");
});

test("calcularResultado: modo soma (AQ-50) classifica abaixo do ponto de corte", () => {
  const resultado = calcularResultado({ escoreTotal: 18 }, AQ50_CONVERSAO);
  assert.equal(resultado.modo, "soma");
  if (resultado.modo !== "soma") throw new Error("esperado modo soma");
  assert.equal(resultado.escoreBrutoTotal, 18);
  assert.equal(resultado.faixa?.classificacao, "Abaixo do ponto de corte");
});

test("calcularResultado: modo por_campo (BPA-2) avalia cada subteste independentemente", () => {
  const escoresBrutos = { ac: 15, ad: 35, aa: 65 };
  const resultado = calcularResultado(escoresBrutos, BPA2_CONVERSAO);
  assert.equal(resultado.modo, "por_campo");
  if (resultado.modo !== "por_campo") throw new Error("esperado modo por_campo");
  assert.equal(resultado.porCampo.ac.faixa?.classificacao, "Inferior");
  assert.equal(resultado.porCampo.ad.faixa?.classificacao, "Médio");
  assert.equal(resultado.porCampo.aa.faixa?.classificacao, "Superior");
});

test("calcularResultado: modo por_campo (ETDAH-2) preserva o valor bruto de cada fator", () => {
  const escoresBrutos = { desatencao: 45, hiperatividade: 10, impulsividade: 70 };
  const resultado = calcularResultado(escoresBrutos, ETDAH2_CONVERSAO);
  assert.equal(resultado.modo, "por_campo");
  if (resultado.modo !== "por_campo") throw new Error("esperado modo por_campo");
  assert.equal(resultado.porCampo.desatencao.valorBruto, 45);
  assert.equal(resultado.porCampo.desatencao.faixa?.classificacao, "Sugestivo — investigar");
  assert.equal(resultado.porCampo.hiperatividade.faixa?.classificacao, "Não sugestivo");
  assert.equal(resultado.porCampo.impulsividade.faixa?.classificacao, "Fortemente sugestivo");
});

test("calcularResultado: escoresBrutos vazio no modo soma resulta em total 0", () => {
  const resultado = calcularResultado({}, SRS2_CONVERSAO);
  assert.equal(resultado.modo, "soma");
  if (resultado.modo !== "soma") throw new Error("esperado modo soma");
  assert.equal(resultado.escoreBrutoTotal, 0);
  assert.equal(resultado.faixa?.classificacao, "Não clínico");
});

test("calcularResultado: valor fora de todas as faixas retorna faixa null sem lançar erro", () => {
  const resultado = calcularResultado({ ac: -5 }, BPA2_CONVERSAO);
  assert.equal(resultado.modo, "por_campo");
  if (resultado.modo !== "por_campo") throw new Error("esperado modo por_campo");
  assert.equal(resultado.porCampo.ac.faixa, null);
});
