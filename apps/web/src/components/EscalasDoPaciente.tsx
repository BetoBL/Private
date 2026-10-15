import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type EscalaCompleta, type EscalaResumo, type ResultadoEscala, type SolicitacaoEscala } from "../lib/api";

// Aba "Escalas" da ficha: biblioteca de escalas de triagem, pedido ao paciente (prazo e recorrência) e resultados com gráfico.
// O paciente responde pelo link do Diário e nunca vê a pontuação.

const COR = { verde: "#5E9E6E", amarelo: "#D9A441", laranja: "#D9822B", vermelho: "#C0533F" } as const;
const FREQ: Record<string, string> = { UNICA: "uma vez", SEMANAL: "toda semana", QUINZENAL: "a cada 2 semanas", MENSAL: "todo mês" };
const dataBr = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString("pt-BR");
const hojeIso = () => new Date().toLocaleDateString("sv-SE");

function Selo({ f }: { f: { rotulo: string; cor: keyof typeof COR } }) {
  return <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ background: COR[f.cor] }}>{f.rotulo}</span>;
}

// Gráfico de linhas simples: uma série por subescala (ou o total), com linhas de corte quando houver.
function Grafico({ pontos, series, max, cortes }: { pontos: Array<{ data: string; valores: Record<string, number> }>; series: Array<{ chave: string; rotulo: string; cor: string }>; max: number; cortes?: number[] }) {
  const L = 36, R = 12, T = 12, B = 28, W = 560, H = 190;
  const x = (i: number) => (pontos.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (pontos.length - 1));
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Evolução da pontuação ao longo do tempo">
      {[0, max].map((v) => <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="currentColor" strokeOpacity="0.12" /><text x={L - 6} y={y(v) + 4} fontSize="10" textAnchor="end" fill="currentColor" opacity="0.5">{Math.round(v)}</text></g>)}
      {(cortes ?? []).map((c) => <g key={c}><line x1={L} x2={W - R} y1={y(c)} y2={y(c)} stroke="#C0533F" strokeOpacity="0.45" strokeDasharray="4 3" /><text x={W - R} y={y(c) - 3} fontSize="9" textAnchor="end" fill="#C0533F" opacity="0.8">corte {c}</text></g>)}
      {series.map((s) => (
        <g key={s.chave}>
          {pontos.length > 1 && <polyline fill="none" stroke={s.cor} strokeWidth="2" points={pontos.map((p, i) => `${x(i)},${y(p.valores[s.chave] ?? 0)}`).join(" ")} />}
          {pontos.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.valores[s.chave] ?? 0)} r="4" fill={s.cor}><title>{`${s.rotulo}: ${p.valores[s.chave]} (${p.data})`}</title></circle>)}
        </g>
      ))}
      {pontos.map((p, i) => <text key={i} x={x(i)} y={H - 8} fontSize="10" textAnchor="middle" fill="currentColor" opacity="0.55">{p.data.slice(0, 5)}</text>)}
    </svg>
  );
}

