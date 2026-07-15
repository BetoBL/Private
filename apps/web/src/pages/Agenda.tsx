import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Paciente, type Sessao } from "../lib/api";

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex"];

function inicioDaSemana(): Date {
  const hoje = new Date();
  const diaSemana = hoje.getDay(); // 0=domingo
  const deslocamento = diaSemana === 0 ? -6 : 1 - diaSemana;
  const segunda = new Date(hoje);
  segunda.setDate(hoje.getDate() + deslocamento);
  segunda.setHours(0, 0, 0, 0);
  return segunda;
}

export function Agenda() {
  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api.listTodasSessoes().then(setSessoes).catch((e) => setErro(e.message));
    api.listPacientes().then(setPacientes).catch((e) => setErro(e.message));
  }, []);

  const segunda = inicioDaSemana();
  const dias = DIAS.map((label, i) => {
    const data = new Date(segunda);
    data.setDate(segunda.getDate() + i);
    return { label, data };
  });

  function sessoesDoDia(data: Date) {
    return sessoes
      .filter((s) => {
        const d = new Date(s.dataHora);
        return d.getFullYear() === data.getFullYear() && d.getMonth() === data.getMonth() && d.getDate() === data.getDate();
      })
      .sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-1 font-serif text-2xl text-ink">Agenda</h1>
      <p className="mb-8 text-sm text-ink/60">Sessões de avaliação desta semana.</p>

      {erro && <div className="mb-6 rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}

      <div className="grid grid-cols-5 gap-3.5">
        {dias.map(({ label, data }) => (
          <div key={label} className="rounded-2xl border border-mist bg-white p-3.5">
            <h4 className="mb-3 font-serif text-sm">
              {label} {data.getDate()}
            </h4>
            <div className="flex flex-col gap-2">
              {sessoesDoDia(data).map((s) => {
                const paciente = pacientes.find((p) => p.id === s.pacienteId);
                return (
                  <Link
                    key={s.id}
                    to={`/pacientes/${s.pacienteId}`}
                    className="block rounded-lg bg-[#FBE8D9] px-2.5 py-2 text-[11.5px] font-semibold text-sage-deep"
                  >
                    Avaliação
                    <span className="mt-0.5 block text-[10px] font-normal opacity-70">
                      {new Date(s.dataHora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} ·{" "}
                      {paciente?.nome ?? "Paciente"}
                    </span>
                  </Link>
                );
              })}
              {sessoesDoDia(data).length === 0 && <div className="text-[11px] text-ink/40">Sem sessões</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
