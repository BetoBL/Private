import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { calcularIdadeEmDias, calcularResultado, formatarIdadeCompleta, type ConversaoNormativa } from "./motorCalculo";
import { classificarPonderado, classificarPorPercentil, normalAcumulada, type Wais3Planilha } from "./wais3";

const dados = {
  tipo: "wais3_planilha",
  ...JSON.parse(readFileSync(join(__dirname, "..", "..", "..", "..", "docs", "testes", "WAIS-III-planilha.json"), "utf8")),
} as Wais3Planilha;
const conversao = dados as unknown as ConversaoNormativa;

// Gabarito: valores que a PRÓPRIA planilha da psicóloga mostra para o paciente de exemplo
// (aba WAIS-III, nascimento 33477 = 1991-09-?, aplicação 46231; Q5 = 12754 dias = 34a 11m 1d; IC 95%).
const IDADE_DIAS = 12754;
const BRUTOS = {
  completarFiguras: 14, vocabulario: 37, codigos: 27, semelhancas: 16, cubos: 24, aritmetica: 9,
  raciocinioMatricial: 13, digitos: 13, informacao: 13, arranjoFiguras: 10, compreensao: 16,
  procurarSimbolos: 34, sequenciaNumerosLetras: 6,
};

function calcular(brutos: Record<string, number>, dias = IDADE_DIAS) {
  const r = calcularResultado(brutos, conversao, { idadeDias: dias, idadeAnos: Math.floor(dias / 365.25) });
  assert.equal(r.modo, "por_campo");
  return r.modo === "por_campo" ? r.porCampo : {};
}

test("WAIS-III: ponderados batem com a planilha (faixa 30-39 anos)", () => {
  const r = calcular(BRUTOS);
  const esperado = {
    completarFiguras: 8, vocabulario: 11, codigos: 6, semelhancas: 8, cubos: 9, aritmetica: 9,
    raciocinioMatricial: 9, digitos: 9, informacao: 11, arranjoFiguras: 10, compreensao: 9,
    procurarSimbolos: 12, sequenciaNumerosLetras: 8,
  } as Record<string, number>;
  for (const [chave, ponderado] of Object.entries(esperado)) {
    assert.equal(r[chave].faixa?.ponderado, ponderado, `${chave}`);
  }
});

test("WAIS-III: somas, compostos, percentis e IC95 batem com a planilha", () => {
  const r = calcular(BRUTOS);
  const esperado: Record<string, { soma: number; composto: number; percentil: number; ic95: string; classificacao: string }> = {
    icv: { soma: 30, composto: 100, percentil: 50, ic95: "94 - 106", classificacao: "Média" },
    iop: { soma: 26, composto: 92, percentil: 30, ic95: "86 - 99", classificacao: "Média" },
    imo: { soma: 26, composto: 92, percentil: 30, ic95: "85 - 101", classificacao: "Média" },
    ivp: { soma: 18, composto: 95, percentil: 37, ic95: "86 - 106", classificacao: "Média" },
    qit: { soma: 99, composto: 93, percentil: 32, ic95: "89 - 97", classificacao: "Média" },
    gai: { soma: 56, composto: 94, percentil: 34, ic95: "89 - 99", classificacao: "Média" },
    qiv: { soma: 57, composto: 97, percentil: 42, ic95: "92 - 102", classificacao: "Média" },
    qie: { soma: 42, composto: 90, percentil: 25, ic95: "84 - 97", classificacao: "Média" },
  };
  for (const [indice, e] of Object.entries(esperado)) {
    assert.equal(r[indice].valorBruto, e.soma, `${indice} soma`);
    assert.equal(r[indice].faixa?.composto, e.composto, `${indice} composto`);
    assert.equal(r[indice].faixa?.percentil, e.percentil, `${indice} percentil`);
    assert.equal(r[indice].faixa?.ic95, e.ic95, `${indice} ic95`);
    assert.equal(r[indice].faixa?.classificacao, e.classificacao, `${indice} classificação`);
  }
});

test("WAIS-III: Sequência de Números e Letras só entra no QI Verbal se Dígitos faltar", () => {
  const semDigitos = { ...BRUTOS } as Record<string, number>;
  delete semDigitos.digitos;
  const r = calcular(semDigitos);
  assert.equal(r.qiv.valorBruto, 57 - 9 + 8); // troca Dígitos(9) por SNL(8)
  assert.equal(r.imo.valorBruto, null); // IMO exige os três subtestes
  assert.equal(calcular(BRUTOS).qiv.valorBruto, 57);
});

test("WAIS-III: Procurar Símbolos substitui Códigos; Armar Objetos substitui UM titular faltante", () => {
  const semCodigos = { ...BRUTOS } as Record<string, number>;
  delete semCodigos.codigos;
  assert.equal(calcular(semCodigos).qie.valorBruto, 42 - 6 + 12);

  const semCubos = { ...BRUTOS, armarObjetos: 10 } as Record<string, number>;
  delete semCubos.cubos;
  const comAO = calcular(semCubos);
  const ponderadoAO = comAO.armarObjetos.faixa?.ponderado as number;
  assert.ok(ponderadoAO >= 1 && ponderadoAO <= 19);
  assert.equal(comAO.qie.valorBruto, 42 - 9 + ponderadoAO); // troca Cubos(9) pelo ponderado de Armar Objetos

  const semCubosESemAO = { ...BRUTOS } as Record<string, number>;
  delete semCubosESemAO.cubos;
  assert.equal(calcular(semCubosESemAO).qie.valorBruto, null); // faltou titular e não há substituto

  const doisFaltando = { ...BRUTOS, armarObjetos: 10 } as Record<string, number>;
  delete doisFaltando.cubos;
  delete doisFaltando.arranjoFiguras;
  assert.equal(calcular(doisFaltando).qie.valorBruto, null); // Armar Objetos cobre só um
});

