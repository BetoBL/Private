import { createHash } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { gerarRespostaHumor } from "../lib/gerarRespostaHumor";
import { gerarResumoDoDia, type CasoDoDia } from "../lib/gerarResumoDoDia";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

export const painelDoDiaRouter = Router();

function inicioDoDia(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function fimDoDia(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

// Resumo é sempre do próprio profissional autenticado — não existe "ver o resumo de outro colega".
painelDoDiaRouter.get(
  "/resumo",
  asyncHandler(async (req, res) => {
    const profissionalId = req.profissional!.sub;
    const profissional = await prisma.profissional.findUnique({ where: { id: profissionalId } });
    if (!profissional) {
      res.status(404).json({ error: "Profissional não encontrado" });
      return;
    }

    const eventosHoje = await prisma.eventoAgenda.findMany({
      where: { profissionalId, inicio: { gte: inicioDoDia(), lte: fimDoDia() } },
      include: { paciente: true },
      orderBy: { inicio: "asc" },
    });

    const casosDeHoje: CasoDoDia[] = await Promise.all(
      eventosHoje
        .filter((ev) => ev.paciente)
        .map(async (ev) => {
          const ultimoLaudo = await prisma.laudo.findFirst({
            where: { pacienteId: ev.pacienteId! },
            orderBy: { criadoEm: "desc" },
          });
          return {
            pacienteNome: ev.paciente!.nome,
            horario: ev.inicio.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }),
            tituloEvento: ev.titulo,
            statusUltimoLaudo: ultimoLaudo?.status ?? null,
            temLaudoAguardandoRevisao: Boolean(ultimoLaudo?.iaUtilizada && !ultimoLaudo.iaRevisadaPeloProf),
          };
        })
    );

    const totalLaudosAguardandoRevisao = await prisma.laudo.count({
      where: { profissionalId, iaUtilizada: true, iaRevisadaPeloProf: false },
    });

    // um resumo por dia: só é refeito (nova chamada de IA) se a agenda ou as revisões pendentes mudaram, ou se o usuário pedir
    const data = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
    const assinatura = createHash("sha256").update(JSON.stringify({ profissional: profissional.nome, casosDeHoje, totalLaudosAguardandoRevisao })).digest("hex");
    const guardado = await prisma.resumoDoDia.findUnique({ where: { profissionalId_data: { profissionalId, data } } });
    if (guardado && guardado.assinatura === assinatura && req.query.atualizar !== "1") {
      res.json({ resumo: guardado.conteudo, geradoEm: guardado.atualizadoEm, doDia: true });
      return;
    }

    const resumo = await gerarResumoDoDia({
      profissionalNome: profissional.nome,
      casosDeHoje,
      totalLaudosAguardandoRevisao,
    });

    const salvo = await prisma.resumoDoDia.upsert({
      where: { profissionalId_data: { profissionalId, data } },
      update: { conteudo: resumo, assinatura },
      create: { profissionalId, data, conteudo: resumo, assinatura },
    });
    res.json({ resumo, geradoEm: salvo.atualizadoEm, doDia: false });
  })
);

const humorSchema = z.object({ humor: z.string().min(1).max(500) });

// Não persiste — é só uma interação rápida e opcional para abrir o dia (ver memória do
// projeto: não é um recurso terapêutico, é um gesto de cuidado pontual).
painelDoDiaRouter.post(
  "/humor",
  validateBody(humorSchema),
  asyncHandler(async (req, res) => {
    const resposta = await gerarRespostaHumor(req.body.humor);
    res.json({ resposta });
  })
);
