import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

const router = Router();

// Cria uma sala virtual Jitsi para uma sessão
// Gera URL única e segura
const criarSalaSchema = z.object({
  sessaoId: z.string().uuid(),
});

router.post(
  "/",
  validateBody(criarSalaSchema),
  asyncHandler(async (req, res) => {
    const { sessaoId } = req.body;
    const clinicaId = req.profissional!.clinicaId;

    // Valida sessão e permissão
    const sessao = await prisma.sessao.findUnique({
      where: { id: sessaoId },
      include: { paciente: true },
    });

    if (!sessao || sessao.paciente.clinicaId !== clinicaId) {
      res.status(404).json({ error: "Sessão não encontrada ou não pertence à sua clínica" });
      return;
    }

    // Verifica se já existe sala para essa sessão
    const salaExistente = await prisma.salaVirtual.findFirst({
      where: { sessaoId },
    });

    if (salaExistente) {
      res.json(salaExistente);
      return;
    }

    // Gera código único para Jitsi
    // Formato: neurologic-{clinicaId}-{sessaoId} (truncado para ~40 chars, max Jitsi)
    const codigoSala = `neurologic-${clinicaId.slice(0, 8)}-${sessaoId.slice(0, 8)}`.toLowerCase();
    const urlJitsi = `https://meet.jit.si/${codigoSala}`;

    // Cria sala virtual
    const sala = await prisma.salaVirtual.create({
      data: {
        sessaoId,
        urlJitsi,
        codigoSala,
        inicioAgendado: sessao.dataHora,
      },
    });

    res.status(201).json(sala);
  })
);

// Lista salas virtuais de uma sessão
router.get(
  "/sessao/:sessaoId",
  asyncHandler(async (req, res) => {
    const { sessaoId } = req.params;
    const clinicaId = req.profissional!.clinicaId;

    // Valida permissão
    const sessao = await prisma.sessao.findUnique({
      where: { id: sessaoId },
      include: { paciente: true },
    });

    if (!sessao || sessao.paciente.clinicaId !== clinicaId) {
      res.status(404).json({ error: "Sessão não encontrada" });
      return;
    }

    const salas = await prisma.salaVirtual.findMany({
      where: { sessaoId },
      orderBy: { criadoEm: "desc" },
    });

    res.json(salas);
  })
);

// Atualiza status de sala (ao entrar/sair)
const atualizarSalaSchema = z.object({
  statusSala: z.enum(["agendada", "em_andamento", "encerrada"]).optional(),
  inicioReal: z.string().datetime().optional(),
  fimReal: z.string().datetime().optional(),
  profissionalPresente: z.boolean().optional(),
  pacientePresente: z.boolean().optional(),
});

router.patch(
  "/:id",
  validateBody(atualizarSalaSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const clinicaId = req.profissional!.clinicaId;

    // Valida permissão
    const sala = await prisma.salaVirtual.findUnique({
      where: { id },
      include: { sessao: { include: { paciente: true } } },
    });

    if (!sala || sala.sessao.paciente.clinicaId !== clinicaId) {
      res.status(404).json({ error: "Sala não encontrada" });
      return;
    }

    // Atualiza
    const atualizada = await prisma.salaVirtual.update({
      where: { id },
      data: {
        statusSala: req.body.statusSala,
        inicioReal: req.body.inicioReal ? new Date(req.body.inicioReal) : undefined,
        fimReal: req.body.fimReal ? new Date(req.body.fimReal) : undefined,
        profissionalPresente: req.body.profissionalPresente,
        pacientePresente: req.body.pacientePresente,
      },
    });

    res.json(atualizada);
  })
);

export { router as salasVirtuaisRouter };
