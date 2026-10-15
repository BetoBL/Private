// Escalas de triagem autoaplicáveis. Só entram instrumentos de USO LIVRE (PHQ-9 e GAD-7: Pfizer, sem necessidade de permissão; DASS-21: Lovibond,
// versão em português de Vignola e Tucci, 2014). Os textos seguem as versões publicadas em português; a revisão final do texto e da fonte
// é da responsável técnica antes do uso com pacientes reais. Resultado é TRIAGEM, não diagnóstico, e o paciente nunca vê a pontuação.

export type Opcao = { valor: number; rotulo: string };
export type Item = { id: number; texto: string; subescala?: string; opcoes?: Opcao[] }; // `opcoes` próprias do item (ex.: AUDIT); sem isso vale a escala de resposta da escala
export type Faixa = { ate: number; rotulo: string; cor: "verde" | "amarelo" | "laranja" | "vermelho" };
export type Subescala = { chave: string; rotulo: string; faixas?: Faixa[]; multiplicador?: number }; // sem faixas = só o valor (ex.: grupos de sintomas do PCL-5)
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
  maxTotal?: number; // maior valor possível do total (já com o multiplicador)
  multiplicadorTotal?: number;
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

const FREQ_AUDIT: Opcao[] = [{ valor: 0, rotulo: "Nunca" }, { valor: 1, rotulo: "Menos de uma vez por mês" }, { valor: 2, rotulo: "Mensalmente" }, { valor: 3, rotulo: "Semanalmente" }, { valor: 4, rotulo: "Todos ou quase todos os dias" }];
const SIM_NAO_AUDIT: Opcao[] = [{ valor: 0, rotulo: "Não" }, { valor: 2, rotulo: "Sim, mas não nos últimos 12 meses" }, { valor: 4, rotulo: "Sim, nos últimos 12 meses" }];
const AUDIT: Escala = {
  codigo: "AUDIT", nome: "Teste de Identificação de Transtornos por Uso de Álcool (AUDIT)", sigla: "AUDIT", construto: "Uso de álcool", uso: "Adultos", tempo: "3 min",
  fonte: "Organização Mundial da Saúde (Babor et al., 2001), uso livre. Versão em português do Brasil.",
  instrucao: "As perguntas a seguir são sobre o seu consumo de bebidas alcoólicas nos últimos 12 meses. Responda com sinceridade: só o seu profissional lê as respostas.",
  opcoes: FREQ_AUDIT,
  itens: [
    { id: 1, texto: "Com que frequência você consome bebidas alcoólicas?", opcoes: [{ valor: 0, rotulo: "Nunca" }, { valor: 1, rotulo: "Uma vez por mês ou menos" }, { valor: 2, rotulo: "2 a 4 vezes por mês" }, { valor: 3, rotulo: "2 a 3 vezes por semana" }, { valor: 4, rotulo: "4 ou mais vezes por semana" }] },
    { id: 2, texto: "Nos dias em que você bebe, quantas doses costuma consumir?", opcoes: [{ valor: 0, rotulo: "1 ou 2" }, { valor: 1, rotulo: "3 ou 4" }, { valor: 2, rotulo: "5 ou 6" }, { valor: 3, rotulo: "7 a 9" }, { valor: 4, rotulo: "10 ou mais" }] },
    { id: 3, texto: "Com que frequência você toma 6 ou mais doses em uma única ocasião?" },
    { id: 4, texto: "Nos últimos 12 meses, com que frequência você achou que não conseguiria parar de beber depois de começar?" },
    { id: 5, texto: "Nos últimos 12 meses, com que frequência você deixou de fazer o que era esperado de você por causa da bebida?" },
    { id: 6, texto: "Nos últimos 12 meses, com que frequência você precisou beber pela manhã para se sentir bem depois de ter bebido muito no dia anterior?" },
    { id: 7, texto: "Nos últimos 12 meses, com que frequência você sentiu culpa ou remorso depois de beber?" },
    { id: 8, texto: "Nos últimos 12 meses, com que frequência você não conseguiu se lembrar do que aconteceu na noite anterior por causa da bebida?" },
    { id: 9, texto: "Alguma vez você ou outra pessoa se machucou ou foi prejudicada por causa de você ter bebido?", opcoes: SIM_NAO_AUDIT },
    { id: 10, texto: "Algum parente, amigo, médico ou outro profissional de saúde já se preocupou com o seu modo de beber ou sugeriu que você parasse?", opcoes: SIM_NAO_AUDIT },
  ],
  faixasTotal: [{ ate: 7, rotulo: "Baixo risco", cor: "verde" }, { ate: 15, rotulo: "Uso de risco", cor: "amarelo" }, { ate: 19, rotulo: "Uso nocivo", cor: "laranja" }, { ate: 40, rotulo: "Provável dependência", cor: "vermelho" }],
  maxTotal: 40, pontosDeCorte: [8, 16, 20], frequenciaSugerida: "Linha de base e depois conforme o risco",
};

