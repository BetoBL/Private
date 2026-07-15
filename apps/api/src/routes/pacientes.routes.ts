import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

const pacienteCreateSchema = z.object({
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

// clinicaId nunca vem do cliente — sempre a clínica do profissional autenticado
// (evita criar/mover paciente pra fora da própria clínica).
pacientesRouter.post(
  "/",
  validateBody(pacienteCreateSchema),
  asyncHandler(async (req, res) => {
    const profissionalDestino = await prisma.profissional.findUnique({ where: { id: req.body.profissionalId } });
    if (!profissionalDestino || profissionalDestino.clinicaId !== req.profissional!.clinicaId) {
      res.status(400).json({ error: "profissionalId inválido para esta clínica" });
      return;
    }
    const paciente = await prisma.paciente.create({
      data: { ...req.body, clinicaId: req.profissional!.clinicaId },
    });
    res.status(201).json(paciente);
  })
);

pacientesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { profissionalId } = req.query;
    const paciente = await prisma.paciente.findMany({
      where: {
        clinicaId: req.profissional!.clinicaId,
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
    if (!paciente || paciente.clinicaId !== req.profissional!.clinicaId) {
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
    const existente = await prisma.paciente.findUnique({ where: { id: req.params.id } });
    if (!existente || existente.clinicaId !== req.profissional!.clinicaId) {
      res.status(404).json({ error: "Paciente não encontrado" });
      return;
    }
    if (req.body.profissionalId) {
      const profissionalDestino = await prisma.profissional.findUnique({ where: { id: req.body.profissionalId } });
      if (!profissionalDestino || profissionalDestino.clinicaId !== req.profissional!.clinicaId) {
        res.status(400).json({ error: "profissionalId inválido para esta clínica" });
        return;
      }
    }
    const paciente = await prisma.paciente.update({ where: { id: req.params.id }, data: req.body });
    res.json(paciente);
  })
);

pacientesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existente = await prisma.paciente.findUnique({ where: { id: req.params.id } });
    if (!existente || existente.clinicaId !== req.profissional!.clinicaId) {
      res.status(404).json({ error: "Paciente não encontrado" });
      return;
    }
    await prisma.paciente.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
