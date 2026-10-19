// Catálogo do Cartão Diário: o que o paciente pode escolher em cada etapa. Texto próprio do sistema (inspirado em fluxos de check-in
// emocional em geral, sem copiar nenhum produto). Os apoios por família e a lista de emoções e ações PRECISAM de revisão da psicóloga
// responsável antes do uso com pacientes. Mudou o catálogo? Suba a VERSAO: cada cartão guarda a versão em que foi respondido.

export const VERSAO_CATALOGO = "v2-2026-10";

export interface Opcao { chave: string; rotulo: string }
export interface Familia { chave: string; rotulo: string; descricao: string; apoio: string[] }
export interface Emocao extends Opcao { familia: string }

export const FAMILIAS: Familia[] = [
  { chave: "inquieta", rotulo: "Inquietação", descricao: "o corpo e a mente em alerta", apoio: ["Solte o ar devagar, mais longo do que o ar que entrou. Repita algumas vezes.", "Olhe ao redor e diga em voz baixa três coisas que você vê agora."] },
  { chave: "confusa", rotulo: "Confusão e cansaço", descricao: "pesado ou embaralhado por dentro", apoio: ["Escolha uma única coisa pequena para fazer agora. O resto pode esperar.", "Beber água e apoiar os pés no chão já são cuidados."] },
  { chave: "leve", rotulo: "Leveza", descricao: "algo que faz bem", apoio: ["Vale registrar o que ajudou a chegar aqui: pode ser útil em dias mais difíceis."] },
  { chave: "baixa", rotulo: "Peso e tristeza", descricao: "um peso, um vazio", apoio: ["Você não precisa resolver isso agora. Fique perto de algo ou de alguém que lhe faça bem.", "Se puder, avise alguém de confiança de como você está."] },
  { chave: "forte", rotulo: "Raiva e irritação", descricao: "algo que incomoda ou pareceu injusto", apoio: ["Dê um tempo antes de responder ou agir. Afastar-se por alguns minutos é uma escolha válida.", "Movimente o corpo: caminhar um pouco ajuda a baixar a intensidade."] },
  { chave: "distante", rotulo: "Distância", descricao: "desligado de si ou dos outros", apoio: ["Sinta o contato dos pés no chão e das mãos em algo firme.", "Toque em um objeto com textura e descreva-a para si."] },
];

export const EMOCOES: Emocao[] = [
  { chave: "ansiedade", rotulo: "Ansiedade", familia: "inquieta" }, { chave: "medo", rotulo: "Medo", familia: "inquieta" }, { chave: "tensao", rotulo: "Tensão", familia: "inquieta" },
  { chave: "preocupacao", rotulo: "Preocupação", familia: "inquieta" }, { chave: "inquietacao", rotulo: "Inquietação", familia: "inquieta" },
  { chave: "confusao", rotulo: "Confusão", familia: "confusa" }, { chave: "duvida", rotulo: "Dúvida", familia: "confusa" }, { chave: "cansaco", rotulo: "Cansaço emocional", familia: "confusa" }, { chave: "sobrecarga", rotulo: "Sobrecarga", familia: "confusa" },
  { chave: "alegria", rotulo: "Alegria", familia: "leve" }, { chave: "confianca", rotulo: "Confiança", familia: "leve" }, { chave: "esperanca", rotulo: "Esperança", familia: "leve" }, { chave: "calma", rotulo: "Calma", familia: "leve" },
  { chave: "gratidao", rotulo: "Gratidão", familia: "leve" }, { chave: "alivio", rotulo: "Alívio", familia: "leve" }, { chave: "orgulho", rotulo: "Orgulho", familia: "leve" },
  { chave: "tristeza", rotulo: "Tristeza", familia: "baixa" }, { chave: "desanimo", rotulo: "Desânimo", familia: "baixa" }, { chave: "solidao", rotulo: "Solidão", familia: "baixa" }, { chave: "vazio", rotulo: "Vazio", familia: "baixa" },
  { chave: "vergonha", rotulo: "Vergonha", familia: "baixa" }, { chave: "culpa", rotulo: "Culpa", familia: "baixa" },
  { chave: "raiva", rotulo: "Raiva", familia: "forte" }, { chave: "irritacao", rotulo: "Irritação", familia: "forte" }, { chave: "frustracao", rotulo: "Frustração", familia: "forte" }, { chave: "injustica", rotulo: "Injustiça", familia: "forte" },
  { chave: "desligamento", rotulo: "Desligamento", familia: "distante" }, { chave: "entorpecimento", rotulo: "Entorpecimento", familia: "distante" },
];

