import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";

// Gráficos do laudo: desenhados em SVG (texto e formas simples) e convertidos em PNG para entrar no Word.
// O servidor não tem fontes de sistema: a Noto Sans (OFL) vem junto em assets/fonts.
export interface SerieImg {
  nome: string;
  tipo: "bar" | "line";
  cor?: string;
  valores: Array<number | null>;
  marcador?: boolean;
}
export interface GraficoImg {
  tipo: "colunas" | "barras-h" | "linhas" | "radar" | "pizza";
  categorias: string[];
  series: SerieImg[];
  eixo?: { min?: number; max?: number };
  barraErro?: number; // meia-altura fixa da barra de erro (ex.: 7,5)
  coresPorPonto?: string[]; // uma cor por categoria (colunas de uma série só)
  rotulos?: "base" | "topo" | "nenhum";
  legenda?: boolean;
  largura?: number;
  altura?: number;
}

export const PALETA = ["#4F81BD", "#C0504D", "#9BBB59", "#8064A2", "#4BACC6", "#F79646", "#2C4D75", "#772C2A"];
const FONTE = "Noto Sans";
const TXT = "#404040";

const fmt = (v: number) => (Object.is(v, -0) || Math.abs(v) < 1e-9 ? "0" : v.toLocaleString("pt-BR", { maximumFractionDigits: 1 }));
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// passo "redondo" (1, 2, 5 × 10^k) para o eixo; limites que o Excel não fixou são arredondados para múltiplos do passo
function escala(min: number | undefined, max: number | undefined, valores: number[]) {
  let lo = min ?? Math.min(0, ...valores), hi = max ?? Math.max(1, ...valores);
  if (hi <= lo) hi = lo + 1;
  const bruto = (hi - lo) / 5, p = Math.pow(10, Math.floor(Math.log10(bruto))), f = bruto / p;
  const passo = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
  if (min === undefined) lo = Math.floor(lo / passo) * passo;
  if (max === undefined) hi = Math.ceil(hi / passo) * passo;
  const marcas: number[] = [];
  for (let v = Math.ceil(lo / passo - 1e-9) * passo; v <= hi + 1e-9; v += passo) marcas.push(Math.round(v * 1e6) / 1e6);
  return { lo, hi, marcas };
}
// texto branco sobre cor escura
const escura = (hex: string) => { const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex); if (!m) return false; const [r, g, b] = [m[1], m[2], m[3]].map((x) => parseInt(x, 16)); return 0.299 * r + 0.587 * g + 0.114 * b < 110; };