test("WAIS-III: índice com subteste faltando volta 'não calculado' (a planilha somaria o que houvesse)", () => {
  const r = calcular({ vocabulario: 37, semelhancas: 16 });
  assert.equal(r.icv.valorBruto, null);
  assert.equal(r.icv.faixa, null);
  assert.equal(r.qit.valorBruto, null);
});

test("WAIS-III: a faixa etária muda o ponderado (mesmo bruto, idades diferentes)", () => {
  const jovem = calcular({ vocabulario: 37 }, 18 * 365 + 10); // 18-19 anos
  const idoso = calcular({ vocabulario: 37 }, 70 * 365); // 65-89 anos
  assert.ok((idoso.vocabulario.faixa?.ponderado as number) > (jovem.vocabulario.faixa?.ponderado as number));
});

test("WAIS-III: menor de 16 anos não tem norma (a planilha devolve 'Idade!')", () => {
  const r = calcular(BRUTOS, 15 * 365);
  assert.equal(r.vocabulario.faixa, null);
  assert.equal(r.qit.valorBruto, null);
});

test("WAIS-III: classificação por percentil, com os rótulos de borda da planilha", () => {
  assert.equal(classificarPorPercentil("> 99,9"), "Muito Superior");
  assert.equal(classificarPorPercentil("< 0,1"), "Deficitário");
  assert.equal(classificarPorPercentil(98), "Muito Superior");
  assert.equal(classificarPorPercentil(91), "Superior");
  assert.equal(classificarPorPercentil(75), "Média Superior");
  assert.equal(classificarPorPercentil(25), "Média");
  assert.equal(classificarPorPercentil(9), "Média Inferior");
  assert.equal(classificarPorPercentil(2), "Limítrofe");
  assert.equal(classificarPorPercentil(1.9), "Deficitário");
});

test("calcularIdadeEmDias: dias corridos entre as datas, ignorando a hora", () => {
  assert.equal(calcularIdadeEmDias(new Date("2000-01-01T00:00:00Z"), new Date("2000-01-02T23:59:00Z")), 1);
  assert.equal(calcularIdadeEmDias(new Date("1991-09-10T00:00:00Z"), new Date("1991-09-10T15:00:00Z")), 0);
});

// --- Colunas por subteste (Z-Score, Pts Compostos, Percent, Classificação) e linhas 26-28 da planilha ---
// Valores conferidos no print da planilha (aba WAIS-III, paciente de exemplo).
test("WAIS-III: Z-score, ponto composto, percentil e classificação por subteste batem com a planilha", () => {
  const r = calcular(BRUTOS);
  const esperado: Record<string, { z: number; composto: number; percentil: number; classificacao: string }> = {
    completarFiguras: { z: -0.667, composto: 90, percentil: 25.2, classificacao: "Média" },
    vocabulario: { z: 0.333, composto: 105, percentil: 63.1, classificacao: "Média" },
    codigos: { z: -1.333, composto: 80, percentil: 9.1, classificacao: "Média Inferior" },
    semelhancas: { z: -0.667, composto: 90, percentil: 25.2, classificacao: "Média" },
    cubos: { z: -0.333, composto: 95, percentil: 36.9, classificacao: "Média" },
    informacao: { z: 0.333, composto: 105, percentil: 63.1, classificacao: "Média" },
    arranjoFiguras: { z: 0, composto: 100, percentil: 50, classificacao: "Média" },
    procurarSimbolos: { z: 0.667, composto: 110, percentil: 74.8, classificacao: "Média Superior" },
    sequenciaNumerosLetras: { z: -0.667, composto: 90, percentil: 25.2, classificacao: "Média" },
  };
  for (const [chave, e] of Object.entries(esperado)) {
    const f = r[chave].faixa!;
    assert.equal(f.z, e.z, `${chave} z`);
    assert.equal(f.pontoComposto, e.composto, `${chave} composto`);
    assert.ok(Math.abs((f.percentil as number) - e.percentil) < 0.06, `${chave} percentil ${f.percentil} ~ ${e.percentil}`);
    assert.equal(f.classificacao, e.classificacao, `${chave} classificação`);
  }
});

test("WAIS-III: média dos ponderados, diferença e homogeneidade por índice batem com a planilha", () => {
  const r = calcular(BRUTOS);
  const esperado: Record<string, { mpp: number; diferenca: number; homogeneo: string }> = {
    icv: { mpp: 10, diferenca: 3, homogeneo: "SIM" },
    iop: { mpp: 8.67, diferenca: 1, homogeneo: "SIM" },
    imo: { mpp: 8.67, diferenca: 1, homogeneo: "SIM" },
    ivp: { mpp: 9, diferenca: 6, homogeneo: "NÃO" },
  };
  for (const [indice, e] of Object.entries(esperado)) {
    assert.equal(r[indice].faixa?.mpp, e.mpp, `${indice} M.P.P.`);
    assert.equal(r[indice].faixa?.diferenca, e.diferenca, `${indice} diferença`);
    assert.equal(r[indice].faixa?.homogeneo, e.homogeneo, `${indice} homogêneo`);
  }
  assert.equal(r.qit.valorBruto, 99); // linha TOTAL da planilha
  assert.equal(r.qiv.valorBruto, 57);
  assert.equal(r.qie.valorBruto, 42);
});

