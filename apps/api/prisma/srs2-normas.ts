// Normas do SRS-2 (Escala de Responsividade Social, 2ª edição) para o seed do catálogo. Mesmo
// princípio do fdt-normas.ts: os dados são LIDOS de docs/testes/SRS-2-tabelas.json (fonte única,
// gerada por scripts/extrair-normas-srs2.mjs), não duplicados aqui.
//
// FONTE ÚNICA, SEM CONFERÊNCIA CRUZADA: não há manual do SRS-2 em PDF no acervo — a aba
// "SRS2-Normas" do Excel legado da psicóloga é a única fonte. Ver `_fonte` no JSON e a memória do
// usuário project_neurologic_riscos_normas.
//
// 5 FORMULÁRIOS, não 5 faixas etárias de um teste só (diferente do FDT): Pré-Escolar, Idade
// Escolar Masculino, Idade Escolar Feminino, Adulto Autorrelato, Adulto Heterorrelato são
// questionários diferentes, respondidos por pessoas diferentes — cada um vira um Teste SEPARADO
// no catálogo (seed.ts), compartilhando `instrumento: "SRS-2"` (mesmo padrão de BRIEF2-PAIS /
// SCARED-PAIS+AUTORRELATO).
//
// Fluxo de cálculo (ver docs/testes/SRS-2.md): 5 brutos de entrada (4 subescalas de intervenção +
// Padrões Restritos e Repetitivos), cada um com sua própria tabela bruto -> percentil + escore T.
// "Comunicação e Interação Social" e "Pontuação SRS-2 Total" NÃO são lançadas — são
// `camposDerivados` por SOMA do bruto de entrada (`campoValor: "valorBruto"`, igual ao FDT):
//   Comunicação e Interação Social = soma das 4 subescalas de intervenção
//   Pontuação SRS-2 Total          = soma das 4 subescalas + Padrões Restritos e Repetitivos
// Confirmado numericamente na extração (ver comentário em extrair-normas-srs2.mjs).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { CampoDerivado, FaixaConversao } from "../src/lib/motorCalculo";

const DOCS_TESTES = join(__dirname, "..", "..", "..", "docs", "testes");

function lerJson<T>(arquivo: string): T {
  return JSON.parse(readFileSync(join(DOCS_TESTES, arquivo), "utf8")) as T;
}

interface FaixaPercentilJson {
  min: number;
  max: number;
  percentil: string;
  escoreT: string;
}

interface FormularioJson {
  chave: string;
  sigla: string;
  label: string;
  sexo: "MASCULINO" | "FEMININO" | null;
  subescalas: Record<string, FaixaPercentilJson[]>;
  escalasDsm5: Record<string, FaixaPercentilJson[]>;
}

interface ArquivoSrs2 {
  _fonte: string;
  formularios: FormularioJson[];
}

const ARQUIVO = lerJson<ArquivoSrs2>("SRS-2-tabelas.json");

export const SRS2_FONTE = ARQUIVO._fonte;

export const SRS2_SUBESCALAS = ["percepcaoSocial", "cognicaoSocial", "comunicacaoSocial", "motivacaoSocial"] as const;

// Campo derivado é sempre a mesma soma, em qualquer formulário — só a tabela bruto -> percentil
// que classifica o resultado muda por formulário (já em `faixasPorCampo` abaixo). `exigeTodasFontes`
// ligado: uma subescala não lançada nunca deve virar "soma 0 no lugar dela" (mesmo risco de número
// plausível e errado do WISC-IV/ADL2).
export const SRS2_CAMPOS_DERIVADOS: Record<string, CampoDerivado> = {
  comunicacaoInteracaoSocial: {
    fontes: [...SRS2_SUBESCALAS],
    campoValor: "valorBruto",
    exigeTodasFontes: true,
  },
  escoreTotal: {
    fontes: [...SRS2_SUBESCALAS, "restritosRepetitivos"],
    campoValor: "valorBruto",
    exigeTodasFontes: true,
  },
};

export interface FormularioSrs2 {
  chave: string;
  sigla: string;
  label: string;
  sexo: "MASCULINO" | "FEMININO" | null;
  faixasPorCampo: Record<string, FaixaConversao[]>;
}

// Pontos de corte padrão do manual SRS-2 por escore T (a mesma classificação que o placeholder
// anterior já usava, preservada aqui — não é invenção desta transcrição).
function classificacaoDoEscoreT(escoreTTexto: string): string | undefined {
  const n = Number(escoreTTexto.replace(/[<>]/g, "").trim());
  if (!Number.isFinite(n)) return undefined;
  if (n <= 59) return "Dentro dos limites normais";
  if (n <= 65) return "Nível Leve";
  if (n <= 75) return "Nível Moderado";
  return "Nível Severo";
}

function paraFaixaConversao(faixas: FaixaPercentilJson[]): FaixaConversao[] {
  return faixas.map((f) => ({
    min: f.min,
    max: f.max,
    percentil: f.percentil,
    escoreT: f.escoreT,
    classificacao: classificacaoDoEscoreT(f.escoreT),
  }));
}

export const SRS2_FORMULARIOS: FormularioSrs2[] = ARQUIVO.formularios.map((form) => {
  const faixasPorCampo: Record<string, FaixaConversao[]> = {};
  for (const chave of SRS2_SUBESCALAS) {
    const dados = form.subescalas[chave];
    if (dados?.length) faixasPorCampo[chave] = paraFaixaConversao(dados);
  }
  for (const [chave, dados] of Object.entries(form.escalasDsm5)) {
    if (dados?.length) faixasPorCampo[chave] = paraFaixaConversao(dados);
  }
  return {
    chave: form.chave,
    sigla: form.sigla,
    label: form.label,
    sexo: form.sexo,
    faixasPorCampo,
  };
});
