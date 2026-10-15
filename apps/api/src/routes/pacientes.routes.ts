import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

// String vazia (campo de formulário limpo) vira null; campo AUSENTE continua ausente — num PATCH
// parcial isso não pode apagar o dado que já existe.
function textoOuNull(max: number) {
  return z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), z.string().trim().max(max).nullable().optional());
}

const pacienteCreateSchema = z.object({
  profissionalId: z.string().uuid(),
  nome: z.string().min(1),
  dataNascimento: z.coerce.date(),
  sexo: z.enum(["MASCULINO", "FEMININO"]).optional(),
  fotoUrl: z.string().url().optional(),
  responsavelLegal: z.string().optional(),
  // CPF opcional; quando informado, precisa ter 11 dígitos (com ou sem pontuação). Vazio limpa.
  cpf: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), z.string().trim().refine((v) => v.replace(/\D/g, "").length === 11, "CPF precisa ter 11 dígitos").nullable().optional()),
  contato: z.string().optional(),
  escolaridade: z.string().optional(),
  fazLaudo: z.boolean().optional(),
  nomeSocial: textoOuNull(120),
  email: z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), z.string().trim().email("E-mail inválido").max(160).nullable().optional()),
  genero: textoOuNull(60),
  racaCor: textoOuNull(40),
  estadoCivil: textoOuNull(40),
  profissao: textoOuNull(80),
  tipoPublico: z.enum(["ADULTO", "CRIANCA_ADOLESCENTE"]).optional(),
  inicioTratamento: z.preprocess((v) => (v === "" ? null : v), z.coerce.date().nullable().optional()),
  endereco: z.object({ cep: textoOuNull(12), logradouro: textoOuNull(160), numero: textoOuNull(20), complemento: textoOuNull(80), bairro: textoOuNull(80), cidade: textoOuNull(80), uf: textoOuNull(2), pais: textoOuNull(60) }).nullable().optional(),
  moeda: z.enum(["BRL", "USD", "EUR"]).optional(),
  valorSessaoCentavos: z.number().int().min(0).max(100_000_000).nullable().optional(),
  responsavelFinanceiro: z.object({ nome: textoOuNull(160), celular: textoOuNull(30), vinculo: textoOuNull(40), recebeCobranca: z.boolean().optional(), recebeLembrete: z.boolean().optional(), documentoTipo: textoOuNull(10), documentoNumero: textoOuNull(30), enderecoIgual: z.boolean().optional(), endereco: z.object({ cep: textoOuNull(12), logradouro: textoOuNull(160), numero: textoOuNull(20), complemento: textoOuNull(80), bairro: textoOuNull(80), cidade: textoOuNull(80) }).optional() }).nullable().optional(),
  contatosEmergencia: z.array(z.object({ nome: z.string().trim().min(1).max(160), telefone: z.string().trim().max(30).default(""), vinculo: z.string().trim().max(40).default("") })).max(2).optional(),
  tratamentos: z.array(z.string().trim().min(1).max(160)).max(20).optional(),
  medicamentos: z.array(z.object({ nome: z.string().trim().min(1).max(120), dose: z.string().trim().max(40).default(""), unidade: z.string().trim().max(20).default("") })).max(30).optional(),
  // Plano de saúde. `null` limpa o campo (paciente particular); string vazia vinda de <input> vira null.
  convenioId: z.string().uuid().nullable().optional(),
  convenioNumeroCarteira: textoOuNull(60),
  convenioPlano: textoOuNull(120),
  convenioValidade: z.preprocess((v) => (v === "" ? null : v), z.coerce.date().nullable().optional()),
  convenioTitular: textoOuNull(200),
  // nota fiscal do paciente (vazio/null = padrão da clínica)
  nfModo: z.preprocess((v) => (v === "" ? null : v), z.enum(["POR_SESSAO", "POR_LAUDO", "MANUAL", "NAO_EMITE"]).nullable().optional()),
  nfQuando: z.preprocess((v) => (v === "" ? null : v), z.enum(["NA_COBRANCA", "NA_BAIXA", "MANUAL"]).nullable().optional()),
  nfEmNomeDe: z.preprocess((v) => (v === "" ? null : v), z.enum(["PACIENTE", "RESPONSAVEL", "OUTRO"]).nullable().optional()),
  nfTomadorNome: textoOuNull(200),
  nfTomadorDocumento: textoOuNull(20),
  nfTomadorEmail: textoOuNull(120),
  anamnese: z.record(z.string(), z.unknown()).optional(),
  preferenciasAgenda: z.record(z.string(), z.unknown()).optional(),
  // Resolução CFP nº 09/2024: consentimentoTDICData registra QUANDO o consentimento foi dado —
  // é sempre o servidor que carimba essa data (na transição para true), nunca o cliente.
  consentimentoTDIC: z.boolean().optional(),
});

const pacienteUpdateSchema = pacienteCreateSchema.partial();

export const pacientesRouter = Router();

