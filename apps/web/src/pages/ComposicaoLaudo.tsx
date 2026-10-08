import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PlaceholderBadge } from "../components/PlaceholderBadge";
import { SeletorPaciente } from "../components/SeletorPaciente";
import { useAuth } from "../context/AuthContext";
import { api, type AplicacaoDeTeste, type Clinica, type Laudo, type ModeloLaudo, type Paciente, type Profissional, type SecaoModelo } from "../lib/api";
import { useAviso } from "../lib/aviso";

// Composição do laudo no modelo completo (10 seções): o texto vem do cadastro, dos resultados dos testes e da redação do profissional.
type CampoLaudo = "descricaoDemanda" | "anamnese" | "observacaoClinica" | "procedimento" | "analise" | "referencias";

const ROTULO_BLOCO: Record<string, string> = {
  "tabela:wais-indices": "Tabela dos índices do WAIS-III",
  "grafico:wais-indices": "Gráfico dos índices do WAIS-III",
  "grafico:RAVLT|Quantidade de palavras": "Curva de aprendizagem do RAVLT",
  "grafico:FDT|TEMPO": "Gráfico do FDT",
  "grafico:BPA|": "Gráfico do BPA",
  "grafico:BFP|Perfil do Respondente": "Perfil do BFP",
  "tabela:bai": "Tabela do BAI",
  "tabela:bdi": "Tabela do BDI-II",
  "tabela:srs2": "Tabela do SRS-2",
  "grafico:SRS2|Autorrelato": "Gráfico do SRS-2",
};
// blocos que dá para inserir, conforme os testes lançados
const BLOCOS_POR_TESTE: Array<[RegExp, string[]]> = [
  [/^WAIS-III$/, ["tabela:wais-indices", "grafico:wais-indices"]],
  [/^RAVLT$/, ["grafico:RAVLT|Quantidade de palavras"]],
  [/^FDT$/, ["grafico:FDT|TEMPO"]],
  [/^BPA$/, ["grafico:BPA|"]],
  [/^BFP$/, ["grafico:BFP|Perfil do Respondente"]],
  [/^BAI$/, ["tabela:bai"]],
  [/^BDI-II$/, ["tabela:bdi"]],
  [/^SRS2/, ["tabela:srs2", "grafico:SRS2|Autorrelato"]],
];

