import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import {
  calcularIdadeEmAnos,
  calcularIdadeEmDias,
  calcularIdadeEmMeses,
  calcularResultado,
  formatarIdadeCompleta,
  escolherNormativaCustomizada,
  escolherTabelaNormativa,
  type ConversaoNormativa,
} from "../lib/motorCalculo";
import { prisma } from "../lib/prisma";
import type { OpcoesWisc4 } from "../lib/wisc4";
import { asyncHandler, validateBody } from "../lib/validate";

// Campos de respondente — ver enum TipoRespondente no schema. Opcionais na entrada: quem não
// manda nada cai em PACIENTE, que é o comportamento de todo lançamento anterior a este campo
// existir e o certo para teste de aplicação direta.
const respondenteSchema = {
  respondenteTipo: z
    .enum(["PACIENTE", "MAE", "PAI", "CONJUGE", "FILHO", "IRMAO", "CUIDADOR", "PROFESSOR", "PROFISSIONAL", "OUTRO"])
    .optional(),
  // string vazia vinda de <input> vira null, para não gravar "" como se fosse nome preenchido
  respondenteNome: z.string().trim().max(200).optional().transform((v) => v || null),
  respondenteRelacao: z.string().trim().max(200).optional().transform((v) => v || null),
};

const aplicacaoCreateSchema = z.object({
  sessaoId: z.string().uuid(),
  testeId: z.string().uuid(),
  escoresBrutos: z.record(z.string(), z.number()),
  ...respondenteSchema,
});

const aplicacaoUpdateSchema = z.object({
  escoresBrutos: z.record(z.string(), z.number()),
  ...respondenteSchema,
});

export const aplicacoesDeTesteRouter = Router();

function ehAdmin(req: { profissional?: { papel: string } }): boolean {
  return req.profissional?.papel === "ADMIN";
}

// As conversões de alguns testes são grandes (o motor de planilha chega a centenas de KB) e o cálculo ao vivo roda a cada tecla:
// busca só os critérios de seleção da tabela e guarda a conversão em memória (as tabelas são recriadas com id novo a cada atualização).
const cacheConversao = new Map<string, unknown>();
async function conversaoDaTabela(id: string): Promise<unknown> {
  if (!cacheConversao.has(id)) {
    const t = await prisma.tabelaNormativa.findUnique({ where: { id }, select: { conversao: true } });
    cacheConversao.set(id, t?.conversao ?? null);
  }
  return cacheConversao.get(id);
}

async function recalcular(
  testeId: string,
  clinicaId: string,
  escoresBrutos: Record<string, number>,
  criterios: { idadeAnos: number; idadeMeses?: number; idadeDias?: number; dataNascimento?: Date; dataReferencia?: Date; sexo?: "MASCULINO" | "FEMININO" | null; opcoesWisc4?: OpcoesWisc4; paciente?: { escolaridade?: string | null; sexo?: string | null; nome?: string | null } }
) {
  const teste = await prisma.teste.findUnique({ where: { id: testeId }, include: { tabelasNormativas: { select: { id: true, criterio: true, faixaMin: true, faixaMax: true, faixaLabel: true, sexo: true } } } });
  if (!teste) return null;
  // Normativa customizada ativa da clínica que cubra o paciente tem precedência sobre a norma
  // padrão do teste; se nenhuma cobrir, usa a padrão (ver escolherNormativaCustomizada).
  const customizadas = await prisma.normativaCustomizada.findMany({ where: { clinicaId, testeId, ativo: true } });
  const tabela =
    escolherNormativaCustomizada(criterios, customizadas) ?? escolherTabelaNormativa(criterios, teste.tabelasNormativas);
  if (!tabela) return null;
  const conversao = "conversao" in tabela ? tabela.conversao : await conversaoDaTabela(tabela.id);
  return conversao
    ? calcularResultado(escoresBrutos, conversao as unknown as ConversaoNormativa, { idadeDias: criterios.idadeDias, idadeAnos: criterios.idadeAnos, dataNascimento: criterios.dataNascimento, dataReferencia: criterios.dataReferencia, opcoesWisc4: criterios.opcoesWisc4, paciente: criterios.paciente })
    : null;
}

