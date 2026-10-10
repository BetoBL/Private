import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ChamadaVideo } from "../components/ChamadaVideo";
import { api, type InfoAtendimentoPublico } from "../lib/api";

// Página pública do paciente (sem login): abre pelo link recebido, mostra o consentimento (plano completo) e entra na chamada.
export function AtendimentoPaciente() {
  const { codigo, segredo } = useParams<{ codigo: string; segredo: string }>();
  const [info, setInfo] = useState<InfoAtendimentoPublico | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sala, setSala] = useState<{ token: string; url: string } | null>(null);
  const [saiu, setSaiu] = useState(false);
  const [entrando, setEntrando] = useState(false);
  // consentimento
  const [declaradoPor, setDeclaradoPor] = useState<"PACIENTE" | "RESPONSAVEL">("PACIENTE");
  const [nome, setNome] = useState("");
  const [aceitaGravacao, setAceitaGravacao] = useState(false);
  const [aceitaIa, setAceitaIa] = useState(false);
  const [autorizando, setAutorizando] = useState(false);
  const [gravando, setGravando] = useState(false);

  useEffect(() => {
    if (!codigo || !segredo) return;
    api.atendimentoPublico(codigo, segredo).then(setInfo).catch((e) => setErro(e.message));
  }, [codigo, segredo]);

  // durante a chamada, acompanha se está sendo gravado (para mostrar o aviso) e o que o paciente autorizou
  useEffect(() => {
    if (!sala || !codigo || !segredo) return;
    const t = setInterval(() => api.estadoPublico(codigo, segredo).then((e) => { setGravando(e.gravando); setInfo((i) => (i ? { ...i, consentimento: e.consentimento } : i)); }).catch(() => undefined), 4000);
    return () => clearInterval(t);
  }, [sala, codigo, segredo]);

  async function entrar(comConsentimento: boolean) {
    if (!codigo || !segredo || !info) return;
    setErro(null); setEntrando(true);
    try {
      if (info.gravacaoDisponivel) {
        // registra a resposta (aceite ou recusa) antes de entrar
        const nomeDecl = nome.trim().length >= 3 ? nome.trim() : info.paciente.length >= 3 ? info.paciente : "Paciente";
        if (comConsentimento && nome.trim().length < 3) throw new Error("Escreva o nome de quem está autorizando.");
        info.consentimento = await api.consentimentoPublico(codigo, segredo, { aceitaGravacao: comConsentimento && aceitaGravacao, aceitaIa: comConsentimento && aceitaGravacao && aceitaIa, declaradoPor, nomeDeclarante: nomeDecl });
      }
      setSala(await api.entrarPublico(codigo, segredo));
    } catch (e) { setErro((e as Error).message); } finally { setEntrando(false); }
  }
  async function pararDeAutorizar() {
    if (!codigo || !segredo || !confirm("Parar de autorizar a gravação? O profissional será impedido de gravar daqui para frente.")) return;
    setAutorizando(true);
    try { const c = await api.revogarPublico(codigo, segredo); setInfo((i) => (i ? { ...i, consentimento: c } : i)); } catch (e) { setErro((e as Error).message); } finally { setAutorizando(false); }
  }

  const caixa = "mx-auto max-w-xl px-5 py-10";
  if (erro && !info) return <div className={caixa}><div className="rounded-2xl border border-ember/30 bg-ember/10 p-6 text-center text-ember">{erro}</div></div>;
  if (!info) return <div className="px-6 py-16 text-center text-sm text-ink/55">Abrindo o atendimento…</div>;

  if (sala && !saiu) {
    return (
      <div className="flex h-screen flex-col bg-ink text-paper">
        <header className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
          <span className="font-serif text-base">Atendimento com {info.profissional}</span>
          {info.gravacaoDisponivel && (gravando ? <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-0.5 text-[11px] font-bold"><span className="h-2 w-2 animate-pulse rounded-full bg-white" />Gravando</span> : <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${info.consentimento?.gravacao ? "bg-amber-500/80 text-ink" : "bg-paper/15"}`}>{info.consentimento?.gravacao ? "Gravação autorizada por você (ainda não iniciada)" : "Sem gravação"}</span>)}
          {info.consentimento?.gravacao && <button className="ml-auto rounded-lg border border-paper/30 px-3 py-1.5 font-semibold hover:bg-paper/10 disabled:opacity-50" disabled={autorizando} onClick={pararDeAutorizar}>Parar de autorizar a gravação</button>}
        </header>
        {erro && <div className="bg-ember/20 px-4 py-2 text-sm text-ember">{erro}</div>}
        <main className="min-h-0 flex-1"><ChamadaVideo url={sala.url} token={sala.token} onSaiu={() => setSaiu(true)} onErro={setErro} /></main>
      </div>
    );
  }
  if (saiu) return <div className={caixa}><div className="rounded-2xl border border-mist bg-white p-8 text-center"><h1 className="font-serif text-2xl text-ink">Atendimento finalizado</h1><p className="mt-2 text-sm text-ink/60">Você saiu da sala. Se foi sem querer, <button className="font-semibold text-sage-deep underline" onClick={() => setSaiu(false)}>volte para a sala</button>.</p></div></div>;
  if (info.encerrada) return <div className={caixa}><div className="rounded-2xl border border-mist bg-white p-8 text-center"><h1 className="font-serif text-2xl text-ink">Atendimento encerrado</h1><p className="mt-2 text-sm text-ink/60">Esta sala já foi fechada. Peça um novo link ao profissional.</p></div></div>;

  return (
    <div className={caixa}>
      <div className="rounded-2xl border border-mist bg-white p-6 sm:p-8">
        <div className="text-xs font-bold uppercase tracking-wide text-sage-deep">{info.clinica}</div>
        <h1 className="mt-1 font-serif text-2xl text-ink">Olá, {info.paciente}</h1>
        <p className="mt-1 text-sm text-ink/65">Seu atendimento online com <b>{info.profissional}</b>{info.inicioAgendado ? ` está marcado para ${new Date(info.inicioAgendado).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}` : ""}.</p>
        {erro && <div className="mt-4 rounded-lg border border-ember/30 bg-ember/10 px-3 py-2 text-sm text-ember">{erro}</div>}

        {info.gravacaoDisponivel && info.texto ? (
          <section className="mt-6 rounded-xl border border-sage-deep/30 bg-sage-deep/[0.04] p-5">
            <h2 className="font-serif text-lg text-ink">{info.texto.titulo}</h2>
            <div className="mt-2 space-y-2 text-sm leading-relaxed text-ink/75">{info.texto.paragrafos.map((p, i) => <p key={i}>{p}</p>)}</div>
            <div className="mt-4 space-y-3 border-t border-mist pt-4 text-sm">
              <div className="flex gap-4">
                <label className="flex items-center gap-2"><input type="radio" checked={declaradoPor === "PACIENTE"} onChange={() => setDeclaradoPor("PACIENTE")} />Eu sou o(a) paciente</label>
                <label className="flex items-center gap-2"><input type="radio" checked={declaradoPor === "RESPONSAVEL"} onChange={() => setDeclaradoPor("RESPONSAVEL")} />Sou o responsável legal</label>
              </div>
              <label className="block"><span className="mb-1 block text-xs font-semibold text-ink/60">Nome completo de quem está respondendo</span><input className="w-full rounded-lg border border-mist px-3 py-2" value={nome} onChange={(e) => setNome(e.target.value)} /></label>
              <label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={aceitaGravacao} onChange={(e) => { setAceitaGravacao(e.target.checked); if (!e.target.checked) setAceitaIa(false); }} /><span>{info.texto.itens.gravacao}</span></label>
              <label className={`flex items-start gap-2 ${aceitaGravacao ? "" : "opacity-40"}`}><input type="checkbox" className="mt-1" disabled={!aceitaGravacao} checked={aceitaIa} onChange={(e) => setAceitaIa(e.target.checked)} /><span>{info.texto.itens.ia}</span></label>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button className="rounded-lg bg-sage-deep px-5 py-2.5 text-sm font-semibold text-paper disabled:opacity-40" disabled={entrando || !aceitaGravacao || nome.trim().length < 3} onClick={() => entrar(true)}>{entrando ? "Entrando…" : "Autorizar e entrar na sala"}</button>
              <button className="rounded-lg border border-mist px-5 py-2.5 text-sm font-semibold text-ink/75 disabled:opacity-40" disabled={entrando} onClick={() => entrar(false)}>Entrar sem gravar</button>
            </div>
          </section>
        ) : (
          <section className="mt-6 rounded-xl bg-paper p-5 text-sm text-ink/70">
            <p>Esta sessão <b>não é gravada</b>. A chamada é protegida e só você e o(a) profissional participam.</p>
            <button className="mt-4 rounded-lg bg-sage-deep px-5 py-2.5 text-sm font-semibold text-paper disabled:opacity-40" disabled={entrando} onClick={() => entrar(false)}>{entrando ? "Entrando…" : "Entrar na sala"}</button>
          </section>
        )}
        <p className="mt-5 text-xs text-ink/45">Seu navegador vai pedir permissão para usar a câmera e o microfone. Use o Chrome, o Edge ou o Safari atualizados.</p>
      </div>
    </div>
  );
}
