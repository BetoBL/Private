import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { DocumentoModelo } from "../components/DocumentoModelo";
import { api, type BibliotecaTeste, type Teste, type TipoAtendimento, type BlocoIdentificacao, type DominioModelo, type DominioPadrao, type EstruturaModelo, type ModeloLaudo, type ResultadoImportacaoModelo, type SecaoModelo, type TipoSecao } from "../lib/api";
import { useAviso } from "../lib/aviso";
import { arquivoParaBase64 } from "./ModelosLaudo";

const ROTULO_SECAO: Record<TipoSecao, string> = {
  identificacao: "Identificação", demanda: "Demanda (texto do paciente)", anamnese: "Anamnese (texto do paciente)", observacao: "Observação clínica (texto do paciente)",
  instrumentos: "Instrumentos / procedimento (montado dos testes)", referencial: "Texto fixo com tabela de classificação", analise: "Análise por domínios (montada dos testes)",
  conclusao: "Conclusão (texto do paciente)", sugestoes: "Sugestões e encaminhamentos (texto do paciente)", referencias: "Referências (montadas dos testes)",
  fecho: "Local, data e assinatura", aviso_sigilo: "Aviso de sigilo (letra pequena)", aviso_validade: "Aviso de validade (letra pequena)", aviso_ia: "Aviso de uso de IA (só sai se usou IA)",
  documento: "Documento com campos e blocos dos testes", texto: "Texto fixo do modelo", livre: "Texto livre, escrito a cada paciente",
};
const REPETIVEIS: TipoSecao[] = ["texto", "livre", "documento"];
const NOVOS: Array<[TipoSecao, string]> = [["documento", "Documento com campos e blocos dos testes"], ["texto", "Texto fixo (igual em todos os laudos)"], ["livre", "Texto livre (escrito a cada paciente)"], ["demanda", "Demanda"], ["anamnese", "Anamnese"], ["observacao", "Observação clínica"], ["instrumentos", "Instrumentos / procedimento"], ["referencial", "Referencial teórico com tabela de classificação"], ["analise", "Análise dos resultados"], ["conclusao", "Conclusão"], ["sugestoes", "Sugestões e encaminhamentos"], ["referencias", "Referências"], ["identificacao", "Identificação"], ["fecho", "Local, data e assinatura"], ["aviso_sigilo", "Aviso de sigilo"], ["aviso_validade", "Aviso de validade"], ["aviso_ia", "Aviso de uso de IA"]];
const TEM_TEXTO: TipoSecao[] = ["texto", "livre", "referencial", "aviso_sigilo", "aviso_validade", "aviso_ia"];

const inputCls = "w-full rounded-lg border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-sage-deep";
const rotuloCls = "mb-1 block text-xs font-semibold text-ink/60";
const botaoMini = "rounded-md border border-mist bg-white px-2 py-1 text-xs font-semibold text-ink/65 hover:bg-paper disabled:opacity-30";

const textoDe = (t?: string | string[]) => (Array.isArray(t) ? t.join("\n\n") : t ?? "");
const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const novoId = (tipo: string) => `${tipo}-${Date.now().toString(36)}`;

function copiar(texto: string, aviso: (m: string) => void) {
  navigator.clipboard?.writeText(texto).then(() => aviso(`${texto} copiado.`), () => aviso(`Selecione e copie: ${texto}`));
}

// ---------- aba Estrutura ----------
function EditorIdentificacao({ blocos, onChange }: { blocos: BlocoIdentificacao[]; onChange: (b: BlocoIdentificacao[]) => void }) {
  const set = (i: number, parte: Partial<BlocoIdentificacao>) => onChange(blocos.map((b, k) => (k === i ? { ...b, ...parte } : b)));
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-ink/60">Blocos da identificação, na ordem em que saem</div>
      {blocos.map((b, i) => (
        <div key={i} className="rounded-lg border border-mist bg-paper/50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <select className="rounded-md border border-mist bg-white px-2 py-1 text-sm" value={b.tipo} onChange={(e) => set(i, { tipo: e.target.value as BlocoIdentificacao["tipo"], campos: e.target.value === "campos" ? b.campos ?? [{ id: "solicitante", rotulo: "Solicitante" }] : undefined })}>
              <option value="profissional">Dados do profissional (autoria, formação, e-mail)</option>
              <option value="paciente">Dados do paciente (nome, CPF, idade, nascimento)</option>
              <option value="campos">Campos preenchidos a cada paciente</option>
            </select>
            <input className="min-w-[12rem] flex-1 rounded-md border border-mist bg-white px-2 py-1 text-sm" placeholder="Subtítulo (opcional)" value={b.titulo ?? ""} onChange={(e) => set(i, { titulo: e.target.value })} />
            <button className={botaoMini} disabled={i === 0} onClick={() => onChange(blocos.map((_, k) => blocos[k === i ? i - 1 : k === i - 1 ? i : k]))}>↑</button>
            <button className={botaoMini} disabled={i === blocos.length - 1} onClick={() => onChange(blocos.map((_, k) => blocos[k === i ? i + 1 : k === i + 1 ? i : k]))}>↓</button>
            <button className={`${botaoMini} text-ember`} onClick={() => onChange(blocos.filter((_, k) => k !== i))}>Remover</button>
          </div>
          {b.tipo === "campos" && (
            <div className="mt-2 space-y-1.5">
              {(b.campos ?? []).map((c, j) => (
                <div key={j} className="flex items-center gap-2">
                  <input className="flex-1 rounded-md border border-mist bg-white px-2 py-1 text-sm" placeholder="Nome do campo (ex.: Solicitante)" value={c.rotulo} onChange={(e) => set(i, { campos: (b.campos ?? []).map((x, k) => (k === j ? { id: x.id.startsWith("novo-") ? slug(e.target.value) || x.id : x.id, rotulo: e.target.value } : x)) })} />
                  <button className={`${botaoMini} text-ember`} onClick={() => set(i, { campos: (b.campos ?? []).filter((_, k) => k !== j) })}>×</button>
                </div>
              ))}
              <button className={botaoMini} onClick={() => set(i, { campos: [...(b.campos ?? []), { id: `novo-${Date.now().toString(36)}`, rotulo: "" }] })}>+ campo</button>
            </div>
          )}
        </div>
      ))}
      <button className={botaoMini} onClick={() => onChange([...blocos, { tipo: "paciente", titulo: "" }])}>+ bloco de identificação</button>
    </div>
  );
}

