import { prisma } from "../prisma";
import { enviarEmail } from "./email";

// Cria o aviso para o profissional responsável pelo paciente e tenta mandar e-mail (sem conteúdo clínico).
export async function avisarProfissional(pacienteId: string, origem: "DIARIO" | "ESCALA", origemId: string): Promise<void> {
  try {
    const p = await prisma.paciente.findUnique({ where: { id: pacienteId }, select: { id: true, nome: true, clinicaId: true, profissional: { select: { id: true, email: true } } } });
    if (!p) return;
    const a = await prisma.alertaRisco.create({ data: { clinicaId: p.clinicaId, profissionalId: p.profissional.id, pacienteId: p.id, origem, origemId } });
    const base = (process.env.WEB_URL || "").replace(/\/$/, "");
    const quando = origem === "DIARIO" ? "um registro no Diário" : "uma resposta numa escala";
    const texto = `Há ${quando} de ${p.nome} que merece a sua atenção.\n\nAbra a ficha para ver: ${base}/pacientes/${p.id}\n\nPor segurança, este e-mail não traz o conteúdo do registro.`;
    if (await enviarEmail(p.profissional.email, "MentEssence: um paciente precisa da sua atenção", texto)) await prisma.alertaRisco.update({ where: { id: a.id }, data: { emailEnviadoEm: new Date() } });
  } catch (e) { console.error("[alerta] não foi possível registrar o aviso:", (e as Error).message); }
}
