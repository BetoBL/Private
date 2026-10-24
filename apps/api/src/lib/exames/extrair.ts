import { anthropic } from "../anthropic";
import { normalizar } from "./catalogo";

// Leitura de exames (PDF ou foto) por IA. O resultado é SEMPRE uma proposta: o médico confere cada valor antes de salvar.
// O arquivo vai para a IA e não é guardado pelo sistema.
const MODELO = () => process.env.MODELO_IA || "claude-sonnet-5-5";

export interface ItemExtraido { nome: string; tipo: "NUMERICO" | "LAUDO"; valor: number | null; valorTexto: string | null; unidade: string | null; referencia: string | null; fora: boolean | null }
export interface ExameExtraido { nomeNoDocumento: string | null; dataExame: string | null; laboratorio: string | null; itens: ItemExtraido[] }

const SCHEMA = {
  type: "object",
  properties: {
    nomeNoDocumento: { type: ["string", "null"] },
    dataExame: { type: ["string", "null"] },
    laboratorio: { type: ["string", "null"] },
    itens: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nome: { type: "string" },
          tipo: { type: "string", enum: ["NUMERICO", "LAUDO"] },
          valor: { type: ["number", "null"] },
          valorTexto: { type: ["string", "null"] },
          unidade: { type: ["string", "null"] },
          referencia: { type: ["string", "null"] },
          fora: { type: ["boolean", "null"] },
        },
        required: ["nome", "tipo", "valor", "valorTexto", "unidade", "referencia", "fora"],
        additionalProperties: false,
      },
    },
  },
  required: ["nomeNoDocumento", "dataExame", "laboratorio", "itens"],
  additionalProperties: false,
};

const SISTEMA = `Você transcreve o resultado de exames médicos (laboratório ou laudo de imagem/função) de um documento enviado, para um médico conferir depois.

Devolva:
- "nomeNoDocumento": o nome do paciente como está escrito no documento (para o sistema conferir se é a pessoa certa).
- "dataExame": a data da COLETA (ou da realização do exame) no formato AAAA-MM-DD, ou null se não estiver clara.
- "laboratorio": o laboratório ou serviço que emitiu, ou null.
- "itens": um item por resultado.
  - Exame com número (hemograma, glicose, colesterol…): tipo "NUMERICO", "valor" com o número (ponto decimal), "unidade" como impressa (mg/dL, %, etc.), "referencia" com o texto do valor de referência impresso, e "fora" true/false conforme o documento indicar (negrito, asterisco, "alterado", ou comparação com a referência impressa), ou null se não der para saber. Se o valor for texto ("Negativo", "Não reagente"), use "valorTexto" e deixe "valor" null.
  - Laudo descritivo (ultrassom, ecocardiograma, ECG, ressonância…): um item tipo "LAUDO" com "nome" do exame e "valorTexto" com a CONCLUSÃO/IMPRESSÃO do laudo, copiada fielmente (resuma só se for muito longa, sem mudar o sentido). "valor" null.

Regras:
- Copie SOMENTE o que está no documento. Não invente, não interprete clinicamente, não diagnostique, não corrija valores.
- Se um valor estiver ilegível ou duvidoso, coloque o melhor palpite em "valorTexto" começando por "[conferir]" e "valor" null.
- Ignore dados de identificação além de "nomeNoDocumento" (CPF, endereço, convênio etc.) e textos administrativos.
- Nomes de exame em português, como no documento.`;

export async function extrairExame(arquivoBase64: string, tipoMime: string): Promise<ExameExtraido> {
  const bloco = tipoMime === "application/pdf"
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: arquivoBase64 } }
    : { type: "image", source: { type: "base64", media_type: tipoMime, data: arquivoBase64 } };
  const r = await anthropic.messages.create({
    model: MODELO(),
    max_tokens: 8000,
    output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
    system: SISTEMA,
    messages: [{ role: "user", content: [bloco, { type: "text", text: "Transcreva os resultados deste exame." }] }],
  } as never) as { content: Array<{ type: string; text?: string }> };
  const texto = r.content.filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
  if (!texto) throw new Error("A IA não devolveu texto.");
  return JSON.parse(texto) as ExameExtraido;
}

// o nome no documento confere com o do paciente? compara o primeiro nome e o último sobrenome, sem acento
export function nomeConfere(nomePaciente: string, nomeNoDocumento: string | null): boolean | null {
  if (!nomeNoDocumento?.trim()) return null;
  const parte = (s: string) => normalizar(s).replace(/[^a-z\s]/g, " ").split(/\s+/).filter((x) => x.length > 1);
  const a = parte(nomePaciente), b = parte(nomeNoDocumento);
  if (!a.length || !b.length) return null;
  return a[0] === b[0] && a[a.length - 1] === b[b.length - 1];
}

// resultados numéricos que também alimentam os gráficos da aba Saúde (métricas)
export function metricaDoResultado(nome: string, unidade: string | null): string | null {
  const n = normalizar(nome);
  if (/hemoglobina glicada|hba1c|glicada/.test(n)) return "HBA1C";
  if (/\bldl\b/.test(n) && !/vldl/.test(n)) return "LDL";
  if (/^(glicose|glicemia)/.test(n) && !/pos|apos|tolerancia|curva/.test(n)) return unidade && !/mg/i.test(unidade) ? null : "GLICEMIA";
  return null;
}
