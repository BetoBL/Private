import { type Escala, type Faixa } from "./definicoes";

export type Respostas = Record<string, number>; // chave = id do item (texto), valor = opção marcada
export interface Resultado {
  total: number | null; // soma (sem multiplicador) quando a escala tem pontuação total
  faixa: { rotulo: string; cor: Faixa["cor"] } | null;
  subescalas: Array<{ chave: string; rotulo: string; valor: number; faixa: { rotulo: string; cor: Faixa["cor"] } | null }>;
  alertaRisco: boolean;
  funcional: number | null;
}

const faixaDe = (faixas: Faixa[], v: number) => { const f = faixas.find((x) => v <= x.ate) ?? faixas[faixas.length - 1]; return { rotulo: f.rotulo, cor: f.cor }; };

// Confere as respostas: todos os itens, cada um com uma opção válida. Devolve a lista de problemas (vazia = ok).
export function validarRespostas(e: Escala, r: unknown): string[] {
  if (!r || typeof r !== "object" || Array.isArray(r)) return ["Envie as respostas."];
  const m = r as Record<string, unknown>, erros: string[] = [];
  for (const it of e.itens) {
    const v = m[String(it.id)], validos = (it.opcoes ?? e.opcoes).map((o) => o.valor);
    if (typeof v !== "number" || !validos.includes(v)) erros.push(`Responda a pergunta ${it.id}.`);
  }
  if (e.itemFuncional && m.funcional !== undefined && (typeof m.funcional !== "number" || !e.itemFuncional.opcoes.some((o) => o.valor === m.funcional))) erros.push("Resposta inválida na pergunta final.");
  return erros;
}

export function pontuar(e: Escala, r: Respostas): Resultado {
  const val = (id: number) => r[String(id)] ?? 0;
  const soma = e.itens.reduce((s, it) => s + val(it.id), 0) * (e.multiplicadorTotal ?? 1);
  const subescalas = (e.subescalas ?? []).map((s) => {
    const bruto = e.itens.filter((i) => i.subescala === s.chave).reduce((a, i) => a + val(i.id), 0);
    const valor = bruto * (s.multiplicador ?? 1);
    return { chave: s.chave, rotulo: s.rotulo, valor, faixa: s.faixas ? faixaDe(s.faixas, valor) : null };
  });
  return {
    total: e.faixasTotal ? soma : null,
    faixa: e.faixasTotal ? faixaDe(e.faixasTotal, soma) : null,
    subescalas,
    alertaRisco: (e.itensCriticos ?? []).some((id) => val(id) > 0),
    funcional: typeof r.funcional === "number" ? r.funcional : null,
  };
}
