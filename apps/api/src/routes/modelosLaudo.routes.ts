import { EscopoTeste, type ModeloLaudo } from "@prisma/client";
import { Router } from "express";
import mammoth from "mammoth";
import { z } from "zod";
import { carregarAplicacoesLaudo, idadeEmTexto } from "../lib/laudo/carregar";
import { DOMINIOS, GRUPOS } from "../lib/laudo/dominios";
import { gerarDocxLaudoCompleto, type DadosLaudoCompleto } from "../lib/laudo/gerarDocxCompleto";
import { montarEstruturaLaudo } from "../lib/laudo/montar";
import { importarLaudoWord } from "../lib/laudo/importarWord";
import { gerarWordDeExemplo, marcadoresDoArquivo, preencherModeloWord, type TesteDoGuia } from "../lib/laudo/modeloWord";
import { estruturaValida, MARCADORES, ROTULO_TIPO, TIPOS_SECAO, type EstruturaModelo, type TipoModelo } from "../lib/laudo/modelos";
import { prisma } from "../lib/prisma";
import { asyncHandler, validateBody } from "../lib/validate";

export const modelosLaudoRouter = Router();

const ehAdmin = (req: { profissional?: { papel: string } }) => req.profissional?.papel === "ADMIN";
const TIPOS = Object.keys(ROTULO_TIPO) as TipoModelo[];

// o que o usuário enxerga: modelos do sistema + os da clínica (os da clínica toda e os dele; o admin vê todos)
const visiveis = (req: { profissional?: { clinicaId: string; sub: string; papel: string } }) => ({
  ativo: true,
  OR: [{ sistema: true }, { clinicaId: req.profissional!.clinicaId, ...(ehAdmin(req) ? {} : { OR: [{ profissionalId: null }, { profissionalId: req.profissional!.sub }] }) }],
});

function resumo(m: ModeloLaudo, padraoId: string | null) {
  return { id: m.id, nome: m.nome, tipo: m.tipo, rotuloTipo: ROTULO_TIPO[m.tipo as TipoModelo] ?? m.tipo, descricao: m.descricao, fonte: m.fonte, sistema: m.sistema, escopo: m.sistema ? "sistema" : m.profissionalId ? "profissional" : "clinica", origemId: m.origemId, temArquivoWord: !!m.arquivoDocx, ehPadrao: m.id === padraoId, estrutura: m.estrutura as unknown as EstruturaModelo, atualizadoEm: m.atualizadoEm };
}

async function idPadrao(req: { profissional?: { clinicaId: string; sub: string } }): Promise<string | null> {
  const [p, c] = await Promise.all([
    prisma.profissional.findUnique({ where: { id: req.profissional!.sub }, select: { modeloLaudoPadraoId: true } }),
    prisma.clinica.findUnique({ where: { id: req.profissional!.clinicaId }, select: { modeloLaudoPadraoId: true } }),
  ]);
  return p?.modeloLaudoPadraoId ?? c?.modeloLaudoPadraoId ?? "sistema-laudo-neuro";
}

async function buscar(id: string, req: Parameters<typeof visiveis>[0]) {
  return prisma.modeloLaudo.findFirst({ where: { id, ...visiveis(req) } });
}

const SOMENTE_LEITURA = "Este é um modelo do sistema e não pode ser alterado. Salve uma cópia com outro nome: ela passa a ser sua e o original continua intacto.";

modelosLaudoRouter.get("/", asyncHandler(async (req, res) => {
  const [lista, padrao] = await Promise.all([prisma.modeloLaudo.findMany({ where: visiveis(req), orderBy: [{ sistema: "desc" }, { nome: "asc" }] }), idPadrao(req)]);
  res.json(lista.map((m) => resumo(m, padrao)));
}));

modelosLaudoRouter.get("/marcadores", (_req, res) => {
  res.json({ marcadores: MARCADORES, tiposDeSecao: TIPOS_SECAO, tiposDeModelo: TIPOS.map((t) => ({ valor: t, rotulo: ROTULO_TIPO[t] })) });
});

