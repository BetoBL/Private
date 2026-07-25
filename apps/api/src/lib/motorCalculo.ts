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

export type Sexo = "MASCULINO" | "FEMININO";

export interface CriteriosSelecaoTabela {
  idadeAnos: number;
  sexo?: Sexo | null;
}

/**
 * Seleciona, entre as tabelas normativas de um teste, a que cobre a idade (e, quando a
 * tabela estratifica por sexo, o sexo) do paciente na data da sessão. Tabelas sem `sexo`
 * definido servem qualquer paciente (ex: RAVLT/BPA, testados e sem efeito relevante de sexo);
 * tabelas com `sexo` definido (ex: ETDAH-PAIS) só entram na disputa se baterem com o sexo do
 * paciente. Quando nada bate perfeitamente, cai progressivamente para candidatas mais amplas
 * em vez de retornar `undefined` — preferível reportar com a norma mais próxima disponível
 * a não reportar nada, mesmo comportamento já assumido antes desta seleção existir.
 */
export function escolherTabelaNormativa<
  T extends { faixaMin: number | null; faixaMax: number | null; sexo?: Sexo | null }
>(criterios: CriteriosSelecaoTabela, tabelas: T[]): T | undefined {
  const candidatasPorSexo = tabelas.filter((t) => !t.sexo || t.sexo === criterios.sexo);
  const base = candidatasPorSexo.length > 0 ? candidatasPorSexo : tabelas;
  const porIdade = base.find(
    (t) =>
      t.faixaMin !== null &&
      t.faixaMax !== null &&
      criterios.idadeAnos >= t.faixaMin &&
      criterios.idadeAnos <= t.faixaMax
  );
  return porIdade ?? base[0];
}

export function calcularIdadeEmAnos(dataNascimento: Date, dataReferencia: Date): number {
  let idade = dataReferencia.getFullYear() - dataNascimento.getFullYear();
  const aniversarioJaPassou =
    dataReferencia.getMonth() > dataNascimento.getMonth() ||
    (dataReferencia.getMonth() === dataNascimento.getMonth() && dataReferencia.getDate() >= dataNascimento.getDate());
  if (!aniversarioJaPassou) idade -= 1;
  return idade;
}
