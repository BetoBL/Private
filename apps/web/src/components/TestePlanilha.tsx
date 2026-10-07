import { useEffect, useMemo, useState } from "react";
import { api, type AplicacaoDeTeste, type ResultadoCalculado, type Teste } from "../lib/api";
import { COR_CLASSIFICACAO } from "../lib/wechsler";
import { faltamCampos } from "../lib/plural";
import { PlaceholderBadge } from "./PlaceholderBadge";
import { Tabela, Titulo, Vazio } from "./TesteWiscIV";

// Tela genérica dos testes do "motor de planilha": o servidor roda as fórmulas da planilha da psicóloga e esta tela só
// mostra as entradas (por grupo), as opções (ex.: tabela normativa) e as tabelas de resultado descritas no layout do teste.
interface Layout {
  entradas: Array<{ chave: string; rotulo: string; grupo?: string; min?: number; max?: number }>;
  opcoes: Array<{ chave: string; rotulo: string; valores: string[]; padrao?: number }>;
  tabelas: Array<{ titulo: string; colunas: string[]; linhas: Array<{ rotulo: string; valores: Array<string | null> }> }>;
}

interface Props {
  teste: Teste;
  aplicacao?: AplicacaoDeTeste | null;
  escoresBrutos: Record<string, string>;
  onEscoresChange: (escores: Record<string, string>) => void;
  onSalvar: () => Promise<void>;
  sessaoId?: string;
  testeId?: string;
  erro?: string | null;
  salvando?: boolean;
}

const formatar = (v: string | number | boolean | null | undefined) => {
  if (v === null || v === undefined || v === "") return "";
  if (typeof v === "number") return v.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
  return String(v);
};