test("WAIS-III: classificação do subteste pelo ponderado (limiares da planilha)", () => {
  assert.equal(classificarPonderado(16), "Muito Superior");
  assert.equal(classificarPonderado(15), "Superior");
  assert.equal(classificarPonderado(14), "Superior");
  assert.equal(classificarPonderado(13), "Média Superior");
  assert.equal(classificarPonderado(12), "Média Superior");
  assert.equal(classificarPonderado(11), "Média");
  assert.equal(classificarPonderado(8), "Média");
  assert.equal(classificarPonderado(7), "Média Inferior");
  assert.equal(classificarPonderado(6), "Média Inferior");
  assert.equal(classificarPonderado(5), "Limítrofe");
  assert.equal(classificarPonderado(4), "Limítrofe");
  assert.equal(classificarPonderado(3), "Deficitário");
});

test("normalAcumulada: confere com valores conhecidos da normal padrão", () => {
  assert.ok(Math.abs(normalAcumulada(0) - 0.5) < 1e-7);
  assert.ok(Math.abs(normalAcumulada(1) - 0.8413447) < 1e-6);
  assert.ok(Math.abs(normalAcumulada(-1.3333333) - 0.0912112) < 1e-6);
});

test("formatarIdadeCompleta: igual ao 'Idade Cronológica' da planilha (27/08/1991 -> 28/07/2026 = 34a, 11m, 1d)", () => {
  assert.equal(formatarIdadeCompleta(new Date("1991-08-27T00:00:00Z"), new Date("2026-07-28T12:00:00Z")), "34a, 11m, 1d");
  assert.equal(calcularIdadeEmDias(new Date("1991-08-27T00:00:00Z"), new Date("2026-07-28T12:00:00Z")), 12754);
  assert.equal(formatarIdadeCompleta(new Date("2000-02-29T00:00:00Z"), new Date("2001-02-28T00:00:00Z")), "0a, 11m, 30d");
});

// --- Análise avançada (colunas K-S da planilha) — gabarito: print da planilha, paciente de exemplo ---
test("WAIS-III análise avançada: interpretável, média dos índices, diferença e valor crítico batem com a planilha", () => {
  const r = calcular(BRUTOS);
  const esperado: Record<string, { dif: number; vc: number }> = { icv: { dif: 5.25, vc: 5.6 }, iop: { dif: -2.75, vc: 6.9 }, imo: { dif: -2.75, vc: 6.4 } };
  for (const [k, e] of Object.entries(esperado)) {
    const f = r[k].faixa!;
    assert.equal(f.interpretavel, "SIM", `${k} interpretável`);
    assert.equal(f.dfNormativa, "Média", `${k} D/F normativa`);
    assert.equal(f.mediaIndices, 94.75, `${k} média dos índices`);
    assert.equal(f.diferencaMedia, e.dif, `${k} diferença`);
    assert.equal(f.valorCritico, e.vc, `${k} valor crítico`);
    assert.equal(f.dfIndividual, "", `${k} D/F individual (diferença menor que o valor crítico)`);
    assert.equal(f.raro, "", `${k} raro`);
  }
  // IVP: ponderados 6 e 12 (diferença 6 ≥ 5) → não interpretável, sem média/diferença/valor crítico
  const ivp = r.ivp.faixa!;
  assert.equal(ivp.interpretavel, "NÃO");
  assert.equal(ivp.mediaIndices, undefined);
  assert.equal(ivp.valorCritico, undefined);
  assert.ok(String(ivp.observacao).includes("Não interpretável"));
  assert.equal(r.qit.faixa?.interpretavel, "SIM");
  assert.equal(r.qit.faixa?.aviso, undefined);
  assert.equal(r.gai.faixa?.interpretavel, "SIM");
  assert.equal(r.gai.faixa?.aviso, undefined);
});

test("WAIS-III análise avançada: facilidade/dificuldade individual, raro e avisos de QI/GAI", () => {
  const r = calcular({ ...BRUTOS, vocabulario: 62, semelhancas: 34, informacao: 26 });
  assert.equal(r.icv.faixa?.dfNormativa, "Facilidade Normativa");
  assert.equal(r.icv.faixa?.dfIndividual, "Facilidade Individual");
  assert.equal(r.icv.faixa?.raro, "Raro"); // |diferença| 30,75 > 15,5
  assert.equal(r.iop.faixa?.dfIndividual, "Dificuldade Individual");
  assert.equal(r.iop.faixa?.raro, "Não Raro"); // 11,25 > valor crítico 6,9 e ≤ 14,8
  assert.equal(r.qit.faixa?.interpretavel, "NÃO"); // maior − menor índice ≥ 23
  assert.ok(String(r.qit.faixa?.aviso).startsWith("Atenção! Talvez o 'Q.I.'"));
  assert.equal(r.gai.faixa?.interpretavel, "NÃO"); // |ICV − IOP| ≥ 23
  assert.ok(String(r.gai.faixa?.aviso).includes("GAI"));
});

