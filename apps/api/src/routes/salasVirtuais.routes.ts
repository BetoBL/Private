import type { Request } from "express";
import { Router } from "express";
import { z } from "zod";
import { estadoDoConsentimento } from "../lib/video/consentimento";
import { gravacaoPronta } from "../lib/video/gravacao";
import { configLivekit, nomeDaSala, novoSegredoDoLink, tokenDaSala, VideoIndisponivel } from "../lib/video/livekit";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

const router = Router();

// base do link que o paciente recebe: WEB_URL do servidor, senão a origem de quem pediu, senão o endereço local
export const baseDoSite = (req: Request) => (process.env.WEB_URL?.trim() || (req.headers.origin as string | undefined) || "http://localhost:5173").replace(/\/$/, "");
const linkDoPaciente = (req: Request, sala: { provedor: string; codigoSala: string; segredoPaciente: string | null }) =>
  sala.provedor === "LIVEKIT" && sala.segredoPaciente ? `${baseDoSite(req)}/atendimento/${sala.codigoSala}/${sala.segredoPaciente}` : null;

// Sala da sessão, só para quem pode: mesma clínica e, se não for administrador, o profissional responsável pela sessão
async function salaDoUsuario(req: Request, id: string) {
  const sala = await prisma.salaVirtual.findUnique({ where: { id }, include: { sessao: { include: { paciente: true } } } });
  if (!sala || sala.sessao.paciente.clinicaId !== req.profissional!.clinicaId) return null;
  if (req.profissional!.papel !== "ADMIN" && sala.sessao.profissionalId !== req.profissional!.sub) return null;
  return sala;
}

// O que o servidor tem configurado para videochamada (só leitura, não revela nenhum valor secreto)
router.get("/disponibilidade", asyncHandler(async (req, res) => {
  const cfg = configLivekit();
  const clinica = await prisma.clinica.findUnique({ where: { id: req.profissional!.clinicaId }, select: { planoVideo: true } });
  res.json({ videoDentroDoSistema: !!cfg, enderecoDoVideo: cfg ? new URL(cfg.url.replace(/^wss?:/, "https:")).host : null, linkDoPacienteUsa: baseDoSite(req), webUrlConfigurada: !!process.env.WEB_URL?.trim(), planoDaClinica: clinica?.planoVideo ?? "BASICO", gravacao: gravacaoPronta() });
}));

// Cria a sala da sessão. Com o LiveKit configurado a chamada acontece dentro do sistema; sem ele, cai no link público antigo.
router.post(
  "/",
  validateBody(z.object({ sessaoId: z.string().uuid() })),
  asyncHandler(async (req, res) => {
    const { sessaoId } = req.body;
    const clinicaId = req.profissional!.clinicaId;
    const sessao = await prisma.sessao.findUnique({ where: { id: sessaoId }, include: { paciente: true } });
    if (!sessao || sessao.paciente.clinicaId !== clinicaId) { res.status(404).json({ error: "Sessão não encontrada ou não pertence à sua clínica" }); return; }
    if (req.profissional!.papel !== "ADMIN" && sessao.profissionalId !== req.profissional!.sub) { res.status(403).json({ error: "Só o profissional responsável pela sessão cria a sala." }); return; }

    const existente = await prisma.salaVirtual.findFirst({ where: { sessaoId } });
    if (existente) { res.json({ ...existente, linkPaciente: linkDoPaciente(req, existente) }); return; }

    const codigoSala = nomeDaSala(clinicaId, sessaoId);
    const livekit = !!configLivekit();
    const sala = await prisma.salaVirtual.create({
      data: { sessaoId, codigoSala, urlJitsi: livekit ? `livekit:${codigoSala}` : `https://meet.jit.si/${codigoSala}`, provedor: livekit ? "LIVEKIT" : "JITSI", segredoPaciente: livekit ? novoSegredoDoLink() : null, inicioAgendado: sessao.dataHora },
    });
    res.status(201).json({ ...sala, linkPaciente: linkDoPaciente(req, sala) });
  })
);

