-- AlterTable
ALTER TABLE "Clinica" ADD COLUMN     "planoVideo" TEXT NOT NULL DEFAULT 'BASICO';

-- AlterTable
ALTER TABLE "SalaVirtual" ADD COLUMN     "provedor" TEXT NOT NULL DEFAULT 'JITSI',
ADD COLUMN     "segredoPaciente" TEXT;

-- CreateTable
CREATE TABLE "ConsentimentoGravacao" (
    "id" TEXT NOT NULL,
    "salaId" TEXT NOT NULL,
    "sessaoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "concedido" BOOLEAN NOT NULL,
    "declaradoPor" TEXT NOT NULL,
    "nomeDeclarante" TEXT NOT NULL,
    "versaoTexto" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revogadoEm" TIMESTAMP(3),

    CONSTRAINT "ConsentimentoGravacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsentimentoGravacao_salaId_tipo_idx" ON "ConsentimentoGravacao"("salaId", "tipo");

-- AddForeignKey
ALTER TABLE "ConsentimentoGravacao" ADD CONSTRAINT "ConsentimentoGravacao_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "SalaVirtual"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
