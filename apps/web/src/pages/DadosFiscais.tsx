import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, type ConfigFiscal, type RespostaFiscal } from "../lib/api";
import { useAviso } from "../lib/aviso";

const inputCls = "w-full rounded-lg border border-mist bg-white px-3 py-2 text-sm outline-none focus:border-sage-deep disabled:bg-paper disabled:text-ink/50";
const rotuloCls = "mb-1 block text-xs font-semibold text-ink/60";

const PADRAO: ConfigFiscal = {
  emissaoAtiva: false, ambiente: "HOMOLOGACAO", regime: "SIMPLES_NACIONAL", inscricaoMunicipal: "", codigoMunicipioIbge: "", localPrestacaoIbge: "", cTribNac: "", nbs: "",
  descricaoPadrao: "Prestação de serviços em atendimento de Psicologia {{sessao.data}}", aliquotaModo: "FIXA", aliquotaIss: "", rbt12: "", issRetido: false,
  serieDps: "1", proximoNumeroDps: 1, modoParticular: "POR_SESSAO", quandoEmitir: "MANUAL", modoConvenio: "INDIVIDUAL", exigeDataPagamento: true,
};

function Secao({ titulo, ajuda, children }: { titulo: string; ajuda?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-mist bg-white p-5">
      <h2 className="font-serif text-lg text-ink">{titulo}</h2>
      {ajuda && <p className="mb-3 mt-0.5 text-xs leading-relaxed text-ink/55">{ajuda}</p>}
      <div className={ajuda ? "" : "mt-3"}>{children}</div>
    </section>
  );
}

// prévia da descrição com os dados de um exemplo (31/07/2026)
function previa(modelo: string): string {
  const v: Record<string, string> = { "sessao.data": "31/07", "sessao.dataCompleta": "31/07/2026", "sessao.datas": "05/07, 12/07 e 19/07", periodo: "julho/2026", competencia: "07/2026", quantidade: "1", "convenio.nome": "Convênio Exemplo", "profissional.nome": "Profissional Exemplo", "clinica.nome": "Clínica Exemplo" };
  return modelo.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, k: string) => (k in v ? v[k] : m));
}

