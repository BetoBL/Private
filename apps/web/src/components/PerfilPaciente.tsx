import { useEffect, useState, type ReactNode } from "react";
import { api, type FormularioResumo, type Paciente } from "../lib/api";

// Perfil do paciente: leitura em cartões e edição completa (Salvar/Cancelar). Cadastro, convênio e nota fiscal continuam no formulário abaixo.
type Endereco = { cep?: string | null; logradouro?: string | null; numero?: string | null; complemento?: string | null; bairro?: string | null; cidade?: string | null; uf?: string | null; pais?: string | null };
type Resp = { nome?: string | null; celular?: string | null; vinculo?: string | null; recebeCobranca?: boolean; recebeLembrete?: boolean; documentoTipo?: string | null; documentoNumero?: string | null; enderecoIgual?: boolean };
type Contato = { nome: string; telefone: string; vinculo: string };
type Medicamento = { nome: string; dose: string; unidade: string };

const GENEROS = ["Feminino", "Masculino", "Não binário", "Outro", "Prefere não informar"];
const RACAS = ["Branca", "Preta", "Parda", "Amarela", "Indígena", "Prefere não informar"];
const ESTADOS_CIVIS = ["Solteiro(a)", "Casado(a)", "União estável", "Divorciado(a)", "Viúvo(a)", "Separado(a)"];
const VINCULOS = ["Mãe", "Pai", "Cônjuge", "Filho(a)", "Irmão(ã)", "Avó/Avô", "Amigo(a)", "Outro"];
const MOEDAS: Record<string, string> = { BRL: "Real brasileiro (R$)", USD: "Dólar (US$)", EUR: "Euro (€)" };