// Domínios padrão do laudo (com o que o sistema já preenche sozinho) para o editor mostrar e renomear
modelosLaudoRouter.get("/dominios-padrao", (_req, res) => {
  res.json(DOMINIOS.map((d) => ({ chave: d.chave, titulo: d.titulo, intro: d.intro ?? "", testes: [...new Set(GRUPOS.filter((g) => g.dominio === d.chave).flatMap((g) => [...g.itens.map((i) => i.teste), ...(g.blocos ?? []).map((b) => b.teste)]))] })));
});

// Biblioteca de blocos: tudo que cada teste pode colocar no laudo — tabelas e gráficos do layout, linhas de resultado (testes de planilha) e subtestes/índices (testes por campo)
modelosLaudoRouter.get("/biblioteca", asyncHandler(async (_req, res) => {
  const testes = await prisma.teste.findMany({ where: { escopo: EscopoTeste.FIXO }, select: { sigla: true, nome: true, algoritmoCorrecao: true }, orderBy: { sigla: "asc" } });
  type Alg = { layout?: { tabelas?: Array<{ titulo: string; linhas?: Array<{ rotulo: string; valores: Array<string | null> }> }>; graficos?: Array<{ titulo: string }> }; campos?: Array<{ chave: string; label?: string }>; camposCalculados?: Array<{ chave: string; label?: string }> };
  const ruido = (r: string) => !r || r.startsWith("=") || r.length < 2 || r.length > 90 || /^\d+([.,]\d+)?$/.test(r) || /:\s*$/.test(r);
  res.json(testes.map((t) => {
    const alg = (t.algoritmoCorrecao as Alg | null) ?? {};
    const unico = (a: string[]) => [...new Set(a.filter(Boolean))];
    const linhas = unico((alg.layout?.tabelas ?? []).flatMap((x) => (x.linhas ?? []).filter((l) => l.valores.some(Boolean)).map((l) => l.rotulo.replace(/\s+/g, " ").trim()))).filter((r) => !ruido(r)).slice(0, 120);
    const campos = [...(alg.campos ?? []), ...(alg.camposCalculados ?? [])].map((c) => ({ chave: c.chave, label: c.label ?? c.chave }));
    return { sigla: t.sigla, nome: t.nome, tabelas: unico((alg.layout?.tabelas ?? []).map((x) => x.titulo)), graficos: unico((alg.layout?.graficos ?? []).map((x) => x.titulo)), linhas, campos };
  }));
}));

// Word de exemplo com o guia de marcadores (e os marcadores prontos dos testes do modelo, quando há modelo)
modelosLaudoRouter.get("/guia-word", asyncHandler(async (req, res) => {
  const m = typeof req.query.modeloId === "string" ? await buscar(req.query.modeloId, req) : null;
  const est = (m?.estrutura as unknown as EstruturaModelo | undefined) ?? null;
  const siglas = est?.testes ?? [];
  const testes = siglas.length ? await prisma.teste.findMany({ where: { escopo: EscopoTeste.FIXO, sigla: { in: siglas } }, select: { sigla: true, nome: true, algoritmoCorrecao: true }, orderBy: { sigla: "asc" } }) : [];
  type Alg = { layout?: { tabelas?: Array<{ titulo: string }>; graficos?: Array<{ titulo: string }> }; campos?: Array<{ chave: string; label?: string }>; camposCalculados?: Array<{ chave: string; label?: string }> };
  const unico = (a: string[]) => [...new Set(a.filter(Boolean))];
  const guia: TesteDoGuia[] = testes.map((t) => { const alg = (t.algoritmoCorrecao as Alg | null) ?? {}; return { sigla: t.sigla, nome: t.nome, tabelas: unico((alg.layout?.tabelas ?? []).map((x) => x.titulo)), graficos: unico((alg.layout?.graficos ?? []).map((x) => x.titulo)), campos: [...(alg.campos ?? []), ...(alg.camposCalculados ?? [])].map((c) => ({ chave: c.chave, label: c.label ?? c.chave })) }; });
  const buffer = await gerarWordDeExemplo(m?.nome ?? "seu modelo", est, guia);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.setHeader("Content-Disposition", 'attachment; filename="word-de-exemplo-com-marcadores.docx"');
  res.send(buffer);
}));

