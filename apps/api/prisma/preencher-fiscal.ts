// Preenche os dados fiscais da Mentessence (CNPJ, IM, endereço, serviço) a partir da NFS-e nº 229 e do que foi informado em 08/10/2026.
// Só preenche o que está VAZIO e só cria a configuração fiscal se ela ainda não existir. Série e próximo número são provisórios:
// confirmar com a Letícia e a contabilidade antes de emitir pelo sistema (a emissão fica DESLIGADA e em homologação).
//
//   DATABASE_URL=… npx tsx prisma/preencher-fiscal.ts --simular   (sem --simular grava)
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SIMULAR = process.argv.includes("--simular");
const clinicaArg = (() => { const i = process.argv.indexOf("--clinica"); return i >= 0 ? process.argv[i + 1] : undefined; })();

const DADOS = {
  razaoSocial: "MENTESSENCE SAUDE MENTAL E NEUROPSICOLOGIA LTDA", cnpj: "45.614.597/0001-00", endereco: "R Coronel Souza Franco, 807 SALA 02",
  cep: "08710-020", cidade: "Mogi das Cruzes", estado: "SP", telefone: "(11) 96077-7615",
};

async function main() {
  const host = (process.env.DATABASE_URL ?? "").replace(/^.*@/, "").replace(/\/.*$/, "");
  console.log(`Banco: ${host} — ${SIMULAR ? "SIMULAÇÃO" : "GRAVANDO"}`);
  const clinicas = await prisma.clinica.findMany({ where: clinicaArg ? { id: clinicaArg } : {} });
  if (clinicas.length !== 1) throw new Error(`Esperava 1 clínica e achei ${clinicas.length}. Use --clinica <id>.`);
  const c = clinicas[0];
  console.log(`Clínica: ${c.nomeFantasia || c.razaoSocial} (${c.id})`);
  const vazio = (v: string | null) => !v || !v.trim();
  const preencher: Record<string, string> = {};
  for (const [k, v] of Object.entries(DADOS)) if (vazio((c as unknown as Record<string, string | null>)[k])) preencher[k] = v;
  console.log("Campos da clínica a preencher:", Object.keys(preencher).join(", ") || "nenhum");
  const cfg = await prisma.configFiscal.findUnique({ where: { clinicaId: c.id } });
  console.log(cfg ? "Configuração fiscal já existe: não será alterada." : "Configuração fiscal será criada (homologação, emissão desligada).");
  if (SIMULAR) return;
  if (Object.keys(preencher).length) await prisma.clinica.update({ where: { id: c.id }, data: preencher });
  if (!cfg) {
    await prisma.configFiscal.create({
      data: { clinicaId: c.id, emissaoAtiva: false, ambiente: "HOMOLOGACAO", regime: "SIMPLES_NACIONAL", inscricaoMunicipal: "167297", codigoMunicipioIbge: "3530607", cTribNac: "04.16.01", nbs: "1.2301.98.00", aliquotaModo: "FIXA", aliquotaIss: 2.41, serieDps: "49998", proximoNumeroDps: 235 },
    });
  }
  console.log("Feito.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