export function TestePlanilha({ teste, aplicacao, escoresBrutos, onEscoresChange, onSalvar, sessaoId, testeId, erro, salvando = false }: Props) {
  const layout = (teste.algoritmoCorrecao as unknown as { layout?: Layout }).layout;
  const campos = teste.algoritmoCorrecao.campos ?? [];
  type Info = Awaited<ReturnType<typeof api.calcularAplicacao>>;
  const [calc, setCalc] = useState<{ resultado: ResultadoCalculado | null; info?: Info; carregando: boolean; erro?: string }>({ resultado: null, carregando: false });
  const lancados = campos.filter((c) => (escoresBrutos[c.chave] ?? "").trim() !== "");

  useEffect(() => {
    const numeros: Record<string, number> = {};
    for (const [k, v] of Object.entries(escoresBrutos)) if (v !== undefined && v.trim() !== "" && !Number.isNaN(Number(v))) numeros[k] = Number(v);
    if (!sessaoId || !testeId || Object.keys(numeros).length === 0) {
      setCalc((c) => ({ ...c, resultado: null, carregando: false, erro: undefined }));
      return;
    }
    let cancelado = false;
    setCalc((c) => ({ ...c, carregando: true }));
    const t = setTimeout(() => {
      api
        .calcularAplicacao({ sessaoId, testeId, escoresBrutos: numeros })
        .then((r) => !cancelado && setCalc({ resultado: r.resultadoCalculado, info: r, carregando: false }))
        .catch((e) => !cancelado && setCalc((c) => ({ ...c, carregando: false, erro: (e as Error).message })));
    }, 350);
    return () => {
      cancelado = true;
      clearTimeout(t);
    };
  }, [escoresBrutos, sessaoId, testeId]);

  const resultado = calc.resultado ?? (lancados.length > 0 ? aplicacao?.resultadoCalculado ?? null : null);
  const saidas = resultado && resultado.modo === "planilha" ? resultado.saidas : {};
  const grupos = useMemo(() => {
    const m = new Map<string, NonNullable<Layout["entradas"]>>();
    for (const e of layout?.entradas ?? []) m.set(e.grupo ?? "Escores brutos", [...(m.get(e.grupo ?? "Escores brutos") ?? []), e]);
    return [...m.entries()];
  }, [layout]);
  const pct = Math.round((lancados.length / Math.max(1, campos.length)) * 100);

  if (!layout) return <Vazio>Este teste ainda não tem o layout do motor de planilha. Reaplique a atualização do catálogo.</Vazio>;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-mist bg-white p-5">
        <h2 className="font-serif text-2xl font-semibold text-ink">{teste.sigla}</h2>
        <p className="mt-1 text-xs text-ink/60">{aplicacao?.teste.nome || teste.nome}</p>
        {teste.isPlaceholder && <div className="mt-2"><PlaceholderBadge /></div>}
        {calc.info && (
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-xl bg-paper px-4 py-3 text-xs sm:grid-cols-3">
            {[
              ["Nome", calc.info.paciente.nome],
              ["Data de aplicação", new Date(calc.info.dataAplicacao).toLocaleDateString("pt-BR", { timeZone: "UTC" })],
              ["Idade cronológica", calc.info.idadeTexto],
            ].map(([r, v]) => (
              <div key={r} className="flex gap-2"><dt className="text-ink/50">{r}:</dt><dd className="font-semibold text-ink">{v}</dd></div>
            ))}
          </dl>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="h-1.5 min-w-[120px] flex-1 overflow-hidden rounded-full bg-mist"><div className="h-full rounded-full bg-sage-deep transition-all duration-500" style={{ width: `${pct}%` }} /></div>
          <span className="text-xs tabular-nums text-ink/60">{lancados.length} de {campos.length} campos</span>
          {calc.carregando && <span className="text-xs text-ink/40">calculando…</span>}
        </div>
      </div>

      {erro && <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
      {calc.erro && !erro && <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{calc.erro}</div>}
      {!sessaoId && <div className="rounded-lg border border-mist bg-paper px-4 py-3 text-sm text-ink/70">Escolha o paciente e a sessão para ver os resultados enquanto você digita: a idade dele define as normas.</div>}

      <div className="rounded-2xl border border-mist bg-white p-5">
        <Titulo>Lançamento</Titulo>
        {layout.opcoes.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-4">
            {layout.opcoes.map((o) => {
              const atual = escoresBrutos[o.chave] !== undefined ? Number(escoresBrutos[o.chave]) : o.padrao ?? -1;
              return (
                <div key={o.chave} className="flex items-center gap-2 text-xs">
                  <span className="text-ink/50">{o.rotulo}:</span>
                  <div className="inline-flex rounded-full border border-mist p-0.5 font-semibold">
                    {o.valores.map((v, i) => (
                      <button key={v} onClick={() => onEscoresChange({ ...escoresBrutos, [o.chave]: String(i) })} className={`rounded-full px-3 py-1 transition-colors ${atual === i ? "bg-ink text-paper" : "text-ink/60"}`}>{v}</button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="space-y-5">
          {grupos.map(([grupo, itens]) => (
            <section key={grupo}>
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink/45">{grupo}</div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {itens.map((e) => (
                  <label key={e.chave} className="flex items-center gap-2 rounded-xl border border-mist px-3 py-2 focus-within:border-sage-deep focus-within:ring-2 focus-within:ring-sage-deep/15">
                    <span className="min-w-0 flex-1 truncate text-sm text-ink/80" title={e.rotulo}>{e.rotulo}</span>
                    <input type="number" step="any" inputMode="decimal" min={e.min ?? 0} max={e.max} className="w-16 rounded-lg border border-mist bg-paper px-2 py-1 text-right text-sm tabular-nums outline-none focus:border-sage-deep" value={escoresBrutos[e.chave] ?? ""} onChange={(ev) => onEscoresChange({ ...escoresBrutos, [e.chave]: ev.target.value })} placeholder="—" />
                  </label>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-mist pt-4">
          <button className="rounded-lg bg-sage-deep px-5 py-2.5 text-sm font-semibold text-paper transition-opacity disabled:opacity-40" onClick={onSalvar} disabled={salvando || lancados.length === 0}>{salvando ? "Salvando…" : "Salvar lançamento"}</button>
          {lancados.length > 0 && lancados.length < campos.length && <span className="text-xs text-ink/55">{faltamCampos(campos.length - lancados.length)} — o que ficar vazio não entra no cálculo.</span>}
        </div>
      </div>

      {Object.values(saidas).some((v) => v !== null) && (
        <div className="wais-entra space-y-6 rounded-2xl border border-mist bg-white p-5">
          {layout.tabelas.map((t) => (
            <section key={t.titulo}>
              <Titulo>{t.titulo}</Titulo>
              <Tabela cabecalho={["", ...t.colunas]}>
                {t.linhas.map((l) => (
                  <tr key={l.valores.join("|") + l.rotulo} className="border-t border-mist/60">
                    <td className="px-3 py-2 text-left text-ink/70">{l.rotulo.startsWith("=") ? formatar(saidas[l.rotulo.slice(1)]) : l.rotulo}</td>
                    {l.valores.map((chave, i) => {
                      const v = chave ? saidas[chave] : null;
                      const cor = typeof v === "string" ? COR_CLASSIFICACAO[v] : undefined;
                      return (
                        <td key={i} className="px-3 py-2 text-right tabular-nums">
                          {cor ? <span className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white" style={{ background: cor }}>{v}</span> : <span className="font-semibold">{formatar(v)}</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </Tabela>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
