import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

export const financeiroRouter = Router();

type Req = { profissional?: { clinicaId: string; papel: string; sub: string } };
const ehAdmin = (req: Req) => req.profissional?.papel === "ADMIN";

// A clínica toda para ADMIN; os demais só veem cobranças dos próprios pacientes.
const escopo = (req: Req): Prisma.CobrancaWhereInput => ({
  clinicaId: req.profissional!.clinicaId,
  paciente: ehAdmin(req) ? {} : { profissionalId: req.profissional!.sub },
});

const data = z.preprocess((v) => (typeof v === "string" && v.length === 10 ? `${v}T00:00:00.000Z` : v), z.coerce.date());
const vazioNulo = <T extends z.ZodTypeAny>(s: T) => z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), s.nullable().optional());

const criarSchema = z.object({
  pacienteId: z.string().uuid(),
  sessaoId: vazioNulo(z.string().uuid()),
  convenioId: vazioNulo(z.string().uuid()),
  descricao: z.string().trim().min(1, "Informe a descrição"),
  valor: z.coerce.number().positive("O valor precisa ser maior que zero"),
  vencimento: data,
  observacoes: vazioNulo(z.string().trim()),
});
const editarSchema = criarSchema.omit({ pacienteId: true }).partial();
const baixaSchema = z.object({
  valorPago: z.coerce.number().min(0, "O valor pago não pode ser negativo"),
  pagoEm: data.optional(),
  formaPagamento: vazioNulo(z.string().trim()),
});

const incluir = { paciente: { select: { id: true, nome: true } }, convenio: { select: { id: true, nomeOperadora: true } } } as const;

async function cobrancaDoUsuario(req: Req & { params: { id: string } }) {
  return prisma.cobranca.findFirst({ where: { id: req.params.id, ...escopo(req) } });
}

// "AAAA-MM" → [início, fim) do mês
function intervaloDoMes(mes: unknown): { gte: Date; lt: Date } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(String(mes ?? ""));
  if (!m) return null;
  const a = Number(m[1]), b = Number(m[2]);
  return { gte: new Date(Date.UTC(a, b - 1, 1)), lt: new Date(Date.UTC(a, b, 1)) };
}

financeiroRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status, pacienteId, convenioId, mes, particular } = req.query as Record<string, string | undefined>;
    const intervalo = intervaloDoMes(mes);
    const lista = await prisma.cobranca.findMany({
      where: {
        ...escopo(req),
        ...(status ? { status } : {}),
        ...(pacienteId ? { pacienteId } : {}),
        ...(particular === "1" ? { convenioId: null } : convenioId ? { convenioId } : {}),
        ...(intervalo ? { vencimento: intervalo } : {}),
      },
      include: incluir,
      orderBy: [{ vencimento: "asc" }, { criadoEm: "asc" }],
      take: 500,
    });
    res.json(lista);
  })
);

// Totais do mês: o que ficou para receber, o que está atrasado (vencido e aberto, de qualquer mês) e o que entrou.
financeiroRouter.get(
  "/resumo",
  asyncHandler(async (req, res) => {
    const intervalo = intervaloDoMes(req.query.mes);
    if (!intervalo) {
      res.status(400).json({ error: "Informe o mês no formato AAAA-MM" });
      return;
    }
    const base = escopo(req);
    const hoje = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z");
    const soma = (x: { _sum: { valor?: Prisma.Decimal | null; valorPago?: Prisma.Decimal | null } }, campo: "valor" | "valorPago") => Number(x._sum[campo] ?? 0);
    const [aReceber, atrasadas, recebido, porConvenio] = await Promise.all([
      prisma.cobranca.aggregate({ where: { ...base, status: "ABERTA", vencimento: intervalo }, _sum: { valor: true }, _count: true }),
      prisma.cobranca.aggregate({ where: { ...base, status: "ABERTA", vencimento: { lt: hoje } }, _sum: { valor: true }, _count: true }),
      prisma.cobranca.aggregate({ where: { ...base, status: "PAGA", pagoEm: intervalo }, _sum: { valorPago: true }, _count: true }),
      prisma.cobranca.groupBy({ by: ["convenioId"], where: { ...base, status: "ABERTA" }, _sum: { valor: true }, _count: true }),
    ]);
    const convenios = await prisma.convenio.findMany({ where: { id: { in: porConvenio.map((p) => p.convenioId).filter((x): x is string => !!x) } }, select: { id: true, nomeOperadora: true } });
    res.json({
      aReceberNoMes: { total: soma(aReceber, "valor"), quantidade: aReceber._count },
      atrasado: { total: soma(atrasadas, "valor"), quantidade: atrasadas._count },
      recebidoNoMes: { total: soma(recebido, "valorPago"), quantidade: recebido._count },
      emAbertoPorOrigem: porConvenio.map((p) => ({ convenioId: p.convenioId, nome: p.convenioId ? convenios.find((c) => c.id === p.convenioId)?.nomeOperadora ?? "Convênio" : "Particular", total: soma(p, "valor"), quantidade: p._count })),
    });
  })
);

