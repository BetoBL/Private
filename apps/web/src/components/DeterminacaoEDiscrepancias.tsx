import { useState } from "react";
import { ROTULO_INDICE, type Determinacao, type Discrepancias } from "../lib/wechsler";

const VERBAIS = new Set(["vocabulario", "semelhancas", "aritmetica", "digitos", "informacao", "compreensao", "sequenciaNumerosLetras"]);

const fmt = (n: number | null, casas = 2) => (n === null ? "—" : n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }));

// ---------------------------------------------------------------------------------------------
// Determinação das facilidades e dificuldades por subteste (planilha: linhas 100-125)
// ---------------------------------------------------------------------------------------------
export function DeterminacaoSubtestes({ determinacao, nivel, nomeSubteste }: { determinacao: Determinacao; nivel: "n05" | "n15"; nomeSubteste: (chave: string) => string }) {
  const { recomendacao, modos, resumo } = determinacao;
  const padrao = recomendacao.opcoes[0] ?? "m14";
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const modo = modos.find((m) => m.id === (escolhido ?? padrao)) ?? modos.find((m) => m.id === padrao) ?? modos[0];
  if (!modo) return null;
  const grupos = [
    { titulo: "Verbais", linhas: modo.linhas.filter((l) => VERBAIS.has(l.chave)) },
    { titulo: "Execução", linhas: modo.linhas.filter((l) => !VERBAIS.has(l.chave)) },
  ];
  return (
    <section>
      <h3 className="text-xs font-bold uppercase tracking-wide text-sage-deep">Determinação das facilidades e dificuldades por subteste</h3>
      <p className="mb-3 mt-1 max-w-2xl text-sm text-ink/65">
        Cada subteste comparado com a média dos ponderados da própria pessoa. A diferença é significativa quando alcança o valor crítico; só então vira facilidade (F) ou dificuldade (D).
      </p>

      <div className="mb-3 grid gap-3 sm:grid-cols-3">
        {(
          [
            ["Verbal", resumo.verbal],
            ["Execução", resumo.execucao],
            ["Total", resumo.geral],
          ] as const
        ).map(([rotulo, r]) => (
          <div key={rotulo} className="rounded-xl border border-mist px-4 py-3">
            <div className="text-[11px] font-bold uppercase tracking-wide text-ink/45">{rotulo}</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-serif text-2xl font-semibold tabular-nums text-ink">{fmt(r.media)}</span>
              <span className="text-xs text-ink/50">escore médio</span>
            </div>
            <div className="text-xs text-ink/55">
              {r.soma} pontos · {r.n} subteste{r.n === 1 ? "" : "s"}
            </div>
          </div>
        ))}
      </div>

      <div className={`mb-3 rounded-xl border px-4 py-3 text-sm ${recomendacao.modo === null ? "border-amber-300 bg-amber-50 text-amber-900" : "border-sage-deep/25 bg-sage-deep/5 text-ink"}`}>
        <span className="font-semibold">Recomenda-se: </span>
        {recomendacao.texto}
      </div>

      <label className="mb-3 flex flex-wrap items-center gap-3 text-sm">
        <span className="font-semibold text-ink/70">Média usada na comparação</span>
        <select className="rounded-lg border border-mist bg-white px-3 py-1.5 text-sm" value={modo.id} onChange={(e) => setEscolhido(e.target.value)}>
          {modos.map((m) => (
            <option key={m.id} value={m.id}>
              {m.rotulo}
              {recomendacao.opcoes.includes(m.id) ? " (recomendado)" : ""}
            </option>
          ))}
        </select>
      </label>

      <div className="overflow-x-auto rounded-xl border border-mist">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-paper text-[11px] uppercase tracking-wide text-ink/50">
              <th className="px-3 py-2 text-left font-semibold">Subteste</th>
              <th className="px-3 py-2 text-right font-semibold">Ponderado</th>
              <th className="px-3 py-2 text-right font-semibold">Escore médio</th>
              <th className="px-3 py-2 text-right font-semibold">Diferença da média</th>
              <th className="px-3 py-2 text-right font-semibold">Valor crítico</th>
              <th className="px-3 py-2 text-center font-semibold">Significativa?</th>
              <th className="px-3 py-2 text-center font-semibold">F / D</th>
              <th className="px-3 py-2 text-left font-semibold">Frequência acumulada</th>
            </tr>
          </thead>
          <tbody>
            {grupos.map((g) =>
              g.linhas.length === 0 ? null : (
                <GrupoLinhas key={g.titulo} titulo={g.titulo} linhas={g.linhas} nivel={nivel} nomeSubteste={nomeSubteste} />
              )
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-ink/45">Subteste que não participa do modo escolhido fica sem valor crítico (por exemplo, Sequência de Números e Letras na média de 6 verbais e 5 de execução).</p>
    </section>
  );
}

function GrupoLinhas({ titulo, linhas, nivel, nomeSubteste }: { titulo: string; linhas: Determinacao["modos"][number]["linhas"]; nivel: "n05" | "n15"; nomeSubteste: (c: string) => string }) {
  return (
    <>
      <tr className="border-t border-mist bg-paper/60">
        <td colSpan={8} className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-sage-deep">
          {titulo}
        </td>
      </tr>
      {linhas.map((l) => {
        const n = l[nivel];
        return (
          <tr key={l.chave} className="border-t border-mist/70">
            <td className="px-3 py-2">{nomeSubteste(l.chave)}</td>
            <td className="px-3 py-2 text-right font-semibold tabular-nums">{l.ponderado}</td>
            <td className="px-3 py-2 text-right tabular-nums text-ink/70">{fmt(l.media)}</td>
            <td className={`px-3 py-2 text-right tabular-nums ${l.diferenca !== null && l.diferenca < 0 ? "text-ember" : ""}`}>{fmt(l.diferenca)}</td>
            <td className="px-3 py-2 text-right tabular-nums text-ink/70">{n.critico === null ? <span className="text-ink/30">—</span> : fmt(n.critico)}</td>
            <td className="px-3 py-2 text-center">{n.critico === null ? "" : n.significativo ? <strong className="text-ink">Sim</strong> : <span className="text-ink/50">Não</span>}</td>
            <td className="px-3 py-2 text-center">
              {n.df === "F" && <span className="inline-block rounded-full bg-[#3f8f5b] px-2.5 py-0.5 text-[11px] font-bold text-white">Facilidade</span>}
              {n.df === "D" && <span className="inline-block rounded-full bg-[#d9822b] px-2.5 py-0.5 text-[11px] font-bold text-white">Dificuldade</span>}
            </td>
            <td className="px-3 py-2 text-xs text-ink/65">{n.frequencia}</td>
          </tr>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// Comparação entre discrepâncias dos índices e QIs (planilha: linhas 86-98)
// ---------------------------------------------------------------------------------------------
export function ComparacaoDiscrepancias({ discrepancias, nivel }: { discrepancias: Discrepancias; nivel: "0.05" | "0.15" }) {
  const [amostra, setAmostra] = useState<"habilidade" | "geral">("habilidade");
  const linhas = discrepancias.combos[`${nivel}|${amostra}`] ?? [];
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-sage-deep">Comparação entre discrepâncias — índices e QIs</h3>
          <p className="mt-1 max-w-2xl text-sm text-ink/65">
            Diferença entre dois índices (ou QIs) contra o valor crítico. Nível de significância {nivel === "0.05" ? "0,05 (IC 95%)" : "0,15 (IC 90%)"}. Quando a diferença é significativa, mostra com que frequência ela ocorre na amostra.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-ink/70">Amostra</span>
          <select className="rounded-lg border border-mist bg-white px-3 py-1.5 text-sm" value={amostra} onChange={(e) => setAmostra(e.target.value as "habilidade" | "geral")}>
            <option value="habilidade">Nível de habilidade (faixa de idade)</option>
            <option value="geral">Amostra geral (todas as idades)</option>
          </select>
        </label>
      </div>

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
              <th className="px-3 py-2 text-center font-semibold">Significativa?</th>
              <th className="px-3 py-2 text-left font-semibold">Frequência acumulada</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const abs = Math.abs(l.diferenca);
              const crit = l.valorCritico ?? 0;
              const escala = Math.max(crit * 1.6, abs, 1);
              return (
                <tr key={`${l.a}-${l.b}`} className="border-t border-mist/70">
                  <td className="px-3 py-2 font-semibold">
                    {ROTULO_INDICE[l.a]} − {ROTULO_INDICE[l.b]}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{l.valorA}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{l.valorB}</td>
                  <td className={`px-3 py-2 text-right font-semibold tabular-nums ${l.diferenca < 0 ? "text-ember" : ""}`}>{l.diferenca}</td>
                  <td className="px-3 py-2">
                    <div className="relative h-2.5 w-40 rounded-full bg-mist" aria-hidden="true">
                      <div className={`h-full rounded-full ${l.significativo ? "bg-[#3f8f5b]" : "bg-ink/30"}`} style={{ width: `${(abs / escala) * 100}%`, transition: "width .6s cubic-bezier(.22,1,.36,1)" }} />
                      {l.valorCritico !== null && <div className="absolute -top-0.5 h-3.5 w-0.5 bg-ink/70" style={{ left: `${(crit / escala) * 100}%` }} title={`Valor crítico ${crit}`} />}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-ink/70">{l.valorCritico === null ? "—" : fmt(l.valorCritico)}</td>
                  <td className="px-3 py-2 text-center">{l.significativo ? <span className="inline-block rounded-full bg-[#3f8f5b] px-2.5 py-0.5 text-[11px] font-bold text-white">Sim</span> : <span className="text-ink/50">Não</span>}</td>
                  <td className="px-3 py-2 text-xs text-ink/65">{l.frequencia}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-ink/45">A barra mostra o tamanho da diferença; o traço vertical é o valor crítico. Barra que passa do traço = diferença significativa.</p>
    </section>
  );
}
