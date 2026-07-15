import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

const sessaoCreateSchema = z.object({
  pacienteId: z.string().uuid(),
  profissionalId: z.string().uuid(),
  dataHora: z.coerce.date(),
  observacoes: z.string().optional(),
});

export const sessoesRouter = Router();

sessoesRouter.post(
  "/",
  validateBody(sessaoCreateSchema),
  asyncHandler(async (req, res) => {
    const sessao = await prisma.sessao.create({ data: req.body });
    res.status(201).json(sessao);
  })
);

sessoesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { pacienteId, profissionalId } = req.query;
    const sessoes = await prisma.sessao.findMany({
      where: {
        ...(typeof pacienteId === "string" ? { pacienteId } : {}),
        ...(typeof profissionalId === "string" ? { profissionalId } : {}),
      },
      orderBy: { dataHora: "desc" },
    });
    res.json(sessoes);
  })
);

sessoesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const sessao = await prisma.sessao.findUnique({
      where: { id: req.params.id },
      include: { aplicacoesTeste: { include: { teste: true } } },
    });
    if (!sessao) {
      res.status(404).json({ error: "Sessão não encontrada" });
      return;
    }
    res.json(sessao);
  })
);
