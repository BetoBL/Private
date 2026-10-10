-- CreateTable
CREATE TABLE "Gravacao" (
    "id" TEXT NOT NULL,
    "salaId" TEXT NOT NULL,
    "sessaoId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GRAVANDO',
    "formato" TEXT NOT NULL DEFAULT 'audio/webm',
    "armazenamento" TEXT NOT NULL,
    "prefixo" TEXT NOT NULL,
    "chaveCifrada" TEXT NOT NULL,
    "partes" INTEGER NOT NULL DEFAULT 0,
    "bytes" INTEGER NOT NULL DEFAULT 0,
    "duracaoSeg" INTEGER,
    "versaoConsentimento" TEXT NOT NULL,
    "iniciadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimaParteEm" TIMESTAMP(3),
    "encerradaEm" TIMESTAMP(3),
    "apagarAudioEm" TIMESTAMP(3),
    "audioApagadoEm" TIMESTAMP(3),

    CONSTRAINT "Gravacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GravacaoAcesso" (
    "id" TEXT NOT NULL,
    "gravacaoId" TEXT NOT NULL,
    "profissionalId" TEXT,
    "acao" TEXT NOT NULL,
    "ip" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GravacaoAcesso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Gravacao_sessaoId_idx" ON "Gravacao"("sessaoId");

-- CreateIndex
CREATE INDEX "Gravacao_pacienteId_iniciadaEm_idx" ON "Gravacao"("pacienteId", "iniciadaEm");

-- CreateIndex
CREATE INDEX "GravacaoAcesso_gravacaoId_idx" ON "GravacaoAcesso"("gravacaoId");

-- AddForeignKey
ALTER TABLE "Gravacao" ADD CONSTRAINT "Gravacao_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "SalaVirtual"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GravacaoAcesso" ADD CONSTRAINT "GravacaoAcesso_gravacaoId_fkey" FOREIGN KEY ("gravacaoId") REFERENCES "Gravacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
