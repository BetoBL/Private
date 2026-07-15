import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

export interface DadosLaudoDocx {
  clinicaNome: string;
  profissionalNome: string;
  profissionalCrp: string;
  identificacao: Record<string, unknown>;
  descricaoDemanda: string;
  procedimento: string;
  analise: string;
  conclusao: string;
  referencias: string;
  iaUtilizada: boolean;
}

function paragrafosDeTexto(texto: string): Paragraph[] {
  const linhas = texto.split(/\n+/).filter((l) => l.trim().length > 0);
  if (linhas.length === 0) return [new Paragraph({ text: "—" })];
  return linhas.map((linha) => new Paragraph({ text: linha, spacing: { after: 160 } }));
}

export async function gerarDocxLaudo(dados: DadosLaudoDocx): Promise<Buffer> {
  const paragrafosIdentificacao = Object.entries(dados.identificacao).map(
    ([chave, valor]) => new Paragraph({ text: `${chave}: ${String(valor)}`, spacing: { after: 80 } })
  );

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: dados.clinicaNome, heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: "Laudo Psicológico", heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
          new Paragraph({
            text: `Conforme Resolução CFP nº 06/2019 · Responsável: ${dados.profissionalNome} (CRP ${dados.profissionalCrp})`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),

          new Paragraph({ text: "1. Identificação", heading: HeadingLevel.HEADING_1 }),
          ...paragrafosIdentificacao,

          new Paragraph({ text: "2. Descrição da demanda", heading: HeadingLevel.HEADING_1 }),
          ...paragrafosDeTexto(dados.descricaoDemanda),

          new Paragraph({ text: "3. Procedimento", heading: HeadingLevel.HEADING_1 }),
          ...paragrafosDeTexto(dados.procedimento),

          new Paragraph({ text: "4. Análise", heading: HeadingLevel.HEADING_1 }),
          ...paragrafosDeTexto(dados.analise),

          new Paragraph({ text: "5. Conclusão", heading: HeadingLevel.HEADING_1 }),
          ...paragrafosDeTexto(dados.conclusao),

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
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
