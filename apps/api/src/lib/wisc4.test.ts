import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { calcularResultado, type ConversaoNormativa } from "./motorCalculo";
import { degrau } from "./wais3";
import { classificarCompostoWisc, classificarPonderadoWisc, decomporIdade, idadeWisc4EmDias, type Wisc4Planilha } from "./wisc4";

const DOCS = join(__dirname, "..", "..", "..", "..", "docs", "testes");
const dados = { tipo: "wisc4_planilha", ...JSON.parse(readFileSync(join(DOCS, "WISC-IV-planilha.json"), "utf8")) } as Wisc4Planilha;
const conversao = dados as unknown as ConversaoNormativa;
const A1 = JSON.parse(readFileSync(join(DOCS, "WISC-IV-tabelas-A1.json"), "utf8")) as { faixas: Record<string, Record<string, Record<string, string>>> };

const NASC = new Date("2018-03-10T00:00:00Z");
const REF = new Date("2026-07-28T12:00:00Z"); // 8a 4m 18d

function calcular(brutos: Record<string, number>, nasc = NASC, ref = REF) {
  const r = calcularResultado(brutos, conversao, { dataNascimento: nasc, dataReferencia: ref });
  assert.equal(r.modo, "por_campo");
  return r.modo === "por_campo" ? r.porCampo : {};
}

// ponderado esperado lido direto da tabela da faixa (caminho independente do módulo)
function ponderadoDe(rotulo: string, chave: string, bruto: number): number | null {
  return degrau(dados.a1[rotulo][chave], bruto)?.ponderado ?? null;
}

const BRUTOS = { sm: 14, vc: 22, co: 14, cb: 30, cn: 14, rm: 15, dg: 12, snl: 14, cd: 38, ps: 26 };
function ponderados(brutos: Record<string, number>) {
  return Object.fromEntries(Object.entries(brutos).map(([k, v]) => [k, ponderadoDe("8:4-8:7", k, v) as number]));
}
const DISCREPANTE = { ...BRUTOS, sm: 33, vc: 45, co: 28, cb: 8, cn: 3, rm: 4 }; // ICV muito alto, IOP baixo

test("WISC-IV idade: a planilha usa anos×365 + meses×30 + dias (mês de 30 dias)", () => {
  assert.deepEqual(decomporIdade(NASC, REF), { anos: 8, meses: 4, dias: 18 });
  assert.equal(idadeWisc4EmDias(NASC, REF), 8 * 365 + 4 * 30 + 18);
  assert.equal(idadeWisc4EmDias(new Date("2020-01-10T00:00:00Z"), new Date("2026-05-10T00:00:00Z")), 6 * 365 + 4 * 30);
});

test("WISC-IV classificação: subtestes pelo ponderado; índices pelo composto", () => {
  assert.equal(classificarPonderadoWisc(16), "Muito Superior");
  assert.equal(classificarPonderadoWisc(14), "Superior");
  assert.equal(classificarPonderadoWisc(12), "Média Superior");
  assert.equal(classificarPonderadoWisc(8), "Média");
  assert.equal(classificarPonderadoWisc(6), "Média Inferior");
  assert.equal(classificarPonderadoWisc(4), "Limítrofe");
  assert.equal(classificarPonderadoWisc(3), "Deficitário");
  assert.equal(classificarCompostoWisc(130), "Muito Superior");
  assert.equal(classificarCompostoWisc(120), "Superior");
  assert.equal(classificarCompostoWisc(110), "Média Superior");
  assert.equal(classificarCompostoWisc(90), "Média");
  assert.equal(classificarCompostoWisc(89), "Média Inferior");
  assert.equal(classificarCompostoWisc(70), "Limítrofe");
  assert.equal(classificarCompostoWisc(69), "Deficitário");
});

