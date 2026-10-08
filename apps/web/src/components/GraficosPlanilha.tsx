// Gráficos do Excel da psicóloga redesenhados em SVG: cada série aponta para células calculadas pelo motor de planilha.
// Tipos: linha, barras (vertical/horizontal, também combinadas com linha), radar e pizza.
type Ref = string | { k: string } | null;
export interface GraficoDef {
  titulo: string;
  eixo: { min?: number; max?: number };
  ancora: { linha: number; coluna: number };
  series: Array<{ tipo: string; direcao?: string; nome: Ref; cats: Ref[]; vals: Array<string | null> }>;
}
type Saidas = Record<string, string | number | boolean | null>;

const CORES = ["#4472C4", "#ED7D31", "#A5A5A5", "#FFC000", "#5B9BD5", "#70AD47", "#9E480E", "#636363"];
const L = 520, A = 300, M = { e: 44, d: 16, t: 34, b: 52 };

const texto = (r: Ref, s: Saidas): string => (r === null ? "" : typeof r === "string" ? r : String(s[r.k] ?? ""));
const numero = (k: string | null, s: Saidas): number | null => {
  if (!k) return null;
  const v = s[k];
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v.replace(",", ".")))) return Number(v.replace(",", "."));
  return null;
};
const fmt = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

// escala "bonita" para o eixo quando o Excel não fixa mínimo/máximo
function escala(min: number | undefined, max: number | undefined, valores: number[]) {
  let lo = min ?? Math.min(0, ...valores), hi = max ?? Math.max(1, ...valores);
  if (max === undefined) { const passo = Math.pow(10, Math.floor(Math.log10(hi || 1))); hi = Math.ceil(hi / passo) * passo; }
  if (hi <= lo) hi = lo + 1;
  return { lo, hi };
}

function Grade({ lo, hi, y }: { lo: number; hi: number; y: (v: number) => number }) {
  const n = 5;
  return (
    <g>
      {Array.from({ length: n + 1 }, (_, i) => lo + ((hi - lo) * i) / n).map((v) => (
        <g key={v}>
          <line x1={M.e} x2={L - M.d} y1={y(v)} y2={y(v)} stroke="currentColor" strokeOpacity={0.12} />
          <text x={M.e - 6} y={y(v) + 3} textAnchor="end" fontSize={10} fill="currentColor" fillOpacity={0.6}>{fmt(v)}</text>
        </g>
      ))}
    </g>
  );
}