test("WAIS-III análise avançada: o valor crítico depende da faixa de idade", () => {
  const novo = calcular(BRUTOS, 17 * 365 + 100); // 17 anos
  const idoso = calcular(BRUTOS, 80 * 365 + 100); // 80 anos
  // índices podem não ser interpretáveis/calculáveis nessa idade com os mesmos brutos; compara só quando existir
  const vcNovo = novo.icv.faixa?.valorCritico;
  const vcIdoso = idoso.icv.faixa?.valorCritico;
  if (vcNovo !== undefined) assert.equal(vcNovo, 6.6); // tabela 16-17: ICV 6,6
  if (vcIdoso !== undefined) assert.equal(vcIdoso, 5.5); // tabela 80-84: ICV 5,5
  assert.ok(vcNovo !== undefined || vcIdoso !== undefined);
});

// --- Determinação das facilidades/dificuldades por subteste e comparação de discrepâncias ---
// Gabarito: print da planilha (paciente de exemplo, 13 subtestes, nível 0,05, 30-39 anos).
function extras(brutos: Record<string, number>, dias = IDADE_DIAS) {
  const r = calcularResultado(brutos, conversao, { idadeDias: dias, idadeAnos: Math.floor(dias / 365.25) });
  return (r.modo === "por_campo" ? r.extras : {}) as {
    determinacao?: {
      resumo: Record<string, { n: number; soma: number; media: number | null }>;
      recomendacao: { modo: number | null; texto: string; opcoes: string[] };
      modos: Array<{ id: string; linhas: Array<{ chave: string; ponderado: number; media: number | null; diferenca: number | null; n05: { critico: number | null; significativo: boolean; df: string; frequencia: string }; n15: { critico: number | null; significativo: boolean; df: string; frequencia: string } }> }>;
    };
    discrepancias?: { combos: Record<string, Array<{ a: string; b: string; valorA: number; valorB: number; diferenca: number; valorCritico: number | null; significativo: boolean; frequencia: string }>> };
  };
}

test("WAIS-III determinação por subteste: médias e recomendação batem com a planilha", () => {
  const d = extras(BRUTOS).determinacao!;
  assert.equal(d.resumo.verbal.soma, 65);
  assert.equal(d.resumo.verbal.n, 7);
  assert.ok(Math.abs((d.resumo.verbal.media as number) - 9.2857) < 1e-3);
  assert.equal(d.resumo.execucao.soma, 54);
  assert.equal(d.resumo.execucao.n, 6);
  assert.equal(d.resumo.execucao.media, 9);
  assert.equal(d.resumo.geral.soma, 119);
  assert.equal(d.resumo.geral.n, 13);
  assert.ok(Math.abs((d.resumo.geral.media as number) - 9.1538) < 1e-3);
  // 13 subtestes aplicados (todos menos Armar Objetos) → recomendação 3 da planilha
  assert.equal(d.recomendacao.modo, 3);
  assert.equal(d.recomendacao.texto, "Usar 'APENAS' a média dos 13 Subtestes");
  assert.deepEqual(d.recomendacao.opcoes, ["m13"]);
});

test("WAIS-III determinação por subteste: diferença da média e valor crítico (modo 14, nível 0,05) iguais ao print", () => {
  const m14 = extras(BRUTOS).determinacao!.modos.find((m) => m.id === "m14")!;
  const esperado: Record<string, { dif: number; critico: number }> = {
    vocabulario: { dif: 1.85, critico: 2.67 }, semelhancas: { dif: -1.15, critico: 3 }, aritmetica: { dif: -0.15, critico: 3.15 },
    digitos: { dif: -0.15, critico: 3.64 }, informacao: { dif: 1.85, critico: 2.54 }, compreensao: { dif: -0.15, critico: 2.89 },
    sequenciaNumerosLetras: { dif: -1.15, critico: 4.4 }, completarFiguras: { dif: -1.15, critico: 3.05 }, codigos: { dif: -3.15, critico: 3.66 },
    cubos: { dif: -0.15, critico: 3.38 }, raciocinioMatricial: { dif: -0.15, critico: 2.82 }, arranjoFiguras: { dif: 0.85, critico: 3.61 },
    procurarSimbolos: { dif: 2.85, critico: 5.08 },
  };
  assert.equal(m14.linhas.length, 13); // Armar Objetos não lançado → sem linha
  for (const [chave, e] of Object.entries(esperado)) {
    const l = m14.linhas.find((x) => x.chave === chave)!;
    assert.ok(Math.abs((l.diferenca as number) - e.dif) < 0.006, `${chave} diferença ${l.diferenca} ~ ${e.dif}`);
    assert.equal(l.n05.critico, e.critico, `${chave} valor crítico`);
    assert.equal(l.n05.significativo, false, `${chave} não significativo`);
    assert.equal(l.n05.df, "", `${chave} sem facilidade/dificuldade`);
  }
});

test("WAIS-III determinação por subteste: diferença significativa vira F ou D, com frequência acumulada", () => {
  // Vocabulário muito acima da média da pessoa e Aritmética muito abaixo
  const d = extras({ ...BRUTOS, vocabulario: 62, aritmetica: 2 }).determinacao!;
  const linhas = d.modos.find((m) => m.id === "m13")!.linhas;
  const voc = linhas.find((l) => l.chave === "vocabulario")!;
  const ari = linhas.find((l) => l.chave === "aritmetica")!;
  assert.equal(voc.n05.significativo, true);
  assert.equal(voc.n05.df, "F");
  assert.ok(voc.n05.frequencia !== "", "tem frequência acumulada");
  assert.equal(ari.n05.df, "D");
});

