import dados from "../../data/exames-tuss.json";

// Catálogo de exames: procedimentos diagnósticos da Tabela 22 da TUSS (ANS, termos vigentes), baixada do Sistema de Gestão de Terminologias da ANS.
// Os grupos por especialidade (kits) são sugestões iniciais, montadas por nós; precisam ser validadas por médicos da área.

export interface Exame { codigo: string; nome: string; grupo: string }

// o terceiro e quarto dígitos do código da TUSS dizem o tipo de exame
const GRUPOS: Array<[string, string]> = [
  ["201", "Monitorização (Holter, MAPA)"], ["401", "Métodos diagnósticos funcionais"], ["402", "Endoscopia e procedimentos diagnósticos"], ["403", "Laboratório clínico"], ["404", "Hemoterapia"],
  ["405", "Anatomia patológica"], ["406", "Biologia molecular"], ["407", "Medicina nuclear"], ["408", "Radiologia"], ["409", "Ultrassonografia"], ["410", "Tomografia"],
  ["411", "Ressonância magnética"], ["412", "Radioterapia"], ["413", "Oftalmologia"], ["414", "Testes e provas"], ["415", "Outros métodos diagnósticos"],
];
const grupoDe = (codigo: string) => GRUPOS.find(([p]) => codigo.startsWith(p))?.[1] ?? "Outros";

export const EXAMES: Exame[] = (dados as Array<[string, string]>).map(([codigo, nome]) => ({ codigo, nome, grupo: grupoDe(codigo) }));
export const GRUPOS_EXAME = GRUPOS.filter(([p]) => EXAMES.some((e) => e.codigo.startsWith(p))).map(([, nome]) => nome);

// "ECG" e "eletrocardiograma", "TC" e "tomografia" são o mesmo exame para o médico, mas a TUSS usa um ou outro
export const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const SINONIMOS: Array<[string, string[]]> = [
  ["ecg", ["eletrocardiograma"]], ["eletrocardiograma", ["ecg"]], ["eco", ["ecocardiograma", "ecodopplercardiograma"]], ["ecocardiograma", ["ecodopplercardiograma"]],
  ["tc", ["tomografia"]], ["tomografia", ["tc"]], ["rm", ["ressonancia"]], ["ressonancia", ["rm"]], ["us", ["ultrassonografia", "ecografia"]], ["usg", ["us"]],
  ["ultrassom", ["us"]], ["ultrassonografia", ["us"]], ["rx", ["radiografia"]], ["raio", ["rx"]], ["mapa", ["monitorizacao ambulatorial"]], ["tco", ["tomografia de coerencia"]],
  ["hemograma", ["hemograma"]], ["glicemia", ["glicose"]], ["hba1c", ["hemoglobina glicada"]],
];
const indice = EXAMES.map((e) => ({ e, n: normalizar(e.nome) }));

function casaToken(n: string, token: string) {
  if (n.includes(token)) return true;
  const alt = SINONIMOS.find(([k]) => k === token)?.[1] ?? [];
  return alt.some((a) => n.includes(a));
}

// todos os termos digitados precisam aparecer (ou um sinônimo); nomes que começam com o termo vêm antes
export function buscarExames(consulta: string, opcoes: { grupo?: string; limite?: number } = {}): Exame[] {
  const tokens = normalizar(consulta).split(/\s+/).filter(Boolean);
  const limite = opcoes.limite ?? 30;
  const achados = indice.filter(({ e, n }) => (!opcoes.grupo || e.grupo === opcoes.grupo) && tokens.every((t) => casaToken(n, t)));
  const peso = ({ n }: { n: string }) => (tokens.length && n.startsWith(tokens[0]) ? 0 : 1);
  return achados.sort((a, b) => peso(a) - peso(b) || a.e.nome.length - b.e.nome.length).slice(0, limite).map((x) => x.e);
}

export const exameDe = (codigo: string) => EXAMES.find((e) => e.codigo === codigo);

// ---- kits por especialidade (sugestões) ----
// Cada item é um código da TUSS e, quando faz diferença para o pedido, um detalhe padrão (lateralidade etc.).
export interface ItemKit { codigo: string; detalhe?: string }
export interface Kit { chave: string; nome: string; especialidades: string[]; itens: ItemKit[] }

