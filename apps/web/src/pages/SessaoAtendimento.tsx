import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ProntuarioDoPaciente } from "../components/ProntuarioDoPaciente";
import { api, type LinhaSessoes, type Paciente } from "../lib/api";

// Ambiente da sessão: o profissional anota durante o atendimento (folha privada) e a IA ajuda a montar a evolução do prontuário.
const idadeDe = (iso: string) => { const n = new Date(iso), h = new Date(); let i = h.getFullYear() - n.getUTCFullYear(); if (h.getMonth() < n.getUTCMonth() || (h.getMonth() === n.getUTCMonth() && h.getDate() < n.getUTCDate())) i--; return i; };

export function SessaoAtendimento() {
  const { id } = useParams();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [linha, setLinha] = useState<LinhaSessoes | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return;
    api.getPaciente(id).then(setPaciente).catch((e) => setErro((e as Error).message));
    api.linhaSessoes(id).then(setLinha).catch(() => undefined);
  }, [id]);

  if (!id) return null;
  const proxima = [...(linha?.itens ?? [])].filter((i) => !i.passada && i.eventoId).sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())[0];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Link to={`/pacientes/${id}?aba=sessoes`} className="rounded-full border border-mist bg-white px-4 py-2 text-sm font-semibold text-ink/65 shadow-sm hover:border-sage hover:text-sage-deep">← Sessões do paciente</Link>
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-mist font-bold text-sage-deep">{paciente?.nome.split(" ").slice(0, 2).map((n) => n[0]).join("")}</span>
          <div className="min-w-0"><h1 className="truncate font-serif text-2xl text-ink">{paciente?.nome ?? "Carregando…"}</h1>{paciente && <p className="text-sm text-ink/55">{idadeDe(paciente.dataNascimento)} anos{paciente.fazLaudo ? " · com laudo" : ""}</p>}</div>
        </div>
        <Link to={`/pacientes/${id}`} className="rounded-full border border-mist bg-white px-4 py-2 text-sm font-semibold text-ink/65 shadow-sm hover:border-sage hover:text-sage-deep">Abrir ficha</Link>
      </div>

      {erro && <div className="mb-4 rounded-xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <Link to={`/pacientes/${id}?aba=sessoes`} className="flex items-center gap-3 rounded-2xl border border-mist bg-white p-4 shadow-sm transition hover:shadow-md">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${linha?.totais.evolucoesFaltando ? "bg-ember/10" : "bg-sage/15"}`}>📝</span>
          <div><div className="text-xs font-semibold uppercase tracking-wide text-ink/45">Evoluções faltantes</div><div className="font-semibold text-ink">{linha ? (linha.totais.evolucoesFaltando ? `${linha.totais.evolucoesFaltando} deste paciente` : "Tudo em dia") : "…"}</div></div>
        </Link>
        <div className="flex items-center gap-3 rounded-2xl border border-mist bg-gradient-to-br from-white to-sage/10 p-4 shadow-sm">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage/15 text-lg">📅</span>
          <div><div className="text-xs font-semibold uppercase tracking-wide text-ink/45">Próxima sessão</div><div className="font-semibold text-ink">{proxima ? new Date(proxima.inicio).toLocaleString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "Nada agendado"}</div></div>
        </div>
      </div>

      <ProntuarioDoPaciente pacienteId={id} modoSessao />
    </div>
  );
}
