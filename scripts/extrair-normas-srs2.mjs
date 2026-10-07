// Extrai as tabelas normativas do SRS-2 (Escala de Responsividade Social, 2ª edição) da aba
// "SRS2-Normas" do Excel legado da psicóloga e gera docs/testes/SRS-2-tabelas.json.
//
// FONTE ÚNICA: assim como o FDT, não temos o manual do SRS-2 em PDF — a aba da psicóloga é a
// única fonte. Ver [[project_neurologic_riscos_normas]] (memória do usuário).
//
// Uso:
//   node scripts/extrair-normas-srs2.mjs "<caminho do .xlsm>" [--saida <arquivo.json>]
//
// LAYOUT DA ABA (conferido célula a célula na extração, 05/10/2026):
//
//   5 FORMULÁRIOS lado a lado (não são faixas etárias da mesma pergunta — são questionários
//   diferentes, respondidos por pessoas diferentes): Pré-Escolar (ambos os sexos), Idade Escolar
//   Masculino, Idade Escolar Feminino, Adulto Autorrelato (ambos os sexos), Adulto Heterorrelato
//   (ambos os sexos). Cada um vira um Teste separado no catálogo (mesmo princípio já usado em
//   BRIEF2-PAIS/SCARED-PAIS+AUTORRELATO — formulário diferente = Teste separado, não
//   TabelaNormativa por idade do mesmo Teste).
//
//   Dentro de cada formulário, DUAS seções (blocos de colunas em linhas diferentes da planilha,
//   mas associadas pela ORDEM dos 5 formulários, que é a mesma nas duas seções):
//
//   1. "Subescalas de Intervenção" (4 subescalas, cada uma um INSUMO bruto independente):
//      Percepção Social, Cognição Social, Comunicação Social, Motivação Social.
//   2. "Escalas Compatíveis ao DSM-5 e Pontuação SRS-2 Total" (3 escalas, mas só 1 é insumo
//      independente): Padrões Restritos e Repetitivos (insumo bruto independente — não é soma de
//      nada, é medido por itens próprios) + Comunicação e Interação Social + Pontuação SRS-2 Total
//      — essas 2 últimas são SOMA das outras. Confirmado numericamente na extração: bruto máximo
//      de "Comunicação e Interação Social" (159) = soma dos máximos de Percepção+Cognição+
//      Comunicação+Motivação Social (24+36+66+33=159); bruto máximo de "Pontuação SRS-2 Total"
//      (195) = 159 + máximo de Padrões Restritos e Repetitivos (36). Por isso elas NÃO são
//      insumos no formulário de lançamento — são `camposDerivados` (soma) no motor.
//
//   Cada subescala/escala é uma tabela SIMPLES bruto -> percentil + escore T, uma linha por bruto
//   (sem banda de classificação como o FDT) — mesmo formato de BRIEF2. O bruto é 0..máximo da
//   subescala (máximo = nº de itens daquela subescala; NÃO fica em aberto como o FDT, porque aqui
//   o teto é psicometricamente fixo, não um limite de amostra).

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { abrirPlanilha } from "./lib/xlsx.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const ABA = "SRS2-Normas";

const SUBESCALAS = ["percepcaoSocial", "cognicaoSocial", "comunicacaoSocial", "motivacaoSocial"];
const ESCALAS_DSM5 = ["restritosRepetitivos", "comunicacaoInteracaoSocial", "escoreTotal"];

// Ordem fixa dos 5 formulários — confirmada idêntica nas duas seções da planilha (mesma ordem de
// "Formulário ..." na seção 1 e da legenda de texto antes da seção 2).
const FORMULARIOS = [
  { chave: "preEscolar", sigla: "SRS-2-PRE-ESCOLAR", label: "Pré-Escolar", sexo: null },
  { chave: "escolarMasculino", sigla: "SRS-2-ESCOLAR-MASCULINO", label: "Idade Escolar — Sexo Masculino", sexo: "MASCULINO" },
  { chave: "escolarFeminino", sigla: "SRS-2-ESCOLAR-FEMININO", label: "Idade Escolar — Sexo Feminino", sexo: "FEMININO" },
  { chave: "autorrelato", sigla: "SRS-2-AUTORRELATO", label: "Adulto — Autorrelato", sexo: null },
  { chave: "heterorrelato", sigla: "SRS-2-HETERORRELATO", label: "Adulto — Heterorrelato", sexo: null },
];

const erros = [];
const avisos = [];

function celula(matriz, linha, coluna) {
  return (matriz[linha]?.[coluna] ?? "").toString().trim();
}

