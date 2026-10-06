// Extrai as tabelas normativas do FDT (Teste dos Cinco Dígitos) da aba "FDT - NORMAS" do Excel
// legado da psicóloga e gera docs/testes/FDT-tabelas.json.
//
// FONTE ÚNICA: ao contrário do BRIEF2/WISC-IV, não temos o manual em PDF para o FDT — a aba da
// psicóloga é a única fonte. Ver [[project_neurologic_riscos_normas]] (memória do usuário).
//
// Uso:
//   node scripts/extrair-normas-fdt.mjs "<caminho do .xlsm>" [--saida <arquivo.json>]
//
// LAYOUT DA ABA (conferido célula a célula na extração, 05/10/2026):
//
//   9 faixas etárias lado a lado (Tabelas 6.3 a 6.11 — a 6.2 é só estatística descritiva da
//   amostra inteira, sem matriz de classificação, por isso é ignorada aqui). Cada faixa tem duas
//   seções empilhadas nas MESMAS colunas: TEMPO (6 subtestes: Leitura, Contagem, Escolha,
//   Alternância, Inibição, Flexibilidade) e ERROS (4 subtestes: Leitura, Contagem, Escolha,
//   Alternância — Inibição/Flexibilidade não têm contagem de erro própria).
//
//   Cada seção é uma matriz de classificação bruto -> percentil: o bruto (tempo em segundos, ou
//   nº de erros) é literalmente o valor da célula, crescendo 1 a 1 a cada linha; a faixa de
//   percentil (">95", "95" exato, "> 75 < 95", "75" exato, ...) é lida da coluna de rótulo. Um
//   subteste aparece em branco nas linhas em que seu próprio valor já passou da faixa atual (outro
//   subteste mais lento ainda está subindo) — ou seja, por subteste, a sequência de valores
//   NÃO-vazios é contígua (sobe 1 a 1 sem buraco), mesmo que a linha do Excel pule.
//
//   TEMPO: a coluna de rótulo é a PRIMEIRA coluna do próprio bloco da faixa etária (repetida em
//   toda linha). ERROS: a coluna de rótulo é SÓ a coluna 0 da aba inteira (compartilhada por
//   todas as faixas etárias ao mesmo tempo) — os blocos de ERROS não repetem o rótulo na própria
//   coluna. Essa assimetria é real na planilha, não bug de leitura.
//
//   11 rótulos possíveis por subteste: ">95", "95" (percentil exato), "> 75 < 95", "75", "> 50 <
//   75", "50", "> 25 < 50", "25", "> 5 < 25", "5", "< 5". Decisão do usuário (05/10/2026): manter
//   os 11 como rótulos próprios, não mesclar o valor exato na faixa aberta vizinha.

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { abrirPlanilha } from "./lib/xlsx.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const ABA = "FDT - NORMAS";

const SUBTESTES_TEMPO = ["leitura", "contagem", "escolha", "alternancia", "inibicao", "flexibilidade"];
const SUBTESTES_ERRO = ["leitura", "contagem", "escolha", "alternancia"];

