import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Teste } from "../lib/api";

// Ambiente claro próprio desta página (sem o <Layout> de sidebar escura) — é o "outro mundo"
// pedido pelo usuário: a aba de catálogo de testes, visualmente distinta da casca de gestão da
// clínica, mas com a mesma tipografia da marca (Fraunces + Inter) e um único acento salmão.
// Protótipo aprovado em artifact antes desta implementação.

interface Categoria {
  chave: string;
  label: string;
  icone: ReactNode;
  dominios: string[];
}

const ICONE_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const CATEGORIAS: Categoria[] = [
  {
    chave: "intel",
    label: "Inteligência & Desenvolvimento",
    dominios: ["INTELIGENCIA", "DESENVOLVIMENTO"],
    icone: (
      <svg {...ICONE_PROPS}>
        <path d="M9.5 3a3.5 3.5 0 0 0-3.5 3.5v.6A3 3 0 0 0 4 10v1a3 3 0 0 0 1 2.24V15a3.5 3.5 0 0 0 3.5 3.5" />
        <path d="M9.5 18.5V21" />
        <path d="M14.5 3a3.5 3.5 0 0 1 3.5 3.5v.6a3 3 0 0 1 2 2.9v1a3 3 0 0 1-1 2.24V15a3.5 3.5 0 0 1-3.5 3.5" />
        <path d="M14.5 18.5V21" />
        <path d="M9.5 3h5" />
      </svg>
    ),
  },
  {
    chave: "atmem",
    label: "Atenção & Memória",
    dominios: ["ATENCAO", "MEMORIA"],
    icone: (
      <svg {...ICONE_PROPS}>
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    chave: "exec",
    label: "Funções Executivas",
    dominios: ["FUNCOES_EXECUTIVAS"],
    icone: (
      <svg {...ICONE_PROPS}>
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.36.4.67.73.9.3.2.66.3 1.03.3H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </svg>
    ),
  },
  {
    chave: "lang",
    label: "Linguagem & Aprendizagem",
    dominios: ["LINGUAGEM_APRENDIZAGEM"],
    icone: (
      <svg {...ICONE_PROPS}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    chave: "pers",
    label: "Personalidade",
    dominios: ["PERSONALIDADE"],
    icone: (
      <svg {...ICONE_PROPS}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-1a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7v1" />
      </svg>
    ),
  },
  {
    chave: "emoc",
    label: "Sintomas Emocionais",
    dominios: ["SINTOMAS_EMOCIONAIS"],
    icone: (
      <svg {...ICONE_PROPS}>
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    chave: "tea",
    label: "Rastreio de TEA",
    dominios: ["RASTREIO_TEA"],
    icone: (
      <svg {...ICONE_PROPS}>
        <path d="M19.44 13a1.65 1.65 0 0 0 .33 1.82 2 2 0 1 1-2.83 2.83 1.65 1.65 0 0 0-1.82-.33m-7.24 0a1.65 1.65 0 0 0-1.82.33 2 2 0 1 1-2.83-2.83A1.65 1.65 0 0 0 4.56 13m0-2a1.65 1.65 0 0 0-.33-1.82 2 2 0 1 1 2.83-2.83A1.65 1.65 0 0 0 9 6.56m6 0a1.65 1.65 0 0 0 1.82-.33 2 2 0 1 1 2.83 2.83A1.65 1.65 0 0 0 19.44 11" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    chave: "tdah",
    label: "Rastreio de TDAH",
    dominios: ["RASTREIO_TDAH"],
    icone: (
      <svg {...ICONE_PROPS}>
        <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
      </svg>
    ),
  },
  {
    chave: "outros",
    label: "Outros",
    dominios: ["OUTRO"],
    icone: (
      <svg {...ICONE_PROPS}>
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
];

function Chevron({ aberto }: { aberto: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-[15px] w-[15px] shrink-0 text-ink/35 transition-transform duration-200 ${aberto ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function BibliotecaDeTestes() {
  const navigate = useNavigate();
  const [testes, setTestes] = useState<Teste[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [abertas, setAbertas] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.listTestes().then(setTestes).catch((e) => setErro(e.message));
  }, []);

  const grupos = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return CATEGORIAS.map((cat) => {
      const todos = testes.filter((t) => cat.dominios.includes(t.dominio));
      const filtrados = q ? todos.filter((t) => `${t.sigla} ${t.nome}`.toLowerCase().includes(q)) : todos;
      return { cat, todos, filtrados };
    }).filter((g) => g.todos.length > 0);
  }, [testes, busca]);

  function alternar(chave: string) {
    setAbertas((prev) => {
      const next = new Set(prev);
      if (next.has(chave)) next.delete(chave);
      else next.add(chave);
      return next;
    });
  }

  const semResultado = busca.trim() !== "" && grupos.every((g) => g.filtrados.length === 0);

  return (
    <div className="min-h-screen bg-[#faf8f3] px-5 py-7 text-[#2b2622]">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
        <div className="flex items-baseline gap-2.5 font-serif">
          <span className="text-[15px] text-[#8a7f72]">MentEssence</span>
          <span className="text-[#b3a899]">·</span>
          <span className="text-[19px] font-semibold">Biblioteca de Instrumentos</span>
        </div>
        <a
          href="/"
          className="rounded-full border border-[#e8e1d6] px-3.5 py-1.5 text-[13px] text-[#8a7f72] transition-colors hover:border-[#b3a899] hover:text-[#2b2622]"
        >
          ← Voltar à clínica
        </a>
      </div>

      <div className="mx-auto mt-8 max-w-5xl">
        <h1 className="text-balance font-serif text-[clamp(28px,4vw,40px)] font-semibold tracking-tight">
          Qual instrumento você precisa agora?
        </h1>
        <p className="mt-2.5 max-w-[56ch] text-[15px] leading-relaxed text-[#8a7f72]">
          Organizados por domínio avaliado, do jeito que você já pensa neles — não em ordem alfabética. Abra um domínio ou
          digite a sigla direto.
        </p>
      </div>

      <div className="relative mx-auto mt-9 max-w-5xl">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          className="pointer-events-none absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#b3a899]"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          type="text"
          autoComplete="off"
          placeholder="Buscar por sigla ou nome (ex.: WISC, ansiedade, autismo)…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full rounded-xl border border-[#e8e1d6] bg-white py-3.5 pl-11 pr-4 text-[15px] outline-none transition-colors focus:border-salmon-deep"
        />
      </div>

      {erro && <p className="mx-auto mt-6 max-w-5xl text-sm text-ember">{erro}</p>}

      <div className="mx-auto mt-6 grid max-w-5xl grid-cols-1 gap-3.5 sm:grid-cols-2">
        {grupos.map(({ cat, filtrados }) => {
          const aberto = abertas.has(cat.chave) || (busca.trim() !== "" && filtrados.length > 0);
          if (busca.trim() !== "" && filtrados.length === 0) return null;
          return (
            <div
              key={cat.chave}
              className="flex min-w-0 overflow-hidden rounded-2xl border border-[#e8e1d6] bg-white shadow-[0_1px_2px_rgba(43,38,34,.04),0_8px_20px_-14px_rgba(43,38,34,.18)] transition-colors hover:border-salmon"
            >
              <div className={`w-[5px] shrink-0 transition-colors ${aberto ? "bg-salmon-deep" : "bg-[#e8e1d6]"}`} />
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => alternar(cat.chave)}
                  className="flex w-full items-center gap-3.5 px-5 py-[18px] text-left"
                >
                  <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-salmon-tint text-salmon-deep [&_svg]:h-5 [&_svg]:w-5">
                    {cat.icone}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-serif text-[17px] font-semibold leading-tight">{cat.label}</span>
                    <span className="mt-1 block text-[11px] uppercase tracking-wide text-[#b3a899]">
                      {filtrados.length} instrumento{filtrados.length !== 1 ? "s" : ""}
                    </span>
                  </span>
                  <Chevron aberto={aberto} />
                </button>
                <div
                  className="grid transition-[grid-template-rows] duration-200 ease-out"
                  style={{ gridTemplateRows: aberto ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    {filtrados.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => navigate(`/testes?teste=${encodeURIComponent(t.sigla)}`)}
                        className="flex w-full items-center gap-3 border-t border-[#e8e1d6] px-5 py-[11px] text-left transition-colors hover:bg-salmon-tint/60"
                      >
                        <span className="shrink-0 whitespace-nowrap rounded-md bg-salmon-tint px-2 py-[3px] text-[11.5px] font-bold tracking-wide text-salmon-deep">
                          {t.sigla}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[13.5px] text-[#8a7f72]">{t.nome}</span>
                        {t.isPlaceholder && (
                          <span className="shrink-0 rounded-md border border-[#ecd9b2] bg-[#fbf1dc] px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-[#9a6b1e]">
                            PROVISÓRIO
                          </span>
                        )}
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-[13px] w-[13px] shrink-0 text-[#b3a899]"
                        >
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {semResultado && <p className="mx-auto mt-10 max-w-5xl text-center text-sm text-[#b3a899]">Nenhum instrumento bate com essa busca.</p>}
    </div>
  );
}
