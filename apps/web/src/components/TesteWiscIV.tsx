import { useEffect, useMemo, useState } from "react";
import { api, type AplicacaoDeTeste, type ResultadoCalculado, type Teste } from "../lib/api";
import { faltamCampos } from "../lib/plural";
import { lerExtras as lerExtrasGenerico, lerIndice, lerPonderados, ROTULO_INDICE, COR_CLASSIFICACAO, zonaDoPonderado, type IndiceLido } from "../lib/wechsler";
import {
  GRUPOS_WISC4,
  NOME_SUBTESTE_WISC4,
  PROCESSO_WISC4,
  SUBTESTES_WISC4,
  type ExtrasWisc4,
} from "../lib/wisc4";
import { EscalaIndices, type LinhaIndice } from "./graficos/EscalaIndices";
import { PlaceholderBadge } from "./PlaceholderBadge";

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
  abaInicial?: AbaWisc;
}

export type AbaWisc = "brutos" | "ponderados" | "indices" | "discrepancias" | "facilidades" | "clusters" | "processo" | "habilidades" | "idadeMental";

const ABAS: Array<{ id: AbaWisc; label: string }> = [
  { id: "brutos", label: "1. Brutos" },
  { id: "ponderados", label: "2. Ponderados" },
  { id: "indices", label: "3. Índices e QIs" },
  { id: "discrepancias", label: "4. Discrepâncias" },
  { id: "facilidades", label: "5. Facilidades" },
  { id: "clusters", label: "6. Clusters" },
  { id: "processo", label: "7. Processo" },
  { id: "habilidades", label: "8. Habilidades" },
  { id: "idadeMental", label: "9. Idade mental" },
];

const SUBSTITUTO: Record<string, string> = {
  in: "suplementar — pode substituir um do ICV", rp: "suplementar — pode substituir um do ICV", cf: "suplementar — pode substituir um do IOP",
  ar: "suplementar — pode substituir um do IMO", ca: "suplementar — pode substituir um do IVP",
};

const fmt = (n: number | null | undefined, casas = 1) => (n === null || n === undefined ? "—" : n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }));
const nome = (c: string) => NOME_SUBTESTE_WISC4[c] ?? c.toUpperCase();