const PCL5_GRUPOS: Array<[string, number[]]> = [["B", [1, 2, 3, 4, 5]], ["C", [6, 7]], ["D", [8, 9, 10, 11, 12, 13, 14]], ["E", [15, 16, 17, 18, 19, 20]]];
const pcl = (id: number, texto: string): Item => ({ id, texto, subescala: PCL5_GRUPOS.find(([, ids]) => ids.includes(id))![0] });
const PCL5: Escala = {
  codigo: "PCL5", nome: "Lista de Verificação de Sintomas de Estresse Pós-Traumático (PCL-5)", sigla: "PCL-5", construto: "Estresse pós-traumático", uso: "Adultos", tempo: "5 a 10 min",
  fonte: "Weathers et al. (2013), Centro Nacional de TEPT dos EUA, uso livre. Versão em português do Brasil.",
  instrucao: "Abaixo há uma lista de problemas que as pessoas às vezes têm depois de uma experiência muito estressante. Pensando nessa experiência, marque o quanto cada problema incomodou você no último mês.",
  opcoes: [{ valor: 0, rotulo: "Nada" }, { valor: 1, rotulo: "Um pouco" }, { valor: 2, rotulo: "Moderadamente" }, { valor: 3, rotulo: "Bastante" }, { valor: 4, rotulo: "Extremamente" }],
  itens: [
    pcl(1, "Lembranças repetidas, perturbadoras e indesejadas da experiência estressante."), pcl(2, "Sonhos repetidos e perturbadores com a experiência estressante."),
    pcl(3, "De repente, sentir ou agir como se a experiência estressante estivesse acontecendo de novo (como se você estivesse realmente de volta lá)."), pcl(4, "Ficar muito chateado(a) quando algo lembrou você da experiência estressante."),
    pcl(5, "Ter reações físicas fortes quando algo lembrou você da experiência (por exemplo, coração acelerado, dificuldade para respirar, suor)."), pcl(6, "Evitar lembranças, pensamentos ou sentimentos ligados à experiência estressante."),
    pcl(7, "Evitar pessoas ou coisas que lembrem a experiência estressante (por exemplo, pessoas, lugares, conversas, atividades, objetos ou situações)."), pcl(8, "Dificuldade para lembrar de partes importantes da experiência estressante."),
    pcl(9, "Ter crenças negativas fortes sobre você, outras pessoas ou o mundo (por exemplo, \"há algo de errado comigo\", \"não se pode confiar em ninguém\", \"o mundo é completamente perigoso\")."), pcl(10, "Culpar a si mesmo(a) ou a outra pessoa pela experiência estressante ou pelo que aconteceu depois dela."),
    pcl(11, "Ter sentimentos negativos fortes, como medo, horror, raiva, culpa ou vergonha."), pcl(12, "Perder o interesse em atividades de que você costumava gostar."), pcl(13, "Sentir-se distante ou isolado(a) das outras pessoas."),
    pcl(14, "Dificuldade de sentir emoções positivas (por exemplo, não conseguir sentir felicidade ou amor pelas pessoas próximas)."), pcl(15, "Comportamento irritável, explosões de raiva ou agir de forma agressiva."), pcl(16, "Correr riscos demais ou fazer coisas que poderiam machucar você."),
    pcl(17, "Ficar \"superalerta\", vigilante ou em guarda."), pcl(18, "Sentir-se sobressaltado(a) ou assustar-se com facilidade."), pcl(19, "Dificuldade para se concentrar."), pcl(20, "Dificuldade para pegar no sono ou continuar dormindo."),
  ],
  subescalas: [{ chave: "B", rotulo: "Revivência" }, { chave: "C", rotulo: "Evitação" }, { chave: "D", rotulo: "Humor e pensamentos" }, { chave: "E", rotulo: "Alerta e reatividade" }],
  faixasTotal: [{ ate: 30, rotulo: "Abaixo do ponto de corte", cor: "verde" }, { ate: 80, rotulo: "Acima do ponto de corte (31 ou mais)", cor: "vermelho" }],
  maxTotal: 80, pontosDeCorte: [31], frequenciaSugerida: "Linha de base e reavaliação em 4 a 6 semanas",
};

