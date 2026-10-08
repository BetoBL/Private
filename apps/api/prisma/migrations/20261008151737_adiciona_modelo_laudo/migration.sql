-- AlterTable
ALTER TABLE "Laudo" ADD COLUMN     "modeloId" TEXT,
ADD COLUMN     "secoesExtras" JSONB;

-- CreateTable
CREATE TABLE "ModeloLaudo" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT,
    "profissionalId" TEXT,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT,
    "fonte" TEXT,
    "sistema" BOOLEAN NOT NULL DEFAULT false,
    "padrao" BOOLEAN NOT NULL DEFAULT false,
    "origemId" TEXT,
    "estrutura" JSONB NOT NULL,
    "arquivoDocx" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModeloLaudo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Laudo" ADD CONSTRAINT "Laudo_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "ModeloLaudo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModeloLaudo" ADD CONSTRAINT "ModeloLaudo_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModeloLaudo" ADD CONSTRAINT "ModeloLaudo_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE SET NULL ON UPDATE CASCADE;
