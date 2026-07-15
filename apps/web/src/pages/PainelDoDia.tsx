import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, type Laudo, type Paciente, type Sessao } from "../lib/api";

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

  const [resumo, setResumo] = useState<string | null>(null);
  const [carregandoResumo, setCarregandoResumo] = useState(true);

  const [humorAberto, setHumorAberto] = useState(true);
  const [humorEscolhido, setHumorEscolhido] = useState<string | null>(null);
  const [humorTexto, setHumorTexto] = useState("");
  const [respostaHumor, setRespostaHumor] = useState<string | null>(null);
  const [enviandoHumor, setEnviandoHumor] = useState(false);

  useEffect(() => {
    api.listPacientes().then(setPacientes).catch(() => {});
    api.listTodasSessoes().then(setSessoes).catch(() => {});
    api.listTodosLaudos().then(setLaudos).catch(() => {});
    let cancelado = false;
    api
      .getResumoDoDia()
      .then((r) => !cancelado && setResumo(r.resumo))
      .catch(() => !cancelado && setResumo(null))
      .finally(() => !cancelado && setCarregandoResumo(false));
    return () => {
      cancelado = true;
    };
  }, []);

  async function enviarHumor() {
    const humor = [humorEscolhido, humorTexto].filter(Boolean).join(" — ");
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
          <p className="text-sm text-ink/60">
            Você tem {sessoesHoje.length} sessão(ões) hoje e {laudosAguardandoRevisao.length} laudo(s) aguardando revisão.
          </p>
        </div>
        <div className="rounded-full bg-mist px-3.5 py-1.5 text-xs font-semibold text-sage-deep">
          {dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1)}
        </div>
      </div>

      <section className="relative mb-6 overflow-hidden rounded-2xl bg-ink px-8 py-7 text-paper">
        <div className="mb-3 text-xs font-bold uppercase tracking-wide text-clay">Resumo do seu dia</div>
        {carregandoResumo ? (
          <p className="max-w-xl font-serif text-lg leading-relaxed opacity-60">Preparando seu resumo...</p>
        ) : (
          <p className="max-w-xl font-serif text-lg leading-relaxed">
            {resumo ??
              '"Cada laudo que você escreve é, para alguém, o início de ser compreendido. Hoje, como todos os dias, esse cuidado importa."'}
          </p>
        )}
      </section>

      <section className="mb-10 rounded-2xl border border-mist bg-white p-5">
        {respostaHumor ? (
          <p className="text-sm text-ink/80">
            <span className="mr-1.5">💬</span>
            {respostaHumor}
          </p>
        ) : humorAberto ? (
          <>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">Como você está se sentindo hoje? (opcional)</span>
              <button className="text-xs text-ink/40 hover:text-ink/70" onClick={() => setHumorAberto(false)}>
                pular
              </button>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              {HUMORES.map((h) => (
                <button
                  key={h.label}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                    humorEscolhido === h.label
                      ? "border-sage-deep bg-sage-deep/10 text-sage-deep"
                      : "border-mist text-ink/60 hover:border-sage-deep hover:text-sage-deep"
                  }`}
                  onClick={() => setHumorEscolhido(h.label)}
                >
                  {h.emoji} {h.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-mist px-3 py-2 text-sm"
                placeholder="Quer contar mais? (opcional)"
                value={humorTexto}
                onChange={(e) => setHumorTexto(e.target.value)}
              />
              <button
                className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper disabled:opacity-40"
                disabled={(!humorEscolhido && !humorTexto) || enviandoHumor}
                onClick={enviarHumor}
              >
                {enviandoHumor ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </>
        ) : (
          <button className="text-xs text-ink/40 hover:text-sage-deep" onClick={() => setHumorAberto(true)}>
            + Como você está se sentindo hoje?
          </button>
        )}
      </section>

      <div className="mb-4 text-xs font-bold uppercase tracking-wide text-sage-deep">Visão geral</div>
      <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-mist bg-white p-5">
          <div className="font-serif text-3xl text-sage-deep">{pacientes.length}</div>
          <div className="mt-1 text-xs text-ink/60">pacientes cadastrados</div>
        </div>
        <div className="rounded-2xl border border-mist bg-white p-5">
          <div className="font-serif text-3xl text-sage-deep">{sessoesHoje.length}</div>
          <div className="mt-1 text-xs text-ink/60">sessões hoje</div>
        </div>
        <div className="rounded-2xl border border-mist bg-white p-5">
          <div className="font-serif text-3xl text-sage-deep">{laudosAguardandoRevisao.length}</div>
          <div className="mt-1 text-xs text-ink/60">laudo(s) aguardando revisão</div>
        </div>
        <div className="rounded-2xl border border-mist bg-white p-5">
          <div className="font-serif text-3xl text-sage-deep">{laudos.filter((l) => l.status === "FINALIZADO" || l.status === "ENTREGUE").length}</div>
          <div className="mt-1 text-xs text-ink/60">laudos finalizados</div>
        </div>
      </div>

      <div className="mb-4 text-xs font-bold uppercase tracking-wide text-sage-deep">Módulos</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/pacientes" className="rounded-2xl border border-mist bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-mist text-sage-deep">◐</div>
          <h3 className="mb-1 font-serif text-base">Pacientes</h3>
          <p className="mb-3 text-xs text-ink/60">Ficha completa, anamnese, anexos de cada caso em andamento.</p>
          <div className="text-xs font-semibold text-clay">{pacientes.length} paciente(s)</div>
        </Link>
        <Link to="/testes" className="rounded-2xl border border-mist bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-mist text-sage-deep">▤</div>
          <h3 className="mb-1 font-serif text-base">Testes &amp; Correção</h3>
          <p className="mb-3 text-xs text-ink/60">Catálogo de testes com correção e cálculo automáticos.</p>
        </Link>
        <Link to="/laudo" className="rounded-2xl border border-mist bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-mist text-sage-deep">✎</div>
          <h3 className="mb-1 font-serif text-base">Laudos</h3>
          <p className="mb-3 text-xs text-ink/60">Rascunho assistido por IA, no seu estilo, sempre revisado por você.</p>
        </Link>
        <Link to="/agenda" className="rounded-2xl border border-mist bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-mist text-sage-deep">▦</div>
          <h3 className="mb-1 font-serif text-base">Agenda</h3>
          <p className="mb-3 text-xs text-ink/60">Sessões de avaliação da semana.</p>
        </Link>
        <div className="rounded-2xl border border-dashed border-mist bg-white p-5 opacity-50">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg text-ink">$</div>
          <h3 className="mb-1 font-serif text-base">Convênios</h3>
          <p className="mb-3 text-xs text-ink/60">Tabelas de valores, guias e medições. Módulo desativado.</p>
        </div>
        <div className="rounded-2xl border border-dashed border-mist bg-white p-5 opacity-50">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg text-ink">+</div>
          <h3 className="mb-1 font-serif text-base">Trânsito / CNH</h3>
          <p className="mb-3 text-xs text-ink/60">Parecer para RENACH. Módulo desativado.</p>
        </div>
      </div>
    </div>
  );
}
