import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { calcularResultado, type ConversaoNormativa } from "../motorCalculo";
import { calcularPlanilha, type DefinicaoPlanilha } from "../planilha/motor";
import { classificarPercentil, abaixoDaMedia } from "./classificacao";
import { montarEstruturaLaudo, percentilDe, type AplicacaoLaudo } from "./montar";

const docs = join(__dirname, "..", "..", "..", "..", "..", "docs", "testes");
const planilha = (sigla: string) => JSON.parse(readFileSync(join(docs, "planilha", `${sigla}.json`), "utf8")) as DefinicaoPlanilha & { nome: string; descricao: string; referencia: string };
const ctx = { dataNascimento: new Date("2014-04-10T00:00:00Z"), dataReferencia: new Date("2026-07-28T12:00:00Z"), sexo: "MASCULINO", escolaridade: "Ensino Fundamental", nome: "T" };

function aplicacaoPlanilha(sigla: string, escores: Record<string, number>): AplicacaoLaudo {
  const def = planilha(sigla);
  const r = calcularPlanilha(def, escores, ctx);
  return { sigla, nome: def.nome, descricao: def.descricao, referenciaBibliografica: def.referencia, resultado: { modo: "planilha", saidas: r.saidas }, layout: { tabelas: def.tabelas, graficos: def.graficos }, dataSessao: new Date("2026-07-28") };
}

test("classificação por percentil usa o vocabulário e os cortes do sistema escolhido", () => {
  assert.equal(classificarPercentil(98, "MIOTTO_2017"), "Muito superior à média");
  assert.equal(classificarPercentil(91, "MIOTTO_2017"), "Superior à média");
  assert.equal(classificarPercentil(70, "MIOTTO_2017"), "Dentro da média");
  assert.equal(classificarPercentil(24.9, "MIOTTO_2017"), "Média inferior");
  assert.equal(classificarPercentil(8, "MIOTTO_2017"), "Limítrofe");
  assert.equal(classificarPercentil(0.1, "MIOTTO_2017"), "Deficitário");
  assert.equal(classificarPercentil(70, "GUILMETTE_2020"), "Média");
  assert.equal(abaixoDaMedia(24), true);
  assert.equal(abaixoDaMedia(25), false);
});

test("laudo: linhas por domínio a partir do WAIS-III, FDT e RAVLT reais", () => {
  const wais = JSON.parse(readFileSync(join(docs, "WAIS-III-planilha.json"), "utf8"));
  const brutos = { completarFiguras: 14, vocabulario: 37, codigos: 27, semelhancas: 16, cubos: 24, aritmetica: 9, raciocinioMatricial: 13, digitos: 13, informacao: 13, arranjoFiguras: 10, compreensao: 16, procurarSimbolos: 34, sequenciaNumerosLetras: 6 };
  const r = calcularResultado(brutos, { tipo: "wais3_planilha", ...wais } as unknown as ConversaoNormativa, { idadeDias: 12754, idadeAnos: 34 });
  const appWais: AplicacaoLaudo = { sigla: "WAIS-III", nome: "Escala Wechsler de Inteligência para Adultos WAIS-III", descricao: "avalia a inteligência de adultos.", referenciaBibliografica: "WECHSLER, D. WAIS-III.", resultado: r as never, dataSessao: new Date("2026-07-28") };

  const fdt = planilha("FDT");
  const escFdt: Record<string, number> = {};
  for (const e of fdt.entradas) escFdt[e.chave] = 30 + Math.floor(Math.random() * 0); // tempos/erros constantes
  const appFdt = aplicacaoPlanilha("FDT", escFdt);

  const ravlt = planilha("RAVLT");
  const escR: Record<string, number> = {};
  for (const e of ravlt.entradas) if (!(e as { modo?: string }).modo && !(e as { letras?: string[] }).letras && /^in_[C-K](1[1-9]|2[0-5])$/.test(e.chave)) escR[e.chave] = 1;
  const appRavlt = aplicacaoPlanilha("RAVLT", escR);

  // percentil numérico de uma linha de planilha é o da coluna anterior à "Classificação (Guilmette)"
  const pInib = percentilDe(appFdt, { linha: "Inibição" });
  assert.equal(typeof pInib, "number");

  const e = montarEstruturaLaudo([appWais, appFdt, appRavlt], { sistema: "MIOTTO_2017", primeiroNome: "Paciente" });
  assert.match(e.analise, /## Funções intelectuais\n[\s\S]*\[\[tabela:wais-indices\]\]\n\[\[grafico:wais-indices\]\]/);
  assert.match(e.analise, /## Linguagem\n[^\n]*\n- Subteste Vocabulário, percentil \*\*63% Dentro da média\*\*\./);
  assert.match(e.analise, /- \*\*Controle inibitório:\*\* FDT inibição, percentil \*\*\d+% [^*]+\*\*\./);
  assert.match(e.analise, /- \*\*Raciocínio Lógico:\*\* subteste Raciocínio Matricial, percentil \*\*\d+% /);
  assert.match(e.analise, /De acordo com os resultados acima, Paciente (apresenta dificuldades em|não apresenta dificuldades)/);
  assert.match(e.analise, /\[\[grafico:RAVLT\|Quantidade de palavras\]\]/);
  assert.match(e.procedimento, /- \*\*Escala Wechsler de Inteligência para Adultos WAIS-III;\*\*/);
  assert.match(e.procedimento, /## Instrumentos clínicos complementares/);
  assert.match(e.referencias, /WECHSLER/);
  assert.deepEqual(e.semMapa, []);
});
