import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// Lista tipos de atendimento da clínica
router.get("/", async (req, res) => {
  try {
    const clinicaId = req.profissional!.clinicaId;
    const tipos = await prisma.tipoAtendimento.findMany({
      where: { clinicaId },
      orderBy: { nome: "asc" },
    });
    res.json(tipos);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Cria novo tipo de atendimento
router.post("/", async (req, res) => {
  try {
    const clinicaId = req.profissional!.clinicaId;
    const { nome, descricao, numeroSessoes, testeIds } = req.body;

    if (!nome || numeroSessoes === undefined) {
      return res.status(400).json({ error: "Nome e número de sessões são obrigatórios" });
    }

    const tipo = await prisma.tipoAtendimento.create({
      data: {
        clinicaId,
        nome,
        descricao,
        numeroSessoes,
        testeIds: testeIds || [],
      },
    });
    res.status(201).json(tipo);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Atualiza tipo de atendimento
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const clinicaId = req.profissional!.clinicaId;
    const { nome, descricao, numeroSessoes, testeIds } = req.body;

    // Verifica se o tipo pertence à clínica do usuário
    const tipo = await prisma.tipoAtendimento.findUnique({ where: { id } });
    if (!tipo || tipo.clinicaId !== clinicaId) {
      return res.status(404).json({ error: "Tipo de atendimento não encontrado" });
    }

    const atualizado = await prisma.tipoAtendimento.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(descricao !== undefined && { descricao }),
        ...(numeroSessoes !== undefined && { numeroSessoes }),
        ...(testeIds !== undefined && { testeIds }),
      },
    });
    res.json(atualizado);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Deleta tipo de atendimento
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const clinicaId = req.profissional!.clinicaId;

    // Verifica se o tipo pertence à clínica do usuário
    const tipo = await prisma.tipoAtendimento.findUnique({ where: { id } });
    if (!tipo || tipo.clinicaId !== clinicaId) {
      return res.status(404).json({ error: "Tipo de atendimento não encontrado" });
    }

    await prisma.tipoAtendimento.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export { router as tiposAtendimentoRouter };
