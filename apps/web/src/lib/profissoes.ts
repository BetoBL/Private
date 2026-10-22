// Tipos de profissional (espelha apps/api/src/lib/prontuario/modelos.ts): define o rótulo do registro e o que o menu mostra.
export const PROFISSOES: Array<{ chave: string; rotulo: string; registro: string }> = [
  { chave: "PSICOLOGO", rotulo: "Psicólogo(a)", registro: "CRP" },
  { chave: "NEUROPSICOLOGO", rotulo: "Neuropsicólogo(a)", registro: "CRP" },
  { chave: "MEDICO", rotulo: "Médico(a)", registro: "CRM" },
  { chave: "FISIOTERAPEUTA", rotulo: "Fisioterapeuta", registro: "CREFITO" },
  { chave: "TERAPEUTA_OCUPACIONAL", rotulo: "Terapeuta ocupacional", registro: "CREFITO" },
  { chave: "FONOAUDIOLOGO", rotulo: "Fonoaudiólogo(a)", registro: "CRFa" },
  { chave: "NUTRICIONISTA", rotulo: "Nutricionista", registro: "CRN" },
  { chave: "OUTRO", rotulo: "Outro profissional da saúde", registro: "Registro profissional" },
];
// Módulos por profissão (espelha o catálogo da API): o menu e as abas só mostram o que o profissional usa.
const MODULOS_BASE = ["pacientes", "agenda", "prontuario", "anamnese", "financeiro", "documentos"];
// Especialidades médicas (espelha apps/api/src/lib/prontuario/especialidades.ts)
export const ESPECIALIDADES: Array<{ chave: string; rotulo: string; modulos: string[] }> = [
  { chave: "CLINICA_GERAL", rotulo: "Clínica médica / medicina de família", modulos: [] },
  { chave: "PSIQUIATRIA", rotulo: "Psiquiatria", modulos: ["diario"] },
  { chave: "CARDIOLOGIA", rotulo: "Cardiologia", modulos: [] },
  { chave: "ENDOCRINOLOGIA", rotulo: "Endocrinologia e metabologia", modulos: [] },
  { chave: "GERIATRIA", rotulo: "Geriatria", modulos: [] },
  { chave: "PEDIATRIA", rotulo: "Pediatria", modulos: [] },
  { chave: "GINECOLOGIA", rotulo: "Ginecologia e obstetrícia", modulos: [] },
  { chave: "NEUROLOGIA", rotulo: "Neurologia", modulos: [] },
  { chave: "DERMATOLOGIA", rotulo: "Dermatologia", modulos: [] },
  { chave: "ORTOPEDIA", rotulo: "Ortopedia e traumatologia", modulos: [] },
  { chave: "MEDICINA_DO_ESPORTE", rotulo: "Medicina do esporte", modulos: [] },
  { chave: "ESTILO_DE_VIDA", rotulo: "Medicina do estilo de vida / nutrologia", modulos: [] },
  { chave: "OUTRA", rotulo: "Outra especialidade", modulos: [] },
];
const MODULOS: Record<string, string[]> = {
  PSICOLOGO: [...MODULOS_BASE, "diario", "escalas", "estudo_caso"],
  NEUROPSICOLOGO: [...MODULOS_BASE, "diario", "escalas", "estudo_caso", "testes", "laudos"],
  MEDICO: [...MODULOS_BASE, "escalas", "saude"],
};
// profissão sem lista própria (médico, fisioterapeuta...) usa só a base
export const temModulo = (categoria: string | undefined, modulo: string, especialidade?: string | null) => {
  const base = MODULOS[categoria ?? "NEUROPSICOLOGO"] ?? MODULOS_BASE;
  const extra = categoria === "MEDICO" ? ESPECIALIDADES.find((e) => e.chave === especialidade)?.modulos ?? [] : [];
  return [...base, ...extra].includes(modulo);
};
export const registroDe = (chave?: string) => (PROFISSOES.find((p) => p.chave === chave) ?? PROFISSOES[0]).registro;
