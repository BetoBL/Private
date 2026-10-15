// Prontuário: tipos de profissional e modelos de evolução da sessão.
// Base comum para toda a área da saúde + o que cada profissão acrescenta. Os textos dos modelos são nossos (rótulos curtos e dicas de uso).
// As evoluções guardam a CHAVE do modelo e os campos por chave, então dá para mudar rótulo sem mexer nos dados antigos.

export type CampoModelo = { chave: string; rotulo: string; dica: string; lista?: boolean };
export type ModeloSessao = { chave: string; rotulo: string; descricao: string; campos: CampoModelo[] };

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
  { chave: "MEDICO", rotulo: "Médico(a)", registro: "CRM", modelos: ["LIVRE", "CONSULTA", "SOAP"], modulos: [...MODULOS_BASE] },
  { chave: "FISIOTERAPEUTA", rotulo: "Fisioterapeuta", registro: "CREFITO", modelos: ["LIVRE", "REABILITACAO", "SOAP"], modulos: [...MODULOS_BASE] },
  { chave: "TERAPEUTA_OCUPACIONAL", rotulo: "Terapeuta ocupacional", registro: "CREFITO", modelos: ["LIVRE", "REABILITACAO", "SOAP"], modulos: [...MODULOS_BASE] },
  { chave: "FONOAUDIOLOGO", rotulo: "Fonoaudiólogo(a)", registro: "CRFa", modelos: ["LIVRE", "REABILITACAO", "SOAP"], modulos: [...MODULOS_BASE] },
  { chave: "NUTRICIONISTA", rotulo: "Nutricionista", registro: "CRN", modelos: ["LIVRE", "CONSULTA", "SOAP"], modulos: [...MODULOS_BASE] },
  { chave: "OUTRO", rotulo: "Outro profissional da saúde", registro: "Registro profissional", modelos: ["LIVRE", "SOAP"], modulos: [...MODULOS_BASE] },
];

export const profissaoDe = (chave: string | null | undefined): Profissao => PROFISSOES.find((p) => p.chave === chave) ?? PROFISSOES[0];
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
export const modeloPermitido = (profissaoChave: string | null | undefined, modelo: string) => profissaoDe(profissaoChave).modelos.includes(modelo);