// Pré-visualização do modelo (mesmo Word, convertido em HTML), com a estrutura que está na tela, mesmo sem salvar.
// Sem paciente: dados fictícios (as tabelas e gráficos dos testes só aparecem com um paciente que fez os testes).
modelosLaudoRouter.post("/previa", validateBody(z.object({ estrutura: z.unknown(), pacienteId: z.string().uuid().nullable().optional(), modeloId: z.string().nullable().optional() })), asyncHandler(async (req, res) => {
  const erro = estruturaValida(req.body.estrutura);
  if (erro) { res.status(400).json({ error: `Estrutura inválida: ${erro}` }); return; }
  const estrutura = req.body.estrutura as EstruturaModelo;
  const clinicaId = req.profissional!.clinicaId;
  const [clinica, prof, perfil] = await Promise.all([
    prisma.clinica.findUnique({ where: { id: clinicaId } }),
    prisma.profissional.findUnique({ where: { id: req.profissional!.sub } }),
    prisma.perfilDeAtuacao.findUnique({ where: { profissionalId: req.profissional!.sub } }),
  ]);
  if (!clinica || !prof) { res.status(404).json({ error: "Clínica ou profissional não encontrado" }); return; }
  const paciente = req.body.pacienteId ? await prisma.paciente.findFirst({ where: { id: req.body.pacienteId, clinicaId } }) : null;
  if (req.body.pacienteId && !paciente) { res.status(400).json({ error: "Paciente não encontrado" }); return; }
  const apps = paciente ? await carregarAplicacoesLaudo(paciente.id) : [];
  const ultimo = paciente ? await prisma.laudo.findFirst({ where: { pacienteId: paciente.id }, orderBy: { criadoEm: "desc" } }) : null;
  const sistema = perfil?.sistemaClassificacaoPercentil ?? "MIOTTO_2017";
  const nome = paciente?.nome ?? "Maria Exemplo da Silva";
  const montado = apps.length ? montarEstruturaLaudo(apps, { sistema, primeiroNome: nome.split(" ")[0], config: estrutura }) : null;
  const ref = apps.length ? new Date(Math.max(...apps.map((a) => a.dataSessao.getTime()))) : new Date();
  const nascimento = paciente?.dataNascimento ?? new Date("1990-05-12T00:00:00Z");
  const ex = (t: string) => `[${t}]`;
  const dados: DadosLaudoCompleto = {
    clinica: { nome: clinica.nomeFantasia || clinica.razaoSocial, endereco: clinica.endereco, bairro: clinica.bairro, cidade: clinica.cidade, estado: clinica.estado, cep: clinica.cep, telefone: clinica.telefone, whatsapp: clinica.whatsapp, instagram: clinica.instagram, slogan: clinica.slogan, logoUrl: clinica.logoUrl, marcaDaguaUrl: clinica.marcaDaguaUrl, corPrimaria: clinica.corPrimaria, corSecundaria: clinica.corSecundaria },
    profissional: { nome: prof.nome, crp: prof.crp, email: prof.email, formacao: prof.formacao, especialidades: prof.especialidades, assinaturaUrl: prof.assinaturaUrl, tituloLaudo: prof.tituloLaudo },
    paciente: { nome, cpf: paciente?.cpf ?? "000.000.000-00", dataNascimento: nascimento, idadeTexto: idadeEmTexto(nascimento, ref) },
    laudo: {
      descricaoDemanda: ultimo?.descricaoDemanda || ex("Descrição da demanda: escrita para cada paciente."),
      anamnese: ultimo?.anamnese || ex("Anamnese: montada do formulário do paciente."),
      observacaoClinica: ultimo?.observacaoClinica || ex("Observação clínica."),
      procedimento: montado?.procedimento || ex("Instrumentos: montados a partir dos testes lançados."),
      analise: montado?.analise || ultimo?.analise || ex("Análise por domínios: montada a partir dos testes lançados."),
      conclusao: ultimo?.conclusao || ex("Conclusão: escrita para cada paciente."),
      referencias: montado?.referencias || ultimo?.referencias || ex("Referências dos testes usados."),
      iaUtilizada: false, interpretacoes: (ultimo?.interpretacoes as Record<string, string> | null) ?? {}, hipoteseDiagnostica: ultimo?.hipoteseDiagnostica ?? "", secoesExtras: (ultimo?.secoesExtras as Record<string, string> | null) ?? {},
    },
    modelo: estrutura, aplicacoes: apps, sistema, data: new Date(),
  };
  const salvo = req.body.modeloId ? await buscar(req.body.modeloId, req) : null;
  const buffer = salvo?.arquivoDocx
    ? await preencherModeloWord(salvo.arquivoDocx, estrutura, { demanda: dados.laudo.descricaoDemanda, anamnese: dados.laudo.anamnese, observacao: dados.laudo.observacaoClinica, instrumentos: dados.laudo.procedimento, analise: dados.laudo.analise, conclusao: dados.laudo.conclusao, referencias: dados.laudo.referencias, extras: dados.laudo.secoesExtras ?? {} }, dados)
    : await gerarDocxLaudoCompleto(dados);
  const { value } = await mammoth.convertToHtml({ buffer });
  res.json({ html: value, comPaciente: !!paciente, usaArquivoWord: !!salvo?.arquivoDocx, testes: apps.length });
}));

