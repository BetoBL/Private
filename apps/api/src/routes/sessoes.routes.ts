import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

const sessaoCreateSchema = z.object({
  pacienteId: z.string().uuid(),
  dataHora: z.coerce.date(),
  observacoes: z.string().optional(),
});

export const sessoesRouter = Router();

// profissionalId nunca vem do cliente — é sempre quem está autenticado.
sessoesRouter.post(
  "/",
  validateBody(sessaoCreateSchema),
  asyncHandler(async (req, res) => {
    const paciente = await prisma.paciente.findUnique({ where: { id: req.body.pacienteId } });
    if (!paciente || paciente.clinicaId !== req.profissional!.clinicaId) {
      res.status(400).json({ error: "pacienteId inválido para esta clínica" });
      return;
    }
    const sessao = await prisma.sessao.create({
      data: { ...req.body, profissionalId: req.profissional!.sub },
    });
    res.status(201).json(sessao);
  })
);

sessoesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { pacienteId, profissionalId } = req.query;
    const sessoes = await prisma.sessao.findMany({
      where: {
        paciente: { clinicaId: req.profissional!.clinicaId },
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
      include: { aplicacoesTeste: { include: { teste: true } }, paciente: true },
    });
    if (!sessao || sessao.paciente.clinicaId !== req.profissional!.clinicaId) {
      res.status(404).json({ error: "Sessão não encontrada" });
      return;
    }
    res.json(sessao);
  })
);
