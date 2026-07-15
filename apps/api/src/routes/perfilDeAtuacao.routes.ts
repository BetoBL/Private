import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

const perfilUpsertSchema = z.object({
  abordagemTeorica: z.string().optional(),
  tomDeEscrita: z.string().optional(),
  regrasDePrudencia: z.string().optional(),
  vocabularioRecorrente: z.string().optional(),
});

export const perfisDeAtuacaoRouter = Router();

// Sempre o perfil do próprio profissional autenticado — não existe "ver perfil de outro colega" aqui.
perfisDeAtuacaoRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const perfil = await prisma.perfilDeAtuacao.findUnique({
      where: { profissionalId: req.profissional!.sub },
    });
    res.json(perfil);
  })
);

perfisDeAtuacaoRouter.put(
  "/",
  validateBody(perfilUpsertSchema),
  asyncHandler(async (req, res) => {
    const profissionalId = req.profissional!.sub;
    const perfil = await prisma.perfilDeAtuacao.upsert({
      where: { profissionalId },
      create: { profissionalId, ...req.body },
      update: req.body,
    });
    res.json(perfil);
  })
);
