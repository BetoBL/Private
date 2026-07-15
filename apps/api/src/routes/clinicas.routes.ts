import { Router } from "express";
import { z } from "zod";
import { exigirAutenticacao } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

const clinicaCreateSchema = z.object({
  razaoSocial: z.string().min(1),
  cnpj: z.string().optional(),
  endereco: z.string().optional(),
  telefone: z.string().optional(),
  logoUrl: z.string().url().optional(),
  corPrimaria: z.string().optional(),
  corSecundaria: z.string().optional(),
});

const clinicaUpdateSchema = clinicaCreateSchema.partial();

export const clinicasRouter = Router();

// Pública — passo 1 do fluxo de "criar minha conta" (clínica + primeiro profissional).
clinicasRouter.post(
  "/",
  validateBody(clinicaCreateSchema),
  asyncHandler(async (req, res) => {
    const clinica = await prisma.clinica.create({ data: req.body });
    res.status(201).json(clinica);
  })
);

// Daqui pra baixo exige login — e só enxerga/edita a própria clínica.
clinicasRouter.use(exigirAutenticacao);

clinicasRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const clinicas = await prisma.clinica.findMany({
      where: { id: req.profissional!.clinicaId },
      orderBy: { criadoEm: "desc" },
    });
    res.json(clinicas);
  })
);

clinicasRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    if (req.params.id !== req.profissional!.clinicaId) {
      res.status(403).json({ error: "Sem acesso a esta clínica" });
      return;
    }
    const clinica = await prisma.clinica.findUnique({ where: { id: req.params.id } });
    if (!clinica) {
      res.status(404).json({ error: "Clínica não encontrada" });
      return;
    }
    res.json(clinica);
  })
);

clinicasRouter.patch(
  "/:id",
  validateBody(clinicaUpdateSchema),
  asyncHandler(async (req, res) => {
    if (req.params.id !== req.profissional!.clinicaId) {
      res.status(403).json({ error: "Sem acesso a esta clínica" });
      return;
    }
    const clinica = await prisma.clinica.update({ where: { id: req.params.id }, data: req.body });
    res.json(clinica);
  })
);

clinicasRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    if (req.params.id !== req.profissional!.clinicaId) {
      res.status(403).json({ error: "Sem acesso a esta clínica" });
      return;
    }
    await prisma.clinica.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
