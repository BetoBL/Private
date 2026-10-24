import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, type ExameLido, type ItemLido, type ResultadoExameSalvo } from "../lib/api";
import { GraficoMetrica } from "./SaudeDoPaciente";

// Exames e laudos do paciente (aba Saúde): o médico envia o PDF ou a foto, a IA transcreve os resultados e ele CONFERE antes de salvar.
// O arquivo vai para a IA e não fica guardado no sistema; o que fica são os resultados conferidos.

const campo = "w-full rounded-lg border border-mist bg-white px-2 py-1.5 text-sm";
const botao = "rounded-full bg-sage-deep px-4 py-1.5 text-sm font-semibold text-paper hover:opacity-90 disabled:opacity-50";
const botaoSec = "rounded-full border border-mist bg-white px-4 py-1.5 text-sm font-semibold text-ink/70 hover:text-ink";
const dataBr = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR");
const hojeIso = () => new Date().toLocaleDateString("sv-SE");
const TIPOS_OK = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

type Linha = ItemLido & { incluir: boolean; valorEdit: string };

function lerArquivo(f: File): Promise<string> {
  return new Promise((ok, falha) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(",")[1] ?? "");
    r.onerror = () => falha(new Error("Não foi possível ler o arquivo."));
    r.readAsDataURL(f);
  });
}