export function EscalasDoPaciente({ pacienteId }: { pacienteId: string }) {
  const [catalogo, setCatalogo] = useState<EscalaResumo[]>([]);
  const [lista, setLista] = useState<SolicitacaoEscala[]>([]);
  const [completas, setCompletas] = useState<Record<string, EscalaCompleta>>({});
  const [verPerguntas, setVerPerguntas] = useState<string | null>(null);
  const [pedindo, setPedindo] = useState<string | null>(null);
  const [prazo, setPrazo] = useState(hojeIso());
  const [frequencia, setFrequencia] = useState("UNICA");
  const [detalhe, setDetalhe] = useState<Awaited<ReturnType<typeof api.detalheEscala>> | null>(null);
  const [linkAtivo, setLinkAtivo] = useState<boolean | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const falha = (e: unknown) => setErro((e as Error).message);
  const carregar = useCallback(() => { api.escalasDoPaciente(pacienteId).then(setLista).catch(falha); }, [pacienteId]);
  useEffect(() => { api.catalogoEscalas().then(setCatalogo).catch(falha); }, []);
  useEffect(() => { carregar(); api.acessoDiario(pacienteId).then((a) => setLinkAtivo(a.ativo)).catch(() => setLinkAtivo(null)); }, [carregar, pacienteId]);

  async function abrirPerguntas(codigo: string) {
    if (verPerguntas === codigo) { setVerPerguntas(null); return; }
    if (!completas[codigo]) { try { const e = await api.escalaCompleta(codigo); setCompletas((c) => ({ ...c, [codigo]: e })); } catch (x) { falha(x); return; } }
    setVerPerguntas(codigo);
  }
  async function pedir() {
    if (!pedindo) return;
    setErro(null);
    try { await api.solicitarEscala({ pacienteId, escala: pedindo, prazo, frequencia }); setPedindo(null); setFrequencia("UNICA"); setAviso("Escala pedida. O paciente a vê no link do Diário a partir do prazo."); carregar(); } catch (x) { falha(x); }
  }
  async function abrirResultado(id: string) { try { setDetalhe(await api.detalheEscala(id)); } catch (x) { falha(x); } }
  async function apagar(s: SolicitacaoEscala) { if (!window.confirm("Apagar esta solicitação? Ela sai da lista.")) return; try { await api.apagarSolicitacaoEscala(s.id); carregar(); } catch (x) { falha(x); } }

  const porEscala = useMemo(() => {
    const m: Record<string, SolicitacaoEscala[]> = {};
    for (const s of lista) (m[s.escala] ??= []).push(s);
    return m;
  }, [lista]);
  const nomeDe = (codigo: string) => catalogo.find((c) => c.codigo === codigo);

  return (
    <div className="space-y-6">
      {erro && <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
      {aviso && <div className="rounded-lg border border-sage-deep/30 bg-sage-deep/10 px-4 py-3 text-sm text-sage-deep">{aviso}</div>}
      {linkAtivo === false && <div className="rounded-lg border border-clay/40 bg-clay/10 px-4 py-3 text-sm text-ink/75">O paciente responde pelo link do Diário, que ainda não foi gerado. Gere-o na aba <b>Diário</b> para ele ver as escalas pedidas.</div>}

      <section className="rounded-xl border border-mist bg-white p-5">
        <h3 className="font-serif text-lg text-ink">Biblioteca de escalas</h3>
        <p className="mb-4 text-sm text-ink/55">Instrumentos de triagem de uso livre. O resultado é <b>triagem, não diagnóstico</b>, e o paciente não vê a pontuação.</p>
        <div className="grid gap-3 md:grid-cols-3">
          {catalogo.map((e) => (
            <div key={e.codigo} className="flex flex-col rounded-xl border border-mist p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-sage-deep">{e.construto}</div>
              <div className="mt-0.5 font-serif text-lg text-ink">{e.sigla}</div>
              <div className="text-xs text-ink/55">{e.itens} itens · {e.tempo} · {e.uso}</div>
              <div className="mt-2 text-xs text-ink/50">Sugestão: {e.frequenciaSugerida.toLowerCase()}.</div>
              <div className="mt-3 flex gap-2">
                <button className="rounded-lg border border-mist px-3 py-1.5 text-xs font-semibold text-ink/70" onClick={() => abrirPerguntas(e.codigo)}>{verPerguntas === e.codigo ? "Ocultar" : "Ver perguntas"}</button>
                <button className="rounded-lg bg-sage-deep px-3 py-1.5 text-xs font-semibold text-paper" onClick={() => { setPedindo(e.codigo); setAviso(null); }}>Solicitar</button>
              </div>
            </div>
          ))}
        </div>
        {verPerguntas && completas[verPerguntas] && (
          <div className="mt-4 rounded-xl bg-paper p-4 text-sm">
            <div className="font-semibold text-ink">{completas[verPerguntas].nome}</div>
            <p className="mt-1 text-ink/65">{completas[verPerguntas].instrucao}</p>
            <p className="mt-1 text-xs text-ink/50">Respostas: {completas[verPerguntas].opcoes.map((o) => `${o.valor} = ${o.rotulo}`).join(" · ")}</p>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-ink/75">{completas[verPerguntas].itens.map((i) => <li key={i.id}>{i.texto}</li>)}</ol>
            <p className="mt-3 text-xs text-ink/45">Fonte: {catalogo.find((c) => c.codigo === verPerguntas)?.fonte}</p>
          </div>
        )}
        {pedindo && (
          <div className="mt-4 rounded-xl border border-sage-deep/30 bg-sage-deep/5 p-4">
            <div className="mb-3 text-sm font-semibold text-ink">Pedir {nomeDe(pedindo)?.sigla} ao paciente</div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm"><span className="mb-1 block text-xs font-semibold text-ink/60">A partir de</span><input type="date" min={hojeIso()} value={prazo} onChange={(e) => setPrazo(e.target.value)} className="rounded-lg border border-mist px-3 py-2" /></label>
              <label className="text-sm"><span className="mb-1 block text-xs font-semibold text-ink/60">Repetir</span>
                <select value={frequencia} onChange={(e) => setFrequencia(e.target.value)} className="rounded-lg border border-mist px-3 py-2">{Object.entries(FREQ).map(([k, v]) => <option key={k} value={k}>{k === "UNICA" ? "Apenas uma vez" : v}</option>)}</select>
              </label>
              <button className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper" onClick={pedir}>Enviar pedido</button>
              <button className="text-sm text-ink/55 hover:underline" onClick={() => setPedindo(null)}>Cancelar</button>
            </div>
          </div>
        )}
      </section>

      {Object.keys(porEscala).length === 0 && <p className="rounded-xl border border-dashed border-mist py-10 text-center text-sm text-ink/45">Nenhuma escala pedida a este paciente ainda.</p>}
      {Object.entries(porEscala).map(([codigo, itens]) => {
        const info = nomeDe(codigo);
        const feitas = itens.filter((s) => s.status === "CONCLUIDA" && s.pontuacao).sort((a, b) => (a.respondidaEm ?? "").localeCompare(b.respondidaEm ?? ""));
        const temSub = feitas.some((s) => s.pontuacao!.subescalas.length > 0);
        const series = temSub ? (feitas[0]?.pontuacao?.subescalas ?? []).map((s, i) => ({ chave: s.chave, rotulo: s.rotulo, cor: ["#5B7FA6", "#D9822B", "#C0533F"][i % 3] })) : [{ chave: "total", rotulo: "Total", cor: "#2F5D50" }];
        const pontos = feitas.map((s) => ({ data: dataBr(s.respondidaEm!), valores: temSub ? Object.fromEntries(s.pontuacao!.subescalas.map((x) => [x.chave, x.valor])) : { total: s.pontuacao!.total ?? 0 } }));
        const cortes = codigo === "PHQ9" ? [5, 10, 15, 20] : codigo === "GAD7" ? [5, 10, 15] : undefined;
        const max = codigo === "PHQ9" ? 27 : codigo === "GAD7" ? 21 : 42;
        return (
          <section key={codigo} className="rounded-xl border border-mist bg-white p-5">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-serif text-lg text-ink">{info?.sigla ?? codigo} <span className="text-sm text-ink/50">· {info?.construto}</span></h3><span className="text-xs text-ink/45">Triagem, não diagnóstico</span></div>
            {feitas.length > 0 && <div className="mb-4 text-ink"><Grafico pontos={pontos} series={series} max={max} cortes={cortes} />{series.length > 1 && <div className="mt-1 flex gap-4 text-xs text-ink/60">{series.map((s) => <span key={s.chave}><span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: s.cor }} />{s.rotulo}</span>)}</div>}</div>}
            <ul className="divide-y divide-mist">
              {[...itens].sort((a, b) => b.prazo.localeCompare(a.prazo)).map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                  <span className="w-28 text-ink/60">{s.status === "CONCLUIDA" && s.respondidaEm ? dataBr(s.respondidaEm) : `desde ${dataBr(s.prazo)}`}</span>
                  {s.status === "PENDENTE" ? <span className="rounded-full bg-clay/15 px-2.5 py-0.5 text-xs font-semibold text-clay">aguardando o paciente</span> : (
                    <>
                      {s.pontuacao?.faixa && <><span className="font-semibold text-ink">{s.pontuacao.total}</span><Selo f={s.pontuacao.faixa} /></>}
                      {s.pontuacao?.subescalas.map((x) => <span key={x.chave} className="flex items-center gap-1 text-xs text-ink/70">{x.rotulo.slice(0, 3)} {x.valor}<Selo f={x.faixa} /></span>)}
                      {s.alertaRisco && <span className="rounded-full bg-ember px-2.5 py-0.5 text-xs font-bold text-white">atenção: item de risco marcado</span>}
                    </>
                  )}
                  <span className="text-xs text-ink/40">{s.frequencia !== "UNICA" ? `repete ${FREQ[s.frequencia]}` : ""}</span>
                  <span className="ml-auto flex gap-3">
                    {s.status === "CONCLUIDA" && <button className="text-xs font-semibold text-sage-deep hover:underline" onClick={() => abrirResultado(s.id)}>ver respostas</button>}
                    <button className="text-xs text-ink/40 hover:text-ember" onClick={() => apagar(s)}>apagar</button>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {detalhe && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink/40 p-4" onClick={() => setDetalhe(null)}>
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 flex items-center justify-between"><h3 className="font-serif text-xl text-ink">{detalhe.escala.sigla}</h3><button className="text-sm text-ink/50" onClick={() => setDetalhe(null)}>fechar</button></div>
            <p className="mb-3 text-xs text-ink/50">Respondida em {detalhe.respondidaEm ? new Date(detalhe.respondidaEm).toLocaleString("pt-BR") : "-"}. {detalhe.escala.opcoes.map((o) => `${o.valor} = ${o.rotulo}`).join(" · ")}</p>
            {detalhe.alertaRisco && <div className="mb-3 rounded-lg bg-ember/10 px-3 py-2 text-sm text-ember">Houve resposta em item de risco. Avalie com o paciente o quanto antes; esta escala não substitui a avaliação clínica.</div>}
            <ol className="space-y-2">
              {detalhe.escala.itens.map((i) => {
                const v = detalhe.respostas?.[String(i.id)];
                const critico = detalhe.alertaRisco && (i.id === 9 && detalhe.escala.codigo === "PHQ9" || i.id === 21 && detalhe.escala.codigo === "DASS21") && (v ?? 0) > 0;
                return <li key={i.id} className={`flex gap-3 rounded-lg px-3 py-2 text-sm ${critico ? "bg-ember/10" : "bg-paper"}`}><span className="w-6 text-ink/40">{i.id}</span><span className="flex-1 text-ink/80">{i.texto}</span><span className="font-semibold text-ink">{v ?? "-"}</span></li>;
              })}
            </ol>
            {detalhe.pontuacao && <ResumoPontuacao r={detalhe.pontuacao} />}
          </div>
        </div>
      )}
    </div>
  );
}

function ResumoPontuacao({ r }: { r: ResultadoEscala }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-mist px-4 py-3 text-sm">
      {r.faixa && <><span className="text-ink/60">Total</span><span className="font-semibold text-ink">{r.total}</span><Selo f={r.faixa} /></>}
      {r.subescalas.map((x) => <span key={x.chave} className="flex items-center gap-1">{x.rotulo} <b>{x.valor}</b> <Selo f={x.faixa} /></span>)}
    </div>
  );
}
