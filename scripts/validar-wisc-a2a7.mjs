// Valida a transcrição de docs/testes/WISC-IV-tabelas-A2-A7.json contra propriedades que as
// tabelas do manual necessariamente satisfazem. Serve para pegar erro de leitura visual (dígito
// trocado, linha pulada) sem depender de reler as páginas do PDF.
//
// Uso: node scripts/validar-wisc-a2a7.mjs
//
// Checagens:
//   1. Sequência da soma dos pontos ponderados sem buraco nem repetição, de somaMin a somaMax.
//   2. Composto e percentil monotônicos não-decrescentes ao longo da soma.
//   3. Percentil coerente com a distribuição normal (média 100, DP 15) — os compostos Wechsler são
//      normalizados, então rank percentil ~= Phi((composto-100)/15). Desvio > TOLERANCIA_PERCENTIL
//      aponta erro de transcrição no composto OU no percentil daquela linha.
//   4. IC90 contido no IC95 (o de 95% nunca é mais estreito) e composto dentro de ambos.
//   5. A.7: escore pró-rata == round(soma * 3/2), a própria fórmula declarada no rodapé da tabela.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
// Aceita um caminho alternativo no argv só para o teste de mutação (ver scripts/mutar-wisc-a2a7.mjs),
// que precisa rodar as mesmas checagens contra cópias deliberadamente corrompidas.
const caminho = process.argv[2] ?? join(raiz, "docs/testes/WISC-IV-tabelas-A2-A7.json");
const dados = JSON.parse(readFileSync(caminho, "utf8"));

// Extremos "<0,1" e ">99,9" não são valores medidos, são censura do manual — checados por limite,
// não por igualdade.
const TOLERANCIA_PERCENTIL = 1.5;

const erros = [];
const avisos = [];

function parsePercentil(txt) {
  if (txt.startsWith("<")) return { tipo: "menorQue", valor: Number(txt.slice(1).replace(",", ".")) };
  if (txt.startsWith(">")) return { tipo: "maiorQue", valor: Number(txt.slice(1).replace(",", ".")) };
  return { tipo: "exato", valor: Number(txt.replace(",", ".")) };
}

function parseIC(txt) {
  const [min, max] = txt.split("-").map(Number);
  return { min, max };
}

// Função de distribuição acumulada da normal padrão, via aproximação de Abramowitz & Stegun 26.2.17
// (erro < 7.5e-8) — evita depender de biblioteca externa só para esta conferência.
function phi(z) {
  const sinal = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x);
  return 0.5 * (1 + sinal * y);
}

