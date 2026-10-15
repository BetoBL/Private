-- AlterTable
ALTER TABLE "Profissional" ADD COLUMN     "categoria" TEXT NOT NULL DEFAULT 'PSICOLOGO';

-- CreateTable
CREATE TABLE "Evolucao" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "eventoAgendaId" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "modelo" TEXT NOT NULL DEFAULT 'LIVRE',
    "campos" JSONB,
    "anotacoes" TEXT,
    "evolucao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "finalizadaEm" TIMESTAMP(3),
    "geradaPorIA" BOOLEAN NOT NULL DEFAULT false,
    "versoes" JSONB,
    "excluidaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evolucao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemContinuidade" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "evolucaoId" TEXT,
    "tipo" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ANDAMENTO',
    "concluidoEm" TIMESTAMP(3),
    "excluidoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItemContinuidade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Evolucao_pacienteId_dataHora_idx" ON "Evolucao"("pacienteId", "dataHora");

-- CreateIndex
CREATE INDEX "ItemContinuidade_pacienteId_status_idx" ON "ItemContinuidade"("pacienteId", "status");

-- AddForeignKey
ALTER TABLE "Evolucao" ADD CONSTRAINT "Evolucao_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evolucao" ADD CONSTRAINT "Evolucao_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemContinuidade" ADD CONSTRAINT "ItemContinuidade_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemContinuidade" ADD CONSTRAINT "ItemContinuidade_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemContinuidade" ADD CONSTRAINT "ItemContinuidade_evolucaoId_fkey" FOREIGN KEY ("evolucaoId") REFERENCES "Evolucao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
