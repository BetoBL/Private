// Cálculo do WASI espelhando a planilha da psicóloga (aba WASI + WASI-Normas). Função pura.
// Dados normativos: docs/testes/WASI-planilha.json (gerado por scripts/gerar-wasi-planilha.mjs).
//
// Fluxo (igual ao da planilha):
//   1. idade em DIAS = anos×365 + meses×30 + dias → faixa etária (45 faixas, 6:0 a 85+);
//   2. bruto → escore T pela tabela da faixa; Z = (T−50)/10; ponto composto = Z×15+100; percentil = Φ(Z); ponderado (tabela T→ponderado);
//   3. soma dos escores T: QI Verbal (VC+SM), QI Execução (CB+RM), QIT-4 (os 4) e QIT-2 (VC+RM) → QI, percentil, IC 90/95%;
//   4. análise (interpretabilidade, facilidade/dificuldade normativa), habilidades compartilhadas, idade mental e teste-idade.
//
// Diferença deliberada em relação à planilha: ela soma o que houver (subteste não lançado vira 0 ou erro); aqui cada escala só é
// calculada com todos os subtestes que a compõem.
import type { FaixaConversao, ResultadoPorCampo } from "./motorCalculo";
import { arredondar, degrau, normalAcumulada } from "./wais3";
import { decomporIdade, idadeWisc4EmDias } from "./wisc4";

type Valor = number | string | null;
export interface WasiPlanilha {
  tipo: "wasi_planilha";
  faixasT: Record<string, Array<{ diasMin: number; tabela: Array<{ min: number; t: number | null }> }>>;
  ponderado: Array<{ min: number; ponderado: number | null }>;
  escalas: Record<string, Array<{ min: number; qi: Valor; percentil: Valor; ic: { c90: Valor; c95: Valor; a90: Valor; a95: Valor } }>>;
  idadeEquivalente: Record<string, Array<{ min: number; texto: string | null; meses: number | null }>>;
  habilidades: Array<{ numero: number; linha: number; nome: string; grupo: string; subtestes: string[]; nRegra: number }>;
  observacoes: { u25: string[]; u26: string[]; m27: string[]; m28: string[] };
}

type Bruto = Record<string, number>;
export const SUBTESTES_WASI = ["vc", "cb", "sm", "rm"] as const;
const NOME_SUBTESTE: Record<string, string> = { vc: "VC - Vocabulário", cb: "CB - Cubos", sm: "SM - Semelhanças", rm: "RM - Raciocínio Matricial" };

// Classificação de subteste e das escalas (colunas M e J da planilha)
export function classificarZWasi(z: number): string {
  if (z >= 2) return "Muito Superior";
  if (z >= 1.333) return "Superior";
  if (z >= 0.666) return "Média Superior";
  if (z >= -0.666) return "Média";
  if (z >= -1.333) return "Média Inferior";
  if (z >= -2) return "Limítrofe";
  return "Deficitário";
}
export function classificarQiWasi(qi: number): string {
  if (qi >= 130) return "Muito Superior";
  if (qi >= 120) return "Superior";
  if (qi >= 110) return "Média Superior";
  if (qi >= 90) return "Média";
  if (qi >= 80) return "Média Inferior";
  if (qi >= 70) return "Limítrofe";
  return "Extremamente Baixo";
}

const numeroOuNull = (v: unknown): number | null => (typeof v === "number" ? v : null);
const formatarMeses = (meses: number) => {
  let a = Math.floor(meses / 12);
  let m = arredondar(meses - a * 12, 0);
  if (m === 12) { a += 1; m = 0; }
  return `${a}a, ${m}m`;
};

