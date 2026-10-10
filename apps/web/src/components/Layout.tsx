import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, type Clinica } from "../lib/api";
import { ROTAS_CONFIGURACOES } from "../pages/Configuracoes";

const LINKS = [
  { to: "/", label: "Painel do dia", end: true },
  { to: "/pacientes", label: "Pacientes" },
  { to: "/agenda", label: "Agenda" },
  { to: "/iniciar-atendimento", label: "Iniciar atendimento" },
  { to: "/laudo", label: "Laudos" },
  { to: "/financeiro", label: "Financeiro" },
  { to: "/notas", label: "Notas fiscais" },
  // Abre em aba nova, de propósito: a Biblioteca de Instrumentos é um ambiente visual próprio
  // (ver pages/BibliotecaDeTestes.tsx), não uma rota dentro desta casca de sidebar escura.
  { to: "/biblioteca", label: "Testes e correção", novaAba: true },
];

export function Layout() {
  const { profissional, logout } = useAuth();
  const [clinica, setClinica] = useState<Clinica | null>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // Seta de voltar em TODAS as telas desta casca: volta à etapa anterior (histórico); se a tela foi aberta direto, vai ao Painel do dia.
  const voltar = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate("/"));

  useEffect(() => {
    if (!profissional) return;
    api.getClinica(profissional.clinicaId).then(setClinica).catch(() => setClinica(null));
  }, [profissional]);

  if (!profissional) return null;

  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr]">
      <aside className="flex flex-col gap-9 bg-ink px-6 py-8 text-paper">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-paper/60 font-serif text-sm">
            ME
          </div>
          <div>
            <div className="font-serif text-[17px] leading-tight">MentEssence</div>
            <div className="mt-0.5 text-[10.5px] uppercase tracking-wide opacity-60">Neuropsicologia &amp; Avaliação</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {LINKS.map((link) =>
            link.novaAba ? (
              <a
                key={link.to}
                href={link.to}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm opacity-75 transition-opacity hover:bg-paper/10 hover:opacity-100"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                {link.label}
                <span className="ml-auto text-[10px] opacity-60">↗</span>
              </a>
            ) : (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-opacity ${
                    isActive ? "bg-sage-deep opacity-100" : "opacity-75 hover:opacity-100 hover:bg-paper/10"
                  }`
                }
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                {link.label}
              </NavLink>
            )
          )}
        </nav>

        <NavLink
          to="/configuracoes"
          className={() =>
            `mt-auto flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-opacity ${
              ROTAS_CONFIGURACOES.some((r) => pathname === r || pathname.startsWith(`${r}/`)) ? "bg-sage-deep opacity-100" : "opacity-75 hover:opacity-100 hover:bg-paper/10"
            }`
          }
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
          Configurações
        </NavLink>

        <div className="text-[11px] leading-relaxed opacity-45">
          {clinica?.nomeFantasia || clinica?.razaoSocial || "Clínica"}
          <br />
          CRP {profissional.crp}
        </div>
      </aside>

      <div className="flex flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-mist bg-white px-6 py-3 text-sm text-ink/60">
          {pathname !== "/" ? (
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 font-semibold text-sage-deep transition-colors hover:bg-sage-deep/10" onClick={voltar} title="Voltar à etapa anterior">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Voltar
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
          <span>{profissional.nome}</span>
          <button className="rounded-lg border border-mist px-3 py-1.5 font-semibold text-ink/70" onClick={logout}>
            Sair
          </button>
          </div>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
