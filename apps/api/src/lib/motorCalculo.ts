// Motor de cálculo genérico: bruto -> norma -> percentil/escore/classificação.
// Função pura — sem I/O, sem Prisma — para ser testável isoladamente (ver motorCalculo.test.ts).
//
// Modo é inferido da conversão normativa (ver prisma/seed.ts):
//   - tipo contém "soma"      -> soma todos os campos em um escoreBrutoTotal e localiza 1 faixa
//   - `faixasPorCampo` presente -> cada campo tem sua própria tabela de faixas (ex: RAVLT, onde
//                                   A1 e A7 têm pontos de corte diferentes na mesma faixa etária)
//   - caso contrário          -> localiza uma faixa por campo na mesma tabela `faixas` compartilhada
//   - `camposDerivados` presente -> depois do passo acima, campos adicionais cujo valor de entrada
//                                   vem de uma SOMA ou SUBTRAÇÃO de um campo numérico já extraído
//                                   da faixa de outros campos (ex: ADL2 — Escore Padrão Global =
//                                   EP(LC) + EP(LE); FDT — Inibição = tempo(Escolha) -
//                                   tempo(Contagem)), onde cada fonte já é resultado de uma
//                                   conversão anterior, não escore bruto de entrada. Só 1 nível de
//                                   derivação — suficiente para os casos reais conhecidos.
// Essa convenção é suficiente para os testes placeholder do MVP e para normas reais com tabela
// única por campo; ao trocar por normas reais, o `tipo`/`faixasPorCampo` de cada TabelaNormativa
// continua controlando o modo de cálculo.

import { calcularWais3, type Wais3Planilha } from "./wais3";
import { calcularWisc4, type OpcoesWisc4, type Wisc4Planilha } from "./wisc4";

export interface FaixaConversao {
  min?: number;
  max?: number;
  [saida: string]: number | string | undefined;
}

// Campo cujo valor de entrada não vem do formulário de lançamento, e sim de uma soma/subtração de
// um campo numérico já extraído da faixa de outros campos (ex: ADL2 — Escore Padrão Global =
// EP(LC) + EP(LE); FDT — Inibição = tempo(Escolha) - tempo(Contagem)), cada fonte já resultado de
// uma conversão anterior. Suporta só 1 nível de derivação (soma/subtração de campos "de base"),
// suficiente para os casos reais conhecidos até agora.
export interface CampoDerivado {
  fontes: string[];
  // Nome do campo de SAÍDA a extrair da faixa de cada fonte (ex.: "ponderado", "escorePadrao").
  // Valor reservado "valorBruto": em vez de ler a faixa, lê o BRUTO DE ENTRADA da fonte direto —
  // para quando a derivação precisa do valor fino (ex.: segundos) e não do rótulo grosso que a
  // faixa devolve (ex.: FDT, Inibição = tempo(Escolha) - tempo(Contagem)).
  campoValor: string;
  // "soma" (default) soma todas as fontes; "subtracao" é fontes[0] menos a soma das demais (ex.:
  // FDT: fontes: ["escolha", "contagem"] -> escolha - contagem).
  operacao?: "soma" | "subtracao";
  // Quando `true`, o campo derivado só é calculado se TODAS as fontes tiverem valor numérico em
  // `campoValor`; se qualquer uma faltar (subteste não lançado, ou lançado mas sem faixa
  // correspondente), o resultado é `valorBruto: null` / `faixa: null` — "não calculado" — em vez
  // de somar 0 no lugar do que falta.
  //
  // Existe por causa do WISC-IV: um QI Total que soma 0 no lugar de um subteste não lançado
  // produz um número plausível e errado, que iria direto para um laudo sem nada denunciando o
  // erro. É opt-in para não alterar o comportamento já estabelecido da ADL2 (ver o teste
  // "camposDerivados cujos campos-fonte não bateram nenhuma faixa soma 0") — mas em "subtracao" é
  // sempre tratado como `true`, implícito: 0 no lugar do que falta dá uma subtração plausível e
  // errada (ex.: Inibição = Escolha - 0), o mesmo risco que o WISC-IV tinha com soma.
  exigeTodasFontes?: boolean;
}

export interface ConversaoNormativa {
  tipo: string;
  faixas?: FaixaConversao[];
  faixasPorCampo?: Record<string, FaixaConversao[]>;
  camposDerivados?: Record<string, CampoDerivado>;
  [meta: string]: unknown;
}

export interface ResultadoPorCampo {
  // `null` só acontece em campo derivado com `exigeTodasFontes` cuja alguma fonte faltou — é a
  // diferença entre "não deu para calcular" e "calculou e deu zero".
  valorBruto: number | null;
  faixa: FaixaConversao | null;
}

