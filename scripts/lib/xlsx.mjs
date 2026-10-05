// Leitor mínimo de .xlsx/.xlsm — extrai abas como matriz de células, sem dependência externa.
//
// Por que existe: o sistema Excel legado da psicóloga (~128 abas, ~51 delas de normas) é a fonte
// mais barata de dado normativo que temos — já está digitado. Ler um .xlsm é parsear texto
// comprimido, o que custa praticamente nada, contra renderizar e ler página de PDF como imagem.
//
// Um .xlsx/.xlsm é um ZIP de XML. As três peças que importam:
//   xl/workbook.xml            -> nomes das abas + rId de cada uma
//   xl/_rels/workbook.xml.rels -> rId -> caminho do arquivo da aba
//   xl/sharedStrings.xml       -> tabela de strings (células de texto guardam só o índice)
//   xl/worksheets/sheetN.xml   -> as células
//
// Escopo deliberado: só leitura de valores (o `<v>` cacheado das fórmulas, não a fórmula em si),
// que é o que interessa numa tabela normativa. Sem estilo, sem formatação, sem data serial
// convertida — quem chama decide o que fazer com o valor cru.

import { inflateRawSync } from "node:zlib";
import { readFileSync } from "node:fs";

// --- ZIP: central directory -> entradas ---

function acharFimDoDiretorioCentral(buf) {
  // A EOCD tem tamanho variável (comentário no fim), então varre de trás para frente.
  // 22 bytes é o tamanho mínimo; 0xFFFF é o comentário máximo.
  const minimo = Math.max(0, buf.length - 22 - 0xffff);
  for (let i = buf.length - 22; i >= minimo; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) return i;
  }
  throw new Error("não parece ser um ZIP (fim do diretório central não encontrado)");
}

function lerEntradas(buf) {
  const eocd = acharFimDoDiretorioCentral(buf);
  const total = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);

  const entradas = new Map();
  for (let i = 0; i < total; i++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) throw new Error(`entrada ${i} corrompida no diretório central`);
    const metodo = buf.readUInt16LE(off + 10);
    const tamanhoComprimido = buf.readUInt32LE(off + 20);
    const tamanhoCru = buf.readUInt32LE(off + 24);
    const tamNome = buf.readUInt16LE(off + 28);
    const tamExtra = buf.readUInt16LE(off + 30);
    const tamComentario = buf.readUInt16LE(off + 32);
    const offsetLocal = buf.readUInt32LE(off + 42);
    const nome = buf.toString("utf8", off + 46, off + 46 + tamNome);
    entradas.set(nome, { metodo, tamanhoComprimido, tamanhoCru, offsetLocal });
    off += 46 + tamNome + tamExtra + tamComentario;
  }
  return entradas;
}

function extrair(buf, entrada) {
  // O header local repete os campos, mas com tamanhos de nome/extra próprios — o offset dos dados
  // tem que ser calculado a partir dele, não do diretório central.
  const off = entrada.offsetLocal;
  if (buf.readUInt32LE(off) !== 0x04034b50) throw new Error("header local corrompido");
  const tamNome = buf.readUInt16LE(off + 26);
  const tamExtra = buf.readUInt16LE(off + 28);
  const inicio = off + 30 + tamNome + tamExtra;
  const dados = buf.subarray(inicio, inicio + entrada.tamanhoComprimido);
  if (entrada.metodo === 0) return dados; // armazenado sem compressão
  if (entrada.metodo === 8) return inflateRawSync(dados);
  throw new Error(`método de compressão não suportado: ${entrada.metodo}`);
}

// --- XML: parse suficiente para planilha, sem biblioteca ---

function decodificarEntidades(s) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, "&"); // por último, senão desfaz os anteriores
}

// A tabela de strings compartilhadas: cada <si> pode ter um <t> simples ou vários <r><t> (rich
// text com formatação por trecho) — nos dois casos o texto é a concatenação dos <t>.
function lerSharedStrings(xml) {
  const strings = [];
  for (const [, si] of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    let texto = "";
    for (const [, t] of si.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) texto += decodificarEntidades(t);
    strings.push(texto);
  }
  return strings;
}

// "BC12" -> {coluna: 54, linha: 12} (coluna 1-indexada, base 26 com A=1)
function refParaIndices(ref) {
  const m = /^([A-Z]+)(\d+)$/.exec(ref);
  if (!m) return null;
  let coluna = 0;
  for (const ch of m[1]) coluna = coluna * 26 + (ch.charCodeAt(0) - 64);
  return { coluna, linha: Number(m[2]) };
}

