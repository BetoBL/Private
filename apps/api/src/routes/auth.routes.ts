import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { gerarToken } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

// Hash "morto" (sem correspondência possível) usado quando o e-mail não existe,
// pra o bcrypt.compare sempre rodar e o tempo de resposta não vazar se o
// e-mail está cadastrado (timing attack de enumeração de usuário).
const HASH_INEXISTENTE = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8i8Zc0mFwrY2rTvJ0oB7HUv6qJt8Iu";

export const authRouter = Router();

authRouter.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, senha } = req.body;

    const profissional = await prisma.profissional.findUnique({ where: { email } });
    const senhaValida = await bcrypt.compare(senha, profissional?.senhaHash ?? HASH_INEXISTENTE);

    if (!profissional || !senhaValida) {
      res.status(401).json({ error: "E-mail ou senha inválidos" });
      return;
    }

    const token = gerarToken({
      sub: profissional.id,
      clinicaId: profissional.clinicaId,
      email: profissional.email,
      papel: profissional.papel,
    });
    res.json({
      token,
      profissional: {
        id: profissional.id,
        clinicaId: profissional.clinicaId,
        nome: profissional.nome,
        email: profissional.email,
        crp: profissional.crp,
        papel: profissional.papel,
      },
    });
  })
);
