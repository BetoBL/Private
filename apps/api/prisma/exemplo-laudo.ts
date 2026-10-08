// Caso FICTÍCIO para demonstração do laudo: copia da base LOCAL (onde o caso "Helena Exemplo Prado" foi montado) para o banco apontado
// por DATABASE_URL. Cria: um profissional de demonstração SEM acesso (senha aleatória, e-mail inválido), o tipo de atendimento
// "Avaliação neuropsicológica de adulto (modelo)", a paciente fictícia com 8 testes lançados e o laudo completo.
// Só PREENCHE o que está vazio no timbrado da clínica (logotipo, marca-d'água, frase, WhatsApp, Instagram); nada existente é sobrescrito.
//
//   ORIGEM_DATABASE_URL=postgresql://…local… npx tsx prisma/exemplo-laudo.ts --simular [--whatsapp "(11) 90000-0000"] [--instagram "@clinica"]
//   (sem --simular grava; com --refazer apaga a demonstração anterior antes)
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { EscopoTeste, PrismaClient } from "@prisma/client";

const args = process.argv.slice(2);
const flag = (n: string) => args.includes(n);
const valor = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const SIMULAR = flag("--simular");
const NOME = "Helena Exemplo Prado";
const EMAIL_DEMO = "demonstracao@mentessence.invalid";
const TESTES_DO_TIPO = ["WAIS-III", "RAVLT", "FDT", "BPA", "BFP", "SRS2-ADULTOS", "BAI", "BDI-II"];

const origem = new PrismaClient({ datasources: { db: { url: process.env.ORIGEM_DATABASE_URL } } });
const destino = new PrismaClient();

