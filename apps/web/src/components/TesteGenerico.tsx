import { useEffect, useState } from "react";
import { api, type AplicacaoDeTeste, type ResultadoCalculado, type Teste } from "../lib/api";
import { CabecalhoEstudio } from "./CabecalhoEstudio";
import { CartaoVivo, PainelVivo } from "./PainelVivo";
import { PlaceholderBadge } from "./PlaceholderBadge";
import { ResultadoResumo } from "./ResultadoResumo";

// Teste de lançamento simples (um ou poucos escores): a mesma tela de estúdio dos outros testes, com o resultado calculado ao vivo.
interface TesteGenericoProps {
  teste: Teste;
  aplicacao?: AplicacaoDeTeste | null;
  escoresBrutos: Record<string, string>;
  onEscoresChange: (escores: Record<string, string>) => void;
  onSalvar: () => Promise<void>;
  mensagem?: string | null;
  erro?: string | null;
  salvando?: boolean;
  sessaoId?: string;
  testeId?: string;
}

type Info = Awaited<ReturnType<typeof api.calcularAplicacao>>;

export function TesteGenerico({ teste, aplicacao, escoresBrutos, onEscoresChange, onSalvar, mensagem, erro, salvando = false, sessaoId, testeId }: TesteGenericoProps) {
  const campos = teste?.algoritmoCorrecao.campos ?? [];
  const camposResultado = [...campos, ...(teste.algoritmoCorrecao.camposCalculados ?? [])];
  const lancados = campos.filter((c) => (escoresBrutos[c.chave] ?? "").trim() !== "");
  const camposVazios = campos.filter((c) => (escoresBrutos[c.chave] ?? "").trim() === "");
  const [calc, setCalc] = useState<{ resultado: ResultadoCalculado | null; info?: Info; carregando: boolean; erro?: string }>({ resultado: null, carregando: false });

  // resultado ao vivo: recalcula pelo servidor (com a idade do paciente na data da sessão) um instante depois de cada digitação
  useEffect(() => {
    const numeros: Record<string, number> = {};
    for (const [k, v] of Object.entries(escoresBrutos)) if (v !== undefined && v.trim() !== "" && !Number.isNaN(Number(v))) numeros[k] = Number(v);
    if (!sessaoId || !testeId || Object.keys(numeros).length === 0) { setCalc((c) => ({ ...c, resultado: null, carregando: false, erro: undefined })); return; }
    let cancelado = false;
    setCalc((c) => ({ ...c, carregando: true }));
    const t = setTimeout(() => {
      api.calcularAplicacao({ sessaoId, testeId, escoresBrutos: numeros })
        .then((r) => !cancelado && setCalc({ resultado: r.resultadoCalculado, info: r, carregando: false }))
        .catch((e) => !cancelado && setCalc((c) => ({ ...c, carregando: false, erro: (e as Error).message })));
    }, 350);
    return () => { cancelado = true; clearTimeout(t); };
  }, [escoresBrutos, sessaoId, testeId]);

  const resultado = calc.resultado ?? (lancados.length > 0 ? aplicacao?.resultadoCalculado ?? null : null);

  return (
    <div className="@container flex flex-col gap-4">
      <CabecalhoEstudio
        sigla={teste.sigla} nome={aplicacao?.teste.nome || teste.nome} dominio={teste.dominio}
        paciente={calc.info?.paciente.nome} idade={calc.info?.idadeTexto} data={calc.info ? new Date(calc.info.dataAplicacao).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : undefined}
        lancados={lancados.length} total={campos.length} calculando={calc.carregando} salvando={salvando} podeSalvar={camposVazios.length === 0 && campos.length > 0} onSalvar={onSalvar}
      />
      {teste.isPlaceholder && <div><PlaceholderBadge /></div>}
      {erro && <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
      {calc.erro && !erro && <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{calc.erro}</div>}

      <div className="grid items-start gap-5 @5xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-mist bg-white p-5">
          <div className="mb-4 text-xs font-bold uppercase tracking-wide text-sage-deep">Lançamento de escores</div>
          {campos.length === 0 ? (
            <p className="text-sm text-ink/60">Este teste não tem campos de lançamento definidos.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {campos.map((campo) => (
                <label key={campo.chave} className="block rounded-xl border border-mist px-3 py-2.5 text-sm focus-within:border-sage focus-within:ring-2 focus-within:ring-sage/20">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/50">{campo.label}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="w-full bg-transparent text-xl font-semibold tabular-nums text-ink outline-none"
                    value={escoresBrutos[campo.chave] ?? ""}
                    onChange={(e) => onEscoresChange({ ...escoresBrutos, [campo.chave]: e.target.value })}
                    placeholder="0"
                  />
                </label>
              ))}
            </div>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-mist pt-4">
            <button className="rounded-lg bg-sage-deep px-5 py-2.5 text-sm font-semibold text-paper disabled:opacity-40" onClick={onSalvar} disabled={salvando || camposVazios.length > 0}>
              {salvando ? "Salvando..." : aplicacao ? "Salvar edição" : "Salvar lançamento"}
            </button>
            {camposVazios.length > 0 && <span className="text-xs text-ink/55">{camposVazios.length === 1 ? "Falta 1 campo" : `Faltam ${camposVazios.length} campos`} para salvar.</span>}
            {mensagem && <span className="text-sm font-semibold text-sage-deep">{mensagem}</span>}
          </div>
        </section>

        <PainelVivo carregando={calc.carregando} temDados={!!resultado} dica="O resultado e a barra de classificação aparecem aqui assim que você digitar o escore.">
          <CartaoVivo titulo="Resultado">
            {resultado ? (
              <ResultadoResumo resultado={resultado} direcao={teste.direcao} campos={camposResultado} />
            ) : (
              <ul className="space-y-3">
                {(campos.length ? campos : [{ chave: "x", label: "Escore" }]).slice(0, 6).map((c) => (
                  <li key={c.chave}>
                    <div className="flex items-baseline justify-between text-xs"><span className="font-semibold text-ink/50">{c.label}</span><span className="text-ink/30">aguardando</span></div>
                    <div className="mt-1 h-2.5 w-full rounded-full bg-mist/70" />
                  </li>
                ))}
              </ul>
            )}
          </CartaoVivo>
        </PainelVivo>
      </div>
    </div>
  );
}
