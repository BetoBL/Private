// Motor de cálculo genérico: bruto -> norma -> percentil/escore/classificação.
// Função pura — sem I/O, sem Prisma — para ser testável isoladamente (ver motorCalculo.test.ts).
//
// Modo é inferido do campo `tipo` da conversão normativa (ver prisma/seed.ts):
//   - contém "soma"  -> soma todos os campos em um escoreBrutoTotal e localiza 1 faixa
//   - caso contrário -> localiza uma faixa por campo (ex: por subteste, por fator)
// Essa convenção é suficiente para os testes placeholder do MVP; ao trocar por normas
// reais, o `tipo` de cada TabelaNormativa continua controlando o modo de cálculo.

export interface FaixaConversao {
  min?: number;
  max?: number;
  [saida: string]: number | string | undefined;
}

export interface ConversaoNormativa {
  tipo: string;
  faixas: FaixaConversao[];
  [meta: string]: unknown;
}

export interface ResultadoPorCampo {
  valorBruto: number;
  faixa: FaixaConversao | null;
}

export type ResultadoCalculado =
  | { modo: "soma"; escoreBrutoTotal: number; faixa: FaixaConversao | null }
  | { modo: "por_campo"; porCampo: Record<string, ResultadoPorCampo> };

export function localizarFaixa(valor: number, faixas: FaixaConversao[]): FaixaConversao | null {
  return (
    faixas.find((f) => (f.min === undefined || valor >= f.min) && (f.max === undefined || valor <= f.max)) ?? null
  );
}

export function calcularResultado(
  escoresBrutos: Record<string, number>,
  conversao: ConversaoNormativa
): ResultadoCalculado {
  const modoSoma = /soma/i.test(conversao.tipo);

  if (modoSoma) {
    const escoreBrutoTotal = Object.values(escoresBrutos).reduce((acc, v) => acc + v, 0);
    return { modo: "soma", escoreBrutoTotal, faixa: localizarFaixa(escoreBrutoTotal, conversao.faixas) };
  }

  const porCampo: Record<string, ResultadoPorCampo> = {};
  for (const [chave, valor] of Object.entries(escoresBrutos)) {
    porCampo[chave] = { valorBruto: valor, faixa: localizarFaixa(valor, conversao.faixas) };
  }
  return { modo: "por_campo", porCampo };
}
