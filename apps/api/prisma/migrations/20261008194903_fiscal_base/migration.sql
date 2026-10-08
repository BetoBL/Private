-- AlterTable
ALTER TABLE "Cobranca" ADD COLUMN     "codigoTuss" TEXT,
ADD COLUMN     "notaFiscalId" TEXT,
ADD COLUMN     "numeroGuia" TEXT,
ADD COLUMN     "senhaAutorizacao" TEXT;

-- AlterTable
ALTER TABLE "Convenio" ADD COLUMN     "cnpj" TEXT,
ADD COLUMN     "diaFechamento" INTEGER,
ADD COLUMN     "exigeTiss" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "formaFaturamento" TEXT,
ADD COLUMN     "observacoesFaturamento" TEXT,
ADD COLUMN     "prazoPagamentoDias" INTEGER,
ADD COLUMN     "razaoSocial" TEXT,
ADD COLUMN     "registroAns" TEXT;

-- CreateTable
CREATE TABLE "ConfigFiscal" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "emissaoAtiva" BOOLEAN NOT NULL DEFAULT false,
    "ambiente" TEXT NOT NULL DEFAULT 'HOMOLOGACAO',
    "regime" TEXT NOT NULL DEFAULT 'SIMPLES_NACIONAL',
    "inscricaoMunicipal" TEXT,
    "codigoMunicipioIbge" TEXT,
    "localPrestacaoIbge" TEXT,
    "cTribNac" TEXT,
    "nbs" TEXT,
    "descricaoPadrao" TEXT NOT NULL DEFAULT 'Prestação de serviços em atendimento de Psicologia {{sessao.data}}',
    "aliquotaModo" TEXT NOT NULL DEFAULT 'FIXA',
    "aliquotaIss" DECIMAL(5,2),
    "rbt12" DECIMAL(14,2),
    "issRetido" BOOLEAN NOT NULL DEFAULT false,
    "serieDps" TEXT NOT NULL DEFAULT '1',
    "proximoNumeroDps" INTEGER NOT NULL DEFAULT 1,
    "modoParticular" TEXT NOT NULL DEFAULT 'POR_SESSAO',
    "quandoEmitir" TEXT NOT NULL DEFAULT 'MANUAL',
    "modoConvenio" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "exigeDataPagamento" BOOLEAN NOT NULL DEFAULT true,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigFiscal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotaFiscal" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "ambiente" TEXT NOT NULL DEFAULT 'HOMOLOGACAO',
    "serie" TEXT,
    "numero" INTEGER,
    "competencia" DATE NOT NULL,
    "tomadorNome" TEXT NOT NULL,
    "tomadorDocumento" TEXT,
    "tomadorConvenioId" TEXT,
    "tomadorEndereco" JSONB,
    "valor" DECIMAL(10,2) NOT NULL,
    "descricao" TEXT NOT NULL,
    "datasServico" JSONB,
    "chaveAcesso" TEXT,
    "protocolo" TEXT,
    "erro" TEXT,
    "emitidaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotaFiscal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfigFiscal_clinicaId_key" ON "ConfigFiscal"("clinicaId");

-- CreateIndex
CREATE INDEX "NotaFiscal_clinicaId_status_competencia_idx" ON "NotaFiscal"("clinicaId", "status", "competencia");

-- CreateIndex
CREATE UNIQUE INDEX "NotaFiscal_clinicaId_ambiente_serie_numero_key" ON "NotaFiscal"("clinicaId", "ambiente", "serie", "numero");

-- AddForeignKey
ALTER TABLE "Cobranca" ADD CONSTRAINT "Cobranca_notaFiscalId_fkey" FOREIGN KEY ("notaFiscalId") REFERENCES "NotaFiscal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfigFiscal" ADD CONSTRAINT "ConfigFiscal_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaFiscal" ADD CONSTRAINT "NotaFiscal_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
