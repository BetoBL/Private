import { useMemo, useRef, useState, type ReactNode } from "react";
import type { BibliotecaTeste } from "../lib/api";

// Editor de documento do modelo: texto simples com **negrito**, "# Título", "## Subtítulo", "- item", campos {{paciente.nome}} e blocos [[tabela:…]] / [[grafico:…]] / [[linha:…]]
// dos testes. A paleta insere o campo/bloco onde está o cursor; a visualização mostra cada campo e bloco destacado, como numa mala direta.

const botao = "rounded-md border border-mist bg-white px-2.5 py-1 text-xs font-semibold text-ink/70 hover:bg-paper";

export function rotuloDoBloco(token: string, marcadores: Array<{ marcador: string; descricao: string }>, biblioteca: BibliotecaTeste[]): string {
  const campo = /^\{\{\s*([\w.]+)\s*\}\}$/.exec(token);
  if (campo) return marcadores.find((m) => m.marcador === campo[1])?.descricao ?? campo[1];
  const t = /^\[\[([^:\]]+):([^\]]*)\]\]$/.exec(token);
  if (!t) return token;
  const [, tipo, resto] = t;
  const partes = resto.split("|");
  if (tipo === "grafico") return partes[0] === "wais-indices" ? "Gráfico dos índices do WAIS-III" : `Gráfico${partes[1] ? ` “${partes[1]}”` : ""} · ${partes[0]}`;
  if (tipo === "tabela") {
    if (partes[0] === "wais-indices") return "Tabela dos índices do WAIS-III";
    if (partes[0] === "layout") return `Tabela${partes[2] ? ` “${partes[2]}”` : ""} · ${partes[1]}`;
    if (partes[0] === "resultados") return `Quadro de resultados · ${partes[1]}`;
  }
  if (tipo === "linha") {
    const [sigla, fonte] = partes;
    const nome = fonte?.startsWith("c:") ? biblioteca.find((b) => b.sigla === sigla)?.campos.find((c) => c.chave === fonte.slice(2))?.label ?? fonte.slice(2) : fonte?.slice(2);
    return `Resultado “${nome}” · ${sigla}`;
  }
  return token;
}

