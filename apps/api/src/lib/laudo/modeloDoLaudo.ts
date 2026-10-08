import type { ModeloLaudo } from "@prisma/client";
import { prisma } from "../prisma";
import { estruturaDoSistema, MODELO_PADRAO_ID, type EstruturaModelo } from "./modelos";

export interface ModeloResolvido { id: string; nome: string; estrutura: EstruturaModelo; arquivoDocx: string | null }

// Modelo que vale para o laudo: o escolhido nele; senão o padrão do profissional, o da clínica ou o laudo neuropsicológico do sistema.
// Um modelo apagado (desativado) continua valendo para o laudo que já o usava.
export async function modeloDoLaudo(laudo: { modeloId: string | null }, profissionalId: string, clinicaId: string): Promise<ModeloResolvido> {
  const visivel = (id: string, ativo: boolean): Promise<ModeloLaudo | null> => prisma.modeloLaudo.findFirst({ where: { id, ...(ativo ? { ativo: true } : {}), OR: [{ sistema: true }, { clinicaId }] } });
  const [prof, clin] = await Promise.all([
    prisma.profissional.findUnique({ where: { id: profissionalId }, select: { modeloLaudoPadraoId: true } }),
    prisma.clinica.findUnique({ where: { id: clinicaId }, select: { modeloLaudoPadraoId: true } }),
  ]);
  let m: ModeloLaudo | null = null;
  if (laudo.modeloId) m = await visivel(laudo.modeloId, false);
  if (!m && prof?.modeloLaudoPadraoId) m = await visivel(prof.modeloLaudoPadraoId, true);
  if (!m && clin?.modeloLaudoPadraoId) m = await visivel(clin.modeloLaudoPadraoId, true);
  if (!m) m = await visivel(MODELO_PADRAO_ID, true);
  if (m) return { id: m.id, nome: m.nome, estrutura: m.estrutura as unknown as EstruturaModelo, arquivoDocx: m.arquivoDocx };
  return { id: MODELO_PADRAO_ID, nome: "Laudo neuropsicológico completo", estrutura: estruturaDoSistema(MODELO_PADRAO_ID)!, arquivoDocx: null }; // banco ainda sem os modelos do sistema
}
