// Prontuário: tipos de profissional e modelos de evolução da sessão.
// Base comum para toda a área da saúde + o que cada profissão acrescenta. Os textos dos modelos são nossos (rótulos curtos e dicas de uso).
// As evoluções guardam a CHAVE do modelo e os campos por chave, então dá para mudar rótulo sem mexer nos dados antigos.

export type CampoModelo = { chave: string; rotulo: string; dica: string; lista?: boolean };
export type ModeloSessao = { chave: string; rotulo: string; descricao: string; campos: CampoModelo[] };

import { especialidadeDe } from "./especialidades";

export const MODELOS: ModeloSessao[] = [
  { chave: "LIVRE", rotulo: "Anotação livre", descricao: "Só as duas folhas: suas anotações e a evolução do prontuário.", campos: [] },
  {
    chave: "SOAP", rotulo: "SOAP", descricao: "Relato, observações, avaliação e plano, em quatro campos.",
    campos: [
      { chave: "s", rotulo: "S · Subjetivo", dica: "O que o paciente relatou e como viveu o período." },
      { chave: "o", rotulo: "O · Objetivo", dica: "O que você observou ou mediu na sessão." },
      { chave: "a", rotulo: "A · Avaliação", dica: "Sua leitura do quadro a partir de S e O." },
      { chave: "p", rotulo: "P · Plano", dica: "Condutas, combinados e próximos passos." },
    ],
  },
  {
    chave: "FOCO", rotulo: "Sessão com foco", descricao: "Contexto, foco do encontro e agenda de pontos a tratar.",
    campos: [
      { chave: "contexto", rotulo: "Contexto breve", dica: "Em que momento o paciente chega hoje." },
      { chave: "foco", rotulo: "Foco da sessão", dica: "O objetivo clínico do encontro, em uma frase." },
      { chave: "agenda", rotulo: "Pontos da sessão", dica: "Itens que você quer percorrer hoje.", lista: true },
    ],
  },
  {
    chave: "DBT", rotulo: "DBT", descricao: "Alvos, análise em cadeia, habilidades e compromisso.",
    campos: [
      { chave: "alvos", rotulo: "Alvos prioritários", dica: "Hierarquia dos alvos trabalhados." },
      { chave: "cadeia", rotulo: "Análise em cadeia", dica: "Vulnerabilidades, gatilho, elos e consequências." },
      { chave: "habilidades", rotulo: "Habilidades e intervenções", dica: "O que foi ensinado, praticado ou reforçado." },
      { chave: "compromisso", rotulo: "Compromisso e prática", dica: "Combinados e prática entre sessões." },
    ],
  },
  {
    chave: "CONSULTA", rotulo: "Consulta clínica", descricao: "Queixa, história, exame, hipótese e conduta.",
    campos: [
      { chave: "queixa", rotulo: "Queixa principal", dica: "Motivo da consulta nas palavras do paciente." },
      { chave: "historia", rotulo: "História atual", dica: "Evolução do quadro, tratamentos e respostas." },
      { chave: "exame", rotulo: "Exame", dica: "Achados do exame físico ou funcional." },
      { chave: "hipotese", rotulo: "Hipótese diagnóstica", dica: "Impressão clínica e diagnósticos diferenciais." },
      { chave: "conduta", rotulo: "Conduta", dica: "Prescrições, pedidos de exames e orientações." },
    ],
  },
  {
    chave: "PRIMEIRA_CONSULTA", rotulo: "Primeira consulta médica", descricao: "Queixa, história, antecedentes, medicamentos, exame, hipóteses e conduta.",
    campos: [
      { chave: "queixa", rotulo: "Queixa principal", dica: "Motivo da consulta nas palavras do paciente." },
      { chave: "hda", rotulo: "História da doença atual", dica: "Início, evolução, fatores de melhora e piora, tratamentos já feitos." },
      { chave: "antecedentes", rotulo: "Antecedentes pessoais e familiares", dica: "Doenças, cirurgias, internações e história familiar relevante." },
      { chave: "medicamentos", rotulo: "Medicamentos em uso e alergias", dica: "Nome, dose, tempo de uso e reações conhecidas." },
      { chave: "habitos", rotulo: "Hábitos e contexto", dica: "Sono, alimentação, atividade física, álcool, tabaco, trabalho e rede de apoio." },
      { chave: "exame", rotulo: "Exame físico e medidas", dica: "Sinais vitais, medidas e achados do exame." },
      { chave: "hipoteses", rotulo: "Hipóteses diagnósticas", dica: "Impressão clínica e diagnósticos diferenciais." },
      { chave: "conduta", rotulo: "Conduta", dica: "Prescrições, pedidos de exames, orientações e retorno." },
    ],
  },
  {
    chave: "RETORNO", rotulo: "Retorno médico", descricao: "Evolução desde a última consulta, adesão, medidas, ajustes e próximo retorno.",
    campos: [
      { chave: "evolucao", rotulo: "Como esteve desde a última consulta", dica: "Sintomas, intercorrências e resposta ao que foi combinado." },
      { chave: "adesao", rotulo: "Adesão e efeitos dos tratamentos", dica: "Se está usando como combinado e o que sentiu." },
      { chave: "exame", rotulo: "Exame e medidas de hoje", dica: "Sinais vitais, peso e achados novos." },
      { chave: "avaliacao", rotulo: "Avaliação", dica: "Sua leitura da evolução do quadro." },
      { chave: "conduta", rotulo: "Ajustes de conduta", dica: "Mudanças de dose, novos exames ou orientações." },
      { chave: "retorno", rotulo: "Retorno e pedidos", dica: "Quando volta e o que deve trazer." },
    ],
  },
  {
    chave: "PSIQUIATRICA", rotulo: "Consulta psiquiátrica", descricao: "Relato, exame do estado mental, risco, medicação e conduta.",
    campos: [
      { chave: "relato", rotulo: "Relato e queixas", dica: "Como esteve, o que mudou e o que o trouxe hoje." },
      { chave: "aparencia", rotulo: "Aparência e comportamento", dica: "Apresentação, contato, psicomotricidade." },
      { chave: "humor_afeto", rotulo: "Humor e afeto", dica: "Humor referido, afeto observado e reatividade." },
      { chave: "pensamento", rotulo: "Pensamento e linguagem", dica: "Curso, forma e conteúdo do pensamento; fala." },
      { chave: "percepcao", rotulo: "Sensopercepção", dica: "Alucinações, ilusões ou outras alterações." },
      { chave: "cognicao", rotulo: "Cognição, atenção e orientação", dica: "Orientação, atenção, memória e funções executivas." },
      { chave: "insight", rotulo: "Insight e juízo crítico", dica: "Consciência do quadro e do tratamento." },
      { chave: "risco", rotulo: "Risco", dica: "Ideação ou plano suicida, autoagressão, risco a terceiros, vulnerabilidade." },
      { chave: "medicacao", rotulo: "Medicação, adesão e efeitos adversos", dica: "Doses em uso, adesão e o que o paciente relata." },
      { chave: "hipoteses", rotulo: "Hipóteses diagnósticas", dica: "Impressão clínica e diagnósticos diferenciais." },
      { chave: "conduta", rotulo: "Conduta", dica: "Ajustes de medicação, psicoterapia, exames e retorno." },
    ],
  },
  {
    chave: "REABILITACAO", rotulo: "Sessão de reabilitação", descricao: "Avaliação funcional, conduta, resposta do paciente e orientações.",
    campos: [
      { chave: "avaliacao", rotulo: "Avaliação funcional", dica: "Como o paciente está hoje (dor, mobilidade, função)." },
      { chave: "conduta", rotulo: "Conduta aplicada", dica: "Técnicas e exercícios realizados." },
      { chave: "resposta", rotulo: "Resposta do paciente", dica: "Como reagiu durante e depois da sessão." },
      { chave: "orientacoes", rotulo: "Orientações para casa", dica: "O que ele deve fazer até o próximo encontro." },
    ],
  },
];

