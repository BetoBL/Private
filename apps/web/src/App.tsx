import { useState } from "react";
import { ComposicaoLaudo } from "./pages/ComposicaoLaudo";
import { LancamentoTeste } from "./pages/LancamentoTeste";

type Tela = "testes" | "laudo";

function App() {
  const [tela, setTela] = useState<Tela>("testes");

  return (
    <div>
      <nav className="flex gap-2 border-b border-mist bg-white px-6 py-3">
        <button
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tela === "testes" ? "bg-sage-deep text-paper" : "text-ink/60"}`}
          onClick={() => setTela("testes")}
        >
          Testes & Correção
        </button>
        <button
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${tela === "laudo" ? "bg-sage-deep text-paper" : "text-ink/60"}`}
          onClick={() => setTela("laudo")}
        >
          Laudo
        </button>
      </nav>
      {tela === "testes" ? <LancamentoTeste /> : <ComposicaoLaudo />}
    </div>
  );
}

export default App;
