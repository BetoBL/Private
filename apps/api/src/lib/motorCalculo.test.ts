import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calcularIdadeEmAnos,
  calcularIdadeEmMeses,
  calcularResultado,
  escolherNormativaCustomizada,
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

// --- camposDerivados: campo cujo "bruto" é a soma de um valor extraído de outros campos já
// convertidos (ex: ADL2 — Escore Padrão Global = EP(LC) + EP(LE)) ---

const ADL2_CONVERSAO: ConversaoNormativa = {
  tipo: "percentil_por_campo",
  faixasPorCampo: {
    lc: [
      { min: 0, max: 10, escorePadrao: 70 },
      { min: 11, max: 20, escorePadrao: 90 },
    ],
    le: [
      { min: 0, max: 10, escorePadrao: 65 },
      { min: 11, max: 20, escorePadrao: 88 },
    ],
    global: [
      { min: 0, max: 140, classificacao: "Distúrbio moderado" },
      { min: 141, max: 999, classificacao: "Faixa da normalidade" },
    ],
  },
  camposDerivados: {
    global: { fontes: ["lc", "le"], campoValor: "escorePadrao" },
  },
};

test("calcularResultado: camposDerivados soma o campoValor extraído de outros campos e localiza a própria faixa", () => {
  const resultado = calcularResultado({ lc: 15, le: 15 }, ADL2_CONVERSAO);
  assert.equal(resultado.modo, "por_campo");
  if (resultado.modo !== "por_campo") throw new Error("esperado modo por_campo");
  assert.equal(resultado.porCampo.lc.faixa?.escorePadrao, 90);
  assert.equal(resultado.porCampo.le.faixa?.escorePadrao, 88);
  assert.equal(resultado.porCampo.global.valorBruto, 178); // 90 + 88
  assert.equal(resultado.porCampo.global.faixa?.classificacao, "Faixa da normalidade");
});

test("calcularResultado: camposDerivados cujos campos-fonte não bateram nenhuma faixa soma 0", () => {
  const resultado = calcularResultado({ lc: -5, le: -5 }, ADL2_CONVERSAO);
  assert.equal(resultado.modo, "por_campo");
  if (resultado.modo !== "por_campo") throw new Error("esperado modo por_campo");
  assert.equal(resultado.porCampo.lc.faixa, null);
  assert.equal(resultado.porCampo.global.valorBruto, 0);
  assert.equal(resultado.porCampo.global.faixa?.classificacao, "Distúrbio moderado");
});

// --- exigeTodasFontes: o oposto do caso acima — em vez de somar 0 no lugar do que falta, devolve
// "não calculado". Modelado no WISC-IV, onde um QI Total somando 0 por um subteste não lançado
// seria um número plausível e errado indo para um laudo. ---

const WISC4_CONVERSAO: ConversaoNormativa = {
  tipo: "ponderado_e_composto_por_campo",
  faixasPorCampo: {
    // 2 subtestes só, com tabelas bruto -> ponderado propositalmente diferentes entre si
    dg: [
      { min: 0, max: 9, ponderado: 8 },
      { min: 10, max: 20, ponderado: 12 },
    ],
    snl: [
      { min: 0, max: 5, ponderado: 7 },
      { min: 6, max: 20, ponderado: 11 },
    ],
    imo: [
      { min: 15, max: 15, composto: 85, percentil: "16" },
      { min: 23, max: 23, composto: 109, percentil: "73" },
    ],
  },
  camposDerivados: {
    imo: { fontes: ["dg", "snl"], campoValor: "ponderado", exigeTodasFontes: true },
  },
};

test("calcularResultado: exigeTodasFontes calcula normalmente quando todas as fontes estão presentes", () => {
  const resultado = calcularResultado({ dg: 12, snl: 8 }, WISC4_CONVERSAO);
  assert.equal(resultado.modo, "por_campo");
  if (resultado.modo !== "por_campo") throw new Error("esperado modo por_campo");
  assert.equal(resultado.porCampo.dg.faixa?.ponderado, 12);
  assert.equal(resultado.porCampo.snl.faixa?.ponderado, 11);
  assert.equal(resultado.porCampo.imo.valorBruto, 23); // 12 + 11
  assert.equal(resultado.porCampo.imo.faixa?.composto, 109);
  assert.equal(resultado.porCampo.imo.faixa?.percentil, "73");
});

