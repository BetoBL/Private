// Compara o módulo wisc4.ts com a PLANILHA (avaliada offline por scripts/avaliador-planilha.mjs) em casos aleatórios.
// Uso (a partir de apps/api):  npx tsx ../../scripts/comparar-wisc4.ts <wb.json> [casos=300] [semente=1]
import { readFileSync } from "node:fs";
import { Err, Planilhas } from "./avaliador-planilha.mjs";
import { calcularWisc4, type Wisc4Planilha } from "../apps/api/src/lib/wisc4";

const [, , arq, nCasos = "300", semente = "1"] = process.argv;
const wb = JSON.parse(readFileSync(arq, "utf8"));
const dados = { tipo: "wisc4_planilha", ...JSON.parse(readFileSync("docs/testes/WISC-IV-planilha.json", "utf8")) } as Wisc4Planilha;

// gerador pseudoaleatório determinístico
let s = Number(semente) * 2654435761 >>> 0;
const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
const inteiro = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));

const LINHA_PROC: Record<string, number> = { cusb: 116, diod: 117, dioi: 118, caa: 119, cae: 120, udiod: 126, udioi: 127 };
const LINHA: Record<string, number> = { cb: 10, sm: 11, dg: 12, cn: 13, cd: 14, vc: 15, snl: 16, rm: 17, co: 18, ps: 19, cf: 20, ca: 21, in: 22, ar: 23, rp: 24 };
const PRINCIPAIS = ["cb", "sm", "dg", "cn", "cd", "vc", "snl", "rm", "co", "ps"];
const SUPLEMENTARES = ["cf", "ca", "in", "ar", "rp"];
const serial = (d: Date) => Math.round((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(1899, 11, 30)) / 86400000);

const mismatches: Record<string, { n: number; exemplos: string[] }> = {};
const registrar = (campo: string, msg: string) => { const m = (mismatches[campo] ??= { n: 0, exemplos: [] }); m.n++; if (m.exemplos.length < 4) m.exemplos.push(msg); };
const igual = (a: unknown, b: unknown) => {
  if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a));
  if (typeof a === "string" && typeof b === "number") return a.trim() !== "" && Number(a.replace(",", ".")) === b;
  if (typeof a === "number" && typeof b === "string") return b.trim() !== "" && Number(b.replace(",", ".")) === a;
  return String(a ?? "") === String(b ?? "");
};
const NORMALIZA_LABEL: Record<string, string> = { "Dificuldade Normativa": "Dif. Norm.", "Facilidade Normativa": "Fac. Norm.", Média: "Média", "Facilidade Individual": "Fac. Indiv.", "Dificuldade Individual": "Dif. Indiv." };
let comparacoes = 0;
// linha da planilha de cada habilidade (coluna AD tem o número)
const LINHA_HAB = new Map<number, number>();
for (const c of (wb["WISC-IV"].celulas as Array<{ c: string; v: unknown }>)) {
  const m = /^AD(\d+)$/.exec(c.c);
  if (m && Number(m[1]) >= 64 && c.v !== null && c.v !== "" && !Number.isNaN(Number(c.v))) LINHA_HAB.set(Number(c.v), Number(m[1]));
}
const HAB_RM_DEFEITUOSO = new Set([65, 69, 76, 82]); // coluna do RM aponta para $G$95 na planilha
const habPorNumero = new Map((dados.habilidades ?? []).map((h) => [h.numero, h]));