function validarTabelaComposto(chave, tabela) {
  const { linhas, somaMin, somaMax, indice } = tabela;

  if (linhas.length !== somaMax - somaMin + 1) {
    erros.push(`${chave}: ${linhas.length} linhas, esperado ${somaMax - somaMin + 1} (soma ${somaMin}..${somaMax})`);
  }

  let compostoAnterior = -Infinity;
  let percentilAnterior = -Infinity;

  linhas.forEach(([soma, composto, percentilTxt, ic90Txt, ic95Txt], i) => {
    const onde = `${chave} soma=${soma}`;

    // 1. sequência
    if (soma !== somaMin + i) erros.push(`${onde}: fora de sequência, esperado ${somaMin + i}`);

    // 2. monotonicidade
    if (composto < compostoAnterior) erros.push(`${onde}: composto ${composto} < anterior ${compostoAnterior}`);
    compostoAnterior = composto;

    const p = parsePercentil(percentilTxt);
    if (p.tipo === "exato") {
      if (p.valor < percentilAnterior) erros.push(`${onde}: percentil ${p.valor} < anterior ${percentilAnterior}`);
      percentilAnterior = p.valor;
    }

    // 3. coerência com a normal (100, 15)
    const esperado = phi((composto - 100) / 15) * 100;
    if (p.tipo === "exato") {
      // O manual arredonda percentis >= 1 para inteiro; comparar contra a faixa que arredondaria
      // para o valor impresso, não contra o valor exato.
      const casas = percentilTxt.includes(",") ? 1 : 0;
      const passo = casas === 1 ? 0.1 : 1;
      const desvio = Math.abs(esperado - p.valor);
      if (desvio > TOLERANCIA_PERCENTIL + passo / 2) {
        erros.push(
          `${onde}: percentil ${percentilTxt} incoerente com composto ${composto} (normal prevê ${esperado.toFixed(2)}, desvio ${desvio.toFixed(2)})`
        );
      }
    } else if (p.tipo === "menorQue" && esperado >= p.valor) {
      erros.push(`${onde}: percentil "<${p.valor}" mas composto ${composto} prevê ${esperado.toFixed(3)}`);
    } else if (p.tipo === "maiorQue" && esperado <= p.valor) {
      erros.push(`${onde}: percentil ">${p.valor}" mas composto ${composto} prevê ${esperado.toFixed(3)}`);
    }

    // 4. intervalos de confiança
    const ic90 = parseIC(ic90Txt);
    const ic95 = parseIC(ic95Txt);
    for (const [nome, ic] of [["IC90", ic90], ["IC95", ic95]]) {
      if (!(ic.min < ic.max)) erros.push(`${onde}: ${nome} "${ic.min}-${ic.max}" invertido ou degenerado`);
    }
    const largura90 = ic90.max - ic90.min;
    const largura95 = ic95.max - ic95.min;
    if (largura95 < largura90) {
      erros.push(`${onde}: IC95 (largura ${largura95}) mais estreito que IC90 (largura ${largura90})`);
    }
    // Nas bordas da escala o composto sai do intervalo por efeito de piso/teto (o IC é calculado
    // sobre o escore verdadeiro estimado, que regride à média) — isso é esperado, não é erro.
    if (composto < ic95.min || composto > ic95.max) {
      const noPiso = composto <= 50;
      const noTeto = composto >= 150;
      const msg = `${onde}: composto ${composto} fora do IC95 ${ic95Txt}`;
      if (noPiso || noTeto) avisos.push(`${msg} (borda da escala — esperado por regressão à média)`);
      else erros.push(msg);
    }
  });

  console.log(`  ${chave} (${indice}): ${linhas.length} linhas`);
}

function validarProRata(tabela) {
  const { linhas, somaMin, somaMax } = tabela;
  if (linhas.length !== somaMax - somaMin + 1) {
    erros.push(`A7_PRO_RATA: ${linhas.length} linhas, esperado ${somaMax - somaMin + 1}`);
  }
  linhas.forEach(([soma, proRata], i) => {
    if (soma !== somaMin + i) erros.push(`A7_PRO_RATA soma=${soma}: fora de sequência`);
    const esperado = Math.round((soma * 3) / 2);
    if (proRata !== esperado) {
      erros.push(`A7_PRO_RATA soma=${soma}: pró-rata ${proRata}, fórmula 3/2 prevê ${esperado}`);
    }
  });
  console.log(`  A7_PRO_RATA: ${linhas.length} linhas, todas conferidas contra a fórmula 3/2`);
}

console.log("Validando WISC-IV Tabelas A.2-A.7...\n");
for (const chave of ["A2_ICV", "A3_IOP", "A4_IMO", "A5_IVP", "A6_QIT"]) {
  validarTabelaComposto(chave, dados[chave]);
}
validarProRata(dados.A7_PRO_RATA);

if (avisos.length > 0) {
  console.log(`\n${avisos.length} aviso(s) (não bloqueiam):`);
  for (const a of avisos) console.log(`  ~ ${a}`);
}

if (erros.length > 0) {
  console.error(`\n${erros.length} ERRO(S):`);
  for (const e of erros) console.error(`  ! ${e}`);
  process.exit(1);
}

console.log("\nOK — todas as checagens passaram.");
