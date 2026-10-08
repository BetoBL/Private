import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

const router = Router();

const MS_DIA = 24 * 60 * 60 * 1000;

// Inicia um atendimento a partir de um tipo pré-configurado: cria N sessões E os N eventos
// correspondentes na agenda do profissional do paciente.
//  - `sessoes` (opcional): cronograma já ajustado pelo usuário, uma entrada por sessão. Sem ele,
//    o servidor monta o cronograma a partir de `dataPrimeiraSessao` + `intervaloDias`.
//  - `forcar`: agenda mesmo com conflito de horário (sem ele, conflito devolve 409 com a lista).
const iniciarAtendimentoSchema = z.object({
  pacienteId: z.string().uuid(),
  tipoAtendimentoId: z.string().uuid(),
  dataPrimeiraSessao: z.string().datetime().optional(),
  intervaloDias: z.number().int().min(1).max(365).default(7),
  duracaoMinutos: z.number().int().min(5).max(600).default(60),
  sessoes: z.array(z.object({ dataHora: z.string().datetime() })).min(1).max(60).optional(),
  forcar: z.boolean().optional(),
  // sessão de anamnese (opcional): tem horário próprio, mesmo que no mesmo dia das demais
  anamnese: z.object({ dataHora: z.string().datetime() }).optional(),
});

class ConflitoCronogramaError extends Error {
  constructor(public conflitos: Array<{ sessao: number; titulo: string; inicio: Date; fim: Date; paciente: string | null }>) {
    super("conflito de agenda");
  }
}

router.post(
  "/",
  validateBody(iniciarAtendimentoSchema),
  asyncHandler(async (req, res) => {
    const { pacienteId, tipoAtendimentoId, dataPrimeiraSessao, intervaloDias, duracaoMinutos, sessoes, forcar, anamnese } = req.body;
    const clinicaId = req.profissional!.clinicaId;
    const ehAdmin = req.profissional!.papel === "ADMIN";

    const paciente = await prisma.paciente.findUnique({ where: { id: pacienteId } });
    if (!paciente || paciente.clinicaId !== clinicaId) {
      res.status(400).json({ error: "Paciente não encontrado ou não pertence à sua clínica" });
      return;
    }
    if (!ehAdmin && paciente.profissionalId !== req.profissional!.sub) {
      res.status(403).json({ error: "Você só pode iniciar atendimentos para seus próprios pacientes" });
      return;
    }

    const tipo = await prisma.tipoAtendimento.findUnique({ where: { id: tipoAtendimentoId } });
    if (!tipo || tipo.clinicaId !== clinicaId) {
      res.status(400).json({ error: "Tipo de atendimento não encontrado ou não pertence à sua clínica" });
      return;
    }

    let datas: Date[];
    if (sessoes) {
      if (sessoes.length !== tipo.numeroSessoes) {
        res.status(400).json({ error: `Este tipo tem ${tipo.numeroSessoes} sessão(ões); o cronograma enviado tem ${sessoes.length}` });
        return;
      }
      datas = sessoes.map((s: { dataHora: string }) => new Date(s.dataHora));
    } else {
      const primeira = dataPrimeiraSessao ? new Date(dataPrimeiraSessao) : new Date(Date.now() + 7 * MS_DIA);
      datas = Array.from({ length: tipo.numeroSessoes }, (_, i) => new Date(primeira.getTime() + i * intervaloDias * MS_DIA));
    }

    // a anamnese entra na frente, com o próprio horário (a ordem é a do horário, não a do cadastro)
    const dataAnamnese = anamnese ? new Date(anamnese.dataHora) : null;

    // A agenda e as sessões são do profissional responsável pelo paciente (não de quem está logado):
    // quando a recepção ou um colega agenda, o compromisso cai na agenda de quem vai atender.
    const profissionalId = paciente.profissionalId;
    const duracaoMs = duracaoMinutos * 60 * 1000;

    try {
      const criadas = await prisma.$transaction(
        async (tx) => {
          if (!forcar) {
            const conflitos: ConflitoCronogramaError["conflitos"] = [];
            const todas = [...(dataAnamnese ? [dataAnamnese] : []), ...datas];
            for (const [i, inicio] of todas.entries()) {
              const ehAnamnese = !!dataAnamnese && i === 0;
              const fim = new Date(inicio.getTime() + duracaoMs);
              const existentes = await tx.eventoAgenda.findMany({
                where: { profissionalId, inicio: { lt: fim }, fim: { gt: inicio } },
                include: { paciente: true },
              });
              for (const e of existentes) {
                conflitos.push({ sessao: ehAnamnese ? 0 : i + (dataAnamnese ? 0 : 1), titulo: e.titulo, inicio: e.inicio, fim: e.fim, paciente: e.paciente?.nome ?? null });
              }
            }
            if (conflitos.length > 0) throw new ConflitoCronogramaError(conflitos);
          }

          const resultado = [];
          if (dataAnamnese) {
            const sessao = await tx.sessao.create({ data: { pacienteId, profissionalId, dataHora: dataAnamnese, tipo: "ANAMNESE" } });
            const evento = await tx.eventoAgenda.create({ data: { profissionalId, pacienteId, sessaoId: sessao.id, titulo: `Anamnese — ${tipo.nome}`, tipo: "anamnese", inicio: dataAnamnese, fim: new Date(dataAnamnese.getTime() + duracaoMs) } });
            resultado.push({ sessao, evento });
          }
          for (const [i, inicio] of datas.entries()) {
            const sessao = await tx.sessao.create({ data: { pacienteId, profissionalId, dataHora: inicio } });
            const evento = await tx.eventoAgenda.create({
              data: {
                profissionalId,
                pacienteId,
                sessaoId: sessao.id,
                titulo: `${tipo.nome} — Sessão ${i + 1}/${datas.length}`,
                tipo: "avaliacao",
                inicio,
                fim: new Date(inicio.getTime() + duracaoMs),
              },
            });
            resultado.push({ sessao, evento });
          }
          return resultado;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );

      res.status(201).json({
        tipo,
        sessoes: criadas.map((c) => c.sessao),
        eventos: criadas.map((c) => c.evento),
        mensagem: `${criadas.length} sessões agendadas${dataAnamnese ? " (inclui a anamnese)" : ""} para ${paciente.nome} (${tipo.nome}). Para mudar um horário, edite o evento na Agenda.`,
      });
    } catch (e) {
      if (e instanceof ConflitoCronogramaError) {
        res.status(409).json({ error: "Há conflito de horário com compromissos já agendados", conflitos: e.conflitos });
        return;
      }
      throw e;
    }
  })
);

export { router as atendimentosRouter };
