// Cor de cada família de emoção do Diário (usada na tela do paciente e no painel do profissional)
export const COR_FAMILIA: Record<string, string> = {
  inquieta: "#D9822B", confusa: "#8B7BB5", leve: "#5E9E6E", baixa: "#5B7FA6", forte: "#C0533F", distante: "#7A7A8C",
};
export const corDaFamilia = (f: string) => COR_FAMILIA[f] ?? "#7A7A8C";
export const ROTULO_TENDENCIA: Record<string, string> = { MAIS_INTENSA: "Emoções difíceis mais intensas que na semana anterior", MENOS_INTENSA: "Emoções difíceis menos intensas que na semana anterior", ESTAVEL: "Emoções difíceis estáveis em relação à semana anterior" };
export const ROTULO_INTENSIDADE = ["", "Bem leve", "Leve", "Média", "Forte", "Muito forte"];

// Ícones (emoji) de cada opção do Diário, só para a tela do paciente ficar leve e fácil de reconhecer
export const ICONE: Record<string, string> = {
  ansiedade: "🌪️", medo: "😨", tensao: "😬", preocupacao: "💭", inquietacao: "⚡",
  confusao: "🌀", duvida: "❓", cansaco: "😴", sobrecarga: "🎒",
  alegria: "😄", confianca: "💪", esperanca: "🌱", calma: "🍃", gratidao: "🙏", alivio: "😌", orgulho: "🌟",
  tristeza: "🌧️", desanimo: "😞", solidao: "🧍", vazio: "🕳️", vergonha: "🙈", culpa: "⚓",
  raiva: "🔥", irritacao: "😤", frustracao: "😣", injustica: "⚖️",
  desligamento: "🔌", entorpecimento: "😶",
  pensamento: "💭", corpo: "💓", ambiente: "🏢", relacao: "👥", aconteceu: "📌", nao_sei: "🤷",
  acalmar_corpo: "🧘", nao_agir: "⏸️", apoio: "🤝", aguentei: "🛡️", nada: "🤍",
  respiracao: "🌬️", grounding: "🦶", reduzir_estimulo: "🔇", parar_pensar: "✋", checar_fatos: "🔍", autovalidacao: "💛",
  sentidos: "👀", presenca_corporal: "🧍", rotina_minima: "☕", contato: "💬",
  passei: "✅", observar: "🔭", uma_coisa: "✨", falar_sessao: "🗣️", mais_dificil: "🧗", outro: "➕",
  NAO: "😕", POUCO: "🙂", AJUDOU: "😊", MUITO: "🤩",
  inquieta: "🌪️", confusa: "🌀", leve: "☀️", baixa: "🌧️", forte: "🔥", distante: "🌫️",
};
export const FACE_INTENSIDADE = ["", "🙂", "😐", "😟", "😣", "😖"];
