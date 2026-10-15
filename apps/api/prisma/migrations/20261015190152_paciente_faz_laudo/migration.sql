-- AlterTable
ALTER TABLE "Paciente" ADD COLUMN     "fazLaudo" BOOLEAN NOT NULL DEFAULT false;

-- Quem já estava cadastrado usava o fluxo de laudo: continua vendo tudo. Só os pacientes novos nascem como "sem laudo".
UPDATE "Paciente" SET "fazLaudo" = true;
