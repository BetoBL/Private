import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

// Conflito é uma resposta 409 pro cliente decidir (avisar e deixar forçar), então o "conflito
// detectável" abaixo é sinalizado por uma exceção com esse marcador — não é erro de verdade.
class ConflitoAgendaError extends Error {
  constructor(public conflitos: Array<{ id: string; titulo: string; inicio: Date; fim: Date; paciente: string | null }>) {
    super("conflito de agenda");
  }
}

const eventoCreateSchema = z.object({
  profissionalId: z.string().uuid().optional(),
  pacienteId: z.string().uuid().optional(),
  titulo: z.string().min(1),
  tipo: z.string().min(1).default("outro"),
  inicio: z.coerce.date(),
  fim: z.coerce.date(),
  observacoes: z.string().optional(),
  forcar: z.boolean().optional(),
});

const eventoUpdateSchema = eventoCreateSchema.partial().omit({ forcar: true }).extend({ forcar: z.boolean().optional() });

export const eventosAgendaRouter = Router();

function ehAdmin(req: { profissional?: { papel: string } }): boolean {
  return req.profissional?.papel === "ADMIN";
}

async function buscarConflitos(tx: Prisma.TransactionClient, profissionalId: string, inicio: Date, fim: Date, ignorarId?: string) {
  return tx.eventoAgenda.findMany({
    where: {
      profissionalId,
      id: ignorarId ? { not: ignorarId } : undefined,
      inicio: { lt: fim },
      fim: { gt: inicio },
    },
    include: { paciente: true },
  });
}

function paraConflitos(eventos: Array<{ id: string; titulo: string; inicio: Date; fim: Date; paciente: { nome: string } | null }>) {
  return eventos.map((c) => ({ id: c.id, titulo: c.titulo, inicio: c.inicio, fim: c.fim, paciente: c.paciente?.nome ?? null }));
}

eventosAgendaRouter.post(
  "/",
  validateBody(eventoCreateSchema),
  asyncHandler(async (req, res) => {
    const { forcar, pacienteId, ...dados } = req.body;
    const profissionalId = dados.profissionalId ?? req.profissional!.sub;
    if (profissionalId !== req.profissional!.sub && !ehAdmin(req)) {
      res.status(403).json({ error: "Você só pode criar eventos na sua própria agenda" });
      return;
    }
    if (dados.fim <= dados.inicio) {
      res.status(400).json({ error: "O horário de término precisa ser depois do início" });
      return;
    }
    if (pacienteId) {
      const paciente = await prisma.paciente.findUnique({ where: { id: pacienteId } });
      if (!paciente || paciente.clinicaId !== req.profissional!.clinicaId) {
        res.status(400).json({ error: "pacienteId inválido para esta clínica" });
        return;
      }
    }

    try {
      // Isolamento serializable: fecha a janela entre "checar conflito" e "criar" — sem isso,
      // dois POSTs concorrentes para o mesmo horário podem ambos ler "sem conflito" e duplicar.
      const evento = await prisma.$transaction(
        async (tx) => {
          const conflitos = await buscarConflitos(tx, profissionalId, dados.inicio, dados.fim);
          if (conflitos.length > 0 && !forcar) {
            throw new ConflitoAgendaError(paraConflitos(conflitos));
          }
          return tx.eventoAgenda.create({
            data: { ...dados, profissionalId, pacienteId },
            include: { paciente: true },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
      res.status(201).json(evento);
    } catch (e) {
      if (e instanceof ConflitoAgendaError) {
        res.status(409).json({ error: "Este horário conflita com outro evento já agendado", conflitos: e.conflitos });
        return;
      }
      throw e;
    }
  })
);

eventosAgendaRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { inicio, fim, profissionalId, pacienteId } = req.query;
    const admin = ehAdmin(req);
    const eventos = await prisma.eventoAgenda.findMany({
      where: {
        profissional: { clinicaId: req.profissional!.clinicaId },
        profissionalId: admin ? (typeof profissionalId === "string" ? profissionalId : undefined) : req.profissional!.sub,
        ...(typeof pacienteId === "string" ? { pacienteId } : {}),
        ...(typeof inicio === "string" ? { fim: { gte: new Date(inicio) } } : {}),
        ...(typeof fim === "string" ? { inicio: { lte: new Date(fim) } } : {}),
      },
      include: { paciente: true },
      orderBy: { inicio: "asc" },
    });
    res.json(eventos);
  })
);

eventosAgendaRouter.patch(
  "/:id",
  validateBody(eventoUpdateSchema),
  asyncHandler(async (req, res) => {
    const existente = await prisma.eventoAgenda.findUnique({ where: { id: req.params.id } });
    if (!existente || existente.profissionalId !== req.profissional!.sub) {
      if (!existente || !ehAdmin(req)) {
        res.status(404).json({ error: "Evento não encontrado" });
        return;
      }
      const dono = await prisma.profissional.findUnique({ where: { id: existente.profissionalId } });
      if (!dono || dono.clinicaId !== req.profissional!.clinicaId) {
        res.status(404).json({ error: "Evento não encontrado" });
        return;
      }
    }

    const { forcar, ...dados } = req.body;
    const novoInicio = dados.inicio ?? existente.inicio;
    const novoFim = dados.fim ?? existente.fim;
    if (novoFim <= novoInicio) {
      res.status(400).json({ error: "O horário de término precisa ser depois do início" });
      return;
    }

    try {
      const evento = await prisma.$transaction(
        async (tx) => {
          const conflitos = await buscarConflitos(tx, existente.profissionalId, novoInicio, novoFim, existente.id);
          if (conflitos.length > 0 && !forcar) {
            throw new ConflitoAgendaError(paraConflitos(conflitos));
          }
          const atualizado = await tx.eventoAgenda.update({ where: { id: req.params.id }, data: dados, include: { paciente: true } });
          // Evento nascido de um atendimento: mover o horário move também a Sessao clínica, que é
          // o que alimenta a idade do paciente "na data da sessão" e a ficha dele.
          if (existente.sessaoId && dados.inicio) {
            await tx.sessao.update({ where: { id: existente.sessaoId }, data: { dataHora: dados.inicio } });
          }
          return atualizado;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
      res.json(evento);
    } catch (e) {
      if (e instanceof ConflitoAgendaError) {
        res.status(409).json({ error: "Este horário conflita com outro evento já agendado", conflitos: e.conflitos });
        return;
      }
      throw e;
    }
  })
);

eventosAgendaRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existente = await prisma.eventoAgenda.findUnique({ where: { id: req.params.id } });
    if (!existente) {
      res.status(404).json({ error: "Evento não encontrado" });
      return;
    }
    if (existente.profissionalId !== req.profissional!.sub && !ehAdmin(req)) {
      res.status(404).json({ error: "Evento não encontrado" });
      return;
    }
    await prisma.eventoAgenda.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
