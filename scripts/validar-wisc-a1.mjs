// Valida a transcrição de docs/testes/WISC-IV-tabelas-A1.json (bruto -> ponto ponderado, 33 faixas
// etárias x 15 subtestes, ~9.400 valores) contra propriedades que uma tabela de conversão Wechsler
// necessariamente satisfaz. É a conferência que faltava: as A.2-A.7 podem ser checadas contra a
// distribuição normal, mas as A.1.x não têm essa estrutura — o que elas têm é geometria.
//
// Uso: node scripts/validar-wisc-a1.mjs
//
// Checagens:
//   1. TILING — para cada subteste/faixa etária, os intervalos de escore bruto têm que ladrilhar
//      a reta sem buraco nem sobreposição, em ordem crescente de ponto ponderado. Um dígito
//      trocado numa borda quase sempre quebra isso (vira buraco ou sobreposição).
//   2. PISO — o intervalo de menor ponderado começa em 0 (todo subteste admite escore bruto 0).
//   3. TETO POR SUBTESTE — o maior escore bruto possível é uma propriedade do subteste (número de
//      itens), não da idade: tem que ser o mesmo nas 33 faixas etárias. Exceção real, não erro de
//      transcrição: Código e Procurar Símbolos têm DUAS FORMAS (A para 6-7 anos, B para 8-16), com
//      número de itens diferente — a troca acontece exatamente em 8:0 e está declarada em
//      TROCA_DE_FORMA abaixo. Foi essa checagem que revelou a troca de forma nos dados.
//   4. PONDERADOS PRESENTES — os pontos ponderados usados ficam dentro de 1..19 e não se repetem.
//   5. MONOTONICIDADE ETÁRIA — para um mesmo subteste e ponderado, o corte de escore bruto não
//      deve CAIR conforme a idade sobe (criança mais velha precisa de igual ou mais pontos brutos
//      para o mesmo escore ponderado — é o que "normatizado por idade" significa). Reportado como
//      AVISO, não erro: perto do piso/teto da escala a amostra normativa produz platôs e pequenas
//      inversões legítimas.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const caminho = process.argv[2] ?? join(raiz, "docs/testes/WISC-IV-tabelas-A1.json");
const dados = JSON.parse(readFileSync(caminho, "utf8"));

const erros = [];
const avisos = [];

const SUBTESTES = [...dados._subtestes_principais, ...dados._subtestes_suplementares];
const FAIXAS = Object.keys(dados.faixas);

// Índice da faixa etária em que o subteste troca de forma (e portanto de número de itens e de
// curva bruto->ponderado). Conferido na Tabela A.1.7 (p.224, 8:0-8:3), onde CD já vai até 119 e
// PS até 60, contra 65 e 45 nas faixas de 6-7 anos. Índice 6 = "8:0-8:3", a 7ª das 33 faixas.
const INDICE_8_ANOS = FAIXAS.indexOf("8:0-8:3");
const TROCA_DE_FORMA = {
  CD: { indice: INDICE_8_ANOS, nota: "Código A (6-7 anos, teto 65) -> Código B (8-16 anos, teto 119)" },
  PS: { indice: INDICE_8_ANOS, nota: "Procurar Símbolos Forma A (6-7, teto 45) -> Forma B (8-16, teto 60)" },
};

// "4-6" -> {min:4,max:6}; "0" -> {min:0,max:0}; "-" -> null
function intervalo(texto) {
  const limpo = String(texto).trim();
  if (limpo === "" || limpo === "-") return null;
  const [a, b] = limpo.split("-");
  const min = Number(a);
  const max = b === undefined ? min : Number(b);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { invalido: limpo };
  return { min, max };
}

// --- 1-4: checagens dentro de cada subteste x faixa etária ---

const tetoPorSubteste = new Map(); // sigla -> { teto, faixaOnde }

