const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  try {
    const teste = await prisma.teste.findUnique({
      where: { sigla: "BRIEF2-PAIS" },
      include: {
        tabelasNormativas: {
          where: { sexo: "FEMININO" },
          select: { faixaLabel: true },
        },
      },
    });

    if (!teste) {
      console.log("❌ BRIEF2-PAIS não encontrado. Precisa rodar 'npx prisma db seed' primeiro.");
      process.exit(1);
    }

    console.log(`✅ BRIEF2-PAIS encontrado`);
    console.log(`📊 Tabelas de Meninas: ${teste.tabelasNormativas.length}`);
    teste.tabelasNormativas.forEach((t) => console.log(`   - ${t.faixaLabel}`));

    if (teste.tabelasNormativas.length === 4) {
      console.log("✅ Perfeito! Meninas foram inseridas corretamente.");
    } else {
      console.log(`⚠️  Esperava 4 faixas, encontrou ${teste.tabelasNormativas.length}`);
    }
  } catch (e) {
    console.log(`⚠️  Banco inacessível ou vazio. Erro: ${e.message}`);
  }

  await prisma.$disconnect();
})();
