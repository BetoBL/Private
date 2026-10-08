import { avisarSeSemAviso } from "./aviso";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";
const TOKEN_STORAGE_KEY = "neurologic_token";
const PROFISSIONAL_STORAGE_KEY = "neurologic_profissional";

export interface AnamneseData {
  queixaPrincipal?: string; // motivo da busca pela avaliação
  historicoEscolar?: string;
  historicoMedico?: string;
  historicoFamiliar?: string;
  informante?: string;
  irmaos?: string;
  reside?: string;
  caracteristicasInfancia?: string;
  acompanhamentoPrevio?: string;
  idadeAlfabetizacao?: string;
  rendimentoEscolar?: string;
  escolaridadeAtual?: string;
  planosFuturos?: string;
  diagnosticosClinicos?: string;
  medicacao?: string;
  sintomasFisicos?: string;
  perfilSocial?: string;
  atencaoRelato?: string;
  humor?: string;
  habilidadesSociais?: string;
  sonoDormir?: string;
  sonoAcordar?: string;
  atividadesFisicas?: string;
  alimentacao?: string;
  gestacao?: string;
  parto?: string;
  amamentacao?: string;
  desenvolvimento?: string;
  textoLivre?: string;
}

export type Sexo = "MASCULINO" | "FEMININO";

export interface Paciente {
  id: string;
  clinicaId: string;
  profissionalId: string;
  nome: string;
  dataNascimento: string;
  sexo: Sexo | null;
  responsavelLegal: string | null;
  cpf: string | null;
  contato: string | null;
  escolaridade: string | null;
  anamnese: AnamneseData | null;
  preferenciasAgenda: PreferenciasAgenda | null;
  consentimentoTDIC: boolean;
  consentimentoTDICData: string | null;
  convenioId: string | null;
  convenioNumeroCarteira: string | null;
  convenioPlano: string | null;
  convenioValidade: string | null;
  convenioTitular: string | null;
  criadoEm: string;
}

export interface Convenio {
  id: string;
  clinicaId: string;
  nomeOperadora: string;
  codigoPrestador: string | null;
  ativo: boolean;
}

export type StatusCobranca = "ABERTA" | "PAGA" | "CANCELADA";
export interface Cobranca {
  id: string;
  pacienteId: string;
  sessaoId: string | null;
  convenioId: string | null;
  descricao: string;
  valor: string; // decimal em texto
  vencimento: string;
  status: StatusCobranca;
  valorPago: string | null;
  pagoEm: string | null;
  formaPagamento: string | null;
  observacoes: string | null;
  paciente: { id: string; nome: string };
  convenio: { id: string; nomeOperadora: string } | null;
}
export interface ResumoFinanceiro {
  aReceberNoMes: { total: number; quantidade: number };
  atrasado: { total: number; quantidade: number };
  recebidoNoMes: { total: number; quantidade: number };
  emAbertoPorOrigem: Array<{ convenioId: string | null; nome: string; total: number; quantidade: number }>;
}
export interface DadosCobranca {
  pacienteId: string;
  convenioId?: string | null;
  descricao: string;
  valor: number;
  vencimento: string;
  observacoes?: string | null;
}

export type PapelProfissional = "ADMIN" | "PSICOLOGO";

export interface Profissional {
  id: string;
  clinicaId: string;
  nome: string;
  email: string;
  crp: string;
  telefone: string | null;
  enderecoParticular: string | null;
  formacao: string | null;
  especialidades: string[];
  papel: PapelProfissional;
  temAssinatura?: boolean;
  tituloLaudo?: string | null;
  criadoEm: string;
}

export interface ProfissionalLogado extends Pick<Profissional, "id" | "clinicaId" | "nome" | "email" | "crp" | "papel"> {}

export interface Clinica {
  id: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  telefone: string | null;
  corPrimaria: string | null;
  corSecundaria: string | null;
  // papel timbrado do laudo
  logoUrl: string | null;
  marcaDaguaUrl: string | null;
  slogan: string | null;
  instagram: string | null;
  whatsapp: string | null;
}

export interface Anexo {
  id: string;
  pacienteId: string;
  tipo: string;
  url: string;
  descricao: string | null;
  criadoEm: string;
}

export interface CampoTeste {
  chave: string;
  label: string;
}

