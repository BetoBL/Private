-- CreateTable
CREATE TABLE "NormativaCustomizada" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "testeId" TEXT NOT NULL,
    "nomeNormativa" TEXT NOT NULL,
    "descricao" TEXT,
    "fonte" TEXT,
    "criterio" TEXT NOT NULL,
    "faixaMin" DOUBLE PRECISION,
    "faixaMax" DOUBLE PRECISION,
    "faixaLabel" TEXT,
    "sexo" "Sexo",
    "conversao" JSONB NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NormativaCustomizada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoAtendimento" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "numeroSessoes" INTEGER NOT NULL DEFAULT 1,
    "testeIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TipoAtendimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaVirtual" (
    "id" TEXT NOT NULL,
    "sessaoId" TEXT NOT NULL,
    "urlJitsi" TEXT NOT NULL,
    "codigoSala" TEXT NOT NULL,
    "statusSala" TEXT NOT NULL DEFAULT 'agendada',
    "inicioAgendado" TIMESTAMP(3) NOT NULL,
    "inicioReal" TIMESTAMP(3),
    "fimReal" TIMESTAMP(3),
    "profissionalPresente" BOOLEAN NOT NULL DEFAULT false,
    "pacientePresente" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaVirtual_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NormativaCustomizada_clinicaId_testeId_criterio_faixaLabel_key" ON "NormativaCustomizada"("clinicaId", "testeId", "criterio", "faixaLabel");

-- CreateIndex
CREATE UNIQUE INDEX "TipoAtendimento_clinicaId_nome_key" ON "TipoAtendimento"("clinicaId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "SalaVirtual_urlJitsi_key" ON "SalaVirtual"("urlJitsi");

-- CreateIndex
CREATE UNIQUE INDEX "SalaVirtual_codigoSala_key" ON "SalaVirtual"("codigoSala");

-- AddForeignKey
ALTER TABLE "NormativaCustomizada" ADD CONSTRAINT "NormativaCustomizada_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NormativaCustomizada" ADD CONSTRAINT "NormativaCustomizada_testeId_fkey" FOREIGN KEY ("testeId") REFERENCES "Teste"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TipoAtendimento" ADD CONSTRAINT "TipoAtendimento_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaVirtual" ADD CONSTRAINT "SalaVirtual_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "Sessao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
