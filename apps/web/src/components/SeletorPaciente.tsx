import { useEffect, useRef, useState } from "react";
import type { Paciente } from "../lib/api";

export function SeletorPaciente({
  pacientes,
  value,
  onChange,
  placeholder = "Digite para buscar um paciente...",
}: {
  pacientes: Paciente[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const selecionado = pacientes.find((p) => p.id === value) ?? null;
  const [query, setQuery] = useState(selecionado?.nome ?? "");
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(selecionado?.nome ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selecionado?.id]);

  useEffect(() => {
    function aoClicarFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  const filtrados = query.trim() ? pacientes.filter((p) => p.nome.toLowerCase().includes(query.trim().toLowerCase())) : pacientes;

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1.5">
        <input
          className="w-full rounded-lg border border-mist bg-paper px-3 py-2 text-sm"
          placeholder={placeholder}
          value={query}
          onFocus={() => setAberto(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setAberto(true);
          }}
        />
        {value && (
          <button
            type="button"
            className="shrink-0 text-ink/40 hover:text-ember"
            onClick={() => {
              onChange("");
              setQuery("");
            }}
          >
            ×
          </button>
        )}
      </div>
      {aberto && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-mist bg-white shadow-lg">
          {filtrados.length === 0 && <div className="px-3 py-2 text-sm text-ink/40">Nenhum paciente encontrado.</div>}
          {filtrados.map((p) => (
            <button
              key={p.id}
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-paper"
              onClick={() => {
                onChange(p.id);
                setQuery(p.nome);
                setAberto(false);
              }}
            >
              {p.nome}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
