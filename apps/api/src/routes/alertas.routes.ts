import type { Request } from "express";
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/validate";

// Avisos de risco do profissional logado (administrador vê os da clínica toda).
export const alertasRouter = Router();
type Usuario = { sub: string; clinicaId: string; papel: string };
const dono = (req: Request) => { const me = req.profissional as Usuario; return { clinicaId: me.clinicaId, ...(me.papel === "ADMIN" ? {} : { profissionalId: me.sub }) }; };

alertasRouter.get("/", asyncHandler(async (req, res) => {
  const lista = await prisma.alertaRisco.findMany({ where: { ...dono(req), vistoEm: null }, orderBy: { criadoEm: "desc" }, take: 50 });
  const pacientes = await prisma.paciente.findMany({ where: { id: { in: lista.map((a) => a.pacienteId) } }, select: { id: true, nome: true } });
  const nome = new Map(pacientes.map((p) => [p.id, p.nome]));
  res.json(lista.map((a) => ({ id: a.id, pacienteId: a.pacienteId, paciente: nome.get(a.pacienteId) ?? "Paciente", origem: a.origem, criadoEm: a.criadoEm })));
}));

alertasRouter.post("/:id/visto", asyncHandler(async (req, res) => {
  const r = await prisma.alertaRisco.updateMany({ where: { id: req.params.id, ...dono(req), vistoEm: null }, data: { vistoEm: new Date() } });
  if (!r.count) { res.status(404).json({ error: "Aviso não encontrado" }); return; }
  res.status(204).end();
}));