const WHO5: Escala = {
  codigo: "WHO5", nome: "Índice de Bem-Estar da OMS (WHO-5)", sigla: "WHO-5", construto: "Bem-estar", uso: "Adultos", tempo: "1 min",
  fonte: "Organização Mundial da Saúde (1998), uso livre. Versão em português.",
  instrucao: "Marque, para cada frase, a opção mais próxima de como você se sentiu nas últimas duas semanas.",
  opcoes: [{ valor: 5, rotulo: "O tempo todo" }, { valor: 4, rotulo: "A maior parte do tempo" }, { valor: 3, rotulo: "Mais da metade do tempo" }, { valor: 2, rotulo: "Menos da metade do tempo" }, { valor: 1, rotulo: "De vez em quando" }, { valor: 0, rotulo: "Nunca" }],
  itens: [
    { id: 1, texto: "Eu me senti alegre e de bom humor." }, { id: 2, texto: "Eu me senti calmo(a) e relaxado(a)." }, { id: 3, texto: "Eu me senti ativo(a) e com energia." },
    { id: 4, texto: "Eu acordei me sentindo renovado(a) e descansado(a)." }, { id: 5, texto: "Meu dia a dia tem sido preenchido por coisas que me interessam." },
  ],
  faixasTotal: [{ ate: 28, rotulo: "Muito baixo (rastrear depressão)", cor: "vermelho" }, { ate: 49, rotulo: "Baixo", cor: "laranja" }, { ate: 100, rotulo: "Adequado", cor: "verde" }],
  maxTotal: 100, multiplicadorTotal: 4, pontosDeCorte: [28, 50], frequenciaSugerida: "Linha de base e depois mensal",
};

const SWLS: Escala = {
  codigo: "SWLS", nome: "Escala de Satisfação com a Vida (SWLS)", sigla: "SWLS", construto: "Satisfação com a vida", uso: "Adultos", tempo: "1 min",
  fonte: "Diener, Emmons, Larsen e Griffin (1985), uso livre. Versão em português.",
  instrucao: "Marque o quanto você concorda com cada afirmação, pensando na sua vida de modo geral.",
  opcoes: [{ valor: 1, rotulo: "Discordo totalmente" }, { valor: 2, rotulo: "Discordo" }, { valor: 3, rotulo: "Discordo um pouco" }, { valor: 4, rotulo: "Nem concordo nem discordo" }, { valor: 5, rotulo: "Concordo um pouco" }, { valor: 6, rotulo: "Concordo" }, { valor: 7, rotulo: "Concordo totalmente" }],
  itens: [
    { id: 1, texto: "Na maioria dos aspectos, minha vida está próxima do meu ideal." }, { id: 2, texto: "As condições da minha vida são excelentes." }, { id: 3, texto: "Estou satisfeito(a) com a minha vida." },
    { id: 4, texto: "Até agora, consegui as coisas importantes que quero da vida." }, { id: 5, texto: "Se pudesse viver a minha vida de novo, não mudaria quase nada." },
  ],
  faixasTotal: [{ ate: 9, rotulo: "Extremamente insatisfeito(a)", cor: "vermelho" }, { ate: 14, rotulo: "Insatisfeito(a)", cor: "laranja" }, { ate: 19, rotulo: "Ligeiramente insatisfeito(a)", cor: "amarelo" }, { ate: 20, rotulo: "Neutro", cor: "amarelo" }, { ate: 25, rotulo: "Ligeiramente satisfeito(a)", cor: "verde" }, { ate: 30, rotulo: "Satisfeito(a)", cor: "verde" }, { ate: 35, rotulo: "Extremamente satisfeito(a)", cor: "verde" }],
  maxTotal: 35, pontosDeCorte: [20], frequenciaSugerida: "Linha de base e depois periódica",
};

export const ESCALAS: Escala[] = [PHQ9, GAD7, DASS21, AUDIT, PCL5, WHO5, SWLS];
export const escalaPorCodigo = (codigo: string) => ESCALAS.find((e) => e.codigo === codigo);
