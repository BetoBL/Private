import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, type FormularioDetalhe, type FormularioResumo, type ModeloForm, type PerguntaForm, type RespostasForm, type TipoPergunta } from "../lib/api";
import { CamposFormulario, respostaEmTexto } from "./CamposFormulario";

// Aba "Formulários" da ficha (serve a qualquer profissional): biblioteca de modelos (do sistema e próprios, copiáveis e editáveis),
// pedir ao paciente por link ou preencher na sessão, e ler as respostas.

const dataBr = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const ROTULO_TIPO: Record<TipoPergunta, string> = { texto: "Texto livre", escolha: "Uma opção", multipla: "Várias opções", escala: "Escala numérica", sim_nao: "Sim ou não", data: "Data" };

interface Rascunho { ref: string | null; nome: string; descricao: string; tipo: "ANAMNESE" | "FORMULARIO"; perguntas: PerguntaForm[] }

function EditorModelo({ inicial, onSalvar, onCancelar }: { inicial: Rascunho; onSalvar: (r: Rascunho) => void; onCancelar: () => void }) {
  const [r, setR] = useState<Rascunho>(inicial);
  const altera = (i: number, p: Partial<PerguntaForm>) => setR({ ...r, perguntas: r.perguntas.map((q, k) => (k === i ? { ...q, ...p } : q)) });
  const mover = (i: number, d: -1 | 1) => { const j = i + d; if (j < 0 || j >= r.perguntas.length) return; const l = [...r.perguntas]; [l[i], l[j]] = [l[j], l[i]]; setR({ ...r, perguntas: l }); };
  return (
    <div className="rounded-xl border border-sage-deep/30 bg-white p-5">
      <h3 className="mb-3 font-serif text-lg text-ink">{r.ref ? "Editar modelo" : "Novo modelo"}</h3>
      <div className="grid gap-3 md:grid-cols-[1fr_200px]">
        <label className="text-sm"><span className="mb-1 block text-xs font-semibold text-ink/60">Nome</span><input className="w-full rounded-lg border border-mist px-3 py-2" maxLength={120} value={r.nome} onChange={(e) => setR({ ...r, nome: e.target.value })} /></label>
        <label className="text-sm"><span className="mb-1 block text-xs font-semibold text-ink/60">Tipo</span><select className="w-full rounded-lg border border-mist px-3 py-2" value={r.tipo} onChange={(e) => setR({ ...r, tipo: e.target.value as Rascunho["tipo"] })}><option value="ANAMNESE">Anamnese</option><option value="FORMULARIO">Formulário</option></select></label>
      </div>
      <label className="mt-3 block text-sm"><span className="mb-1 block text-xs font-semibold text-ink/60">Descrição (só para você)</span><input className="w-full rounded-lg border border-mist px-3 py-2" maxLength={400} value={r.descricao} onChange={(e) => setR({ ...r, descricao: e.target.value })} /></label>
      <div className="mt-4 space-y-3">
        {r.perguntas.map((p, i) => (
          <div key={i} className="rounded-lg border border-mist p-3">
            <div className="flex flex-wrap gap-2">
              <span className="w-6 pt-2 text-sm text-ink/40">{i + 1}</span>
              <input className="min-w-0 flex-1 rounded-lg border border-mist px-3 py-2 text-sm" placeholder="Enunciado da pergunta" maxLength={400} value={p.rotulo} onChange={(e) => altera(i, { rotulo: e.target.value })} />
              <select className="rounded-lg border border-mist px-2 py-2 text-sm" value={p.tipo} onChange={(e) => altera(i, { tipo: e.target.value as TipoPergunta, ...(e.target.value === "escala" ? { min: 0, max: 10 } : {}), ...((e.target.value === "escolha" || e.target.value === "multipla") && !p.opcoes ? { opcoes: ["Opção 1", "Opção 2"] } : {}) })}>{Object.entries(ROTULO_TIPO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 pl-8 text-xs text-ink/60">
              <input className="min-w-0 flex-1 rounded-lg border border-mist px-2 py-1.5" placeholder="Dica para quem responde (opcional)" maxLength={300} value={p.ajuda ?? ""} onChange={(e) => altera(i, { ajuda: e.target.value })} />
              <label className="flex items-center gap-1"><input type="checkbox" checked={!!p.obrigatoria} onChange={(e) => altera(i, { obrigatoria: e.target.checked })} />obrigatória</label>
              <button className="hover:text-sage-deep" onClick={() => mover(i, -1)}>↑</button><button className="hover:text-sage-deep" onClick={() => mover(i, 1)}>↓</button>
              <button className="hover:text-ember" onClick={() => setR({ ...r, perguntas: r.perguntas.filter((_, k) => k !== i) })}>remover</button>
            </div>
            {(p.tipo === "escolha" || p.tipo === "multipla") && <textarea className="ml-8 mt-2 w-[calc(100%-2rem)] rounded-lg border border-mist px-2 py-1.5 text-xs" rows={3} placeholder="Uma opção por linha" value={(p.opcoes ?? []).join("\n")} onChange={(e) => altera(i, { opcoes: e.target.value.split("\n") })} />}
            {p.tipo === "escala" && <div className="ml-8 mt-2 flex items-center gap-2 text-xs text-ink/60">de <input type="number" min={0} max={9} className="w-16 rounded border border-mist px-2 py-1" value={p.min ?? 0} onChange={(e) => altera(i, { min: Number(e.target.value) })} /> até <input type="number" min={1} max={10} className="w-16 rounded border border-mist px-2 py-1" value={p.max ?? 10} onChange={(e) => altera(i, { max: Number(e.target.value) })} /></div>}
          </div>
        ))}
      </div>
      <button className="mt-3 text-sm font-semibold text-sage-deep hover:underline" onClick={() => setR({ ...r, perguntas: [...r.perguntas, { id: `p${r.perguntas.length + 1}`, tipo: "texto", rotulo: "" }] })}>+ Adicionar pergunta</button>
      <div className="mt-5 flex gap-3"><button className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper" onClick={() => onSalvar(r)}>Salvar modelo</button><button className="text-sm text-ink/55 hover:underline" onClick={onCancelar}>Cancelar</button></div>
    </div>
  );
}

export function FormulariosDoPaciente({ pacienteId }: { pacienteId: string }) {
  const [modelos, setModelos] = useState<ModeloForm[]>([]);
  const [params] = useSearchParams();
  const [filtro, setFiltro] = useState<"TODOS" | "ANAMNESE" | "FORMULARIO">(params.get("tipo") === "anamnese" ? "ANAMNESE" : "TODOS");
  const [lista, setLista] = useState<FormularioResumo[]>([]);
  const [editor, setEditor] = useState<Rascunho | null>(null);
  const [aberto, setAberto] = useState<FormularioDetalhe | null>(null);
  const [respostas, setRespostas] = useState<RespostasForm>({});
  const [previa, setPrevia] = useState<string | null>(null);
  const [linkAtivo, setLinkAtivo] = useState<boolean | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const falha = (e: unknown) => setErro((e as Error).message);

  const carregarModelos = useCallback(() => { api.modelosFormulario().then(setModelos).catch(falha); }, []);
  const carregarLista = useCallback(() => { api.formulariosDoPaciente(pacienteId).then(setLista).catch(falha); }, [pacienteId]);
  useEffect(() => { carregarModelos(); }, [carregarModelos]);
  useEffect(() => { carregarLista(); api.acessoDiario(pacienteId).then((a) => setLinkAtivo(a.ativo)).catch(() => setLinkAtivo(null)); }, [carregarLista, pacienteId]);

  async function pedir(m: ModeloForm, modo: "LINK" | "AQUI") {
    setErro(null); setAviso(null);
    try {
      const r = await api.solicitarFormulario({ pacienteId, ref: m.ref, modo });
      carregarLista();
      if (modo === "AQUI") await abrir(r.id); else setAviso("Pedido enviado. O paciente vê o formulário no link do Diário.");
    } catch (e) { falha(e); }
  }
  async function abrir(id: string) { try { const d = await api.detalheFormulario(id); setAberto(d); setRespostas(d.respostas ?? {}); window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) { falha(e); } }
  async function salvarRespostas(concluir: boolean) {
    if (!aberto) return;
    try { await api.salvarRespostasFormulario(aberto.id, respostas, concluir); carregarLista(); if (concluir) { setAberto(null); setAviso("Formulário concluído e guardado na ficha."); } else setAviso("Rascunho salvo."); } catch (e) { falha(e); }
  }
  async function salvarModelo(r: Rascunho) {
    setErro(null);
    const dados = { nome: r.nome, descricao: r.descricao, tipo: r.tipo, perguntas: r.perguntas.map((p) => ({ ...p, opcoes: p.opcoes?.map((o) => o.trim()).filter(Boolean) })) };
    try { if (r.ref) await api.editarModeloFormulario(r.ref, dados); else await api.criarModeloFormulario(dados); setEditor(null); carregarModelos(); } catch (e) { falha(e); }
  }
  async function copiar(m: ModeloForm) { try { const c = await api.copiarModeloFormulario(m.ref); const todos = await api.modelosFormulario(); setModelos(todos); const novo = todos.find((x) => x.ref === c.ref); if (novo) setEditor({ ref: novo.ref, nome: novo.nome, descricao: novo.descricao, tipo: novo.tipo, perguntas: novo.perguntas }); } catch (e) { falha(e); } }
  async function arquivar(m: ModeloForm) { if (!window.confirm(`Arquivar o modelo "${m.nome}"? Os formulários já respondidos continuam na ficha.`)) return; try { await api.arquivarModeloFormulario(m.ref); carregarModelos(); } catch (e) { falha(e); } }
  async function apagar(f: FormularioResumo) { if (!window.confirm("Apagar este formulário da ficha?")) return; try { await api.apagarFormulario(f.id); carregarLista(); if (aberto?.id === f.id) setAberto(null); } catch (e) { falha(e); } }

  return (
    <div className="space-y-6">
      {erro && <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
      {aviso && <div className="rounded-lg border border-sage-deep/30 bg-sage-deep/10 px-4 py-3 text-sm text-sage-deep">{aviso}</div>}

      {aberto && (
        <section className="rounded-xl border border-sage-deep/30 bg-white p-5">
          <div className="mb-1 flex items-center justify-between"><h3 className="font-serif text-xl text-ink">{aberto.nome}</h3><button className="text-sm text-ink/50 hover:underline" onClick={() => setAberto(null)}>fechar</button></div>
          {aberto.status === "RESPONDIDO" ? (
            <>
              <p className="mb-4 text-xs text-ink/50">Respondido {aberto.respondidoPor === "PACIENTE" ? "pelo paciente" : "por você"}{aberto.respondidoEm ? ` em ${dataBr(aberto.respondidoEm)}` : ""}.</p>
              <dl className="space-y-3">{aberto.perguntas.map((p) => <div key={p.id} className="rounded-lg bg-paper px-4 py-3"><dt className="text-xs font-semibold text-ink/55">{p.rotulo}</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-ink">{respostaEmTexto(p, aberto.respostas?.[p.id])}</dd></div>)}</dl>
            </>
          ) : (
            <>
              <p className="mb-4 text-xs text-ink/50">{aberto.modo === "AQUI" ? "Preenchimento na sessão. Você pode salvar o rascunho e continuar depois." : "Aguardando o paciente. Você também pode preencher por ele."}</p>
              <CamposFormulario perguntas={aberto.perguntas} respostas={respostas} onChange={setRespostas} />
              <div className="mt-5 flex gap-3"><button className="rounded-lg border border-mist px-4 py-2 text-sm font-semibold text-ink/70" onClick={() => salvarRespostas(false)}>Salvar rascunho</button><button className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper" onClick={() => salvarRespostas(true)}>Concluir</button></div>
            </>
          )}
        </section>
      )}

      {editor ? <EditorModelo inicial={editor} onSalvar={salvarModelo} onCancelar={() => setEditor(null)} /> : (
        <section className="rounded-xl border border-mist bg-white p-5">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2"><h3 className="font-serif text-lg text-ink">Modelos de anamnese e formulário</h3><button className="rounded-lg border border-sage-deep px-3 py-1.5 text-sm font-semibold text-sage-deep" onClick={() => setEditor({ ref: null, nome: "", descricao: "", tipo: "FORMULARIO", perguntas: [{ id: "p1", tipo: "texto", rotulo: "" }] })}>+ Criar meu modelo</button></div>
          <p className="mb-4 text-sm text-ink/55">Peça ao paciente por link ou preencha com ele na sessão. Copie qualquer modelo para adaptar ao seu jeito.</p>
          {linkAtivo === false && <div className="mb-4 rounded-lg border border-clay/40 bg-clay/10 px-4 py-3 text-sm text-ink/75">Para pedir por link, gere o link do paciente na aba <b>Diário</b>.</div>}
          <div className="mb-4 flex flex-wrap gap-2">
            {([["TODOS", "Todos"], ["ANAMNESE", "Anamneses"], ["FORMULARIO", "Formulários"]] as const).map(([v, r]) => <button key={v} className={`rounded-full px-3 py-1 text-sm font-semibold ${filtro === v ? "bg-sage-deep text-paper" : "bg-mist text-ink/65 hover:text-ink"}`} onClick={() => setFiltro(v)}>{r}</button>)}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {modelos.filter((m) => filtro === "TODOS" || m.tipo === filtro).map((m) => (
              <div key={m.ref} className="flex flex-col rounded-xl border border-mist p-4">
                <div className="flex items-start justify-between gap-2"><div><div className="font-semibold text-ink">{m.nome}</div><div className="mt-0.5 text-xs text-ink/55">{m.descricao}</div></div><div className="flex shrink-0 flex-col items-end gap-1">{m.recomendado && <span className="rounded-full bg-sage-deep/15 px-2 py-0.5 text-[10px] font-bold text-sage-deep">PARA VOCÊ</span>}<span className="text-[10px] text-ink/40">{m.origem === "PROPRIO" ? "seu modelo" : "do sistema"} · {m.perguntas.length} perguntas</span></div></div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <button className="rounded-lg bg-sage-deep px-3 py-1.5 font-semibold text-paper" onClick={() => pedir(m, "LINK")}>Pedir por link</button>
                  <button className="rounded-lg border border-sage-deep px-3 py-1.5 font-semibold text-sage-deep" onClick={() => pedir(m, "AQUI")}>Preencher aqui</button>
                  <button className="rounded-lg border border-mist px-3 py-1.5 text-ink/65" onClick={() => setPrevia(previa === m.ref ? null : m.ref)}>{previa === m.ref ? "Ocultar" : "Ver perguntas"}</button>
                  <button className="rounded-lg border border-mist px-3 py-1.5 text-ink/65" onClick={() => copiar(m)}>Copiar e editar</button>
                  {m.origem === "PROPRIO" && <><button className="rounded-lg border border-mist px-3 py-1.5 text-ink/65" onClick={() => setEditor({ ref: m.ref, nome: m.nome, descricao: m.descricao, tipo: m.tipo, perguntas: m.perguntas })}>Editar</button><button className="px-2 py-1.5 text-ink/40 hover:text-ember" onClick={() => arquivar(m)}>arquivar</button></>}
                </div>
                {previa === m.ref && <ol className="mt-3 list-decimal space-y-1 rounded-lg bg-paper p-3 pl-7 text-xs text-ink/70">{m.perguntas.map((p) => <li key={p.id}>{p.rotulo} <span className="text-ink/35">({ROTULO_TIPO[p.tipo].toLowerCase()})</span></li>)}</ol>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-mist bg-white p-5">
        <h3 className="mb-3 font-serif text-lg text-ink">Formulários deste paciente</h3>
        {lista.length === 0 ? <p className="text-sm text-ink/45">Nenhum ainda.</p> : (
          <ul className="divide-y divide-mist">
            {lista.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                <span className="font-semibold text-ink">{f.nome}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${f.status === "RESPONDIDO" ? "bg-sage-deep/15 text-sage-deep" : "bg-clay/15 text-clay"}`}>{f.status === "RESPONDIDO" ? "respondido" : f.modo === "LINK" ? "aguardando o paciente" : "em preenchimento"}</span>
                <span className="text-xs text-ink/45">{f.status === "RESPONDIDO" && f.respondidoEm ? `${f.respondidoPor === "PACIENTE" ? "pelo paciente" : "por você"}, ${dataBr(f.respondidoEm)}` : `pedido em ${dataBr(f.criadoEm)}`}</span>
                <span className="ml-auto flex gap-3"><button className="text-xs font-semibold text-sage-deep hover:underline" onClick={() => abrir(f.id)}>{f.status === "RESPONDIDO" ? "ler" : "abrir"}</button><button className="text-xs text-ink/40 hover:text-ember" onClick={() => apagar(f)}>apagar</button></span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
