import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, type Paciente, type PapelProfissional, type Profissional } from "../lib/api";

function formatarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  if (digitos.length <= 2) return digitos.replace(/^(\d*)/, "($1");
  if (digitos.length <= 6) return digitos.replace(/^(\d{2})(\d*)/, "($1) $2");
  if (digitos.length <= 10) return digitos.replace(/^(\d{2})(\d{4})(\d*)/, "($1) $2-$3");
  return digitos.replace(/^(\d{2})(\d{5})(\d*)/, "($1) $2-$3");
}

export function FichaProfissional() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profissional: logado } = useAuth();
  const ehAdmin = logado?.papel === "ADMIN";
  const ehEuMesmo = id === logado?.id;
  const podeEditar = ehAdmin || ehEuMesmo;

  const [dados, setDados] = useState<Profissional | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const [form, setForm] = useState({ nome: "", crp: "", telefone: "", enderecoParticular: "", formacao: "" });
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [novaEspecialidade, setNovaEspecialidade] = useState("");
  const [papel, setPapel] = useState<PapelProfissional>("PSICOLOGO");

  const [colegas, setColegas] = useState<Profissional[]>([]);
  const [pacientesDele, setPacientesDele] = useState<Paciente[]>([]);

  useEffect(() => {
    if (!id) return;
    let cancelado = false;
    api
      .getProfissional(id)
      .then((p) => {
        if (cancelado) return;
        setDados(p);
        setForm({
          nome: p.nome,
          crp: p.crp,
          telefone: p.telefone ?? "",
          enderecoParticular: p.enderecoParticular ?? "",
          formacao: p.formacao ?? "",
        });
        setEspecialidades(p.especialidades);
        setPapel(p.papel);
      })
      .catch((e) => !cancelado && setErro(e.message));
    if (ehAdmin) {
      api.listProfissionais().then((c) => !cancelado && setColegas(c)).catch((e) => !cancelado && setErro(e.message));
      api.listPacientes(id).then((p) => !cancelado && setPacientesDele(p)).catch((e) => !cancelado && setErro(e.message));
    }
    return () => {
      cancelado = true;
    };
  }, [id, ehAdmin]);

  function adicionarEspecialidade() {
    const valor = novaEspecialidade.trim();
    if (!valor || especialidades.includes(valor)) return;
    setEspecialidades((prev) => [...prev, valor]);
    setNovaEspecialidade("");
  }

  function removerEspecialidade(valor: string) {
    setEspecialidades((prev) => prev.filter((e) => e !== valor));
  }

  async function salvar() {
    if (!id) return;
    setErro(null);
    setMensagem(null);
    try {
      const atualizado = await api.updateProfissional(id, {
        ...form,
        especialidades,
        ...(ehAdmin && !ehEuMesmo ? { papel } : {}),
      });
      setDados(atualizado);
      setMensagem("Dados salvos.");
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function excluir() {
    if (!id || !dados) return;
    if (!confirm(`Excluir o cadastro de ${dados.nome}? Esta ação não pode ser desfeita.`)) return;
    setErro(null);
    try {
      await api.deleteProfissional(id);
      navigate("/profissionais");
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function transferirPaciente(pacienteId: string, novoProfissionalId: string) {
    if (!novoProfissionalId) return;
    setErro(null);
    try {
      await api.updatePaciente(pacienteId, { profissionalId: novoProfissionalId });
      setPacientesDele((prev) => prev.filter((p) => p.id !== pacienteId));
      setMensagem("Paciente transferido.");
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  if (!dados) {
    return <div className="px-6 py-10 text-sm text-ink/60">{erro ?? "Carregando..."}</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-mist text-xl font-bold text-sage-deep">
          {dados.nome
            .split(" ")
            .slice(0, 2)
            .map((n) => n[0])
            .join("")}
        </span>
        <div>
          <h1 className="font-serif text-2xl text-ink">
            {dados.nome} {ehEuMesmo && <span className="text-lg font-normal text-ink/40">(você)</span>}
          </h1>
          <div className="text-sm text-ink/60">
            <Link to="/profissionais" className="hover:underline">
              ← Voltar para profissionais
            </Link>
          </div>
        </div>
      </div>

      {erro && <div className="mb-6 rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
      {mensagem && <div className="mb-6 rounded-lg border border-sage-deep/30 bg-sage-deep/10 px-4 py-3 text-sm text-sage-deep">{mensagem}</div>}

      <div className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">Dados</div>
      <div className="mb-8 rounded-2xl border border-mist bg-white p-5">
        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-ink/70">Nome completo</span>
            <input
              disabled={!podeEditar}
              className="w-full rounded-lg border border-mist px-3 py-2 disabled:bg-paper disabled:text-ink/50"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-ink/70">CRP</span>
            <input
              disabled={!podeEditar}
              className="w-full rounded-lg border border-mist px-3 py-2 disabled:bg-paper disabled:text-ink/50"
              value={form.crp}
              onChange={(e) => setForm((f) => ({ ...f, crp: e.target.value }))}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-ink/70">Telefone</span>
            <input
              disabled={!podeEditar}
              placeholder="(00) 00000-0000"
              className="w-full rounded-lg border border-mist px-3 py-2 disabled:bg-paper disabled:text-ink/50"
              value={form.telefone}
              onChange={(e) => setForm((f) => ({ ...f, telefone: formatarTelefone(e.target.value) }))}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-ink/70">E-mail</span>
            <input disabled className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-ink/50" value={dados.email} />
          </label>
          <label className="col-span-2 text-sm">
            <span className="mb-1 block font-semibold text-ink/70">Endereço particular</span>
            <input
              disabled={!podeEditar}
              className="w-full rounded-lg border border-mist px-3 py-2 disabled:bg-paper disabled:text-ink/50"
              value={form.enderecoParticular}
              onChange={(e) => setForm((f) => ({ ...f, enderecoParticular: e.target.value }))}
            />
          </label>
          <label className="col-span-2 text-sm">
            <span className="mb-1 block font-semibold text-ink/70">Formação</span>
            <input
              disabled={!podeEditar}
              className="w-full rounded-lg border border-mist px-3 py-2 disabled:bg-paper disabled:text-ink/50"
              value={form.formacao}
              onChange={(e) => setForm((f) => ({ ...f, formacao: e.target.value }))}
            />
          </label>
          <div className="col-span-2 text-sm">
            <span className="mb-1 block font-semibold text-ink/70">Especialidades</span>
            <div className="mb-2 flex flex-wrap gap-2">
              {especialidades.map((esp) => (
                <span key={esp} className="flex items-center gap-1.5 rounded-full bg-mist px-3 py-1 text-xs font-semibold text-ink/70">
                  {esp}
                  {podeEditar && (
                    <button className="text-ink/40 hover:text-ember" onClick={() => removerEspecialidade(esp)}>
                      ×
                    </button>
                  )}
                </span>
              ))}
              {especialidades.length === 0 && <span className="text-xs text-ink/40">Nenhuma especialidade cadastrada.</span>}
            </div>
            {podeEditar && (
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-mist px-3 py-2 text-sm"
                  placeholder="Ex: Neuropsicologia infantil"
                  value={novaEspecialidade}
                  onChange={(e) => setNovaEspecialidade(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), adicionarEspecialidade())}
                />
                <button className="rounded-lg border border-sage-deep px-3 py-2 text-sm font-semibold text-sage-deep" onClick={adicionarEspecialidade}>
                  + Adicionar
                </button>
              </div>
            )}
          </div>
          {ehAdmin && !ehEuMesmo && (
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-ink/70">Papel na clínica</span>
              <select
                className="w-full rounded-lg border border-mist px-3 py-2"
                value={papel}
                onChange={(e) => setPapel(e.target.value as PapelProfissional)}
              >
                <option value="PSICOLOGO">Psicólogo(a)</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </label>
          )}
        </div>
        {podeEditar && (
          <div className="mt-4 flex items-center gap-3">
            <button className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper" onClick={salvar}>
              Salvar
            </button>
            {ehAdmin && !ehEuMesmo && (
              <button className="text-sm font-semibold text-ember" onClick={excluir}>
                Excluir profissional
              </button>
            )}
          </div>
        )}
      </div>

      {ehAdmin && !ehEuMesmo && pacientesDele.length > 0 && (
        <>
          <div className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">
            Pacientes de {dados.nome.split(" ")[0]} — transferir para outro profissional
          </div>
          <div className="overflow-hidden rounded-2xl border border-mist bg-white">
            <table className="w-full text-sm">
              <tbody>
                {pacientesDele.map((p) => (
                  <tr key={p.id} className="border-b border-mist last:border-b-0">
                    <td className="px-5 py-3">{p.nome}</td>
                    <td className="px-5 py-3 text-right">
                      <select
                        className="rounded-lg border border-mist px-3 py-1.5 text-sm"
                        defaultValue=""
                        onChange={(e) => transferirPaciente(p.id, e.target.value)}
                      >
                        <option value="" disabled>
                          Transferir para...
                        </option>
                        {colegas
                          .filter((c) => c.id !== id)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nome}
                            </option>
                          ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
