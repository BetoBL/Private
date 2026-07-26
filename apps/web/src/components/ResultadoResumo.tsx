import type { DirecaoMelhorPior, FaixaConversao, ResultadoCalculado } from "../lib/api";
import { inferirSeveridade, posicaoTextoClassificacao } from "../lib/severidadeClassificacao";

// Largura da barra reflete a posição do escore na distribuição normativa (fato estatístico,
// sempre no mesmo sentido) — a cor é que carrega o julgamento "bom/preocupante", vindo de
// Teste.direcao. Ou seja: a barra mostra "onde", a cor mostra "o que isso significa aqui".
const LARGURA_POR_POSICAO: Record<-2 | -1 | 0 | 1 | 2, number> = { [-2]: 10, [-1]: 30, [0]: 50, [1]: 70, [2]: 90 };

function detalheFaixa(faixa: FaixaConversao | null): string {
  if (!faixa) return "";
  const partes: string[] = [];
  if (faixa.percentil !== undefined) partes.push(`percentil ${faixa.percentil}`);
  if (faixa.escoreT !== undefined) partes.push(`escore T ${faixa.escoreT}`);
  if (faixa.qi !== undefined) partes.push(`QI ${faixa.qi}`);
  return partes.join(" · ");
}

function BarraResultado({
  label,
  valorBruto,
  faixa,
  direcao,
}: {
  label: string;
  valorBruto: number;
  faixa: FaixaConversao | null;
  direcao: DirecaoMelhorPior;
}) {
  const classificacao = typeof faixa?.classificacao === "string" ? faixa.classificacao : undefined;
  const posicao = posicaoTextoClassificacao(classificacao);
  const severidade = inferirSeveridade(classificacao, direcao);
  const largura = posicao === null ? 50 : LARGURA_POR_POSICAO[posicao];
  const detalhe = detalheFaixa(faixa);

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

export function ResultadoResumo({ resultado, direcao }: { resultado: ResultadoCalculado | null; direcao: DirecaoMelhorPior }) {
  if (!resultado) {
    return <p className="mt-1 text-ink/50">Resultado ainda não calculado.</p>;
  }

  if (resultado.modo === "soma") {
    return (
      <div className="mt-2">
        <BarraResultado label="Escore bruto total" valorBruto={resultado.escoreBrutoTotal} faixa={resultado.faixa} direcao={direcao} />
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-3">
      {Object.entries(resultado.porCampo).map(([chave, r]) => (
        <BarraResultado key={chave} label={chave} valorBruto={r.valorBruto} faixa={r.faixa} direcao={direcao} />
      ))}
    </div>
  );
}
