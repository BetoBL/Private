-- AlterTable
ALTER TABLE "NotaFiscal" ADD COLUMN     "avisos" JSONB,
ADD COLUMN     "numeroNfse" TEXT,
ADD COLUMN     "tentativas" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "xmlDps" TEXT,
ADD COLUMN     "xmlNfse" TEXT;