export const KITS: Kit[] = [
  { chave: "CHECKUP_BASICO", nome: "Check-up básico (laboratório)", especialidades: ["CLINICA_GERAL", "ESTILO_DE_VIDA", "GERIATRIA"], itens: [
    { codigo: "40304361" }, { codigo: "40302040", detalhe: "jejum" }, { codigo: "40302733" }, { codigo: "40301605" }, { codigo: "40301583" }, { codigo: "40301591" }, { codigo: "40302547" }, { codigo: "40301630" }, { codigo: "40302580" }, { codigo: "40302504" }, { codigo: "40302512" }, { codigo: "40301150" }, { codigo: "40316521" }, { codigo: "40302830" }, { codigo: "40311210" },
  ] },
  { chave: "CARDIO_PRIMEIRA", nome: "Cardiologia: avaliação inicial", especialidades: ["CARDIOLOGIA"], itens: [
    { codigo: "40101010" }, { codigo: "40901106" }, { codigo: "40101045" }, { codigo: "40304361" }, { codigo: "40302040", detalhe: "jejum" }, { codigo: "40301605" }, { codigo: "40301583" }, { codigo: "40301591" }, { codigo: "40302547" }, { codigo: "40301630" },
  ] },
  { chave: "CARDIO_ARRITMIA_PRESSAO", nome: "Cardiologia: arritmia e pressão", especialidades: ["CARDIOLOGIA"], itens: [{ codigo: "40101010" }, { codigo: "20102020" }, { codigo: "20102038" }, { codigo: "40901106" }] },
  { chave: "CARDIO_CAROTIDAS", nome: "Cardiologia: carótidas e vasos", especialidades: ["CARDIOLOGIA", "NEUROLOGIA"], itens: [{ codigo: "40901661", detalhe: "bilateral" }, { codigo: "40901360" }] },
  { chave: "ENDO_DIABETES", nome: "Endocrinologia: diabetes", especialidades: ["ENDOCRINOLOGIA", "CLINICA_GERAL"], itens: [
    { codigo: "40302040", detalhe: "jejum" }, { codigo: "40302733" }, { codigo: "40316360", detalhe: "jejum" }, { codigo: "40301630" }, { codigo: "40302547" }, { codigo: "40301591" }, { codigo: "40316521" }, { codigo: "40311210" },
  ] },
  { chave: "OFTALMO_GLAUCOMA", nome: "Oftalmologia: avaliação de glaucoma", especialidades: ["OFTALMOLOGIA"], itens: [
    { codigo: "41501144", detalhe: "olhos, ambos" }, { codigo: "41301315", detalhe: "olhos, ambos" }, { codigo: "41501128", detalhe: "olhos, ambos" }, { codigo: "40103137", detalhe: "campo visual, olhos, ambos" }, { codigo: "41301323" },
  ] },
  { chave: "GINECO_ROTINA", nome: "Ginecologia: rotina preventiva", especialidades: ["GINECOLOGIA"], itens: [{ codigo: "40808041" }, { codigo: "40901114" }, { codigo: "40901300" }, { codigo: "40304361" }, { codigo: "40302040", detalhe: "jejum" }] },
  { chave: "ORTO_COLUNA_OSSO", nome: "Ortopedia: osso e coluna", especialidades: ["ORTOPEDIA", "GERIATRIA", "MEDICINA_DO_ESPORTE"], itens: [{ codigo: "40808130" }, { codigo: "40302830" }] },
  { chave: "PSIQ_BASICOS", nome: "Psiquiatria: exames de base", especialidades: ["PSIQUIATRIA"], itens: [{ codigo: "40304361" }, { codigo: "40302040", detalhe: "jejum" }, { codigo: "40301605" }, { codigo: "40301583" }, { codigo: "40301591" }, { codigo: "40302547" }, { codigo: "40301630" }, { codigo: "40302504" }, { codigo: "40302512" }, { codigo: "40316521" }, { codigo: "40316491" }] },
];
