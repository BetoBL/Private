// Contagem + palavra no plural correto ("1 sessão", "3 sessões"). Use sempre este helper em vez de
// montar o plural à mão com "s"/"es": palavras em -ão não seguem a regra do "s" ("sessãos" não existe).
export function pluralizar(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

export const sessoes = (n: number) => pluralizar(n, "sessão", "sessões");
export const testes = (n: number) => pluralizar(n, "teste", "testes");
export const campos = (n: number) => pluralizar(n, "campo", "campos");
export const instrumentos = (n: number) => pluralizar(n, "instrumento", "instrumentos");
export const laudos = (n: number) => pluralizar(n, "laudo", "laudos");

export const faltamCampos = (n: number) => (n === 1 ? "Falta 1 campo" : `Faltam ${n} campos`);
