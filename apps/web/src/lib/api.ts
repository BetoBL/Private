const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";
const TOKEN_STORAGE_KEY = "neurologic_token";
const PROFISSIONAL_STORAGE_KEY = "neurologic_profissional";

export interface AnamneseData {
  queixaPrincipal?: string;
  historicoEscolar?: string;
  historicoMedico?: string;
  historicoFamiliar?: string;
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
  contato: string | null;
  escolaridade: string | null;
  anamnese: AnamneseData | null;
  preferenciasAgenda: PreferenciasAgenda | null;
  consentimentoTDIC: boolean;
  consentimentoTDICData: string | null;
  criadoEm: string;
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
  algoritmoCorrecao: {
    campos?: CampoTeste[];
    [key: string]: unknown;
  };
}

export interface Sessao {
  id: string;
  pacienteId: string;
  profissionalId: string;
  dataHora: string;
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
  | { modo: "por_campo"; porCampo: Record<string, { valorBruto: number | null; faixa: FaixaConversao | null }> };

export interface AplicacaoDeTeste {
  id: string;
  sessaoId: string;
  testeId: string;
  escoresBrutos: Record<string, number>;
  resultadoCalculado: ResultadoCalculado | null;
  criadoEm: string;
  teste: Teste;
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
  status: StatusLaudo;
  iaUtilizada: boolean;
  iaRevisadaPeloProf: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

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
  if (res.status === 204) return undefined as T;
  return res.json();
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
  return { conflito: false, evento: await res.json() };
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
      contato: string;
      escolaridade: string;
      anamnese: AnamneseData;
      preferenciasAgenda: PreferenciasAgenda;
      consentimentoTDIC: boolean;
      profissionalId: string;
    }>
  ) => request<Paciente>(`/pacientes/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  listProfissionais: () => request<Profissional[]>("/profissionais"),
  getProfissional: (id: string) => request<Profissional>(`/profissionais/${id}`),
  createProfissional: (data: { clinicaId: string; nome: string; crp: string; email: string; senha: string }) =>
    request<Profissional>("/profissionais", { method: "POST", body: JSON.stringify(data) }),
  updateProfissional: (
    id: string,
    data: Partial<{
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
        "razaoSocial" | "nomeFantasia" | "cnpj" | "endereco" | "bairro" | "cidade" | "estado" | "cep" | "telefone" | "corPrimaria" | "corSecundaria"
      >
    >
  ) => request<Clinica>(`/clinicas/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  listAnexos: (pacienteId: string) => request<Anexo[]>(`/anexos?pacienteId=${pacienteId}`),
  createAnexo: (data: { pacienteId: string; tipo: string; url: string; descricao?: string }) =>
    request<Anexo>("/anexos", { method: "POST", body: JSON.stringify(data) }),
  deleteAnexo: (id: string) => request<void>(`/anexos/${id}`, { method: "DELETE" }),

  listTestes: () => request<Teste[]>("/testes"),

  listSessoes: (pacienteId: string) => request<Sessao[]>(`/sessoes?pacienteId=${pacienteId}`),
  listTodasSessoes: () => request<Sessao[]>("/sessoes"),
  createSessao: (data: { pacienteId: string; dataHora: string }) =>
    request<Sessao>("/sessoes", { method: "POST", body: JSON.stringify(data) }),

  listAplicacoes: (sessaoId: string) => request<AplicacaoDeTeste[]>(`/aplicacoes-teste?sessaoId=${sessaoId}`),
  listAplicacoesPorPaciente: (pacienteId: string) =>
    request<AplicacaoDeTeste[]>(`/aplicacoes-teste?pacienteId=${pacienteId}`),
  createAplicacao: (data: { sessaoId: string; testeId: string; escoresBrutos: Record<string, number> }) =>
    request<AplicacaoDeTeste>("/aplicacoes-teste", { method: "POST", body: JSON.stringify(data) }),
  updateAplicacao: (id: string, escoresBrutos: Record<string, number>) =>
    request<AplicacaoDeTeste>(`/aplicacoes-teste/${id}`, { method: "PATCH", body: JSON.stringify({ escoresBrutos }) }),

  listLaudos: (pacienteId: string) => request<Laudo[]>(`/laudos?pacienteId=${pacienteId}`),
  listTodosLaudos: () => request<Laudo[]>("/laudos"),
  createLaudo: (data: {
    pacienteId: string;
    identificacao: Record<string, unknown>;
    descricaoDemanda: string;
    procedimento: string;
  }) => request<Laudo>("/laudos", { method: "POST", body: JSON.stringify(data) }),
  updateLaudo: (id: string, data: Partial<Pick<Laudo, "descricaoDemanda" | "procedimento" | "analise" | "conclusao" | "referencias" | "status" | "iaRevisadaPeloProf">>) =>
    request<Laudo>(`/laudos/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  gerarRascunho: (id: string) => request<Laudo>(`/laudos/${id}/gerar-rascunho`, { method: "POST" }),
  exportarLaudoDocx: (id: string) => baixarArquivo(`/laudos/${id}/exportar-docx`),

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

  getResumoDoDia: () => request<{ resumo: string }>("/painel-do-dia/resumo"),
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
};