test("calcularResultado: exigeTodasFontes com subteste não lançado devolve não-calculado, não soma 0", () => {
  const resultado = calcularResultado({ dg: 12 }, WISC4_CONVERSAO); // snl ausente
  assert.equal(resultado.modo, "por_campo");
  if (resultado.modo !== "por_campo") throw new Error("esperado modo por_campo");
  assert.equal(resultado.porCampo.imo.valorBruto, null);
  assert.equal(resultado.porCampo.imo.faixa, null);
  // Sem a flag, o derivado somaria 12 + 0 = 12 e localizaria (ou não) uma faixa — o ponto do
  // teste é justamente que 12 nunca chega a ser considerado.
});

test("calcularResultado: exigeTodasFontes com fonte lançada mas fora de qualquer faixa também não calcula", () => {
  const resultado = calcularResultado({ dg: 12, snl: -1 }, WISC4_CONVERSAO);
  assert.equal(resultado.modo, "por_campo");
  if (resultado.modo !== "por_campo") throw new Error("esperado modo por_campo");
  assert.equal(resultado.porCampo.snl.faixa, null);
  assert.equal(resultado.porCampo.imo.valorBruto, null);
  assert.equal(resultado.porCampo.imo.faixa, null);
});

// --- operacao: "subtracao" — ex.: FDT, Inibição = tempo(Escolha) - tempo(Contagem) ---

const FDT_CONVERSAO: ConversaoNormativa = {
  tipo: "percentil_por_campo",
  faixasPorCampo: {
    // Tempo bruto (segundos) de Escolha e Contagem — cada um com sua própria tabela de percentil,
    // mas o que importa para Inibição é o segundo exato de entrada, não o rótulo de percentil.
    tempoEscolha: [{ min: 0, max: 999, percentil: ">95" }],
    tempoContagem: [{ min: 0, max: 999, percentil: ">95" }],
    inibicao: [
      { min: 0, max: 20, percentil: ">75" },
      { min: 21, max: 999, percentil: "<=75" },
    ],
  },
  camposDerivados: {
    inibicao: { fontes: ["tempoEscolha", "tempoContagem"], campoValor: "valorBruto", operacao: "subtracao" },
  },
};

test("calcularResultado: operacao subtracao com campoValor 'valorBruto' subtrai os BRUTOS de entrada, não um campo da faixa", () => {
  const resultado = calcularResultado({ tempoEscolha: 42, tempoContagem: 27 }, FDT_CONVERSAO);
  assert.equal(resultado.modo, "por_campo");
  if (resultado.modo !== "por_campo") throw new Error("esperado modo por_campo");
  // Se lesse da faixa (como "ponderado"/"escorePadrao"), o valor seria o rótulo ">95" (não numérico)
  // e a subtração falharia; "valorBruto" pega 42 e 27 de entrada direto.
  assert.equal(resultado.porCampo.inibicao.valorBruto, 15); // 42 - 27
  assert.equal(resultado.porCampo.inibicao.faixa?.percentil, ">75");
});

test("calcularResultado: operacao subtracao com subteste-fonte não lançado devolve não-calculado, nunca subtrai 0", () => {
  const resultado = calcularResultado({ tempoEscolha: 42 }, FDT_CONVERSAO); // tempoContagem ausente
  assert.equal(resultado.modo, "por_campo");
  if (resultado.modo !== "por_campo") throw new Error("esperado modo por_campo");
  assert.equal(resultado.porCampo.inibicao.valorBruto, null);
  assert.equal(resultado.porCampo.inibicao.faixa, null);
  // Sem essa trava, o derivado subtrairia 42 - 0 = 42 e localizaria uma faixa plausível e errada.
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
    { id: "6-8", criterio: "idade", faixaMin: 6, faixaMax: 8 },
    { id: "9-11", criterio: "idade", faixaMin: 9, faixaMax: 11 },
    { id: "80+", criterio: "idade", faixaMin: 80, faixaMax: 150 },
  ];
  assert.equal(escolherTabelaNormativa({ idadeAnos: 7 }, tabelas)?.id, "6-8");
  assert.equal(escolherTabelaNormativa({ idadeAnos: 9 }, tabelas)?.id, "9-11");
  assert.equal(escolherTabelaNormativa({ idadeAnos: 85 }, tabelas)?.id, "80+");
});

