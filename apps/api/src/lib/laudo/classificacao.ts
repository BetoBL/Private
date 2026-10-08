import type { SistemaClassificacaoPercentil } from "../classificacaoPercentil";

// Nome da classificação a partir do percentil, no vocabulário do sistema escolhido pelo profissional (Perfil de Atuação).
// Cortes: 98 / 91 / 75 / 25 / 9 / 3 (Miotto) ou 98 / 91 / 75 / 25 / 9 / 2 (Guilmette). O modelo de laudo da MentEssence escreve
// "98% Muito superior" (o corte ">98" da tabela dela não cobre o 98 exato): o 98 entra na faixa de cima.
// PENDENTE com a psicóloga (docs/testes/PERGUNTAS-PARA-LETICIA.md, seção 8): como classificar o percentil exatamente 98/2 e os decimais.
const FAIXAS: Record<SistemaClassificacaoPercentil, Array<[number, string]>> = {
  MIOTTO_2017: [
    [98, "Muito superior à média"],
    [91, "Superior à média"],
    [75, "Média superior"],
    [25, "Dentro da média"],
    [9, "Média inferior"],
    [3, "Limítrofe"],
    [-Infinity, "Deficitário"],
  ],
  GUILMETTE_2020: [
    [98, "Excepcionalmente elevado"],
    [91, "Acima da média"],
    [75, "Média superior"],
    [25, "Média"],
    [9, "Média inferior"],
    [2, "Abaixo da média"],
    [-Infinity, "Excepcionalmente baixo"],
  ],
};

export function classificarPercentil(percentil: number, sistema: SistemaClassificacaoPercentil = "MIOTTO_2017"): string {
  for (const [corte, nome] of FAIXAS[sistema]) if (percentil >= corte) return nome;
  return FAIXAS[sistema][FAIXAS[sistema].length - 1][1];
}

// "Abaixo da média" no laudo = Média inferior ou pior (percentil < 25): vai em vermelho.
export function abaixoDaMedia(percentil: number): boolean {
  return percentil < 25;
}

export function formatarPercentil(p: number): string {
  // percentis muito baixos mantêm uma casa ("0,1"); os demais, inteiro
  return p < 1 ? p.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : String(Math.round(p));
}