export function ExamesDoPaciente({ pacienteId, onSalvo }: { pacienteId: string; onSalvo: () => void }) {
  const [salvos, setSalvos] = useState<ResultadoExameSalvo[]>([]);
  const [lendo, setLendo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [revisao, setRevisao] = useState<{ lido: ExameLido; data: string; laboratorio: string; linhas: Linha[]; confirmaPessoa: boolean } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [aberto, setAberto] = useState<string | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  const carregar = useCallback(async () => {
    try { setSalvos(await api.resultadosDeExame(pacienteId)); } catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível carregar os exames."); }
  }, [pacienteId]);
  useEffect(() => { void carregar(); }, [carregar]);

  async function escolher(f: File | undefined) {
    if (!f) return;
    setErro(null); setAviso(null);
    if (!TIPOS_OK.includes(f.type)) { setErro("Envie um PDF ou uma foto (PNG, JPG ou WebP)."); return; }
    if (f.size > MAX_BYTES) { setErro("O arquivo passa de 10 MB. Envie uma versão menor."); return; }
    setLendo(true);
    try {
      const lido = await api.importarExame(pacienteId, { arquivo: await lerArquivo(f), tipoMime: f.type });
      setRevisao({
        lido, data: lido.dataExame ?? hojeIso(), laboratorio: lido.laboratorio ?? "", confirmaPessoa: lido.nomeConfere !== false,
        linhas: lido.itens.map((i) => ({ ...i, incluir: true, valorEdit: i.valor != null ? String(i.valor).replace(".", ",") : i.valorTexto ?? "" })),
      });
      if (lido.itens.length === 0) setErro("A IA não encontrou resultados neste arquivo. Confira se é um exame legível.");
    } catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível ler o exame."); } finally { setLendo(false); if (entrada.current) entrada.current.value = ""; }
  }

  const mudar = (idx: number, p: Partial<Linha>) => setRevisao((r) => (r ? { ...r, linhas: r.linhas.map((l, k) => (k === idx ? { ...l, ...p } : l)) } : r));

  async function salvar() {
    if (!revisao) return;
    setSalvando(true); setErro(null);
    try {
      const itens = revisao.linhas.filter((l) => l.incluir && l.valorEdit.trim()).map((l) => {
        const numero = l.tipo === "NUMERICO" ? Number(l.valorEdit.replace(",", ".")) : NaN;
        const ehNumero = l.tipo === "NUMERICO" && Number.isFinite(numero) && /^-?[\d.,]+$/.test(l.valorEdit.trim());
        return { nome: l.nome, tipo: l.tipo, valor: ehNumero ? numero : null, valorTexto: ehNumero ? null : l.valorEdit.trim(), unidade: l.unidade, referencia: l.referencia, fora: l.fora };
      });
      const r = await api.salvarResultadosDeExame(pacienteId, { data: revisao.data, laboratorio: revisao.laboratorio || null, origem: "IA", itens });
      setRevisao(null);
      setAviso(r.salvos === 0 ? "Esses resultados já estavam salvos neste dia; nada foi repetido." : `${r.salvos} resultado${r.salvos === 1 ? "" : "s"} salvo${r.salvos === 1 ? "" : "s"}${r.metricas ? `; ${r.metricas} entrou nos gráficos de medidas` : ""}.`);
      await carregar(); onSalvo();
    } catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível salvar."); } finally { setSalvando(false); }
  }

  const grupos = useMemo(() => {
    const m = new Map<string, ResultadoExameSalvo[]>();
    for (const r of salvos) m.set(r.nome, [...(m.get(r.nome) ?? []), r]);
    return [...m.entries()].map(([nome, itens]) => ({ nome, itens, ultimo: itens[itens.length - 1], laudo: itens.every((i) => i.tipo === "LAUDO") })).sort((a, b) => b.ultimo.data.localeCompare(a.ultimo.data) || a.nome.localeCompare(b.nome));
  }, [salvos]);
  const mostrarValor = (r: ResultadoExameSalvo) => (r.valor != null ? `${String(r.valor).replace(".", ",")}${r.unidade ? ` ${r.unidade}` : ""}` : r.valorTexto ?? "");
  const bloqueado = !!revisao && !revisao.confirmaPessoa;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div><h3 className="text-lg font-bold text-ink">Exames e laudos</h3><p className="text-sm text-ink/55">Envie o PDF ou a foto do exame: o sistema transcreve e você confere antes de salvar.</p></div>
        {!revisao && (
          <>
            <input ref={entrada} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => void escolher(e.target.files?.[0])} />
            <button className={botao} disabled={lendo} onClick={() => entrada.current?.click()}>{lendo ? "Lendo o exame…" : "Importar exame"}</button>
          </>
        )}
      </div>
      {erro && <p className="mb-3 rounded-xl bg-ember/10 px-4 py-2 text-sm text-ember" role="alert">{erro}</p>}
      {aviso && <p className="mb-3 rounded-xl bg-mist px-4 py-2 text-sm text-ink/70">{aviso}</p>}
      {lendo && <p className="mb-3 text-sm text-ink/55">A leitura leva de 10 a 40 segundos. O arquivo vai para a IA e não fica guardado no sistema.</p>}

      {revisao && (
        <div className="mb-5 rounded-xl border-2 border-sage-deep/30 bg-paper p-4">
          <p className="mb-1 text-sm font-bold text-ink">Confira com o documento original antes de salvar</p>
          <p className="mb-3 text-xs text-ink/55">A leitura por IA pode errar um número ou uma unidade. Nada é salvo até você confirmar.</p>
          {revisao.lido.nomeConfere === false && (
            <label className="mb-3 flex items-start gap-2 rounded-lg bg-ember/10 px-3 py-2 text-sm text-ember">
              <input type="checkbox" className="mt-1" checked={revisao.confirmaPessoa} onChange={(e) => setRevisao({ ...revisao, confirmaPessoa: e.target.checked })} />
              <span><b>O nome no documento ({revisao.lido.nomeNoDocumento}) não parece ser o deste paciente.</b> Marque aqui só se tiver certeza de que o exame é dele.</span>
            </label>
          )}
          {revisao.lido.nomeConfere === null && <p className="mb-3 rounded-lg bg-mist px-3 py-2 text-xs text-ink/65">Não consegui ler o nome do paciente no documento. Confirme que o exame é desta pessoa.</p>}
          <div className="mb-3 grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold text-ink/60">Data do exame<input type="date" max={hojeIso()} className={`${campo} mt-1`} value={revisao.data} onChange={(e) => setRevisao({ ...revisao, data: e.target.value })} /></label>
            <label className="text-xs font-semibold text-ink/60">Laboratório ou serviço<input className={`${campo} mt-1`} value={revisao.laboratorio} onChange={(e) => setRevisao({ ...revisao, laboratorio: e.target.value })} /></label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead><tr className="text-xs uppercase tracking-wide text-ink/45"><th className="w-8 py-1"></th><th className="py-1">Exame</th><th className="py-1">Resultado</th><th className="py-1">Unidade</th><th className="py-1">Referência</th><th className="py-1">Alterado</th></tr></thead>
              <tbody>
                {revisao.linhas.map((l, idx) => (
                  <tr key={idx} className={`align-top ${l.incluir ? "" : "opacity-40"}`}>
                    <td className="py-1"><input type="checkbox" checked={l.incluir} onChange={(e) => mudar(idx, { incluir: e.target.checked })} aria-label={`Incluir ${l.nome}`} /></td>
                    <td className="py-1 pr-2"><input className={campo} value={l.nome} onChange={(e) => mudar(idx, { nome: e.target.value })} /></td>
                    <td className="py-1 pr-2">{l.tipo === "LAUDO" ? <textarea className={campo} rows={4} value={l.valorEdit} onChange={(e) => mudar(idx, { valorEdit: e.target.value })} /> : <input className={`${campo} ${l.valorEdit.startsWith("[conferir]") ? "border-ember" : ""}`} value={l.valorEdit} onChange={(e) => mudar(idx, { valorEdit: e.target.value })} />}</td>
                    <td className="py-1 pr-2"><input className={`${campo} w-20`} value={l.unidade ?? ""} onChange={(e) => mudar(idx, { unidade: e.target.value })} /></td>
                    <td className="py-1 pr-2 text-xs text-ink/60">{l.referencia ?? ""}</td>
                    <td className="py-1"><select className={`${campo} w-24`} value={l.fora == null ? "" : l.fora ? "s" : "n"} onChange={(e) => mudar(idx, { fora: e.target.value === "" ? null : e.target.value === "s" })}><option value="">—</option><option value="s">Sim</option><option value="n">Não</option></select></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className={botao} disabled={salvando || bloqueado || !revisao.linhas.some((l) => l.incluir)} onClick={() => void salvar()}>Salvar resultados conferidos</button>
            <button className={botaoSec} onClick={() => setRevisao(null)}>Descartar</button>
          </div>
        </div>
      )}

      {grupos.length === 0 ? <p className="text-sm text-ink/50">Nenhum exame importado ainda.</p> : (
        <ul className="grid gap-2">
          {grupos.map((g) => {
            const numericos = g.itens.filter((i) => i.valor != null);
            const aberta = aberto === g.nome;
            return (
              <li key={g.nome} className="rounded-xl bg-paper">
                <button className="flex w-full flex-wrap items-baseline justify-between gap-2 px-3 py-2 text-left text-sm" onClick={() => setAberto(aberta ? null : g.nome)} aria-expanded={aberta}>
                  <span className="font-semibold">{g.nome}{g.itens.length > 1 ? <span className="ml-2 text-xs font-normal text-ink/45">{g.itens.length} registros</span> : null}</span>
                  <span className={g.ultimo.fora ? "font-bold text-ember" : "text-ink/70"}>{g.laudo ? `laudo de ${dataBr(g.ultimo.data)}` : `${mostrarValor(g.ultimo)} · ${dataBr(g.ultimo.data)}`}{g.ultimo.fora ? " ▲ alterado" : ""}</span>
                </button>
                {aberta && (
                  <div className="border-t border-mist px-3 pb-3 pt-2">
                    {numericos.length >= 2 && <div className="max-w-xl"><GraficoMetrica tipo={{ chave: g.nome, rotulo: g.nome, unidade: g.ultimo.unidade ?? "", min: 0, max: 1e9 }} pontos={numericos.map((r) => ({ id: r.id, tipo: g.nome, valor: r.valor!, valor2: null, data: r.data, observacao: null }))} /></div>}
                    <ul className="mt-1 grid gap-1 text-sm">
                      {[...g.itens].reverse().map((r) => (
                        <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-2">
                          <span><span className="text-ink/50">{dataBr(r.data)}</span> · {g.laudo ? <span className="whitespace-pre-wrap">{r.valorTexto}</span> : <b className={r.fora ? "text-ember" : ""}>{mostrarValor(r)}</b>}{r.referencia && !g.laudo ? <span className="ml-2 text-xs text-ink/45">ref. {r.referencia}</span> : null}{r.laboratorio ? <span className="ml-2 text-xs text-ink/45">{r.laboratorio}</span> : null}</span>
                          <button className="text-xs font-semibold text-ink/45 hover:text-ember" onClick={async () => { await api.removerResultadoDeExame(pacienteId, r.id); await carregar(); }}>Remover</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
