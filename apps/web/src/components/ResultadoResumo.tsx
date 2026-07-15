import type { FaixaConversao, ResultadoCalculado } from "../lib/api";

function textoFaixa(faixa: FaixaConversao | null): string {
  if (!faixa) return "sem faixa normativa correspondente";
  const partes: string[] = [];
  if (faixa.percentil !== undefined) partes.push(`percentil ${faixa.percentil}`);
  if (faixa.escoreT !== undefined) partes.push(`escore T ${faixa.escoreT}`);
  if (faixa.qi !== undefined) partes.push(`QI ${faixa.qi}`);
  if (faixa.classificacao) partes.push(String(faixa.classificacao));
  return partes.join(" · ") || "sem classificação";
}

export function ResultadoResumo({ resultado }: { resultado: ResultadoCalculado | null }) {
  if (!resultado) {
    return <p className="mt-1 text-ink/50">Resultado ainda não calculado.</p>;
  }

  if (resultado.modo === "soma") {
    return (
      <p className="mt-1 text-ink/70">
        Escore bruto total: <span className="font-semibold">{resultado.escoreBrutoTotal}</span> — {textoFaixa(resultado.faixa)}
      </p>
    );
  }

  return (
    <ul className="mt-1 text-ink/70">
      {Object.entries(resultado.porCampo).map(([chave, r]) => (
        <li key={chave}>
          <span className="font-semibold">{chave}</span>: {r.valorBruto} — {textoFaixa(r.faixa)}
        </li>
      ))}
    </ul>
  );
}