const idadeDe = (iso: string) => { const n = new Date(iso), h = new Date(); let i = h.getFullYear() - n.getUTCFullYear(); if (h.getMonth() < n.getUTCMonth() || (h.getMonth() === n.getUTCMonth() && h.getDate() < n.getUTCDate())) i--; return i; };
const dataBr = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : null);
const soDigitos = (s: string) => s.replace(/\D/g, "");
const dinheiro = (c: number | null | undefined, moeda: string) => (c == null ? null : (c / 100).toLocaleString("pt-BR", { style: "currency", currency: moeda }));
const paraCentavos = (s: string) => { const t = s.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", "."); const n = parseFloat(t); return Number.isFinite(n) ? Math.round(n * 100) : null; };

const entrada = "w-full rounded-xl border border-mist bg-white px-3 py-2 text-sm outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20";
const Campo = ({ rotulo, children, largo }: { rotulo: string; children: ReactNode; largo?: boolean }) => (
  <label className={`block text-sm ${largo ? "sm:col-span-2" : ""}`}><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink/50">{rotulo}</span>{children}</label>
);
const Cartao = ({ titulo, icone, children, acao, tom = "sage" }: { titulo: string; icone: string; children: ReactNode; acao?: ReactNode; tom?: "sage" | "clay" | "ember" }) => (
  <section className="rounded-2xl border border-mist bg-white p-5 shadow-[0_1px_2px_rgba(38,38,36,0.04),0_8px_24px_-12px_rgba(38,38,36,0.12)]">
    <header className="mb-4 flex items-center gap-3 border-b border-mist pb-3">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-base ${tom === "sage" ? "bg-sage/15 text-sage-deep" : tom === "ember" ? "bg-ember/10 text-ember" : "bg-mist text-clay"}`}>{icone}</span>
      <h3 className="font-serif text-lg text-ink">{titulo}</h3>
      {acao && <div className="ml-auto">{acao}</div>}
    </header>
    {children}
  </section>
);
const Linha = ({ rotulo, valor }: { rotulo: string; valor?: string | null }) => (
  <div className="flex items-baseline justify-between gap-4 border-b border-mist/70 py-2 last:border-0">
    <span className="text-xs font-semibold uppercase tracking-wide text-ink/45">{rotulo}</span>
    <span className={`text-right text-sm ${valor ? "text-ink" : "text-ink/30"}`}>{valor || "não informado"}</span>
  </div>
);
const Vazio = ({ texto }: { texto: string }) => <p className="rounded-xl border border-dashed border-mist px-4 py-5 text-center text-sm text-ink/45">{texto}</p>;

export function PerfilPaciente({ paciente, onSalvo, onAbrirAnamnese, onAbrirAnamneseLaudo }: { paciente: Paciente; onSalvo: (p: Paciente) => void; onAbrirAnamnese: () => void; onAbrirAnamneseLaudo: () => void }) {
  const p = paciente;
  const [anamneses, setAnamneses] = useState<FormularioResumo[] | null>(null);
  useEffect(() => { api.formulariosDoPaciente(p.id).then((l) => setAnamneses(l.filter((x) => x.tipo === "ANAMNESE"))).catch(() => setAnamneses([])); }, [p.id]);
  const respondidas = (anamneses ?? []).filter((x) => x.status === "RESPONDIDO");
  const pendentes = (anamneses ?? []).filter((x) => x.status === "PENDENTE");
  const neuropsicPreenchida = !!p.anamnese && Object.keys(p.anamnese as object).length > 0;
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const end: Endereco = p.endereco ?? {};
  const resp: Resp | null = p.responsavelFinanceiro ?? null;
  const contatos: Contato[] = p.contatosEmergencia ?? [];
  const trats: string[] = p.tratamentos ?? [];
  const meds: Medicamento[] = p.medicamentos ?? [];

  const [f, setF] = useState(() => formDe(p));
  function formDe(x: Paciente) {
    return {
      nomeSocial: x.nomeSocial ?? "", email: x.email ?? "", contato: x.contato ?? "", genero: x.genero ?? "", racaCor: x.racaCor ?? "", estadoCivil: x.estadoCivil ?? "", profissao: x.profissao ?? "",
      tipoPublico: x.tipoPublico ?? "ADULTO", inicioTratamento: x.inicioTratamento ? x.inicioTratamento.slice(0, 10) : "",
      endereco: { cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "", pais: "Brasil", ...(x.endereco ?? {}) } as Required<{ [K in keyof Endereco]: string | null }>,
      moeda: x.moeda ?? "BRL", valor: x.valorSessaoCentavos != null ? (x.valorSessaoCentavos / 100).toFixed(2).replace(".", ",") : "",
      resp: { nome: "", celular: "", vinculo: "", recebeCobranca: false, recebeLembrete: false, documentoTipo: "", documentoNumero: "", enderecoIgual: false, ...(x.responsavelFinanceiro ?? {}) } as Resp,
      contatos: (x.contatosEmergencia ?? []) as Contato[], tratamentos: (x.tratamentos ?? []) as string[], novoTrat: "", medicamentos: (x.medicamentos ?? []) as Medicamento[],
    };
  }
  const set = <K extends keyof ReturnType<typeof formDe>>(k: K, v: ReturnType<typeof formDe>[K]) => setF((a) => ({ ...a, [k]: v }));

  async function buscarCep() {
    const cep = soDigitos(f.endereco.cep ?? "");
    if (cep.length !== 8) return;
    try {
      const r = await (await fetch(`https://viacep.com.br/ws/${cep}/json/`)).json();
      if (!r.erro) set("endereco", { ...f.endereco, logradouro: r.logradouro || f.endereco.logradouro, bairro: r.bairro || f.endereco.bairro, cidade: r.localidade || f.endereco.cidade, uf: r.uf || f.endereco.uf, pais: "Brasil" });
    } catch { /* sem internet ou CEP fora do ar: a pessoa preenche à mão */ }
  }

  async function salvar() {
    setSalvando(true); setErro(null);
    try {
      const temResp = !!(f.resp.nome || f.resp.celular);
      const atualizado = await api.updatePaciente(p.id, {
        nomeSocial: f.nomeSocial || null, email: f.email || null, contato: f.contato, genero: f.genero || null, racaCor: f.racaCor || null, estadoCivil: f.estadoCivil || null, profissao: f.profissao || null,
        tipoPublico: f.tipoPublico as "ADULTO" | "CRIANCA_ADOLESCENTE", inicioTratamento: f.inicioTratamento || null,
        endereco: f.endereco, moeda: f.moeda as "BRL" | "USD" | "EUR", valorSessaoCentavos: f.valor.trim() ? paraCentavos(f.valor) : null,
        responsavelFinanceiro: temResp ? f.resp : null,
        contatosEmergencia: f.contatos.filter((c) => c.nome.trim()), tratamentos: f.tratamentos,
        medicamentos: f.medicamentos.filter((m) => m.nome.trim()),
      });
      onSalvo(atualizado); setEditando(false);
    } catch (e) { setErro((e as Error).message); }
    setSalvando(false);
  }

  const faltando = [!p.email && "e-mail", !p.contato && "telefone", !trats.length && "tratamentos", !contatos.length && "contatos de emergência", !p.valorSessaoCentavos && "valor da sessão"].filter(Boolean) as string[];
  const digitos = soDigitos(p.contato ?? "");
  const enderecoTexto = [[end.logradouro, end.numero].filter(Boolean).join(", "), end.complemento, end.bairro, [end.cidade, end.uf].filter(Boolean).join(" - "), end.cep].filter(Boolean).join(" · ");

  const btnPrimario = "rounded-full bg-gradient-to-r from-sage-deep to-sage px-5 py-2 text-sm font-semibold text-white shadow-md shadow-sage/30 transition hover:shadow-lg hover:brightness-105 disabled:opacity-50";
  const btnSecundario = "rounded-full border border-mist bg-white px-4 py-2 text-sm font-semibold text-ink/70 shadow-sm transition hover:border-sage hover:text-sage-deep";

  return (
    <div className="mb-8 space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-mist bg-gradient-to-br from-white to-mist/40 p-5 shadow-[0_8px_24px_-12px_rgba(38,38,36,0.12)]">
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-xl text-ink">Perfil do paciente</h2>
          <p className="text-sm text-ink/60">{idadeDe(p.dataNascimento)} anos · nascimento {dataBr(p.dataNascimento)} · {p.tipoPublico === "CRIANCA_ADOLESCENTE" ? "Criança/adolescente" : "Adulto"}{p.fazLaudo ? " · com laudo" : ""}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {digitos.length >= 10 && <a className={`${btnSecundario} flex items-center gap-2`} href={`https://wa.me/${digitos.length <= 11 ? "55" : ""}${digitos}`} target="_blank" rel="noreferrer"><span aria-hidden>💬</span>Abrir WhatsApp</a>}
            {p.email && <a className={`${btnSecundario} flex items-center gap-2`} href={`mailto:${p.email}`}><span aria-hidden>✉️</span>Enviar e-mail</a>}
            <button className={`${btnSecundario} flex items-center gap-2`} onClick={onAbrirAnamnese}><span aria-hidden>📋</span>Anamnese</button>
          </div>
        </div>
        {editando ? (
          <div className="flex gap-2"><button className={btnSecundario} onClick={() => { setF(formDe(p)); setEditando(false); setErro(null); }}>Cancelar</button><button className={btnPrimario} disabled={salvando} onClick={salvar}>{salvando ? "Salvando…" : "Salvar perfil"}</button></div>
        ) : <button className={btnPrimario} onClick={() => { setF(formDe(p)); setEditando(true); }}>Editar perfil</button>}
      </div>

      {erro && <div className="rounded-xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{erro}</div>}
      {!editando && faltando.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-sage/30 bg-sage/10 px-4 py-3 text-sm text-sage-deep">
          <span className="font-semibold">Finalizar cadastro:</span><span>faltam {faltando.join(", ")}.</span>
          <button className="ml-auto font-semibold underline" onClick={() => setEditando(true)}>Completar agora</button>
        </div>
      )}

      {!editando ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Cartao titulo="Dados básicos" icone="🪪">
            <Linha rotulo="Nome social" valor={p.nomeSocial} /><Linha rotulo="Gênero" valor={p.genero} /><Linha rotulo="CPF" valor={p.cpf} /><Linha rotulo="Raça/cor" valor={p.racaCor} />
            <Linha rotulo="Estado civil" valor={p.estadoCivil} /><Linha rotulo="Profissão" valor={p.profissao} /><Linha rotulo="Escolaridade" valor={p.escolaridade} />
            <Linha rotulo="Plano de saúde" valor={p.convenioPlano} /><Linha rotulo="Telefone" valor={p.contato} /><Linha rotulo="E-mail" valor={p.email} />
          </Cartao>
          <Cartao titulo="Informações gerais" icone="ℹ️">
            <Linha rotulo="Início do tratamento" valor={dataBr(p.inicioTratamento)} /><Linha rotulo="Endereço" valor={enderecoTexto} /><Linha rotulo="País" valor={end.pais} />
            <div className="mt-4 rounded-xl bg-mist/50 p-3 text-sm"><div className="text-xs font-semibold uppercase tracking-wide text-ink/45">Financeiro</div>
              <div className="mt-1 flex justify-between"><span className="text-ink/60">Moeda</span><span>{MOEDAS[p.moeda ?? "BRL"]}</span></div>
              <div className="flex justify-between"><span className="text-ink/60">Valor da sessão</span><span className="font-semibold text-sage-deep">{dinheiro(p.valorSessaoCentavos, p.moeda ?? "BRL") ?? "não informado"}</span></div></div>
          </Cartao>
          <Cartao titulo="Responsável financeiro" icone="👪" tom="clay">
            {resp && (resp.nome || resp.celular) ? (<><Linha rotulo="Nome" valor={resp.nome} /><Linha rotulo="Celular" valor={resp.celular} /><Linha rotulo="Vínculo" valor={resp.vinculo} /><Linha rotulo="Documento" valor={resp.documentoNumero ? `${resp.documentoTipo ?? ""} ${resp.documentoNumero}`.trim() : null} />
              <p className="mt-2 text-xs text-ink/50">{resp.recebeCobranca ? "Recebe a cobrança" : "Não recebe a cobrança"} · {resp.recebeLembrete ? "recebe o lembrete de sessão" : "não recebe o lembrete"}</p></>)
              : <Vazio texto="Sem responsável: cobrança e lembrete vão para o próprio paciente." />}
          </Cartao>
          <Cartao titulo="Contatos de emergência" icone="🚨" tom="ember" acao={<span className="rounded-full bg-mist px-2.5 py-0.5 text-xs font-semibold text-ink/60">{contatos.length} de 2</span>}>
            {contatos.length ? contatos.map((c, i) => <Linha key={i} rotulo={c.vinculo || `Contato ${i + 1}`} valor={`${c.nome}${c.telefone ? ` · ${c.telefone}` : ""}`} />) : <Vazio texto="Nenhum contato cadastrado. Vale ter ao menos um." />}
          </Cartao>
          <div className="lg:col-span-2">
            <Cartao titulo="Anamnese" icone="📋" acao={<button className="text-sm font-semibold text-sage-deep hover:underline" onClick={onAbrirAnamnese}>{respondidas.length || pendentes.length ? "Ver e pedir outra" : "Pedir ou preencher"}</button>}>
              {anamneses === null ? <p className="text-sm text-ink/40">Carregando…</p> : (
                <ul className="space-y-2 text-sm">
                  {respondidas.slice(0, 3).map((a) => <li key={a.id} className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-sage/15 px-2 py-0.5 text-xs font-semibold text-sage-deep">preenchida</span><span className="font-medium text-ink">{a.nome}</span><span className="text-ink/50">{a.respondidoEm ? new Date(a.respondidoEm).toLocaleDateString("pt-BR") : ""} · por {a.respondidoPor === "PACIENTE" ? "o paciente" : "você"}</span></li>)}
                  {pendentes.slice(0, 3).map((a) => <li key={a.id} className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-mist px-2 py-0.5 text-xs font-semibold text-ink/60">aguardando</span><span className="font-medium text-ink">{a.nome}</span><span className="text-ink/50">{a.modo === "LINK" ? "pedida por link" : "para preencher na sessão"}</span></li>)}
                  {!respondidas.length && !pendentes.length && <li><Vazio texto="Nenhuma anamnese ainda. Escolha um modelo (geral, psicológica, infantil, reabilitação ou nutricional) e peça ao paciente ou preencha na sessão." /></li>}
                  {p.fazLaudo && <li className="flex flex-wrap items-center gap-2 border-t border-mist pt-2"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${neuropsicPreenchida ? "bg-sage/15 text-sage-deep" : "bg-mist text-ink/60"}`}>{neuropsicPreenchida ? "preenchida" : "não preenchida"}</span><span className="font-medium text-ink">Anamnese neuropsicológica (laudo)</span><button className="text-sage-deep underline" onClick={onAbrirAnamneseLaudo}>abrir</button></li>}
                </ul>
              )}
            </Cartao>
          </div>
          <div className="lg:col-span-2">
            <Cartao titulo="Saúde e tratamento" icone="❤️">
              <div className="grid gap-5 md:grid-cols-2">
                <div><h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/45">Tratamentos</h4>{trats.length ? <div className="flex flex-wrap gap-2">{trats.map((t, i) => <span key={i} className="rounded-full bg-sage/10 px-3 py-1 text-sm text-sage-deep">{t}</span>)}</div> : <Vazio texto="Tratamento não informado." />}</div>
                <div><h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/45">Medicamentos</h4>{meds.length ? <ul className="space-y-1.5">{meds.map((m, i) => <li key={i} className="flex justify-between rounded-lg bg-mist/50 px-3 py-1.5 text-sm"><span>{m.nome}</span><span className="text-ink/60">{[m.dose, m.unidade].filter(Boolean).join(" ")}</span></li>)}</ul> : <Vazio texto="Nenhum medicamento cadastrado." />}</div>
              </div>
            </Cartao>
          </div>
        </div>
      ) : (
        <div className="grid gap-5">
          <Cartao titulo="Dados básicos" icone="🪪">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo rotulo="Nome social"><input className={entrada} value={f.nomeSocial} onChange={(e) => set("nomeSocial", e.target.value)} /></Campo>
              <Campo rotulo="Telefone / WhatsApp"><input className={entrada} value={f.contato} onChange={(e) => set("contato", e.target.value)} placeholder="(11) 99999-9999" /></Campo>
              <Campo rotulo="E-mail"><input type="email" className={entrada} value={f.email} onChange={(e) => set("email", e.target.value)} /></Campo>
              <Campo rotulo="Profissão"><input className={entrada} value={f.profissao} onChange={(e) => set("profissao", e.target.value)} /></Campo>
              <Campo rotulo="Gênero"><select className={entrada} value={f.genero} onChange={(e) => set("genero", e.target.value)}><option value="">Selecione</option>{GENEROS.map((g) => <option key={g}>{g}</option>)}</select></Campo>
              <Campo rotulo="Raça/cor"><select className={entrada} value={f.racaCor} onChange={(e) => set("racaCor", e.target.value)}><option value="">Selecione</option>{RACAS.map((g) => <option key={g}>{g}</option>)}</select></Campo>
              <Campo rotulo="Estado civil"><select className={entrada} value={f.estadoCivil} onChange={(e) => set("estadoCivil", e.target.value)}><option value="">Selecione</option>{ESTADOS_CIVIS.map((g) => <option key={g}>{g}</option>)}</select></Campo>
              <Campo rotulo="Tipo de atendimento">
                <div className="flex rounded-full border border-mist bg-mist/40 p-1 text-sm font-semibold">
                  {([["ADULTO", "Adulto"], ["CRIANCA_ADOLESCENTE", "Criança/adolescente"]] as const).map(([v, r]) => <button key={v} type="button" className={`flex-1 rounded-full px-3 py-1.5 transition ${f.tipoPublico === v ? "bg-white text-sage-deep shadow" : "text-ink/50"}`} onClick={() => set("tipoPublico", v)}>{r}</button>)}
                </div>
              </Campo>
            </div>
            <p className="mt-3 text-xs text-ink/45">Nome, nascimento, CPF, escolaridade, convênio e nota fiscal ficam no formulário "Cadastro e faturamento", logo abaixo.</p>
          </Cartao>
          <Cartao titulo="Informações gerais" icone="ℹ️">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo rotulo="Início do tratamento"><input type="date" className={entrada} value={f.inicioTratamento} onChange={(e) => set("inicioTratamento", e.target.value)} /></Campo>
              <Campo rotulo="País"><input className={entrada} value={f.endereco.pais ?? ""} onChange={(e) => set("endereco", { ...f.endereco, pais: e.target.value })} /></Campo>
              <Campo rotulo="CEP (busca o endereço sozinho)"><input className={entrada} value={f.endereco.cep ?? ""} onChange={(e) => set("endereco", { ...f.endereco, cep: e.target.value })} onBlur={buscarCep} placeholder="00000-000" /></Campo>
              <Campo rotulo="Número"><input className={entrada} value={f.endereco.numero ?? ""} onChange={(e) => set("endereco", { ...f.endereco, numero: e.target.value })} /></Campo>
              <Campo rotulo="Rua / logradouro" largo><input className={entrada} value={f.endereco.logradouro ?? ""} onChange={(e) => set("endereco", { ...f.endereco, logradouro: e.target.value })} /></Campo>
              <Campo rotulo="Bairro"><input className={entrada} value={f.endereco.bairro ?? ""} onChange={(e) => set("endereco", { ...f.endereco, bairro: e.target.value })} /></Campo>
              <Campo rotulo="Cidade / UF"><div className="flex gap-2"><input className={entrada} value={f.endereco.cidade ?? ""} onChange={(e) => set("endereco", { ...f.endereco, cidade: e.target.value })} /><input className={`${entrada} w-20`} maxLength={2} value={f.endereco.uf ?? ""} onChange={(e) => set("endereco", { ...f.endereco, uf: e.target.value.toUpperCase() })} /></div></Campo>
              <Campo rotulo="Complemento" largo><input className={entrada} value={f.endereco.complemento ?? ""} onChange={(e) => set("endereco", { ...f.endereco, complemento: e.target.value })} /></Campo>
            </div>
          </Cartao>
          <Cartao titulo="Financeiro" icone="💰">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo rotulo="Moeda do paciente"><select className={entrada} value={f.moeda} onChange={(e) => set("moeda", e.target.value as "BRL" | "USD" | "EUR")}>{Object.entries(MOEDAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Campo>
              <Campo rotulo="Valor da sessão"><input className={entrada} inputMode="decimal" value={f.valor} onChange={(e) => set("valor", e.target.value)} placeholder="250,00" /></Campo>
            </div>
          </Cartao>
          <Cartao titulo="Responsável financeiro" icone="👪" tom="clay">
            <p className="mb-3 text-xs text-ink/50">Defina se o responsável recebe cobrança ou lembrete de sessão. Sem responsável marcado, os envios ficam com o paciente.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo rotulo="Nome"><input className={entrada} value={f.resp.nome ?? ""} onChange={(e) => set("resp", { ...f.resp, nome: e.target.value })} /></Campo>
              <Campo rotulo="Celular"><input className={entrada} value={f.resp.celular ?? ""} onChange={(e) => set("resp", { ...f.resp, celular: e.target.value })} /></Campo>
              <Campo rotulo="Vínculo"><select className={entrada} value={f.resp.vinculo ?? ""} onChange={(e) => set("resp", { ...f.resp, vinculo: e.target.value })}><option value="">Selecione</option>{VINCULOS.map((g) => <option key={g}>{g}</option>)}</select></Campo>
              <Campo rotulo="Documento"><div className="flex gap-2"><select className={`${entrada} w-24`} value={f.resp.documentoTipo ?? ""} onChange={(e) => set("resp", { ...f.resp, documentoTipo: e.target.value })}><option value="">Tipo</option><option>CPF</option><option>CNPJ</option></select><input className={entrada} value={f.resp.documentoNumero ?? ""} onChange={(e) => set("resp", { ...f.resp, documentoNumero: e.target.value })} /></div></Campo>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!f.resp.recebeCobranca} onChange={(e) => set("resp", { ...f.resp, recebeCobranca: e.target.checked })} />Recebe a cobrança</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!f.resp.recebeLembrete} onChange={(e) => set("resp", { ...f.resp, recebeLembrete: e.target.checked })} />Recebe o lembrete de sessão</label>
            </div>
          </Cartao>
          <Cartao titulo="Contatos de emergência" icone="🚨" tom="ember" acao={<span className="text-xs text-ink/50">até 2</span>}>
            <div className="space-y-3">
              {f.contatos.map((c, i) => (
                <div key={i} className="grid gap-2 rounded-xl bg-mist/40 p-3 sm:grid-cols-[1fr_1fr_9rem_auto]">
                  <input className={entrada} placeholder="Nome" value={c.nome} onChange={(e) => set("contatos", f.contatos.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)))} />
                  <input className={entrada} placeholder="Telefone" value={c.telefone} onChange={(e) => set("contatos", f.contatos.map((x, j) => (j === i ? { ...x, telefone: e.target.value } : x)))} />
                  <select className={entrada} value={c.vinculo} onChange={(e) => set("contatos", f.contatos.map((x, j) => (j === i ? { ...x, vinculo: e.target.value } : x)))}><option value="">Vínculo</option>{VINCULOS.map((g) => <option key={g}>{g}</option>)}</select>
                  <button type="button" className="text-sm text-ember hover:underline" onClick={() => set("contatos", f.contatos.filter((_, j) => j !== i))}>Remover</button>
                </div>
              ))}
              {f.contatos.length < 2 && <button type="button" className={btnSecundario} onClick={() => set("contatos", [...f.contatos, { nome: "", telefone: "", vinculo: "" }])}>+ Adicionar contato de emergência</button>}
            </div>
          </Cartao>
          <Cartao titulo="Saúde e tratamento" icone="❤️">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/45">Tratamentos</h4>
            <div className="mb-2 flex flex-wrap gap-2">{f.tratamentos.map((t, i) => <span key={i} className="flex items-center gap-1 rounded-full bg-sage/10 px-3 py-1 text-sm text-sage-deep">{t}<button type="button" aria-label="Remover" className="ml-1 text-sage-deep/60 hover:text-ember" onClick={() => set("tratamentos", f.tratamentos.filter((_, j) => j !== i))}>×</button></span>)}</div>
            <div className="mb-5 flex gap-2"><input className={entrada} placeholder="Ex.: acompanhamento psiquiátrico, fonoaudiologia (Enter para adicionar)" value={f.novoTrat} onChange={(e) => set("novoTrat", e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && f.novoTrat.trim()) { e.preventDefault(); set("tratamentos", [...f.tratamentos, f.novoTrat.trim()]); set("novoTrat", ""); } }} /></div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/45">Medicamentos</h4>
            <div className="space-y-2">
              {f.medicamentos.map((m, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-[1fr_6rem_6rem_auto]">
                  <input className={entrada} placeholder="Medicamento" value={m.nome} onChange={(e) => set("medicamentos", f.medicamentos.map((x, j) => (j === i ? { ...x, nome: e.target.value } : x)))} />
                  <input className={entrada} placeholder="Dose" value={m.dose} onChange={(e) => set("medicamentos", f.medicamentos.map((x, j) => (j === i ? { ...x, dose: e.target.value } : x)))} />
                  <input className={entrada} placeholder="Unidade" value={m.unidade} onChange={(e) => set("medicamentos", f.medicamentos.map((x, j) => (j === i ? { ...x, unidade: e.target.value } : x)))} />
                  <button type="button" className="text-sm text-ember hover:underline" onClick={() => set("medicamentos", f.medicamentos.filter((_, j) => j !== i))}>Remover</button>
                </div>
              ))}
              <button type="button" className={btnSecundario} onClick={() => set("medicamentos", [...f.medicamentos, { nome: "", dose: "", unidade: "mg" }])}>+ Adicionar medicamento</button>
            </div>
          </Cartao>
        </div>
      )}
    </div>
  );
}
