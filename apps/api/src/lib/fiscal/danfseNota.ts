import { prisma } from "../prisma";
import { dadosDoXmlNfse, gerarDanfse, type DanfseDados } from "./danfse";
import { ErroFiscal } from "./emissao";

// Monta o DANFSe (PDF) de uma nota EMITIDA a partir da nota, da configuração fiscal e da clínica; os valores apurados pelo Portal
// (alíquota, ISS, líquido, número, data/hora de processamento) vêm do XML da NFS-e quando existe.

const REGIME: Record<string, string> = { SIMPLES_NACIONAL: "Optante - Microempresa ou Empresa de Pequeno Porte (ME/EPP)", MEI: "Optante - Microempreendedor Individual (MEI)", LUCRO_PRESUMIDO: "Não optante", LUCRO_REAL: "Não optante" };

export async function danfseDaNota(notaId: string, clinicaId: string): Promise<{ pdf: Buffer; nome: string }> {
  const [nota, cfg, clinica] = await Promise.all([prisma.notaFiscal.findFirst({ where: { id: notaId, clinicaId } }), prisma.configFiscal.findUnique({ where: { clinicaId } }), prisma.clinica.findUnique({ where: { id: clinicaId } })]);
  if (!nota || !clinica) throw new ErroFiscal("NOTA_NAO_ENCONTRADA", "Nota não encontrada.", 404);
  if (nota.status !== "EMITIDA") throw new ErroFiscal("NAO_EMITIDA", "O PDF só existe para notas emitidas.");
  const xml = dadosDoXmlNfse(nota.xmlNfse);
  const valor = Number(nota.valor);
  const aliquota = xml.aliquota ?? (cfg?.aliquotaModo === "FIXA" && cfg.aliquotaIss ? Number(cfg.aliquotaIss) : null);
  const iss = xml.iss ?? (aliquota !== null ? Math.round(valor * aliquota) / 100 : null);
  const retido = !!cfg?.issRetido;
  const simulada = !!nota.chaveAcesso?.startsWith("SIMULADA");
  const dados: DanfseDados = {
    chave: nota.chaveAcesso, numeroNfse: xml.numero ?? nota.numeroNfse, competencia: nota.competencia, emissaoNfse: xml.processadoEm ?? nota.emitidaEm, numeroDps: nota.numero, serieDps: nota.serie, emissaoDps: nota.emitidaEm,
    ambiente: nota.ambiente === "PRODUCAO" ? "producao" : "homologacao", simulada, situacao: "NFS-e Gerada",
    prestador: { nome: clinica.razaoSocial, cnpj: clinica.cnpj, inscricaoMunicipal: cfg?.inscricaoMunicipal ?? null, telefone: clinica.telefone, email: null, endereco: clinica.endereco, cep: clinica.cep, municipio: clinica.cidade, uf: clinica.estado, ibge: cfg?.codigoMunicipioIbge ?? null, regime: REGIME[cfg?.regime ?? "SIMPLES_NACIONAL"] ?? "-" },
    tomador: { nome: nota.tomadorNome, documento: nota.tomadorDocumento, email: null, telefone: null },
    servico: { cTribNac: cfg?.cTribNac ?? null, nbs: cfg?.nbs ?? null, localPrestacao: [clinica.cidade, clinica.estado].filter(Boolean).join(" / ") + " / BRASIL", descricao: nota.descricao },
    valores: { servico: valor, baseCalculo: xml.bc ?? valor, aliquotaIss: aliquota, issApurado: iss, issRetido: retido, liquido: xml.liquido ?? (retido && iss ? valor - iss : valor), descontoIncondicionado: null },
    informacoesComplementares: null,
  };
  return { pdf: await gerarDanfse(dados), nome: `nfse-${dados.numeroNfse ?? nota.numero ?? "sem-numero"}.pdf` };
}