function AbaEstrutura({ est, setEst, marcadores, aviso }: { est: EstruturaModelo; setEst: (e: EstruturaModelo) => void; marcadores: Array<{ marcador: string; descricao: string }>; aviso: (m: string) => void }) {
  const [aberta, setAberta] = useState<string | null>(null);
  const [novo, setNovo] = useState("");
  const setSecao = (i: number, parte: Partial<SecaoModelo>) => setEst({ ...est, secoes: est.secoes.map((s, k) => (k === i ? { ...s, ...parte } : s)) });
  const mover = (i: number, d: number) => { const l = [...est.secoes]; [l[i], l[i + d]] = [l[i + d], l[i]]; setEst({ ...est, secoes: l }); };
  const usados = new Set(est.secoes.map((s) => s.tipo));
  const disponiveis = NOVOS.filter(([t]) => REPETIVEIS.includes(t) || !usados.has(t));
  function adicionar(tipo: TipoSecao) {
    if (!tipo) return;
    const s: SecaoModelo = { id: novoId(tipo), tipo, titulo: tipo === "fecho" || tipo.startsWith("aviso_") ? "" : "NOVA SEÇÃO", ...(tipo === "identificacao" ? { identificacao: [{ tipo: "paciente", titulo: "" }] } : {}) };
    // entra antes do fecho/avisos/referências, para não ficar depois da assinatura
    const i = est.secoes.findIndex((x) => x.tipo === "fecho" || x.tipo.startsWith("aviso_"));
    setEst({ ...est, secoes: i >= 0 && !["fecho", "aviso_sigilo", "aviso_validade", "aviso_ia"].includes(tipo) ? [...est.secoes.slice(0, i), s, ...est.secoes.slice(i)] : [...est.secoes, s] });
    setAberta(s.id); setNovo("");
  }
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className={rotuloCls}>Título do documento (uma linha por linha centralizada)</span>
          <textarea className={inputCls} rows={2} value={est.cabecalho.join("\n")} onChange={(e) => setEst({ ...est, cabecalho: e.target.value.split("\n") })} />
        </label>
        <label className="block">
          <span className={rotuloCls}>Parágrafo de abertura, em negrito (opcional)</span>
          <textarea className={inputCls} rows={2} value={est.abertura ?? ""} onChange={(e) => setEst({ ...est, abertura: e.target.value || undefined })} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-ink/75"><input type="checkbox" className="h-4 w-4" checked={est.numerar} onChange={(e) => setEst({ ...est, numerar: e.target.checked })} />Numerar as seções (1., 2., 3. …)</label>

      <div className="space-y-2">
        {est.secoes.map((s, i) => (
          <div key={s.id} className={`rounded-xl border bg-white ${s.ativo === false ? "border-dashed border-mist opacity-60" : "border-mist"}`}>
            <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
              <input type="checkbox" className="h-4 w-4" title="Entra no documento" checked={s.ativo !== false} onChange={(e) => setSecao(i, { ativo: e.target.checked })} />
              <input className="min-w-[10rem] flex-1 rounded-md border border-transparent px-2 py-1 text-sm font-semibold text-ink hover:border-mist focus:border-sage-deep focus:outline-none" placeholder={s.titulo === "" ? "(sem título)" : "Título"} value={s.titulo} onChange={(e) => setSecao(i, { titulo: e.target.value })} />
              <span className="hidden rounded-full bg-paper px-2.5 py-0.5 text-[11px] font-semibold text-ink/55 md:inline">{ROTULO_SECAO[s.tipo]}</span>
              <button className={botaoMini} disabled={i === 0} onClick={() => mover(i, -1)} aria-label="Subir">↑</button>
              <button className={botaoMini} disabled={i === est.secoes.length - 1} onClick={() => mover(i, 1)} aria-label="Descer">↓</button>
              <button className={botaoMini} onClick={() => setAberta(aberta === s.id ? null : s.id)}>{aberta === s.id ? "Fechar" : "Detalhes"}</button>
              <button className={`${botaoMini} text-ember`} onClick={() => setEst({ ...est, secoes: est.secoes.filter((_, k) => k !== i) })} aria-label="Remover">×</button>
            </div>
            {aberta === s.id && (
              <div className="space-y-3 border-t border-mist bg-paper/40 px-4 py-4">
                {s.tipo === "documento" && <p className="text-sm text-ink/60">O texto deste documento, com os campos e os blocos dos testes, é montado na aba <b>Documento</b>.</p>}
                {s.tipo === "identificacao" && <EditorIdentificacao blocos={s.identificacao ?? []} onChange={(b) => setSecao(i, { identificacao: b })} />}
                {TEM_TEXTO.includes(s.tipo) && (
                  <label className="block">
                    <span className={rotuloCls}>{s.tipo === "livre" ? "Texto de partida (cada paciente pode alterar)" : "Texto do modelo (parágrafos separados por linha em branco)"}</span>
                    <textarea className={inputCls} rows={Math.min(14, Math.max(4, textoDe(s.texto).split("\n").length + 1))} value={textoDe(s.texto)} onChange={(e) => setSecao(i, { texto: Array.isArray(s.texto) ? e.target.value.split(/\n\n+/) : e.target.value })} />
                  </label>
                )}
                {s.tipo === "referencial" && <label className="flex items-center gap-2 text-sm text-ink/75"><input type="checkbox" className="h-4 w-4" checked={!!s.classificacao} onChange={(e) => setSecao(i, { classificacao: e.target.checked })} />Incluir a tabela de classificação por percentil (do Perfil de Atuação)</label>}
                <label className="block">
                  <span className={rotuloCls}>Orientação de preenchimento (aparece no laudo, não sai no documento)</span>
                  <input className={inputCls} value={s.orientacao ?? ""} onChange={(e) => setSecao(i, { orientacao: e.target.value || undefined })} />
                </label>
                <label className="flex items-center gap-2 text-sm text-ink/75"><input type="checkbox" className="h-4 w-4" checked={!!s.quebraPagina} onChange={(e) => setSecao(i, { quebraPagina: e.target.checked })} />Começar em página nova</label>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select className="rounded-lg border border-dashed border-ink/30 bg-white px-3 py-2 text-sm font-semibold text-ink/65" value={novo} onChange={(e) => adicionar(e.target.value as TipoSecao)}>
          <option value="">+ adicionar seção…</option>
          {disponiveis.map(([t, r]) => <option key={t} value={t}>{r}</option>)}
        </select>
      </div>

      <details className="rounded-xl border border-mist bg-white px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-ink/75">Marcadores para usar nos textos ({marcadores.length})</summary>
        <p className="mt-2 text-xs text-ink/55">Escreva o marcador no texto e o sistema troca pelo dado de cada laudo. Clique para copiar.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {marcadores.map((m) => <button key={m.marcador} title={m.descricao} className="rounded-full border border-mist px-3 py-1 font-mono text-xs text-ink/70 hover:bg-paper" onClick={() => copiar(`{{${m.marcador}}}`, aviso)}>{`{{${m.marcador}}}`}</button>)}
        </div>
      </details>
    </div>
  );
}

// ---------- aba Testes do modelo ----------
function AbaTestes({ est, setEst, biblioteca }: { est: EstruturaModelo; setEst: (e: EstruturaModelo) => void; biblioteca: BibliotecaTeste[] }) {
  const [tipos, setTipos] = useState<TipoAtendimento[]>([]);
  const [catalogo, setCatalogo] = useState<Teste[]>([]);
  useEffect(() => { api.listTiposAtendimento().then(setTipos).catch(() => undefined); api.listTestes().then(setCatalogo).catch(() => undefined); }, []);
  const lista = est.testes ?? [];
  const nomeDe = (sigla: string) => biblioteca.find((b) => b.sigla === sigla)?.nome ?? sigla;
  function doTipo(id: string) {
    const t = tipos.find((x) => x.id === id);
    if (!t) return;
    const siglas = t.testeIds.map((tid) => catalogo.find((c) => c.id === tid)?.sigla).filter((s): s is string => !!s);
    setEst({ ...est, testes: [...new Set([...lista, ...siglas])], tipoAtendimentoId: id });
  }
  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-ink/60">Escolha os testes que fazem parte deste modelo. O editor de documento e a aba Blocos e itens mostram <b>só</b> estes testes, para não haver centenas de opções. Sem nenhum teste escolhido, aparecem todos.</p>
      <div className="rounded-xl border border-mist bg-white p-4">
        <div className="mb-2 text-sm font-semibold text-ink/75">Copiar de um tipo de atendimento</div>
        <select className={inputCls} value="" onChange={(e) => doTipo(e.target.value)}>
          <option value="">Escolha um tipo (acrescenta os testes dele à lista)…</option>
          {tipos.map((t) => <option key={t.id} value={t.id}>{t.nome} — {t.testeIds.length} teste(s)</option>)}
        </select>
      </div>
      <div className="rounded-xl border border-mist bg-white p-4">
        <div className="mb-2 text-sm font-semibold text-ink/75">Testes deste modelo ({lista.length})</div>
        <div className="mb-3 flex flex-wrap gap-2">
          {lista.length === 0 && <span className="text-sm text-ink/45">Nenhum teste escolhido.</span>}
          {lista.map((s) => (
            <span key={s} title={nomeDe(s)} className="inline-flex items-center gap-1.5 rounded-full border border-sage-deep/30 bg-sage-deep/5 px-3 py-1 text-xs font-semibold text-sage-deep">{s}<button aria-label="Remover" className="text-sage-deep/60 hover:text-ember" onClick={() => setEst({ ...est, testes: lista.filter((x) => x !== s) })}>×</button></span>
          ))}
        </div>
        <select className={inputCls} value="" onChange={(e) => e.target.value && setEst({ ...est, testes: [...lista, e.target.value] })}>
          <option value="">+ acrescentar um teste…</option>
          {biblioteca.filter((b) => !lista.includes(b.sigla)).map((b) => <option key={b.sigla} value={b.sigla}>{b.sigla} — {b.nome}</option>)}
        </select>
      </div>
    </div>
  );
}

// ---------- aba Domínios ----------
function AbaDominios({ est, setEst, padrao }: { est: EstruturaModelo; setEst: (e: EstruturaModelo) => void; padrao: DominioPadrao[] }) {
  const temAnalise = est.secoes.some((s) => s.tipo === "analise" && s.ativo !== false);
  const lista: DominioModelo[] = est.dominios?.length ? est.dominios : padrao.map((d) => ({ chave: d.chave }));
  const base = (chave: string) => padrao.find((d) => d.chave === chave);
  const grava = (l: DominioModelo[]) => setEst({ ...est, dominios: l });
  const set = (i: number, parte: Partial<DominioModelo>) => grava(lista.map((d, k) => (k === i ? { ...d, ...parte } : d)));
  const mover = (i: number, d: number) => { const l = [...lista]; [l[i], l[i + d]] = [l[i + d], l[i]]; grava(l); };
  const [novo, setNovo] = useState("");
  const naoListados = padrao.filter((p) => !lista.some((d) => d.chave === p.chave));
  return (
    <div className="space-y-4">
      {!temAnalise && <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">Este modelo não tem a seção de análise por domínios. Adicione-a na aba Estrutura para que os domínios apareçam no laudo.</div>}
      <p className="text-sm leading-relaxed text-ink/60">Domínios são os grupos em que a análise é organizada. Renomeie, reordene, oculte ou crie os seus; a introdução é o texto que abre cada domínio. Os resultados dos testes entram no domínio indicado abaixo (e você acrescenta outros na aba Blocos e itens).</p>
      <div className="space-y-2">
        {lista.map((d, i) => {
          const b = base(d.chave);
          const intro = d.intro !== undefined ? d.intro : b?.intro ?? "";
          return (
            <div key={d.chave} className={`rounded-xl border bg-white p-3 ${d.ativo === false ? "border-dashed border-mist opacity-60" : "border-mist"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <input type="checkbox" className="h-4 w-4" title="Entra no laudo" checked={d.ativo !== false} onChange={(e) => set(i, { ativo: e.target.checked })} />
                <input className="min-w-[12rem] flex-1 rounded-md border border-mist px-2 py-1 text-sm font-semibold" value={d.titulo ?? b?.titulo ?? ""} onChange={(e) => set(i, { titulo: e.target.value })} />
                <button className={botaoMini} disabled={i === 0} onClick={() => mover(i, -1)}>↑</button>
                <button className={botaoMini} disabled={i === lista.length - 1} onClick={() => mover(i, 1)}>↓</button>
                {!b && <button className={`${botaoMini} text-ember`} onClick={() => grava(lista.filter((_, k) => k !== i))}>Remover</button>}
              </div>
              <textarea className={`${inputCls} mt-2`} rows={intro ? 3 : 2} placeholder="Texto de introdução do domínio (opcional)" value={intro} onChange={(e) => set(i, { intro: e.target.value })} />
              {b && b.testes.length > 0 && <p className="mt-1.5 text-xs text-ink/50">O sistema já coloca aqui: {b.testes.join(", ")}.</p>}
              {b && d.intro !== undefined && d.intro !== b.intro && <button className="mt-1 text-xs font-semibold text-sage-deep hover:underline" onClick={() => set(i, { intro: undefined })}>restaurar a introdução padrão</button>}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input className="min-w-[14rem] rounded-lg border border-mist px-3 py-2 text-sm" placeholder="Criar um domínio novo (nome)" value={novo} onChange={(e) => setNovo(e.target.value)} />
        <button className={`${botaoMini} px-3 py-2`} disabled={!novo.trim()} onClick={() => { grava([...lista, { chave: `x-${slug(novo)}`, titulo: novo.trim() }]); setNovo(""); }}>Adicionar domínio</button>
        {naoListados.length > 0 && <button className={`${botaoMini} px-3 py-2`} onClick={() => grava([...lista, ...naoListados.map((d) => ({ chave: d.chave }))])}>Recolocar os domínios que sumiram da lista</button>}
        {est.dominios && <button className="ml-auto text-xs font-semibold text-ink/50 hover:text-ember" onClick={() => setEst({ ...est, dominios: undefined })}>Voltar à lista padrão do sistema</button>}
      </div>
    </div>
  );
}

// ---------- aba Blocos e itens ----------
function AbaBlocos({ est, setEst, padrao, biblioteca: bibliotecaTotal }: { est: EstruturaModelo; setEst: (e: EstruturaModelo) => void; padrao: DominioPadrao[]; biblioteca: BibliotecaTeste[] }) {
  const dominios = (est.dominios?.length ? est.dominios : padrao.map((d): DominioModelo => ({ chave: d.chave }))).filter((d) => d.ativo !== false).map((d) => ({ chave: d.chave, titulo: d.titulo ?? padrao.find((p) => p.chave === d.chave)?.titulo ?? d.chave }));
  const tituloDe = (chave: string) => dominios.find((d) => d.chave === chave)?.titulo ?? chave;
  const biblioteca = est.testes?.length ? bibliotecaTotal.filter((b) => est.testes!.includes(b.sigla)) : bibliotecaTotal;
  const [bloco, setBloco] = useState({ dominio: "", teste: "", tipo: "tabela" as "tabela" | "grafico" | "resultados", ref: "" });
  const [item, setItem] = useState({ dominio: "", teste: "", fonte: "", descricao: "", rotulo: "" });
  const teste = (sigla: string) => biblioteca.find((b) => b.sigla === sigla);
  const blocos = est.blocos ?? [];
  const itens = est.itensExtras ?? [];
  const refs = bloco.tipo === "tabela" ? teste(bloco.teste)?.tabelas ?? [] : bloco.tipo === "grafico" ? teste(bloco.teste)?.graficos ?? [] : [];
  const fontes = teste(item.teste);
  return (
    <div className="space-y-8">
      <section>
        <h3 className="font-serif text-lg text-ink">Tabelas, gráficos e quadros de resultados</h3>
        <p className="mb-3 mt-1 text-sm text-ink/60">Escolha o domínio e o que de cada teste aparece nele. O bloco só entra no laudo se o paciente fez o teste.</p>
        <div className="grid gap-2 rounded-xl border border-mist bg-white p-4 md:grid-cols-[1fr_1fr_9rem_1fr_auto]">
          <select className={inputCls} value={bloco.dominio} onChange={(e) => setBloco({ ...bloco, dominio: e.target.value })}><option value="">Domínio…</option>{dominios.map((d) => <option key={d.chave} value={d.chave}>{d.titulo}</option>)}</select>
          <select className={inputCls} value={bloco.teste} onChange={(e) => setBloco({ ...bloco, teste: e.target.value, ref: "" })}><option value="">Teste…</option>{biblioteca.map((b) => <option key={b.sigla} value={b.sigla}>{b.sigla}</option>)}</select>
          <select className={inputCls} value={bloco.tipo} onChange={(e) => setBloco({ ...bloco, tipo: e.target.value as typeof bloco.tipo, ref: "" })}><option value="tabela">Tabela</option><option value="grafico">Gráfico</option><option value="resultados">Quadro de resultados</option></select>
          <select className={inputCls} disabled={bloco.tipo === "resultados"} value={bloco.ref} onChange={(e) => setBloco({ ...bloco, ref: e.target.value })}><option value="">{bloco.tipo === "resultados" ? "—" : refs.length ? "Todos / o principal" : "Nenhum disponível"}</option>{refs.map((r) => <option key={r} value={r}>{r}</option>)}</select>
          <button className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper disabled:opacity-40" disabled={!bloco.dominio || !bloco.teste} onClick={() => { setEst({ ...est, blocos: [...blocos, { dominio: bloco.dominio, teste: bloco.teste, tipo: bloco.tipo, ref: bloco.ref || undefined }] }); setBloco({ ...bloco, ref: "" }); }}>Colocar</button>
        </div>
        {blocos.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {blocos.map((b, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg border border-mist bg-white px-3 py-2 text-sm">
                <span><b>{b.teste}</b> · {b.tipo === "grafico" ? "gráfico" : b.tipo === "tabela" ? "tabela" : "quadro de resultados"}{b.ref ? ` “${b.ref}”` : ""} <span className="text-ink/50">em {tituloDe(b.dominio)}</span></span>
                <button className={`${botaoMini} text-ember`} onClick={() => setEst({ ...est, blocos: blocos.filter((_, k) => k !== i) })}>Remover</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="font-serif text-lg text-ink">Linhas de resultado</h3>
        <p className="mb-3 mt-1 text-sm text-ink/60">Uma linha como “Subteste Vocabulário, percentil 63% Média”. Escolha o resultado do teste e o domínio em que ele deve aparecer.</p>
        <div className="grid gap-2 rounded-xl border border-mist bg-white p-4 md:grid-cols-2">
          <select className={inputCls} value={item.dominio} onChange={(e) => setItem({ ...item, dominio: e.target.value })}><option value="">Domínio…</option>{dominios.map((d) => <option key={d.chave} value={d.chave}>{d.titulo}</option>)}</select>
          <select className={inputCls} value={item.teste} onChange={(e) => setItem({ ...item, teste: e.target.value, fonte: "", descricao: "" })}><option value="">Teste…</option>{biblioteca.map((b) => <option key={b.sigla} value={b.sigla}>{b.sigla} — {b.nome}</option>)}</select>
          <select className={inputCls} value={item.fonte} onChange={(e) => { const v = e.target.value; const rot = v.startsWith("c:") ? fontes?.campos.find((c) => c.chave === v.slice(2))?.label ?? v.slice(2) : v.slice(2); setItem({ ...item, fonte: v, descricao: item.descricao || rot }); }}>
            <option value="">Resultado do teste…</option>
            {(fontes?.linhas ?? []).length > 0 && <optgroup label="Linhas da tabela de resultados">{fontes!.linhas.map((l) => <option key={`l:${l}`} value={`l:${l}`}>{l}</option>)}</optgroup>}
            {(fontes?.campos ?? []).length > 0 && <optgroup label="Subtestes e índices">{fontes!.campos.map((c) => <option key={`c:${c.chave}`} value={`c:${c.chave}`}>{c.label}</option>)}</optgroup>}
          </select>
          <input className={inputCls} placeholder="Como aparece (ex.: Subteste Vocabulário)" value={item.descricao} onChange={(e) => setItem({ ...item, descricao: e.target.value })} />
          <input className={inputCls} placeholder="Rótulo em negrito (opcional, ex.: Vocabulário)" value={item.rotulo} onChange={(e) => setItem({ ...item, rotulo: e.target.value })} />
          <button className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper disabled:opacity-40" disabled={!item.dominio || !item.teste || !item.fonte || !item.descricao.trim()} onClick={() => { setEst({ ...est, itensExtras: [...itens, { dominio: item.dominio, teste: item.teste, fonte: item.fonte.startsWith("c:") ? { campo: item.fonte.slice(2) } : { linha: item.fonte.slice(2) }, descricao: item.descricao.trim(), rotulo: item.rotulo.trim() || undefined }] }); setItem({ ...item, fonte: "", descricao: "", rotulo: "" }); }}>Colocar</button>
        </div>
        {itens.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {itens.map((it, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg border border-mist bg-white px-3 py-2 text-sm">
                <span>{it.rotulo ? <b>{it.rotulo}: </b> : null}{it.descricao} <span className="text-ink/50">· {it.teste} · em {tituloDe(it.dominio)}</span></span>
                <button className={`${botaoMini} text-ember`} onClick={() => setEst({ ...est, itensExtras: itens.filter((_, k) => k !== i) })}>Remover</button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// ---------- aba Modelo Word ----------
function AbaWord({ modelo, est, marcadores, aviso, recarregar }: { modelo: ModeloLaudo | null; est: EstruturaModelo; marcadores: Array<{ marcador: string; descricao: string }>; aviso: (m: string) => void; recarregar: () => void }) {
  const seletor = useRef<HTMLInputElement>(null);
  const [resultado, setResultado] = useState<{ marcadores: string[]; desconhecidos: string[] } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const podeEnviar = !!modelo && !modelo.sistema;
  async function enviar(f: File) {
    setErro(null);
    try { const r = await api.enviarArquivoWordModelo(modelo!.id, await arquivoParaBase64(f)); setResultado(r); recarregar(); } catch (e) { setErro((e as Error).message); } finally { if (seletor.current) seletor.current.value = ""; }
  }
  async function baixar() {
    try { const r = await api.baixarArquivoWordModelo(modelo!.id); const u = URL.createObjectURL(r.blob); const a = document.createElement("a"); a.href = u; a.download = r.filename; a.click(); URL.revokeObjectURL(u); } catch (e) { setErro((e as Error).message); }
  }
  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed text-ink/60">Se a clínica já tem um papel timbrado ou um documento padrão em Word, envie-o com marcadores como <span className="font-mono text-xs">{"{{paciente.nome}}"}</span> e o sistema preenche. Serve a documentos de texto (declaração, atestado, parecer, relatório curto). Para o laudo com tabelas e gráficos dos testes, use a estrutura do modelo, que gera o documento completo.</p>
      <div className="rounded-xl border border-sage-deep/30 bg-sage-deep/[0.05] p-4">
        <div className="mb-1 text-sm font-semibold text-ink">Como fazer</div>
        <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed text-ink/70">
          <li>Baixe o <b>Word de exemplo</b> abaixo. Ele já tem o guia e, se este modelo tem testes escolhidos, os marcadores prontos de cada um.</li>
          <li>Abra no Word, ponha o seu papel timbrado e o seu texto, e deixe os marcadores onde quer o conteúdo. Tabelas, gráficos e resultados vão <b>sozinhos num parágrafo</b>, por exemplo <span className="font-mono text-xs">{"{{grafico:RAVLT|Quantidade de palavras}}"}</span>.</li>
          <li>Salve o modelo (botão no alto), volte a esta aba e envie o arquivo.</li>
        </ol>
        <button className="mt-3 rounded-lg border border-sage-deep px-4 py-2 text-sm font-semibold text-sage-deep hover:bg-sage-deep/5" onClick={async () => { try { const r = await api.baixarWordDeExemplo(modelo?.id); const u = URL.createObjectURL(r.blob); const a = document.createElement("a"); a.href = u; a.download = r.filename; a.click(); URL.revokeObjectURL(u); } catch (e) { setErro((e as Error).message); } }}>Baixar o Word de exemplo</button>
      </div>
      {!podeEnviar && <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">Salve este modelo com o seu nome primeiro (botão “Salvar como meu modelo”); depois você envia o arquivo Word.</div>}
      {podeEnviar && (
        <div className="rounded-xl border border-mist bg-white p-4">
          <div className="flex flex-wrap items-center gap-3">
            <input ref={seletor} type="file" accept=".docx" className="hidden" onChange={(e) => e.target.files?.[0] && enviar(e.target.files[0])} />
            <button className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper" onClick={() => seletor.current?.click()}>{modelo!.temArquivoWord ? "Trocar o arquivo Word" : "Enviar arquivo Word"}</button>
            {modelo!.temArquivoWord && <><button className="rounded-lg border border-mist px-4 py-2 text-sm font-semibold text-ink/70" onClick={baixar}>Baixar o arquivo atual</button><button className="rounded-lg px-3 py-2 text-sm font-semibold text-ember hover:bg-ember/10" onClick={async () => { await api.removerArquivoWordModelo(modelo!.id); setResultado(null); recarregar(); aviso("Arquivo removido: o laudo volta a usar a estrutura do modelo."); }}>Remover</button></>}
          </div>
          {modelo!.temArquivoWord && <p className="mt-2 text-xs text-sage-deep">Este modelo gera o documento a partir do seu arquivo Word.</p>}
          {erro && <p className="mt-2 text-sm text-ember">{erro}</p>}
          {resultado && (
            <div className="mt-3 text-sm">
              <div>Marcadores encontrados: {resultado.marcadores.length ? resultado.marcadores.map((m) => <span key={m} className="mr-1.5 font-mono text-xs">{`{{${m}}}`}</span>) : "nenhum"}</div>
              {resultado.desconhecidos.length > 0 && <div className="mt-1 text-amber-800">Não reconheço estes marcadores e eles ficarão como estão: {resultado.desconhecidos.map((m) => <span key={m} className="mr-1.5 font-mono text-xs">{`{{${m}}}`}</span>)}</div>}
            </div>
          )}
        </div>
      )}
      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-sage-deep">Marcadores disponíveis</div>
        <div className="flex flex-wrap gap-2">{marcadores.map((m) => <button key={m.marcador} title={m.descricao} className="rounded-full border border-mist px-3 py-1 font-mono text-xs text-ink/70 hover:bg-paper" onClick={() => copiar(`{{${m.marcador}}}`, aviso)}>{`{{${m.marcador}}}`}</button>)}</div>
        <div className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-sage-deep">Texto de cada seção deste modelo</div>
        <div className="flex flex-wrap gap-2">{est.secoes.filter((s) => s.tipo !== "fecho").map((s) => <button key={s.id} title={s.titulo || ROTULO_SECAO[s.tipo]} className="rounded-full border border-mist px-3 py-1 font-mono text-xs text-ink/70 hover:bg-paper" onClick={() => copiar(`{{secao.${s.id}}}`, aviso)}>{`{{secao.${s.id}}}`}</button>)}</div>
      </div>
    </div>
  );
}

// ---------- página ----------
export function EditorModeloLaudo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profissional } = useAuth();
  const { state } = useLocation() as { state: { importacao?: ResultadoImportacaoModelo; estruturaInicial?: EstruturaModelo; aba?: "testes" | "word"; nomeSugerido?: string } | null };
  const novo = id === "novo";
  const importacao = state?.importacao;
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useAviso();
  const [modelo, setModelo] = useState<ModeloLaudo | null>(null);
  const [est, setEst] = useState<EstruturaModelo | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState("PERSONALIZADO");
  const [aba, setAba] = useState<"estrutura" | "testes" | "documento" | "dominios" | "blocos" | "word">("estrutura");
  const [paraClinica, setParaClinica] = useState(false);
  const [tornarPadrao, setTornarPadrao] = useState(true);
  const [marcadores, setMarcadores] = useState<Array<{ marcador: string; descricao: string }>>([]);
  const [tipos, setTipos] = useState<Array<{ valor: string; rotulo: string }>>([]);
  const [padrao, setPadrao] = useState<DominioPadrao[]>([]);
  const [biblioteca, setBiblioteca] = useState<BibliotecaTeste[]>([]);
  const [alterado, setAlterado] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    if (!id || novo) return;
    try { const m = await api.getModeloLaudo(id); setModelo(m); setEst(m.estrutura); setNome(m.sistema ? "" : m.nome); setDescricao(m.descricao ?? ""); setTipo(m.tipo); setAlterado(false); } catch (e) { setErro((e as Error).message); }
  }
  useEffect(() => {
    if (novo) {
      const inicial = importacao?.estrutura ?? state?.estruturaInicial;
      if (!inicial) { navigate("/modelos-laudo", { replace: true }); return; }
      setEst(inicial); setNome(state?.nomeSugerido ?? ""); setAlterado(true); if (state?.aba) setAba(state.aba);
    } else carregar();
    api.marcadoresModelo().then((r) => { setMarcadores(r.marcadores); setTipos(r.tiposDeModelo); }).catch(() => undefined);
    api.dominiosPadraoModelo().then(setPadrao).catch(() => undefined);
    api.bibliotecaModelo().then(setBiblioteca).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const mudar = (e: EstruturaModelo) => { setEst(e); setAlterado(true); };
  const ehAdmin = profissional?.papel === "ADMIN";
  const meu = !!modelo && !modelo.sistema;
  const nomeRepetido = useMemo(() => !!modelo && nome.trim().toLowerCase() === modelo.nome.toLowerCase(), [modelo, nome]);

  async function salvarComo() {
    if (!est) return;
    setErro(null);
    if (nome.trim().length < 2) { setErro("Dê um nome ao seu modelo."); return; }
    if (nomeRepetido) { setErro("Use um nome diferente do modelo original: o original fica intacto e o seu recebe o novo nome."); return; }
    setSalvando(true);
    try {
      const m = await api.criarModeloLaudo({ nome: nome.trim(), tipo, descricao: descricao.trim() || null, origemId: modelo?.id ?? null, escopo: paraClinica ? "clinica" : "profissional", estrutura: est, tornarPadrao });
      setMensagem(`Modelo “${m.nome}” criado${tornarPadrao ? " e definido como seu padrão" : ""}.`);
      navigate(`/modelos-laudo/${m.id}`, { replace: true });
    } catch (e) { setErro((e as Error).message); } finally { setSalvando(false); }
  }
  async function salvar() {
    if (!est || !modelo) return;
    setErro(null); setSalvando(true);
    try { const m = await api.atualizarModeloLaudo(modelo.id, { nome: nome.trim(), tipo, descricao: descricao.trim() || null, estrutura: est }); setModelo(m); setAlterado(false); setMensagem("Modelo salvo."); } catch (e) { setErro((e as Error).message); } finally { setSalvando(false); }
  }

  if (!est) return <div className="px-6 py-10 text-sm text-ink/55">{erro ?? "Carregando o modelo…"}</div>;
  const temDocumento = est.secoes.some((s) => s.tipo === "documento");
  const abas: Array<[typeof aba, string]> = [["estrutura", "Estrutura"], ["testes", "Testes do modelo"], ...(temDocumento ? [["documento", "Documento"] as [typeof aba, string]] : []), ["dominios", "Domínios"], ["blocos", "Blocos e itens"], ["word", "Modelo Word"]];
  const testesDoModelo = est.testes?.length ? biblioteca.filter((b) => est.testes!.includes(b.sigla)) : [];

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-1 text-sm"><Link to="/modelos-laudo" className="font-semibold text-sage-deep hover:underline">← Modelos de laudo</Link></div>
      <h1 className="font-serif text-3xl text-ink">{novo ? (importacao ? "Novo modelo a partir do Word" : "Novo modelo") : modelo?.sistema ? modelo.nome : nome || modelo?.nome}</h1>

      {modelo?.sistema && <div className="mt-3 rounded-xl border border-sage-deep/30 bg-sage-deep/[0.06] px-4 py-3 text-sm leading-relaxed text-ink/75">Este é um modelo do sistema e <b>não é alterado</b>. Você pode mexer à vontade aqui; para guardar, salve com um nome seu. A cópia passa a ser sua e o original continua intacto.{modelo.fonte && <span className="mt-1 block text-xs text-ink/55">{modelo.fonte}</span>}</div>}

      {importacao && novo && (
        <section className="mt-4 rounded-xl border border-mist bg-white p-4">
          <h2 className="mb-2 font-serif text-lg text-ink">O que o sistema entendeu do seu Word</h2>
          <p className="mb-3 text-sm text-ink/60">Confira cada seção. O que não ficou como você queria, ajuste nas abas abaixo antes de salvar.</p>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><tbody>{importacao.secoesLidas.map((s, i) => <tr key={i} className="border-t border-mist"><td className="py-1.5 pr-3 font-semibold">{s.titulo}</td><td className="py-1.5 pr-3 text-ink/70">{ROTULO_SECAO[s.tipo]}</td><td className="py-1.5 text-xs text-ink/45">{s.motivo}</td></tr>)}</tbody></table></div>
          {importacao.marcadoresInseridos.length > 0 && <p className="mt-3 text-sm text-ink/70">Campos comuns trocados por marcadores: {importacao.marcadoresInseridos.map((m, i) => <span key={i} className="mr-1.5 font-mono text-xs">{`{{${m.marcador}}}`}</span>)}</p>}
          {importacao.testesDetectados.length > 0 && <p className="mt-2 text-sm text-ink/70">Testes citados: {importacao.testesDetectados.map((t) => t.sigla).join(", ")}.</p>}
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink/65">{importacao.avisos.map((a, i) => <li key={i}>{a}</li>)}</ul>
        </section>
      )}

      {erro && <div className="mt-4 rounded-xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
      {mensagem && <div className="mt-4 rounded-xl border border-sage-deep/30 bg-sage-deep/10 px-4 py-3 text-sm text-sage-deep">{mensagem}</div>}

      <section className="mt-5 rounded-2xl border border-mist bg-white p-5">
        <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
          <label className="block"><span className={rotuloCls}>{modelo?.sistema || novo ? "Nome do seu modelo" : "Nome do modelo"}</span><input className={inputCls} placeholder={modelo?.sistema ? "Ex.: Laudo da Dra. Ana – avaliação de adultos" : ""} value={nome} onChange={(e) => { setNome(e.target.value); setAlterado(true); }} /></label>
          <label className="block"><span className={rotuloCls}>Tipo de documento</span><select className={inputCls} value={tipo} onChange={(e) => { setTipo(e.target.value); setAlterado(true); }}>{tipos.map((t) => <option key={t.valor} value={t.valor}>{t.rotulo}</option>)}</select></label>
        </div>
        <label className="mt-3 block"><span className={rotuloCls}>Descrição (opcional)</span><input className={inputCls} value={descricao} onChange={(e) => { setDescricao(e.target.value); setAlterado(true); }} /></label>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {meu && <button className="rounded-lg bg-sage-deep px-5 py-2.5 text-sm font-semibold text-paper disabled:opacity-40" disabled={salvando || !alterado} onClick={salvar}>{salvando ? "Salvando…" : "Salvar alterações"}</button>}
          <button className={`rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-40 ${meu ? "border border-sage-deep text-sage-deep" : "bg-sage-deep text-paper"}`} disabled={salvando} onClick={salvarComo}>Salvar como {meu ? "novo" : "meu"} modelo</button>
          <label className="flex items-center gap-2 text-sm text-ink/70"><input type="checkbox" className="h-4 w-4" checked={tornarPadrao} onChange={(e) => setTornarPadrao(e.target.checked)} />Usar como meu padrão</label>
          {ehAdmin && <label className="flex items-center gap-2 text-sm text-ink/70"><input type="checkbox" className="h-4 w-4" checked={paraClinica} onChange={(e) => setParaClinica(e.target.checked)} />Para a clínica toda</label>}
          {modelo && !modelo.ehPadrao && <button className="ml-auto text-sm font-semibold text-sage-deep hover:underline" onClick={async () => { await api.definirModeloPadrao(modelo.id); carregar(); setMensagem(`“${modelo.nome}” é o seu modelo padrão.`); }}>Usar este como padrão</button>}
          {modelo?.ehPadrao && <span className="ml-auto rounded-full bg-sage-deep px-3 py-1 text-xs font-bold text-paper">Meu padrão</span>}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-1 border-b border-mist">
        {abas.map(([k, r]) => <button key={k} onClick={() => setAba(k)} className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold ${aba === k ? "border-sage-deep text-sage-deep" : "border-transparent text-ink/55 hover:text-ink"}`}>{r}</button>)}
      </div>
      <div className="mt-5">
        {aba === "estrutura" && <AbaEstrutura est={est} setEst={mudar} marcadores={marcadores} aviso={setMensagem} />}
        {aba === "testes" && <AbaTestes est={est} setEst={mudar} biblioteca={biblioteca} />}
        {aba === "documento" && (
          <div className="space-y-8">
            {est.secoes.filter((s) => s.tipo === "documento").map((s) => (
              <div key={s.id}>
                {est.secoes.filter((x) => x.tipo === "documento").length > 1 && <div className="mb-2 text-sm font-semibold text-ink/70">{s.titulo || "Documento"}</div>}
                <DocumentoModelo valor={textoDe(s.texto)} onChange={(v) => mudar({ ...est, secoes: est.secoes.map((x) => (x.id === s.id ? { ...x, texto: v } : x)) })} testes={testesDoModelo} marcadores={marcadores} biblioteca={biblioteca} />
              </div>
            ))}
          </div>
        )}
        {aba === "dominios" && <AbaDominios est={est} setEst={mudar} padrao={padrao} />}
        {aba === "blocos" && <AbaBlocos est={est} setEst={mudar} padrao={padrao} biblioteca={biblioteca} />}
        {aba === "word" && <AbaWord modelo={modelo} est={est} marcadores={marcadores} aviso={setMensagem} recarregar={carregar} />}
      </div>
    </div>
  );
}
