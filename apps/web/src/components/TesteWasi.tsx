import { useEffect, useMemo, useState } from "react";
import { api, type AplicacaoDeTeste, type ResultadoCalculado, type Teste } from "../lib/api";
import { COR_CLASSIFICACAO, lerExtras as lerExtrasGenerico, lerIndice, zonaDoPonderado, type IndiceLido } from "../lib/wechsler";
import { faltamCampos } from "../lib/plural";
import { EscalaIndices, type LinhaIndice } from "./graficos/EscalaIndices";
import { PlaceholderBadge } from "./PlaceholderBadge";
import { Selo, Seletor, Tabela, Titulo, Vazio, corSimNao, fmt } from "./TesteWiscIV";

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
  abaInicial?: AbaWasi;
}

export type AbaWasi = "brutos" | "escoresT" | "qis" | "habilidades" | "idadeMental";
const ABAS: Array<{ id: AbaWasi; label: string }> = [
  { id: "brutos", label: "1. Brutos" },
  { id: "escoresT", label: "2. Escores T" },
  { id: "qis", label: "3. QIs" },
  { id: "habilidades", label: "4. Habilidades e intraindividual" },
  { id: "idadeMental", label: "5. Idade mental" },
];

const SUBTESTES = ["vc", "sm", "cb", "rm"] as const;
const NOME: Record<string, string> = { vc: "Vocabulário", sm: "Semelhanças", cb: "Cubos", rm: "Raciocínio Matricial" };
const ESCALAS: Array<[string, string, string]> = [
  ["qiv", "QI Verbal", "Vocabulário + Semelhanças"],
  ["qie", "QI Execução", "Cubos + Raciocínio Matricial"],
  ["qit4", "QIT-4", "Escala total, 4 subtestes"],
  ["qit2", "QIT-2", "Escala total, Vocabulário + Raciocínio Matricial"],
];

interface ExtrasWasi {
  idadeMental?: Record<string, { meses: number; texto: string } | null>;
  testeIdade?: Record<string, string | null>;
  habilidades?: Array<{ numero: number; nome: string; grupo: string; subtestes: string[]; marcas: Record<string, "P" | "N" | "0" | null>; completa: boolean; interpretacao: string }>;
  intraindividual?: { itens: Array<{ chave: string; nome: string; ponderado: number; media: number; diferenca: number }>; maiorPositiva: { nome: string; diferenca: number } | null; maiorNegativa: { nome: string; diferenca: number } | null };
}

