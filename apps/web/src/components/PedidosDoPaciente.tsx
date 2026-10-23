import { useCallback, useEffect, useRef, useState } from "react";
import { api, type ExameCatalogo, type ItemPedido, type KitExame, type ModeloPedidoSalvo, type PedidoSalvo, type TipoPedido } from "../lib/api";

// Aba "Pedidos" da ficha (pacote médico): pedido de exames (catálogo da TUSS), pedido médico e indicação de medicação,
// com modelos gravados pelo médico e kits sugeridos por especialidade. O pedido fica registrado no paciente e pode ser impresso.

const TIPOS: Array<{ chave: TipoPedido; rotulo: string; titulo: string }> = [
  { chave: "PEDIDO_EXAMES", rotulo: "Pedido de exames", titulo: "SOLICITAÇÃO DE EXAMES" },
  { chave: "PEDIDO_MEDICO", rotulo: "Pedido médico", titulo: "PEDIDO MÉDICO" },
  { chave: "INDICACAO_MEDICACAO", rotulo: "Indicação de medicação", titulo: "INDICAÇÃO DE MEDICAÇÃO" },
];
const campo = "w-full rounded-lg border border-mist px-3 py-2 text-sm";
const botao = "rounded-full bg-sage-deep px-4 py-1.5 text-sm font-semibold text-paper hover:opacity-90 disabled:opacity-50";
const botaoSec = "rounded-full border border-mist bg-white px-4 py-1.5 text-sm font-semibold text-ink/70 hover:text-ink";
const dataBr = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function textoDoPedido(p: { tipo: TipoPedido; itens: ItemPedido[]; texto?: string | null; indicacao?: string | null }) {
  const linhas = p.itens.map((i) => `- ${i.nome}${i.detalhe ? ` (${i.detalhe})` : ""}`);
  return [TIPOS.find((t) => t.chave === p.tipo)!.titulo, ...linhas, ...(p.texto ? ["", p.texto] : []), ...(p.indicacao ? ["", `Indicação clínica: ${p.indicacao}`] : [])].join("\n");
}

function imprimir(p: PedidoSalvo, paciente: string, profissional: string, registro: string) {
  const w = window.open("", "_blank");
  if (!w) return;
  const titulo = TIPOS.find((t) => t.chave === p.tipo)!.titulo;
  const itens = p.itens.map((i) => `<li>${esc(i.nome)}${i.detalhe ? ` <em>(${esc(i.detalhe)})</em>` : ""}${i.codigo ? ` <small>TUSS ${esc(i.codigo)}</small>` : ""}</li>`).join("");
  w.document.write(`<!doctype html><meta charset="utf-8"><title>${titulo}</title><style>body{font:14px/1.5 system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 24px;color:#222}h1{font-size:18px;letter-spacing:.06em}li{margin:4px 0}small{color:#777}.ass{margin-top:80px;border-top:1px solid #333;width:300px;padding-top:6px}</style>
<h1>${titulo}</h1><p><b>Paciente:</b> ${esc(paciente)}<br><b>Data:</b> ${dataBr(p.criadoEm)}</p>${itens ? `<ul>${itens}</ul>` : ""}${p.texto ? `<p style="white-space:pre-wrap">${esc(p.texto)}</p>` : ""}${p.indicacao ? `<p><b>Indicação clínica:</b> ${esc(p.indicacao)}</p>` : ""}<div class="ass">${esc(profissional)}<br>${esc(registro)}</div>`);
  w.document.close();
  w.focus();
  w.print();
}

