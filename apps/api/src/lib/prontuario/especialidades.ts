// Especialidades médicas: cada uma pode acrescentar modelos de evolução e módulos ao pacote médico base.
// O pacote base (consulta, retorno, SOAP, anamnese, escalas, saúde do paciente) vale para todo médico; aqui entra só o que é próprio da especialidade.
// `validada` indica se o conteúdo específico já foi conferido por um médico da área. Enquanto for falso, o profissional usa o pacote base e pode editar tudo.

export type Especialidade = { chave: string; rotulo: string; modelos: string[]; modulos: string[]; validada: boolean };

export const ESPECIALIDADES: Especialidade[] = [
  { chave: "CLINICA_GERAL", rotulo: "Clínica médica / medicina de família", modelos: [], modulos: [], validada: false },
  { chave: "PSIQUIATRIA", rotulo: "Psiquiatria", modelos: ["PSIQUIATRICA"], modulos: ["diario"], validada: false },
  { chave: "CARDIOLOGIA", rotulo: "Cardiologia", modelos: [], modulos: [], validada: false },
  { chave: "ENDOCRINOLOGIA", rotulo: "Endocrinologia e metabologia", modelos: [], modulos: [], validada: false },
  { chave: "GERIATRIA", rotulo: "Geriatria", modelos: [], modulos: [], validada: false },
  { chave: "PEDIATRIA", rotulo: "Pediatria", modelos: [], modulos: [], validada: false },
  { chave: "GINECOLOGIA", rotulo: "Ginecologia e obstetrícia", modelos: [], modulos: [], validada: false },
  { chave: "NEUROLOGIA", rotulo: "Neurologia", modelos: [], modulos: [], validada: false },
  { chave: "OFTALMOLOGIA", rotulo: "Oftalmologia", modelos: [], modulos: [], validada: false },
  { chave: "UROLOGIA", rotulo: "Urologia", modelos: [], modulos: [], validada: false },
  { chave: "GASTROENTEROLOGIA", rotulo: "Gastroenterologia", modelos: [], modulos: [], validada: false },
  { chave: "DERMATOLOGIA", rotulo: "Dermatologia", modelos: [], modulos: [], validada: false },
  { chave: "ORTOPEDIA", rotulo: "Ortopedia e traumatologia", modelos: [], modulos: [], validada: false },
  { chave: "MEDICINA_DO_ESPORTE", rotulo: "Medicina do esporte", modelos: [], modulos: [], validada: false },
  { chave: "ESTILO_DE_VIDA", rotulo: "Medicina do estilo de vida / nutrologia", modelos: [], modulos: [], validada: false },
  { chave: "OUTRA", rotulo: "Outra especialidade", modelos: [], modulos: [], validada: false },
];

export const especialidadeDe = (chave: string | null | undefined): Especialidade | undefined => ESPECIALIDADES.find((e) => e.chave === chave);
