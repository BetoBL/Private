import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { obterTabelaClassificacaoPercentil, type SistemaClassificacaoPercentil } from "./classificacaoPercentil";

export interface DadosLaudoDocx {
  clinicaNome: string;
  clinicaCidade?: string | null;
  profissionalNome: string;
  profissionalCrp: string;
  profissionalEspecialidades?: string[];
  identificacao: Record<string, unknown>;
  descricaoDemanda: string;
  procedimento: string;
  analise: string;
  conclusao: string;
  referencias: string;
  iaUtilizada: boolean;
  // Mais de uma convenção de classificação por percentil é usada na prática clínica (ver
  // classificacaoPercentil.ts) — é uma escolha do profissional (PerfilDeAtuacao), não fixa.
  sistemaClassificacaoPercentil: SistemaClassificacaoPercentil;
}

/**
 * Converte um bloco de texto seguindo a convenção markdown leve usada pelo rascunho de IA
 * (ver gerarRascunhoLaudo.ts): "## " vira subtítulo, "- " vira item de lista, o resto é parágrafo.
 */
function paragrafosMarkdown(texto: string): Paragraph[] {
  const linhas = texto.split(/\n+/).filter((l) => l.trim().length > 0);
  if (linhas.length === 0) return [new Paragraph({ text: "—" })];

  return linhas.map((linhaBruta) => {
    const linha = linhaBruta.trim();
    if (linha.startsWith("## ")) {
      return new Paragraph({ text: linha.slice(3).trim(), heading: HeadingLevel.HEADING_3, spacing: { before: 240, after: 120 } });
    }
    if (linha.startsWith("- ")) {
      return new Paragraph({ text: linha.slice(2).trim(), bullet: { level: 0 }, spacing: { after: 80 } });
    }
    return new Paragraph({ text: linha, spacing: { after: 160 } });
  });
}

function tabelaReferenciaClassificacao(sistema: SistemaClassificacaoPercentil): Table {
  const { linhas: linhasClassificacao } = obterTabelaClassificacaoPercentil(sistema);
  const linhaCabecalho = new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Classificação", bold: true })] })] }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Percentil %", bold: true })] })] }),
    ],
  });
  const linhas = linhasClassificacao.map(
    ([classificacao, percentil]) =>
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: classificacao })] }),
          new TableCell({ children: [new Paragraph({ text: percentil })] }),
        ],
      })
  );
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [linhaCabecalho, ...linhas] });
}

export async function gerarDocxLaudo(dados: DadosLaudoDocx): Promise<Buffer> {
  const classificacao = obterTabelaClassificacaoPercentil(dados.sistemaClassificacaoPercentil);

  const paragrafosIdentificacao = Object.entries(dados.identificacao).map(
    ([chave, valor]) => new Paragraph({ text: `${chave}: ${String(valor)}`, spacing: { after: 80 } })
  );

  const tituloProfissional =
    dados.profissionalEspecialidades && dados.profissionalEspecialidades.length > 0
      ? `Especialista em ${dados.profissionalEspecialidades.join(", ")}`
      : "";

  const localEData = `${dados.clinicaCidade ? `${dados.clinicaCidade}, ` : ""}${new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })}.`;

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: dados.clinicaNome, heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: "Laudo Psicológico", heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: "com enfoque neuropsicológico", alignment: AlignmentType.CENTER, spacing: { after: 120 } }),
          new Paragraph({
            text: "Laudo realizado de acordo com as Resoluções CFP nº 06/2019 e nº 09/2018, que constituem o Manual de Elaboração de Documentos Psicológicos e as diretrizes para avaliação psicológica.",
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),

          new Paragraph({ text: "1. Identificação", heading: HeadingLevel.HEADING_1 }),
          ...paragrafosIdentificacao,

          new Paragraph({ text: "2. Descrição da demanda", heading: HeadingLevel.HEADING_1 }),
          ...paragrafosDeTexto(dados.descricaoDemanda),

          new Paragraph({ text: "3. Procedimento", heading: HeadingLevel.HEADING_1 }),
          ...paragrafosDeTexto(dados.procedimento),

          new Paragraph({ text: classificacao.titulo, heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }),
          tabelaReferenciaClassificacao(dados.sistemaClassificacaoPercentil),
          new Paragraph({
            spacing: { before: 80, after: 160 },
            children: [new TextRun({ italics: true, size: 18, text: classificacao.citacao })],
          }),

          new Paragraph({ text: "4. Análise dos Resultados", heading: HeadingLevel.HEADING_1, spacing: { before: 300 } }),
          ...paragrafosMarkdown(dados.analise),

          new Paragraph({ text: "5. Conclusão", heading: HeadingLevel.HEADING_1 }),
          ...paragrafosMarkdown(dados.conclusao),

          new Paragraph({ text: "6. Referências", heading: HeadingLevel.HEADING_1 }),
          ...paragrafosDeTexto(dados.referencias),

          ...(dados.iaUtilizada
            ? [
                new Paragraph({
                  spacing: { before: 300 },
                  children: [
                    new TextRun({
                      italics: true,
                      text: "Este laudo contou com apoio de Inteligência Artificial na redação do rascunho de Análise e Conclusão, sempre revisado e validado pelo profissional responsável, conforme Resolução CFP nº 09/2024.",
                    }),
                  ],
                }),
              ]
            : []),

          new Paragraph({ text: localEData, spacing: { before: 480, after: 480 } }),
          new Paragraph({ text: "___________________________________________________" }),
          new Paragraph({ text: dados.profissionalNome, spacing: { after: 40 } }),
          ...(tituloProfissional ? [new Paragraph({ text: tituloProfissional, spacing: { after: 40 } })] : []),
          new Paragraph({ text: `CRP ${dados.profissionalCrp}`, spacing: { after: 300 } }),

          new Paragraph({
            spacing: { after: 160 },
            children: [
              new TextRun({
                italics: true,
                size: 18,
                text: "Este laudo não poderá ser utilizado para fins diferentes do apontado no item de identificação. Possui caráter sigiloso e se trata de documento extrajudicial; a autora não se responsabiliza pelo uso dado ao laudo pela parte solicitante após a sua entrega em entrevista devolutiva, conforme normas éticas do Conselho Federal de Psicologia.",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                italics: true,
                size: 18,
                text: "VALIDADE: conforme normas do Conselho Federal de Psicologia, este documento possui validade de 5 (cinco) anos. Contudo, o funcionamento cognitivo é dinâmico e suscetível a modificações ao longo do tempo; os resultados mantêm fidedignidade por aproximadamente 1 (um) ano, após o qual podem não representar adequadamente o padrão de funcionamento atual do(a) paciente.",
              }),
            ],
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

function paragrafosDeTexto(texto: string): Paragraph[] {
  const linhas = texto.split(/\n+/).filter((l) => l.trim().length > 0);
  if (linhas.length === 0) return [new Paragraph({ text: "—" })];
  return linhas.map((linha) => new Paragraph({ text: linha, spacing: { after: 160 } }));
}
