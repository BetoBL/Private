import { useCallback, useEffect, useMemo, useState } from "react";
import { ExamesDoPaciente } from "./ExamesDoPaciente";
import { api, type MedicamentoSaude, type MetricaSaude, type ProblemaSaude, type SaudeDoPacienteDados, type TipoMetricaSaude } from "../lib/api";

// Aba "Saúde" da ficha (pacote médico): problemas ativos, medicamentos em uso e métricas ao longo do tempo, com gráfico.
// Tudo é do profissional responsável; o paciente não vê esta aba.

const hojeIso = () => new Date().toLocaleDateString("sv-SE");
const dataBr = (iso: string | null) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR") : "");
const campo = "w-full rounded-lg border border-mist px-3 py-2 text-sm";
const botao = "rounded-full bg-sage-deep px-4 py-1.5 text-sm font-semibold text-paper hover:opacity-90 disabled:opacity-50";
const botaoSec = "rounded-full border border-mist bg-white px-4 py-1.5 text-sm font-semibold text-ink/70 hover:text-ink";

function Secao({ titulo, dica, acao, children }: { titulo: string; dica: string; acao?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div><h3 className="text-lg font-bold text-ink">{titulo}</h3><p className="text-sm text-ink/55">{dica}</p></div>
        {acao}
      </div>
      {children}
    </section>
  );
}

export function GraficoMetrica({ tipo, pontos }: { tipo: TipoMetricaSaude; pontos: MetricaSaude[] }) {
  const L = 40, R = 12, T = 14, B = 26, W = 520, H = 170;
  const valores = pontos.flatMap((p) => [p.valor, ...(p.valor2 != null ? [p.valor2] : [])]);
  const faixa = tipo.faixa;
  const todos = [...valores, ...(faixa ?? [])];
  const lo = Math.min(...todos), hi = Math.max(...todos);
  const folga = (hi - lo || hi * 0.1 || 1) * 0.15;
  const min = lo - folga, max = hi + folga;
  const x = (i: number) => (pontos.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (pontos.length - 1));
  const y = (v: number) => T + (H - T - B) * (1 - (v - min) / (max - min));
  const linha = (f: (p: MetricaSaude) => number | null) => pontos.map((p, i) => (f(p) == null ? null : `${x(i)},${y(f(p)!)}`)).filter(Boolean).join(" ");
  const fmt = (v: number) => (Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full text-ink" role="img" aria-label={`Evolução de ${tipo.rotulo}`}>
      {faixa && <rect x={L} width={W - L - R} y={y(faixa[1])} height={Math.max(0, y(faixa[0]) - y(faixa[1]))} fill="#5E9E6E" fillOpacity="0.12"><title>{`Referência: ${faixa[0]} a ${faixa[1]} ${tipo.unidade}`}</title></rect>}
      {[min + folga, max - folga].map((v, i) => <g key={i}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="currentColor" strokeOpacity="0.1" /><text x={L - 6} y={y(v) + 4} fontSize="10" textAnchor="end" fill="currentColor" opacity="0.55">{fmt(v)}</text></g>)}
      {pontos.length > 1 && <polyline fill="none" stroke="#C25716" strokeWidth="2" points={linha((p) => p.valor)} />}
      {tipo.duplo && pontos.length > 1 && <polyline fill="none" stroke="#6B7A99" strokeWidth="2" points={linha((p) => p.valor2)} />}
      {pontos.map((p, i) => (
        <g key={p.id}>
          <circle cx={x(i)} cy={y(p.valor)} r="4" fill="#C25716"><title>{`${dataBr(p.data)}: ${tipo.duplo ? `${p.valor}/${p.valor2}` : p.valor} ${tipo.unidade}`}</title></circle>
          {tipo.duplo && p.valor2 != null && <circle cx={x(i)} cy={y(p.valor2)} r="4" fill="#6B7A99" />}
          {(pontos.length <= 8 || i % Math.ceil(pontos.length / 8) === 0) && <text x={x(i)} y={H - 8} fontSize="10" textAnchor="middle" fill="currentColor" opacity="0.55">{dataBr(p.data).slice(0, 5)}</text>}
        </g>
      ))}
    </svg>
  );
}

