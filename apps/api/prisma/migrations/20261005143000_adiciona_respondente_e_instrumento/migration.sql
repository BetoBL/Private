-- CreateEnum
CREATE TYPE "TipoRespondente" AS ENUM ('PACIENTE', 'MAE', 'PAI', 'CUIDADOR', 'PROFESSOR', 'OUTRO');

-- AlterTable
ALTER TABLE "Teste" ADD COLUMN     "instrumento" TEXT;

-- AlterTable
ALTER TABLE "AplicacaoDeTeste" ADD COLUMN     "respondenteTipo" "TipoRespondente" NOT NULL DEFAULT 'PACIENTE',
ADD COLUMN     "respondenteNome" TEXT,
ADD COLUMN     "respondenteRelacao" TEXT;