function Inline({ texto, marcadores, biblioteca }: { texto: string; marcadores: Array<{ marcador: string; descricao: string }>; biblioteca: BibliotecaTeste[] }) {
  const partes = texto.split(/(\*\*[^*]+\*\*|\{\{[^}]+\}\}|\[\[[^\]]+\]\])/g).filter(Boolean);
  return (
    <>
      {partes.map((p, i) => {
        if (p.startsWith("**")) return <b key={i}>{p.slice(2, -2)}</b>;
        if (p.startsWith("{{")) return <span key={i} className="mx-0.5 rounded bg-sage-deep/15 px-1.5 py-0.5 text-[13px] font-semibold text-sage-deep">{rotuloDoBloco(p, marcadores, biblioteca)}</span>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

function Visualizacao({ texto, marcadores, biblioteca }: { texto: string; marcadores: Array<{ marcador: string; descricao: string }>; biblioteca: BibliotecaTeste[] }) {
  const linhas = texto.split("\n").filter((l) => l.trim());
  if (linhas.length === 0) return <p className="text-sm text-ink/45">O documento está vazio. Escreva à esquerda e insira campos e blocos pela paleta.</p>;
  const itens: ReactNode[] = [];
  linhas.forEach((l, i) => {
    const t = l.trim();
    if (/^\[\[[^\]]+\]\]$/.test(t)) {
      const grafico = t.startsWith("[[grafico");
      itens.push(<div key={i} className="my-2 flex items-center gap-2 rounded-lg border border-dashed border-sage-deep/50 bg-sage-deep/[0.06] px-3 py-3 text-sm font-semibold text-sage-deep"><span>{grafico ? "📊" : t.startsWith("[[linha") ? "▸" : "▦"}</span>{rotuloDoBloco(t, marcadores, biblioteca)}</div>);
    } else if (t.startsWith("## ")) itens.push(<h4 key={i} className="mt-3 text-[15px] font-bold text-ink"><Inline texto={t.slice(3)} marcadores={marcadores} biblioteca={biblioteca} /></h4>);
    else if (t.startsWith("# ")) itens.push(<h3 key={i} className="mt-4 font-serif text-lg font-bold text-ink"><Inline texto={t.slice(2)} marcadores={marcadores} biblioteca={biblioteca} /></h3>);
    else if (t.startsWith("- ")) itens.push(<li key={i} className="ml-5 list-disc text-sm leading-relaxed"><Inline texto={t.slice(2)} marcadores={marcadores} biblioteca={biblioteca} /></li>);
    else itens.push(<p key={i} className="text-sm leading-relaxed"><Inline texto={t} marcadores={marcadores} biblioteca={biblioteca} /></p>);
  });
  return <div className="space-y-1.5">{itens}</div>;
}

// Resultados individuais de um teste: podem ser centenas, então há busca e a lista mostra no máximo 40
function Individuais({ teste, inserir, chip }: { teste: BibliotecaTeste; inserir: (t: string, bloco: boolean) => void; chip: string }) {
  const [busca, setBusca] = useState("");
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const itens = [...teste.campos.map((c) => ({ rot: c.label, token: `[[linha:${teste.sigla}|c:${c.chave}]]` })), ...teste.linhas.map((l) => ({ rot: l, token: `[[linha:${teste.sigla}|l:${l}]]` }))];
  const achados = itens.filter((i) => !busca.trim() || norm(i.rot).includes(norm(busca)));
  return (
    <details>
      <summary className="cursor-pointer text-xs font-semibold text-ink/55">Resultados individuais ({itens.length})</summary>
      <input className="mt-1.5 w-full rounded-md border border-mist px-2 py-1 text-xs" placeholder="Buscar um resultado…" value={busca} onChange={(e) => setBusca(e.target.value)} />
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {achados.slice(0, 40).map((i) => <button key={i.token} className={chip} onClick={() => inserir(i.token, true)}>▸ {i.rot}</button>)}
      </div>
      {achados.length > 40 && <p className="mt-1 text-[11px] text-ink/45">Mostrando 40 de {achados.length}. Digite na busca para achar o que precisa.</p>}
      {achados.length === 0 && <p className="mt-1 text-[11px] text-ink/45">Nada encontrado.</p>}
    </details>
  );
}

function Paleta({ testes, marcadores, inserir }: { testes: BibliotecaTeste[]; marcadores: Array<{ marcador: string; descricao: string }>; inserir: (t: string, bloco: boolean) => void }) {
  const grupos = [
    { titulo: "Paciente", itens: marcadores.filter((m) => m.marcador.startsWith("paciente.")) },
    { titulo: "Profissional e clínica", itens: marcadores.filter((m) => m.marcador.startsWith("profissional.") || m.marcador.startsWith("clinica.")) },
    { titulo: "Data e local", itens: marcadores.filter((m) => m.marcador === "data" || m.marcador.startsWith("data.") || m.marcador.startsWith("local.")) },
  ];
  const chip = "rounded-full border border-mist bg-white px-2.5 py-1 text-left text-xs text-ink/75 hover:border-sage-deep hover:bg-sage-deep/5";
  return (
    <div className="space-y-2">
      {grupos.map((g) => (
        <details key={g.titulo} className="rounded-lg border border-mist bg-white">
          <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-ink/75">{g.titulo}</summary>
          <div className="flex flex-wrap gap-1.5 px-3 pb-3">{g.itens.map((m) => <button key={m.marcador} className={chip} onClick={() => inserir(`{{${m.marcador}}}`, false)}>{m.descricao}</button>)}</div>
        </details>
      ))}
      <div className="px-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-sage-deep">Testes deste modelo</div>
      {testes.length === 0 && <p className="px-1 text-xs text-ink/50">Nenhum teste escolhido. Defina a lista na aba “Testes do modelo”.</p>}
      {testes.map((t) => {
        const wais = t.sigla === "WAIS-III";
        return (
          <details key={t.sigla} className="rounded-lg border border-mist bg-white">
            <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-ink/80">{t.sigla} <span className="font-normal text-ink/45">{t.nome.length > 34 ? `${t.nome.slice(0, 34)}…` : t.nome}</span></summary>
            <div className="space-y-1.5 px-3 pb-3">
              <div className="flex flex-wrap gap-1.5">
                <button className={chip} onClick={() => inserir(`[[tabela:resultados|${t.sigla}]]`, true)}>▦ Quadro de resultados</button>
                {wais && <button className={chip} onClick={() => inserir("[[tabela:wais-indices]]", true)}>▦ Tabela dos índices</button>}
                {wais && <button className={chip} onClick={() => inserir("[[grafico:wais-indices]]", true)}>📊 Gráfico dos índices</button>}
                {t.tabelas.map((x) => <button key={`t${x}`} className={chip} onClick={() => inserir(`[[tabela:layout|${t.sigla}|${x}]]`, true)}>▦ {x}</button>)}
                {t.graficos.map((x) => <button key={`g${x}`} className={chip} onClick={() => inserir(`[[grafico:${t.sigla}|${x}]]`, true)}>📊 {x}</button>)}
              </div>
              {(t.campos.length > 0 || t.linhas.length > 0) && <Individuais teste={t} inserir={inserir} chip={chip} />}
            </div>
          </details>
        );
      })}
    </div>
  );
}

export function DocumentoModelo({ valor, onChange, testes, marcadores, biblioteca }: { valor: string; onChange: (v: string) => void; testes: BibliotecaTeste[]; marcadores: Array<{ marcador: string; descricao: string }>; biblioteca: BibliotecaTeste[] }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [modo, setModo] = useState<"lado" | "texto">("lado");
  const sel = useRef<{ a: number; b: number }>({ a: valor.length, b: valor.length });
  const guardaSel = () => { const el = ref.current; if (el) sel.current = { a: el.selectionStart, b: el.selectionEnd }; };

  function inserir(trecho: string, bloco: boolean) {
    const { a, b } = sel.current;
    const antes = valor.slice(0, a), depois = valor.slice(b);
    const pre = bloco && antes.length > 0 && !antes.endsWith("\n") ? "\n" : "";
    const pos = bloco && !depois.startsWith("\n") ? "\n" : "";
    const novo = antes + pre + trecho + pos + depois;
    onChange(novo);
    const cursor = (antes + pre + trecho + pos).length;
    sel.current = { a: cursor, b: cursor };
    requestAnimationFrame(() => { ref.current?.focus(); ref.current?.setSelectionRange(cursor, cursor); });
  }
  function formatar(tipo: "negrito" | "titulo" | "subtitulo" | "item") {
    const el = ref.current;
    if (!el) return;
    const { a, b } = sel.current;
    let novo = valor;
    if (tipo === "negrito") novo = `${valor.slice(0, a)}**${valor.slice(a, b) || "texto"}**${valor.slice(b)}`;
    else {
      const ini = valor.lastIndexOf("\n", a - 1) + 1;
      const pref = tipo === "titulo" ? "# " : tipo === "subtitulo" ? "## " : "- ";
      const resto = valor.slice(ini).replace(/^(#{1,2} |- )/, "");
      novo = valor.slice(0, ini) + (valor.slice(ini).startsWith(pref) ? "" : pref) + resto;
    }
    onChange(novo);
    requestAnimationFrame(() => el.focus());
  }
  const temBloco = useMemo(() => /\[\[[^\]]+\]\]/.test(valor), [valor]);

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <button className={botao} onMouseDown={(e) => e.preventDefault()} onClick={() => formatar("negrito")}><b>N</b> Negrito</button>
          <button className={botao} onMouseDown={(e) => e.preventDefault()} onClick={() => formatar("titulo")}>Título</button>
          <button className={botao} onMouseDown={(e) => e.preventDefault()} onClick={() => formatar("subtitulo")}>Subtítulo</button>
          <button className={botao} onMouseDown={(e) => e.preventDefault()} onClick={() => formatar("item")}>• Item</button>
          <div className="ml-auto inline-flex rounded-full border border-mist p-0.5 text-xs font-semibold">
            <button className={`rounded-full px-3 py-1 ${modo === "lado" ? "bg-ink text-paper" : "text-ink/60"}`} onClick={() => setModo("lado")}>Texto e visualização</button>
            <button className={`rounded-full px-3 py-1 ${modo === "texto" ? "bg-ink text-paper" : "text-ink/60"}`} onClick={() => setModo("texto")}>Só o texto</button>
          </div>
        </div>
        <div className={modo === "lado" ? "grid gap-3 xl:grid-cols-2" : ""}>
          <textarea ref={ref} className="min-h-[26rem] w-full resize-y rounded-xl border border-mist bg-white px-4 py-3 font-mono text-[13px] leading-relaxed text-ink outline-none focus:border-sage-deep" value={valor} onChange={(e) => { onChange(e.target.value); guardaSel(); }} onSelect={guardaSel} onKeyUp={guardaSel} onClick={guardaSel} placeholder={"# Título\nEscreva o texto e use a paleta ao lado para inserir campos do paciente e quadros, tabelas e gráficos dos testes."} />
          {modo === "lado" && <div className="min-h-[26rem] rounded-xl border border-mist bg-[#f3f1ec] p-5"><div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink/40">Visualização</div><div className="rounded-lg bg-white px-6 py-6 shadow-sm"><Visualizacao texto={valor} marcadores={marcadores} biblioteca={biblioteca} /></div></div>}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink/50">Clique no texto onde quer o campo e depois clique no item da paleta. Os campos destacados são trocados pelos dados de cada paciente{temBloco ? "; as tabelas e os gráficos só aparecem no laudo se o paciente fez aquele teste" : ""}.</p>
      </div>
      <aside className="lg:sticky lg:top-4"><Paleta testes={testes} marcadores={marcadores} inserir={inserir} /></aside>
    </div>
  );
}