test("escolherTabelaNormativa: idade nos limites exatos das faixas é inclusiva", () => {
  const tabelas = [
    { id: "6-8", criterio: "idade", faixaMin: 6, faixaMax: 8 },
    { id: "9-11", criterio: "idade", faixaMin: 9, faixaMax: 11 },
  ];
  assert.equal(escolherTabelaNormativa({ idadeAnos: 8 }, tabelas)?.id, "6-8");
  assert.equal(escolherTabelaNormativa({ idadeAnos: 9 }, tabelas)?.id, "9-11");
});

test("escolherTabelaNormativa: sem faixa cobrindo a idade, cai para a 1ª tabela (compatibilidade com testes de tabela única)", () => {
  const tabelas = [
    { id: "unica", criterio: "geral", faixaMin: null, faixaMax: null },
  ];
  assert.equal(escolherTabelaNormativa({ idadeAnos: 150 }, tabelas)?.id, "unica");
});

test("escolherTabelaNormativa: lista vazia retorna undefined", () => {
  assert.equal(escolherTabelaNormativa({ idadeAnos: 30 }, []), undefined);
});

test("escolherTabelaNormativa: tabelas com sexo definido só disputam se baterem com o sexo do paciente", () => {
  const tabelas = [
    { id: "5-7-M", criterio: "idade+sexo", faixaMin: 5, faixaMax: 7, sexo: "MASCULINO" as const },
    { id: "5-7-F", criterio: "idade+sexo", faixaMin: 5, faixaMax: 7, sexo: "FEMININO" as const },
  ];
  assert.equal(escolherTabelaNormativa({ idadeAnos: 6, sexo: "FEMININO" }, tabelas)?.id, "5-7-F");
  assert.equal(escolherTabelaNormativa({ idadeAnos: 6, sexo: "MASCULINO" }, tabelas)?.id, "5-7-M");
});

test("escolherTabelaNormativa: tabelas sem sexo definido servem qualquer paciente (ex: RAVLT/BPA)", () => {
  const tabelas = [{ id: "6-8", criterio: "idade", faixaMin: 6, faixaMax: 8, sexo: null }];
  assert.equal(escolherTabelaNormativa({ idadeAnos: 7, sexo: "FEMININO" }, tabelas)?.id, "6-8");
  assert.equal(escolherTabelaNormativa({ idadeAnos: 7, sexo: null }, tabelas)?.id, "6-8");
});

test("escolherTabelaNormativa: sexo do paciente ausente ainda escolhe pela idade entre candidatas sem sexo", () => {
  const tabelas = [
    { id: "5-7-M", criterio: "idade+sexo", faixaMin: 5, faixaMax: 7, sexo: "MASCULINO" as const },
    { id: "5-7-F", criterio: "idade+sexo", faixaMin: 5, faixaMax: 7, sexo: "FEMININO" as const },
    { id: "5-7-geral", criterio: "idade", faixaMin: 5, faixaMax: 7, sexo: null },
  ];
  assert.equal(escolherTabelaNormativa({ idadeAnos: 6, sexo: null }, tabelas)?.id, "5-7-geral");
});

test("escolherTabelaNormativa: tabelas com criterio idade_meses comparam contra idadeMeses, não idadeAnos", () => {
  const tabelas = [
    { id: "2;6", criterio: "idade_meses", faixaMin: 30, faixaMax: 30 },
    { id: "2;7", criterio: "idade_meses", faixaMin: 31, faixaMax: 31 },
  ];
  // idadeAnos=2 seria ambíguo entre as duas faixas se a comparação usasse anos — só faz
  // sentido com idadeMeses precisa.
  assert.equal(escolherTabelaNormativa({ idadeAnos: 2, idadeMeses: 30 }, tabelas)?.id, "2;6");
  assert.equal(escolherTabelaNormativa({ idadeAnos: 2, idadeMeses: 31 }, tabelas)?.id, "2;7");
});

