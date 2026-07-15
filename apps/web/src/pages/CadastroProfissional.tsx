import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, type Profissional } from "../lib/api";

export function CadastroProfissional() {
  const { profissional } = useAuth();
  const navigate = useNavigate();
  const ehAdmin = profissional?.papel === "ADMIN";

  const [colegas, setColegas] = useState<Profissional[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [novo, setNovo] = useState({ nome: "", crp: "", email: "", senha: "" });

  useEffect(() => {
    api.listProfissionais().then(setColegas).catch((e) => setErro(e.message));
  }, []);

  async function criarProfissional() {
    if (!profissional || !novo.nome || !novo.crp || !novo.email || !novo.senha) return;
    setErro(null);
    try {
      const criado = await api.createProfissional({ clinicaId: profissional.clinicaId, ...novo });
      setColegas((prev) => [criado, ...prev]);
      setNovo({ nome: "", crp: "", email: "", senha: "" });
      setMostrarForm(false);
      navigate(`/profissionais/${criado.id}`);
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 font-serif text-2xl text-ink">Profissionais da clínica</h1>
          <p className="text-sm text-ink/60">
            {ehAdmin ? "Como administrador, você pode ver, editar e transferir pacientes entre profissionais." : "Clique em um profissional para ver os dados."}
          </p>
        </div>
        {ehAdmin && (
          <button className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper" onClick={() => setMostrarForm((v) => !v)}>
            + Novo profissional
          </button>
        )}
      </div>

      {erro && <div className="mb-6 rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}

      {mostrarForm && (
        <div className="mb-6 grid grid-cols-2 gap-3 rounded-2xl border border-mist bg-white p-4">
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-ink/70">Nome completo</span>
            <input className="w-full rounded-lg border border-mist px-3 py-2" value={novo.nome} onChange={(e) => setNovo((f) => ({ ...f, nome: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-ink/70">CRP</span>
            <input className="w-full rounded-lg border border-mist px-3 py-2" value={novo.crp} onChange={(e) => setNovo((f) => ({ ...f, crp: e.target.value }))} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-ink/70">E-mail</span>
            <input
              type="email"
              className="w-full rounded-lg border border-mist px-3 py-2"
              value={novo.email}
              onChange={(e) => setNovo((f) => ({ ...f, email: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-ink/70">Senha provisória</span>
            <input
              type="password"
              className="w-full rounded-lg border border-mist px-3 py-2"
              value={novo.senha}
              onChange={(e) => setNovo((f) => ({ ...f, senha: e.target.value }))}
            />
          </label>
          <button
            className="col-span-2 self-start rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper disabled:opacity-40"
            disabled={!novo.nome || !novo.crp || !novo.email || novo.senha.length < 8}
            onClick={criarProfissional}
          >
            Criar
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-mist bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mist text-left text-[11.5px] uppercase tracking-wide text-ink/50">
              <th className="px-5 py-3 font-normal">Nome</th>
              <th className="px-5 py-3 font-normal">CRP</th>
              <th className="px-5 py-3 font-normal">E-mail</th>
              <th className="px-5 py-3 font-normal">Especialidades</th>
              <th className="px-5 py-3 font-normal">Papel</th>
            </tr>
          </thead>
          <tbody>
            {colegas.map((c) => (
              <tr
                key={c.id}
                className="cursor-pointer border-b border-mist last:border-b-0 hover:bg-paper/60"
                onClick={() => navigate(`/profissionais/${c.id}`)}
              >
                <td className="px-5 py-3 font-semibold">
                  {c.nome} {c.id === profissional?.id && <span className="font-normal text-ink/40">(você)</span>}
                </td>
                <td className="px-5 py-3">{c.crp}</td>
                <td className="px-5 py-3">{c.email}</td>
                <td className="px-5 py-3 text-ink/60">{c.especialidades.join(", ") || "—"}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      c.papel === "ADMIN" ? "bg-sage-deep/10 text-sage-deep" : "bg-mist text-ink/60"
                    }`}
                  >
                    {c.papel === "ADMIN" ? "Administrador" : "Psicólogo(a)"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
