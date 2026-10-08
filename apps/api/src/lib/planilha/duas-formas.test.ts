// "Item a item" e "só os totais" precisam dar o MESMO resultado: lança-se os itens, pega-se o total que a planilha calculou
// e lança-se só esse total em outra execução. Vale para os testes com as duas formas (BFP, RAVLT, SCARED, SRS-2, E-TDAH Pais).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { calcularPlanilha, type DefinicaoPlanilha } from "./motor";

const pasta = join(__dirname, "..", "..", "..", "..", "..", "docs", "testes", "planilha");
const ler = (sigla: string) => JSON.parse(readFileSync(join(pasta, `${sigla}.json`), "utf8")) as DefinicaoPlanilha & { entradas: Array<{ chave: string; celula: string; min?: number; max?: number; letras?: string[]; modo?: string }> };

let semente = 7;
const rnd = () => ((semente = (semente * 1664525 + 1013904223) >>> 0) / 4294967296);

// célula do total que a planilha calcula pelos itens, quando o campo de total é uma célula em branco à parte (RAVLT: linha 28 → 26; F60 → F59)
const automatica = (sigla: string, celula: string) => (sigla === "RAVLT" ? (celula === "F60" ? "F59" : celula.replace(/28$/, "26")) : celula);

const CASOS: Array<{ sigla: string; nasc: string; escol: string; tabelas: string[] }> = [
  { sigla: "BFP", nasc: "1995-04-10", escol: "Ensino Médio", tabelas: ["Neuroticismo", "Extroversão", "Socialização", "Realização", "Abertura"] },
  { sigla: "SCARED", nasc: "2014-04-10", escol: "Ensino Fundamental", tabelas: ["Auto-relato — escalas, normas e classificação", "Cuidador 1 — pontos, nota de corte e percentual", "Cuidador 2 — pontos, nota de corte e percentual", "Cuidador 3 — pontos, nota de corte e percentual"] },
  { sigla: "SRS2-ADULTOS", nasc: "1990-04-10", escol: "Ensino Médio", tabelas: ["Autorrelato", "Heterorrelato 1", "Heterorrelato 2", "Heterorrelato 3"] },
  { sigla: "SRS2-ESCOLAR", nasc: "2014-04-10", escol: "Ensino Fundamental", tabelas: ["Avaliação 1", "Avaliação 2"] },
  { sigla: "ETDAH-PAIS", nasc: "2014-04-10", escol: "Ensino Fundamental", tabelas: ["Informante 1", "Informante 2", "Informante 3"] },
  { sigla: "RAVLT", nasc: "2014-04-10", escol: "Ensino Fundamental", tabelas: ["Pontos brutos, conversão e classificação"] },
];

for (const c of CASOS) {
  test(`${c.sigla}: lançar só os totais dá o mesmo resultado que lançar item a item`, () => {
    const def = ler(c.sigla);
    const ctx = { dataNascimento: new Date(`${c.nasc}T00:00:00Z`), dataReferencia: new Date("2026-07-28T12:00:00Z"), sexo: "MASCULINO", escolaridade: c.escol, nome: "Teste" };
    const itens: Record<string, number> = {};
    for (const e of def.entradas) {
      if (e.modo === "totais") continue;
      const lo = e.min ?? 0, hi = e.max ?? 3;
      // o RAVLT recebe a ORDEM de evocação: números pequenos, sem repetir muito
      itens[e.chave] = e.letras ? 1 + Math.floor(rnd() * e.letras.length) : lo + Math.floor(rnd() * (hi - lo + 1));
    }
    const porItens = calcularPlanilha(def, itens, ctx);
    const totais: Record<string, number> = {};
    for (const e of def.entradas) {
      if (e.modo !== "totais") continue;
      const v = porItens.saidas[`out_${automatica(c.sigla, e.celula)}`];
      if (typeof v === "number") totais[e.chave] = v;
    }
    assert.ok(Object.keys(totais).length > 0, "nenhum total calculado pelos itens");
    // opções (ex.: amostra do BFP) e a lista S/N do reconhecimento do RAVLT continuam valendo no modo "só totais"
    const soTotais = calcularPlanilha(def, totais, ctx);
    const chaves = def.tabelas.filter((t) => c.tabelas.includes(t.titulo)).flatMap((t) => t.linhas.flatMap((l) => l.valores.filter((k): k is string => !!k)));
    assert.ok(chaves.length > 0, "tabelas não encontradas");
    // RAVLT: o falso positivo (C113) vem só da lista S/N do reconhecimento, não dos totais: na planilha também é assim
    const diferentes = chaves.filter((k) => !(c.sigla === "RAVLT" && k === "out_C113")).filter((k) => String(porItens.saidas[k] ?? "") !== String(soTotais.saidas[k] ?? ""));
    assert.deepEqual(diferentes.slice(0, 5).map((k) => `${k}: ${porItens.saidas[k]} × ${soTotais.saidas[k]}`), []);
  });
}
