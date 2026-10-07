import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";
import { recalcularAplicacoesDaSessao } from "./aplicacoesDeTeste.routes";

const sessaoCreateSchema = z.object({
  pacienteId: z.string().uuid(),
  dataHora: z.coerce.date(),
  observacoes: z.string().optional(),
});

export const sessoesRouter = Router();

function ehAdmin(req: { profissional?: { papel: string } }): boolean {
  return req.profissional?.papel === "ADMIN";
}

// profissionalId nunca vem do cliente — é sempre quem está autenticado.
sessoesRouter.post(
  "/",
  validateBody(sessaoCreateSchema),
  asyncHandler(async (req, res) => {
    const paciente = await prisma.paciente.findUnique({ where: { id: req.body.pacienteId } });
    if (!paciente || paciente.clinicaId !== req.profissional!.clinicaId) {
      res.status(400).json({ error: "pacienteId inválido para esta clínica" });
      return;
    }
    if (!ehAdmin(req) && paciente.profissionalId !== req.profissional!.sub) {
      res.status(403).json({ error: "Você só pode lançar sessões para seus próprios pacientes" });
      return;
    }
    const sessao = await prisma.sessao.create({
      data: { ...req.body, profissionalId: req.profissional!.sub },
    });
    res.status(201).json(sessao);
  })
);

sessoesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { pacienteId, profissionalId } = req.query;
    const admin = ehAdmin(req);
    const sessoes = await prisma.sessao.findMany({
      where: {
        paciente: { clinicaId: req.profissional!.clinicaId },
        ...(admin ? {} : { profissionalId: req.profissional!.sub }),
        ...(typeof pacienteId === "string" ? { pacienteId } : {}),
        ...(admin && typeof profissionalId === "string" ? { profissionalId } : {}),
      },
      orderBy: { dataHora: "desc" },
    });
    res.json(sessoes);
  })
);

sessoesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const sessao = await prisma.sessao.findUnique({
      where: { id: req.params.id },
      include: { aplicacoesTeste: { include: { teste: true } }, paciente: true },
    });
    if (!sessao || sessao.paciente.clinicaId !== req.profissional!.clinicaId) {
      res.status(404).json({ error: "Sessão não encontrada" });
      return;
    }
    if (!ehAdmin(req) && sessao.paciente.profissionalId !== req.profissional!.sub) {
      res.status(404).json({ error: "Sessão não encontrada" });
      return;
    }
    res.json(sessao);
  })
);

const sessaoUpdateSchema = z.object({ dataHora: z.coerce.date().optional(), observacoes: z.string().nullable().optional() });

async function sessaoDoUsuario(req: { params: { id: string }; profissional?: { clinicaId: string; papel: string; sub: string } }) {
  const sessao = await prisma.sessao.findUnique({ where: { id: req.params.id }, include: { paciente: true, aplicacoesTeste: { select: { id: true } }, salasVirtuais: { select: { id: true } }, eventoAgenda: { select: { id: true } }, cobrancas: { select: { id: true } } } });
  if (!sessao || sessao.paciente.clinicaId !== req.profissional!.clinicaId) return null;
  if (!ehAdmin(req) && sessao.paciente.profissionalId !== req.profissional!.sub) return null;
  return sessao;
}

// Corrige a data/hora (ou observações) da sessão. Mudar a data muda a idade do paciente na aplicação: os testes já lançados são recalculados.
sessoesRouter.patch(
  "/:id",
  validateBody(sessaoUpdateSchema),
  asyncHandler(async (req, res) => {
    const sessao = await sessaoDoUsuario(req as never);
    if (!sessao) {
      res.status(404).json({ error: "Sessão não encontrada" });
      return;
    }
    const atualizada = await prisma.sessao.update({ where: { id: sessao.id }, data: { dataHora: req.body.dataHora, observacoes: req.body.observacoes === null ? null : req.body.observacoes } });
    const recalculados = req.body.dataHora ? await recalcularAplicacoesDaSessao(sessao.id, req.profissional!.clinicaId) : 0;
    res.json({ ...atualizada, testesRecalculados: recalculados });
  })
);

// Só apaga sessão sem testes, sala virtual nem evento de agenda ligados (para não perder resultado sem querer).
sessoesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const sessao = await sessaoDoUsuario(req as never);
    if (!sessao) {
      res.status(404).json({ error: "Sessão não encontrada" });
      return;
    }
    if (sessao.aplicacoesTeste.length > 0 || sessao.salasVirtuais.length > 0 || sessao.eventoAgenda || sessao.cobrancas.length > 0) {
      res.status(409).json({ error: "Esta sessão tem testes lançados, sala virtual, evento na agenda ou cobrança. Remova esses itens antes de excluir a sessão." });
      return;
    }
    await prisma.sessao.delete({ where: { id: sessao.id } });
    res.status(204).send();
  })
);
