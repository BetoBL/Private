import assert from "node:assert/strict";
import { test } from "node:test";
import { regraDeEmissao, type PacienteFiscal } from "./regra";

const padrao = { modoParticular: "POR_SESSAO", quandoEmitir: "NA_BAIXA", modoConvenio: "INDIVIDUAL" };
const base: PacienteFiscal = { nome: "Paciente Exemplo", cpf: "111.222.333-44" };

test("particular sem ajuste segue o padrão da clínica e a nota sai no nome do paciente", () => {
  const r = regraDeEmissao(padrao, base);
  assert.equal(r.modo, "POR_SESSAO"); assert.equal(r.modoOrigem, "clinica");
  assert.equal(r.quando, "NA_BAIXA"); assert.equal(r.quandoOrigem, "clinica");
  assert.deepEqual(r.tomador, { tipo: "PACIENTE", nome: "Paciente Exemplo", documento: "111.222.333-44", email: null });
  assert.equal(r.emite, true);
});

test("o paciente pode ter a sua forma, o seu momento e não ter nota", () => {
  const r = regraDeEmissao(padrao, { ...base, nfModo: "POR_LAUDO", nfQuando: "MANUAL" });
  assert.deepEqual([r.modo, r.modoOrigem, r.quando, r.quandoOrigem], ["POR_LAUDO", "paciente", "MANUAL", "paciente"]);
  const n = regraDeEmissao(padrao, { ...base, nfModo: "NAO_EMITE" });
  assert.equal(n.emite, false); assert.equal(n.modo, "NAO_EMITE");
});

test("nota em nome do responsável ou de outra pessoa", () => {
  const resp = regraDeEmissao(padrao, { ...base, responsavelLegal: "Mãe Exemplo", nfEmNomeDe: "RESPONSAVEL", nfTomadorDocumento: "999.888.777-66" });
  assert.deepEqual([resp.tomador.tipo, resp.tomador.nome, resp.tomador.documento], ["RESPONSAVEL", "Mãe Exemplo", "999.888.777-66"]);
  const outro = regraDeEmissao(padrao, { ...base, nfEmNomeDe: "OUTRO", nfTomadorNome: "Empresa Exemplo Ltda", nfTomadorDocumento: "00.000.000/0001-00" });
  assert.equal(outro.tomador.tipo, "OUTRO");
  // "outro" sem nome cai no paciente em vez de emitir sem tomador
  assert.equal(regraDeEmissao(padrao, { ...base, nfEmNomeDe: "OUTRO" }).tomador.tipo, "PACIENTE");
});

test("convênio: forma de faturar do convênio (ou a padrão para convênio) e tomador é o convênio", () => {
  const pac = { ...base, convenioId: "c1", nfModo: "POR_SESSAO" }; // a forma do paciente não vale para convênio
  const lote = regraDeEmissao(padrao, pac, { nomeOperadora: "Amil", razaoSocial: "Amil Assistência Médica Ltda", cnpj: "29.309.127/0001-79", formaFaturamento: "LOTE_MENSAL" });
  assert.deepEqual([lote.modo, lote.modoOrigem], ["CONVENIO_LOTE_MENSAL", "convenio"]);
  assert.deepEqual([lote.tomador.tipo, lote.tomador.nome], ["CONVENIO", "Amil Assistência Médica Ltda"]);
  const padraoConv = regraDeEmissao(padrao, pac, { nomeOperadora: "Unimed" });
  assert.deepEqual([padraoConv.modo, padraoConv.modoOrigem, padraoConv.tomador.nome], ["CONVENIO_INDIVIDUAL", "clinica", "Unimed"]);
  assert.equal(regraDeEmissao(padrao, { ...pac, nfModo: "NAO_EMITE" }, { nomeOperadora: "Amil" }).emite, false);
});
