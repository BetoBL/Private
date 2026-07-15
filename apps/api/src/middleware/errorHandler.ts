import { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Rota não encontrada" });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Dados inválidos", detalhes: err.flatten() });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      res.status(404).json({ error: "Registro não encontrado" });
      return;
    }
    if (err.code === "P2002") {
      res.status(409).json({ error: `Valor duplicado no campo: ${(err.meta?.target as string[])?.join(", ")}` });
      return;
    }
    if (err.code === "P2003") {
      res.status(400).json({ error: "Referência inválida (ID relacionado não existe)" });
      return;
    }
  }

  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor" });
}
