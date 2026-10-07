import { useAviso } from "../lib/aviso";
import { useEffect, useState } from "react";
import { BotaoVoltar } from "../components/BotaoVoltar";
import { api, type NormativaCustomizada, type Teste } from "../lib/api";

interface FormState {
  testeId: string;
  nomeNormativa: string;
  descricao: string;
  fonte: string;
  criterio: string;
  faixaMin: string;
  faixaMax: string;
  faixaLabel: string;
  sexo: "" | "MASCULINO" | "FEMININO";
  conversaoTexto: string;
}

const CONVERSAO_EXEMPLO = `{
  "tipo": "faixas",
  "faixas": [
    { "min": 0, "max": 10, "percentil": 5, "classificacao": "Muito inferior" },
    { "min": 11, "max": 20, "percentil": 50, "classificacao": "Média" }
  ]
}`;

const FORM_VAZIO: FormState = {
  testeId: "",
  nomeNormativa: "",
  descricao: "",
  fonte: "",
  criterio: "idade",
  faixaMin: "",
  faixaMax: "",
  faixaLabel: "",
  sexo: "",
  conversaoTexto: CONVERSAO_EXEMPLO,
};

const inputCls = "w-full rounded-lg border border-mist px-3 py-2 text-sm";
const labelCls = "mb-1 block text-sm font-semibold text-ink/70";

function descreverCobertura(n: NormativaCustomizada): string {
  const idade =
    n.faixaMin === null && n.faixaMax === null
      ? "qualquer idade"
      : `${n.faixaMin ?? "…"} a ${n.faixaMax ?? "…"} ${n.criterio === "idade_meses" ? "meses" : "anos"}`;
  const sexo = n.sexo ? (n.sexo === "MASCULINO" ? "masculino" : "feminino") : "ambos os sexos";
  return `${idade} · ${sexo}`;
}