export type Profissao = { chave: string; rotulo: string; registro: string; modelos: string[]; modulos: string[] };

// Módulos de base: valem para todos. Cada profissão acrescenta os seus.
export const MODULOS_BASE = ["pacientes", "agenda", "prontuario", "anamnese", "financeiro", "documentos"];

export const PROFISSOES: Profissao[] = [
  { chave: "PSICOLOGO", rotulo: "Psicólogo(a)", registro: "CRP", modelos: ["LIVRE", "SOAP", "FOCO", "DBT"], modulos: [...MODULOS_BASE, "diario", "escalas", "estudo_caso"] },
  { chave: "NEUROPSICOLOGO", rotulo: "Neuropsicólogo(a)", registro: "CRP", modelos: ["LIVRE", "SOAP", "FOCO", "DBT"], modulos: [...MODULOS_BASE, "diario", "escalas", "estudo_caso", "testes", "laudos"] },
  { chave: "MEDICO", rotulo: "Médico(a)", registro: "CRM", modelos: ["LIVRE", "PRIMEIRA_CONSULTA", "RETORNO", "SOAP", "CONSULTA"], modulos: [...MODULOS_BASE, "escalas", "saude", "pedidos"] },
  { chave: "FISIOTERAPEUTA", rotulo: "Fisioterapeuta", registro: "CREFITO", modelos: ["LIVRE", "REABILITACAO", "SOAP"], modulos: [...MODULOS_BASE] },
  { chave: "TERAPEUTA_OCUPACIONAL", rotulo: "Terapeuta ocupacional", registro: "CREFITO", modelos: ["LIVRE", "REABILITACAO", "SOAP"], modulos: [...MODULOS_BASE] },
  { chave: "FONOAUDIOLOGO", rotulo: "Fonoaudiólogo(a)", registro: "CRFa", modelos: ["LIVRE", "REABILITACAO", "SOAP"], modulos: [...MODULOS_BASE] },
  { chave: "NUTRICIONISTA", rotulo: "Nutricionista", registro: "CRN", modelos: ["LIVRE", "CONSULTA", "SOAP"], modulos: [...MODULOS_BASE] },
  { chave: "OUTRO", rotulo: "Outro profissional da saúde", registro: "Registro profissional", modelos: ["LIVRE", "SOAP"], modulos: [...MODULOS_BASE] },
];