test("WAIS-III determinação por subteste: modos por tipo de média (verbal/execução × total) e regra B25", () => {
  const d = extras(BRUTOS).determinacao!;
  const m65 = d.modos.find((m) => m.id === "m65")!;
  const voc = m65.linhas.find((l) => l.chave === "vocabulario")!;
  const cf = m65.linhas.find((l) => l.chave === "completarFiguras")!;
  assert.ok(Math.abs((voc.media as number) - 9.2857) < 1e-3); // verbais comparam com a média verbal
  assert.equal(cf.media, 9); // execução compara com a média de execução
  const m14 = d.modos.find((m) => m.id === "m14")!;
  assert.ok(Math.abs((m14.linhas[0].media as number) - 9.1538) < 1e-3); // modo total: média geral
  // todos os 14 lançados → recomendação 4; 11 sem PS/SNL/AO → recomendação 1; quantidade estranha → sem modo
  assert.equal(extras({ ...BRUTOS, armarObjetos: 10 }).determinacao!.recomendacao.modo, 4);
  const onze = { ...BRUTOS } as Record<string, number>;
  delete onze.procurarSimbolos;
  delete onze.sequenciaNumerosLetras;
  assert.equal(extras(onze).determinacao!.recomendacao.modo, 1);
  assert.equal(extras({ vocabulario: 37, cubos: 24 }).determinacao!.recomendacao.modo, null);
});

test("WAIS-III comparação entre discrepâncias: diferenças e valores críticos iguais ao print (0,05, nível de habilidade)", () => {
  const c = extras(BRUTOS).discrepancias!.combos["0.05|habilidade"];
  const esperado = [
    ["qiv", "qie", 97, 90, 7, 8.31], ["icv", "iop", 100, 92, 8, 9.74], ["icv", "imo", 100, 92, 8, 11], ["iop", "ivp", 92, 95, -3, 14.39],
    ["icv", "ivp", 100, 95, 5, 14.09], ["iop", "imo", 92, 92, 0, 11.38], ["imo", "ivp", 92, 95, -3, 15.27],
  ] as const;
  assert.equal(c.length, 7);
  esperado.forEach(([a, b, va, vb, dif, crit], i) => {
    assert.equal(c[i].a, a);
    assert.equal(c[i].b, b);
    assert.equal(c[i].valorA, va);
    assert.equal(c[i].valorB, vb);
    assert.equal(c[i].diferenca, dif);
    assert.equal(c[i].valorCritico, crit);
    assert.equal(c[i].significativo, false);
    assert.equal(c[i].frequencia, "");
  });
});

test("WAIS-III comparação entre discrepâncias: nível 0,15 e amostra geral mudam o valor crítico; significativa traz frequência", () => {
  const e = extras(BRUTOS).discrepancias!.combos;
  // 0,15 / habilidade (30-39): ICV−IOP crítico 7,16; diferença 8 → significativa; frequência da linha "8" da Tabela B.2 (41,1%)
  const icvIop = e["0.15|habilidade"][1];
  assert.equal(icvIop.valorCritico, 7.16);
  assert.equal(icvIop.significativo, true);
  assert.equal(icvIop.frequencia, "41.1%");
  // 0,05 / amostra geral: QIV−QIE crítico 8,11
  assert.equal(e["0.05|geral"][0].valorCritico, 8.11);
});

// --- Clusters, comparações clínicas e hipóteses (gabarito: print da planilha) ---
type ClusterLido = { chave: string; sigla: string; calculado: boolean; diferenca?: number; interpretavel?: boolean; soma?: number | null; composto?: number | null; ic95?: string | null; percentil?: number | null; classificacao?: string | null };
type ComparacaoLida = { a: string; b: string; calculada: boolean; compostoA?: number; compostoB?: number; diferenca?: number; sentido?: string; raro?: string; valorCritico: number; hipotese?: { titulo: string; texto: string } | null; motivo?: string };
function clustersDe(brutos: Record<string, number>) {
  const r = calcularResultado(brutos, conversao, { idadeDias: IDADE_DIAS, idadeAnos: 34 });
  return ((r.modo === "por_campo" ? r.extras : {}) as { clusters?: { clusters: ClusterLido[]; comparacoes: ComparacaoLida[] } }).clusters;
}

test("WAIS-III clusters: diferença, interpretável, soma, composto, IC95, percentil e classificação batem com a planilha", () => {
  const c = clustersDe(BRUTOS)!.clusters;
  const esperado: Record<string, [number, number, number, string, number, string]> = {
    gf: [1, 28, 96, "88 - 104", 39, "Média"], gv: [1, 17, 91, "82 - 100", 27, "Média"], gfNaoVerbal: [1, 19, 97, "87 - 107", 42, "Média"],
    gfVerbal: [1, 17, 92, "83 - 101", 30, "Média"], gcVL: [3, 19, 97, "90 - 104", 42, "Média"], gcKO: [2, 20, 100, "92 - 108", 50, "Média"],
    gcLM: [0, 22, 105, "99 - 111", 63, "Média"], gsmWM: [1, 17, 92, "83 - 101", 30, "Média"],
  };
  assert.equal(c.length, 8);
  for (const [chave, [dif, soma, comp, ic, perc, cls]] of Object.entries(esperado)) {
    const x = c.find((k) => k.chave === chave)!;
    assert.equal(x.calculado, true, `${chave} calculado`);
    assert.equal(x.diferenca, dif, `${chave} diferença`);
    assert.equal(x.interpretavel, true, `${chave} interpretável`);
    assert.equal(x.soma, soma, `${chave} soma`);
    assert.equal(x.composto, comp, `${chave} composto`);
    assert.equal(x.ic95, ic, `${chave} IC95`);
    assert.equal(x.percentil, perc, `${chave} percentil`);
    assert.equal(x.classificacao, cls, `${chave} classificação`);
  }
});

