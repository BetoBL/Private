import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, type Laudo, type Paciente, type PendenteDiario, type Sessao } from "../lib/api";
import { corDaFamilia } from "../lib/diarioCores";
import { temModulo } from "../lib/profissoes";
import { VisaoGeral } from "../components/VisaoGeral";
import { laudos as laudosPlural, sessoes as sessoesPlural } from "../lib/plural";

const HUMORES = [
  { emoji: "😔", label: "Difícil" },
  { emoji: "😐", label: "Neutro" },
  { emoji: "🙂", label: "Bem" },
  { emoji: "🤩", label: "Ótimo" },
];

function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

function semSaudacao(texto: string | null, nome: string | undefined): string | null {
  if (!texto) return texto;
  let limpo = texto.replace(/^\s*(bom dia|boa tarde|boa noite|olá|oi)[^!.,\n]{0,40}[!.,]\s*/i, "").trim();
  // um resumo antigo pode abrir só com o nome ("Dra. Letícia!"): tira essa primeira frase curta
  const partes = (nome ?? "").toLowerCase().split(/\s+/).filter((x) => x.length > 2 && !/^dra?\.?$/.test(x) && !x.startsWith("("));
  const m = limpo.match(/^([^!\n]{1,40})!\s*/);
  if (m && partes.some((x) => m[1].toLowerCase().includes(x))) limpo = limpo.slice(m[0].length).trim();
  return limpo ? limpo.charAt(0).toUpperCase() + limpo.slice(1) : texto;
}

function ehHoje(dataHoraIso: string): boolean {
  const data = new Date(dataHoraIso);
  const agora = new Date();
  return (
    data.getFullYear() === agora.getFullYear() && data.getMonth() === agora.getMonth() && data.getDate() === agora.getDate()
  );
}

