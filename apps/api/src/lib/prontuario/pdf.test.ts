import assert from "node:assert/strict";
import { test } from "node:test";
import { gerarProntuarioPdf, type ProntuarioDados } from "./pdf";

const base: ProntuarioDados = {
  clinica: { nome: "Clínica Teste", cnpj: null, endereco: null, telefone: null },
  paciente: { nome: "Paciente Teste", nascimento: new Date("1990-01-01T00:00:00Z"), cpf: null },
  profissional: { nome: "Dra. Teste", registroRotulo: "CRP", registro: "06/1" },
  geradoEm: new Date("2026-10-15T12:00:00Z"),
  evolucoes: [],
};
const paginas = (pdf: Buffer) => (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;

test("PDF do prontuário: uma evolução curta cabe em UMA página (sem página em branco do rodapé)", async () => {
  const pdf = await gerarProntuarioPdf({ ...base, evolucoes: [{ dataHora: new Date("2026-10-10T15:00:00Z"), modelo: "SOAP", campos: { s: "relato", p: "plano" }, evolucao: "texto", finalizada: true, profissional: "Dra. Teste" }] });
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
  assert.equal(paginas(pdf), 1);
});

test("PDF do prontuário: vazio e com muitas evoluções geram PDF válido, e o texto longo quebra em várias páginas", async () => {
  assert.equal(paginas(await gerarProntuarioPdf(base)), 1);
  const muitas = Array.from({ length: 30 }, (_, i) => ({ dataHora: new Date(2026, 0, i + 1, 10), modelo: "LIVRE", campos: null, evolucao: "linha de evolução ".repeat(60), finalizada: i % 2 === 0, profissional: "Dra. Teste" }));
  const pdf = await gerarProntuarioPdf({ ...base, evolucoes: muitas });
  assert.ok(paginas(pdf) > 3);
});
