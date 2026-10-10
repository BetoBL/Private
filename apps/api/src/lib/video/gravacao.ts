import { randomUUID } from "node:crypto";
import { prisma } from "../prisma";
import { armazenamentoDeGravacoes } from "./armazenamento";
import { chaveMestraConfigurada, cifrarParte, decifrarParte, desenvolverChave, envolverChave, novaChaveDeGravacao } from "./cifraGravacao";
import { estadoDoConsentimento, VERSAO_TEXTO_CONSENTIMENTO } from "./consentimento";

// Regras da gravação da sessão. Em resumo:
//  - só começa com plano COMPLETO, armazenamento e chave configurados e consentimento de gravação VÁLIDO (concedido e não revogado);
//  - a cada parte recebida o consentimento é conferido de novo: se o paciente revogou, a gravação é interrompida e o áudio já guardado é apagado;
//  - o áudio é cifrado parte a parte e só o profissional responsável (ou o administrador da clínica) consegue ouvir; cada acesso fica registrado;
//  - o áudio tem prazo (GRAVACAO_RETENCAO_DIAS, padrão 14): depois dele é apagado; o que foi transcrito permanece no prontuário.

export class ErroGravacao extends Error { constructor(public codigo: string, mensagem: string, public status = 409) { super(mensagem); } }

export const RETENCAO_DIAS = Math.max(1, Number(process.env.GRAVACAO_RETENCAO_DIAS) || 14);
export const LIMITE_PARTE_BYTES = 12 * 1024 * 1024;

export function gravacaoPronta(): { pronta: boolean; motivo: string | null } {
  if (!chaveMestraConfigurada()) return { pronta: false, motivo: "O servidor ainda não tem a chave de proteção das gravações." };
  if (!armazenamentoDeGravacoes()) return { pronta: false, motivo: "O servidor ainda não tem onde guardar as gravações." };
  return { pronta: true, motivo: null };
}

type Usuario = { sub: string; clinicaId: string; papel: string };
const chaveDaParte = (prefixo: string, n: number) => `${prefixo}/${String(n).padStart(6, "0")}.bin`;

async function gravacaoDoUsuario(id: string, u: Usuario) {
  const g = await prisma.gravacao.findUnique({ where: { id } });
  if (!g || g.clinicaId !== u.clinicaId) return null;
  if (u.papel !== "ADMIN" && g.profissionalId !== u.sub) return null;
  return g;
}
const auditar = (gravacaoId: string, acao: string, profissionalId: string | null, ip?: string | null) => prisma.gravacaoAcesso.create({ data: { gravacaoId, acao, profissionalId, ip: ip ?? null } });

export async function iniciarGravacao(salaId: string, u: Usuario, ip?: string | null) {
  const pronta = gravacaoPronta();
  if (!pronta.pronta) throw new ErroGravacao("INDISPONIVEL", pronta.motivo!, 503);
  const sala = await prisma.salaVirtual.findUnique({ where: { id: salaId }, include: { sessao: { include: { paciente: { select: { id: true, clinicaId: true } } } } } });
  if (!sala || sala.sessao.paciente.clinicaId !== u.clinicaId) throw new ErroGravacao("SALA", "Sala não encontrada.", 404);
  if (u.papel !== "ADMIN" && sala.sessao.profissionalId !== u.sub) throw new ErroGravacao("SALA", "Só o profissional responsável grava a sessão.", 403);
  if (sala.statusSala === "encerrada") throw new ErroGravacao("ENCERRADA", "A sala já foi encerrada.");
  const clinica = await prisma.clinica.findUnique({ where: { id: u.clinicaId }, select: { planoVideo: true } });
  if (clinica?.planoVideo !== "COMPLETO") throw new ErroGravacao("PLANO", "O plano desta clínica não inclui gravação.", 403);
  const consentimento = estadoDoConsentimento(await prisma.consentimentoGravacao.findMany({ where: { salaId } }));
  if (!consentimento.gravacao) throw new ErroGravacao("SEM_CONSENTIMENTO", "O paciente ainda não autorizou a gravação. Peça que ele responda ao consentimento na página do atendimento.");
  const ativa = await prisma.gravacao.findFirst({ where: { salaId, status: "GRAVANDO" } });
  if (ativa) throw new ErroGravacao("JA_GRAVANDO", "Esta sessão já está sendo gravada.");

  const id = randomUUID();
  const armazenamento = armazenamentoDeGravacoes()!;
  const g = await prisma.gravacao.create({
    data: { id, salaId, sessaoId: sala.sessaoId, pacienteId: sala.sessao.paciente.id, clinicaId: u.clinicaId, profissionalId: sala.sessao.profissionalId, armazenamento: armazenamento.nome, prefixo: `gravacoes/${u.clinicaId}/${id}`, chaveCifrada: envolverChave(novaChaveDeGravacao()), versaoConsentimento: VERSAO_TEXTO_CONSENTIMENTO, apagarAudioEm: new Date(Date.now() + RETENCAO_DIAS * 86_400_000) },
  });
  await auditar(g.id, "INICIOU", u.sub, ip);
  return g;
}