const corpoModelo = z.object({
  nome: z.string().trim().min(2, "Dê um nome ao modelo").max(120),
  tipo: z.string().refine((t) => TIPOS.includes(t as TipoModelo), "tipo de modelo inválido").default("PERSONALIZADO"),
  descricao: z.string().max(2000).nullable().optional(),
  origemId: z.string().nullable().optional(),
  escopo: z.enum(["profissional", "clinica"]).default("profissional"),
  estrutura: z.unknown(),
  tornarPadrao: z.boolean().optional(),
});

// "Salvar como": cria um modelo da clínica/profissional (a partir de um do sistema ou de outro) com um novo nome
modelosLaudoRouter.post("/", validateBody(corpoModelo), asyncHandler(async (req, res) => {
  const erro = estruturaValida(req.body.estrutura);
  if (erro) { res.status(400).json({ error: `Estrutura inválida: ${erro}` }); return; }
  if (req.body.escopo === "clinica" && !ehAdmin(req)) { res.status(403).json({ error: "Só o administrador grava modelos para a clínica toda." }); return; }
  const donoId = req.body.escopo === "clinica" ? null : req.profissional!.sub;
  const repetido = await prisma.modeloLaudo.findFirst({ where: { ativo: true, nome: { equals: req.body.nome, mode: "insensitive" }, OR: [{ sistema: true }, { clinicaId: req.profissional!.clinicaId, profissionalId: donoId }] } });
  if (repetido) { res.status(409).json({ error: repetido.sistema ? "Esse nome é de um modelo do sistema. Escolha outro nome para o seu modelo." : "Você já tem um modelo com esse nome. Escolha outro." }); return; }
  if (req.body.origemId && !(await buscar(req.body.origemId, req))) { res.status(400).json({ error: "Modelo de origem não encontrado." }); return; }
  const origem = req.body.origemId ? await prisma.modeloLaudo.findUnique({ where: { id: req.body.origemId } }) : null;
  const m = await prisma.modeloLaudo.create({ data: { clinicaId: req.profissional!.clinicaId, profissionalId: donoId, nome: req.body.nome, tipo: req.body.tipo, descricao: req.body.descricao ?? origem?.descricao ?? null, fonte: origem?.fonte ?? null, origemId: req.body.origemId ?? null, estrutura: req.body.estrutura as object, arquivoDocx: origem?.arquivoDocx ?? null } });
  if (req.body.tornarPadrao) await definirPadrao(m, req);
  res.status(201).json(resumo(m, await idPadrao(req)));
}));

