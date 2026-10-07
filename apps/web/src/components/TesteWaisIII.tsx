import { useEffect, useMemo, useState } from "react";
import { api, type AplicacaoDeTeste, type ResultadoCalculado, type Teste } from "../lib/api";
import { faltamCampos } from "../lib/plural";
import {
  COR_CLASSIFICACAO,
  ESCALA_EXECUCAO,
  ESCALA_VERBAL,
  faixaEtariaWais3,
  faltaParaIndice,
  GRUPOS_WAIS3,
  lerExtras,
  lerIndice,
  lerPonderados,
  ROTULO_INDICE,
  type IndiceLido,
  zonaDoPonderado,
} from "../lib/wechsler";
import { ClustersWais3 } from "./ClustersWais3";
import { ComparacaoDiscrepancias, DeterminacaoSubtestes } from "./DeterminacaoEDiscrepancias";
import { HabilidadesWais3 } from "./HabilidadesWais3";
import { ProcessoWais3 } from "./ProcessoWais3";
import { EscalaIndices, type LinhaIndice } from "./graficos/EscalaIndices";
import { GraficoFDIndividual, GraficoFDNormativa, PerfilCompostos } from "./graficos/FacilidadeDificuldade";
import { PerfilPonderados } from "./graficos/PerfilPonderados";
import { PlaceholderBadge } from "./PlaceholderBadge";

interface TesteWaisIIIProps {
  teste: Teste;
  aplicacao?: AplicacaoDeTeste | null;
  escoresBrutos: Record<string, string>;
  onEscoresChange: (escores: Record<string, string>) => void;
  onSalvar: () => Promise<void>;
  // Necessários para calcular ao vivo (a idade do paciente vem da sessão).
  sessaoId?: string;
  testeId?: string;
  erro?: string | null;
  salvando?: boolean;
  abaInicial?: AbaAtiva;
}

type AbaAtiva = "brutos" | "ponderados" | "indices" | "facilidades" | "intraindividual" | "clusters" | "processo" | "habilidades";

const ABAS: Array<{ id: AbaAtiva; label: string }> = [
  { id: "brutos", label: "1. Brutos" },
  { id: "ponderados", label: "2. Ponderados" },
  { id: "indices", label: "3. Índices e QIs" },
  { id: "facilidades", label: "4. Facilidades" },
  { id: "intraindividual", label: "5. Intraindividual" },
  { id: "clusters", label: "6. Clusters" },
  { id: "processo", label: "7. Processo" },
  { id: "habilidades", label: "8. Habilidades" },
];

const SUBSTITUTOS: Record<string, string> = {
  sequenciaNumerosLetras: "entra no QI Verbal só se Dígitos faltar",
  procurarSimbolos: "entra no QI de Execução só se Códigos faltar",
  armarObjetos: "substitui UM subteste de Execução que falte",
};

const TODOS_SUBTESTES = [...ESCALA_VERBAL, ...ESCALA_EXECUCAO];

