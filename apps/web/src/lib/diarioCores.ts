// Cor de cada família de emoção do Diário (usada na tela do paciente e no painel do profissional)
export const COR_FAMILIA: Record<string, string> = {
  inquieta: "#D9822B", confusa: "#8B7BB5", leve: "#5E9E6E", baixa: "#5B7FA6", forte: "#C0533F", distante: "#7A7A8C",
};
export const corDaFamilia = (f: string) => COR_FAMILIA[f] ?? "#7A7A8C";
export const ROTULO_TENDENCIA: Record<string, string> = { MAIS_INTENSA: "Emoções difíceis mais intensas que na semana anterior", MENOS_INTENSA: "Emoções difíceis menos intensas que na semana anterior", ESTAVEL: "Emoções difíceis estáveis em relação à semana anterior" };
export const ROTULO_INTENSIDADE = ["", "Bem leve", "Leve", "Média", "Forte", "Muito forte"];
