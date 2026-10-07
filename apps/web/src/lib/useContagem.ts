import { useEffect, useRef, useState } from "react";

export function prefereMovimentoReduzido(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

// Número que "conta" até o valor (easeOutCubic). Com movimento reduzido, vai direto ao valor.
export function useContagem(alvo: number | null, duracaoMs = 800): number | null {
  const [valor, setValor] = useState<number | null>(alvo);
  const anterior = useRef<number | null>(alvo);

  useEffect(() => {
    if (alvo === null) {
      setValor(null);
      anterior.current = null;
      return;
    }
    if (prefereMovimentoReduzido()) {
      setValor(alvo);
      anterior.current = alvo;
      return;
    }
    const de = anterior.current ?? alvo - Math.min(20, Math.abs(alvo));
    const inicio = performance.now();
    let raf = 0;
    const passo = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / duracaoMs);
      const suave = 1 - Math.pow(1 - t, 3);
      setValor(Math.round(de + (alvo - de) * suave));
      if (t < 1) raf = requestAnimationFrame(passo);
      else anterior.current = alvo;
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [alvo, duracaoMs]);

  return valor;
}