test("WISC-IV conversão: as tabelas da planilha conferem com a A.1 do manual transcrita, exceto as 16 divergências conhecidas", () => {
  const conhecidas = [
    "12:8-12:11 in 28", "13:0-13:3 snl 8", "13:0-13:3 rm 10", "13:0-13:3 co 11", "13:0-13:3 ps 8", "13:0-13:3 cf 14", "13:0-13:3 ca 43",
    "13:0-13:3 in 12", "13:0-13:3 ar 15", "13:0-13:3 rp 8", "14:4-14:7 ar 32", "15:0-15:3 sm 38",
    // Cubos 8:0: coluna FB desordenada na planilha; o Excel (busca binária) devolve 10, a A.1 diz 11/12
    "8:0-8:3 cb 21", "8:0-8:3 cb 22", "8:0-8:3 cb 23", "8:0-8:3 cb 24",
  ];
  const achadas = new Set<string>();
  let comparacoes = 0;
  for (const [rotulo, subs] of Object.entries(A1.faixas)) {
    assert.ok(dados.a1[rotulo], `faixa ${rotulo} ausente nos dados da planilha`);
    for (const [sigla, coluna] of Object.entries(subs)) {
      if (sigla.startsWith("_")) continue;
      const chave = sigla.toLowerCase();
      const lista = Object.entries(coluna)
        .filter(([k]) => !k.startsWith("_"))
        .map(([pond, txt]) => {
          const t = String(txt).trim();
          if (t === "" || t === "-") return null;
          const [a, b] = t.split("-");
          return { pond: Number(pond), min: Number(a), max: b === undefined ? Number(a) : Number(b) };
        })
        .filter((x): x is { pond: number; min: number; max: number } => x !== null);
      const maxBruto = Math.max(...lista.map((x) => x.max));
      for (let b = 0; b <= maxBruto; b++) {
        comparacoes++;
        const manual = lista.find((x) => b >= x.min && b <= x.max)?.pond ?? null;
        if (manual !== ponderadoDe(rotulo, chave, b)) achadas.add(`${rotulo} ${chave} ${b}`);
      }
    }
  }
  assert.equal(comparacoes, 26184);
  assert.deepEqual([...achadas].sort(), [...conhecidas].sort());
});

test("WISC-IV ponderado por subteste: Z, ponto composto, percentil e classificação (Z=(p−10)/3; composto=Z×15+100)", () => {
  const r = calcular({ cb: 30, sm: 14 });
  const cb = r.cb.faixa!;
  const p = ponderadoDe("8:4-8:7", "cb", 30) as number;
  assert.equal(cb.ponderado, p);
  assert.equal(cb.z, Math.round(((p - 10) / 3) * 1000) / 1000);
  assert.equal(cb.pontoComposto, Math.round((((p - 10) / 3) * 15 + 100) * 100) / 100);
  assert.equal(cb.classificacao, classificarPonderadoWisc(p));
  assert.ok((cb.percentil as number) > 0 && (cb.percentil as number) < 100);
});

test("WISC-IV índices: soma dos ponderados → composto/percentil/IC pela tabela do índice; QIT, GAI e CPI", () => {
  const r = calcular(BRUTOS);
  const p = ponderados(BRUTOS);
  const somas = { icv: p.sm + p.vc + p.co, iop: p.cb + p.cn + p.rm, imo: p.dg + p.snl, ivp: p.cd + p.ps };
  for (const [k, soma] of Object.entries(somas)) {
    assert.equal(r[k].valorBruto, soma, `${k} soma`);
    const linha = degrau(dados.somaParaComposto[k], soma)!;
    assert.equal(r[k].faixa?.composto, Number(linha.composto), `${k} composto`);
    assert.equal(r[k].faixa?.ic95, linha.ic95);
    assert.equal(r[k].faixa?.ic90, linha.ic90);
    assert.equal(r[k].faixa?.classificacao, classificarCompostoWisc(Number(linha.composto)));
  }
  const soma10 = Object.values(somas).reduce((a, v) => a + v, 0);
  assert.equal(r.qit.valorBruto, soma10);
  assert.equal(r.qit.faixa?.composto, Number(degrau(dados.somaParaComposto.qit, soma10)!.composto));
  assert.equal(r.gai.valorBruto, somas.icv + somas.iop);
  assert.equal(r.gai.faixa?.composto, Number(degrau(dados.somaParaComposto.gai, somas.icv + somas.iop)!.composto));
  assert.equal(r.cpi.valorBruto, somas.imo + somas.ivp);
  assert.equal(r.cpi.faixa?.composto, Number(degrau(dados.somaParaComposto.cpi, somas.imo + somas.ivp)!.composto));
});

