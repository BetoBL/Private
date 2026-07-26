export type SistemaClassificacaoPercentil = "GUILMETTE_2020" | "MIOTTO_2017";

export interface TabelaClassificacaoPercentil {
  titulo: string;
  citacao: string;
  linhas: Array<[string, string]>;
}

// Consenso da American Academy of Clinical Neuropsychology para nomenclatura uniforme de
// escores de teste — cortes percentílicos padrão da literatura internacional (98/91/75/25/9/2).
// Ver docs/referencia-excel-legado/README.md (achado nas telas "Classificação (Guilmette)").
const GUILMETTE_2020: TabelaClassificacaoPercentil = {
  titulo: "Referencial de classificação por percentil (Guilmette et al., 2020 — consenso AACN)",
  citacao:
    "Guilmette, T. J., Sweet, J. J., Hebben, N., Koltai, D., Mahone, E. M., Spiegler, B. J., Stucky, K., Westerveld, M., & Conference Participants (2020). American Academy of Clinical Neuropsychology consensus conference statement on uniform labeling of performance test scores. The Clinical Neuropsychologist, 34(3), 437-453.",
  linhas: [
    ["Excepcionalmente elevado", "≥ 98"],
    ["Acima da média", "97 a 91"],
    ["Média superior", "90 a 75"],
    ["Média", "74 a 25"],
    ["Média inferior", "24 a 9"],
    ["Abaixo da média", "8 a 2"],
    ["Excepcionalmente baixo", "< 2"],
  ],
};

// Adaptação de Miotto (2017), amplamente usada em manuais/laudos de neuropsicologia no Brasil.
const MIOTTO_2017: TabelaClassificacaoPercentil = {
  titulo: "Referencial de classificação por percentil (adaptado de Miotto, 2017)",
  citacao: "Miotto, E. C., Lucia, M. C. S., & Scaff, M. (2017). Neuropsicologia clínica.",
  linhas: [
    ["Muito superior à média", "> 98"],
    ["Superior à média", "97 a 91"],
    ["Média superior", "90 a 75"],
    ["Dentro da média", "74 a 25"],
    ["Média inferior", "24 a 9"],
    ["Limítrofe", "8 a 3"],
    ["Deficitário", "< 2"],
  ],
};

const TABELAS: Record<SistemaClassificacaoPercentil, TabelaClassificacaoPercentil> = {
  GUILMETTE_2020,
  MIOTTO_2017,
};

export function obterTabelaClassificacaoPercentil(sistema: SistemaClassificacaoPercentil): TabelaClassificacaoPercentil {
  return TABELAS[sistema];
}
