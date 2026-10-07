import type { AnaliseClusters, ClusterLido, ComparacaoClinica } from "../lib/wechsler";
import { EscalaIndices, type LinhaIndice } from "./graficos/EscalaIndices";

const SIGLA_SUBTESTE: Record<string, string> = {
  vocabulario: "VC", semelhancas: "SM", aritmetica: "AR", digitos: "DG", informacao: "IN", compreensao: "CO", sequenciaNumerosLetras: "SNL",
  completarFiguras: "CF", codigos: "CD", cubos: "CB", raciocinioMatricial: "RM", arranjoFiguras: "AF", procurarSimbolos: "PS", armarObjetos: "AO",
};

const fmt = (n: number | null | undefined) => (n === null || n === undefined ? "—" : n.toLocaleString("pt-BR"));

function linhaDoCluster(c: ClusterLido): LinhaIndice {
  const falta = !c.calculado ? "faltam subtestes" : c.interpretavel === false ? "não interpretável (diferença ≥ 5 entre subtestes)" : null;
  return {
    chave: c.chave,
    sigla: c.sigla,
    rotulo: c.rotulo.replace(/\s*\(.*\)$/, ""),
    soma: c.soma ?? null,
    composto: c.composto ?? null,
    percentil: c.percentil ?? null,
    ic90: null,
    ic95: c.ic95 ?? null,
    classificacao: c.classificacao ?? null,
    mpp: null,
    diferenca: null,
    homogeneo: null,
    interpretavel: null,
    dfNormativa: null,
    mediaIndices: null,
    diferencaMedia: null,
    valorCritico: null,
    dfIndividual: null,
    raro: null,
    aviso: null,
    observacao: null,
    falta,
  };
}

