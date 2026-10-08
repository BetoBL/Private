/*
  Warnings:

  - You are about to drop the column `padrao` on the `ModeloLaudo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Clinica" ADD COLUMN     "modeloLaudoPadraoId" TEXT;

-- AlterTable
ALTER TABLE "ModeloLaudo" DROP COLUMN "padrao";

-- AlterTable
ALTER TABLE "Profissional" ADD COLUMN     "modeloLaudoPadraoId" TEXT;