export function PedidosDoPaciente({ pacienteId, pacienteNome, profissionalNome, registro }: { pacienteId: string; pacienteNome: string; profissionalNome: string; registro: string }) {
  const [tipo, setTipo] = useState<TipoPedido>("PEDIDO_EXAMES");
  const [itens, setItens] = useState<ItemPedido[]>([]);
  const [texto, setTexto] = useState("");
  const [indicacao, setIndicacao] = useState("");
  const [busca, setBusca] = useState("");
  const [grupo, setGrupo] = useState("");
  const [grupos, setGrupos] = useState<string[]>([]);
  const [resultados, setResultados] = useState<ExameCatalogo[]>([]);
  const [medNome, setMedNome] = useState("");
  const [medDetalhe, setMedDetalhe] = useState("");
  const [kits, setKits] = useState<KitExame[]>([]);
  const [modelos, setModelos] = useState<ModeloPedidoSalvo[]>([]);
  const [pedidos, setPedidos] = useState<PedidoSalvo[]>([]);
  const [salvarComo, setSalvarComo] = useState<{ nome: string; compartilhado: boolean } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const seq = useRef(0);

  const carregar = useCallback(async () => {
    try {
      const [p, m] = await Promise.all([api.pedidosDoPaciente(pacienteId), api.modelosDePedido()]);
      setPedidos(p); setModelos(m);
    } catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível carregar os pedidos."); }
  }, [pacienteId]);
  useEffect(() => { void carregar(); api.kitsDeExames().then(setKits).catch(() => undefined); api.gruposDeExames().then(setGrupos).catch(() => undefined); }, [carregar]);

  useEffect(() => {
    if (tipo !== "PEDIDO_EXAMES" || (busca.trim().length < 2 && !grupo)) { setResultados([]); return; }
    const n = ++seq.current;
    const t = setTimeout(() => { api.buscarExames(busca, grupo).then((r) => { if (n === seq.current) setResultados(r); }).catch(() => undefined); }, 200);
    return () => clearTimeout(t);
  }, [busca, grupo, tipo]);

  function trocarTipo(t: TipoPedido) { setTipo(t); setItens([]); setTexto(""); setBusca(""); setResultados([]); setErro(null); setAviso(null); }
  const adicionar = (i: ItemPedido) => setItens((atual) => (i.codigo && atual.some((x) => x.codigo === i.codigo) ? atual : [...atual, i]));
  const usarKit = (chave: string) => { const k = kits.find((x) => x.chave === chave); if (k) k.itens.forEach(adicionar); };
  const usarModelo = (id: string) => { const m = modelos.find((x) => x.id === id); if (m) { m.itens.forEach(adicionar); if (m.texto) setTexto((t) => (t ? `${t}\n${m.texto}` : m.texto!)); } };

  async function executar(acao: () => Promise<unknown>, depois?: () => void) {
    setSalvando(true); setErro(null); setAviso(null);
    try { await acao(); depois?.(); await carregar(); } catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível salvar."); } finally { setSalvando(false); }
  }
  const limpar = () => { setItens([]); setTexto(""); setIndicacao(""); setBusca(""); setResultados([]); };

  const modelosDoTipo = modelos.filter((m) => m.tipo === tipo);
  const vazio = itens.length === 0 && !texto.trim();

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap gap-2">
          {TIPOS.map((t) => <button key={t.chave} className={`rounded-full px-3 py-1 text-sm font-semibold ${tipo === t.chave ? "bg-sage-deep text-paper" : "bg-paper text-ink/70 hover:text-ink"}`} onClick={() => trocarTipo(t.chave)}>{t.rotulo}</button>)}
        </div>
        {erro && <p className="mb-3 rounded-xl bg-ember/10 px-4 py-2 text-sm text-ember" role="alert">{erro}</p>}
        {aviso && <p className="mb-3 rounded-xl bg-mist px-4 py-2 text-sm text-ink/70">{aviso}</p>}

        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          {tipo === "PEDIDO_EXAMES" && (
            <select className={campo} value="" onChange={(e) => { if (e.target.value) usarKit(e.target.value); }} aria-label="Kits sugeridos">
              <option value="">Kit sugerido por especialidade…</option>
              {kits.map((k) => <option key={k.chave} value={k.chave}>{k.recomendado ? "★ " : ""}{k.nome}</option>)}
            </select>
          )}
          <select className={campo} value="" onChange={(e) => { if (e.target.value) usarModelo(e.target.value); }} aria-label="Meus modelos">
            <option value="">{modelosDoTipo.length ? "Usar um modelo gravado…" : "Nenhum modelo gravado ainda"}</option>
            {modelosDoTipo.map((m) => <option key={m.id} value={m.id}>{m.nome}{m.meu ? "" : " (da clínica)"}</option>)}
          </select>
        </div>

        {tipo === "PEDIDO_EXAMES" && (
          <div className="mb-4">
            <div className="grid gap-2 sm:grid-cols-[1fr_12rem]">
              <input className={campo} placeholder="Buscar exame: ecocardiograma, TC crânio, hemograma, paquimetria…" value={busca} onChange={(e) => setBusca(e.target.value)} />
              <select className={campo} value={grupo} onChange={(e) => setGrupo(e.target.value)} aria-label="Tipo de exame"><option value="">Todos os tipos</option>{grupos.map((g) => <option key={g} value={g}>{g}</option>)}</select>
            </div>
            {resultados.length > 0 && (
              <ul className="mt-2 max-h-64 overflow-auto rounded-xl border border-mist">
                {resultados.map((r) => (
                  <li key={r.codigo}><button type="button" className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-paper" onClick={() => adicionar({ codigo: r.codigo, nome: r.nome, detalhe: null })}>
                    <span>{r.nome}</span><span className="shrink-0 text-xs text-ink/45">{r.grupo} · {r.codigo}</span>
                  </button></li>
                ))}
              </ul>
            )}
            {busca.trim().length >= 2 && resultados.length === 0 && <p className="mt-2 text-xs text-ink/50">Nenhum exame encontrado. Tente outro termo ou escreva o exame no campo de texto abaixo.</p>}
          </div>
        )}

        {tipo === "INDICACAO_MEDICACAO" && (
          <form className="mb-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]" onSubmit={(e) => { e.preventDefault(); if (medNome.trim().length >= 2) { adicionar({ nome: medNome.trim(), detalhe: medDetalhe.trim() || null }); setMedNome(""); setMedDetalhe(""); } }}>
            <input className={campo} placeholder="Medicamento e dose (ex.: Losartana 50 mg)" value={medNome} onChange={(e) => setMedNome(e.target.value)} />
            <input className={campo} placeholder="Como usar (ex.: 1 comprimido de manhã)" value={medDetalhe} onChange={(e) => setMedDetalhe(e.target.value)} />
            <button className={botaoSec}>Incluir</button>
          </form>
        )}

        {itens.length > 0 && (
          <ul className="mb-4 grid gap-2">
            {itens.map((i, idx) => (
              <li key={`${i.codigo ?? i.nome}-${idx}`} className="grid gap-2 rounded-xl bg-paper px-3 py-2 sm:grid-cols-[1fr_14rem_auto] sm:items-center">
                <span className="text-sm font-semibold">{i.nome}</span>
                <input className="rounded-lg border border-mist bg-white px-2 py-1 text-sm" placeholder={tipo === "PEDIDO_EXAMES" ? "Detalhe (ex.: olhos, ambos)" : "Como usar"} value={i.detalhe ?? ""} onChange={(e) => setItens((a) => a.map((x, k) => (k === idx ? { ...x, detalhe: e.target.value } : x)))} />
                <button type="button" className="text-xs font-semibold text-ink/45 hover:text-ember" onClick={() => setItens((a) => a.filter((_, k) => k !== idx))}>Remover</button>
              </li>
            ))}
          </ul>
        )}

        <label className="mb-3 block text-sm">
          <span className="mb-1 block font-semibold text-ink/70">{tipo === "PEDIDO_MEDICO" ? "Texto do pedido" : "Observações (opcional)"}</span>
          <textarea className={campo} rows={tipo === "PEDIDO_MEDICO" ? 6 : 2} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={tipo === "PEDIDO_MEDICO" ? "Ex.: encaminhamento, relatório, declaração…" : ""} />
        </label>
        <label className="mb-4 block text-sm">
          <span className="mb-1 block font-semibold text-ink/70">Indicação clínica (opcional)</span>
          <input className={campo} value={indicacao} onChange={(e) => setIndicacao(e.target.value)} placeholder="Ex.: suspeita de glaucoma, hipertensão em investigação" />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <button className={botao} disabled={salvando || vazio} onClick={() => executar(() => api.registrarPedido(pacienteId, { tipo, itens, texto: texto.trim() || null, indicacao: indicacao.trim() || null }), () => { limpar(); setAviso("Pedido registrado no paciente."); })}>Registrar pedido</button>
          {!salvarComo && <button className={botaoSec} disabled={vazio} onClick={() => setSalvarComo({ nome: "", compartilhado: false })}>Salvar como modelo</button>}
          {!vazio && <button className={botaoSec} onClick={limpar}>Limpar</button>}
        </div>
        {salvarComo && (
          <form className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-mist/50 p-3" onSubmit={(e) => { e.preventDefault(); void executar(() => api.salvarModeloDePedido({ nome: salvarComo.nome, tipo, itens, texto: texto.trim() || null, compartilhado: salvarComo.compartilhado }), () => { setSalvarComo(null); setAviso("Modelo gravado."); }); }}>
            <input className="min-w-[14rem] flex-1 rounded-lg border border-mist px-3 py-1.5 text-sm" placeholder="Nome do modelo (ex.: Primeira consulta de glaucoma)" value={salvarComo.nome} onChange={(e) => setSalvarComo({ ...salvarComo, nome: e.target.value })} required minLength={2} autoFocus />
            <label className="flex items-center gap-1.5 text-xs text-ink/70"><input type="checkbox" checked={salvarComo.compartilhado} onChange={(e) => setSalvarComo({ ...salvarComo, compartilhado: e.target.checked })} /> Compartilhar com a clínica</label>
            <button className={botao} disabled={salvando}>Gravar</button><button type="button" className={botaoSec} onClick={() => setSalvarComo(null)}>Cancelar</button>
          </form>
        )}
        {modelosDoTipo.some((m) => m.meu) && (
          <details className="mt-4 text-sm"><summary className="cursor-pointer font-semibold text-ink/60">Meus modelos de {TIPOS.find((t) => t.chave === tipo)!.rotulo.toLowerCase()}</summary>
            <ul className="mt-2 grid gap-1">{modelosDoTipo.filter((m) => m.meu).map((m) => <li key={m.id} className="flex items-center justify-between gap-2 rounded-lg bg-paper px-3 py-1.5"><span>{m.nome}{m.compartilhado ? <span className="ml-2 text-xs text-ink/45">compartilhado</span> : null}</span><button className="text-xs font-semibold text-ink/45 hover:text-ember" onClick={() => executar(() => api.removerModeloDePedido(m.id))}>Apagar</button></li>)}</ul>
          </details>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-ink">Pedidos deste paciente</h3>
        <p className="mb-3 text-sm text-ink/55">Tudo o que já foi pedido, do mais recente ao mais antigo.</p>
        {pedidos.length === 0 ? <p className="text-sm text-ink/50">Nenhum pedido registrado.</p> : (
          <ul className="grid gap-3">
            {pedidos.map((p) => (
              <li key={p.id} className="rounded-xl border border-mist p-3 text-sm">
                <div className="mb-1 flex items-baseline justify-between gap-2"><b>{TIPOS.find((t) => t.chave === p.tipo)?.rotulo}</b><span className="text-xs text-ink/50">{dataBr(p.criadoEm)}</span></div>
                {p.itens.length > 0 && <ul className="list-disc pl-5">{p.itens.map((i, k) => <li key={k}>{i.nome}{i.detalhe ? <span className="text-ink/55"> ({i.detalhe})</span> : null}</li>)}</ul>}
                {p.texto && <p className="mt-1 whitespace-pre-wrap text-ink/70">{p.texto}</p>}
                {p.indicacao && <p className="mt-1 text-xs text-ink/55">Indicação: {p.indicacao}</p>}
                <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
                  <button className="text-sage-deep hover:underline" onClick={() => imprimir(p, pacienteNome, profissionalNome, registro)}>Imprimir</button>
                  <button className="text-sage-deep hover:underline" onClick={() => { void navigator.clipboard?.writeText(textoDoPedido(p)).then(() => setAviso("Texto copiado.")).catch(() => setErro("Não foi possível copiar.")); }}>Copiar texto</button>
                  <button className="text-ink/45 hover:text-ember" onClick={() => executar(() => api.removerPedido(pacienteId, p.id))}>Remover</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
