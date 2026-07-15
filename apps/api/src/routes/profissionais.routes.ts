import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { exigirAutenticacao } from "../middleware/auth";
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

// Pública — passo 2 do fluxo de "criar minha conta" (cadastra o profissional numa clínica já criada).
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

// Daqui pra baixo exige login — e só enxerga/edita colegas da própria clínica
// (não há ainda papéis/permissões granulares — ver pendências do produto).
profissionaisRouter.use(exigirAutenticacao);

profissionaisRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const profissionais = await prisma.profissional.findMany({
      where: { clinicaId: req.profissional!.clinicaId },
      orderBy: { criadoEm: "desc" },
    });
    res.json(profissionais.map(serialize));
  })
);

profissionaisRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const profissional = await prisma.profissional.findUnique({ where: { id: req.params.id } });
    if (!profissional || profissional.clinicaId !== req.profissional!.clinicaId) {
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
    const existente = await prisma.profissional.findUnique({ where: { id: req.params.id } });
    if (!existente || existente.clinicaId !== req.profissional!.clinicaId) {
      res.status(404).json({ error: "Profissional não encontrado" });
      return;
    }
    const { senha, ...dados } = req.body;
    const data = senha ? { ...dados, senhaHash: await bcrypt.hash(senha, SALT_ROUNDS) } : dados;
    const profissional = await prisma.profissional.update({ where: { id: req.params.id }, data });
    res.json(serialize(profissional));
  })
);

profissionaisRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existente = await prisma.profissional.findUnique({ where: { id: req.params.id } });
    if (!existente || existente.clinicaId !== req.profissional!.clinicaId) {
      res.status(404).json({ error: "Profissional não encontrado" });
      return;
    }
    await prisma.profissional.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
