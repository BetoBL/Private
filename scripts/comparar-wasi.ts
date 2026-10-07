// Compara o módulo wasi.ts com a PLANILHA (avaliada offline por scripts/avaliador-planilha.mjs) em casos aleatórios.
// Uso (de C:\Projetos\NeuroLogic):  npx --prefix apps/api tsx scripts/comparar-wasi.ts <wb.json> [casos=300] [semente=1]
import { readFileSync } from "node:fs";
import { Err, Planilhas } from "./avaliador-planilha.mjs";
import { calcularWasi, type WasiPlanilha } from "../apps/api/src/lib/wasi";

const [, , arq, nCasos = "300", semente = "1"] = process.argv;
const wb = JSON.parse(readFileSync(arq, "utf8"));
const dados = { tipo: "wasi_planilha", ...JSON.parse(readFileSync("docs/testes/WASI-planilha.json", "utf8")) } as WasiPlanilha;

let s = Number(semente) * 2654435761 >>> 0;
const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
const inteiro = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
const serial = (d: Date) => Math.round((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(1899, 11, 30)) / 86400000);

const mismatches: Record<string, { n: number; exemplos: string[] }> = {};
const registrar = (campo: string, msg: string) => { const m = (mismatches[campo] ??= { n: 0, exemplos: [] }); m.n++; if (m.exemplos.length < 4) m.exemplos.push(msg); };
const igual = (a: unknown, b: unknown) => {
  if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a));
  if (typeof a === "string" && typeof b === "number") return a.trim() !== "" && Number(a.replace(",", ".")) === b;
  if (typeof a === "number" && typeof b === "string") return b.trim() !== "" && Number(b.replace(",", ".")) === a;
  return String(a ?? "").trim() === String(b ?? "").trim();
};
const emMeses = (t: unknown) => { const m = /^(\d+)a, (\d+)m$/.exec(String(t)); return m ? Number(m[1]) * 12 + Number(m[2]) : null; };

const LIN: Record<string, number> = { vc: 10, cb: 11, sm: 12, rm: 13 };
const COL_T: Record<string, string> = { vc: "F", cb: "G", sm: "F", rm: "G" };
const ESCALAS = { qiv: 25, qie: 26, qit4: 27, qit2: 28 } as const;
const LINHA_HAB = new Map(dados.habilidades.map((h) => [h.numero, h.linha]));
let comparacoes = 0;

const diasDe = (nasc: Date, ref: Date) => { let a = ref.getUTCFullYear() - nasc.getUTCFullYear(), m = ref.getUTCMonth() - nasc.getUTCMonth(), d = ref.getUTCDate() - nasc.getUTCDate(); if (d < 0) { m--; d += new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 0)).getUTCDate(); } if (m < 0) { a--; m += 12; } return a * 365 + m * 30 + d; };

