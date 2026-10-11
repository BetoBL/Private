// Resumo do Diário para o profissional: o que aconteceu nos últimos 7 dias, comparado aos 7 anteriores.
// A tendência considera só as emoções DIFÍCEIS (todas menos a família "leve"): alegria intensa não é piora. É um apoio à leitura do profissional,
// nunca um diagnóstico nem uma conclusão clínica.

export interface CartaoResumo { ocorridoEm: Date; emocao: string; familia: string; intensidade: number; levarParaSessao: boolean; conversadoEm: Date | null }

export interface Janela { total: number; dificeis: number; mediaDificeis: number | null; familiaMaisFrequente: string | null; diasComRegistro: number }
export interface ResumoDiario {
  total: number; ultimos7: Janela; anteriores7: Janela;
  tendencia: "MAIS_INTENSA" | "MENOS_INTENSA" | "ESTAVEL" | null;
  porEmocao: Array<{ emocao: string; quantidade: number }>;
  paraLevar: number; // marcados "levar para a sessão" e ainda não conversados
  ultimoRegistro: Date | null;
}

const DIA = 86_400_000;
const dia = (d: Date) => Math.floor(d.getTime() / DIA);

function janela(cartoes: CartaoResumo[]): Janela {
  const dificeis = cartoes.filter((c) => c.familia !== "leve");
  const contagem = new Map<string, number>();
  for (const c of cartoes) contagem.set(c.familia, (contagem.get(c.familia) ?? 0) + 1);
  const topo = [...contagem.entries()].sort((a, b) => b[1] - a[1])[0];
  return {
    total: cartoes.length, dificeis: dificeis.length,
    mediaDificeis: dificeis.length ? Math.round((dificeis.reduce((s, c) => s + c.intensidade, 0) / dificeis.length) * 10) / 10 : null,
    familiaMaisFrequente: topo?.[0] ?? null, diasComRegistro: new Set(cartoes.map((c) => dia(c.ocorridoEm))).size,
  };
}

export function resumirCartoes(cartoes: CartaoResumo[], hoje = new Date()): ResumoDiario {
  const h = dia(hoje);
  const atual = cartoes.filter((c) => dia(c.ocorridoEm) > h - 7 && dia(c.ocorridoEm) <= h);
  const anterior = cartoes.filter((c) => dia(c.ocorridoEm) > h - 14 && dia(c.ocorridoEm) <= h - 7);
  const a = janela(atual), b = janela(anterior);
  let tendencia: ResumoDiario["tendencia"] = null;
  if (a.dificeis >= 2 && b.dificeis >= 2 && a.mediaDificeis !== null && b.mediaDificeis !== null) {
    const d = a.mediaDificeis - b.mediaDificeis;
    tendencia = d >= 0.5 ? "MAIS_INTENSA" : d <= -0.5 ? "MENOS_INTENSA" : "ESTAVEL";
  }
  const porEmocao = new Map<string, number>();
  for (const c of cartoes) porEmocao.set(c.emocao, (porEmocao.get(c.emocao) ?? 0) + 1);
  return {
    total: cartoes.length, ultimos7: a, anteriores7: b, tendencia,
    porEmocao: [...porEmocao.entries()].map(([emocao, quantidade]) => ({ emocao, quantidade })).sort((x, y) => y.quantidade - x.quantidade).slice(0, 6),
    paraLevar: cartoes.filter((c) => c.levarParaSessao && !c.conversadoEm).length,
    ultimoRegistro: cartoes.length ? new Date(Math.max(...cartoes.map((c) => c.ocorridoEm.getTime()))) : null,
  };
}
