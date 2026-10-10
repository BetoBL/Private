import PDFDocument from "pdfkit";
import QRCode from "qrcode";

// DANFSe: Documento Auxiliar da NFS-e (a nota impressa), no leiaute do Portal Nacional (DANFSe v2.0): cabeçalho com a chave de acesso e o QR de
// consulta, prestador, tomador, serviço, tributação municipal, federal e IBS/CBS, totais e informações complementares.
// É montado dos dados da nota (e, quando existe, do XML da NFS-e autorizada: número, data/hora de processamento e valores apurados pelo Portal).
// Em homologação (ou simulação) sai com a faixa "SEM VALOR FISCAL".

export interface DanfseDados {
  chave: string | null; numeroNfse: string | null; competencia: Date; emissaoNfse: Date | null; numeroDps: number | null; serieDps: string | null; emissaoDps: Date | null;
  ambiente: "producao" | "homologacao"; simulada: boolean; situacao: string;
  prestador: { nome: string; cnpj: string | null; inscricaoMunicipal: string | null; telefone: string | null; email: string | null; endereco: string | null; cep: string | null; municipio: string | null; uf: string | null; ibge: string | null; regime: string };
  tomador: { nome: string; documento: string | null; email: string | null; telefone: string | null };
  servico: { cTribNac: string | null; nbs: string | null; localPrestacao: string | null; descricao: string };
  valores: { servico: number; baseCalculo: number; aliquotaIss: number | null; issApurado: number | null; issRetido: boolean; liquido: number; descontoIncondicionado: number | null };
  informacoesComplementares: string | null;
}