for (let caso = 0; caso < Number(nCasos); caso++) {
  // idade entre 6a0m e 16a11m
  const meses = inteiro(72, 203);
  const ref = new Date(Date.UTC(2026, inteiro(0, 11), inteiro(1, 28)));
  const nasc = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() - meses, inteiro(1, 28)));
  // escores: cada subteste cai num ponderado alvo (2-18), tomando um bruto dentro do intervalo da faixa
  const dias = ((): number => { const d = nasc; const r = ref; let a = r.getUTCFullYear() - d.getUTCFullYear(), m = r.getUTCMonth() - d.getUTCMonth(), dd = r.getUTCDate() - d.getUTCDate(); if (dd < 0) { m--; dd += new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth(), 0)).getUTCDate(); } if (m < 0) { a--; m += 12; } return a * 365 + m * 30 + dd; })();
  const banda = [...dados.bandasEtarias].reverse().find((b) => dias >= b.diasMin);
  if (!banda) continue;
  const base = inteiro(4, 15);
  const todos = rnd() < 0.1; // 10% dos casos com os 15 subtestes (exercita a análise intraindividual completa)
  const quais = todos ? [...PRINCIPAIS, ...SUPLEMENTARES] : [...PRINCIPAIS.filter(() => rnd() > 0.12), ...SUPLEMENTARES.filter(() => rnd() > 0.55)];
  const brutos: Record<string, number> = {};
  for (const k of quais) {
    const faixas = dados.a1[banda.rotulo][k];
    const alvo = Math.max(1, Math.min(19, base + inteiro(-4, 4)));
    const candidatos = faixas.filter((f) => f.ponderado === alvo);
    const f = candidatos.length ? candidatos[inteiro(0, candidatos.length - 1)] : faixas[inteiro(0, faixas.length - 1)];
    brutos[k] = inteiro(f.min, f.max ?? f.min + 3);
  }
  if (Object.keys(brutos).length === 0) continue;
  // escores de processo (entradas independentes, ~60% de chance cada)
  const FAIXA_PROC: Record<string, [number, number]> = { cusb: [10, 60], diod: [3, 16], dioi: [2, 14], caa: [20, 130], cae: [20, 130], udiod: [2, 9], udioi: [2, 8] };
  for (const k of Object.keys(FAIXA_PROC)) if (rnd() < 0.6) brutos[k] = inteiro(FAIXA_PROC[k][0], FAIXA_PROC[k][1]);

  // --- planilha ---
  const pl = new Planilhas(wb, ["WAIS-NORMAS", "WISC-NORMAS", "Tab_Conversao", "ID-Usuário"]);
  pl.entrada("WISC-IV", "N3", serial(ref));
  pl.entrada("CADASTRO", "D4", serial(nasc));
  const confianca = rnd() < 0.5 ? "90%" : "95%";
  const baseComp = rnd() < 0.5 ? "Amostra Geral" : "Nível de Habilidade";
  pl.entrada("WISC-IV", "H36", confianca);
  pl.entrada("WISC-IV", "J62", baseComp);
  for (const [k, v] of Object.entries(brutos)) pl.entrada("WISC-IV", `E${LINHA[k] ?? LINHA_PROC[k]}`, v);
  const X = (end: string) => { const v = pl.valor("WISC-IV", end); return v instanceof Err ? `#${v.codigo}` : v; };

  // --- módulo ---
  let extrasMod: Record<string, any> = {};
  const r = (() => { const x = calcularWisc4(brutos, dados, nasc, ref, { confianca, base: baseComp }); extrasMod = x.extras; return x.porCampo; })();
  const tag = `idade ${Math.floor(meses / 12)}:${meses % 12} dias ${dias} brutos ${JSON.stringify(brutos)}`;

  for (const k of Object.keys(brutos)) {
    if (LINHA_PROC[k] !== undefined) continue;
    const lin = LINHA[k];
    const f = r[k]?.faixa;
    const exP = X(`F${lin}`);
    comparacoes++;
    if (!igual(f?.ponderado ?? "", typeof exP === "string" && exP.startsWith("#") ? "" : exP)) registrar("ponderado", `${k}: módulo=${f?.ponderado} planilha=${exP} | ${tag}`);
    if (typeof f?.ponderado === "number" && f.ponderado > 0) {
      for (const [campo, col] of [["z", "L"], ["pontoComposto", "M"], ["percentil", "N"], ["classificacao", "O"]] as const) {
        comparacoes++;
        const ex = X(`${col}${lin}`);
        if (!igual(campo === "z" ? f[campo] : f[campo], ex)) {
          // z e percentil do módulo são arredondados (3 casas / 3 casas): tolerância própria
          if (typeof f[campo] === "number" && typeof ex === "number" && Math.abs((f[campo] as number) - ex) < 0.006) continue;
          registrar(`subteste.${campo}`, `${k}: módulo=${f[campo]} planilha=${ex} | ${tag}`);
        }
      }
    }
  }

  const COL_INDICE: Record<string, { lin: number; ic: string }> = { icv: { lin: 37, ic: "H" }, iop: { lin: 38, ic: "H" }, imo: { lin: 39, ic: "H" }, ivp: { lin: 40, ic: "H" }, qit: { lin: 41, ic: "H" }, gai: { lin: 42, ic: "H" }, cpi: { lin: 43, ic: "H" } };
  const SOMAS_EXCEL: Record<string, string> = { icv: "E37", iop: "E38", imo: "E39", ivp: "E40", qit: "E41", gai: "E42", cpi: "E43" };
  for (const [k, { lin }] of confianca === "95%" ? Object.entries(COL_INDICE) : []) {
    const m = r[k];
    if (!m || m.valorBruto === null) continue; // módulo só calcula com todos os subtestes
    comparacoes++;
    const exSoma = X(SOMAS_EXCEL[k]);
    if (!igual(m.valorBruto, exSoma)) { registrar(`${k}.soma`, `módulo=${m.valorBruto} planilha=${exSoma} | ${tag}`); continue; }
    const f = m.faixa;
    const checar = (campo: string, mod: unknown, col: string) => { comparacoes++; const ex = X(`${col}${lin}`); if (!igual(mod ?? "", ex)) registrar(`${k}.${campo}`, `módulo=${mod} planilha=${ex} | ${tag}`); };
    checar("composto", f?.composto, "F");
    checar("percentil", f?.percentil, "G");
    checar("ic95", f?.ic95, "H");
    checar("classificacao", f?.classificacao, "I");
    checar("interpretavel", f?.interpretavel, "K");
    // A análise avançada usa a média dos 4 índices: a planilha a calcula mesmo com índices faltando (zeros no lugar); o módulo só calcula com os 4.
    const quatroIndices = ["icv", "iop", "imo", "ivp"].every((i) => r[i] && r[i].valorBruto !== null);
    if (["icv", "iop", "imo", "ivp"].includes(k) && quatroIndices) {
      checar("dfNormativa", f?.dfNormativa ? NORMALIZA_LABEL[String(f.dfNormativa)] : "", "L");
      checar("mediaIndices", f?.mediaIndices, "M");
      checar("diferencaMedia", f?.diferencaMedia, "N");
      checar("valorCritico", f?.valorCritico, "O");
      checar("dfIndividual", f?.dfIndividual ? NORMALIZA_LABEL[String(f.dfIndividual)] : "", "P");
      checar("raro", f?.raro, "R");
      checar("recursoPreocupacao", f?.recursoPreocupacao, "S");
    }
    if (["qit", "gai", "cpi"].includes(k) && (k !== "qit" || quatroIndices)) checar("aviso", f?.aviso, "L");
  }
  // --- discrepâncias (linhas 70-75 e 78-93) ---
  const normaliza = (v: unknown) => String(v ?? "").replace(",", ".");
  const idxLinha: Record<string, number> = { "ICV - IOP": 70, "ICV - IMO": 71, "ICV - IVP": 72, "IOP - IMO": 73, "IOP - IVP": 74, "IMO - IVP": 75 };
  const temQit = r.qit && r.qit.valorBruto !== null;
  for (const d of extrasMod.discrepanciasIndices ?? []) {
    const lin = idxLinha[d.par];
    // Defeito conhecido da planilha: WISC-NORMAS!G302 (IMO-IVP, 6:0-6:4, 90%/nível) é TEXTO, e número >= texto dá sempre "Não" (ver divergencias).
    if (d.par === "IMO - IVP" && confianca === "90%" && baseComp === "Nível de Habilidade" && dias >= 2193 && dias < 2557) continue;
    const comp = (campo: string, mod: unknown, col: string) => { comparacoes++; const ex = X(`${col}${lin}`); if (normaliza(mod) !== normaliza(ex)) registrar(`discIndices.${campo}`, `${d.par}: módulo=${mod} planilha=${ex} | ${confianca} ${baseComp} | ${tag}`); };
    comp("diferenca", d.diferenca, "H");
    comp("valorCritico", d.valorCritico, "I");
    comp("significativa", d.significativa, "J");
    if (baseComp === "Amostra Geral" || temQit) comp("frequencia", d.frequencia, "K");
  }
  for (const d of extrasMod.discrepanciasSubtestes ?? []) {
    const comp = (campo: string, mod: unknown, col: string) => { comparacoes++; const ex = X(`${col}${d.linha}`); if (normaliza(mod) !== normaliza(ex)) registrar(`discSubtestes.${campo}`, `${d.par}: módulo=${mod} planilha=${ex} | ${confianca} | ${tag}`); };
    comp("diferenca", d.diferenca, "H");
    comp("valorCritico", d.valorCritico, "I");
    comp("significativa", d.significativa, "J");
    if (d.linha >= 87) comp("frequencia", d.frequencia, "K");
  }
  // --- facilidades e dificuldades (linhas 100-109) ---
  const matiz = (v: unknown) => String(v ?? "").replace(",", ".").replace(/^=/, ""); // "=2%" é só um erro de digitação da planilha
  for (const f of extrasMod.facilidades ?? []) {
    const lin = f.linha as number;
    const comp = (campo: string, mod: unknown, col: string) => { comparacoes++; const ex = X(`${col}${lin}`); if (!igual(mod ?? "", ex) && matiz(mod) !== matiz(ex)) registrar(`facil.${campo}`, `${f.chave}: módulo=${mod} planilha=${ex} | ${confianca} ${baseComp} | ${tag}`); };
    comp("ponderado", f.ponderado, "C");
    comp("media", f.media, "D");
    comp("diferenca", f.diferenca, "F");
    comp("valorCritico", f.valorCritico, "G");
    comp("significativa", f.significativa, "H");
    comp("fd", f.facilidadeDificuldade, "I");
    // Defeito da planilha: em CN (níveis 3/4) o limite "4,33" foi lido como 4 — ignoro a faixa afetada.
    const ab = Math.abs(Math.round((f.diferenca as number) * 100) / 100);
    const nivel34 = X("L100") === 3 || X("L100") === 4;
    if (!(f.chave === "cn" && nivel34 && ab >= 4 && ab <= 4.33)) comp("frequencia", f.frequencia, "J");
  }

  // --- escores de processo (linhas 116-120, 126-127, 133, 138-140) ---
  for (const k of Object.keys(LINHA_PROC)) {
    if (brutos[k] === undefined) continue;
    const lin = LINHA_PROC[k];
    const f = r[k]?.faixa as Record<string, unknown> | null | undefined;
    // defeitos da planilha: chave bidimensional na tabela de CUSB (3405-3524 dias) e de CAA (4865-4984 dias)
    if ((k === "cusb" && dias >= 3405 && dias < 3525) || (k === "caa" && dias >= 4865 && dias < 4985)) continue;
    const cols: Array<[string, string]> = lin < 125 ? [["ponderado", "F"], ["z", "G"], ["percentil", "H"], ["classificacao", "I"]] : [["frequenciaAcumulada", "F"], ["z", "G"], ["percentil", "H"], ["classificacao", "I"]];
    for (const [campo, col] of cols) {
      comparacoes++;
      const ex = X(`${col}${lin}`);
      const mod = f?.[campo];
      if (mod === undefined || mod === null) { if (typeof ex === "string" && ex.startsWith("#")) continue; if (ex === "" || ex === null) continue; registrar(`proc.${k}.${campo}`, `módulo=nulo planilha=${ex} | ${tag}`); continue; }
      if (typeof mod === "number" && typeof ex === "number" && Math.abs(mod - ex) < 0.006) continue;
      if (!igual(mod, ex)) registrar(`proc.${k}.${campo}`, `módulo=${mod} planilha=${ex} | ${tag}`);
    }
  }
  const du = extrasMod.diferencaUdio as Record<string, unknown> | null | undefined;
  if (du) {
    for (const [campo, col] of [["diferenca", "G"], ["frequenciaAcumulada", "H"], ["z", "I"], ["percentil", "J"], ["classificacao", "K"]] as const) {
      comparacoes++;
      const ex = X(`${col}133`);
      const mod = du[campo];
      if (typeof mod === "number" && typeof ex === "number" && Math.abs(mod - ex) < 0.006) continue;
      if ((mod === null || mod === undefined) && typeof ex === "string" && ex.startsWith("#")) continue; // diferença fora da tabela: #N/A
      if (!igual(mod, ex)) registrar(`procDif.${campo}`, `módulo=${mod} planilha=${ex} | ${tag}`);
    }
  }
  const udioPresente = brutos.udiod !== undefined || brutos.udioi !== undefined;
  for (const c of extrasMod.comparacoesProcesso ?? []) {
    if (c.linha === 139 && !udioPresente) continue; // a planilha usa as entradas de UDIO como condição da linha 139 (defeito)
    if ((c.a === "caa" && dias >= 4865 && dias < 4985) || (c.b === "cusb" && dias >= 3405 && dias < 3525)) continue;
    const comp = (campo: string, mod: unknown, col: string) => { comparacoes++; const ex = X(`${col}${c.linha}`); if (!igual(mod ?? "", ex) && matiz(mod) !== matiz(ex)) registrar(`procComp.${campo}`, `${c.par}: módulo=${mod} planilha=${ex} | ${confianca} | ${tag}`); };
    comp("diferenca", c.diferenca, "H");
    comp("valorCritico", c.valorCritico, "I");
    comp("significativa", c.significativa, "J");
    // linhas 138/139 da planilha comparam a diferença com um RÓTULO (texto) e sempre usam a coluna "negativa": defeito; só comparo se diferença < 0
    if (c.linha === 140 || c.diferenca < 0) comp("frequencia", c.frequencia, "K");
  }
  // --- clusters (linhas 148-172), comparações clínicas (175-181), hipóteses (185) e sugestões (188) ---
  for (const c of extrasMod.clusters ?? []) {
    if (!c.calculado) continue;
    const lin = c.linha as number;
    const comp = (campo: string, mod: unknown, col: string) => {
      comparacoes++;
      const ex = X(`${col}${lin}`);
      if (typeof mod === "number" && typeof ex === "number" && Math.abs(mod - ex) < 1e-6) return;
      if (!igual(mod ?? "", ex)) registrar(`cluster.${campo}`, `${c.sigla}: módulo=${mod} planilha=${ex} | ${tag}`);
    };
    comp("interpretavel", c.interpretavel ? "SIM" : "NÃO", "G");
    if (c.interpretavel) {
      comp("soma", c.soma, "H");
      comp("composto", c.composto, "I");
      comp("ic95", c.ic95, "J");
      comp("percentil", c.percentil, "K");
      comp("classificacao", c.classificacao, "L");
    }
  }
  const COL_HIP: Record<number, string> = { 175: "B", 176: "E", 177: "I", 178: "M", 179: "R", 180: "V" };
  for (const c of extrasMod.comparacoesClinicas ?? []) {
    if (!c.calculada) continue;
    const comp = (campo: string, mod: unknown, ex: unknown) => { comparacoes++; if (typeof mod === "number" && typeof ex === "number" && Math.abs(mod - ex) < 1e-6) return; if (!igual(String(mod ?? "").trim(), String(ex ?? "").trim())) registrar(`clinica.${campo}`, `linha ${c.linha}: módulo=${String(mod).slice(0, 60)} planilha=${String(ex).slice(0, 60)} | ${tag}`); };
    comp("diferenca", c.diferenca, X(`I${c.linha}`));
    comp("raro", c.raro, X(`J${c.linha}`));
    // Hipótese/sugestão: a linha 180 tem defeito na planilha (texto invertido) e o empate não mostra texto no sistema novo.
    if (c.linha !== 180 && c.sentido !== "=") {
      comp("hipotese", c.hipotese, X(`${COL_HIP[c.linha]}185`));
      comp("sugestao", c.sugestao, X(`${COL_HIP[c.linha]}188`));
    }
  }
  if (extrasMod.gaiCpi) { comparacoes++; const ex = X("I181"); if (!igual(extrasMod.gaiCpi.diferenca, ex)) registrar("gaiCpi", `módulo=${extrasMod.gaiCpi.diferenca} planilha=${ex} | ${tag}`); }
  // --- habilidades compartilhadas (linhas 64+; AX/AY/AZ = positivos/negativos/neutros, AW = interpretação) ---
  for (const h of extrasMod.habilidades?.itens ?? []) {
    if (!h.completa || HAB_RM_DEFEITUOSO.has(h.numero)) continue;
    const lin = LINHA_HAB.get(h.numero);
    if (lin === undefined) { registrar("hab.linha", `habilidade ${h.numero} sem linha`); continue; }
    const meta = habPorNumero.get(h.numero)!;
    const comp = (campo: string, mod: unknown, col: string) => { comparacoes++; const ex = X(`${col}${lin}`); if (!igual(mod ?? "", ex)) registrar(`hab.${campo}`, `#${h.numero} ${h.nome}: módulo=${mod} planilha=${ex} | ${tag}`); };
    comp("positivos", h.p, "AX");
    comp("negativos", h.n, "AY");
    comp("neutros", h.zero, "AZ");
    // linhas com o defeito AY=0 nunca marcam "Fraqueza" por "quase todos"
    if (meta.fraquezaDefeituosa && h.interpretacao === "Fraqueza" && h.n !== meta.n) continue;
    comp("interpretacao", h.interpretacao, "AW");
  }
  // --- análise intraindividual (AA60:AA74, AX59:AY60) ---
  const ORDEM_INTRA = ["sm", "vc", "co", "in", "rp", "cb", "cn", "rm", "cf", "dg", "snl", "ar", "cd", "ps", "ca"];
  const intra = extrasMod.intraindividual as { itens: Array<{ chave: string; diferenca: number }>; maiorPositiva: { chave: string; diferenca: number } | null; maiorNegativa: { chave: string; diferenca: number } | null };
  for (const i of intra.itens) {
    comparacoes++;
    const ex = X(`AA${60 + ORDEM_INTRA.indexOf(i.chave)}`);
    if (typeof ex !== "number" || Math.abs(ex - i.diferenca) > 1e-9) registrar("intra.diferenca", `${i.chave}: módulo=${i.diferenca} planilha=${ex} | ${tag}`);
  }
  if (intra.itens.length === 15 && intra.maiorPositiva && intra.maiorNegativa) {
    const ex1 = X("AY59"), ex2 = X("AX59");
    comparacoes += 2;
    if (String(ex1).toLowerCase() !== intra.maiorPositiva.chave) registrar("intra.maiorPositiva", `módulo=${intra.maiorPositiva.chave} planilha=${ex1} | ${tag}`);
    if (typeof ex2 !== "number" || Math.abs(ex2 - intra.maiorPositiva.diferenca) > 1e-9) registrar("intra.maiorPositivaValor", `módulo=${intra.maiorPositiva.diferenca} planilha=${ex2} | ${tag}`);
    const ex3 = X("AX60"), ex4 = X("AY60");
    comparacoes += 2;
    if (typeof ex3 !== "number" || Math.abs(ex3 - intra.maiorNegativa.diferenca) > 1e-9) registrar("intra.maiorNegativaValor", `módulo=${intra.maiorNegativa.diferenca} planilha=${ex3} | ${tag}`);
    // busca deslocada (AA61:AB75) da planilha: só comparo quando ela devolve um subteste
    if (intra.maiorNegativa.chave !== "sm" && typeof ex4 === "string" && !ex4.startsWith("#") && ex4.toLowerCase() !== intra.maiorNegativa.chave) registrar("intra.maiorNegativa", `módulo=${intra.maiorNegativa.chave} planilha=${ex4} | ${tag}`);
  }

  // --- idade mental (R10:R24, Q10:Q24, AM16:AM19, AM21) ---
  const emMeses = (s: unknown) => { const m = /^(\d+)a, (\d+)m$/.exec(String(s)); return m ? Number(m[1]) * 12 + Number(m[2]) : null; };
  const im = extrasMod.idadeMental as { subtestes: Record<string, { meses: number; texto: string; sinal: string }>; indices: Record<string, { texto: string } | null>; total: { texto: string } | null; avisos: string[] };
  for (const [chave, v] of Object.entries(im.subtestes)) {
    const lin = LINHA[chave];
    comparacoes += 2;
    const exTexto = X(`R${lin}`);
    if (emMeses(exTexto) !== emMeses(v.texto)) registrar("idadeMental.subteste", `${chave}: módulo=${v.texto} planilha=${exTexto} | ${tag}`);
    const exSinal = X(`Q${lin}`);
    if (String(exSinal ?? "") !== v.sinal) registrar("idadeMental.sinal", `${chave}: módulo='${v.sinal}' planilha='${exSinal}' | ${tag}`);
  }
  for (const [chave, lin] of [["icv", 16], ["iop", 17], ["imo", 18], ["ivp", 19]] as const) {
    const v = im.indices[chave];
    if (!v) continue;
    comparacoes++;
    const ex = X(`AM${lin}`);
    if (emMeses(ex) !== emMeses(v.texto)) registrar("idadeMental.indice", `${chave}: módulo=${v.texto} planilha=${ex} | ${tag}`);
  }
  if (im.total) { comparacoes++; const ex = X("AM21"); if (emMeses(ex) !== emMeses(im.total.texto)) registrar("idadeMental.total", `módulo=${im.total.texto} (${(im.total as any).meses}) planilha=${ex} (AC26=${X("AC26")} AI21=${X("AI21")} AK21=${X("AK21")} AL21=${X("AL21")}) | ${tag}`); }
  // avisos M26 / C31
  const avM26 = X("M26"), avC31 = X("C31");
  if (r.qit && r.qit.valorBruto !== null) {
    comparacoes += 2;
    if (String(avM26 ?? "") !== (im.avisos.find((a) => a.startsWith("Considerar")) ?? "")) registrar("idadeMental.avisoM26", `módulo=${im.avisos} planilha=${avM26} | ${tag}`);
    if (String(avC31 ?? "") !== (im.avisos.find((a) => a.startsWith("É bom")) ?? "")) registrar("idadeMental.avisoC31", `módulo=${im.avisos} planilha=${avC31} | ${tag}`);
  }
}

console.log(`casos: ${nCasos} | campos comparados: ${comparacoes} | campos com divergência: ${Object.keys(mismatches).length}`);
for (const [campo, m] of Object.entries(mismatches).sort((a, b) => b[1].n - a[1].n)) {
  console.log(` ${campo}: ${m.n} divergência(s)`);
  m.exemplos.forEach((e) => console.log(`    ${e.slice(0, 260)}`));
}
if (Object.keys(mismatches).length === 0) console.log("TUDO IGUAL À PLANILHA");
