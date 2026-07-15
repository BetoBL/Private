import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { calcularResultado, type ConversaoNormativa } from "../lib/motorCalculo";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

const aplicacaoCreateSchema = z.object({
  sessaoId: z.string().uuid(),
  testeId: z.string().uuid(),
  escoresBrutos: z.record(z.string(), z.number()),
});

export const aplicacoesDeTesteRouter = Router();

// Cria o lançamento de escores brutos de um teste nesta sessão e já calcula o resultado
// (motor de cálculo puro em lib/motorCalculo.ts) usando a 1ª TabelaNormativa do teste.
// Seleção de norma por critério do paciente (idade/escolaridade) é um refinamento futuro —
// hoje cada teste do seed tem só uma tabela normativa, então a escolha é trivial.
aplicacoesDeTesteRouter.post(
  "/",
  validateBody(aplicacaoCreateSchema),
  asyncHandler(async (req, res) => {
    const { sessaoId, testeId, escoresBrutos } = req.body;

    const teste = await prisma.teste.findUnique({
      where: { id: testeId },
      include: { tabelasNormativas: true },
    });
    if (!teste) {
      res.status(404).json({ error: "Teste não encontrado" });
      return;
    }

    const tabela = teste.tabelasNormativas[0];
    const resultadoCalculado = tabela
      ? calcularResultado(escoresBrutos, tabela.conversao as unknown as ConversaoNormativa)
      : null;

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
    const aplicacoes = await prisma.aplicacaoDeTeste.findMany({
      where: {
        ...(typeof sessaoId === "string" ? { sessaoId } : {}),
        ...(typeof pacienteId === "string" ? { sessao: { pacienteId } } : {}),
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
      include: { teste: true, sessao: true },
    });
    if (!aplicacao) {
      res.status(404).json({ error: "Aplicação de teste não encontrada" });
      return;
    }
    res.json(aplicacao);
  })
);