// recebe UMA parte do áudio (em claro, pela conexão segura), cifra e guarda
export async function receberParte(id: string, n: number, dados: Buffer, u: Usuario) {
  if (!Number.isInteger(n) || n < 0 || n > 20_000) throw new ErroGravacao("PARTE", "Número de parte inválido.", 400);
  if (dados.length === 0 || dados.length > LIMITE_PARTE_BYTES) throw new ErroGravacao("PARTE", "Tamanho de parte inválido.", 400);
  const g = await gravacaoDoUsuario(id, u);
  if (!g) throw new ErroGravacao("NAO_ENCONTRADA", "Gravação não encontrada.", 404);
  if (g.status !== "GRAVANDO") throw new ErroGravacao(g.status === "REVOGADA" ? "REVOGADA" : "ENCERRADA", g.status === "REVOGADA" ? "O paciente retirou a autorização: a gravação foi interrompida e apagada." : "Esta gravação já foi encerrada.");
  // consentimento conferido a CADA parte: revogação interrompe na hora
  const consent = estadoDoConsentimento(await prisma.consentimentoGravacao.findMany({ where: { salaId: g.salaId } }));
  if (!consent.gravacao) { await revogarGravacao(g.id, null); throw new ErroGravacao("REVOGADA", "O paciente retirou a autorização: a gravação foi interrompida e apagada."); }
  const armazenamento = armazenamentoDeGravacoes();
  if (!armazenamento) throw new ErroGravacao("INDISPONIVEL", "Armazenamento indisponível.", 503);
  const cifrado = cifrarParte(desenvolverChave(g.chaveCifrada), g.id, n, dados);
  await armazenamento.guardar(chaveDaParte(g.prefixo, n), cifrado);
  await prisma.gravacao.update({ where: { id: g.id }, data: { partes: Math.max(g.partes, n + 1), bytes: { increment: dados.length }, ultimaParteEm: new Date() } });
}

export async function encerrarGravacao(id: string, duracaoSeg: number | undefined, u: Usuario, ip?: string | null) {
  const g = await gravacaoDoUsuario(id, u);
  if (!g) throw new ErroGravacao("NAO_ENCONTRADA", "Gravação não encontrada.", 404);
  if (g.status !== "GRAVANDO") return g;
  const r = await prisma.gravacao.update({ where: { id }, data: { status: g.partes > 0 ? "CONCLUIDA" : "INCOMPLETA", encerradaEm: new Date(), duracaoSeg: duracaoSeg ?? null } });
  await auditar(id, "ENCERROU", u.sub, ip);
  return r;
}

