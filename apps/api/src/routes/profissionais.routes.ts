import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

const SALT_ROUNDS = 10;

const profissionalCreateSchema = z.object({
  clinicaId: z.string().uuid(),
  nome: z.string().min(1),
  fotoUrl: z.string().url().optional(),
  crp: z.string().min(1),
  telefone: z.string().optional(),
  enderecoParticular: z.string().optional(),
  formacao: z.string().optional(),
  email: z.string().email(),
  senha: z.string().min(8, "Senha precisa de pelo menos 8 caracteres"),
});

const profissionalUpdateSchema = profissionalCreateSchema.partial();

// nunca expor senhaHash nas respostas
function serialize(profissional: { senhaHash: string; [key: string]: unknown }) {
  const { senhaHash: _senhaHash, ...rest } = profissional;
  return rest;
}

export const profissionaisRouter = Router();

profissionaisRouter.post(
  "/",
  validateBody(profissionalCreateSchema),
  asyncHandler(async (req, res) => {
    const { senha, ...dados } = req.body;
    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
    const profissional = await prisma.profissional.create({ data: { ...dados, senhaHash } });
    res.status(201).json(serialize(profissional));
  })
);

profissionaisRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { clinicaId } = req.query;
    const profissionais = await prisma.profissional.findMany({
      where: typeof clinicaId === "string" ? { clinicaId } : undefined,
      orderBy: { criadoEm: "desc" },
    });
    res.json(profissionais.map(serialize));
  })
);

profissionaisRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const profissional = await prisma.profissional.findUnique({ where: { id: req.params.id } });
    if (!profissional) {
      res.status(404).json({ error: "Profissional não encontrado" });
      return;
    }
    res.json(serialize(profissional));
  })
);

profissionaisRouter.patch(
  "/:id",
  validateBody(profissionalUpdateSchema),
  asyncHandler(async (req, res) => {
    const { senha, ...dados } = req.body;
    const data = senha ? { ...dados, senhaHash: await bcrypt.hash(senha, SALT_ROUNDS) } : dados;
    const profissional = await prisma.profissional.update({ where: { id: req.params.id }, data });
    res.json(serialize(profissional));
  })
);

profissionaisRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.profissional.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
