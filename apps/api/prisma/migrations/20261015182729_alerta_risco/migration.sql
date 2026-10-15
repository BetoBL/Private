-- CreateTable
CREATE TABLE "AlertaRisco" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "origemId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vistoEm" TIMESTAMP(3),
    "emailEnviadoEm" TIMESTAMP(3),

    CONSTRAINT "AlertaRisco_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlertaRisco_profissionalId_vistoEm_idx" ON "AlertaRisco"("profissionalId", "vistoEm");

-- CreateIndex
CREATE INDEX "AlertaRisco_clinicaId_criadoEm_idx" ON "AlertaRisco"("clinicaId", "criadoEm");
