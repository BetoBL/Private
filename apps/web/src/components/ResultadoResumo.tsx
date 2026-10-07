import type { CampoTeste, DirecaoMelhorPior, FaixaConversao, ResultadoCalculado } from "../lib/api";
import { inferirSeveridade, posicaoTextoClassificacao } from "../lib/severidadeClassificacao";

// Largura da barra reflete a posição do escore na distribuição normativa (fato estatístico,
// sempre no mesmo sentido) — a cor é que carrega o julgamento "bom/preocupante", vindo de
// Teste.direcao. Ou seja: a barra mostra "onde", a cor mostra "o que isso significa aqui".
const LARGURA_POR_POSICAO: Record<-2 | -1 | 0 | 1 | 2, number> = { [-2]: 10, [-1]: 30, [0]: 50, [1]: 70, [2]: 90 };

function detalheFaixa(faixa: FaixaConversao | null): string {
  if (!faixa) return "";
  const partes: string[] = [];
  // `ponderado` e `composto` vêm do WISC-IV (bruto→ponderado→composto); `ic90`/`ic95` também,
  // e são o que o manual manda reportar junto do composto num laudo.
  if (faixa.ponderado !== undefined) partes.push(`ponderado ${faixa.ponderado}`);
  if (faixa.composto !== undefined) partes.push(`composto ${faixa.composto}`);
  if (faixa.percentil !== undefined) partes.push(`percentil ${faixa.percentil}`);
  if (faixa.escoreT !== undefined) partes.push(`escore T ${faixa.escoreT}`);
  if (faixa.qi !== undefined) partes.push(`QI ${faixa.qi}`);
  if (faixa.ic95 !== undefined) partes.push(`IC95 ${faixa.ic95}`);
  return partes.join(" · ");
}

function BarraResultado({
  label,
  valorBruto,
  faixa,
  direcao,
}: {
  label: string;
  valorBruto: number | null;
  faixa: FaixaConversao | null;
  direcao: DirecaoMelhorPior;
}) {
  const classificacao = typeof faixa?.classificacao === "string" ? faixa.classificacao : undefined;
  const posicao = posicaoTextoClassificacao(classificacao);
  const severidade = inferirSeveridade(classificacao, direcao);
  const largura = posicao === null ? 50 : LARGURA_POR_POSICAO[posicao];
  const detalhe = detalheFaixa(faixa);
  // valorBruto null = campo derivado sem todas as fontes lançadas (ex: índice do WISC-IV com
  // subteste principal faltando). Não desenha barra: mostrar 50% aqui sugeriria "resultado médio"
  // para algo que simplesmente não foi calculado.
  const naoCalculado = valorBruto === null;

  if (naoCalculado) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-semibold text-ink/70">{label}</span>
          <span className="text-ink/40">não calculado</span>
        </div>
        <span className="text-[11px] text-ink/40">
          falta lançar algum subteste que compõe este índice
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-semibold text-ink/70">{label}</span>
        <span className="text-ink/50">
          bruto {valorBruto}
          {detalhe && ` · ${detalhe}`}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-mist">
        <div className={`h-full rounded-full ${severidade.barra}`} style={{ width: `${largura}%` }} />
      </div>
      {classificacao ? (
        <span className={`self-start rounded-full border px-2 py-0.5 text-[11px] font-semibold ${severidade.badge}`}>
          {classificacao}
        </span>
      ) : (
        !faixa && <span className="text-[11px] text-ink/40">sem faixa normativa correspondente</span>
      )}
    </div>
  );
}

export function ResultadoResumo({
  resultado,
  direcao,
  campos,
}: {
  resultado: ResultadoCalculado | null;
  direcao: DirecaoMelhorPior;
  // Rótulos legíveis por chave técnica (ex.: "tempoInibicao" -> "Inibição") — union de
  // `algoritmoCorrecao.campos` (lançados) + `camposCalculados` (derivados pelo motor). Opcional e
  // com fallback para a própria chave, pra não quebrar quem ainda não passa essa prop.
  campos?: CampoTeste[];
}) {
  if (!resultado) {
    return <p className="mt-1 text-ink/50">Resultado ainda não calculado.</p>;
  }

  const labelPorChave = new Map((campos ?? []).map((c) => [c.chave, c.label]));

  if (resultado.modo === "soma") {
    return (
      <div className="mt-2">
        <BarraResultado label="Escore bruto total" valorBruto={resultado.escoreBrutoTotal} faixa={resultado.faixa} direcao={direcao} />
      </div>
    );
  }

  if (resultado.modo === "planilha") {
    // Resultado do motor de planilha: lista as saídas preenchidas (o detalhe fica na tela do teste)
    const preenchidas = Object.entries(resultado.saidas).filter(([, v]) => v !== null && v !== "");
    return (
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
        {preenchidas.slice(0, 12).map(([chave, v]) => (
          <div key={chave} className="flex justify-between gap-2 border-b border-mist/60 py-0.5">
            <dt className="truncate text-ink/60">{labelPorChave.get(chave) ?? chave}</dt>
            <dd className="font-semibold tabular-nums">{String(v)}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-3">
      {Object.entries(resultado.porCampo).map(([chave, r]) => (
        <BarraResultado key={chave} label={labelPorChave.get(chave) ?? chave} valorBruto={r.valorBruto} faixa={r.faixa} direcao={direcao} />
      ))}
    </div>
  );
}