export function TesteWiscIV({ teste, aplicacao, escoresBrutos, onEscoresChange, onSalvar, sessaoId, testeId, erro, salvando = false, abaInicial }: Props) {
  const campos = teste?.algoritmoCorrecao.campos ?? [];
  const [abaAtiva, setAbaAtiva] = useState<AbaWisc>(abaInicial ?? "brutos");
  const [confianca, setConfianca] = useState<"90%" | "95%">("95%");
  const [base, setBase] = useState<"Amostra Geral" | "Nível de Habilidade">("Amostra Geral");
  type InfoCalculo = Awaited<ReturnType<typeof api.calcularAplicacao>>;
  const [calc, setCalc] = useState<{ resultado: ResultadoCalculado | null; info?: InfoCalculo; carregando: boolean; erro?: string }>({ resultado: null, carregando: false });

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
        .calcularAplicacao({ sessaoId, testeId, escoresBrutos: numeros, confianca, base })
        .then((r) => !cancelado && setCalc({ resultado: r.resultadoCalculado, info: r, carregando: false }))
        .catch((e) => !cancelado && setCalc((c) => ({ ...c, carregando: false, erro: (e as Error).message })));
    }, 350);
    return () => {
      cancelado = true;
      clearTimeout(t);
    };
  }, [escoresBrutos, sessaoId, testeId, confianca, base]);

  const resultado = calc.resultado ?? (lancados.length > 0 ? aplicacao?.resultadoCalculado ?? null : null);
  const ponderados = useMemo(() => lerPonderados(resultado, SUBTESTES_WISC4), [resultado]);
  const extras = useMemo(() => lerExtrasGenerico(resultado) as unknown as ExtrasWisc4, [resultado]);
  const indices = useMemo(() => Object.fromEntries(["icv", "iop", "imo", "ivp", "qit", "gai", "cpi"].map((k) => [k, lerIndice(resultado, k)])) as Record<string, IndiceLido>, [resultado]);
  const pctLancado = Math.round((lancados.length / Math.max(1, campos.length)) * 100);
  const nIC = confianca === "90%" ? "ic90" : "ic95";

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-mist bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-ink">{teste.sigla}</h2>
            <p className="mt-1 text-xs text-ink/60">{aplicacao?.teste.nome || teste.nome}</p>
          </div>
          {teste.isPlaceholder && <PlaceholderBadge />}
        </div>
        {calc.info && (
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-xl bg-paper px-4 py-3 text-xs sm:grid-cols-3">
            {[
              ["Nome", calc.info.paciente.nome],
              ["Data de aplicação", new Date(calc.info.dataAplicacao).toLocaleDateString("pt-BR", { timeZone: "UTC" })],
              ["Data de nascimento", new Date(calc.info.paciente.dataNascimento).toLocaleDateString("pt-BR", { timeZone: "UTC" })],
              ["Idade cronológica", calc.info.idadeTexto],
            ].map(([r, v]) => (
              <div key={r} className="flex gap-2">
                <dt className="text-ink/50">{r}:</dt>
                <dd className="font-semibold text-ink">{v}</dd>
              </div>
            ))}
            {(calc.info.idadeAnos < 6 || calc.info.idadeAnos > 16) && (
              <div className="col-span-2 font-semibold text-ember sm:col-span-3">Fora da faixa normativa do WISC-IV (6:0 a 16:11) — sem cálculo.</div>
            )}
          </dl>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="h-1.5 min-w-[120px] flex-1 overflow-hidden rounded-full bg-mist">
            <div className="h-full rounded-full bg-sage-deep transition-all duration-500" style={{ width: `${pctLancado}%` }} />
          </div>
          <span className="text-xs tabular-nums text-ink/60">{lancados.length} de {campos.length} campos</span>
          {calc.carregando && <span className="text-xs text-ink/40">calculando…</span>}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
          <Seletor rotulo="Intervalo de confiança" valor={confianca} opcoes={["90%", "95%"]} onChange={(v) => setConfianca(v as "90%" | "95%")} />
          <Seletor rotulo="Base de comparação" valor={base} opcoes={["Amostra Geral", "Nível de Habilidade"]} onChange={(v) => setBase(v as "Amostra Geral" | "Nível de Habilidade")} />
        </div>
      </div>

      {erro && <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
      {calc.erro && !erro && <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{calc.erro}</div>}
      {!sessaoId && <div className="rounded-lg border border-mist bg-paper px-4 py-3 text-sm text-ink/70">Escolha o paciente e a sessão para ver os resultados enquanto você digita: a idade dele define as normas.</div>}

      <div className="flex gap-1 overflow-x-auto border-b border-mist">
        {ABAS.map((a) => (
          <button key={a.id} onClick={() => setAbaAtiva(a.id)} className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${abaAtiva === a.id ? "border-sage-deep text-sage-deep" : "border-transparent text-ink/55 hover:text-ink/80"}`}>
            {a.label}
          </button>
        ))}
      </div>

      <div key={abaAtiva} className="wais-entra rounded-2xl border border-mist bg-white p-5">
        {abaAtiva === "brutos" && (
          <div className="space-y-6">
            <p className="text-sm text-ink/65">Digite o escore bruto de cada subteste aplicado. Cada índice aparece quando todos os subtestes dele estão lançados (o suplementar entra no lugar de um principal que falte).</p>
            {GRUPOS_WISC4.map((g) => (
              <section key={g.chave}>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">{g.titulo} ({g.sigla})</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[...g.principais, ...g.suplementares].map((c) => (
                    <CampoBruto key={c} chave={c} sub={SUBSTITUTO[c]} valor={escoresBrutos[c] ?? ""} onChange={(v) => onEscoresChange({ ...escoresBrutos, [c]: v })} ponderado={ponderados[c]} />
                  ))}
                </div>
              </section>
            ))}
            <section>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">Escores de processo (opcionais)</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {PROCESSO_WISC4.map((c) => (
                  <CampoBruto key={c} chave={c} valor={escoresBrutos[c] ?? ""} onChange={(v) => onEscoresChange({ ...escoresBrutos, [c]: v })} ponderado={undefined} />
                ))}
              </div>
            </section>
            <div className="flex flex-wrap items-center gap-3 border-t border-mist pt-4">
              <button className="rounded-lg bg-sage-deep px-5 py-2.5 text-sm font-semibold text-paper transition-opacity disabled:opacity-40" onClick={onSalvar} disabled={salvando || lancados.length === 0}>
                {salvando ? "Salvando…" : "Salvar lançamento"}
              </button>
              {lancados.length > 0 && lancados.length < campos.length && <span className="text-xs text-ink/55">{faltamCampos(campos.length - lancados.length)} — o que ficar vazio simplesmente não entra no cálculo.</span>}
            </div>
          </div>
        )}

        {abaAtiva === "ponderados" && (Object.keys(ponderados).length === 0 ? <Vazio>Lance ao menos um subteste na aba 1 para ver o perfil.</Vazio> : <Ponderados ponderados={ponderados} extras={extras} />)}

        {abaAtiva === "indices" && (
          <div className="space-y-6">
            {Object.values(indices).every((i) => i.composto === null) ? (
              <Vazio>Lance os subtestes na aba 1 para calcular os índices.</Vazio>
            ) : (
              <>
                <EscalaIndices
                  titulo="Índices fatoriais"
                  nivelIC={nIC}
                  linhas={linhasIndice([["icv", "ICV", "Compreensão Verbal"], ["iop", "IOP", "Organização Perceptual"], ["imo", "IMO", "Memória Operacional"], ["ivp", "IVP", "Velocidade de Processamento"]], indices)}
                />
                <EscalaIndices
                  titulo="QI Total e índices gerais"
                  nivelIC={nIC}
                  linhas={linhasIndice([["qit", "QI Total", "Quociente Intelectual Total"], ["gai", "GAI", "Índice de Habilidade Geral (ICV + IOP)"], ["cpi", "CPI", "Índice de Proficiência Cognitiva (IMO + IVP)"]], indices)}
                />
                <AnaliseAvancada indices={indices} />
                <p className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink/50">
                  {Object.entries(COR_CLASSIFICACAO).map(([n, cor]) => (
                    <span key={n} className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: cor }} />{n}</span>
                  ))}
                </p>
              </>
            )}
          </div>
        )}

        {abaAtiva === "discrepancias" && <Discrepancias extras={extras} />}
        {abaAtiva === "facilidades" && <Facilidades extras={extras} />}
        {abaAtiva === "clusters" && <Clusters extras={extras} />}
        {abaAtiva === "processo" && <Processo resultado={resultado} extras={extras} />}
        {abaAtiva === "habilidades" && <Habilidades extras={extras} />}
        {abaAtiva === "idadeMental" && <IdadeMental extras={extras} />}
      </div>
    </div>
  );
}

function linhasIndice(itens: Array<[string, string, string]>, indices: Record<string, IndiceLido>): LinhaIndice[] {
  return itens.map(([chave, sigla, rotulo]) => ({ ...indices[chave], sigla, rotulo, falta: indices[chave].composto === null ? "faltam subtestes" : null }));
}

function Seletor<T extends string>({ rotulo, valor, opcoes, onChange }: { rotulo: string; valor: T; opcoes: T[]; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-ink/50">{rotulo}:</span>
      <div className="inline-flex rounded-full border border-mist p-0.5 font-semibold">
        {opcoes.map((o) => (
          <button key={o} onClick={() => onChange(o)} className={`rounded-full px-3 py-1 transition-colors ${valor === o ? "bg-ink text-paper" : "text-ink/60"}`}>{o}</button>
        ))}
      </div>
    </div>
  );
}

function CampoBruto({ chave, sub, valor, onChange, ponderado }: { chave: string; sub?: string; valor: string; onChange: (v: string) => void; ponderado?: { ponderado: number | null } }) {
  const zona = ponderado?.ponderado != null ? zonaDoPonderado(ponderado.ponderado) : null;
  return (
    <label className="flex items-center gap-3 rounded-xl border border-mist px-3 py-2.5 focus-within:border-sage-deep focus-within:ring-2 focus-within:ring-sage-deep/15">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{chave.toUpperCase()} <span className="font-normal text-ink/60">— {nome(chave)}</span></span>
        {sub && <span className="block text-[11px] leading-tight text-ink/45">{sub}</span>}
      </span>
      <input type="number" inputMode="numeric" min={0} className="w-20 rounded-lg border border-mist bg-paper px-2 py-1.5 text-right text-sm tabular-nums outline-none focus:border-sage-deep" value={valor} onChange={(e) => onChange(e.target.value)} placeholder="—" />
      <span className="w-14 text-right">
        {zona && ponderado?.ponderado != null ? (
          <span key={ponderado.ponderado} className="wais-entra inline-block rounded-full px-2 py-0.5 text-xs font-bold text-white tabular-nums" style={{ background: zona.traco }} title={`Ponderado ${ponderado.ponderado} · ${zona.rotulo}`}>{ponderado.ponderado}</span>
        ) : ponderado && ponderado.ponderado === null ? (
          <span className="text-[10px] text-ember">sem norma</span>
        ) : (
          <span className="text-xs text-ink/25">pond.</span>
        )}
      </span>
    </label>
  );
}

function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-mist bg-paper px-6 py-10 text-center">
      <p className="mx-auto max-w-md text-sm text-ink/60">{children}</p>
    </div>
  );
}

function Selo({ texto, cor }: { texto: string; cor: string }) {
  return <span className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white" style={{ background: cor }}>{texto}</span>;
}
const corSimNao = (v: string) => (v === "Sim" || v === "SIM" ? "#3f8f5b" : "#8a8a85");

function Tabela({ cabecalho, children }: { cabecalho: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-mist">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-paper text-[11px] uppercase tracking-wide text-ink/50">
            {cabecalho.map((c, i) => (
              <th key={c} className={`px-3 py-2 font-semibold ${i === 0 ? "text-left" : "text-right"}`}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
const Titulo = ({ children }: { children: React.ReactNode }) => <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-sage-deep">{children}</h3>;

// ---- 2. Ponderados: perfil em barras + tabela + soma por índice ----
function Ponderados({ ponderados, extras }: { ponderados: ReturnType<typeof lerPonderados>; extras: ExtrasWisc4 }) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-ink/65">Cada escore bruto convertido em ponto ponderado (1 a 19) pela norma da faixa etária (33 faixas de 4 meses). A faixa verde é a classificação "Média" (8 a 11).</p>
      <div className="space-y-4">
        {GRUPOS_WISC4.map((g) => (
          <div key={g.chave}>
            <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-ink/45">{g.sigla}</div>
            <div className="space-y-1">
              {[...g.principais, ...g.suplementares].map((c) => {
                const p = ponderados[c];
                if (!p) return null;
                const zona = p.ponderado != null ? zonaDoPonderado(p.ponderado) : null;
                return (
                  <div key={c} className="grid grid-cols-[minmax(90px,200px)_1fr_36px] items-center gap-3 text-sm">
                    <span className="truncate text-ink/80">{c.toUpperCase()} <span className="text-ink/45">{nome(c)}</span></span>
                    <div className="relative h-4 rounded-full bg-paper">
                      <div className="absolute inset-y-0 rounded-full bg-[#dcefd9]" style={{ left: `${(7 / 19) * 100}%`, width: `${(4 / 19) * 100}%` }} />
                      {zona && p.ponderado != null && <div className="wais-intervalo absolute inset-y-0 left-0 rounded-full" style={{ width: `${(p.ponderado / 19) * 100}%`, background: zona.traco, opacity: 0.85 }} />}
                    </div>
                    <span className="text-right font-semibold tabular-nums">{p.ponderado ?? "—"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <Tabela cabecalho={["Subteste", "Bruto", "Ponderado", "Z-score", "Pts composto", "Percentil", "Classificação"]}>
        {SUBTESTES_WISC4.filter((c) => ponderados[c]).map((c) => {
          const v = ponderados[c];
          const z = v.ponderado != null ? zonaDoPonderado(v.ponderado) : null;
          return (
            <tr key={c} className="border-t border-mist/60">
              <td className="px-3 py-2">{c.toUpperCase()} — {nome(c)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{v.bruto}</td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums">{v.ponderado ?? "—"}</td>
              <td className="px-3 py-2 text-right tabular-nums text-ink/70">{fmt(v.z, 3)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-ink/70">{fmt(v.pontoComposto)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-ink/70">{fmt(v.percentil)}</td>
              <td className="px-3 py-2 text-right">{z ? <span className="inline-flex items-center gap-2 text-xs"><span className="h-2.5 w-2.5 rounded-full" style={{ background: z.traco }} />{v.classificacao ?? z.rotulo}</span> : <span className="text-xs text-ember">sem norma</span>}</td>
            </tr>
          );
        })}
      </Tabela>
      {extras.intraindividual && extras.intraindividual.itens.length === 0 && null}
    </div>
  );
}

function AnaliseAvancada({ indices }: { indices: Record<string, IndiceLido> }) {
  const linhas = ["icv", "iop", "imo", "ivp"].map((k) => ({ k, i: indices[k] })).filter((l) => l.i.composto !== null);
  const avisos = ["qit", "gai", "cpi"].map((k) => ({ k, i: indices[k] })).filter((l) => l.i.aviso);
  if (linhas.length === 0) return null;
  return (
    <section>
      <Titulo>Análise avançada</Titulo>
      <Tabela cabecalho={["Índice", "Homogêneo?", "D ou F normativa", "Média dos índices", "Diferença", "Valor crítico", "D ou F individual", "Raro?"]}>
        {linhas.map(({ k, i }) => (
          <tr key={k} className="border-t border-mist align-top">
            <td className="px-3 py-2 text-left font-semibold">{ROTULO_INDICE[k]}</td>
            <td className="px-3 py-2 text-right">{i.homogeneo ? <Selo texto={i.homogeneo} cor={i.homogeneo === "SIM" ? "#3f8f5b" : "#c0392b"} /> : ""}</td>
            <td className="px-3 py-2 text-right">{i.dfNormativa}</td>
            <td className="px-3 py-2 text-right tabular-nums">{fmt(i.mediaIndices, 2)}</td>
            <td className={`px-3 py-2 text-right tabular-nums ${(i.diferencaMedia ?? 0) < 0 ? "text-ember" : ""}`}>{fmt(i.diferencaMedia, 2)}</td>
            <td className="px-3 py-2 text-right tabular-nums">{fmt(i.valorCritico, 2)}</td>
            <td className="px-3 py-2 text-right">{i.dfIndividual}</td>
            <td className="px-3 py-2 text-right">{i.raro}</td>
          </tr>
        ))}
      </Tabela>
      {linhas.filter((l) => l.i.observacao).map(({ k, i }) => <p key={k} className="mt-2 rounded-lg border border-ember/25 bg-ember/10 px-3 py-2 text-xs text-ember"><strong>{ROTULO_INDICE[k]}.</strong> {i.observacao}</p>)}
      {avisos.map(({ k, i }) => <p key={k} className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900"><strong>{k.toUpperCase()}.</strong> {i.aviso}</p>)}
    </section>
  );
}

// ---- 4. Discrepâncias ----
function Discrepancias({ extras }: { extras: ExtrasWisc4 }) {
  if (!extras.discrepanciasIndices) return <Vazio>Lance os subtestes na aba 1 até os índices serem calculados para comparar as discrepâncias.</Vazio>;
  const gc = extras.gaiCpi;
  return (
    <div className="space-y-8">
      <section>
        <Titulo>Comparação entre índices</Titulo>
        {extras.discrepanciasIndices.length === 0 ? (
          <p className="text-sm text-ink/55">Precisa de pelo menos dois índices calculados.</p>
        ) : (
          <Tabela cabecalho={["Par", "Pontos 1", "Pontos 2", "Diferença", "Valor crítico", "Significativa?", "Freq. acumulada"]}>
            {extras.discrepanciasIndices.map((d) => (
              <tr key={d.par} className="border-t border-mist/60">
                <td className="px-3 py-2 font-semibold">{d.par}</td>
                <td className="px-3 py-2 text-right tabular-nums">{d.pontosA}</td>
                <td className="px-3 py-2 text-right tabular-nums">{d.pontosB}</td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">{d.diferenca > 0 ? `+${d.diferenca}` : d.diferenca}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(d.valorCritico, 2)}</td>
                <td className="px-3 py-2 text-right"><Selo texto={d.significativa} cor={corSimNao(d.significativa)} /></td>
                <td className="px-3 py-2 text-right tabular-nums">{d.frequencia}</td>
              </tr>
            ))}
          </Tabela>
        )}
        {gc && <p className="mt-2 text-sm text-ink/70">GAI × CPI: <strong className="tabular-nums">{gc.gai}</strong> − <strong className="tabular-nums">{gc.cpi}</strong> = <strong className="tabular-nums">{gc.diferenca > 0 ? `+${gc.diferenca}` : gc.diferenca}</strong> pontos compostos.</p>}
      </section>
      <section>
        <Titulo>Comparação entre subtestes</Titulo>
        {(extras.discrepanciasSubtestes ?? []).length === 0 ? (
          <p className="text-sm text-ink/55">Nenhum par de subtestes lançado.</p>
        ) : (
          <Tabela cabecalho={["Grupo / par", "Pond. 1", "Pond. 2", "Diferença", "Valor crítico", "Significativa?", "Freq. acumulada"]}>
            {(extras.discrepanciasSubtestes ?? []).map((d) => (
              <tr key={d.linha} className="border-t border-mist/60">
                <td className="px-3 py-2"><span className="mr-2 text-[11px] text-ink/45">{d.grupo}</span><span className="font-semibold">{d.par}</span></td>
                <td className="px-3 py-2 text-right tabular-nums">{d.pontosA}</td>
                <td className="px-3 py-2 text-right tabular-nums">{d.pontosB}</td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">{d.diferenca > 0 ? `+${d.diferenca}` : d.diferenca}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(d.valorCritico, 2)}</td>
                <td className="px-3 py-2 text-right"><Selo texto={d.significativa} cor={corSimNao(d.significativa)} /></td>
                <td className="px-3 py-2 text-right tabular-nums">{d.frequencia}</td>
              </tr>
            ))}
          </Tabela>
        )}
      </section>
    </div>
  );
}

// ---- 5. Facilidades e dificuldades + análise intraindividual ----
function Facilidades({ extras }: { extras: ExtrasWisc4 }) {
  const fac = extras.facilidades ?? [];
  const intra = extras.intraindividual;
  if (fac.length === 0 && (!intra || intra.itens.length === 0)) return <Vazio>Lance os subtestes na aba 1 (os 4 índices precisam estar calculados) para ver as facilidades e dificuldades.</Vazio>;
  return (
    <div className="space-y-8">
      {fac.length > 0 && (
        <section>
          <Titulo>Facilidades e dificuldades por subteste</Titulo>
          <p className="mb-2 max-w-2xl text-sm text-ink/65">Cada ponderado contra a média do QI Total — ou, se ICV e IOP diferem significativamente, contra a média do próprio grupo (verbais ou executivos).</p>
          <Tabela cabecalho={["Subteste", "Ponderado", "Média", "Diferença", "Valor crítico", "Significativa?", "F / D", "Freq. acumulada"]}>
            {fac.map((f) => (
              <tr key={f.chave} className="border-t border-mist/60">
                <td className="px-3 py-2 font-semibold">{f.chave.toUpperCase()} <span className="font-normal text-ink/50">{nome(f.chave)}</span></td>
                <td className="px-3 py-2 text-right tabular-nums">{f.ponderado}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(f.media, 2)}</td>
                <td className={`px-3 py-2 text-right font-semibold tabular-nums ${f.diferenca < 0 ? "text-ember" : ""}`}>{fmt(f.diferenca, 2)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(f.valorCritico, 2)}</td>
                <td className="px-3 py-2 text-right"><Selo texto={f.significativa} cor={corSimNao(f.significativa)} /></td>
                <td className="px-3 py-2 text-right">{f.facilidadeDificuldade ? <Selo texto={f.facilidadeDificuldade === "F" ? "Facilidade" : "Dificuldade"} cor={f.facilidadeDificuldade === "F" ? "#3f8f5b" : "#c0392b"} /> : ""}</td>
                <td className="px-3 py-2 text-right">{f.frequencia}</td>
              </tr>
            ))}
          </Tabela>
        </section>
      )}
      {intra && intra.itens.length > 0 && (
        <section>
          <Titulo>Análise intraindividual</Titulo>
          <p className="mb-3 max-w-2xl text-sm text-ink/65">Diferença de cada subteste para a média do seu índice. Barras à direita: acima da média; à esquerda: abaixo.</p>
          <div className="space-y-1">
            {intra.itens.map((i) => {
              const w = Math.min(50, (Math.abs(i.diferenca) / 6) * 50);
              return (
                <div key={i.chave} className="grid grid-cols-[minmax(90px,220px)_1fr_56px] items-center gap-3 text-sm">
                  <span className="truncate text-ink/80">{i.chave.toUpperCase()} <span className="text-ink/45">{nome(i.chave)}</span></span>
                  <div className="relative h-3.5 rounded-full bg-paper">
                    <div className="absolute inset-y-0 left-1/2 w-px bg-ink/25" />
                    <div className="wais-intervalo absolute inset-y-0 rounded-full" style={{ background: i.diferenca >= 0 ? "#3f8f5b" : "#c0392b", opacity: 0.8, ...(i.diferenca >= 0 ? { left: "50%" } : { right: "50%" }), width: `${w}%` }} />
                  </div>
                  <span className={`text-right font-semibold tabular-nums ${i.diferenca <= -1 ? "text-ember" : i.diferenca >= 1 ? "text-[#2f7a4b]" : "text-ink/50"}`}>{i.diferenca > 0 ? "+" : ""}{fmt(i.diferenca, 2)}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {intra.maiorPositiva && <div className="rounded-xl border border-[#3f8f5b]/30 bg-[#3f8f5b]/5 px-4 py-3 text-sm">Maior diferença <strong>positiva</strong>: <strong>{intra.maiorPositiva.nome}</strong> ({intra.maiorPositiva.diferenca > 0 ? "+" : ""}{fmt(intra.maiorPositiva.diferenca, 2)})</div>}
            {intra.maiorNegativa && <div className="rounded-xl border border-ember/30 bg-ember/5 px-4 py-3 text-sm">Maior diferença <strong>negativa</strong>: <strong>{intra.maiorNegativa.nome}</strong> ({fmt(intra.maiorNegativa.diferenca, 2)})</div>}
          </div>
          <p className="mt-2 text-[11px] text-ink/45">Observe o quadro "Habilidades compartilhadas" (aba 8) para uma compreensão mais profunda do examinado.</p>
        </section>
      )}
    </div>
  );
}

// ---- 6. Clusters ----
function Clusters({ extras }: { extras: ExtrasWisc4 }) {
  const clusters = extras.clusters ?? [];
  if (!clusters.some((c) => c.calculado)) return <Vazio>Lance os subtestes na aba 1: cada cluster é calculado quando todos os subtestes dele estão lançados.</Vazio>;
  const linhas: LinhaIndice[] = clusters.map((c) => ({
    chave: c.chave, sigla: c.sigla, rotulo: c.rotulo.replace(/\s*\(.*\)$/, ""), soma: c.soma ?? null, composto: c.composto ?? null, percentil: c.percentil ?? null, ic90: null, ic95: c.ic95 ?? null,
    classificacao: c.classificacao ?? null, mpp: null, diferenca: null, homogeneo: null, interpretavel: null, dfNormativa: null, mediaIndices: null, diferencaMedia: null, valorCritico: null,
    dfIndividual: null, raro: null, aviso: null, observacao: null,
    falta: !c.calculado ? "faltam subtestes" : c.interpretavel === false ? "não interpretável (diferença ≥ 5 entre subtestes)" : null,
  }));
  const comps = (extras.comparacoesClinicas ?? []).filter((c) => c.calculada);
  return (
    <div className="space-y-8">
      <EscalaIndices titulo="Clusters" nivelIC="ic95" linhas={linhas} />
      <section>
        <Titulo>Comparações clínicas</Titulo>
        {comps.length === 0 ? (
          <p className="text-sm text-ink/55">Nenhuma comparação disponível: os dois clusters precisam estar calculados e ser interpretáveis.</p>
        ) : (
          <div className="space-y-3">
            {comps.map((c) => (
              <div key={c.linha} className="rounded-xl border border-mist p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="font-semibold">{c.tituloEsquerda} {c.sentido} {c.tituloDireita}</div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="tabular-nums text-ink/60">{c.compostoA} − {c.compostoB} = <strong className="text-ink">{(c.diferenca ?? 0) > 0 ? "+" : ""}{c.diferenca}</strong></span>
                    <Selo texto={c.raro ?? ""} cor={c.raro === "Raro" ? "#c0392b" : "#8a8a85"} />
                  </div>
                </div>
                <div className="mt-1 text-[11px] text-ink/45">Raro quando a diferença é de {c.valorCritico} pontos ou mais.</div>
                {c.hipotese && <p className="mt-3 text-sm leading-relaxed text-ink/80"><strong className="text-sage-deep">Hipótese. </strong>{c.hipotese}</p>}
                {c.sugestao && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink/75"><strong className="text-sage-deep">Sugestões de intervenção. </strong>{c.sugestao}</p>}
              </div>
            ))}
          </div>
        )}
        {extras.gaiCpi && <p className="mt-3 text-sm text-ink/70">GAI × CPI: <strong className="tabular-nums">{extras.gaiCpi.gai}</strong> − <strong className="tabular-nums">{extras.gaiCpi.cpi}</strong> = <strong className="tabular-nums">{extras.gaiCpi.diferenca > 0 ? "+" : ""}{extras.gaiCpi.diferenca}</strong></p>}
      </section>
    </div>
  );
}

// ---- 7. Escores de processo ----
function Processo({ resultado, extras }: { resultado: ResultadoCalculado | null; extras: ExtrasWisc4 }) {
  const porCampo = resultado && resultado.modo === "por_campo" ? resultado.porCampo : {};
  const linha = (c: string) => {
    const v = porCampo[c];
    if (!v || v.valorBruto === null) return null;
    const f = (v.faixa ?? {}) as Record<string, unknown>;
    const n = (x: unknown) => (typeof x === "number" ? x : null);
    return { c, bruto: v.valorBruto, ponderado: n(f.ponderado), freq: n(f.frequenciaAcumulada), z: n(f.z), percentil: n(f.percentil), classificacao: typeof f.classificacao === "string" ? f.classificacao : null };
  };
  const pond = ["cusb", "diod", "dioi", "caa", "cae"].map(linha).filter((x) => x !== null);
  const udio = ["udiod", "udioi"].map(linha).filter((x) => x !== null);
  if (pond.length === 0 && udio.length === 0) return <Vazio>Lance os escores de processo (CUSB, DIOD, DIOI, CAA, CAE, UDIOD, UDIOI) na aba 1.</Vazio>;
  const dif = extras.diferencaUdio;
  return (
    <div className="space-y-8">
      {pond.length > 0 && (
        <section>
          <Titulo>Escores de processo</Titulo>
          <Tabela cabecalho={["Teste", "Bruto", "Ponderado", "Z-score", "Percentil", "Classificação"]}>
            {pond.map((p) => (
              <tr key={p.c} className="border-t border-mist/60">
                <td className="px-3 py-2">{p.c.toUpperCase()} — {nome(p.c)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{p.bruto}</td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">{p.ponderado ?? "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(p.z, 3)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(p.percentil)}</td>
                <td className="px-3 py-2 text-right">{p.classificacao}</td>
              </tr>
            ))}
          </Tabela>
        </section>
      )}
      {udio.length > 0 && (
        <section>
          <Titulo>Maior sequência de dígitos</Titulo>
          <Tabela cabecalho={["Teste", "Bruto", "Freq. acumulada", "Z-score", "Percentil", "Classificação"]}>
            {udio.map((p) => (
              <tr key={p.c} className="border-t border-mist/60">
                <td className="px-3 py-2">{p.c.toUpperCase()} — {nome(p.c)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{p.bruto}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(p.freq)}%</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(p.z, 3)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(p.percentil)}</td>
                <td className="px-3 py-2 text-right">{p.classificacao}</td>
              </tr>
            ))}
          </Tabela>
          {dif && (
            <p className="mt-2 text-sm text-ink/70">
              UDIOD − UDIOI = <strong className="tabular-nums">{dif.diferenca}</strong> · frequência acumulada {fmt(dif.frequenciaAcumulada)}% · Z {fmt(dif.z, 3)} · percentil {fmt(dif.percentil)} · <strong>{dif.classificacao}</strong>
            </p>
          )}
        </section>
      )}
      {(extras.comparacoesProcesso ?? []).length > 0 && (
        <section>
          <Titulo>Comparação entre discrepâncias</Titulo>
          <Tabela cabecalho={["Par", "Pond. 1", "Pond. 2", "Diferença", "Valor crítico", "Significativa?", "Freq. acumulada"]}>
            {(extras.comparacoesProcesso ?? []).map((d) => (
              <tr key={d.linha} className="border-t border-mist/60">
                <td className="px-3 py-2 font-semibold">{d.par}</td>
                <td className="px-3 py-2 text-right tabular-nums">{d.pontosA}</td>
                <td className="px-3 py-2 text-right tabular-nums">{d.pontosB}</td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">{d.diferenca > 0 ? `+${d.diferenca}` : d.diferenca}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(d.valorCritico, 2)}</td>
                <td className="px-3 py-2 text-right"><Selo texto={d.significativa} cor={corSimNao(d.significativa)} /></td>
                <td className="px-3 py-2 text-right">{d.frequencia}</td>
              </tr>
            ))}
          </Tabela>
        </section>
      )}
    </div>
  );
}

// ---- 8. Habilidades compartilhadas ----
function Habilidades({ extras }: { extras: ExtrasWisc4 }) {
  const h = extras.habilidades;
  const [escolhido, setEscolhido] = useState<string>("");
  if (!h) return <Vazio>Lance os subtestes na aba 1 para ver as habilidades compartilhadas.</Vazio>;
  const grupos = [...new Set(h.itens.map((i) => i.grupo))];
  const COR = { P: "#3f8f5b", N: "#c0392b", "0": "#b9b9b3" } as const;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-ink/65">
          Cada subteste é marcado pela diferença para a média do seu índice: <strong className="text-[#3f8f5b]">P</strong> (+1 ou mais), <strong className="text-ember">N</strong> (−1 ou menos), 0 (neutro). A habilidade só é interpretada com todos os subtestes dela lançados.
        </p>
        <label className="flex items-center gap-2 text-xs text-ink/60">
          Destacar teste:
          <select className="rounded-lg border border-mist bg-white px-2 py-1 text-sm" value={escolhido} onChange={(e) => setEscolhido(e.target.value)}>
            <option value="">Nenhum</option>
            {Object.keys(NOME_SUBTESTE_WISC4).filter((c) => SUBTESTES_WISC4.includes(c)).map((c) => <option key={c} value={c}>{c.toUpperCase()} — {nome(c)}</option>)}
          </select>
        </label>
      </div>
      {grupos.map((g) => (
        <section key={g}>
          <Titulo>{g}</Titulo>
          <div className="grid gap-2 sm:grid-cols-2">
            {h.itens.filter((i) => i.grupo === g).map((i) => (
              <div key={i.numero} className={`rounded-xl border p-3 transition-colors ${escolhido && i.subtestes.includes(escolhido) ? "border-sage-deep bg-sage-deep/5" : "border-mist"} ${escolhido && !i.subtestes.includes(escolhido) ? "opacity-40" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold leading-tight">{i.numero}. {i.nome}</div>
                  {i.interpretacao && <Selo texto={i.interpretacao} cor={i.interpretacao === "Força" ? "#3f8f5b" : "#c0392b"} />}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {i.subtestes.map((s) => {
                    const m = i.marcas[s];
                    return (
                      <span key={s} title={nome(s)} className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] ${m ? "border-transparent text-white" : "border-mist text-ink/40"}`} style={m ? { background: COR[m] } : undefined}>
                        {s.toUpperCase()}{m ? ` ${m}` : ""}
                      </span>
                    );
                  })}
                </div>
                {!i.completa && <div className="mt-1 text-[10px] text-ink/40">faltam subtestes para interpretar</div>}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// ---- 9. Idade mental ----
function IdadeMental({ extras }: { extras: ExtrasWisc4 }) {
  const im = extras.idadeMental;
  if (!im || Object.keys(im.subtestes).length === 0) return <Vazio>Lance os subtestes na aba 1 para estimar a idade mental.</Vazio>;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-6 rounded-xl bg-paper px-5 py-4">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-ink/50">Idade mental estimada</div>
          <div className="font-serif text-3xl font-semibold text-ink">{im.total?.texto ?? "—"}</div>
        </div>
        <div className="flex flex-wrap gap-5">
          {GRUPOS_WISC4.map((g) => (
            <div key={g.chave}>
              <div className="text-[11px] uppercase tracking-wide text-ink/50">{g.sigla}</div>
              <div className="text-lg font-semibold tabular-nums">{im.indices[g.chave]?.texto ?? "—"}</div>
            </div>
          ))}
        </div>
      </div>
      {im.avisos.map((a) => <p key={a} className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">{a}</p>)}
      <Tabela cabecalho={["Subteste (teste-idade)", "Idade equivalente", "Meses"]}>
        {SUBTESTES_WISC4.filter((c) => im.subtestes[c]).map((c) => (
          <tr key={c} className="border-t border-mist/60">
            <td className="px-3 py-2">{c.toUpperCase()} — {nome(c)}</td>
            <td className="px-3 py-2 text-right font-semibold tabular-nums">{im.subtestes[c].sinal} {im.subtestes[c].texto}</td>
            <td className="px-3 py-2 text-right tabular-nums text-ink/60">{im.subtestes[c].meses}</td>
          </tr>
        ))}
      </Tabela>
      <p className="text-[11px] text-ink/45">"&lt;" e "&gt;" indicam bruto nos extremos da tabela (idade equivalente apenas aproximada). A idade de cada índice é a média dos seus subtestes; a idade mental estimada é a média de todos os subtestes lançados.</p>
    </div>
  );
}