export function ClustersWais3({ analise }: { analise: AnaliseClusters }) {
  const { clusters, comparacoes } = analise;
  const comHipotese = comparacoes.filter((c) => c.calculada && c.hipotese);
  const semHipotese = comparacoes.filter((c) => !c.calculada || (c.calculada && !c.hipotese));
  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wide text-sage-deep">Análise de clusters</h3>
        <p className="mb-2 mt-1 max-w-2xl text-sm text-ink/65">
          Cada cluster soma os ponderados de 2 ou 3 subtestes e vira ponto composto (média 100). Só é interpretável quando a diferença entre o maior e o menor ponderado é menor que 5. A barra colorida é o intervalo de confiança de 95%.
        </p>
        <EscalaIndices titulo="" linhas={clusters.map(linhaDoCluster)} nivelIC="ic95" />
      </section>

      <section>
        <div className="overflow-x-auto rounded-xl border border-mist">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-paper text-[11px] uppercase tracking-wide text-ink/50">
                <th className="px-3 py-2 text-left font-semibold">Cluster</th>
                <th className="px-3 py-2 text-left font-semibold">Subtestes (ponderado)</th>
                <th className="px-3 py-2 text-right font-semibold">Maior − menor</th>
                <th className="px-3 py-2 text-center font-semibold">Interpretável?</th>
                <th className="px-3 py-2 text-right font-semibold">Soma</th>
                <th className="px-3 py-2 text-right font-semibold">Composto</th>
                <th className="px-3 py-2 text-left font-semibold">IC 95%</th>
                <th className="px-3 py-2 text-right font-semibold">Percentil</th>
                <th className="px-3 py-2 text-left font-semibold">Classificação</th>
              </tr>
            </thead>
            <tbody>
              {clusters.map((c) => (
                <tr key={c.chave} className="border-t border-mist align-top">
                  <td className="px-3 py-2">
                    <div className="font-semibold">{c.sigla}</div>
                    <div className="text-[11px] leading-tight text-ink/55">{c.rotulo}</div>
                  </td>
                  <td className="px-3 py-2 text-xs text-ink/70">
                    {c.itens.map((i) => `${SIGLA_SUBTESTE[i.chave] ?? i.chave} ${i.ponderado ?? "—"}`).join(" · ")}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.calculado ? c.diferenca : "—"}</td>
                  <td className="px-3 py-2 text-center">
                    {c.calculado && <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white ${c.interpretavel ? "bg-[#3f8f5b]" : "bg-[#c0392b]"}`}>{c.interpretavel ? "SIM" : "NÃO"}</span>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(c.soma)}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{fmt(c.composto)}</td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-ink/70">{c.ic95 ?? "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(c.percentil)}</td>
                  <td className="px-3 py-2">{c.classificacao ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold uppercase tracking-wide text-sage-deep">Comparações clínicas</h3>
        <p className="mb-2 mt-1 max-w-2xl text-sm text-ink/65">Diferença entre dois clusters contra o valor crítico. Se alcança o valor crítico, é rara; senão, não rara. Só compara clusters interpretáveis.</p>
        <div className="overflow-x-auto rounded-xl border border-mist">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-paper text-[11px] uppercase tracking-wide text-ink/50">
                <th className="px-3 py-2 text-left font-semibold">Comparação</th>
                <th className="px-3 py-2 text-right font-semibold">Pontos 1</th>
                <th className="px-3 py-2 text-right font-semibold">Pontos 2</th>
                <th className="px-3 py-2 text-right font-semibold">Diferença</th>
                <th className="px-3 py-2 text-left font-semibold">Frente ao valor crítico</th>
                <th className="px-3 py-2 text-right font-semibold">Valor crítico</th>
                <th className="px-3 py-2 text-left font-semibold">Raro?</th>
              </tr>
            </thead>
            <tbody>
              {comparacoes.map((c) => (
                <LinhaComparacao key={`${c.a}-${c.b}`} c={c} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold uppercase tracking-wide text-sage-deep">Possíveis hipóteses para as diferenças entre os clusters</h3>
        <p className="mb-3 mt-1 max-w-2xl text-sm text-ink/65">
          Cada texto corresponde ao sentido da diferença observada. São hipóteses para o raciocínio clínico, não conclusões: confirme com a história do paciente e com a observação do atendimento.
        </p>
        {comHipotese.length === 0 ? (
          <p className="rounded-xl border border-dashed border-mist bg-paper px-4 py-6 text-center text-sm text-ink/55">Nenhuma comparação com diferença para gerar hipótese.</p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {comHipotese.map((c, i) => (
              <article key={`${c.a}-${c.b}`} className="wais-entra rounded-xl border border-mist bg-paper/60 p-4" style={{ animationDelay: `${i * 70}ms` }}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-serif text-[15px] font-semibold leading-snug text-ink">{c.hipotese?.titulo}</h4>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white ${c.raro === "Raro" ? "bg-[#c0392b]" : "bg-ink/45"}`}>
                    diferença {c.raro === "Raro" ? "rara" : "não rara"} ({c.diferenca! > 0 ? "+" : ""}
                    {c.diferenca})
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed text-ink/80">{c.hipotese?.texto}</p>
              </article>
            ))}
          </div>
        )}
        {semHipotese.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-ink/55">
            {semHipotese.map((c) => (
              <li key={`${c.a}-${c.b}`}>
                <strong>{c.rotulo}:</strong> {c.calculada ? "sem diferença entre os clusters." : c.motivo}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function LinhaComparacao({ c }: { c: ComparacaoClinica }) {
  if (!c.calculada) {
    return (
      <tr className="border-t border-mist/70 text-ink/50">
        <td className="px-3 py-2 font-semibold">{c.rotulo}</td>
        <td colSpan={6} className="px-3 py-2 text-xs italic">
          {c.motivo}
        </td>
      </tr>
    );
  }
  const abs = Math.abs(c.diferenca ?? 0);
  const escala = Math.max(c.valorCritico * 1.4, abs, 1);
  const raro = c.raro === "Raro";
  return (
    <tr className="border-t border-mist/70">
      <td className="px-3 py-2 font-semibold">{c.rotulo}</td>
      <td className="px-3 py-2 text-right tabular-nums">{c.compostoA}</td>
      <td className="px-3 py-2 text-right tabular-nums">{c.compostoB}</td>
      <td className={`px-3 py-2 text-right font-semibold tabular-nums ${(c.diferenca ?? 0) < 0 ? "text-ember" : ""}`}>{c.diferenca}</td>
      <td className="px-3 py-2">
        <div className="relative h-2.5 w-40 rounded-full bg-mist" aria-hidden="true">
          <div className={`h-full rounded-full ${raro ? "bg-[#c0392b]" : "bg-ink/30"}`} style={{ width: `${(abs / escala) * 100}%`, transition: "width .6s cubic-bezier(.22,1,.36,1)" }} />
          <div className="absolute -top-0.5 h-3.5 w-0.5 bg-ink/70" style={{ left: `${(c.valorCritico / escala) * 100}%` }} title={`Valor crítico ${c.valorCritico}`} />
        </div>
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-ink/70">{c.valorCritico}</td>
      <td className="px-3 py-2">{raro ? <strong className="text-[#c0392b]">Raro</strong> : <span className="text-ink/60">Não raro</span>}</td>
    </tr>
  );
}

