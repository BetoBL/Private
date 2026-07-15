import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, atualizarProfissionalLogadoEmCache, obterProfissionalLogado, setOnUnauthorized, type ProfissionalLogado } from "../lib/api";

interface AuthContextValue {
  profissional: ProfissionalLogado | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profissional, setProfissional] = useState<ProfissionalLogado | null>(() => obterProfissionalLogado());

  useEffect(() => {
    setOnUnauthorized(() => setProfissional(null));
    return () => setOnUnauthorized(null);
  }, []);

  // Sessões antigas (de antes de campos como `papel` existirem) ficam com o profissional em
  // cache desatualizado no localStorage, escondendo silenciosamente telas de admin. Revalida
  // contra a API uma vez ao carregar o app.
  useEffect(() => {
    if (!profissional) return;
    let cancelado = false;
    api
      .getProfissional(profissional.id)
      .then((atual) => {
        if (cancelado) return;
        const logado: ProfissionalLogado = {
          id: atual.id,
          clinicaId: atual.clinicaId,
          nome: atual.nome,
          email: atual.email,
          crp: atual.crp,
          papel: atual.papel,
        };
        atualizarProfissionalLogadoEmCache(logado);
        setProfissional(logado);
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profissional?.id]);

  async function login(email: string, senha: string) {
    const logado = await api.login(email, senha);
    setProfissional(logado);
  }

  function logout() {
    api.logout();
    setProfissional(null);
  }

  return <AuthContext.Provider value={{ profissional, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
