-- CreateTable
CREATE TABLE "ResumoCasoIA" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "conteudo" JSONB NOT NULL,
    "sessoesConsideradas" INTEGER NOT NULL DEFAULT 0,
    "geradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumoCasoIA_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResumoCasoIA_pacienteId_geradoEm_idx" ON "ResumoCasoIA"("pacienteId", "geradoEm");
