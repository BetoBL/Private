import { useMemo } from "react";
import { COR_INDICE, LIMITE_RARO, ROTULO_INDICE, parseIntervalo, type IndiceLido } from "../../lib/wechsler";

const W = 760;
const TXT = "#262624";

// ---------------------------------------------------------------------------------------------
// 1) Facilidade × Dificuldade (normativa): 8 barras de ponto composto com intervalo de confiança.
// ---------------------------------------------------------------------------------------------
const ORDEM_NORMATIVA = ["icv", "iop", "imo", "ivp", "qiv", "qie", "gai", "qit"];

export function GraficoFDNormativa({ indices, nivelIC }: { indices: Record<string, IndiceLido>; nivelIC: "ic90" | "ic95" }) {
  const H = 372;
  const E = 46;
  const D = W - 118;
  const T = 18;
  const B = H - 40;
  const y = (v: number) => B - ((Math.min(160, Math.max(40, v)) - 40) / 120) * (B - T);
  const slot = (D - E) / ORDEM_NORMATIVA.length;
  const larg = Math.min(46, slot * 0.62);
  const faixas = [
    { de: 115, ate: 160, rotulo: "Facilidade", fundo: "#e0f0d4", traco: "#4f8a3a" },
    { de: 85, ate: 115, rotulo: "Média", fundo: "#dbe7f6", traco: "#3a63b8" },
    { de: 40, ate: 85, rotulo: "Dificuldade", fundo: "#f8efc2", traco: "#a3820d" },
  ];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Facilidade e dificuldade normativa dos índices e QIs">
      {faixas.map((f) => (
        <g key={f.rotulo}>
          <rect x={E} y={y(f.ate)} width={D - E} height={y(f.de) - y(f.ate)} fill={f.fundo} />
          <text x={D + 12} y={(y(f.ate) + y(f.de)) / 2 + 4} fontSize="12" fontWeight="600" fill={f.traco}>
            {f.rotulo}
          </text>
        </g>
      ))}
      {[40, 60, 80, 100, 120, 140, 160].map((v) => (
        <g key={v}>
          <line x1={E} x2={D} y1={y(v)} y2={y(v)} stroke="#fff" strokeOpacity={0.6} />
          <text x={E - 8} y={y(v) + 4} fontSize="11" textAnchor="end" fill={TXT} fillOpacity={0.5}>
            {v}
          </text>
        </g>
      ))}
      <line x1={E} x2={D} y1={y(115)} y2={y(115)} stroke={TXT} strokeOpacity={0.45} />
      <line x1={E} x2={D} y1={y(85)} y2={y(85)} stroke={TXT} strokeOpacity={0.45} />
      <line x1={E + slot * 4} x2={E + slot * 4} y1={T} y2={B} stroke={TXT} strokeOpacity={0.5} />
      <text x={E - 34} y={(T + B) / 2} fontSize="11" fill={TXT} fillOpacity={0.55} transform={`rotate(-90 ${E - 34} ${(T + B) / 2})`} textAnchor="middle">
        Pontos compostos
      </text>

      {ORDEM_NORMATIVA.map((k, i) => {
        const ind = indices[k];
        const cx = E + slot * (i + 0.5);
        const c = ind?.composto ?? null;
        const ic = parseIntervalo(ind?.[nivelIC] ?? null);
        return (
          <g key={k}>
            <text x={cx} y={B + 22} fontSize="12" textAnchor="middle" fontWeight="600" fill={TXT} fillOpacity={c === null ? 0.35 : 0.85}>
              {ROTULO_INDICE[k]}
            </text>
            {c !== null && (
              <g>
                <title>{`${ROTULO_INDICE[k]}: ${c}${ic ? ` (IC ${ic[0]}–${ic[1]})` : ""}`}</title>
                <rect key={`${k}-${c}`} className="wais-barra" x={cx - larg / 2} y={y(c)} width={larg} height={y(40) - y(c)} rx={4} fill={COR_INDICE[k]} style={{ ["--atraso" as string]: `${i * 0.06}s` }} />
                <text x={cx} y={y(40) - 10} fontSize="15" fontWeight="700" textAnchor="middle" fill="#fff">
                  {c}
                </text>
                {ic && (
                  <g className="wais-entra" style={{ animationDelay: `${0.5 + i * 0.05}s` }}>
                    <line x1={cx} x2={cx} y1={y(ic[0])} y2={y(ic[1])} stroke={TXT} strokeWidth={1.6} />
                    <line x1={cx - 6} x2={cx + 6} y1={y(ic[0])} y2={y(ic[0])} stroke={TXT} strokeWidth={1.6} />
                    <line x1={cx - 6} x2={cx + 6} y1={y(ic[1])} y2={y(ic[1])} stroke={TXT} strokeWidth={1.6} />
                  </g>
                )}
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------------------------
// 2) Facilidade × Dificuldade (individual / raro × não raro): diferença do índice para a média dos
//    índices, contra o valor crítico (significância) e o limite de "raro" de cada índice.
// ---------------------------------------------------------------------------------------------
const ORDEM_INDIVIDUAL = ["icv", "iop", "imo", "ivp"];

export function GraficoFDIndividual({ indices }: { indices: Record<string, IndiceLido> }) {
  const H = 340;
  const E = 46;
  const D = W - 118;
  const T = 14;
  const B = H - 34;
  const y = (v: number) => B - ((Math.min(25, Math.max(-25, v)) + 25) / 50) * (B - T);
  const slot = (D - E) / ORDEM_INDIVIDUAL.length;
  const meia = slot * 0.7;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Facilidade e dificuldade individual dos índices">
      {ORDEM_INDIVIDUAL.map((k, i) => {
        const x0 = E + slot * i + (slot - meia) / 2;
        const lim = LIMITE_RARO[k];
        const ind = indices[k];
        const dif = ind?.diferencaMedia ?? null;
        const vc = ind?.valorCritico ?? null;
        const interpretavel = ind?.interpretavel === "SIM";
        const significativo = dif !== null && vc !== null && Math.abs(dif) >= vc;
        const cor = !significativo ? "#8a8a82" : (dif as number) > 0 ? "#3f8f5b" : "#d9822b";
        return (
          <g key={k}>
            <rect x={x0} y={y(25)} width={meia} height={y(lim) - y(25)} fill="#d6e2f5" />
            <rect x={x0} y={y(lim)} width={meia} height={y(0) - y(lim)} fill="#dcefd2" />
            <rect x={x0} y={y(0)} width={meia} height={y(-lim) - y(0)} fill="#faf0c4" />
            <rect x={x0} y={y(-lim)} width={meia} height={y(-25) - y(-lim)} fill="#f4d0cb" />
            {vc !== null && interpretavel && (
              <rect x={x0 + meia * 0.18} y={y(vc)} width={meia * 0.64} height={y(-vc) - y(vc)} fill={TXT} fillOpacity={0.12} stroke={TXT} strokeOpacity={0.25} strokeDasharray="3 3">
                <title>{`Zona sem diferença significativa: ±${vc}`}</title>
              </rect>
            )}
            <line x1={x0} x2={x0 + meia} y1={y(0)} y2={y(0)} stroke={TXT} strokeOpacity={0.7} />
            {dif !== null && interpretavel && (
              <g>
                <title>{`${ROTULO_INDICE[k]}: diferença ${dif} (valor crítico ${vc})`}</title>
                <rect key={`${k}-${dif}`} className="wais-barra-v" x={x0 + meia * 0.36} y={Math.min(y(0), y(dif))} width={meia * 0.28} height={Math.max(2, Math.abs(y(dif) - y(0)))} rx={3} fill={cor} style={{ ["--atraso" as string]: `${i * 0.07}s`, transformOrigin: `50% ${dif >= 0 ? "100%" : "0%"}` }} />
                <text x={x0 + meia / 2} y={dif >= 0 ? y(dif) - 8 : y(dif) + 16} fontSize="13" fontWeight="700" textAnchor="middle" fill={cor}>
                  {dif > 0 ? "+" : ""}
                  {dif.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
                </text>
              </g>
            )}
            {!interpretavel && ind?.composto != null && (
              <text x={x0 + meia / 2} y={y(0) - 8} fontSize="11" fontStyle="italic" textAnchor="middle" fill="#a83232">
                não interpretável
              </text>
            )}
            <text x={x0 + meia / 2} y={B + 22} fontSize="12" fontWeight="600" textAnchor="middle" fill={TXT} fillOpacity={0.85}>
              {ROTULO_INDICE[k]}
            </text>
          </g>
        );
      })}
      {[-20, -15, -10, -5, 0, 5, 10, 15, 20, 25].map((v) => (
        <text key={v} x={E - 8} y={y(v) + 4} fontSize="11" textAnchor="end" fill={TXT} fillOpacity={0.5}>
          {v}
        </text>
      ))}
      <text x={E - 34} y={(T + B) / 2} fontSize="11" fill={TXT} fillOpacity={0.55} transform={`rotate(-90 ${E - 34} ${(T + B) / 2})`} textAnchor="middle">
        Diferença para a média dos índices
      </text>
      {[
        { rot: "Raro", ya: y(18), cor: "#3a63b8" },
        { rot: "Facilidade", ya: y(8), cor: "#4f8a3a" },
        { rot: "Dificuldade", ya: y(-8), cor: "#a3820d" },
        { rot: "Raro", ya: y(-18), cor: "#b03a2e" },
      ].map((l, n) => (
        <text key={n} x={D + 12} y={l.ya + 4} fontSize="12" fontWeight="600" fill={l.cor}>
          {l.rot}
        </text>
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------------------------
// 3) Perfil dos pontos compostos: linha suavizada pelos 8 índices/QIs.
// ---------------------------------------------------------------------------------------------
export function PerfilCompostos({ indices }: { indices: Record<string, IndiceLido> }) {
  const H = 300;
  const E = 46;
  const D = W - 30;
  const T = 26;
  const B = H - 38;
  const y = (v: number) => B - ((Math.min(150, Math.max(50, v)) - 50) / 100) * (B - T);
  const slot = (D - E) / ORDEM_NORMATIVA.length;
  const pontos = useMemo(
    () =>
      ORDEM_NORMATIVA.map((k, i) => ({ k, x: E + slot * (i + 0.5), c: indices[k]?.composto ?? null })).filter((p): p is { k: string; x: number; c: number } => p.c !== null),
    [indices, slot]
  );
  // curva suave (Catmull-Rom convertida em Bézier)
  const caminho = useMemo(() => {
    if (pontos.length < 2) return "";
    const P = pontos.map((p) => [p.x, y(p.c)]);
    let d = `M${P[0][0]} ${P[0][1]}`;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] ?? P[i];
      const p1 = P[i];
      const p2 = P[i + 1];
      const p3 = P[i + 2] ?? p2;
      d += ` C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6}, ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6}, ${p2[0]} ${p2[1]}`;
    }
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pontos]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Perfil dos pontos compostos">
      {[50, 70, 85, 100, 115, 130, 150].map((v) => (
        <g key={v}>
          <line x1={E} x2={D} y1={y(v)} y2={y(v)} stroke={TXT} strokeOpacity={v === 100 ? 0.3 : v === 85 || v === 115 ? 0.22 : 0.1} strokeDasharray={v === 100 ? "4 5" : undefined} />
          <text x={E - 8} y={y(v) + 4} fontSize="11" textAnchor="end" fill={TXT} fillOpacity={0.5}>
            {v}
          </text>
        </g>
      ))}
      {ORDEM_NORMATIVA.map((k, i) => (
        <g key={k}>
          <line x1={E + slot * (i + 0.5)} x2={E + slot * (i + 0.5)} y1={T} y2={B} stroke={TXT} strokeOpacity={0.07} />
          <text x={E + slot * (i + 0.5)} y={B + 22} fontSize="12" fontWeight="600" textAnchor="middle" fill={TXT} fillOpacity={0.8}>
            {ROTULO_INDICE[k]}
          </text>
        </g>
      ))}
      {caminho && <path key={caminho} d={caminho} className="wais-tracado" pathLength={1} fill="none" stroke="#3a63b8" strokeWidth={2.8} strokeLinecap="round" />}
      {pontos.map((p, i) => (
        <g key={`${p.k}-${p.c}`} className="wais-ponto" style={{ ["--atraso" as string]: `${0.3 + i * 0.07}s` }}>
          <circle cx={p.x} cy={y(p.c)} r={6.5} fill="#fff" stroke="#3a63b8" strokeWidth={2.6} />
          <text x={p.x} y={y(p.c) - 14} fontSize="13" fontWeight="700" textAnchor="middle" fill={TXT}>
            {p.c}
          </text>
        </g>
      ))}
    </svg>
  );
}
