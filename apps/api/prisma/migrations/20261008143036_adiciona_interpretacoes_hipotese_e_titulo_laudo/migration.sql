-- AlterTable
ALTER TABLE "Laudo" ADD COLUMN     "hipoteseDiagnostica" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "interpretacoes" JSONB;

-- AlterTable
ALTER TABLE "Profissional" ADD COLUMN     "tituloLaudo" TEXT;
