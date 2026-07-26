-- CreateEnum
CREATE TYPE "DirecaoMelhorPior" AS ENUM ('MAIOR_MELHOR', 'MENOR_MELHOR', 'NEUTRO');

-- AlterTable
ALTER TABLE "Teste" ADD COLUMN     "direcao" "DirecaoMelhorPior" NOT NULL DEFAULT 'NEUTRO';