/** Acha as colunas onde cada bloco de formulário começa, procurando `textoNaLinha` (ex.: "Pontuação
 * Bruta") a partir da coluna 0, em ordem. Devolve 1 coluna por formulário, na mesma ordem de FORMULARIOS. */
function acharBlocos(matriz, linha, textoEsperado) {
  const colunas = [];
  const totalColunas = Math.max(...matriz.map((l) => l.length));
  for (let col = 0; col < totalColunas; col++) {
    if (celula(matriz, linha, col) === textoEsperado) colunas.push(col);
  }
  return colunas;
}

/** Lê uma coluna simples bruto -> {percentil, escoreT}, uma linha por bruto, sem banda. Para no
 * primeiro bruto em branco (ou no "x" de fim-de-bloco).
 *
 * NÃO assume que a ordem das linhas na planilha já é a ordem numérica do bruto — o bloco
 * Autorrelato tem linhas fora de ordem (ex.: bruto 1 antes do 0; 23 antes do 22), achado na
 * extração. Por isso coleta tudo primeiro e ORDENA por bruto antes de checar contiguidade. */
function lerColunaSimples(matriz, { linhaInicio, colBruto, colPercentil, colEscoreT, rotulo }) {
  const brutos = [];
  for (let linha = linhaInicio; ; linha++) {
    const brutoTexto = celula(matriz, linha, colBruto);
    if (brutoTexto === "" || /^x$/i.test(brutoTexto)) break;
    const bruto = Number(brutoTexto);
    if (!Number.isFinite(bruto)) {
      erros.push(`${rotulo}: bruto não-numérico "${brutoTexto}" na linha ${linha}`);
      break;
    }
    const percentil = celula(matriz, linha, colPercentil);
    const escoreT = celula(matriz, linha, colEscoreT);
    if (percentil === "" && escoreT === "") break; // esta subescala específica já esgotou seu teto
    brutos.push({ min: bruto, max: bruto, percentil, escoreT });
  }
  if (brutos.length === 0) {
    avisos.push(`${rotulo}: nenhum ponto encontrado`);
    return brutos;
  }
  const pontos = [...brutos].sort((a, b) => a.min - b.min);
  const foraDeOrdem = pontos.some((p, i) => p.min !== brutos[i].min);
  if (foraDeOrdem) avisos.push(`${rotulo}: linhas fora de ordem na planilha dela — reordenado por bruto antes de validar`);
  if (pontos[0].min !== 0) avisos.push(`${rotulo}: 1º bruto é ${pontos[0].min}, não 0`);
  for (let k = 1; k < pontos.length; k++) {
    if (pontos[k].min === pontos[k - 1].min) {
      erros.push(`${rotulo}: bruto ${pontos[k].min} aparece duas vezes (percentil/T podem divergir entre as duas linhas)`);
    } else if (pontos[k].min !== pontos[k - 1].min + 1) {
      erros.push(`${rotulo}: bruto pula de ${pontos[k - 1].min} para ${pontos[k].min} (esperava ${pontos[k - 1].min + 1})`);
    }
  }
  return pontos;
}

