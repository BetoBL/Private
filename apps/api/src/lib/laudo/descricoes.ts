// Textos do laudo por teste. O catálogo guarda descrições técnicas ("cálculo executado a partir das fórmulas…"); o laudo usa a
// descrição clínica de uma linha. Teste sem texto aqui usa a descrição do catálogo, sem as frases internas.
const DESCRICAO: Record<string, string> = {
  "WAIS-III": "avalia a inteligência de adultos em quatro índices principais: Compreensão Verbal, Raciocínio Perceptual, Memória de Trabalho e Velocidade de Processamento.",
  RAVLT: "instrumento amplamente utilizado na neuropsicologia clínica para avaliar a memória episódica, a memória de curto prazo verbal, a memória de reconhecimento e a fixação.",
  FDT: "avalia a velocidade de processamento, a atenção e as funções executivas, como o controle inibitório e a flexibilidade cognitiva.",
  BPA: "instrumento psicológico que tem como objetivo avaliar a capacidade geral de atenção, assim como a avaliação individualizada de 3 tipos de atenção: concentrada, dividida e alternada.",
  BAI: "ferramenta de avaliação amplamente utilizada na área da saúde mental, especialmente na psicologia e na psiquiatria, para medir a intensidade de sintomas de ansiedade.",
  "BDI-II": "avalia a presença e a severidade da sintomatologia depressiva em adultos e adolescentes com mais de 13 anos de idade.",
  BFP: "instrumento psicológico construído para avaliação da personalidade a partir do modelo dos Cinco Grandes Fatores (CGF), que inclui as dimensões Extroversão, Socialização, Realização, Neuroticismo e Abertura a experiências.",
  SRS2: "escala padronizada que avalia, de forma quantitativa, os traços de responsividade social de crianças, adolescentes e adultos.",
};
const chave = (sigla: string) => (sigla.startsWith("SRS2") ? "SRS2" : sigla);

export function descricaoParaLaudo(sigla: string, descricaoCatalogo: string | null): string {
  const pronta = DESCRICAO[chave(sigla)];
  if (pronta) return pronta;
  return (descricaoCatalogo ?? "")
    .replace(/\s*Cálculo executado[^.]*\./gi, "")
    .replace(/^[A-Za-z0-9\-\s/]{1,25}:\s+/, "") // "RAVLT: tentativas…" → sem o prefixo repetido
    .trim();
}

// tira as notas internas do catálogo ("normas conforme planilha da psicóloga")
export function referenciaParaLaudo(ref: string | null): string {
  return (ref ?? "").replace(/\s*\((?:normas )?conforme planilha[^)]*\)/gi, "").replace(/\s+/g, " ").trim();
}
