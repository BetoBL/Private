import assert from "node:assert/strict";
import { test } from "node:test";
import { AlignmentType, Document, Packer, Paragraph, TextRun } from "docx";
import JSZip from "jszip";
import { gerarDocxLaudoCompleto, type DadosLaudoCompleto } from "./gerarDocxCompleto";
import { importarLaudoWord } from "./importarWord";
import { dominiosDoModelo, montarEstruturaLaudo, type AplicacaoLaudo } from "./montar";
import { estruturaValida, MODELOS_DO_SISTEMA, resolverMarcadores, type DadosMarcadores, type EstruturaModelo } from "./modelos";
import { marcadoresDoArquivo, preencherModeloWord } from "./modeloWord";
import mammoth from "mammoth";

const marc: DadosMarcadores = {
  clinica: { nome: "Clínica Exemplo", cidade: "São Paulo", endereco: "Rua A, 10", telefone: "(11) 3000-0000" },
  profissional: { nome: "Dra. Ana Exemplo", crp: "06/123456", tituloLaudo: "Psicóloga especialista em Neuropsicologia" },
  paciente: { nome: "Helena Exemplo Prado", cpf: "123.456.789-09", dataNascimento: new Date("2008-03-02T00:00:00Z"), idadeTexto: "18 anos" },
  data: new Date("2026-10-08T12:00:00Z"),
};
const dados = (modelo?: EstruturaModelo, extras: Record<string, string> = {}): DadosLaudoCompleto => ({
  clinica: { ...marc.clinica },
  profissional: { ...marc.profissional, especialidades: [], email: "ana@exemplo.com" },
  paciente: marc.paciente,
  laudo: { descricaoDemanda: "Avaliação de queixas de atenção.", anamnese: "", observacaoClinica: "", procedimento: "- **WAIS-III;** teste.", analise: "## Funções intelectuais\nTexto.", conclusao: "Conclusão do caso.", referencias: "WECHSLER, D. WAIS-III.", iaUtilizada: false, secoesExtras: extras },
  modelo, aplicacoes: [], sistema: "MIOTTO_2017", data: marc.data,
});
async function textoDoDocx(buf: Buffer): Promise<string> { return (await mammoth.extractRawText({ buffer: buf })).value; }

test("marcadores: troca os conhecidos e deixa os desconhecidos à vista", () => {
  assert.equal(resolverMarcadores("{{paciente.nome}}, CPF {{ paciente.cpf }}, nascida em {{paciente.nascimento}}.", marc), "Helena Exemplo Prado, CPF 123.456.789-09, nascida em 02/03/2008.");
  assert.equal(resolverMarcadores("{{local.data}}", marc), "São Paulo, 8 de outubro de 2026");
  assert.equal(resolverMarcadores("{{nao.existe}}", marc), "{{nao.existe}}");
});

test("modelos do sistema: estruturas válidas, ids únicos e o do laudo neuropsicológico mantém a ordem original", () => {
  const ids = new Set<string>();
  for (const m of MODELOS_DO_SISTEMA) { assert.equal(estruturaValida(m.estrutura), null, m.nome); assert.ok(!ids.has(m.id)); ids.add(m.id); }
  assert.equal(MODELOS_DO_SISTEMA.length, 6);
  const neuro = MODELOS_DO_SISTEMA[0].estrutura;
  assert.deepEqual(neuro.secoes.filter((s) => s.titulo).map((s) => s.titulo), ["IDENTIFICAÇÃO", "DEMANDA", "DADOS DE ANAMNESE", "OBSERVAÇÃO CLÍNICA", "INSTRUMENTOS CLÍNICOS", "REFERENCIAL TEÓRICO E METODOLÓGICO", "ANÁLISE DOS RESULTADOS", "CONCLUSÃO", "SUGESTÕES E ENCAMINHAMENTOS", "REFERÊNCIAS BIBLIOGRÁFICAS"]);
  assert.equal(estruturaValida({ cabecalho: [], secoes: [] }), "o modelo precisa de ao menos uma seção");
  assert.match(estruturaValida({ cabecalho: [], secoes: [{ id: "a", tipo: "x", titulo: "" }] }) ?? "", /desconhecido/);
});

