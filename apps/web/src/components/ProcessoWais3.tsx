import { CHAVES_PROCESSO, COR_CLASSIFICACAO, type DiferencaSpamLida, type EstatisticaZ, type ProcessoLido, type SpamLido } from "../lib/wechsler";

interface Props {
  processo?: ProcessoLido;
  escoresBrutos: Record<string, string>;
  onEscoresChange: (e: Record<string, string>) => void;
  onSalvar: () => Promise<void>;
  salvando: boolean;
  temResultadoPossivel: boolean; // há paciente/sessão para calcular
}

const fmt = (n: number | null | undefined, casas = 1) => (n === null || n === undefined ? "—" : n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }));

// Faixas do Z na mesma ordem e limiares da coluna Classificação da planilha.
const FAIXAS_Z = [
  { de: -3, ate: -2, cls: "Deficitário" },
  { de: -2, ate: -1.333, cls: "Limítrofe" },
  { de: -1.333, ate: -0.667, cls: "Média Inferior" },
  { de: -0.667, ate: 0.666, cls: "Média" },
  { de: 0.666, ate: 1.333, cls: "Média Superior" },
  { de: 1.333, ate: 2, cls: "Superior" },
  { de: 2, ate: 3, cls: "Muito Superior" },
];

// Medidor do Z (-3 a +3) com as faixas de classificação e um marcador que desliza até o valor.
function MedidorZ({ z, classificacao }: { z: number; classificacao: string }) {
  const pos = (v: number) => `${((Math.min(3, Math.max(-3, v)) + 3) / 6) * 100}%`;
  const cor = COR_CLASSIFICACAO[classificacao] ?? "#262624";
  return (
    <div className="relative h-8 w-full min-w-[220px]" role="img" aria-label={`Z ${z.toLocaleString("pt-BR")}, ${classificacao}`}>
      <div className="absolute inset-x-0 top-1/2 flex h-2.5 -translate-y-1/2 overflow-hidden rounded-full">
        {FAIXAS_Z.map((f) => (
          <div key={f.cls} style={{ width: `${((f.ate - f.de) / 6) * 100}%`, background: COR_CLASSIFICACAO[f.cls], opacity: 0.28 }} />
        ))}
      </div>
      <div className="absolute top-1/2 h-4 w-px -translate-y-1/2 bg-ink/30" style={{ left: pos(0) }} />
      <div
        className="absolute top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-md"
        style={{ left: pos(z), background: cor, transition: "left .7s cubic-bezier(.22,1,.36,1)" }}
      />
      <div className="absolute inset-x-0 bottom-[-2px] flex justify-between text-[9px] text-ink/40">
        <span>−3</span>
        <span>0</span>
        <span>+3</span>
      </div>
    </div>
  );
}

function Selo({ classificacao }: { classificacao: string }) {
  return (
    <span className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white" style={{ background: COR_CLASSIFICACAO[classificacao] ?? "#262624" }}>
      {classificacao}
    </span>
  );
}

function Campo({ rotulo, dica, valor, onChange }: { rotulo: string; dica?: string; valor: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-mist px-3 py-2.5 focus-within:border-sage-deep focus-within:ring-2 focus-within:ring-sage-deep/15">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{rotulo}</span>
        {dica && <span className="block text-[11px] leading-tight text-ink/45">{dica}</span>}
      </span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        className="w-20 rounded-lg border border-mist bg-paper px-2 py-1.5 text-right text-sm tabular-nums outline-none focus:border-sage-deep"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
      />
    </label>
  );
}

function ResultadoLinha({ e, extra }: { e: EstatisticaZ; extra: React.ReactNode }) {
  return (
    <div className="wais-entra mt-3 grid items-center gap-x-6 gap-y-3 rounded-xl bg-paper px-4 py-3 sm:grid-cols-[1fr_auto]">
      <div>
        <MedidorZ z={e.z} classificacao={e.classificacao} />
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink/60">{extra}</div>
      </div>
      <div className="text-right">
        <div className="font-serif text-2xl font-semibold tabular-nums text-ink">{fmt(e.percentil, 1)}</div>
        <div className="mb-1 text-[11px] text-ink/50">percentil</div>
        <Selo classificacao={e.classificacao} />
      </div>
    </div>
  );
}

