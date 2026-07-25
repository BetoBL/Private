// Motor de cálculo genérico: bruto -> norma -> percentil/escore/classificação.
// Função pura — sem I/O, sem Prisma — para ser testável isoladamente (ver motorCalculo.test.ts).
//
// Modo é inferido da conversão normativa (ver prisma/seed.ts):
//   - tipo contém "soma"      -> soma todos os campos em um escoreBrutoTotal e localiza 1 faixa
//   - `faixasPorCampo` presente -> cada campo tem sua própria tabela de faixas (ex: RAVLT, onde
//                                   A1 e A7 têm pontos de corte diferentes na mesma faixa etária)
//   - caso contrário          -> localiza uma faixa por campo na mesma tabela `faixas` compartilhada
// Essa convenção é suficiente para os testes placeholder do MVP e para normas reais com tabela
// única por campo; ao trocar por normas reais, o `tipo`/`faixasPorCampo` de cada TabelaNormativa
// continua controlando o modo de cálculo.

export interface FaixaConversao {
  min?: number;
  max?: number;
  [saida: string]: number | string | undefined;
}

export interface ConversaoNormativa {
  tipo: string;
  faixas?: FaixaConversao[];
  faixasPorCampo?: Record<string, FaixaConversao[]>;
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
    return { modo: "soma", escoreBrutoTotal, faixa: localizarFaixa(escoreBrutoTotal, conversao.faixas ?? []) };
  }

  const porCampo: Record<string, ResultadoPorCampo> = {};
  for (const [chave, valor] of Object.entries(escoresBrutos)) {
    const faixasDoCampo = conversao.faixasPorCampo?.[chave] ?? conversao.faixas ?? [];
    porCampo[chave] = { valorBruto: valor, faixa: localizarFaixa(valor, faixasDoCampo) };
  }
  return { modo: "por_campo", porCampo };
}

/**
 * Seleciona, entre as tabelas normativas de um teste, a que cobre a idade do paciente
 * (em anos, na data da sessão). Critérios sem faixaMin/faixaMax (ex: "sexo" isolado) não
 * são elegíveis aqui — a seleção por idade é o refinamento que faltava (ver comentário
 * antigo em aplicacoesDeTeste.routes.ts). Quando nenhuma faixa cobre a idade, cai para a
 * primeira tabela do teste (mesmo comportamento anterior), para não quebrar testes com
 * tabela única e sem faixaMin/faixaMax definidos.
 */
export function escolherTabelaPorIdade<T extends { faixaMin: number | null; faixaMax: number | null }>(
  idadeAnos: number,
  tabelas: T[]
): T | undefined {
  const porIdade = tabelas.find(
    (t) => t.faixaMin !== null && t.faixaMax !== null && idadeAnos >= t.faixaMin && idadeAnos <= t.faixaMax
  );
  return porIdade ?? tabelas[0];
}

export function calcularIdadeEmAnos(dataNascimento: Date, dataReferencia: Date): number {
  let idade = dataReferencia.getFullYear() - dataNascimento.getFullYear();
  const aniversarioJaPassou =
    dataReferencia.getMonth() > dataNascimento.getMonth() ||
    (dataReferencia.getMonth() === dataNascimento.getMonth() && dataReferencia.getDate() >= dataNascimento.getDate());
  if (!aniversarioJaPassou) idade -= 1;
  return idade;
}