export function TesteWaisIII({ teste, aplicacao, escoresBrutos, onEscoresChange, onSalvar, sessaoId, testeId, erro, salvando = false, abaInicial }: TesteWaisIIIProps) {
  const campos = teste?.algoritmoCorrecao.campos ?? [];
  const rotulos = useMemo(() => Object.fromEntries(campos.map((c) => [c.chave, c.label])), [campos]);
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>(abaInicial ?? "brutos");
  const [nivelIC, setNivelIC] = useState<"ic90" | "ic95">("ic95");
  type InfoCalculo = Awaited<ReturnType<typeof api.calcularAplicacao>>;
  const [calc, setCalc] = useState<{ resultado: ResultadoCalculado | null; idadeAnos?: number; idadeDias?: number; info?: InfoCalculo; carregando: boolean; erro?: string }>({
    resultado: null,
    carregando: false,
  });

  const lancados = campos.filter((c) => (escoresBrutos[c.chave] ?? "").trim() !== "");

  // Cálculo ao vivo (com atraso, para não chamar a API a cada tecla).
  useEffect(() => {
    const numeros: Record<string, number> = {};
    for (const [k, v] of Object.entries(escoresBrutos)) {
      if (v !== undefined && v.trim() !== "" && !Number.isNaN(Number(v))) numeros[k] = Number(v);
    }
    if (!sessaoId || !testeId || Object.keys(numeros).length === 0) {
      setCalc((c) => ({ ...c, resultado: null, carregando: false, erro: undefined }));
      return;
    }
    let cancelado = false;
    setCalc((c) => ({ ...c, carregando: true }));
    const t = setTimeout(() => {
      api
        .calcularAplicacao({ sessaoId, testeId, escoresBrutos: numeros })
        .then((r) => !cancelado && setCalc({ resultado: r.resultadoCalculado, idadeAnos: r.idadeAnos, idadeDias: r.idadeDias, info: r, carregando: false }))
        .catch((e) => !cancelado && setCalc((c) => ({ ...c, carregando: false, erro: (e as Error).message })));
    }, 350);
    return () => {
      cancelado = true;
      clearTimeout(t);
    };
  }, [escoresBrutos, sessaoId, testeId]);

  const resultado = calc.resultado ?? (lancados.length > 0 ? aplicacao?.resultadoCalculado ?? null : null);
  const ponderados = useMemo(() => lerPonderados(resultado, TODOS_SUBTESTES), [resultado]);
  const conjuntoLancados = useMemo(() => new Set(Object.entries(ponderados).filter(([, v]) => v.ponderado !== null).map(([k]) => k)), [ponderados]);
  const nomeCurto = (c: string) => (rotulos[c] ?? c).split(" — ")[0];

  const linhas = (itens: Array<[string, string, string]>): LinhaIndice[] =>
    itens.map(([chave, sigla, rotulo]) => ({
      ...lerIndice(resultado, chave),
      sigla,
      rotulo,
      falta: faltaParaIndice(chave, conjuntoLancados, nomeCurto),
    }));

  const todosIndices = useMemo(
    () => Object.fromEntries(["icv", "iop", "imo", "ivp", "qiv", "qie", "gai", "qit"].map((k) => [k, lerIndice(resultado, k)])) as Record<string, IndiceLido>,
    [resultado]
  );
  const extras = useMemo(() => lerExtras(resultado), [resultado]);
  const temIndices = Object.values(todosIndices).some((i) => i.composto !== null);
  const idadeAnos = calc.idadeAnos;
  const faixa = idadeAnos !== undefined ? faixaEtariaWais3(idadeAnos) : null;
  const pctLancado = Math.round((lancados.length / Math.max(1, campos.length)) * 100);

  return (
    <div className="flex flex-col gap-4">
      {/* Cabeçalho */}
      <div className="rounded-2xl border border-mist bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-ink">{teste.sigla}</h2>
            <p className="mt-1 text-xs text-ink/60">
              {aplicacao?.teste.nome || teste.nome}
              {aplicacao && ` · Respondente: ${aplicacao.respondenteTipo}`}
            </p>
          </div>
          {teste.isPlaceholder && <PlaceholderBadge />}
        </div>
        {calc.info && (
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-xl bg-paper px-4 py-3 text-xs sm:grid-cols-3">
            {[
              ["Nome", calc.info.paciente.nome],
              ["Escolaridade", calc.info.paciente.escolaridade || "—"],
              ["Sexo", calc.info.paciente.sexo === "MASCULINO" ? "Masculino" : calc.info.paciente.sexo === "FEMININO" ? "Feminino" : "—"],
              ["Data de aplicação", new Date(calc.info.dataAplicacao).toLocaleDateString("pt-BR", { timeZone: "UTC" })],
              ["Data de nascimento", new Date(calc.info.paciente.dataNascimento).toLocaleDateString("pt-BR", { timeZone: "UTC" })],
              ["Idade cronológica", calc.info.idadeTexto],
            ].map(([rotulo, valor]) => (
              <div key={rotulo} className="flex gap-2">
                <dt className="text-ink/50">{rotulo}:</dt>
                <dd className="font-semibold text-ink">{valor}</dd>
              </div>
            ))}
            <div className="col-span-2 flex gap-2 sm:col-span-3">
              <dt className="text-ink/50">Norma usada:</dt>
              <dd className="font-semibold text-ink">{faixa ? `faixa etária ${faixa} anos` : "fora da faixa normativa (16 a 89 anos) — sem cálculo"}</dd>
            </div>
          </dl>
        )}
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-mist">
            <div className="h-full rounded-full bg-sage-deep transition-all duration-500" style={{ width: `${pctLancado}%` }} />
          </div>
          <span className="text-xs tabular-nums text-ink/60">
            {lancados.length} de {campos.length} subtestes
          </span>
          {calc.carregando && <span className="text-xs text-ink/40">calculando…</span>}
        </div>
      </div>

      {erro && <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
      {calc.erro && !erro && <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{calc.erro}</div>}
      {!sessaoId && (
        <div className="rounded-lg border border-mist bg-paper px-4 py-3 text-sm text-ink/70">
          Escolha o paciente e a sessão para ver os resultados enquanto você digita: a idade dele define as normas.
        </div>
      )}

      {/* Abas */}
      <div className="flex gap-1 overflow-x-auto border-b border-mist">
        {ABAS.map((aba) => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
              abaAtiva === aba.id ? "border-sage-deep text-sage-deep" : "border-transparent text-ink/55 hover:text-ink/80"
            }`}
          >
            {aba.label}
          </button>
        ))}
      </div>

      <div key={abaAtiva} className="wais-entra rounded-2xl border border-mist bg-white p-5">
        {/* 1. Escores brutos */}
        {abaAtiva === "brutos" && (
          <div className="space-y-6">
            <p className="text-sm text-ink/65">
              Digite o escore bruto de cada subteste aplicado. Não precisa preencher todos: cada índice aparece quando os subtestes dele estiverem lançados.
            </p>
            {[
              { titulo: "Escala Verbal", chaves: ESCALA_VERBAL },
              { titulo: "Escala de Execução", chaves: ESCALA_EXECUCAO },
            ].map((escala) => (
              <section key={escala.titulo}>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">{escala.titulo}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {escala.chaves.map((chave) => {
                    const p = ponderados[chave];
                    const zona = p?.ponderado != null ? zonaDoPonderado(p.ponderado) : null;
                    return (
                      <label key={chave} className="flex items-center gap-3 rounded-xl border border-mist px-3 py-2.5 focus-within:border-sage-deep focus-within:ring-2 focus-within:ring-sage-deep/15">
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-ink">{nomeCurto(chave)}</span>
                          {SUBSTITUTOS[chave] && <span className="block text-[11px] leading-tight text-ink/45">{SUBSTITUTOS[chave]}</span>}
                        </span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          className="w-20 rounded-lg border border-mist bg-paper px-2 py-1.5 text-right text-sm tabular-nums outline-none focus:border-sage-deep"
                          value={escoresBrutos[chave] ?? ""}
                          onChange={(e) => onEscoresChange({ ...escoresBrutos, [chave]: e.target.value })}
                          placeholder="—"
                        />
                        <span className="w-14 text-right">
                          {zona && p?.ponderado != null ? (
                            <span key={p.ponderado} className="wais-entra inline-block rounded-full px-2 py-0.5 text-xs font-bold text-white tabular-nums" style={{ background: zona.traco }} title={`Ponderado ${p.ponderado} · ${zona.rotulo}`}>
                              {p.ponderado}
                            </span>
                          ) : p && p.ponderado === null ? (
                            <span className="text-[10px] text-ember">sem norma</span>
                          ) : (
                            <span className="text-xs text-ink/25">pond.</span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>
            ))}

            <div className="flex flex-wrap items-center gap-3 border-t border-mist pt-4">
              <button
                className="rounded-lg bg-sage-deep px-5 py-2.5 text-sm font-semibold text-paper transition-opacity disabled:opacity-40"
                onClick={onSalvar}
                disabled={salvando || lancados.length === 0}
              >
                {salvando ? "Salvando…" : "Salvar lançamento"}
              </button>
              {lancados.length > 0 && lancados.length < campos.length && (
                <span className="text-xs text-ink/55">{faltamCampos(campos.length - lancados.length)} — o que ficar vazio simplesmente não entra no cálculo.</span>
              )}
            </div>
          </div>
        )}

        {/* 2. Ponderados */}
        {abaAtiva === "ponderados" && (
          <div className="space-y-5">
            <p className="text-sm text-ink/65">
              Cada escore bruto convertido em ponto ponderado (1 a 19) pela norma da faixa etária do paciente. A faixa verde é a classificação "Média" da planilha (8 a 11).
            </p>
            {Object.keys(ponderados).length === 0 ? (
              <EstadoVazio>Lance ao menos um subteste na aba 1 para ver o perfil.</EstadoVazio>
            ) : (
              <>
                <PerfilPonderados ponderados={ponderados} rotulos={Object.fromEntries(Object.entries(rotulos).map(([k, v]) => [k, v.split(" — ")[0]]))} />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-mist text-left text-[11px] uppercase tracking-wide text-ink/50">
                        <th className="py-2 font-semibold">Subteste</th>
                        <th className="py-2 text-right font-semibold">Bruto</th>
                        <th className="py-2 text-right font-semibold">Ponderado</th>
                        <th className="py-2 text-right font-semibold">Z-score</th>
                        <th className="py-2 text-right font-semibold">Pts composto</th>
                        <th className="py-2 text-right font-semibold">Percentil</th>
                        <th className="py-2 pl-4 font-semibold">Classificação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {GRUPOS_WAIS3.flatMap((g) => g.subtestes).map((s) => {
                        const v = ponderados[s.chave];
                        if (!v) return null;
                        const z = v.ponderado != null ? zonaDoPonderado(v.ponderado) : null;
                        return (
                          <tr key={s.chave} className="border-b border-mist/60">
                            <td className="py-2">{nomeCurto(s.chave)}</td>
                            <td className="py-2 text-right tabular-nums">{v.bruto}</td>
                            <td className="py-2 text-right font-semibold tabular-nums">{v.ponderado ?? "—"}</td>
                            <td className="py-2 text-right tabular-nums text-ink/70">{v.z !== null ? v.z.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : "—"}</td>
                            <td className="py-2 text-right tabular-nums text-ink/70">{v.pontoComposto !== null ? v.pontoComposto.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "—"}</td>
                            <td className="py-2 text-right tabular-nums text-ink/70">{v.percentil !== null ? v.percentil.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "—"}</td>
                            <td className="py-2 pl-4">
                              {z ? (
                                <span className="inline-flex items-center gap-2 text-xs">
                                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: z.traco }} />
                                  {v.classificacao ?? z.rotulo}
                                </span>
                              ) : (
                                <span className="text-xs text-ember">sem norma para este valor/idade</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <ResumoSomas resultado={resultado} />
              </>
            )}
          </div>
        )}

        {/* 3. Índices e QIs */}
        {abaAtiva === "indices" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-xl text-sm text-ink/65">
                Soma dos ponderados convertida em ponto composto (média 100). A barra colorida é o intervalo de confiança; o ponto é o resultado.
              </p>
              <SeletorIC valor={nivelIC} onChange={setNivelIC} />
            </div>
            {Object.keys(ponderados).length === 0 ? (
              <EstadoVazio>Lance os subtestes na aba 1 para calcular os índices.</EstadoVazio>
            ) : (
              <>
                <EscalaIndices
                  titulo="Índices fatoriais"
                  nivelIC={nivelIC}
                  linhas={linhas([
                    ["icv", "ICV", "Compreensão Verbal"],
                    ["iop", "IOP", "Organização Perceptual"],
                    ["imo", "IMO", "Memória Operacional"],
                    ["ivp", "IVP", "Velocidade de Processamento"],
                  ])}
                />
                <EscalaIndices
                  titulo="Escalas e QIs"
                  nivelIC={nivelIC}
                  linhas={linhas([
                    ["qiv", "QI Verbal", "Escala Verbal"],
                    ["qie", "QI Execução", "Escala de Execução"],
                    ["qit", "QI Total", "Quociente Intelectual Total"],
                    ["gai", "GAI", "Índice de Habilidades Gerais"],
                  ])}
                />
                <AnaliseAvancada indices={todosIndices} />
                <p className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink/50">
                  {Object.entries(COR_CLASSIFICACAO).map(([nome, cor]) => (
                    <span key={nome} className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: cor }} />
                      {nome}
                    </span>
                  ))}
                </p>
              </>
            )}
          </div>
        )}

        {/* 4. Facilidades e dificuldades */}
        {abaAtiva === "facilidades" && (
          <div className="space-y-8">
            {!temIndices ? (
              <EstadoVazio>Lance os subtestes na aba 1 para ver as facilidades e dificuldades.</EstadoVazio>
            ) : (
              <>
                <section>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wide text-sage-deep">Facilidade × dificuldade (normativa)</h3>
                      <p className="mt-1 max-w-xl text-sm text-ink/65">Cada índice contra a norma: acima de 115 é facilidade; abaixo de 85, dificuldade. A barra preta é o intervalo de confiança.</p>
                    </div>
                    <SeletorIC valor={nivelIC} onChange={setNivelIC} />
                  </div>
                  <GraficoFDNormativa indices={todosIndices} nivelIC={nivelIC} />
                </section>
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-sage-deep">Facilidade × dificuldade (individual)</h3>
                  <p className="mb-2 mt-1 max-w-2xl text-sm text-ink/65">
                    Cada índice contra a média dos 4 índices da própria pessoa. A barra é a diferença; o retângulo cinza é a zona sem diferença significativa (valor crítico); as faixas mostram onde a diferença é rara.
                    Só entram os índices interpretáveis (subtestes com diferença menor que 5 pontos ponderados).
                  </p>
                  <GraficoFDIndividual indices={todosIndices} />
                </section>
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-sage-deep">Perfil dos pontos compostos</h3>
                  <PerfilCompostos indices={todosIndices} />
                </section>
                {extras.determinacao && <DeterminacaoSubtestes determinacao={extras.determinacao} nivel={nivelIC === "ic95" ? "n05" : "n15"} nomeSubteste={nomeCurto} />}
              </>
            )}
          </div>
        )}

        {/* 5. Análise intraindividual: comparação entre discrepâncias */}
        {abaAtiva === "intraindividual" && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <SeletorIC valor={nivelIC} onChange={setNivelIC} />
            </div>
            {extras.discrepancias ? (
              <ComparacaoDiscrepancias discrepancias={extras.discrepancias} nivel={nivelIC === "ic95" ? "0.05" : "0.15"} />
            ) : (
              <EstadoVazio>Lance os subtestes na aba 1 até os índices serem calculados para comparar as discrepâncias.</EstadoVazio>
            )}
          </div>
        )}

        {/* 6. Clusters */}
        {abaAtiva === "clusters" && (
          <div>
            {extras.clusters ? (
              <ClustersWais3 analise={extras.clusters} />
            ) : (
              <EstadoVazio>Lance os subtestes na aba 1: cada cluster é calculado quando todos os subtestes dele estiverem lançados.</EstadoVazio>
            )}
          </div>
        )}

        {/* 7. Escores de processo (Dígitos) */}
        {abaAtiva === "processo" && (
          <ProcessoWais3 processo={extras.processo} escoresBrutos={escoresBrutos} onEscoresChange={onEscoresChange} onSalvar={onSalvar} salvando={salvando} temResultadoPossivel={!!sessaoId} />
        )}

        {/* 8. Habilidades compartilhadas */}
        {abaAtiva === "habilidades" && (extras.habilidades ? <HabilidadesWais3 matriz={extras.habilidades} /> : <EstadoVazio>Lance os subtestes na aba 1 para ver as habilidades compartilhadas.</EstadoVazio>)}
      </div>
    </div>
  );
}

// Linhas "Soma dos Pontos Ponderados", TOTAL, "Média dos Pontos Ponderados (M.P.P.)", "Diferença entre subteste
// com maior e menor pontuação" e "O Índice é Homogêneo / Unitário" da planilha.
function ResumoSomas({ resultado }: { resultado: ResultadoCalculado | null }) {
  const colunas: Array<[string, string, boolean]> = [
    ["qiv", "Verbal", false],
    ["qie", "Execução", false],
    ["icv", "ICV", true],
    ["iop", "IOP", true],
    ["imo", "IMO", true],
    ["ivp", "IVP", true],
  ];
  const dados = colunas.map(([chave, rotulo, fatorial]) => ({ rotulo, fatorial, i: lerIndice(resultado, chave) }));
  const total = lerIndice(resultado, "qit").soma;
  const fmt = (n: number | null) => (n === null ? "—" : n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  return (
    <div className="overflow-x-auto rounded-xl border border-mist">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-paper text-[11px] uppercase tracking-wide text-ink/50">
            <th className="px-3 py-2 text-left font-semibold"></th>
            {dados.map((d) => (
              <th key={d.rotulo} className="px-3 py-2 text-right font-semibold">
                {d.rotulo}
              </th>
            ))}
            <th className="px-3 py-2 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-mist">
            <td className="px-3 py-2 text-ink/70">Soma dos pontos ponderados</td>
            {dados.map((d) => (
              <td key={d.rotulo} className="px-3 py-2 text-right font-semibold tabular-nums">{d.i.soma ?? "—"}</td>
            ))}
            <td className="px-3 py-2 text-right font-serif text-base font-semibold tabular-nums">{total ?? "—"}</td>
          </tr>
          <tr className="border-t border-mist">
            <td className="px-3 py-2 text-ink/70">Média dos ponderados (M.P.P.)</td>
            {dados.map((d) => (
              <td key={d.rotulo} className="px-3 py-2 text-right tabular-nums">{d.fatorial ? fmt(d.i.mpp) : ""}</td>
            ))}
            <td />
          </tr>
          <tr className="border-t border-mist">
            <td className="px-3 py-2 text-ink/70">Maior menos menor ponderado</td>
            {dados.map((d) => (
              <td key={d.rotulo} className="px-3 py-2 text-right tabular-nums">{d.fatorial ? (d.i.diferenca ?? "—") : ""}</td>
            ))}
            <td />
          </tr>
          <tr className="border-t border-mist">
            <td className="px-3 py-2 text-ink/70">Índice homogêneo (diferença menor que 5)</td>
            {dados.map((d) => (
              <td key={d.rotulo} className="px-3 py-2 text-right">
                {d.fatorial && d.i.homogeneo ? (
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white ${d.i.homogeneo === "SIM" ? "bg-[#3f8f5b]" : "bg-[#c0392b]"}`}>{d.i.homogeneo}</span>
                ) : (
                  ""
                )}
              </td>
            ))}
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function SeletorIC({ valor, onChange }: { valor: "ic90" | "ic95"; onChange: (n: "ic90" | "ic95") => void }) {
  return (
    <div className="inline-flex rounded-full border border-mist p-0.5 text-xs font-semibold">
      {(["ic90", "ic95"] as const).map((n) => (
        <button key={n} onClick={() => onChange(n)} className={`rounded-full px-3 py-1 transition-colors ${valor === n ? "bg-ink text-paper" : "text-ink/60"}`}>
          IC {n === "ic90" ? "90%" : "95%"}
        </button>
      ))}
    </div>
  );
}