test("escolherTabelaNormativa: criterio idade_meses sem idadeMeses informado não bate nenhuma faixa (cai no fallback)", () => {
  const tabelas = [{ id: "2;6", criterio: "idade_meses", faixaMin: 30, faixaMax: 30 }];
  assert.equal(escolherTabelaNormativa({ idadeAnos: 2 }, tabelas)?.id, "2;6"); // fallback = base[0]
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

// --- calcularIdadeEmMeses ---

test("calcularIdadeEmMeses: conta meses completos entre nascimento e referência", () => {
  const nascimento = new Date(2023, 0, 15); // 15/jan/2023
  const referencia = new Date(2025, 7, 20); // 20/ago/2025 — 2 anos e 7 meses completos, dia já passou
  assert.equal(calcularIdadeEmMeses(nascimento, referencia), 31); // 2*12 + 7
});

test("calcularIdadeEmMeses: não conta o mês corrente se o dia do aniversário mensal ainda não chegou", () => {
  const nascimento = new Date(2023, 0, 25); // 25/jan/2023
  const referencia = new Date(2025, 7, 20); // 20/ago/2025 — dia 20 < dia 25, mês ainda não completou
  assert.equal(calcularIdadeEmMeses(nascimento, referencia), 30); // 31 - 1
});

test("calcularIdadeEmMeses: nascimento e referência no mesmo dia do mês resulta em meses exatos", () => {
  const nascimento = new Date(2023, 5, 10); // 10/jun/2023
  const referencia = new Date(2023, 11, 10); // 10/dez/2023
  assert.equal(calcularIdadeEmMeses(nascimento, referencia), 6);
});

// --- escolherNormativaCustomizada ---

test("escolherNormativaCustomizada: só devolve tabela que realmente cobre o paciente (nunca a 'mais próxima')", () => {
  const tabelas = [{ id: "6-8", criterio: "idade", faixaMin: 6, faixaMax: 8 }];
  assert.equal(escolherNormativaCustomizada({ idadeAnos: 7 }, tabelas)?.id, "6-8");
  assert.equal(escolherNormativaCustomizada({ idadeAnos: 30 }, tabelas), undefined);
});

test("escolherNormativaCustomizada: faixa nula nos dois extremos cobre qualquer idade; extremo aberto vale um lado só", () => {
  assert.equal(
    escolherNormativaCustomizada({ idadeAnos: 90 }, [{ id: "todas", criterio: "idade", faixaMin: null, faixaMax: null }])?.id,
    "todas"
  );
  const aberta = [{ id: "60+", criterio: "idade", faixaMin: 60, faixaMax: null }];
  assert.equal(escolherNormativaCustomizada({ idadeAnos: 75 }, aberta)?.id, "60+");
  assert.equal(escolherNormativaCustomizada({ idadeAnos: 59 }, aberta), undefined);
});

test("escolherNormativaCustomizada: sexo definido que não bate com o paciente não cobre", () => {
  const tabelas = [{ id: "F", criterio: "idade", faixaMin: 5, faixaMax: 9, sexo: "FEMININO" as const }];
  assert.equal(escolherNormativaCustomizada({ idadeAnos: 7, sexo: "MASCULINO" }, tabelas), undefined);
  assert.equal(escolherNormativaCustomizada({ idadeAnos: 7, sexo: null }, tabelas), undefined);
  assert.equal(escolherNormativaCustomizada({ idadeAnos: 7, sexo: "FEMININO" }, tabelas)?.id, "F");
});

test("escolherNormativaCustomizada: a mais específica (sexo + faixa) vence a genérica", () => {
  const tabelas = [
    { id: "geral", criterio: "idade", faixaMin: null, faixaMax: null },
    { id: "faixa", criterio: "idade", faixaMin: 5, faixaMax: 9 },
    { id: "faixa-F", criterio: "idade", faixaMin: 5, faixaMax: 9, sexo: "FEMININO" as const },
  ];
  assert.equal(escolherNormativaCustomizada({ idadeAnos: 7, sexo: "FEMININO" }, tabelas)?.id, "faixa-F");
  assert.equal(escolherNormativaCustomizada({ idadeAnos: 7, sexo: "MASCULINO" }, tabelas)?.id, "faixa");
  assert.equal(escolherNormativaCustomizada({ idadeAnos: 40, sexo: "MASCULINO" }, tabelas)?.id, "geral");
});

test("escolherNormativaCustomizada: criterio idade_meses compara contra idadeMeses", () => {
  const tabelas = [{ id: "30-35m", criterio: "idade_meses", faixaMin: 30, faixaMax: 35 }];
  assert.equal(escolherNormativaCustomizada({ idadeAnos: 2, idadeMeses: 31 }, tabelas)?.id, "30-35m");
  assert.equal(escolherNormativaCustomizada({ idadeAnos: 2 }, tabelas), undefined);
});
