import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type Cobranca } from "../lib/api";

// Aba "Financeiro" da ficha: o que foi cobrado, o que já foi pago e o que está pendente ou atrasado.
const FORMAS = ["Pix", "Dinheiro", "Cartão", "Transferência", "Repasse do convênio", "Outro"];
const num = (s: string | number | null | undefined) => Number(s ?? 0);
const dia = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "—");
const hojeIso = () => new Date().toISOString().slice(0, 10);
const entrada = "w-full rounded-xl border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-sage focus:ring-2 focus:ring-sage/20";
const paraNumero = (s: string) => { const n = parseFloat(s.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".")); return Number.isFinite(n) ? n : NaN; };

export function FinanceiroDoPaciente({ pacienteId, valorSessaoCentavos, moeda }: { pacienteId: string; valorSessaoCentavos: number | null; moeda: string }) {
  const [lista, setLista] = useState<Cobranca[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<"TODAS" | "PENDENTES" | "PAGAS">("TODAS");
  const [nova, setNova] = useState<{ descricao: string; valor: string; vencimento: string } | null>(null);
  const [baixa, setBaixa] = useState<{ id: string; valor: string; pagoEm: string; forma: string } | null>(null);
  const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: moeda || "BRL" });

  const carregar = useCallback(() => { api.listCobrancas({ pacienteId }).then(setLista).catch((e) => setErro((e as Error).message)); }, [pacienteId]);
  useEffect(() => { carregar(); }, [carregar]);

  const hoje = hojeIso();
  const situacao = (c: Cobranca) => (c.status === "PAGA" ? "PAGA" : c.status === "CANCELADA" ? "CANCELADA" : c.vencimento.slice(0, 10) < hoje ? "ATRASADA" : "ABERTA");
  const tot = useMemo(() => {
    const l = lista ?? [];
    return {
      pendente: l.filter((c) => situacao(c) === "ABERTA").reduce((s, c) => s + num(c.valor), 0),
      atrasado: l.filter((c) => situacao(c) === "ATRASADA").reduce((s, c) => s + num(c.valor), 0),
      recebido: l.filter((c) => c.status === "PAGA").reduce((s, c) => s + num(c.valorPago ?? c.valor), 0),
      qAtrasado: l.filter((c) => situacao(c) === "ATRASADA").length,
      qPendente: l.filter((c) => situacao(c) === "ABERTA").length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lista]);

  const visiveis = (lista ?? []).filter((c) => filtro === "TODAS" || (filtro === "PENDENTES" && (situacao(c) === "ABERTA" || situacao(c) === "ATRASADA")) || (filtro === "PAGAS" && c.status === "PAGA"))
    .sort((a, b) => (a.vencimento < b.vencimento ? 1 : -1));

  const falha = (e: unknown) => setErro((e as Error).message);
  async function criar() {
    if (!nova) return; setErro(null);
    const valor = paraNumero(nova.valor);
    if (!nova.descricao.trim() || !(valor > 0) || !nova.vencimento) { setErro("Informe a descrição, o valor e o vencimento."); return; }
    try { await api.createCobranca({ pacienteId, descricao: nova.descricao.trim(), valor, vencimento: nova.vencimento }); setNova(null); carregar(); } catch (e) { falha(e); }
  }
  async function darBaixa() {
    if (!baixa) return; setErro(null);
    const v = paraNumero(baixa.valor);
    if (!(v >= 0)) { setErro("Informe o valor recebido."); return; }
    try { await api.baixarCobranca(baixa.id, { valorPago: v, pagoEm: baixa.pagoEm, formaPagamento: baixa.forma || null }); setBaixa(null); carregar(); } catch (e) { falha(e); }
  }
  const pill = (a: boolean) => `rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${a ? "bg-sage-deep text-white shadow" : "border border-mist bg-white text-ink/60 hover:border-sage"}`;
  const chip: Record<string, string> = { PAGA: "bg-[#E4EFE7] text-[#2F5D3A]", ABERTA: "bg-[#FBE8D9] text-[#a8480f]", ATRASADA: "bg-ember/10 text-ember", CANCELADA: "bg-mist text-ink/45" };
  const rotuloChip: Record<string, string> = { PAGA: "Paga", ABERTA: "Pendente", ATRASADA: "Atrasada", CANCELADA: "Cancelada" };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-mist bg-gradient-to-br from-white to-mist/40 p-5 shadow-[0_8px_24px_-12px_rgba(38,38,36,0.12)]">
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-xl text-ink">Financeiro do paciente</h2>
          <p className="text-sm text-ink/55">{valorSessaoCentavos != null ? `Valor da sessão: ${brl(valorSessaoCentavos / 100)}.` : "Defina o valor da sessão no Perfil para agilizar as cobranças."}</p>
        </div>
        <button className="rounded-full bg-gradient-to-r from-sage-deep to-sage px-5 py-2 text-sm font-semibold text-white shadow-md shadow-sage/30" onClick={() => setNova({ descricao: "Sessão", valor: valorSessaoCentavos != null ? (valorSessaoCentavos / 100).toFixed(2).replace(".", ",") : "", vencimento: hoje })}>＋ Nova cobrança</button>
      </div>

      {erro && <div className="rounded-xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}

      {nova && (
        <div className="rounded-2xl border border-sage/40 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
            <label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/50">Descrição</span><input className={entrada} value={nova.descricao} onChange={(e) => setNova({ ...nova, descricao: e.target.value })} /></label>
            <label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/50">Valor</span><input className={entrada} inputMode="decimal" value={nova.valor} onChange={(e) => setNova({ ...nova, valor: e.target.value })} /></label>
            <label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/50">Vencimento</span><input type="date" className={entrada} value={nova.vencimento} onChange={(e) => setNova({ ...nova, vencimento: e.target.value })} /></label>
            <div className="flex gap-2"><button className="rounded-full bg-sage-deep px-5 py-2 text-sm font-semibold text-white" onClick={criar}>Lançar</button><button className="rounded-full border border-mist px-4 py-2 text-sm text-ink/60" onClick={() => setNova(null)}>Cancelar</button></div>
          </div>
        </div>
      )}

      {lista && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-mist bg-gradient-to-br from-[#fbe8d9] to-white p-4"><div className="text-xs font-semibold uppercase tracking-wide text-ink/50">A receber</div><div className="mt-1 font-serif text-2xl text-sage-deep">{brl(tot.pendente)}</div><div className="text-xs text-ink/50">{tot.qPendente} cobrança(s) no prazo</div></div>
            <div className={`rounded-2xl border bg-gradient-to-br p-4 ${tot.atrasado ? "border-ember/40 from-ember/15 to-white" : "border-mist from-mist to-white"}`}><div className="text-xs font-semibold uppercase tracking-wide text-ink/50">Atrasado</div><div className={`mt-1 font-serif text-2xl ${tot.atrasado ? "text-ember" : "text-ink/40"}`}>{brl(tot.atrasado)}</div><div className="text-xs text-ink/50">{tot.qAtrasado} vencida(s)</div></div>
            <div className="rounded-2xl border border-mist bg-gradient-to-br from-[#e4efe7] to-white p-4"><div className="text-xs font-semibold uppercase tracking-wide text-ink/50">Já recebido</div><div className="mt-1 font-serif text-2xl text-[#2f5d3a]">{brl(tot.recebido)}</div><div className="text-xs text-ink/50">{(lista ?? []).filter((c) => c.status === "PAGA").length} paga(s)</div></div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className={pill(filtro === "TODAS")} onClick={() => setFiltro("TODAS")}>Todas</button>
            <button className={pill(filtro === "PENDENTES")} onClick={() => setFiltro("PENDENTES")}>Pendentes</button>
            <button className={pill(filtro === "PAGAS")} onClick={() => setFiltro("PAGAS")}>Pagas</button>
          </div>

          {visiveis.length === 0 ? <p className="rounded-2xl border border-dashed border-mist px-4 py-10 text-center text-sm text-ink/45">Nenhuma cobrança por aqui. Use "Nova cobrança" para lançar a primeira.</p> : (
            <ul className="space-y-2.5">
              {visiveis.map((c) => {
                const s = situacao(c);
                return (
                  <li key={c.id} className="rounded-2xl border border-mist bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-ink">{c.descricao}</span><span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${chip[s]}`}>{rotuloChip[s]}</span>{c.convenio && <span className="rounded-full bg-mist px-2 py-0.5 text-[11px] font-semibold text-ink/60">{c.convenio.nomeOperadora}</span>}</div>
                        <div className="mt-0.5 text-xs text-ink/50">
                          Vence em {dia(c.vencimento)}
                          {c.status === "PAGA" && <> · recebido {brl(num(c.valorPago ?? c.valor))} em {dia(c.pagoEm)}{c.formaPagamento ? ` (${c.formaPagamento})` : ""}{num(c.valorPago) < num(c.valor) ? ` · diferença de ${brl(num(c.valor) - num(c.valorPago))}` : ""}</>}
                        </div>
                      </div>
                      <div className="text-right font-serif text-xl text-ink">{brl(num(c.valor))}</div>
                      <div className="flex gap-2 text-xs font-semibold">
                        {(s === "ABERTA" || s === "ATRASADA") && <button className="rounded-full bg-sage-deep px-3.5 py-1.5 text-white" onClick={() => setBaixa({ id: c.id, valor: num(c.valor).toFixed(2).replace(".", ","), pagoEm: hoje, forma: "Pix" })}>Dar baixa</button>}
                        {c.status === "PAGA" && <button className="rounded-full border border-mist px-3.5 py-1.5 text-ink/60 hover:border-sage" onClick={() => api.reabrirCobranca(c.id).then(carregar).catch(falha)}>Reabrir</button>}
                        {(s === "ABERTA" || s === "ATRASADA") && <button className="px-1 text-ink/40 hover:text-ember" onClick={() => { if (window.confirm("Cancelar esta cobrança?")) api.cancelarCobranca(c.id).then(carregar).catch(falha); }}>cancelar</button>}
                      </div>
                    </div>
                    {baixa?.id === c.id && (
                      <div className="mt-3 grid gap-3 rounded-xl bg-mist/50 p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
                        <label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/50">Valor recebido</span><input className={entrada} inputMode="decimal" value={baixa.valor} onChange={(e) => setBaixa({ ...baixa, valor: e.target.value })} /></label>
                        <label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/50">Recebido em</span><input type="date" className={entrada} value={baixa.pagoEm} onChange={(e) => setBaixa({ ...baixa, pagoEm: e.target.value })} /></label>
                        <label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/50">Forma</span><select className={entrada} value={baixa.forma} onChange={(e) => setBaixa({ ...baixa, forma: e.target.value })}>{FORMAS.map((f) => <option key={f}>{f}</option>)}</select></label>
                        <div className="flex gap-2"><button className="rounded-full bg-sage-deep px-5 py-2 text-sm font-semibold text-white" onClick={darBaixa}>Confirmar</button><button className="rounded-full border border-mist px-4 py-2 text-sm text-ink/60" onClick={() => setBaixa(null)}>Cancelar</button></div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-xs text-ink/45">A visão geral de todos os pacientes, nota fiscal e convênios continua na tela Financeiro, no menu lateral.</p>
        </>
      )}
    </div>
  );
}
