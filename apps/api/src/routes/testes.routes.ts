import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/validate";

export const testesRouter = Router();

// Catálogo de testes é somente leitura por enquanto — cadastro de teste custom é V2 (motor de testes aberto).
testesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const incluirInativos = req.query.incluirInativos === "true";
    const testes = await prisma.teste.findMany({
      where: incluirInativos ? undefined : { ativo: true },
      include: { tabelasNormativas: { omit: { conversao: true } } }, // a conversão é grande (motor de planilha): nunca vai na listagem
      orderBy: { nome: "asc" },
    });
    res.json(testes);
  })
);

testesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const teste = await prisma.teste.findUnique({
      where: { id: req.params.id },
      include: { tabelasNormativas: { omit: { conversao: true } } }, // a conversão é grande (motor de planilha): nunca vai na listagem
    });
    if (!teste) {
      res.status(404).json({ error: "Teste não encontrado" });
      return;
    }
    res.json(teste);
  })
);