financeiroRouter.post(
  "/",
  validateBody(criarSchema),
  asyncHandler(async (req, res) => {
    const paciente = await prisma.paciente.findFirst({ where: { id: req.body.pacienteId, clinicaId: req.profissional!.clinicaId, ...(ehAdmin(req) ? {} : { profissionalId: req.profissional!.sub }) } });
    if (!paciente) {
      res.status(404).json({ error: "Paciente não encontrado" });
      return;
    }
    const criada = await prisma.cobranca.create({
      data: { ...req.body, clinicaId: req.profissional!.clinicaId, convenioId: req.body.convenioId ?? null, sessaoId: req.body.sessaoId ?? null },
      include: incluir,
    });
    res.status(201).json(criada);
  })
);

financeiroRouter.patch(
  "/:id",
  validateBody(editarSchema),
  asyncHandler(async (req, res) => {
    const existente = await cobrancaDoUsuario(req as never);
    if (!existente) {
      res.status(404).json({ error: "Cobrança não encontrada" });
      return;
    }
    const atualizada = await prisma.cobranca.update({ where: { id: existente.id }, data: req.body, include: incluir });
    res.json(atualizada);
  })
);

// Dar baixa: registra quanto entrou. Valor pago menor que o valor da cobrança fica visível como diferença (glosa/desconto).
financeiroRouter.post(
  "/:id/baixa",
  validateBody(baixaSchema),
  asyncHandler(async (req, res) => {
    const existente = await cobrancaDoUsuario(req as never);
    if (!existente) {
      res.status(404).json({ error: "Cobrança não encontrada" });
      return;
    }
    if (existente.status === "CANCELADA") {
      res.status(409).json({ error: "Esta cobrança está cancelada. Reabra antes de dar baixa." });
      return;
    }
    const hoje = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z");
    const paga = await prisma.cobranca.update({
      where: { id: existente.id },
      data: { status: "PAGA", valorPago: req.body.valorPago, pagoEm: req.body.pagoEm ?? hoje, formaPagamento: req.body.formaPagamento ?? null },
      include: incluir,
    });
    res.json(paga);
  })
);

// Desfaz a baixa ou o cancelamento: volta a ficar em aberto.
financeiroRouter.post(
  "/:id/reabrir",
  asyncHandler(async (req, res) => {
    const existente = await cobrancaDoUsuario(req as never);
    if (!existente) {
      res.status(404).json({ error: "Cobrança não encontrada" });
      return;
    }
    const aberta = await prisma.cobranca.update({ where: { id: existente.id }, data: { status: "ABERTA", valorPago: null, pagoEm: null, formaPagamento: null }, include: incluir });
    res.json(aberta);
  })
);

// "Apagar" = cancelar: o lançamento fica no histórico e pode ser reaberto.
financeiroRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existente = await cobrancaDoUsuario(req as never);
    if (!existente) {
      res.status(404).json({ error: "Cobrança não encontrada" });
      return;
    }
    await prisma.cobranca.update({ where: { id: existente.id }, data: { status: "CANCELADA" } });
    res.status(204).send();
  })
);
