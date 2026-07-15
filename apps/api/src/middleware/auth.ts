import type { NextFunction, Request, Response } from "express";
import { verificarToken } from "../lib/auth";

export function exigirAutenticacao(req: Request, res: Response, next: NextFunction) {
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

  req.profissional = payload;
  next();
}

// Usar depois de exigirAutenticacao. Administrador da clínica: gerencia profissionais,
// dados da clínica, e vê todos os pacientes (psicólogo comum só vê os próprios).
export function exigirAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.profissional?.papel !== "ADMIN") {
    res.status(403).json({ error: "Apenas administradores da clínica podem fazer isso" });
    return;
  }
  next();
}
