-- CreateTable
CREATE TABLE "ModeloPedido" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "itens" JSONB NOT NULL DEFAULT '[]',
    "texto" TEXT,
    "compartilhado" BOOLEAN NOT NULL DEFAULT false,
    "excluidaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModeloPedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoPaciente" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "itens" JSONB NOT NULL DEFAULT '[]',
    "texto" TEXT,
    "indicacao" TEXT,
    "excluidaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PedidoPaciente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ModeloPedido_clinicaId_tipo_idx" ON "ModeloPedido"("clinicaId", "tipo");

-- CreateIndex
CREATE INDEX "PedidoPaciente_pacienteId_criadoEm_idx" ON "PedidoPaciente"("pacienteId", "criadoEm");
