import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api, type DiarioPublico, type EscalaParaResponder, type NovoCartao, type PerguntaForm, type RespostasForm } from "../lib/api";
import { CamposFormulario } from "../components/CamposFormulario";
import { corDaFamilia, FACE_INTENSIDADE, ICONE, ROTULO_INTENSIDADE } from "../lib/diarioCores";

// Cartão Diário, lado do paciente: um registro breve entre as sessões, em 6 passos, feito no celular pelo link que o(a) psicólogo(a) gerou.
// Quase tudo é escolha com um toque; o texto é opcional. Nada é enviado até o paciente confirmar na última tela.

const hojeIso = () => new Date().toLocaleDateString("sv-SE");
const dataCurta = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

function Escolha({ opcoes, valor, onChange }: { opcoes: Array<{ chave: string; rotulo: string }>; valor: string | null | undefined; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      {opcoes.map((o) => {
        const ativo = valor === o.chave;
        return (
          <button key={o.chave} type="button" onClick={() => onChange(o.chave)} className={`flex w-full items-center gap-3 rounded-2xl border-2 px-3 py-3 text-left text-[15px] shadow-sm transition-all active:scale-[0.98] ${ativo ? "border-sage-deep bg-white font-semibold text-ink shadow-md" : "border-transparent bg-white/80 text-ink/80"}`}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper text-xl">{ICONE[o.chave] ?? "•"}</span>
            <span className="flex-1">{o.rotulo}</span>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[12px] ${ativo ? "border-sage-deep bg-sage-deep text-paper" : "border-ink/20"}`}>{ativo ? "✓" : ""}</span>
          </button>
        );
      })}
    </div>
  );
}

const Titulo = ({ rotulo, titulo, ajuda }: { rotulo: string; titulo: string; ajuda?: string }) => (
  <div className="mb-4">
    <div className="text-[11px] font-bold uppercase tracking-widest text-sage-deep">{rotulo}</div>
    <h2 className="mt-1 font-serif text-2xl leading-snug text-ink">{titulo}</h2>
    {ajuda && <p className="mt-1 text-sm text-ink/60">{ajuda}</p>}
  </div>
);

const Nota = ({ valor, onChange, texto }: { valor: string; onChange: (v: string) => void; texto: string }) => (
  <label className="mt-5 block">
    <span className="mb-1 block text-sm font-semibold text-ink/70">{texto}</span>
    <textarea className="w-full resize-none rounded-2xl border border-mist bg-white px-4 py-3 text-[15px] outline-none focus:border-sage-deep" rows={3} maxLength={1200} placeholder="Opcional. Uma frase curta já basta." value={valor} onChange={(e) => onChange(e.target.value)} />
  </label>
);

export function DiarioDoPacienteTela() {
  const { segredo } = useParams<{ segredo: string }>();
  const [info, setInfo] = useState<DiarioPublico | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [passo, setPasso] = useState(0); // 0 = início, 1..N = etapas (ver `ordem`), N+1 = pronto
  const [c, setC] = useState<NovoCartao>({ ocorridoEm: hojeIso(), emocao: "", intensidade: 0, acoesQueAjudaram: [], pesos: [], levarParaSessao: false });
  const [enviando, setEnviando] = useState(false);
  const [vontade, setVontade] = useState<boolean | null>(null);
  const [form, setForm] = useState<{ id: string; nome: string; perguntas: PerguntaForm[] } | null>(null);
  const [respForm, setRespForm] = useState<RespostasForm>({});
  const [formFeito, setFormFeito] = useState(false);
  const [escala, setEscala] = useState<EscalaParaResponder | null>(null);
  const [respEscala, setRespEscala] = useState<Record<string, number>>({});
  const [escalaFeita, setEscalaFeita] = useState<{ cuidado: string | null } | null>(null);
  const [resposta, setResposta] = useState<{ intenso: boolean; apoio: string[]; aviso: string } | null>(null);

  useEffect(() => { if (segredo) api.diarioPublico(segredo).then(setInfo).catch((e) => setErro(e.message)); }, [segredo]);

  const cat = info?.catalogo;
  // etapas na ordem em que aparecem; "pesos" e "impulso" são opcionais e o profissional liga ou desliga por paciente
  // Mesma regra do servidor (etapasDoCartao): "o que pesou" só com emoção difícil e forte; "vontades" só se o paciente disser que veio.
  const familiaEscolhida = cat?.emocoes.find((e) => e.chave === c.emocao)?.familia ?? null;
  const dificil = !!familiaEscolhida && familiaEscolhida !== "leve";
  const modoPesos = cat?.etapas?.pesos ?? "auto", modoImpulso = cat?.etapas?.impulso ?? "auto";
  const mostraPesos = modoPesos === "sempre" || (modoPesos === "auto" && dificil && c.intensidade >= 4);
  const perguntaVontade = modoImpulso === "auto" && dificil;
  const mostraImpulso = modoImpulso === "sempre" || (modoImpulso === "auto" && dificil && vontade === true);
  const ordem = useMemo(() => ["emocao", "intensidade", "contexto", ...(mostraPesos ? ["pesos"] : []), "cuidado", ...(mostraImpulso ? ["impulso"] : []), "fecho", "revisao"], [mostraPesos, mostraImpulso]);
  const total = ordem.length;
  const etapa = passo >= 1 && passo <= total ? ordem[passo - 1] : null;
  const emocao = cat?.emocoes.find((e) => e.chave === c.emocao);
  const familia = cat?.familias.find((f) => f.chave === emocao?.familia);
  const set = (p: Partial<NovoCartao>) => setC((x) => ({ ...x, ...p }));
  const rotulo = (lista: Array<{ chave: string; rotulo: string }> | undefined, chave?: string | null) => lista?.find((o) => o.chave === chave)?.rotulo ?? "-";
  const podeAvancar = etapa === "emocao" ? !!c.emocao : etapa === "intensidade" ? c.intensidade > 0 : true;
  const alternar = (campo: "acoesQueAjudaram" | "pesos", chave: string) => { const atual = c[campo] ?? []; set({ [campo]: atual.includes(chave) ? atual.filter((x) => x !== chave) : [...atual, chave] } as Partial<NovoCartao>); };
  const porFamilia = useMemo(() => (cat ? cat.familias.map((f) => ({ f, emocoes: cat.emocoes.filter((e) => e.familia === f.chave) })) : []), [cat]);

  async function enviar() {
    if (!segredo) return;
    setErro(null); setEnviando(true);
    try { setResposta(await api.enviarCartao(segredo, c)); setPasso(total + 1); } catch (e) { setErro((e as Error).message); } finally { setEnviando(false); }
  }
  async function abrirForm(id: string) { if (!segredo) return; setErro(null); try { setForm(await api.formularioPublico(segredo, id)); setRespForm({}); setFormFeito(false); window.scrollTo(0, 0); } catch (e) { setErro((e as Error).message); } }
  async function enviarForm() {
    if (!segredo || !form) return;
    const faltam = form.perguntas.filter((p) => p.obrigatoria && (respForm[p.id] === undefined)).length;
    if (faltam) { setErro(faltam === 1 ? "Falta responder 1 pergunta obrigatória (marcada com *)." : `Faltam ${faltam} perguntas obrigatórias (marcadas com *).`); return; }
    setErro(null); setEnviando(true);
    try { await api.responderFormulario(segredo, form.id, respForm); setFormFeito(true); api.diarioPublico(segredo).then(setInfo).catch(() => undefined); } catch (e) { setErro((e as Error).message); } finally { setEnviando(false); }
  }
  async function abrirEscala(id: string) { if (!segredo) return; setErro(null); try { setEscala(await api.escalaPublica(segredo, id)); setRespEscala({}); setEscalaFeita(null); window.scrollTo(0, 0); } catch (e) { setErro((e as Error).message); } }
  async function enviarEscala() {
    if (!segredo || !escala) return;
    const faltam = escala.itens.filter((i) => respEscala[String(i.id)] === undefined).length;
    if (faltam) { setErro(faltam === 1 ? "Falta responder 1 pergunta." : `Faltam ${faltam} perguntas.`); return; }
    setErro(null); setEnviando(true);
    try { const r = await api.responderEscala(segredo, escala.id, respEscala); setEscalaFeita({ cuidado: r.cuidado }); api.diarioPublico(segredo).then(setInfo).catch(() => undefined); } catch (e) { setErro((e as Error).message); } finally { setEnviando(false); }
  }
  function novo() { setVontade(null); setC({ ocorridoEm: hojeIso(), emocao: "", intensidade: 0, acoesQueAjudaram: [], pesos: [], levarParaSessao: false }); setResposta(null); setPasso(0); if (segredo) api.diarioPublico(segredo).then(setInfo).catch(() => undefined); }

  if (erro && !info) return <div className="mx-auto max-w-md px-5 py-16"><div className="rounded-3xl border border-ember/30 bg-ember/10 p-6 text-center text-ember">{erro}</div></div>;
  if (form) {
    return (
      <div className="mx-auto min-h-screen max-w-md px-5 pb-28 pt-6" style={{ background: "linear-gradient(180deg, #F3DCC8 0%, #FBF6F0 38%, #F4EFF8 100%)" }}>
        {formFeito ? (
          <div>
            <div className="text-6xl">✅</div>
            <h1 className="mt-2 font-serif text-3xl text-ink">Obrigado por responder</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-ink/70">Suas respostas foram enviadas para {info?.profissional}.</p>
            <button className="mt-6 w-full rounded-full bg-sage-deep px-5 py-4 text-base font-semibold text-paper" onClick={() => { setForm(null); setFormFeito(false); }}>Voltar ao início</button>
          </div>
        ) : (
          <div>
            <button className="mb-4 text-sm font-semibold text-sage-deep" onClick={() => setForm(null)}>← Voltar</button>
            <h1 className="font-serif text-2xl text-ink">{form.nome}</h1>
            <p className="mt-2 text-sm text-ink/60">Responda no seu ritmo. Só {info?.profissional} lê estas respostas.</p>
            {erro && <div className="mt-4 rounded-2xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
            <div className="mt-5 rounded-2xl bg-white/80 p-4 shadow-sm"><CamposFormulario perguntas={form.perguntas} respostas={respForm} onChange={setRespForm} compacto /></div>
            <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md bg-white/90 px-5 py-3 shadow-[0_-6px_20px_rgba(0,0,0,0.06)] backdrop-blur" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
              <button className="w-full rounded-full bg-sage-deep px-5 py-3.5 text-[15px] font-semibold text-paper disabled:opacity-40" disabled={enviando} onClick={enviarForm}>{enviando ? "Enviando…" : "Enviar respostas"}</button>
            </div>
          </div>
        )}
      </div>
    );
  }
  if (escala) {
    return (
      <div className="mx-auto min-h-screen max-w-md px-5 pb-28 pt-6" style={{ background: "linear-gradient(180deg, #F3DCC8 0%, #FBF6F0 38%, #F4EFF8 100%)" }}>
        {escalaFeita ? (
          <div>
            <div className="text-6xl">✅</div>
            <h1 className="mt-2 font-serif text-3xl text-ink">Obrigado por responder</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-ink/70">Suas respostas foram enviadas para {info?.profissional}. Vocês vão conversar sobre elas na sessão.</p>
            {escalaFeita.cuidado && <div className="mt-5 rounded-2xl border-2 border-ember/40 bg-ember/10 p-4 text-[15px] leading-relaxed text-ink"><b className="text-ember">Cuide de você agora.</b><p className="mt-1">{escalaFeita.cuidado}</p></div>}
            <button className="mt-6 w-full rounded-full bg-sage-deep px-5 py-4 text-base font-semibold text-paper" onClick={() => { setEscala(null); setEscalaFeita(null); }}>Voltar ao início</button>
          </div>
        ) : (
          <div>
            <button className="mb-4 text-sm font-semibold text-sage-deep" onClick={() => setEscala(null)}>← Voltar</button>
            <h1 className="font-serif text-2xl text-ink">{escala.nome}</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-ink/70">{escala.instrucao}</p>
            {erro && <div className="mt-4 rounded-2xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
            <ol className="mt-5 space-y-4">
              {escala.itens.map((i) => (
                <li key={i.id} className="rounded-2xl bg-white/80 p-4 shadow-sm">
                  <div className="mb-3 text-[15px] font-semibold leading-snug text-ink"><span className="mr-2 text-ink/35">{i.id}.</span>{i.texto}</div>
                  <div className="space-y-2">
                    {(i.opcoes ?? escala.opcoes).map((o) => { const ativo = respEscala[String(i.id)] === o.valor; return (
                      <button key={o.valor} type="button" onClick={() => setRespEscala((r) => ({ ...r, [String(i.id)]: o.valor }))} className={`flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left text-sm ${ativo ? "border-sage-deep bg-sage-deep/10 font-semibold text-ink" : "border-transparent bg-paper text-ink/75"}`}>
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[11px] ${ativo ? "border-sage-deep bg-sage-deep text-paper" : "border-ink/20"}`}>{ativo ? "✓" : ""}</span>{o.rotulo}
                      </button>
                    ); })}
                  </div>
                </li>
              ))}
            </ol>
            <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md bg-white/90 px-5 py-3 shadow-[0_-6px_20px_rgba(0,0,0,0.06)] backdrop-blur" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
              <button className="w-full rounded-full bg-sage-deep px-5 py-3.5 text-[15px] font-semibold text-paper disabled:opacity-40" disabled={enviando} onClick={enviarEscala}>{enviando ? "Enviando…" : "Enviar respostas"}</button>
            </div>
          </div>
        )}
      </div>
    );
  }
  if (!info || !cat) return <div className="px-6 py-20 text-center text-sm text-ink/55">Abrindo…</div>;

  const cor = corDaFamilia(emocao?.familia ?? "");
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col" style={{ background: `linear-gradient(180deg, ${emocao ? cor + "26" : "#F3DCC8"} 0%, #FBF6F0 38%, #F4EFF8 100%)` }}>
      <header className="px-5 pb-3 pt-5">
        <div className="flex items-center gap-2 font-serif text-xl text-ink"><span>📔</span>Diário de hoje</div>
        <div className="text-xs text-ink/55">Um registro rápido, só entre você e {info.profissional}</div>
        {etapa && <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70"><div className="h-full rounded-full bg-sage-deep transition-all" style={{ width: `${(passo / total) * 100}%` }} /></div>}
      </header>

      {etapa && passo >= 2 && emocao && (
        <div className="mx-5 flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm" style={{ background: `${cor}2B` }}>
          <span className="text-2xl">{ICONE[c.emocao]}</span>
          <span className="font-semibold text-ink">{emocao.rotulo}</span>
          {c.intensidade > 0 && <span className="text-ink/60">· {ROTULO_INTENSIDADE[c.intensidade]}</span>}
          <span className="ml-auto text-[11px] font-bold uppercase tracking-wide text-ink/45">{passo} de {total}</span>
        </div>
      )}

      <main className="flex-1 px-5 pb-32 pt-6">
        {erro && <div className="mb-4 rounded-2xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}

        {passo === 0 && (
          <div>
            <div className="mb-2 text-6xl">👋</div>
            <h1 className="font-serif text-3xl text-ink">Oi, {info.paciente}!</h1>
            <p className="mt-1 text-sm text-ink/55">{info.clinica}</p>
            <p className="mt-4 text-[16px] leading-relaxed text-ink/80">Como você está agora? Leva cerca de um minuto, e quase tudo é só tocar numa opção. Seus registros ajudam {info.profissional} a entender como foram os seus dias entre as consultas. 💛</p>
            {(info.formularios?.length ?? 0) > 0 && (
              <div className="mt-6 rounded-2xl border-2 border-sage-deep/30 bg-white/80 p-4">
                <div className="text-xs font-bold uppercase tracking-widest text-sage-deep">Formulários para você</div>
                <ul className="mt-2 space-y-2">{info.formularios!.map((f) => <li key={f.id}><button className="flex w-full items-center justify-between rounded-xl bg-paper px-3 py-3 text-left text-sm" onClick={() => abrirForm(f.id)}><span className="font-semibold text-ink">{f.nome}</span><span className="text-sage-deep">Responder →</span></button></li>)}</ul>
              </div>
            )}
            {(info.escalas?.length ?? 0) > 0 && (
              <div className="mt-6 rounded-2xl border-2 border-sage-deep/30 bg-white/80 p-4">
                <div className="text-xs font-bold uppercase tracking-widest text-sage-deep">{info.profissional} pediu para você</div>
                <ul className="mt-2 space-y-2">{info.escalas!.map((e) => <li key={e.id}><button className="flex w-full items-center justify-between rounded-xl bg-paper px-3 py-3 text-left text-sm" onClick={() => abrirEscala(e.id)}><span><span className="block font-semibold text-ink">{e.nome}</span><span className="text-xs text-ink/50">cerca de {e.tempo}</span></span><span className="text-sage-deep">Responder →</span></button></li>)}</ul>
              </div>
            )}
            {(() => {
              const hoje = info.recentes.find((r) => r.ocorridoEm.slice(0, 10) === hojeIso());
              return hoje ? (
                <div className="mt-4 rounded-2xl border border-sage-deep/30 bg-white/80 p-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-sage-deep">Seu dia de hoje</div>
                  <div className="mt-2 flex items-center gap-3"><span className="text-3xl">{ICONE[hoje.emocao] ?? "•"}</span><div><div className="font-semibold text-ink">{rotulo(cat.emocoes, hoje.emocao)}</div><div className="text-sm text-ink/55">intensidade {hoje.intensidade} · {ROTULO_INTENSIDADE[hoje.intensidade]}</div></div></div>
                  <p className="mt-2 text-xs text-ink/50">Seu registro de hoje foi acolhido. Se quiser, você pode fazer outro agora ou lançar um dia que ficou sem registro.</p>
                </div>
              ) : null;
            })()}
            <button className="mt-4 w-full rounded-full bg-sage-deep px-5 py-4 text-base font-semibold text-paper shadow-lg active:scale-[0.98]" onClick={() => setPasso(1)}>{info.recentes.some((r) => r.ocorridoEm.slice(0, 10) === hojeIso()) ? "Fazer outro registro →" : "Fazer meu registro →"}</button>
            {info.recentes.length > 0 && (
              <section className="mt-8">
                <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-ink/45">Seus últimos registros</h2>
                <ul className="space-y-1.5">
                  {info.recentes.slice(0, 7).map((r, i) => (
                    <li key={i} className="flex items-center gap-3 rounded-2xl bg-white/80 px-3 py-2 text-sm shadow-sm"><span className="text-xl">{ICONE[r.emocao] ?? "•"}</span><span className="font-medium text-ink">{rotulo(cat.emocoes, r.emocao)}</span><span className="text-ink/50">{ROTULO_INTENSIDADE[r.intensidade]}</span><span className="ml-auto text-xs text-ink/45">{dataCurta(r.ocorridoEm)}</span></li>
                  ))}
                </ul>
              </section>
            )}
            <p className="mt-8 rounded-2xl bg-white/70 p-4 text-xs leading-relaxed text-ink/55">{cat.aviso.curto} {cat.aviso.intenso}</p>
          </div>
        )}

        {etapa === "emocao" && (
          <div>
            <Titulo rotulo="Como você está" titulo="Como está por dentro agora?" ajuda="Toque na emoção que mais se parece com este momento." />
            <div className="space-y-5">
              {porFamilia.map(({ f, emocoes }) => (
                <section key={f.chave}>
                  <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink/45"><span>{ICONE[f.chave]}</span>{f.rotulo}<span className="font-normal normal-case tracking-normal">· {f.descricao}</span></h3>
                  <div className="grid grid-cols-3 gap-2">
                    {emocoes.map((e) => {
                      const ativo = c.emocao === e.chave;
                      return <button key={e.chave} type="button" onClick={() => set({ emocao: e.chave })} className={`flex flex-col items-center gap-1 rounded-2xl border-2 px-1 py-3 text-center text-[13px] leading-tight shadow-sm transition-all active:scale-95 ${ativo ? "font-semibold text-ink shadow-md" : "border-transparent bg-white/80 text-ink/80"}`} style={ativo ? { borderColor: corDaFamilia(f.chave), background: `${corDaFamilia(f.chave)}30` } : undefined}><span className="text-3xl">{ICONE[e.chave]}</span>{e.rotulo}</button>;
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}

        {etapa === "intensidade" && (
          <div>
            <Titulo rotulo="Força" titulo="O quanto isso está forte?" ajuda="De 1 (quase imperceptível) a 5 (muito forte)." />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => set({ intensidade: n })} className={`flex w-full items-center gap-4 rounded-2xl border-2 px-4 py-3 text-left shadow-sm transition-all active:scale-[0.98] ${c.intensidade === n ? "bg-white shadow-md" : "border-transparent bg-white/80"}`} style={c.intensidade === n ? { borderColor: cor } : undefined}>
                  <span className="text-4xl">{FACE_INTENSIDADE[n]}</span>
                  <span className={`text-[15px] ${c.intensidade === n ? "font-semibold text-ink" : "text-ink/80"}`}>{n} · {ROTULO_INTENSIDADE[n]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {etapa === "contexto" && (
          <div>
            <Titulo rotulo="O que houve" titulo="O que estava acontecendo?" ajuda="Escolha o que estava por trás. Se quiser, conte um detalhe." />
            <Escolha opcoes={cat.contextos} valor={c.contexto} onChange={(v) => set({ contexto: v })} />
            <Nota valor={c.notaContexto ?? ""} onChange={(v) => set({ notaContexto: v })} texto="Algum detalhe?" />
          </div>
        )}

        {etapa === "pesos" && (
          <div>
            <Titulo rotulo="O que pesou" titulo="O que pesou no seu dia?" ajuda="Marque tudo o que fez diferença. Você pode pular." />
            <div className="space-y-2">
              {cat.pesosDoDia.map((o) => { const ativo = (c.pesos ?? []).includes(o.chave); return <button key={o.chave} type="button" onClick={() => alternar("pesos", o.chave)} className={`flex w-full items-center gap-3 rounded-2xl border-2 px-3 py-3 text-left text-[15px] shadow-sm transition-all active:scale-[0.98] ${ativo ? "border-sage-deep bg-white font-semibold text-ink shadow-md" : "border-transparent bg-white/80 text-ink/80"}`}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper text-xl">{ICONE[o.chave] ?? "•"}</span><span className="flex-1">{o.rotulo}</span><span className={`flex h-6 w-6 items-center justify-center rounded-md border-2 text-[12px] ${ativo ? "border-sage-deep bg-sage-deep text-paper" : "border-ink/20"}`}>{ativo ? "✓" : ""}</span></button>; })}
            </div>
          </div>
        )}

        {etapa === "cuidado" && (
          <div>
            <Titulo rotulo={dificil ? "Seu cuidado" : "O que ajudou"} titulo={dificil ? "O que você fez por você?" : "O que ajudou a chegar aqui?"} ajuda={dificil ? "Qualquer gesto conta, mesmo o menor. Marque quantos quiser." : "Vale guardar o que fez bem: pode ser útil em dias mais difíceis. Marque quantos quiser."} />
            {familia && (
              <div className="mb-5 rounded-2xl p-4 text-sm leading-relaxed text-ink/80" style={{ background: `${cor}1A` }}>
                <div className="mb-1 text-[11px] font-bold uppercase tracking-widest" style={{ color: cor }}>Para este momento</div>
                {familia.apoio.map((a, i) => <p key={i} className={i ? "mt-1.5" : ""}>{a}</p>)}
              </div>
            )}

            <div className="space-y-2">
              {(dificil || !familiaEscolhida ? cat.acoesQueAjudaram : cat.contribuicoesLeve).map((o) => {
                const ativo = (c.acoesQueAjudaram ?? []).includes(o.chave);
                return <button key={o.chave} type="button" onClick={() => set({ acoesQueAjudaram: ativo ? (c.acoesQueAjudaram ?? []).filter((x) => x !== o.chave) : [...(c.acoesQueAjudaram ?? []), o.chave] })} className={`flex w-full items-center gap-3 rounded-2xl border-2 px-3 py-3 text-left text-[15px] shadow-sm transition-all active:scale-[0.98] ${ativo ? "border-sage-deep bg-white font-semibold text-ink shadow-md" : "border-transparent bg-white/80 text-ink/80"}`}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper text-xl">{ICONE[o.chave] ?? "•"}</span><span className="flex-1">{o.rotulo}</span><span className={`flex h-6 w-6 items-center justify-center rounded-md border-2 text-[12px] ${ativo ? "border-sage-deep bg-sage-deep text-paper" : "border-ink/20"}`}>{ativo ? "✓" : ""}</span></button>;
              })}
            </div>
            {(dificil || !familiaEscolhida) && (<><h3 className="mb-2 mt-6 text-sm font-semibold text-ink/70">E isso fez diferença?</h3>
            <Escolha opcoes={cat.ajudou} valor={c.ajudou} onChange={(v) => set({ ajudou: v })} /></>)}
            {perguntaVontade && (
              <div className="mt-6 rounded-2xl bg-white/80 p-4">
                <h3 className="mb-2 text-sm font-semibold text-ink/80">Veio alguma vontade de agir de um jeito que você não queria?</h3>
                <p className="mb-3 text-xs text-ink/50">Sem julgamento. Se vier, perguntamos mais um pouco na próxima tela.</p>
                <div className="grid grid-cols-2 gap-2">
                  {([[true, "Veio sim"], [false, "Não veio"]] as const).map(([v, r]) => <button key={r} type="button" onClick={() => { setVontade(v); if (!v) set({ impulso: null, acaoImpulso: null }); }} className={`rounded-2xl border-2 px-3 py-3 text-[15px] shadow-sm ${vontade === v ? "border-sage-deep bg-sage-deep/10 font-semibold text-ink" : "border-transparent bg-white text-ink/80"}`}>{r}</button>)}
                </div>
              </div>
            )}
            <Nota valor={c.notaCuidado ?? ""} onChange={(v) => set({ notaCuidado: v })} texto="Quer contar como foi?" />
          </div>
        )}

        {etapa === "impulso" && (
          <div>
            <Titulo rotulo="Vontades" titulo="Teve alguma vontade difícil de segurar?" ajuda="Sem julgamento: é só para entender o seu dia." />
            <Escolha opcoes={cat.impulsos} valor={c.impulso} onChange={(v) => set({ impulso: v, ...(v === "nenhum" ? { acaoImpulso: null } : {}) })} />
            {c.impulso && c.impulso !== "nenhum" && (<><h3 className="mb-2 mt-6 text-sm font-semibold text-ink/70">E o que aconteceu com ela?</h3><Escolha opcoes={cat.acoesDoImpulso} valor={c.acaoImpulso} onChange={(v) => set({ acaoImpulso: v })} /></>)}
          </div>
        )}

        {etapa === "fecho" && (
          <div>
            <Titulo rotulo="Para fechar" titulo="Como você fecha este registro?" ajuda="Escolha uma frase e diga se quer conversar sobre isso." />
            <Escolha opcoes={dificil || !familiaEscolhida ? cat.fechamentos : cat.fechamentosLeve} valor={c.fechamento} onChange={(v) => set({ fechamento: v })} />
            <button type="button" onClick={() => set({ levarParaSessao: !c.levarParaSessao })} className={`mt-5 flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left ${c.levarParaSessao ? "border-sage-deep bg-sage-deep/10" : "border-mist bg-white"}`}>
              <span className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${c.levarParaSessao ? "bg-sage-deep" : "bg-ink/20"}`}><span className={`h-5 w-5 rounded-full bg-white transition-transform ${c.levarParaSessao ? "translate-x-5" : ""}`} /></span>
              <span><span className="block text-[15px] font-semibold text-ink">Quero conversar sobre isso com {info.profissional}</span><span className="block text-xs text-ink/55">Fica marcado para vocês verem no próximo encontro.</span></span>
            </button>
            <Nota valor={c.notaFinal ?? ""} onChange={(v) => set({ notaFinal: v })} texto="Mais alguma coisa que queira deixar anotada?" />
          </div>
        )}

        {etapa === "revisao" && (
          <div>
            <Titulo rotulo="Última conferência" titulo="Confira antes de enviar" />
            <label className="mb-4 block rounded-2xl bg-white p-4">
              <span className="mb-1 block text-sm font-semibold text-ink/70">De que dia é este registro?</span>
              <input type="date" max={hojeIso()} value={c.ocorridoEm} onChange={(e) => set({ ocorridoEm: e.target.value })} className="w-full rounded-xl border border-mist px-3 py-2 text-[15px]" />
              <span className="mt-1 block text-xs text-ink/45">Hoje, por padrão. Mude se estiver registrando um dia anterior.</span>
            </label>
            <dl className="divide-y divide-mist rounded-2xl bg-white text-sm">
              {[["Emoção", emocao?.rotulo], ["Intensidade", c.intensidade ? `${c.intensidade} · ${ROTULO_INTENSIDADE[c.intensidade]}` : "-"], ["Contexto", rotulo(cat.contextos, c.contexto)], ...(ordem.includes("pesos") ? [["O que pesou", (c.pesos ?? []).map((k) => rotulo(cat.pesosDoDia, k)).join(", ") || "-"]] : []), [dificil || !familiaEscolhida ? "O que fez por você" : "O que ajudou", (c.acoesQueAjudaram ?? []).map((k) => rotulo(dificil || !familiaEscolhida ? cat.acoesQueAjudaram : cat.contribuicoesLeve, k)).join(", ") || "-"], ...(dificil || !familiaEscolhida ? [["Fez diferença?", rotulo(cat.ajudou, c.ajudou)]] : []), ...(ordem.includes("impulso") ? [["Vontade difícil", rotulo(cat.impulsos, c.impulso)]] : []), ["Fecho", rotulo(dificil || !familiaEscolhida ? cat.fechamentos : cat.fechamentosLeve, c.fechamento)], ["Quero conversar", c.levarParaSessao ? "Sim" : "Não"]].map(([k, v]) => (
                <div key={k as string} className="flex justify-between gap-4 px-4 py-3"><dt className="text-ink/55">{k}</dt><dd className="text-right font-semibold text-ink">{v}</dd></div>
              ))}
            </dl>
            <p className="mt-4 rounded-2xl bg-sage-deep/10 p-4 text-xs leading-relaxed text-ink/70"><b>Nada sai daqui até você tocar em Enviar.</b> Quem lê este registro é {info.profissional}, e mais ninguém.</p>
          </div>
        )}

        {passo === total + 1 && resposta && (
          <div>
            <div className="text-6xl">🎉</div>
            <h1 className="mt-2 font-serif text-3xl text-ink">Registro guardado</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-ink/70">Obrigado por parar um minuto por você. 💛 {c.levarParaSessao ? `${info.profissional} vai ver que você quer conversar sobre isso.` : ""}</p>
            {resposta.intenso && <div className="mt-5 rounded-2xl border-2 border-ember/40 bg-ember/10 p-4 text-[15px] leading-relaxed text-ink"><b className="text-ember">Cuide de você agora.</b><p className="mt-1">{resposta.aviso}</p></div>}
            <div className="mt-5 rounded-2xl p-4 text-sm leading-relaxed text-ink/80" style={{ background: `${cor}1A` }}>
              <div className="mb-1 text-[11px] font-bold uppercase tracking-widest" style={{ color: cor }}>Para os próximos minutos</div>
              {resposta.apoio.map((a, i) => <p key={i} className={i ? "mt-1.5" : ""}>{a}</p>)}
            </div>
            {!resposta.intenso && <p className="mt-5 text-xs leading-relaxed text-ink/50">{resposta.aviso}</p>}
            <button className="mt-6 w-full rounded-full border-2 border-sage-deep px-5 py-3.5 text-base font-semibold text-sage-deep" onClick={novo}>Fazer outro registro</button>
          </div>
        )}
      </main>

      {etapa && (
        <footer className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-md gap-3 bg-white/90 px-5 py-3 shadow-[0_-6px_20px_rgba(0,0,0,0.06)] backdrop-blur" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <button className="rounded-full border-2 border-ink/10 px-5 py-3.5 text-[15px] font-semibold text-ink/70" onClick={() => setPasso((p) => p - 1)}>Voltar</button>
          {etapa !== "revisao" ? <button className="flex-1 rounded-full bg-sage-deep px-5 py-3.5 text-[15px] font-semibold text-paper disabled:opacity-40" disabled={!podeAvancar} onClick={() => setPasso((p) => p + 1)}>{ordem[passo] === "revisao" ? "Revisar" : "Continuar"} →</button>
            : <button className="flex-1 rounded-full bg-sage-deep px-5 py-3.5 text-[15px] font-semibold text-paper disabled:opacity-40" disabled={enviando} onClick={enviar}>{enviando ? "Enviando…" : "Enviar registro"}</button>}
        </footer>
      )}
    </div>
  );
}
