// Tipos de atendimento padrão para neuropsicologia e psicologia
// Para usar no seed.ts: importar e chamar criarTiposAtendimentoPadrao(clinicaId)

export const TIPOS_ATENDIMENTO_PADRAO = [
  // NEUROPSICOLOGIA
  {
    nome: "Avaliação Neuropsicológica Completa",
    descricao: "Avaliação abrangente de funções cognitivas, comportamentais e emocionais",
    numeroSessoes: 5,
    testeIds: ["WAIS-III", "WISC-IV", "RAVLT", "BRIEF2-PAIS", "Vineland"],
  },
  {
    nome: "Rastreio de Demência",
    descricao: "Avaliação rápida de cognição para triagem de déficit cognitivo",
    numeroSessoes: 2,
    testeIds: ["MEEM", "Montreal", "RAVLT", "Fluência Verbal"],
  },
  {
    nome: "Avaliação de TDAH",
    descricao: "Diagnóstico de Transtorno de Déficit de Atenção e Hiperatividade",
    numeroSessoes: 3,
    testeIds: ["ETDAH-PAIS", "BRIEF2-PAIS", "WAIS-III", "WISC-IV"],
  },
  {
    nome: "Avaliação de TEA",
    descricao: "Diagnóstico de Transtorno do Espectro Autista",
    numeroSessoes: 3,
    testeIds: ["SRS-2-ESCOLAR-MASCULINO", "AQ-50", "WAIS-III", "WISC-IV"],
  },
  {
    nome: "Avaliação Cognitiva Breve",
    descricao: "Triagem cognitiva rápida para monitoramento ou investigação inicial",
    numeroSessoes: 1,
    testeIds: ["MEEM", "Montreal", "Fluência Verbal"],
  },
  {
    nome: "Reavaliação/Monitoramento",
    descricao: "Comparação com avaliações anteriores para monitorar progresso",
    numeroSessoes: 2,
    testeIds: ["RAVLT", "WAIS-III", "WISC-IV"],
  },

  // PSICOLOGIA CLÍNICA
  {
    nome: "Psicodiagnóstico",
    descricao: "Avaliação diagnóstica de transtornos psicológicos e emocionais",
    numeroSessoes: 4,
    testeIds: ["BAI", "BDI-II", "SCARED-PAIS", "SCARED-AUTORRELATO", "BFP"],
  },
  {
    nome: "Avaliação Inicial Clínica",
    descricao: "Triagem e formulação inicial de caso para acompanhamento",
    numeroSessoes: 2,
    testeIds: ["BAI", "BDI-II"],
  },
  {
    nome: "Avaliação Infantil Comportamental",
    descricao: "Avaliação de problemas comportamentais e emocionais em crianças",
    numeroSessoes: 3,
    testeIds: ["CBCL", "ETDAH-PAIS", "SCARED-PAIS"],
  },
  {
    nome: "Avaliação de Ansiedade",
    descricao: "Diagnóstico e caracterização de transtornos de ansiedade",
    numeroSessoes: 2,
    testeIds: ["BAI", "SCARED-PAIS", "SCARED-AUTORRELATO"],
  },
  {
    nome: "Avaliação de Depressão",
    descricao: "Diagnóstico e caracterização de transtornos do humor",
    numeroSessoes: 2,
    testeIds: ["BDI-II", "BAI"],
  },

  // OUTROS
  {
    nome: "Avaliação Psicopedagógica",
    descricao: "Avaliação de dificuldades de aprendizagem e educacionais",
    numeroSessoes: 3,
    testeIds: ["WISC-IV", "Fluência Verbal"],
  },
  {
    nome: "Avaliação Ocupacional",
    descricao: "Avaliação de funcionalidade nas atividades de vida diária",
    numeroSessoes: 2,
    testeIds: ["RAVLT", "WAIS-III"],
  },
  {
    nome: "Laudo de Capacidade",
    descricao: "Avaliação para fins legais (testamento, tutela, curatela)",
    numeroSessoes: 2,
    testeIds: ["MEEM", "Montreal", "WAIS-III"],
  },
];
