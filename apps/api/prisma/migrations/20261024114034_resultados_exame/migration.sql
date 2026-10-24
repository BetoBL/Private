-- CreateTable
CREATE TABLE "ResultadoExame" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "laboratorio" TEXT,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'NUMERICO',
    "valor" DOUBLE PRECISION,
    "valorTexto" TEXT,
    "unidade" TEXT,
    "referencia" TEXT,
    "fora" BOOLEAN,
    "origem" TEXT NOT NULL DEFAULT 'IA',
    "excluidaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResultadoExame_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResultadoExame_pacienteId_nome_data_idx" ON "ResultadoExame"("pacienteId", "nome", "data");
