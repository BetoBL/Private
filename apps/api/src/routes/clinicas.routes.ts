import { Router } from "express";
import { z } from "zod";
import { exigirAdmin, exigirAutenticacao } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

// Aceita tanto o CNPJ numérico atual (14 dígitos) quanto o novo modelo alfanumérico da
// Receita Federal (rollout previsto para o fim de julho/2026): os 12 primeiros caracteres
// podem ser letra ou dígito, os 2 dígitos verificadores finais continuam numéricos. Valida
// só o formato/máscara — o dígito verificador muda de algoritmo entre os dois modelos, então
// não travamos nisso aqui.
const CNPJ_REGEX = /^[A-Z0-9]{2}\.[A-Z0-9]{3}\.[A-Z0-9]{3}\/[A-Z0-9]{4}-\d{2}$/;

// imagem do papel timbrado: link http(s) ou data URL (png/jpeg/webp) de até ~2 MB; "" limpa
const imagem = z
  .string()
  .refine((v) => v === "" || /^https?:\/\//.test(v) || /^data:image\/(png|jpe?g|webp);base64,/.test(v), "Imagem inválida (use PNG, JPEG ou WebP)")
  .refine((v) => v.length <= 2_800_000, "Imagem grande demais (máx. ~2 MB)")
  .optional();

const clinicaCreateSchema = z.object({
  razaoSocial: z.string().min(1),
  nomeFantasia: z.string().optional(),
  cnpj: z
    .string()
    .refine((v) => v === "" || CNPJ_REGEX.test(v), "CNPJ em formato inválido (use XX.XXX.XXX/XXXX-XX)")
    .optional(),
  endereco: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
  telefone: z.string().optional(),
  logoUrl: imagem,
  marcaDaguaUrl: imagem,
  slogan: z.string().optional(),
  instagram: z.string().optional(),
  whatsapp: z.string().optional(),
  corPrimaria: z.string().optional(),
  corSecundaria: z.string().optional(),
});

const clinicaUpdateSchema = clinicaCreateSchema.partial();

export const clinicasRouter = Router();

// Pública — passo 1 do fluxo de "criar minha conta" (clínica + primeiro profissional).
clinicasRouter.post(
  "/",
  validateBody(clinicaCreateSchema),
  asyncHandler(async (req, res) => {
    const clinica = await prisma.clinica.create({ data: req.body });
    res.status(201).json(clinica);
  })
);

// Daqui pra baixo exige login — e só enxerga/edita a própria clínica.
clinicasRouter.use(exigirAutenticacao);

clinicasRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const clinicas = await prisma.clinica.findMany({
      where: { id: req.profissional!.clinicaId },
      orderBy: { criadoEm: "desc" },
    });
    res.json(clinicas);
  })
);

clinicasRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    if (req.params.id !== req.profissional!.clinicaId) {
      res.status(403).json({ error: "Sem acesso a esta clínica" });
      return;
    }
    const clinica = await prisma.clinica.findUnique({ where: { id: req.params.id } });
    if (!clinica) {
      res.status(404).json({ error: "Clínica não encontrada" });
      return;
    }
    res.json(clinica);
  })
);

clinicasRouter.patch(
  "/:id",
  exigirAdmin,
  validateBody(clinicaUpdateSchema),
  asyncHandler(async (req, res) => {
    if (req.params.id !== req.profissional!.clinicaId) {
      res.status(403).json({ error: "Sem acesso a esta clínica" });
      return;
    }
    const clinica = await prisma.clinica.update({ where: { id: req.params.id }, data: req.body });
    res.json(clinica);
  })
);

clinicasRouter.delete(
  "/:id",
  exigirAdmin,
  asyncHandler(async (req, res) => {
    if (req.params.id !== req.profissional!.clinicaId) {
      res.status(403).json({ error: "Sem acesso a esta clínica" });
      return;
    }
    await prisma.clinica.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