test("WISC-IV índices: sem todos os subtestes principais o índice fica 'não calculado'", () => {
  const sem = { ...BRUTOS } as Record<string, number>;
  delete sem.vc;
  const r = calcular(sem);
  assert.equal(r.icv.valorBruto, null);
  assert.equal(r.qit.valorBruto, null);
  assert.equal(r.gai.valorBruto, null);
  assert.ok(r.iop.valorBruto !== null);
  assert.ok(r.cpi.valorBruto !== null);
});

test("WISC-IV substituição (planilha): Completar Figuras/Cancelamento/Aritmética entram no lugar de UM principal que falte", () => {
  const base = ponderados(BRUTOS);
  const sem = { ...BRUTOS, cf: 18 } as Record<string, number>;
  delete sem.cn;
  assert.equal(calcular(sem).iop.valorBruto, base.cb + base.rm + (ponderadoDe("8:4-8:7", "cf", 18) as number));

  const sem2 = { ...BRUTOS, ca: 40 } as Record<string, number>;
  delete sem2.ps;
  assert.equal(calcular(sem2).ivp.valorBruto, base.cd + (ponderadoDe("8:4-8:7", "ca", 40) as number));

  const sem3 = { ...BRUTOS, ar: 15 } as Record<string, number>;
  delete sem3.snl;
  assert.equal(calcular(sem3).imo.valorBruto, base.dg + (ponderadoDe("8:4-8:7", "ar", 15) as number));

  // suplementar lançado mas nada falta: NÃO entra na soma
  assert.equal(calcular({ ...BRUTOS, cf: 18 }).iop.valorBruto, base.cb + base.cn + base.rm);
  // dois principais faltando: um suplementar só cobre um → não calcula
  const dois = { ...BRUTOS, cf: 18 } as Record<string, number>;
  delete dois.cn;
  delete dois.rm;
  assert.equal(calcular(dois).iop.valorBruto, null);
  // Informação e Raciocínio com Palavras não substituem nada na planilha
  const semVc = { ...BRUTOS, in: 20, rp: 20 } as Record<string, number>;
  delete semVc.vc;
  assert.equal(calcular(semVc).icv.valorBruto, null);
});

test("WISC-IV análise avançada: interpretável, D/F normativa, média, diferença e valor crítico pela idade", () => {
  const r = calcular(BRUTOS);
  const compostos = ["icv", "iop", "imo", "ivp"].map((k) => r[k].faixa!.composto as number);
  const media = compostos.reduce((a, c) => a + c, 0) / 4;
  const critico = dados.valoresCriticos.find((v) => v.anos === 8)!;
  for (const k of ["icv", "iop", "imo", "ivp"] as const) {
    const f = r[k].faixa!;
    const c = f.composto as number;
    assert.equal(f.dfNormativa, c < 85 ? "Dificuldade Normativa" : c < 115 ? "Média" : "Facilidade Normativa");
    if (f.interpretavel === "SIM") {
      assert.equal(f.mediaIndices, Math.round(media * 100) / 100);
      assert.equal(f.diferencaMedia, Math.round((c - media) * 100) / 100);
      assert.equal(f.valorCritico, critico[k]);
    } else {
      assert.equal(f.mediaIndices, undefined);
      assert.ok(String(f.observacao).includes("Não interpretável"));
    }
  }
});

