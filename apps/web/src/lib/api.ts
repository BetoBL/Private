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

export interface AplicacaoDeTeste {
  id: string;
  sessaoId: string;
  testeId: string;
  escoresBrutos: Record<string, number>;
  resultadoCalculado: unknown;
  criadoEm: string;
  teste: Teste;
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
  createAplicacao: (data: { sessaoId: string; testeId: string; escoresBrutos: Record<string, number> }) =>
    request<AplicacaoDeTeste>("/aplicacoes-teste", { method: "POST", body: JSON.stringify(data) }),
};
