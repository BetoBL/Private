// Extrai abas de um .xlsx/.xlsm para CSV. Feito para ingerir as tabelas normativas do sistema
// Excel legado da psicóloga, que é a fonte mais barata de dado normativo que temos (já digitado).
//
// Uso:
//   node scripts/extrair-normas-excel.mjs <arquivo.xlsm> --listar
//   node scripts/extrair-normas-excel.mjs <arquivo.xlsm> --aba "BRIEF2-Normas" [--saida <dir>]
//   node scripts/extrair-normas-excel.mjs <arquivo.xlsm> --todas-normas [--saida <dir>]
//
// PROTEÇÃO DE DADO PESSOAL (LGPD + sigilo profissional): os arquivos reais da psicóloga são
// protocolos de pacientes — trazem nome, data de nascimento e resultados clínicos nas abas de
// lançamento. Só as abas de NORMA interessam aqui (tabela de conversão é dado factual do
// instrumento, não do paciente). Por isso:
//   - `--todas-normas` só pega abas cujo nome casa com /norma|nomas/i (mais ROSETTA/Tab_Conversao);
//   - qualquer outra aba exige `--aba` explícito e imprime um aviso;
//   - o diretório de saída default é fora do repositório (scratchpad), para não commitar por acidente.
// Nunca commitar CSV vindo de aba de lançamento. Ver docs/testes/ingestao-excel-legado.md.

import { writeFileSync, mkdirSync } from "node:fs";
import { join, basename } from "node:path";
import { abrirPlanilha, paraCsv } from "./lib/xlsx.mjs";

const PADRAO_NORMA = /norma|nomas/i;
const OUTRAS_ABAS_SEGURAS = /^(ROSETTA|Tab_Conversao|Funcoes|FORMATA)/i;

function ehAbaDeNorma(nome) {
  return PADRAO_NORMA.test(nome) || OUTRAS_ABAS_SEGURAS.test(nome);
}

function parseArgs(argv) {
  const [arquivo, ...resto] = argv;
  const opcoes = { arquivo, listar: false, todasNormas: false, abas: [], saida: null };
  for (let i = 0; i < resto.length; i++) {
    const a = resto[i];
    if (a === "--listar") opcoes.listar = true;
    else if (a === "--todas-normas") opcoes.todasNormas = true;
    else if (a === "--aba") opcoes.abas.push(resto[++i]);
    else if (a === "--saida") opcoes.saida = resto[++i];
    else throw new Error(`argumento desconhecido: ${a}`);
  }
  return opcoes;
}

function nomeDeArquivoSeguro(nomeDaAba) {
  return nomeDaAba
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

const opcoes = parseArgs(process.argv.slice(2));
if (!opcoes.arquivo) {
  console.error("uso: node scripts/extrair-normas-excel.mjs <arquivo.xlsm> [--listar | --todas-normas | --aba NOME] [--saida DIR]");
  process.exit(1);
}

const planilha = abrirPlanilha(opcoes.arquivo);

if (opcoes.listar || (!opcoes.todasNormas && opcoes.abas.length === 0)) {
  const normas = planilha.abas.filter(ehAbaDeNorma);
  console.log(`${planilha.abas.length} abas em ${basename(opcoes.arquivo)} — ${normas.length} de norma:\n`);
  for (const nome of normas) console.log(`  ${nome}`);
  console.log(`\n${planilha.abas.length - normas.length} outras abas (lançamento/cadastro — contêm dado de paciente, não extraídas por padrão).`);
  process.exit(0);
}

const escolhidas = opcoes.todasNormas ? planilha.abas.filter(ehAbaDeNorma) : opcoes.abas;
const dirSaida =
  opcoes.saida ??
  join(process.env.TEMP ?? process.env.TMPDIR ?? ".", "normas-excel");
mkdirSync(dirSaida, { recursive: true });

console.log(`Extraindo ${escolhidas.length} aba(s) para ${dirSaida}\n`);
let comAviso = 0;

for (const nome of escolhidas) {
  if (!ehAbaDeNorma(nome)) {
    console.warn(`  ! ${nome} — NÃO é aba de norma; pode conter dado de paciente. Não commitar.`);
    comAviso++;
  }
  const matriz = planilha.ler(nome);
  const csv = paraCsv(matriz);
  const destino = join(dirSaida, `${nomeDeArquivoSeguro(nome)}.csv`);
  writeFileSync(destino, csv, "utf8");
  const colunas = matriz.length > 0 ? matriz[0].length : 0;
  console.log(`  ${nome.padEnd(24)} ${String(matriz.length).padStart(5)} linhas x ${String(colunas).padStart(3)} col  -> ${basename(destino)}`);
}

if (comAviso > 0) {
  console.warn(`\n${comAviso} aba(s) fora do padrão de norma foram extraídas — revisar antes de qualquer commit.`);
}
console.log(`\nOK — ${escolhidas.length} aba(s) extraída(s).`);
