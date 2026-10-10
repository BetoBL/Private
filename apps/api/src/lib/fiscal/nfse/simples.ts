// Alíquota efetiva do Simples Nacional — o número da tag `pTotTribSN` da DPS (carga tributária TOTAL, não só o ISS).
//
//     efetiva = (RBT12 × alíquota nominal − parcela a deduzir) / RBT12
//
// RBT12 = receita bruta dos últimos 12 meses. A faixa só diz quais dois números entram na conta. Não reparte a alíquota entre os tributos,
// não trata o fator R (que decide entre os anexos III e V) e não trata empresa em início de atividade: nada disso é necessário para o campo.
// Porte do cálculo já validado no sistema Infinity; as faixas são as da LC 123/2006 (anexos III e V).

export const TETO_SIMPLES = 4_800_000;

interface Faixa { ate: number; nominal: number; deduzir: number }

const ANEXOS: Record<string, Faixa[]> = {
  "3": [
    { ate: 180_000, nominal: 6, deduzir: 0 },
    { ate: 360_000, nominal: 11.2, deduzir: 9_360 },
    { ate: 720_000, nominal: 13.5, deduzir: 17_640 },
    { ate: 1_800_000, nominal: 16, deduzir: 35_640 },
    { ate: 3_600_000, nominal: 21, deduzir: 125_640 },
    { ate: 4_800_000, nominal: 33, deduzir: 648_000 },
  ],
  "5": [
    { ate: 180_000, nominal: 15.5, deduzir: 0 },
    { ate: 360_000, nominal: 18, deduzir: 4_500 },
    { ate: 720_000, nominal: 19.5, deduzir: 9_900 },
    { ate: 1_800_000, nominal: 20.5, deduzir: 17_100 },
    { ate: 3_600_000, nominal: 23, deduzir: 62_100 },
    { ate: 4_800_000, nominal: 30.5, deduzir: 540_000 },
  ],
};

export type AliquotaSimples = { aliquota: number; faixa: number; nominal: number; deduzir: number; rbt12: number } | { aliquota: null; motivo: string };

// Nunca lança por receita ausente: não ter a RBT12 é situação normal (a DPS sai com indTotTrib = 0), não erro.
export function aliquotaEfetivaSimples(anexo: string, receitaBruta12Meses: number | null | undefined): AliquotaSimples {
  const rbt12 = Number(receitaBruta12Meses);
  if (!Number.isFinite(rbt12) || rbt12 <= 0) return { aliquota: null, motivo: "Receita bruta dos últimos 12 meses não informada: sem ela não há como calcular a alíquota efetiva do Simples." };
  if (rbt12 > TETO_SIMPLES) return { aliquota: null, motivo: `Receita de ${rbt12.toLocaleString("pt-BR")} passa do teto do Simples (${TETO_SIMPLES.toLocaleString("pt-BR")}): a empresa não é mais optante.` };
  const faixas = ANEXOS[String(anexo)];
  if (!faixas) return { aliquota: null, motivo: `Anexo ${anexo} do Simples não está cadastrado (disponíveis: 3 e 5).` };
  const i = faixas.findIndex((f) => rbt12 <= f.ate);
  const f = faixas[i];
  const efetiva = ((rbt12 * (f.nominal / 100)) - f.deduzir) / rbt12 * 100;
  return { aliquota: Math.round(efetiva * 100) / 100, faixa: i + 1, nominal: f.nominal, deduzir: f.deduzir, rbt12 };
}
