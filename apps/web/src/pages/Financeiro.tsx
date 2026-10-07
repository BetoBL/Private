import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type Cobranca, type Convenio, type Paciente, type ResumoFinanceiro } from "../lib/api";
import { useAviso } from "../lib/aviso";

const brl = (v: number | string | null) => Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dia = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" });
const hojeISO = () => new Date().toISOString().slice(0, 10);
const mesAtual = () => hojeISO().slice(0, 7);
const FORMAS = ["Pix", "Dinheiro", "Cartão", "Transferência", "Repasse do convênio"];

// Situação mostrada na tela: "atrasada" não é um status gravado, vem do vencimento de uma cobrança ainda aberta.
function situacao(c: Cobranca): { texto: string; classe: string } {
  if (c.status === "PAGA") return { texto: "Paga", classe: "bg-sage-deep/10 text-sage-deep" };
  if (c.status === "CANCELADA") return { texto: "Cancelada", classe: "bg-mist text-ink/50" };
  return c.vencimento.slice(0, 10) < hojeISO() ? { texto: "Atrasada", classe: "bg-ember/10 text-ember" } : { texto: "A receber", classe: "bg-amber-100 text-amber-800" };
}

const vazio = { pacienteId: "", convenioId: "", descricao: "", valor: "", vencimento: hojeISO(), observacoes: "" };