test("documento: laudo neuropsicológico segue numerado como antes; CFP e declaração saem com a estrutura do modelo", async () => {
  const neuro = await textoDoDocx(await gerarDocxLaudoCompleto(dados(MODELOS_DO_SISTEMA[0].estrutura)));
  assert.match(neuro, /LAUDO PSICOLÓGICO\s+COM ENFOQUE NEUROPSICOLÓGICO/);
  assert.match(neuro, /1\. IDENTIFICAÇÃO[\s\S]*1\.1 IDENTIFICAÇÃO PROFISSIONAL[\s\S]*1\.2 IDENTIFICAÇÃO DO\(A\) PACIENTE/);
  assert.match(neuro, /5\. INSTRUMENTOS CLÍNICOS/);
  assert.match(neuro, /7\. ANÁLISE DOS RESULTADOS/);
  assert.match(neuro, /8\. CONCLUSÃO/);
  assert.match(neuro, /9\. REFERÊNCIAS BIBLIOGRÁFICAS/); // sem sugestões, a numeração não deixa buraco

  const cfp = await textoDoDocx(await gerarDocxLaudoCompleto(dados(MODELOS_DO_SISTEMA[1].estrutura, { solicitante: "Escola Exemplo", finalidade: "Orientação escolar" })));
  assert.match(cfp, /1\. IDENTIFICAÇÃO[\s\S]*Solicitante: Escola Exemplo[\s\S]*Finalidade: Orientação escolar/);
  assert.match(cfp, /2\. DESCRIÇÃO DA DEMANDA[\s\S]*3\. PROCEDIMENTO[\s\S]*4\. ANÁLISE[\s\S]*5\. CONCLUSÃO[\s\S]*6\. REFERÊNCIAS/);
  assert.doesNotMatch(cfp, /REFERENCIAL TEÓRICO/);

  const decl = await textoDoDocx(await gerarDocxLaudoCompleto(dados(MODELOS_DO_SISTEMA[4].estrutura)));
  assert.match(decl, /DECLARAÇÃO/);
  assert.match(decl, /Declaro, para os devidos fins, que Helena Exemplo Prado, CPF 123\.456\.789-09/);
  assert.match(decl, /CRP 06\/123456/);
  const declPaciente = await textoDoDocx(await gerarDocxLaudoCompleto(dados(MODELOS_DO_SISTEMA[4].estrutura, { texto: "Texto próprio deste paciente." })));
  assert.match(declPaciente, /Texto próprio deste paciente\./);
  assert.doesNotMatch(declPaciente, /Declaro, para os devidos fins/);
});

test("domínios do modelo: renomear, reordenar, ocultar e criar; sem configuração vale a lista padrão", () => {
  assert.equal(dominiosDoModelo().length, 9);
  const d = dominiosDoModelo({ dominios: [{ chave: "memoria", titulo: "Memória e aprendizagem" }, { chave: "executivas", intro: "" }, { chave: "intelectuais", ativo: false }, { chave: "meu-dominio", titulo: "Meu domínio" }] });
  assert.deepEqual(d.map((x) => x.titulo), ["Memória e aprendizagem", "Funções executivas", "Meu domínio"]);
  assert.equal(d[1].intro, undefined);
});

test("blocos e itens extras do modelo entram na análise do domínio escolhido", () => {
  const app: AplicacaoLaudo = {
    sigla: "XPTO", nome: "Teste Xpto", descricao: "d", referenciaBibliografica: null, dataSessao: new Date("2026-07-01"),
    resultado: { modo: "planilha", saidas: { a1: 40 } },
    layout: { tabelas: [{ titulo: "Resultado", colunas: ["Percentil"], linhas: [{ rotulo: "Escala X", valores: ["a1"] }] }] },
  };
  const e = montarEstruturaLaudo([app], { sistema: "MIOTTO_2017", primeiroNome: "Ana", config: { dominios: [{ chave: "memoria", titulo: "Memória e aprendizagem" }], itensExtras: [{ dominio: "memoria", teste: "XPTO", fonte: { linha: "Escala X" }, descricao: "Escala X do Xpto", rotulo: "Aprendizagem" }], blocos: [{ dominio: "memoria", teste: "XPTO", tipo: "tabela", ref: "Resultado" }] } });
  assert.match(e.analise, /## Memória e aprendizagem\n- \*\*Aprendizagem:\*\* Escala X do Xpto, percentil \*\*40%/);
  assert.match(e.analise, /\[\[tabela:layout\|XPTO\|Resultado\]\]/);
  assert.deepEqual(e.semMapa, []);
});

async function docxDeLaudo(linhas: Array<{ t: string; negrito?: boolean }>): Promise<Buffer> {
  const doc = new Document({ sections: [{ children: linhas.map((l) => new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: l.t, bold: l.negrito })] })) }] });
  return Packer.toBuffer(doc);
}

