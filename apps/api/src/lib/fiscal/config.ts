// Regras da configuração fiscal da clínica: descrição da nota com variáveis, pendências para emitir e valores aceitos.
// Nada de município, código de serviço, alíquota ou texto fixo: tudo vem da configuração (o sistema atende outras clínicas).

export const REGIMES = ["SIMPLES_NACIONAL", "MEI", "LUCRO_PRESUMIDO", "LUCRO_REAL"] as const;
export const AMBIENTES = ["HOMOLOGACAO", "PRODUCAO"] as const;
export const MODOS_PARTICULAR = ["POR_SESSAO", "POR_LAUDO", "MANUAL"] as const;
export const QUANDO_EMITIR = ["NA_BAIXA", "NA_COBRANCA", "MANUAL"] as const;
export const MODOS_CONVENIO = ["INDIVIDUAL", "LOTE_MENSAL"] as const;

export const VARIAVEIS_DESCRICAO: Array<{ variavel: string; descricao: string }> = [
  { variavel: "sessao.data", descricao: "Dia e mês da sessão (31/07)" },
  { variavel: "sessao.dataCompleta", descricao: "Data completa da sessão (31/07/2026)" },
  { variavel: "sessao.datas", descricao: "Todas as datas cobertas pela nota (05/10, 12/10 e 19/10)" },
  { variavel: "periodo", descricao: "Mês e ano de competência (outubro/2026)" },
  { variavel: "competencia", descricao: "Competência no formato 10/2026" },
  { variavel: "quantidade", descricao: "Quantidade de atendimentos na nota" },
  { variavel: "convenio.nome", descricao: "Nome do convênio" },
  { variavel: "profissional.nome", descricao: "Nome do profissional" },
  { variavel: "clinica.nome", descricao: "Nome da clínica" },
];

export interface ContextoDescricao {
  datas: Date[]; // datas das sessões cobertas
  competencia: Date;
  convenioNome?: string | null;
  profissionalNome?: string | null;
  clinicaNome?: string | null;
}

const dd = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
const ddmmaaaa = (d: Date) => d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
function lista(itens: string[]): string { return itens.length <= 1 ? itens.join("") : `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`; }

export function montarDescricao(modelo: string, c: ContextoDescricao): string {
  const datas = [...c.datas].sort((a, b) => a.getTime() - b.getTime());
  const mes = c.competencia.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).replace(" de ", "/");
  const comp = `${String(c.competencia.getUTCMonth() + 1).padStart(2, "0")}/${c.competencia.getUTCFullYear()}`;
  const v: Record<string, string> = {
    "sessao.data": lista(datas.map(dd)),
    "sessao.dataCompleta": lista(datas.map(ddmmaaaa)),
    "sessao.datas": lista(datas.map(dd)),
    periodo: mes,
    competencia: comp,
    quantidade: String(datas.length),
    "convenio.nome": c.convenioNome ?? "",
    "profissional.nome": c.profissionalNome ?? "",
    "clinica.nome": c.clinicaNome ?? "",
  };
  return modelo.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, k: string) => (k in v ? v[k] : m)).replace(/\s+/g, " ").trim();
}

export interface ConfigFiscalDados {
  emissaoAtiva: boolean; ambiente: string; regime: string; inscricaoMunicipal: string | null; codigoMunicipioIbge: string | null;
  cTribNac: string | null; nbs: string | null; descricaoPadrao: string; aliquotaModo: string; aliquotaIss: unknown; rbt12: unknown;
  serieDps: string; proximoNumeroDps: number;
}
export interface ClinicaFiscal { razaoSocial: string; cnpj: string | null; endereco: string | null; cep: string | null; cidade: string | null; estado: string | null }

export interface PendenciaFiscal { campo: string; mensagem: string; onde: "clinica" | "fiscal" | "certificado" }

// O que ainda falta para o sistema preparar (teste) e para emitir de verdade
export function pendenciasFiscais(cfg: ConfigFiscalDados | null, clinica: ClinicaFiscal, temCertificado = false): { pendencias: PendenciaFiscal[]; prontoParaTeste: boolean; prontoParaEmitir: boolean } {
  const p: PendenciaFiscal[] = [];
  const falta = (cond: boolean, campo: string, mensagem: string, onde: PendenciaFiscal["onde"]) => { if (cond) p.push({ campo, mensagem, onde }); };
  falta(!clinica.razaoSocial?.trim(), "razaoSocial", "Razão social da clínica", "clinica");
  falta(!clinica.cnpj?.trim(), "cnpj", "CNPJ da clínica", "clinica");
  falta(!clinica.endereco?.trim() || !clinica.cep?.trim(), "endereco", "Endereço e CEP da clínica", "clinica");
  falta(!cfg?.inscricaoMunicipal?.trim(), "inscricaoMunicipal", "Inscrição municipal", "fiscal");
  falta(!cfg?.codigoMunicipioIbge?.trim(), "codigoMunicipioIbge", "Código IBGE do município", "fiscal");
  falta(!cfg?.cTribNac?.trim(), "cTribNac", "Código de tributação nacional do serviço", "fiscal");
  falta(!cfg?.serieDps?.trim(), "serieDps", "Série da DPS", "fiscal");
  if (cfg?.aliquotaModo === "SIMPLES") falta(cfg.rbt12 === null || cfg.rbt12 === undefined, "rbt12", "Receita bruta dos últimos 12 meses (para a alíquota do Simples)", "fiscal");
  else falta(cfg?.aliquotaIss === null || cfg?.aliquotaIss === undefined, "aliquotaIss", "Alíquota do ISS", "fiscal");
  const paraTeste = p.length === 0;
  falta(!temCertificado, "certificado", "Certificado digital A1 da clínica (necessário só para emitir de verdade)", "certificado");
  return { pendencias: p, prontoParaTeste: paraTeste, prontoParaEmitir: p.length === 0 && cfg?.ambiente === "PRODUCAO" && !!cfg?.emissaoAtiva };
}
