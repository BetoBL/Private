import { type AplicacaoDeTeste, type ResultadoCalculado } from "../lib/api";

interface DashboardResultadosProps {
  aplicacoes: AplicacaoDeTeste[];
}

export function DashboardResultados({ aplicacoes }: DashboardResultadosProps) {
  // Testes com resultado calculado em modo "soma" (escoreT, percentil)
  const comResultado = aplicacoes.filter(
    (a) => a.resultadoCalculado && a.resultadoCalculado.modo === "soma"
  );

  if (comResultado.length === 0) {
    return (
      <div className="rounded-lg border border-mist bg-paper p-4 text-center text-sm text-ink/50">
        Nenhum teste com resultado calculado ainda. Execute os testes para visualizar o dashboard.
      </div>
    );
  }

  // Extrai dados para o gráfico (escoreT ou percentil)
  const dados = comResultado.map((a) => {
    const resultado = a.resultadoCalculado as Extract<ResultadoCalculado, { modo: "soma" }>;
    return {
      testeId: a.testeId,
      testeSigla: a.teste.sigla,
      testeDominio: a.teste.dominio,
      escoreT: resultado.faixa?.escoreT || 0,
      percentil: resultado.faixa?.percentil || 0,
      classificacao: resultado.faixa?.classificacao || "Não disponível",
      valor: resultado.escoreBrutoTotal,
    };
  });

  // Normaliza valores para escala 0-100 (usando percentil quando disponível, escoreT convertido)
  const valores = dados.map((d) => ({
    ...d,
    altura: d.percentil > 0 ? (d.percentil / 100) * 100 : ((d.escoreT + 10) / 80) * 100, // escoreT típico: 20-80
  }));

  return (
    <div className="space-y-6">
      {/* Legenda */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-sage-deep"></div>
          <span>Resultado esperado (40-60 escoreT)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-clay"></div>
          <span>Resultado acima esperado (&gt;60)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-ember"></div>
          <span>Resultado abaixo esperado (&lt;40)</span>
        </div>
      </div>

      {/* Gráfico de barras */}
      <div className="rounded-lg border border-mist bg-white p-4">
        <div className="mb-4 text-xs font-bold uppercase tracking-wide text-sage-deep">Resultado Comparativo</div>

        <div className="flex items-end gap-1" style={{ height: "200px" }}>
          {valores.map((d) => {
            const cor =
              d.escoreT >= 40 && d.escoreT <= 60
                ? "bg-sage-deep"
                : d.escoreT > 60
                  ? "bg-clay"
                  : "bg-ember";
            return (
              <div key={d.testeId} className="flex flex-1 flex-col items-center justify-end gap-1">
                <div className="text-xs font-semibold text-ink">{d.escoreT || d.percentil || "—"}</div>
                <div
                  className={`w-full rounded-t-lg transition-all ${cor}`}
                  style={{
                    height: `${Math.max(d.altura, 5)}%`,
                    minHeight: "5px",
                  }}
                  title={`${d.testeSigla}: ${d.classificacao}`}
                ></div>
                <div className="max-w-full text-center text-xs text-ink/70">
                  <div className="font-semibold">{d.testeSigla}</div>
                  <div className="truncate text-[9px] text-ink/50">{d.testeDominio}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabela de detalhes */}
      <div className="rounded-lg border border-mist bg-white p-4">
        <div className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">Detalhes dos Testes</div>
        <div className="space-y-2">
          {valores.map((d) => (
            <div key={d.testeId} className="flex items-start justify-between rounded-lg border border-mist/50 bg-paper p-3 text-sm">
              <div>
                <div className="font-semibold text-ink">{d.testeSigla}</div>
                <div className="text-xs text-ink/60">{d.testeDominio}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-ink">{d.classificacao}</div>
                <div className="text-xs text-ink/60">
                  {d.escoreT > 0 ? `Escore-T: ${d.escoreT}` : `Percentil: ${d.percentil}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Aviso sobre interpretação */}
      <div className="rounded-lg border border-mist bg-paper p-3 text-xs text-ink/60">
        <strong>Nota:</strong> Este dashboard é um resumo visual dos resultados. A interpretação clínica integrada deve ser feita pelo
        profissional no laudo, considerando contexto, história do paciente e achados qualitativos.
      </div>
    </div>
  );
}