test("WISC-IV análise avançada: valor crítico muda com a idade (8 anos vs 14 anos)", () => {
  const aos8 = calcular(BRUTOS);
  const aos14 = calcular(BRUTOS, new Date("2012-03-10T00:00:00Z"), new Date("2026-07-28T12:00:00Z"));
  const vc8 = aos8.icv.faixa?.valorCritico;
  const vc14 = aos14.icv.faixa?.valorCritico;
  if (vc8 !== undefined) assert.equal(vc8, 7.3);
  if (vc14 !== undefined) assert.equal(vc14, 6.2);
  assert.ok(vc8 !== undefined || vc14 !== undefined);
});

test("WISC-IV análise avançada: avisos de QI Total, GAI e CPI quando os índices divergem 23 pontos ou mais", () => {
  const r = calcular(DISCREPANTE);
  const icv = r.icv.faixa?.composto as number;
  const iop = r.iop.faixa?.composto as number;
  assert.ok(icv - iop >= 23, `esperava discrepância ≥ 23 (ICV ${icv}, IOP ${iop})`);
  assert.equal(r.gai.faixa?.interpretavel, "NÃO");
  assert.ok(String(r.gai.faixa?.aviso).includes("GAI"));
  assert.equal(r.qit.faixa?.interpretavel, "NÃO");
  assert.ok(String(r.qit.faixa?.aviso).startsWith("Atenção! Talvez o 'Q.I.'"));
});

test("WISC-IV análise avançada: Recurso/Preocupação funciona no WISC-IV (rótulos coincidem na planilha)", () => {
  const f = calcular(DISCREPANTE).icv.faixa!;
  if (f.interpretavel === "SIM" && f.raro === "Raro" && f.dfIndividual === "Facilidade Individual" && f.dfNormativa === "Facilidade Normativa") {
    assert.equal(f.recursoPreocupacao, "Recurso");
  } else {
    assert.equal(f.recursoPreocupacao, undefined);
  }
});

test("WISC-IV faixa etária: menor de 6 anos não tem norma", () => {
  const r = calcular(BRUTOS, new Date("2022-03-10T00:00:00Z"), REF);
  assert.equal(r.cb.faixa, null);
  assert.equal(r.qit.valorBruto, null);
});

test("WISC-IV discrepâncias: 6 pares de índices e pares de subtestes, com valor crítico e significância coerentes", () => {
  const r = calcularResultado(BRUTOS, conversao, { dataNascimento: NASC, dataReferencia: REF });
  assert.equal(r.modo, "por_campo");
  const extras = (r.modo === "por_campo" ? r.extras : {}) as Record<string, any[]>;
  assert.equal(extras.discrepanciasIndices.length, 6);
  for (const d of extras.discrepanciasIndices) {
    assert.equal(d.diferenca, d.pontosA - d.pontosB);
    assert.equal(d.significativa, Math.abs(d.diferenca) >= d.valorCritico ? "Sim" : "Não");
    if (d.significativa === "Não") assert.equal(d.frequencia, "");
  }
  // sem CF/CA/AR/RP lançados, só os pares entre subtestes presentes aparecem
  const pares = extras.discrepanciasSubtestes.map((d) => d.par);
  assert.ok(pares.includes("DG - SNL") && pares.includes("CD - PS") && pares.includes("CO - IN") === false);
  assert.ok(!pares.includes("CB - CF"));
});

test("WISC-IV facilidades/dificuldades e escores de processo", () => {
  const r = calcularResultado({ ...BRUTOS, cusb: 40, diod: 9, dioi: 7, udiod: 6, udioi: 4 }, conversao, { dataNascimento: NASC, dataReferencia: REF });
  assert.equal(r.modo, "por_campo");
  if (r.modo !== "por_campo") return;
  const extras = r.extras as Record<string, any>;
  assert.equal(extras.facilidades.length, 10);
  const total = Object.values(ponderados(BRUTOS)).reduce((a, v) => a + v, 0);
  for (const f of extras.facilidades) {
    assert.ok(f.significativa === "Sim" || f.significativa === "Não");
    if (f.facilidadeDificuldade === "") assert.equal(f.frequencia, "");
    if (f.media === total / 10) assert.equal(f.diferenca, f.ponderado - total / 10);
  }
  for (const k of ["cusb", "diod", "dioi"]) assert.ok(typeof (r.porCampo[k].faixa as any).ponderado === "number", k);
  for (const k of ["udiod", "udioi"]) assert.ok(typeof (r.porCampo[k].faixa as any).z === "number", k);
  assert.equal(extras.diferencaUdio.diferenca, 2);
  assert.ok(extras.comparacoesProcesso.some((c: any) => c.par.startsWith("Cubos")));
});

