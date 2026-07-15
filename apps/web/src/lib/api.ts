const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export interface Paciente {
  id: string;
  clinicaId: string;
  profissionalId: string;
  nome: string;
  dataNascimento: string;
  escolaridade: string | null;
}

export interface Profissional {
  id: string;
  clinicaId: string;
  nome: string;
  email: string;
}

export interface CampoTeste {
  chave: string;
  label: string;
}

export interface Teste {
  id: string;
  nome: string;
  sigla: string;
  dominio: string;
  isPlaceholder: boolean;
  ativo: boolean;
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
  | { modo: "por_campo"; porCampo: Record<string, { valorBruto: number; faixa: FaixaConversao | null }> };

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

export interface PerfilDeAtuacao {
  profissionalId: string;
  abordagemTeorica: string | null;
  tomDeEscrita: string | null;
  regrasDePrudencia: string | null;
  vocabularioRecorrente: string | null;
}

async function baixarArquivo(path: string): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `Erro ${res.status}`);
  }
  const disposicao = res.headers.get("Content-Disposition") ?? "";
  const filename = disposicao.match(/filename="?([^"]+)"?/)?.[1] ?? "laudo.docx";
  const blob = await res.blob();
  return { blob, filename };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `Erro ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  listPacientes: () => request<Paciente[]>("/pacientes"),
  createPaciente: (data: { clinicaId: string; profissionalId: string; nome: string; dataNascimento: string }) =>
    request<Paciente>("/pacientes", { method: "POST", body: JSON.stringify(data) }),

  listProfissionais: () => request<Profissional[]>("/profissionais"),

  listTestes: () => request<Teste[]>("/testes"),

  listSessoes: (pacienteId: string) => request<Sessao[]>(`/sessoes?pacienteId=${pacienteId}`),
  createSessao: (data: { pacienteId: string; profissionalId: string; dataHora: string }) =>
    request<Sessao>("/sessoes", { method: "POST", body: JSON.stringify(data) }),

  listAplicacoes: (sessaoId: string) => request<AplicacaoDeTeste[]>(`/aplicacoes-teste?sessaoId=${sessaoId}`),
  listAplicacoesPorPaciente: (pacienteId: string) =>
    request<AplicacaoDeTeste[]>(`/aplicacoes-teste?pacienteId=${pacienteId}`),
  createAplicacao: (data: { sessaoId: string; testeId: string; escoresBrutos: Record<string, number> }) =>
    request<AplicacaoDeTeste>("/aplicacoes-teste", { method: "POST", body: JSON.stringify(data) }),

  listLaudos: (pacienteId: string) => request<Laudo[]>(`/laudos?pacienteId=${pacienteId}`),
  createLaudo: (data: {
    pacienteId: string;
    profissionalId: string;
    identificacao: Record<string, unknown>;
    descricaoDemanda: string;
    procedimento: string;
  }) => request<Laudo>("/laudos", { method: "POST", body: JSON.stringify(data) }),
  updateLaudo: (id: string, data: Partial<Pick<Laudo, "descricaoDemanda" | "procedimento" | "analise" | "conclusao" | "referencias" | "status" | "iaRevisadaPeloProf">>) =>
    request<Laudo>(`/laudos/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  gerarRascunho: (id: string) => request<Laudo>(`/laudos/${id}/gerar-rascunho`, { method: "POST" }),
  exportarLaudoDocx: (id: string) => baixarArquivo(`/laudos/${id}/exportar-docx`),

  getPerfilDeAtuacao: (profissionalId: string) =>
    request<PerfilDeAtuacao | null>(`/perfil-atuacao?profissionalId=${profissionalId}`),
  salvarPerfilDeAtuacao: (data: {
    profissionalId: string;
    abordagemTeorica?: string;
    tomDeEscrita?: string;
    regrasDePrudencia?: string;
    vocabularioRecorrente?: string;
  }) => request<PerfilDeAtuacao>("/perfil-atuacao", { method: "PUT", body: JSON.stringify(data) }),
};
