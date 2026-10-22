import { useEffect, useMemo, useState } from "react";
import { api, type AplicacaoDeTeste, type ResultadoCalculado, type Teste } from "../lib/api";
import { COR_CLASSIFICACAO } from "../lib/wechsler";
import { faltamCampos } from "../lib/plural";
import { PlaceholderBadge } from "./PlaceholderBadge";
import { CabecalhoEstudio } from "./CabecalhoEstudio";
import { Tabela, Titulo, Vazio } from "./TesteWiscIV";
import { GraficosPlanilha, type GraficoDef } from "./GraficosPlanilha";

// Tela genérica dos testes do "motor de planilha": o servidor roda as fórmulas da planilha da psicóloga e esta tela só
// mostra as entradas (por grupo), as opções (ex.: tabela normativa) e as tabelas de resultado descritas no layout do teste.
interface Layout {
  entradas: Array<{ chave: string; rotulo: string; grupo?: string; min?: number; max?: number; letras?: string[]; modo?: "totais"; porta?: string }>;
  cabecalhos?: Record<string, string>; // letra da coluna da planilha → nome (ex.: informante)
  graficos?: GraficoDef[]; // gráficos do Excel
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

type Entrada = Layout["entradas"][number];
// Linha da tela: várias células da planilha com o MESMO rótulo e na MESMA linha (ex.: o mesmo item respondido por 3 informantes) viram uma linha com um campo por célula.
interface Linha { rotulo: string; campos: Entrada[] }
const linhaDaChave = (chave: string) => /(\d+)$/.exec(chave)?.[1] ?? chave;

function agruparLinhas(itens: Entrada[]): Linha[] {
  const out: Linha[] = [];
  for (const e of itens) {
    const ult = out[out.length - 1];
    if (ult && ult.rotulo === e.rotulo && linhaDaChave(ult.campos[0].chave) === linhaDaChave(e.chave)) ult.campos.push(e);
    else out.push({ rotulo: e.rotulo, campos: [e] });
  }
  return out;
}

// Rótulos numerados ("001. …", "A) …") viram o título do bloco: do primeiro ao último item.
function tituloDoBloco(linhas: Linha[], n: number) {
  const num = (r: string) => /^\s*(?:Item\s+)?(\d{1,3})(?:[.)]|\s|$)/.exec(r)?.[1];
  const a = num(linhas[0].rotulo), b = num(linhas[linhas.length - 1].rotulo);
  return a && b && a !== b ? "Itens " + a + " a " + b : "Bloco " + n;
}

const POR_BLOCO = 30;

// coluna de resultado sem nenhum valor (ex.: informante que não respondeu) não aparece
const colunaTemValor = (t: Layout["tabelas"][number], i: number, saidas: Record<string, unknown>) => t.linhas.some((l) => { const k = l.valores[i]; return !!k && formatar(saidas[k] as string | number | null) !== ""; });