async function main() {
  if (!process.env.ORIGEM_DATABASE_URL) throw new Error("Informe ORIGEM_DATABASE_URL (banco local com o caso montado).");
  const host = (process.env.DATABASE_URL ?? "").replace(/^.*@/, "").replace(/\/.*$/, "");
  console.log(`Destino: ${host} — ${SIMULAR ? "SIMULAÇÃO" : "GRAVANDO"}`);

  // ---- origem ----
  const pac = await origem.paciente.findFirst({ where: { nome: NOME }, orderBy: { criadoEm: "desc" }, include: { clinica: true, profissional: true } });
  if (!pac) throw new Error(`Paciente "${NOME}" não encontrada na origem.`);
  const laudo = await origem.laudo.findFirst({ where: { pacienteId: pac.id }, orderBy: { criadoEm: "desc" } });
  if (!laudo) throw new Error("Laudo não encontrado na origem.");
  const sessoes = await origem.sessao.findMany({ where: { pacienteId: pac.id }, include: { aplicacoesTeste: { include: { teste: { select: { sigla: true } } } } }, orderBy: { dataHora: "asc" } });
  console.log(`Origem: 1 paciente, ${sessoes.length} sessão(ões), ${sessoes.reduce((s, x) => s + x.aplicacoesTeste.length, 0)} testes, 1 laudo`);

  // ---- destino: clínica ----
  const clinica = await destino.clinica.findFirst();
  if (!clinica) throw new Error("Nenhuma clínica no destino.");
  const existente = await destino.paciente.findFirst({ where: { clinicaId: clinica.id, nome: NOME } });
  if (existente && !flag("--refazer")) { console.log("A demonstração já existe no destino. Use --refazer para recriar."); return; }

  const branding = {
    ...(clinica.logoUrl ? {} : { logoUrl: pac.clinica.logoUrl }),
    ...(clinica.marcaDaguaUrl ? {} : { marcaDaguaUrl: pac.clinica.marcaDaguaUrl }),
    ...(clinica.slogan ? {} : { slogan: pac.clinica.slogan }),
    ...(clinica.whatsapp || !valor("--whatsapp") ? {} : { whatsapp: valor("--whatsapp") }),
    ...(clinica.instagram || !valor("--instagram") ? {} : { instagram: valor("--instagram") }),
  };
  console.log("Timbrado da clínica, campos a preencher (estavam vazios):", Object.keys(branding).join(", ") || "nenhum");
  const testesDestino = await destino.teste.findMany({ where: { escopo: EscopoTeste.FIXO, sigla: { in: TESTES_DO_TIPO } }, select: { id: true, sigla: true } });
  const idPorSigla = new Map(testesDestino.map((t) => [t.sigla, t.id]));
  const faltam = TESTES_DO_TIPO.filter((s) => !idPorSigla.has(s));
  if (faltam.length) throw new Error("Testes ausentes no destino: " + faltam.join(", "));
  if (SIMULAR) { console.log("Simulação concluída. Nada foi gravado."); return; }

  if (existente) {
    console.log("Removendo a demonstração anterior…");
    await destino.laudo.deleteMany({ where: { pacienteId: existente.id } });
    await destino.aplicacaoDeTeste.deleteMany({ where: { sessao: { pacienteId: existente.id } } });
    await destino.sessao.deleteMany({ where: { pacienteId: existente.id } });
    await destino.paciente.delete({ where: { id: existente.id } });
  }
  if (Object.keys(branding).length) await destino.clinica.update({ where: { id: clinica.id }, data: branding });

  // profissional de demonstração (sem acesso)
  let prof = await destino.profissional.findUnique({ where: { email: EMAIL_DEMO } });
  if (!prof) {
    prof = await destino.profissional.create({
      data: {
        clinicaId: clinica.id, nome: "Dra. Exemplo da Silva (demonstração)", crp: "06/000000", email: EMAIL_DEMO, papel: "PSICOLOGO",
        senhaHash: await bcrypt.hash(randomBytes(32).toString("hex"), 10),
        formacao: "Psicóloga pela Universidade Exemplo.\nNeuropsicóloga pelo Instituto Exemplo de Ensino.", especialidades: ["Neuropsicologia"],
        tituloLaudo: "Psicóloga especialista em Neuropsicologia", assinaturaUrl: pac.profissional.assinaturaUrl,
      },
    });
  }
  if (!(await destino.perfilDeAtuacao.findUnique({ where: { profissionalId: prof.id } }))) {
    await destino.perfilDeAtuacao.create({ data: { profissionalId: prof.id, sistemaClassificacaoPercentil: "MIOTTO_2017" } });
  }

  // tipo de atendimento
  if (!(await destino.tipoAtendimento.findFirst({ where: { clinicaId: clinica.id, nome: "Avaliação neuropsicológica de adulto (modelo)" } }))) {
    await destino.tipoAtendimento.create({
      data: { clinicaId: clinica.id, nome: "Avaliação neuropsicológica de adulto (modelo)", descricao: "Bateria de exemplo: eficiência intelectual, memória, funções executivas, atenção, personalidade, ansiedade, depressão e responsividade social.", numeroSessoes: 4, testeIds: TESTES_DO_TIPO.map((s) => idPorSigla.get(s)!) },
    });
  }

  // paciente, sessões, testes e laudo
  const novoPac = await destino.paciente.create({
    data: { clinicaId: clinica.id, profissionalId: prof.id, nome: pac.nome, dataNascimento: pac.dataNascimento, sexo: pac.sexo, cpf: pac.cpf, escolaridade: pac.escolaridade, anamnese: pac.anamnese ?? undefined, consentimentoTDIC: true, consentimentoTDICData: new Date() },
  });
  for (const s of sessoes) {
    const ns = await destino.sessao.create({ data: { pacienteId: novoPac.id, profissionalId: prof.id, dataHora: s.dataHora, observacoes: s.observacoes } });
    for (const a of s.aplicacoesTeste) {
      await destino.aplicacaoDeTeste.create({
        data: { sessaoId: ns.id, testeId: idPorSigla.get(a.teste.sigla)!, escoresBrutos: a.escoresBrutos as object, resultadoCalculado: (a.resultadoCalculado ?? undefined) as object | undefined, calculadoEm: a.calculadoEm, respondenteTipo: a.respondenteTipo, respondenteNome: a.respondenteNome, respondenteRelacao: a.respondenteRelacao },
      });
    }
  }
  await destino.laudo.create({
    data: {
      pacienteId: novoPac.id, profissionalId: prof.id, identificacao: { paciente: novoPac.nome, profissional: prof.nome }, descricaoDemanda: laudo.descricaoDemanda, procedimento: laudo.procedimento,
      analise: laudo.analise, conclusao: laudo.conclusao, referencias: laudo.referencias, anamnese: laudo.anamnese, observacaoClinica: laudo.observacaoClinica,
      interpretacoes: (laudo.interpretacoes ?? undefined) as object | undefined, hipoteseDiagnostica: laudo.hipoteseDiagnostica, status: "EM_REVISAO", iaUtilizada: false, iaRevisadaPeloProf: true,
    },
  });
  console.log("Demonstração criada. Paciente:", novoPac.id);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await origem.$disconnect(); await destino.$disconnect(); });