const fmtNum = (n: number | null) => (n === null ? "" : n.toLocaleString("pt-BR", { maximumFractionDigits: 2 }));

// "Análise avançada" da planilha (colunas K-S): interpretabilidade, facilidade/dificuldade normativa e individual.
function AnaliseAvancada({ indices }: { indices: Record<string, IndiceLido> }) {
  const linhas = ["icv", "iop", "imo", "ivp"].map((k) => ({ k, i: indices[k] })).filter((l) => l.i.composto !== null);
  const avisos = ["qit", "gai"].map((k) => ({ k, i: indices[k] })).filter((l) => l.i.aviso);
  const chip = (texto: string, cor: string) => (
    <span className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white" style={{ background: cor }}>
      {texto}
    </span>
  );
  if (linhas.length === 0) return null;
  return (
    <section>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-sage-deep">Análise avançada</h3>
      <div className="overflow-x-auto rounded-xl border border-mist">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-paper text-[11px] uppercase tracking-wide text-ink/50">
              <th className="px-3 py-2 text-left font-semibold">Índice</th>
              <th className="px-3 py-2 text-center font-semibold">Interpretável?</th>
              <th className="px-3 py-2 text-left font-semibold">D ou F normativa</th>
              <th className="px-3 py-2 text-right font-semibold">Média dos índices</th>
              <th className="px-3 py-2 text-right font-semibold">Diferença</th>
              <th className="px-3 py-2 text-right font-semibold">Valor crítico</th>
              <th className="px-3 py-2 text-left font-semibold">D ou F individual</th>
              <th className="px-3 py-2 text-left font-semibold">Raro?</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map(({ k, i }) => (
              <tr key={k} className="border-t border-mist align-top">
                <td className="px-3 py-2 font-semibold">{ROTULO_INDICE[k]}</td>
                <td className="px-3 py-2 text-center">{i.interpretavel ? chip(i.interpretavel, i.interpretavel === "SIM" ? "#3f8f5b" : "#c0392b") : ""}</td>
                <td className="px-3 py-2">{i.dfNormativa}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtNum(i.mediaIndices)}</td>
                <td className={`px-3 py-2 text-right tabular-nums ${i.diferencaMedia !== null && i.diferencaMedia < 0 ? "text-ember" : ""}`}>{fmtNum(i.diferencaMedia)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtNum(i.valorCritico)}</td>
                <td className="px-3 py-2">{i.dfIndividual}</td>
                <td className="px-3 py-2">{i.raro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {linhas.filter((l) => l.i.observacao).map(({ k, i }) => (
        <p key={k} className="mt-2 rounded-lg border border-ember/25 bg-ember/10 px-3 py-2 text-xs text-ember">
          <strong>{ROTULO_INDICE[k]}.</strong> {i.observacao}
        </p>
      ))}
      {avisos.map(({ k, i }) => (
        <p key={k} className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <strong>{ROTULO_INDICE[k]}.</strong> {i.aviso}
        </p>
      ))}
      <p className="mt-2 text-[11px] text-ink/45">
        D ou F normativa: composto abaixo de 85 é dificuldade; de 85 a 114, média; 115 ou mais, facilidade. Individual: diferença do índice para a média dos 4 índices, comparada ao valor crítico da idade.
      </p>
    </section>
  );
}

function EstadoVazio({ titulo, children }: { titulo?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-mist bg-paper px-6 py-10 text-center">
      {titulo && <div className="mb-1 font-serif text-lg text-ink">{titulo}</div>}
      <p className="mx-auto max-w-md text-sm text-ink/60">{children}</p>
    </div>
  );
}
