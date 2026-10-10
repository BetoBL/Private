-- AlterTable
ALTER TABLE "ConfigFiscal" ADD COLUMN     "anexoSimples" TEXT NOT NULL DEFAULT '3',
ADD COLUMN     "certificadoCifrado" TEXT,
ADD COLUMN     "certificadoSenhaCifrada" TEXT,
ADD COLUMN     "certificadoTitular" TEXT,
ADD COLUMN     "certificadoValidoAte" TIMESTAMP(3),
ADD COLUMN     "regApuracaoSn" TEXT NOT NULL DEFAULT '1',
ADD COLUMN     "regimeEspecial" TEXT NOT NULL DEFAULT '0';
