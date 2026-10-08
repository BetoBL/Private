-- CreateTable
CREATE TABLE "ResumoDoDia" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "assinatura" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumoDoDia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResumoDoDia_profissionalId_data_key" ON "ResumoDoDia"("profissionalId", "data");
