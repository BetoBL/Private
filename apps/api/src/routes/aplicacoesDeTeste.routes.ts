import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

const aplicacaoCreateSchema = z.object({
  sessaoId: z.string().uuid(),
  testeId: z.string().uuid(),
  escoresBrutos: z.record(z.string(), z.number()),
});

export const aplicacoesDeTesteRouter = Router();

// Cria o lançamento de escores brutos de um teste nesta sessão.
// resultadoCalculado fica null aqui — o motor de cálculo (próxima etapa do MVP) é quem preenche.
aplicacoesDeTesteRouter.post(
  "/",
  validateBody(aplicacaoCreateSchema),
  asyncHandler(async (req, res) => {
    const aplicacao = await prisma.aplicacaoDeTeste.create({
      data: req.body,
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
