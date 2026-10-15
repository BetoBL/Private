// Recorrência da agenda: gera as datas de uma série a partir do primeiro horário.
// Passo fixo em dias (7, 14 ou 28), mantendo o mesmo horário. O Brasil não tem horário de verão desde 2019, então somar dias em UTC mantém a hora de parede.

export type Frequencia = "SEMANAL" | "QUINZENAL" | "A_CADA_4_SEMANAS";
export const PASSO_EM_DIAS: Record<Frequencia, number> = { SEMANAL: 7, QUINZENAL: 14, A_CADA_4_SEMANAS: 28 };
export const MAX_OCORRENCIAS = 52;
const DIA_MS = 24 * 60 * 60 * 1000;

export type Recorrencia = { frequencia: Frequencia; ocorrencias?: number; ate?: Date };

// Devolve todas as ocorrências (a primeira inclusive). Sem `ocorrencias` nem `ate`, gera 12 (o padrão de "manter agenda aberta").
export function gerarOcorrencias(inicio: Date, fim: Date, r: Recorrencia): Array<{ inicio: Date; fim: Date }> {
  const passo = PASSO_EM_DIAS[r.frequencia] * DIA_MS;
  const duracao = fim.getTime() - inicio.getTime();
  const limiteQtd = Math.min(r.ocorrencias ?? (r.ate ? MAX_OCORRENCIAS : 12), MAX_OCORRENCIAS);
  const saida: Array<{ inicio: Date; fim: Date }> = [];
  for (let i = 0; i < limiteQtd; i++) {
    const ini = new Date(inicio.getTime() + i * passo);
    if (r.ate && ini.getTime() > r.ate.getTime()) break;
    saida.push({ inicio: ini, fim: new Date(ini.getTime() + duracao) });
  }
  return saida;
}