async function definirPadrao(m: ModeloLaudo, req: Parameters<typeof visiveis>[0]) {
  if (m.clinicaId && !m.profissionalId && ehAdmin(req)) await prisma.clinica.update({ where: { id: req.profissional!.clinicaId }, data: { modeloLaudoPadraoId: m.id } });
  await prisma.profissional.update({ where: { id: req.profissional!.sub }, data: { modeloLaudoPadraoId: m.id } });
}

modelosLaudoRouter.get("/:id", asyncHandler(async (req, res) => {
  const m = await buscar(req.params.id, req);
  if (!m) { res.status(404).json({ error: "Modelo não encontrado" }); return; }
  res.json(resumo(m, await idPadrao(req)));
}));

modelosLaudoRouter.put("/:id", validateBody(corpoModelo.partial().omit({ escopo: true, origemId: true })), asyncHandler(async (req, res) => {
  const m = await buscar(req.params.id, req);
  if (!m) { res.status(404).json({ error: "Modelo não encontrado" }); return; }
  if (m.sistema) { res.status(403).json({ error: SOMENTE_LEITURA }); return; }
  if (m.profissionalId && m.profissionalId !== req.profissional!.sub && !ehAdmin(req)) { res.status(403).json({ error: "Este modelo é de outro profissional." }); return; }
  if (!m.profissionalId && !ehAdmin(req)) { res.status(403).json({ error: "Só o administrador altera modelos da clínica toda. Salve uma cópia com outro nome." }); return; }
  if (req.body.estrutura !== undefined) { const erro = estruturaValida(req.body.estrutura); if (erro) { res.status(400).json({ error: `Estrutura inválida: ${erro}` }); return; } }
  if (req.body.nome && req.body.nome.toLowerCase() !== m.nome.toLowerCase()) {
    const repetido = await prisma.modeloLaudo.findFirst({ where: { ativo: true, id: { not: m.id }, nome: { equals: req.body.nome, mode: "insensitive" }, OR: [{ sistema: true }, { clinicaId: m.clinicaId, profissionalId: m.profissionalId }] } });
    if (repetido) { res.status(409).json({ error: "Já existe um modelo com esse nome." }); return; }
  }
  const { tornarPadrao, ...resto } = req.body;
  const atualizado = await prisma.modeloLaudo.update({ where: { id: m.id }, data: { ...resto, estrutura: resto.estrutura as object | undefined } });
  if (tornarPadrao) await definirPadrao(atualizado, req);
  res.json(resumo(atualizado, await idPadrao(req)));
}));

// escolhe o modelo padrão do próprio profissional (qualquer modelo visível, inclusive os do sistema); o admin pode ainda definir o da clínica
modelosLaudoRouter.post("/:id/padrao", validateBody(z.object({ paraClinica: z.boolean().optional() })), asyncHandler(async (req, res) => {
  const m = await buscar(req.params.id, req);
  if (!m) { res.status(404).json({ error: "Modelo não encontrado" }); return; }
  if (req.body.paraClinica) {
    if (!ehAdmin(req)) { res.status(403).json({ error: "Só o administrador define o padrão da clínica." }); return; }
    await prisma.clinica.update({ where: { id: req.profissional!.clinicaId }, data: { modeloLaudoPadraoId: m.id } });
  } else await prisma.profissional.update({ where: { id: req.profissional!.sub }, data: { modeloLaudoPadraoId: m.id } });
  res.json({ ok: true, padraoId: await idPadrao(req) });
}));

// "apagar" = desativar: os laudos que já usam o modelo continuam saindo com ele
modelosLaudoRouter.delete("/:id", asyncHandler(async (req, res) => {
  const m = await buscar(req.params.id, req);
  if (!m) { res.status(404).json({ error: "Modelo não encontrado" }); return; }
  if (m.sistema) { res.status(403).json({ error: SOMENTE_LEITURA }); return; }
  if ((m.profissionalId && m.profissionalId !== req.profissional!.sub && !ehAdmin(req)) || (!m.profissionalId && !ehAdmin(req))) { res.status(403).json({ error: "Você não pode apagar este modelo." }); return; }
  await prisma.modeloLaudo.update({ where: { id: m.id }, data: { ativo: false } });
  await prisma.profissional.updateMany({ where: { modeloLaudoPadraoId: m.id }, data: { modeloLaudoPadraoId: null } });
  await prisma.clinica.updateMany({ where: { modeloLaudoPadraoId: m.id }, data: { modeloLaudoPadraoId: null } });
  res.json({ ok: true });
}));

