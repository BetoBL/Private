import type { PapelProfissional } from "@prisma/client";
import jwt from "jsonwebtoken";

function obterSegredo(): string {
  const segredo = process.env.JWT_SECRET;
  if (!segredo) {
    throw new Error("JWT_SECRET não definido no ambiente");
  }
  return segredo;
}

const JWT_SECRET = obterSegredo();
const EXPIRA_EM = "7d";

export interface TokenPayload {
  sub: string; // profissionalId
  clinicaId: string;
  email: string;
  papel: PapelProfissional;
}

export function gerarToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRA_EM });
}

export function verificarToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}
