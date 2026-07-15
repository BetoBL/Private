import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, type Laudo, type Paciente, type Sessao } from "../lib/api";

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

  useEffect(() => {
    api.listPacientes().then(setPacientes).catch(() => {});
    api.listTodasSessoes().then(setSessoes).catch(() => {});
    api.listTodosLaudos().then(setLaudos).catch(() => {});
  }, []);

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

      <section className="relative mb-10 overflow-hidden rounded-2xl bg-ink px-8 py-7 text-paper">
        <div className="mb-3 text-xs font-bold uppercase tracking-wide text-clay">Cantinho do café</div>
        <p className="max-w-xl font-serif text-lg leading-relaxed">
          "Cada laudo que você escreve é, para alguém, o início de ser compreendido. Hoje, como todos os dias, esse cuidado importa."
        </p>
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