export function PainelDoDia() {
  const { profissional } = useAuth();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [laudos, setLaudos] = useState<Laudo[]>([]);

  const [pendentesDiario, setPendentesDiario] = useState<PendenteDiario[]>([]);
  const [evolucoesPendentes, setEvolucoesPendentes] = useState<Awaited<ReturnType<typeof api.evolucoesPendentes>>>([]);
  const [nHoje, setNHoje] = useState<number | null>(null);
  const [alertas, setAlertas] = useState<Awaited<ReturnType<typeof api.alertasRisco>>>([]);
  useEffect(() => { api.alertasRisco().then(setAlertas).catch(() => undefined); }, []);
  useEffect(() => { api.evolucoesPendentes().then(setEvolucoesPendentes).catch(() => undefined); }, []);
  useEffect(() => { api.pendentesDiario().then(setPendentesDiario).catch(() => undefined); }, []);
  const [resumo, setResumo] = useState<string | null>(null);
  const [carregandoResumo, setCarregandoResumo] = useState(true);
  const [geradoEm, setGeradoEm] = useState<string | null>(null);
  const [atualizandoResumo, setAtualizandoResumo] = useState(false);

  const [humorAberto, setHumorAberto] = useState(true);
  const [humorEscolhido, setHumorEscolhido] = useState<string | null>(null);
  const [perguntarSeContaMais, setPerguntarSeContaMais] = useState(false);
  const [mostrarCampoTexto, setMostrarCampoTexto] = useState(false);
  const [humorTexto, setHumorTexto] = useState("");
  const [respostaHumor, setRespostaHumor] = useState<string | null>(null);
  const [enviandoHumor, setEnviandoHumor] = useState(false);

  useEffect(() => {
    api.listPacientes().then(setPacientes).catch(() => {});
    api.listTodasSessoes().then(setSessoes).catch(() => {});
    api.listTodosLaudos().then(setLaudos).catch(() => {});
    let cancelado = false;
    // o resumo do dia fica guardado: aparece na hora (cópia do navegador) e o servidor só refaz se a agenda mudou
    const chave = `resumo-do-dia:${new Date().toLocaleDateString("sv-SE")}`;
    try {
      const guardado = JSON.parse(localStorage.getItem(chave) ?? "null") as { resumo: string; geradoEm?: string } | null;
      if (guardado?.resumo) { setResumo(guardado.resumo); setGeradoEm(guardado.geradoEm ?? null); setCarregandoResumo(false); }
    } catch { /* sem cópia local */ }
    api
      .getResumoDoDia()
      .then((r) => {
        if (cancelado) return;
        setResumo(r.resumo); setGeradoEm(r.geradoEm ?? null);
        try { localStorage.setItem(chave, JSON.stringify({ resumo: r.resumo, geradoEm: r.geradoEm })); } catch { /* ignora */ }
      })
      .catch(() => !cancelado && setResumo((atual) => atual))
      .finally(() => !cancelado && setCarregandoResumo(false));
    return () => {
      cancelado = true;
    };
  }, []);

  async function atualizarResumo() {
    setAtualizandoResumo(true);
    try {
      const r = await api.getResumoDoDia(true);
      setResumo(r.resumo); setGeradoEm(r.geradoEm ?? null);
      try { localStorage.setItem(`resumo-do-dia:${new Date().toLocaleDateString("sv-SE")}`, JSON.stringify({ resumo: r.resumo, geradoEm: r.geradoEm })); } catch { /* ignora */ }
    } catch { /* mantém o resumo atual */ } finally { setAtualizandoResumo(false); }
  }

  function escolherHumor(label: string) {
    setHumorEscolhido(label);
    setPerguntarSeContaMais(true);
  }

  async function enviarHumor(comTexto: string) {
    const humor = [humorEscolhido, comTexto].filter(Boolean).join(" — ");
    if (!humor) return;
    setEnviandoHumor(true);
    try {
      const { resposta } = await api.enviarHumor(humor);
      setRespostaHumor(resposta);
    } catch {
      setRespostaHumor(null);
    } finally {
      setEnviandoHumor(false);
    }
  }

  const sessoesHoje = sessoes.filter((s) => ehHoje(s.dataHora));
  const laudosAguardandoRevisao = laudos.filter((l) => l.iaUtilizada && !l.iaRevisadaPeloProf);

  const dataFormatada = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 font-serif text-3xl text-ink">
            {saudacao()}, {profissional?.nome.split(" ")[0]} ✦
          </h1>
          {!resumo && !carregandoResumo && (
            <p className="mt-1 text-sm text-ink/60">
              Você tem {sessoesPlural(nHoje ?? sessoesHoje.length)} hoje{evolucoesPendentes.length > 0 ? `, ${evolucoesPendentes.length === 1 ? "1 evolução" : `${evolucoesPendentes.length} evoluções`} a concluir` : ""}{temModulo(profissional?.categoria, "laudos") ? ` e ${laudosPlural(laudosAguardandoRevisao.length)} aguardando revisão` : ""}.
            </p>
            )}
        </div>
        <div className="rounded-full bg-mist px-3.5 py-1.5 text-xs font-semibold text-sage-deep">
          {dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1)}
        </div>
      </div>

      <section className="relative mb-7 max-w-4xl text-ink">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wide text-clay">
          <span>Resumo do seu dia</span>
          <span className="flex items-center gap-3 font-semibold normal-case tracking-normal text-ink/50">
            {geradoEm && <span>gerado às {new Date(geradoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>}
            <button className="underline-offset-2 hover:text-ink hover:underline disabled:opacity-50" disabled={atualizandoResumo} onClick={atualizarResumo}>{atualizandoResumo ? "atualizando…" : "atualizar"}</button>
          </span>
        </div>
        {carregandoResumo ? (
          <p className="font-serif text-lg leading-relaxed opacity-60">Preparando seu resumo...</p>
        ) : (
          <p className="font-serif text-lg leading-relaxed">
            {semSaudacao(resumo, profissional?.nome) ??
              '"Cada laudo que você escreve é, para alguém, o início de ser compreendido. Hoje, como todos os dias, esse cuidado importa."'}
          </p>
        )}

        <div className="mt-6 border-t border-ink/15 pt-5">
          {respostaHumor ? (
            <p className="text-sm text-ink/90">
              <span className="mr-1.5">💬</span>
              {respostaHumor}
            </p>
          ) : humorAberto ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-ink/90">Como você está se sentindo hoje? (opcional)</span>
                {!perguntarSeContaMais && !mostrarCampoTexto && (
                  <button className="text-xs text-ink/40 hover:text-ink/70" onClick={() => setHumorAberto(false)}>
                    pular
                  </button>
                )}
              </div>

              {!perguntarSeContaMais && !mostrarCampoTexto && (
                <div className="flex flex-wrap gap-2">
                  {HUMORES.map((h) => (
                    <button
                      key={h.label}
                      className="rounded-full border border-ink/20 px-3 py-1.5 text-sm font-semibold text-ink/80 hover:border-ink/50 hover:text-ink"
                      onClick={() => escolherHumor(h.label)}
                    >
                      {h.emoji} {h.label}
                    </button>
                  ))}
                </div>
              )}

              {perguntarSeContaMais && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-ink/80">
                    {HUMORES.find((h) => h.label === humorEscolhido)?.emoji} Quer contar mais?
                  </span>
                  <button
                    className="rounded-full border border-ink/30 px-3 py-1 text-xs font-semibold text-ink/80 hover:border-ink/60"
                    onClick={() => {
                      setPerguntarSeContaMais(false);
                      setMostrarCampoTexto(true);
                    }}
                  >
                    Sim
                  </button>
                  <button
                    className="rounded-full border border-ink/30 px-3 py-1 text-xs font-semibold text-ink/80 hover:border-ink/60 disabled:opacity-40"
                    disabled={enviandoHumor}
                    onClick={() => {
                      setPerguntarSeContaMais(false);
                      enviarHumor("");
                    }}
                  >
                    {enviandoHumor ? "Enviando..." : "Não, é só isso"}
                  </button>
                </div>
              )}

              {mostrarCampoTexto && (
                <input
                  autoFocus
                  className="w-full rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40"
                  placeholder="Conte mais... (pressione Enter para enviar)"
                  value={humorTexto}
                  disabled={enviandoHumor}
                  onChange={(e) => setHumorTexto(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && humorTexto.trim()) {
                      e.preventDefault();
                      enviarHumor(humorTexto.trim());
                    }
                  }}
                />
              )}
            </>
          ) : (
            <button className="text-xs text-ink/40 hover:text-ink/80" onClick={() => setHumorAberto(true)}>
              + Como você está se sentindo hoje?
            </button>
          )}
        </div>
      </section>


      {alertas.length > 0 && (
        <section id="avisos" className="mb-6 scroll-mt-6 rounded-2xl border border-ember bg-ember/5 px-6 py-5">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-ember">Pacientes que precisam da sua atenção</h2>
          <ul className="divide-y divide-ember/15">
            {alertas.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                <Link className="font-semibold text-ink hover:underline" to={`/pacientes/${a.pacienteId}?aba=${a.origem === "DIARIO" ? "diario" : "escalas"}`} onClick={() => { api.alertaVisto(a.id).catch(() => undefined); setAlertas((l) => l.filter((x) => x.id !== a.id)); }}>{a.paciente}</Link>
                <span className="text-ink/60">{a.origem === "DIARIO" ? "registrou sofrimento intenso no Diário" : "marcou uma pergunta crítica numa escala"}</span>
                <span className="text-xs text-ink/45">{new Date(a.criadoEm).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                <button type="button" className="ml-auto text-xs font-semibold text-ember hover:underline" onClick={() => { api.alertaVisto(a.id).catch(() => undefined); setAlertas((l) => l.filter((x) => x.id !== a.id)); }}>Marcar como visto</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <VisaoGeral onHoje={setNHoje} pacientes={pacientes.length} evolucoesPendentes={evolucoesPendentes.length} laudosParaRevisar={laudosAguardandoRevisao.length} alertas={alertas.length} temLaudos={temModulo(profissional?.categoria, "laudos")} />

      {(evolucoesPendentes.length > 0 || pendentesDiario.length > 0) && (
        <div className="mb-8 grid items-start gap-4 lg:grid-cols-2">
      {evolucoesPendentes.length > 0 && (
        <section id="evolucoes-pendentes" className="scroll-mt-6 rounded-2xl border border-mist bg-white px-6 py-5 shadow-sm">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-clay">Evoluções para concluir</h2>
          <ul className="divide-y divide-mist">
            {evolucoesPendentes.slice(0, 6).map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-2 text-sm">
                <Link className="font-semibold text-ink hover:underline" to={`/pacientes/${e.pacienteId}/sessao?evolucao=${e.id}`}>{e.paciente}</Link>
                <span className="text-ink/55">{new Date(e.dataHora).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
                <span className="ml-auto text-xs text-ink/45">{e.comTexto ? "rascunho com texto" : "ainda sem texto"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pendentesDiario.length > 0 && (
        <section className="rounded-2xl border border-mist bg-white px-6 py-5 shadow-sm">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">Pacientes pediram para conversar sobre o Diário</h2>
          <ul className="divide-y divide-mist">
            {pendentesDiario.slice(0, 6).map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: corDaFamilia(p.familia) }} />
                <Link className="font-semibold text-ink hover:underline" to={`/pacientes/${p.pacienteId}?aba=diario`}>{p.paciente}</Link>
                <span className="text-ink/55">registro de {new Date(p.ocorridoEm.slice(0, 10) + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

        </div>
      )}
    </div>
  );
}