export type ResultadoCalculado =
  | { modo: "soma"; escoreBrutoTotal: number; faixa: FaixaConversao | null }
  | { modo: "por_campo"; porCampo: Record<string, ResultadoPorCampo>; extras?: Record<string, unknown> };

export function localizarFaixa(valor: number, faixas: FaixaConversao[]): FaixaConversao | null {
  return (
    faixas.find((f) => (f.min === undefined || valor >= f.min) && (f.max === undefined || valor <= f.max)) ?? null
  );
}

export interface ContextoCalculo {
  // Dias de vida na data da sessão. Só o WAIS-III precisa (a planilha escolhe a faixa etária por dias).
  idadeDias?: number;
  // Anos completos na data da sessão (WAIS-III: escolhe o valor crítico da análise avançada).
  idadeAnos?: number;
  // Datas de nascimento e da sessão (WISC-IV: a planilha calcula a idade com mês de 30 dias a partir delas).
  dataNascimento?: Date;
  dataReferencia?: Date;
  // Opções da tela do WISC-IV (intervalo de confiança e base de comparação das discrepâncias).
  opcoesWisc4?: OpcoesWisc4;
}

export function calcularResultado(
  escoresBrutos: Record<string, number>,
  conversao: ConversaoNormativa,
  contexto: ContextoCalculo = {}
): ResultadoCalculado {
  if (conversao.tipo === "wisc4_planilha") {
    if (!contexto.dataNascimento || !contexto.dataReferencia) return { modo: "por_campo", porCampo: {} };
    return calcularWisc4(escoresBrutos, conversao as unknown as Wisc4Planilha, contexto.dataNascimento, contexto.dataReferencia, contexto.opcoesWisc4);
  }
  if (conversao.tipo === "wais3_planilha") {
    return calcularWais3(escoresBrutos, conversao as unknown as Wais3Planilha, contexto.idadeDias ?? 0, contexto.idadeAnos);
  }
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
  for (const [chave, derivado] of Object.entries(conversao.camposDerivados ?? {})) {
    const valoresDasFontes = derivado.fontes.map((fonte) => {
      // "valorBruto" é um nome reservado: em vez de ler um campo de saída já convertido da faixa
      // (ex.: "ponderado", "escorePadrao"), lê o bruto de ENTRADA da fonte direto. Existe para o
      // FDT: Inibição = tempo(Escolha) - tempo(Contagem) subtrai os tempos brutos em segundos, não
      // um valor já classificado — não há "campo de saída" que sirva aqui, a faixa só devolve o
      // rótulo de percentil (coisa grossa), nunca o segundo exato (coisa fina) de volta.
      const v = derivado.campoValor === "valorBruto" ? porCampo[fonte]?.valorBruto : porCampo[fonte]?.faixa?.[derivado.campoValor];
      return typeof v === "number" ? v : null;
    });
    const faixasDoCampo = conversao.faixasPorCampo?.[chave] ?? conversao.faixas ?? [];
    const subtracao = derivado.operacao === "subtracao";

    // "subtracao" exige todas as fontes sempre, flag ou não: 0 no lugar da que falta dá uma
    // subtração plausível e errada (ver comentário de `exigeTodasFontes` em CampoDerivado).
    if ((derivado.exigeTodasFontes || subtracao) && valoresDasFontes.some((v) => v === null)) {
      porCampo[chave] = { valorBruto: null, faixa: null };
      continue;
    }

    const valorBruto = subtracao
      ? (valoresDasFontes[0] ?? 0) - valoresDasFontes.slice(1).reduce<number>((acc, v) => acc + (v ?? 0), 0)
      : valoresDasFontes.reduce<number>((acc, v) => acc + (v ?? 0), 0);
    porCampo[chave] = { valorBruto, faixa: localizarFaixa(valorBruto, faixasDoCampo) };
  }
  return { modo: "por_campo", porCampo };
}

export type Sexo = "MASCULINO" | "FEMININO";