function lerCelulas(xml, sharedStrings) {
  const linhas = new Map();
  let maxColuna = 0;

  for (const [, atributos, corpo] of xml.matchAll(/<c ([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const ref = /r="([A-Z]+\d+)"/.exec(atributos)?.[1];
    if (!ref) continue;
    const pos = refParaIndices(ref);
    if (!pos) continue;

    const tipo = /t="([^"]+)"/.exec(atributos)?.[1];
    let valor = null;

    if (corpo) {
      if (tipo === "inlineStr") {
        const partes = [...corpo.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(([, t]) => decodificarEntidades(t));
        valor = partes.length > 0 ? partes.join("") : null;
      } else {
        // `<v>` de uma célula com fórmula é o último valor calculado pelo Excel — é exatamente o
        // que queremos numa tabela normativa (o resultado, não a fórmula).
        const v = /<v>([\s\S]*?)<\/v>/.exec(corpo)?.[1];
        if (v !== undefined) {
          if (tipo === "s") valor = sharedStrings[Number(v)] ?? null;
          else if (tipo === "e") valor = decodificarEntidades(v); // erro do Excel (#N/D, #REF!)
          else if (tipo === "str") valor = decodificarEntidades(v); // string vinda de fórmula
          else valor = decodificarEntidades(v); // numérico (ou booleano t="b")
        }
      }
    }

    if (valor === null || valor === "") continue;
    if (!linhas.has(pos.linha)) linhas.set(pos.linha, new Map());
    linhas.get(pos.linha).set(pos.coluna, valor);
    if (pos.coluna > maxColuna) maxColuna = pos.coluna;
  }

  if (linhas.size === 0) return [];
  const maxLinha = Math.max(...linhas.keys());
  const matriz = [];
  for (let l = 1; l <= maxLinha; l++) {
    const linha = linhas.get(l);
    const saida = new Array(maxColuna).fill("");
    if (linha) for (const [c, v] of linha) saida[c - 1] = v;
    matriz.push(saida);
  }
  return matriz;
}

// --- API ---

export function abrirPlanilha(caminho) {
  const buf = readFileSync(caminho);
  const entradas = lerEntradas(buf);

  const texto = (nome) => {
    const e = entradas.get(nome);
    return e ? extrair(buf, e).toString("utf8") : null;
  };

  const workbook = texto("xl/workbook.xml");
  if (!workbook) throw new Error("xl/workbook.xml ausente — arquivo não é uma planilha OOXML");
  const rels = texto("xl/_rels/workbook.xml.rels") ?? "";
  const sharedStrings = lerSharedStrings(texto("xl/sharedStrings.xml") ?? "");

  const alvoPorRid = new Map();
  for (const [, atributos] of rels.matchAll(/<Relationship\s+([^>]*?)\/?>/g)) {
    const id = /Id="([^"]+)"/.exec(atributos)?.[1];
    const target = /Target="([^"]+)"/.exec(atributos)?.[1];
    // Target vem relativo a xl/ ("worksheets/sheet1.xml") ou absoluto ("/xl/worksheets/sheet1.xml").
    if (id && target) alvoPorRid.set(id, target.replace(/^\/?xl\//, "").replace(/^\//, ""));
  }

  const abas = [];
  for (const [, atributos] of workbook.matchAll(/<sheet\s+([^>]*?)\/?>/g)) {
    const nome = /name="([^"]*)"/.exec(atributos)?.[1];
    const rid = /r:id="([^"]+)"/.exec(atributos)?.[1];
    if (!nome || !rid) continue;
    abas.push({ nome: decodificarEntidades(nome), arquivo: alvoPorRid.get(rid) ?? null });
  }

  return {
    abas: abas.map((a) => a.nome),
    /** Devolve a aba como matriz de strings (linha × coluna), 0-indexada, células vazias como "". */
    ler(nomeDaAba) {
      const aba = abas.find((a) => a.nome === nomeDaAba);
      if (!aba) throw new Error(`aba não encontrada: "${nomeDaAba}" (disponíveis: ${abas.length})`);
      if (!aba.arquivo) throw new Error(`aba "${nomeDaAba}" sem arquivo associado`);
      const xml = texto(`xl/${aba.arquivo}`);
      if (xml === null) throw new Error(`arquivo da aba ausente no zip: xl/${aba.arquivo}`);
      return lerCelulas(xml, sharedStrings);
    },
  };
}

/** Serializa uma matriz como CSV (RFC 4180: aspas duplicadas, campo entre aspas se precisar). */
export function paraCsv(matriz) {
  return matriz
    .map((linha) =>
      linha
        .map((c) => (/[",\r\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c))
        .join(",")
    )
    .join("\n");
}