export type DirecaoMelhorPior = "MAIOR_MELHOR" | "MENOR_MELHOR" | "NEUTRO";

export interface Teste {
  id: string;
  nome: string;
  sigla: string;
  dominio: string;
  isPlaceholder: boolean;
  ativo: boolean;
  direcao: DirecaoMelhorPior;
  // Chave do instrumento quando este teste é um dos formulários dele (ex: SCARED-PAIS e
  // SCARED-AUTORRELATO compartilham "SCARED"). É o que permite reconhecer que dois lançamentos
  // de testes diferentes falam do mesmo instrumento sobre o mesmo paciente.
  instrumento: string | null;
  algoritmoCorrecao: {
    campos?: CampoTeste[];
    // Campos que NÃO entram no formulário de lançamento (o motor calcula a partir de outros —
    // ex.: índices do WISC-IV, Inibição/Flexibilidade do FDT) mas aparecem no resultado. Só para
    // dar rótulo legível a eles em ResultadoResumo — sem isso o resultado mostra a chave técnica
    // crua (ex.: "tempoInibicao" em vez de "Inibição").
    camposCalculados?: CampoTeste[];
    [key: string]: unknown;
  };
}

export interface Sessao {
  id: string;
  pacienteId: string;
  profissionalId: string;
  dataHora: string;
  tipo?: "AVALIACAO" | "ANAMNESE";
}

export interface EventoAgenda {
  id: string;
  profissionalId: string;
  pacienteId: string | null;
  paciente: { id: string; nome: string } | null;
  titulo: string;
  tipo: string;
  inicio: string;
  fim: string;
  observacoes: string | null;
  sessaoId?: string | null;
  criadoEm: string;
}

export interface ConflitoAgenda {
  id: string;
  titulo: string;
  inicio: string;
  fim: string;
  paciente: string | null;
}

export interface PreferenciasAgenda {
  diasPreferidos?: string[];
  horarioPreferido?: string;
  observacoes?: string;
}

export interface FaixaConversao {
  min?: number;
  max?: number;
  classificacao?: string;
  percentil?: number;
  escoreT?: number;
  qi?: number;
  [outro: string]: number | string | undefined;
}

export type ResultadoCalculado =
  | { modo: "soma"; escoreBrutoTotal: number; faixa: FaixaConversao | null }
  // valorBruto null = campo derivado que não pôde ser calculado porque falta algum campo-fonte
  // (ex: índice do WISC-IV com subteste principal não lançado) — ver motorCalculo.ts.
  | { modo: "por_campo"; porCampo: Record<string, { valorBruto: number | null; faixa: FaixaConversao | null }>; extras?: Record<string, unknown> }
  // motor de planilha: valor de cada saída configurada no teste (null = vazio/erro da fórmula)
  | { modo: "planilha"; saidas: Record<string, string | number | boolean | null>; erros?: string[] };

// Quem produziu os escores. PACIENTE cobre autorrelato e teste de aplicação direta (WISC-IV,
// RAVLT), onde não existe informante. Ver enum TipoRespondente no schema.
export type TipoRespondente =
  | "PACIENTE"
  | "MAE"
  | "PAI"
  | "CONJUGE"
  | "FILHO"
  | "IRMAO"
  | "CUIDADOR"
  | "PROFESSOR"
  | "PROFISSIONAL"
  | "OUTRO";

export const ROTULO_RESPONDENTE: Record<TipoRespondente, string> = {
  PACIENTE: "O próprio paciente",
  MAE: "Mãe",
  PAI: "Pai",
  CONJUGE: "Cônjuge/parceiro(a)",
  FILHO: "Filho(a)",
  IRMAO: "Irmão/irmã",
  CUIDADOR: "Cuidador/responsável",
  PROFESSOR: "Professor(a)",
  PROFISSIONAL: "Outro profissional",
  OUTRO: "Outro",
};

export interface DadosRespondente {
  respondenteTipo?: TipoRespondente;
  respondenteNome?: string;
  respondenteRelacao?: string;
}

export interface AplicacaoDeTeste {
  id: string;
  sessaoId: string;
  testeId: string;
  escoresBrutos: Record<string, number>;
  resultadoCalculado: ResultadoCalculado | null;
  criadoEm: string;
  teste: Teste;
  respondenteTipo: TipoRespondente;
  respondenteNome: string | null;
  respondenteRelacao: string | null;
}

