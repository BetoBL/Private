import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api, type Profissional } from "../lib/api";

export function CadastroProfissional() {
  const { profissional } = useAuth();
  const [colegas, setColegas] = useState<Profissional[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", crp: "", telefone: "", formacao: "" });

  useEffect(() => {
    api.listProfissionais().then(setColegas).catch((e) => setErro(e.message));
  }, []);

  useEffect(() => {
    if (!profissional) return;
    setForm((f) => ({ ...f, nome: profissional.nome, crp: profissional.crp }));
  }, [profissional]);

  async function salvar() {
    if (!profissional) return;
    setErro(null);
    setMensagem(null);
    try {
      const atualizado = await api.updateProfissional(profissional.id, form);
      setColegas((prev) => prev.map((c) => (c.id === atualizado.id ? atualizado : c)));
      setMensagem("Dados salvos.");
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-1 font-serif text-2xl text-ink">Cadastro de Profissional</h1>
      <p className="mb-8 text-sm text-ink/60">Cada profissional tem seu próprio Perfil de Atuação e catálogo de testes.</p>

      {erro && <div className="mb-6 rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
      {mensagem && <div className="mb-6 rounded-lg border border-sage-deep/30 bg-sage-deep/10 px-4 py-3 text-sm text-sage-deep">{mensagem}</div>}

      <div className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">Meus dados</div>
      <div className="mb-8 grid grid-cols-2 gap-4 rounded-2xl border border-mist bg-white p-5">
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-ink/70">Nome completo</span>
          <input
            className="w-full rounded-lg border border-mist px-3 py-2"
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-ink/70">CRP</span>
          <input
            className="w-full rounded-lg border border-mist px-3 py-2"
            value={form.crp}
            onChange={(e) => setForm((f) => ({ ...f, crp: e.target.value }))}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-ink/70">Telefone</span>
          <input
            className="w-full rounded-lg border border-mist px-3 py-2"
            value={form.telefone}
            onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-ink/70">Formação / especializações</span>
          <input
            className="w-full rounded-lg border border-mist px-3 py-2"
            value={form.formacao}
            onChange={(e) => setForm((f) => ({ ...f, formacao: e.target.value }))}
          />
        </label>
        <button className="col-span-2 self-start rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper" onClick={salvar}>
          Salvar
        </button>
      </div>

      <div className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">Profissionais da clínica</div>
      <div className="overflow-hidden rounded-2xl border border-mist bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mist text-left text-[11.5px] uppercase tracking-wide text-ink/50">
              <th className="px-5 py-3 font-normal">Nome</th>
              <th className="px-5 py-3 font-normal">CRP</th>
              <th className="px-5 py-3 font-normal">E-mail</th>
            </tr>
          </thead>
          <tbody>
            {colegas.map((c) => (
              <tr key={c.id} className="border-b border-mist last:border-b-0">
                <td className="px-5 py-3">{c.nome}</td>
                <td className="px-5 py-3">{c.crp}</td>
                <td className="px-5 py-3">{c.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
