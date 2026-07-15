import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export function CadastroClinica() {
  const { profissional } = useAuth();
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [form, setForm] = useState({ razaoSocial: "", cnpj: "", endereco: "", telefone: "", corPrimaria: "", corSecundaria: "" });

  useEffect(() => {
    if (!profissional) return;
    let cancelado = false;
    api
      .getClinica(profissional.clinicaId)
      .then((c) => {
        if (cancelado) return;
        setForm({
          razaoSocial: c.razaoSocial,
          cnpj: c.cnpj ?? "",
          endereco: c.endereco ?? "",
          telefone: c.telefone ?? "",
          corPrimaria: c.corPrimaria ?? "",
          corSecundaria: c.corSecundaria ?? "",
        });
      })
      .catch((e) => !cancelado && setErro(e.message));
    return () => {
      cancelado = true;
    };
  }, [profissional]);

  async function salvar() {
    if (!profissional) return;
    setErro(null);
    setMensagem(null);
    try {
      await api.updateClinica(profissional.clinicaId, form);
      setMensagem("Dados da clínica salvos.");
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-1 font-serif text-2xl text-ink">Dados da Clínica</h1>
      <p className="mb-8 text-sm text-ink/60">Usados no cabeçalho dos laudos e nos documentos exportados.</p>

      {erro && <div className="mb-6 rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
      {mensagem && <div className="mb-6 rounded-lg border border-sage-deep/30 bg-sage-deep/10 px-4 py-3 text-sm text-sage-deep">{mensagem}</div>}

      <div className="grid grid-cols-2 gap-4 rounded-2xl border border-mist bg-white p-5">
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-ink/70">Razão social</span>
          <input
            className="w-full rounded-lg border border-mist px-3 py-2"
            value={form.razaoSocial}
            onChange={(e) => setForm((f) => ({ ...f, razaoSocial: e.target.value }))}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-ink/70">CNPJ</span>
          <input
            className="w-full rounded-lg border border-mist px-3 py-2"
            value={form.cnpj}
            onChange={(e) => setForm((f) => ({ ...f, cnpj: e.target.value }))}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-ink/70">Endereço</span>
          <input
            className="w-full rounded-lg border border-mist px-3 py-2"
            value={form.endereco}
            onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))}
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
          <span className="mb-1 block font-semibold text-ink/70">Cor primária</span>
          <input
            className="w-full rounded-lg border border-mist px-3 py-2"
            value={form.corPrimaria}
            onChange={(e) => setForm((f) => ({ ...f, corPrimaria: e.target.value }))}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-ink/70">Cor secundária</span>
          <input
            className="w-full rounded-lg border border-mist px-3 py-2"
            value={form.corSecundaria}
            onChange={(e) => setForm((f) => ({ ...f, corSecundaria: e.target.value }))}
          />
        </label>
      </div>

      <button className="mt-4 rounded-lg bg-sage-deep px-5 py-2.5 text-sm font-semibold text-paper" onClick={salvar}>
        Salvar dados da clínica
      </button>
    </div>
  );
}