export function svgDoGrafico(g: GraficoImg): string {
  const L = g.largura ?? 720, A = g.altura ?? 320;
  const t = (x: number, y: number, s: string, o: { anchor?: string; size?: number; bold?: boolean; fill?: string; rot?: number } = {}) =>
    `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="${FONTE}" font-size="${o.size ?? 11}" ${o.bold ? 'font-weight="700"' : ""} fill="${o.fill ?? TXT}" text-anchor="${o.anchor ?? "middle"}"${o.rot ? ` transform="rotate(${o.rot} ${x.toFixed(1)} ${y.toFixed(1)})"` : ""}>${esc(s)}</text>`;
  const todos = g.series.flatMap((s) => s.valores).filter((v): v is number => v !== null);
  const partes: string[] = [`<rect width="${L}" height="${A}" fill="#ffffff"/>`];
  const comLegenda = (g.legenda ?? g.series.length > 1) && g.tipo !== "pizza";
  const muitas = g.categorias.length > 10; // muitos rótulos: giram para não se sobrepor
  const M = { e: 46, d: 16, t: 14, b: (muitas ? 92 : 38) + (comLegenda ? 22 : 0) };
  const n = Math.max(g.categorias.length, ...g.series.map((s) => s.valores.length));

  if (g.tipo === "colunas" || g.tipo === "linhas") {
    const { lo, hi, marcas } = escala(g.eixo?.min, g.eixo?.max, todos.concat(g.barraErro ? todos.map((v) => v + g.barraErro!) : []));
    const W = L - M.e - M.d, H = A - M.t - M.b;
    const x = (i: number) => M.e + (W * (i + 0.5)) / n;
    const y = (v: number) => M.t + H - ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * H;
    for (const v of marcas) { partes.push(`<line x1="${M.e}" x2="${L - M.d}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" stroke="#d9d9d9"/>`, t(M.e - 6, y(v) + 4, fmt(v), { anchor: "end", size: 10 })); }
    partes.push(`<line x1="${M.e}" x2="${M.e}" y1="${M.t}" y2="${M.t + H}" stroke="#bfbfbf"/><line x1="${M.e}" x2="${L - M.d}" y1="${y(Math.max(lo, 0)).toFixed(1)}" y2="${y(Math.max(lo, 0)).toFixed(1)}" stroke="#bfbfbf"/>`);
    g.categorias.forEach((c, i) => partes.push(muitas ? t(x(i) + 3, A - M.b + 12, c.slice(0, 30), { anchor: "end", size: 9.5, rot: -50 }) : t(x(i), A - M.b + 16, c, { size: 11 })));
    const barras = g.series.filter((s) => s.tipo === "bar");
    const larg = (W / n) * 0.62 / Math.max(1, barras.length);
    barras.forEach((s, si) => s.valores.forEach((v, i) => {
      if (v === null) return;
      const bx = x(i) - (larg * barras.length) / 2 + si * larg;
      const cor = g.coresPorPonto?.[i % g.coresPorPonto.length] ?? s.cor ?? PALETA[si % PALETA.length];
      const base = y(Math.max(lo, 0));
      partes.push(`<rect x="${bx.toFixed(1)}" y="${y(v).toFixed(1)}" width="${larg.toFixed(1)}" height="${Math.max(0, base - y(v)).toFixed(1)}" fill="${cor}"/>`);
      if (g.barraErro) { const cx = bx + larg / 2; partes.push(`<path d="M${cx.toFixed(1)} ${y(v - g.barraErro).toFixed(1)}V${y(v + g.barraErro).toFixed(1)}M${(cx - 4).toFixed(1)} ${y(v - g.barraErro).toFixed(1)}H${(cx + 4).toFixed(1)}M${(cx - 4).toFixed(1)} ${y(v + g.barraErro).toFixed(1)}H${(cx + 4).toFixed(1)}" stroke="#595959" stroke-width="1.2" fill="none"/>`); }
      if ((g.rotulos ?? "nenhum") === "base") partes.push(t(bx + larg / 2, base - 6, fmt(v), { size: 11, fill: escura(cor) ? "#ffffff" : TXT }));
      if (g.rotulos === "topo") partes.push(t(bx + larg / 2, y(v + (g.barraErro ?? 0)) - 4, fmt(v), { size: 10 }));
    }));
    g.series.forEach((s, si) => {
      if (s.tipo !== "line") return;
      const cor = s.cor ?? PALETA[si % PALETA.length];
      const pts = s.valores.map((v, i) => (v === null ? null : [x(i), y(v)] as const));
      let trecho: Array<readonly [number, number]> = [];
      const fecha = () => { if (trecho.length > 1) partes.push(`<polyline points="${trecho.map((p) => p.map((c) => c.toFixed(1)).join(",")).join(" ")}" fill="none" stroke="${cor}" stroke-width="2.5" stroke-linejoin="round"/>`); trecho = []; };
      for (const p of pts) { if (p) trecho.push(p); else fecha(); }
      fecha();
      if (s.marcador !== false) for (const p of pts) if (p) partes.push(`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4.5" fill="${s.marcador ? "#C0504D" : cor}" stroke="${cor}" stroke-width="1"/>`);
    });
  } else if (g.tipo === "barras-h") {
    const mx = 150, W = L - mx - M.d - 24, H = A - M.t - 30;
    const { lo, hi } = escala(g.eixo?.min, g.eixo?.max, todos);
    const xv = (v: number) => mx + ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * W;
    for (let i = 0; i <= 5; i++) { const v = lo + ((hi - lo) * i) / 5; partes.push(`<line x1="${xv(v).toFixed(1)}" x2="${xv(v).toFixed(1)}" y1="${M.t}" y2="${M.t + H}" stroke="#d9d9d9"/>`, t(xv(v), M.t + H + 16, fmt(v), { size: 10 })); }
    const larg = (H / n) * 0.62 / Math.max(1, g.series.length);
    g.categorias.forEach((c, i) => partes.push(t(mx - 8, M.t + (H * (i + 0.5)) / n + 4, c.slice(0, 26), { anchor: "end", size: 10.5 })));
    g.series.forEach((s, si) => s.valores.forEach((v, i) => {
      if (v === null) return;
      const top = M.t + (H * (i + 0.5)) / n - (larg * g.series.length) / 2 + si * larg;
      partes.push(`<rect x="${xv(lo).toFixed(1)}" y="${top.toFixed(1)}" width="${Math.max(0, xv(v) - xv(lo)).toFixed(1)}" height="${larg.toFixed(1)}" fill="${s.cor ?? PALETA[si % PALETA.length]}"/>`, t(xv(v) + 5, top + larg * 0.75, fmt(v), { anchor: "start", size: 10 }));
    }));
  } else if (g.tipo === "radar") {
    const { lo, hi } = escala(g.eixo?.min, g.eixo?.max, todos);
    const cx = L / 2, cy = A / 2 + 6, R = Math.min(L, A) / 2 - 58;
    const pt = (i: number, v: number, extra = 0) => { const a = -Math.PI / 2 + (2 * Math.PI * i) / n; const r = ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * R + extra; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
    for (const f of [0.25, 0.5, 0.75, 1]) partes.push(`<polygon points="${Array.from({ length: n }, (_, i) => pt(i, lo + (hi - lo) * f).map((c) => c.toFixed(1)).join(",")).join(" ")}" fill="none" stroke="#d9d9d9"/>`);
    g.categorias.forEach((c, i) => { const [x0, y0] = pt(i, hi); const [tx, ty] = pt(i, hi, 14); partes.push(`<line x1="${cx}" y1="${cy}" x2="${x0.toFixed(1)}" y2="${y0.toFixed(1)}" stroke="#d9d9d9"/>`, t(tx, ty + 4, c.slice(0, 24), { anchor: tx < cx - 4 ? "end" : tx > cx + 4 ? "start" : "middle", size: 10.5 })); });
    g.series.forEach((s, si) => { const cor = s.cor ?? PALETA[si % PALETA.length]; const ps = s.valores.map((v, i) => (v === null ? null : pt(i, v))).filter(Boolean) as number[][]; if (ps.length > 1) partes.push(`<polygon points="${ps.map((p) => p.map((c) => c.toFixed(1)).join(",")).join(" ")}" fill="${cor}" fill-opacity="0.18" stroke="${cor}" stroke-width="2.5"/>`, ...ps.map((p) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.5" fill="${cor}"/>`)); });
  } else {
    const s = g.series[0];
    const itens = s.valores.map((v, i) => ({ rot: g.categorias[i] ?? "", v: v ?? 0 })).filter((x) => x.v > 0);
    const tot = itens.reduce((a, b) => a + b.v, 0) || 1;
    const cx = 190, cy = A / 2, R = Math.min(A / 2 - 20, 120);
    let ang = -Math.PI / 2;
    itens.forEach((it, i) => {
      const a2 = ang + (2 * Math.PI * it.v) / tot;
      const d = itens.length === 1 ? `M${cx} ${cy - R}A${R} ${R} 0 1 1 ${cx - 0.01} ${cy - R}Z` : `M${cx} ${cy}L${(cx + R * Math.cos(ang)).toFixed(1)} ${(cy + R * Math.sin(ang)).toFixed(1)}A${R} ${R} 0 ${a2 - ang > Math.PI ? 1 : 0} 1 ${(cx + R * Math.cos(a2)).toFixed(1)} ${(cy + R * Math.sin(a2)).toFixed(1)}Z`;
      partes.push(`<path d="${d}" fill="${PALETA[i % PALETA.length]}"/>`, `<rect x="${cx + R + 40}" y="${cy - 40 + i * 26}" width="13" height="13" fill="${PALETA[i % PALETA.length]}"/>`, t(cx + R + 60, cy - 29 + i * 26, `${it.rot}: ${fmt(it.v)} (${Math.round((it.v / tot) * 100)}%)`, { anchor: "start", size: 11.5 }));
      ang = a2;
    });
  }
  if (comLegenda) {
    const larguraItem = 118, ini = (L - larguraItem * g.series.length) / 2;
    g.series.forEach((s, i) => partes.push(s.tipo === "line" ? `<line x1="${ini + i * larguraItem}" x2="${ini + i * larguraItem + 22}" y1="${A - 12}" y2="${A - 12}" stroke="${s.cor ?? PALETA[i % PALETA.length]}" stroke-width="3"/>` : `<rect x="${ini + i * larguraItem}" y="${A - 18}" width="22" height="11" fill="${s.cor ?? PALETA[i % PALETA.length]}"/>`, t(ini + i * larguraItem + 28, A - 8, s.nome.slice(0, 14), { anchor: "start", size: 11.5 })));
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${A}" viewBox="0 0 ${L} ${A}">${partes.join("")}</svg>`;
}

const FONTES = ["NotoSans_400Regular.ttf", "NotoSans_700Bold.ttf"].map((f) => join(__dirname, "..", "..", "..", "assets", "fonts", f));

// PNG em 2x (nítido no Word e no PDF)
export function pngDoGrafico(g: GraficoImg): Buffer {
  const svg = svgDoGrafico(g);
  const r = new Resvg(svg, { fitTo: { mode: "zoom", value: 2 }, font: { fontFiles: FONTES, loadSystemFonts: false, defaultFontFamily: FONTE }, background: "white" });
  return Buffer.from(r.render().asPng());
}
