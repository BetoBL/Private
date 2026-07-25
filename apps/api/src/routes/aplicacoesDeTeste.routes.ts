import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import {
  calcularIdadeEmAnos,
  calcularResultado,
  escolherTabelaPorIdade,
  type ConversaoNormativa,
} from "../lib/motorCalculo";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

const aplicacaoCreateSchema = z.object({
  sessaoId: z.string().uuid(),
  testeId: z.string().uuid(),
  escoresBrutos: z.record(z.string(), z.number()),
});

const aplicacaoUpdateSchema = z.object({
  escoresBrutos: z.record(z.string(), z.number()),
});

export const aplicacoesDeTesteRouter = Router();

function ehAdmin(req: { profissional?: { papel: string } }): boolean {
  return req.profissional?.papel === "ADMIN";
}

async function recalcular(testeId: string, escoresBrutos: Record<string, number>, idadeAnos: number) {
  const teste = await prisma.teste.findUnique({ where: { id: testeId }, include: { tabelasNormativas: true } });
  if (!teste) return null;
  const tabela = escolherTabelaPorIdade(idadeAnos, teste.tabelasNormativas);
  return tabela ? calcularResultado(escoresBrutos, tabela.conversao as unknown as ConversaoNormativa) : null;
}

// Cria o lançamento de escores brutos de um teste nesta sessão e já calcula o resultado
// (motor de cálculo puro em lib/motorCalculo.ts), escolhendo a TabelaNormativa cuja faixa
// etária cobre a idade do paciente na data da sessão (ver escolherTabelaPorIdade). Testes
// com uma única tabela (sem faixaMin/faixaMax) continuam funcionando normalmente.
aplicacoesDeTesteRouter.post(
  "/",
  validateBody(aplicacaoCreateSchema),
  asyncHandler(async (req, res) => {
    const { sessaoId, testeId, escoresBrutos } = req.body;

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
    const resultadoCalculado = await recalcular(testeId, escoresBrutos, idadeAnos);

    const aplicacao = await prisma.aplicacaoDeTeste.create({
      data: {
        sessaoId,
        testeId,
        escoresBrutos,
        resultadoCalculado: resultadoCalculado ? (resultadoCalculado as unknown as Prisma.InputJsonValue) : undefined,
        calculadoEm: resultadoCalculado ? new Date() : null,
      },
      include: { teste: true },
    });
    res.status(201).json(aplicacao);
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
    const resultadoCalculado = await recalcular(existente.testeId, req.body.escoresBrutos, idadeAnos);

    const aplicacao = await prisma.aplicacaoDeTeste.update({
      where: { id: req.params.id },
      data: {
        escoresBrutos: req.body.escoresBrutos,
        resultadoCalculado: resultadoCalculado ? (resultadoCalculado as unknown as Prisma.InputJsonValue) : undefined,
        calculadoEm: resultadoCalculado ? new Date() : null,
      },
      include: { teste: true },
    });
    res.json(aplicacao);
  })
);
