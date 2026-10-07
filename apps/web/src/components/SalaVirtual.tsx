import { useEffect, useState } from "react";
import { api, type SalaVirtual } from "../lib/api";

interface SalaVirtualProps {
  sessaoId: string;
  dataHora: string;
}

export function SalaVirtualComponent({ sessaoId }: SalaVirtualProps) {
  const [sala, setSala] = useState<SalaVirtual | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    carregarSalas();
  }, [sessaoId]);

  async function carregarSalas() {
    try {
      const salas = await api.listSalasVirtuais(sessaoId);
      if (salas.length > 0) {
        setSala(salas[0]); // Pega a mais recente
      }
    } catch (e) {
      // Sem sala ainda é ok
    }
  }

  async function criarSala() {
    setCarregando(true);
    setErro(null);
    try {
      const nova = await api.criarSalaVirtual({ sessaoId });
      setSala(nova);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
    }
  }

  async function entrarSala() {
    if (!sala) return;
    try {
      // Marca início se for primeira vez
      if (!sala.inicioReal) {
        await api.atualizarSalaVirtual(sala.id, {
          statusSala: "em_andamento",
          inicioReal: new Date().toISOString(),
          profissionalPresente: true,
        });
      }
      // Abre Jitsi em nova aba
      window.open(sala.urlJitsi, "_blank");
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function encerrarSala() {
    if (!sala) return;
    try {
      await api.atualizarSalaVirtual(sala.id, {
        statusSala: "encerrada",
        fimReal: new Date().toISOString(),
      });
      setSala(null);
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  return (
    <div className="space-y-3">
      {erro && <div className="rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}

      {!sala ? (
        <div className="rounded-2xl border border-mist bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold text-ink">Sala Virtual (Telepsicologia)</div>
              <p className="mt-1 text-xs text-ink/60">
                Criptografada ponta-a-ponta via Jitsi Meet. Sem gravação armazenada (conforme Resolução CFP nº 11/2018).
              </p>
            </div>
            <button
              className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper disabled:opacity-40"
              disabled={carregando}
              onClick={criarSala}
            >
              {carregando ? "Criando..." : "✦ Criar Sala"}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-sage-deep/50 bg-sage-deep/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="font-semibold text-ink">Sala Ativa</div>
              <div className="mt-0.5 text-xs text-ink/60">
                Status: <span className="font-semibold text-sage-deep">{sala.statusSala}</span>
              </div>
              <div className="mt-1 rounded-lg bg-white/50 p-2 font-mono text-xs text-ink/50">{sala.codigoSala}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              className="flex-1 rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper"
              onClick={entrarSala}
            >
              🎥 Entrar na Sala
            </button>
            {sala.statusSala === "em_andamento" && (
              <button
                className="rounded-lg border border-mist px-4 py-2 text-sm font-semibold text-ember"
                onClick={encerrarSala}
              >
                Encerrar
              </button>
            )}
          </div>

          <div className="mt-3 text-xs text-ink/50">
            Criada: {new Date(sala.criadoEm).toLocaleString("pt-BR")}
            {sala.inicioReal && ` • Iniciada: ${new Date(sala.inicioReal).toLocaleTimeString("pt-BR")}`}
            {sala.fimReal && ` • Encerrada: ${new Date(sala.fimReal).toLocaleTimeString("pt-BR")}`}
          </div>
        </div>
      )}
    </div>
  );
}
