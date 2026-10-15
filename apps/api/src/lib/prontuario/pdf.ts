import PDFDocument from "pdfkit";
import { modeloDe } from "./modelos";

// Prontuário geral em PDF: cabeçalho da clínica, identificação do paciente e do profissional, e as evoluções escolhidas em ordem cronológica.
// As anotações privadas NUNCA entram. Rascunhos saem marcados como "rascunho" (não finalizados).

export interface ProntuarioDados {
  clinica: { nome: string; cnpj: string | null; endereco: string | null; telefone: string | null };
  paciente: { nome: string; nascimento: Date | null; cpf: string | null };
  profissional: { nome: string; registroRotulo: string; registro: string };
  geradoEm: Date;
  evolucoes: Array<{ dataHora: Date; modelo: string; campos: Record<string, string | string[]> | null; evolucao: string | null; finalizada: boolean; profissional: string }>;
}

const COR = "#1F1F1F", CINZA = "#666666", LINHA = "#C9C9C9", DESTAQUE = "#2F5D50";
const dataHora = (d: Date) => d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const dia = (d: Date | null) => (d ? d.toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "-");

export async function gerarProntuarioPdf(d: ProntuarioDados): Promise<Buffer> {
  const pdf = new PDFDocument({ size: "A4", margin: 48, bufferPages: true, info: { Title: `Prontuário - ${d.paciente.nome}`, Author: d.profissional.nome, Subject: "Prontuário do paciente" } });
  const pedacos: Buffer[] = [];
  pdf.on("data", (c: Buffer) => pedacos.push(c));
  const pronto = new Promise<Buffer>((res) => pdf.on("end", () => res(Buffer.concat(pedacos))));
  const L = pdf.page.margins.left, W = pdf.page.width - L - pdf.page.margins.right;
  const garantir = (altura: number) => { if (pdf.y + altura > pdf.page.height - pdf.page.margins.bottom - 20) pdf.addPage(); };

  pdf.fillColor(DESTAQUE).font("Helvetica-Bold").fontSize(15).text(d.clinica.nome, L, pdf.y, { width: W });
  pdf.fillColor(CINZA).font("Helvetica").fontSize(8.5).text([d.clinica.cnpj ? `CNPJ ${d.clinica.cnpj}` : "", d.clinica.endereco ?? "", d.clinica.telefone ?? ""].filter(Boolean).join("  ·  "), { width: W });
  pdf.moveDown(0.6).moveTo(L, pdf.y).lineTo(L + W, pdf.y).strokeColor(LINHA).lineWidth(0.8).stroke().moveDown(0.8);

  pdf.fillColor(COR).font("Helvetica-Bold").fontSize(13).text("Prontuário do paciente", { width: W });
  pdf.moveDown(0.4).font("Helvetica").fontSize(10).fillColor(COR);
  pdf.text(`Paciente: ${d.paciente.nome}`, { width: W });
  pdf.text(`Nascimento: ${dia(d.paciente.nascimento)}${d.paciente.cpf ? `   ·   CPF: ${d.paciente.cpf}` : ""}`, { width: W });
  pdf.text(`Profissional: ${d.profissional.nome}   ·   ${d.profissional.registroRotulo}: ${d.profissional.registro}`, { width: W });
  const primeira = d.evolucoes[0]?.dataHora, ultima = d.evolucoes[d.evolucoes.length - 1]?.dataHora;
  pdf.fillColor(CINZA).fontSize(9).text(`${d.evolucoes.length} ${d.evolucoes.length === 1 ? "evolução" : "evoluções"}${primeira && ultima ? `, de ${dia(primeira)} a ${dia(ultima)}` : ""}   ·   gerado em ${dataHora(d.geradoEm)}`, { width: W });
  pdf.moveDown(0.8);

  for (const e of d.evolucoes) {
    garantir(90);
    pdf.moveTo(L, pdf.y).lineTo(L + W, pdf.y).strokeColor(LINHA).lineWidth(0.5).stroke().moveDown(0.5);
    const modelo = modeloDe(e.modelo);
    pdf.fillColor(DESTAQUE).font("Helvetica-Bold").fontSize(11).text(`${dataHora(e.dataHora)}  ·  ${modelo?.rotulo ?? e.modelo}`, L, pdf.y, { width: W, continued: !e.finalizada });
    if (!e.finalizada) pdf.fillColor("#B45309").font("Helvetica-Oblique").fontSize(9).text("   (rascunho, não finalizado)");
    pdf.fillColor(CINZA).font("Helvetica").fontSize(8.5).text(`Registrado por ${e.profissional}`, { width: W });
    pdf.moveDown(0.3);
    for (const c of modelo?.campos ?? []) {
      const v = e.campos?.[c.chave];
      const texto = Array.isArray(v) ? v.map((x) => `• ${x}`).join("\n") : (v ?? "").trim();
      if (!texto) continue;
      garantir(40);
      pdf.fillColor(COR).font("Helvetica-Bold").fontSize(9.5).text(c.rotulo, { width: W });
      pdf.font("Helvetica").fontSize(10).text(texto, { width: W, align: "left" });
      pdf.moveDown(0.3);
    }
    if ((e.evolucao ?? "").trim()) {
      garantir(40);
      if (modelo && modelo.campos.length > 0) pdf.fillColor(COR).font("Helvetica-Bold").fontSize(9.5).text("Evolução", { width: W });
      pdf.fillColor(COR).font("Helvetica").fontSize(10).text(e.evolucao!.trim(), { width: W, align: "left" });
    }
    pdf.moveDown(0.8);
  }
  if (d.evolucoes.length === 0) pdf.fillColor(CINZA).fontSize(10).text("Nenhuma evolução selecionada.", { width: W });

  const total = pdf.bufferedPageRange();
  for (let i = 0; i < total.count; i++) {
    pdf.switchToPage(total.start + i);
    pdf.page.margins.bottom = 0; // o rodapé fica na área da margem: sem isso o pdfkit abre uma página em branco
    pdf.fillColor(CINZA).font("Helvetica").fontSize(8).text(`${d.paciente.nome}  ·  página ${i + 1} de ${total.count}`, L, pdf.page.height - 36, { width: W, align: "center", lineBreak: false });
  }
  pdf.end();
  return pronto;
}
