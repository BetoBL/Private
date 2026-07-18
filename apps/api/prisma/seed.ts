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
    descricao: `Avalia o funcionamento intelectual em 4 índices fatoriais (Compreensão Verbal, Organização Perceptual, Memória Operacional, Velocidade de Processamento) + QI Total. ${AVISO_PLACEHOLDER}`,
    algoritmoCorrecao: {
      aviso: AVISO_PLACEHOLDER,
      // Modelo de 4 índices fatoriais (o que a prática clínica real usa), não o antigo QI Verbal/Execução.
      // O profissional lança os índices já convertidos pelas tabelas do manual oficial (proprietário) —
      // este motor só converte índice -> percentil/classificação, não agrega subtestes.
      indicesFatoriais: {
        ICV: ["Vocabulário", "Semelhanças", "Informação"],
        IOP: ["Cubos", "Raciocínio Matricial"],
        IMO: ["Dígitos", "Sequência de Números e Letras"],
        IVP: ["Código", "Procurar Símbolos"],
      },
      campos: [
        { chave: "icv", label: "ICV — Índice de Compreensão Verbal" },
        { chave: "iop", label: "IOP — Índice de Organização Perceptual" },
        { chave: "imo", label: "IMO — Índice de Memória Operacional" },
        { chave: "ivp", label: "IVP — Índice de Velocidade de Processamento" },
        { chave: "qit", label: "QIT — Quociente Intelectual Total" },
      ],
    },
    referenciaBibliografica: "WECHSLER, D.; NASCIMENTO, E. Escala de Inteligência Wechsler para Adultos – WAIS-III: manual técnico. São Paulo: CasaPsi Livraria e Editora, 2004.",
    tabelasNormativas: [
      {
        criterio: "idade",
        faixaMin: 18,
        faixaMax: 90,
        conversao: {
          aviso: AVISO_PLACEHOLDER,
          tipo: "percentil_por_indice",
          faixas: [
            { min: 0, max: 69, percentil: 2, classificacao: "Deficitário" },
            { min: 70, max: 79, percentil: 8, classificacao: "Limítrofe" },
            { min: 80, max: 89, percentil: 20, classificacao: "Médio Inferior" },
            { min: 90, max: 109, percentil: 50, classificacao: "Médio" },
            { min: 110, max: 119, percentil: 82, classificacao: "Médio Superior" },
            { min: 120, max: 129, percentil: 95, classificacao: "Superior" },
            { min: 130, max: 999, percentil: 99, classificacao: "Muito Superior" },
          ],
        },
      },
    ],
  },
  {
    nome: "Teste de Aprendizagem Auditivo-Verbal de Rey",
    sigla: "RAVLT",
    dominio: DominioCognitivo.MEMORIA,
    descricao: `Memória episódica verbal — lista A (5 tentativas), lista de interferência B, evocação tardia. ${AVISO_PLACEHOLDER}`,
    algoritmoCorrecao: {
      aviso: AVISO_PLACEHOLDER,
      etapas: ["A1 a A5 (aprendizagem)", "B1 (interferência)", "A6 (evocação imediata pós-interferência)", "A7 (evocação tardia)"],
      // A prática real reporta percentil por tentativa (não só um total agregado) — cada campo
      // é convertido de forma independente na mesma tabela de faixas (modo "por_campo").
      campos: [
        { chave: "a1", label: "A1 — 1ª tentativa, palavras corretas (0-15)" },
        { chave: "b1", label: "B1 — lista de interferência, palavras corretas (0-15)" },
        { chave: "aprendizagemTotal", label: "Escore total de aprendizagem (soma A1-A5, 0-75)" },
        { chave: "a6", label: "A6 — evocação imediata pós-interferência (0-15)" },
        { chave: "a7", label: "A7 — evocação tardia (0-15)" },
      ],
    },
    referenciaBibliografica: "PAULA, J. J. RAVLT – Teste de Aprendizagem Auditivo-Verbal de Rey: manual. São Paulo: Vetor, 2018.",
    tabelasNormativas: [
      {
        criterio: "idade",
        faixaMin: 18,
        faixaMax: 90,
        conversao: {
          aviso: AVISO_PLACEHOLDER,
          tipo: "percentil_por_campo",
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
    descricao: `Rastreio quantitativo de traços do espectro autista em 5 subescalas + escore composto + escore T total. ${AVISO_PLACEHOLDER}`,
    algoritmoCorrecao: {
      aviso: AVISO_PLACEHOLDER,
      // A prática real reporta escore T por fator (não soma tudo em 1 total) — modo "por_campo".
      campos: [
        { chave: "percepcaoSocial", label: "Percepção Social (escore T)" },
        { chave: "cognicaoSocial", label: "Cognição Social (escore T)" },
        { chave: "comunicacaoSocial", label: "Comunicação Social (escore T)" },
        { chave: "motivacaoSocial", label: "Motivação Social (escore T)" },
        { chave: "padroesRestritosRepetitivos", label: "Padrões Restritos e Repetitivos (escore T)" },
        { chave: "comunicacaoEInteracaoSocial", label: "Comunicação e Interação Social — composto (escore T)" },
        { chave: "escoreTotal", label: "Pontuação SRS-2 Total (escore T)" },
      ],
    },
    referenciaBibliografica: "CONSTANTINO, J. N.; GRUBER, C. P. Escala de Responsividade Social – Segunda Edição (SRS-2). Torrance, CA: Western Psychological Services, 2012.",
    tabelasNormativas: [
      {
        criterio: "idade",
        faixaMin: 18,
        faixaMax: 90,
        conversao: {
          aviso: AVISO_PLACEHOLDER,
          tipo: "escoreT_por_campo",
          faixas: [
            { min: 0, max: 59, classificacao: "Dentro dos limites normais" },
            { min: 60, max: 65, classificacao: "Nível Leve" },
            { min: 66, max: 75, classificacao: "Nível Moderado" },
            { min: 76, max: 999, classificacao: "Nível Severo" },
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
  {
    nome: "Teste dos Cinco Dígitos",
    sigla: "FDT",
    dominio: DominioCognitivo.FUNCOES_EXECUTIVAS,
    descricao: `Velocidade de processamento, controle inibitório e flexibilidade cognitiva a partir de 4 etapas com dígitos. ${AVISO_PLACEHOLDER}`,
    algoritmoCorrecao: {
      aviso: AVISO_PLACEHOLDER,
      etapas: ["Leitura", "Contagem", "Escolha (inibição)", "Alternância (flexibilidade)"],
      campos: [
        { chave: "inibicao", label: "FDT Inibição (percentil)" },
        { chave: "flexibilidade", label: "FDT Flexibilidade (percentil)" },
      ],
    },
    referenciaBibliografica: "SEDÓ, M. A. Five Digit Test (FDT): manual. Madrid: TEA Ediciones, 2007.",
    tabelasNormativas: [
      {
        criterio: "idade+escolaridade",
        conversao: {
          aviso: AVISO_PLACEHOLDER,
          tipo: "percentil_por_campo",
          faixas: [
            { min: 0, max: 2, classificacao: "Deficitário" },
            { min: 3, max: 8, classificacao: "Limítrofe" },
            { min: 9, max: 24, classificacao: "Médio Inferior" },
            { min: 25, max: 74, classificacao: "Médio" },
            { min: 75, max: 90, classificacao: "Médio Superior" },
            { min: 91, max: 97, classificacao: "Superior" },
            { min: 98, max: 100, classificacao: "Muito Superior" },
          ],
        },
      },
    ],
  },
  {
    nome: "Inventário de Ansiedade de Beck",
    sigla: "BAI",
    dominio: DominioCognitivo.SINTOMAS_EMOCIONAIS,
    descricao: `Autorrelato de 21 itens para severidade de sintomas de ansiedade. ${AVISO_PLACEHOLDER}`,
    algoritmoCorrecao: {
      aviso: AVISO_PLACEHOLDER,
      formulaEscoreBruto: "soma dos 21 itens (0-3 cada), total 0-63",
      campos: [{ chave: "escoreTotal", label: "Escore total BAI (soma dos 21 itens, 0-63)" }],
    },
    referenciaBibliografica:
      "BECK, A. T.; EPSTEIN, N.; BROWN, G.; STEER, R. A. An inventory for measuring clinical anxiety: Psychometric properties. Journal of Consulting and Clinical Psychology, v. 56, n. 6, p. 893–897, 1988.",
    tabelasNormativas: [
      {
        criterio: "geral",
        conversao: {
          aviso: AVISO_PLACEHOLDER,
          tipo: "ponto_de_corte_por_soma_total",
          faixas: [
            { min: 0, max: 10, classificacao: "Sintomas Mínimos" },
            { min: 11, max: 19, classificacao: "Sintomas Leves" },
            { min: 20, max: 30, classificacao: "Sintomas Moderados" },
            { min: 31, max: 63, classificacao: "Sintomas Graves" },
          ],
        },
      },
    ],
  },
  {
    nome: "Escala de Depressão de Beck — 2ª ed.",
    sigla: "BDI-II",
    dominio: DominioCognitivo.SINTOMAS_EMOCIONAIS,
    descricao: `Autorrelato de 21 itens para severidade de sintomas depressivos. ${AVISO_PLACEHOLDER}`,
    algoritmoCorrecao: {
      aviso: AVISO_PLACEHOLDER,
      formulaEscoreBruto: "soma dos 21 itens (0-3 cada), total 0-63",
      campos: [{ chave: "escoreTotal", label: "Escore total BDI-II (soma dos 21 itens, 0-63)" }],
    },
    referenciaBibliografica: "BECK, A. T.; STEER, R. A.; BROWN, G. K. Manual for the Beck Depression Inventory-II. San Antonio, TX: Psychological Corporation, 1996.",
    tabelasNormativas: [
      {
        criterio: "geral",
        conversao: {
          aviso: AVISO_PLACEHOLDER,
          tipo: "ponto_de_corte_por_soma_total",
          faixas: [
            { min: 0, max: 13, classificacao: "Sintomas Mínimos" },
            { min: 14, max: 19, classificacao: "Sintomas Leves" },
            { min: 20, max: 28, classificacao: "Sintomas Moderados" },
            { min: 29, max: 63, classificacao: "Sintomas Graves" },
          ],
        },
      },
    ],
  },
  {
    nome: "Bateria Fatorial de Personalidade",
    sigla: "BFP",
    dominio: DominioCognitivo.PERSONALIDADE,
    descricao: `Personalidade a partir do modelo dos Cinco Grandes Fatores: Extroversão, Socialização, Realização, Neuroticismo e Abertura. ${AVISO_PLACEHOLDER}`,
    algoritmoCorrecao: {
      aviso: AVISO_PLACEHOLDER,
      campos: [
        { chave: "extroversao", label: "Extroversão (percentil)" },
        { chave: "socializacao", label: "Socialização (percentil)" },
        { chave: "realizacao", label: "Realização (percentil)" },
        { chave: "neuroticismo", label: "Neuroticismo (percentil)" },
        { chave: "abertura", label: "Abertura (percentil)" },
      ],
    },
    referenciaBibliografica: "NUNES, C. H. S. S.; HUTZ, C. S.; NUNES, M. F. O. Bateria Fatorial de Personalidade (BFP): manual técnico. São Paulo: Casa do Psicólogo, 2010.",
    tabelasNormativas: [
      {
        criterio: "geral",
        conversao: {
          aviso: AVISO_PLACEHOLDER,
          tipo: "percentil_por_campo",
          faixas: [
            { min: 0, max: 24, classificacao: "Baixo" },
            { min: 25, max: 74, classificacao: "Médio" },
            { min: 75, max: 100, classificacao: "Alto" },
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
