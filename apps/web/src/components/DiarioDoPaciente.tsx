import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, type AcessoDiario, type CartaoDiario, type CatalogoDiario, type ConfigDiario, type ResumoDiario } from "../lib/api";
import { corDaFamilia, ROTULO_INTENSIDADE, ROTULO_TENDENCIA } from "../lib/diarioCores";

// Aba "Diário" da ficha: o(a) psicólogo(a) gera o link do paciente, acompanha os cartões e marca o que já foi conversado.

const dia = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`);
const fmt = (iso: string) => dia(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

export function DiarioDoPaciente({ pacienteId }: { pacienteId: string }) {
  const [acesso, setAcesso] = useState<AcessoDiario | null>(null);
  const [dados, setDados] = useState<{ cartoes: CartaoDiario[]; resumo: ResumoDiario } | null>(null);
  const [cat, setCat] = useState<CatalogoDiario | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [dias, setDias] = useState(30);
  const [config, setConfig] = useState<ConfigDiario | null>(null);
  const [configAberta, setConfigAberta] = useState(false);
  const [salvoConfig, setSalvoConfig] = useState(false);
  const rolagem = useRef<HTMLDivElement>(null);

  const carregar = useCallback(() => {
    api.acessoDiario(pacienteId).then(setAcesso).catch((e) => setErro(e.message));
    api.cartoesDoPaciente(pacienteId, dias).then(setDados).catch((e) => setErro(e.message));
  }, [pacienteId, dias]);
  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => { api.catalogoDiario().then(setCat).catch(() => undefined); }, []);
  useEffect(() => { api.configDiario(pacienteId).then(setConfig).catch(() => undefined); }, [pacienteId]);
  async function salvarConfig() { if (!config) return; setErro(null); try { setConfig(await api.salvarConfigDiario(pacienteId, config)); setSalvoConfig(true); setTimeout(() => setSalvoConfig(false), 2500); } catch (e) { setErro((e as Error).message); } }

  const nome = (lista: Array<{ chave: string; rotulo: string }> | undefined, k?: string | null) => lista?.find((o) => o.chave === k)?.rotulo ?? "";
  const acao = async (f: () => Promise<unknown>) => { setErro(null); try { await f(); carregar(); } catch (e) { setErro((e as Error).message); } };

  async function copiar() {
    if (!acesso?.link) return;
    try { await navigator.clipboard.writeText(acesso.link); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { window.prompt("Copie o link:", acesso.link); }
  }

  // Faixa dos últimos dias: uma coluna por dia, com um ponto por registro na cor da família
  const faixa = useMemo(() => {
    const hoje = new Date(); hoje.setHours(12, 0, 0, 0);
    return Array.from({ length: Math.min(dias, 30) }, (_, i) => {
      const d = new Date(hoje); d.setDate(hoje.getDate() - (Math.min(dias, 30) - 1 - i));
      const iso = d.toLocaleDateString("sv-SE");
      return { iso, cartoes: (dados?.cartoes ?? []).filter((c) => c.ocorridoEm.slice(0, 10) === iso) };
    });
  }, [dados, dias]);

  // a faixa abre mostrando os dias mais recentes (à direita)
  useEffect(() => { if (rolagem.current) rolagem.current.scrollLeft = rolagem.current.scrollWidth; }, [dados]);

  const r = dados?.resumo;
  return (
    <div className="space-y-6">
      {erro && <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}

      <section className="rounded-xl border border-mist bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-lg text-ink">Link do paciente</h3>
            <p className="mt-0.5 max-w-xl text-sm text-ink/60">O paciente abre o link no celular, sem senha, e faz o diário entre as consultas. Gerar um novo link desativa o anterior.</p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper" onClick={() => acao(() => api.gerarAcessoDiario(pacienteId))}>{acesso?.ativo ? "Gerar novo link" : "Gerar link"}</button>
            {acesso?.ativo && <button className="rounded-lg border border-mist px-4 py-2 text-sm font-semibold text-ink/70" onClick={() => acao(() => api.revogarAcessoDiario(pacienteId))}>Desativar</button>}
          </div>
        </div>
        {acesso?.ativo && acesso.link && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input readOnly value={acesso.link} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 rounded-lg border border-mist bg-paper px-3 py-2 text-sm" />
            <button className="rounded-lg border border-sage-deep px-4 py-2 text-sm font-semibold text-sage-deep" onClick={copiar}>{copiado ? "Copiado" : "Copiar"}</button>
            <span className="w-full text-xs text-ink/45">{acesso.ultimoUsoEm ? `Último acesso do paciente: ${new Date(acesso.ultimoUsoEm).toLocaleString("pt-BR")}` : "O paciente ainda não abriu este link."}</span>
          </div>
        )}
        {acesso && !acesso.ativo && <p className="mt-3 text-sm text-ink/50">Nenhum link ativo.</p>}
      </section>

      {config && cat && (
        <section className="rounded-xl border border-mist bg-white p-5">
          <button className="flex w-full items-center justify-between text-left" onClick={() => setConfigAberta(!configAberta)}>
            <span><span className="block font-serif text-lg text-ink">Personalizar o diário deste paciente</span><span className="text-sm text-ink/55">Escolha as etapas opcionais e as emoções oferecidas. Vale para os próximos registros.</span></span>
            <span className="text-sm font-semibold text-sage-deep">{configAberta ? "fechar" : "abrir"}</span>
          </button>
          {configAberta && (
            <div className="mt-4 space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                {([["pesos", "O que pesou no dia", "Sono, alimentação, sobrecarga, atrito e outros pesos.", "Automático: só quando a emoção é difícil e forte (4 ou 5)."], ["impulso", "Vontades difíceis", "Útil para impulsividade, uso de substâncias e raiva: o que sentiu vontade de fazer e o que fez.", "Automático: o paciente é perguntado nas emoções difíceis e a etapa só abre se veio vontade."]] as const).map(([chave, titulo, ajuda, auto]) => (
                  <label key={chave} className="block rounded-lg border border-mist p-3">
                    <span className="block text-sm font-semibold text-ink">{titulo}</span><span className="mb-2 block text-xs text-ink/55">{ajuda}</span>
                    <select className="w-full rounded-lg border border-mist bg-white px-2 py-1.5 text-sm" value={config.etapas[chave]} onChange={(e) => setConfig({ ...config, etapas: { ...config.etapas, [chave]: e.target.value as "auto" | "sempre" | "nunca" } })}>
                      <option value="auto">Automático (recomendado)</option><option value="sempre">Sempre perguntar</option><option value="nunca">Nunca perguntar</option>
                    </select>
                    {config.etapas[chave] === "auto" && <span className="mt-1.5 block text-[11px] text-ink/45">{auto}</span>}
                  </label>
                ))}
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold text-ink">Emoções oferecidas <span className="font-normal text-ink/50">(desmarque as que não quer mostrar)</span></div>
                {cat.familias.map((f) => (
                  <div key={f.chave} className="mb-2"><div className="mb-1 text-xs font-bold uppercase tracking-wide text-ink/45">{f.rotulo}</div>
                    <div className="flex flex-wrap gap-2">{cat.emocoes.filter((e) => e.familia === f.chave).map((e) => { const oculta = config.emocoesOcultas.includes(e.chave); return <label key={e.chave} className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${oculta ? "border-mist text-ink/35 line-through" : "border-sage-deep/40 bg-sage-deep/5 text-ink"}`}><input type="checkbox" checked={!oculta} onChange={() => setConfig({ ...config, emocoesOcultas: oculta ? config.emocoesOcultas.filter((x) => x !== e.chave) : [...config.emocoesOcultas, e.chave] })} />{e.rotulo}</label>; })}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3"><button className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper" onClick={salvarConfig}>Salvar</button>{salvoConfig && <span className="text-sm text-sage-deep">✓ Salvo</span>}</div>
            </div>
          )}
        </section>
      )}

      {r && (
        <section className="rounded-xl border border-mist bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-serif text-lg text-ink">Como tem passado</h3>
            <select value={dias} onChange={(e) => setDias(Number(e.target.value))} className="rounded-lg border border-mist px-2 py-1.5 text-sm">
              <option value={14}>Últimos 14 dias</option><option value={30}>Últimos 30 dias</option><option value={90}>Últimos 90 dias</option>
            </select>
          </div>
          {r.total === 0 ? <p className="mt-3 text-sm text-ink/50">Ainda não há registros neste período.</p> : (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-paper p-3"><div className="text-2xl font-semibold text-ink">{r.total}</div><div className="text-xs text-ink/55">{r.total === 1 ? "registro" : "registros"} · {r.ultimos7.diasComRegistro} {r.ultimos7.diasComRegistro === 1 ? "dia" : "dias"} com registro na última semana</div></div>
                <div className="rounded-lg bg-paper p-3"><div className="text-sm font-semibold text-ink">{r.tendencia ? ROTULO_TENDENCIA[r.tendencia] : "Sem base para comparar"}</div><div className="text-xs text-ink/55">últimos 7 dias × 7 anteriores</div></div>
                <div className="rounded-lg bg-paper p-3"><div className="text-2xl font-semibold text-ink">{r.paraLevar}</div><div className="text-xs text-ink/55">para levar à sessão</div></div>
              </div>
              <div ref={rolagem} className="mt-4 overflow-x-auto">
                <div className="flex min-w-max items-end gap-1">
                  {faixa.map((d) => (
                    <div key={d.iso} className="flex w-6 flex-col items-center gap-1" title={d.iso}>
                      <div className="flex h-24 flex-col-reverse justify-start gap-0.5">
                        {d.cartoes.map((c) => <span key={c.id} title={`${nome(cat?.emocoes, c.emocao)} · ${ROTULO_INTENSIDADE[c.intensidade]}`} className="w-4 rounded-sm" style={{ height: `${c.intensidade * 4 + 4}px`, background: corDaFamilia(c.familia) }} />)}
                      </div>
                      <span className="text-[9px] text-ink/40">{d.iso.slice(8)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-2 text-xs text-ink/45">Cada barra é um registro: a altura é a intensidade e a cor, a família da emoção.</p>
              {r.porEmocao.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{r.porEmocao.slice(0, 6).map((e) => <span key={e.emocao} className="rounded-full bg-paper px-3 py-1 text-xs text-ink/70">{nome(cat?.emocoes, e.emocao) || e.emocao} · {e.quantidade}</span>)}</div>}
            </>
          )}
        </section>
      )}

      {dados && dados.cartoes.length > 0 && (
        <section className="rounded-xl border border-mist bg-white p-5">
          <h3 className="mb-3 font-serif text-lg text-ink">Registros</h3>
          <ul className="divide-y divide-mist">
            {dados.cartoes.map((c) => (
              <li key={c.id} className="py-3" onMouseEnter={() => { if (!c.lidoEm) api.marcarCartaoLido(c.id).catch(() => undefined); }}>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="h-3 w-3 rounded-full" style={{ background: corDaFamilia(c.familia) }} />
                  <b className="text-ink">{nome(cat?.emocoes, c.emocao) || c.emocao}</b>
                  <span className="text-ink/55">{ROTULO_INTENSIDADE[c.intensidade]}</span>
                  <span className="text-ink/45">· {fmt(c.ocorridoEm)}</span>
                  {c.levarParaSessao && <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${c.conversadoEm ? "bg-mist text-ink/50" : "bg-sage-deep/15 text-sage-deep"}`}>{c.conversadoEm ? "conversado" : "levar para a sessão"}</span>}
                  {c.levarParaSessao && <button className="ml-auto text-xs font-semibold text-sage-deep hover:underline" onClick={() => acao(() => api.marcarCartaoConversado(c.id, !c.conversadoEm))}>{c.conversadoEm ? "reabrir" : "marcar como conversado"}</button>}
                </div>
                <div className="mt-1 space-y-0.5 text-sm text-ink/65">
                  {c.contexto && <div>Onde: {nome(cat?.contextos, c.contexto)}{c.notaContexto ? ` — ${c.notaContexto}` : ""}</div>}
                  {c.pesos?.length > 0 && <div>O que pesou: {c.pesos.map((k) => nome(cat?.pesosDoDia, k)).filter(Boolean).join(", ")}</div>}
                  {c.impulso && c.impulso !== "nenhum" && <div>Vontade difícil: {nome(cat?.impulsos, c.impulso)}{c.acaoImpulso ? ` · ${nome(cat?.acoesDoImpulso, c.acaoImpulso).toLowerCase()}` : ""}</div>}
                  {(c.primeiraAcao || c.acoesQueAjudaram.length > 0) && <div>Cuidado: {[nome(cat?.primeirasAcoes, c.primeiraAcao), ...c.acoesQueAjudaram.map((k) => nome(cat?.acoesQueAjudaram, k))].filter(Boolean).join(", ")}{c.ajudou ? ` · ajudou: ${nome(cat?.ajudou, c.ajudou).toLowerCase()}` : ""}{c.notaCuidado ? ` — ${c.notaCuidado}` : ""}</div>}
                  {c.fechamento && <div>Fechamento: {nome(cat?.fechamentos, c.fechamento)}</div>}
                  {c.notaFinal && <div>Nota: {c.notaFinal}</div>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
