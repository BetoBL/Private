// Teste de mutação do validador: planta erros conhecidos em cópias de apps/api/prisma/brief2-normas.ts
// e exige que `validar-brief2.mjs` REPROVE cada uma. Um validador que passa em tudo não prova
// nada — este script é o que prova que ele morde. Mesmo papel de mutar-wisc-a2a7.mjs.
//
// Uso: node scripts/mutar-brief2.mjs

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const validador = join(raiz, "scripts/validar-brief2.mjs");
const caminhoOriginal = join(raiz, "apps/api/prisma/brief2-normas.ts");
const original = readFileSync(caminhoOriginal, "utf8");

/** Troca um par "bruto:T:percentil" dentro da coluna de uma escala, exigindo que o alvo exista. */
function trocar(texto, antes, depois) {
  if (!texto.includes(antes)) throw new Error(`mutação inválida: "${antes}" não existe no arquivo`);
  const ocorrencias = texto.split(antes).length - 1;
  if (ocorrencias > 1) throw new Error(`mutação ambígua: "${antes}" aparece ${ocorrencias} vezes`);
  return texto.replace(antes, depois);
}

const MUTACOES = [
  {
    nome: "dígito trocado no T (Shift 11-13, bruto 15: 62 -> 72)",
    // Shift 11-13 é uma das colunas com T ">90" no topo. Serve de regressão para o bug em que o
    // NaN de Number(">90") contaminava o ajuste e a coluna inteira passava sem ser checada.
    aplicar: (t) => trocar(t, "15:62:88,14:59:82", "15:72:88,14:59:82"),
  },
  {
    nome: "percentil não-monotônico (Inhibit 5-7, bruto 12: 45 -> 25)",
    aplicar: (t) => trocar(t, "12:47:45,11:44:34", "12:47:25,11:44:34"),
  },
  {
    nome: "linha faltando no pé da coluna (Task-Monitor 5-7 sem o bruto 5)",
    aplicar: (t) => trocar(t, "7:44:37,6:39:25,5:35:14", "7:44:37,6:39:25"),
  },
  {
    nome: "linha inventada abaixo do mínimo da escala (Self-Monitor 8-10 ganha bruto 3)",
    aplicar: (t) => trocar(t, "5:44:45,4:39:25", "5:44:45,4:39:25,3:35:15"),
  },
  {
    nome: "T fora do domínio plausível (Plan/Organize 14-18, bruto 8: 38 -> 8)",
    aplicar: (t) => trocar(t, "9:40:29,8:38:19", "9:40:29,8:8:19"),
  },
  {
    // A exceção verificada mora em workingMemory 5-7 bruto 17. Esta mutação prova que a exceção é
    // ESTREITA: um erro em OUTRA linha da MESMA coluna continua sendo pego.
    nome: "erro vizinho de uma exceção verificada (Working Memory 5-7, bruto 12: 49 -> 59)",
    aplicar: (t) => trocar(t, "13:50:66,12:49:51", "13:50:66,12:59:51"),
  },
];

const dir = mkdtempSync(join(tmpdir(), "brief2-mut-"));
let reprovadas = 0;

try {
  // Controle: o arquivo sem mutação tem que PASSAR. Sem isto, um validador quebrado que reprova
  // tudo passaria neste teste de mutação com nota máxima.
  const controle = join(dir, "controle.ts");
  writeFileSync(controle, original);
  const r0 = spawnSync("npx", ["tsx", validador, "--normas", controle], { encoding: "utf8", shell: true });
  if (r0.status !== 0) {
    console.error("CONTROLE FALHOU: o arquivo sem mutação deveria passar.\n" + r0.stdout + r0.stderr);
    process.exit(1);
  }
  console.log("controle (sem mutação): PASSOU, como esperado\n");

  for (const [i, mutacao] of MUTACOES.entries()) {
    const caminho = join(dir, `mutacao-${i}.ts`);
    writeFileSync(caminho, mutacao.aplicar(original));
    const r = spawnSync("npx", ["tsx", validador, "--normas", caminho], { encoding: "utf8", shell: true });
    const pegou = r.status !== 0;
    if (pegou) reprovadas++;
    const primeiroErro = (r.stderr + r.stdout).split("\n").find((l) => l.trim().startsWith("!")) ?? "";
    console.log(`${pegou ? "PEGOU " : "PASSOU"}  ${mutacao.nome}`);
    if (pegou) console.log(`         ${primeiroErro.trim()}`);
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log(`\n${reprovadas}/${MUTACOES.length} mutações detectadas.`);
process.exit(reprovadas === MUTACOES.length ? 0 : 1);
