-- CreateTable
CREATE TABLE "SolicitacaoEscala" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "escala" TEXT NOT NULL,
    "prazo" DATE NOT NULL,
    "frequencia" TEXT NOT NULL DEFAULT 'UNICA',
    "serieId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "respostas" JSONB,
    "pontuacao" JSONB,
    "alertaRisco" BOOLEAN NOT NULL DEFAULT false,
    "respondidaEm" TIMESTAMP(3),
    "excluidaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolicitacaoEscala_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SolicitacaoEscala_pacienteId_status_idx" ON "SolicitacaoEscala"("pacienteId", "status");

-- AddForeignKey
ALTER TABLE "SolicitacaoEscala" ADD CONSTRAINT "SolicitacaoEscala_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitacaoEscala" ADD CONSTRAINT "SolicitacaoEscala_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