export function calcularWasi(brutos: Bruto, dados: WasiPlanilha, nascimento: Date, referencia: Date): { modo: "por_campo"; porCampo: Record<string, ResultadoPorCampo>; extras: Record<string, unknown> } {
  const porCampo: Record<string, ResultadoPorCampo> = {};
  const { anos } = decomporIdade(nascimento, referencia);
  const dias = idadeWisc4EmDias(nascimento, referencia);
  const crianca = dias < 6205; // 17 anos: muda a coluna de IC e o teste-idade (planilha: P5 < 6205)

  // 1) escore T, Z, composto, percentil, ponderado e teste-idade por subteste
  const T: Record<string, number | null> = {};
  const K: Record<string, number | null> = {};
  const idadeEquivalente: Record<string, { texto: string; meses: number | null } | null> = {};
  for (const chave of SUBTESTES_WASI) {
    const bruto = brutos[chave];
    if (bruto === undefined) continue;
    const faixaIdade = [...(dados.faixasT[chave] ?? [])].reverse().find((f) => dias >= f.diasMin);
    const t = faixaIdade ? (degrau(faixaIdade.tabela, bruto)?.t ?? null) : null;
    T[chave] = t;
    const pond = t !== null ? (degrau(dados.ponderado, t)?.ponderado ?? null) : null;
    K[chave] = pond;
    const ie = degrau(dados.idadeEquivalente[chave] ?? [], bruto);
    idadeEquivalente[chave] = ie ? { texto: crianca ? String(ie.texto ?? "") : "> 16a - Não há dados!", meses: ie.meses } : null;
    if (t === null) { porCampo[chave] = { valorBruto: bruto, faixa: null }; continue; }
    const z = (t - 50) / 10;
    porCampo[chave] = {
      valorBruto: bruto,
      faixa: {
        escoreT: t, ponderado: pond, z: arredondar(z, 3), pontoComposto: arredondar(z * 15 + 100, 2),
        percentil: t > 0 ? arredondar(normalAcumulada(z) * 100, 3) : null, classificacao: classificarZWasi(z),
        testeIdade: idadeEquivalente[chave]?.texto ?? null,
      } as unknown as FaixaConversao,
    };
  }
  const tem = (c: string) => T[c] !== null && T[c] !== undefined;
  const k = (c: string) => K[c] as number;
  const soma = (cs: string[]): number | null => (cs.every(tem) ? cs.reduce((a, c) => a + (T[c] as number), 0) : null);

  // 2) escalas: soma dos T → QI, percentil, IC
  const somas: Record<string, number | null> = { qiv: soma(["vc", "sm"]), qie: soma(["cb", "rm"]), qit4: soma(["vc", "sm", "cb", "rm"]), qit2: soma(["vc", "rm"]) };
  const ESCALA_ROTULO: Record<string, string> = { qiv: "Q.I. Verbal", qie: "Q.I. Execução", qit4: "Escala Total (QIT-4)", qit2: "Escala Total (QIT-2)" };
  const qiDe: Record<string, number | null> = {};
  for (const [chave, s] of Object.entries(somas)) {
    if (s === null) { porCampo[chave] = { valorBruto: null, faixa: null }; qiDe[chave] = null; continue; }
    const linha = degrau(dados.escalas[chave], s);
    const qi = numeroOuNull(linha?.qi);
    qiDe[chave] = qi;
    if (!linha || qi === null) { porCampo[chave] = { valorBruto: s, faixa: null }; continue; }
    porCampo[chave] = {
      valorBruto: s,
      faixa: {
        rotulo: ESCALA_ROTULO[chave], ponderado: arredondar(((s - 50) / 10) * 3 + 10, 4), composto: qi, percentil: linha.percentil,
        ic90: crianca ? linha.ic.c90 : linha.ic.a90, ic95: crianca ? linha.ic.c95 : linha.ic.a95, classificacao: classificarQiWasi(qi),
      } as unknown as FaixaConversao,
    };
  }

  // 3) análise avançada dos QIs Verbal e Execução (colunas L-U)
  const ajuste = (chave: "qiv" | "qie", sub: [string, string], rotuloIndice: string, parSiglas: string, textos: string[]) => {
    const f = porCampo[chave]?.faixa as unknown as Record<string, unknown> | null | undefined;
    const qi = qiDe[chave];
    if (!f || qi === null) return;
    const interpretavel = Math.abs(k(sub[0]) - k(sub[1])) < 5;
    const extras: Record<string, unknown> = { interpretavel: interpretavel ? "SIM" : "NÃO" };
    if (!interpretavel) {
      const pond = [k(sub[0]), k(sub[1])];
      let obs = textos[0];
      if (Math.min(...pond) >= 12) obs += " " + textos[1];
      else if (Math.max(...pond) <= 8) obs += " " + textos[2];
      extras.observacao = obs;
    } else {
      extras.dfNormativa = qi < 85 ? "Dif. Norm." : qi < 115 ? "Média" : "Fac. Norm.";
      if (qiDe.qiv !== null && qiDe.qie !== null) {
        const media = ((qiDe.qiv as number) + (qiDe.qie as number)) / 2;
        extras.mediaIndices = media;
        extras.diferencaMedia = qi - media;
      }
    }
    void rotuloIndice; void parSiglas;
    porCampo[chave].faixa = { ...f, ...extras } as unknown as FaixaConversao;
  };
  if (porCampo.qiv?.faixa && tem("vc") && tem("sm")) ajuste("qiv", ["vc", "sm"], "Comp. Verbal", "VC e SM", dados.observacoes.u25);
  if (porCampo.qie?.faixa && tem("cb") && tem("rm")) ajuste("qie", ["cb", "rm"], "Org. Perc.", "CB e RM", dados.observacoes.u26);

  // 4) avisos dos QIs totais
  const interp = (c: string) => ((porCampo[c]?.faixa as unknown as { interpretavel?: string } | null)?.interpretavel);
  if (porCampo.qit4?.faixa && qiDe.qiv !== null && qiDe.qie !== null) {
    const ok = Math.abs((qiDe.qiv as number) - (qiDe.qie as number)) < 23;
    porCampo.qit4.faixa = { ...(porCampo.qit4.faixa as object), interpretavel: ok ? "SIM" : "NÃO", ...(ok ? {} : { aviso: dados.observacoes.m27[0] }) } as unknown as FaixaConversao;
  }
  if (porCampo.qit2?.faixa) {
    const ok = Math.abs(k("vc") - k("rm")) < 5;
    const aviso = !ok ? dados.observacoes.m28[0] : interp("qiv") === "NÃO" || interp("qie") === "NÃO" ? dados.observacoes.m28[1] : "";
    porCampo.qit2.faixa = { ...(porCampo.qit2.faixa as object), interpretavel: ok ? "SIM" : "NÃO", ...(aviso ? { aviso } : {}) } as unknown as FaixaConversao;
  }

  // 5) idade mental e teste-idade das escalas
  const mesesDe = (c: string) => idadeEquivalente[c]?.meses ?? null;
  const media = (cs: string[]) => (cs.every((c) => mesesDe(c) !== null) ? cs.reduce((a, c) => a + (mesesDe(c) as number), 0) / cs.length : null);
  const com = (m: number | null) => (m === null ? null : { meses: m, texto: formatarMeses(m) });
  const idadeMental = { qiv: com(media(["vc", "sm"])), qie: com(media(["cb", "rm"])), qit4: com(media(["vc", "sm", "cb", "rm"])), qit2: com(media(["vc", "rm"])) };
  const testeIdadeEscala = (chave: "qit4" | "qit2") => (anos > 16 ? "Não há dados p/ > 16anos" : idadeMental[chave]?.texto ?? null);

  // 6) habilidades compartilhadas e análise intraindividual (diferença de cada subteste para a média dos 4 ponderados)
  const todos4 = SUBTESTES_WASI.every((c) => tem(c) && K[c] !== null);
  const mediaK = todos4 ? SUBTESTES_WASI.reduce((a, c) => a + k(c), 0) / 4 : null;
  const dif: Record<string, number | null> = {};
  for (const c of SUBTESTES_WASI) dif[c] = mediaK === null ? null : k(c) - mediaK;
  const marca = (c: string): "P" | "N" | "0" | null => (dif[c] === null ? null : (dif[c] as number) >= 1 ? "P" : (dif[c] as number) <= -1 ? "N" : "0");
  const habilidades = dados.habilidades.map((h) => {
    const marcas: Record<string, "P" | "N" | "0" | null> = {};
    let p = 0, n = 0, z = 0;
    for (const s of h.subtestes) { const m = marca(s); marcas[s] = m; if (m === "P") p++; else if (m === "N") n++; else if (m === "0") z++; }
    const completa = p + n + z === h.subtestes.length;
    let interpretacao = "";
    if (completa) {
      const t = h.subtestes.length;
      if (t === 2) interpretacao = p === 2 ? "Força" : n === 2 ? "Fraqueza" : "";
      else if (t === 3) interpretacao = p === 3 || (p === 2 && z === 1) ? "Força" : n === 3 || (n === 2 && z === 1) ? "Fraqueza" : "";
      else if (t === 4) interpretacao = p === 4 || (p === 3 && (n === 1 || z === 1)) ? "Força" : n === 4 || (n === 3 && (p === 1 || z === 1)) ? "Fraqueza" : "";
    }
    return { numero: h.numero, nome: h.nome, grupo: h.grupo, subtestes: h.subtestes, marcas, p, n, zero: z, total: p + n + z, completa, interpretacao };
  });
  const itens = (["sm", "vc", "cb", "rm"] as const).flatMap((c) => (dif[c] === null ? [] : [{ chave: c, nome: NOME_SUBTESTE[c], ponderado: k(c), media: mediaK as number, diferenca: dif[c] as number }]));
  const extremo = (sinal: 1 | -1) => { let m: (typeof itens)[number] | null = null; for (const i of itens) if (m === null || (sinal === 1 ? i.diferenca > m.diferenca : i.diferenca < m.diferenca)) m = i; return m; };

  return {
    modo: "por_campo",
    porCampo,
    extras: {
      idadeMental, testeIdade: { qit4: porCampo.qit4?.faixa ? testeIdadeEscala("qit4") : null, qit2: porCampo.qit2?.faixa ? testeIdadeEscala("qit2") : null },
      habilidades, intraindividual: { itens, maiorPositiva: extremo(1), maiorNegativa: extremo(-1) },
    },
  };
}
