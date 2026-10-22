import type { ReactNode } from "react";

// Coluna "Resultados ao vivo" ao lado da entrada de dados dos testes com tela própria (WAIS-III, WISC-IV, WASI).
// Os gráficos ficam sempre à vista (vazios no começo) e são preenchidos conforme os subtestes são lançados.
export function PainelVivo({ carregando, temDados, dica, children }: { carregando: boolean; temDados: boolean; dica: string; children: ReactNode }) {
  return (
    <aside className="space-y-4 @5xl:sticky @5xl:top-20 @5xl:max-h-[calc(100vh-6rem)] @5xl:overflow-y-auto @5xl:pr-1">
      <div className="flex items-center gap-2 rounded-2xl border border-sage/30 bg-sage/5 px-4 py-2.5 text-sm font-semibold text-sage-deep">
        <span className={`h-2.5 w-2.5 rounded-full ${carregando ? "animate-pulse bg-[#e0a21a]" : "bg-[#3f9b5b]"}`} />
        Resultados ao vivo
        <span className="ml-auto text-xs font-normal text-ink/50">{carregando ? "atualizando…" : temDados ? "atualizado" : "aguardando os primeiros dados"}</span>
      </div>
      {children}
      {!temDados && <p className="rounded-2xl border border-dashed border-sage/40 bg-white px-4 py-3 text-center text-xs text-sage-deep">{dica}</p>}
    </aside>
  );
}

export function CartaoVivo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="grafico-vivo rounded-2xl border border-mist bg-white p-4">
      <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-sage-deep">{titulo}</div>
      {children}
    </div>
  );
}
