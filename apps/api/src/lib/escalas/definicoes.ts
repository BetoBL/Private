// Escalas de triagem autoaplicáveis. Só entram instrumentos de USO LIVRE (PHQ-9 e GAD-7: Pfizer, sem necessidade de permissão; DASS-21: Lovibond,
// versão em português de Vignola e Tucci, 2014). Os textos seguem as versões publicadas em português; a revisão final do texto e da fonte
// é da responsável técnica antes do uso com pacientes reais. Resultado é TRIAGEM, não diagnóstico, e o paciente nunca vê a pontuação.

export type Opcao = { valor: number; rotulo: string };
export type Item = { id: number; texto: string; subescala?: string };
export type Faixa = { ate: number; rotulo: string; cor: "verde" | "amarelo" | "laranja" | "vermelho" };
export type Subescala = { chave: string; rotulo: string; faixas: Faixa[]; multiplicador?: number };
export type ItemFuncional = { texto: string; opcoes: Opcao[] };

export interface Escala {
  codigo: string;
  nome: string;
  sigla: string;
  construto: string;
  uso: string;
  tempo: string;
  fonte: string;
  instrucao: string;
  opcoes: Opcao[];
  itens: Item[];
  // pontuação: total (soma) com faixas, ou por subescala (soma × multiplicador) com faixas próprias
  faixasTotal?: Faixa[];
  maxTotal?: number;
  subescalas?: Subescala[];
  pontosDeCorte?: number[]; // linhas do gráfico
  itensCriticos?: number[]; // item que, marcado acima de 0, gera alerta de risco ao profissional
  itemFuncional?: ItemFuncional;
  frequenciaSugerida: string;
}

const FREQ4: Opcao[] = [
  { valor: 0, rotulo: "Nenhuma vez" }, { valor: 1, rotulo: "Vários dias" }, { valor: 2, rotulo: "Mais da metade dos dias" }, { valor: 3, rotulo: "Quase todos os dias" },
];
const FUNCIONAL: ItemFuncional = {
  texto: "Se você marcou algum dos problemas, quanta dificuldade eles causaram para trabalhar, cuidar das coisas em casa ou conviver com as pessoas?",
  opcoes: [{ valor: 0, rotulo: "Nenhuma dificuldade" }, { valor: 1, rotulo: "Alguma dificuldade" }, { valor: 2, rotulo: "Muita dificuldade" }, { valor: 3, rotulo: "Extrema dificuldade" }],
};

const PHQ9: Escala = {
  codigo: "PHQ9", nome: "Questionário sobre a Saúde do Paciente (PHQ-9)", sigla: "PHQ-9", construto: "Depressão", uso: "Adultos", tempo: "2 a 3 min",
  fonte: "Kroenke, Spitzer e Williams (2001), Pfizer, uso livre. Versão em português do Brasil (Santos et al., 2013).",
  instrucao: "Nas últimas 2 semanas, com que frequência você foi incomodado(a) por cada um dos problemas abaixo?",
  opcoes: FREQ4,
  itens: [
    { id: 1, texto: "Pouco interesse ou pouco prazer em fazer as coisas" },
    { id: 2, texto: "Sentir-se \"para baixo\", deprimido(a) ou sem perspectiva" },
    { id: 3, texto: "Dificuldade para pegar no sono ou permanecer dormindo, ou dormir mais do que o costume" },
    { id: 4, texto: "Sentir-se cansado(a) ou com pouca energia" },
    { id: 5, texto: "Falta de apetite ou comer demais" },
    { id: 6, texto: "Sentir-se mal consigo mesmo(a), ou achar que você é um fracasso, ou que decepcionou sua família ou a si mesmo(a)" },
    { id: 7, texto: "Dificuldade para se concentrar nas coisas, como ler o jornal ou ver televisão" },
    { id: 8, texto: "Lentidão para se movimentar ou falar, a ponto de outras pessoas perceberem, ou o oposto: estar tão agitado(a) ou inquieto(a) que você fica andando de um lado para o outro muito mais do que de costume" },
    { id: 9, texto: "Pensar em se ferir de alguma maneira ou que seria melhor estar morto(a)" },
  ],
  faixasTotal: [{ ate: 4, rotulo: "Mínima", cor: "verde" }, { ate: 9, rotulo: "Leve", cor: "amarelo" }, { ate: 14, rotulo: "Moderada", cor: "laranja" }, { ate: 19, rotulo: "Moderadamente grave", cor: "vermelho" }, { ate: 27, rotulo: "Grave", cor: "vermelho" }],
  maxTotal: 27, pontosDeCorte: [5, 10, 15, 20], itensCriticos: [9], itemFuncional: FUNCIONAL, frequenciaSugerida: "Linha de base e depois mensal",
};