export type StatusLaudo = "RASCUNHO_IA" | "EM_REVISAO" | "FINALIZADO" | "ENTREGUE";

export interface Laudo {
  id: string;
  pacienteId: string;
  profissionalId: string;
  identificacao: Record<string, unknown>;
  descricaoDemanda: string;
  procedimento: string;
  analise: string;
  conclusao: string;
  referencias: string;
  anamnese: string;
  observacaoClinica: string;
  hipoteseDiagnostica: string;
  interpretacoes: Record<string, string> | null;
  modeloId: string | null;
  secoesExtras: Record<string, string> | null;
  status: StatusLaudo;
  iaUtilizada: boolean;
  iaRevisadaPeloProf: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

// ---- modelos de laudo (estrutura de seções, domínios e blocos) ----
export type TipoSecao = "identificacao" | "demanda" | "anamnese" | "observacao" | "instrumentos" | "referencial" | "analise" | "conclusao" | "sugestoes" | "referencias" | "fecho" | "aviso_sigilo" | "aviso_validade" | "aviso_ia" | "texto" | "livre" | "documento";
export interface BlocoIdentificacao { tipo: "profissional" | "paciente" | "campos"; titulo?: string; campos?: Array<{ id: string; rotulo: string }> }
export interface SecaoModelo { id: string; tipo: TipoSecao; titulo: string; ativo?: boolean; texto?: string | string[]; orientacao?: string; quebraPagina?: boolean; classificacao?: boolean; identificacao?: BlocoIdentificacao[] }
export interface DominioModelo { chave: string; titulo?: string; intro?: string; ativo?: boolean }
export interface ItemExtraModelo { dominio: string; teste: string; fonte: { linha?: string; campo?: string }; descricao: string; rotulo?: string }
export interface BlocoModelo { dominio: string; teste: string; tipo: "tabela" | "grafico" | "resultados"; ref?: string }
export interface EstruturaModelo { cabecalho: string[]; abertura?: string; numerar: boolean; secoes: SecaoModelo[]; dominios?: DominioModelo[]; itensExtras?: ItemExtraModelo[]; blocos?: BlocoModelo[]; testes?: string[]; tipoAtendimentoId?: string }
export interface ModeloLaudo {
  id: string; nome: string; tipo: string; rotuloTipo: string; descricao: string | null; fonte: string | null;
  sistema: boolean; escopo: "sistema" | "clinica" | "profissional"; origemId: string | null; temArquivoWord: boolean; ehPadrao: boolean;
  estrutura: EstruturaModelo; atualizadoEm: string;
}
export interface ResultadoImportacaoModelo {
  estrutura: EstruturaModelo;
  secoesLidas: Array<{ titulo: string; tipo: TipoSecao; motivo: string }>;
  testesDetectados: Array<{ sigla: string; nome: string; secao: string }>;
  dominiosDetectados: string[];
  marcadoresInseridos: Array<{ marcador: string; trecho: string }>;
  avisos: string[];
}
export interface BibliotecaTeste { sigla: string; nome: string; tabelas: string[]; graficos: string[]; linhas: string[]; campos: Array<{ chave: string; label: string }> }
export interface DominioPadrao { chave: string; titulo: string; intro: string; testes: string[] }
export interface DadosGravarModelo { nome: string; tipo: string; descricao?: string | null; origemId?: string | null; escopo?: "profissional" | "clinica"; estrutura: EstruturaModelo; tornarPadrao?: boolean }

export interface RespostaPerfil {
  opcoes: string[];
  complemento?: string;
}

export type SistemaClassificacaoPercentil = "GUILMETTE_2020" | "MIOTTO_2017";

export interface PerfilDeAtuacao {
  profissionalId: string;
  abordagemTeorica: string | null;
  tomDeEscrita: string | null;
  regrasDePrudencia: string | null;
  vocabularioRecorrente: string | null;
  respostas: Record<string, RespostaPerfil> | null;
  sistemaClassificacaoPercentil: SistemaClassificacaoPercentil;
}

export interface NormativaCustomizada {
  id: string;
  clinicaId: string;
  testeId: string;
  teste?: Teste;
  nomeNormativa: string;
  descricao: string | null;
  fonte: string | null;
  criterio: string;
  faixaMin: number | null;
  faixaMax: number | null;
  faixaLabel: string | null;
  sexo: "MASCULINO" | "FEMININO" | null;
  conversao: Record<string, unknown>;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export type NormativaCustomizadaInput = {
  testeId: string;
  nomeNormativa: string;
  descricao?: string;
  fonte?: string;
  criterio: string;
  faixaMin?: number;
  faixaMax?: number;
  faixaLabel?: string;
  sexo?: "MASCULINO" | "FEMININO";
  conversao: Record<string, unknown>;
};

export interface TipoAtendimento {
  id: string;
  clinicaId: string;
  nome: string;
  descricao: string | null;
  numeroSessoes: number;
  testeIds: string[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface SalaVirtual {
  id: string;
  sessaoId: string;
  urlJitsi: string;
  codigoSala: string;
  statusSala: "agendada" | "em_andamento" | "encerrada";
  inicioAgendado: string;
  inicioReal: string | null;
  fimReal: string | null;
  profissionalPresente: boolean;
  pacientePresente: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

// --- Sessão de autenticação ---

let authToken: string | null = localStorage.getItem(TOKEN_STORAGE_KEY);
let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(fn: (() => void) | null) {
  onUnauthorized = fn;
}

function salvarSessao(token: string, profissional: ProfissionalLogado) {
  authToken = token;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.setItem(PROFISSIONAL_STORAGE_KEY, JSON.stringify(profissional));
}

function limparSessao() {
  authToken = null;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(PROFISSIONAL_STORAGE_KEY);
}

export function obterProfissionalLogado(): ProfissionalLogado | null {
  const bruto = localStorage.getItem(PROFISSIONAL_STORAGE_KEY);
  if (!authToken || !bruto) return null;
  try {
    return JSON.parse(bruto) as ProfissionalLogado;
  } catch {
    return null;
  }
}

// Atualiza só o profissional em cache (ex: depois de reconsultar a API para corrigir dados
// obsoletos de uma sessão antiga — ver AuthContext). Não mexe no token.
export function atualizarProfissionalLogadoEmCache(profissional: ProfissionalLogado) {
  localStorage.setItem(PROFISSIONAL_STORAGE_KEY, JSON.stringify(profissional));
}

async function tratarRespostaSemOk(res: Response): Promise<never> {
  if (res.status === 401) {
    limparSessao();
    onUnauthorized?.();
  }
  const body = await res.json().catch(() => ({ error: res.statusText }));
  throw new Error(body.error ?? `Erro ${res.status}`);
}

async function baixarArquivo(path: string): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
  });
  if (!res.ok) await tratarRespostaSemOk(res);
  const disposicao = res.headers.get("Content-Disposition") ?? "";
  const filename = disposicao.match(/filename="?([^"]+)"?/)?.[1] ?? "laudo.docx";
  const blob = await res.blob();
  return { blob, filename };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) await tratarRespostaSemOk(res);
  avisarGravacao(path, init?.method);
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Chamadas que usam POST/PATCH mas não são "salvar algo": login, geração de rascunho por IA,
// humor do painel e presença na sala virtual.
const SEM_AVISO_DE_GRAVACAO = [/^\/auth\//, /\/gerar-rascunho$/, /^\/painel-do-dia\//, /^\/salas-virtuais/];

// Gravação bem-sucedida sem aviso próprio da tela vira um "Salvo" discreto (ver lib/aviso.ts).
function avisarGravacao(path: string, method?: string) {
  if (!method || method === "GET" || SEM_AVISO_DE_GRAVACAO.some((r) => r.test(path))) return;
  avisarSeSemAviso(method === "DELETE" ? "Removido" : "Salvo");
}

export type ResultadoEventoAgenda = { conflito: false; evento: EventoAgenda } | { conflito: true; conflitos: ConflitoAgenda[] };

async function enviarEventoAgenda(path: string, method: "POST" | "PATCH", data: unknown): Promise<ResultadoEventoAgenda> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (res.status === 409) {
    const body = await res.json();
    return { conflito: true, conflitos: body.conflitos as ConflitoAgenda[] };
  }
  if (!res.ok) await tratarRespostaSemOk(res);
  avisarGravacao(path, method);
  return { conflito: false, evento: await res.json() };
}

export interface ConflitoCronograma {
  sessao: number;
  titulo: string;
  inicio: string;
  fim: string;
  paciente: string | null;
}

export type ResultadoIniciarAtendimento =
  | { conflito: false; tipo: TipoAtendimento; sessoes: Sessao[]; eventos: EventoAgenda[]; mensagem: string }
  | { conflito: true; conflitos: ConflitoCronograma[] };

async function enviarAtendimento(data: {
  pacienteId: string;
  tipoAtendimentoId: string;
  dataPrimeiraSessao?: string;
  intervaloDias?: number;
  duracaoMinutos?: number;
  sessoes?: { dataHora: string }[];
  forcar?: boolean;
  anamnese?: { dataHora: string };
}): Promise<ResultadoIniciarAtendimento> {
  const res = await fetch(`${API_URL}/atendimentos`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
    body: JSON.stringify(data),
  });
  if (res.status === 409) {
    const body = await res.json();
    return { conflito: true, conflitos: body.conflitos };
  }
  if (!res.ok) await tratarRespostaSemOk(res);
  avisarGravacao("/atendimentos", "POST");
  return { conflito: false, ...(await res.json()) };
}

