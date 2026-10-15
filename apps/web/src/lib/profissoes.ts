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
const MODULOS: Record<string, string[]> = {
  PSICOLOGO: [...MODULOS_BASE, "diario", "escalas", "estudo_caso"],
  NEUROPSICOLOGO: [...MODULOS_BASE, "diario", "escalas", "estudo_caso", "testes", "laudos"],
};
// profissão sem lista própria (médico, fisioterapeuta...) usa só a base
export const temModulo = (categoria: string | undefined, modulo: string) => (MODULOS[categoria ?? "NEUROPSICOLOGO"] ?? MODULOS_BASE).includes(modulo);
export const registroDe = (chave?: string) => (PROFISSOES.find((p) => p.chave === chave) ?? PROFISSOES[0]).registro;
