// Textos do laudo por teste. O catálogo guarda descrições técnicas ("cálculo executado a partir das fórmulas…"); o laudo usa a
// descrição clínica de uma linha. Teste sem texto aqui usa a descrição do catálogo, sem as frases internas.
// Nome e descrição de cada instrumento como estão no laudo-modelo da psicóloga (palavra por palavra).
const INSTRUMENTO: Record<string, { nome: string; descricao: string }> = {
  "WAIS-III": { nome: "Escala Wechsler de Inteligência para Adultos WAIS-III", descricao: "avalia a inteligência de adultos em quatro índices principais: Compreensão Verbal, Raciocínio Perceptual, Memória de Trabalho e Velocidade de Processamento." },
  "RAVLT": { nome: "RAVLT - Teste de Aprendizagem Auditivo-Verbal de Rey", descricao: "instrumento amplamente utilizado na neuropsicologia clínica para avaliar a memória episódica, memória de curto prazo verbal, memória de reconhecimento e fixação." },
  "FDT": { nome: "FDT – Teste dos Cinco Dígitos", descricao: "avalia a velocidade de processamento, a atenção e as funções executivas, como o controle inibitório e a flexibilidade cognitiva." },
  "BPA": { nome: "BPA 2 - Bateria Psicológica para Avaliação da Atenção", descricao: "instrumento psicológico que tem como objetivo avaliar a capacidade geral de atenção, assim como a avaliação individualizada de 3 tipos de atenção - concentrada, dividida e alternada." },
  "BAI": { nome: "Inventário de Ansiedade de Beck", descricao: "é uma ferramenta de avaliação amplamente utilizada na área da saúde mental, especialmente na psicologia e psiquiatria." },
  "BDI-II": { nome: "Escala de depressão de Beck", descricao: "avalia a presença e severidade da sintomatologia depressiva em adultos e adolescentes com mais de 13 anos de idade." },
  "BFP": { nome: "BFP- Bateria Fatorial de Personalidade", descricao: "é um instrumento psicológico construído para avaliação de personalidade a partir do modelo dos Cinco Grandes Fatores (CGF), que inclui as dimensões: Extroversão, Socialização, Realização, Neuroticismo e Abertura a experiências." },
  "SRS2": { nome: "SRS-2 Escala de Responsividade Social – 2ª Edição", descricao: "é uma escala padronizada que avalia, de forma quantitativa, os traços de responsividade social de crianças, adolescentes e adultos." },
};
const chave = (sigla: string) => (sigla.startsWith("SRS2") ? "SRS2" : sigla);

export function descricaoParaLaudo(sigla: string, descricaoCatalogo: string | null): string {
  const pronta = INSTRUMENTO[chave(sigla)];
  if (pronta) return pronta.descricao;
  return (descricaoCatalogo ?? "")
    .replace(/\s*Cálculo executado[^.]*\./gi, "")
    .replace(/^[A-Za-z0-9\-\s/]{1,25}:\s+/, "") // "RAVLT: tentativas…" → sem o prefixo repetido
    .trim();
}

// tira as notas internas do catálogo ("normas conforme planilha da psicóloga")
export function referenciaParaLaudo(ref: string | null): string {
  return (ref ?? "").replace(/\s*\((?:normas )?conforme planilha[^)]*\)/gi, "").replace(/\s+/g, " ").trim();
}

// nome do instrumento na lista da seção 5 (o laudo-modelo usa o nome por extenso; os demais usam o nome do catálogo)
export function nomeParaLaudo(sigla: string, nomeCatalogo: string): string {
  return INSTRUMENTO[chave(sigla)]?.nome ?? nomeCatalogo;
}