const COR = "#1F1F1F", CINZA = "#555555", LINHA = "#9A9A9A";
const brl = (v: number | null | undefined) => (v === null || v === undefined ? "-" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
const dataHora = (d: Date | null) => (d ? d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }).replace(",", "") : "-");
const dia = (d: Date | null) => (d ? d.toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "-");
const v = (s: string | null | undefined) => (s && s.trim() ? s : "-");
const pct = (n: number | null) => (n === null ? "-" : `${n.toFixed(2).replace(".", ",")}%`);
const doc14 = (d: string | null) => { const x = (d ?? "").replace(/\D/g, ""); return x.length === 14 ? x.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : x.length === 11 ? x.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4") : v(d); };

// lê do XML da NFS-e autorizada o que o Portal apurou (se não houver XML, devolve vazio e o PDF usa os dados da nota)
export function dadosDoXmlNfse(xml: string | null | undefined): { numero?: string; processadoEm?: Date; aliquota?: number; iss?: number; liquido?: number; bc?: number } {
  if (!xml || !xml.includes("<")) return {};
  const tag = (n: string) => new RegExp(`<${n}>([^<]+)</${n}>`).exec(xml)?.[1];
  const num = (n: string) => { const s = tag(n); return s !== undefined && !Number.isNaN(Number(s)) ? Number(s) : undefined; };
  const dh = tag("dhProc");
  return { numero: tag("nNFSe"), processadoEm: dh ? new Date(dh) : undefined, aliquota: num("pAliqAplic"), iss: num("vISSQN"), liquido: num("vLiq"), bc: num("vBC") };
}

export async function gerarDanfse(d: DanfseDados, opcoes: { comprimir?: boolean } = {}): Promise<Buffer> {
  const pdf = new PDFDocument({ size: "A4", margin: 28, compress: opcoes.comprimir !== false, info: { Title: `NFS-e ${d.numeroNfse ?? ""}`.trim(), Author: d.prestador.nome, Subject: "Documento Auxiliar da NFS-e" } });
  const pedacos: Buffer[] = [];
  pdf.on("data", (c: Buffer) => pedacos.push(c));
  const pronto = new Promise<Buffer>((res) => pdf.on("end", () => res(Buffer.concat(pedacos))));

  const L = 28, W = 539;
  let y = 28;
  const linha = (yy: number) => pdf.save().moveTo(L, yy).lineTo(L + W, yy).lineWidth(0.6).strokeColor(LINHA).stroke().restore();
  const rotulo = (t: string, x: number, yy: number, w: number) => pdf.font("Helvetica-Bold").fontSize(6.8).fillColor(COR).text(t, x, yy, { width: w, lineBreak: false });
  const valor = (t: string, x: number, yy: number, w: number, tam = 8) => pdf.font("Helvetica").fontSize(tam).fillColor(COR).text(t, x, yy, { width: w });
  // linha de campos: [rótulo, valor, largura relativa]
  function campos(itens: Array<[string, string, number]>, alturaMin = 26): void {
    const soma = itens.reduce((s, i) => s + i[2], 0);
    let x = L;
    let h = alturaMin;
    for (const [r, val, p] of itens) { const w = (W * p) / soma; pdf.font("Helvetica").fontSize(8); h = Math.max(h, 12 + pdf.heightOfString(val, { width: w - 6 }) + 4); void r; }
    if (y + h > 800) { pdf.addPage(); y = 28; }
    for (const [r, val, p] of itens) { const w = (W * p) / soma; rotulo(r, x, y + 2, w - 4); valor(val, x, y + 11, w - 6); x += w; }
    y += h;
    linha(y);
  }
  const secao = (t: string) => { if (y + 24 > 800) { pdf.addPage(); y = 28; } pdf.font("Helvetica-Bold").fontSize(8).fillColor(COR).text(t, L, y + 3, { width: W }); y += 15; };

  // ---- cabeçalho ----
  pdf.rect(L, y, W, 56).lineWidth(0.8).strokeColor(COR).stroke();
  pdf.font("Helvetica-Bold").fontSize(26).fillColor("#1F6F4A").text("NFS", L + 10, y + 8, { continued: true }).fillColor("#1F4E9A").text("e");
  pdf.font("Helvetica").fontSize(6.5).fillColor(CINZA).text("Nota Fiscal de Serviço eletrônica", L + 10, y + 40, { width: 130 });
  pdf.font("Helvetica-Bold").fontSize(12).fillColor(COR).text("DANFSe v2.0", L + 150, y + 12, { width: 240, align: "center" });
  pdf.font("Helvetica-Bold").fontSize(9.5).text("Documento Auxiliar da NFS-e", L + 150, y + 30, { width: 240, align: "center" });
  const loc = `${(d.prestador.municipio ?? "").toUpperCase()}${d.prestador.uf ? ` / ${d.prestador.uf}` : ""}`;
  pdf.font("Helvetica").fontSize(7).fillColor(COR).text(`Município: ${loc}`, L + 395, y + 10, { width: 140 }).text(`Ambiente Gerador: ${d.simulada ? "-" : "1"}`, L + 395, y + 24, { width: 140 }).text(`Tipo de Ambiente: ${d.ambiente === "producao" ? "1 - Produção" : "2 - Homologação"}`, L + 395, y + 36, { width: 140 });
  y += 62;

  // ---- chave e QR ----
  const consulta = d.chave && !d.simulada ? `https://www.nfse.gov.br/ConsultaPublica/?tpc=1&chave=${d.chave}` : null;
  const qr = consulta ? await QRCode.toBuffer(consulta, { margin: 0, width: 160, errorCorrectionLevel: "M" }) : null;
  rotulo("CHAVE DE ACESSO DA NFS-E", L, y + 2, 400);
  pdf.font("Helvetica").fontSize(8.5).fillColor(COR).text(v(d.chave), L, y + 12, { width: 400 });
  pdf.font("Helvetica-Bold").fontSize(6.5).fillColor(CINZA).text("A autenticidade desta NFS-e pode ser consultada pela chave de acesso no portal nacional da NFS-e", L + 410, y + 4, { width: 129, align: "left" });
  if (qr) pdf.image(qr, L + 460, y + 28, { width: 62, height: 62 });
  const hQr = qr ? 94 : 30;
  y += hQr;
  linha(y);

  campos([["NÚMERO DA NFS-E", v(d.numeroNfse), 1], ["COMPETÊNCIA DA NFS-E", dia(d.competencia), 1], ["DATA E HORA DA EMISSÃO DA NFS-E", dataHora(d.emissaoNfse), 1]]);
  campos([["NÚMERO DA DPS", d.numeroDps !== null ? String(d.numeroDps) : "-", 1], ["SÉRIE DA DPS", v(d.serieDps), 1], ["DATA E HORA DA EMISSÃO DA DPS", dataHora(d.emissaoDps), 1]]);
  campos([["EMITENTE DA NFS-E", "Prestador de Serviços", 1], ["SITUAÇÃO DA NFS-E", d.situacao, 1], ["FINALIDADE", "NFS-e regular", 1]]);

  // ---- prestador ----
  secao("PRESTADOR / FORNECEDOR");
  campos([["Nome / Nome Empresarial", v(d.prestador.nome), 2.2], ["CNPJ / CPF / NIF", doc14(d.prestador.cnpj), 1.2], ["Indicador Municipal (Inscrição)", v(d.prestador.inscricaoMunicipal), 1.2], ["Telefone", v(d.prestador.telefone), 1]]);
  campos([["Endereço", [v(d.prestador.endereco), v(d.prestador.cep)].filter((x) => x !== "-").join(" - ") || "-", 2.0], ["Município / Sigla / UF", `${v(d.prestador.municipio)} / ${v(d.prestador.uf)}`, 1.1], ["Código IBGE / CEP", `${v(d.prestador.ibge)} / ${v(d.prestador.cep)}`, 1.1], ["E-mail", v(d.prestador.email), 1.9]]);
  campos([["Simples Nacional", d.prestador.regime, 3]]);

  // ---- tomador ----
  secao("TOMADOR / ADQUIRENTE");
  campos([["Nome / Nome Empresarial", v(d.tomador.nome), 2.4], ["CNPJ / CPF / NIF", doc14(d.tomador.documento), 1.2], ["Telefone", v(d.tomador.telefone), 1], ["E-mail", v(d.tomador.email), 1.4]]);
  pdf.font("Helvetica").fontSize(7.5).fillColor(COR).text("O DESTINATÁRIO É O PRÓPRIO TOMADOR/ADQUIRENTE DA OPERAÇÃO", L, y + 3, { width: W, align: "center" }); y += 14; linha(y);
  pdf.text("INTERMEDIÁRIO DA OPERAÇÃO NÃO IDENTIFICADO NA NFS-e", L, y + 3, { width: W, align: "center" }); y += 14; linha(y);

  // ---- serviço ----
  secao("SERVIÇO PRESTADO");
  campos([["Código de Tributação Nacional", v(d.servico.cTribNac), 1.2], ["Código da NBS", v(d.servico.nbs), 1], ["Local da Prestação / Sigla UF / País", v(d.servico.localPrestacao), 1.6]]);
  campos([["Descrição do Serviço", d.servico.descricao, 1]], 30);

  // ---- tributação municipal ----
  secao("TRIBUTAÇÃO MUNICIPAL (ISSQN)");
  campos([["Tipo de Tributação do ISSQN", "Operação Tributável", 1.2], ["Município / Sigla UF / País de Incidência do ISSQN", v(d.servico.localPrestacao), 1.6], ["Regime Especial de Tributação ISSQN", "Nenhum", 1]]);
  campos([["BC ISSQN", brl(d.valores.baseCalculo), 1], ["Alíquota Aplicada", pct(d.valores.aliquotaIss), 1], ["Retenção do ISSQN", d.valores.issRetido ? "Retido pelo tomador" : "Não retido", 1], ["ISSQN Apurado", brl(d.valores.issApurado), 1]]);
  secao("TRIBUTAÇÃO FEDERAL (EXCETO CBS)");
  campos([["IRRF", "-", 1], ["Contribuição Previdenciária - Retida", "-", 1.4], ["Contribuições Sociais - Retidas", "-", 1.4], ["PIS / COFINS - Débito Apuração Própria", "-", 1.4]]);
  secao("TRIBUTAÇÃO IBS / CBS");
  campos([["Alíquota - CBS", "0,00%", 1], ["Alíq. Efetiva Municipal - IBS", "0,00%", 1], ["Total do IBS/CBS", "-", 1]]);

  // ---- totais ----
  secao("VALORES");
  campos([["VALOR TOTAL DA NFS-E", brl(d.valores.servico), 1], ["DESCONTO INCONDICIONADO", brl(d.valores.descontoIncondicionado), 1], ["Total das Retenções (ISSQN / Federais)", "-", 1], ["VALOR LÍQUIDO DA NFS-e", brl(d.valores.liquido), 1]]);
  secao("INFORMAÇÕES COMPLEMENTARES");
  pdf.font("Helvetica").fontSize(8).fillColor(COR).text(d.informacoesComplementares ?? "", L, y + 2, { width: W });

  if (d.simulada || d.ambiente === "homologacao") {
    pdf.save().rotate(-35, { origin: [300, 420] }).font("Helvetica-Bold").fontSize(46).fillColor("#C00000").opacity(0.13).text(d.simulada ? "SIMULAÇÃO" : "HOMOLOGAÇÃO", 60, 390, { width: 480, align: "center" }).fontSize(20).text("SEM VALOR FISCAL", 60, 450, { width: 480, align: "center" }).restore();
  }
  pdf.end();
  return pronto;
}