export function TesteWasi({ teste, aplicacao, escoresBrutos, onEscoresChange, onSalvar, sessaoId, testeId, erro, salvando = false, abaInicial }: Props) {
  const campos = teste?.algoritmoCorrecao.campos ?? [];
  const [aba, setAba] = useState<AbaWasi>(abaInicial ?? "brutos");
  const [confianca, setConfianca] = useState<"90%" | "95%">("95%");
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
  const porCampo = resultado && resultado.modo === "por_campo" ? resultado.porCampo : {};
  const extras = useMemo(() => lerExtrasGenerico(resultado) as unknown as ExtrasWasi, [resultado]);
  const indices = useMemo(() => Object.fromEntries(ESCALAS.map(([k]) => [k, lerIndice(resultado, k)])) as Record<string, IndiceLido>, [resultado]);
  const sub = (c: string) => (porCampo[c]?.faixa ?? null) as unknown as Record<string, number | string | null> | null;
  const nIC = confianca === "90%" ? "ic90" : "ic95";
  const pct = Math.round((lancados.length / Math.max(1, campos.length)) * 100);

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
            {calc.info.idadeAnos < 6 && <div className="col-span-2 font-semibold text-ember sm:col-span-3">Fora da faixa normativa do WASI (a partir de 6 anos) — sem cálculo.</div>}
          </dl>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="h-1.5 min-w-[120px] flex-1 overflow-hidden rounded-full bg-mist"><div className="h-full rounded-full bg-sage-deep transition-all duration-500" style={{ width: `${pct}%` }} /></div>
          <span className="text-xs tabular-nums text-ink/60">{lancados.length} de {campos.length} subtestes</span>
          {calc.carregando && <span className="text-xs text-ink/40">calculando…</span>}
        </div>
        <div className="mt-3 text-xs"><Seletor rotulo="Intervalo de confiança" valor={confianca} opcoes={["90%", "95%"]} onChange={(v) => setConfianca(v as "90%" | "95%")} /></div>
      </div>

      {erro && <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
      {calc.erro && !erro && <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{calc.erro}</div>}
      {!sessaoId && <div className="rounded-lg border border-mist bg-paper px-4 py-3 text-sm text-ink/70">Escolha o paciente e a sessão para ver os resultados enquanto você digita: a idade dele define as normas.</div>}

      <div className="flex gap-1 overflow-x-auto border-b border-mist">
        {ABAS.map((a) => (
          <button key={a.id} onClick={() => setAba(a.id)} className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${aba === a.id ? "border-sage-deep text-sage-deep" : "border-transparent text-ink/55 hover:text-ink/80"}`}>{a.label}</button>
        ))}
      </div>

      <div key={aba} className="wais-entra rounded-2xl border border-mist bg-white p-5">
        {aba === "brutos" && (
          <div className="space-y-5">
            <p className="text-sm text-ink/65">Digite o escore bruto de cada subteste. Com Vocabulário e Raciocínio Matricial já sai o QIT-2; com os quatro, o QIT-4 e os QIs Verbal e de Execução.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {SUBTESTES.map((c) => {
                const f = sub(c);
                const t = typeof f?.escoreT === "number" ? f.escoreT : null;
                return (
                  <label key={c} className="flex items-center gap-3 rounded-xl border border-mist px-3 py-2.5 focus-within:border-sage-deep focus-within:ring-2 focus-within:ring-sage-deep/15">
                    <span className="flex-1 text-sm font-semibold text-ink">{c.toUpperCase()} <span className="font-normal text-ink/60">— {NOME[c]}</span></span>
                    <input type="number" inputMode="numeric" min={0} className="w-20 rounded-lg border border-mist bg-paper px-2 py-1.5 text-right text-sm tabular-nums outline-none focus:border-sage-deep" value={escoresBrutos[c] ?? ""} onChange={(e) => onEscoresChange({ ...escoresBrutos, [c]: e.target.value })} placeholder="—" />
                    <span className="w-14 text-right">{t !== null ? <span key={t} className="wais-entra inline-block rounded-full bg-sage-deep px-2 py-0.5 text-xs font-bold text-white tabular-nums" title="Escore T">T {t}</span> : <span className="text-xs text-ink/25">T</span>}</span>
                  </label>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t border-mist pt-4">
              <button className="rounded-lg bg-sage-deep px-5 py-2.5 text-sm font-semibold text-paper transition-opacity disabled:opacity-40" onClick={onSalvar} disabled={salvando || lancados.length === 0}>{salvando ? "Salvando…" : "Salvar lançamento"}</button>
              {lancados.length > 0 && lancados.length < campos.length && <span className="text-xs text-ink/55">{faltamCampos(campos.length - lancados.length)} — o que ficar vazio não entra no cálculo.</span>}
            </div>
          </div>
        )}

        {aba === "escoresT" &&
          (SUBTESTES.every((c) => !sub(c)) ? (
            <Vazio>Lance ao menos um subteste na aba 1.</Vazio>
          ) : (
            <div className="space-y-5">
              <p className="text-sm text-ink/65">Cada bruto convertido em escore T (média 50, desvio-padrão 10) pela norma da faixa etária. A faixa verde é a classificação "Média".</p>
              <div className="space-y-1.5">
                {SUBTESTES.map((c) => {
                  const t = sub(c)?.escoreT;
                  if (typeof t !== "number") return null;
                  const z = zonaDoPonderado(Math.max(1, Math.min(19, Math.round(((t - 50) / 10) * 3 + 10))));
                  return (
                    <div key={c} className="grid grid-cols-[minmax(110px,200px)_1fr_40px] items-center gap-3 text-sm">
                      <span className="truncate text-ink/80">{c.toUpperCase()} <span className="text-ink/45">{NOME[c]}</span></span>
                      <div className="relative h-4 rounded-full bg-paper">
                        <div className="absolute inset-y-0 rounded-full bg-[#dcefd9]" style={{ left: `${((43.3 - 20) / 60) * 100}%`, width: `${((56.7 - 43.3) / 60) * 100}%` }} />
                        <div className="wais-intervalo absolute inset-y-0 left-0 rounded-full" style={{ width: `${((t - 20) / 60) * 100}%`, background: z.traco, opacity: 0.85 }} />
                      </div>
                      <span className="text-right font-semibold tabular-nums">{t}</span>
                    </div>
                  );
                })}
              </div>
              <Tabela cabecalho={["Subteste", "Bruto", "Escore T", "Z-score", "Pts composto", "Ponderado", "Percentil", "Classificação", "Teste-idade"]}>
                {SUBTESTES.filter((c) => porCampo[c]).map((c) => {
                  const f = sub(c);
                  return (
                    <tr key={c} className="border-t border-mist/60">
                      <td className="px-3 py-2 text-left">{c.toUpperCase()} — {NOME[c]}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{porCampo[c].valorBruto}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">{(f?.escoreT as number) ?? "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-ink/70">{fmt(f?.z as number | undefined, 3)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-ink/70">{fmt(f?.pontoComposto as number | undefined)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{(f?.ponderado as number) ?? "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-ink/70">{fmt(f?.percentil as number | undefined)}</td>
                      <td className="px-3 py-2 text-right">{(f?.classificacao as string) ?? <span className="text-xs text-ember">sem norma</span>}</td>
                      <td className="px-3 py-2 text-right text-ink/70">{(f?.testeIdade as string) ?? ""}</td>
                    </tr>
                  );
                })}
              </Tabela>
            </div>
          ))}

        {aba === "qis" &&
          (Object.values(indices).every((i) => i.composto === null) ? (
            <Vazio>Lance os subtestes na aba 1 (QIT-2: Vocabulário e Raciocínio Matricial; QIs Verbal e de Execução: os pares VC+SM e CB+RM).</Vazio>
          ) : (
            <div className="space-y-6">
              <EscalaIndices titulo="QIs" nivelIC={nIC} linhas={ESCALAS.map(([k, sigla, rotulo]): LinhaIndice => ({ ...indices[k], sigla, rotulo, falta: indices[k].composto === null ? "faltam subtestes" : null }))} />
              <section>
                <Titulo>Análise</Titulo>
                <Tabela cabecalho={["Escala", "Soma dos T", "Interpretável?", "D ou F normativa", "Média dos QIs", "Diferença", "Classificação"]}>
                  {ESCALAS.filter(([k]) => indices[k].composto !== null).map(([k, sigla]) => {
                    const i = indices[k];
                    return (
                      <tr key={k} className="border-t border-mist/60">
                        <td className="px-3 py-2 text-left font-semibold">{sigla}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{i.soma}</td>
                        <td className="px-3 py-2 text-right">{i.interpretavel ? <Selo texto={i.interpretavel} cor={corSimNao(i.interpretavel)} /> : ""}</td>
                        <td className="px-3 py-2 text-right">{i.dfNormativa}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmt(i.mediaIndices, 1)}</td>
                        <td className={`px-3 py-2 text-right tabular-nums ${(i.diferencaMedia ?? 0) < 0 ? "text-ember" : ""}`}>{fmt(i.diferencaMedia, 1)}</td>
                        <td className="px-3 py-2 text-right">{i.classificacao}</td>
                      </tr>
                    );
                  })}
                </Tabela>
                {ESCALAS.filter(([k]) => indices[k].observacao).map(([k, sigla]) => <p key={k} className="mt-2 rounded-lg border border-ember/25 bg-ember/10 px-3 py-2 text-xs text-ember"><strong>{sigla}.</strong> {indices[k].observacao}</p>)}
                {ESCALAS.filter(([k]) => indices[k].aviso).map(([k, sigla]) => <p key={k} className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900"><strong>{sigla}.</strong> {indices[k].aviso}</p>)}
                <p className="mt-2 text-[11px] text-ink/45">O intervalo de confiança refere-se ao escore T. Para o WASI a planilha não traz valores críticos para facilidade/dificuldade individual.</p>
              </section>
              <p className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink/50">
                {Object.entries(COR_CLASSIFICACAO).map(([n, cor]) => <span key={n} className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: cor }} />{n}</span>)}
              </p>
            </div>
          ))}

        {aba === "habilidades" && <HabilidadesEIntra extras={extras} />}
        {aba === "idadeMental" && <IdadeMental extras={extras} />}
      </div>
    </div>
  );
}

function HabilidadesEIntra({ extras }: { extras: ExtrasWasi }) {
  const [escolhido, setEscolhido] = useState("");
  const h = extras.habilidades;
  const intra = extras.intraindividual;
  const temMarcas = (h ?? []).some((x) => x.completa);
  if (!h || (!temMarcas && (!intra || intra.itens.length === 0))) return <Vazio>Lance os 4 subtestes (VC, SM, CB e RM) na aba 1: as habilidades e a análise intraindividual comparam cada subteste com a média dos quatro.</Vazio>;
  const COR = { P: "#3f8f5b", N: "#c0392b", "0": "#b9b9b3" } as const;
  const grupos = [...new Set(h.map((i) => i.grupo))];
  return (
    <div className="space-y-8">
      {intra && intra.itens.length > 0 && (
        <section>
          <Titulo>Análise intraindividual</Titulo>
          <div className="space-y-1">
            {intra.itens.map((i) => {
              const w = Math.min(50, (Math.abs(i.diferenca) / 6) * 50);
              return (
                <div key={i.chave} className="grid grid-cols-[minmax(110px,220px)_1fr_56px] items-center gap-3 text-sm">
                  <span className="truncate text-ink/80">{i.nome}</span>
                  <div className="relative h-3.5 rounded-full bg-paper">
                    <div className="absolute inset-y-0 left-1/2 w-px bg-ink/25" />
                    <div className="wais-intervalo absolute inset-y-0 rounded-full" style={{ background: i.diferenca >= 0 ? "#3f8f5b" : "#c0392b", opacity: 0.8, ...(i.diferenca >= 0 ? { left: "50%" } : { right: "50%" }), width: `${w}%` }} />
                  </div>
                  <span className="text-right font-semibold tabular-nums">{i.diferenca > 0 ? "+" : ""}{fmt(i.diferenca, 2)}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {intra.maiorPositiva && <div className="rounded-xl border border-[#3f8f5b]/30 bg-[#3f8f5b]/5 px-4 py-3 text-sm">Maior diferença <strong>positiva</strong>: <strong>{intra.maiorPositiva.nome}</strong> (+{fmt(intra.maiorPositiva.diferenca, 2)})</div>}
            {intra.maiorNegativa && <div className="rounded-xl border border-ember/30 bg-ember/5 px-4 py-3 text-sm">Maior diferença <strong>negativa</strong>: <strong>{intra.maiorNegativa.nome}</strong> ({fmt(intra.maiorNegativa.diferenca, 2)})</div>}
          </div>
        </section>
      )}
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Titulo>Habilidades compartilhadas</Titulo>
          <label className="flex items-center gap-2 text-xs text-ink/60">
            Destacar teste:
            <select className="rounded-lg border border-mist bg-white px-2 py-1 text-sm" value={escolhido} onChange={(e) => setEscolhido(e.target.value)}>
              <option value="">Nenhum</option>
              {SUBTESTES.map((c) => <option key={c} value={c}>{c.toUpperCase()} — {NOME[c]}</option>)}
            </select>
          </label>
        </div>
        {grupos.map((g) => (
          <div key={g}>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink/45">{g}</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {h.filter((i) => i.grupo === g).map((i) => (
                <div key={i.numero} className={`rounded-xl border p-3 transition-colors ${escolhido && i.subtestes.includes(escolhido) ? "border-sage-deep bg-sage-deep/5" : "border-mist"} ${escolhido && !i.subtestes.includes(escolhido) ? "opacity-40" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-semibold leading-tight">{i.numero}. {i.nome}</div>
                    {i.interpretacao && <Selo texto={i.interpretacao} cor={i.interpretacao === "Força" ? "#3f8f5b" : "#c0392b"} />}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {i.subtestes.map((s) => {
                      const m = i.marcas[s];
                      return <span key={s} title={NOME[s]} className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] ${m ? "border-transparent text-white" : "border-mist text-ink/40"}`} style={m ? { background: COR[m] } : undefined}>{s.toUpperCase()}{m ? ` ${m}` : ""}</span>;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function IdadeMental({ extras }: { extras: ExtrasWasi }) {
  const im = extras.idadeMental;
  const ti = extras.testeIdade;
  if (!im || !Object.values(im).some(Boolean)) return <Vazio>Lance os subtestes na aba 1 para estimar a idade mental.</Vazio>;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-6 rounded-xl bg-paper px-5 py-4">
        {ESCALAS.map(([k, sigla]) => (
          <div key={k}>
            <div className="text-[11px] uppercase tracking-wide text-ink/50">{sigla}</div>
            <div className="font-serif text-2xl font-semibold tabular-nums text-ink">{im[k]?.texto ?? "—"}</div>
          </div>
        ))}
      </div>
      {ti && (ti.qit4 || ti.qit2) && <p className="text-sm text-ink/65">Teste-idade: QIT-4 {ti.qit4 ?? "—"} · QIT-2 {ti.qit2 ?? "—"}</p>}
      <p className="text-[11px] text-ink/45">A idade de cada escala é a média das idades equivalentes dos subtestes que a compõem. Acima de 16 anos a tabela de idade equivalente não tem dados.</p>
    </div>
  );
}