export const api = {
  login: async (email: string, senha: string) => {
    const resposta = await request<{ token: string; profissional: ProfissionalLogado }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    });
    salvarSessao(resposta.token, resposta.profissional);
    return resposta.profissional;
  },
  logout: () => limparSessao(),
  estaAutenticado: () => authToken !== null,

  listPacientes: (profissionalId?: string) =>
    request<Paciente[]>(`/pacientes${profissionalId ? `?profissionalId=${profissionalId}` : ""}`),
  getPaciente: (id: string) => request<Paciente>(`/pacientes/${id}`),
  createPaciente: (data: { profissionalId: string; nome: string; dataNascimento: string; sexo?: Sexo }) =>
    request<Paciente>("/pacientes", { method: "POST", body: JSON.stringify(data) }),
  updatePaciente: (
    id: string,
    data: Partial<{
      nome: string;
      dataNascimento: string;
      sexo: Sexo;
      responsavelLegal: string;
      cpf: string | null;
      contato: string;
      escolaridade: string;
      anamnese: AnamneseData;
      preferenciasAgenda: PreferenciasAgenda;
      consentimentoTDIC: boolean;
      profissionalId: string;
      // null limpa o campo (paciente particular / sem plano)
      convenioId: string | null;
      convenioNumeroCarteira: string | null;
      convenioPlano: string | null;
      convenioValidade: string | null;
      convenioTitular: string | null;
    }>
  ) => request<Paciente>(`/pacientes/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  listProfissionais: () => request<Profissional[]>("/profissionais"),
  getProfissional: (id: string) => request<Profissional>(`/profissionais/${id}`),
  createProfissional: (data: { clinicaId: string; nome: string; crp: string; email: string; senha: string }) =>
    request<Profissional>("/profissionais", { method: "POST", body: JSON.stringify(data) }),
  getAssinatura: (id: string) => request<{ assinaturaUrl: string | null }>(`/profissionais/${id}/assinatura`),
  updateProfissional: (
    id: string,
    data: Partial<{
      tituloLaudo: string;
      assinaturaUrl: string; // data URL; "" remove
      nome: string;
      crp: string;
      telefone: string;
      enderecoParticular: string;
      formacao: string;
      especialidades: string[];
      papel: PapelProfissional;
      senha: string;
    }>
  ) => request<Profissional>(`/profissionais/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteProfissional: (id: string) => request<void>(`/profissionais/${id}`, { method: "DELETE" }),

  getClinica: (id: string) => request<Clinica>(`/clinicas/${id}`),
  updateClinica: (
    id: string,
    data: Partial<
      Pick<
        Clinica,
        "razaoSocial" | "nomeFantasia" | "cnpj" | "endereco" | "bairro" | "cidade" | "estado" | "cep" | "telefone" | "corPrimaria" | "corSecundaria" | "logoUrl" | "marcaDaguaUrl" | "slogan" | "instagram" | "whatsapp"
      >
    >
  ) => request<Clinica>(`/clinicas/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  listAnexos: (pacienteId: string) => request<Anexo[]>(`/anexos?pacienteId=${pacienteId}`),
  createAnexo: (data: { pacienteId: string; tipo: string; url: string; descricao?: string }) =>
    request<Anexo>("/anexos", { method: "POST", body: JSON.stringify(data) }),
  deleteAnexo: (id: string) => request<void>(`/anexos/${id}`, { method: "DELETE" }),
  updateAnexo: (id: string, data: { tipo?: string; url?: string; descricao?: string | null }) => request<Anexo>(`/anexos/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  // sessões: corrigir data/hora (os testes lançados são recalculados) e excluir sessão vazia
  updateSessao: (id: string, data: { dataHora?: string; observacoes?: string | null }) => request<Sessao & { testesRecalculados: number }>(`/sessoes/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteSessao: (id: string) => request<void>(`/sessoes/${id}`, { method: "DELETE" }),
  deleteAplicacao: (id: string) => request<void>(`/aplicacoes-teste/${id}`, { method: "DELETE" }),

  listTestes: () => request<Teste[]>("/testes"),

  listSessoes: (pacienteId: string) => request<Sessao[]>(`/sessoes?pacienteId=${pacienteId}`),
  listTodasSessoes: () => request<Sessao[]>("/sessoes"),
  createSessao: (data: { pacienteId: string; dataHora: string }) =>
    request<Sessao>("/sessoes", { method: "POST", body: JSON.stringify(data) }),

  // Calcula SEM gravar (mesmo caminho do salvar), para a tela mostrar o resultado ao vivo.
  calcularAplicacao: (data: { sessaoId: string; testeId: string; escoresBrutos: Record<string, number>; confianca?: "90%" | "95%"; base?: "Amostra Geral" | "Nível de Habilidade" }) =>
    request<{
      resultadoCalculado: ResultadoCalculado | null;
      idadeDias: number;
      idadeAnos: number;
      idadeTexto: string;
      paciente: { nome: string; escolaridade: string | null; sexo: Sexo | null; dataNascimento: string };
      dataAplicacao: string;
    }>("/aplicacoes-teste/calcular", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  listAplicacoes: (sessaoId: string) => request<AplicacaoDeTeste[]>(`/aplicacoes-teste?sessaoId=${sessaoId}`),
  listAplicacoesPorPaciente: (pacienteId: string) =>
    request<AplicacaoDeTeste[]>(`/aplicacoes-teste?pacienteId=${pacienteId}`),
  createAplicacao: (
    data: { sessaoId: string; testeId: string; escoresBrutos: Record<string, number> } & DadosRespondente
  ) => request<AplicacaoDeTeste>("/aplicacoes-teste", { method: "POST", body: JSON.stringify(data) }),
  updateAplicacao: (id: string, data: { escoresBrutos: Record<string, number> } & DadosRespondente) =>
    request<AplicacaoDeTeste>(`/aplicacoes-teste/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  listLaudos: (pacienteId: string) => request<Laudo[]>(`/laudos?pacienteId=${pacienteId}`),
  listTodosLaudos: () => request<Laudo[]>("/laudos"),
  createLaudo: (data: {
    pacienteId: string;
    identificacao: Record<string, unknown>;
    descricaoDemanda: string;
    procedimento?: string;
    anamnese?: string;
    observacaoClinica?: string;
    modeloId?: string | null;
  }) => request<Laudo>("/laudos", { method: "POST", body: JSON.stringify(data) }),
  updateLaudo: (id: string, data: Partial<Pick<Laudo, "modeloId" | "secoesExtras" | "anamnese" | "observacaoClinica" | "hipoteseDiagnostica" | "interpretacoes" | "descricaoDemanda" | "procedimento" | "analise" | "conclusao" | "referencias" | "status" | "iaRevisadaPeloProf">>) =>
    request<Laudo>(`/laudos/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  montarAnamneseLaudo: (id: string) => request<Laudo>(`/laudos/${id}/montar-anamnese`, { method: "POST" }),
  montarEstruturaLaudo: (id: string, aplicacaoIds?: string[]) => request<{ laudo: Laudo; semMapa: string[] }>(`/laudos/${id}/montar-estrutura`, { method: "POST", body: JSON.stringify({ aplicacaoIds }) }),
  previaLaudo: (id: string) => request<{ html: string }>(`/laudos/${id}/previa`),
  gerarRascunho: (id: string) => request<Laudo>(`/laudos/${id}/gerar-rascunho`, { method: "POST" }),
  exportarLaudoDocx: (id: string) => baixarArquivo(`/laudos/${id}/exportar-docx`),

  listModelosLaudo: () => request<ModeloLaudo[]>("/modelos-laudo"),
  getModeloLaudo: (id: string) => request<ModeloLaudo>(`/modelos-laudo/${id}`),
  marcadoresModelo: () => request<{ marcadores: Array<{ marcador: string; descricao: string }>; tiposDeSecao: TipoSecao[]; tiposDeModelo: Array<{ valor: string; rotulo: string }> }>("/modelos-laudo/marcadores"),
  dominiosPadraoModelo: () => request<DominioPadrao[]>("/modelos-laudo/dominios-padrao"),
  bibliotecaModelo: () => request<BibliotecaTeste[]>("/modelos-laudo/biblioteca"),
  criarModeloLaudo: (data: DadosGravarModelo) => request<ModeloLaudo>("/modelos-laudo", { method: "POST", body: JSON.stringify(data) }),
  atualizarModeloLaudo: (id: string, data: Partial<Pick<DadosGravarModelo, "nome" | "tipo" | "descricao" | "estrutura" | "tornarPadrao">>) => request<ModeloLaudo>(`/modelos-laudo/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  apagarModeloLaudo: (id: string) => request<{ ok: true }>(`/modelos-laudo/${id}`, { method: "DELETE" }),
  definirModeloPadrao: (id: string, paraClinica = false) => request<{ ok: true }>(`/modelos-laudo/${id}/padrao`, { method: "POST", body: JSON.stringify({ paraClinica }) }),
  importarModeloWord: (arquivoBase64: string) => request<ResultadoImportacaoModelo>("/modelos-laudo/importar-word", { method: "POST", body: JSON.stringify({ arquivoBase64 }) }),
  enviarArquivoWordModelo: (id: string, arquivoBase64: string) => request<{ ok: true; marcadores: string[]; desconhecidos: string[] }>(`/modelos-laudo/${id}/arquivo-word`, { method: "PUT", body: JSON.stringify({ arquivoBase64 }) }),
  removerArquivoWordModelo: (id: string) => request<{ ok: true }>(`/modelos-laudo/${id}/arquivo-word`, { method: "DELETE" }),
  baixarWordDeExemplo: (modeloId?: string) => baixarArquivo(`/modelos-laudo/guia-word${modeloId ? `?modeloId=${modeloId}` : ""}`),
  baixarArquivoWordModelo: (id: string) => baixarArquivo(`/modelos-laudo/${id}/arquivo-word`),

  listEventosAgenda: (params: { inicio?: string; fim?: string; profissionalId?: string; pacienteId?: string } = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]);
    const qs = query.toString();
    return request<EventoAgenda[]>(`/eventos-agenda${qs ? `?${qs}` : ""}`);
  },
  criarEventoAgenda: (data: {
    profissionalId?: string;
    pacienteId?: string;
    titulo: string;
    tipo: string;
    inicio: string;
    fim: string;
    observacoes?: string;
    forcar?: boolean;
  }) => enviarEventoAgenda("/eventos-agenda", "POST", data),
  editarEventoAgenda: (
    id: string,
    data: Partial<{
      pacienteId: string;
      titulo: string;
      tipo: string;
      inicio: string;
      fim: string;
      observacoes: string;
      forcar: boolean;
    }>
  ) => enviarEventoAgenda(`/eventos-agenda/${id}`, "PATCH", data),
  deletarEventoAgenda: (id: string) => request<void>(`/eventos-agenda/${id}`, { method: "DELETE" }),

  getResumoDoDia: (atualizar = false) => request<{ resumo: string; geradoEm?: string; doDia?: boolean }>(`/painel-do-dia/resumo${atualizar ? "?atualizar=1" : ""}`),
  enviarHumor: (humor: string) => request<{ resposta: string }>("/painel-do-dia/humor", { method: "POST", body: JSON.stringify({ humor }) }),

  getPerfilDeAtuacao: () => request<PerfilDeAtuacao | null>("/perfil-atuacao"),
  salvarPerfilDeAtuacao: (data: {
    abordagemTeorica?: string;
    tomDeEscrita?: string;
    regrasDePrudencia?: string;
    vocabularioRecorrente?: string;
    respostas?: Record<string, RespostaPerfil>;
    sistemaClassificacaoPercentil?: SistemaClassificacaoPercentil;
  }) => request<PerfilDeAtuacao>("/perfil-atuacao", { method: "PUT", body: JSON.stringify(data) }),

  listTiposAtendimento: () => request<TipoAtendimento[]>("/tipos-atendimento"),
  createTipoAtendimento: (data: { nome: string; descricao?: string; numeroSessoes: number; testeIds: string[] }) =>
    request<TipoAtendimento>("/tipos-atendimento", { method: "POST", body: JSON.stringify(data) }),
  updateTipoAtendimento: (id: string, data: Partial<Omit<TipoAtendimento, "id" | "clinicaId" | "criadoEm" | "atualizadoEm">>) =>
    request<TipoAtendimento>(`/tipos-atendimento/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTipoAtendimento: (id: string) => request<void>(`/tipos-atendimento/${id}`, { method: "DELETE" }),
  listNormativasCustomizadas: () => request<NormativaCustomizada[]>("/normativas-customizadas"),
  createNormativaCustomizada: (data: NormativaCustomizadaInput) =>
    request<NormativaCustomizada>("/normativas-customizadas", { method: "POST", body: JSON.stringify(data) }),
  updateNormativaCustomizada: (id: string, data: Partial<NormativaCustomizadaInput>) =>
    request<NormativaCustomizada>(`/normativas-customizadas/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteNormativaCustomizada: (id: string) => request<void>(`/normativas-customizadas/${id}`, { method: "DELETE" }),

  iniciarAtendimento: enviarAtendimento,

  // financeiro: cobranças (particular ou convênio), baixa e resumo do mês
  listCobrancas: (f: { status?: string; mes?: string; pacienteId?: string; convenioId?: string; particular?: boolean } = {}) => {
    const q = new URLSearchParams();
    if (f.status) q.set("status", f.status);
    if (f.mes) q.set("mes", f.mes);
    if (f.pacienteId) q.set("pacienteId", f.pacienteId);
    if (f.convenioId) q.set("convenioId", f.convenioId);
    if (f.particular) q.set("particular", "1");
    return request<Cobranca[]>("/financeiro?" + q.toString());
  },
  resumoFinanceiro: (mes: string) => request<ResumoFinanceiro>("/financeiro/resumo?mes=" + mes),
  createCobranca: (data: DadosCobranca) => request<Cobranca>("/financeiro", { method: "POST", body: JSON.stringify(data) }),
  updateCobranca: (id: string, data: Partial<Omit<DadosCobranca, "pacienteId">>) => request<Cobranca>("/financeiro/" + id, { method: "PATCH", body: JSON.stringify(data) }),
  baixarCobranca: (id: string, data: { valorPago: number; pagoEm?: string; formaPagamento?: string | null }) => request<Cobranca>("/financeiro/" + id + "/baixa", { method: "POST", body: JSON.stringify(data) }),
  reabrirCobranca: (id: string) => request<Cobranca>("/financeiro/" + id + "/reabrir", { method: "POST" }),
  cancelarCobranca: (id: string) => request<void>("/financeiro/" + id, { method: "DELETE" }),
  listConvenios: (opcoes?: { todos?: boolean }) => request<Convenio[]>(`/convenios${opcoes?.todos ? "?todos=1" : ""}`),
  createConvenio: (data: { nomeOperadora: string; codigoPrestador?: string }) =>
    request<Convenio>("/convenios", { method: "POST", body: JSON.stringify(data) }),
  updateConvenio: (id: string, data: Partial<{ nomeOperadora: string; codigoPrestador: string; ativo: boolean }>) =>
    request<Convenio>(`/convenios/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteConvenio: (id: string) => request<void>(`/convenios/${id}`, { method: "DELETE" }),

  criarSalaVirtual: (data: { sessaoId: string }) =>
    request<SalaVirtual>("/salas-virtuais", { method: "POST", body: JSON.stringify(data) }),
  listSalasVirtuais: (sessaoId: string) =>
    request<SalaVirtual[]>(`/salas-virtuais/sessao/${sessaoId}`),
  atualizarSalaVirtual: (id: string, data: Partial<Pick<SalaVirtual, "statusSala" | "inicioReal" | "fimReal" | "profissionalPresente" | "pacientePresente">>) =>
    request<SalaVirtual>(`/salas-virtuais/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
};