export function CadastroNormativas() {
  const [testes, setTestes] = useState<Teste[]>([]);
  const [normativas, setNormativas] = useState<NormativaCustomizada[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useAviso();
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    try {
      const [t, n] = await Promise.all([api.listTestes(), api.listNormativasCustomizadas()]);
      setTestes(t);
      setNormativas(n);
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function abrirNovo() {
    setEditandoId(null);
    setForm(FORM_VAZIO);
    setErro(null);
    setMensagem(null);
    setMostrarForm(true);
  }

  function abrirEdicao(n: NormativaCustomizada) {
    setEditandoId(n.id);
    setForm({
      testeId: n.testeId,
      nomeNormativa: n.nomeNormativa,
      descricao: n.descricao ?? "",
      fonte: n.fonte ?? "",
      criterio: n.criterio,
      faixaMin: n.faixaMin === null ? "" : String(n.faixaMin),
      faixaMax: n.faixaMax === null ? "" : String(n.faixaMax),
      faixaLabel: n.faixaLabel ?? "",
      sexo: n.sexo ?? "",
      conversaoTexto: JSON.stringify(n.conversao, null, 2),
    });
    setErro(null);
    setMensagem(null);
    setMostrarForm(true);
  }

  function fechar() {
    setMostrarForm(false);
    setEditandoId(null);
  }

  async function salvar() {
    setErro(null);
    setMensagem(null);
    if (!form.testeId || !form.nomeNormativa.trim()) {
      setErro("Escolha o teste e informe o nome da normativa.");
      return;
    }
    let conversao: Record<string, unknown>;
    try {
      conversao = JSON.parse(form.conversaoTexto);
    } catch {
      setErro("A tabela de conversão não é um JSON válido. Confira vírgulas, aspas e chaves.");
      return;
    }
    const min = form.faixaMin.trim() === "" ? undefined : Number(form.faixaMin);
    const max = form.faixaMax.trim() === "" ? undefined : Number(form.faixaMax);
    if ((min !== undefined && Number.isNaN(min)) || (max !== undefined && Number.isNaN(max))) {
      setErro("Faixa mínima e máxima precisam ser números.");
      return;
    }
    if (min !== undefined && max !== undefined && min > max) {
      setErro("A faixa mínima não pode ser maior que a máxima.");
      return;
    }

    const dados = {
      testeId: form.testeId,
      nomeNormativa: form.nomeNormativa.trim(),
      descricao: form.descricao.trim() || undefined,
      fonte: form.fonte.trim() || undefined,
      criterio: form.criterio,
      faixaMin: min,
      faixaMax: max,
      faixaLabel: form.faixaLabel.trim() || undefined,
      sexo: form.sexo || undefined,
      conversao,
    };

    setSalvando(true);
    try {
      if (editandoId) {
        await api.updateNormativaCustomizada(editandoId, dados);
        setMensagem("Normativa atualizada. Novos lançamentos já usam esta tabela.");
      } else {
        await api.createNormativaCustomizada(dados);
        setMensagem("Normativa criada. Novos lançamentos de pacientes que ela cobre já usam esta tabela.");
      }
      fechar();
      await carregar();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  async function desativar(n: NormativaCustomizada) {
    setErro(null);
    setMensagem(null);
    try {
      await api.deleteNormativaCustomizada(n.id);
      setMensagem(`"${n.nomeNormativa}" desativada. Lançamentos novos voltam a usar a norma padrão do teste.`);
      await carregar();
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <BotaoVoltar />
      <h1 className="mb-1 font-serif text-2xl text-ink">Normativas Customizadas</h1>
      <p className="mb-8 text-sm text-ink/60">
        Cadastre tabelas normativas da sua clínica. Ao lançar um teste, a normativa que cobrir a idade e o sexo do paciente
        tem precedência sobre a norma padrão; se nenhuma cobrir, a norma padrão continua valendo.
      </p>

      {erro && <div className="mb-6 rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
      {mensagem && (
        <div className="mb-6 rounded-lg border border-sage-deep/30 bg-sage-deep/10 px-4 py-3 text-sm text-sage-deep">{mensagem}</div>
      )}

      {!mostrarForm && (
        <button className="mb-6 rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper" onClick={abrirNovo}>
          + Nova normativa
        </button>
      )}

      {mostrarForm && (
        <section className="mb-8 rounded-2xl border border-mist bg-white p-5">
          <div className="mb-4 text-xs font-bold uppercase tracking-wide text-sage-deep">
            {editandoId ? "Editar normativa" : "Nova normativa"}
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <label>
              <span className={labelCls}>Teste *</span>
              <select
                className={inputCls}
                value={form.testeId}
                disabled={!!editandoId}
                onChange={(e) => setForm((f) => ({ ...f, testeId: e.target.value }))}
              >
                <option value="">Selecione um teste</option>
                {testes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.sigla} — {t.nome}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={labelCls}>Nome da normativa *</span>
              <input
                className={inputCls}
                value={form.nomeNormativa}
                onChange={(e) => setForm((f) => ({ ...f, nomeNormativa: e.target.value }))}
                placeholder="Ex: Amostra local 2025"
              />
            </label>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <label>
              <span className={labelCls}>Fonte</span>
              <input
                className={inputCls}
                value={form.fonte}
                onChange={(e) => setForm((f) => ({ ...f, fonte: e.target.value }))}
                placeholder="Ex: Manual, 2ª edição"
              />
            </label>
            <label>
              <span className={labelCls}>Descrição</span>
              <input
                className={inputCls}
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              />
            </label>
          </div>

          <div className="mb-4 grid grid-cols-5 gap-4">
            <label>
              <span className={labelCls}>Unidade da idade</span>
              <select className={inputCls} value={form.criterio} onChange={(e) => setForm((f) => ({ ...f, criterio: e.target.value }))}>
                <option value="idade">Anos</option>
                <option value="idade_meses">Meses</option>
              </select>
            </label>
            <label>
              <span className={labelCls}>Idade mín.</span>
              <input
                className={inputCls}
                inputMode="decimal"
                value={form.faixaMin}
                onChange={(e) => setForm((f) => ({ ...f, faixaMin: e.target.value }))}
              />
            </label>
            <label>
              <span className={labelCls}>Idade máx.</span>
              <input
                className={inputCls}
                inputMode="decimal"
                value={form.faixaMax}
                onChange={(e) => setForm((f) => ({ ...f, faixaMax: e.target.value }))}
              />
            </label>
            <label>
              <span className={labelCls}>Rótulo da faixa</span>
              <input
                className={inputCls}
                value={form.faixaLabel}
                onChange={(e) => setForm((f) => ({ ...f, faixaLabel: e.target.value }))}
                placeholder="Ex: 6 a 8 anos"
              />
            </label>
            <label>
              <span className={labelCls}>Sexo</span>
              <select
                className={inputCls}
                value={form.sexo}
                onChange={(e) => setForm((f) => ({ ...f, sexo: e.target.value as FormState["sexo"] }))}
              >
                <option value="">Ambos</option>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMININO">Feminino</option>
              </select>
            </label>
          </div>
          <p className="-mt-2 mb-4 text-xs text-ink/50">
            Deixe idade mínima e máxima em branco para cobrir qualquer idade. Duas normativas do mesmo teste não podem ter o
            mesmo rótulo de faixa.
          </p>

          <label className="mb-4 block">
            <span className={labelCls}>Tabela de conversão (JSON) *</span>
            <textarea
              className={`${inputCls} font-mono text-xs`}
              rows={10}
              value={form.conversaoTexto}
              onChange={(e) => setForm((f) => ({ ...f, conversaoTexto: e.target.value }))}
              spellCheck={false}
            />
            <span className="mt-1 block text-xs text-ink/50">
              Mesmo formato das normas padrão: <code>tipo</code> e <code>faixas</code> (ou <code>faixasPorCampo</code>), cada
              faixa com <code>min</code>/<code>max</code> do escore bruto e as saídas (percentil, classificação…).
            </span>
          </label>

          <div className="flex items-center gap-3">
            <button
              className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper disabled:opacity-50"
              disabled={salvando}
              onClick={salvar}
            >
              {salvando ? "Salvando…" : editandoId ? "Salvar alterações" : "Salvar normativa"}
            </button>
            <button className="text-sm text-ink/60" onClick={fechar}>
              Cancelar
            </button>
          </div>
        </section>
      )}

      <div className="space-y-2">
        <div className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">Normativas da clínica</div>
        {normativas.length === 0 && (
          <div className="rounded-lg border border-mist bg-paper p-4 text-center text-sm text-ink/50">
            Nenhuma normativa customizada ainda. Clique em "Nova normativa" para começar.
          </div>
        )}
        {normativas.map((n) => (
          <div key={n.id} className="flex items-start justify-between gap-4 rounded-xl border border-mist bg-white p-4">
            <div>
              <div className="font-semibold text-ink">
                {n.teste?.sigla ?? "Teste"} · {n.nomeNormativa}
              </div>
              <div className="mt-0.5 text-xs text-ink/60">
                {descreverCobertura(n)}
                {n.faixaLabel ? ` · ${n.faixaLabel}` : ""}
                {n.fonte ? ` · Fonte: ${n.fonte}` : ""}
              </div>
              {n.descricao && <div className="mt-1 text-xs text-ink/50">{n.descricao}</div>}
            </div>
            <div className="flex shrink-0 gap-2">
              <button className="rounded-lg border border-mist px-3 py-1.5 text-xs font-semibold text-ink/70" onClick={() => abrirEdicao(n)}>
                Editar
              </button>
              <button className="rounded-lg border border-ember/40 px-3 py-1.5 text-xs font-semibold text-ember" onClick={() => desativar(n)}>
                Desativar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
