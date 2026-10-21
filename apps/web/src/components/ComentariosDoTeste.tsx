import { useState } from "react";
import type { Teste } from "../lib/api";

// Comentários do profissional sobre esta aplicação e guia de lançamento do teste (o que é e como inserir os dados).
const DICAS = [
  "Digite só o que foi aplicado. Campo em branco não entra no cálculo (não vale zero).",
  "Os resultados e os gráficos ao lado são calculados enquanto você digita, com a idade do paciente na data da sessão.",
  "Escolha a tabela normativa certa (idade, escolaridade ou sexo) antes de conferir os resultados.",
  "Anote nos comentários o que influenciou o desempenho: cansaço, medicação, interrupções, adaptações.",
];

export function ComentariosDoTeste({ teste, valor, onChange }: { teste: Teste; valor: string; onChange: (v: string) => void }) {
  const [aba, setAba] = useState<"comentarios" | "guia">("comentarios");
  const pill = (a: boolean) => `rounded-full px-4 py-1.5 text-sm font-semibold transition ${a ? "bg-sage-deep text-white shadow" : "border border-mist bg-white text-ink/60 hover:border-sage"}`;
  return (
    <section className="mt-5 rounded-3xl border border-mist bg-white p-5 shadow-[0_8px_24px_-12px_rgba(38,38,36,0.12)]">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="mr-2 font-serif text-xl text-ink">Anotações do teste</h2>
        <button type="button" className={pill(aba === "comentarios")} onClick={() => setAba("comentarios")}>💬 Meus comentários</button>
        <button type="button" className={pill(aba === "guia")} onClick={() => setAba("guia")}>📘 Como lançar os dados</button>
      </div>
      {aba === "comentarios" ? (
        <div>
          <textarea
            className="min-h-32 w-full rounded-2xl border border-mist bg-paper/60 px-4 py-3 text-sm leading-relaxed outline-none focus:border-sage focus:ring-2 focus:ring-sage/20"
            placeholder="Observações clínicas sobre esta aplicação: comportamento durante o teste, adaptações, condições de aplicação, interpretação preliminar…"
            maxLength={20000}
            value={valor}
            onChange={(e) => onChange(e.target.value)}
          />
          <p className="mt-2 text-xs text-ink/50">Os comentários ficam guardados junto com o lançamento ao clicar em "Salvar lançamento". Só você e o administrador leem.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-[1.3fr_1fr]">
          <div>
            <h3 className="font-semibold text-ink">{teste.sigla} <span className="font-normal text-ink/55">· {teste.nome}</span></h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink/75">{teste.descricao?.trim() || "Este teste ainda não tem uma descrição cadastrada. Siga o manual do instrumento ao aplicar e digite os escores brutos nos campos ao lado."}</p>
            {teste.referenciaBibliografica?.trim() && <p className="mt-3 rounded-xl bg-paper px-3 py-2 text-xs text-ink/60"><b className="text-ink/70">Referência:</b> {teste.referenciaBibliografica}</p>}
          </div>
          <ul className="space-y-2 text-sm text-ink/75">
            {DICAS.map((d) => <li key={d} className="flex gap-2 rounded-xl bg-sage/5 px-3 py-2"><span aria-hidden>✔</span><span>{d}</span></li>)}
          </ul>
        </div>
      )}
    </section>
  );
}
