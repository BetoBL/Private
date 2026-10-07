import { useEffect, useRef, useState } from "react";
import { inscreverAvisos } from "../lib/aviso";

// Um aviso por vez, no rodapé, que aparece e some sozinho. Discreto de propósito: não rouba foco
// nem cobre o conteúdo (pointer-events-none) e é anunciado a leitores de tela via role="status".
export function Avisos() {
  const [aviso, setAviso] = useState<{ texto: string; visivel: boolean } | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const limpar = () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    };
    const cancelar = inscreverAvisos((texto) => {
      limpar();
      setAviso({ texto, visivel: true });
      const duracao = Math.min(6000, 2600 + texto.length * 40);
      timers.current.push(
        window.setTimeout(() => setAviso((a) => (a ? { ...a, visivel: false } : a)), duracao),
        window.setTimeout(() => setAviso(null), duracao + 300)
      );
    });
    return () => {
      cancelar();
      limpar();
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4" role="status" aria-live="polite">
      {aviso && (
        <div
          className={`flex max-w-md items-center gap-2 rounded-full bg-ink/90 px-4 py-2 text-xs font-medium text-paper shadow-lg transition-all duration-300 ${
            aviso.visivel ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
          }`}
        >
          <span className="text-salmon" aria-hidden="true">
            ✓
          </span>
          {aviso.texto}
        </div>
      )}
    </div>
  );
}
