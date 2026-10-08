// Mapa "teste → domínio" do laudo (modelo MentEssence, seção 7). Cada item vira uma linha do tipo
// "- **Rótulo:** Teste, percentil **NN% Classificação**." dentro do domínio e do grupo certos.
// Um mesmo subteste pode aparecer em mais de um domínio (ex.: Compreensão em memória semântica e em julgamento social).
//
// TEXTOS: os parágrafos de introdução abaixo são a redação ORIGINAL do laudo-modelo da psicóloga, palavra por palavra (inclusive
// onde parece haver deslize de digitação). Não "melhorar" aqui: qualquer ajuste de texto é decisão dela
// (ver docs/testes/PERGUNTAS-PARA-LETICIA.md, seção 10). Cada texto é um bloco padrão editável no laudo.

export type DominioChave = "intelectuais" | "linguagem" | "memoria" | "executivas" | "atencionais" | "visuoconstrutivas" | "emocionais" | "psicoafetivos" | "outras";

export const DOMINIOS: Array<{ chave: DominioChave; titulo: string; intro?: string }> = [
  { chave: "intelectuais", titulo: "Funções intelectuais" },
  {
    chave: "linguagem",
    titulo: "Linguagem",
    intro:
      "A linguagem manifesta-se na forma de “compreensão” receptiva e de decodificação do input linguístico (“compreensão verbal”), que inclui a audição e a leitura, ou no aspecto de codificação expressiva produção, que inclui fala, escrita.",
  },
  { chave: "memoria", titulo: "Memória" },
  { chave: "executivas", titulo: "Funções executivas", intro: "Funções executivas são as habilidades cognitivas que nos permitem planejar, organizar, tomar decisões, manter a atenção, adaptar a situações inesperadas e controlar nossas respostas emocionais." },
  { chave: "atencionais", titulo: "Funções atencionais" },
  { chave: "visuoconstrutivas", titulo: "Funções visuoconstrutivas e praxia", intro: "Quando falamos de visuoconstrução, ou também chamada de praxia visuoconstrutiva, estamos nos referindo sobre nossa habilidade de reproduzir desenhos, modelos ou construções. Quanto ao aspecto visuoespacial, ele é a nossa capacidade de localizar objetos no espaço." },
  { chave: "emocionais", titulo: "Aspectos emocionais" },
  { chave: "psicoafetivos", titulo: "Aspectos psicoafetivos" },
  { chave: "outras", titulo: "Outras escalas" },
];

// Fonte do valor: subteste/índice de um módulo "por_campo" (WAIS/WISC/WASI) ou linha da tabela de resultado de um teste do motor de planilha.
export type Fonte = { campo: string } | { linha: string };

export interface ItemMapa {
  teste: string; // sigla
  fonte: Fonte;
  descricao: string; // "Subteste Vocabulário", "FDT inibição"...
  rotulo?: string; // negrito inicial da linha (ex.: "Controle inibitório"); sem rótulo, só a descrição
}

export interface GrupoMapa {
  dominio: DominioChave;
  chave: string;
  intro?: string;
  itens: ItemMapa[];
  // frase-síntese ao final do domínio (como o laudo faz em funções executivas e atencionais)
  sintese?: boolean;
  // tokens inseridos depois das linhas do grupo, só se o teste foi aplicado
  blocos?: Array<{ teste: string; token: string }>;
}

