import { faltamCampos } from "../lib/plural";
import { useState } from "react";
import { PlaceholderBadge } from "./PlaceholderBadge";
import { ResultadoResumo } from "./ResultadoResumo";
import type { Teste, AplicacaoDeTeste } from "../lib/api";

interface TesteGenericoProps {
  teste: Teste;
  aplicacao?: AplicacaoDeTeste | null;
  escoresBrutos: Record<string, string>;
  onEscoresChange: (escores: Record<string, string>) => void;
  onSalvar: () => Promise<void>;
  mensagem?: string | null;
  erro?: string | null;
  salvando?: boolean;
}

export function TesteGenerico({
  teste,
  aplicacao,
  escoresBrutos,
  onEscoresChange,
  onSalvar,
  mensagem,
  erro,
  salvando = false,
}: TesteGenericoProps) {
  const campos = teste?.algoritmoCorrecao.campos ?? [];
  const [abertaListaAvisoCamposVazios, setAbertaListaAvisoCamposVazios] = useState(false);

  const camposVazios = campos.filter((c) => !escoresBrutos[c.chave] || escoresBrutos[c.chave].trim() === "");

  return (
    <div className="flex flex-col gap-6">
      {/* Aviso: campos obrigatórios faltando */}
      {camposVazios.length > 0 && (
        <div
          className="rounded-lg border border-amber-200 bg-amber-50 p-4"
          onClick={() => setAbertaListaAvisoCamposVazios((v) => !v)}
        >
          <div className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span className="font-semibold text-amber-900">
                {faltamCampos(camposVazios.length)}
              </span>
            </div>
            <span className="text-xs text-amber-700">{abertaListaAvisoCamposVazios ? "▲" : "▾"}</span>
          </div>
          {abertaListaAvisoCamposVazios && (
            <ul className="mt-2 list-inside list-disc text-sm text-amber-900">
              {camposVazios.map((c) => (
                <li key={c.chave}>{c.label}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Erros */}
      {erro && <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}

      {/* Entrada de escores brutos */}
      <section className="rounded-2xl border border-mist bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wide text-sage-deep">Lançamento de escores — {teste.sigla}</div>
          {teste.isPlaceholder && <PlaceholderBadge />}
        </div>

        {campos.length === 0 ? (
          <p className="text-sm text-ink/60">Este teste não tem campos de lançamento definidos.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {campos.map((campo) => (
              <label key={campo.chave} className="text-sm">
                <span className="mb-1 block font-semibold text-ink/70">{campo.label}</span>
                <input
                  type="number"
                  className="w-full rounded-lg border border-mist px-3 py-2"
                  value={escoresBrutos[campo.chave] ?? ""}
                  onChange={(e) => onEscoresChange({ ...escoresBrutos, [campo.chave]: e.target.value })}
                  placeholder="0"
                />
              </label>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button
            className="rounded-lg bg-sage-deep px-5 py-2.5 text-sm font-semibold text-paper disabled:opacity-40"
            onClick={onSalvar}
            disabled={salvando || camposVazios.length > 0}
          >
            {salvando ? "Salvando..." : aplicacao ? "Salvar edição" : "Salvar lançamento"}
          </button>
        </div>

        {mensagem && <p className="mt-3 text-sm font-semibold text-sage-deep">{mensagem}</p>}
      </section>

      {/* Resultado resumido */}
      {aplicacao?.resultadoCalculado && (
        <section className="rounded-2xl border border-mist bg-paper/60 p-5">
          <div className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">Resultado</div>
          <ResultadoResumo
            resultado={aplicacao.resultadoCalculado}
            direcao={teste.direcao}
            campos={[...(teste.algoritmoCorrecao.campos ?? []), ...(teste.algoritmoCorrecao.camposCalculados ?? [])]}
          />
        </section>
      )}
    </div>
  );
}