export function DadosFiscais() {
  const { profissional } = useAuth();
  const ehAdmin = profissional?.papel === "ADMIN";
  const [resp, setResp] = useState<RespostaFiscal | null>(null);
  const [cfg, setCfg] = useState<ConfigFiscal>(PADRAO);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useAviso();
  const [salvando, setSalvando] = useState(false);

  const aplicar = (r: RespostaFiscal) => {
    setResp(r);
    const c = r.config;
    setCfg(c ? { ...PADRAO, ...c, inscricaoMunicipal: c.inscricaoMunicipal ?? "", codigoMunicipioIbge: c.codigoMunicipioIbge ?? "", localPrestacaoIbge: c.localPrestacaoIbge ?? "", cTribNac: c.cTribNac ?? "", nbs: c.nbs ?? "", aliquotaIss: c.aliquotaIss ?? "", rbt12: c.rbt12 ?? "" } : PADRAO);
  };
  useEffect(() => { api.getFiscal().then(aplicar).catch((e) => setErro(e.message)); }, []);

  const set = <K extends keyof ConfigFiscal>(k: K, v: ConfigFiscal[K]) => setCfg((c) => ({ ...c, [k]: v }));
  const exemplo = useMemo(() => previa(cfg.descricaoPadrao), [cfg.descricaoPadrao]);

  async function salvar() {
    setErro(null); setSalvando(true);
    try {
      const { ...dados } = cfg;
      const r = await api.salvarFiscal({ ...dados, aliquotaIss: dados.aliquotaIss === "" ? null : Number(dados.aliquotaIss), rbt12: dados.rbt12 === "" ? null : Number(dados.rbt12) });
      aplicar(r); setMensagem("Configuração fiscal salva.");
    } catch (e) { setErro((e as Error).message); } finally { setSalvando(false); }
  }

  if (!resp) return <div className="px-6 py-10 text-sm text-ink/55">{erro ?? "Carregando…"}</div>;
  const dis = !ehAdmin;
  const pend = resp.pendencias;

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-6 py-8">
      <div>
        <Link to="/configuracoes" className="text-sm font-semibold text-sage-deep hover:underline">← Configurações</Link>
        <h1 className="mt-1 font-serif text-3xl text-ink">Dados fiscais</h1>
        <p className="mt-1 text-sm text-ink/60">Tudo o que a nota fiscal de serviço precisa, sem nada fixo no sistema: cada clínica configura o seu município, código de serviço, imposto, numeração e regras de emissão.</p>
      </div>

      {!ehAdmin && <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">Só o administrador altera a configuração fiscal. Você pode consultar.</div>}
      {erro && <div className="rounded-xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
      {mensagem && <div className="rounded-xl border border-sage-deep/30 bg-sage-deep/10 px-4 py-3 text-sm text-sage-deep">{mensagem}</div>}

      <section className={`rounded-2xl border p-5 ${pend.length === 0 ? "border-sage-deep/40 bg-sage-deep/[0.06]" : "border-amber-300 bg-amber-50"}`}>
        <div className="font-semibold text-ink">{pend.length === 0 ? "Tudo preenchido para emitir." : "O que ainda falta para emitir"}</div>
        {pend.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm text-ink/75">
            {pend.map((p) => (
              <li key={p.campo} className="flex items-center gap-2"><span className="text-ember">○</span>{p.mensagem}{p.onde === "clinica" && <Link to="/clinica" className="text-xs font-semibold text-sage-deep hover:underline">preencher na clínica</Link>}</li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-ink/55">{resp.prontoParaTeste ? "Já dá para preparar e testar notas em homologação." : "Preencha os itens acima para preparar notas."} A emissão de verdade só começa com o ambiente em produção, a emissão ativada e o certificado digital enviado.</p>
      </section>

      <Secao titulo="Prestador" ajuda="Vem do cadastro da clínica. Para alterar, edite a clínica.">
        <div className="grid gap-x-6 gap-y-1 text-sm text-ink/75 sm:grid-cols-2">
          <div><span className="text-ink/50">Razão social:</span> {resp.clinica.razaoSocial}</div>
          <div><span className="text-ink/50">CNPJ:</span> {resp.clinica.cnpj ?? "—"}</div>
          <div className="sm:col-span-2"><span className="text-ink/50">Endereço:</span> {[resp.clinica.endereco, resp.clinica.bairro, resp.clinica.cidade && `${resp.clinica.cidade}/${resp.clinica.estado ?? ""}`, resp.clinica.cep].filter(Boolean).join(", ") || "—"}</div>
        </div>
        <Link to="/clinica" className="mt-2 inline-block text-xs font-semibold text-sage-deep hover:underline">Editar os dados da clínica</Link>
      </Secao>

      <Secao titulo="Município e regime">
        <div className="grid gap-3 sm:grid-cols-2">
          <label><span className={rotuloCls}>Inscrição municipal</span><input className={inputCls} disabled={dis} value={cfg.inscricaoMunicipal ?? ""} onChange={(e) => set("inscricaoMunicipal", e.target.value)} /></label>
          <label><span className={rotuloCls}>Código IBGE do município (7 dígitos)</span><input className={inputCls} disabled={dis} placeholder="Ex.: 3530607" value={cfg.codigoMunicipioIbge ?? ""} onChange={(e) => set("codigoMunicipioIbge", e.target.value.replace(/\D/g, "").slice(0, 7))} /></label>
          <label><span className={rotuloCls}>Regime tributário</span>
            <select className={inputCls} disabled={dis} value={cfg.regime} onChange={(e) => set("regime", e.target.value)}>
              <option value="SIMPLES_NACIONAL">Simples Nacional (ME/EPP)</option><option value="MEI">MEI</option><option value="LUCRO_PRESUMIDO">Lucro presumido</option><option value="LUCRO_REAL">Lucro real</option>
            </select>
          </label>
          <label><span className={rotuloCls}>Local da prestação (IBGE), se for diferente do município</span><input className={inputCls} disabled={dis} value={cfg.localPrestacaoIbge ?? ""} onChange={(e) => set("localPrestacaoIbge", e.target.value.replace(/\D/g, "").slice(0, 7))} /></label>
        </div>
      </Secao>

      <Secao titulo="Serviço e descrição da nota" ajuda="A descrição aceita variáveis entre chaves duplas, trocadas a cada nota.">
        <div className="grid gap-3 sm:grid-cols-2">
          <label><span className={rotuloCls}>Código de tributação nacional</span><input className={inputCls} disabled={dis} placeholder="Ex.: 04.16.01" value={cfg.cTribNac ?? ""} onChange={(e) => set("cTribNac", e.target.value)} /></label>
          <label><span className={rotuloCls}>Código NBS (opcional)</span><input className={inputCls} disabled={dis} value={cfg.nbs ?? ""} onChange={(e) => set("nbs", e.target.value)} /></label>
        </div>
        <label className="mt-3 block"><span className={rotuloCls}>Descrição do serviço</span><textarea className={inputCls} rows={2} disabled={dis} value={cfg.descricaoPadrao} onChange={(e) => set("descricaoPadrao", e.target.value)} /></label>
        <p className="mt-2 rounded-lg bg-paper px-3 py-2 text-sm text-ink/75"><span className="text-xs font-semibold text-ink/50">Como fica numa nota de exemplo: </span>{exemplo}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {resp.variaveis.map((v) => <button key={v.variavel} type="button" title={v.descricao} disabled={dis} className="rounded-full border border-mist px-2.5 py-1 font-mono text-[11px] text-ink/65 hover:bg-paper disabled:opacity-50" onClick={() => set("descricaoPadrao", `${cfg.descricaoPadrao} {{${v.variavel}}}`)}>{`{{${v.variavel}}}`}</button>)}
        </div>
      </Secao>

      <Secao titulo="Imposto (ISS)">
        <div className="grid gap-3 sm:grid-cols-3">
          <label><span className={rotuloCls}>Como definir a alíquota</span>
            <select className={inputCls} disabled={dis} value={cfg.aliquotaModo} onChange={(e) => set("aliquotaModo", e.target.value as ConfigFiscal["aliquotaModo"])}>
              <option value="FIXA">Alíquota fixa</option><option value="SIMPLES">Calculada pelo Simples (receita de 12 meses)</option>
            </select>
          </label>
          {cfg.aliquotaModo === "FIXA" ? <label><span className={rotuloCls}>Alíquota do ISS (%)</span><input type="number" step="0.01" className={inputCls} disabled={dis} value={cfg.aliquotaIss ?? ""} onChange={(e) => set("aliquotaIss", e.target.value)} /></label>
            : <label><span className={rotuloCls}>Receita bruta dos últimos 12 meses (R$)</span><input type="number" step="0.01" className={inputCls} disabled={dis} value={cfg.rbt12 ?? ""} onChange={(e) => set("rbt12", e.target.value)} /></label>}
          <label className="flex items-end gap-2 pb-2 text-sm text-ink/75"><input type="checkbox" className="mb-0.5 h-4 w-4" disabled={dis} checked={cfg.issRetido} onChange={(e) => set("issRetido", e.target.checked)} />ISS retido pelo tomador</label>
        </div>
      </Secao>

      <Secao titulo="Numeração e ambiente" ajuda="A série e o próximo número seguem o que já foi emitido fora do sistema (por exemplo, no Portal Nacional). Combine com a contabilidade antes de emitir pelo sistema, para não repetir números.">
        <div className="grid gap-3 sm:grid-cols-3">
          <label><span className={rotuloCls}>Série da DPS</span><input className={inputCls} disabled={dis} value={cfg.serieDps} onChange={(e) => set("serieDps", e.target.value)} /></label>
          <label><span className={rotuloCls}>Próximo número</span><input type="number" min={1} className={inputCls} disabled={dis} value={cfg.proximoNumeroDps} onChange={(e) => set("proximoNumeroDps", Number(e.target.value) || 1)} /></label>
          <label><span className={rotuloCls}>Ambiente</span>
            <select className={inputCls} disabled={dis} value={cfg.ambiente} onChange={(e) => set("ambiente", e.target.value as ConfigFiscal["ambiente"])}><option value="HOMOLOGACAO">Homologação (teste)</option><option value="PRODUCAO">Produção (valendo)</option></select>
          </label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-ink/75"><input type="checkbox" className="h-4 w-4" disabled={dis} checked={cfg.emissaoAtiva} onChange={(e) => set("emissaoAtiva", e.target.checked)} />Emissão ativada (desligada, o sistema só prepara notas, sem emitir)</label>
      </Secao>

      <Secao titulo="Quando e como emitir" ajuda="O padrão da clínica. Cada convênio pode ter a sua forma de faturar, em Dados da clínica › Convênios aceitos.">
        <div className="grid gap-3 sm:grid-cols-3">
          <label><span className={rotuloCls}>Atendimento particular</span>
            <select className={inputCls} disabled={dis} value={cfg.modoParticular} onChange={(e) => set("modoParticular", e.target.value)}><option value="POR_SESSAO">Uma nota por sessão</option><option value="POR_LAUDO">Uma nota por laudo (sinal e término)</option><option value="MANUAL">Sempre manual</option></select>
          </label>
          <label><span className={rotuloCls}>Convênio</span>
            <select className={inputCls} disabled={dis} value={cfg.modoConvenio} onChange={(e) => set("modoConvenio", e.target.value)}><option value="INDIVIDUAL">Uma nota por caso</option><option value="LOTE_MENSAL">Uma nota por mês, juntando os casos</option></select>
          </label>
          <label><span className={rotuloCls}>Momento de emitir</span>
            <select className={inputCls} disabled={dis} value={cfg.quandoEmitir} onChange={(e) => set("quandoEmitir", e.target.value)}><option value="MANUAL">Quando eu mandar</option><option value="NA_COBRANCA">Ao lançar a cobrança</option><option value="NA_BAIXA">Ao receber (baixa)</option></select>
          </label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-ink/75"><input type="checkbox" className="h-4 w-4" disabled={dis} checked={cfg.exigeDataPagamento} onChange={(e) => set("exigeDataPagamento", e.target.checked)} />Exigir a data de pagamento antes de emitir</label>
      </Secao>

      <Secao titulo="Certificado digital A1" ajuda="Necessário para emitir de verdade. O envio e a guarda segura do certificado serão feitos na etapa da emissão; até lá, tudo funciona em homologação.">
        <p className="text-sm text-ink/55">Nenhum certificado enviado.</p>
      </Secao>

      {ehAdmin && <div className="sticky bottom-3 flex justify-end"><button className="rounded-lg bg-sage-deep px-6 py-3 text-sm font-semibold text-paper shadow-lg disabled:opacity-50" disabled={salvando} onClick={salvar}>{salvando ? "Salvando…" : "Salvar configuração fiscal"}</button></div>}
    </div>
  );
}