test("importar Word: títulos viram seções, campos comuns viram marcadores e testes/domínios são detectados", async () => {
  const buf = await docxDeLaudo([
    { t: "LAUDO PSICOLÓGICO", negrito: true },
    { t: "1. IDENTIFICAÇÃO", negrito: true },
    { t: "Nome: Maria da Silva" }, { t: "Solicitante: Dr. Fulano" }, { t: "Autora: Ana Exemplo" },
    { t: "2. DEMANDA", negrito: true }, { t: "Queixa de esquecimento." },
    { t: "3. INSTRUMENTOS", negrito: true }, { t: "WAIS-III e RAVLT foram aplicados." },
    { t: "4. ANÁLISE DOS RESULTADOS", negrito: true },
    { t: "Memória", negrito: true }, { t: "O RAVLT mostrou o desempenho esperado." },
    { t: "Funções executivas", negrito: true }, { t: "FDT dentro do esperado." },
    { t: "5. DECLARAÇÃO FINAL", negrito: true }, { t: "Atendida pela clínica, CPF 111.222.333-44." },
    { t: "6. CONCLUSÃO", negrito: true }, { t: "Conclusão." },
  ]);
  const r = await importarLaudoWord(buf, [{ sigla: "WAIS-III", nome: "Escala Wechsler de Inteligência para Adultos" }, { sigla: "RAVLT", nome: "Rey Auditory Verbal Learning Test" }, { sigla: "FDT", nome: "Five Digits Test" }, { sigla: "BAI", nome: "Inventário Beck de Ansiedade" }]);
  assert.deepEqual(r.estrutura.cabecalho, ["LAUDO PSICOLÓGICO"]);
  assert.equal(r.estrutura.numerar, true);
  assert.deepEqual(r.estrutura.secoes.map((s) => s.tipo), ["identificacao", "demanda", "instrumentos", "analise", "texto", "conclusao", "fecho"]);
  const id = r.estrutura.secoes[0].identificacao!;
  assert.deepEqual(id.map((b) => b.tipo), ["campos", "profissional", "paciente"]);
  assert.equal(id[0].campos![0].rotulo, "Solicitante");
  assert.match(String(r.estrutura.secoes[4].texto), /CPF \{\{paciente\.cpf\}\}/);
  assert.deepEqual(r.testesDetectados.map((t) => t.sigla).sort(), ["FDT", "RAVLT", "WAIS-III"]);
  assert.deepEqual(r.dominiosDetectados, ["Memória", "Funções executivas"]);
  assert.deepEqual(r.estrutura.dominios!.slice(0, 2).map((d) => d.chave), ["memoria", "executivas"]);
  assert.equal(estruturaValida(r.estrutura), null);
});

test("modelo Word da clínica: marcadores em runs separados são preenchidos e o texto das seções entra", async () => {
  const buf = await Packer.toBuffer(new Document({ sections: [{ children: [
    new Paragraph({ children: [new TextRun("DECLARAÇÃO")] }),
    new Paragraph({ children: [new TextRun({ text: "Declaro que {{paci", bold: true }), new TextRun("ente.nome}}, CPF {{paciente.cpf}}.")] }),
    new Paragraph({ children: [new TextRun("{{secao.demanda}}")] }),
    new Paragraph({ children: [new TextRun("{{marcador.inventado}}")] }),
  ] }] }));
  const base64 = buf.toString("base64");
  assert.deepEqual((await marcadoresDoArquivo(base64)).sort(), ["marcador.inventado", "paciente.cpf", "paciente.nome", "secao.demanda"]);
  const e = MODELOS_DO_SISTEMA[1].estrutura;
  const saida = await preencherModeloWord(base64, e, { demanda: "Linha 1\nLinha 2", anamnese: "", observacao: "", instrumentos: "", analise: "", conclusao: "", referencias: "", extras: {} }, marc);
  const texto = await textoDoDocx(saida);
  assert.match(texto, /Declaro que Helena Exemplo Prado, CPF 123\.456\.789-09\./);
  assert.match(texto, /Linha 1\s+Linha 2/);
  assert.match(texto, /\{\{marcador\.inventado\}\}/);
  assert.ok((await JSZip.loadAsync(saida)).files["word/document.xml"]);
});

