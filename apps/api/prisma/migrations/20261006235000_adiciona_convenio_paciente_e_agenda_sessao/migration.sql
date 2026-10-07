-- AlterTable
ALTER TABLE "Convenio" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "EventoAgenda" ADD COLUMN     "sessaoId" TEXT;

-- AlterTable
ALTER TABLE "Paciente" ADD COLUMN     "convenioNumeroCarteira" TEXT,
ADD COLUMN     "convenioPlano" TEXT,
ADD COLUMN     "convenioTitular" TEXT,
ADD COLUMN     "convenioValidade" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Convenio_clinicaId_nomeOperadora_key" ON "Convenio"("clinicaId", "nomeOperadora");

-- CreateIndex
CREATE UNIQUE INDEX "EventoAgenda_sessaoId_key" ON "EventoAgenda"("sessaoId");

-- AddForeignKey
ALTER TABLE "EventoAgenda" ADD CONSTRAINT "EventoAgenda_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "Sessao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

