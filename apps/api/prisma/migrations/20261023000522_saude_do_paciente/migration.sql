-- CreateTable
CREATE TABLE "ProblemaPaciente" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "cid" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "inicio" DATE,
    "observacao" TEXT,
    "excluidaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProblemaPaciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicamentoPaciente" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dose" TEXT,
    "posologia" TEXT,
    "motivo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'EM_USO',
    "inicio" DATE,
    "fim" DATE,
    "observacao" TEXT,
    "excluidaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicamentoPaciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricaPaciente" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "valor2" DOUBLE PRECISION,
    "data" DATE NOT NULL,
    "observacao" TEXT,
    "excluidaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricaPaciente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProblemaPaciente_pacienteId_idx" ON "ProblemaPaciente"("pacienteId");

-- CreateIndex
CREATE INDEX "MedicamentoPaciente_pacienteId_idx" ON "MedicamentoPaciente"("pacienteId");

-- CreateIndex
CREATE INDEX "MetricaPaciente_pacienteId_tipo_data_idx" ON "MetricaPaciente"("pacienteId", "tipo", "data");
