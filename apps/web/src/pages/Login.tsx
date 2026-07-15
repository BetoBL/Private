import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      await login(email, senha);
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-mist bg-white p-8">
        <h1 className="mb-1 font-serif text-2xl text-ink">MentEssence</h1>
        <p className="mb-6 text-sm text-ink/60">Entre com seu e-mail e senha.</p>

        {erro && <div className="mb-4 rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}

        <label className="mb-3 block text-sm">
          <span className="mb-1 block font-semibold text-ink/70">E-mail</span>
          <input
            type="email"
            className="w-full rounded-lg border border-mist px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="mb-6 block text-sm">
          <span className="mb-1 block font-semibold text-ink/70">Senha</span>
          <input
            type="password"
            className="w-full rounded-lg border border-mist px-3 py-2"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-lg bg-sage-deep px-4 py-2.5 text-sm font-semibold text-paper disabled:opacity-40"
          disabled={carregando}
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
