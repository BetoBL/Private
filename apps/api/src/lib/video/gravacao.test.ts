import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { criarArmazenamentoLocal } from "./armazenamento";
import { chaveMestraConfigurada, cifrarParte, decifrarParte, desenvolverChave, envolverChave, ErroCifra, novaChaveDeGravacao } from "./cifraGravacao";

const audio = Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), randomBytes(5000)]); // começa como um .webm

test("chave mestra: sem ela nada é cifrado; com ela a chave da gravação vai e volta, e outra chave mestra não abre", () => {
  delete process.env.GRAVACAO_CRYPTO_KEY;
  assert.equal(chaveMestraConfigurada(), false);
  assert.throws(() => envolverChave(novaChaveDeGravacao()), (e: unknown) => e instanceof ErroCifra && e.codigo === "SEM_CHAVE");
  process.env.GRAVACAO_CRYPTO_KEY = "curta";
  assert.throws(() => envolverChave(novaChaveDeGravacao()), /32 bytes/);
  const mestra = randomBytes(32);
  process.env.GRAVACAO_CRYPTO_KEY = mestra.toString("base64");
  const k = novaChaveDeGravacao();
  const guardada = envolverChave(k);
  assert.ok(!guardada.includes(k.toString("base64")));
  assert.deepEqual(desenvolverChave(guardada), k);
  process.env.GRAVACAO_CRYPTO_KEY = randomBytes(32).toString("hex");
  assert.throws(() => desenvolverChave(guardada));
  process.env.GRAVACAO_CRYPTO_KEY = mestra.toString("base64");
});

test("parte do áudio: o cifrado não revela o conteúdo e volta igual; adulterar, trocar a ordem ou mudar de gravação falha", () => {
  const k = novaChaveDeGravacao();
  const c = cifrarParte(k, "grav-1", 3, audio);
  assert.ok(c.length > audio.length);
  assert.ok(!c.includes(audio.subarray(0, 64)), "o texto claro não aparece no cifrado");
  assert.notDeepEqual(c.subarray(28, 32), audio.subarray(0, 4)); // não começa com o cabeçalho do webm
  assert.deepEqual(decifrarParte(k, "grav-1", 3, c), audio);
  assert.notDeepEqual(cifrarParte(k, "grav-1", 3, audio), c, "cada cifra usa um iv novo");

  assert.throws(() => decifrarParte(k, "grav-1", 4, c), "parte trocada de lugar");
  assert.throws(() => decifrarParte(k, "grav-2", 3, c), "parte levada para outra gravação");
  assert.throws(() => decifrarParte(novaChaveDeGravacao(), "grav-1", 3, c), "chave errada");
  const adulterado = Buffer.from(c); adulterado[40] ^= 0xff;
  assert.throws(() => decifrarParte(k, "grav-1", 3, adulterado), "byte alterado");
  assert.throws(() => decifrarParte(k, "grav-1", 3, Buffer.alloc(10)), "parte truncada");
});

test("armazenamento local: guarda, lê e apaga, e não deixa sair da própria pasta", async () => {
  const pasta = await mkdtemp(path.join(os.tmpdir(), "grav-"));
  try {
    const a = criarArmazenamentoLocal(pasta);
    await a.guardar("gravacoes/c1/g1/000000.bin", Buffer.from("cifrado"));
    assert.equal((await a.ler("gravacoes/c1/g1/000000.bin")).toString(), "cifrado");
    await a.apagar("gravacoes/c1/g1/000000.bin");
    await assert.rejects(() => a.ler("gravacoes/c1/g1/000000.bin"));
    await a.apagar("gravacoes/c1/g1/inexistente.bin"); // apagar o que não existe não é erro
    await assert.rejects(() => a.guardar("../fora.bin", Buffer.from("x")), /fora da pasta/);
    assert.deepEqual((await readdir(pasta)).filter((n) => n.endsWith(".bin")), []);
  } finally { await rm(pasta, { recursive: true, force: true }); }
});
