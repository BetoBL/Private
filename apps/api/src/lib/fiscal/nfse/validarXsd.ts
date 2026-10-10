import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { validateXML } from "xmllint-wasm";

// Valida a DPS contra os esquemas XSD OFICIAIS do Sistema Nacional NFS-e (pacote NFSe-ESQUEMAS_XSD-v1.01-20260209, gov.br/nfse).
// Os arquivos ficam em ./xsd/<versão>/ e vêm do portal oficial, sem alteração. Serve de rede de segurança antes de enviar: XML fora do schema
// é recusado pela SEFIN com mensagem que não aponta o campo; aqui o erro vem com o campo e a regra.

export type VersaoXsd = "1.00" | "1.01";

function pastaDosEsquemas(versao: VersaoXsd): string {
  // em produção o código roda de dist/, onde o tsc não copia os .xsd: procura também na pasta de código-fonte
  const candidatos = [path.join(__dirname, "xsd", versao), path.resolve(__dirname, "../../../../src/lib/fiscal/nfse/xsd", versao)];
  const achada = candidatos.find((c) => existsSync(c));
  if (!achada) throw new Error(`Esquemas XSD ${versao} não encontrados (procurei em ${candidatos.join(", ")}).`);
  return achada;
}

const cache = new Map<string, Array<{ fileName: string; contents: string }>>();
function arquivos(versao: VersaoXsd) {
  if (!cache.has(versao)) {
    const pasta = pastaDosEsquemas(versao);
    // o XSD 1.01 traz padrões escritos como ^…$ (âncoras de regex): em XSD elas valem como texto literal e rejeitariam até uma série válida
    // ("49998"). Tiramos só as âncoras, só na cópia lida para validar; o arquivo oficial no repositório fica intacto.
    const semAncoras = (s: string) => s.replace(/pattern value="\^([^"]*?)\$"/g, 'pattern value="$1"');
    cache.set(versao, readdirSync(pasta).filter((f) => f.endsWith(".xsd")).map((f) => ({ fileName: f, contents: semAncoras(readFileSync(path.join(pasta, f), "utf8")) })));
  }
  return cache.get(versao)!;
}

export interface ResultadoXsd { valida: boolean; erros: string[] }

export async function validarContraXsd(xml: string, tipo: "DPS" | "NFSe" | "pedRegEvento" = "DPS", versao: VersaoXsd = "1.01"): Promise<ResultadoXsd> {
  const todos = arquivos(versao);
  const principal = todos.find((f) => f.fileName.startsWith(`${tipo}_v`));
  if (!principal) throw new Error(`Esquema principal de ${tipo} não encontrado na versão ${versao}.`);
  const r = await validateXML({
    xml: [{ fileName: `${tipo}.xml`, contents: xml }],
    schema: [principal.contents],
    preload: todos.filter((f) => f !== principal),
  });
  return { valida: r.valid, erros: r.errors.map((e) => e.message) };
}
