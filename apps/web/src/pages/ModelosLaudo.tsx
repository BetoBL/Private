import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type ModeloLaudo } from "../lib/api";
import { useAviso } from "../lib/aviso";

export function arquivoParaBase64(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result).replace(/^data:[^,]+,/, ""));
    leitor.onerror = () => reject(new Error("Não consegui ler o arquivo."));
    leitor.readAsDataURL(arquivo);
  });
}

function Cartao({ m, onPadrao, onApagar }: { m: ModeloLaudo; onPadrao: () => void; onApagar: () => void }) {
  const secoes = m.estrutura.secoes.filter((s) => s.titulo && s.ativo !== false);
  return (
    <article className={`flex flex-col rounded-2xl border bg-white p-5 ${m.ehPadrao ? "border-sage-deep/50 shadow-[0_0_0_1px_rgba(0,0,0,0.02)]" : "border-mist"}`}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-paper px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink/55">{m.rotuloTipo}</span>
        {m.sistema && <span className="rounded-full border border-mist px-2.5 py-0.5 text-[11px] font-semibold text-ink/50">Modelo do sistema</span>}
        {m.escopo === "clinica" && <span className="rounded-full border border-mist px-2.5 py-0.5 text-[11px] font-semibold text-ink/50">Da clínica</span>}
        {m.ehPadrao && <span className="rounded-full bg-sage-deep px-2.5 py-0.5 text-[11px] font-bold text-paper">Meu padrão</span>}
        {m.temArquivoWord && <span className="rounded-full border border-sage-deep/40 px-2.5 py-0.5 text-[11px] font-semibold text-sage-deep">Word da clínica</span>}
      </div>
      <h3 className="font-serif text-lg leading-snug text-ink">{m.nome}</h3>
      {m.descricao && <p className="mt-1 text-sm leading-relaxed text-ink/65">{m.descricao}</p>}
      {secoes.length > 0 && <p className="mt-3 text-xs leading-relaxed text-ink/50">{secoes.map((s) => s.titulo.toLowerCase()).join(" · ")}</p>}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        {m.tipo !== "LAUDO_NEURO" && <Link to={`/modelos-laudo/${m.id}`} className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper">{m.sistema ? "Ver e criar a partir dele" : "Abrir e editar"}</Link>}
        {!m.ehPadrao && <button className="rounded-lg border border-sage-deep px-3 py-2 text-sm font-semibold text-sage-deep hover:bg-sage-deep/5" onClick={onPadrao}>Usar como meu padrão</button>}
        {!m.sistema && <button className="ml-auto rounded-lg px-3 py-2 text-sm font-semibold text-ember hover:bg-ember/10" onClick={onApagar}>Apagar</button>}
      </div>
    </article>
  );
}

export function ModelosLaudo() {
  const navigate = useNavigate();
  const [modelos, setModelos] = useState<ModeloLaudo[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useAviso();
  const [lendo, setLendo] = useState(false);
  const seletor = useRef<HTMLInputElement>(null);

  const carregar = () => api.listModelosLaudo().then(setModelos).catch((e) => setErro(e.message));
  useEffect(() => { carregar(); }, []);

  async function padrao(m: ModeloLaudo) {
    setErro(null);
    try { await api.definirModeloPadrao(m.id); setMensagem(`“${m.nome}” é o seu modelo padrão.`); carregar(); } catch (e) { setErro((e as Error).message); }
  }
  async function apagar(m: ModeloLaudo) {
    if (!confirm(`Apagar o modelo “${m.nome}”? Os laudos que já usam este modelo continuam saindo com ele.`)) return;
    setErro(null);
    try { await api.apagarModeloLaudo(m.id); carregar(); } catch (e) { setErro((e as Error).message); }
  }
  function montarNoEditor() {
    navigate("/modelos-laudo/novo", { state: { aba: "testes", nomeSugerido: "", estruturaInicial: {
      cabecalho: ["TÍTULO DO DOCUMENTO"], numerar: false, testes: [],
      secoes: [
        { id: "documento", tipo: "documento", titulo: "", texto: "# Identificação\n**Paciente:** {{paciente.nome}}\n**CPF:** {{paciente.cpf}}\n**Idade:** {{paciente.idade}}\n\n# Resultados\n" },
        { id: "fecho", tipo: "fecho", titulo: "" },
      ],
    } } });
  }
  async function usarMeuWord() {
    setErro(null);
    try { const base = await api.getModeloLaudo("sistema-laudo-psicologico"); navigate("/modelos-laudo/novo", { state: { aba: "word", nomeSugerido: "", estruturaInicial: base.estrutura } }); } catch (e) { setErro((e as Error).message); }
  }
  async function importar(arquivo: File) {
    setErro(null); setLendo(true);
    try {
      const resultado = await api.importarModeloWord(await arquivoParaBase64(arquivo));
      navigate("/modelos-laudo/novo", { state: { importacao: resultado, nomeSugerido: arquivo.name.replace(/\.docx$/i, "") } });
    } catch (e) { setErro((e as Error).message); } finally { setLendo(false); if (seletor.current) seletor.current.value = ""; }
  }

const ORDEM = ["LAUDO_NEURO", "LAUDO", "RELATORIO", "PARECER", "DECLARACAO", "ATESTADO"];
  const doSistema = modelos.filter((m) => m.sistema).sort((x, y) => ORDEM.indexOf(x.tipo) - ORDEM.indexOf(y.tipo));
  const meus = modelos.filter((m) => !m.sistema);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="font-serif text-3xl text-ink">Modelos de laudo</h1>
          <p className="mt-1 text-sm leading-relaxed text-ink/60">Os modelos do sistema ficam sempre intactos. Para ajustar um, abra-o e salve com um nome seu: a cópia passa a ser sua e você escolhe qual é o padrão para os próximos laudos.</p>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">Criar um modelo novo</h2>
        <input ref={seletor} type="file" accept=".docx" className="hidden" onChange={(e) => e.target.files?.[0] && importar(e.target.files[0])} />
        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex flex-col rounded-2xl border border-mist bg-white p-4">
            <button className="rounded-lg bg-sage-deep px-4 py-2.5 text-sm font-semibold text-paper" onClick={montarNoEditor}>Montar no editor</button>
            <p className="mt-2 text-xs leading-relaxed text-ink/55">Escreva o documento e insira, com um clique, os campos do paciente e as tabelas, gráficos e resultados dos testes, como numa mala direta.</p>
          </div>
          <div className="flex flex-col rounded-2xl border border-mist bg-white p-4">
            <button className="rounded-lg border border-sage-deep px-4 py-2.5 text-sm font-semibold text-sage-deep hover:bg-sage-deep/5 disabled:opacity-50" disabled={lendo} onClick={() => seletor.current?.click()}>{lendo ? "Lendo o documento…" : "Ler um laudo em Word"}</button>
            <p className="mt-2 text-xs leading-relaxed text-ink/55">Envie um laudo seu: o sistema lê os títulos, monta as seções e troca os dados do paciente por marcadores. Você revisa antes de salvar.</p>
          </div>
          <div className="flex flex-col rounded-2xl border border-mist bg-white p-4">
            <button className="rounded-lg border border-sage-deep px-4 py-2.5 text-sm font-semibold text-sage-deep hover:bg-sage-deep/5" onClick={usarMeuWord}>Usar meu Word com marcadores</button>
            <p className="mt-2 text-xs leading-relaxed text-ink/55">Mantenha o seu documento e o seu papel timbrado em Word; o sistema preenche os marcadores que você colocou nele.</p>
          </div>
        </div>
      </section>

      {erro && <div className="mb-4 rounded-xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
      {mensagem && <div className="mb-4 rounded-xl border border-sage-deep/30 bg-sage-deep/10 px-4 py-3 text-sm text-sage-deep">{mensagem}</div>}

      <section className="mb-8">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">Meus modelos</h2>
        {meus.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-mist bg-white px-5 py-6 text-sm text-ink/55">Você ainda não tem modelos próprios. Abra um modelo do sistema abaixo e salve com o seu nome, ou envie um laudo seu em Word para o sistema montar o modelo.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">{meus.map((m) => <Cartao key={m.id} m={m} onPadrao={() => padrao(m)} onApagar={() => apagar(m)} />)}</div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-sage-deep">Modelos do sistema</h2>
        <div className="grid gap-4 md:grid-cols-2">{doSistema.map((m) => <Cartao key={m.id} m={m} onPadrao={() => padrao(m)} onApagar={() => undefined} />)}</div>
        <p className="mt-4 text-xs leading-relaxed text-ink/45">Os modelos do Conselho Federal de Psicologia seguem a estrutura da Resolução CFP nº 06/2019 e do Manual Orientativo de Registro e Elaboração de Documentos Psicológicos (2025); os textos são redação própria do sistema. O laudo neuropsicológico é o modelo da neuropsicóloga Letícia (MentEssence).</p>
      </section>
    </div>
  );
}