// áudio inteiro, decifrado, para o profissional ouvir (registra o acesso)
export async function audioDecifrado(id: string, u: Usuario, ip?: string | null): Promise<{ audio: Buffer; formato: string }> {
  const g = await gravacaoDoUsuario(id, u);
  if (!g) throw new ErroGravacao("NAO_ENCONTRADA", "Gravação não encontrada.", 404);
  if (g.audioApagadoEm || g.partes === 0) throw new ErroGravacao("SEM_AUDIO", "O áudio desta gravação não existe mais (foi apagado).", 410);
  const armazenamento = armazenamentoDeGravacoes();
  if (!armazenamento) throw new ErroGravacao("INDISPONIVEL", "Armazenamento indisponível.", 503);
  const chave = desenvolverChave(g.chaveCifrada);
  const partes: Buffer[] = [];
  for (let n = 0; n < g.partes; n++) partes.push(decifrarParte(chave, g.id, n, await armazenamento.ler(chaveDaParte(g.prefixo, n))));
  await auditar(id, "OUVIU", u.sub, ip);
  return { audio: Buffer.concat(partes), formato: g.formato };
}

async function apagarObjetos(g: { id: string; prefixo: string; partes: number }) {
  const armazenamento = armazenamentoDeGravacoes();
  if (!armazenamento) return;
  for (let n = 0; n < g.partes; n++) await armazenamento.apagar(chaveDaParte(g.prefixo, n)).catch(() => undefined);
}

export async function apagarGravacao(id: string, u: Usuario, ip?: string | null) {
  const g = await gravacaoDoUsuario(id, u);
  if (!g) throw new ErroGravacao("NAO_ENCONTRADA", "Gravação não encontrada.", 404);
  await apagarObjetos(g);
  await prisma.gravacao.update({ where: { id }, data: { status: "APAGADA", audioApagadoEm: new Date(), encerradaEm: g.encerradaEm ?? new Date() } });
  await auditar(id, "APAGOU", u.sub, ip);
}

// paciente retirou a autorização: para e apaga o áudio guardado (o registro e a trilha de auditoria ficam)
export async function revogarGravacao(id: string, ip?: string | null) {
  const g = await prisma.gravacao.findUnique({ where: { id } });
  if (!g || g.status === "REVOGADA" || g.status === "APAGADA") return;
  await apagarObjetos(g);
  await prisma.gravacao.update({ where: { id }, data: { status: "REVOGADA", audioApagadoEm: new Date(), encerradaEm: new Date() } });
  await auditar(id, "REVOGADA_PELO_PACIENTE", null, ip);
}
export async function revogarGravacoesDaSala(salaId: string, ip?: string | null) {
  const ativas = await prisma.gravacao.findMany({ where: { salaId, status: { in: ["GRAVANDO", "CONCLUIDA", "INCOMPLETA"] }, audioApagadoEm: null }, select: { id: true } });
  for (const g of ativas) await revogarGravacao(g.id, ip);
}

// rotina periódica: fecha gravações abandonadas (aba fechada) e apaga o áudio vencido
export async function manutencaoDeGravacoes(agora = new Date()): Promise<{ fechadas: number; apagadas: number }> {
  const abandonadas = await prisma.gravacao.updateMany({ where: { status: "GRAVANDO", OR: [{ ultimaParteEm: { lt: new Date(agora.getTime() - 10 * 60_000) } }, { ultimaParteEm: null, iniciadaEm: { lt: new Date(agora.getTime() - 10 * 60_000) } }] }, data: { status: "INCOMPLETA", encerradaEm: agora } });
  const vencidas = await prisma.gravacao.findMany({ where: { audioApagadoEm: null, apagarAudioEm: { lt: agora }, status: { in: ["CONCLUIDA", "INCOMPLETA"] } } });
  for (const g of vencidas) {
    await apagarObjetos(g);
    await prisma.gravacao.update({ where: { id: g.id }, data: { status: "APAGADA", audioApagadoEm: agora } });
    await auditar(g.id, "APAGADA_POR_PRAZO", null);
  }
  return { fechadas: abandonadas.count, apagadas: vencidas.length };
}
