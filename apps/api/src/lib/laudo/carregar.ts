import { prisma } from "../prisma";
import type { SistemaClassificacaoPercentil } from "../classificacaoPercentil";
import type { AplicacaoLaudo, LayoutResumo, ResultadoResumo } from "./montar";
import type { DadosLaudoCompleto } from "./gerarDocxCompleto";
import { modeloDoLaudo } from "./modeloDoLaudo";

// Lançamentos do paciente prontos para o laudo (todos, ou só os escolhidos). Os mais recentes valem quando há reavaliação.
export async function carregarAplicacoesLaudo(pacienteId: string, aplicacaoIds?: string[]): Promise<AplicacaoLaudo[]> {
  const aplicacoes = await prisma.aplicacaoDeTeste.findMany({
    where: { sessao: { pacienteId }, ...(aplicacaoIds?.length ? { id: { in: aplicacaoIds } } : {}) },
    include: { teste: true, sessao: true },
    orderBy: { sessao: { dataHora: "desc" } },
  });
  return aplicacoes
    .map((a) => ({
      sigla: a.teste.sigla,
      nome: a.teste.nome,
      descricao: a.teste.descricao,
      referenciaBibliografica: a.teste.referenciaBibliografica,
      resultado: (a.resultadoCalculado as unknown as ResultadoResumo) ?? null,
      layout: (a.teste.algoritmoCorrecao as unknown as { layout?: LayoutResumo } | null)?.layout,
      dataSessao: a.sessao.dataHora,
    }));
}

export function idadeEmAnos(nascimento: Date, ref: Date): number {
  let anos = ref.getUTCFullYear() - nascimento.getUTCFullYear();
  const m = ref.getUTCMonth() - nascimento.getUTCMonth();
  if (m < 0 || (m === 0 && ref.getUTCDate() < nascimento.getUTCDate())) anos--;
  return anos;
}

export function idadeEmTexto(nascimento: Date, ref: Date): string {
  const anos = idadeEmAnos(nascimento, ref);
  return anos === 1 ? "1 ano" : `${anos} anos`;
}

export async function dadosDoLaudoCompleto(laudoId: string, sistema: SistemaClassificacaoPercentil): Promise<DadosLaudoCompleto | null> {
  const laudo = await prisma.laudo.findUnique({ where: { id: laudoId }, include: { paciente: true } });
  if (!laudo) return null;
  const [clinica, profissional] = await Promise.all([
    prisma.clinica.findUnique({ where: { id: laudo.paciente.clinicaId } }),
    prisma.profissional.findUnique({ where: { id: laudo.profissionalId } }),
  ]);
  if (!clinica || !profissional) return null;
  const hoje = new Date();
  const modelo = await modeloDoLaudo(laudo, laudo.profissionalId, laudo.paciente.clinicaId);
  const aplicacoes = await carregarAplicacoesLaudo(laudo.pacienteId);
  // a idade que vale no laudo é a da avaliação (data da última sessão com teste), não a de hoje
  const dataAvaliacao = aplicacoes.length ? new Date(Math.max(...aplicacoes.map((a) => a.dataSessao.getTime()))) : hoje;
  return {
    clinica: { nome: clinica.nomeFantasia || clinica.razaoSocial, endereco: clinica.endereco, bairro: clinica.bairro, cidade: clinica.cidade, estado: clinica.estado, cep: clinica.cep, telefone: clinica.telefone, whatsapp: clinica.whatsapp, instagram: clinica.instagram, slogan: clinica.slogan, logoUrl: clinica.logoUrl, marcaDaguaUrl: clinica.marcaDaguaUrl, corPrimaria: clinica.corPrimaria, corSecundaria: clinica.corSecundaria },
    profissional: { nome: profissional.nome, crp: profissional.crp, email: profissional.email, formacao: profissional.formacao, especialidades: profissional.especialidades, assinaturaUrl: profissional.assinaturaUrl, tituloLaudo: profissional.tituloLaudo },
    paciente: { nome: laudo.paciente.nome, cpf: laudo.paciente.cpf, dataNascimento: laudo.paciente.dataNascimento, idadeTexto: idadeEmTexto(laudo.paciente.dataNascimento, dataAvaliacao) },
    laudo: { descricaoDemanda: laudo.descricaoDemanda, anamnese: laudo.anamnese, observacaoClinica: laudo.observacaoClinica, procedimento: laudo.procedimento, analise: laudo.analise, conclusao: laudo.conclusao, referencias: laudo.referencias, iaUtilizada: laudo.iaUtilizada, interpretacoes: (laudo.interpretacoes as Record<string, string> | null) ?? {}, hipoteseDiagnostica: laudo.hipoteseDiagnostica, secoesExtras: (laudo.secoesExtras as Record<string, string> | null) ?? {} },
    modelo: modelo.estrutura,
    aplicacoes,
    sistema,
    data: hoje,
  };
}
