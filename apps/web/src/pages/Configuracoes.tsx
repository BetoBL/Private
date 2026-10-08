import { Link } from "react-router-dom";

// Tela única de configurações e cadastros: o menu lateral fica só com o trabalho do dia a dia.
export const ROTAS_CONFIGURACOES = ["/configuracoes", "/clinica", "/profissionais", "/tipos-atendimento", "/normativas", "/modelos-laudo", "/perfil-atuacao", "/fiscal"];

const GRUPOS: Array<{ titulo: string; itens: Array<{ to: string; nome: string; texto: string }> }> = [
  {
    titulo: "Clínica",
    itens: [
      { to: "/clinica", nome: "Dados da clínica", texto: "Nome, endereço, logotipo e papel timbrado dos documentos, e convênios aceitos." },
      { to: "/fiscal", nome: "Dados fiscais", texto: "Nota fiscal de serviço: município, código do serviço, imposto, numeração e quando emitir." },
      { to: "/profissionais", nome: "Profissionais", texto: "Quem atende na clínica, com CRP, assinatura e acesso ao sistema." },
    ],
  },
  {
    titulo: "Atendimento",
    itens: [
      { to: "/tipos-atendimento", nome: "Tipos de atendimento", texto: "Pacotes de avaliação: número de sessões e testes de cada um." },
      { to: "/modelos-laudo", nome: "Modelos de laudo", texto: "Laudos, relatórios, pareceres, declarações e atestados, e o modelo padrão de cada um." },
      { to: "/normativas", nome: "Normativas", texto: "Tabelas de referência próprias para a correção dos testes." },
    ],
  },
  {
    titulo: "Minha conta",
    itens: [{ to: "/perfil-atuacao", nome: "Meu perfil de atuação", texto: "Abordagem, estilo de escrita e a convenção de classificação por percentil dos seus laudos." }],
  },
];

export function Configuracoes() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-serif text-3xl text-ink">Configurações</h1>
      <p className="mt-1 text-sm text-ink/60">Cadastros e preferências do sistema. O que você usa no dia a dia está no menu ao lado.</p>
      <div className="mt-8 space-y-9">
        {GRUPOS.map((g) => (
          <section key={g.titulo}>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">{g.titulo}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.itens.map((i) => (
                <Link key={i.to} to={i.to} className="group flex flex-col rounded-2xl border border-mist bg-white p-5 transition-colors hover:border-sage-deep/60 hover:bg-sage-deep/[0.03]">
                  <span className="font-serif text-lg leading-snug text-ink group-hover:text-sage-deep">{i.nome}</span>
                  <span className="mt-1.5 text-sm leading-relaxed text-ink/60">{i.texto}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
