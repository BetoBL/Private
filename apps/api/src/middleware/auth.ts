import type { NextFunction, Request, Response } from "express";
import { verificarToken } from "../lib/auth";
import { asyncHandler } from "../lib/validate";
import { prisma } from "../lib/prisma";

// Confere `papel` direto no banco em vez de confiar só na claim do JWT: um token emitido
// antes de uma promoção a admin (ou antes do campo `papel` existir) carrega um valor
// desatualizado, e como o token dura 7 dias isso rejeitaria um admin de verdade até ele
// deslogar e logar de novo. Resolvendo aqui uma vez, toda rota que lê req.profissional.papel
// (inclusive os helpers locais `ehAdmin(req)` espalhados pelas rotas) já recebe o valor atual.
export const exigirAutenticacao = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const cabecalho = req.headers.authorization;
  const token = cabecalho?.startsWith("Bearer ") ? cabecalho.slice("Bearer ".length) : null;
  if (!token) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }

  const payload = verificarToken(token);
  if (!payload) {
    res.status(401).json({ error: "Token inválido ou expirado" });
    return;
  }

  const atual = await prisma.profissional.findUnique({
    where: { id: payload.sub },
    select: { papel: true },
  });
  if (!atual) {
    res.status(401).json({ error: "Token inválido ou expirado" });
    return;
  }

  req.profissional = { ...payload, papel: atual.papel };
  next();
});

// Usar depois de exigirAutenticacao.
export function exigirAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.profissional?.papel !== "ADMIN") {
    res.status(403).json({ error: "Apenas administradores da clínica podem fazer isso" });
    return;
  }
  next();
}
