import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api, type DiarioPublico, type NovoCartao } from "../lib/api";
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
  const [passo, setPasso] = useState(0); // 0 = início, 1-5 = perguntas, 6 = revisão, 7 = pronto
  const [c, setC] = useState<NovoCartao>({ ocorridoEm: hojeIso(), emocao: "", intensidade: 0, acoesQueAjudaram: [], levarParaSessao: false });
  const [enviando, setEnviando] = useState(false);
  const [resposta, setResposta] = useState<{ intenso: boolean; apoio: string[]; aviso: string } | null>(null);

  useEffect(() => { if (segredo) api.diarioPublico(segredo).then(setInfo).catch((e) => setErro(e.message)); }, [segredo]);

  const cat = info?.catalogo;
  const emocao = cat?.emocoes.find((e) => e.chave === c.emocao);
  const familia = cat?.familias.find((f) => f.chave === emocao?.familia);
  const set = (p: Partial<NovoCartao>) => setC((x) => ({ ...x, ...p }));
  const rotulo = (lista: Array<{ chave: string; rotulo: string }> | undefined, chave?: string | null) => lista?.find((o) => o.chave === chave)?.rotulo ?? "-";
  const podeAvancar = passo === 1 ? !!c.emocao : passo === 2 ? c.intensidade > 0 : true;
  const porFamilia = useMemo(() => (cat ? cat.familias.map((f) => ({ f, emocoes: cat.emocoes.filter((e) => e.familia === f.chave) })) : []), [cat]);

  async function enviar() {
    if (!segredo) return;
    setErro(null); setEnviando(true);
    try { setResposta(await api.enviarCartao(segredo, c)); setPasso(7); } catch (e) { setErro((e as Error).message); } finally { setEnviando(false); }
  }
  function novo() { setC({ ocorridoEm: hojeIso(), emocao: "", intensidade: 0, acoesQueAjudaram: [], levarParaSessao: false }); setResposta(null); setPasso(0); if (segredo) api.diarioPublico(segredo).then(setInfo).catch(() => undefined); }

  if (erro && !info) return <div className="mx-auto max-w-md px-5 py-16"><div className="rounded-3xl border border-ember/30 bg-ember/10 p-6 text-center text-ember">{erro}</div></div>;
  if (!info || !cat) return <div className="px-6 py-20 text-center text-sm text-ink/55">Abrindo…</div>;

  const cor = corDaFamilia(emocao?.familia ?? "");
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col" style={{ background: `linear-gradient(180deg, ${emocao ? cor + "26" : "#F3DCC8"} 0%, #FBF6F0 38%, #F4EFF8 100%)` }}>
      <header className="px-5 pb-3 pt-5">
        <div className="flex items-center gap-2 font-serif text-xl text-ink"><span>📔</span>Cartão Diário</div>
        <div className="text-xs text-ink/55">Um check-in rapidinho, só seu e de {info.profissional}</div>
        {passo >= 1 && passo <= 6 && <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70"><div className="h-full rounded-full bg-sage-deep transition-all" style={{ width: `${(passo / 6) * 100}%` }} /></div>}
      </header>

      {passo >= 2 && passo <= 6 && emocao && (
        <div className="mx-5 flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm" style={{ background: `${cor}2B` }}>
          <span className="text-2xl">{ICONE[c.emocao]}</span>
          <span className="font-semibold text-ink">{emocao.rotulo}</span>
          {c.intensidade > 0 && <span className="text-ink/60">· {ROTULO_INTENSIDADE[c.intensidade]}</span>}
          <span className="ml-auto text-[11px] font-bold uppercase tracking-wide text-ink/45">Etapa {passo} de 6</span>
        </div>
      )}

      <main className="flex-1 px-5 pb-32 pt-6">
        {erro && <div className="mb-4 rounded-2xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}

        {passo === 0 && (
          <div>
            <div className="mb-2 text-6xl">👋</div>
            <h1 className="font-serif text-3xl text-ink">Oi, {info.paciente}!</h1>
            <p className="mt-1 text-sm text-ink/55">{info.clinica}</p>
            <p className="mt-4 text-[16px] leading-relaxed text-ink/80">E aí, como você está agora? Leva só um minutinho e quase tudo é tocar numa carinha ou num ícone. Isso ajuda {info.profissional} a entender como foram os seus dias entre as sessões. 💛</p>
            <button className="mt-6 w-full rounded-full bg-sage-deep px-5 py-4 text-base font-semibold text-paper shadow-lg active:scale-[0.98]" onClick={() => setPasso(1)}>Bora começar 🚀</button>
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

        {passo === 1 && (
          <div>
            <Titulo rotulo="Clima emocional" titulo="O que apareceu agora?" ajuda="Escolha a emoção que mais se aproxima deste momento." />
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

        {passo === 2 && (
          <div>
            <Titulo rotulo="Intensidade" titulo="Com que força isso está?" ajuda="De 1 (bem leve) a 5 (muito forte)." />
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

        {passo === 3 && (
          <div>
            <Titulo rotulo="Contexto" titulo="Onde isso apareceu?" ajuda="Se fizer sentido, marque o contexto e deixe uma nota breve." />
            <Escolha opcoes={cat.contextos} valor={c.contexto} onChange={(v) => set({ contexto: v })} />
            <Nota valor={c.notaContexto ?? ""} onChange={(v) => set({ notaContexto: v })} texto="Quer acrescentar algo?" />
          </div>
        )}

        {passo === 4 && (
          <div>
            <Titulo rotulo="Cuidado possível" titulo="O que você conseguiu tentar?" ajuda="Pequenos cuidados também contam." />
            {familia && (
              <div className="mb-5 rounded-2xl p-4 text-sm leading-relaxed text-ink/80" style={{ background: `${cor}1A` }}>
                <div className="mb-1 text-[11px] font-bold uppercase tracking-widest" style={{ color: cor }}>Para este momento</div>
                {familia.apoio.map((a, i) => <p key={i} className={i ? "mt-1.5" : ""}>{a}</p>)}
              </div>
            )}
            <h3 className="mb-2 text-sm font-semibold text-ink/70">O que você tentou primeiro?</h3>
            <Escolha opcoes={cat.primeirasAcoes} valor={c.primeiraAcao} onChange={(v) => set({ primeiraAcao: v })} />
            <h3 className="mb-1 mt-6 text-sm font-semibold text-ink/70">Alguma ação ajudou?</h3>
            <p className="mb-2 text-xs text-ink/50">Marque quantas fizeram sentido.</p>
            <div className="space-y-2">
              {cat.acoesQueAjudaram.map((o) => {
                const ativo = (c.acoesQueAjudaram ?? []).includes(o.chave);
                return <button key={o.chave} type="button" onClick={() => set({ acoesQueAjudaram: ativo ? (c.acoesQueAjudaram ?? []).filter((x) => x !== o.chave) : [...(c.acoesQueAjudaram ?? []), o.chave] })} className={`flex w-full items-center gap-3 rounded-2xl border-2 px-3 py-3 text-left text-[15px] shadow-sm transition-all active:scale-[0.98] ${ativo ? "border-sage-deep bg-white font-semibold text-ink shadow-md" : "border-transparent bg-white/80 text-ink/80"}`}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper text-xl">{ICONE[o.chave] ?? "•"}</span><span className="flex-1">{o.rotulo}</span><span className={`flex h-6 w-6 items-center justify-center rounded-md border-2 text-[12px] ${ativo ? "border-sage-deep bg-sage-deep text-paper" : "border-ink/20"}`}>{ativo ? "✓" : ""}</span></button>;
              })}
            </div>
            <h3 className="mb-2 mt-6 text-sm font-semibold text-ink/70">Isso ajudou?</h3>
            <Escolha opcoes={cat.ajudou} valor={c.ajudou} onChange={(v) => set({ ajudou: v })} />
            <Nota valor={c.notaCuidado ?? ""} onChange={(v) => set({ notaCuidado: v })} texto="Uma nota sobre o cuidado" />
          </div>
        )}

        {passo === 5 && (
          <div>
            <Titulo rotulo="Fechamento" titulo="O que você leva deste momento?" ajuda="Escolha uma frase para fechar e decida se quer levar isto à sessão." />
            <Escolha opcoes={cat.fechamentos} valor={c.fechamento} onChange={(v) => set({ fechamento: v })} />
            <button type="button" onClick={() => set({ levarParaSessao: !c.levarParaSessao })} className={`mt-5 flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left ${c.levarParaSessao ? "border-sage-deep bg-sage-deep/10" : "border-mist bg-white"}`}>
              <span className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${c.levarParaSessao ? "bg-sage-deep" : "bg-ink/20"}`}><span className={`h-5 w-5 rounded-full bg-white transition-transform ${c.levarParaSessao ? "translate-x-5" : ""}`} /></span>
              <span><span className="block text-[15px] font-semibold text-ink">Levar para a sessão</span><span className="block text-xs text-ink/55">Quero lembrar de conversar sobre isso.</span></span>
            </button>
            <Nota valor={c.notaFinal ?? ""} onChange={(v) => set({ notaFinal: v })} texto="Uma última nota para você" />
          </div>
        )}

        {passo === 6 && (
          <div>
            <Titulo rotulo="Revisão" titulo="Confira o seu registro" />
            <label className="mb-4 block rounded-2xl bg-white p-4">
              <span className="mb-1 block text-sm font-semibold text-ink/70">Quando foi este registro?</span>
              <input type="date" max={hojeIso()} value={c.ocorridoEm} onChange={(e) => set({ ocorridoEm: e.target.value })} className="w-full rounded-xl border border-mist px-3 py-2 text-[15px]" />
              <span className="mt-1 block text-xs text-ink/45">Escolha o dia em que este registro aconteceu.</span>
            </label>
            <dl className="divide-y divide-mist rounded-2xl bg-white text-sm">
              {[["Emoção", emocao?.rotulo], ["Intensidade", c.intensidade ? `${c.intensidade} · ${ROTULO_INTENSIDADE[c.intensidade]}` : "-"], ["Contexto", rotulo(cat.contextos, c.contexto)], ["Tentei primeiro", rotulo(cat.primeirasAcoes, c.primeiraAcao)], ["Ajudou", (c.acoesQueAjudaram ?? []).map((k) => rotulo(cat.acoesQueAjudaram, k)).join(", ") || "-"], ["Isso ajudou?", rotulo(cat.ajudou, c.ajudou)], ["Fechamento", rotulo(cat.fechamentos, c.fechamento)], ["Levar para a sessão", c.levarParaSessao ? "Sim" : "Não"]].map(([k, v]) => (
                <div key={k as string} className="flex justify-between gap-4 px-4 py-3"><dt className="text-ink/55">{k}</dt><dd className="text-right font-semibold text-ink">{v}</dd></div>
              ))}
            </dl>
            <p className="mt-4 rounded-2xl bg-sage-deep/10 p-4 text-xs leading-relaxed text-ink/70"><b>Seu registro fica no seu cuidado.</b> As respostas são enviadas somente quando você confirma abaixo. Quem vê é {info.profissional}, o(a) psicólogo(a) que lhe enviou este link.</p>
          </div>
        )}

        {passo === 7 && resposta && (
          <div>
            <div className="text-6xl">🎉</div>
            <h1 className="mt-2 font-serif text-3xl text-ink">Pronto, registrado!</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-ink/70">Obrigado por reservar esse momento pra você. 💛 {c.levarParaSessao ? `${info.profissional} vai ver que você quer conversar sobre isso na sessão.` : ""}</p>
            {resposta.intenso && <div className="mt-5 rounded-2xl border-2 border-ember/40 bg-ember/10 p-4 text-[15px] leading-relaxed text-ink"><b className="text-ember">Cuide de você agora.</b><p className="mt-1">{resposta.aviso}</p></div>}
            <div className="mt-5 rounded-2xl p-4 text-sm leading-relaxed text-ink/80" style={{ background: `${cor}1A` }}>
              <div className="mb-1 text-[11px] font-bold uppercase tracking-widest" style={{ color: cor }}>Um cuidado para agora</div>
              {resposta.apoio.map((a, i) => <p key={i} className={i ? "mt-1.5" : ""}>{a}</p>)}
            </div>
            {!resposta.intenso && <p className="mt-5 text-xs leading-relaxed text-ink/50">{resposta.aviso}</p>}
            <button className="mt-6 w-full rounded-full border-2 border-sage-deep px-5 py-3.5 text-base font-semibold text-sage-deep" onClick={novo}>Fazer outro registro</button>
          </div>
        )}
      </main>

      {passo >= 1 && passo <= 6 && (
        <footer className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-md gap-3 bg-white/90 px-5 py-3 shadow-[0_-6px_20px_rgba(0,0,0,0.06)] backdrop-blur" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <button className="rounded-full border-2 border-ink/10 px-5 py-3.5 text-[15px] font-semibold text-ink/70" onClick={() => setPasso((p) => p - 1)}>Voltar</button>
          {passo < 6 ? <button className="flex-1 rounded-full bg-sage-deep px-5 py-3.5 text-[15px] font-semibold text-paper disabled:opacity-40" disabled={!podeAvancar} onClick={() => setPasso((p) => p + 1)}>{passo === 5 ? "Revisar" : "Continuar"} →</button>
            : <button className="flex-1 rounded-full bg-sage-deep px-5 py-3.5 text-[15px] font-semibold text-paper disabled:opacity-40" disabled={enviando} onClick={enviar}>{enviando ? "Enviando…" : "Enviar registro"}</button>}
        </footer>
      )}
    </div>
  );
}