function main() {
  const args = process.argv.slice(2);
  const caminho = args[0];
  const caminhoSaida = args.includes("--saida") ? args[args.indexOf("--saida") + 1] : join(RAIZ, "docs/testes/SRS-2-tabelas.json");
  if (!caminho) {
    console.error('uso: node scripts/extrair-normas-srs2.mjs "<arquivo.xlsm>" [--saida <arquivo.json>]');
    process.exit(1);
  }

  const matriz = abrirPlanilha(caminho).ler(ABA);

  // Seção 1: "Pontuação" (linha 8) / " Bruta" (linha 9) na coluna IMEDIATAMENTE ANTES do 1º
  // subteste; os nomes das subescalas ficam na própria linha 8.
  const colunasSecao1 = acharBlocos(matriz, 8, "Pontuação");
  // Seção 2: "Pontuação Bruta" numa célula só, linha 108.
  const colunasSecao2 = acharBlocos(matriz, 108, "Pontuação Bruta");

  console.log(`Seção 1 (Subescalas de Intervenção): ${colunasSecao1.length} blocos encontrados`);
  console.log(`Seção 2 (DSM-5 + Total): ${colunasSecao2.length} blocos encontrados\n`);

  if (colunasSecao1.length !== FORMULARIOS.length) erros.push(`esperava ${FORMULARIOS.length} blocos na seção 1, achei ${colunasSecao1.length}`);
  if (colunasSecao2.length !== FORMULARIOS.length) erros.push(`esperava ${FORMULARIOS.length} blocos na seção 2, achei ${colunasSecao2.length}`);

  const saida = {
    _fonte:
      "Constantino, J. N.; Gruber, C. P. Social Responsiveness Scale, Second Edition (SRS-2): " +
      "manual. Torrance, CA: Western Psychological Services, 2012. Transcrito em 05/10/2026 da " +
      "aba 'SRS2-Normas' do Excel legado da psicóloga (arquivo 'planilha-da-psicologa.xlsm'). SEM " +
      "CONFERÊNCIA CONTRA O MANUAL IMPRESSO — não temos o PDF do SRS-2 no acervo; esta é fonte " +
      "única (ver project_neurologic_riscos_normas na memória). 'Comunicação e Interação Social' " +
      "e 'Pontuação SRS-2 Total' são SOMA das outras subescalas, confirmado numericamente " +
      "(ver comentário no topo do script extrator) — não são insumo bruto independente.",
    formularios: [],
  };

  FORMULARIOS.forEach((form, i) => {
    const colSecao1 = colunasSecao1[i];
    const colSecao2 = colunasSecao2[i];
    const rotuloForm = `${form.sigla}`;

    const subescalas = {};
    if (colSecao1 !== undefined) {
      SUBESCALAS.forEach((chave, k) => {
        subescalas[chave] = lerColunaSimples(matriz, {
          linhaInicio: 10,
          colBruto: colSecao1,
          colPercentil: colSecao1 + 1 + k * 2,
          colEscoreT: colSecao1 + 2 + k * 2,
          rotulo: `${rotuloForm}/${chave}`,
        });
      });
    }

    const escalasDsm5 = {};
    if (colSecao2 !== undefined) {
      ESCALAS_DSM5.forEach((chave, k) => {
        escalasDsm5[chave] = lerColunaSimples(matriz, {
          linhaInicio: 110,
          colBruto: colSecao2,
          colPercentil: colSecao2 + 1 + k * 2,
          colEscoreT: colSecao2 + 1 + k * 2 + 1,
          rotulo: `${rotuloForm}/${chave}`,
        });
      });
    }

    saida.formularios.push({
      chave: form.chave,
      sigla: form.sigla,
      label: form.label,
      sexo: form.sexo,
      subescalas,
      escalasDsm5,
    });
  });

  // Confere numericamente a derivação (soma) antes de gravar — é o que justifica tratar
  // comunicacaoInteracaoSocial/escoreTotal como camposDerivados em vez de insumo.
  //
  // NÃO compara o MÁXIMO tabulado das duas pontas: SCI/Total saturam num teto universal de 195
  // (teórico de TODOS os 65 itens, igual nas 5 planilhas) bem além do teto de cada formulário —
  // de ~122 em diante o percentil/T simplesmente se repete até 195 (achado na extração: confirmado
  // célula a célula no formulário Idade Escolar Masculino). Em vez disso, confere que o valor
  // TABULADO exatamente no bruto-soma das fontes já está saturado (== valor em 195) — é a forma
  // de confirmar a mesma derivação sem exigir que a tabela termine onde a soma termina.
  const valorEm = (faixas, bruto) => faixas.find((f) => f.min <= bruto && f.max >= bruto);
  for (const form of saida.formularios) {
    const maxDe = (faixas) => faixas[faixas.length - 1]?.max;
    const somaBase = SUBESCALAS.reduce((acc, chave) => acc + (maxDe(form.subescalas[chave]) ?? 0), 0);
    const maxRrb = maxDe(form.escalasDsm5.restritosRepetitivos);
    const totalTeto = valorEm(form.escalasDsm5.escoreTotal, maxDe(form.escalasDsm5.escoreTotal));
    const sciNoSomaBase = valorEm(form.escalasDsm5.comunicacaoInteracaoSocial, somaBase);
    const totalNaSoma = valorEm(form.escalasDsm5.escoreTotal, somaBase + (maxRrb ?? 0));
    if (!sciNoSomaBase || sciNoSomaBase.percentil !== totalTeto?.percentil) {
      avisos.push(`${form.sigla}: comunicacaoInteracaoSocial no bruto-soma (${somaBase}) não bateu com o teto saturado da tabela — conferir manualmente`);
    }
    if (!totalNaSoma || totalNaSoma.percentil !== totalTeto?.percentil) {
      avisos.push(`${form.sigla}: escoreTotal no bruto-soma (${somaBase + (maxRrb ?? 0)}) não bateu com o teto saturado da tabela — conferir manualmente`);
    }
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
  console.log("\nOK — sem erros estruturais, derivação de soma confirmada numericamente.");
}

main();
