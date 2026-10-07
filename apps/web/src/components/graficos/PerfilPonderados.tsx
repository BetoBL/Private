import { useMemo, useState } from "react";
import { GRUPOS_WAIS3, ZONAS_PONDERADO, zonaDoPonderado } from "../../lib/wechsler";

interface Props {
  // chave do subteste -> bruto e ponderado (null = lançado sem norma)
  ponderados: Record<string, { bruto: number; ponderado: number | null }>;
  rotulos: Record<string, string>;
}

const W = 880;
const H = 418;
const ESQ = 40;
const DIR = W - 150;
const TOPO = 58;
const BASE = H - 80;
const FOLGA_GRUPO = 26;

const yDe = (p: number) => BASE - ((p - 0.5) / 19) * (BASE - TOPO);

export function PerfilPonderados({ ponderados, rotulos }: Props) {
  const [ativo, setAtivo] = useState<string | null>(null);

  // posição x de cada subteste, agrupados com folga entre os índices
  const layout = useMemo(() => {
    const total = GRUPOS_WAIS3.reduce((n, g) => n + g.subtestes.length, 0);
    const util = DIR - ESQ - FOLGA_GRUPO * (GRUPOS_WAIS3.length - 1);
    const slot = util / total;
    let x = ESQ;
    return GRUPOS_WAIS3.map((g) => {
      const ini = x;
      const itens = g.subtestes.map((s, i) => ({ ...s, x: ini + slot * (i + 0.5) }));
      x += slot * g.subtestes.length + FOLGA_GRUPO;
      return { grupo: g, itens, ini, fim: ini + slot * g.subtestes.length };
    });
  }, []);

  const info = ativo ? layout.flatMap((l) => l.itens).find((i) => i.chave === ativo) : null;
  const infoVal = ativo ? ponderados[ativo] : null;

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Perfil dos pontos ponderados dos subtestes">
        {/* faixas de zona */}
        {ZONAS_PONDERADO.map((z) => (
          <g key={z.rotulo}>
            <rect x={ESQ} y={yDe(z.ate + 0.5)} width={DIR - ESQ} height={yDe(z.de - 0.5) - yDe(z.ate + 0.5)} fill={z.fundo} />
            <text x={DIR + 14} y={(yDe(z.ate + 0.5) + yDe(z.de - 0.5)) / 2 + 4} fontSize="11.5" fill={z.traco} fontWeight="600">
              {z.rotulo}
            </text>
          </g>
        ))}
        {/* grade fina e escala */}
        {Array.from({ length: 19 }, (_, i) => i + 1).map((p) => (
          <g key={p}>
            <line x1={ESQ} x2={DIR} y1={yDe(p)} y2={yDe(p)} stroke="#fff" strokeOpacity={0.55} />
            {p % 2 === 1 && (
              <text x={ESQ - 10} y={yDe(p) + 4} fontSize="11" textAnchor="end" fill="#262624" fillOpacity={0.5}>
                {p}
              </text>
            )}
          </g>
        ))}
        <line x1={ESQ} x2={DIR} y1={yDe(10)} y2={yDe(10)} stroke="#262624" strokeOpacity={0.35} strokeDasharray="4 5" />
        

        {layout.map(({ grupo, itens, ini, fim }, gi) => {
          const presentes = itens.filter((i) => ponderados[i.chave]?.ponderado != null);
          const caminho = presentes.map((i, k) => `${k === 0 ? "M" : "L"}${i.x.toFixed(1)} ${yDe(ponderados[i.chave].ponderado as number).toFixed(1)}`).join(" ");
          return (
            <g key={grupo.chave}>
              {gi > 0 && <line x1={ini - FOLGA_GRUPO / 2} x2={ini - FOLGA_GRUPO / 2} y1={TOPO - 14} y2={BASE + 6} stroke="#262624" strokeOpacity={0.12} />}
              <text x={(ini + fim) / 2} y={TOPO - 28} fontSize="12.5" textAnchor="middle" fill="#262624" fontWeight="700">
                {grupo.sigla}
              </text>
              <text x={(ini + fim) / 2} y={TOPO - 14} fontSize="10.5" textAnchor="middle" fill="#262624" fillOpacity={0.55}>
                {grupo.titulo}
              </text>

              {presentes.length > 1 && (
                <path key={`${grupo.chave}-${presentes.length}`} d={caminho} className="wais-tracado" pathLength={1} fill="none" stroke="#262624" strokeOpacity={0.78} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
              )}

              {itens.map((i, k) => {
                const v = ponderados[i.chave];
                const p = v?.ponderado ?? null;
                return (
                  <g key={i.chave}>
                    <text x={i.x} y={BASE + 24} fontSize="11.5" textAnchor="middle" fill="#262624" fillOpacity={v ? 0.85 : 0.35} fontWeight={v ? 700 : 500}>
                      {i.sigla}
                    </text>
                    {p !== null && (
                      <g
                        key={`${i.chave}-${presentes.length}`}
                        className="wais-ponto cursor-pointer outline-none"
                        style={{ ["--atraso" as string]: `${0.35 + k * 0.07}s` }}
                        tabIndex={0}
                        role="img"
                        aria-label={`${rotulos[i.chave] ?? i.sigla}: bruto ${v.bruto}, ponderado ${p}, ${zonaDoPonderado(p).rotulo}`}
                        onMouseEnter={() => setAtivo(i.chave)}
                        onMouseLeave={() => setAtivo((a) => (a === i.chave ? null : a))}
                        onFocus={() => setAtivo(i.chave)}
                        onBlur={() => setAtivo((a) => (a === i.chave ? null : a))}
                      >
                        <circle cx={i.x} cy={yDe(p)} r={13} fill="transparent" />
                        <circle cx={i.x} cy={yDe(p)} r={i.complementar ? 6.5 : 7.5} fill={i.complementar ? "#fff" : zonaDoPonderado(p).traco} stroke={i.complementar ? zonaDoPonderado(p).traco : "#fff"} strokeWidth={i.complementar ? 2.6 : 2.4} />
                        <text x={i.x} y={yDe(p) - 14} fontSize="12" textAnchor="middle" fontWeight="700" fill={zonaDoPonderado(p).traco}>
                          {p}
                        </text>
                      </g>
                    )}
                    {p === null && v && (
                      <text x={i.x} y={BASE - 8} fontSize="10" textAnchor="middle" fill="#a83232">
                        sem norma
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
        {/* colchetes das duas escalas, como no gráfico da planilha: Verbal = ICV + IMO; Execução = IOP + IVP */}
        {[
          { rotulo: "Escala Verbal", de: layout[0].ini, ate: layout[1].fim },
          { rotulo: "Escala de Execução", de: layout[2].ini, ate: layout[3].fim },
        ].map((e) => (
          <g key={e.rotulo}>
            <path d={`M${e.de} ${BASE + 40} v8 H${e.ate} v-8`} fill="none" stroke="#262624" strokeOpacity={0.35} strokeWidth={1.2} />
            <text x={(e.de + e.ate) / 2} y={BASE + 66} fontSize="11.5" textAnchor="middle" fill="#262624" fillOpacity={0.7} fontWeight="600">
              {e.rotulo}
            </text>
          </g>
        ))}
      </svg>

      {info && infoVal && infoVal.ponderado !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-ink px-3 py-2 text-xs text-paper shadow-lg"
          style={{ left: `${(info.x / W) * 100}%`, top: `${(yDe(infoVal.ponderado) / H) * 100 - 3}%` }}
        >
          <div className="font-semibold">{rotulos[info.chave] ?? info.sigla}</div>
          <div className="mt-0.5 opacity-80">
            bruto {infoVal.bruto} → ponderado <strong>{infoVal.ponderado}</strong> · {zonaDoPonderado(infoVal.ponderado).rotulo}
          </div>
          {info.complementar && <div className="mt-0.5 opacity-60">fora dos 4 índices (entra nos QIs)</div>}
        </div>
      )}

      <p className="mt-2 text-[11px] text-ink/50">
        Linha tracejada: ponderado 10 (média). Ponto cheio: subteste que compõe um índice. Ponto vazado: complementar (entra só nos QIs Verbal/Execução).
      </p>
    </div>
  );
}
