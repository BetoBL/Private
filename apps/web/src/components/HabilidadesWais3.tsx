import { useMemo, useState } from "react";
import type { MarcaHabilidade, MatrizHabilidades } from "../lib/wechsler";

// Colunas na ordem da planilha: subtestes verbais e, depois, os de execução.
const COLUNAS: Array<{ chave: string; sigla: string; nome: string }> = [
  { chave: "informacao", sigla: "IN", nome: "Informação" }, { chave: "semelhancas", sigla: "SM", nome: "Semelhanças" }, { chave: "aritmetica", sigla: "AR", nome: "Aritmética" },
  { chave: "vocabulario", sigla: "VC", nome: "Vocabulário" }, { chave: "compreensao", sigla: "CO", nome: "Compreensão" }, { chave: "digitos", sigla: "DG", nome: "Dígitos" },
  { chave: "sequenciaNumerosLetras", sigla: "SNL", nome: "Sequência de Números e Letras" },
  { chave: "completarFiguras", sigla: "CF", nome: "Completar Figuras" }, { chave: "codigos", sigla: "CD", nome: "Códigos" }, { chave: "arranjoFiguras", sigla: "AF", nome: "Arranjo de Figuras" },
  { chave: "cubos", sigla: "CB", nome: "Cubos" }, { chave: "armarObjetos", sigla: "AO", nome: "Armar Objetos" }, { chave: "procurarSimbolos", sigla: "PS", nome: "Procurar Símbolos" },
  { chave: "raciocinioMatricial", sigla: "RM", nome: "Raciocínio Matricial" },
];
const N_VERBAIS = 7;

const COR_MARCA: Record<"P" | "N" | "0", { fundo: string; texto: string; rotulo: string }> = {
  P: { fundo: "#3f8f5b", texto: "#fff", rotulo: "acima da média (+1 ou mais)" },
  "0": { fundo: "#ecc94b", texto: "#5a4500", rotulo: "dentro da média (menos de 1 de diferença)" },
  N: { fundo: "#c0392b", texto: "#fff", rotulo: "abaixo da média (−1 ou menos)" },
};

function Celula({ marca, envolvida, nome }: { marca: MarcaHabilidade; envolvida: boolean; nome: string }) {
  if (!envolvida) return <td className="px-0.5 py-0.5" />;
  if (marca === null) {
    return (
      <td className="px-0.5 py-0.5 text-center" title={`${nome}: não lançado`}>
        <span className="inline-block h-6 w-6 rounded-md border border-dashed border-ink/25 text-[10px] leading-6 text-ink/30">·</span>
      </td>
    );
  }
  const c = COR_MARCA[marca];
  return (
    <td className="px-0.5 py-0.5 text-center" title={`${nome}: ${c.rotulo}`}>
      <span className="inline-block h-6 w-6 rounded-md text-[11px] font-bold leading-6 shadow-sm" style={{ background: c.fundo, color: c.texto }}>
        {marca}
      </span>
    </td>
  );
}

