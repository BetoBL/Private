-- AlterTable
ALTER TABLE "CartaoDiario" ADD COLUMN     "acaoImpulso" TEXT,
ADD COLUMN     "impulso" TEXT,
ADD COLUMN     "pesos" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "ConfigDiario" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "etapas" JSONB NOT NULL,
    "emocoesOcultas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigDiario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfigDiario_pacienteId_key" ON "ConfigDiario"("pacienteId");
