import type { PrismaClient } from "@prisma/client";
import { AVISO_IA, AVISO_SIGILO, AVISO_VALIDADE, TEXTO_REFERENCIAL } from "./textosLeticia";

// ---------- estrutura de um modelo de laudo/documento ----------
// Camada 1 (estrutura): seções em ordem, textos fixos, o que é por paciente. Camada 2 (domínios): nomes/ordem/introdução dos domínios
// e itens extras. Camada 3 (blocos): tabelas/gráficos de cada teste colocados em um domínio. A aparência (timbrado) vem do cadastro da clínica.

export type TipoSecao =
  | "identificacao" // blocos de identificação (profissional, paciente, campos livres)
  | "demanda" // Laudo.descricaoDemanda
  | "anamnese" // Laudo.anamnese
  | "observacao" // Laudo.observacaoClinica
  | "instrumentos" // Laudo.procedimento (lista de instrumentos / procedimentos)
  | "referencial" // texto fixo do modelo + tabela de classificação por percentil
  | "analise" // Laudo.analise (domínios, tabelas e gráficos montados dos resultados)
  | "conclusao" // Laudo.conclusao (+ hipótese diagnóstica)
  | "sugestoes" // parte "## Sugestões…" da conclusão (some se vazia)
  | "referencias" // Laudo.referencias
  | "fecho" // local, data, assinatura, nome e CRP
  | "aviso_sigilo" | "aviso_validade" | "aviso_ia" // avisos em letra pequena (texto do modelo)
  | "texto" // texto fixo do modelo (aceita marcadores {{...}})
  | "documento" // texto do modelo com campos {{...}} e blocos [[...]] dos testes (montado no editor); cada paciente pode ajustar
  | "livre"; // texto por paciente, guardado em Laudo.secoesExtras (o `texto` do modelo é o ponto de partida)

export interface BlocoIdentificacao {
  tipo: "profissional" | "paciente" | "campos";
  titulo?: string; // subtítulo (ex.: "IDENTIFICAÇÃO PROFISSIONAL")
  campos?: Array<{ id: string; rotulo: string }>; // tipo "campos": preenchidos por paciente (Laudo.secoesExtras[id])
}

export interface SecaoModelo {
  id: string;
  tipo: TipoSecao;
  titulo: string; // vazio = sem título
  ativo?: boolean; // false = fica no modelo mas não sai no documento
  texto?: string | string[]; // texto fixo (tipos "texto", "referencial", avisos) ou ponto de partida ("livre")
  orientacao?: string; // dica de preenchimento mostrada no editor (não sai no documento)
  quebraPagina?: boolean; // começa em página nova
  classificacao?: boolean; // "referencial": inclui a tabela de classificação por percentil
  identificacao?: BlocoIdentificacao[];
}

export interface DominioModelo {
  chave: string; // chave do domínio padrão (intelectuais, memoria…) ou outra, para domínio novo
  titulo?: string;
  intro?: string; // "" = sem introdução; ausente = a padrão do sistema
  ativo?: boolean;
}

export interface ItemExtraModelo { dominio: string; teste: string; fonte: { linha?: string; campo?: string }; descricao: string; rotulo?: string }
export interface BlocoModelo { dominio: string; teste: string; tipo: "tabela" | "grafico" | "resultados"; ref?: string }

export interface EstruturaModelo {
  cabecalho: string[]; // linhas centralizadas no alto (ex.: "LAUDO PSICOLÓGICO")
  abertura?: string; // parágrafo em negrito sob o cabeçalho
  numerar: boolean;
  secoes: SecaoModelo[];
  dominios?: DominioModelo[];
  itensExtras?: ItemExtraModelo[];
  blocos?: BlocoModelo[];
  // testes deste modelo (siglas): limitam o que o editor oferece. Vazio/ausente = todos os testes do catálogo
  testes?: string[];
  tipoAtendimentoId?: string;
}

