import { useContagem } from "../../lib/useContagem";
import { COR_CLASSIFICACAO, ZONAS_COMPOSTO, parseIntervalo, type IndiceLido } from "../../lib/wechsler";

const MIN = 40;
const MAX = 160;
const pct = (v: number) => `${((Math.min(MAX, Math.max(MIN, v)) - MIN) / (MAX - MIN)) * 100}%`;

export interface LinhaIndice extends IndiceLido {
  rotulo: string;
  sigla: string;
  falta: string | null; // o que falta lançar (quando não calculado)
}

function Linha({ l, nivelIC }: { l: LinhaIndice; nivelIC: "ic90" | "ic95" }) {
  const contado = useContagem(l.composto, 900);
  const ic = parseIntervalo(l[nivelIC]);
  const cor = (l.classificacao && COR_CLASSIFICACAO[l.classificacao]) || "#262624";
  const calculado = l.composto !== null;
  // reinicia a animação quando o valor muda
  const chave = `${l.chave}-${l.composto}-${l[nivelIC]}`;

  return (
    <div className="grid grid-cols-[minmax(110px,170px)_1fr_minmax(120px,170px)] items-center gap-4 py-2.5">
      <div>
        <div className="text-[13px] font-semibold leading-tight text-ink">{l.sigla}</div>
        <div className="text-[11px] leading-tight text-ink/55">{l.rotulo}</div>
      </div>

      <div className="relative h-9">
        <div className="absolute inset-x-0 top-1/2 flex h-3 -translate-y-1/2 overflow-hidden rounded-full">
          {ZONAS_COMPOSTO.map((z) => (
            <div key={z.rotulo} style={{ width: `${((z.ate - z.de + 1) / (MAX - MIN + 1)) * 100}%`, background: z.fundo }} />
          ))}
        </div>
        {/* referência 100 */}
        <div className="absolute top-1/2 h-5 w-px -translate-y-1/2 bg-ink/25" style={{ left: pct(100) }} />
        {calculado && ic && (
          <div
            key={`ic-${chave}`}
            className="wais-intervalo absolute top-1/2 h-[7px] -translate-y-1/2 rounded-full"
            style={{ left: pct(ic[0]), width: `calc(${pct(ic[1])} - ${pct(ic[0])})`, background: cor, opacity: 0.55 }}
            title={`Intervalo de confiança ${nivelIC === "ic95" ? "95%" : "90%"}: ${ic[0]} a ${ic[1]}`}
          />
        )}
        {calculado && (
          <div
            key={`pt-${chave}`}
            className="wais-ponto-indice absolute top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-md"
            style={{ left: pct(l.composto as number), background: cor }}
          />
        )}
        {!calculado && <div className="absolute inset-0 flex items-center justify-center text-[11px] italic text-ink/45">{l.falta ?? "não calculado"}</div>}
      </div>

      <div className="text-right">
        {calculado ? (
          <>
            <div className="flex items-baseline justify-end gap-2">
              <span className="font-serif text-[28px] font-semibold leading-none text-ink tabular-nums">{contado}</span>
              <span className="text-[11px] text-ink/50 tabular-nums">p{String(l.percentil ?? "—")}</span>
            </div>
            {l.classificacao && (
              <span className="mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white" style={{ background: cor }}>
                {l.classificacao}
              </span>
            )}
          </>
        ) : (
          <span className="text-sm text-ink/30">—</span>
        )}
      </div>
    </div>
  );
}

export function EscalaIndices({ titulo, linhas, nivelIC = "ic95" }: { titulo: string; linhas: LinhaIndice[]; nivelIC?: "ic90" | "ic95" }) {
  return (
    <section>
      <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-sage-deep">{titulo}</h3>
      <div className="divide-y divide-mist">
        {linhas.map((l) => (
          <Linha key={l.chave} l={l} nivelIC={nivelIC} />
        ))}
      </div>
      <div className="mt-2 flex justify-between pl-[calc(min(170px,18%)+1rem)] pr-[calc(min(170px,18%)+1rem)] text-[10px] text-ink/40">
        <span>40</span>
        <span>70</span>
        <span>100</span>
        <span>130</span>
        <span>160</span>
      </div>
    </section>
  );
}
