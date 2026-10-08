import { useAviso } from "../lib/aviso";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api, type Convenio } from "../lib/api";
import { UploadImagem } from "../components/UploadImagem";

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
  const [mensagem, setMensagem] = useAviso();
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
    logoUrl: "",
    marcaDaguaUrl: "",
    slogan: "",
    instagram: "",
    whatsapp: "",
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
          logoUrl: c.logoUrl ?? "",
          marcaDaguaUrl: c.marcaDaguaUrl ?? "",
          slogan: c.slogan ?? "",
          instagram: c.instagram ?? "",
          whatsapp: c.whatsapp ?? "",
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

        <div className="col-span-2 mt-2 border-t border-mist pt-4 text-xs font-bold uppercase tracking-wide text-sage-deep">Papel timbrado do laudo</div>
        <UploadImagem rotulo="Logotipo (cabeçalho)" valor={form.logoUrl || null} onChange={(v) => setForm((f) => ({ ...f, logoUrl: v }))} ajuda="PNG com fundo transparente funciona melhor." />
        <UploadImagem rotulo="Marca-d'água (fundo da página)" valor={form.marcaDaguaUrl || null} onChange={(v) => setForm((f) => ({ ...f, marcaDaguaUrl: v }))} ajuda="Imagem clara e discreta; aparece atrás do texto." />
        <label className="col-span-2 text-sm">
          <span className="mb-1 block font-semibold text-ink/70">Frase do cabeçalho</span>
          <input className="w-full rounded-lg border border-mist px-3 py-2" placeholder="Ex.: Seu equilíbrio cognitivo começa aqui!" value={form.slogan} onChange={(e) => setForm((f) => ({ ...f, slogan: e.target.value }))} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-ink/70">WhatsApp (rodapé)</span>
          <input className="w-full rounded-lg border border-mist px-3 py-2" placeholder="(11) 90000-0000" value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-ink/70">Instagram (rodapé)</span>
          <input className="w-full rounded-lg border border-mist px-3 py-2" placeholder="@suaclinica" value={form.instagram} onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))} />
        </label>
      </div>

      <button className="mt-4 rounded-lg bg-sage-deep px-5 py-2.5 text-sm font-semibold text-paper" onClick={salvar}>
        Salvar dados da clínica
      </button>

      <ConveniosAceitos ehAdmin={profissional?.papel === "ADMIN"} />
    </div>
  );
}

function ConveniosAceitos({ ehAdmin }: { ehAdmin: boolean }) {
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useAviso();
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");

  async function carregar() {
    try {
      setConvenios(await api.listConvenios({ todos: true }));
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function limparForm() {
    setEditandoId(null);
    setNome("");
    setCodigo("");
  }

  async function salvar() {
    if (!nome.trim()) {
      setErro("Informe o nome da operadora.");
      return;
    }
    setErro(null);
    setMensagem(null);
    try {
      if (editandoId) {
        await api.updateConvenio(editandoId, { nomeOperadora: nome.trim(), codigoPrestador: codigo.trim() });
        setMensagem("Convênio atualizado.");
      } else {
        await api.createConvenio({ nomeOperadora: nome.trim(), codigoPrestador: codigo.trim() || undefined });
        setMensagem("Convênio adicionado.");
      }
      limparForm();
      await carregar();
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function alternarAtivo(c: Convenio) {
    setErro(null);
    setMensagem(null);
    try {
      await api.updateConvenio(c.id, { ativo: !c.ativo });
      await carregar();
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  return (
    <section className="mt-10">
      <h2 className="mb-1 font-serif text-xl text-ink">Convênios aceitos</h2>
      <p className="mb-4 text-sm text-ink/60">
        Operadoras que a clínica atende. Elas aparecem na escolha de convênio no cadastro de cada paciente. Desativar um convênio o tira da
        lista, mas mantém o vínculo dos pacientes que já o usam.
      </p>

      {erro && <div className="mb-4 rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
      {mensagem && <div className="mb-4 rounded-lg border border-sage-deep/30 bg-sage-deep/10 px-4 py-3 text-sm text-sage-deep">{mensagem}</div>}

      {ehAdmin && (
        <div className="mb-4 grid grid-cols-[1fr_1fr_auto] items-end gap-3 rounded-2xl border border-mist bg-white p-4">
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-ink/70">Operadora</span>
            <input
              className="w-full rounded-lg border border-mist px-3 py-2"
              placeholder="Ex: Amil, Bradesco Saúde, Unimed"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-ink/70">Código de prestador (opcional)</span>
            <input className="w-full rounded-lg border border-mist px-3 py-2" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
          </label>
          <div className="flex gap-2">
            <button className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper" onClick={salvar}>
              {editandoId ? "Salvar" : "Adicionar"}
            </button>
            {editandoId && (
              <button className="text-sm text-ink/60" onClick={limparForm}>
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {convenios.length === 0 && (
          <div className="rounded-lg border border-mist bg-paper p-4 text-center text-sm text-ink/50">
            Nenhum convênio cadastrado. {ehAdmin ? "Adicione acima as operadoras que a clínica aceita." : "Peça a um administrador para cadastrar."}
          </div>
        )}
        {convenios.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-4 rounded-xl border border-mist bg-white px-4 py-3">
            <div className={c.ativo ? "" : "opacity-50"}>
              <div className="font-semibold text-ink">
                {c.nomeOperadora}
                {!c.ativo && <span className="ml-2 text-xs font-normal text-ink/60">(inativo)</span>}
              </div>
              {c.codigoPrestador && <div className="text-xs text-ink/60">Prestador: {c.codigoPrestador}</div>}
            </div>
            {ehAdmin && (
              <div className="flex shrink-0 gap-2">
                <button
                  className="rounded-lg border border-mist px-3 py-1.5 text-xs font-semibold text-ink/70"
                  onClick={() => {
                    setEditandoId(c.id);
                    setNome(c.nomeOperadora);
                    setCodigo(c.codigoPrestador ?? "");
                  }}
                >
                  Editar
                </button>
                <button
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${c.ativo ? "border-ember/40 text-ember" : "border-sage-deep/40 text-sage-deep"}`}
                  onClick={() => alternarAtivo(c)}
                >
                  {c.ativo ? "Desativar" : "Reativar"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
