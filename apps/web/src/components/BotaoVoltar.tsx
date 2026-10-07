import { useNavigate } from "react-router-dom";

export function BotaoVoltar() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/")}
      className="mb-6 flex items-center gap-2 text-sm font-semibold text-sage-deep hover:text-sage-deep/80 transition-colors"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      Voltar para Painel do dia
    </button>
  );
}