for (const [indiceFaixa, faixaLabel] of FAIXAS.entries()) {
  const tabela = dados.faixas[faixaLabel];

  for (const sigla of SUBTESTES) {
    const coluna = tabela[sigla];
    if (!coluna) {
      erros.push(`${faixaLabel} / ${sigla}: coluna ausente`);
      continue;
    }

    const ponderados = Object.keys(coluna)
      .map(Number)
      .sort((a, b) => a - b);

    // 4. ponderados dentro de 1..19
    for (const p of ponderados) {
      if (!Number.isInteger(p) || p < 1 || p > 19) {
        erros.push(`${faixaLabel} / ${sigla}: ponto ponderado inválido "${p}"`);
      }
    }

    const presentes = [];
    for (const p of ponderados) {
      const iv = intervalo(coluna[String(p)]);
      if (iv === null) continue;
      if (iv.invalido !== undefined) {
        erros.push(`${faixaLabel} / ${sigla} / ponderado ${p}: valor não parseável "${iv.invalido}"`);
        continue;
      }
      if (iv.min > iv.max) {
        erros.push(`${faixaLabel} / ${sigla} / ponderado ${p}: intervalo invertido ${iv.min}-${iv.max}`);
        continue;
      }
      presentes.push({ ponderado: p, ...iv });
    }

    if (presentes.length === 0) {
      erros.push(`${faixaLabel} / ${sigla}: nenhum intervalo de escore bruto`);
      continue;
    }

    // 2. piso em 0
    if (presentes[0].min !== 0) {
      erros.push(
        `${faixaLabel} / ${sigla}: menor intervalo começa em ${presentes[0].min}, esperado 0 (ponderado ${presentes[0].ponderado})`
      );
    }

    // 1. tiling: fim de um intervalo + 1 == início do próximo
    for (let i = 1; i < presentes.length; i++) {
      const ant = presentes[i - 1];
      const at = presentes[i];
      if (at.min !== ant.max + 1) {
        const tipo = at.min > ant.max + 1 ? "BURACO" : "SOBREPOSIÇÃO";
        erros.push(
          `${faixaLabel} / ${sigla}: ${tipo} entre ponderado ${ant.ponderado} (${ant.min}-${ant.max}) e ${at.ponderado} (${at.min}-${at.max})`
        );
      }
    }

    // 3. teto consistente dentro de cada forma do subteste
    const teto = presentes[presentes.length - 1].max;
    const troca = TROCA_DE_FORMA[sigla];
    // Subteste com duas formas tem dois "grupos de teto": antes e a partir da troca.
    const grupo = troca && indiceFaixa >= troca.indice ? `${sigla}#B` : sigla;
    const registrado = tetoPorSubteste.get(grupo);
    if (registrado === undefined) {
      tetoPorSubteste.set(grupo, { teto, faixaOnde: faixaLabel });
    } else if (registrado.teto !== teto) {
      erros.push(
        `${sigla}: teto de escore bruto ${teto} em ${faixaLabel}, mas ${registrado.teto} em ${registrado.faixaOnde} — o número de itens do subteste não muda com a idade${troca ? ` dentro da mesma forma (${troca.nota})` : ""}`
      );
    }
  }
}

// --- 5. monotonicidade etária (aviso) ---

for (const sigla of SUBTESTES) {
  for (let p = 1; p <= 19; p++) {
    let anterior = null;
    for (const [indiceFaixa, faixaLabel] of FAIXAS.entries()) {
      // Na faixa em que o subteste troca de forma a curva reinicia — comparar contra a forma
      // anterior não diz nada, são instrumentos diferentes.
      if (TROCA_DE_FORMA[sigla]?.indice === indiceFaixa) anterior = null;
      const iv = intervalo(dados.faixas[faixaLabel]?.[sigla]?.[String(p)] ?? "-");
      if (iv === null || iv.invalido !== undefined) continue;
      if (anterior !== null && iv.min < anterior.min) {
        avisos.push(
          `${sigla} / ponderado ${p}: corte cai de ${anterior.min} (${anterior.faixaLabel}) para ${iv.min} (${faixaLabel})`
        );
      }
      anterior = { ...iv, faixaLabel };
    }
  }
}

// --- relatório ---

console.log(`Validando WISC-IV Tabelas A.1.x — ${FAIXAS.length} faixas etárias x ${SUBTESTES.length} subtestes\n`);

let celulas = 0;
for (const faixaLabel of FAIXAS) {
  for (const sigla of SUBTESTES) {
    celulas += Object.keys(dados.faixas[faixaLabel]?.[sigla] ?? {}).length;
  }
}
console.log(`  ${celulas} células conferidas`);
console.log(`  tetos por subteste: ${[...tetoPorSubteste].map(([s, { teto }]) => `${s}=${teto}`).join(", ")}`);

if (avisos.length > 0) {
  console.log(`\n${avisos.length} aviso(s) de monotonicidade etária (não bloqueiam — platôs perto do piso/teto são esperados):`);
  for (const a of avisos.slice(0, 20)) console.log(`  ~ ${a}`);
  if (avisos.length > 20) console.log(`  ... e mais ${avisos.length - 20}`);
}

if (erros.length > 0) {
  console.error(`\n${erros.length} ERRO(S):`);
  for (const e of erros) console.error(`  ! ${e}`);
  process.exit(1);
}

console.log("\nOK — todas as checagens estruturais passaram.");