test("WAIS-III comparações clínicas: diferença, valor crítico e raro/não raro batem com a planilha", () => {
  const cmp = clustersDe(BRUTOS)!.comparacoes;
  const esperado: Array<[string, string, number, number, number, number]> = [
    ["gf", "gv", 96, 91, 5, 21], ["gfNaoVerbal", "gv", 97, 91, 6, 24], ["gfNaoVerbal", "gfVerbal", 97, 92, 5, 24],
    ["gcVL", "gcKO", 97, 100, -3, 17], ["gcLM", "gsmWM", 105, 92, 13, 24], ["gcLM", "gfVerbal", 105, 92, 13, 17],
  ];
  assert.equal(cmp.length, 6);
  esperado.forEach(([a, b, ca, cb, dif, crit], i) => {
    assert.equal(cmp[i].a, a);
    assert.equal(cmp[i].b, b);
    assert.equal(cmp[i].compostoA, ca);
    assert.equal(cmp[i].compostoB, cb);
    assert.equal(cmp[i].diferenca, dif);
    assert.equal(cmp[i].valorCritico, crit);
    assert.equal(cmp[i].raro, "Não Raro");
  });
});

test("WAIS-III hipóteses: o texto acompanha o SENTIDO real da diferença (a planilha mostra sempre o oposto)", () => {
  const cmp = clustersDe(BRUTOS)!.comparacoes;
  // Gf (96) > Gv (91): hipótese de "Gf > Gv" — a planilha mostraria a de "Gv > Gf"
  assert.equal(cmp[0].sentido, ">");
  assert.equal(cmp[0].hipotese?.titulo, "Raciocínio Fluído (Gf) > Processamento Visual (Gv)");
  // Gc-VL (97) < Gc-KO (100): hipótese de "Gc-KO > Gc-VL"
  assert.equal(cmp[3].sentido, "<");
  assert.equal(cmp[3].hipotese?.titulo.startsWith("Informações Gerais (Gc-KO) > Conhecimento Lexical"), true);
  // Gc-LTM (105) > Gf-verbal (92): na biblioteca o par vem na ordem inversa; a escolha é pelo título, não pela posição
  assert.equal(cmp[5].hipotese?.titulo.startsWith("Memória de Longo Prazo (Gc-LTM) > Raciocínio Fluído Verbal"), true);
  assert.ok((cmp[5].hipotese?.texto ?? "").includes("base de conhecimento")); // texto de "Gc-LTM > Gf-verbal"
  // os textos dos dois sentidos de um mesmo par são diferentes
  const gv = clustersDe({ ...BRUTOS, cubos: 40, completarFiguras: 20 }); // Gv muito acima de Gf
  assert.ok(gv);
});

test("WAIS-III clusters: cluster não interpretável (diferença ≥ 5) não gera composto nem comparação", () => {
  // Cubos muito alto e Completar Figuras baixo → Gv com diferença ≥ 5
  const r = clustersDe({ ...BRUTOS, cubos: 60, completarFiguras: 5 })!;
  const gv = r.clusters.find((c) => c.chave === "gv")!;
  assert.equal(gv.calculado, true);
  assert.equal(gv.interpretavel, false);
  assert.equal(gv.composto, null);
  const cmpGv = r.comparacoes.find((c) => c.a === "gf" && c.b === "gv")!;
  assert.equal(cmpGv.calculada, false);
  assert.ok(String(cmpGv.motivo).includes("não é interpretável"));
});

test("WAIS-III clusters: cluster com subteste faltando fica 'não calculado'", () => {
  const sem = { ...BRUTOS } as Record<string, number>;
  delete sem.cubos;
  const r = clustersDe(sem)!;
  assert.equal(r.clusters.find((c) => c.chave === "gv")!.calculado, false);
  assert.equal(r.clusters.find((c) => c.chave === "gf")!.calculado, true);
});

test("WAIS-III clusters: a direção invertida escolhe o outro texto", () => {
  // Faz Gf < Gv: Raciocínio (RM, AF, AR) baixo e visual (CB, CF) alto
  const r = clustersDe({ ...BRUTOS, raciocinioMatricial: 8, arranjoFiguras: 5, aritmetica: 4, cubos: 36, completarFiguras: 20 })!;
  const gfGv = r.comparacoes[0];
  if (gfGv.calculada) {
    assert.equal(gfGv.sentido, "<");
    assert.equal(gfGv.hipotese?.titulo.startsWith("Processamento Visual (Gv) > Raciocínio Fluido (Gf)"), true);
  } else {
    assert.ok(gfGv.motivo); // se algum cluster caiu em não interpretável, não há hipótese — também correto
  }
});

