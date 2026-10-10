import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type NotaDetalhe, type NotaResumo, type ResultadoGerarNotas } from "../lib/api";
import { useAviso } from "../lib/aviso";

const STATUS: Record<string, { rotulo: string; cls: string }> = {
  RASCUNHO: { rotulo: "Rascunho", cls: "bg-mist text-ink/70" },
  EMITIDA: { rotulo: "Emitida", cls: "bg-sage-deep/15 text-sage-deep" },
  REJEITADA: { rotulo: "Recusada", cls: "bg-ember/15 text-ember" },
  PENDENTE: { rotulo: "Conferir no Portal", cls: "bg-amber-100 text-amber-900" },
  CANCELADA: { rotulo: "Cancelada", cls: "bg-mist text-ink/45 line-through" },
};
const ORIGEM: Record<string, string> = { SESSAO: "Sessão", LAUDO: "Laudo", CONVENIO_CASO: "Convênio (caso)", CONVENIO_LOTE: "Convênio (lote do mês)", MANUAL: "Manual" };
const brl = (v: string | number) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const mesAtual = () => new Date().toLocaleDateString("sv-SE").slice(0, 7);
const dia = (d: string) => new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC" });

function Detalhe({ id, onFechar, onMudou }: { id: string; onFechar: () => void; onMudou: () => void }) {
  const [n, setN] = useState<NotaDetalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [chave, setChave] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const carregar = useCallback(() => api.getNota(id).then(setN).catch((e) => setErro(e.message)), [id]);
  useEffect(() => { carregar(); }, [carregar]);

  async function acao(fn: () => Promise<unknown>, ok?: string) {
    setErro(null); setMsg(null); setOcupado(true);
    try { await fn(); if (ok) setMsg(ok); await carregar(); onMudou(); } catch (e) { setErro((e as Error).message); } finally { setOcupado(false); }
  }
  async function baixar(tipo: "dps" | "nfse" | "pdf") {
    try { const r = tipo === "pdf" ? await api.baixarPdfNota(id) : await api.baixarXmlNota(id, tipo); const u = URL.createObjectURL(r.blob); const a = document.createElement("a"); a.href = u; a.download = r.filename; a.click(); URL.revokeObjectURL(u); } catch (e) { setErro((e as Error).message); }
  }
  const botao = "rounded-lg border border-sage-deep px-4 py-2 text-sm font-semibold text-sage-deep hover:bg-sage-deep/5 disabled:opacity-50";
  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-ink/40" onClick={onFechar}>
      <aside className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="font-serif text-2xl text-ink">{n ? (n.numero ? `Nota ${n.numero}` : "Rascunho de nota") : "Nota"}</h2>
          <button className="text-sm font-semibold text-ink/55 hover:text-ink" onClick={onFechar}>Fechar ✕</button>
        </div>
        {erro && <div className="mb-3 rounded-lg border border-ember/30 bg-ember/10 px-3 py-2 text-sm text-ember">{erro}</div>}
        {msg && <div className="mb-3 rounded-lg border border-sage-deep/30 bg-sage-deep/10 px-3 py-2 text-sm text-sage-deep">{msg}</div>}
        {n && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS[n.status]?.cls}`}>{STATUS[n.status]?.rotulo ?? n.status}</span>
              <span className="rounded-full border border-mist px-3 py-1 text-xs text-ink/60">{ORIGEM[n.origem] ?? n.origem}</span>
              {n.ambiente === "HOMOLOGACAO" && <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs text-amber-900">Homologação: sem valor fiscal</span>}
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div><dt className="text-xs text-ink/50">Tomador</dt><dd className="font-semibold">{n.tomadorNome}</dd><dd className="text-xs text-ink/55">{n.tomadorDocumento ?? "sem CPF/CNPJ"}</dd></div>
              <div><dt className="text-xs text-ink/50">Valor</dt><dd className="font-semibold">{brl(n.valor)}</dd></div>
              <div><dt className="text-xs text-ink/50">Competência</dt><dd>{dia(n.competencia)}</dd></div>
              <div><dt className="text-xs text-ink/50">Série / número da DPS</dt><dd>{n.serie ?? "—"} / {n.numero ?? "—"}</dd></div>
              {n.numeroNfse && <div><dt className="text-xs text-ink/50">Número da NFS-e</dt><dd>{n.numeroNfse}</dd></div>}
              {n.emitidaEm && <div><dt className="text-xs text-ink/50">Emitida em</dt><dd>{new Date(n.emitidaEm).toLocaleString("pt-BR")}</dd></div>}
            </dl>
            <div><div className="text-xs text-ink/50">Descrição na nota</div><p className="mt-0.5 rounded-lg bg-paper px-3 py-2">{n.descricao}</p></div>
            {n.chaveAcesso && <div><div className="text-xs text-ink/50">Chave de acesso</div><p className="break-all font-mono text-xs">{n.chaveAcesso}</p></div>}
            {n.erro && <div className="rounded-lg border border-ember/30 bg-ember/10 px-3 py-2 text-ember"><b>Motivo:</b> {n.erro}</div>}
            {(n.avisos ?? []).length > 0 && <ul className="space-y-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900">{(n.avisos ?? []).map((a, i) => <li key={i}>• {a}</li>)}</ul>}
            <div>
              <div className="mb-1 text-xs text-ink/50">Cobranças desta nota ({n.cobrancas.length})</div>
              <ul className="divide-y divide-mist rounded-lg border border-mist">
                {n.cobrancas.map((c) => <li key={c.id} className="flex items-center justify-between gap-3 px-3 py-2"><span>{c.descricao}<span className="block text-xs text-ink/50">{c.paciente.nome} · {c.status === "PAGA" && c.pagoEm ? `paga em ${dia(c.pagoEm)}` : `vence em ${dia(c.vencimento)}`}</span></span><span className="shrink-0 font-semibold">{brl(c.valor)}</span></li>)}
              </ul>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-mist pt-4">
              {(n.status === "RASCUNHO" || n.status === "REJEITADA") && <button className="rounded-lg bg-sage-deep px-5 py-2 text-sm font-semibold text-paper disabled:opacity-50" disabled={ocupado} onClick={() => acao(async () => { const r = await api.emitirNotaFiscal(id); if (r.status !== "EMITIDA") throw new Error(r.erro ?? "A nota não foi emitida."); }, "Nota emitida.")}>{ocupado ? "Emitindo…" : n.status === "REJEITADA" ? "Tentar de novo" : "Emitir"}</button>}
              {n.status === "PENDENTE" && <button className={botao} disabled={ocupado} onClick={() => acao(async () => { const r = await api.verificarNota(id); setMsg(r.leitura); })}>Verificar no Portal</button>}
              {n.status === "EMITIDA" && <button className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper" onClick={() => baixar("pdf")}>Baixar PDF da nota</button>}
              {n.temXmlDps && <button className={botao} onClick={() => baixar("dps")}>Baixar XML da DPS</button>}
              {n.temXmlNfse && <button className={botao} onClick={() => baixar("nfse")}>Baixar XML da NFS-e</button>}
              {n.status === "RASCUNHO" && <button className="rounded-lg px-4 py-2 text-sm font-semibold text-ember hover:bg-ember/10 disabled:opacity-50" disabled={ocupado} onClick={() => { if (confirm("Excluir este rascunho? As cobranças voltam a ficar sem nota.")) acao(async () => { await api.excluirNota(id); onFechar(); }); }}>Excluir rascunho</button>}
            </div>
            {["PENDENTE", "REJEITADA"].includes(n.status) && (
              <details className="rounded-lg border border-mist p-3">
                <summary className="cursor-pointer text-sm font-semibold text-ink/70">Já emiti esta nota no Portal? Marcar como emitida</summary>
                <p className="mt-2 text-xs text-ink/55">Informe a chave de acesso de 50 dígitos da NFS-e emitida no Portal Nacional.</p>
                <input className="mt-2 w-full rounded-lg border border-mist px-3 py-2 font-mono text-xs" placeholder="Chave de acesso (50 dígitos)" value={chave} onChange={(e) => setChave(e.target.value)} />
                <button className={`${botao} mt-2`} disabled={ocupado || chave.replace(/\s/g, "").length < 50} onClick={() => acao(() => api.marcarNotaEmitida(id, chave), "Nota marcada como emitida.")}>Marcar como emitida</button>
              </details>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

export function Notas() {
  const [mes, setMes] = useState(mesAtual());
  const [status, setStatus] = useState("");
  const [notas, setNotas] = useState<NotaResumo[]>([]);
  const [info, setInfo] = useState<{ emissaoAtiva: boolean; ambiente: string; simulacao: boolean } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useAviso();
  const [aberta, setAberta] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoGerarNotas | null>(null);

  const carregar = useCallback(async () => {
    try { const r = await api.listarNotas({ mes, status: status || undefined }); setNotas(r.notas); setInfo({ emissaoAtiva: r.emissaoAtiva, ambiente: r.ambiente, simulacao: r.simulacao }); setErro(null); } catch (e) { setErro((e as Error).message); }
  }, [mes, status]);
  useEffect(() => { carregar(); }, [carregar]);

  async function gerar() {
    setGerando(true); setResultado(null); setErro(null);
    try { const r = await api.gerarNotasDoMes(mes); setResultado(r); if (r.criadas.length) setMensagem(`${r.criadas.length} rascunho(s) preparado(s).`); await carregar(); } catch (e) { setErro((e as Error).message); } finally { setGerando(false); }
  }
  const total = notas.filter((n) => n.status === "EMITIDA").reduce((s, n) => s + Number(n.valor), 0);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-ink">Notas fiscais</h1>
          <p className="mt-1 text-sm text-ink/60">Prepare as notas das cobranças do mês, confira e emita. A forma de cada paciente e de cada convênio vem do cadastro dele.</p>
        </div>
        <button className="rounded-lg bg-sage-deep px-5 py-2.5 text-sm font-semibold text-paper disabled:opacity-50" disabled={gerando} onClick={gerar}>{gerando ? "Preparando…" : "Preparar as notas do mês"}</button>
      </div>

      {info && !info.emissaoAtiva && <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">A emissão está <b>desligada</b>: dá para preparar rascunhos, mas não emitir. Ative em <Link to="/fiscal" className="font-semibold underline">Configurações › Dados fiscais</Link>.</div>}
      {info?.simulacao && <div className="mb-4 rounded-xl border border-sage-deep/30 bg-sage-deep/10 px-4 py-3 text-sm text-sage-deep">Modo de simulação: as notas são emitidas de mentira, sem falar com o Portal.</div>}
      {info && info.ambiente === "HOMOLOGACAO" && !info.simulacao && <div className="mb-4 rounded-xl border border-mist bg-white px-4 py-3 text-sm text-ink/65">Ambiente de <b>homologação</b> (teste): as notas emitidas não têm valor fiscal.</div>}
      {erro && <div className="mb-4 rounded-xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
      {mensagem && <div className="mb-4 rounded-xl border border-sage-deep/30 bg-sage-deep/10 px-4 py-3 text-sm text-sage-deep">{mensagem}</div>}

      {resultado && (
        <section className="mb-5 rounded-2xl border border-mist bg-white p-5">
          <div className="mb-2 flex items-center justify-between"><h2 className="font-serif text-lg text-ink">Resultado da preparação</h2><button className="text-xs font-semibold text-ink/50 hover:text-ink" onClick={() => setResultado(null)}>fechar</button></div>
          <p className="text-sm text-ink/70">{resultado.criadas.length} nota(s) preparada(s) · {resultado.puladas.length} cobrança(s) não entraram.</p>
          {resultado.puladas.length > 0 && <ul className="mt-2 space-y-1 text-sm text-ink/65">{resultado.puladas.map((p) => <li key={p.cobrancaId}>• <b>{p.paciente}</b>: {p.motivo}</li>)}</ul>}
        </section>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input type="month" className="rounded-lg border border-mist bg-white px-3 py-2 text-sm" value={mes} onChange={(e) => setMes(e.target.value)} />
        <select className="rounded-lg border border-mist bg-white px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos os status</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.rotulo}</option>)}
        </select>
        <span className="ml-auto text-sm text-ink/60">Emitidas no mês: <b className="text-ink">{brl(total)}</b></span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-mist bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-mist text-xs uppercase tracking-wide text-ink/45"><tr><th className="px-4 py-3">Nº</th><th className="px-4 py-3">Tomador</th><th className="px-4 py-3">Origem</th><th className="px-4 py-3">Competência</th><th className="px-4 py-3 text-right">Valor</th><th className="px-4 py-3">Status</th></tr></thead>
          <tbody>
            {notas.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-ink/50">Nenhuma nota neste período. Use “Preparar as notas do mês” para gerar os rascunhos a partir das cobranças.</td></tr>}
            {notas.map((n) => (
              <tr key={n.id} className="cursor-pointer border-b border-mist/60 last:border-0 hover:bg-paper/70" onClick={() => setAberta(n.id)}>
                <td className="px-4 py-3 font-mono text-xs">{n.numero ?? "—"}</td>
                <td className="px-4 py-3"><div className="font-semibold text-ink">{n.tomadorNome}</div><div className="max-w-xs truncate text-xs text-ink/50">{n.descricao}</div>{(n.avisos ?? []).length > 0 && <div className="text-xs text-amber-800">⚠ {(n.avisos ?? [])[0]}</div>}</td>
                <td className="px-4 py-3 text-ink/65">{ORIGEM[n.origem] ?? n.origem}{n._count.cobrancas > 1 ? ` · ${n._count.cobrancas} cobranças` : ""}</td>
                <td className="px-4 py-3 text-ink/65">{dia(n.competencia).slice(3)}</td>
                <td className="px-4 py-3 text-right font-semibold">{brl(n.valor)}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS[n.status]?.cls}`}>{STATUS[n.status]?.rotulo ?? n.status}</span>{n.ambiente === "HOMOLOGACAO" && n.status === "EMITIDA" && <span className="ml-1 text-[10px] text-amber-800">teste</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {aberta && <Detalhe id={aberta} onFechar={() => setAberta(null)} onMudou={carregar} />}
    </div>
  );
}