router.get(
  "/sessao/:sessaoId",
  asyncHandler(async (req, res) => {
    const sessao = await prisma.sessao.findUnique({ where: { id: req.params.sessaoId }, include: { paciente: true } });
    if (!sessao || sessao.paciente.clinicaId !== req.profissional!.clinicaId) { res.status(404).json({ error: "Sessão não encontrada" }); return; }
    const salas = await prisma.salaVirtual.findMany({ where: { sessaoId: req.params.sessaoId }, orderBy: { criadoEm: "desc" } });
    res.json(salas.map((s) => ({ ...s, linkPaciente: linkDoPaciente(req, s) })));
  })
);

// Entrada do profissional na chamada: devolve o token do LiveKit, o plano da clínica, o link do paciente e o estado do consentimento.
router.get(
  "/:id/acesso",
  asyncHandler(async (req, res) => {
    const sala = await salaDoUsuario(req, req.params.id);
    if (!sala) { res.status(404).json({ error: "Sala não encontrada" }); return; }
    if (sala.provedor !== "LIVEKIT") { res.status(409).json({ error: "Esta sala usa o link público antigo. Crie uma nova sala para usar a chamada dentro do sistema.", urlJitsi: sala.urlJitsi }); return; }
    if (sala.statusSala === "encerrada") { res.status(409).json({ error: "Esta sala já foi encerrada." }); return; }
    const [clinica, profissional, consentimentos] = await Promise.all([
      prisma.clinica.findUnique({ where: { id: req.profissional!.clinicaId }, select: { planoVideo: true } }),
      prisma.profissional.findUnique({ where: { id: req.profissional!.sub }, select: { nome: true } }),
      prisma.consentimentoGravacao.findMany({ where: { salaId: sala.id } }),
    ]);
    try {
      const { token, url } = await tokenDaSala({ sala: sala.codigoSala, identidade: `profissional-${req.profissional!.sub}`, nome: profissional?.nome ?? "Profissional" });
      await prisma.salaVirtual.update({ where: { id: sala.id }, data: { profissionalPresente: true, statusSala: "em_andamento", inicioReal: sala.inicioReal ?? new Date() } });
      const ativa = await prisma.gravacao.findFirst({ where: { salaId: sala.id, status: "GRAVANDO" }, select: { id: true } });
      res.json({ token, url, plano: clinica?.planoVideo ?? "BASICO", gravacao: { ...gravacaoPronta(), ativaId: ativa?.id ?? null }, linkPaciente: linkDoPaciente(req, sala), paciente: sala.sessao.paciente.nome, consentimento: estadoDoConsentimento(consentimentos) });
    } catch (e) {
      if (e instanceof VideoIndisponivel) { res.status(503).json({ error: e.message }); return; }
      throw e;
    }
  })
);

// Estado do consentimento (para o painel do profissional atualizar enquanto espera o paciente)
router.get(
  "/:id/consentimento",
  asyncHandler(async (req, res) => {
    const sala = await salaDoUsuario(req, req.params.id);
    if (!sala) { res.status(404).json({ error: "Sala não encontrada" }); return; }
    const ativa = await prisma.gravacao.findFirst({ where: { salaId: sala.id, status: "GRAVANDO" }, select: { id: true } });
    res.json({ ...estadoDoConsentimento(await prisma.consentimentoGravacao.findMany({ where: { salaId: sala.id } })), gravandoId: ativa?.id ?? null });
  })
);

// Atualiza status de sala (ao entrar/sair)
router.patch(
  "/:id",
  validateBody(z.object({
    statusSala: z.enum(["agendada", "em_andamento", "encerrada"]).optional(),
    inicioReal: z.string().datetime().optional(),
    fimReal: z.string().datetime().optional(),
    profissionalPresente: z.boolean().optional(),
    pacientePresente: z.boolean().optional(),
  })),
  asyncHandler(async (req, res) => {
    const sala = await salaDoUsuario(req, req.params.id);
    if (!sala) { res.status(404).json({ error: "Sala não encontrada" }); return; }
    const atualizada = await prisma.salaVirtual.update({
      where: { id: sala.id },
      data: { statusSala: req.body.statusSala, inicioReal: req.body.inicioReal ? new Date(req.body.inicioReal) : undefined, fimReal: req.body.fimReal ? new Date(req.body.fimReal) : undefined, profissionalPresente: req.body.profissionalPresente, pacientePresente: req.body.pacientePresente },
    });
    res.json({ ...atualizada, linkPaciente: linkDoPaciente(req, atualizada) });
  })
);

export { router as salasVirtuaisRouter };
