import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB",
  "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

// Aceita o CNPJ numérico atual e o novo modelo alfanumérico da Receita Federal (previsto
// para o fim de julho/2026): os 12 primeiros caracteres podem ser letra ou dígito, os 2
// dígitos verificadores finais continuam numéricos.
function formatarCnpj(valor: string): string {
  const limpo = valor
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 14);
  const blocos = [limpo.slice(0, 2), limpo.slice(2, 5), limpo.slice(5, 8), limpo.slice(8, 12), limpo.slice(12, 14)];
  let resultado = blocos[0];
  if (blocos[1]) resultado += `.${blocos[1]}`;
  if (blocos[2]) resultado += `.${blocos[2]}`;
  if (blocos[3]) resultado += `/${blocos[3]}`;
  if (blocos[4]) resultado += `-${blocos[4]}`;
  return resultado;
}

function formatarCep(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 8);
  return digitos.length <= 5 ? digitos : `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
}

export function CadastroClinica() {
  const { profissional } = useAuth();
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [form, setForm] = useState({
    razaoSocial: "",
    nomeFantasia: "",
    cnpj: "",
    endereco: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    telefone: "",
    corPrimaria: "",
    corSecundaria: "",
  });

  useEffect(() => {
    if (!profissional) return;
    let cancelado = false;
    api
      .getClinica(profissional.clinicaId)
      .then((c) => {
        if (cancelado) return;
        setForm({
          razaoSocial: c.razaoSocial,
          nomeFantasia: c.nomeFantasia ?? "",
          cnpj: c.cnpj ?? "",
          endereco: c.endereco ?? "",
          bairro: c.bairro ?? "",
          cidade: c.cidade ?? "",
          estado: c.estado ?? "",
          cep: c.cep ?? "",
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
          <span className="mb-1 block font-semibold text-ink/70">Nome fantasia</span>
          <input
            className="w-full rounded-lg border border-mist px-3 py-2"
            placeholder="Usado em todo o sistema, exceto na nota fiscal"
            value={form.nomeFantasia}
            onChange={(e) => setForm((f) => ({ ...f, nomeFantasia: e.target.value }))}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-ink/70">CNPJ</span>
          <input
            className="w-full rounded-lg border border-mist px-3 py-2"
            placeholder="XX.XXX.XXX/XXXX-XX"
            value={form.cnpj}
            onChange={(e) => setForm((f) => ({ ...f, cnpj: formatarCnpj(e.target.value) }))}
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

        <label className="col-span-2 text-sm">
          <span className="mb-1 block font-semibold text-ink/70">Endereço (logradouro e número)</span>
          <input
            className="w-full rounded-lg border border-mist px-3 py-2"
            value={form.endereco}
            onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-ink/70">Bairro</span>
          <input
            className="w-full rounded-lg border border-mist px-3 py-2"
            value={form.bairro}
            onChange={(e) => setForm((f) => ({ ...f, bairro: e.target.value }))}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-ink/70">CEP</span>
          <input
            className="w-full rounded-lg border border-mist px-3 py-2"
            placeholder="00000-000"
            value={form.cep}
            onChange={(e) => setForm((f) => ({ ...f, cep: formatarCep(e.target.value) }))}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-ink/70">Cidade</span>
          <input
            className="w-full rounded-lg border border-mist px-3 py-2"
            value={form.cidade}
            onChange={(e) => setForm((f) => ({ ...f, cidade: e.target.value }))}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-ink/70">Estado</span>
          <select
            className="w-full rounded-lg border border-mist px-3 py-2"
            value={form.estado}
            onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}
          >
            <option value="">Selecione...</option>
            {UFS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
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