export interface CriteriosSelecaoTabela {
  idadeAnos: number;
  // Só usado por testes com faixas etárias mais finas que 1 ano (ex: SON-R, faixas mensais de
  // 2;6 a 7;11) — ver `criterio === "idade_meses"` abaixo. Os demais testes usam idadeAnos.
  idadeMeses?: number;
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
 *
 * Tabelas com `criterio === "idade_meses"` (ex: SON-R) comparam contra `criterios.idadeMeses`
 * em vez de `idadeAnos` — faixaMin/faixaMax dessas tabelas já vêm em meses no seed, então o
 * restante da lógica (filtro por sexo, fallback) funciona igual, só a unidade da comparação muda.
 */
export function escolherTabelaNormativa<
  T extends { criterio: string; faixaMin: number | null; faixaMax: number | null; sexo?: Sexo | null }
>(criterios: CriteriosSelecaoTabela, tabelas: T[]): T | undefined {
  const candidatasPorSexo = tabelas.filter((t) => !t.sexo || t.sexo === criterios.sexo);
  const base = candidatasPorSexo.length > 0 ? candidatasPorSexo : tabelas;
  const porIdade = base.find((t) => {
    if (t.faixaMin === null || t.faixaMax === null) return false;
    const idade = t.criterio === "idade_meses" ? criterios.idadeMeses : criterios.idadeAnos;
    return idade !== undefined && idade >= t.faixaMin && idade <= t.faixaMax;
  });
  return porIdade ?? base[0];
}

/**
 * Versão ESTRITA de escolherTabelaNormativa para normativas customizadas da clínica: só devolve
 * uma tabela que realmente cobre o paciente (sexo compatível e idade dentro da faixa; faixa
 * nula nos dois extremos = cobre qualquer idade). Nunca cai para "a mais próxima" — nesse caso
 * retorna `undefined` e o chamador usa a norma padrão do teste, em vez de aplicar silenciosamente
 * uma norma customizada fora da população para a qual ela foi feita.
 */
export function escolherNormativaCustomizada<
  T extends { criterio: string; faixaMin: number | null; faixaMax: number | null; sexo?: Sexo | null }
>(criterios: CriteriosSelecaoTabela, tabelas: T[]): T | undefined {
  const cobre = (t: T) => {
    if (t.sexo && t.sexo !== criterios.sexo) return false;
    if (t.faixaMin === null && t.faixaMax === null) return true;
    const idade = t.criterio === "idade_meses" ? criterios.idadeMeses : criterios.idadeAnos;
    if (idade === undefined) return false;
    return (t.faixaMin === null || idade >= t.faixaMin) && (t.faixaMax === null || idade <= t.faixaMax);
  };
  // Mais específica primeiro: com sexo definido e com faixa de idade definida vencem as genéricas.
  const especificidade = (t: T) => (t.sexo ? 2 : 0) + (t.faixaMin !== null || t.faixaMax !== null ? 1 : 0);
  return tabelas.filter(cobre).sort((a, b) => especificidade(b) - especificidade(a))[0];
}

export function calcularIdadeEmAnos(dataNascimento: Date, dataReferencia: Date): number {
  let idade = dataReferencia.getFullYear() - dataNascimento.getFullYear();
  const aniversarioJaPassou =
    dataReferencia.getMonth() > dataNascimento.getMonth() ||
    (dataReferencia.getMonth() === dataNascimento.getMonth() && dataReferencia.getDate() >= dataNascimento.getDate());
  if (!aniversarioJaPassou) idade -= 1;
  return idade;
}

// Idade como a planilha mostra: "34a, 11m, 1d" (DATEDIF y / ym / md), pelas datas de calendário.
export function formatarIdadeCompleta(dataNascimento: Date, dataReferencia: Date): string {
  const n = { a: dataNascimento.getUTCFullYear(), m: dataNascimento.getUTCMonth(), d: dataNascimento.getUTCDate() };
  const r = { a: dataReferencia.getUTCFullYear(), m: dataReferencia.getUTCMonth(), d: dataReferencia.getUTCDate() };
  let anos = r.a - n.a;
  let meses = r.m - n.m;
  let dias = r.d - n.d;
  if (dias < 0) {
    meses -= 1;
    dias += new Date(Date.UTC(r.a, r.m, 0)).getUTCDate(); // dias do mês anterior ao de referência
  }
  if (meses < 0) {
    anos -= 1;
    meses += 12;
  }
  return `${anos}a, ${meses}m, ${dias}d`;
}

// Dias corridos entre as DATAS (sem a hora), como a planilha faz (data de aplicação - nascimento).
export function calcularIdadeEmDias(dataNascimento: Date, dataReferencia: Date): number {
  const utc = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.round((utc(dataReferencia) - utc(dataNascimento)) / 86_400_000);
}

// Total de meses completos entre nascimento e a data de referência (ex: 2 anos e 7 meses = 31).
// Usado só por testes com normas mensais (ex: SON-R, 2;6 a 7;11) — os demais usam calcularIdadeEmAnos.
export function calcularIdadeEmMeses(dataNascimento: Date, dataReferencia: Date): number {
  let meses =
    (dataReferencia.getFullYear() - dataNascimento.getFullYear()) * 12 +
    (dataReferencia.getMonth() - dataNascimento.getMonth());
  if (dataReferencia.getDate() < dataNascimento.getDate()) meses -= 1;
  return meses;
}