// Textos da versão v2: escritos para este sistema, em linguagem simples. As CHAVES não mudam (registros antigos continuam legíveis).
export const CONTEXTOS: Opcao[] = [
  { chave: "pensamento", rotulo: "Um pensamento que não largava" }, { chave: "corpo", rotulo: "Uma sensação no corpo" }, { chave: "ambiente", rotulo: "O lugar onde eu estava (casa, trabalho, estudo)" },
  { chave: "relacao", rotulo: "Algo com uma pessoa" }, { chave: "aconteceu", rotulo: "Um fato específico do dia" }, { chave: "nao_sei", rotulo: "Não sei dizer" },
];
// legado da v1 (não é mais oferecido ao paciente, mas registros antigos guardam essas chaves)
export const PRIMEIRAS_ACOES: Opcao[] = [
  { chave: "acalmar_corpo", rotulo: "Tentei acalmar o corpo" }, { chave: "nao_agir", rotulo: "Tentei não agir no impulso" }, { chave: "apoio", rotulo: "Procurei apoio" },
  { chave: "aguentei", rotulo: "Só aguentei até passar" }, { chave: "nada", rotulo: "Não consegui fazer nada" },
];
export const ACOES_QUE_AJUDARAM: Opcao[] = [
  { chave: "respiracao", rotulo: "Respirei com calma" }, { chave: "grounding", rotulo: "Olhei e nomeei o que está ao meu redor" }, { chave: "reduzir_estimulo", rotulo: "Diminuí barulho, telas ou estímulos" },
  { chave: "parar_pensar", rotulo: "Parei antes de reagir" }, { chave: "checar_fatos", rotulo: "Separei o que é fato do que é pensamento" }, { chave: "autovalidacao", rotulo: "Falei comigo com gentileza" },
  { chave: "sentidos", rotulo: "Usei os sentidos (cheiro, toque, sabor)" }, { chave: "presenca_corporal", rotulo: "Mexi o corpo (caminhar, alongar)" }, { chave: "rotina_minima", rotulo: "Cuidei de uma tarefa simples da rotina" },
  { chave: "contato", rotulo: "Procurei alguém" }, { chave: "anotei", rotulo: "Anotei o que me ajudou" },
];
export const AJUDOU: Opcao[] = [{ chave: "NAO", rotulo: "Não fez diferença" }, { chave: "POUCO", rotulo: "Aliviou um pouco" }, { chave: "AJUDOU", rotulo: "Ajudou" }, { chave: "MUITO", rotulo: "Foi um grande alívio" }];
export const FECHAMENTOS: Opcao[] = [
  { chave: "passei", rotulo: "Hoje foi um passo e eu sigo" }, { chave: "observar", rotulo: "Quero ficar de olho nisso" }, { chave: "uma_coisa", rotulo: "Descobri algo que me ajuda" },
  { chave: "falar_sessao", rotulo: "Quero levar isso para a conversa" }, { chave: "mais_dificil", rotulo: "Foi pesado e precisei de mais cuidado" }, { chave: "outro", rotulo: "Outro" },
];
// novas na v2: o que pesou no dia (multi) e, opcional, o impulso e o que se fez com ele
export const PESOS_DO_DIA: Opcao[] = [
  { chave: "sono", rotulo: "Dormi pouco ou mal" }, { chave: "comida", rotulo: "Comi mal ou pulei refeições" }, { chave: "corpo_cansado", rotulo: "Corpo cansado ou com dor" },
  { chave: "demanda", rotulo: "Muita coisa para dar conta" }, { chave: "atrito", rotulo: "Atrito com alguém" }, { chave: "sozinho", rotulo: "Passei muito tempo sozinho(a)" },
  { chave: "sem_rotina", rotulo: "Dia sem rotina" }, { chave: "saude", rotulo: "Mudança de saúde ou de medicação" }, { chave: "lembranca", rotulo: "Lembrei de algo difícil" }, { chave: "nenhum", rotulo: "Nenhum desses" },
];
export const IMPULSOS: Opcao[] = [
  { chave: "afastar", rotulo: "Vontade de me afastar de tudo" }, { chave: "discutir", rotulo: "Vontade de discutir ou me impor" }, { chave: "automatico", rotulo: "Vontade de comer, comprar ou fazer algo no automático" },
  { chave: "insistir", rotulo: "Vontade de insistir com alguém" }, { chave: "substancia", rotulo: "Vontade de usar álcool ou outra substância" }, { chave: "outro", rotulo: "Outra vontade" }, { chave: "nenhum", rotulo: "Nenhuma vontade forte" },
];
export const ACOES_DO_IMPULSO: Opcao[] = [{ chave: "segurei", rotulo: "Consegui segurar" }, { chave: "parei", rotulo: "Comecei e parei no meio" }, { chave: "fiz", rotulo: "Acabei fazendo" }];

