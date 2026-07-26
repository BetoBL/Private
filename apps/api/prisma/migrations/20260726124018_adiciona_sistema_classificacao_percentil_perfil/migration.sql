-- CreateEnum
CREATE TYPE "SistemaClassificacaoPercentil" AS ENUM ('GUILMETTE_2020', 'MIOTTO_2017');

-- AlterTable
ALTER TABLE "PerfilDeAtuacao" ADD COLUMN     "sistemaClassificacaoPercentil" "SistemaClassificacaoPercentil" NOT NULL DEFAULT 'GUILMETTE_2020';
