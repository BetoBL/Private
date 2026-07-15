import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

const perfilUpsertSchema = z.object({
  profissionalId: z.string().uuid(),
  abordagemTeorica: z.string().optional(),
  tomDeEscrita: z.string().optional(),
  regrasDePrudencia: z.string().optional(),
  vocabularioRecorrente: z.string().optional(),
});

export const perfisDeAtuacaoRouter = Router();

perfisDeAtuacaoRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { profissionalId } = req.query;
    if (typeof profissionalId !== "string") {
      res.status(400).json({ error: "profissionalId é obrigatório" });
      return;
    }
    const perfil = await prisma.perfilDeAtuacao.findUnique({ where: { profissionalId } });
    res.json(perfil);
  })
);

perfisDeAtuacaoRouter.put(
  "/",
  validateBody(perfilUpsertSchema),
  asyncHandler(async (req, res) => {
    const { profissionalId, ...dados } = req.body;
    const perfil = await prisma.perfilDeAtuacao.upsert({
      where: { profissionalId },
      create: { profissionalId, ...dados },
      update: dados,
    });
    res.json(perfil);
  })
);