// Configuração por paciente: o profissional escolhe quais etapas opcionais aparecem e esconde emoções que não quer oferecer.
// Cada etapa opcional tem 3 modos: "auto" (o diário decide pelo que o paciente respondeu), "sempre" ou "nunca".
export type ModoEtapa = "auto" | "sempre" | "nunca";
export interface ConfigDiario { etapas: { pesos: ModoEtapa; impulso: ModoEtapa }; emocoesOcultas: string[] }
export const CONFIG_PADRAO: ConfigDiario = { etapas: { pesos: "auto", impulso: "auto" }, emocoesOcultas: [] };
// configurações antigas guardavam true/false: true = sempre, false = nunca
const modoDe = (v: unknown, padrao: ModoEtapa): ModoEtapa => (v === "auto" || v === "sempre" || v === "nunca" ? v : v === true ? "sempre" : v === false ? "nunca" : padrao);
export function normalizarConfig(c: unknown): ConfigDiario {
  const o = c && typeof c === "object" ? (c as Record<string, unknown>) : {};
  const e = (o.etapas && typeof o.etapas === "object" ? o.etapas : {}) as Record<string, unknown>;
  const ocultas = Array.isArray(o.emocoesOcultas) ? (o.emocoesOcultas as unknown[]).filter((x): x is string => typeof x === "string" && EMOCOES.some((m) => m.chave === x)) : [];
  return { etapas: { pesos: modoDe(e.pesos, CONFIG_PADRAO.etapas.pesos), impulso: modoDe(e.impulso, CONFIG_PADRAO.etapas.impulso) }, emocoesOcultas: ocultas };
}

// Emoções boas (família "leve") têm perguntas próprias: o que ajudou a chegar ali, em vez de "o que você fez por você".
export const CONTRIBUICOES_LEVE: Opcao[] = [
  { chave: "descanso", rotulo: "Descansei ou dormi bem" }, { chave: "pessoas", rotulo: "Estive com alguém de quem gosto" }, { chave: "movimento", rotulo: "Me movimentei (caminhada, exercício, dança)" },
  { chave: "concluir", rotulo: "Terminei algo que importava" }, { chave: "ar_livre", rotulo: "Passei um tempo ao ar livre" }, { chave: "criar", rotulo: "Fiz algo criativo ou prazeroso" },
  { chave: "cuidei", rotulo: "Cuidei de mim (comida, banho, pausa)" }, { chave: "sem_motivo", rotulo: "Veio sem um motivo claro" },
];
export const FECHAMENTOS_LEVE: Opcao[] = [
  { chave: "guardar", rotulo: "Quero guardar este momento" }, { chave: "bom_dia", rotulo: "Foi um bom dia" }, { chave: "entender", rotulo: "Quero entender o que ajudou" },
  { chave: "contar", rotulo: "Quero contar isso na conversa" },
];

// Quais etapas opcionais entram neste registro. "O que pesou" só quando a emoção é difícil e forte (4 ou 5);
// "Vontades" só quando o paciente diz que veio vontade de agir (a pergunta aparece nas emoções difíceis).
// A tela do paciente repete esta regra em DiarioPacienteTela (o servidor manda o catálogo, não a função).
export function etapasDoCartao(c: ConfigDiario, familia: string | null | undefined, intensidade: number, vontade: boolean) {
  const dificil = !!familia && familia !== "leve";
  return {
    pesos: c.etapas.pesos === "sempre" || (c.etapas.pesos === "auto" && dificil && intensidade >= 4),
    perguntaVontade: c.etapas.impulso === "auto" && dificil,
    impulso: c.etapas.impulso === "sempre" || (c.etapas.impulso === "auto" && dificil && vontade),
  };
}

