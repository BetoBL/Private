import { PapelProfissional } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { exigirAdmin, exigirAutenticacao } from "../middleware/auth";
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
  especialidades: z.array(z.string()).optional(),
  email: z.string().email(),
  senha: z.string().min(8, "Senha precisa de pelo menos 8 caracteres"),
});

const profissionalUpdateSchema = z.object({
  nome: z.string().min(1).optional(),
  fotoUrl: z.string().url().optional(),
  assinaturaUrl: z
    .string()
    .refine((v) => v === "" || /^data:image\/(png|jpe?g|webp);base64,/.test(v), "Assinatura inválida (use PNG, JPEG ou WebP)")
    .refine((v) => v.length <= 2_800_000, "Imagem grande demais (máx. ~2 MB)")
    .optional(),
  crp: z.string().min(1).optional(),
  telefone: z.string().optional(),
  enderecoParticular: z.string().optional(),
  formacao: z.string().optional(),
  especialidades: z.array(z.string()).optional(),
  email: z.string().email().optional(),
  senha: z.string().min(8, "Senha precisa de pelo menos 8 caracteres").optional(),
  papel: z.nativeEnum(PapelProfissional).optional(),
});

// nunca expor senhaHash nas respostas
// a assinatura (imagem grande) não vai nas respostas: só um indicador; a imagem tem rota própria (GET /:id/assinatura)
function serialize(profissional: { senhaHash: string; assinaturaUrl?: string | null; [key: string]: unknown }) {
  const { senhaHash: _senhaHash, assinaturaUrl, ...rest } = profissional;
  (rest as Record<string, unknown>).temAssinatura = !!assinaturaUrl;
  return rest;
}

export const profissionaisRouter = Router();

// Pública — passo 2 do fluxo de "criar minha conta" (cadastra o profissional numa clínica já criada).
// O primeiro profissional de uma clínica vira ADMIN automaticamente (não há mais ninguém pra promovê-lo);
// os demais entram como PSICOLOGO — papel nunca é aceito do cliente aqui, só via PATCH por um admin.
profissionaisRouter.post(
  "/",
  validateBody(profissionalCreateSchema),
  asyncHandler(async (req, res) => {
    const { senha, ...dados } = req.body;
    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
    const jaExisteAlguem = await prisma.profissional.count({ where: { clinicaId: dados.clinicaId } });
    const profissional = await prisma.profissional.create({
      data: { ...dados, senhaHash, papel: jaExisteAlguem === 0 ? PapelProfissional.ADMIN : PapelProfissional.PSICOLOGO },
    });
    res.status(201).json(serialize(profissional));
  })
);

// Daqui pra baixo exige login.
profissionaisRouter.use(exigirAutenticacao);

// Todo mundo da clínica pode ver a lista de colegas (não é dado sensível).
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
  "/:id/assinatura",
  asyncHandler(async (req, res) => {
    const profissional = await prisma.profissional.findUnique({ where: { id: req.params.id }, select: { clinicaId: true, assinaturaUrl: true } });
    if (!profissional || profissional.clinicaId !== req.profissional!.clinicaId) {
      res.status(404).json({ error: "Profissional não encontrado" });
      return;
    }
    res.json({ assinaturaUrl: profissional.assinaturaUrl });
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

// Qualquer profissional edita os próprios dados; só admin edita colegas ou muda o campo `papel`.
profissionaisRouter.patch(
  "/:id",
  validateBody(profissionalUpdateSchema),
  asyncHandler(async (req, res) => {
    const existente = await prisma.profissional.findUnique({ where: { id: req.params.id } });
    if (!existente || existente.clinicaId !== req.profissional!.clinicaId) {
      res.status(404).json({ error: "Profissional não encontrado" });
      return;
    }
    const admin = req.profissional!.papel === "ADMIN";
    const editandoSiMesmo = req.params.id === req.profissional!.sub;
    if (!admin && !editandoSiMesmo) {
      res.status(403).json({ error: "Você só pode editar seus próprios dados" });
      return;
    }
    const { senha, papel, ...dados } = req.body;
    if (papel !== undefined && !admin) {
      res.status(403).json({ error: "Apenas administradores podem alterar o papel de um profissional" });
      return;
    }
    const data = {
      ...dados,
      ...(admin && papel ? { papel } : {}),
      ...(senha ? { senhaHash: await bcrypt.hash(senha, SALT_ROUNDS) } : {}),
    };
    const profissional = await prisma.profissional.update({ where: { id: req.params.id }, data });
    res.json(serialize(profissional));
  })
);

profissionaisRouter.delete(
  "/:id",
  exigirAdmin,
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