export type TipoModelo = "LAUDO_NEURO" | "LAUDO" | "RELATORIO" | "PARECER" | "DECLARACAO" | "ATESTADO" | "PERSONALIZADO";
export const ROTULO_TIPO: Record<TipoModelo, string> = { LAUDO_NEURO: "Laudo neuropsicológico", LAUDO: "Laudo psicológico", RELATORIO: "Relatório psicológico", PARECER: "Parecer psicológico", DECLARACAO: "Declaração", ATESTADO: "Atestado", PERSONALIZADO: "Personalizado" };

// ---------- marcadores {{...}} ----------
export interface DadosMarcadores {
  clinica: { nome: string; cidade?: string | null; endereco?: string | null; telefone?: string | null };
  profissional: { nome: string; crp: string; email?: string | null; tituloLaudo?: string | null; especialidades?: string[] };
  paciente: { nome: string; cpf?: string | null; dataNascimento: Date; idadeTexto: string };
  data: Date;
}

export const MARCADORES: Array<{ marcador: string; descricao: string }> = [
  { marcador: "paciente.nome", descricao: "Nome completo do paciente" },
  { marcador: "paciente.primeiroNome", descricao: "Primeiro nome do paciente" },
  { marcador: "paciente.cpf", descricao: "CPF do paciente" },
  { marcador: "paciente.nascimento", descricao: "Data de nascimento" },
  { marcador: "paciente.idade", descricao: "Idade na data da avaliação" },
  { marcador: "profissional.nome", descricao: "Nome do profissional" },
  { marcador: "profissional.crp", descricao: "Número do CRP" },
  { marcador: "profissional.titulo", descricao: "Linha de título/especialidade sob o nome" },
  { marcador: "profissional.email", descricao: "E-mail do profissional" },
  { marcador: "clinica.nome", descricao: "Nome da clínica" },
  { marcador: "clinica.cidade", descricao: "Cidade da clínica" },
  { marcador: "clinica.endereco", descricao: "Endereço da clínica" },
  { marcador: "clinica.telefone", descricao: "Telefone da clínica" },
  { marcador: "data", descricao: "Data de emissão (dd/mm/aaaa)" },
  { marcador: "data.extenso", descricao: "Data de emissão por extenso" },
  { marcador: "local.data", descricao: "Cidade e data por extenso (ex.: São Paulo, 8 de outubro de 2026)" },
];

export function valoresMarcadores(d: DadosMarcadores): Record<string, string> {
  const extenso = d.data.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  return {
    "paciente.nome": d.paciente.nome,
    "paciente.primeiroNome": d.paciente.nome.split(" ")[0],
    "paciente.cpf": d.paciente.cpf ?? "",
    "paciente.nascimento": d.paciente.dataNascimento.toLocaleDateString("pt-BR", { timeZone: "UTC" }),
    "paciente.idade": d.paciente.idadeTexto,
    "profissional.nome": d.profissional.nome,
    "profissional.crp": d.profissional.crp,
    "profissional.titulo": d.profissional.tituloLaudo?.trim() || `Psicólogo(a)${d.profissional.especialidades?.length ? ` especialista em ${d.profissional.especialidades.join(", ")}` : ""}`,
    "profissional.email": d.profissional.email ?? "",
    "clinica.nome": d.clinica.nome,
    "clinica.cidade": d.clinica.cidade ?? "",
    "clinica.endereco": d.clinica.endereco ?? "",
    "clinica.telefone": d.clinica.telefone ?? "",
    data: d.data.toLocaleDateString("pt-BR"),
    "data.extenso": extenso,
    "local.data": `${d.clinica.cidade ? `${d.clinica.cidade}, ` : ""}${extenso}`,
  };
}

// troca {{marcador}}; marcador desconhecido fica como está (o profissional vê e corrige)
export function resolverMarcadores(texto: string, d: DadosMarcadores): string {
  const v = valoresMarcadores(d);
  return texto.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (m, k: string) => (k in v ? v[k] : m));
}

// ---------- modelos do sistema ----------
export interface ModeloDoSistema { id: string; nome: string; tipo: TipoModelo; descricao: string; fonte: string; estrutura: EstruturaModelo }

