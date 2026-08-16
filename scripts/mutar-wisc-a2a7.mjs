// Teste de mutação do validador: planta erros conhecidos em cópias do JSON e exige que
// `validar-wisc-a2a7.mjs` REPROVE cada uma. Um validador que passa em tudo não prova nada — este
// script é o que prova que ele morde.
//
// Uso: node scripts/mutar-wisc-a2a7.mjs

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const validador = join(raiz, "scripts/validar-wisc-a2a7.mjs");
const original = JSON.parse(readFileSync(join(raiz, "docs/testes/WISC-IV-tabelas-A2-A7.json"), "utf8"));

// Cada mutação recebe uma cópia profunda e devolve a descrição do erro plantado.
const MUTACOES = [
  {
    nome: "dígito trocado no composto (ICV soma=30: 101 -> 131)",
    aplicar: (d) => {
      d.A2_ICV.linhas.find((l) => l[0] === 30)[1] = 131;
    },
  },
  {
    nome: "percentil errado (IOP soma=30: 50 -> 58)",
    aplicar: (d) => {
      d.A3_IOP.linhas.find((l) => l[0] === 30)[2] = "58";
    },
  },
  {
    nome: "IC95 mais estreito que IC90 (QIT soma=100)",
    aplicar: (d) => {
      d.A6_QIT.linhas.find((l) => l[0] === 100)[4] = "98-102";
    },
  },
  {
    nome: "linha faltando (ICV soma=25 removida)",
    aplicar: (d) => {
      d.A2_ICV.linhas = d.A2_ICV.linhas.filter((l) => l[0] !== 25);
    },
  },
  {
    nome: "composto fora de ordem (IMO soma=20: 100 -> 80)",
    aplicar: (d) => {
      d.A4_IMO.linhas.find((l) => l[0] === 20)[1] = 80;
    },
  },
  {
    nome: "pró-rata errado (A.7 soma=20: 30 -> 31)",
    aplicar: (d) => {
      d.A7_PRO_RATA.linhas.find((l) => l[0] === 20)[1] = 31;
    },
  },
];

const dir = mkdtempSync(join(tmpdir(), "wisc-mut-"));
let falhas = 0;

console.log("Teste de mutação do validador WISC-IV A.2-A.7\n");

for (const [i, mut] of MUTACOES.entries()) {
  const copia = structuredClone(original);
  mut.aplicar(copia);
  const arquivo = join(dir, `mut-${i}.json`);
  writeFileSync(arquivo, JSON.stringify(copia), "utf8");

  const r = spawnSync(process.execPath, [validador, arquivo], { encoding: "utf8" });
  const reprovou = r.status !== 0;
  const primeiroErro = (r.stderr.match(/^\s+! (.+)$/m) ?? [, "(sem detalhe)"])[1];

  if (reprovou) {
    console.log(`  OK   pegou: ${mut.nome}`);
    console.log(`         -> ${primeiroErro}`);
  } else {
    console.error(`  FALHA passou batido: ${mut.nome}`);
    falhas++;
  }
}

// O original tem que continuar passando — senão o validador só está reprovando tudo.
const controle = spawnSync(process.execPath, [validador], { encoding: "utf8" });
if (controle.status === 0) {
  console.log("\n  OK   controle: o JSON real (não mutado) continua passando");
} else {
  console.error("\n  FALHA controle: o JSON real foi reprovado");
  falhas++;
}

rmSync(dir, { recursive: true, force: true });

if (falhas > 0) {
  console.error(`\n${falhas} falha(s) — o validador não é confiável.`);
  process.exit(1);
}
console.log(`\nOK — ${MUTACOES.length} mutações detectadas, controle passou.`);
