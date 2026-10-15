import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/validate";

// Linha do tempo das sessões de um paciente: junta os compromissos da agenda com a evolução de cada um
// (e as evoluções soltas, sem compromisso). É só leitura; criar e editar continua na Agenda e no Prontuário.
export const linhaSessoesRouter = Router();

type Usuario = { sub: string; clinicaId: string; papel: string };

linhaSessoesRouter.get("/paciente/:pacienteId", asyncHandler(async (req, res) => {
  const me = req.profissional as Usuario;
  const p = await prisma.paciente.findFirst({ where: { id: req.params.pacienteId, clinicaId: me.clinicaId, ...(me.papel === "ADMIN" ? {} : { profissionalId: me.sub }) }, select: { id: true } });
  if (!p) { res.status(404).json({ error: "Paciente não encontrado" }); return; }

  const [eventos, evolucoes] = await Promise.all([
    prisma.eventoAgenda.findMany({ where: { pacienteId: p.id, tipo: { not: "bloqueio" } }, orderBy: { inicio: "desc" }, take: 400 }),
    prisma.evolucao.findMany({ where: { pacienteId: p.id, clinicaId: me.clinicaId, excluidaEm: null }, orderBy: { dataHora: "desc" }, take: 400, select: { id: true, eventoAgendaId: true, dataHora: true, modelo: true, status: true, geradaPorIA: true, evolucao: true, campos: true, anotacoes: true, profissionalId: true } }),
  ]);
  const agora = Date.now();
  const resumoEv = (e: (typeof evolucoes)[number]) => ({
    id: e.id, status: e.status, modelo: e.modelo, geradaPorIA: e.geradaPorIA,
    temTexto: !!((e.evolucao ?? "").trim() || (e.campos && Object.keys(e.campos as object).length)),
    temAnotacoes: e.profissionalId === me.sub ? !!(e.anotacoes ?? "").trim() : null, // as anotações são privadas: só o autor sabe se existem
  });

  const usadas = new Set<string>();
  const itens = eventos.map((ev) => {
    const e = evolucoes.find((x) => x.eventoAgendaId === ev.id);
    if (e) usadas.add(e.id);
    return {
      chave: `e-${ev.id}`, eventoId: ev.id, inicio: ev.inicio, fim: ev.fim, titulo: ev.titulo, tipo: ev.tipo,
      modalidade: ev.modalidade, cor: ev.cor, laudo: ev.tipo === "avaliacao" || ev.tipo === "anamnese" || !!ev.sessaoId,
      passada: ev.fim.getTime() < agora, evolucao: e ? resumoEv(e) : null,
    };
  });
  for (const e of evolucoes) {
    if (usadas.has(e.id)) continue;
    itens.push({ chave: `v-${e.id}`, eventoId: null as never, inicio: e.dataHora, fim: e.dataHora, titulo: "Evolução registrada", tipo: "sessao", modalidade: null, cor: null, laudo: false, passada: e.dataHora.getTime() < agora, evolucao: resumoEv(e) });
  }
  itens.sort((a, b) => b.inicio.getTime() - a.inicio.getTime());
  res.json({
    itens,
    totais: {
      proximas: itens.filter((i) => !i.passada).length,
      historico: itens.filter((i) => i.passada).length,
      evolucoesFaltando: itens.filter((i) => i.passada && !i.evolucao?.temTexto && !(i.evolucao?.status === "FINALIZADA")).length,
    },
  });
}));
