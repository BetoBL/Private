import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

const pacienteCreateSchema = z.object({
  clinicaId: z.string().uuid(),
  profissionalId: z.string().uuid(),
  nome: z.string().min(1),
  dataNascimento: z.coerce.date(),
  fotoUrl: z.string().url().optional(),
  responsavelLegal: z.string().optional(),
  contato: z.string().optional(),
  escolaridade: z.string().optional(),
  convenioId: z.string().uuid().optional(),
  anamnese: z.record(z.string(), z.unknown()).optional(),
  consentimentoTDIC: z.boolean().optional(),
  consentimentoTDICData: z.coerce.date().optional(),
});

const pacienteUpdateSchema = pacienteCreateSchema.partial();

export const pacientesRouter = Router();

pacientesRouter.post(
  "/",
  validateBody(pacienteCreateSchema),
  asyncHandler(async (req, res) => {
    const paciente = await prisma.paciente.create({ data: req.body });
    res.status(201).json(paciente);
  })
);

pacientesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { clinicaId, profissionalId } = req.query;
    const paciente = await prisma.paciente.findMany({
      where: {
        ...(typeof clinicaId === "string" ? { clinicaId } : {}),
        ...(typeof profissionalId === "string" ? { profissionalId } : {}),
      },
      orderBy: { criadoEm: "desc" },
    });
    res.json(paciente);
  })
);

pacientesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const paciente = await prisma.paciente.findUnique({ where: { id: req.params.id } });
    if (!paciente) {
      res.status(404).json({ error: "Paciente não encontrado" });
      return;
    }
    res.json(paciente);
  })
);

pacientesRouter.patch(
  "/:id",
  validateBody(pacienteUpdateSchema),
  asyncHandler(async (req, res) => {
    const paciente = await prisma.paciente.update({ where: { id: req.params.id }, data: req.body });
    res.json(paciente);
  })
);

pacientesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.paciente.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
