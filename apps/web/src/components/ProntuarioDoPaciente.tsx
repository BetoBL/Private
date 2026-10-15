import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, type CatalogoProntuario, type Evolucao, type ItemContinuidade, type VersaoEvolucao } from "../lib/api";

// Aba "Prontuário" da ficha: evolução de cada sessão (modelos por profissão), duas folhas (anotações privadas + prontuário)
// e a continuidade do cuidado (planos de ação e tópicos para a próxima sessão).

const aLocal = (iso: string) => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
const dataBr = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const trecho = (e: Evolucao) => {
  const campos = e.campos ? Object.values(e.campos).map((v) => (Array.isArray(v) ? v.join("; ") : v)).filter(Boolean).join(" · ") : "";
  return ((e.evolucao ?? "").trim() || campos || "Sem texto ainda").slice(0, 110);
};

export function ProntuarioDoPaciente({ pacienteId }: { pacienteId: string }) {
  const [cat, setCat] = useState<CatalogoProntuario | null>(null);
  const [lista, setLista] = useState<Evolucao[]>([]);
  const [aberta, setAberta] = useState<Evolucao | null>(null);
  const [itens, setItens] = useState<ItemContinuidade[]>([]);
  const [concluidos, setConcluidos] = useState<ItemContinuidade[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [estado, setEstado] = useState<"salvo" | "salvando" | "alterado">("salvo");
  const [versoes, setVersoes] = useState<VersaoEvolucao[] | null>(null);
  const [novoModelo, setNovoModelo] = useState("");
  const [novoItem, setNovoItem] = useState<{ tipo: "PLANO" | "TOPICO"; texto: string }>({ tipo: "PLANO", texto: "" });
  const [verConcluidos, setVerConcluidos] = useState(false);
  const [marcadas, setMarcadas] = useState<string[]>([]);
  const [gerando, setGerando] = useState(false);
  const [params, setParams] = useSearchParams();
  const aberturaFeita = useRef(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendente = useRef<Partial<{ modelo: string; dataHora: string; campos: Record<string, string | string[]>; anotacoes: string | null; evolucao: string | null }>>({});

  const falha = (e: unknown) => setErro((e as Error).message);
  const carregarLista = useCallback(() => api.listarEvolucoes(pacienteId).then(setLista).catch(falha), [pacienteId]);
  const carregarItens = useCallback(() => {
    api.continuidade(pacienteId).then(setItens).catch(falha);
    api.continuidade(pacienteId, "CONCLUIDO").then(setConcluidos).catch(falha);
  }, [pacienteId]);
  useEffect(() => { api.catalogoProntuario().then((c) => { setCat(c); setNovoModelo(c.modelos[0]?.chave ?? "LIVRE"); }).catch(falha); }, []);
  useEffect(() => { carregarLista(); carregarItens(); setAberta(null); }, [carregarLista, carregarItens]);

  // Vindo da agenda (?evento=...&inicio=...): abre a evolução já ligada àquele compromisso, ou cria uma no horário dele.
  useEffect(() => {
    const evento = params.get("evento");
    if (!evento || !cat || aberturaFeita.current) return;
    aberturaFeita.current = true;
    (async () => {
      try {
        const existentes = await api.listarEvolucoes(pacienteId);
        setLista(existentes);
        const ja = existentes.find((e) => e.eventoAgendaId === evento);
        if (ja) { setAberta(ja); } else {
          const inicio = params.get("inicio");
          const e = await api.criarEvolucao({ pacienteId, modelo: cat.modelos[0]?.chave ?? "LIVRE", eventoAgendaId: evento, ...(inicio ? { dataHora: new Date(inicio).toISOString() } : {}) });
          setLista([e, ...existentes]); setAberta(e);
        }
      } catch (x) { setErro((x as Error).message); }
      carregarLista();
      const p = new URLSearchParams(params); p.delete("evento"); p.delete("inicio"); setParams(p, { replace: true });
    })();
  }, [params, cat, pacienteId, setParams, carregarLista]);

  const modelos = cat?.modelos ?? [];
  const modeloDe = (chave: string) => modelos.find((m) => m.chave === chave);

  async function salvarAgora() {
    if (temporizador.current) { clearTimeout(temporizador.current); temporizador.current = null; }
    if (!aberta || Object.keys(pendente.current).length === 0) return;
    const envio = pendente.current; pendente.current = {};
    setEstado("salvando");
    try {
      const novo = await api.salvarEvolucao(aberta.id, envio);
      setAberta((a) => (a && a.id === novo.id ? { ...a, status: novo.status, totalVersoes: novo.totalVersoes, atualizadoEm: novo.atualizadoEm } : a));
      setLista((l) => l.map((e) => (e.id === novo.id ? novo : e)));
      setEstado(Object.keys(pendente.current).length ? "alterado" : "salvo");
    } catch (e) { pendente.current = { ...envio, ...pendente.current }; setEstado("alterado"); falha(e); }
  }
  function alterar(parte: typeof pendente.current, local: Partial<Evolucao>) {
    if (!aberta) return;
    pendente.current = { ...pendente.current, ...parte };
    setAberta({ ...aberta, ...local });
    setEstado("alterado");
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(salvarAgora, 1200);
  }
  const setCampo = (chave: string, valor: string | string[]) => alterar({ campos: { ...(aberta?.campos ?? {}), ...(pendente.current.campos ?? {}), [chave]: valor } }, { campos: { ...(aberta?.campos ?? {}), [chave]: valor } });

  async function abrir(e: Evolucao) { await salvarAgora(); setErro(null); setVersoes(null); setAberta(e); setEstado("salvo"); }
  async function nova() {
    await salvarAgora(); setErro(null);
    try { const e = await api.criarEvolucao({ pacienteId, modelo: novoModelo || "LIVRE" }); setLista((l) => [e, ...l]); setAberta(e); setVersoes(null); setEstado("salvo"); } catch (x) { falha(x); }
  }
  async function trocarModelo(modelo: string) { await salvarAgora(); if (!aberta) return; try { const e = await api.salvarEvolucao(aberta.id, { modelo }); setAberta(e); setLista((l) => l.map((x) => (x.id === e.id ? e : x))); } catch (x) { falha(x); } }
  async function finalizar() { await salvarAgora(); if (!aberta) return; try { const e = await api.finalizarEvolucao(aberta.id); setAberta(e); setLista((l) => l.map((x) => (x.id === e.id ? e : x))); setErro(null); } catch (x) { falha(x); } }
  async function reabrir() { if (!aberta) return; try { const e = await api.reabrirEvolucao(aberta.id); setAberta(e); setLista((l) => l.map((x) => (x.id === e.id ? e : x))); } catch (x) { falha(x); } }
  async function excluir() {
    if (!aberta || !window.confirm("Excluir esta evolução? Ela sai da lista, mas pode ser recuperada.")) return;
    try { await api.excluirEvolucao(aberta.id); setLista((l) => l.filter((x) => x.id !== aberta.id)); setAberta(null); } catch (x) { falha(x); }
  }
  async function gerarPdf() {
    setGerando(true); setErro(null);
    try { const r = await api.baixarProntuario(pacienteId, marcadas); const u = URL.createObjectURL(r.blob); const a = document.createElement("a"); a.href = u; a.download = r.filename; a.click(); URL.revokeObjectURL(u); } catch (x) { falha(x); } finally { setGerando(false); }
  }
  const alternarMarca = (id: string) => setMarcadas((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  async function verVersoes() { if (!aberta) return; try { setVersoes(await api.versoesEvolucao(aberta.id)); } catch (x) { falha(x); } }

  async function adicionarItem() {
    const texto = novoItem.texto.trim(); if (!texto) return;
    try { await api.criarItemContinuidade({ pacienteId, tipo: novoItem.tipo, texto, evolucaoId: aberta?.id ?? null }); setNovoItem({ ...novoItem, texto: "" }); carregarItens(); } catch (x) { falha(x); }
  }
  const alternarItem = (i: ItemContinuidade) => api.editarItemContinuidade(i.id, { status: i.status === "ANDAMENTO" ? "CONCLUIDO" : "ANDAMENTO" }).then(carregarItens).catch(falha);
  const removerItem = (i: ItemContinuidade) => api.excluirItemContinuidade(i.id).then(carregarItens).catch(falha);

  const modelo = aberta ? modeloDe(aberta.modelo) : undefined;
  const finalizada = aberta?.status === "FINALIZADA";
  const meu = aberta ? !aberta.anotacoesPrivadas : false;
  const Lista = ({ tipo, titulo, ajuda }: { tipo: "PLANO" | "TOPICO"; titulo: string; ajuda: string }) => {
    const ativos = itens.filter((i) => i.tipo === tipo);
    return (
      <div>
        <h4 className="text-sm font-semibold text-ink">{titulo}</h4><p className="mb-2 text-xs text-ink/50">{ajuda}</p>
        {ativos.length === 0 && <p className="text-xs text-ink/40">Nada em andamento.</p>}
        <ul className="space-y-1.5">
          {ativos.map((i) => (
            <li key={i.id} className="flex items-start gap-2 rounded-lg bg-paper px-3 py-2 text-sm">
              <input type="checkbox" className="mt-1" checked={false} onChange={() => alternarItem(i)} title="Marcar como concluído" />
              <span className="flex-1 text-ink/80">{i.texto}</span>
              <button className="text-xs text-ink/40 hover:text-ember" onClick={() => removerItem(i)}>remover</button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {erro && <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}

      <section className="rounded-xl border border-mist bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div><h3 className="font-serif text-lg text-ink">Continuidade do cuidado</h3><p className="text-sm text-ink/55">O que atravessa as sessões até ser concluído.</p></div>
          {concluidos.length > 0 && <button className="text-xs font-semibold text-sage-deep hover:underline" onClick={() => setVerConcluidos(!verConcluidos)}>{verConcluidos ? "ocultar concluídos" : `ver concluídos (${concluidos.length})`}</button>}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Lista tipo="PLANO" titulo="Planos de ação" ajuda="Acordos e experimentos em andamento." />
          <Lista tipo="TOPICO" titulo="Para a próxima sessão" ajuda="Assuntos que merecem ser retomados." />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <select className="rounded-lg border border-mist px-2 py-2 text-sm" value={novoItem.tipo} onChange={(e) => setNovoItem({ ...novoItem, tipo: e.target.value as "PLANO" | "TOPICO" })}><option value="PLANO">Plano de ação</option><option value="TOPICO">Próxima sessão</option></select>
          <input className="min-w-0 flex-1 rounded-lg border border-mist px-3 py-2 text-sm" placeholder="Escreva e tecle Enter" maxLength={1000} value={novoItem.texto} onChange={(e) => setNovoItem({ ...novoItem, texto: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") adicionarItem(); }} />
          <button className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper" onClick={adicionarItem}>Adicionar</button>
        </div>
        {verConcluidos && (
          <ul className="mt-4 space-y-1 border-t border-mist pt-3">
            {concluidos.map((i) => (
              <li key={i.id} className="flex items-center gap-2 text-sm text-ink/50">
                <input type="checkbox" checked readOnly={false} onChange={() => alternarItem(i)} title="Reabrir" /><span className="flex-1 line-through">{i.texto}</span>
                <span className="text-xs">{i.concluidoEm ? new Date(i.concluidoEm).toLocaleDateString("pt-BR") : ""}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <aside className="rounded-xl border border-mist bg-white p-4">
          <div className="mb-3 flex gap-2">
            <select className="min-w-0 flex-1 rounded-lg border border-mist px-2 py-2 text-sm" value={novoModelo} onChange={(e) => setNovoModelo(e.target.value)}>{modelos.map((m) => <option key={m.chave} value={m.chave}>{m.rotulo}</option>)}</select>
            <button className="rounded-lg bg-sage-deep px-3 py-2 text-sm font-semibold text-paper" onClick={nova}>Nova</button>
          </div>
          {lista.length > 0 && (
            <div className="mb-3 flex items-center justify-between gap-2 rounded-lg bg-paper px-3 py-2 text-xs text-ink/60">
              <span>{marcadas.length ? `${marcadas.length} marcada(s)` : "Sem marcar = todas as finalizadas"}</span>
              <button className="font-semibold text-sage-deep hover:underline disabled:opacity-50" disabled={gerando} onClick={gerarPdf}>{gerando ? "gerando…" : "Gerar PDF"}</button>
            </div>
          )}
          {lista.length === 0 ? <p className="py-6 text-center text-sm text-ink/45">Nenhuma evolução ainda. Crie a primeira.</p> : (
            <ul className="space-y-2">
              {lista.map((e) => (
                <li key={e.id} className="flex items-start gap-2">
                  <input type="checkbox" className="mt-3" checked={marcadas.includes(e.id)} onChange={() => alternarMarca(e.id)} title="Incluir no PDF do prontuário" />
                  <button className={`min-w-0 flex-1 rounded-lg border px-3 py-2 text-left ${aberta?.id === e.id ? "border-sage-deep bg-sage-deep/10" : "border-mist hover:bg-paper"}`} onClick={() => abrir(e)}>
                    <div className="flex items-center justify-between gap-2 text-xs text-ink/55"><span>{dataBr(e.dataHora)}</span><span className={e.status === "FINALIZADA" ? "font-semibold text-sage-deep" : "text-clay"}>{e.status === "FINALIZADA" ? "finalizada" : "rascunho"}</span></div>
                    <div className="mt-0.5 text-sm font-semibold text-ink">{modeloDe(e.modelo)?.rotulo ?? e.modelo}</div>
                    <div className="mt-0.5 line-clamp-2 text-xs text-ink/55">{trecho(e)}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="min-w-0 rounded-xl border border-mist bg-white p-5">
          {!aberta ? <p className="py-16 text-center text-sm text-ink/45">Escolha uma evolução na lista ou crie uma nova.</p> : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <input type="datetime-local" className="rounded-lg border border-mist px-3 py-2 text-sm" value={aLocal(aberta.dataHora)} onChange={(e) => { if (e.target.value) alterar({ dataHora: new Date(e.target.value).toISOString() }, { dataHora: new Date(e.target.value).toISOString() }); }} disabled={!meu} />
                <select className="rounded-lg border border-mist px-3 py-2 text-sm" value={aberta.modelo} onChange={(e) => trocarModelo(e.target.value)} disabled={!meu}>{modelos.map((m) => <option key={m.chave} value={m.chave}>{m.rotulo}</option>)}</select>
                <span className={`text-xs ${estado === "salvo" ? "text-sage-deep" : "text-ink/50"}`}>{estado === "salvo" ? "✓ salvo" : estado === "salvando" ? "salvando…" : "alterações não salvas"}</span>
                <div className="ml-auto flex flex-wrap gap-2">
                  {aberta.totalVersoes > 0 && <button className="rounded-lg border border-mist px-3 py-2 text-sm text-ink/70" onClick={verVersoes}>Versões ({aberta.totalVersoes})</button>}
                  {meu && (finalizada ? <button className="rounded-lg border border-mist px-3 py-2 text-sm font-semibold text-ink/70" onClick={reabrir}>Reabrir</button> : <button className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper" onClick={finalizar}>Finalizar</button>)}
                  <button className="rounded-lg border border-mist px-3 py-2 text-sm text-ink/60 hover:text-ember" onClick={excluir}>Excluir</button>
                </div>
              </div>
              {finalizada && <p className="rounded-lg bg-sage-deep/10 px-3 py-2 text-xs text-sage-deep">Finalizada em {aberta.finalizadaEm ? dataBr(aberta.finalizadaEm) : ""}. Se você editar, a versão anterior fica guardada.</p>}

              {modelo && modelo.campos.length > 0 && (
                <div className="rounded-xl border border-mist bg-paper/60 p-4">
                  <div className="mb-3"><div className="text-sm font-semibold text-ink">{modelo.rotulo}</div><div className="text-xs text-ink/55">{modelo.descricao}</div></div>
                  <div className="grid gap-4">
                    {modelo.campos.map((c) => (
                      <label key={c.chave} className="block">
                        <span className="block text-xs font-bold uppercase tracking-wide text-sage-deep">{c.rotulo}</span><span className="block text-xs text-ink/45">{c.dica}</span>
                        {c.lista ? (
                          <textarea className="mt-1 w-full rounded-lg border border-mist bg-white px-3 py-2 text-sm" rows={3} placeholder="Um ponto por linha" disabled={!meu} value={((aberta.campos?.[c.chave] as string[] | undefined) ?? []).join("\n")} onChange={(e) => setCampo(c.chave, e.target.value.split("\n"))} />
                        ) : (
                          <textarea className="mt-1 w-full rounded-lg border border-mist bg-white px-3 py-2 text-sm" rows={3} maxLength={8000} disabled={!meu} value={(aberta.campos?.[c.chave] as string | undefined) ?? ""} onChange={(e) => setCampo(c.chave, e.target.value)} />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-4 2xl:grid-cols-2">
                <label className="block">
                  <span className="block text-xs font-bold uppercase tracking-wide text-clay">Anotações privadas</span><span className="block text-xs text-ink/45">só você vê</span>
                  <textarea className="mt-1 h-56 w-full rounded-lg border border-mist bg-white px-3 py-2 text-sm leading-relaxed" disabled={!meu} placeholder={meu ? "Comece as anotações desta sessão…" : "Privado do autor"} maxLength={40000} value={aberta.anotacoes ?? ""} onChange={(e) => alterar({ anotacoes: e.target.value }, { anotacoes: e.target.value })} />
                </label>
                <label className="block">
                  <span className="block text-xs font-bold uppercase tracking-wide text-sage-deep">Evolução do prontuário</span><span className="block text-xs text-ink/45">registro clínico</span>
                  <textarea className="mt-1 h-56 w-full rounded-lg border border-mist bg-white px-3 py-2 text-sm leading-relaxed" disabled={!meu} placeholder="Registre a evolução desta sessão…" maxLength={40000} value={aberta.evolucao ?? ""} onChange={(e) => alterar({ evolucao: e.target.value }, { evolucao: e.target.value })} />
                </label>
              </div>

              {versoes && (
                <div className="rounded-xl border border-mist p-4">
                  <div className="mb-2 flex items-center justify-between"><h4 className="text-sm font-semibold text-ink">Versões anteriores</h4><button className="text-xs text-ink/50 hover:underline" onClick={() => setVersoes(null)}>fechar</button></div>
                  <ul className="space-y-3">
                    {[...versoes].reverse().map((v, i) => (
                      <li key={i} className="rounded-lg bg-paper p-3 text-sm"><div className="mb-1 text-xs text-ink/50">Antes da edição de {dataBr(v.em)}</div><div className="whitespace-pre-wrap text-ink/75">{v.evolucao || "(sem texto de evolução)"}</div></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
