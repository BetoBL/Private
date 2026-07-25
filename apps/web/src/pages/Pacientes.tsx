import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, type Paciente, type Sexo } from "../lib/api";

function calcularIdade(dataNascimento: string): number {
  const nascimento = new Date(dataNascimento);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const aindaNaoFezAniversario =
    hoje.getMonth() < nascimento.getMonth() || (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());
  if (aindaNaoFezAniversario) idade -= 1;
  return idade;
}

export function Pacientes() {
  const { profissional } = useAuth();
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState<Sexo | "">("");

  useEffect(() => {
    api.listPacientes().then(setPacientes).catch((e) => setErro(e.message));
  }, []);

  const filtrados = pacientes.filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()));

  async function criarPaciente() {
    if (!profissional || !nome || !dataNascimento) return;
    setErro(null);
    try {
      const criado = await api.createPaciente({
        profissionalId: profissional.id,
        nome,
        dataNascimento,
        ...(sexo ? { sexo } : {}),
      });
      setPacientes((prev) => [criado, ...prev]);
      setNome("");
      setDataNascimento("");
      setSexo("");
      setMostrarForm(false);
      navigate(`/pacientes/${criado.id}`);
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 font-serif text-2xl text-ink">Pacientes</h1>
          <p className="text-sm text-ink/60">Todos os casos cadastrados na clínica.</p>
        </div>
        <button className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper" onClick={() => setMostrarForm((v) => !v)}>
          + Novo paciente
        </button>
      </div>

      {erro && <div className="mb-6 rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}

      {mostrarForm && (
        <div className="mb-6 flex flex-wrap items-end gap-2 rounded-2xl border border-mist bg-white p-4">
          <label className="flex-1 text-sm">
            <span className="mb-1 block font-semibold text-ink/70">Nome completo</span>
            <input className="w-full rounded-lg border border-mist px-3 py-2" value={nome} onChange={(e) => setNome(e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-ink/70">Data de nascimento</span>
            <input
              type="date"
              className="rounded-lg border border-mist px-3 py-2"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-ink/70">Sexo</span>
            <select
              className="rounded-lg border border-mist px-3 py-2"
              value={sexo}
              onChange={(e) => setSexo(e.target.value as Sexo | "")}
            >
              <option value="">Não informado</option>
              <option value="FEMININO">Feminino</option>
              <option value="MASCULINO">Masculino</option>
            </select>
          </label>
          <button
            className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper disabled:opacity-40"
            disabled={!nome || !dataNascimento}
            onClick={criarPaciente}
          >
            Criar
          </button>
        </div>
      )}

      <input
        className="mb-4 w-full rounded-lg border border-mist bg-white px-4 py-2.5 text-sm"
        placeholder="Buscar por nome..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <div className="overflow-hidden rounded-2xl border border-mist bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mist text-left text-[11.5px] uppercase tracking-wide text-ink/50">
              <th className="px-5 py-3.5 font-normal">Paciente</th>
              <th className="px-5 py-3.5 font-normal">Idade</th>
              <th className="px-5 py-3.5 font-normal">Escolaridade</th>
              <th className="px-5 py-3.5 font-normal">Cadastrado em</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => (
              <tr
                key={p.id}
                className="cursor-pointer border-b border-mist last:border-b-0 hover:bg-paper/60"
                onClick={() => navigate(`/pacientes/${p.id}`)}
              >
                <td className="flex items-center gap-2.5 px-5 py-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mist text-xs font-bold text-sage-deep">
                    {p.nome
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")}
                  </span>
                  {p.nome}
                </td>
                <td className="px-5 py-3.5">{calcularIdade(p.dataNascimento)} anos</td>
                <td className="px-5 py-3.5">{p.escolaridade ?? "—"}</td>
                <td className="px-5 py-3.5">{new Date(p.criadoEm).toLocaleDateString("pt-BR")}</td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-ink/50">
                  Nenhum paciente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
