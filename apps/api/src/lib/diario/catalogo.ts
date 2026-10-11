// Catálogo do Cartão Diário: o que o paciente pode escolher em cada etapa. Texto próprio do sistema (inspirado em fluxos de check-in
// emocional em geral, sem copiar nenhum produto). Os apoios por família e a lista de emoções e ações PRECISAM de revisão da psicóloga
// responsável antes do uso com pacientes. Mudou o catálogo? Suba a VERSAO: cada cartão guarda a versão em que foi respondido.

export const VERSAO_CATALOGO = "v1-2026-10";

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

export const CONTEXTOS: Opcao[] = [
  { chave: "pensamento", rotulo: "Veio de um pensamento" }, { chave: "corpo", rotulo: "Veio do corpo" }, { chave: "ambiente", rotulo: "Ambiente, trabalho ou estudo" },
  { chave: "relacao", rotulo: "Relação com alguém" }, { chave: "aconteceu", rotulo: "Aconteceu alguma coisa" }, { chave: "nao_sei", rotulo: "Não sei" },
];
export const PRIMEIRAS_ACOES: Opcao[] = [
  { chave: "acalmar_corpo", rotulo: "Tentei acalmar o corpo" }, { chave: "nao_agir", rotulo: "Tentei não agir no impulso" }, { chave: "apoio", rotulo: "Procurei apoio" },
  { chave: "aguentei", rotulo: "Só aguentei até passar" }, { chave: "nada", rotulo: "Não consegui fazer nada" },
];
export const ACOES_QUE_AJUDARAM: Opcao[] = [
  { chave: "respiracao", rotulo: "Respiração" }, { chave: "grounding", rotulo: "Aterramento (olhar e nomear o que está à volta)" }, { chave: "reduzir_estimulo", rotulo: "Reduzir estímulos" },
  { chave: "parar_pensar", rotulo: "Parar e pensar antes de agir" }, { chave: "checar_fatos", rotulo: "Checar os fatos" }, { chave: "autovalidacao", rotulo: "Acolher a mim mesmo" },
  { chave: "sentidos", rotulo: "Usar os sentidos" }, { chave: "presenca_corporal", rotulo: "Presença no corpo" }, { chave: "rotina_minima", rotulo: "Rotina mínima" }, { chave: "contato", rotulo: "Contato com alguém" },
];
export const AJUDOU: Opcao[] = [{ chave: "NAO", rotulo: "Não" }, { chave: "POUCO", rotulo: "Um pouco" }, { chave: "AJUDOU", rotulo: "Ajudou" }, { chave: "MUITO", rotulo: "Ajudou muito" }];
export const FECHAMENTOS: Opcao[] = [
  { chave: "passei", rotulo: "Consegui passar por isso" }, { chave: "observar", rotulo: "Preciso observar esse padrão" }, { chave: "uma_coisa", rotulo: "Uma coisa ajudou" },
  { chave: "falar_sessao", rotulo: "Quero falar disso na sessão" }, { chave: "mais_dificil", rotulo: "Foi mais difícil do que parecia" }, { chave: "outro", rotulo: "Outro" },
];

export const AVISO_SEGURANCA = {
  curto: "Este cartão não é um canal de emergência e o(a) profissional não o acompanha em tempo real.",
  intenso: "Se você estiver em sofrimento intenso ou pensando em se machucar, procure ajuda agora: ligue 188 (CVV, 24 horas, gratuito) ou 192 (SAMU), ou vá ao pronto-atendimento mais próximo.",
};

export const CATALOGO = { versao: VERSAO_CATALOGO, familias: FAMILIAS, emocoes: EMOCOES, contextos: CONTEXTOS, primeirasAcoes: PRIMEIRAS_ACOES, acoesQueAjudaram: ACOES_QUE_AJUDARAM, ajudou: AJUDOU, fechamentos: FECHAMENTOS, aviso: AVISO_SEGURANCA };

const chaves = (l: Opcao[]) => new Set(l.map((o) => o.chave));
export const familiaDaEmocao = (chave: string) => EMOCOES.find((e) => e.chave === chave)?.familia ?? null;
export const rotuloDe = (lista: Opcao[], chave: string | null | undefined) => lista.find((o) => o.chave === chave)?.rotulo ?? null;

// o cartão fala de sofrimento intenso? (mostra o aviso de ajuda com destaque; não gera diagnóstico)
export const sofrimentoIntenso = (familia: string, intensidade: number) => intensidade >= 4 && ["baixa", "distante", "inquieta"].includes(familia);

export interface EntradaCartao { ocorridoEm: string; emocao: string; intensidade: number; contexto?: string | null; notaContexto?: string | null; primeiraAcao?: string | null; acoesQueAjudaram?: string[]; ajudou?: string | null; notaCuidado?: string | null; fechamento?: string | null; levarParaSessao?: boolean; notaFinal?: string | null }

// confere as escolhas contra o catálogo; devolve a lista de problemas (vazia = válido)
export function validarCartao(e: EntradaCartao): string[] {
  const erros: string[] = [];
  if (!familiaDaEmocao(e.emocao)) erros.push("Escolha uma emoção da lista.");
  if (!Number.isInteger(e.intensidade) || e.intensidade < 1 || e.intensidade > 5) erros.push("A intensidade vai de 1 a 5.");
  if (e.contexto && !chaves(CONTEXTOS).has(e.contexto)) erros.push("Contexto inválido.");
  if (e.primeiraAcao && !chaves(PRIMEIRAS_ACOES).has(e.primeiraAcao)) erros.push("Ação inválida.");
  if (e.acoesQueAjudaram?.some((a) => !chaves(ACOES_QUE_AJUDARAM).has(a))) erros.push("Ação que ajudou inválida.");
  if (e.ajudou && !chaves(AJUDOU).has(e.ajudou)) erros.push("Resposta inválida.");
  if (e.fechamento && !chaves(FECHAMENTOS).has(e.fechamento)) erros.push("Fechamento inválido.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.ocorridoEm) || Number.isNaN(Date.parse(e.ocorridoEm))) erros.push("Data inválida.");
  else if (Date.parse(e.ocorridoEm) > Date.now() + 86_400_000) erros.push("A data não pode ser futura.");
  return erros;
}