export function HabilidadesWais3({ matriz }: { matriz: MatrizHabilidades }) {
  const [variante, setVariante] = useState<"total" | "verbalExecucao" | null>(null);
  const [soDestaques, setSoDestaques] = useState(false);
  const modo = variante ?? matriz.recomendado;
  const resultados = matriz[modo];

  const linhas = useMemo(() => matriz.lista.map((h, i) => ({ h, r: resultados[i] })), [matriz, resultados]);
  const forcas = linhas.filter((l) => l.r.interpretacao === "Força");
  const fraquezas = linhas.filter((l) => l.r.interpretacao === "Fraqueza");
  const incompletas = linhas.filter((l) => !l.r.completa).length;
  const visiveis = soDestaques ? linhas.filter((l) => l.r.interpretacao) : linhas;
  const grupos = [...new Set(visiveis.map((l) => l.h.grupo))];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-2xl text-sm text-ink/65">
          Cada habilidade reúne de 2 a 8 subtestes. Cada subteste é marcado pela diferença para a média da própria pessoa: <strong className="text-[#3f8f5b]">P</strong> (+1 ou mais), <strong className="text-[#9a7b00]">0</strong> (dentro de ±1) ou <strong className="text-[#c0392b]">N</strong> (−1 ou menos).
          Força ou fraqueza só é apontada quando todos os subtestes da habilidade foram lançados e quase todos vão para o mesmo lado.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-ink/70">Média usada</span>
          <select className="rounded-lg border border-mist bg-white px-3 py-1.5 text-sm" value={modo} onChange={(e) => setVariante(e.target.value as "total" | "verbalExecucao")}>
            <option value="total">Todos os subtestes{matriz.recomendado === "total" ? " (recomendado)" : ""}</option>
            <option value="verbalExecucao">Verbais e de execução separadas{matriz.recomendado === "verbalExecucao" ? " (recomendado)" : ""}</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ResumoLista titulo="Forças" cor="#3f8f5b" itens={forcas.map((l) => l.h.nome)} />
        <ResumoLista titulo="Fraquezas" cor="#c0392b" itens={fraquezas.map((l) => l.h.nome)} />
      </div>
      {incompletas > 0 && (
        <p className="text-xs text-ink/55">
          {incompletas} de {matriz.lista.length} habilidades ainda não podem ser interpretadas porque incluem subtestes não lançados (células tracejadas).
        </p>
      )}

      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" checked={soDestaques} onChange={(e) => setSoDestaques(e.target.checked)} />
        <span className="text-ink/70">Mostrar só as habilidades com força ou fraqueza</span>
      </label>

      <div className="overflow-x-auto rounded-xl border border-mist">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="bg-paper text-[10px] uppercase tracking-wide text-ink/50">
              <th className="px-2 py-1 text-left font-semibold" colSpan={2}></th>
              <th className="px-2 py-1 text-center font-semibold" colSpan={N_VERBAIS}>
                Subtestes verbais
              </th>
              <th className="border-l border-mist px-2 py-1 text-center font-semibold" colSpan={COLUNAS.length - N_VERBAIS}>
                Subtestes de execução
              </th>
              <th className="border-l border-mist px-2 py-1 text-center font-semibold" colSpan={4}>
                Contagem
              </th>
              <th className="border-l border-mist px-2 py-1 text-left font-semibold">Interpretação</th>
            </tr>
            <tr className="bg-paper text-[11px] font-bold text-ink/60">
              <th className="w-8 px-2 py-1 text-right">#</th>
              <th className="px-2 py-1 text-left">Habilidade</th>
              {COLUNAS.map((c, i) => (
                <th key={c.chave} title={c.nome} className={`w-8 px-0.5 py-1 text-center ${i === N_VERBAIS ? "border-l border-mist" : ""}`}>
                  {c.sigla}
                </th>
              ))}
              <th className="border-l border-mist px-1.5 py-1 text-center text-[#3f8f5b]">P</th>
              <th className="px-1.5 py-1 text-center text-[#c0392b]">N</th>
              <th className="px-1.5 py-1 text-center text-[#9a7b00]">0</th>
              <th className="px-1.5 py-1 text-center">Tot.</th>
              <th className="border-l border-mist px-2 py-1"></th>
            </tr>
          </thead>
          <tbody>
            {grupos.map((grupo) => (
              <GrupoHabilidades key={grupo} grupo={grupo} linhas={visiveis.filter((l) => l.h.grupo === grupo)} />
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-ink/45">Fonte: Kaufman AS, Lichtenberger EO. Assessing Adolescent and Adult Intelligence — Third Edition. John Wiley &amp; Sons, 2002, p. 456.</p>
    </div>
  );
}

function ResumoLista({ titulo, cor, itens }: { titulo: string; cor: string; itens: string[] }) {
  return (
    <div className="rounded-xl border border-mist px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: cor }} />
        <span className="text-[11px] font-bold uppercase tracking-wide text-ink/55">{titulo}</span>
        <span className="font-serif text-lg font-semibold tabular-nums text-ink">{itens.length}</span>
      </div>
      {itens.length === 0 ? (
        <p className="text-xs text-ink/45">Nenhuma habilidade com {titulo.toLowerCase().slice(0, -1)} apontada.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {itens.map((n) => (
            <span key={n} className="wais-entra rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white" style={{ background: cor }}>
              {n}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function GrupoHabilidades({ grupo, linhas }: { grupo: string; linhas: Array<{ h: MatrizHabilidades["lista"][number]; r: MatrizHabilidades["total"][number] }> }) {
  return (
    <>
      <tr className="border-t border-mist">
        <td colSpan={COLUNAS.length + 7} className="bg-sage-deep/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-sage-deep">
          {grupo}
        </td>
      </tr>
      {linhas.map(({ h, r }) => (
        <tr key={h.nome} className="border-t border-mist/60 hover:bg-paper/70">
          <td className="px-2 py-0.5 text-right text-[11px] tabular-nums text-ink/40">{h.numero}</td>
          <td className="px-2 py-0.5 text-[13px]">{h.nome}</td>
          {COLUNAS.map((c) => (
            <Celula key={c.chave} marca={r.marcas[c.chave] ?? null} envolvida={h.subtestes.includes(c.chave)} nome={c.nome} />
          ))}
          <td className="border-l border-mist px-1.5 py-0.5 text-center text-[12px] tabular-nums">{r.completa || r.total > 0 ? r.p : ""}</td>
          <td className="px-1.5 py-0.5 text-center text-[12px] tabular-nums">{r.completa || r.total > 0 ? r.n : ""}</td>
          <td className="px-1.5 py-0.5 text-center text-[12px] tabular-nums">{r.completa || r.total > 0 ? r.zero : ""}</td>
          <td className="px-1.5 py-0.5 text-center text-[12px] tabular-nums text-ink/60">{r.total}/{h.subtestes.length}</td>
          <td className="border-l border-mist px-2 py-0.5">
            {r.interpretacao === "Força" && <span className="inline-block rounded-full bg-[#3f8f5b] px-2.5 py-0.5 text-[11px] font-bold text-white">Força</span>}
            {r.interpretacao === "Fraqueza" && <span className="inline-block rounded-full bg-[#c0392b] px-2.5 py-0.5 text-[11px] font-bold text-white">Fraqueza</span>}
          </td>
        </tr>
      ))}
    </>
  );
}
