-- CreateEnum
CREATE TYPE "PapelProfissional" AS ENUM ('ADMIN', 'PSICOLOGO');

-- AlterTable
ALTER TABLE "Profissional" ADD COLUMN     "especialidades" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "papel" "PapelProfissional" NOT NULL DEFAULT 'PSICOLOGO';

-- AlterTable
ALTER TABLE "PerfilDeAtuacao" ADD COLUMN     "respostas" JSONB;

-- AlterTable
ALTER TABLE "Paciente" ADD COLUMN     "preferenciasAgenda" JSONB;

-- CreateTable
CREATE TABLE "EventoAgenda" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "pacienteId" TEXT,
    "titulo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3) NOT NULL,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoAgenda_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EventoAgenda" ADD CONSTRAINT "EventoAgenda_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoAgenda" ADD CONSTRAINT "EventoAgenda_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

