-- AlterTable
ALTER TABLE "Clinica" ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "marcaDaguaUrl" TEXT,
ADD COLUMN     "slogan" TEXT,
ADD COLUMN     "whatsapp" TEXT;

-- AlterTable
ALTER TABLE "Laudo" ADD COLUMN     "anamnese" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "observacaoClinica" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Profissional" ADD COLUMN     "assinaturaUrl" TEXT;