for (let caso = 0; caso < Number(nCasos); caso++) {
  const idadeAnos = rnd() < 0.55 ? inteiro(6, 16) : inteiro(17, 85);
  const ref = new Date(Date.UTC(2026, inteiro(0, 11), inteiro(1, 28)));
  const nasc = new Date(Date.UTC(ref.getUTCFullYear() - idadeAnos, inteiro(0, 11), inteiro(1, 28)));
  const dias = diasDe(nasc, ref);
  if (dias < 2190) continue;
  const brutos: Record<string, number> = {};
  const todos = rnd() < 0.5;
  for (const c of ["vc", "cb", "sm", "rm"]) {
    if (!todos && rnd() < 0.25) continue;
    const faixa = [...dados.faixasT[c]].reverse().find((f) => dias >= f.diasMin)!;
    const t = faixa.tabela;
    const min = t[0].min, max = t[t.length - 1].min + 4;
    brutos[c] = inteiro(min, max);
  }
  if (Object.keys(brutos).length === 0) continue;
  const confianca = rnd() < 0.5 ? "90%" : "95%";

  const pl = new Planilhas(wb, ["WASI-Normas", "Tab_Conversao", "ID-Usuário"]);
  pl.entrada("WASI", "N3", serial(ref));
  pl.entrada("CADASTRO", "D4", serial(nasc));
  pl.entrada("WASI", "I24", confianca);
  for (const [c, v] of Object.entries(brutos)) pl.entrada("WASI", `E${LIN[c]}`, v);
  const X = (end: string) => { const v = pl.valor("WASI", end); return v instanceof Err ? `#${v.codigo}` : v; };
  const r = calcularWasi(brutos, dados, nasc, ref);
  const pc = r.porCampo;
  const tag = `idade ${Math.floor(dias / 365)}a dias ${dias} ${confianca} brutos ${JSON.stringify(brutos)}`;
  const cmp = (campo: string, mod: unknown, ex: unknown) => {
    comparacoes++;
    if (mod === null || mod === undefined) { if (ex === "" || ex === null || ex === undefined || (typeof ex === "string" && ex.startsWith("#"))) return; registrar(campo, `módulo=nulo planilha=${ex} | ${tag}`); return; }
    if (!igual(mod, ex)) registrar(campo, `módulo=${mod} planilha=${ex} | ${tag}`);
  };

  // subtestes
  for (const c of Object.keys(brutos)) {
    const f = pc[c]?.faixa as unknown as Record<string, unknown> | null;
    const lin = LIN[c];
    if (!f) { const ex = X(`${COL_T[c]}${lin}`); comparacoes++; if (typeof ex === "number") registrar("sub.t", `${c}: módulo=nulo planilha=${ex} | ${tag}`); continue; }
    cmp(`sub.${c}.t`, f.escoreT, X(`${COL_T[c]}${lin}`));
    cmp(`sub.${c}.ponderado`, f.ponderado, X(`K${lin}`));
    cmp(`sub.${c}.z`, f.z, X(`I${lin}`));
    cmp(`sub.${c}.composto`, f.pontoComposto, X(`J${lin}`));
    if (typeof f.percentil === "number") { comparacoes++; const ex = X(`L${lin}`); if (typeof ex !== "number" || Math.abs(ex - f.percentil) > 0.006) registrar(`sub.${c}.percentil`, `módulo=${f.percentil} planilha=${ex} | ${tag}`); }
    cmp(`sub.${c}.classificacao`, f.classificacao, X(`M${lin}`));
    cmp(`sub.${c}.testeIdade`, f.testeIdade, X(`O${lin}`));
  }

  // escalas
  for (const [chave, lin] of Object.entries(ESCALAS)) {
    const campo = pc[chave];
    if (!campo || campo.valorBruto === null) continue;
    const f = campo.faixa as unknown as Record<string, unknown> | null;
    cmp(`${chave}.soma`, campo.valorBruto, X(`E${lin}`));
    if (!f) continue;
    cmp(`${chave}.ponderado`, f.ponderado, X(`F${lin}`));
    cmp(`${chave}.qi`, f.composto, X(`G${lin}`));
    cmp(`${chave}.percentil`, f.percentil, X(`H${lin}`));
    cmp(`${chave}.ic`, confianca === "90%" ? f.ic90 : f.ic95, X(`I${lin}`));
    cmp(`${chave}.classificacao`, f.classificacao, X(`J${lin}`));
    cmp(`${chave}.interpretavel`, f.interpretavel, X(`L${lin}`));
    if (chave === "qiv" || chave === "qie") {
      cmp(`${chave}.dfNormativa`, f.dfNormativa, X(`M${lin}`));
      // Com só um dos QIs a planilha divide a soma por 2 (média falsa); só comparo com os dois calculados.
      if (pc.qiv?.faixa && pc.qie?.faixa) {
        cmp(`${chave}.mediaIndices`, f.mediaIndices, X(`N${lin}`));
        cmp(`${chave}.diferencaMedia`, f.diferencaMedia, X(`O${lin}`));
      }
      // Observação: a planilha só mostra a 1ª frase (as outras ficam inalcançáveis por defeito de fórmula)
      comparacoes++;
      const obs = String(f.observacao ?? ""); const ex = String(X(`U${lin}`) ?? "");
      if (!obs.startsWith(ex)) registrar(`${chave}.observacao`, `módulo=${obs.slice(0, 60)} planilha=${ex.slice(0, 60)} | ${tag}`);
    } else {
      cmp(`${chave}.aviso`, String(f.aviso ?? "").replace(/"/g, "''"), X(`M${lin}`)); // a planilha escreve aspas duplas como ''
    }
  }

  // teste-idade e idade mental
  const ex = r.extras as { idadeMental: Record<string, { texto: string } | null>; testeIdade: Record<string, string | null>; habilidades: Array<{ numero: number; p: number; n: number; zero: number; completa: boolean; interpretacao: string; subtestes: string[] }>; intraindividual: { itens: unknown[]; maiorPositiva: { chave: string; diferenca: number } | null; maiorNegativa: { chave: string; diferenca: number } | null } };
  // Defeito da planilha: a idade mental de CB e SM (AB4/AC4 e AB5/AC5) usa a tabela trocada (CB lê a coluna do SM e vice-versa); só o QIT-2 (VC+RM) não é afetado.
  for (const [chave, lin] of [["qit2", 12]] as const) {
    const m = ex.idadeMental[chave];
    if (!m) continue;
    comparacoes++;
    const p = X(`AH${lin}`);
    if (emMeses(p) !== emMeses(m.texto)) registrar(`idadeMental.${chave}`, `módulo=${m.texto} planilha=${p} | ${tag}`);
  }
  for (const [chave, end] of [["qit2", "H18"]] as const) {
    const m = ex.testeIdade[chave];
    if (!m) continue;
    comparacoes++;
    const p = X(end);
    if (emMeses(p) !== emMeses(m) && String(p) !== String(m)) registrar(`testeIdadeEscala.${chave}`, `módulo=${m} planilha=${p} | ${tag}`);
  }

  // habilidades (só com os 4 subtestes) e extremos
  if (Object.keys(brutos).length === 4 && pc.vc?.faixa && pc.cb?.faixa && pc.sm?.faixa && pc.rm?.faixa) {
    for (const h of ex.habilidades) {
      if (!h.completa) continue;
      const lin = LINHA_HAB.get(h.numero)!;
      cmp(`hab.positivos`, h.p, X(`L${lin}`));
      cmp(`hab.negativos`, h.n, X(`M${lin}`));
      cmp(`hab.neutros`, h.zero, X(`N${lin}`));
      if (h.subtestes.length > 1) cmp(`hab.interpretacao`, h.interpretacao, X(`K${lin}`));
    }
    const mp = ex.intraindividual.maiorPositiva, mn = ex.intraindividual.maiorNegativa;
    if (mp) { comparacoes += 2; const v = X("I40"), c = X("J40"); if (typeof v !== "number" || Math.abs(v - mp.diferenca) > 1e-9) registrar("intra.maiorPositivaValor", `módulo=${mp.diferenca} planilha=${v} | ${tag}`); if (String(c).toLowerCase() !== mp.chave) registrar("intra.maiorPositiva", `módulo=${mp.chave} planilha=${c} | ${tag}`); }
    if (mn) { comparacoes += 2; const v = X("I41"), c = X("J41"); if (typeof v !== "number" || Math.abs(v - mn.diferenca) > 1e-9) registrar("intra.maiorNegativaValor", `módulo=${mn.diferenca} planilha=${v} | ${tag}`); if (String(c).toLowerCase() !== mn.chave) registrar("intra.maiorNegativa", `módulo=${mn.chave} planilha=${c} | ${tag}`); }
  }
}

console.log(`casos: ${nCasos} | campos comparados: ${comparacoes} | campos com divergência: ${Object.keys(mismatches).length}`);
for (const [campo, m] of Object.entries(mismatches).sort((a, b) => b[1].n - a[1].n)) {
  console.log(` ${campo}: ${m.n} divergência(s)`);
  m.exemplos.forEach((e) => console.log(`    ${e.slice(0, 260)}`));
}
if (Object.keys(mismatches).length === 0) console.log("TUDO IGUAL À PLANILHA");
