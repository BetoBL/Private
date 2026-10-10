// Qual regra de emissão vale para um paciente. A configuração da clínica é só o PADRÃO; o paciente (e o convênio dele) podem ter a sua.
//
//   paciente de convênio  → a forma de faturar é a do convênio (caso a caso ou lote mensal), ou a padrão da clínica para convênio;
//   paciente particular   → a forma do paciente (por sessão, por laudo, manual, não emitir) ou, se vazia, a padrão da clínica;
//   momento de emitir     → o do paciente, se houver; senão o padrão da clínica;
//   tomador da nota       → o paciente (ou o convênio), o responsável ou outra pessoa/empresa, conforme o cadastro.
// Cada resultado diz DE ONDE veio (paciente, convênio ou clínica), para a tela explicar e para a auditoria.

export type ModoEmissao = "POR_SESSAO" | "POR_LAUDO" | "MANUAL" | "NAO_EMITE" | "CONVENIO_INDIVIDUAL" | "CONVENIO_LOTE_MENSAL";
export type Origem = "paciente" | "convenio" | "clinica";

export interface PadraoFiscal { modoParticular: string; quandoEmitir: string; modoConvenio: string; exigeDataPagamento?: boolean }
export interface PacienteFiscal {
  convenioId?: string | null; nfModo?: string | null; nfQuando?: string | null; nfEmNomeDe?: string | null;
  nfTomadorNome?: string | null; nfTomadorDocumento?: string | null; nfTomadorEmail?: string | null;
  nome: string; cpf?: string | null; responsavelLegal?: string | null;
}
export interface ConvenioFiscal { id?: string; nomeOperadora: string; cnpj?: string | null; razaoSocial?: string | null; formaFaturamento?: string | null }

export interface RegraEmissao {
  modo: ModoEmissao; modoOrigem: Origem;
  quando: "NA_COBRANCA" | "NA_BAIXA" | "MANUAL"; quandoOrigem: Origem;
  tomador: { tipo: "PACIENTE" | "RESPONSAVEL" | "OUTRO" | "CONVENIO"; nome: string; documento: string | null; email: string | null };
  emite: boolean;
}

const QUANDO = ["NA_COBRANCA", "NA_BAIXA", "MANUAL"];

export function regraDeEmissao(padrao: PadraoFiscal, paciente: PacienteFiscal, convenio?: ConvenioFiscal | null): RegraEmissao {
  const temConvenio = !!paciente.convenioId && !!convenio;

  let modo: ModoEmissao, modoOrigem: Origem;
  if (paciente.nfModo === "NAO_EMITE") { modo = "NAO_EMITE"; modoOrigem = "paciente"; }
  else if (temConvenio) {
    const forma = convenio!.formaFaturamento || padrao.modoConvenio;
    modo = forma === "LOTE_MENSAL" ? "CONVENIO_LOTE_MENSAL" : "CONVENIO_INDIVIDUAL";
    modoOrigem = convenio!.formaFaturamento ? "convenio" : "clinica";
  } else if (paciente.nfModo && ["POR_SESSAO", "POR_LAUDO", "MANUAL"].includes(paciente.nfModo)) { modo = paciente.nfModo as ModoEmissao; modoOrigem = "paciente"; }
  else { modo = (["POR_SESSAO", "POR_LAUDO", "MANUAL"].includes(padrao.modoParticular) ? padrao.modoParticular : "MANUAL") as ModoEmissao; modoOrigem = "clinica"; }

  const quandoPac = paciente.nfQuando && QUANDO.includes(paciente.nfQuando) ? paciente.nfQuando : null;
  const quando = (quandoPac ?? (QUANDO.includes(padrao.quandoEmitir) ? padrao.quandoEmitir : "MANUAL")) as RegraEmissao["quando"];

  let tomador: RegraEmissao["tomador"];
  if (paciente.nfEmNomeDe === "OUTRO" && paciente.nfTomadorNome?.trim()) tomador = { tipo: "OUTRO", nome: paciente.nfTomadorNome.trim(), documento: paciente.nfTomadorDocumento ?? null, email: paciente.nfTomadorEmail ?? null };
  else if (paciente.nfEmNomeDe === "RESPONSAVEL" && (paciente.nfTomadorNome?.trim() || paciente.responsavelLegal?.trim())) tomador = { tipo: "RESPONSAVEL", nome: (paciente.nfTomadorNome?.trim() || paciente.responsavelLegal!.trim()), documento: paciente.nfTomadorDocumento ?? null, email: paciente.nfTomadorEmail ?? null };
  else if (temConvenio && paciente.nfEmNomeDe !== "PACIENTE") tomador = { tipo: "CONVENIO", nome: convenio!.razaoSocial?.trim() || convenio!.nomeOperadora, documento: convenio!.cnpj ?? null, email: paciente.nfTomadorEmail ?? null };
  else tomador = { tipo: "PACIENTE", nome: paciente.nome, documento: paciente.cpf ?? null, email: paciente.nfTomadorEmail ?? null };

  return { modo, modoOrigem, quando, quandoOrigem: quandoPac ? "paciente" : "clinica", tomador, emite: modo !== "NAO_EMITE" };
}
