import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Avisos } from "../components/Avisos";
import { TestePlanilha } from "../components/TestePlanilha";
import { TesteWasi } from "../components/TesteWasi";
import { TesteWaisIII } from "../components/TesteWaisIII";
import { TesteWiscIV } from "../components/TesteWiscIV";
import { TesteGenerico } from "../components/TesteGenerico";
import { api, type AplicacaoDeTeste, type Teste } from "../lib/api";
import { useAviso } from "../lib/aviso";
import { escolherComponenteTeste } from "../lib/construtorAbas";

// Tela cheia de um teste dentro de uma sessão (sem a barra lateral): é a "tela bonita" com abas, gráficos e cálculo ao vivo.
// Abre pela ficha do paciente: ?pacienteId=&sessaoId=&teste=SIGLA[&aplicacaoId=]. O lançamento simples continua em /testes.
export function TesteCompleto() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const pacienteId = params.get("pacienteId") ?? "";
  const sessaoId = params.get("sessaoId") ?? "";
  const siglaParam = params.get("teste") ?? "";
  const aplicacaoParam = params.get("aplicacaoId") ?? "";

  const [testes, setTestes] = useState<Teste[]>([]);
  const [aplicacoes, setAplicacoes] = useState<AplicacaoDeTeste[] | null>(null);
  const [testeId, setTesteId] = useState("");
  const [escores, setEscores] = useState<Record<string, string>>({});
  const [aplicacaoId, setAplicacaoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useAviso();
  const [busca, setBusca] = useState("");

  useEffect(() => {
    api.listTestes().then(setTestes).catch((e) => setErro(e.message));
    if (sessaoId) api.listAplicacoes(sessaoId).then(setAplicacoes).catch((e) => setErro(e.message));
  }, [sessaoId]);

  // Escolhe o teste (da URL) e, se já existe lançamento dele nesta sessão, carrega os escores salvos.
  useEffect(() => {
    if (testes.length === 0 || aplicacoes === null || testeId) return;
    const existente = aplicacoes.find((a) => a.id === aplicacaoParam) ?? aplicacoes.find((a) => a.teste.sigla === siglaParam && a.respondenteTipo === "PACIENTE");
    const alvo = existente ? testes.find((t) => t.id === existente.testeId) : testes.find((t) => t.sigla === siglaParam);
    if (!alvo) return;
    setTesteId(alvo.id);
    if (existente) {
      setAplicacaoId(existente.id);
      setEscores(Object.fromEntries(Object.entries(existente.escoresBrutos).map(([k, v]) => [k, String(v)])));
    }
  }, [testes, aplicacoes, siglaParam, aplicacaoParam, testeId]);

  const teste = testes.find((t) => t.id === testeId);
  const voltar = () => navigate(pacienteId ? `/pacientes/${pacienteId}` : "/");

  async function salvar() {
    if (!sessaoId || !teste) return;
    setErro(null);
    setSalvando(true);
    try {
      // só o que foi preenchido (campo em branco = não aplicado, não zero); inclui as opções (ex.: tabela normativa)
      const escoresBrutos: Record<string, number> = {};
      for (const [k, v] of Object.entries(escores)) if (v.trim() !== "" && Number.isFinite(Number(v))) escoresBrutos[k] = Number(v);
      if (aplicacaoId) {
        const atualizada = await api.updateAplicacao(aplicacaoId, { escoresBrutos, respondenteTipo: "PACIENTE", respondenteNome: "", respondenteRelacao: "" });
        setMensagem(`${atualizada.teste.sigla} atualizado.`);
      } else {
        const criada = await api.createAplicacao({ sessaoId, testeId: teste.id, escoresBrutos, respondenteTipo: "PACIENTE", respondenteNome: "", respondenteRelacao: "" });
        setAplicacaoId(criada.id);
        setMensagem(`${criada.teste.sigla} salvo.`);
      }
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  const props = {
    teste: teste as Teste,
    aplicacao: undefined,
    escoresBrutos: escores,
    onEscoresChange: setEscores,
    onSalvar: salvar,
    erro,
    salvando,
    sessaoId: sessaoId || undefined,
    testeId: testeId || undefined,
  };
  const componente = teste ? escolherComponenteTeste(teste) : null;
  const filtrados = useMemo(() => testes.filter((t) => `${t.sigla} ${t.nome}`.toLowerCase().includes(busca.toLowerCase())), [testes, busca]);

  return (
    <div className="min-h-screen bg-paper">
      <Avisos />
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-mist bg-white/90 px-6 py-3 backdrop-blur">
        <button className="text-sm font-semibold text-sage-deep hover:underline" onClick={voltar}>
          ← Voltar à ficha do paciente
        </button>
        <div className="text-sm text-ink/60">{teste ? <>Tela completa · <strong className="text-ink">{teste.sigla}</strong>{aplicacaoId && " · lançamento salvo"}</> : "Escolha o teste"}</div>
        {mensagem && <span className="text-xs font-semibold text-sage-deep">{mensagem}</span>}
      </header>

      <main className="mx-auto w-full max-w-[1500px] px-6 py-6">
        {!sessaoId && <p className="text-sm text-ember">Abra esta tela a partir de uma sessão na ficha do paciente.</p>}
        {sessaoId && !teste && (
          <section className="rounded-2xl border border-mist bg-white p-5">
            <h1 className="mb-3 font-serif text-2xl font-semibold text-ink">Qual teste você vai lançar?</h1>
            <input className="mb-3 w-full max-w-md rounded-lg border border-mist px-3 py-2 text-sm" placeholder="Buscar por sigla ou nome…" value={busca} onChange={(e) => setBusca(e.target.value)} />
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filtrados.map((t) => (
                <button key={t.id} className="rounded-xl border border-mist px-4 py-3 text-left transition-colors hover:border-sage-deep hover:bg-sage-deep/5" onClick={() => { setTesteId(t.id); setEscores({}); setAplicacaoId(null); }}>
                  <div className="font-semibold text-ink">{t.sigla}</div>
                  <div className="truncate text-xs text-ink/55">{t.nome}</div>
                </button>
              ))}
            </div>
          </section>
        )}
        {teste && componente === "waisIII" && <TesteWaisIII {...props} />}
        {teste && componente === "wiscIV" && <TesteWiscIV {...props} />}
        {teste && componente === "wasi" && <TesteWasi {...props} />}
        {teste && componente === "planilha" && <TestePlanilha {...props} />}
        {teste && componente === "generico" && <TesteGenerico {...props} />}
      </main>
    </div>
  );
}
