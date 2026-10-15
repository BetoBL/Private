import type { PerguntaForm, RespostasForm } from "../lib/api";

// Desenha as perguntas de um formulário e recolhe as respostas. Usado na ficha (profissional) e na tela do paciente.
// `compacto` deixa os botões maiores e em coluna (celular).
export function CamposFormulario({ perguntas, respostas, onChange, desabilitado, compacto }: { perguntas: PerguntaForm[]; respostas: RespostasForm; onChange: (r: RespostasForm) => void; desabilitado?: boolean; compacto?: boolean }) {
  const set = (id: string, v: string | string[] | number | boolean | undefined) => { const n = { ...respostas }; if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) delete n[id]; else n[id] = v; onChange(n); };
  const base = "rounded-xl border-2 px-3 py-2.5 text-sm transition-colors disabled:opacity-60";
  const marcado = "border-sage-deep bg-sage-deep/10 font-semibold text-ink";
  const livre = "border-mist bg-white text-ink/75";
  return (
    <ol className="space-y-5">
      {perguntas.map((p, i) => {
        const v = respostas[p.id];
        return (
          <li key={p.id}>
            <div className="mb-1.5 text-[15px] font-semibold leading-snug text-ink"><span className="mr-2 text-ink/35">{i + 1}.</span>{p.rotulo}{p.obrigatoria && <span className="ml-1 text-ember">*</span>}</div>
            {p.ajuda && <div className="mb-2 text-xs text-ink/50">{p.ajuda}</div>}
            {p.tipo === "texto" && <textarea disabled={desabilitado} rows={3} maxLength={8000} className="w-full resize-y rounded-xl border border-mist bg-white px-3 py-2.5 text-sm outline-none focus:border-sage-deep disabled:bg-paper" value={(v as string) ?? ""} onChange={(e) => set(p.id, e.target.value)} />}
            {p.tipo === "escolha" && <div className={compacto ? "space-y-2" : "flex flex-wrap gap-2"}>{p.opcoes!.map((o) => <button key={o} type="button" disabled={desabilitado} onClick={() => set(p.id, v === o ? undefined : o)} className={`${base} ${compacto ? "block w-full text-left" : ""} ${v === o ? marcado : livre}`}>{o}</button>)}</div>}
            {p.tipo === "multipla" && <div className={compacto ? "space-y-2" : "flex flex-wrap gap-2"}>{p.opcoes!.map((o) => { const lista = (v as string[] | undefined) ?? []; const on = lista.includes(o); return <button key={o} type="button" disabled={desabilitado} onClick={() => set(p.id, on ? lista.filter((x) => x !== o) : [...lista, o])} className={`${base} ${compacto ? "block w-full text-left" : ""} ${on ? marcado : livre}`}>{on ? "✓ " : ""}{o}</button>; })}</div>}
            {p.tipo === "escala" && <div className="flex flex-wrap gap-1.5">{Array.from({ length: (p.max ?? 10) - (p.min ?? 0) + 1 }, (_, k) => (p.min ?? 0) + k).map((n) => <button key={n} type="button" disabled={desabilitado} onClick={() => set(p.id, v === n ? undefined : n)} className={`h-10 min-w-10 rounded-xl border-2 text-sm ${v === n ? marcado : livre}`}>{n}</button>)}</div>}
            {p.tipo === "sim_nao" && <div className="flex gap-2">{([[true, "Sim"], [false, "Não"]] as const).map(([val, rot]) => <button key={rot} type="button" disabled={desabilitado} onClick={() => set(p.id, v === val ? undefined : val)} className={`${base} min-w-20 ${v === val ? marcado : livre}`}>{rot}</button>)}</div>}
            {p.tipo === "data" && <input type="date" disabled={desabilitado} className="rounded-xl border border-mist bg-white px-3 py-2 text-sm disabled:bg-paper" value={(v as string) ?? ""} onChange={(e) => set(p.id, e.target.value)} />}
          </li>
        );
      })}
    </ol>
  );
}

// Resposta em texto, para ler no prontuário.
export const respostaEmTexto = (_p: PerguntaForm, v: RespostasForm[string] | undefined) => (v === undefined ? "(sem resposta)" : Array.isArray(v) ? v.join(", ") : typeof v === "boolean" ? (v ? "Sim" : "Não") : String(v));
