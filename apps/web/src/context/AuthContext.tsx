import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, obterProfissionalLogado, setOnUnauthorized, type ProfissionalLogado } from "../lib/api";

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