const GAD7: Escala = {
  codigo: "GAD7", nome: "Transtorno de Ansiedade Generalizada (GAD-7)", sigla: "GAD-7", construto: "Ansiedade", uso: "Adultos", tempo: "2 min",
  fonte: "Spitzer, Kroenke, Williams e Löwe (2006), Pfizer, uso livre. Versão em português do Brasil.",
  instrucao: "Nas últimas 2 semanas, com que frequência você foi incomodado(a) por cada um dos problemas abaixo?",
  opcoes: FREQ4,
  itens: [
    { id: 1, texto: "Sentir-se nervoso(a), ansioso(a) ou muito tenso(a)" },
    { id: 2, texto: "Não ser capaz de impedir ou de controlar as preocupações" },
    { id: 3, texto: "Preocupar-se muito com diversas coisas" },
    { id: 4, texto: "Dificuldade para relaxar" },
    { id: 5, texto: "Ficar tão agitado(a) que se torna difícil permanecer sentado(a)" },
    { id: 6, texto: "Ficar facilmente aborrecido(a) ou irritado(a)" },
    { id: 7, texto: "Sentir medo como se algo horrível fosse acontecer" },
  ],
  faixasTotal: [{ ate: 4, rotulo: "Mínima", cor: "verde" }, { ate: 9, rotulo: "Leve", cor: "amarelo" }, { ate: 14, rotulo: "Moderada", cor: "laranja" }, { ate: 21, rotulo: "Grave", cor: "vermelho" }],
  maxTotal: 21, pontosDeCorte: [5, 10, 15], itemFuncional: FUNCIONAL, frequenciaSugerida: "Linha de base e depois mensal",
};

const DASS_FAIXAS = {
  D: [{ ate: 9, rotulo: "Normal", cor: "verde" }, { ate: 13, rotulo: "Leve", cor: "amarelo" }, { ate: 20, rotulo: "Moderada", cor: "laranja" }, { ate: 27, rotulo: "Severa", cor: "vermelho" }, { ate: 42, rotulo: "Extremamente severa", cor: "vermelho" }] as Faixa[],
  A: [{ ate: 7, rotulo: "Normal", cor: "verde" }, { ate: 9, rotulo: "Leve", cor: "amarelo" }, { ate: 14, rotulo: "Moderada", cor: "laranja" }, { ate: 19, rotulo: "Severa", cor: "vermelho" }, { ate: 42, rotulo: "Extremamente severa", cor: "vermelho" }] as Faixa[],
  S: [{ ate: 14, rotulo: "Normal", cor: "verde" }, { ate: 18, rotulo: "Leve", cor: "amarelo" }, { ate: 25, rotulo: "Moderada", cor: "laranja" }, { ate: 33, rotulo: "Severa", cor: "vermelho" }, { ate: 42, rotulo: "Extremamente severa", cor: "vermelho" }] as Faixa[],
};
const dass = (id: number, texto: string, sub: "D" | "A" | "S"): Item => ({ id, texto, subescala: sub });
const DASS21: Escala = {
  codigo: "DASS21", nome: "Escala de Depressão, Ansiedade e Estresse (DASS-21)", sigla: "DASS-21", construto: "Depressão, ansiedade e estresse", uso: "Adultos", tempo: "5 a 10 min",
  fonte: "Lovibond e Lovibond (1995), uso livre. Versão em português de Vignola e Tucci (2014).",
  instrucao: "Leia cada afirmação e marque quanto ela se aplicou a você durante a última semana.",
  opcoes: [{ valor: 0, rotulo: "Não se aplicou de maneira alguma" }, { valor: 1, rotulo: "Aplicou-se em algum grau, ou por pouco tempo" }, { valor: 2, rotulo: "Aplicou-se em um grau considerável, ou por uma boa parte do tempo" }, { valor: 3, rotulo: "Aplicou-se muito, ou na maioria do tempo" }],
  itens: [
    dass(1, "Achei difícil me acalmar.", "S"), dass(2, "Senti minha boca seca.", "A"), dass(3, "Não consegui vivenciar nenhum sentimento positivo.", "D"),
    dass(4, "Tive dificuldade em respirar em alguns momentos (por exemplo, respiração ofegante ou falta de ar sem ter feito esforço físico).", "A"),
    dass(5, "Achei difícil ter iniciativa para fazer as coisas.", "D"), dass(6, "Tive a tendência de reagir de forma exagerada às situações.", "S"),
    dass(7, "Senti tremores (por exemplo, nas mãos).", "A"), dass(8, "Senti que estava sempre nervoso(a).", "S"),
    dass(9, "Preocupei-me com situações em que eu pudesse entrar em pânico e parecer ridículo(a).", "A"), dass(10, "Senti que não tinha nada a desejar.", "D"),
    dass(11, "Senti-me agitado(a).", "S"), dass(12, "Achei difícil relaxar.", "S"), dass(13, "Senti-me depressivo(a) e sem ânimo.", "D"),
    dass(14, "Fui intolerante com as coisas que me impediam de continuar o que eu estava fazendo.", "S"), dass(15, "Senti que ia entrar em pânico.", "A"),
    dass(16, "Não consegui me entusiasmar com nada.", "D"), dass(17, "Senti que não tinha valor como pessoa.", "D"), dass(18, "Senti que estava um pouco emotivo(a) ou sensível demais.", "S"),
    dass(19, "Percebi meu coração alterado mesmo sem ter feito esforço físico (por exemplo, batimentos mais rápidos ou falhando).", "A"),
    dass(20, "Senti medo sem motivo.", "A"), dass(21, "Senti que a vida não tinha sentido.", "D"),
  ],
  subescalas: [
    { chave: "D", rotulo: "Depressão", faixas: DASS_FAIXAS.D, multiplicador: 2 },
    { chave: "A", rotulo: "Ansiedade", faixas: DASS_FAIXAS.A, multiplicador: 2 },
    { chave: "S", rotulo: "Estresse", faixas: DASS_FAIXAS.S, multiplicador: 2 },
  ],
  maxTotal: 42, itensCriticos: [21], frequenciaSugerida: "Linha de base e depois quinzenal ou mensal",
};

export const ESCALAS: Escala[] = [PHQ9, GAD7, DASS21];
export const escalaPorCodigo = (codigo: string) => ESCALAS.find((e) => e.codigo === codigo);