// ---- Fase 3: importar um laudo em Word e propor o modelo (não grava: o editor revisa e salva) ----
modelosLaudoRouter.post("/importar-word", validateBody(z.object({ arquivoBase64: z.string().min(100) })), asyncHandler(async (req, res) => {
  const buffer = Buffer.from(req.body.arquivoBase64.replace(/^data:[^,]+,/, ""), "base64");
  if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) { res.status(400).json({ error: "O arquivo precisa ser um documento Word (.docx)." }); return; }
  const catalogo = await prisma.teste.findMany({ where: { escopo: EscopoTeste.FIXO }, select: { sigla: true, nome: true } });
  try { res.json(await importarLaudoWord(buffer, catalogo)); } catch (e) { res.status(422).json({ error: e instanceof Error ? e.message : "Não consegui ler o arquivo." }); }
}));

// ---- Fase 4: modelo Word da clínica com marcadores {{...}} ----
modelosLaudoRouter.put("/:id/arquivo-word", validateBody(z.object({ arquivoBase64: z.string().min(100) })), asyncHandler(async (req, res) => {
  const m = await buscar(req.params.id, req);
  if (!m) { res.status(404).json({ error: "Modelo não encontrado" }); return; }
  if (m.sistema) { res.status(403).json({ error: SOMENTE_LEITURA }); return; }
  if ((m.profissionalId && m.profissionalId !== req.profissional!.sub && !ehAdmin(req)) || (!m.profissionalId && !ehAdmin(req))) { res.status(403).json({ error: "Você não pode alterar este modelo." }); return; }
  const base64 = req.body.arquivoBase64.replace(/^data:[^,]+,/, "");
  const buf = Buffer.from(base64, "base64");
  if (buf[0] !== 0x50 || buf[1] !== 0x4b) { res.status(400).json({ error: "O arquivo precisa ser um documento Word (.docx)." }); return; }
  let marcadores: string[];
  try { marcadores = await marcadoresDoArquivo(base64); } catch { res.status(422).json({ error: "Não consegui abrir o arquivo Word." }); return; }
  const conhecidos = new Set([...MARCADORES.map((x) => x.marcador), ...(m.estrutura as unknown as EstruturaModelo).secoes.map((s) => `secao.${s.id}`)]);
  await prisma.modeloLaudo.update({ where: { id: m.id }, data: { arquivoDocx: base64 } });
  res.json({ ok: true, marcadores, desconhecidos: marcadores.filter((x) => !conhecidos.has(x)) });
}));

modelosLaudoRouter.delete("/:id/arquivo-word", asyncHandler(async (req, res) => {
  const m = await buscar(req.params.id, req);
  if (!m) { res.status(404).json({ error: "Modelo não encontrado" }); return; }
  if (m.sistema || (m.profissionalId && m.profissionalId !== req.profissional!.sub && !ehAdmin(req)) || (!m.profissionalId && !ehAdmin(req))) { res.status(403).json({ error: "Você não pode alterar este modelo." }); return; }
  await prisma.modeloLaudo.update({ where: { id: m.id }, data: { arquivoDocx: null } });
  res.json({ ok: true });
}));

modelosLaudoRouter.get("/:id/arquivo-word", asyncHandler(async (req, res) => {
  const m = await buscar(req.params.id, req);
  if (!m?.arquivoDocx) { res.status(404).json({ error: "Este modelo não tem arquivo Word." }); return; }
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.setHeader("Content-Disposition", `attachment; filename="modelo-${m.nome.replace(/[^\w]+/g, "-").toLowerCase()}.docx"`);
  res.send(Buffer.from(m.arquivoDocx, "base64"));
}));
