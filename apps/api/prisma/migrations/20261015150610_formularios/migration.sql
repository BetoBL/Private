-- CreateTable
CREATE TABLE "ModeloFormulario" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'FORMULARIO',
    "perguntas" JSONB NOT NULL,
    "copiadoDe" TEXT,
    "arquivadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModeloFormulario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormularioPaciente" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'FORMULARIO',
    "modeloRef" TEXT NOT NULL,
    "perguntas" JSONB NOT NULL,
    "respostas" JSONB,
    "modo" TEXT NOT NULL DEFAULT 'LINK',
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "respondidoPor" TEXT,
    "respondidoEm" TIMESTAMP(3),
    "excluidoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormularioPaciente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FormularioPaciente_pacienteId_status_idx" ON "FormularioPaciente"("pacienteId", "status");

-- AddForeignKey
ALTER TABLE "ModeloFormulario" ADD CONSTRAINT "ModeloFormulario_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormularioPaciente" ADD CONSTRAINT "FormularioPaciente_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormularioPaciente" ADD CONSTRAINT "FormularioPaciente_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