export function Financeiro() {
  const [mes, setMes] = useState(mesAtual());
  const [filtro, setFiltro] = useState<"" | "ABERTA" | "PAGA" | "CANCELADA">("");
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useAviso();

  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState(vazio);
  const [baixando, setBaixando] = useState<{ id: string; valorPago: string; pagoEm: string; forma: string } | null>(null);

  const carregar = useCallback(() => {
    setErro(null);
    Promise.all([api.listCobrancas({ mes, status: filtro || undefined }), api.resumoFinanceiro(mes)])
      .then(([lista, r]) => { setCobrancas(lista); setResumo(r); })
      .catch((e) => setErro((e as Error).message));
  }, [mes, filtro]);

  useEffect(carregar, [carregar]);
  useEffect(() => {
    api.listPacientes().then(setPacientes).catch(() => undefined);
    api.listConvenios().then(setConvenios).catch(() => undefined);
  }, []);

  const totalLista = useMemo(() => cobrancas.filter((c) => c.status !== "CANCELADA").reduce((s, c) => s + Number(c.valor), 0), [cobrancas]);

  function novo() {
    setEditandoId(null);
    setForm(vazio);
    setFormAberto(true);
  }
  function editar(c: Cobranca) {
    setEditandoId(c.id);
    setForm({ pacienteId: c.pacienteId, convenioId: c.convenioId ?? "", descricao: c.descricao, valor: String(Number(c.valor)), vencimento: c.vencimento.slice(0, 10), observacoes: c.observacoes ?? "" });
    setFormAberto(true);
  }
  // Ao escolher o paciente, sugere o convênio dele (particular se não tiver)
  function escolherPaciente(id: string) {
    const p = pacientes.find((x) => x.id === id);
    setForm((f) => ({ ...f, pacienteId: id, convenioId: editandoId ? f.convenioId : p?.convenioId ?? "" }));
  }

  async function salvar() {
    setErro(null);
    const valor = Number(form.valor.replace(",", "."));
    if (!form.pacienteId && !editandoId) return setErro("Escolha o paciente.");
    if (!form.descricao.trim()) return setErro("Informe a descrição (ex.: Sessão de avaliação).");
    if (!(valor > 0)) return setErro("Informe um valor maior que zero.");
    try {
      const dados = { convenioId: form.convenioId || null, descricao: form.descricao.trim(), valor, vencimento: form.vencimento, observacoes: form.observacoes.trim() || null };
      if (editandoId) await api.updateCobranca(editandoId, dados);
      else await api.createCobranca({ pacienteId: form.pacienteId, ...dados });
      setFormAberto(false);
      setMensagem(editandoId ? "Cobrança atualizada." : "Cobrança lançada.");
      carregar();
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function confirmarBaixa() {
    if (!baixando) return;
    setErro(null);
    const valorPago = Number(baixando.valorPago.replace(",", "."));
    if (!(valorPago >= 0)) return setErro("Informe o valor recebido.");
    try {
      await api.baixarCobranca(baixando.id, { valorPago, pagoEm: baixando.pagoEm, formaPagamento: baixando.forma || null });
      setBaixando(null);
      setMensagem("Baixa registrada.");
      carregar();
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function agir(fn: () => Promise<unknown>, ok: string) {
    setErro(null);
    try {
      await fn();
      setMensagem(ok);
      carregar();
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  const campo = "w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm outline-none focus:border-sage-deep";

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 font-serif text-2xl text-ink">Financeiro</h1>
          <p className="text-sm text-ink/60">O que há para receber, o que está atrasado e o que já entrou — particular e convênio.</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="month" className="rounded-lg border border-mist bg-white px-3 py-2 text-sm" value={mes} onChange={(e) => e.target.value && setMes(e.target.value)} aria-label="Mês" />
          <button className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper" onClick={() => (formAberto ? setFormAberto(false) : novo())}>{formAberto ? "Cancelar" : "+ Nova cobrança"}</button>
        </div>
      </div>

      {erro && <div className="mb-4 rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
      {mensagem && <div className="mb-4 rounded-lg border border-sage-deep/30 bg-sage-deep/10 px-4 py-3 text-sm text-sage-deep">{mensagem}</div>}

      {resumo && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {[
            ["A receber no mês", resumo.aReceberNoMes, "text-ink"],
            ["Atrasado (todos os meses)", resumo.atrasado, resumo.atrasado.total > 0 ? "text-ember" : "text-ink"],
            ["Recebido no mês", resumo.recebidoNoMes, "text-sage-deep"],
          ].map(([rotulo, v, cor]) => {
            const x = v as { total: number; quantidade: number };
            return (
              <div key={rotulo as string} className="rounded-2xl border border-mist bg-white p-4">
                <div className="text-[11px] font-bold uppercase tracking-wide text-ink/45">{rotulo as string}</div>
                <div className={`mt-1 font-serif text-2xl tabular-nums ${cor}`}>{brl(x.total)}</div>
                <div className="text-xs text-ink/50">{x.quantidade} {x.quantidade === 1 ? "cobrança" : "cobranças"}</div>
              </div>
            );
          })}
        </div>
      )}
      {resumo && resumo.emAbertoPorOrigem.length > 0 && (
        <p className="mb-6 text-xs text-ink/60">
          Em aberto por origem: {resumo.emAbertoPorOrigem.map((o) => `${o.nome} ${brl(o.total)}`).join(" · ")}
        </p>
      )}

      {formAberto && (
        <section className="mb-6 rounded-2xl border border-mist bg-white p-5">
          <div className="mb-4 text-xs font-bold uppercase tracking-wide text-sage-deep">{editandoId ? "Editar cobrança" : "Nova cobrança"}</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-ink/70">Paciente *</span>
              <select className={campo} value={form.pacienteId} onChange={(e) => escolherPaciente(e.target.value)} disabled={!!editandoId}>
                <option value="">Escolha…</option>
                {pacientes.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-ink/70">Quem paga</span>
              <select className={campo} value={form.convenioId} onChange={(e) => setForm({ ...form, convenioId: e.target.value })}>
                <option value="">Particular</option>
                {convenios.map((c) => <option key={c.id} value={c.id}>{c.nomeOperadora}</option>)}
              </select>
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block font-semibold text-ink/70">Descrição *</span>
              <input className={campo} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex.: Avaliação neuropsicológica — 1ª sessão" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-ink/70">Valor (R$) *</span>
              <input className={campo} inputMode="decimal" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0,00" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-ink/70">Vencimento *</span>
              <input type="date" className={campo} value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} />
            </label>
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block font-semibold text-ink/70">Observações</span>
              <input className={campo} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
            </label>
          </div>
          <button className="mt-4 rounded-lg bg-sage-deep px-5 py-2.5 text-sm font-semibold text-paper" onClick={salvar}>{editandoId ? "Salvar alterações" : "Lançar cobrança"}</button>
        </section>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        {([["", "Todas"], ["ABERTA", "Em aberto"], ["PAGA", "Pagas"], ["CANCELADA", "Canceladas"]] as const).map(([v, rot]) => (
          <button key={v} onClick={() => setFiltro(v)} className={`rounded-full border px-3 py-1 font-semibold ${filtro === v ? "border-ink bg-ink text-paper" : "border-mist text-ink/60"}`}>{rot}</button>
        ))}
        <span className="ml-auto text-ink/50">Vencimentos do mês · total {brl(totalLista)}</span>
      </div>

      {cobrancas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-mist px-4 py-10 text-center text-sm text-ink/55">Nenhuma cobrança com vencimento neste mês. Use "+ Nova cobrança" para lançar.</div>
      ) : (
        <ul className="divide-y divide-mist rounded-2xl border border-mist bg-white">
          {cobrancas.map((c) => {
            const s = situacao(c);
            const dif = c.status === "PAGA" ? Number(c.valor) - Number(c.valorPago ?? 0) : 0;
            return (
              <li key={c.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink">{c.paciente.nome}</div>
                    <div className="truncate text-xs text-ink/60">{c.descricao} · {c.convenio?.nomeOperadora ?? "Particular"} · vence {dia(c.vencimento)}</div>
                    {c.status === "PAGA" && (
                      <div className="text-xs text-ink/55">
                        Recebido {brl(c.valorPago)} em {c.pagoEm ? dia(c.pagoEm) : "—"}{c.formaPagamento ? ` (${c.formaPagamento})` : ""}
                        {dif > 0.004 && <span className="font-semibold text-ember"> · diferença de {brl(dif)} (desconto ou glosa)</span>}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm font-semibold tabular-nums text-ink">{brl(c.valor)}</div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.classe}`}>{s.texto}</span>
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    {c.status === "ABERTA" && <button className="text-sage-deep" onClick={() => setBaixando({ id: c.id, valorPago: String(Number(c.valor)), pagoEm: hojeISO(), forma: "" })}>dar baixa</button>}
                    {c.status !== "CANCELADA" && <button className="text-ink/50 hover:text-ink" onClick={() => editar(c)}>editar</button>}
                    {c.status !== "ABERTA" && <button className="text-ink/50 hover:text-ink" onClick={() => agir(() => api.reabrirCobranca(c.id), "Cobrança reaberta.")}>reabrir</button>}
                    {c.status !== "CANCELADA" && <button className="text-ink/50 hover:text-ember" onClick={() => window.confirm("Cancelar esta cobrança? Ela continua no histórico e pode ser reaberta.") && agir(() => api.cancelarCobranca(c.id), "Cobrança cancelada.")}>cancelar</button>}
                  </div>
                </div>
                {baixando?.id === c.id && (
                  <div className="mt-3 flex flex-wrap items-end gap-3 rounded-xl bg-paper p-3 text-sm">
                    <label>
                      <span className="mb-1 block text-xs font-semibold text-ink/60">Valor recebido (R$)</span>
                      <input className="w-32 rounded-lg border border-mist bg-white px-3 py-2" inputMode="decimal" value={baixando.valorPago} onChange={(e) => setBaixando({ ...baixando, valorPago: e.target.value })} />
                    </label>
                    <label>
                      <span className="mb-1 block text-xs font-semibold text-ink/60">Data</span>
                      <input type="date" className="rounded-lg border border-mist bg-white px-3 py-2" value={baixando.pagoEm} onChange={(e) => setBaixando({ ...baixando, pagoEm: e.target.value })} />
                    </label>
                    <label>
                      <span className="mb-1 block text-xs font-semibold text-ink/60">Forma</span>
                      <select className="rounded-lg border border-mist bg-white px-3 py-2" value={baixando.forma} onChange={(e) => setBaixando({ ...baixando, forma: e.target.value })}>
                        <option value="">—</option>
                        {FORMAS.map((f) => <option key={f}>{f}</option>)}
                      </select>
                    </label>
                    <button className="rounded-lg bg-sage-deep px-4 py-2 font-semibold text-paper" onClick={confirmarBaixa}>Confirmar baixa</button>
                    <button className="px-2 py-2 text-xs font-semibold text-ink/50" onClick={() => setBaixando(null)}>cancelar</button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
