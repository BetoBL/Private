// Valida tabelas normativas do BRIEF2 (bruto -> T-Score + percentil) contra propriedades que a
// escala necessariamente satisfaz. Roda sobre a nossa transcrição (apps/api/prisma/brief2-normas.ts)
// e/ou sobre um CSV extraído do Excel legado da psicóloga (scripts/extrair-normas-excel.mjs).
//
// Uso:
//   node scripts/validar-brief2.mjs                        # valida a nossa transcrição
//   node scripts/validar-brief2.mjs --csv <arquivo.csv>     # valida o CSV da aba BRIEF2-Normas
//   node scripts/validar-brief2.mjs --csv <arquivo.csv> --comparar   # + cruza as duas fontes
//   node scripts/validar-brief2.mjs --normas <arquivo.ts>   # valida outra cópia do módulo de
//                                                           # normas (usado por mutar-brief2.mjs)
//
// POR QUE NÃO A CHECAGEM CONTRA A NORMAL: os compostos Wechsler são normalizados, então o par
// (composto, percentil) tem que satisfazer percentil = Phi((composto-100)/15) — é o que
// validar-wisc-a2a7.mjs explora. O BRIEF2 NÃO tem essa propriedade: o T é linear
// (T = 50 + 10*(bruto - média)/DP) e o percentil é empírico da amostra normativa. Como escala de
// comportamento é fortemente assimétrica (a maioria das crianças se concentra na ponta saudável),
// o percentil empírico fica muito acima do que a normal prevê no meio da escala. Medido na aba da
// psicóloga: desvio médio de +11 pontos percentílicos na faixa T 45-55, contra -0,4 em T>=65 (a
// cauda clínica, onde a distribuição se aproxima da normal). Aplicar a checagem normal aqui
// produziria centenas de falsos positivos.
//
// O QUE FUNCIONA, e é mais forte:
//   1. LINEARIDADE DO T — se T é linear no bruto, ajustar uma reta por escala/faixa/sexo deixa
//      resíduo só de arredondamento (< ~1 ponto de T). Um dígito trocado salta imediatamente.
//      É o teste principal: localiza a célula errada, não só sinaliza a tabela.
//   2. MONOTONICIDADE — bruto maior nunca produz T menor nem percentil menor.
//   3. DOMÍNIO — T plausível (20..100), percentil em (0..100].
//   4. CRUZAMENTO ENTRE FONTES (--comparar) — duas transcrições independentes do mesmo manual
//      (a nossa, do PDF; a dela, do Excel). Divergência aponta erro em uma das duas.

import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

const RESIDUO_MAXIMO_T = 1.5; // arredondamento do manual é 1 ponto; 1.5 dá folga
const MIN_PONTOS_PARA_AJUSTE = 4; // abaixo disso a reta não tem grau de liberdade para acusar nada

// Valores CENSURADOS ("maior que") não são medidas, são um teto: ficam fora do ajuste linear e da
// monotonicidade, e são contados à parte para conferência. Duas notações:
//
//   ">" explícito — é como o manual imprime (percentil ">99"; T ">90" no topo do Shift) e como a
//   nossa transcrição guarda. ATENÇÃO: sem tratar isso, `Number(">90")` vira NaN, o NaN
//   contamina o ajuste de mínimos quadrados e TODA comparação com o resíduo vira `false` — a
//   série inteira passa sem ser checada, em silêncio. Foi o que acontecia com as 4 colunas de
//   Shift (8-10, 11-13 e 14-18) até 05/10/2026.
//
//   Sufixo ".1" — convenção do Excel legado da psicóloga, onde 99.1 é ">99" e 90.1 é ">90" (não é
//   casa decimal). AINDA NÃO CONFIRMADA com ela: a leitura vem do padrão de uso (sempre no
//   extremo superior, sempre .1, e a coluna de percentil dela vai 99 -> 99.1 sem 99.2/99.3 no
//   meio), que é a mesma convenção do ">99,9" impresso nas tabelas do WISC-IV. Se ela confirmar
//   outro significado, é só mudar aqui.
const SUFIXO_CENSURADO = /\.1$/;

