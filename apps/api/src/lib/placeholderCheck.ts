import { prisma } from "./prisma";

export async function pacienteTemTestePlaceholder(pacienteId: string): Promise<boolean> {
  const count = await prisma.aplicacaoDeTeste.count({
    where: { sessao: { pacienteId }, teste: { isPlaceholder: true } },
  });
  return count > 0;
}