export function ProcessoWais3({ processo, escoresBrutos, onEscoresChange, onSalvar, salvando, temResultadoPossivel }: Props) {
  const set = (chave: string, v: string) => onEscoresChange({ ...escoresBrutos, [chave]: v });
  const g = (chave: string) => escoresBrutos[chave] ?? "";
  const spam = (s: SpamLido | null | undefined, rotulo: string) =>
    s && (
      <ResultadoLinha
        e={s}
        extra={
          <>
            <span>
              Média da faixa <strong className="text-ink/80">{fmt(s.media)}</strong>
            </span>
            <span>
              Desvio-padrão <strong className="text-ink/80">{fmt(s.dp)}</strong>
            </span>
            <span>
              Z <strong className="text-ink/80">{fmt(s.z, 2)}</strong>
            </span>
            <span>
              Ponderado <strong className="text-ink/80">{fmt(s.ponderado, 1)}</strong>
            </span>
            {s.porcentagemCumulativa !== null && (
              <span>
                Porcentagem cumulativa <strong className="text-ink/80">{fmt(s.porcentagemCumulativa)}%</strong>
              </span>
            )}
            <span className="sr-only">{rotulo}</span>
          </>
        }
      />
    );
  const dif: DiferencaSpamLida | null | undefined = processo?.diferenca;
  return (
    <div className="space-y-8">
      <p className="max-w-2xl text-sm text-ink/65">
        Escores de processo de Dígitos: a <strong>maior sequência</strong> que o paciente repetiu em cada ordem e a <strong>diferença entre as ordens</strong>. Digite os valores do protocolo; a norma é a da faixa etária do paciente
        {processo ? ` (${processo.faixa} anos)` : ""}.
      </p>

      <section>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">Maior sequência de Dígitos (spam)</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Ordem direta" dica="maior sequência repetida corretamente" valor={g(CHAVES_PROCESSO.spamDireta)} onChange={(v) => set(CHAVES_PROCESSO.spamDireta, v)} />
          <Campo rotulo="Ordem inversa" dica="maior sequência repetida corretamente" valor={g(CHAVES_PROCESSO.spamInversa)} onChange={(v) => set(CHAVES_PROCESSO.spamInversa, v)} />
        </div>
        {spam(processo?.spam.direta, "Ordem direta")}
        {spam(processo?.spam.inversa, "Ordem inversa")}
        {(processo?.spam.direta || processo?.spam.inversa) && !(processo.spam.direta && processo.spam.inversa) && (
          <p className="mt-2 text-[11px] text-ink/45">A porcentagem cumulativa só aparece com as duas ordens preenchidas.</p>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">Conversão de pontos brutos em frequência acumulada</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Dígitos — ordem direta" dica="pontos brutos" valor={g(CHAVES_PROCESSO.pontosDireta)} onChange={(v) => set(CHAVES_PROCESSO.pontosDireta, v)} />
          <Campo rotulo="Dígitos — ordem inversa" dica="pontos brutos" valor={g(CHAVES_PROCESSO.pontosInversa)} onChange={(v) => set(CHAVES_PROCESSO.pontosInversa, v)} />
        </div>
        {dif && (
          <ResultadoLinha
            e={dif}
            extra={
              <>
                <span>
                  Diferença (direta − inversa) <strong className="text-ink/80">{dif.diferenca}</strong>
                </span>
                <span>
                  Frequência acumulada <strong className="text-ink/80">{fmt(dif.frequenciaAcumulada)}%</strong>
                </span>
                <span>
                  Média <strong className="text-ink/80">{fmt(dif.media)}</strong>
                </span>
                <span>
                  Desvio-padrão <strong className="text-ink/80">{fmt(dif.dp)}</strong>
                </span>
                <span>
                  Z <strong className="text-ink/80">{fmt(dif.z, 2)}</strong>
                </span>
              </>
            }
          />
        )}
        {processo?.aviso && <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">{processo.aviso}</p>}
        <p className="mt-2 text-[11px] text-ink/45">Quanto menor a diferença entre as ordens, maior o Z (o sinal é invertido, como na planilha).</p>
      </section>

      {!temResultadoPossivel && <p className="rounded-lg border border-mist bg-paper px-4 py-3 text-sm text-ink/70">Escolha o paciente e a sessão para ver os resultados: a idade dele define a norma.</p>}

      <div className="border-t border-mist pt-4">
        <button className="rounded-lg bg-sage-deep px-5 py-2.5 text-sm font-semibold text-paper transition-opacity disabled:opacity-40" onClick={onSalvar} disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar lançamento"}
        </button>
        <span className="ml-3 text-xs text-ink/50">Salva junto com os escores da aba 1.</span>
      </div>
    </div>
  );
}