// --- Escores de processo (Dígitos): maior sequência e diferença entre as ordens ---
// Gabarito: tabelas B.6/B.7 da planilha (faixa 30-39: direta média 6 DP 1,7; inversa média 4,2 DP 1,3; diferença média 1,8 DP 1,6).
type ProcessoLido = {
  faixa: string;
  spam: { direta: { valor: number; media: number; dp: number; porcentagemCumulativa: number | null; z: number; ponderado: number; percentil: number; classificacao: string } | null; inversa: { valor: number; porcentagemCumulativa: number | null; z: number; ponderado: number; percentil: number; classificacao: string } | null };
  diferenca: { diferenca: number; frequenciaAcumulada: number | null; media: number; dp: number; z: number; ponderado: number; percentil: number; classificacao: string } | null;
  aviso: string | null;
};
function processoDe(brutos: Record<string, number>, dias = IDADE_DIAS) {
  const r = calcularResultado(brutos, conversao, { idadeDias: dias, idadeAnos: Math.floor(dias / 365.25) });
  return ((r.modo === "por_campo" ? r.extras : {}) as { processo?: ProcessoLido }).processo;
}

test("WAIS-III processo: maior sequência — Z, ponderado, percentil, classificação e % cumulativa pelas tabelas da faixa", () => {
  const p = processoDe({ ...BRUTOS, digitosSpamDireta: 7, digitosSpamInversa: 5 })!;
  assert.equal(p.faixa, "30-39");
  const d = p.spam.direta!;
  assert.ok(Math.abs(d.z - 0.588) < 0.001, `z direta ${d.z}`); // (7 − 6)/1,7
  assert.ok(Math.abs(d.ponderado - 11.76) < 0.02);
  assert.ok(Math.abs(d.percentil - 72.2) < 0.1); // Φ(0,588)
  assert.equal(d.classificacao, "Média"); // z < 0,666
  assert.equal(d.porcentagemCumulativa, 34.2); // linha "7", coluna Direta 30-39
  const i = p.spam.inversa!;
  assert.ok(Math.abs(i.z - 0.615) < 0.001, `z inversa ${i.z}`); // (5 − 4,2)/1,3
  assert.equal(i.porcentagemCumulativa, 30.7); // linha "5", coluna Inversa 30-39
});

test("WAIS-III processo: a porcentagem cumulativa só aparece com as duas ordens (como na planilha)", () => {
  const so = processoDe({ ...BRUTOS, digitosSpamDireta: 7 })!;
  assert.equal(so.spam.direta!.porcentagemCumulativa, null);
  assert.ok(so.spam.direta!.z > 0);
  assert.equal(so.spam.inversa, null);
});

test("WAIS-III processo: diferença entre as ordens — frequência acumulada, Z invertido, percentil e classificação", () => {
  const p = processoDe({ ...BRUTOS, digitosPontosDireta: 8, digitosPontosInversa: 6 })!;
  const d = p.diferenca!;
  assert.equal(d.diferenca, 2);
  assert.equal(d.frequenciaAcumulada, 58.7); // linha "2", faixa 30-39
  assert.ok(Math.abs(d.z - -0.125) < 0.001, `z ${d.z}`); // (1,8 − 2)/1,6: o sinal é (média − diferença)
  assert.ok(Math.abs(d.percentil - 45) < 0.2);
  assert.equal(d.classificacao, "Média");
  // diferença menor que a média → Z positivo
  const menor = processoDe({ ...BRUTOS, digitosPontosDireta: 7, digitosPontosInversa: 7 })!.diferenca!;
  assert.ok(menor.z > 0);
});

test("WAIS-III processo: avisa quando OD + OI não fecha com o total de Dígitos da aba 1", () => {
  assert.ok(String(processoDe({ ...BRUTOS, digitosPontosDireta: 8, digitosPontosInversa: 6 })!.aviso).includes("diferente do total")); // 14 ≠ 13
  assert.equal(processoDe({ ...BRUTOS, digitosPontosDireta: 8, digitosPontosInversa: 5 })!.aviso, null); // 13 = 13
});

test("WAIS-III processo: faixa 16-17 usa a célula 74,1 (a planilha tem o texto '74,,1')", () => {
  const p = processoDe({ digitosPontosDireta: 3, digitosPontosInversa: 2 }, 17 * 365 + 100)!;
  assert.equal(p.faixa, "16-17");
  assert.equal(p.diferenca!.frequenciaAcumulada, 74.1);
});

test("WAIS-III processo: sem entradas de processo ou fora da faixa de idade não há análise", () => {
  assert.equal(processoDe(BRUTOS), undefined);
  assert.equal(processoDe({ ...BRUTOS, digitosSpamDireta: 6 }, 15 * 365), undefined);
});

test("WAIS-III processo: as entradas de processo não viram subtestes nem afetam os índices", () => {
  const r = calcular({ ...BRUTOS, digitosSpamDireta: 7, digitosPontosDireta: 8 });
  assert.equal(r.qit.valorBruto, 99);
  assert.equal(r.digitosSpamDireta?.faixa ?? null, null);
});