function ehCensurado(textoOriginal) {
  if (typeof textoOriginal !== "string") return false;
  const texto = textoOriginal.trim();
  return texto.startsWith(">") || SUFIXO_CENSURADO.test(texto);
}

/** minúsculas, sem acento, só alfanumérico — para comparar rótulos que variam em grafia/espaçamento. */
function normalizar(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Extrai [min, max] de um texto de faixa etária, em qualquer grafia ("5 - 7 anos", "11-13 anos"). */
function extrairFaixaNumerica(texto) {
  const m = /(\d+)\D+(\d+)/.exec(texto ?? "");
  return m ? [Number(m[1]), Number(m[2])] : null;
}

function chaveCruzamento(versao, sexo, faixaMin, faixaMax, escalaChave) {
  if (!escalaChave || faixaMin == null || faixaMax == null) return null;
  return `${normalizar(versao)}/${normalizar(sexo)}/${faixaMin}-${faixaMax}/${escalaChave}`;
}

// A nossa transcrição usa chave em inglês (workingMemory...); o Excel legado da psicóloga imprime
// o nome em português (Memória operacional...). Sem esta tradução, o cruzamento (--comparar)
// nunca casa nenhuma série, mesmo com sexo/faixa idênticos — foi o que fazia "--comparar" mostrar
// "0 séries em comum" mesmo depois de consertado o bug de leitura do nome da coluna no CSV.
// Cobre só as 9 escalas de PAIS/PROFESSORES + as variantes de Auto Relato que aparecem no Excel
// dela: GEC e os índices (BRI/ERI/CRI) ficam de fora porque a nossa transcrição ainda não os tem
// (ver BRIEF2_PAIS_NORMAS.gec e docs/testes/BRIEF2.md), então não haveria o que cruzar mesmo.
const DICIONARIO_ESCALAS_PT_EN = new Map(
  [
    ["Inibição", "inhibit"],
    ["Auto monitoramento", "selfMonitor"],
    ["Auternância", "shift"], // grafia do Excel legado (falta o "l" de "Alternância")
    ["controle emocional", "emotionalControl"],
    ["Iniciativa", "initiate"],
    ["Memória operacional", "workingMemory"],
    ["Planejamento", "planOrganize"],
    ["Monitoramento em tarefa", "taskMonitor"],
    ["Organização de materiais", "organizationOfMaterials"],
    ["Conclusão de tarefa", "taskCompletion"],
    ["Conclusão de tarefas", "taskCompletion"], // o Excel dela varia singular/plural entre faixas
  ].map(([pt, en]) => [normalizar(pt), en])
);

// Células que DESTOAM da reta mas estão CORRETAS — conferidas a 600dpi contra a página original
// do manual em 05/10/2026. O Working Memory do Formulário de Pais tem um degrau real em bruto
// 17-18 nas faixas 5-7 e 8-10 (17->63, 18->64, contra ~2,6 pontos de T por ponto bruto no resto
// da coluna); nas faixas 11-13 e 14-18 o mesmo trecho é liso. Não é erro de transcrição: quem
// "consertar" para 61 quebra a fidelidade à fonte. Os pontos listados aqui saem do ajuste linear
// (para não enviesar a reta e mascarar um erro de verdade na mesma coluna), mas continuam sujeitos
// a monotonicidade e domínio.
const EXCECOES_VERIFICADAS = new Set([
  "PAIS/MASCULINO/Meninos, 5-7 anos/workingMemory|17",
  "PAIS/MASCULINO/Meninos, 8-10 anos/workingMemory|17",
]);

const erros = [];
const avisos = [];
let censurados = 0;

// --- utilidades ---

/** Ajuste de mínimos quadrados de T em função do bruto. Devolve o maior resíduo absoluto. */
function ajustarReta(pontos) {
  const n = pontos.length;
  const somaX = pontos.reduce((a, p) => a + p.bruto, 0);
  const somaY = pontos.reduce((a, p) => a + p.t, 0);
  const somaXY = pontos.reduce((a, p) => a + p.bruto * p.t, 0);
  const somaXX = pontos.reduce((a, p) => a + p.bruto * p.bruto, 0);
  const denominador = n * somaXX - somaX * somaX;
  if (denominador === 0) return null;
  const inclinacao = (n * somaXY - somaX * somaY) / denominador;
  const intercepto = (somaY - inclinacao * somaX) / n;
  let pior = { residuo: 0 };
  for (const p of pontos) {
    const previsto = intercepto + inclinacao * p.bruto;
    const residuo = Math.abs(p.t - previsto);
    if (residuo > pior.residuo) pior = { residuo, bruto: p.bruto, t: p.t, previsto };
  }
  return { inclinacao, intercepto, pior };
}

function validarSerie(rotulo, todosOsPontos, chaveSerie = null) {
  if (todosOsPontos.length === 0) {
    avisos.push(`${rotulo}: nenhuma linha com T`);
    return;
  }

  // Censurados (".1" = "maior que") saem das checagens numéricas — são teto, não medida.
  const pontos = todosOsPontos.filter((p) => !p.censurado);
  censurados += todosOsPontos.length - pontos.length;
  if (pontos.length === 0) {
    avisos.push(`${rotulo}: todos os valores são censurados (".1")`);
    return;
  }

  // 3. domínio
  for (const p of pontos) {
    if (p.t < 20 || p.t > 100) erros.push(`${rotulo} bruto=${p.bruto}: T=${p.t} fora de 20..100`);
    if (p.percentil !== null && (p.percentil <= 0 || p.percentil > 100)) {
      erros.push(`${rotulo} bruto=${p.bruto}: percentil=${p.percentil} fora de (0..100]`);
    }
  }

  // 2. monotonicidade
  for (let i = 1; i < pontos.length; i++) {
    const ant = pontos[i - 1];
    const at = pontos[i];
    if (at.t < ant.t) {
      erros.push(`${rotulo}: T cai de ${ant.t} (bruto ${ant.bruto}) para ${at.t} (bruto ${at.bruto})`);
    }
    if (at.percentil !== null && ant.percentil !== null && at.percentil < ant.percentil) {
      erros.push(
        `${rotulo}: percentil cai de ${ant.percentil} (bruto ${ant.bruto}) para ${at.percentil} (bruto ${at.bruto})`
      );
    }
  }

  // 1. linearidade do T (o teste principal)
  const paraAjuste = chaveSerie
    ? pontos.filter((p) => !EXCECOES_VERIFICADAS.has(`${chaveSerie}|${p.bruto}`))
    : pontos;
  if (paraAjuste.length >= MIN_PONTOS_PARA_AJUSTE) {
    const ajuste = ajustarReta(paraAjuste);
    if (ajuste && ajuste.pior.residuo > RESIDUO_MAXIMO_T) {
      erros.push(
        `${rotulo}: T não-linear — bruto=${ajuste.pior.bruto} tem T=${ajuste.pior.t}, ` +
          `a reta (T = ${ajuste.intercepto.toFixed(1)} + ${ajuste.inclinacao.toFixed(2)}*bruto) prevê ` +
          `${ajuste.pior.previsto.toFixed(1)} (resíduo ${ajuste.pior.residuo.toFixed(1)})`
      );
    }
  }
}

// --- fonte 1: a nossa transcrição ---

async function lerNossaTranscricao(caminhoNormas) {
  // O módulo é TypeScript, então este caminho exige `npx tsx`; o modo --csv puro funciona com
  // node sozinho, por isso o import é dinâmico. pathToFileURL é obrigatório no Windows — um
  // caminho "C:\..." é lido como protocolo "c:" pelo loader ESM e falha.
  const {
    BRIEF2_PAIS_NORMAS,
    BRIEF2_ESCALAS_PAIS_PROFESSORES,
    BRIEF2_AMPLITUDE_BRUTO_PAIS_PROFESSORES,
    parseColunaBRIEF2,
  } = await import(pathToFileURL(caminhoNormas).href);

  const series = new Map();
  const chaves = new Map();
  for (const faixa of BRIEF2_PAIS_NORMAS) {
    for (const escala of BRIEF2_ESCALAS_PAIS_PROFESSORES) {
      const coluna = faixa.escalas[escala];
      if (!coluna) continue;
      const pontos = parseColunaBRIEF2(coluna)
        .map((f) => ({
          bruto: f.min,
          t: typeof f.escoreT === "number" ? f.escoreT : parseFloat(f.escoreT),
          percentil: Number.isFinite(parseFloat(f.percentil)) ? parseFloat(f.percentil) : null,
          censurado: ehCensurado(String(f.escoreT)) || ehCensurado(String(f.percentil)),
        }))
        .sort((a, b) => a.bruto - b.bruto);
      const rotulo = `PAIS/${faixa.sexo}/${faixa.faixaLabel}/${escala}`;
      conferirAmplitude(rotulo, pontos, BRIEF2_AMPLITUDE_BRUTO_PAIS_PROFESSORES[escala]);
      series.set(rotulo, pontos);
      chaves.set(rotulo, chaveCruzamento("PAIS", faixa.sexo, faixa.faixaMin, faixa.faixaMax, escala));
    }
  }
  return { series, chaves };
}

/**
 * Guarda estrutural: o escore bruto de uma escala vai de (nº de itens) a 3×(nº de itens), sem
 * buraco. Checar isso pega a classe de erro que linearidade e monotonicidade NÃO pegam — linha
 * faltando no pé da coluna e linha inventada abaixo do mínimo da escala — porque o que sobra
 * continua sendo uma reta perfeitamente crescente.
 */
function conferirAmplitude(rotulo, pontos, amplitude) {
  if (!amplitude) return;
  const [min, max] = amplitude;
  const brutos = new Set(pontos.map((p) => p.bruto));
  const faltando = [];
  for (let b = min; b <= max; b++) if (!brutos.has(b)) faltando.push(b);
  const sobrando = [...brutos].filter((b) => b < min || b > max).sort((a, b) => a - b);
  if (faltando.length > 0) {
    erros.push(`[nossa transcrição (PDF do manual)] ${rotulo}: falta o bruto ${faltando.join(", ")} (escala vai de ${min} a ${max})`);
  }
  if (sobrando.length > 0) {
    erros.push(`[nossa transcrição (PDF do manual)] ${rotulo}: bruto ${sobrando.join(", ")} fora da escala (${min} a ${max})`);
  }
}

// --- fonte 2: CSV da aba BRIEF2-Normas do Excel legado ---

// Layout da aba (conferido célula a célula na extração). Duas dimensões de repetição:
//
//   HORIZONTAL — blocos de 26 colunas, um por tabela do manual (versão + sexo + faixa etária).
//     Dentro do bloco, pares T-Score/Percent. lado a lado, um por escala. Os metadados ficam em
//     linhas fixas na 1ª coluna do bloco: 3 = versão (PAIS/PROFESSORES), 5 = sexo, 6 = faixa etária.
//
//   VERTICAL — faixas empilhadas, cada uma iniciada por "Pontos Brutos" na coluna 0 e terminada
//     por "CI 90%". Duas na aba: linhas 9-39 (bruto 0-30) são as 9 ESCALAS; linhas 50-134
//     (bruto 12-96) são os ÍNDICES (BRI/ERI/CRI) + GEC, cujo bruto vai muito mais alto por somar
//     várias escalas. O nome de cada coluna vem da MESMA linha do "Pontos Brutos" daquela faixa
//     (coluna 0 tem o rótulo "Pontos Brutos", as colunas de dados ao lado já têm o nome da
//     escala/índice), então é lido por faixa e não de uma linha fixa.
//
// Ler as duas faixas como uma série só é o erro óbvio aqui: mistura bruto 0-30 com bruto 12-96,
// o mesmo bruto aparece com dois T diferentes, e a monotonicidade acusa centenas de falsos erros.
const LARGURA_DO_BLOCO = 26;

/** Localiza as faixas verticais: [{ inicio, fim, linhaDoNome }] a partir dos marcos na coluna 0. */
function acharFaixasVerticais(linhas) {
  const faixas = [];
  for (let i = 0; i < linhas.length; i++) {
    if ((linhas[i]?.[0] ?? "").trim() !== "Pontos Brutos") continue;
    // Dados começam depois do cabeçalho T-Score/Percent. (a linha seguinte ao "Pontos Brutos").
    let inicio = i + 1;
    while (inicio < linhas.length && !Number.isFinite(parseFloat(linhas[inicio]?.[0]))) inicio++;
    let fim = inicio;
    while (fim < linhas.length && Number.isFinite(parseFloat(linhas[fim]?.[0]))) fim++;
    if (fim > inicio) faixas.push({ inicio, fim, linhaDoNome: i });
  }
  return faixas;
}

function lerCsvDaPsicologa(caminho) {
  const linhas = readFileSync(caminho, "utf8").split(/\r?\n/).map((l) => l.split(","));
  const series = new Map();
  const chaves = new Map();
  const totalColunas = Math.max(...linhas.map((l) => l.length));
  const faixasVerticais = acharFaixasVerticais(linhas);

  for (const faixaV of faixasVerticais) {
    for (let base = 1; base + 1 < totalColunas; base += LARGURA_DO_BLOCO) {
      const versao = (linhas[2]?.[base] ?? "").trim();
      const sexo = (linhas[4]?.[base] ?? "").trim();
      const faixaEtaria = (linhas[5]?.[base] ?? "").trim();
      if (!versao && !sexo && !faixaEtaria) continue;

      // Percorre as colunas do bloco em pares; para quando o nome da coluna acaba (bloco mais
      // estreito que 26, caso dos Índices, que têm menos colunas que as 9 escalas).
      for (let colT = base; colT < base + LARGURA_DO_BLOCO && colT + 1 < totalColunas; colT += 2) {
        const nome = (linhas[faixaV.linhaDoNome]?.[colT] ?? "").trim();
        if (!nome) continue;

        const pontos = [];
        for (let i = faixaV.inicio; i < faixaV.fim; i++) {
          const bruto = parseFloat(linhas[i]?.[0]);
          const textoT = linhas[i]?.[colT];
          const textoP = linhas[i]?.[colT + 1];
          const t = parseFloat(textoT);
          const p = parseFloat(textoP);
          if (!Number.isFinite(bruto) || !Number.isFinite(t)) continue;
          pontos.push({
            bruto,
            t,
            percentil: Number.isFinite(p) ? p : null,
            censurado: ehCensurado(textoT) || ehCensurado(textoP),
          });
        }
        if (pontos.length > 0) {
          const rotulo = `${versao}/${sexo}/${faixaEtaria}/${nome}`;
          series.set(rotulo, pontos.sort((a, b) => a.bruto - b.bruto));
          const [faixaMin, faixaMax] = extrairFaixaNumerica(faixaEtaria) ?? [];
          const escalaChave = DICIONARIO_ESCALAS_PT_EN.get(normalizar(nome));
          chaves.set(rotulo, chaveCruzamento(versao, sexo, faixaMin, faixaMax, escalaChave));
        }
      }
    }
  }
  return { series, chaves };
}

// --- execução ---

const args = process.argv.slice(2);
const caminhoCsv = args.includes("--csv") ? args[args.indexOf("--csv") + 1] : null;
const comparar = args.includes("--comparar");
const caminhoNormas = args.includes("--normas")
  ? args[args.indexOf("--normas") + 1]
  : join(raiz, "apps/api/prisma/brief2-normas.ts");

let seriesNossas = null;
let seriesDela = null;
let chavesNossas = null;
let chavesDela = null;

if (!caminhoCsv || comparar) {
  try {
    ({ series: seriesNossas, chaves: chavesNossas } = await lerNossaTranscricao(caminhoNormas));
  } catch (e) {
    if (caminhoCsv) avisos.push(`não foi possível ler a nossa transcrição (${e.message}) — só o CSV será validado`);
    else throw e;
  }
}
if (caminhoCsv) ({ series: seriesDela, chaves: chavesDela } = lerCsvDaPsicologa(caminhoCsv));

console.log("Validando BRIEF2 (bruto -> T-Score + percentil)\n");

for (const [nome, series] of [
  ["nossa transcrição (PDF do manual)", seriesNossas],
  ["Excel legado da psicóloga", seriesDela],
]) {
  if (!series) continue;
  const antes = erros.length;
  // Só a nossa transcrição tem exceções verificadas contra o PDF; o CSV da psicóloga é fonte
  // independente e passa pela checagem inteira, justamente para poder divergir.
  const ehNossa = series === seriesNossas;
  for (const [rotulo, pontos] of series) {
    validarSerie(`[${nome}] ${rotulo}`, pontos, ehNossa ? rotulo : null);
  }
  const total = [...series.values()].reduce((a, p) => a + p.length, 0);
  console.log(`  ${nome}: ${series.size} séries, ${total} linhas — ${erros.length - antes} erro(s)`);
}
if (censurados > 0) {
  console.log(`  (${censurados} valores censurados ">" ou ".1" excluídos das checagens numéricas — ver nota no topo do script)`);
}

// 4. cruzamento entre fontes
if (comparar && seriesNossas && seriesDela) {
  // Casar por CHAVE ESTRUTURADA (sexo + faixa numérica + escala traduzida), não pelo rótulo
  // inteiro normalizado: os rótulos usam palavras diferentes entre as duas fontes (a nossa diz
  // "Meninos, 5-7 anos" e "workingMemory"; a dela diz "5 - 7 anos" e "Memória operacional"), então
  // esmagar a string toda nunca bate mesmo depois de tirar acento/espaço.
  const indiceDela = new Map();
  for (const [rotulo, pontos] of seriesDela) {
    const chave = chavesDela.get(rotulo);
    if (chave) indiceDela.set(chave, { rotulo, pontos });
  }

  let semTraducao = 0;
  let cruzadas = 0;
  let divergentes = 0;
  for (const [rotulo, nossos] of seriesNossas) {
    const chave = chavesNossas.get(rotulo);
    if (!chave) {
      semTraducao++;
      continue;
    }
    const dela = indiceDela.get(chave);
    if (!dela) continue;
    cruzadas++;
    const mapaDela = new Map(dela.pontos.map((p) => [p.bruto, p]));
    for (const nosso of nossos) {
      const outro = mapaDela.get(nosso.bruto);
      if (!outro) continue;
      // Censurado (">90" na nossa, "90.1" na dela) é teto, não medida — as duas notações marcam a
      // mesma coisa, mas viram valores numéricos diferentes (NaN de ">90"; 90.1 do sufixo). Sem
      // isso, divergem "por acidente" e mascaram as divergências de verdade na mesma lista.
      if (nosso.censurado || outro.censurado) continue;
      if (nosso.t !== outro.t) {
        divergentes++;
        erros.push(
          `DIVERGÊNCIA ${rotulo} / ${dela.rotulo} bruto=${nosso.bruto}: nossa transcrição T=${nosso.t}, Excel dela T=${outro.t}`
        );
      }
    }
  }
  console.log(`\n  cruzamento: ${cruzadas} série(s) em comum, ${divergentes} célula(s) divergente(s)`);
  if (semTraducao > 0) {
    avisos.push(`${semTraducao} série(s) da nossa transcrição sem chave de cruzamento (escala fora de DICIONARIO_ESCALAS_PT_EN)`);
  }
  if (cruzadas === 0) {
    avisos.push("nenhuma série casou entre as duas fontes — conferir os rótulos de sexo/faixa antes de confiar no cruzamento");
  }
}

if (avisos.length > 0) {
  console.log(`\n${avisos.length} aviso(s):`);
  for (const a of avisos.slice(0, 15)) console.log(`  ~ ${a}`);
  if (avisos.length > 15) console.log(`  ... e mais ${avisos.length - 15}`);
}

if (erros.length > 0) {
  console.error(`\n${erros.length} ERRO(S):`);
  for (const e of erros.slice(0, 30)) console.error(`  ! ${e}`);
  if (erros.length > 30) console.error(`  ... e mais ${erros.length - 30}`);
  process.exit(1);
}

console.log("\nOK — todas as checagens passaram.");
