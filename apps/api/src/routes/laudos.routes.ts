import { StatusLaudo } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { gerarRascunhoLaudo } from "../lib/gerarRascunhoLaudo";
import { pacienteTemTestePlaceholder } from "../lib/placeholderCheck";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

const laudoCreateSchema = z.object({
  pacienteId: z.string().uuid(),
  profissionalId: z.string().uuid(),
  identificacao: z.record(z.string(), z.unknown()),
  descricaoDemanda: z.string().min(1),
  procedimento: z.string().min(1),
  analise: z.string().optional().default(""),
  conclusao: z.string().optional().default(""),
  referencias: z.string().optional().default(""),
});

const laudoUpdateSchema = z.object({
  identificacao: z.record(z.string(), z.unknown()).optional(),
  descricaoDemanda: z.string().optional(),
  procedimento: z.string().optional(),
  analise: z.string().optional(),
  conclusao: z.string().optional(),
  referencias: z.string().optional(),
  status: z.nativeEnum(StatusLaudo).optional(),
  iaRevisadaPeloProf: z.boolean().optional(),
  dataDevolutiva: z.coerce.date().optional(),
});

export const laudosRouter = Router();

laudosRouter.post(
  "/",
  validateBody(laudoCreateSchema),
  asyncHandler(async (req, res) => {
    const laudo = await prisma.laudo.create({ data: req.body });
    res.status(201).json(laudo);
  })
);

laudosRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { pacienteId } = req.query;
    const laudos = await prisma.laudo.findMany({
      where: typeof pacienteId === "string" ? { pacienteId } : undefined,
      orderBy: { criadoEm: "desc" },
    });
    res.json(laudos);
  })
);

laudosRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const laudo = await prisma.laudo.findUnique({ where: { id: req.params.id } });
    if (!laudo) {
      res.status(404).json({ error: "Laudo não encontrado" });
      return;
    }
    res.json(laudo);
  })
);

// Trava de finalização: mesma lógica do iaRevisadaPeloProf, mas também bloqueia
// enquanto qualquer teste usado pelo paciente for isPlaceholder=true (ver
// memória do projeto project_placeholder_tests_policy).
laudosRouter.patch(
  "/:id",
  validateBody(laudoUpdateSchema),
  asyncHandler(async (req, res) => {
    const existente = await prisma.laudo.findUnique({ where: { id: req.params.id } });
    if (!existente) {
      res.status(404).json({ error: "Laudo não encontrado" });
      return;
    }

    if (req.body.status === StatusLaudo.FINALIZADO) {
      const iaRevisada = req.body.iaRevisadaPeloProf ?? existente.iaRevisadaPeloProf;
      if (!iaRevisada) {
        res.status(409).json({
          error: "Não é possível finalizar: o rascunho de IA ainda não foi revisado pelo profissional",
        });
        return;
      }
      const temPlaceholder = await pacienteTemTestePlaceholder(existente.pacienteId);
      if (temPlaceholder) {
        res.status(409).json({
          error:
            "Não é possível finalizar: a bateria usa teste(s) com dados provisórios (placeholder). Substitua pelos testes reais antes de finalizar.",
        });
        return;
      }
    }

    const laudo = await prisma.laudo.update({ where: { id: req.params.id }, data: req.body });
    res.json(laudo);
  })
);

// Gera o rascunho de Análise/Conclusão via IA (ver CLAUDE.md, seção "Fluxo da chamada de IA").
// Não bloqueado por placeholder — só injeta o aviso no próprio texto quando aplicável.
laudosRouter.post(
  "/:id/gerar-rascunho",
  asyncHandler(async (req, res) => {
    const laudo = await prisma.laudo.findUnique({ where: { id: req.params.id } });
    if (!laudo) {
      res.status(404).json({ error: "Laudo não encontrado" });
      return;
    }

    const paciente = await prisma.paciente.findUnique({ where: { id: laudo.pacienteId } });
    if (!paciente) {
      res.status(404).json({ error: "Paciente não encontrado" });
      return;
    }

    const perfilDeAtuacao = await prisma.perfilDeAtuacao.findUnique({
      where: { profissionalId: laudo.profissionalId },
    });

    const aplicacoes = await prisma.aplicacaoDeTeste.findMany({
      where: { sessao: { pacienteId: laudo.pacienteId } },
      include: { teste: true },
    });

    const contemTestePlaceholder = aplicacoes.some((a) => a.teste.isPlaceholder);

    const rascunho = await gerarRascunhoLaudo({
      anamnese: paciente.anamnese,
      descricaoDemanda: laudo.descricaoDemanda,
      testesAplicados: aplicacoes.map((a) => ({
        sigla: a.teste.sigla,
        dominio: a.teste.dominio,
        resultadoCalculado: a.resultadoCalculado,
      })),
      perfilDeAtuacao: perfilDeAtuacao
        ? {
            abordagemTeorica: perfilDeAtuacao.abordagemTeorica,
            tomDeEscrita: perfilDeAtuacao.tomDeEscrita,
            regrasDePrudencia: perfilDeAtuacao.regrasDePrudencia,
            vocabularioRecorrente: perfilDeAtuacao.vocabularioRecorrente,
          }
        : null,
      contemTestePlaceholder,
    });

    const atualizado = await prisma.laudo.update({
      where: { id: laudo.id },
      data: {
        analise: rascunho.analise,
        conclusao: rascunho.conclusao,
        iaUtilizada: true,
      },
    });

    res.json(atualizado);
  })
);
