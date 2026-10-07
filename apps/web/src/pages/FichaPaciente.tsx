import { useAviso } from "../lib/aviso";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DashboardResultados } from "../components/DashboardResultados";
import { SalaVirtualComponent } from "../components/SalaVirtual";
import {
  api,
  ROTULO_RESPONDENTE,
  type AnamneseData,
  type AplicacaoDeTeste,
  type Anexo,
  type Convenio,
  type EventoAgenda,
  type Laudo,
  type Paciente,
  type PreferenciasAgenda,
  type Sessao,
  type Sexo,
} from "../lib/api";

type Aba = "dados" | "anamnese" | "linha" | "dashboard" | "laudos" | "agenda" | "anexos";

const TIPOS_ANEXO = ["documento", "laudo_externo", "exame", "foto"];
const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function FichaPaciente() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [aba, setAba] = useState<Aba>("dados");
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useAviso();

  const [dadosForm, setDadosForm] = useState<{
    nome: string;
    dataNascimento: string;
    sexo: Sexo | "";
    responsavelLegal: string;
    contato: string;
    escolaridade: string;
    consentimentoTDIC: boolean;
    convenioId: string;
    convenioPlano: string;
    convenioNumeroCarteira: string;
    convenioValidade: string;
    convenioTitular: string;
  }>({
    nome: "",
    dataNascimento: "",
    sexo: "",
    responsavelLegal: "",
    contato: "",
    escolaridade: "",
    consentimentoTDIC: false,
    convenioId: "",
    convenioPlano: "",
    convenioNumeroCarteira: "",
    convenioValidade: "",
    convenioTitular: "",
  });
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [anamneseForm, setAnamneseForm] = useState<AnamneseData>({});
  const [preferenciasForm, setPreferenciasForm] = useState<PreferenciasAgenda>({});

  const [sessoes, setSessoes] = useState<Sessao[]>([]);
  const [aplicacoes, setAplicacoes] = useState<AplicacaoDeTeste[]>([]);

  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [novoAnexo, setNovoAnexo] = useState({ tipo: TIPOS_ANEXO[0], url: "", descricao: "" });

  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [eventos, setEventos] = useState<EventoAgenda[]>([]);
  const [mostrarFormEvento, setMostrarFormEvento] = useState(false);
  const [novoEvento, setNovoEvento] = useState({ titulo: "", tipo: "avaliacao", inicio: "", fim: "", observacoes: "" });

  useEffect(() => {
    if (!id) return;
    // Guarda contra corrida: no StrictMode (dev) este efeito roda 2x, e uma resposta
    // antiga pode chegar depois de o usuário já ter salvo uma edição, sobrescrevendo-a.
    let cancelado = false;
    api
      .getPaciente(id)
      .then((p) => {
        if (cancelado) return;
        setPaciente(p);
        setDadosForm({
          nome: p.nome,
          dataNascimento: p.dataNascimento.slice(0, 10),
          sexo: p.sexo ?? "",
          responsavelLegal: p.responsavelLegal ?? "",
          contato: p.contato ?? "",
          escolaridade: p.escolaridade ?? "",
          consentimentoTDIC: p.consentimentoTDIC,
          convenioId: p.convenioId ?? "",
          convenioPlano: p.convenioPlano ?? "",
          convenioNumeroCarteira: p.convenioNumeroCarteira ?? "",
          convenioValidade: p.convenioValidade ? p.convenioValidade.slice(0, 10) : "",
          convenioTitular: p.convenioTitular ?? "",
        });
        setAnamneseForm(p.anamnese ?? {});
        setPreferenciasForm(p.preferenciasAgenda ?? {});
      })
      .catch((e) => !cancelado && setErro(e.message));
    api.listSessoes(id).then((s) => !cancelado && setSessoes(s)).catch((e) => !cancelado && setErro(e.message));
    api.listAplicacoesPorPaciente(id).then((a) => !cancelado && setAplicacoes(a)).catch((e) => !cancelado && setErro(e.message));
    api.listConvenios({ todos: true }).then((c) => !cancelado && setConvenios(c)).catch((e) => !cancelado && setErro(e.message));
    api.listAnexos(id).then((a) => !cancelado && setAnexos(a)).catch((e) => !cancelado && setErro(e.message));
    api.listLaudos(id).then((l) => !cancelado && setLaudos(l)).catch((e) => !cancelado && setErro(e.message));
    api.listEventosAgenda({ pacienteId: id }).then((ev) => !cancelado && setEventos(ev)).catch((e) => !cancelado && setErro(e.message));
    return () => {
      cancelado = true;
    };
  }, [id]);

  async function salvarDados() {
    if (!id) return;
    setErro(null);
    setMensagem(null);
    try {
      // Campo do plano em branco vira null (limpa no servidor); sem convênio, o resto do plano não faz sentido.
      const semPlano = !dadosForm.convenioId;
      const atualizado = await api.updatePaciente(id, {
        ...dadosForm,
        sexo: dadosForm.sexo || undefined,
        convenioId: dadosForm.convenioId || null,
        convenioPlano: semPlano ? null : dadosForm.convenioPlano || null,
        convenioNumeroCarteira: semPlano ? null : dadosForm.convenioNumeroCarteira || null,
        convenioValidade: semPlano ? null : dadosForm.convenioValidade || null,
        convenioTitular: semPlano ? null : dadosForm.convenioTitular || null,
      });
      setPaciente(atualizado);
      setMensagem("Dados salvos.");
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  function alternarDiaPreferido(dia: string) {
    setPreferenciasForm((prev) => {
      const dias = prev.diasPreferidos ?? [];
      const jaTem = dias.includes(dia);
      return { ...prev, diasPreferidos: jaTem ? dias.filter((d) => d !== dia) : [...dias, dia] };
    });
  }

  async function salvarPreferencias() {
    if (!id) return;
    setErro(null);
    setMensagem(null);
    try {
      const atualizado = await api.updatePaciente(id, { preferenciasAgenda: preferenciasForm });
      setPaciente(atualizado);
      setMensagem("Preferências de agenda salvas.");
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function salvarAnamnese() {
    if (!id) return;
    setErro(null);
    setMensagem(null);
    try {
      const atualizado = await api.updatePaciente(id, { anamnese: anamneseForm });
      setPaciente(atualizado);
      setMensagem("Anamnese salva.");
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function adicionarAnexo() {
    if (!id || !novoAnexo.url) return;
    setErro(null);
    setMensagem(null);
    try {
      const criado = await api.createAnexo({ pacienteId: id, ...novoAnexo });
      setAnexos((prev) => [criado, ...prev]);
      setNovoAnexo({ tipo: TIPOS_ANEXO[0], url: "", descricao: "" });
      setMensagem("Anexo adicionado.");
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function removerAnexo(anexoId: string) {
    setErro(null);
    try {
      await api.deleteAnexo(anexoId);
      setAnexos((prev) => prev.filter((a) => a.id !== anexoId));
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  async function criarEventoAgenda() {
    if (!id || !novoEvento.titulo || !novoEvento.inicio || !novoEvento.fim) return;
    setErro(null);
    setMensagem(null);
    try {
      const resultado = await api.criarEventoAgenda({
        pacienteId: id,
        titulo: novoEvento.titulo,
        tipo: novoEvento.tipo,
        inicio: new Date(novoEvento.inicio).toISOString(),
        fim: new Date(novoEvento.fim).toISOString(),
        observacoes: novoEvento.observacoes || undefined,
        forcar: false,
      });
      if (resultado.conflito) {
        setErro("Conflito de horário! Verifique a agenda.");
        return;
      }
      setEventos((prev) => [...prev, resultado.evento]);
      setNovoEvento({ titulo: "", tipo: "avaliacao", inicio: "", fim: "", observacoes: "" });
      setMostrarFormEvento(false);
      setMensagem("Evento criado com sucesso.");
    } catch (e) {
      setErro((e as Error).message);
    }
  }

  if (!paciente) {
    return <div className="px-6 py-10 text-sm text-ink/60">{erro ?? "Carregando..."}</div>;
  }

  const timeline = [...sessoes]
    .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
    .map((s) => ({ sessao: s, testes: aplicacoes.filter((a) => a.sessaoId === s.id) }));

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-mist text-xl font-bold text-sage-deep">
            {paciente.nome
              .split(" ")
              .slice(0, 2)
              .map((n) => n[0])
              .join("")}
          </span>
          <div>
            <h1 className="font-serif text-2xl text-ink">{paciente.nome}</h1>
            <div className="text-sm text-ink/60">
              <Link to="/pacientes" className="hover:underline">
                ← Voltar para pacientes
              </Link>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-lg border border-sage-deep px-4 py-2 text-sm font-semibold text-sage-deep"
            onClick={() => navigate(`/laudo?pacienteId=${id}`)}
          >
            Ir para o laudo
          </button>
          <button className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper" onClick={() => navigate(`/testes?pacienteId=${id}`)}>
            Registrar teste desta sessão
          </button>
        </div>
      </div>

      {erro && <div className="mb-6 rounded-lg border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
      {mensagem && <div className="mb-6 rounded-lg border border-sage-deep/30 bg-sage-deep/10 px-4 py-3 text-sm text-sage-deep">{mensagem}</div>}

      <div className="mb-6 flex gap-1 border-b border-mist">
        {([
          ["dados", "Dados"],
          ["anamnese", "Anamnese"],
          ["linha", "Linha do tempo"],
          ["dashboard", "Dashboard"],
          ["laudos", "Laudos"],
          ["agenda", "Agenda"],
          ["anexos", "Anexos"],
        ] as const).map(([valor, label]) => (
          <button
            key={valor}
            className={`-mb-px border-b-2 px-1 py-2.5 mr-6 text-sm font-semibold ${
              aba === valor ? "border-sage-deep text-sage-deep" : "border-transparent text-ink/50"
            }`}
            onClick={() => setAba(valor)}
          >
            {label}
          </button>
        ))}
      </div>

      {aba === "dados" && (
        <div>
          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-ink/70">Nome completo</span>
              <input
                className="w-full rounded-lg border border-mist px-3 py-2"
                value={dadosForm.nome}
                onChange={(e) => setDadosForm((f) => ({ ...f, nome: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-ink/70">Data de nascimento</span>
              <input
                type="date"
                className="w-full rounded-lg border border-mist px-3 py-2"
                value={dadosForm.dataNascimento}
                onChange={(e) => setDadosForm((f) => ({ ...f, dataNascimento: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-ink/70">Sexo</span>
              <select
                className="w-full rounded-lg border border-mist px-3 py-2"
                value={dadosForm.sexo}
                onChange={(e) => setDadosForm((f) => ({ ...f, sexo: e.target.value as Sexo | "" }))}
              >
                <option value="">Não informado</option>
                <option value="FEMININO">Feminino</option>
                <option value="MASCULINO">Masculino</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-ink/70">Responsável legal (se menor)</span>
              <input
                className="w-full rounded-lg border border-mist px-3 py-2"
                value={dadosForm.responsavelLegal}
                onChange={(e) => setDadosForm((f) => ({ ...f, responsavelLegal: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-ink/70">Contato</span>
              <input
                className="w-full rounded-lg border border-mist px-3 py-2"
                value={dadosForm.contato}
                onChange={(e) => setDadosForm((f) => ({ ...f, contato: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-semibold text-ink/70">Escolaridade</span>
              <input
                className="w-full rounded-lg border border-mist px-3 py-2"
                value={dadosForm.escolaridade}
                onChange={(e) => setDadosForm((f) => ({ ...f, escolaridade: e.target.value }))}
              />
            </label>
          </div>

          <div className="mt-6 rounded-2xl border border-mist p-5">
            <div className="mb-1 font-semibold text-ink">Plano de saúde</div>
            <div className="mb-3 text-xs text-ink/60">
              Deixe em "Particular" se o atendimento não for por convênio. Os convênios disponíveis são os aceitos pela clínica (Cadastro · Clínica).
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm">
                <span className="mb-1 block font-semibold text-ink/70">Convênio</span>
                <select
                  className="w-full rounded-lg border border-mist px-3 py-2"
                  value={dadosForm.convenioId}
                  onChange={(e) => setDadosForm((f) => ({ ...f, convenioId: e.target.value }))}
                >
                  <option value="">Particular (sem convênio)</option>
                  {convenios
                    .filter((c) => c.ativo || c.id === dadosForm.convenioId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nomeOperadora}
                        {c.ativo ? "" : " (inativo)"}
                      </option>
                    ))}
                </select>
              </label>
              {dadosForm.convenioId && (
                <>
                  <label className="text-sm">
                    <span className="mb-1 block font-semibold text-ink/70">Plano</span>
                    <input
                      className="w-full rounded-lg border border-mist px-3 py-2"
                      placeholder="Ex: Amil 400, Nacional Flex"
                      value={dadosForm.convenioPlano}
                      onChange={(e) => setDadosForm((f) => ({ ...f, convenioPlano: e.target.value }))}
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block font-semibold text-ink/70">Nº da carteirinha</span>
                    <input
                      className="w-full rounded-lg border border-mist px-3 py-2"
                      value={dadosForm.convenioNumeroCarteira}
                      onChange={(e) => setDadosForm((f) => ({ ...f, convenioNumeroCarteira: e.target.value }))}
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block font-semibold text-ink/70">Validade da carteirinha</span>
                    <input
                      type="date"
                      className="w-full rounded-lg border border-mist px-3 py-2"
                      value={dadosForm.convenioValidade}
                      onChange={(e) => setDadosForm((f) => ({ ...f, convenioValidade: e.target.value }))}
                    />
                  </label>
                  <label className="col-span-2 text-sm">
                    <span className="mb-1 block font-semibold text-ink/70">Titular do plano (se o paciente for dependente)</span>
                    <input
                      className="w-full rounded-lg border border-mist px-3 py-2"
                      value={dadosForm.convenioTitular}
                      onChange={(e) => setDadosForm((f) => ({ ...f, convenioTitular: e.target.value }))}
                    />
                  </label>
                </>
              )}
            </div>
            {dadosForm.convenioId && dadosForm.convenioValidade && new Date(dadosForm.convenioValidade) < new Date() && (
              <div className="mt-3 rounded-lg border border-ember/30 bg-ember/10 px-3 py-2 text-xs text-ember">
                A carteirinha está vencida. Confira a validade antes de faturar no convênio.
              </div>
            )}
          </div>

          <div className="mt-6 rounded-2xl border-2 border-clay/50 bg-clay/5 p-5">
            <div className="mb-3 flex items-start gap-3">
              <span className="mt-1 text-lg">⚙️</span>
              <div className="flex-1">
                <div className="mb-1 font-semibold text-ink">Tecnologias Usadas Nesta Avaliação</div>
                <div className="mb-3 text-xs text-ink/70">
                  Conforme Resolução CFP nº 09/2024 — Você autoriza o uso das tecnologias abaixo neste atendimento?
                </div>

                <div className="mb-3 space-y-2 text-xs">
                  <div className="flex items-start gap-2 rounded-lg bg-white/50 p-2">
                    <span className="text-sm">🤖</span>
                    <div>
                      <strong>Inteligência Artificial (Claude)</strong>
                      <p className="mt-0.5 text-ink/60">Usada como apoio para rascunho do laudo. O profissional SEMPRE revisa antes de finalizar.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-lg bg-white/50 p-2">
                    <span className="text-sm">☁️</span>
                    <div>
                      <strong>Armazenamento em Nuvem</strong>
                      <p className="mt-0.5 text-ink/60">Dados criptografados e respaldados automaticamente. Sempre seguindo LGPD.</p>
                    </div>
                  </div>
                </div>

                <label className="flex items-start gap-3 rounded-lg border border-sage-deep/30 bg-sage-deep/5 p-3">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={dadosForm.consentimentoTDIC}
                    onChange={(e) => setDadosForm((f) => ({ ...f, consentimentoTDIC: e.target.checked }))}
                  />
                  <span className="text-xs">
                    <strong>Concordo em usar essas tecnologias</strong>
                    <p className="mt-0.5 text-ink/70">Entendo que são ferramentas de apoio, e que o profissional é responsável por todas as decisões.</p>
                  </span>
                </label>

                {paciente?.consentimentoTDICData && (
                  <div className="mt-2 rounded-lg bg-white/50 p-2 text-xs text-sage-deep/70">
                    ✓ Consentimento registrado em {new Date(paciente.consentimentoTDICData).toLocaleDateString("pt-BR")}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button className="mt-4 rounded-lg border border-mist px-4 py-2 text-sm font-semibold text-ink/70" onClick={salvarDados}>
            Salvar dados
          </button>

          <div className="mt-8 rounded-2xl border border-mist bg-white p-5">
            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-sage-deep">Preferências de agenda</div>
            <p className="mb-3 text-xs text-ink/50">Ajuda a encontrar o melhor horário na hora de marcar um evento para este paciente.</p>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {DIAS_SEMANA.map((dia) => (
                <button
                  key={dia}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    (preferenciasForm.diasPreferidos ?? []).includes(dia)
                      ? "border-sage-deep bg-sage-deep/10 text-sage-deep"
                      : "border-mist text-ink/60 hover:border-sage-deep hover:text-sage-deep"
                  }`}
                  onClick={() => alternarDiaPreferido(dia)}
                >
                  {dia}
                </button>
              ))}
            </div>
            <label className="mb-3 block text-sm">
              <span className="mb-1 block font-semibold text-ink/70">Horário preferido</span>
              <input
                className="w-full rounded-lg border border-mist px-3 py-2"
                placeholder="Ex: manhãs, após 14h..."
                value={preferenciasForm.horarioPreferido ?? ""}
                onChange={(e) => setPreferenciasForm((f) => ({ ...f, horarioPreferido: e.target.value }))}
              />
            </label>
            <label className="mb-3 block text-sm">
              <span className="mb-1 block font-semibold text-ink/70">Observações</span>
              <input
                className="w-full rounded-lg border border-mist px-3 py-2"
                placeholder="Ex: evitar sexta-feira, precisa de transporte escolar até 17h..."
                value={preferenciasForm.observacoes ?? ""}
                onChange={(e) => setPreferenciasForm((f) => ({ ...f, observacoes: e.target.value }))}
              />
            </label>
            <button className="rounded-lg border border-mist px-4 py-2 text-sm font-semibold text-ink/70" onClick={salvarPreferencias}>
              Salvar preferências
            </button>
          </div>
        </div>
      )}

      {aba === "anamnese" && (
        <div>
          <div className="flex flex-col gap-4">
            {([
              ["queixaPrincipal", "Queixa principal"],
              ["historicoEscolar", "Histórico escolar"],
              ["historicoMedico", "Histórico médico"],
              ["historicoFamiliar", "Histórico familiar"],
            ] as const).map(([chave, label]) => (
              <label key={chave} className="text-sm">
                <span className="mb-1 block font-semibold text-ink/70">{label}</span>
                <textarea
                  className="w-full rounded-lg border border-mist px-3 py-2"
                  rows={3}
                  value={anamneseForm[chave] ?? ""}
                  onChange={(e) => setAnamneseForm((f) => ({ ...f, [chave]: e.target.value }))}
                />
              </label>
            ))}
          </div>
          <button className="mt-4 rounded-lg border border-mist px-4 py-2 text-sm font-semibold text-ink/70" onClick={salvarAnamnese}>
            Salvar anamnese
          </button>
        </div>
      )}

      {aba === "linha" && (
        <div className="flex flex-col gap-5 border-l-2 border-mist pl-6">
          {timeline.length === 0 && <p className="text-sm text-ink/50">Nenhuma sessão registrada ainda.</p>}
          {timeline.map(({ sessao, testes }) => (
            <div key={sessao.id} className="relative">
              <div className="absolute -left-[29px] top-1 h-3 w-3 rounded-full border-2 border-paper bg-sage" />
              <div className="mb-0.5 text-xs font-bold text-sage-deep">{new Date(sessao.dataHora).toLocaleString("pt-BR")}</div>
              {testes.length === 0 ? (
                <div className="text-sm text-ink/60">Sessão sem testes lançados.</div>
              ) : (
                testes.map((t) => (
                  <div key={t.id} className="text-sm text-ink/70">
                    {t.teste.sigla} aplicado
                    {/* Em escala de informante, "quem respondeu" é parte do resultado: o mesmo
                        teste pode aparecer duas vezes na sessão, uma por respondente. */}
                    {t.respondenteTipo !== "PACIENTE" && (
                      <span className="text-ink/50">
                        {" "}
                        — respondido por {t.respondenteNome || ROTULO_RESPONDENTE[t.respondenteTipo]}
                        {t.respondenteRelacao && ` (${t.respondenteRelacao})`}
                      </span>
                    )}{" "}
                    {t.teste.isPlaceholder && <span className="text-ember">(provisório)</span>}
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      )}

      {aba === "dashboard" && <DashboardResultados aplicacoes={aplicacoes} />}

      {aba === "laudos" && (
        <div className="flex flex-col gap-2">
          {laudos.length === 0 && <p className="text-sm text-ink/50">Nenhum laudo criado ainda para este paciente.</p>}
          {laudos.map((l) => (
            <button
              key={l.id}
              onClick={() => navigate(`/laudo?pacienteId=${id}&laudoId=${l.id}`)}
              className="flex items-center justify-between rounded-lg border border-mist bg-white px-4 py-3 text-left text-sm hover:bg-paper/60"
            >
              <span>{new Date(l.criadoEm).toLocaleString("pt-BR")}</span>
              <span className="rounded-full bg-mist px-2.5 py-1 text-[11px] font-bold text-sage-deep">{l.status}</span>
            </button>
          ))}
          <button
            className="mt-2 self-start rounded-lg border border-sage-deep px-4 py-2 text-sm font-semibold text-sage-deep"
            onClick={() => navigate(`/laudo?pacienteId=${id}`)}
          >
            + Novo laudo
          </button>
        </div>
      )}

      {aba === "agenda" && (
        <div className="flex flex-col gap-4">
          {mostrarFormEvento && (
            <div className="rounded-2xl border border-mist bg-white p-4">
              <h3 className="mb-3 font-semibold text-ink">Novo evento para {paciente?.nome}</h3>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  <span className="mb-1 block font-semibold text-ink/70">Título</span>
                  <input
                    className="w-full rounded-lg border border-mist px-3 py-2"
                    value={novoEvento.titulo}
                    onChange={(e) => setNovoEvento((f) => ({ ...f, titulo: e.target.value }))}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-semibold text-ink/70">Tipo</span>
                  <select
                    className="w-full rounded-lg border border-mist px-3 py-2"
                    value={novoEvento.tipo}
                    onChange={(e) => setNovoEvento((f) => ({ ...f, tipo: e.target.value }))}
                  >
                    <option value="avaliacao">Avaliação</option>
                    <option value="outro">Outro compromisso</option>
                    <option value="bloqueio">Bloqueio (indisponível)</option>
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-semibold text-ink/70">Início</span>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border border-mist px-3 py-2"
                    value={novoEvento.inicio}
                    onChange={(e) => setNovoEvento((f) => ({ ...f, inicio: e.target.value }))}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-semibold text-ink/70">Fim</span>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border border-mist px-3 py-2"
                    value={novoEvento.fim}
                    onChange={(e) => setNovoEvento((f) => ({ ...f, fim: e.target.value }))}
                  />
                </label>
                <label className="col-span-2 text-sm">
                  <span className="mb-1 block font-semibold text-ink/70">Observações</span>
                  <input
                    className="w-full rounded-lg border border-mist px-3 py-2"
                    value={novoEvento.observacoes}
                    onChange={(e) => setNovoEvento((f) => ({ ...f, observacoes: e.target.value }))}
                  />
                </label>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper disabled:opacity-40"
                  disabled={!novoEvento.titulo || !novoEvento.inicio || !novoEvento.fim}
                  onClick={criarEventoAgenda}
                >
                  Criar evento
                </button>
                <button className="text-sm text-ink/60" onClick={() => setMostrarFormEvento(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <div className="mb-2 text-sm font-bold text-sage-deep">Sessões de Avaliação</div>
              <div className="flex flex-col gap-2">
                {sessoes.length === 0 && <p className="text-sm text-ink/50">Nenhuma sessão marcada.</p>}
                {sessoes.map((s) => (
                  <div key={s.id} className="rounded-lg border border-sage-deep/30 bg-sage-deep/5 p-3">
                    <div className="mb-2 text-xs font-bold text-sage-deep">{new Date(s.dataHora).toLocaleString("pt-BR")}</div>
                    <SalaVirtualComponent sessaoId={s.id} dataHora={s.dataHora} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-bold text-sage-deep">Eventos de Agenda</div>
              <div className="flex flex-col gap-2">
                {eventos.length === 0 && <p className="text-sm text-ink/50">Nenhum evento de agenda.</p>}
                {[...eventos]
                  .sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime())
                  .map((ev) => (
                    <div key={ev.id} className="rounded-lg border border-mist bg-white px-4 py-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{ev.titulo}</span>
                        <span className="text-xs text-ink/50">{new Date(ev.inicio).toLocaleString("pt-BR")}</span>
                      </div>
                      {ev.observacoes && <p className="mt-0.5 text-xs text-ink/60">{ev.observacoes}</p>}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {!mostrarFormEvento && (
              <button
                className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper"
                onClick={() => setMostrarFormEvento(true)}
              >
                + Novo evento
              </button>
            )}
            <Link to="/agenda" className="text-sm font-semibold text-sage-deep hover:underline">
              Ver agenda completa →
            </Link>
          </div>
        </div>
      )}

      {aba === "anexos" && (
        <div>
          <div className="mb-4 flex flex-col gap-2">
            {anexos.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-mist bg-paper px-4 py-2.5 text-sm">
                <a href={a.url} target="_blank" rel="noreferrer" className="text-sage-deep hover:underline">
                  📎 {a.descricao || a.url} <span className="text-ink/40">({a.tipo})</span>
                </a>
                <button className="text-xs font-semibold text-ember" onClick={() => removerAnexo(a.id)}>
                  remover
                </button>
              </div>
            ))}
            {anexos.length === 0 && <p className="text-sm text-ink/50">Nenhum anexo ainda.</p>}
          </div>
          <div className="flex flex-wrap items-end gap-2 rounded-lg border border-mist p-3">
            <select
              className="rounded-lg border border-mist px-3 py-2 text-sm"
              value={novoAnexo.tipo}
              onChange={(e) => setNovoAnexo((a) => ({ ...a, tipo: e.target.value }))}
            >
              {TIPOS_ANEXO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              className="min-w-[220px] flex-1 rounded-lg border border-mist px-3 py-2 text-sm"
              placeholder="URL do documento"
              value={novoAnexo.url}
              onChange={(e) => setNovoAnexo((a) => ({ ...a, url: e.target.value }))}
            />
            <input
              className="min-w-[160px] flex-1 rounded-lg border border-mist px-3 py-2 text-sm"
              placeholder="Descrição"
              value={novoAnexo.descricao}
              onChange={(e) => setNovoAnexo((a) => ({ ...a, descricao: e.target.value }))}
            />
            <button className="rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-paper" onClick={adicionarAnexo}>
              + Adicionar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
