import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

const router = Router();

// Lista normativas customizadas da clínica
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const clinicaId = req.profissional!.clinicaId;
    const normativas = await prisma.normativaCustomizada.findMany({
      where: { clinicaId, ativo: true },
      include: { teste: true },
      orderBy: { atualizadoEm: "desc" },
    });
    res.json(normativas);
  })
);

// Cria nova normativa customizada
const criarNormativaSchema = z.object({
  testeId: z.string().uuid(),
  nomeNormativa: z.string().min(1),
  descricao: z.string().optional(),
  fonte: z.string().optional(),
  criterio: z.string(), // ex: "idade", "idade+sexo"
  faixaMin: z.number().optional(),
  faixaMax: z.number().optional(),
  faixaLabel: z.string().optional(),
  sexo: z.enum(["MASCULINO", "FEMININO"]).optional(),
  // Mesma estrutura de TabelaNormativa.conversao (ver ConversaoNormativa em lib/motorCalculo.ts):
  // { tipo, faixas: [{ min, max, percentil, classificacao }] } ou { tipo, faixasPorCampo: { campo: [...] } }
  conversao: z
    .object({
      tipo: z.string().min(1),
      faixas: z.array(z.object({ min: z.number().optional(), max: z.number().optional() }).passthrough()).optional(),
      faixasPorCampo: z
        .record(z.string(), z.array(z.object({ min: z.number().optional(), max: z.number().optional() }).passthrough()))
        .optional(),
    })
    .passthrough()
    .refine((c) => (c.faixas?.length ?? 0) > 0 || Object.keys(c.faixasPorCampo ?? {}).length > 0, {
      message: "conversao precisa de 'faixas' ou 'faixasPorCampo' com ao menos uma faixa",
    }),
});

function ehViolacaoUnicidade(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

const MSG_DUPLICADA = "Já existe uma normativa desta clínica para este teste com o mesmo critério e faixa";

router.post(
  "/",
  validateBody(criarNormativaSchema),
  asyncHandler(async (req, res) => {
    const clinicaId = req.profissional!.clinicaId;
    const { testeId, ...dados } = req.body;

    // Valida se teste existe
    const teste = await prisma.teste.findUnique({ where: { id: testeId } });
    if (!teste) {
      res.status(404).json({ error: "Teste não encontrado" });
      return;
    }

    try {
      const normativa = await prisma.normativaCustomizada.create({
        data: { clinicaId, testeId, ...dados },
        include: { teste: true },
      });
      res.status(201).json(normativa);
    } catch (e) {
      if (!ehViolacaoUnicidade(e)) throw e;
      res.status(409).json({ error: MSG_DUPLICADA });
    }
  })
);

// Atualiza normativa
const atualizarNormativaSchema = criarNormativaSchema.partial().extend({ ativo: z.boolean().optional() });

router.patch(
  "/:id",
  validateBody(atualizarNormativaSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const clinicaId = req.profissional!.clinicaId;

    // Valida permissão
    const normativa = await prisma.normativaCustomizada.findUnique({ where: { id } });
    if (!normativa || normativa.clinicaId !== clinicaId) {
      res.status(404).json({ error: "Normativa não encontrada" });
      return;
    }

    try {
      const atualizada = await prisma.normativaCustomizada.update({
        where: { id },
        data: req.body,
        include: { teste: true },
      });
      res.json(atualizada);
    } catch (e) {
      if (!ehViolacaoUnicidade(e)) throw e;
      res.status(409).json({ error: MSG_DUPLICADA });
    }
  })
);

// Desativa normativa (soft delete)
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const clinicaId = req.profissional!.clinicaId;

    const normativa = await prisma.normativaCustomizada.findUnique({ where: { id } });
    if (!normativa || normativa.clinicaId !== clinicaId) {
      res.status(404).json({ error: "Normativa não encontrada" });
      return;
    }

    // Soft delete
    await prisma.normativaCustomizada.update({
      where: { id },
      data: { ativo: false },
    });

    res.status(204).send();
  })
);

export { router as normativasCustomizadasRouter };