// A especialidade (só do médico) acrescenta modelos e módulos ao pacote base da profissão.
export function profissaoDe(chave: string | null | undefined, especialidade?: string | null): Profissao {
  const p = PROFISSOES.find((x) => x.chave === chave) ?? PROFISSOES[0];
  const e = p.chave === "MEDICO" ? especialidadeDe(especialidade) : undefined;
  return e ? { ...p, modelos: [...new Set([...p.modelos, ...e.modelos])], modulos: [...new Set([...p.modulos, ...e.modulos])] } : p;
}
export const modeloDe = (chave: string): ModeloSessao | undefined => MODELOS.find((m) => m.chave === chave);

const MAX_CAMPO = 8000;
const MAX_PONTOS = 20;

// Valida e limpa os campos de um modelo: só as chaves que o modelo conhece, textos com tamanho máximo, lista com até 20 pontos.
export function validarCampos(modelo: string, campos: unknown): { campos: Record<string, string | string[]>; erros: string[] } {
  const m = modeloDe(modelo);
  if (!m) return { campos: {}, erros: ["Modelo de sessão desconhecido."] };
  const entrada = campos && typeof campos === "object" && !Array.isArray(campos) ? (campos as Record<string, unknown>) : {};
  const limpo: Record<string, string | string[]> = {};
  const erros: string[] = [];
  for (const c of m.campos) {
    const v = entrada[c.chave];
    if (v === undefined || v === null) continue;
    if (c.lista) {
      if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) { erros.push(`${c.rotulo}: envie uma lista de textos.`); continue; }
      const itens = (v as string[]).map((x) => x.trim()).filter(Boolean);
      if (itens.length > MAX_PONTOS) { erros.push(`${c.rotulo}: no máximo ${MAX_PONTOS} pontos.`); continue; }
      if (itens.some((x) => x.length > 300)) { erros.push(`${c.rotulo}: cada ponto tem até 300 caracteres.`); continue; }
      limpo[c.chave] = itens;
    } else {
      if (typeof v !== "string") { erros.push(`${c.rotulo}: envie um texto.`); continue; }
      if (v.length > MAX_CAMPO) { erros.push(`${c.rotulo}: até ${MAX_CAMPO} caracteres.`); continue; }
      limpo[c.chave] = v;
    }
  }
  return { campos: limpo, erros };
}

// O profissional só usa os modelos da sua profissão (o admin da clínica segue o mesmo catálogo do próprio cadastro).
export const modeloPermitido = (profissaoChave: string | null | undefined, modelo: string, especialidade?: string | null) => profissaoDe(profissaoChave, especialidade).modelos.includes(modelo);