export const AVISO_SEGURANCA = {
  curto: "Este cartão não é um canal de emergência e o(a) profissional não o acompanha em tempo real.",
  intenso: "Se você estiver em sofrimento intenso ou pensando em se machucar, procure ajuda agora: ligue 188 (CVV, 24 horas, gratuito) ou 192 (SAMU), ou vá ao pronto-atendimento mais próximo.",
};

export const CATALOGO = { versao: VERSAO_CATALOGO, familias: FAMILIAS, emocoes: EMOCOES, contextos: CONTEXTOS, primeirasAcoes: PRIMEIRAS_ACOES, pesosDoDia: PESOS_DO_DIA, acoesQueAjudaram: ACOES_QUE_AJUDARAM, ajudou: AJUDOU, impulsos: IMPULSOS, acoesDoImpulso: ACOES_DO_IMPULSO, fechamentos: FECHAMENTOS, contribuicoesLeve: CONTRIBUICOES_LEVE, fechamentosLeve: FECHAMENTOS_LEVE, aviso: AVISO_SEGURANCA };

// o que o paciente enxerga, já filtrado pela configuração dele (emoções escondidas saem da lista)
export const catalogoParaPaciente = (c: ConfigDiario) => ({ ...CATALOGO, emocoes: EMOCOES.filter((e) => !c.emocoesOcultas.includes(e.chave)), etapas: c.etapas });

const chaves = (l: Opcao[]) => new Set(l.map((o) => o.chave));
export const familiaDaEmocao = (chave: string) => EMOCOES.find((e) => e.chave === chave)?.familia ?? null;
export const rotuloDe = (lista: Opcao[], chave: string | null | undefined) => lista.find((o) => o.chave === chave)?.rotulo ?? null;

// o cartão fala de sofrimento intenso? (mostra o aviso de ajuda com destaque; não gera diagnóstico)
export const sofrimentoIntenso = (familia: string, intensidade: number) => intensidade >= 4 && ["baixa", "distante", "inquieta"].includes(familia);

export interface EntradaCartao { ocorridoEm: string; emocao: string; intensidade: number; contexto?: string | null; notaContexto?: string | null; primeiraAcao?: string | null; pesos?: string[]; acoesQueAjudaram?: string[]; ajudou?: string | null; notaCuidado?: string | null; impulso?: string | null; acaoImpulso?: string | null; fechamento?: string | null; levarParaSessao?: boolean; notaFinal?: string | null }

// confere as escolhas contra o catálogo; devolve a lista de problemas (vazia = válido)
export function validarCartao(e: EntradaCartao): string[] {
  const erros: string[] = [];
  if (!familiaDaEmocao(e.emocao)) erros.push("Escolha uma emoção da lista.");
  if (!Number.isInteger(e.intensidade) || e.intensidade < 1 || e.intensidade > 5) erros.push("A intensidade vai de 1 a 5.");
  if (e.contexto && !chaves(CONTEXTOS).has(e.contexto)) erros.push("Contexto inválido.");
  if (e.primeiraAcao && !chaves(PRIMEIRAS_ACOES).has(e.primeiraAcao)) erros.push("Ação inválida.");
  if (e.acoesQueAjudaram?.some((a) => !chaves(ACOES_QUE_AJUDARAM).has(a) && !chaves(CONTRIBUICOES_LEVE).has(a))) erros.push("Ação que ajudou inválida.");
  if (e.pesos?.some((a) => !chaves(PESOS_DO_DIA).has(a))) erros.push("Opção inválida em \"o que pesou\".");
  if (e.impulso && !chaves(IMPULSOS).has(e.impulso)) erros.push("Opção inválida em \"vontade\".");
  if (e.acaoImpulso && !chaves(ACOES_DO_IMPULSO).has(e.acaoImpulso)) erros.push("Opção inválida em \"o que fez\".");
  if (e.ajudou && !chaves(AJUDOU).has(e.ajudou)) erros.push("Resposta inválida.");
  if (e.fechamento && !chaves(FECHAMENTOS).has(e.fechamento) && !chaves(FECHAMENTOS_LEVE).has(e.fechamento)) erros.push("Fechamento inválido.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.ocorridoEm) || Number.isNaN(Date.parse(e.ocorridoEm))) erros.push("Data inválida.");
  else if (Date.parse(e.ocorridoEm) > Date.now() + 86_400_000) erros.push("A data não pode ser futura.");
  return erros;
}