function Cartesiano({ g, s }: { g: GraficoDef; s: Saidas }) {
  const horizontal = g.series.some((x) => x.tipo === "bar" && x.direcao === "bar");
  const cats = (g.series[0]?.cats ?? []).map((c) => texto(c, s));
  const n = Math.max(...g.series.map((x) => x.vals.length), cats.length);
  const todos = g.series.flatMap((x) => x.vals.map((k) => numero(k, s))).filter((v): v is number => v !== null);
  const { lo, hi } = escala(g.eixo.min, g.eixo.max, todos);
  const barras = g.series.filter((x) => x.tipo === "bar");
  const mx = horizontal ? 120 : M.e; // espaço dos rótulos nas barras horizontais
  const W = L - mx - M.d, H = A - M.t - M.b;
  const x = (i: number) => mx + (W * (i + 0.5)) / n;
  const y = (v: number) => M.t + H - ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * H;
  const yh = (i: number) => M.t + (H * (i + 0.5)) / n; // barras horizontais
  const xh = (v: number) => mx + ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * W;
  const larg = (horizontal ? H : W) / n;
  const bw = (larg * 0.7) / Math.max(1, barras.length);

  if (horizontal) {
    return (
      <g>
        {Array.from({ length: 6 }, (_, i) => lo + ((hi - lo) * i) / 5).map((v) => (
          <g key={v}>
            <line x1={xh(v)} x2={xh(v)} y1={M.t} y2={M.t + H} stroke="currentColor" strokeOpacity={0.12} />
            <text x={xh(v)} y={M.t + H + 14} textAnchor="middle" fontSize={10} fill="currentColor" fillOpacity={0.6}>{fmt(v)}</text>
          </g>
        ))}
        {Array.from({ length: n }, (_, i) => (
          <text key={i} x={mx - 6} y={yh(i) + 3} textAnchor="end" fontSize={10} fill="currentColor" fillOpacity={0.75}>{cats[i]?.slice(0, 22)}</text>
        ))}
        {barras.map((sr, si) => sr.vals.map((k, i) => {
          const v = numero(k, s);
          if (v === null) return null;
          const top = yh(i) - (bw * barras.length) / 2 + si * bw;
          return <g key={`${si}-${i}`}><rect x={xh(lo)} y={top} width={Math.max(0, xh(v) - xh(lo))} height={bw * 0.9} fill={CORES[si % CORES.length]} /><text x={xh(v) + 4} y={top + bw * 0.7} fontSize={10} fill="currentColor">{fmt(v)}</text></g>;
        }))}
      </g>
    );
  }
  return (
    <g>
      <Grade lo={lo} hi={hi} y={y} />
      {Array.from({ length: n }, (_, i) => (
        <text key={i} x={x(i)} y={A - M.b + 14} textAnchor={n > 6 ? "end" : "middle"} fontSize={10} fill="currentColor" fillOpacity={0.75} transform={n > 6 ? `rotate(-35 ${x(i)} ${A - M.b + 14})` : undefined}>{cats[i]?.slice(0, 18)}</text>
      ))}
      {barras.map((sr, si) => sr.vals.map((k, i) => {
        const v = numero(k, s);
        if (v === null) return null;
        const bx = x(i) - (bw * barras.length) / 2 + si * bw;
        return <g key={`${si}-${i}`}><rect x={bx} y={y(v)} width={bw * 0.9} height={Math.max(0, y(lo) - y(v))} fill={CORES[si % CORES.length]} /><text x={bx + bw * 0.45} y={y(v) - 3} textAnchor="middle" fontSize={9} fill="currentColor">{fmt(v)}</text></g>;
      }))}
      {g.series.map((sr, si) => {
        if (sr.tipo === "bar") return null;
        const pts = sr.vals.map((k, i) => { const v = numero(k, s); return v === null ? null : { x: x(i), y: y(v), v }; });
        // a linha se interrompe onde falta valor
        const trechos: Array<NonNullable<(typeof pts)[number]>[]> = [];
        let atual: NonNullable<(typeof pts)[number]>[] = [];
        for (const p of pts) { if (p) atual.push(p); else if (atual.length) { trechos.push(atual); atual = []; } }
        if (atual.length) trechos.push(atual);
        const cor = CORES[si % CORES.length];
        return (
          <g key={si}>
            {trechos.map((t, i) => t.length > 1 && <polyline key={i} points={t.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={cor} strokeWidth={2} />)}
            {pts.map((p, i) => p && <g key={i}><circle cx={p.x} cy={p.y} r={3.5} fill={cor} /><text x={p.x} y={p.y - 7} textAnchor="middle" fontSize={9} fill="currentColor" fillOpacity={0.8}>{fmt(p.v)}</text></g>)}
          </g>
        );
      })}
    </g>
  );
}

function Radar({ g, s }: { g: GraficoDef; s: Saidas }) {
  const cats = (g.series[0]?.cats ?? []).map((c) => texto(c, s));
  const n = Math.max(3, cats.length, ...g.series.map((x) => x.vals.length));
  const todos = g.series.flatMap((x) => x.vals.map((k) => numero(k, s))).filter((v): v is number => v !== null);
  const { lo, hi } = escala(g.eixo.min, g.eixo.max, todos);
  const cx = L / 2, cy = A / 2 + 8, R = Math.min(L, A) / 2 - 56;
  const ponto = (i: number, v: number) => { const a = -Math.PI / 2 + (2 * Math.PI * i) / n, r = ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * R; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  return (
    <g>
      {[0.25, 0.5, 0.75, 1].map((f) => <polygon key={f} points={Array.from({ length: n }, (_, i) => ponto(i, lo + (hi - lo) * f).join(",")).join(" ")} fill="none" stroke="currentColor" strokeOpacity={0.15} />)}
      {Array.from({ length: n }, (_, i) => {
        const [x, y] = ponto(i, hi), [tx, ty] = (() => { const a = -Math.PI / 2 + (2 * Math.PI * i) / n; return [cx + (R + 12) * Math.cos(a), cy + (R + 12) * Math.sin(a)]; })();
        return <g key={i}><line x1={cx} y1={cy} x2={x} y2={y} stroke="currentColor" strokeOpacity={0.15} /><text x={tx} y={ty + 3} textAnchor={tx < cx - 4 ? "end" : tx > cx + 4 ? "start" : "middle"} fontSize={10} fill="currentColor" fillOpacity={0.75}>{cats[i]?.slice(0, 22)}</text></g>;
      })}
      {g.series.map((sr, si) => {
        const pts = sr.vals.map((k, i) => { const v = numero(k, s); return v === null ? null : ponto(i, v); });
        if (pts.filter(Boolean).length < 2) return null;
        const cor = CORES[si % CORES.length];
        return <g key={si}><polygon points={pts.filter(Boolean).map((p) => p!.join(",")).join(" ")} fill={cor} fillOpacity={0.15} stroke={cor} strokeWidth={2} />{pts.map((p, i) => p && <circle key={i} cx={p[0]} cy={p[1]} r={3} fill={cor} />)}</g>;
      })}
    </g>
  );
}

function Pizza({ g, s }: { g: GraficoDef; s: Saidas }) {
  const sr = g.series[0];
  const itens = sr.vals.map((k, i) => ({ rot: texto(sr.cats[i] ?? null, s), v: numero(k, s) ?? 0 })).filter((x) => x.v > 0);
  const total = itens.reduce((a, b) => a + b.v, 0);
  const cx = 150, cy = A / 2 + 10, R = 90;
  let ang = -Math.PI / 2;
  return (
    <g>
      {itens.map((it, i) => {
        const a2 = ang + (2 * Math.PI * it.v) / total;
        const [x1, y1, x2, y2] = [cx + R * Math.cos(ang), cy + R * Math.sin(ang), cx + R * Math.cos(a2), cy + R * Math.sin(a2)];
        const grande = a2 - ang > Math.PI ? 1 : 0;
        const d = itens.length === 1 ? `M ${cx} ${cy - R} A ${R} ${R} 0 1 1 ${cx - 0.01} ${cy - R} Z` : `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${grande} 1 ${x2} ${y2} Z`;
        ang = a2;
        return <path key={i} d={d} fill={CORES[i % CORES.length]} />;
      })}
      {itens.map((it, i) => (
        <g key={i}><rect x={290} y={80 + i * 24} width={12} height={12} fill={CORES[i % CORES.length]} /><text x={308} y={90 + i * 24} fontSize={11} fill="currentColor">{it.rot}: {fmt(it.v)} ({Math.round((it.v / total) * 100)}%)</text></g>
      ))}
    </g>
  );
}

function Grafico({ g, s }: { g: GraficoDef; s: Saidas }) {
  const radar = g.series.every((x) => x.tipo === "radar");
  const pizza = g.series.every((x) => x.tipo === "pie");
  const temValor = g.series.some((x) => x.vals.some((k) => numero(k, s) !== null));
  if (!temValor) return null;
  const nomes = g.series.map((x) => texto(x.nome, s)).filter(Boolean);
  // legenda só das séries que têm dados (o Excel traz séries auxiliares vazias)
  const comDados = g.series.map((_, i) => i).filter((i) => g.series[i].vals.some((k) => numero(k, s) !== null));
  const legenda = !pizza && comDados.length > 1;
  return (
    <figure className="rounded-xl border border-mist bg-white p-3 text-ink">
      <svg viewBox={`0 0 ${L} ${A}`} className="w-full" role="img" aria-label={g.titulo || "Gráfico"}>
        {g.titulo && <text x={L / 2} y={18} textAnchor="middle" fontSize={12} fontWeight={600} fill="currentColor">{g.titulo.slice(0, 70)}</text>}
        {pizza ? <Pizza g={g} s={s} /> : radar ? <Radar g={g} s={s} /> : <Cartesiano g={g} s={s} />}
        {legenda && comDados.map((i, pos) => (
          <g key={i}><rect x={M.e + pos * 92} y={A - 14} width={10} height={10} fill={CORES[i % CORES.length]} /><text x={M.e + pos * 92 + 14} y={A - 5} fontSize={10} fill="currentColor" fillOpacity={0.8}>{(nomes[i] ?? `Série ${i + 1}`).slice(0, 12)}</text></g>
        ))}
      </svg>
    </figure>
  );
}

export function GraficosPlanilha({ graficos, saidas }: { graficos: GraficoDef[]; saidas: Saidas }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {graficos.map((g, i) => <Grafico key={i} g={g} s={saidas} />)}
    </div>
  );
}