export const GRUPOS: GrupoMapa[] = [
  // ---- Funções intelectuais: texto dos índices + tabela e gráfico ----
  {
    dominio: "intelectuais",
    chave: "indices",
    intro: [
      "As Escala de Inteligência de Wechsler para Adultos (WAIS-III), foram elaboradas com a finalidade de auxiliar na avaliação do funcionamento intelectual de adultos, avaliam a capacidade em lidar com símbolos abstratos, a qualidade da educação formal e da estimulação do ambiente, a compreensão, memória e fluência verbal.",
      "**Índice de Compreensão Verbal** avalia a capacidade de compreender, utilizar e pensar com base em informações verbais.",
      "**Índice de Organização Perceptual** mede a capacidade de perceber, organizar e raciocinar com informações visuais.",
      "**Índice de Memória Operacional** (também chamada de memória de trabalho) é uma função cognitiva responsável por armazenar temporariamente e manipular informações necessárias para tarefas complexas.",
      "**Índice de Velocidade de Processamento** avalia a capacidade de perceber, processar e responder rapidamente a estímulos visuais simples, com precisão e coordenação visomotora sob pressão de tempo.",
      "**QI Total** representa a capacidade intelectual geral do indivíduo, integrando habilidades de compreensão verbal, raciocínio perceptual, memória de trabalho e velocidade de processamento.",
    ].join("\n"),
    itens: [],
    blocos: [{ teste: "WAIS-III", token: "tabela:wais-indices" }, { teste: "WAIS-III", token: "grafico:wais-indices" }],
  },

  // ---- Linguagem ----
  {
    dominio: "linguagem",
    chave: "linguagem-wais",
    itens: [
      { teste: "WAIS-III", fonte: { campo: "vocabulario" }, descricao: "Subteste Vocabulário" },
      { teste: "WAIS-III", fonte: { campo: "semelhancas" }, descricao: "Subteste Semelhanças" },
      { teste: "WAIS-III", fonte: { campo: "informacao" }, descricao: "Subteste Informação" },
    ],
  },

  // ---- Memória ----
  {
    dominio: "memoria",
    chave: "operacional",
    intro: "A memória operacional, também conhecida como memória de trabalho, corresponde à capacidade do cérebro de assimilar informações à medida que realizamos determinadas tarefas.",
    itens: [
      { teste: "WAIS-III", fonte: { campo: "digitos" }, descricao: "WAIS-III, Dígitos", rotulo: "Memória operacional" },
      { teste: "WAIS-III", fonte: { campo: "sequenciaNumerosLetras" }, descricao: "WAIS-III, Sequência de Números e Letras", rotulo: "Memória operacional" },
    ],
  },
  {
    dominio: "memoria",
    chave: "semantica",
    intro: "A memória semântica é um tipo de memória de longo prazo que envolve o armazenamento e a recuperação de conhecimento geral sobre o mundo.",
    itens: [
      { teste: "WAIS-III", fonte: { campo: "informacao" }, descricao: "WAIS-III, Informação", rotulo: "Memória semântica" },
      { teste: "WAIS-III", fonte: { campo: "vocabulario" }, descricao: "WAIS-III, Vocabulário", rotulo: "Memória semântica" },
      { teste: "WAIS-III", fonte: { campo: "compreensao" }, descricao: "WAIS-III, Compreensão", rotulo: "Memória semântica" },
    ],
  },
  {
    dominio: "memoria",
    chave: "episodica",
    intro: "A memória episódica verbal é a capacidade de recordar e relatar experiências pessoais e eventos específicos, através de palavras. Trata-se de uma forma de memória episódica que envolve a recordação de informações que foram adquiridas verbalmente.",
    itens: [
      { teste: "RAVLT", fonte: { linha: "A1" }, descricao: "RAVLT, tentativa A1", rotulo: "Memória de curto prazo verbal" },
      { teste: "RAVLT", fonte: { linha: "B1" }, descricao: "RAVLT, lista de interferência B1", rotulo: "Memória de curto prazo verbal" },
      { teste: "RAVLT", fonte: { linha: "Escore Total" }, descricao: "RAVLT, escore total de aprendizagem ao longo das tentativas", rotulo: "Memória episódica verbal" },
      { teste: "RAVLT", fonte: { linha: "A6" }, descricao: "RAVLT, 6ª tentativa (evocação após interferência)", rotulo: "Memória episódica verbal" },
      { teste: "RAVLT", fonte: { linha: "A7" }, descricao: "RAVLT, 7ª tentativa (evocação tardia)", rotulo: "Memória episódica verbal" },
    ],
    blocos: [{ teste: "RAVLT", token: "grafico:RAVLT|Quantidade de palavras" }],
  },

  // ---- Funções executivas (cada definição é seguida da sua linha, como no laudo-modelo) ----
  {
    dominio: "executivas",
    chave: "inibicao",
    intro: "O controle inibitório é uma função executiva que envolve a capacidade de suprimir ou inibir respostas automáticas, impulsivas ou predominantes para comportamentos mais apropriados ou desejados.",
    itens: [{ teste: "FDT", fonte: { linha: "Inibição" }, descricao: "FDT inibição", rotulo: "Controle inibitório" }],
    sintese: true,
  },
  {
    dominio: "executivas",
    chave: "flexibilidade",
    intro: "A flexibilidade cognitiva é uma função executiva que envolve a capacidade de ajustar rapidamente pensamentos e comportamentos em resposta a mudanças no ambiente, regras ou objetivos.",
    itens: [{ teste: "FDT", fonte: { linha: "Flexibilidade" }, descricao: "FDT flexibilidade", rotulo: "Flexibilidade Cognitiva" }],
    sintese: true,
    blocos: [{ teste: "FDT", token: "grafico:FDT|TEMPO" }],
  },
  {
    dominio: "executivas",
    chave: "raciocinio",
    intro: "O raciocínio lógico é a habilidade de analisar informações, identificar padrões e relações, e tirar conclusões coerentes com base em premissas ou dados disponíveis.",
    itens: [{ teste: "WAIS-III", fonte: { campo: "raciocinioMatricial" }, descricao: "subteste Raciocínio Matricial", rotulo: "Raciocínio Lógico" }],
    sintese: true,
  },
  {
    dominio: "executivas",
    chave: "julgamento",
    intro: "O julgamento social é a capacidade de fazer avaliações e tomar decisões com base nas normas sociais, expectativas e contextos interpessoais.",
    itens: [{ teste: "WAIS-III", fonte: { campo: "compreensao" }, descricao: "subteste Compreensão - WAIS III", rotulo: "Julgamento Social" }],
    sintese: true,
  },

  // ---- Funções atencionais ----
  {
    dominio: "atencionais",
    chave: "concentrada",
    intro: "A atenção concentrada, também conhecida como atenção focalizada, refere-se à capacidade de manter o foco em uma única tarefa ou estímulo por um período.",
    itens: [{ teste: "BPA", fonte: { linha: "Atenção Concentrada - AC" }, descricao: "BPA – atenção concentrada", rotulo: "Atenção concentrada" }],
    sintese: true,
  },
  {
    dominio: "atencionais",
    chave: "dividida",
    intro: "A atenção dividida é a capacidade de focar em mais de uma tarefa ou estímulo ao mesmo tempo, permitindo processar diferentes informações simultaneamente.",
    itens: [{ teste: "BPA", fonte: { linha: "Atenção Dividida - AD" }, descricao: "BPA – atenção dividida", rotulo: "Atenção dividida" }],
    sintese: true,
  },
  {
    dominio: "atencionais",
    chave: "alternada",
    intro: "A atenção alternada é a capacidade de mudar o foco entre duas ou mais tarefas ou estímulos diferentes que requerem atenção.",
    itens: [{ teste: "BPA", fonte: { linha: "Atenção Alternada - AA" }, descricao: "BPA – alternada", rotulo: "Atenção alternada" }],
    sintese: true,
    blocos: [{ teste: "BPA", token: "grafico:BPA|" }],
  },

  // ---- Visuoconstrução ----
  { dominio: "visuoconstrutivas", chave: "cubos", itens: [{ teste: "WAIS-III", fonte: { campo: "cubos" }, descricao: "Cubos do WAIS-III" }] },

  // ---- Aspectos emocionais ----
  { dominio: "emocionais", chave: "bai", intro: "- Inventário de Ansiedade de Beck\nO BAI (Inventário de Ansiedade de Beck) é uma ferramenta de avaliação amplamente utilizada na área da saúde mental, especialmente na psicologia e psiquiatria.", itens: [], blocos: [{ teste: "BAI", token: "tabela:bai" }] },
  { dominio: "emocionais", chave: "bdi", intro: "- Escala de depressão de Beck\nA escala BDI-II avalia a presença e severidade da sintomatologia depressiva em adultos e adolescentes com mais de 13 anos de idade.", itens: [], blocos: [{ teste: "BDI-II", token: "tabela:bdi" }] },

  // ---- Aspectos psicoafetivos (BFP) ----
  {
    dominio: "psicoafetivos",
    chave: "bfp",
    intro: [
      "- BFP- Bateria Fatorial de Personalidade",
      "A **Bateria Fatorial de Personalidade (BFP)** é um instrumento que avalia a personalidade com base no modelo dos Cinco Grandes Fatores: Extroversão, Socialização, Realização, Neuroticismo e Abertura.",
      "**Extroversão:** refere-se ao nível de comunicação, assertividade e interação social do indivíduo.",
      "**Socialização:** diz respeito à qualidade das relações interpessoais, variando de empatia a atitudes mais antagonistas.",
      "**Neuroticismo:** relaciona-se à instabilidade emocional e à maior propensão ao sofrimento psicológico.",
      "**Realização:** envolve organização, persistência, controle e motivação.",
      "**Abertura:** refere-se ao interesse por novas experiências e comportamento exploratório.",
    ].join("\n"),
    itens: [
      { teste: "BFP", fonte: { linha: "Neuroticismo" }, descricao: "BFP, Neuroticismo" },
      { teste: "BFP", fonte: { linha: "Extroversão" }, descricao: "BFP, Extroversão" },
      { teste: "BFP", fonte: { linha: "Socialização" }, descricao: "BFP, Socialização" },
      { teste: "BFP", fonte: { linha: "Realização" }, descricao: "BFP, Realização" },
      { teste: "BFP", fonte: { linha: "Abertura" }, descricao: "BFP, Abertura" },
    ],
    blocos: [{ teste: "BFP", token: "grafico:BFP|Perfil do Respondente" }],
  },

  // ---- Outras escalas ----
  { dominio: "outras", chave: "srs2", intro: "SRS -2 - Escala de Responsividade Social É uma ferramenta de avaliação usada para medir sintomas associados ao Transtorno do Espectro Autista (TEA) em crianças, adolescentes e adultos.", itens: [], blocos: [{ teste: "SRS2", token: "tabela:srs2" }, { teste: "SRS2", token: "grafico:SRS2|Autorrelato" }] },
];

// "Instrumentos clínicos" (seção 5): principais × complementares
export const COMPLEMENTARES = new Set(["BAI", "BDI-II", "BFP", "SRS2", "SRS-2", "SCARED", "ETDAH-PAIS", "ETDAH-AD", "ETDAH-CRIAD", "ETDAH-2", "SDQ", "SNAP-IV", "EPQ-J", "AQ-50"]);

// teste do laudo → siglas do catálogo que o representam (o SRS-2 existe em 3 versões)
export const SIGLAS_DO_TESTE: Record<string, string[]> = {
  SRS2: ["SRS2-ADULTOS", "SRS2-ESCOLAR", "SRS2-PRE-ESCOLAR"],
};
export const siglasDe = (teste: string) => SIGLAS_DO_TESTE[teste] ?? [teste];
