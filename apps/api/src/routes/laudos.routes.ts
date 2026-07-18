import { Laudo, StatusLaudo } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { gerarDocxLaudo } from "../lib/gerarDocxLaudo";
import { gerarRascunhoLaudo } from "../lib/gerarRascunhoLaudo";
import { pacienteTemTestePlaceholder } from "../lib/placeholderCheck";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

// Trava compartilhada por PATCH (finalizar) e exportação DOCX: precisa de revisão humana
// e nenhum teste placeholder na bateria (ver memória do projeto project_placeholder_tests_policy).
async function motivoBloqueioFinalizacao(laudo: Laudo, iaRevisadaOverride?: boolean): Promise<string | null> {
  const iaRevisada = iaRevisadaOverride ?? laudo.iaRevisadaPeloProf;
  if (!iaRevisada) {
    return "o rascunho de IA ainda não foi revisado pelo profissional";
  }
  const temPlaceholder = await pacienteTemTestePlaceholder(laudo.pacienteId);
  if (temPlaceholder) {
    return "a bateria usa teste(s) com dados provisórios (placeholder). Substitua pelos testes reais antes de continuar.";
  }
  return null;
}

function ehAdmin(req: { profissional?: { papel: string } }): boolean {
  return req.profissional?.papel === "ADMIN";
}

// Busca um laudo garantindo que pertence à clínica de quem está autenticado — e, se não for
// admin, que o paciente é do próprio profissional (psicólogo só vê o próprio trabalho).
async function buscarLaudoDaClinica(id: string, req: { profissional?: { clinicaId: string; sub: string; papel: string } }) {
  const laudo = await prisma.laudo.findUnique({ where: { id }, include: { paciente: true } });
  if (!laudo || laudo.paciente.clinicaId !== req.profissional!.clinicaId) return null;
  if (!ehAdmin(req) && laudo.paciente.profissionalId !== req.profissional!.sub) return null;
  return laudo;
}

const laudoCreateSchema = z.object({
  pacienteId: z.string().uuid(),
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
    const paciente = await prisma.paciente.findUnique({ where: { id: req.body.pacienteId } });
    if (!paciente || paciente.clinicaId !== req.profissional!.clinicaId) {
      res.status(400).json({ error: "pacienteId inválido para esta clínica" });
      return;
    }
    if (!ehAdmin(req) && paciente.profissionalId !== req.profissional!.sub) {
      res.status(403).json({ error: "Você só pode criar laudos para seus próprios pacientes" });
      return;
    }
    const laudo = await prisma.laudo.create({
      data: { ...req.body, profissionalId: req.profissional!.sub },
    });
    res.status(201).json(laudo);
  })
);

laudosRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { pacienteId } = req.query;
    const admin = ehAdmin(req);
    const laudos = await prisma.laudo.findMany({
      where: {
        paciente: {
          clinicaId: req.profissional!.clinicaId,
          ...(admin ? {} : { profissionalId: req.profissional!.sub }),
        },
        ...(typeof pacienteId === "string" ? { pacienteId } : {}),
      },
      orderBy: { criadoEm: "desc" },
    });
    res.json(laudos);
  })
);

laudosRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const laudo = await buscarLaudoDaClinica(req.params.id, req);
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
    const existente = await buscarLaudoDaClinica(req.params.id, req);
    if (!existente) {
      res.status(404).json({ error: "Laudo não encontrado" });
      return;
    }

    if (req.body.status === StatusLaudo.FINALIZADO) {
      const motivo = await motivoBloqueioFinalizacao(existente, req.body.iaRevisadaPeloProf);
      if (motivo) {
        res.status(409).json({ error: `Não é possível finalizar: ${motivo}` });
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
    const laudo = await buscarLaudoDaClinica(req.params.id, req);
    if (!laudo) {
      res.status(404).json({ error: "Laudo não encontrado" });
      return;
    }
    const paciente = laudo.paciente;

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

// Exporta o laudo em DOCX. Mesma trava da finalização (revisão humana + sem
// testes placeholder) — é o ponto real que impede um laudo de teste virar
// documento de verdade por descuido. Gerado sob demanda; não persiste arquivo
// (Laudo.arquivoUrl fica null — armazenamento de arquivo é V2).
laudosRouter.get(
  "/:id/exportar-docx",
  asyncHandler(async (req, res) => {
    const laudo = await buscarLaudoDaClinica(req.params.id, req);
    if (!laudo) {
      res.status(404).json({ error: "Laudo não encontrado" });
      return;
    }

    const motivo = await motivoBloqueioFinalizacao(laudo);
    if (motivo) {
      res.status(409).json({ error: `Não é possível exportar: ${motivo}` });
      return;
    }

    const clinica = await prisma.clinica.findUnique({ where: { id: laudo.paciente.clinicaId } });
    const profissional = await prisma.profissional.findUnique({ where: { id: laudo.profissionalId } });
    if (!clinica || !profissional) {
      res.status(404).json({ error: "Clínica ou profissional não encontrado" });
      return;
    }
    const paciente = laudo.paciente;

    const buffer = await gerarDocxLaudo({
      // Nome fantasia é o nome de exibição padrão em todo o sistema; a exceção é NFS-e
      // (nota fiscal), que não é emitida por este fluxo — aqui vale o nome fantasia.
      clinicaNome: clinica.nomeFantasia || clinica.razaoSocial,
      clinicaCidade: clinica.cidade,
      profissionalNome: profissional.nome,
      profissionalCrp: profissional.crp,
      profissionalEspecialidades: profissional.especialidades,
      identificacao: laudo.identificacao as Record<string, unknown>,
      descricaoDemanda: laudo.descricaoDemanda,
      procedimento: laudo.procedimento,
      analise: laudo.analise,
      conclusao: laudo.conclusao,
      referencias: laudo.referencias,
      iaUtilizada: laudo.iaUtilizada,
    });

    const nomeArquivo = `laudo-${paciente.nome.replace(/\s+/g, "-").toLowerCase()}.docx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
    res.send(buffer);
  })
);
