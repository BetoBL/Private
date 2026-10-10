// Texto e regras do consentimento de gravação da sessão online.
//
// ATENÇÃO: o texto abaixo é a versão inicial, redigida de acordo com a LGPD (dado de saúde = dado sensível, consentimento específico e
// destacado) e com as resoluções do CFP sobre atendimento online e tecnologias (11/2018 e 09/2024). Antes do uso com pacientes reais,
// passe por revisão jurídica e da responsável técnica. QUALQUER mudança no texto exige uma nova VERSAO: cada consentimento guarda a
// versão que o paciente viu.

export const VERSAO_TEXTO_CONSENTIMENTO = "v1-2026-10";

export const TEXTO_CONSENTIMENTO = {
  titulo: "Gravação desta sessão e uso de inteligência artificial",
  paragrafos: [
    "O(a) profissional responsável pediu para gravar o áudio desta sessão de atendimento online. A gravação é opcional: você pode recusar e o atendimento acontece normalmente, sem nenhum prejuízo.",
    "Para que serve: o áudio é transformado em texto (transcrição) que fica anexado ao seu prontuário, e um resumo dos pontos importantes é preparado para apoiar o seu acompanhamento. O(a) profissional lê e revisa o resumo antes de usá-lo; nenhuma decisão clínica é tomada pela inteligência artificial.",
    "Como é protegido: o áudio é cifrado antes de ser guardado, só o(a) profissional responsável tem acesso e cada acesso fica registrado. O áudio é mantido apenas pelo tempo necessário para a transcrição e depois apagado; a transcrição integra o prontuário e fica sob sigilo profissional.",
    "Inteligência artificial: a transcrição é feita por um serviço de inteligência artificial contratado, que pode tratar o áudio em servidores fora do Brasil, e o resumo é feito por outro serviço de inteligência artificial. Esse tratamento só acontece se você autorizar.",
    "Seus direitos: você pode revogar este consentimento a qualquer momento, pedir uma cópia ou a exclusão do material gravado, falando com o(a) profissional ou com a clínica. Revogar não prejudica o atendimento.",
  ],
  itens: {
    gravacao: "Autorizo a gravação do áudio desta sessão.",
    ia: "Autorizo o uso de inteligência artificial para transcrever e resumir a gravação.",
  },
} as const;

export interface RegistroConsentimento { tipo: string; concedido: boolean; criadoEm: Date; revogadoEm: Date | null; nomeDeclarante?: string; declaradoPor?: string }
export interface EstadoConsentimento { gravacao: boolean; ia: boolean; nome: string | null; declaradoPor: string | null; em: Date | null }

// Estado ATUAL: vale a resposta mais recente de cada tipo; uma resposta revogada ou negativa não autoriza nada.
// A transcrição por IA só vale se a gravação também estiver autorizada (sem áudio não há o que transcrever).
export function estadoDoConsentimento(registros: RegistroConsentimento[]): EstadoConsentimento {
  const ultima = (tipo: string) => registros.filter((r) => r.tipo === tipo).sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())[0];
  const g = ultima("GRAVACAO"), i = ultima("TRANSCRICAO_IA");
  const gravacao = !!g && g.concedido && !g.revogadoEm;
  const ia = gravacao && !!i && i.concedido && !i.revogadoEm;
  return { gravacao, ia, nome: g?.nomeDeclarante ?? null, declaradoPor: g?.declaradoPor ?? null, em: g?.criadoEm ?? null };
}