test("seção 'documento': campos do paciente, linha de resultado e bloco só entram se o teste foi feito", async () => {
  const estrutura: EstruturaModelo = {
    cabecalho: ["RELATÓRIO"], numerar: false,
    secoes: [{ id: "doc", tipo: "documento", titulo: "", texto: "# Resultados\n{{paciente.primeiroNome}} fez a avaliação.\n[[linha:WAIS-III|c:vocabulario]]\n[[linha:RAVLT|c:a1]]\n[[tabela:resultados|BAI]]\nFim." }, { id: "fecho", tipo: "fecho", titulo: "" }],
  };
  const wais: AplicacaoLaudo = { sigla: "WAIS-III", nome: "WAIS", descricao: null, referenciaBibliografica: null, dataSessao: new Date("2026-07-01"), resultado: { modo: "por_campo", porCampo: { vocabulario: { valorBruto: 30, faixa: { percentil: 63 } } } } };
  const d = dados(estrutura);
  d.aplicacoes = [wais];
  const t = await textoDoDocx(await gerarDocxLaudoCompleto(d));
  assert.match(t, /Resultados/);
  assert.match(t, /Helena fez a avaliação\./);
  assert.match(t, /vocabulario: percentil 63% /);
  assert.doesNotMatch(t, /a1: percentil/); // RAVLT não foi aplicado
  assert.match(t, /Fim\./);
  const editado = await textoDoDocx(await gerarDocxLaudoCompleto(dados(estrutura, { doc: "Texto ajustado para {{paciente.nome}}." })));
  assert.match(editado, /Texto ajustado para Helena Exemplo Prado\./);
});

test("Word da clínica com blocos: tabela e gráfico entram no lugar do marcador; teste não aplicado some; o arquivo continua válido", async () => {
  const buf = await Packer.toBuffer(new Document({ sections: [{ children: [
    new Paragraph({ children: [new TextRun("Relatório de {{paciente.nome}}")] }),
    new Paragraph({ children: [new TextRun("{{tabela:wais-indices}}")] }),
    new Paragraph({ children: [new TextRun("{{grafico:wais-"), new TextRun("indices}}")] }),
    new Paragraph({ children: [new TextRun("{{tabela:resultados|RAVLT}}")] }),
    new Paragraph({ children: [new TextRun("Fim.")] }),
  ] }] }));
  const wais: AplicacaoLaudo = { sigla: "WAIS-III", nome: "WAIS", descricao: null, referenciaBibliografica: null, dataSessao: new Date("2026-07-01"), resultado: { modo: "por_campo", porCampo: { icv: { valorBruto: 1, faixa: { composto: 120, percentil: 91 } }, iop: { valorBruto: 1, faixa: { composto: 111, percentil: 77 } }, qit: { valorBruto: 1, faixa: { composto: 115, percentil: 84 } } } } };
  const d = dados(MODELOS_DO_SISTEMA[1].estrutura);
  d.aplicacoes = [wais];
  const saida = await preencherModeloWord(buf.toString("base64"), MODELOS_DO_SISTEMA[1].estrutura, { demanda: "", anamnese: "", observacao: "", instrumentos: "", analise: "", conclusao: "", referencias: "", extras: {} }, d);
  const texto = await textoDoDocx(saida);
  assert.match(texto, /Relatório de Helena Exemplo Prado/);
  assert.match(texto, /Índices Fatoriais do WAIS-III[\s\S]*ICV[\s\S]*120/);
  assert.doesNotMatch(texto, /\{\{|RAVLT/);
  assert.match(texto, /Fim\./);
  const zip = await JSZip.loadAsync(saida);
  assert.ok(Object.keys(zip.files).some((n) => /^word\/media\/blk\d+_\d+\.png$/.test(n)), "imagem do gráfico copiada");
  assert.match(await zip.files["word/_rels/document.xml.rels"].async("string"), /rIdBlk/);
});