// undefined/null (sem convênio ou limpando o campo) é válido; id informado precisa ser da clínica.
async function convenioDaClinica(convenioId: string | null | undefined, clinicaId: string): Promise<boolean> {
  if (!convenioId) return true;
  const convenio = await prisma.convenio.findUnique({ where: { id: convenioId } });
  return !!convenio && convenio.clinicaId === clinicaId;
}

function ehAdmin(req: { profissional?: { papel: string } }): boolean {
  return req.profissional?.papel === "ADMIN";
}

// clinicaId nunca vem do cliente — sempre a clínica do profissional autenticado
// (evita criar/mover paciente pra fora da própria clínica).
pacientesRouter.post(
  "/",
  validateBody(pacienteCreateSchema),
  asyncHandler(async (req, res) => {
    // Psicólogo comum só pode cadastrar paciente para si mesmo; admin pode atribuir a qualquer colega.
    if (!ehAdmin(req) && req.body.profissionalId !== req.profissional!.sub) {
      res.status(403).json({ error: "Você só pode cadastrar pacientes para si mesmo" });
      return;
    }
    const profissionalDestino = await prisma.profissional.findUnique({ where: { id: req.body.profissionalId } });
    if (!profissionalDestino || profissionalDestino.clinicaId !== req.profissional!.clinicaId) {
      res.status(400).json({ error: "profissionalId inválido para esta clínica" });
      return;
    }
    if (!(await convenioDaClinica(req.body.convenioId, req.profissional!.clinicaId))) {
      res.status(400).json({ error: "convenioId inválido para esta clínica" });
      return;
    }
    const paciente = await prisma.paciente.create({
      data: {
        ...req.body,
        clinicaId: req.profissional!.clinicaId,
        consentimentoTDICData: req.body.consentimentoTDIC ? new Date() : undefined,
      },
    });
    res.status(201).json(paciente);
  })
);

// Admin vê todos os pacientes da clínica; psicólogo comum só vê os seus.
pacientesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { profissionalId } = req.query;
    const admin = ehAdmin(req);
    const paciente = await prisma.paciente.findMany({
      where: {
        clinicaId: req.profissional!.clinicaId,
        profissionalId: admin ? (typeof profissionalId === "string" ? profissionalId : undefined) : req.profissional!.sub,
      },
      orderBy: { criadoEm: "desc" },
    });
    res.json(paciente);
  })
);

pacientesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const paciente = await prisma.paciente.findUnique({ where: { id: req.params.id } });
    if (!paciente || paciente.clinicaId !== req.profissional!.clinicaId) {
      res.status(404).json({ error: "Paciente não encontrado" });
      return;
    }
    if (!ehAdmin(req) && paciente.profissionalId !== req.profissional!.sub) {
      res.status(404).json({ error: "Paciente não encontrado" });
      return;
    }
    res.json(paciente);
  })
);

pacientesRouter.patch(
  "/:id",
  validateBody(pacienteUpdateSchema),
  asyncHandler(async (req, res) => {
    const existente = await prisma.paciente.findUnique({ where: { id: req.params.id } });
    if (!existente || existente.clinicaId !== req.profissional!.clinicaId) {
      res.status(404).json({ error: "Paciente não encontrado" });
      return;
    }
    const admin = ehAdmin(req);
    if (!admin && existente.profissionalId !== req.profissional!.sub) {
      res.status(404).json({ error: "Paciente não encontrado" });
      return;
    }
    if (req.body.profissionalId && req.body.profissionalId !== existente.profissionalId) {
      // Transferir paciente para outro profissional — só admin.
      if (!admin) {
        res.status(403).json({ error: "Apenas administradores podem transferir um paciente para outro profissional" });
        return;
      }
      const profissionalDestino = await prisma.profissional.findUnique({ where: { id: req.body.profissionalId } });
      if (!profissionalDestino || profissionalDestino.clinicaId !== req.profissional!.clinicaId) {
        res.status(400).json({ error: "profissionalId inválido para esta clínica" });
        return;
      }
    }
    if (!(await convenioDaClinica(req.body.convenioId, req.profissional!.clinicaId))) {
      res.status(400).json({ error: "convenioId inválido para esta clínica" });
      return;
    }
    // Carimba/limpa a data de consentimento só quando o valor realmente muda de estado —
    // reenviar "true" sem alterar nada não deve resetar a data original do consentimento.
    const dataAtualizacao: typeof req.body & { consentimentoTDICData?: Date | null } = { ...req.body };
    if (req.body.consentimentoTDIC !== undefined && req.body.consentimentoTDIC !== existente.consentimentoTDIC) {
      dataAtualizacao.consentimentoTDICData = req.body.consentimentoTDIC ? new Date() : null;
    }

    const paciente = await prisma.paciente.update({ where: { id: req.params.id }, data: dataAtualizacao });
    res.json(paciente);
  })
);

pacientesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existente = await prisma.paciente.findUnique({ where: { id: req.params.id } });
    if (!existente || existente.clinicaId !== req.profissional!.clinicaId) {
      res.status(404).json({ error: "Paciente não encontrado" });
      return;
    }
    if (!ehAdmin(req) && existente.profissionalId !== req.profissional!.sub) {
      res.status(404).json({ error: "Paciente não encontrado" });
      return;
    }
    await prisma.paciente.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
