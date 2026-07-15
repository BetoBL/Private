import bcrypt from "bcryptjs";
import { PrismaClient, DominioCognitivo, EscopoTeste, PapelProfissional, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const DEV_PROFISSIONAL_EMAIL = "dev@mentessence.local";

const AVISO_PLACEHOLDER =
  "PLACEHOLDER — algoritmo/norma simplificados para validar o fluxo técnico. " +
  "Não reproduz o manual oficial do instrumento. Substituir antes de qualquer uso clínico.";

interface FaixaNormativaSeed {
  criterio: string;
  faixaMin?: number;
  faixaMax?: number;
  faixaLabel?: string;
  conversao: Prisma.InputJsonValue;
}

interface TesteSeed {
  nome: string;
  sigla: string;
  dominio: DominioCognitivo;
  descricao: string;
  algoritmoCorrecao: Prisma.InputJsonValue;
  referenciaBibliografica: string;
  tabelasNormativas: FaixaNormativaSeed[];
}

const TESTES_PLACEHOLDER: TesteSeed[] = [
  {
    nome: "Escala Wechsler de Inteligência para Adultos — 3ª ed.",
    sigla: "WAIS-III",
    dominio: DominioCognitivo.INTELIGENCIA,
    descricao: `Avalia QI Verbal, QI Execução e QI Total a partir de subtestes. ${AVISO_PLACEHOLDER}`,
    algoritmoCorrecao: {
      aviso: AVISO_PLACEHOLDER,
      subtestesVerbais: ["Vocabulário", "Semelhanças", "Aritmética"],
      subtestesExecucao: ["Cubos", "Raciocínio Matricial", "Código"],
      formulaEscoreBruto: "soma dos escores ponderados de cada subteste, por domínio (verbal/execução)",
      campos: [
        { chave: "vocabulario", label: "Vocabulário (escore ponderado)" },
        { chave: "semelhancas", label: "Semelhanças (escore ponderado)" },
        { chave: "aritmetica", label: "Aritmética (escore ponderado)" },
        { chave: "cubos", label: "Cubos (escore ponderado)" },
        { chave: "raciocinioMatricial", label: "Raciocínio Matricial (escore ponderado)" },
        { chave: "codigo", label: "Código (escore ponderado)" },
      ],
    },
    referenciaBibliografica: "Wechsler, D. WAIS-III — Manual técnico. (referência a confirmar/editora oficial)",
    tabelasNormativas: [
      {
        criterio: "idade",
        faixaMin: 18,
        faixaMax: 90,
        conversao: {
          aviso: AVISO_PLACEHOLDER,
          tipo: "QI_total_por_soma_ponderada",
          faixas: [
            { min: 0, max: 40, qi: 70, classificacao: "Limítrofe" },
            { min: 41, max: 70, qi: 90, classificacao: "Médio Inferior" },
            { min: 71, max: 100, qi: 100, classificacao: "Médio" },
            { min: 101, max: 130, qi: 115, classificacao: "Médio Superior" },
            { min: 131, max: 999, qi: 130, classificacao: "Superior" },
          ],
        },
      },
    ],
  },
  {
    nome: "Teste de Aprendizagem Auditivo-Verbal de Rey",
    sigla: "RAVLT",
    dominio: DominioCognitivo.MEMORIA,
    descricao: `Memória episódica verbal — lista de 15 palavras, 5 tentativas + evocação tardia. ${AVISO_PLACEHOLDER}`,
    algoritmoCorrecao: {
      aviso: AVISO_PLACEHOLDER,
      etapas: ["A1 a A5 (aprendizagem)", "interferência (lista B)", "evocação tardia (A7)", "reconhecimento"],
      formulaEscoreBruto: "total de palavras corretas na tentativa A5 + total na evocação tardia A7",
      campos: [
        { chave: "a5", label: "Tentativa A5 — palavras corretas (0-15)" },
        { chave: "evocacaoTardia", label: "Evocação tardia A7 — palavras corretas (0-15)" },
      ],
    },
    referenciaBibliografica: "Rey, A. — adaptação brasileira (Malloy-Diniz et al.). (referência a confirmar)",
    tabelasNormativas: [
      {
        criterio: "idade",
        faixaMin: 18,
        faixaMax: 90,
        conversao: {
          aviso: AVISO_PLACEHOLDER,
          tipo: "percentil_por_soma_simples",
          faixas: [
            { min: 0, max: 5, percentil: 5, classificacao: "Inferior" },
            { min: 6, max: 9, percentil: 25, classificacao: "Médio Inferior" },
            { min: 10, max: 12, percentil: 50, classificacao: "Médio" },
            { min: 13, max: 15, percentil: 75, classificacao: "Médio Superior" },
          ],
        },
      },
    ],
  },
  {
    nome: "Bateria Psicológica para Avaliação da Atenção",
    sigla: "BPA-2",
    dominio: DominioCognitivo.ATENCAO,
    descricao: `Atenção concentrada (AC), dividida (AD) e alternada (AA). ${AVISO_PLACEHOLDER}`,
    algoritmoCorrecao: {
      aviso: AVISO_PLACEHOLDER,
      subtestes: ["AC", "AD", "AA"],
      formulaEscoreBruto: "acertos - erros, por subteste, dentro do tempo cronometrado",
      campos: [
        { chave: "ac", label: "AC — Atenção Concentrada (acertos - erros)" },
        { chave: "ad", label: "AD — Atenção Dividida (acertos - erros)" },
        { chave: "aa", label: "AA — Atenção Alternada (acertos - erros)" },
      ],
    },
    referenciaBibliografica: "Rueda, F.J.M. — BPA-2 Manual técnico. (referência a confirmar)",
    tabelasNormativas: [
      {
        criterio: "idade+escolaridade",
        faixaLabel: "6º ao 9º ano",
        conversao: {
          aviso: AVISO_PLACEHOLDER,
          tipo: "percentil_por_subteste",
          faixas: [
            { min: 0, max: 20, percentil: 10, classificacao: "Inferior" },
            { min: 21, max: 40, percentil: 40, classificacao: "Médio" },
            { min: 41, max: 60, percentil: 70, classificacao: "Médio Superior" },
            { min: 61, max: 999, percentil: 90, classificacao: "Superior" },
          ],
        },
      },
    ],
  },
  {
    nome: "Escala de Responsividade Social — 2ª ed.",
    sigla: "SRS-2",
    dominio: DominioCognitivo.RASTREIO_TEA,
    descricao: `Rastreio de traços do espectro autista em 5 subescalas. ${AVISO_PLACEHOLDER}`,
    algoritmoCorrecao: {
      aviso: AVISO_PLACEHOLDER,
      subescalas: [
        "Consciência social",
        "Cognição social",
        "Comunicação social",
        "Motivação social",
        "Maneirismos",
      ],
      formulaEscoreBruto: "soma dos itens de cada subescala + soma total",
      campos: [
        { chave: "conscienciaSocial", label: "Consciência social (bruto)" },
        { chave: "cognicaoSocial", label: "Cognição social (bruto)" },
        { chave: "comunicacaoSocial", label: "Comunicação social (bruto)" },
        { chave: "motivacaoSocial", label: "Motivação social (bruto)" },
        { chave: "maneirismos", label: "Maneirismos (bruto)" },
      ],
    },
    referenciaBibliografica: "Constantino, J.N. & Gruber, C.P. — SRS-2. (referência a confirmar)",
    tabelasNormativas: [
      {
        criterio: "idade",
        faixaMin: 18,
        faixaMax: 90,
        conversao: {
          aviso: AVISO_PLACEHOLDER,
          tipo: "escoreT_por_soma_total",
          faixas: [
            { min: 0, max: 59, escoreT: 50, classificacao: "Não clínico" },
            { min: 60, max: 75, escoreT: 65, classificacao: "Faixa leve a moderada" },
            { min: 76, max: 999, escoreT: 75, classificacao: "Faixa clínica" },
          ],
        },
      },
    ],
  },
  {
    nome: "Quociente do Espectro Autista",
    sigla: "AQ-50",
    dominio: DominioCognitivo.RASTREIO_TEA,
    descricao: `Autorrelato de 50 itens em 5 subescalas de traços autísticos. ${AVISO_PLACEHOLDER}`,
    algoritmoCorrecao: {
      aviso: AVISO_PLACEHOLDER,
      subescalas: ["Habilidade social", "Troca de atenção", "Atenção a detalhes", "Comunicação", "Imaginação"],
      formulaEscoreBruto: "1 ponto por item respondido na direção 'concordo com o traço autístico', soma total 0-50",
      campos: [{ chave: "escoreTotal", label: "Escore total (soma dos 50 itens, 0-50)" }],
    },
    referenciaBibliografica: "Baron-Cohen, S. et al. — Autism-Spectrum Quotient (AQ). (referência a confirmar)",
    tabelasNormativas: [
      {
        criterio: "idade",
        faixaMin: 16,
        faixaMax: 90,
        conversao: {
          aviso: AVISO_PLACEHOLDER,
          tipo: "ponto_de_corte_por_soma_total",
          faixas: [
            { min: 0, max: 25, classificacao: "Abaixo do ponto de corte" },
            { min: 26, max: 999, classificacao: "Acima do ponto de corte — traços significativos" },
          ],
        },
      },
    ],
  },
  {
    nome: "Escala de Transtorno de Déficit de Atenção/Hiperatividade — 2ª ed.",
    sigla: "ETDAH-2",
    dominio: DominioCognitivo.RASTREIO_TDAH,
    descricao: `Rastreio de sintomas de desatenção, hiperatividade e impulsividade. ${AVISO_PLACEHOLDER}`,
    algoritmoCorrecao: {
      aviso: AVISO_PLACEHOLDER,
      fatores: ["Desatenção", "Hiperatividade", "Impulsividade"],
      formulaEscoreBruto: "soma dos itens de cada fator, respondente pais/professor/autorrelato",
      campos: [
        { chave: "desatencao", label: "Desatenção (bruto)" },
        { chave: "hiperatividade", label: "Hiperatividade (bruto)" },
        { chave: "impulsividade", label: "Impulsividade (bruto)" },
      ],
    },
    referenciaBibliografica: "Mattos, P. et al. — ETDAH-2. (referência a confirmar)",
    tabelasNormativas: [
      {
        criterio: "idade",
        faixaMin: 6,
        faixaMax: 90,
        conversao: {
          aviso: AVISO_PLACEHOLDER,
          tipo: "percentil_por_fator",
          faixas: [
            { min: 0, max: 30, percentil: 30, classificacao: "Não sugestivo" },
            { min: 31, max: 60, percentil: 70, classificacao: "Sugestivo — investigar" },
            { min: 61, max: 999, percentil: 95, classificacao: "Fortemente sugestivo" },
          ],
        },
      },
    ],
  },
];

async function main() {
  console.log("Removendo testes placeholder anteriores (se houver)...");
  await prisma.tabelaNormativa.deleteMany({ where: { teste: { isPlaceholder: true } } });
  await prisma.teste.deleteMany({ where: { isPlaceholder: true } });

  for (const t of TESTES_PLACEHOLDER) {
    const criado = await prisma.teste.create({
      data: {
        nome: t.nome,
        sigla: t.sigla,
        dominio: t.dominio,
        escopo: EscopoTeste.FIXO,
        descricao: t.descricao,
        algoritmoCorrecao: t.algoritmoCorrecao,
        referenciaBibliografica: t.referenciaBibliografica,
        isPlaceholder: true,
        tabelasNormativas: {
          create: t.tabelasNormativas.map((f) => ({
            criterio: f.criterio,
            faixaMin: f.faixaMin,
            faixaMax: f.faixaMax,
            faixaLabel: f.faixaLabel,
            conversao: f.conversao,
          })),
        },
      },
    });
    console.log(`  ✓ ${criado.sigla} — ${criado.nome} (isPlaceholder=true)`);
  }

  console.log(`\n${TESTES_PLACEHOLDER.length} testes placeholder semeados.`);

  // Fixture de desenvolvimento local: garante 1 Clínica + 1 Profissional para
  // exercitar as telas sem precisar de UI de cadastro ainda. Idempotente.
  const existente = await prisma.profissional.findUnique({ where: { email: DEV_PROFISSIONAL_EMAIL } });
  if (!existente) {
    const clinica = await prisma.clinica.create({
      data: {
        razaoSocial: "MentEssence Neuropsicologia e Avaliação (dev)",
        corPrimaria: "#E66A1F",
        corSecundaria: "#737373",
      },
    });
    const senhaHash = await bcrypt.hash("dev12345", 10);
    const profissional = await prisma.profissional.create({
      data: {
        clinicaId: clinica.id,
        nome: "Dra. Exemplo (dev)",
        crp: "06/000000",
        email: DEV_PROFISSIONAL_EMAIL,
        senhaHash,
        papel: PapelProfissional.ADMIN,
      },
    });
    console.log(`\nFixture de dev criada: clínica "${clinica.razaoSocial}" + profissional "${profissional.nome}" (${profissional.email}).`);
  } else {
    console.log("\nFixture de dev já existia — não recriada.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