const CHAVE_DO_DOMINIO: Record<string, string> = {
  "funções intelectuais": "intelectuais", linguagem: "linguagem", memória: "memoria", "funções executivas": "executivas", "funções atencionais": "atencionais",
  "funções visuoconstrutivas e praxia": "visuoconstrutivas", "aspectos emocionais": "emocionais", "aspectos psicoafetivos": "psicoafetivos", "outras escalas": "outras",
};
function dominiosDaAnalise(analise: string): Array<{ chave: string; titulo: string }> {
  return [...analise.matchAll(/^##\s*(.+)$/gm)].map((m) => ({ titulo: m[1].trim(), chave: CHAVE_DO_DOMINIO[m[1].trim().toLowerCase()] })).filter((d) => !!d.chave);
}

const SECAO_SUGESTOES = /\n*##\s*Sugest[^\n]*\n?/i;
function separarConclusao(texto: string): { conclusao: string; sugestoes: string } {
  const m = SECAO_SUGESTOES.exec(texto);
  if (!m) return { conclusao: texto.trim(), sugestoes: "" };
  return { conclusao: texto.slice(0, m.index).trim(), sugestoes: texto.slice(m.index + m[0].length).trim() };
}
const juntarConclusao = (conclusao: string, sugestoes: string) => (sugestoes.trim() ? `${conclusao.trim()}\n\n## Sugestões e Encaminhamentos\n${sugestoes.trim()}` : conclusao.trim());

function Cartao({ id, numero, titulo, ajuda, preenchido, children, acao }: { id: string; numero: string; titulo: string; ajuda?: string; preenchido?: boolean; children: React.ReactNode; acao?: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-mist bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${preenchido ? "bg-sage-deep text-paper" : "bg-mist text-ink/50"}`}>{preenchido ? "✓" : numero}</span>
          <div>
            <h2 className="font-serif text-lg leading-tight text-ink">{titulo}</h2>
            {ajuda && <p className="mt-0.5 text-xs text-ink/55">{ajuda}</p>}
          </div>
        </div>
        {acao}
      </header>
      {children}
    </section>
  );
}

// Campo de texto do laudo com barra de formatação: **negrito**, "- " marcador e "## " subtítulo (domínio). O resultado aparece formatado na pré-visualização e no Word.
function Texto({ valor, onChange, onSalvar, linhas, placeholder, formatacao }: { valor: string; onChange: (v: string) => void; onSalvar: (v: string) => void; linhas?: number; placeholder?: string; formatacao?: "basica" | "completa" }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const n = linhas ?? Math.min(22, Math.max(4, valor.split("\n").reduce((s, l) => s + Math.max(1, Math.ceil(l.length / 95)), 0) + 1));
  function aplicar(tipo: "negrito" | "marcador" | "subtitulo") {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    let novo = valor;
    if (tipo === "negrito") novo = valor.slice(0, a) + "**" + (valor.slice(a, b) || "texto") + "**" + valor.slice(b);
    else {
      const ini = valor.lastIndexOf("\n", a - 1) + 1;
      const prefixo = tipo === "marcador" ? "- " : "## ";
      novo = valor.slice(0, ini) + (valor.startsWith(prefixo, ini) ? "" : prefixo) + valor.slice(valor.startsWith(prefixo, ini) ? ini + prefixo.length : ini);
    }
    onChange(novo);
    onSalvar(novo);
    requestAnimationFrame(() => el.focus());
  }
  const botao = "rounded-md border border-mist bg-white px-2.5 py-1 text-xs font-semibold text-ink/70 hover:bg-paper";
  return (
    <div>
      {formatacao && (
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <button type="button" className={botao} onMouseDown={(e) => e.preventDefault()} onClick={() => aplicar("negrito")} title="Selecione o trecho e clique">
            <b>N</b> Negrito
          </button>
          <button type="button" className={botao} onMouseDown={(e) => e.preventDefault()} onClick={() => aplicar("marcador")}>• Marcador</button>
          {formatacao === "completa" && <button type="button" className={botao} onMouseDown={(e) => e.preventDefault()} onClick={() => aplicar("subtitulo")} title="Transforma a linha em um título de domínio (7.1, 7.2…)">Título de domínio</button>}
          <span className="text-[11px] text-ink/45">O texto formatado aparece na Pré-visualização.</span>
        </div>
      )}
      <textarea ref={ref} className="w-full resize-y rounded-xl border border-mist bg-paper/60 px-4 py-3 text-[15px] leading-relaxed text-ink outline-none transition-colors focus:border-sage-deep focus:bg-white" rows={n} value={valor} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} onBlur={(e) => onSalvar(e.target.value)} />
    </div>
  );
}

export function ComposicaoLaudo() {
  const { profissional } = useAuth();
  const [searchParams] = useSearchParams();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useAviso();
  const [ocupado, setOcupado] = useState<null | "ia" | "montar" | "previa" | "baixar">(null);

  const [pacienteId, setPacienteId] = useState(searchParams.get("pacienteId") ?? "");
  const [aplicacoes, setAplicacoes] = useState<AplicacaoDeTeste[]>([]);
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [laudoId, setLaudoId] = useState(searchParams.get("laudoId") ?? "");
  const [laudo, setLaudo] = useState<Laudo | null>(null);
  const [novaDemanda, setNovaDemanda] = useState("");

  const [clinica, setClinica] = useState<Clinica | null>(null);
  const [dadosProf, setDadosProf] = useState<Profissional | null>(null);
  const [semMapa, setSemMapa] = useState<string[]>([]);
  const [excluidas, setExcluidas] = useState<Set<string>>(new Set());
  const [aba, setAba] = useState<"editar" | "previa">("editar");
  const [previa, setPrevia] = useState<string | null>(null);
  const [sug, setSug] = useState({ conclusao: "", sugestoes: "" });
  const [modelos, setModelos] = useState<ModeloLaudo[]>([]);
  const [modeloNovo, setModeloNovo] = useState("");
  const [modeloExtra, setModeloExtra] = useState<ModeloLaudo | null>(null); // modelo já apagado que o laudo ainda usa

  useEffect(() => { api.listPacientes().then(setPacientes).catch((e) => setErro(e.message)); api.listModelosLaudo().then(setModelos).catch(() => undefined); }, []);
  useEffect(() => {
    if (!profissional) return;
    api.getClinica(profissional.clinicaId).then(setClinica).catch(() => undefined);
    api.getProfissional(profissional.id).then(setDadosProf).catch(() => undefined);
  }, [profissional]);

  useEffect(() => {
    if (!pacienteId) { setLaudos([]); setLaudoId(""); setAplicacoes([]); return; }
    api.listLaudos(pacienteId).then(setLaudos).catch((e) => setErro(e.message));
    api.listAplicacoesPorPaciente(pacienteId).then(setAplicacoes).catch((e) => setErro(e.message));
  }, [pacienteId]);

  useEffect(() => {
    const l = laudos.find((x) => x.id === laudoId) ?? null;
    setLaudo(l);
    if (l) setSug(separarConclusao(l.conclusao));
    setPrevia(null);
    setAba("editar");
  }, [laudoId, laudos]);

  const paciente = pacientes.find((p) => p.id === pacienteId);
  const padraoId = modelos.find((m) => m.ehPadrao)?.id ?? "sistema-laudo-neuro";
  const idModelo = laudo?.modeloId ?? padraoId;
  useEffect(() => { // laudo que ainda usa um modelo apagado: busca-o para mostrar a estrutura certa
    setModeloExtra(null);
    if (laudo?.modeloId && modelos.length && !modelos.some((m) => m.id === laudo.modeloId)) api.getModeloLaudo(laudo.modeloId).then(setModeloExtra).catch(() => undefined);
  }, [laudo?.modeloId, modelos]);
  const modeloAtual = modelos.find((m) => m.id === idModelo) ?? modeloExtra ?? modelos.find((m) => m.id === "sistema-laudo-neuro") ?? null;
  const secoesModelo = (modeloAtual?.estrutura.secoes ?? []).filter((s) => s.ativo !== false && !["fecho", "aviso_sigilo", "aviso_validade", "aviso_ia"].includes(s.tipo));
  const montavel = secoesModelo.some((s) => ["instrumentos", "analise", "referencias"].includes(s.tipo));
  const extras = laudo?.secoesExtras ?? {};
  const contemPlaceholder = aplicacoes.some((a) => a.teste.isPlaceholder);
  const blocosDisponiveis = useMemo(() => {
    const siglas = new Set(aplicacoes.map((a) => a.teste.sigla));
    const out: string[] = [];
    for (const [re, blocos] of BLOCOS_POR_TESTE) if ([...siglas].some((s) => re.test(s))) out.push(...blocos);
    return out;
  }, [aplicacoes]);
  const blocosNoTexto = useMemo(() => [...(laudo?.analise ?? "").matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1]).filter((b) => !b.startsWith("interpretacao:")), [laudo?.analise]);
  const dominios = useMemo(() => dominiosDaAnalise(laudo?.analise ?? ""), [laudo?.analise]);
  const temEspacos = (laudo?.analise ?? "").includes("[[interpretacao:");

  function atualizarLaudo(l: Laudo) {
    setLaudo(l);
    setLaudos((prev) => prev.map((x) => (x.id === l.id ? l : x)));
  }
  async function executar<T>(tipo: typeof ocupado, fn: () => Promise<T>, ok?: string): Promise<T | undefined> {
    setErro(null); setMensagem(null); setOcupado(tipo);
    try { const r = await fn(); if (ok) setMensagem(ok); return r; } catch (e) { setErro((e as Error).message); } finally { setOcupado(null); }
  }

  async function criarLaudo() {
    if (!paciente || !profissional || !novaDemanda.trim()) return;
    const criado = await executar(null, () => api.createLaudo({ pacienteId: paciente.id, identificacao: { paciente: paciente.nome, profissional: profissional.nome }, descricaoDemanda: novaDemanda.trim(), procedimento: "", modeloId: modeloNovo || undefined }));
    if (!criado) return;
    setLaudos((prev) => [criado, ...prev]);
    setLaudoId(criado.id);
    setNovaDemanda("");
    setModeloNovo("");
  }
  async function salvar(chave: CampoLaudo | "conclusao", valor: string) {
    if (!laudo || laudo[chave as keyof Laudo] === valor) return;
    const atualizado = await executar(null, () => api.updateLaudo(laudo.id, { [chave]: valor } as Partial<Laudo>));
    if (atualizado) { atualizarLaudo(atualizado); setPrevia(null); }
  }
  const salvarConclusao = (c: string, s: string) => salvar("conclusao", juntarConclusao(c, s));
  const editar = (chave: CampoLaudo, v: string) => laudo && setLaudo({ ...laudo, [chave]: v });

  async function montar() {
    if (!laudo) return;
    if (laudo.analise.trim() && !confirm("Montar de novo vai substituir os instrumentos, a análise e as referências atuais (a conclusão não muda). Continuar?")) return;
    const ids = aplicacoes.filter((a) => !excluidas.has(a.id)).map((a) => a.id);
    const r = await executar("montar", () => api.montarEstruturaLaudo(laudo.id, ids), "Análise montada a partir dos resultados. Revise e complete com sua interpretação.");
    if (r) { atualizarLaudo(r.laudo); setSemMapa(r.semMapa); setPrevia(null); }
  }
  async function montarAnamnese() {
    if (!laudo) return;
    if (laudo.anamnese.trim() && !confirm("Montar a partir da ficha vai substituir o texto atual da anamnese. Continuar?")) return;
    const r = await executar(null, () => api.montarAnamneseLaudo(laudo.id), "Anamnese montada a partir da ficha do paciente. Revise e complete.");
    if (r) { atualizarLaudo(r); setPrevia(null); }
  }
  const interp = (chave: string) => laudo?.interpretacoes?.[chave] ?? "";
  function editarInterp(chave: string, v: string) { if (laudo) setLaudo({ ...laudo, interpretacoes: { ...(laudo.interpretacoes ?? {}), [chave]: v } }); }
  async function salvarInterp(chave: string, v: string) {
    if (!laudo) return;
    const r = await executar(null, () => api.updateLaudo(laudo.id, { interpretacoes: { ...(laudo.interpretacoes ?? {}), [chave]: v } }));
    if (r) { atualizarLaudo(r); setPrevia(null); }
  }
  async function rascunhoIA() {
    if (!laudo) return;
    const r = await executar("ia", () => api.gerarRascunho(laudo.id), "Rascunho da conclusão gerado. Revise antes de finalizar.");
    if (r) { atualizarLaudo(r); setSug(separarConclusao(r.conclusao)); setPrevia(null); }
  }
  async function verPrevia() {
    if (!laudo) return;
    setAba("previa");
    if (previa) return;
    const r = await executar("previa", () => api.previaLaudo(laudo.id));
    if (r) setPrevia(r.html);
  }
  async function baixar() {
    if (!laudo) return;
    const r = await executar("baixar", () => api.exportarLaudoDocx(laudo.id));
    if (!r) return;
    const url = URL.createObjectURL(r.blob);
    const a = document.createElement("a"); a.href = url; a.download = r.filename; a.click(); URL.revokeObjectURL(url);
  }
  async function alternarRevisao(v: boolean) { if (!laudo) return; const l = await executar(null, () => api.updateLaudo(laudo.id, { iaRevisadaPeloProf: v })); if (l) atualizarLaudo(l); }
  async function finalizar() { if (!laudo) return; const l = await executar(null, () => api.updateLaudo(laudo.id, { status: "FINALIZADO" }), "Laudo finalizado."); if (l) atualizarLaudo(l); }

  function inserirBloco(token: string) {
    if (!laudo || !token) return;
    const novo = `${laudo.analise.trimEnd()}\n[[${token}]]`;
    setLaudo({ ...laudo, analise: novo });
    salvar("analise", novo);
  }
  function removerBloco(token: string) {
    if (!laudo) return;
    const novo = laudo.analise.replace(new RegExp(`\\n?\\[\\[${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]\\]`), "");
    setLaudo({ ...laudo, analise: novo });
    salvar("analise", novo);
  }

  const checklist = [
    { ok: !!clinica?.logoUrl, texto: "Logotipo da clínica", onde: "/clinica" },
    { ok: !!clinica?.marcaDaguaUrl, texto: "Marca-d'água (opcional)", onde: "/clinica", opcional: true },
    { ok: !!dadosProf?.temAssinatura, texto: "Assinatura do profissional", onde: profissional ? `/profissionais/${profissional.id}` : "/profissionais" },
    { ok: !!paciente?.cpf, texto: "CPF do paciente", onde: paciente ? `/pacientes/${paciente.id}` : "/pacientes" },
  ];
  // ---- seções na ordem e com os títulos do modelo escolhido ----
  const bonito = (t: string) => (t && t === t.toUpperCase() ? t.charAt(0) + t.slice(1).toLowerCase() : t);
  const titulados = secoesModelo.filter((s) => s.titulo);
  const numeroDe = (s: SecaoModelo) => (modeloAtual?.estrutura.numerar && s.titulo ? String(titulados.indexOf(s) + 1) : "•");
  const textoFixo = (s: SecaoModelo) => (Array.isArray(s.texto) ? s.texto.join("\n\n") : s.texto ?? "");
  const valorLivre = (s: SecaoModelo) => (extras[s.id] !== undefined ? extras[s.id] : textoFixo(s));
  const editarExtra = (id: string, v: string) => laudo && setLaudo({ ...laudo, secoesExtras: { ...extras, [id]: v } });
  async function salvarExtra(id: string, v: string) {
    if (!laudo) return;
    const r = await executar(null, () => api.updateLaudo(laudo.id, { secoesExtras: { ...(laudo.secoesExtras ?? {}), [id]: v } }));
    if (r) { atualizarLaudo(r); setPrevia(null); }
  }
  async function trocarModelo(id: string) {
    if (!laudo) return;
    const r = await executar(null, () => api.updateLaudo(laudo.id, { modeloId: id || null }), "Modelo do laudo alterado. Os textos já escritos foram mantidos.");
    if (r) { atualizarLaudo(r); setPrevia(null); }
  }
  const preenchidoDe = (s: SecaoModelo): boolean => {
    if (!laudo) return false;
    switch (s.tipo) {
      case "demanda": return !!laudo.descricaoDemanda.trim();
      case "anamnese": return !!laudo.anamnese.trim();
      case "observacao": return !!laudo.observacaoClinica.trim();
      case "instrumentos": return !!laudo.procedimento.trim();
      case "analise": return !!laudo.analise.trim();
      case "conclusao": return !!sug.conclusao.trim();
      case "sugestoes": return !!sug.sugestoes.trim();
      case "referencias": return !!laudo.referencias.trim();
      case "livre": case "documento": return !!valorLivre(s).trim();
      case "identificacao": return (s.identificacao ?? []).every((b) => b.tipo !== "campos" || (b.campos ?? []).every((c) => !!(extras[c.id] ?? "").trim()));
      default: return true;
    }
  };
  const secoes: Array<[string, string, boolean]> = laudo ? titulados.map((s) => [s.id, `${numeroDe(s)}. ${bonito(s.titulo)}`, preenchidoDe(s)]) : [];

  function renderSecao(s: SecaoModelo): React.ReactNode {
    if (!laudo) return null;
    const num = numeroDe(s), titulo = bonito(s.titulo), ajuda = s.orientacao;
    switch (s.tipo) {
      case "identificacao":
        return (
          <Cartao key={s.id} id={s.id} numero={num} titulo={titulo} ajuda={ajuda ?? "Preenchida sozinha a partir dos cadastros. Confira o que falta para o papel timbrado ficar completo."} preenchido={preenchidoDe(s)}>
            {(s.identificacao ?? []).filter((b) => b.tipo === "campos").map((b, i) => (
              <div key={i} className="mb-4 grid gap-3 sm:grid-cols-2">
                {(b.campos ?? []).map((c) => (
                  <label key={c.id} className="block text-sm">
                    <span className="mb-1 block font-semibold text-ink/70">{c.rotulo}</span>
                    <input className="w-full rounded-lg border border-mist bg-paper/60 px-3 py-2 text-sm outline-none focus:border-sage-deep focus:bg-white" value={extras[c.id] ?? ""} onChange={(e) => editarExtra(c.id, e.target.value)} onBlur={(e) => salvarExtra(c.id, e.target.value)} />
                  </label>
                ))}
              </div>
            ))}
            <ul className="grid gap-2 sm:grid-cols-2">
              {checklist.map((c) => (
                <li key={c.texto} className="flex items-center justify-between rounded-lg border border-mist px-3 py-2 text-sm">
                  <span className="flex items-center gap-2"><span className={c.ok ? "text-sage-deep" : c.opcional ? "text-ink/30" : "text-ember"}>{c.ok ? "✓" : "○"}</span>{c.texto}</span>
                  {!c.ok && <Link to={c.onde} className="text-xs font-semibold text-sage-deep hover:underline">preencher</Link>}
                </li>
              ))}
            </ul>
          </Cartao>
        );
      case "demanda":
        return <Cartao key={s.id} id={s.id} numero={num} titulo={titulo} ajuda={ajuda} preenchido={preenchidoDe(s)}><Texto valor={laudo.descricaoDemanda} onChange={(v) => editar("descricaoDemanda", v)} onSalvar={(v) => salvar("descricaoDemanda", v)} /></Cartao>;
      case "anamnese":
        return (
          <Cartao key={s.id} id={s.id} numero={num} titulo={titulo} ajuda={ajuda ?? "Preencha o formulário na ficha do paciente e monte o texto aqui; depois escreva o que quiser por cima."} preenchido={preenchidoDe(s)}
            acao={<div className="flex items-center gap-2">{paciente && <Link to={`/pacientes/${paciente.id}`} className="text-xs font-semibold text-ink/55 hover:text-sage-deep">abrir ficha</Link>}<button className="rounded-lg border border-sage-deep px-3 py-1.5 text-xs font-semibold text-sage-deep hover:bg-sage-deep/5 disabled:opacity-50" disabled={ocupado !== null} onClick={montarAnamnese}>Montar a partir da ficha</button></div>}>
            <Texto formatacao="basica" valor={laudo.anamnese} onChange={(v) => editar("anamnese", v)} onSalvar={(v) => salvar("anamnese", v)} placeholder="Escreva em parágrafos. Linhas em branco separam os parágrafos no laudo." />
          </Cartao>
        );
      case "observacao":
        return <Cartao key={s.id} id={s.id} numero={num} titulo={titulo} ajuda={ajuda} preenchido={preenchidoDe(s)}><Texto valor={laudo.observacaoClinica} onChange={(v) => editar("observacaoClinica", v)} onSalvar={(v) => salvar("observacaoClinica", v)} linhas={4} /></Cartao>;
      case "instrumentos":
        return (
          <Cartao key={s.id} id={s.id} numero={num} titulo={titulo} ajuda={ajuda ?? "Montados com os testes lançados. Edite à vontade."} preenchido={preenchidoDe(s)}>
            <div className="mb-3 rounded-xl bg-paper px-4 py-3">
              <div className="mb-1.5 text-xs font-semibold text-ink/60">Testes que entram na montagem automática</div>
              <div className="flex flex-wrap gap-2">
                {aplicacoes.length === 0 && <span className="text-xs text-ink/50">Este paciente ainda não tem testes lançados.</span>}
                {aplicacoes.map((a) => {
                  const fora = excluidas.has(a.id);
                  return (
                    <button key={a.id} onClick={() => setExcluidas((st) => { const n = new Set(st); fora ? n.delete(a.id) : n.add(a.id); return n; })} className={`rounded-full border px-3 py-1 text-xs font-semibold ${fora ? "border-mist text-ink/35 line-through" : "border-sage-deep/40 bg-white text-sage-deep"}`}>
                      {a.teste.sigla} · {new Date(a.criadoEm).toLocaleDateString("pt-BR")}
                    </button>
                  );
                })}
              </div>
            </div>
            <Texto formatacao="basica" valor={laudo.procedimento} onChange={(v) => editar("procedimento", v)} onSalvar={(v) => salvar("procedimento", v)} />
          </Cartao>
        );
      case "referencial":
        return <Cartao key={s.id} id={s.id} numero={num} titulo={titulo} ajuda={ajuda ?? `Texto padrão do modelo${s.classificacao ? ", com a tabela de classificação por percentil do seu Perfil de Atuação" : ""}.`} preenchido><p className="text-sm text-ink/55">Incluído automaticamente no laudo.</p></Cartao>;
      case "texto":
        return <Cartao key={s.id} id={s.id} numero={num} titulo={titulo || "Texto do modelo"} ajuda={ajuda ?? "Texto fixo do modelo, igual em todos os laudos."} preenchido><p className="whitespace-pre-line text-sm leading-relaxed text-ink/60">{textoFixo(s)}</p></Cartao>;
      case "livre":
      case "documento":
        return (
          <Cartao key={s.id} id={s.id} numero={num} titulo={titulo || "Texto do documento"} ajuda={ajuda ?? "Parte do modelo; ajuste para este paciente. Trechos como {{paciente.nome}} são trocados pelos dados ao gerar o documento."} preenchido={preenchidoDe(s)}
            acao={extras[s.id] !== undefined ? <button className="text-xs font-semibold text-ink/55 hover:text-sage-deep" onClick={() => { editarExtra(s.id, textoFixo(s)); salvarExtra(s.id, textoFixo(s)); }}>voltar ao texto do modelo</button> : undefined}>
            <Texto valor={valorLivre(s)} onChange={(v) => editarExtra(s.id, v)} onSalvar={(v) => salvarExtra(s.id, v)} />
          </Cartao>
        );
      case "analise":
        return (
          <Cartao key={s.id} id={s.id} numero={num} titulo={titulo} ajuda={ajuda ?? 'Cada "## Título" vira um domínio (7.1, 7.2…). As linhas com resultado vêm dos testes; escreva a sua interpretação entre elas.'} preenchido={preenchidoDe(s)}>
            {semMapa.length > 0 && <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">Ainda sem linha automática no laudo: {semMapa.join(", ")}. Escreva a interpretação desses testes à mão.</div>}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {blocosNoTexto.map((b) => (
                <span key={b} className="inline-flex items-center gap-1.5 rounded-full border border-sage-deep/30 bg-sage-deep/5 px-3 py-1 text-xs font-semibold text-sage-deep">
                  {b.startsWith("grafico") ? "📊" : "▦"} {ROTULO_BLOCO[b] ?? b}
                  <button aria-label="Remover" className="text-sage-deep/60 hover:text-ember" onClick={() => removerBloco(b)}>×</button>
                </span>
              ))}
              {blocosDisponiveis.filter((b) => !blocosNoTexto.includes(b)).length > 0 && (
                <select className="rounded-full border border-dashed border-ink/25 bg-white px-3 py-1 text-xs font-semibold text-ink/60" value="" onChange={(e) => inserirBloco(e.target.value)}>
                  <option value="">+ inserir tabela ou gráfico</option>
                  {blocosDisponiveis.filter((b) => !blocosNoTexto.includes(b)).map((b) => <option key={b} value={b}>{ROTULO_BLOCO[b] ?? b}</option>)}
                </select>
              )}
            </div>
            {dominios.length > 0 && (
              <div className="mb-4 rounded-xl border border-sage-deep/25 bg-sage-deep/[0.03] p-4">
                <div className="mb-1 text-sm font-semibold text-ink">Sua interpretação por domínio</div>
                <p className="mb-3 text-xs text-ink/55">{temEspacos ? "O que você escrever aqui entra no fim de cada domínio e não se perde ao montar de novo." : "Clique em “Montar a partir dos resultados” para criar o espaço de cada domínio no laudo."}</p>
                <div className="space-y-3">
                  {dominios.map((d) => (
                    <label key={d.chave} className="block text-sm">
                      <span className="mb-1 block font-semibold text-ink/70">{d.titulo}</span>
                      <textarea className="w-full resize-y rounded-lg border border-mist bg-white px-3 py-2 text-sm leading-relaxed outline-none focus:border-sage-deep" rows={2} placeholder="Interpretação clínica deste domínio (opcional)" value={interp(d.chave)} onChange={(e) => editarInterp(d.chave, e.target.value)} onBlur={(e) => salvarInterp(d.chave, e.target.value)} />
                    </label>
                  ))}
                </div>
              </div>
            )}
            <Texto formatacao="completa" valor={laudo.analise} onChange={(v) => editar("analise", v)} onSalvar={(v) => salvar("analise", v)} linhas={Math.min(30, Math.max(8, laudo.analise.split("\n").length + 1))} placeholder='Clique em "Montar a partir dos resultados" para começar.' />
          </Cartao>
        );
      case "conclusao":
        return (
          <Cartao key={s.id} id={s.id} numero={num} titulo={titulo} ajuda={ajuda ?? "Síntese dos achados com a anamnese e a hipótese diagnóstica (com CID), sempre para validação médica."} preenchido={preenchidoDe(s)}
            acao={<button className="rounded-lg border border-ink/20 px-3 py-1.5 text-xs font-semibold text-ink/70 hover:bg-paper disabled:opacity-50" disabled={ocupado !== null} onClick={rascunhoIA}>{ocupado === "ia" ? "Gerando…" : "✨ Rascunho com IA"}</button>}>
            <Texto formatacao="basica" valor={sug.conclusao} onChange={(v) => setSug((st) => ({ ...st, conclusao: v }))} onSalvar={(v) => salvarConclusao(v, sug.sugestoes)} />
            <label className="mt-4 block text-sm">
              <span className="mb-1 block font-semibold text-ink/70">Hipótese diagnóstica (com CID) <span className="font-normal text-ink/45">entra no fim da conclusão, com o título em negrito</span></span>
              <textarea className="w-full resize-y rounded-xl border border-mist bg-paper/60 px-4 py-3 text-[15px] leading-relaxed outline-none focus:border-sage-deep focus:bg-white" rows={3} placeholder="Ex.: Os resultados são compatíveis com …, conforme os critérios do (CID-11: …)." value={laudo.hipoteseDiagnostica} onChange={(e) => setLaudo({ ...laudo, hipoteseDiagnostica: e.target.value })} onBlur={(e) => salvar("hipoteseDiagnostica" as never, e.target.value)} />
            </label>
            {laudo.iaUtilizada && <p className="mt-2 text-xs text-ink/55">Parte deste laudo teve rascunho de IA. A revisão é obrigatória e o aviso entra no documento (Res. CFP 09/2024).</p>}
          </Cartao>
        );
      case "sugestoes":
        return <Cartao key={s.id} id={s.id} numero={num} titulo={titulo} ajuda={ajuda ?? 'Uma por linha, começando com "- ".'} preenchido={preenchidoDe(s)}><Texto valor={sug.sugestoes} onChange={(v) => setSug((st) => ({ ...st, sugestoes: v }))} onSalvar={(v) => salvarConclusao(sug.conclusao, v)} linhas={6} /></Cartao>;
      case "referencias":
        return <Cartao key={s.id} id={s.id} numero={num} titulo={titulo} ajuda={ajuda ?? "Uma por teste usado (montadas sozinhas)."} preenchido={preenchidoDe(s)}><Texto valor={laudo.referencias} onChange={(v) => editar("referencias", v)} onSalvar={(v) => salvar("referencias", v)} /></Cartao>;
      default:
        return null;
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-ink">Laudos e documentos</h1>
        <p className="mt-1 text-sm text-ink/60">Laudo, relatório, parecer, declaração ou atestado no modelo que você escolher, com os dados do cadastro e os resultados dos testes.</p>
      </div>

      {erro && <div className="mb-4 rounded-xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
      {mensagem && <div className="mb-4 rounded-xl border border-sage-deep/30 bg-sage-deep/10 px-4 py-3 text-sm text-sage-deep">{mensagem}</div>}

      <section className="mb-6 grid gap-4 rounded-2xl border border-mist bg-white p-5 md:grid-cols-[1fr_1fr]">
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-wide text-sage-deep">Paciente</div>
          <SeletorPaciente pacientes={pacientes} value={pacienteId} onChange={(id) => { setPacienteId(id); setLaudoId(""); }} />
          {paciente && <Link to={`/pacientes/${paciente.id}`} className="mt-2 inline-block text-xs text-sage-deep hover:underline">Ver ficha de {paciente.nome}</Link>}
          {pacienteId && contemPlaceholder && <div className="mt-2"><PlaceholderBadge /></div>}
        </div>
        {pacienteId && (
          <div>
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-sage-deep">Laudo</div>
            <select className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm" value={laudoId} onChange={(e) => setLaudoId(e.target.value)}>
              <option value="">{laudos.length ? "Escolha um laudo…" : "Nenhum laudo ainda"}</option>
              {laudos.map((l) => <option key={l.id} value={l.id}>{new Date(l.criadoEm).toLocaleDateString("pt-BR")} — {l.status === "FINALIZADO" ? "finalizado" : "em elaboração"}</option>)}
            </select>
            <div className="mt-2 flex gap-2">
              <input className="flex-1 rounded-lg border border-mist bg-paper px-3 py-2 text-sm" placeholder="Para criar um novo: descreva a demanda…" value={novaDemanda} onChange={(e) => setNovaDemanda(e.target.value)} />
              <button className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper disabled:opacity-40" disabled={!novaDemanda.trim()} onClick={criarLaudo}>Criar</button>
            </div>
            <label className="mt-2 flex items-center gap-2 text-xs text-ink/60">Modelo do novo documento
              <select className="min-w-0 flex-1 rounded-lg border border-mist bg-paper px-2 py-1.5 text-sm text-ink" value={modeloNovo} onChange={(e) => setModeloNovo(e.target.value)}>
                <option value="">{`Meu padrão${modelos.find((m) => m.ehPadrao) ? ` (${modelos.find((m) => m.ehPadrao)!.nome})` : ""}`}</option>
                {modelos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </label>
          </div>
        )}
      </section>

      {laudo && (
        <div className="grid items-start gap-6 lg:grid-cols-[210px_1fr]">
          <nav className="sticky top-20 hidden rounded-2xl border border-mist bg-white p-3 lg:block">
            <div className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wide text-ink/45">Seções</div>
            {secoes.map(([id, rot, ok]) => (
              <a key={id} href={`#${id}`} onClick={() => setAba("editar")} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink/75 hover:bg-paper">
                <span className={`h-2 w-2 shrink-0 rounded-full ${ok ? "bg-sage-deep" : "bg-mist"}`} />{rot}
              </a>
            ))}
          </nav>

          <div className="min-w-0 space-y-5">
            <div className="sticky top-2 z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-mist bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
              <div className="inline-flex rounded-full border border-mist p-0.5 text-sm font-semibold">
                <button className={`rounded-full px-4 py-1.5 ${aba === "editar" ? "bg-ink text-paper" : "text-ink/60"}`} onClick={() => setAba("editar")}>Editar</button>
                <button className={`rounded-full px-4 py-1.5 ${aba === "previa" ? "bg-ink text-paper" : "text-ink/60"}`} onClick={verPrevia}>Pré-visualizar</button>
              </div>
              <span className="ml-1 rounded-full bg-paper px-3 py-1 text-xs font-semibold text-ink/60">{laudo.status === "FINALIZADO" ? "Finalizado" : "Em elaboração"}</span>
              <label className="flex items-center gap-1.5 text-xs text-ink/60">Modelo
                <select className="max-w-[16rem] rounded-lg border border-mist bg-paper px-2 py-1.5 text-sm text-ink" value={idModelo} disabled={ocupado !== null || laudo.status === "FINALIZADO"} onChange={(e) => trocarModelo(e.target.value === padraoId && !laudo.modeloId ? "" : e.target.value)}>
                  {modeloExtra && <option value={modeloExtra.id}>{modeloExtra.nome} (apagado)</option>}
                  {modelos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </label>
              {modeloAtual && <Link to={`/modelos-laudo/${modeloAtual.id}`} className="text-xs font-semibold text-sage-deep hover:underline">editar este modelo</Link>}
              <div className="ml-auto flex flex-wrap gap-2">
                {montavel && <button className="rounded-lg border border-sage-deep px-4 py-2 text-sm font-semibold text-sage-deep disabled:opacity-50" disabled={ocupado !== null} onClick={montar}>{ocupado === "montar" ? "Montando…" : "Montar a partir dos resultados"}</button>}
                <button className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper disabled:opacity-50" disabled={ocupado !== null} onClick={baixar}>{ocupado === "baixar" ? "Gerando…" : "Baixar em Word"}</button>
              </div>
            </div>

            {aba === "previa" ? (
              <div className="rounded-2xl border border-mist bg-[#e9e6df] p-4 sm:p-8">
                {ocupado === "previa" || previa === null ? <p className="py-20 text-center text-sm text-ink/55">Montando a pré-visualização…</p> : <article className="laudo-previa mx-auto max-w-[820px] bg-white px-10 py-12 shadow-lg" dangerouslySetInnerHTML={{ __html: previa }} />}
                <p className="mt-4 text-center text-xs text-ink/50">Prévia do conteúdo. O papel timbrado (logotipo, marca-d'água e rodapé) aparece no arquivo Word.</p>
              </div>
            ) : (
              <>
                {secoesModelo.map((s) => renderSecao(s))}

                <section className="rounded-2xl border border-mist bg-white p-6">
                  <h2 className="mb-3 font-serif text-lg text-ink">Finalizar</h2>
                  <label className="mb-4 flex items-start gap-3 text-sm text-ink/80">
                    <input type="checkbox" className="mt-1 h-4 w-4" checked={laudo.iaRevisadaPeloProf} onChange={(e) => alternarRevisao(e.target.checked)} />
                    <span>Li e revisei todo o texto, inclusive o que foi montado ou redigido com apoio automático, e assumo a responsabilidade técnica pelo conteúdo.</span>
                  </label>
                  <button className="rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-paper disabled:opacity-40" disabled={(laudo.iaUtilizada && !laudo.iaRevisadaPeloProf) || laudo.status === "FINALIZADO" || ocupado !== null} onClick={finalizar}>{laudo.status === "FINALIZADO" ? "Laudo finalizado" : "Finalizar laudo"}</button>
                </section>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
