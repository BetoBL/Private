import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

// Anexo hoje é um link (URL), não upload de arquivo — não há armazenamento de arquivo montado ainda.
const anexoCreateSchema = z.object({
  pacienteId: z.string().uuid(),
  tipo: z.string().min(1),
  url: z.string().url(),
  descricao: z.string().optional(),
});

export const anexosRouter = Router();

function ehAdmin(req: { profissional?: { papel: string } }): boolean {
  return req.profissional?.papel === "ADMIN";
}

anexosRouter.post(
  "/",
  validateBody(anexoCreateSchema),
  asyncHandler(async (req, res) => {
    const paciente = await prisma.paciente.findUnique({ where: { id: req.body.pacienteId } });
    if (!paciente || paciente.clinicaId !== req.profissional!.clinicaId) {
      res.status(400).json({ error: "pacienteId inválido para esta clínica" });
      return;
    }
    if (!ehAdmin(req) && paciente.profissionalId !== req.profissional!.sub) {
      res.status(403).json({ error: "Você só pode adicionar anexos aos seus próprios pacientes" });
      return;
    }
    const anexo = await prisma.anexo.create({ data: req.body });
    res.status(201).json(anexo);
  })
);

anexosRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { pacienteId } = req.query;
    if (typeof pacienteId !== "string") {
      res.status(400).json({ error: "pacienteId é obrigatório" });
      return;
    }
    const anexos = await prisma.anexo.findMany({
      where: {
        pacienteId,
        paciente: {
          clinicaId: req.profissional!.clinicaId,
          ...(ehAdmin(req) ? {} : { profissionalId: req.profissional!.sub }),
        },
      },
      orderBy: { criadoEm: "desc" },
    });
    res.json(anexos);
  })
);

anexosRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const anexo = await prisma.anexo.findUnique({ where: { id: req.params.id }, include: { paciente: true } });
    if (!anexo || anexo.paciente.clinicaId !== req.profissional!.clinicaId) {
      res.status(404).json({ error: "Anexo não encontrado" });
      return;
    }
    if (!ehAdmin(req) && anexo.paciente.profissionalId !== req.profissional!.sub) {
      res.status(404).json({ error: "Anexo não encontrado" });
      return;
    }
    await prisma.anexo.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

const anexoUpdateSchema = z.object({ tipo: z.string().min(1).optional(), url: z.string().url().optional(), descricao: z.string().nullable().optional() });

anexosRouter.patch(
  "/:id",
  validateBody(anexoUpdateSchema),
  asyncHandler(async (req, res) => {
    const anexo = await prisma.anexo.findUnique({ where: { id: req.params.id }, include: { paciente: true } });
    if (!anexo || anexo.paciente.clinicaId !== req.profissional!.clinicaId || (!ehAdmin(req) && anexo.paciente.profissionalId !== req.profissional!.sub)) {
      res.status(404).json({ error: "Anexo não encontrado" });
      return;
    }
    const atualizado = await prisma.anexo.update({ where: { id: anexo.id }, data: { tipo: req.body.tipo, url: req.body.url, descricao: req.body.descricao === null ? null : req.body.descricao } });
    res.json(atualizado);
  })
);