// Cria o lançamento de escores brutos de um teste nesta sessão e já calcula o resultado
// (motor de cálculo puro em lib/motorCalculo.ts), escolhendo a TabelaNormativa cuja faixa
// etária (e sexo, quando o teste estratifica por sexo) cobre o paciente na data da sessão
// (ver escolherTabelaNormativa). Testes com uma única tabela continuam funcionando normalmente.
aplicacoesDeTesteRouter.post(
  "/",
  validateBody(aplicacaoCreateSchema),
  asyncHandler(async (req, res) => {
    const { sessaoId, testeId, escoresBrutos, respondenteTipo, respondenteNome, respondenteRelacao } = req.body;

    const sessao = await prisma.sessao.findUnique({ where: { id: sessaoId }, include: { paciente: true } });
    if (!sessao || sessao.paciente.clinicaId !== req.profissional!.clinicaId) {
      res.status(400).json({ error: "sessaoId inválido para esta clínica" });
      return;
    }
    if (!ehAdmin(req) && sessao.paciente.profissionalId !== req.profissional!.sub) {
      res.status(403).json({ error: "Você só pode lançar testes para seus próprios pacientes" });
      return;
    }

    const teste = await prisma.teste.findUnique({ where: { id: testeId } });
    if (!teste) {
      res.status(404).json({ error: "Teste não encontrado" });
      return;
    }

    const idadeAnos = calcularIdadeEmAnos(sessao.paciente.dataNascimento, sessao.dataHora);
    const idadeMeses = calcularIdadeEmMeses(sessao.paciente.dataNascimento, sessao.dataHora);
    const resultadoCalculado = await recalcular(testeId, req.profissional!.clinicaId, escoresBrutos, {
      idadeAnos,
      idadeMeses,
      idadeDias: calcularIdadeEmDias(sessao.paciente.dataNascimento, sessao.dataHora),
      dataNascimento: sessao.paciente.dataNascimento,
      dataReferencia: sessao.dataHora,
      sexo: sessao.paciente.sexo,
      paciente: { escolaridade: sessao.paciente.escolaridade, sexo: sessao.paciente.sexo, nome: sessao.paciente.nome },
    });

    const aplicacao = await prisma.aplicacaoDeTeste.create({
      data: {
        sessaoId,
        testeId,
        escoresBrutos,
        respondenteTipo,
        respondenteNome,
        respondenteRelacao,
        resultadoCalculado: resultadoCalculado ? (resultadoCalculado as unknown as Prisma.InputJsonValue) : undefined,
        calculadoEm: resultadoCalculado ? new Date() : null,
      },
      include: { teste: true },
    });
    res.status(201).json(aplicacao);
  })
);

// Calcula SEM gravar: a tela mostra o resultado enquanto o profissional digita os brutos. Usa
// exatamente o mesmo caminho do salvar (normativa customizada, faixa etária, idade em dias), então
// o que aparece na tela é o que será gravado.
aplicacoesDeTesteRouter.post(
  "/calcular",
  validateBody(z.object({ sessaoId: z.string().uuid(), testeId: z.string().uuid(), escoresBrutos: z.record(z.string(), z.number()), confianca: z.enum(["90%", "95%"]).optional(), base: z.enum(["Amostra Geral", "Nível de Habilidade"]).optional() })),
  asyncHandler(async (req, res) => {
    const { sessaoId, testeId, escoresBrutos, confianca, base } = req.body;
    const sessao = await prisma.sessao.findUnique({ where: { id: sessaoId }, include: { paciente: true } });
    if (!sessao || sessao.paciente.clinicaId !== req.profissional!.clinicaId) {
      res.status(400).json({ error: "sessaoId inválido para esta clínica" });
      return;
    }
    if (!ehAdmin(req) && sessao.paciente.profissionalId !== req.profissional!.sub) {
      res.status(403).json({ error: "Você só pode calcular testes de seus próprios pacientes" });
      return;
    }
    const resultadoCalculado = await recalcular(testeId, req.profissional!.clinicaId, escoresBrutos, {
      idadeAnos: calcularIdadeEmAnos(sessao.paciente.dataNascimento, sessao.dataHora),
      idadeMeses: calcularIdadeEmMeses(sessao.paciente.dataNascimento, sessao.dataHora),
      idadeDias: calcularIdadeEmDias(sessao.paciente.dataNascimento, sessao.dataHora),
      dataNascimento: sessao.paciente.dataNascimento,
      dataReferencia: sessao.dataHora,
      sexo: sessao.paciente.sexo,
      paciente: { escolaridade: sessao.paciente.escolaridade, sexo: sessao.paciente.sexo, nome: sessao.paciente.nome },
      opcoesWisc4: { confianca, base },
    });
    res.json({
      resultadoCalculado,
      idadeDias: calcularIdadeEmDias(sessao.paciente.dataNascimento, sessao.dataHora),
      idadeAnos: calcularIdadeEmAnos(sessao.paciente.dataNascimento, sessao.dataHora),
      idadeTexto: formatarIdadeCompleta(sessao.paciente.dataNascimento, sessao.dataHora),
      paciente: {
        nome: sessao.paciente.nome,
        escolaridade: sessao.paciente.escolaridade,
        sexo: sessao.paciente.sexo,
      paciente: { escolaridade: sessao.paciente.escolaridade, sexo: sessao.paciente.sexo, nome: sessao.paciente.nome },
        dataNascimento: sessao.paciente.dataNascimento,
      },
      dataAplicacao: sessao.dataHora,
    });
  })
);

aplicacoesDeTesteRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { sessaoId, pacienteId } = req.query;
    const admin = ehAdmin(req);
    const aplicacoes = await prisma.aplicacaoDeTeste.findMany({
      where: {
        sessao: {
          paciente: {
            clinicaId: req.profissional!.clinicaId,
            ...(admin ? {} : { profissionalId: req.profissional!.sub }),
          },
          ...(typeof pacienteId === "string" ? { pacienteId } : {}),
        },
        ...(typeof sessaoId === "string" ? { sessaoId } : {}),
      },
      include: { teste: true },
      orderBy: { criadoEm: "desc" },
    });
    res.json(aplicacoes);
  })
);

aplicacoesDeTesteRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const aplicacao = await prisma.aplicacaoDeTeste.findUnique({
      where: { id: req.params.id },
      include: { teste: true, sessao: { include: { paciente: true } } },
    });
    if (!aplicacao || aplicacao.sessao.paciente.clinicaId !== req.profissional!.clinicaId) {
      res.status(404).json({ error: "Aplicação de teste não encontrada" });
      return;
    }
    if (!ehAdmin(req) && aplicacao.sessao.paciente.profissionalId !== req.profissional!.sub) {
      res.status(404).json({ error: "Aplicação de teste não encontrada" });
      return;
    }
    res.json(aplicacao);
  })
);

// Edita os escores brutos de um lançamento já feito e recalcula o resultado.
aplicacoesDeTesteRouter.patch(
  "/:id",
  validateBody(aplicacaoUpdateSchema),
  asyncHandler(async (req, res) => {
    const existente = await prisma.aplicacaoDeTeste.findUnique({
      where: { id: req.params.id },
      include: { sessao: { include: { paciente: true } } },
    });
    if (!existente || existente.sessao.paciente.clinicaId !== req.profissional!.clinicaId) {
      res.status(404).json({ error: "Aplicação de teste não encontrada" });
      return;
    }
    if (!ehAdmin(req) && existente.sessao.paciente.profissionalId !== req.profissional!.sub) {
      res.status(404).json({ error: "Aplicação de teste não encontrada" });
      return;
    }

    const idadeAnos = calcularIdadeEmAnos(existente.sessao.paciente.dataNascimento, existente.sessao.dataHora);
    const idadeMeses = calcularIdadeEmMeses(existente.sessao.paciente.dataNascimento, existente.sessao.dataHora);
    const resultadoCalculado = await recalcular(existente.testeId, req.profissional!.clinicaId, req.body.escoresBrutos, {
      idadeAnos,
      idadeMeses,
      idadeDias: calcularIdadeEmDias(existente.sessao.paciente.dataNascimento, existente.sessao.dataHora),
      dataNascimento: existente.sessao.paciente.dataNascimento,
      dataReferencia: existente.sessao.dataHora,
      sexo: existente.sessao.paciente.sexo,
    });

    const aplicacao = await prisma.aplicacaoDeTeste.update({
      where: { id: req.params.id },
      data: {
        escoresBrutos: req.body.escoresBrutos,
        respondenteTipo: req.body.respondenteTipo,
        respondenteNome: req.body.respondenteNome,
        respondenteRelacao: req.body.respondenteRelacao,
        resultadoCalculado: resultadoCalculado ? (resultadoCalculado as unknown as Prisma.InputJsonValue) : undefined,
        calculadoEm: resultadoCalculado ? new Date() : null,
      },
      include: { teste: true },
    });
    res.json(aplicacao);
  })
);