function normalizar(s) {
  return (s ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

const NOME_PARA_CHAVE = {
  leitura: "leitura",
  contagem: "contagem",
  escolha: "escolha",
  alternancia: "alternancia", // "Alternância"
  inibicao: "inibicao", // "Inibição"
  flexibilidade: "flexibilidade",
};

const erros = [];
const avisos = [];

function celula(matriz, linha, coluna) {
  return (matriz[linha]?.[coluna] ?? "").toString().trim();
}

/** Acha, em `linhaTitulos`, as colunas onde começa cada "Tabela 6.N" (N=3..11) e a faixa etária
 * declarada na linha seguinte (ex.: "Dados normativos para crianças de 6 a 8 anos (N=44)"). */
function acharFaixasEtarias(matriz) {
  const LINHA_TITULO = 2;
  const LINHA_DESCRICAO = 3;
  const faixas = [];
  const totalColunas = Math.max(...matriz.map((l) => l.length));

  for (let col = 0; col < totalColunas; col++) {
    const titulo = celula(matriz, LINHA_TITULO, col);
    const m = /^Tabela 6\.(\d+)$/.exec(titulo);
    if (!m || m[1] === "2") continue; // 6.2 = amostra inteira, sem matriz de classificação

    const desc = celula(matriz, LINHA_DESCRICAO, col);
    const nAmostra = /N=(\d+)/.exec(desc)?.[1];
    const fechada = /de (\d+) a (\d+) anos/.exec(desc);
    const aberta = /de (\d+) ou mais anos/.exec(desc);
    if (!fechada && !aberta) {
      erros.push(`Tabela 6.${m[1]} (col ${col}): não consegui ler a faixa etária em "${desc}"`);
      continue;
    }
    faixas.push({
      tabela: `6.${m[1]}`,
      blockCol: col,
      faixaMin: Number((fechada ?? aberta)[1]),
      faixaMax: fechada ? Number(fechada[2]) : null,
      n: nAmostra ? Number(nAmostra) : null,
      descricao: desc,
    });
  }
  faixas.sort((a, b) => a.faixaMin - b.faixaMin);
  return faixas;
}

/** Lê uma matriz de classificação (bruto -> percentil) de uma seção (TEMPO ou ERROS).
 *
 * @param labelCol coluna de onde ler o rótulo de percentil em cada linha (TEMPO: a própria coluna
 *   do bloco; ERROS: sempre a coluna 0, compartilhada).
 * @param primeiraColunaDado coluna do 1º subteste (os demais são colunas seguintes, uma por
 *   subteste, na ordem de `subtestes`).
 */
function lerSecaoClassificacao(matriz, { linhaInicio, linhaFim, labelCol, primeiraColunaDado, subtestes, rotuloSecao }) {
  const porSubteste = {};

  for (let i = 0; i < subtestes.length; i++) {
    const nomeSubteste = subtestes[i];
    const col = primeiraColunaDado + i;
    const pontos = [];

    for (let linha = linhaInicio; linha < linhaFim; linha++) {
      const valorTexto = celula(matriz, linha, col);
      if (valorTexto === "") continue;
      // "x"/"X" é marca de fim-de-dados posta à mão logo depois do último bruto real da coluna —
      // não é bruto nenhum. Encerra a leitura desta coluna (não é erro).
      if (/^x$/i.test(valorTexto)) break;
      const bruto = Number(valorTexto);
      const rotulo = celula(matriz, linha, labelCol);
      if (!Number.isFinite(bruto)) {
        erros.push(`${rotuloSecao}/${nomeSubteste}: valor não-numérico "${valorTexto}" na linha ${linha}`);
        continue;
      }
      if (!rotulo) {
        erros.push(`${rotuloSecao}/${nomeSubteste}: bruto=${bruto} (linha ${linha}) sem rótulo de percentil`);
        continue;
      }
      pontos.push({ bruto, rotulo, linha });
    }

    if (pontos.length === 0) {
      avisos.push(`${rotuloSecao}/${nomeSubteste}: nenhum ponto encontrado (seção pode não existir para este subteste/faixa)`);
      porSubteste[nomeSubteste] = [];
      continue;
    }

    // Guarda estrutural: por subteste, o bruto deveria subir 1 a 1. Quando pula, só é uma
    // ambiguidade de verdade (ERRO) se o rótulo muda nos dois lados do buraco — aí não dá pra
    // saber onde cai a fronteira. Buraco com o MESMO rótulo dos dois lados (omissão pontual da
    // planilha dela) é só AVISO: o valor que falta ficaria na mesma faixa de qualquer jeito.
    for (let k = 1; k < pontos.length; k++) {
      if (pontos[k].bruto === pontos[k - 1].bruto + 1) continue;
      const msg = `${rotuloSecao}/${nomeSubteste}: bruto pula de ${pontos[k - 1].bruto} (linha ${pontos[k - 1].linha}) para ${pontos[k].bruto} (linha ${pontos[k].linha}) — esperava ${pontos[k - 1].bruto + 1}`;
      if (pontos[k].rotulo === pontos[k - 1].rotulo) avisos.push(`${msg} (mesmo rótulo "${pontos[k].rotulo}" dos dois lados — não afeta a faixa)`);
      else erros.push(`${msg} (rótulo muda de "${pontos[k - 1].rotulo}" para "${pontos[k].rotulo}" no meio do buraco — fronteira ambígua)`);
    }
    if (pontos[0].bruto !== 0) {
      avisos.push(`${rotuloSecao}/${nomeSubteste}: 1º bruto é ${pontos[0].bruto}, não 0`);
    }

    // Agrupa em faixas (min/max) por sequência de rótulo idêntico.
    const faixas = [];
    for (const p of pontos) {
      const ultima = faixas[faixas.length - 1];
      if (ultima && ultima.percentil === p.rotulo) ultima.max = p.bruto;
      else faixas.push({ min: p.bruto, max: p.bruto, percentil: p.rotulo });
    }
    // A última faixa (pior desempenho) fica em aberto: um bruto mais alto que o maior já tabulado
    // continua sendo "pior que todos os tabulados", não "fora de faixa".
    const piorFaixa = faixas[faixas.length - 1];
    if (piorFaixa.percentil !== "< 5") {
      avisos.push(`${rotuloSecao}/${nomeSubteste}: última faixa é "${piorFaixa.percentil}", esperava "< 5" — não deixei em aberto, confira`);
    } else {
      delete piorFaixa.max;
    }

    porSubteste[nomeSubteste] = faixas;
  }

  return porSubteste;
}

function acharLinha(matriz, coluna, textoEsperado, linhaAPartirDe, { opcional = false } = {}) {
  for (let linha = linhaAPartirDe; linha < matriz.length; linha++) {
    if (celula(matriz, linha, coluna) === textoEsperado) return linha;
  }
  if (!opcional) erros.push(`não achei "${textoEsperado}" na coluna ${coluna} a partir da linha ${linhaAPartirDe}`);
  return -1;
}

function main() {
  const args = process.argv.slice(2);
  const caminho = args[0];
  const caminhoSaida = args.includes("--saida") ? args[args.indexOf("--saida") + 1] : join(RAIZ, "docs/testes/FDT-tabelas.json");
  if (!caminho) {
    console.error('uso: node scripts/extrair-normas-fdt.mjs "<arquivo.xlsm>" [--saida <arquivo.json>]');
    process.exit(1);
  }

  const matriz = abrirPlanilha(caminho).ler(ABA);
  const faixasEtarias = acharFaixasEtarias(matriz);
  console.log(`${faixasEtarias.length} faixas etárias encontradas (esperado: 9)\n`);

  // Marcos GLOBAIS (coluna 0), compartilhados por todas as faixas etárias.
  const linhaTEMPO = acharLinha(matriz, 0, "TEMPO", 0);
  const linhaERROS = acharLinha(matriz, 0, "ERROS", linhaTEMPO + 1);

  const saida = {
    _fonte:
      "Sedó, M. A. Five Digit Test (FDT): manual. Madrid: TEA Ediciones, 2007. " +
      "Transcrito em 05/10/2026 da aba 'FDT - NORMAS' do Excel legado da psicóloga " +
      "(arquivo 'Diego de Melo.xlsm', Tabelas 6.3 a 6.11 — a 6.2, amostra inteira, não tem " +
      "matriz de classificação). SEM CONFERÊNCIA CONTRA O MANUAL IMPRESSO — não temos o PDF " +
      "do FDT no acervo; esta é fonte única (ver project_neurologic_riscos_normas na memória).",
    _rotulos_percentil: [">95", "95", "> 75 < 95", "75", "> 50 < 75", "50", "> 25 < 50", "25", "> 5 < 25", "5", "< 5"],
    faixasEtarias: [],
  };

  for (const faixa of faixasEtarias) {
    const rotuloFaixa = `Tabela ${faixa.tabela} (${faixa.faixaMin}-${faixa.faixaMax ?? "+"})`;

    // --- TEMPO: rótulo é a própria coluna do bloco (blockCol); dados em blockCol+1..+6 ---
    const headerTempo = acharLinha(matriz, faixa.blockCol, "Percentil", linhaTEMPO + 1);
    const mediaTempo = acharLinha(matriz, faixa.blockCol, "Média", headerTempo + 1);
    const tempo =
      headerTempo === -1 || mediaTempo === -1
        ? {}
        : lerSecaoClassificacao(matriz, {
            linhaInicio: headerTempo + 1,
            linhaFim: mediaTempo,
            labelCol: faixa.blockCol,
            primeiraColunaDado: faixa.blockCol + 1,
            subtestes: SUBTESTES_TEMPO,
            rotuloSecao: `${rotuloFaixa}/TEMPO`,
          });

    // --- ERROS: rótulo é SEMPRE a coluna 0 (compartilhada); dados em blockCol+1..+4 ---
    const headerErros = acharLinha(matriz, faixa.blockCol, "Percentil", linhaERROS + 1);
    const mediaErros = acharLinha(matriz, 0, "Média", linhaERROS + 1);
    const erro =
      headerErros === -1 || mediaErros === -1
        ? {}
        : lerSecaoClassificacao(matriz, {
            linhaInicio: headerErros + 1,
            linhaFim: mediaErros,
            labelCol: 0,
            primeiraColunaDado: faixa.blockCol + 1,
            subtestes: SUBTESTES_ERRO,
            rotuloSecao: `${rotuloFaixa}/ERROS`,
          });

    saida.faixasEtarias.push({
      tabela: faixa.tabela,
      faixaMin: faixa.faixaMin,
      faixaMax: faixa.faixaMax,
      n: faixa.n,
      descricao: faixa.descricao,
      tempo,
      erros: erro,
    });
  }

  writeFileSync(caminhoSaida, JSON.stringify(saida, null, 2) + "\n", "utf8");
  console.log(`Gravado em ${caminhoSaida}`);

  if (avisos.length > 0) {
    console.log(`\n${avisos.length} aviso(s):`);
    for (const a of avisos) console.log(`  ~ ${a}`);
  }
  if (erros.length > 0) {
    console.error(`\n${erros.length} ERRO(S):`);
    for (const e of erros) console.error(`  ! ${e}`);
    process.exit(1);
  }
  console.log("\nOK — sem erros estruturais.");
}

main();
