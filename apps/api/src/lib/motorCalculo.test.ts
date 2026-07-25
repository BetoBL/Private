import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calcularIdadeEmAnos,
  calcularResultado,
  escolherTabelaNormativa,
  localizarFaixa,
  type ConversaoNormativa,
} from "./motorCalculo";

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

// --- faixasPorCampo: cada campo com sua própria tabela (ex: RAVLT — A1 e A7 têm cortes distintos) ---

const RAVLT_CONVERSAO: ConversaoNormativa = {
  tipo: "percentil_por_campo",
  faixasPorCampo: {
    a1: [
      { min: 0, max: 3, percentil: "<5", classificacao: "Inferior" },
      { min: 4, max: 6, percentil: "50", classificacao: "Típico" },
    ],
    a7: [
      { min: 0, max: 5, percentil: "<5", classificacao: "Inferior" },
      { min: 6, max: 10, percentil: "50", classificacao: "Típico" },
    ],
  },
};

test("calcularResultado: faixasPorCampo usa a tabela específica de cada campo, não uma compartilhada", () => {
  const resultado = calcularResultado({ a1: 5, a7: 5 }, RAVLT_CONVERSAO);
  assert.equal(resultado.modo, "por_campo");
  if (resultado.modo !== "por_campo") throw new Error("esperado modo por_campo");
  // valor 5 é "Típico" para a1 (tabela de a1) mas "Inferior" para a7 (tabela de a7)
  assert.equal(resultado.porCampo.a1.faixa?.classificacao, "Típico");
  assert.equal(resultado.porCampo.a7.faixa?.classificacao, "Inferior");
});

test("calcularResultado: faixasPorCampo sem entrada para o campo retorna faixa null", () => {
  const resultado = calcularResultado({ campoNaoMapeado: 10 }, RAVLT_CONVERSAO);
  assert.equal(resultado.modo, "por_campo");
  if (resultado.modo !== "por_campo") throw new Error("esperado modo por_campo");
  assert.equal(resultado.porCampo.campoNaoMapeado.faixa, null);
});

// --- escolherTabelaNormativa ---

test("escolherTabelaNormativa: escolhe a tabela cuja faixa etária cobre a idade", () => {
  const tabelas = [
    { id: "6-8", faixaMin: 6, faixaMax: 8 },
    { id: "9-11", faixaMin: 9, faixaMax: 11 },
    { id: "80+", faixaMin: 80, faixaMax: 150 },
  ];
  assert.equal(escolherTabelaNormativa({ idadeAnos: 7 }, tabelas)?.id, "6-8");
  assert.equal(escolherTabelaNormativa({ idadeAnos: 9 }, tabelas)?.id, "9-11");
  assert.equal(escolherTabelaNormativa({ idadeAnos: 85 }, tabelas)?.id, "80+");
});

test("escolherTabelaNormativa: idade nos limites exatos das faixas é inclusiva", () => {
  const tabelas = [
    { id: "6-8", faixaMin: 6, faixaMax: 8 },
    { id: "9-11", faixaMin: 9, faixaMax: 11 },
  ];
  assert.equal(escolherTabelaNormativa({ idadeAnos: 8 }, tabelas)?.id, "6-8");
  assert.equal(escolherTabelaNormativa({ idadeAnos: 9 }, tabelas)?.id, "9-11");
});

test("escolherTabelaNormativa: sem faixa cobrindo a idade, cai para a 1ª tabela (compatibilidade com testes de tabela única)", () => {
  const tabelas = [
    { id: "unica", faixaMin: null, faixaMax: null },
  ];
  assert.equal(escolherTabelaNormativa({ idadeAnos: 150 }, tabelas)?.id, "unica");
});

test("escolherTabelaNormativa: lista vazia retorna undefined", () => {
  assert.equal(escolherTabelaNormativa({ idadeAnos: 30 }, []), undefined);
});

test("escolherTabelaNormativa: tabelas com sexo definido só disputam se baterem com o sexo do paciente", () => {
  const tabelas = [
    { id: "5-7-M", faixaMin: 5, faixaMax: 7, sexo: "MASCULINO" as const },
    { id: "5-7-F", faixaMin: 5, faixaMax: 7, sexo: "FEMININO" as const },
  ];
  assert.equal(escolherTabelaNormativa({ idadeAnos: 6, sexo: "FEMININO" }, tabelas)?.id, "5-7-F");
  assert.equal(escolherTabelaNormativa({ idadeAnos: 6, sexo: "MASCULINO" }, tabelas)?.id, "5-7-M");
});

test("escolherTabelaNormativa: tabelas sem sexo definido servem qualquer paciente (ex: RAVLT/BPA)", () => {
  const tabelas = [{ id: "6-8", faixaMin: 6, faixaMax: 8, sexo: null }];
  assert.equal(escolherTabelaNormativa({ idadeAnos: 7, sexo: "FEMININO" }, tabelas)?.id, "6-8");
  assert.equal(escolherTabelaNormativa({ idadeAnos: 7, sexo: null }, tabelas)?.id, "6-8");
});

test("escolherTabelaNormativa: sexo do paciente ausente ainda escolhe pela idade entre candidatas sem sexo", () => {
  const tabelas = [
    { id: "5-7-M", faixaMin: 5, faixaMax: 7, sexo: "MASCULINO" as const },
    { id: "5-7-F", faixaMin: 5, faixaMax: 7, sexo: "FEMININO" as const },
    { id: "5-7-geral", faixaMin: 5, faixaMax: 7, sexo: null },
  ];
  assert.equal(escolherTabelaNormativa({ idadeAnos: 6, sexo: null }, tabelas)?.id, "5-7-geral");
});

// --- calcularIdadeEmAnos ---

test("calcularIdadeEmAnos: calcula idade completa quando o aniversário já passou no ano", () => {
  const nascimento = new Date(2000, 5, 15); // 15/jun/2000
  const referencia = new Date(2026, 6, 1); // 01/jul/2026 — aniversário já passou
  assert.equal(calcularIdadeEmAnos(nascimento, referencia), 26);
});

test("calcularIdadeEmAnos: não soma o ano corrente se o aniversário ainda não chegou", () => {
  const nascimento = new Date(2000, 11, 25); // 25/dez/2000
  const referencia = new Date(2026, 6, 1); // 01/jul/2026 — aniversário ainda não chegou
  assert.equal(calcularIdadeEmAnos(nascimento, referencia), 25);
});

test("calcularIdadeEmAnos: data de referência igual ao dia do aniversário já conta o ano novo", () => {
  const nascimento = new Date(2000, 6, 1);
  const referencia = new Date(2026, 6, 1);
  assert.equal(calcularIdadeEmAnos(nascimento, referencia), 26);
});
