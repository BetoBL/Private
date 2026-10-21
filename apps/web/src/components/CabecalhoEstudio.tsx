// Cabeçalho de destaque do "estúdio do teste": quem é o teste, de quem é a aplicação e quanto já foi lançado.
interface Props {
  sigla: string;
  nome: string;
  dominio?: string;
  paciente?: string;
  idade?: string;
  data?: string;
  lancados: number;
  total: number;
  calculando?: boolean;
  salvando?: boolean;
  podeSalvar?: boolean;
  onSalvar?: () => void;
}

const ROTULO_DOMINIO: Record<string, string> = { INTELIGENCIA: "Inteligência", ATENCAO: "Atenção", MEMORIA: "Memória", FUNCOES_EXECUTIVAS: "Funções executivas", LINGUAGEM_APRENDIZAGEM: "Linguagem e aprendizagem", PERSONALIDADE: "Personalidade", SINTOMAS_EMOCIONAIS: "Sintomas emocionais", RASTREIO_TDAH: "Rastreio de TDAH", RASTREIO_TEA: "Rastreio de TEA", DESENVOLVIMENTO: "Desenvolvimento", OUTRO: "Outro" };

function Anel({ pct }: { pct: number }) {
  const R = 34, C = 2 * Math.PI * R;
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20 shrink-0" role="img" aria-label={`${pct}% lançado`}>
      <circle cx="40" cy="40" r={R} fill="none" stroke="rgb(255 255 255 / 0.22)" strokeWidth="7" />
      <circle cx="40" cy="40" r={R} fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} transform="rotate(-90 40 40)" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      <text x="40" y="45" textAnchor="middle" fontSize="17" fontWeight="700" fill="#fff" fontFamily="Inter, sans-serif">{pct}%</text>
    </svg>
  );
}

export function CabecalhoEstudio({ sigla, nome, dominio, paciente, idade, data, lancados, total, calculando, salvando, podeSalvar = true, onSalvar }: Props) {
  const pct = Math.round((lancados / Math.max(1, total)) * 100);
  const chip = "rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur";
  return (
    <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2a1a10] via-[#8a3a0f] to-[#e66a1f] p-6 text-white shadow-[0_18px_40px_-18px_rgba(194,87,22,0.7)] sm:p-7">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-[#ffb27a]/20 blur-3xl" />
      <div className="relative flex flex-wrap items-center gap-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
            <span>Estúdio do teste</span>{dominio && <span className="rounded-full bg-white/15 px-2 py-0.5 normal-case tracking-normal">{ROTULO_DOMINIO[dominio] ?? dominio}</span>}
          </div>
          <h1 className="mt-1 font-serif text-4xl font-semibold leading-tight sm:text-5xl">{sigla}</h1>
          <p className="mt-1 max-w-2xl text-sm text-white/80">{nome}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {paciente && <span className={chip}>👤 {paciente}</span>}
            {idade && <span className={chip}>🎂 {idade}</span>}
            {data && <span className={chip}>📅 {data}</span>}
            <span className={chip}>{lancados} de {total} campos</span>
            {calculando && <span className={`${chip} animate-pulse`}>calculando…</span>}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Anel pct={pct} />
          {onSalvar && (
            <button type="button" onClick={onSalvar} disabled={salvando || !podeSalvar} className="rounded-full bg-white px-6 py-3 text-sm font-bold text-[#8a3a0f] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:translate-y-0 disabled:opacity-50">
              {salvando ? "Salvando…" : "Salvar lançamento"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