const FONTE_CFP = "Estrutura segundo a Resolução CFP nº 06/2019 e o Manual Orientativo de Registro e Elaboração de Documentos Psicológicos (CFP, 2025), Apêndice 3. Os textos desta versão são redação própria do sistema.";
const ID_PROF: BlocoIdentificacao = { tipo: "profissional", titulo: "IDENTIFICAÇÃO PROFISSIONAL" };
const ID_PAC: BlocoIdentificacao = { tipo: "paciente", titulo: "IDENTIFICAÇÃO DO(A) PACIENTE" };
const FINALIDADE: BlocoIdentificacao = { tipo: "campos", campos: [{ id: "solicitante", rotulo: "Solicitante" }, { id: "finalidade", rotulo: "Finalidade" }] };
const TEXTO_SIGILO_CFP = "Este documento tem caráter sigiloso e deve ser utilizado apenas para a finalidade indicada na identificação. Sua validade é a informada na conclusão; passado esse prazo, recomenda-se nova avaliação.";

const secao = (id: string, tipo: TipoSecao, titulo: string, extra: Partial<SecaoModelo> = {}): SecaoModelo => ({ id, tipo, titulo, ...extra });

export const MODELOS_DO_SISTEMA: ModeloDoSistema[] = [
  {
    id: "sistema-laudo-neuro",
    nome: "Laudo neuropsicológico completo (MentEssence)",
    tipo: "LAUDO_NEURO",
    descricao: "Laudo de avaliação neuropsicológica com análise por domínios cognitivos, tabelas e gráficos dos testes. Baseado no laudo da neuropsicóloga Letícia (MentEssence), que autorizou o uso como modelo padrão.",
    fonte: "Modelo da neuropsicóloga Letícia (MentEssence); textos fixos reproduzidos palavra por palavra.",
    estrutura: {
      cabecalho: ["LAUDO PSICOLÓGICO", "COM ENFOQUE NEUROPSICOLÓGICO"],
      abertura: "Laudo realizado de acordo com as resoluções 06/2019 e 09/2018, do Conselho Federal de Psicologia (CFP), as quais constituem o Manual de Elaboração de Documentos escritos pelo (a) Psicólogo (a), decorrentes de avaliação psicológica, interpretação e análise de dados obtidos por meio de técnicas e instrumentos reconhecidos cientificamente para o uso na prática profissional.",
      numerar: true,
      secoes: [
        secao("identificacao", "identificacao", "IDENTIFICAÇÃO", { identificacao: [{ tipo: "profissional", titulo: "IDENTIFICAÇÃO PROFISSIONAL" }, { tipo: "paciente", titulo: "IDENTIFICAÇÃO DO(A) PACIENTE" }] }),
        secao("demanda", "demanda", "DEMANDA", { orientacao: "Motivo da avaliação: quem encaminhou e o que se quer esclarecer." }),
        secao("anamnese", "anamnese", "DADOS DE ANAMNESE", { orientacao: "Montada do formulário de anamnese da ficha do paciente; pode ser editada." }),
        secao("observacao", "observacao", "OBSERVAÇÃO CLÍNICA"),
        secao("instrumentos", "instrumentos", "INSTRUMENTOS CLÍNICOS"),
        secao("referencial", "referencial", "REFERENCIAL TEÓRICO E METODOLÓGICO", { texto: TEXTO_REFERENCIAL, classificacao: true }),
        secao("analise", "analise", "ANÁLISE DOS RESULTADOS"),
        secao("conclusao", "conclusao", "CONCLUSÃO"),
        secao("sugestoes", "sugestoes", "SUGESTÕES E ENCAMINHAMENTOS"),
        secao("fecho", "fecho", ""),
        secao("sigilo", "aviso_sigilo", "", { texto: AVISO_SIGILO }),
        secao("validade", "aviso_validade", "", { texto: AVISO_VALIDADE }),
        secao("ia", "aviso_ia", "", { texto: AVISO_IA }),
        secao("referencias", "referencias", "REFERÊNCIAS BIBLIOGRÁFICAS", { quebraPagina: true }),
      ],
    },
  },
  {
    id: "sistema-laudo-psicologico",
    nome: "Laudo psicológico (estrutura CFP)",
    tipo: "LAUDO",
    descricao: "Laudo psicológico nas seis partes exigidas pelo CFP: identificação, descrição da demanda, procedimento, análise, conclusão e referências.",
    fonte: FONTE_CFP,
    estrutura: {
      cabecalho: ["LAUDO PSICOLÓGICO"],
      numerar: true,
      secoes: [
        secao("identificacao", "identificacao", "IDENTIFICAÇÃO", { identificacao: [FINALIDADE, ID_PAC, ID_PROF], orientacao: "Nome completo (ou social) de quem foi atendido, solicitante, finalidade e autoria com o CRP." }),
        secao("demanda", "demanda", "DESCRIÇÃO DA DEMANDA", { orientacao: "Quem solicitou, por quê e o que se espera esclarecer; as informações de quem encaminhou, quando houver." }),
        secao("instrumentos", "instrumentos", "PROCEDIMENTO", { orientacao: "Raciocínio técnico-científico adotado, instrumentos e técnicas usados, pessoas ouvidas, número de encontros e tempo de duração (Resolução CFP 31/2022)." }),
        secao("analise", "analise", "ANÁLISE", { orientacao: "Exposição descritiva, metódica e objetiva dos dados, com interpretação da psicóloga e fundamentação teórica." }),
        secao("conclusao", "conclusao", "CONCLUSÃO", { orientacao: "Diagnóstico, prognóstico ou hipótese, e orientações. Retome a finalidade, informe a validade do documento e o caráter sigiloso." }),
        secao("sigilo", "texto", "", { texto: TEXTO_SIGILO_CFP }),
        secao("referencias", "referencias", "REFERÊNCIAS", { orientacao: "Obrigatórias no laudo: fontes científicas, técnicas e legais que sustentam o documento." }),
        secao("fecho", "fecho", ""),
      ],
    },
  },
  {
    id: "sistema-relatorio-psicologico",
    nome: "Relatório psicológico (estrutura CFP)",
    tipo: "RELATORIO",
    descricao: "Relatório psicológico ou multiprofissional: mesma estrutura do laudo, com a conclusão aceitando encaminhamentos e referências opcionais. No multiprofissional, cada profissional escreve a sua análise.",
    fonte: FONTE_CFP,
    estrutura: {
      cabecalho: ["RELATÓRIO PSICOLÓGICO"],
      numerar: true,
      secoes: [
        secao("identificacao", "identificacao", "IDENTIFICAÇÃO", { identificacao: [FINALIDADE, ID_PAC, ID_PROF] }),
        secao("demanda", "demanda", "DESCRIÇÃO DA DEMANDA"),
        secao("instrumentos", "instrumentos", "PROCEDIMENTO", { orientacao: "Atendimentos realizados, pessoas ouvidas, período e número de encontros." }),
        secao("analise", "analise", "ANÁLISE", { orientacao: "No relatório multiprofissional, separe a análise de cada profissional." }),
        secao("conclusao", "conclusao", "CONCLUSÃO", { orientacao: "Pode incluir encaminhamentos e orientações." }),
        secao("referencias", "referencias", "REFERÊNCIAS", { orientacao: "Opcional neste documento." }),
        secao("fecho", "fecho", ""),
      ],
    },
  },
  {
    id: "sistema-parecer-psicologico",
    nome: "Parecer psicológico (estrutura CFP)",
    tipo: "PARECER",
    descricao: "Parecer: resposta técnica a uma questão ou a um documento. Identificação, descrição da demanda, análise, conclusão e referências.",
    fonte: FONTE_CFP,
    estrutura: {
      cabecalho: ["PARECER PSICOLÓGICO"],
      numerar: true,
      secoes: [
        secao("identificacao", "identificacao", "IDENTIFICAÇÃO", { identificacao: [{ tipo: "campos", campos: [{ id: "solicitante", rotulo: "Solicitante" }, { id: "assunto", rotulo: "Assunto" }] }, ID_PROF] }),
        secao("demanda", "demanda", "DESCRIÇÃO DA DEMANDA", { orientacao: "A questão a ser respondida, ou o documento analisado." }),
        secao("analise", "analise", "ANÁLISE", { orientacao: "Discussão fundamentada em literatura científica, ética e legislação." }),
        secao("conclusao", "conclusao", "CONCLUSÃO", { orientacao: "A resposta objetiva à demanda." }),
        secao("referencias", "referencias", "REFERÊNCIAS"),
        secao("fecho", "fecho", ""),
      ],
    },
  },
  {
    id: "sistema-declaracao",
    nome: "Declaração psicológica",
    tipo: "DECLARACAO",
    descricao: "Declaração curta de comparecimento ou de acompanhamento, sem diagnóstico. Edite o texto de cada paciente antes de emitir.",
    fonte: FONTE_CFP,
    estrutura: {
      cabecalho: ["DECLARAÇÃO"],
      numerar: false,
      secoes: [
        secao("texto", "livre", "", {
          texto: "Declaro, para os devidos fins, que {{paciente.nome}}, CPF {{paciente.cpf}}, esteve em atendimento psicológico comigo em ____/____/______, no horário das ____ às ____, na {{clinica.nome}}.",
          orientacao: "Informe dia, horário e, se for o caso, o período de acompanhamento. A declaração não traz diagnóstico nem detalhes do atendimento.",
        }),
        secao("fecho", "fecho", ""),
      ],
    },
  },
  {
    id: "sistema-atestado",
    nome: "Atestado psicológico",
    tipo: "ATESTADO",
    descricao: "Atestado das condições psicológicas do paciente para uma finalidade informada (por exemplo, afastamento). Edite o texto de cada paciente antes de emitir.",
    fonte: FONTE_CFP,
    estrutura: {
      cabecalho: ["ATESTADO PSICOLÓGICO"],
      numerar: false,
      secoes: [
        secao("texto", "livre", "", {
          texto: "Atesto, para os devidos fins, que {{paciente.nome}}, CPF {{paciente.cpf}}, encontra-se em acompanhamento psicológico e, com base na avaliação realizada, apresenta condições psicológicas que justificam ________________________, pelo período de ____ dias, a partir de ____/____/______.",
          orientacao: "Informe a finalidade e o período. O CID só entra se houver solicitação expressa do paciente ou do responsável.",
        }),
        secao("fecho", "fecho", ""),
      ],
    },
  },
];