export function SaudeDoPaciente({ pacienteId }: { pacienteId: string }) {
  const [dados, setDados] = useState<SaudeDoPacienteDados | null>(null);
  const [tipos, setTipos] = useState<TipoMetricaSaude[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [formProblema, setFormProblema] = useState<{ descricao: string; cid: string } | null>(null);
  const [formMed, setFormMed] = useState<{ nome: string; dose: string; posologia: string; motivo: string } | null>(null);
  const [formMetrica, setFormMetrica] = useState<{ tipo: string; valor: string; valor2: string; data: string } | null>(null);
  const [verResolvidos, setVerResolvidos] = useState(false);

  const carregar = useCallback(async () => {
    try { setDados(await api.saudeDoPaciente(pacienteId)); } catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível carregar a saúde do paciente."); }
  }, [pacienteId]);
  useEffect(() => { void carregar(); api.tiposMetricaSaude().then(setTipos).catch(() => undefined); }, [carregar]);

  async function executar(acao: () => Promise<unknown>, depois?: () => void) {
    setSalvando(true); setErro(null);
    try { await acao(); depois?.(); await carregar(); } catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível salvar."); } finally { setSalvando(false); }
  }

  const porTipo = useMemo(() => {
    const m = new Map<string, MetricaSaude[]>();
    for (const p of dados?.metricas ?? []) m.set(p.tipo, [...(m.get(p.tipo) ?? []), p]);
    return m;
  }, [dados]);
  const tipoDe = (chave: string) => tipos.find((t) => t.chave === chave);
  const tipoForm = formMetrica ? tipoDe(formMetrica.tipo) : undefined;

  if (!dados) return <p className="text-sm text-ink/60">{erro ?? "Carregando…"}</p>;
  const ativos = dados.problemas.filter((p) => p.status === "ATIVO");
  const resolvidos = dados.problemas.filter((p) => p.status === "RESOLVIDO");
  const emUso = dados.medicamentos.filter((m) => m.status === "EM_USO");
  const suspensos = dados.medicamentos.filter((m) => m.status === "SUSPENSO");

  const linhaProblema = (p: ProblemaSaude) => (
    <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-paper px-3 py-2">
      <span className="text-sm"><b>{p.descricao}</b>{p.cid ? <span className="ml-2 text-ink/50">CID {p.cid}</span> : null}</span>
      <span className="flex gap-3 text-xs font-semibold">
        <button className="text-sage-deep hover:underline" onClick={() => executar(() => api.atualizarProblemaSaude(pacienteId, p.id, { status: p.status === "ATIVO" ? "RESOLVIDO" : "ATIVO" }))}>{p.status === "ATIVO" ? "Marcar como resolvido" : "Reativar"}</button>
        <button className="text-ink/45 hover:text-ember" onClick={() => executar(() => api.removerProblemaSaude(pacienteId, p.id))}>Remover</button>
      </span>
    </li>
  );
  const linhaMed = (m: MedicamentoSaude) => (
    <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-paper px-3 py-2">
      <span className="text-sm"><b>{m.nome}</b>{m.dose ? ` · ${m.dose}` : ""}{m.posologia ? <span className="text-ink/60"> · {m.posologia}</span> : null}{m.motivo ? <span className="block text-xs text-ink/50">Para: {m.motivo}</span> : null}</span>
      <span className="flex gap-3 text-xs font-semibold">
        <button className="text-sage-deep hover:underline" onClick={() => executar(() => api.atualizarMedicamentoSaude(pacienteId, m.id, m.status === "EM_USO" ? { status: "SUSPENSO", fim: hojeIso() } : { status: "EM_USO", fim: null }))}>{m.status === "EM_USO" ? "Suspender" : "Retomar"}</button>
        <button className="text-ink/45 hover:text-ember" onClick={() => executar(() => api.removerMedicamentoSaude(pacienteId, m.id))}>Remover</button>
      </span>
    </li>
  );

  return (
    <div className="grid gap-5">
      {erro && <p className="rounded-xl bg-ember/10 px-4 py-2 text-sm text-ember" role="alert">{erro}</p>}

      <Secao titulo="Problemas de saúde" dica="O que está sendo tratado ou acompanhado agora." acao={!formProblema && <button className={botao} onClick={() => setFormProblema({ descricao: "", cid: "" })}>Adicionar problema</button>}>
        {formProblema && (
          <form className="mb-3 grid gap-2 rounded-xl bg-mist/50 p-3 sm:grid-cols-[1fr_8rem_auto]" onSubmit={(e) => { e.preventDefault(); void executar(() => api.criarProblemaSaude(pacienteId, { descricao: formProblema.descricao, cid: formProblema.cid || null }), () => setFormProblema(null)); }}>
            <input className={campo} placeholder="Ex.: Hipertensão arterial" value={formProblema.descricao} onChange={(e) => setFormProblema({ ...formProblema, descricao: e.target.value })} required minLength={2} autoFocus />
            <input className={campo} placeholder="CID (opcional)" value={formProblema.cid} onChange={(e) => setFormProblema({ ...formProblema, cid: e.target.value })} />
            <span className="flex gap-2"><button className={botao} disabled={salvando}>Salvar</button><button type="button" className={botaoSec} onClick={() => setFormProblema(null)}>Cancelar</button></span>
          </form>
        )}
        {ativos.length ? <ul className="grid gap-2">{ativos.map(linhaProblema)}</ul> : <p className="text-sm text-ink/50">Nenhum problema ativo registrado.</p>}
        {resolvidos.length > 0 && (
          <div className="mt-3">
            <button className="text-xs font-semibold text-ink/55 hover:text-ink" onClick={() => setVerResolvidos(!verResolvidos)}>{verResolvidos ? "Ocultar" : "Ver"} resolvidos ({resolvidos.length})</button>
            {verResolvidos && <ul className="mt-2 grid gap-2">{resolvidos.map(linhaProblema)}</ul>}
          </div>
        )}
      </Secao>

      <Secao titulo="Medicamentos" dica="O que o paciente usa hoje e o que já foi suspenso." acao={!formMed && <button className={botao} onClick={() => setFormMed({ nome: "", dose: "", posologia: "", motivo: "" })}>Adicionar medicamento</button>}>
        {formMed && (
          <form className="mb-3 grid gap-2 rounded-xl bg-mist/50 p-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); void executar(() => api.criarMedicamentoSaude(pacienteId, { nome: formMed.nome, dose: formMed.dose || null, posologia: formMed.posologia || null, motivo: formMed.motivo || null, inicio: hojeIso() }), () => setFormMed(null)); }}>
            <input className={campo} placeholder="Nome" value={formMed.nome} onChange={(e) => setFormMed({ ...formMed, nome: e.target.value })} required minLength={2} autoFocus />
            <input className={campo} placeholder="Dose (ex.: 50 mg)" value={formMed.dose} onChange={(e) => setFormMed({ ...formMed, dose: e.target.value })} />
            <input className={campo} placeholder="Como usar (ex.: 1 comprimido de manhã)" value={formMed.posologia} onChange={(e) => setFormMed({ ...formMed, posologia: e.target.value })} />
            <input className={campo} placeholder="Para quê (opcional)" value={formMed.motivo} onChange={(e) => setFormMed({ ...formMed, motivo: e.target.value })} />
            <span className="flex gap-2 sm:col-span-2"><button className={botao} disabled={salvando}>Salvar</button><button type="button" className={botaoSec} onClick={() => setFormMed(null)}>Cancelar</button></span>
          </form>
        )}
        {emUso.length ? <ul className="grid gap-2">{emUso.map(linhaMed)}</ul> : <p className="text-sm text-ink/50">Nenhum medicamento em uso registrado.</p>}
        {suspensos.length > 0 && <><p className="mb-1 mt-4 text-xs font-bold uppercase tracking-wide text-clay">Suspensos</p><ul className="grid gap-2 opacity-70">{suspensos.map(linhaMed)}</ul></>}
      </Secao>

      <ExamesDoPaciente pacienteId={pacienteId} onSalvo={() => void carregar()} />

      <Secao titulo="Medidas ao longo do tempo" dica="Registre ao longo do tempo; o gráfico se monta conforme os valores entram. A faixa verde é só referência." acao={!formMetrica && <button className={botao} onClick={() => setFormMetrica({ tipo: tipos[0]?.chave ?? "PESO", valor: "", valor2: "", data: hojeIso() })}>Registrar medida</button>}>
        {formMetrica && tipoForm && (
          <form className="mb-4 grid gap-2 rounded-xl bg-mist/50 p-3 sm:grid-cols-[1fr_7rem_7rem_9rem_auto]" onSubmit={(e) => { e.preventDefault(); void executar(() => api.registrarMetricaSaude(pacienteId, { tipo: formMetrica.tipo, valor: Number(formMetrica.valor.replace(",", ".")), valor2: tipoForm.duplo ? Number(formMetrica.valor2.replace(",", ".")) : null, data: formMetrica.data }), () => setFormMetrica({ ...formMetrica, valor: "", valor2: "" })); }}>
            <select className={campo} value={formMetrica.tipo} onChange={(e) => setFormMetrica({ ...formMetrica, tipo: e.target.value, valor: "", valor2: "" })}>{tipos.map((t) => <option key={t.chave} value={t.chave}>{t.rotulo} ({t.unidade})</option>)}</select>
            <input className={campo} inputMode="decimal" placeholder={tipoForm.duplo ? "Máxima" : "Valor"} value={formMetrica.valor} onChange={(e) => setFormMetrica({ ...formMetrica, valor: e.target.value })} required autoFocus />
            {tipoForm.duplo ? <input className={campo} inputMode="decimal" placeholder="Mínima" value={formMetrica.valor2} onChange={(e) => setFormMetrica({ ...formMetrica, valor2: e.target.value })} required /> : <span />}
            <input className={campo} type="date" max={hojeIso()} value={formMetrica.data} onChange={(e) => setFormMetrica({ ...formMetrica, data: e.target.value })} required />
            <span className="flex gap-2"><button className={botao} disabled={salvando}>Salvar</button><button type="button" className={botaoSec} onClick={() => setFormMetrica(null)}>Fechar</button></span>
          </form>
        )}
        {porTipo.size === 0 ? <p className="text-sm text-ink/50">Nenhuma medida registrada. Use "Registrar medida" para começar o gráfico.</p> : (
          <div className="grid gap-4 lg:grid-cols-2">
            {tipos.filter((t) => porTipo.has(t.chave)).map((t) => {
              const pontos = porTipo.get(t.chave)!;
              const ultimo = pontos[pontos.length - 1];
              return (
                <div key={t.chave} className="rounded-xl border border-mist p-3">
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <h4 className="font-bold text-ink">{t.rotulo}</h4>
                    <span className="text-sm text-ink/60"><b className="text-lg text-ink">{t.duplo ? `${ultimo.valor}/${ultimo.valor2}` : ultimo.valor}</b> {t.unidade} · {dataBr(ultimo.data)}</span>
                  </div>
                  <GraficoMetrica tipo={t} pontos={pontos} />
                  <button className="mt-1 text-xs font-semibold text-ink/45 hover:text-ember" onClick={() => executar(() => api.removerMetricaSaude(pacienteId, ultimo.id))}>Remover o último registro ({dataBr(ultimo.data)})</button>
                </div>
              );
            })}
          </div>
        )}
      </Secao>
    </div>
  );
}
