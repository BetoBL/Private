-- CreateTable
CREATE TABLE "AcessoDiario" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "segredo" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revogadoEm" TIMESTAMP(3),
    "ultimoUsoEm" TIMESTAMP(3),

    CONSTRAINT "AcessoDiario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartaoDiario" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "ocorridoEm" DATE NOT NULL,
    "registradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emocao" TEXT NOT NULL,
    "familia" TEXT NOT NULL,
    "intensidade" INTEGER NOT NULL,
    "contexto" TEXT,
    "notaContexto" TEXT,
    "primeiraAcao" TEXT,
    "acoesQueAjudaram" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ajudou" TEXT,
    "notaCuidado" TEXT,
    "fechamento" TEXT,
    "levarParaSessao" BOOLEAN NOT NULL DEFAULT false,
    "notaFinal" TEXT,
    "lidoEm" TIMESTAMP(3),
    "conversadoEm" TIMESTAMP(3),
    "versaoCatalogo" TEXT NOT NULL,

    CONSTRAINT "CartaoDiario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcessoDiario_segredo_key" ON "AcessoDiario"("segredo");

-- CreateIndex
CREATE INDEX "AcessoDiario_pacienteId_revogadoEm_idx" ON "AcessoDiario"("pacienteId", "revogadoEm");

-- CreateIndex
CREATE INDEX "CartaoDiario_pacienteId_ocorridoEm_idx" ON "CartaoDiario"("pacienteId", "ocorridoEm");

-- CreateIndex
CREATE INDEX "CartaoDiario_clinicaId_levarParaSessao_conversadoEm_idx" ON "CartaoDiario"("clinicaId", "levarParaSessao", "conversadoEm");
