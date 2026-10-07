import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

export const conveniosRouter = Router();

const convenioCreateSchema = z.object({
  nomeOperadora: z.string().trim().min(1),
  // vazio vira null; ausente continua ausente (num PATCH parcial não pode apagar o código)
  codigoPrestador: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(60).nullable().optional()
  ),
});
const convenioUpdateSchema = convenioCreateSchema.partial().extend({ ativo: z.boolean().optional() });

const MSG_DUPLICADO = "Já existe um convênio com este nome nesta clínica";

function ehViolacaoUnicidade(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

// Convênios aceitos são configuração da clínica: todos leem (o cadastro do paciente precisa da
// lista), só ADMIN altera.
function exigirAdmin(req: { profissional?: { papel: string } }, res: { status: (c: number) => { json: (b: unknown) => void } }): boolean {
  if (req.profissional?.papel === "ADMIN") return true;
  res.status(403).json({ error: "Apenas administradores podem alterar os convênios aceitos pela clínica" });
  return false;
}

conveniosRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const todos = req.query.todos === "1";
    const convenios = await prisma.convenio.findMany({
      where: { clinicaId: req.profissional!.clinicaId, ...(todos ? {} : { ativo: true }) },
      orderBy: { nomeOperadora: "asc" },
    });
    res.json(convenios);
  })
);

conveniosRouter.post(
  "/",
  validateBody(convenioCreateSchema),
  asyncHandler(async (req, res) => {
    if (!exigirAdmin(req, res)) return;
    try {
      const convenio = await prisma.convenio.create({ data: { ...req.body, clinicaId: req.profissional!.clinicaId } });
      res.status(201).json(convenio);
    } catch (e) {
      if (!ehViolacaoUnicidade(e)) throw e;
      res.status(409).json({ error: MSG_DUPLICADO });
    }
  })
);

conveniosRouter.patch(
  "/:id",
  validateBody(convenioUpdateSchema),
  asyncHandler(async (req, res) => {
    if (!exigirAdmin(req, res)) return;
    const existente = await prisma.convenio.findUnique({ where: { id: req.params.id } });
    if (!existente || existente.clinicaId !== req.profissional!.clinicaId) {
      res.status(404).json({ error: "Convênio não encontrado" });
      return;
    }
    try {
      res.json(await prisma.convenio.update({ where: { id: req.params.id }, data: req.body }));
    } catch (e) {
      if (!ehViolacaoUnicidade(e)) throw e;
      res.status(409).json({ error: MSG_DUPLICADO });
    }
  })
);

// Desativa em vez de apagar: pacientes que já usam o convênio continuam apontando para ele.
conveniosRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    if (!exigirAdmin(req, res)) return;
    const existente = await prisma.convenio.findUnique({ where: { id: req.params.id } });
    if (!existente || existente.clinicaId !== req.profissional!.clinicaId) {
      res.status(404).json({ error: "Convênio não encontrado" });
      return;
    }
    await prisma.convenio.update({ where: { id: req.params.id }, data: { ativo: false } });
    res.status(204).send();
  })
);