export const MODELO_PADRAO_ID = "sistema-laudo-neuro";
export const estruturaDoSistema = (id: string) => MODELOS_DO_SISTEMA.find((m) => m.id === id)?.estrutura;

// grava/atualiza os modelos do sistema (somente leitura para os usuários); roda na subida da API
export async function sincronizarModelosDoSistema(prisma: PrismaClient): Promise<number> {
  for (const m of MODELOS_DO_SISTEMA) {
    const dados = { nome: m.nome, tipo: m.tipo, descricao: m.descricao, fonte: m.fonte, sistema: true, estrutura: m.estrutura as unknown as object, ativo: true };
    await prisma.modeloLaudo.upsert({ where: { id: m.id }, update: dados, create: { id: m.id, ...dados } });
  }
  return MODELOS_DO_SISTEMA.length;
}

// ---------- validação de uma estrutura vinda do navegador ----------
const TIPOS: TipoSecao[] = ["identificacao", "demanda", "anamnese", "observacao", "instrumentos", "referencial", "analise", "conclusao", "sugestoes", "referencias", "fecho", "aviso_sigilo", "aviso_validade", "aviso_ia", "texto", "livre", "documento"];
export const TIPOS_SECAO = TIPOS;

export function estruturaValida(e: unknown): string | null {
  const x = e as Partial<EstruturaModelo> | null;
  if (!x || typeof x !== "object") return "estrutura ausente";
  if (!Array.isArray(x.cabecalho) || x.cabecalho.some((l) => typeof l !== "string")) return "cabeçalho inválido";
  if (!Array.isArray(x.secoes) || x.secoes.length === 0) return "o modelo precisa de ao menos uma seção";
  const ids = new Set<string>();
  for (const s of x.secoes) {
    if (!s || typeof s.id !== "string" || !s.id || ids.has(s.id)) return "seção sem identificador ou repetida";
    ids.add(s.id);
    if (!TIPOS.includes(s.tipo)) return `tipo de seção desconhecido: ${String(s.tipo)}`;
    if (typeof s.titulo !== "string") return "título de seção inválido";
  }
  return null;
}