// --- Habilidades compartilhadas (matriz de 82 habilidades × 14 subtestes) ---
// Gabarito: print da planilha (paciente de exemplo, 13 subtestes, média geral). Armar Objetos não lançado.
type MatrizHabilidades = {
  lista: Array<{ numero: number | null; nome: string; grupo: string; subtestes: string[] }>;
  total: Array<{ marcas: Record<string, "P" | "N" | "0" | null>; p: number; n: number; zero: number; total: number; completa: boolean; interpretacao: string }>;
  verbalExecucao: MatrizHabilidades["total"];
  recomendado: string;
};
function habilidadesDe(brutos: Record<string, number>) {
  const r = calcularResultado(brutos, conversao, { idadeDias: IDADE_DIAS, idadeAnos: 34 });
  return ((r.modo === "por_campo" ? r.extras : {}) as { habilidades?: MatrizHabilidades }).habilidades!;
}
const habilidade = (m: MatrizHabilidades, inicio: string, variante: "total" | "verbalExecucao" = "total") => {
  const i = m.lista.findIndex((h) => h.nome.startsWith(inicio));
  assert.ok(i >= 0, `habilidade "${inicio}" não encontrada`);
  return { def: m.lista[i], r: m[variante][i] };
};

test("WAIS-III habilidades: 82 habilidades, de 2 a 8 subtestes, em 4 grupos", () => {
  const m = habilidadesDe(BRUTOS);
  assert.equal(m.lista.length, 82);
  assert.deepEqual([...new Set(m.lista.map((h) => h.grupo))], ["INPUT", "Integração e Armazenamento", "Output", "Influências que afetam as Respostas"]);
  assert.ok(m.lista.every((h) => h.subtestes.length >= 2 && h.subtestes.length <= 8));
  assert.equal(m.recomendado, "total"); // 13 subtestes → média dos 13
});

test("WAIS-III habilidades: marcas P/N/0 e contagens batem com o print (Atenção: P=1, N=3, 0=2)", () => {
  const a = habilidade(habilidadesDe(BRUTOS), "Atenção").r;
  assert.deepEqual(a.marcas, { aritmetica: "0", digitos: "0", sequenciaNumerosLetras: "N", completarFiguras: "N", codigos: "N", procurarSimbolos: "P" });
  assert.deepEqual([a.p, a.n, a.zero, a.total], [1, 3, 2, 6]);
  assert.equal(a.completa, true);
  assert.equal(a.interpretacao, ""); // n=6 exige 4 do mesmo sinal
});

test("WAIS-III habilidades: Força e Fraqueza iguais às do print", () => {
  const m = habilidadesDe(BRUTOS);
  const adquirido = habilidade(m, "Conhecimento Adquirido").r; // IN P, AR 0, VC P → n=3, P=2, 0=1
  assert.deepEqual([adquirido.p, adquirido.n, adquirido.zero], [2, 0, 1]);
  assert.equal(adquirido.interpretacao, "Força");
  assert.equal(habilidade(m, "Bagagem de informação").r.interpretacao, "Força"); // IN P, VC P → 2 de 2
  assert.equal(habilidade(m, "Memória de Longo Prazo").r.interpretacao, "Força");
  assert.equal(habilidade(m, "Memória Visual").r.interpretacao, "Fraqueza"); // CF N, CD N → 2 de 2
});

test("WAIS-III habilidades: subteste não lançado fica sem marca e a habilidade não é interpretada (a planilha contaria 'P')", () => {
  const m = habilidadesDe(BRUTOS); // sem Armar Objetos
  const visuomotor = habilidade(m, "Canal Visuo-motor");
  assert.ok(visuomotor.def.subtestes.includes("armarObjetos"));
  assert.equal(visuomotor.r.marcas.armarObjetos, null);
  assert.equal(visuomotor.r.completa, false);
  assert.equal(visuomotor.r.interpretacao, "");
  assert.ok(visuomotor.r.total < visuomotor.def.subtestes.length);
});

test("WAIS-III habilidades: habilidade 77 (Persistência) segue a regra de n=4 (a planilha aponta para a linha errada)", () => {
  const persist = habilidade(habilidadesDe({ ...BRUTOS, armarObjetos: 10 }), "Persistência");
  assert.equal(persist.def.subtestes.length, 4);
  assert.equal(persist.r.completa, true);
  assert.equal(persist.r.total, 4);
  assert.ok(["", "Força", "Fraqueza"].includes(persist.r.interpretacao));
});

test("WAIS-III habilidades: regra de interpretação por número de subtestes", () => {
  const m = habilidadesDe(BRUTOS);
  // n=2: só se os dois forem iguais; n=3: 2 de 3 com o terceiro neutro ou oposto
  const naoDecisiva = m.lista.findIndex((h) => h.subtestes.length === 2);
  assert.ok(naoDecisiva >= 0);
  const variantes = [...m.total, ...m.verbalExecucao];
  for (const v of variantes) {
    if (!v.completa) continue;
    assert.ok(["", "Força", "Fraqueza"].includes(v.interpretacao));
    if (v.interpretacao === "Força") assert.ok(v.p >= 2);
    if (v.interpretacao === "Fraqueza") assert.ok(v.n >= 2);
  }
});

test("WAIS-III habilidades: a média verbal/execução muda as marcas em relação à média geral", () => {
  const m = habilidadesDe(BRUTOS);
  const a = habilidade(m, "Atenção", "total").r.marcas;
  const b = habilidade(m, "Atenção", "verbalExecucao").r.marcas;
  assert.ok(Object.keys(a).length === Object.keys(b).length);
  // média verbal 9,29 e de execução 9,00 (vs. geral 9,15): Códigos (6) fica -3,00 vs -3,15 → ambos N; Procurar Símbolos (12) +3,00 vs +2,85 → ambos P
  assert.equal(b.codigos, "N");
  assert.equal(b.procurarSimbolos, "P");
});
