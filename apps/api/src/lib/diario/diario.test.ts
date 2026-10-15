import assert from "node:assert/strict";
import { test } from "node:test";
import { ACOES_QUE_AJUDARAM, catalogoParaPaciente, CONFIG_PADRAO, CONTEXTOS, EMOCOES, FAMILIAS, familiaDaEmocao, normalizarConfig, sofrimentoIntenso, validarCartao, type EntradaCartao } from "./catalogo";
import { resumirCartoes, type CartaoResumo } from "./resumo";

test("catálogo: chaves únicas, toda emoção tem família com apoio, e cada família tem emoções", () => {
  const unicas = (l: Array<{ chave: string }>) => new Set(l.map((x) => x.chave)).size === l.length;
  assert.ok(unicas(EMOCOES) && unicas(FAMILIAS) && unicas(CONTEXTOS) && unicas(ACOES_QUE_AJUDARAM));
  for (const e of EMOCOES) assert.ok(FAMILIAS.some((f) => f.chave === e.familia), `${e.chave} sem família`);
  for (const f of FAMILIAS) { assert.ok(EMOCOES.some((e) => e.familia === f.chave), `${f.chave} vazia`); assert.ok(f.apoio.length > 0); }
  assert.equal(familiaDaEmocao("alegria"), "leve");
  assert.equal(familiaDaEmocao("inexistente"), null);
});

const ok: EntradaCartao = { ocorridoEm: "2026-10-10", emocao: "ansiedade", intensidade: 3, contexto: "corpo", primeiraAcao: "acalmar_corpo", acoesQueAjudaram: ["respiracao"], ajudou: "POUCO", fechamento: "falar_sessao" };

test("validação do cartão: aceita o válido e recusa escolha fora do catálogo, intensidade, data inválida e futura", () => {
  assert.deepEqual(validarCartao(ok), []);
  assert.equal(validarCartao({ ...ok, emocao: "x" }).length, 1);
  assert.equal(validarCartao({ ...ok, intensidade: 0 }).length, 1);
  assert.equal(validarCartao({ ...ok, intensidade: 6 }).length, 1);
  assert.equal(validarCartao({ ...ok, intensidade: 2.5 }).length, 1);
  assert.equal(validarCartao({ ...ok, contexto: "x" }).length, 1);
  assert.equal(validarCartao({ ...ok, acoesQueAjudaram: ["respiracao", "x"] }).length, 1);
  assert.equal(validarCartao({ ...ok, ocorridoEm: "10/10/2026" }).length, 1);
  assert.equal(validarCartao({ ...ok, ocorridoEm: "2099-01-01" }).length, 1);
  assert.deepEqual(validarCartao({ ocorridoEm: "2026-10-10", emocao: "calma", intensidade: 1 }), []); // só o essencial
});

test("aviso de sofrimento intenso: só em emoção difícil com intensidade alta", () => {
  assert.equal(sofrimentoIntenso("baixa", 5), true);
  assert.equal(sofrimentoIntenso("inquieta", 4), true);
  assert.equal(sofrimentoIntenso("baixa", 3), false);
  assert.equal(sofrimentoIntenso("leve", 5), false);
});

const dia = (n: number) => new Date(Date.UTC(2026, 9, 10 - n)); // n dias antes de 10/10/2026
const c = (n: number, familia: string, intensidade: number, extra: Partial<CartaoResumo> = {}): CartaoResumo => ({ ocorridoEm: dia(n), emocao: familia === "leve" ? "alegria" : "tristeza", familia, intensidade, levarParaSessao: false, conversadoEm: null, ...extra });
const hoje = dia(0);

test("resumo: tendência compara os últimos 7 dias com os 7 anteriores, só com emoções difíceis", () => {
  const piora = resumirCartoes([c(1, "baixa", 4), c(2, "baixa", 5), c(3, "inquieta", 4), c(8, "baixa", 2), c(9, "baixa", 3), c(10, "forte", 2)], hoje);
  assert.equal(piora.tendencia, "MAIS_INTENSA");
  assert.equal(piora.ultimos7.mediaDificeis, 4.3);
  assert.equal(piora.anteriores7.total, 3);
  const melhora = resumirCartoes([c(1, "baixa", 2), c(2, "baixa", 2), c(8, "baixa", 4), c(9, "baixa", 4)], hoje);
  assert.equal(melhora.tendencia, "MENOS_INTENSA");
  const estavel = resumirCartoes([c(1, "baixa", 3), c(2, "baixa", 3), c(8, "baixa", 3), c(9, "baixa", 3)], hoje);
  assert.equal(estavel.tendencia, "ESTAVEL");
});

test("resumo: alegria intensa não é piora, e pouco dado não gera tendência", () => {
  const leves = resumirCartoes([c(1, "leve", 5), c(2, "leve", 5), c(8, "baixa", 2), c(9, "baixa", 2)], hoje);
  assert.equal(leves.tendencia, null); // só 0 difíceis na janela atual
  assert.equal(leves.ultimos7.dificeis, 0);
  assert.equal(resumirCartoes([c(1, "baixa", 5)], hoje).tendencia, null);
  assert.equal(resumirCartoes([], hoje).total, 0);
  assert.equal(resumirCartoes([], hoje).ultimoRegistro, null);
});

test("resumo: o que ficou para levar à sessão e as emoções mais frequentes", () => {
  const r = resumirCartoes([c(1, "baixa", 3, { levarParaSessao: true }), c(2, "baixa", 3, { levarParaSessao: true, conversadoEm: dia(0) }), c(3, "leve", 2), c(4, "baixa", 3)], hoje);
  assert.equal(r.paraLevar, 1);
  assert.deepEqual(r.porEmocao[0], { emocao: "tristeza", quantidade: 3 });
  assert.equal(r.ultimos7.diasComRegistro, 4);
  assert.equal(r.ultimoRegistro?.getTime(), dia(1).getTime());
});

test("v2: novos campos (pesos, impulso e o que fez) são validados contra o catálogo", () => {
  assert.deepEqual(validarCartao({ ...ok, pesos: ["sono", "demanda"], impulso: "afastar", acaoImpulso: "segurei" }), []);
  assert.equal(validarCartao({ ...ok, pesos: ["x"] }).length, 1);
  assert.equal(validarCartao({ ...ok, impulso: "x" }).length, 1);
  assert.equal(validarCartao({ ...ok, acaoImpulso: "x" }).length, 1);
  assert.deepEqual(validarCartao({ ...ok, primeiraAcao: "apoio" }), []); // chaves da v1 continuam válidas (registros antigos)
});

test("v2: configuração por paciente normaliza lixo e esconde emoções do catálogo do paciente", () => {
  assert.deepEqual(normalizarConfig(null), CONFIG_PADRAO);
  assert.deepEqual(normalizarConfig({ etapas: { pesos: "sim" }, emocoesOcultas: ["raiva", "inventada", 5] }), { etapas: { pesos: true, impulso: false }, emocoesOcultas: ["raiva"] });
  const cat = catalogoParaPaciente({ etapas: { pesos: false, impulso: true }, emocoesOcultas: ["raiva", "vazio"] });
  assert.ok(!cat.emocoes.some((e) => e.chave === "raiva" || e.chave === "vazio"));
  assert.equal(cat.emocoes.length, EMOCOES.length - 2);
  assert.deepEqual(cat.etapas, { pesos: false, impulso: true });
  assert.equal(cat.versao, "v2-2026-10");
});