test("WISC-IV clusters: composto pela tabela, interpretabilidade (<5) e comparações clínicas com o sentido real", () => {
  const r = calcularResultado({ ...BRUTOS, cf: 20, ar: 20, rp: 15, in: 12 }, conversao, { dataNascimento: NASC, dataReferencia: REF });
  assert.equal(r.modo, "por_campo");
  if (r.modo !== "por_campo") return;
  const e = r.extras as Record<string, any>;
  assert.equal(e.clusters.length, 8);
  const gv = e.clusters.find((c: any) => c.chave === "gv");
  assert.equal(gv.calculado, true);
  assert.equal(gv.interpretavel, gv.diferenca < 5);
  for (const c of e.comparacoesClinicas.filter((x: any) => x.calculada)) {
    assert.equal(c.raro, Math.abs(c.diferenca) >= c.valorCritico ? "Raro" : "Não Raro");
    if (c.diferenca !== 0) assert.ok(c.hipotese && c.sugestao);
  }
  assert.ok(e.gaiCpi && typeof e.gaiCpi.diferenca === "number");
});

test("WISC-IV habilidades compartilhadas: marcas por média do índice e interpretação só com todos os subtestes", () => {
  const r = calcularResultado({ ...BRUTOS, cf: 20, ar: 20, rp: 15, in: 12, ca: 40 }, conversao, { dataNascimento: NASC, dataReferencia: REF });
  assert.equal(r.modo, "por_campo");
  if (r.modo !== "por_campo") return;
  const h = (r.extras as Record<string, any>).habilidades;
  assert.equal(h.itens.length, 82);
  for (const it of h.itens) {
    assert.equal(it.p + it.n + it.zero, it.total);
    if (!it.completa) assert.equal(it.interpretacao, "");
    if (it.completa && it.p === it.subtestes.length) assert.equal(it.interpretacao, "Força");
    if (it.completa && it.n === it.subtestes.length) assert.equal(it.interpretacao, "Fraqueza");
  }
  // as 4 habilidades com a coluna RM defeituosa na planilha incluem o RM
  for (const n of [65, 69, 76, 82]) assert.ok(h.itens.find((x: any) => x.numero === n).subtestes.includes("rm"));
});

test("WISC-IV idade mental e análise intraindividual", () => {
  const r = calcularResultado({ ...BRUTOS, cf: 20, ar: 20, rp: 15, in: 12, ca: 40 }, conversao, { dataNascimento: NASC, dataReferencia: REF });
  assert.equal(r.modo, "por_campo");
  if (r.modo !== "por_campo") return;
  const e = r.extras as Record<string, any>;
  const im = e.idadeMental;
  assert.equal(Object.keys(im.subtestes).length, 15);
  assert.ok(im.total && /^\d+a, \d+m$/.test(im.total.texto));
  const meses = Object.values<any>(im.subtestes).map((s) => s.meses);
  assert.ok(Math.abs(im.total.meses - meses.reduce((a, v) => a + v, 0) / meses.length) < 1e-9);
  const intra = e.intraindividual;
  assert.equal(intra.itens.length, 15);
  assert.ok(intra.maiorPositiva.diferenca >= intra.maiorNegativa.diferenca);
  assert.ok(intra.itens.every((i: any) => i.diferenca <= intra.maiorPositiva.diferenca && i.diferenca >= intra.maiorNegativa.diferenca));
});
