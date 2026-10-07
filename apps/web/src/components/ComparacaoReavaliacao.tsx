import type { AplicacaoDeTeste, FaixaConversao } from "../lib/api";

// Reavaliação: lado a lado, o resultado de duas aplicações do mesmo teste (a anterior e a atual) com a diferença.
interface Linha { rotulo: string; antes: string | number | null; depois: string | number | null }
interface Secao { titulo?: string; linhas: Linha[] }

type LayoutPlanilha = { tabelas: Array<{ titulo: string; colunas: string[]; linhas: Array<{ rotulo: string; valores: Array<string | null> }> }> };

const vazio = (v: unknown) => v === null || v === undefined || v === "";
const texto = (v: string | number | null) => (v === null ? "—" : typeof v === "number" ? v.toLocaleString("pt-BR", { maximumFractionDigits: 3 }) : v);
const simples = (v: string | number | boolean | null | undefined): string | number | null => (v === undefined || v === null ? null : typeof v === "boolean" ? String(v) : v);

function resumoFaixa(f: FaixaConversao | null | undefined): Array<[string, string | number]> {
  if (!f) return [];
  const out: Array<[string, string | number]> = [];
  if (f.percentil !== undefined) out.push(["percentil", f.percentil]);
  if (f.escoreT !== undefined) out.push(["escore T", f.escoreT]);
  if (f.qi !== undefined) out.push(["QI", f.qi]);
  if (f.classificacao) out.push(["classificação", f.classificacao]);
  return out;
}

function secoesDe(a: AplicacaoDeTeste, b: AplicacaoDeTeste): Secao[] {
  const ra = a.resultadoCalculado, rb = b.resultadoCalculado;
  const layout = (b.teste.algoritmoCorrecao as unknown as { layout?: LayoutPlanilha }).layout;
  if (ra?.modo === "planilha" && rb?.modo === "planilha" && layout) {
    return layout.tabelas
      .map((t) => {
        const linhas: Linha[] = [];
        for (const l of t.linhas) {
          l.valores.forEach((k, i) => {
            if (!k) return;
            const x = simples(ra.saidas[k]), y = simples(rb.saidas[k]);
            if (vazio(x) && vazio(y)) return;
            const rotulo = [l.rotulo.startsWith("=") ? "" : l.rotulo, t.colunas[i] ?? ""].filter(Boolean).join(" · ");
            linhas.push({ rotulo, antes: x, depois: y });
          });
        }
        return { titulo: t.titulo, linhas };
      })
      .filter((s) => s.linhas.length > 0);
  }
  if (ra?.modo === "por_campo" && rb?.modo === "por_campo") {
    const chaves = [...new Set([...Object.keys(ra.porCampo), ...Object.keys(rb.porCampo)])];
    const linhas: Linha[] = [];
    for (const k of chaves) {
      const x = ra.porCampo[k], y = rb.porCampo[k];
      if (vazio(x?.valorBruto) && vazio(y?.valorBruto)) continue;
      linhas.push({ rotulo: `${k} (bruto)`, antes: x?.valorBruto ?? null, depois: y?.valorBruto ?? null });
      const fx = new Map(resumoFaixa(x?.faixa)), fy = new Map(resumoFaixa(y?.faixa));
      for (const nome of new Set([...fx.keys(), ...fy.keys()])) linhas.push({ rotulo: `${k} — ${nome}`, antes: fx.get(nome) ?? null, depois: fy.get(nome) ?? null });
    }
    return [{ linhas }];
  }
  if (ra?.modo === "soma" && rb?.modo === "soma") {
    const fx = new Map(resumoFaixa(ra.faixa)), fy = new Map(resumoFaixa(rb.faixa));
    const nomes = [...new Set([...fx.keys(), ...fy.keys()])];
    return [{ linhas: [{ rotulo: "Escore bruto total", antes: ra.escoreBrutoTotal, depois: rb.escoreBrutoTotal }, ...nomes.map((n) => ({ rotulo: n, antes: fx.get(n) ?? null, depois: fy.get(n) ?? null }))] }];
  }
  return [];
}

const data = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

export function ComparacaoReavaliacao({ anterior, atual, dataAnterior, dataAtual }: { anterior: AplicacaoDeTeste; atual: AplicacaoDeTeste; dataAnterior: string; dataAtual: string }) {
  const secoes = secoesDe(anterior, atual);
  if (secoes.length === 0) return <div className="mt-2 rounded-lg bg-paper px-3 py-2 text-xs text-ink/60">Não há resultado calculado nas duas aplicações para comparar.</div>;
  return (
    <div className="mt-2 space-y-4 rounded-xl border border-mist bg-white p-3">
      {secoes.map((s, i) => (
        <div key={s.titulo ?? i} className="overflow-x-auto">
          {s.titulo && <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink/45">{s.titulo}</div>}
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-ink/50">
                <th className="py-1 font-semibold" />
                <th className="py-1 text-right font-semibold">{data(dataAnterior)}</th>
                <th className="py-1 text-right font-semibold">{data(dataAtual)}</th>
                <th className="py-1 text-right font-semibold">Diferença</th>
              </tr>
            </thead>
            <tbody>
              {s.linhas.map((l, j) => {
                const dif = typeof l.antes === "number" && typeof l.depois === "number" ? l.depois - l.antes : null;
                const mudou = String(l.antes) !== String(l.depois);
                return (
                  <tr key={j} className="border-t border-mist/60">
                    <td className="py-1 pr-3 text-ink/70">{l.rotulo}</td>
                    <td className="py-1 text-right tabular-nums">{texto(l.antes)}</td>
                    <td className={`py-1 text-right tabular-nums ${mudou ? "font-semibold text-ink" : ""}`}>{texto(l.depois)}</td>
                    <td className="py-1 text-right tabular-nums text-ink/60">{dif === null ? (mudou ? "mudou" : "") : dif === 0 ? "=" : (dif > 0 ? "+" : "") + dif.toLocaleString("pt-BR", { maximumFractionDigits: 3 })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