export function TestePlanilha({ teste, aplicacao, escoresBrutos, onEscoresChange, onSalvar, sessaoId, testeId, erro, salvando = false }: Props) {
  const layout = (teste.algoritmoCorrecao as unknown as { layout?: Layout }).layout;
  const campos = teste.algoritmoCorrecao.campos ?? [];
  const lancados = campos.filter((c) => (escoresBrutos[c.chave] ?? "").trim() !== "");
  type Info = Awaited<ReturnType<typeof api.calcularAplicacao>>;
  const [calc, setCalc] = useState<{ resultado: ResultadoCalculado | null; info?: Info; carregando: boolean; erro?: string }>({ resultado: null, carregando: false });

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
  const chavesTotais = new Set((layout?.entradas ?? []).filter((e) => e.modo === "totais").map((e) => e.chave));
  const temTotais = (layout?.entradas ?? []).some((e) => e.modo === "totais");
  const [modoEntrada, setModoEntrada] = useState<"itens" | "totais">(() => {
    // abre direto nos totais quando o lançamento salvo só tem totais
    const t = (layout?.entradas ?? []).filter((e) => e.modo === "totais"), i = (layout?.entradas ?? []).filter((e) => e.modo !== "totais");
    const f = (es: typeof t) => es.some((e) => (escoresBrutos[e.chave] ?? "").trim() !== "");
    return f(t) && !f(i) ? "totais" : "itens";
  });
  const grupos = useMemo(() => {
    const m = new Map<string, NonNullable<Layout["entradas"]>>();
    for (const e of (layout?.entradas ?? []).filter((x) => (x.modo === "totais") === (modoEntrada === "totais"))) m.set(e.grupo ?? "Escores brutos", [...(m.get(e.grupo ?? "Escores brutos") ?? []), e]);
    return [...m.entries()];
  }, [layout, modoEntrada]);
  // conta só os campos do modo de lançamento ativo (com totais separados, o outro modo não é "pendência")
  const camposAtivos = campos.filter((c) => chavesTotais.size === 0 || chavesTotais.has(c.chave) === (modoEntrada === "totais"));
  const lancadosAtivos = camposAtivos.filter((c) => (escoresBrutos[c.chave] ?? "").trim() !== "");

  if (!layout) return <Vazio>Este teste ainda não tem o layout do motor de planilha. Reaplique a atualização do catálogo.</Vazio>;

  return (
    <div className="@container flex flex-col gap-4">
      <CabecalhoEstudio
        sigla={teste.sigla} nome={aplicacao?.teste.nome || teste.nome} dominio={teste.dominio}
        paciente={calc.info?.paciente.nome} idade={calc.info?.idadeTexto} data={calc.info ? new Date(calc.info.dataAplicacao).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : undefined}
        lancados={lancadosAtivos.length} total={camposAtivos.length} calculando={calc.carregando} salvando={salvando} podeSalvar={lancados.length > 0} onSalvar={onSalvar}
      />
      {teste.isPlaceholder && <div><PlaceholderBadge /></div>}
      {erro && <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
      {calc.erro && !erro && <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{calc.erro}</div>}
      {!sessaoId && <div className="rounded-lg border border-mist bg-paper px-4 py-3 text-sm text-ink/70">Escolha o paciente e a sessão para ver os resultados enquanto você digita: a idade dele define as normas.</div>}


      <div className="grid items-start gap-5 @5xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="min-w-0">
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
        {temTotais && (
          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-ink/50">Como lançar:</span>
            <div className="inline-flex rounded-full border border-mist p-0.5 font-semibold">
              {([["itens", "Item a item"], ["totais", "Só os totais"]] as const).map(([v, rot]) => (
                <button key={v} onClick={() => setModoEntrada(v)} className={`rounded-full px-3 py-1 transition-colors ${modoEntrada === v ? "bg-ink text-paper" : "text-ink/60"}`}>{rot}</button>
              ))}
            </div>
            <span className="text-ink/50">{modoEntrada === "totais" ? "Os totais digitados valem no lugar do cálculo pelos itens." : "Os totais são calculados pelos itens."}</span>
          </div>
        )}
        <div className="space-y-5">
          {grupos.map(([grupo, itens]) => (
            <section key={grupo}>
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink/45">{grupo}</div>
              <BlocosDeCampos itens={itens} semSecoes={grupo !== "Escores brutos"} cabecalhos={layout.cabecalhos} valores={escoresBrutos} onChange={(chave, v) => onEscoresChange({ ...escoresBrutos, [chave]: v })} />
            </section>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-mist pt-4">
          <button className="rounded-lg bg-sage-deep px-5 py-2.5 text-sm font-semibold text-paper transition-opacity disabled:opacity-40" onClick={onSalvar} disabled={salvando || lancados.length === 0}>{salvando ? "Salvando…" : "Salvar lançamento"}</button>
          {lancadosAtivos.length > 0 && lancadosAtivos.length < camposAtivos.length && <span className="text-xs text-ink/55">{faltamCampos(camposAtivos.length - lancadosAtivos.length)} — o que ficar vazio não entra no cálculo.</span>}
        </div>
      </div>


        </div>
        <aside className="space-y-4 [&_table]:text-xs [&_td]:px-2 [&_th]:px-2 @5xl:sticky @5xl:top-20 @5xl:max-h-[calc(100vh-6rem)] @5xl:overflow-y-auto @5xl:pr-1">
          <div className="flex items-center gap-2 rounded-2xl border border-sage/30 bg-sage/5 px-4 py-2.5 text-sm font-semibold text-sage-deep">
            <span className={`h-2.5 w-2.5 rounded-full ${calc.carregando ? "animate-pulse bg-[#e0a21a]" : "bg-[#3f9b5b]"}`} />
            Resultados ao vivo
            <span className="ml-auto text-xs font-normal text-ink/50">{calc.carregando ? "atualizando…" : lancados.length ? "atualizado" : "aguardando os primeiros dados"}</span>
          </div>
      <PerfilResultados layout={layout} saidas={saidas} />
      {(layout.graficos?.length ?? 0) > 0 && (
        <div className="rounded-2xl border border-mist bg-white p-4">
          <Titulo>Gráficos ao vivo</Titulo>
          <GraficosPlanilha graficos={layout.graficos!} saidas={saidas} />
        </div>
      )}

      {Object.values(saidas).some((v) => v !== null) && (
        <div className="wais-entra space-y-6 rounded-2xl border border-mist bg-white p-5">
          {layout.tabelas.map((t) => (
            <section key={t.titulo}>
              <Titulo>{t.titulo}</Titulo>
              <Tabela cabecalho={["", ...t.colunas.filter((_, i) => colunaTemValor(t, i, saidas))]}>
                {t.linhas.filter((l) => l.valores.some((k) => k && formatar(saidas[k]) !== "")).map((l) => (
                  <tr key={l.valores.join("|") + l.rotulo} className="border-t border-mist/60">
                    <td className="px-3 py-2 text-left text-ink/70">{l.rotulo.startsWith("=") ? formatar(saidas[l.rotulo.slice(1)]) : l.rotulo}</td>
                    {l.valores.map((chave, i) => {
                      if (!colunaTemValor(t, i, saidas)) return null;
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


          {!Object.values(saidas).some((v) => v !== null) && (layout.graficos?.length ?? 0) === 0 && <div className="rounded-2xl border border-dashed border-sage/40 bg-white px-4 py-10 text-center text-sm text-ink/55">As tabelas de resultado aparecem aqui conforme você lança os dados.</div>}
        </aside>
      </div>
    </div>
  );
}

function CampoNumero({ e, valor, onChange, rotulo }: { e: Entrada; valor: string; onChange: (v: string) => void; rotulo?: string }) {
  if (e.letras) {
    // resposta por letra (ex.: N/A/F): o valor guardado é o número da letra (1, 2, 3)
    return (
      <select aria-label={rotulo ?? e.rotulo} title={rotulo ?? e.rotulo} className="w-16 rounded-lg border border-mist bg-paper px-1.5 py-1 text-center text-sm outline-none focus:border-sage-deep" value={valor} onChange={(ev) => onChange(ev.target.value)}>
        <option value="">—</option>
        {e.letras.map((l, i) => <option key={l} value={String(i + 1)}>{l}</option>)}
      </select>
    );
  }
  return <input type="number" step="any" inputMode="decimal" min={e.min ?? 0} max={e.max} aria-label={rotulo ?? e.rotulo} title={rotulo ?? e.rotulo} className="w-16 rounded-lg border border-mist bg-paper px-2 py-1 text-right text-sm tabular-nums outline-none focus:border-sage-deep" value={valor} onChange={(ev) => onChange(ev.target.value)} placeholder="—" />;
}

// Campos de um grupo: poucos (≤ POR_BLOCO linhas) ficam em grade; muitos viram blocos recolhíveis que abrem sozinhos quando têm algo lançado.
function BlocosDeCampos({ itens, valores, onChange, cabecalhos, semSecoes }: { itens: Entrada[]; valores: Record<string, string>; onChange: (chave: string, v: string) => void; cabecalhos?: Record<string, string>; semSecoes?: boolean }) {
  // Formulários diferentes na mesma aba (ex.: CBCL / autorrelato / professor) ocupam colunas diferentes da planilha: cada conjunto de colunas vira uma seção própria.
  const secoes = useMemo(() => {
    const num = (c: string) => [...c].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
    const colDe = (e: Entrada) => /^in_([A-Z]+)\d+$/.exec(e.chave)?.[1];
    const cols = [...new Set(itens.map(colDe).filter((c): c is string => !!c).map(num))].sort((x, y) => x - y);
    // colunas vizinhas (ex.: E, F, G) pertencem ao mesmo formulário; um salto de coluna abre outro
    const faixa = new Map<number, number>();
    cols.forEach((c, i) => faixa.set(c, i > 0 && c - cols[i - 1] <= 1 ? faixa.get(cols[i - 1])! : c));
    const m = new Map<number, Entrada[]>();
    for (const e of itens) {
      const c = colDe(e);
      const k = c ? faixa.get(num(c)) ?? 0 : 0;
      m.set(k, [...(m.get(k) ?? []), e]);
    }
    return [...m.values()];
  }, [itens]);
  if (!semSecoes && secoes.length > 1 && secoes.every((es) => es.length > 3)) {
    return (
      <div className="space-y-4">
        {secoes.map((es, i) => (
          <div key={es[0].chave}>
            <div className="mb-1 text-xs font-semibold text-ink/60">Formulário {i + 1}</div>
            <LinhasEmBlocos itens={es} valores={valores} onChange={onChange} cabecalhos={cabecalhos} />
          </div>
        ))}
      </div>
    );
  }
  return <LinhasEmBlocos itens={itens} valores={valores} onChange={onChange} cabecalhos={cabecalhos} />;
}

function LinhasEmBlocos({ itens, valores, onChange, cabecalhos }: { itens: Entrada[]; valores: Record<string, string>; onChange: (chave: string, v: string) => void; cabecalhos?: Record<string, string> }) {
  const linhas = useMemo(() => agruparLinhas(itens), [itens]);
  const largura = Math.max(...linhas.map((l) => l.campos.length));
  const colunaDe = (e: Entrada) => /^in_([A-Z]+)\d+$/.exec(e.chave)?.[1] ?? "";
  const nomes = cabecalhos && largura > 1 ? linhas.find((l) => l.campos.length === largura)?.campos.map((e) => cabecalhos[colunaDe(e)] ?? "") : undefined;
  const desenha = (ls: Linha[]) => (
    <div className={largura > 1 ? "divide-y divide-mist/70 rounded-xl border border-mist" : "grid gap-2 sm:grid-cols-2 lg:grid-cols-3"}>
      {nomes && (
        <div className="flex items-end gap-3 bg-paper px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink/50">
          <span className="flex-1">Item</span>
          <span className="flex shrink-0 gap-1.5">{nomes.map((n, i) => <span key={i} className="w-16 break-words text-center text-[9px] normal-case leading-tight tracking-normal">{n}</span>)}</span>
        </div>
      )}
      {ls.map((l) => (
        <div key={l.campos[0].chave} className={largura > 1 ? "flex items-center gap-3 px-3 py-1.5 focus-within:bg-sage-deep/5" : "flex items-center gap-2 rounded-xl border border-mist px-3 py-2 focus-within:border-sage-deep focus-within:ring-2 focus-within:ring-sage-deep/15"}>
          <span className="min-w-0 flex-1 text-sm leading-snug text-ink/80">{l.rotulo}</span>
          <span className="flex shrink-0 gap-1.5">
            {l.campos.map((e, i) => <CampoNumero key={e.chave} e={e} valor={valores[e.chave] ?? ""} onChange={(v) => onChange(e.chave, v)} rotulo={l.campos.length > 1 ? l.rotulo + " (campo " + (i + 1) + ")" : l.rotulo} />)}
          </span>
        </div>
      ))}
    </div>
  );
  if (linhas.length <= POR_BLOCO) return desenha(linhas);
  const blocos: Linha[][] = [];
  for (let i = 0; i < linhas.length; i += POR_BLOCO) blocos.push(linhas.slice(i, i + POR_BLOCO));
  return (
    <div className="space-y-2">
      {blocos.map((b, n) => {
        const preenchidos = b.reduce((s, l) => s + l.campos.filter((e) => (valores[e.chave] ?? "").trim() !== "").length, 0);
        return (
          <details key={b[0].campos[0].chave} open={preenchidos > 0 && preenchidos < b.length * b[0].campos.length} className="group rounded-xl border border-mist">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-ink/80 hover:bg-paper">
              <span>{tituloDoBloco(b, n + 1)}</span>
              <span className="text-xs font-normal tabular-nums text-ink/50">{preenchidos} lançado(s)</span>
            </summary>
            <div className="p-2">{desenha(b)}</div>
          </details>
        );
      })}
    </div>
  );
}

// Perfil automático: barras de percentil, z-padrão ou pontos ponderados de cada medida do teste, desenhadas ao vivo.
// Vale para qualquer teste do motor de planilha, mesmo quando o Excel original não tinha gráfico.
const MEDIDAS = [
  { re: /percentil/i, nome: "Percentil", min: 0, max: 100, marcas: [25, 50, 75] },
  { re: /z-?padr|padroniz/i, nome: "Escore padrão (z-padrão)", min: 40, max: 160, marcas: [85, 100, 115] },
  { re: /ponderad/i, nome: "Pontos ponderados", min: 1, max: 19, marcas: [7, 10, 13] },
];
const numeroDe = (v: unknown): number | null => {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return null;
  const n = Number(v.replace(/[<>≥≤\s]/g, "").replace(",", "."));
  return v.trim() !== "" && Number.isFinite(n) ? n : null;
};

function PerfilResultados({ layout, saidas }: { layout: Layout; saidas: Record<string, string | number | boolean | null> }) {
  const alvo = useMemo(() => {
    for (const tab of layout.tabelas) {
      for (const m of MEDIDAS) {
        const linha = tab.linhas.find((l) => m.re.test(l.rotulo));
        if (!linha) continue;
        const classif = tab.linhas.find((l) => /classifica/i.test(l.rotulo));
        const colunas = tab.colunas.map((nome, i) => ({ nome, chave: linha.valores[i] ?? null, classe: classif?.valores[i] ?? null })).filter((c) => c.chave);
        if (colunas.length >= 1 && colunas.length <= 16) return { titulo: tab.titulo, medida: m, colunas };
      }
    }
    return null;
  }, [layout]);
  if (!alvo) return null;
  const { medida, colunas } = alvo;
  const itens = colunas.map((c) => ({ ...c, v: numeroDe(c.chave ? saidas[c.chave] : null), rotuloClasse: c.classe && typeof saidas[c.classe] === "string" ? (saidas[c.classe] as string) : null }));
  const temDado = itens.some((i) => i.v !== null);
  const pos = (v: number) => Math.max(0, Math.min(100, ((v - medida.min) / (medida.max - medida.min)) * 100));
  return (
    <div className={`grafico-vivo rounded-2xl border bg-white p-4 ${temDado ? "border-mist" : "border-dashed border-sage/40"}`}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-[11px] font-bold uppercase tracking-wide text-sage-deep">Perfil · {medida.nome}</div>
        <div className="text-[10px] text-ink/45">{alvo.titulo}</div>
      </div>
      <ul className="space-y-2">
        {itens.map((i) => {
          const cor = i.rotuloClasse ? COR_CLASSIFICACAO[i.rotuloClasse] : undefined;
          return (
            <li key={i.nome + i.chave} className="grid grid-cols-[minmax(3.5rem,6rem)_1fr_3.2rem] items-center gap-2 text-xs">
              <span className="truncate font-semibold text-ink/70" title={i.nome}>{i.nome}</span>
              <span className="relative h-3.5 overflow-hidden rounded-full bg-mist/70">
                {medida.marcas.map((m) => <span key={m} className="absolute inset-y-0 w-px bg-ink/15" style={{ left: `${pos(m)}%` }} />)}
                {i.v !== null && <span className="absolute inset-y-0 left-0 rounded-full transition-all duration-700" style={{ width: `${pos(i.v)}%`, background: cor ?? "linear-gradient(90deg,#e66a1f,#c25716)" }} />}
              </span>
              <span className="text-right font-bold tabular-nums text-ink">{i.v !== null ? formatar(i.v) : <span className="font-normal text-ink/30">—</span>}</span>
            </li>
          );
        })}
      </ul>
      {!temDado && <p className="mt-3 text-center text-xs text-sage-deep">As barras são preenchidas conforme você lança os dados.</p>}
      {temDado && <p className="mt-3 text-[10px] text-ink/40">Traços: {medida.marcas.join(" · ")}. Cores seguem a classificação quando o teste a calcula.</p>}
    </div>
  );
}
