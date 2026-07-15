-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EscopoTeste" AS ENUM ('FIXO', 'CUSTOM');

-- CreateEnum
CREATE TYPE "DominioCognitivo" AS ENUM ('INTELIGENCIA', 'ATENCAO', 'MEMORIA', 'FUNCOES_EXECUTIVAS', 'LINGUAGEM_APRENDIZAGEM', 'PERSONALIDADE', 'SINTOMAS_EMOCIONAIS', 'RASTREIO_TDAH', 'RASTREIO_TEA', 'DESENVOLVIMENTO', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusLaudo" AS ENUM ('RASCUNHO_IA', 'EM_REVISAO', 'FINALIZADO', 'ENTREGUE');

-- CreateTable
CREATE TABLE "Clinica" (
    "id" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "cnpj" TEXT,
    "endereco" TEXT,
    "telefone" TEXT,
    "logoUrl" TEXT,
    "corPrimaria" TEXT,
    "corSecundaria" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Clinica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profissional" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "crp" TEXT NOT NULL,
    "telefone" TEXT,
    "enderecoParticular" TEXT,
    "formacao" TEXT,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Profissional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerfilDeAtuacao" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "abordagemTeorica" TEXT,
    "tomDeEscrita" TEXT,
    "regrasDePrudencia" TEXT,
    "vocabularioRecorrente" TEXT,
    "laudosExemplo" JSONB,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerfilDeAtuacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paciente" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dataNascimento" TIMESTAMP(3) NOT NULL,
    "fotoUrl" TEXT,
    "responsavelLegal" TEXT,
    "contato" TEXT,
    "escolaridade" TEXT,
    "convenioId" TEXT,
    "anamnese" JSONB,
    "consentimentoTDIC" BOOLEAN NOT NULL DEFAULT false,
    "consentimentoTDICData" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Paciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anexo" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "descricao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Anexo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sessao" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teste" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "dominio" "DominioCognitivo" NOT NULL,
    "escopo" "EscopoTeste" NOT NULL,
    "criadoPorProfissionalId" TEXT,
    "descricao" TEXT,
    "algoritmoCorrecao" JSONB NOT NULL,
    "referenciaBibliografica" TEXT,
    "isPlaceholder" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Teste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TabelaNormativa" (
    "id" TEXT NOT NULL,
    "testeId" TEXT NOT NULL,
    "criterio" TEXT NOT NULL,
    "faixaMin" DOUBLE PRECISION,
    "faixaMax" DOUBLE PRECISION,
    "faixaLabel" TEXT,
    "conversao" JSONB NOT NULL,

    CONSTRAINT "TabelaNormativa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AplicacaoDeTeste" (
    "id" TEXT NOT NULL,
    "sessaoId" TEXT NOT NULL,
    "testeId" TEXT NOT NULL,
    "escoresBrutos" JSONB NOT NULL,
    "resultadoCalculado" JSONB,
    "calculadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AplicacaoDeTeste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Laudo" (
    "id" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "identificacao" JSONB NOT NULL,
    "descricaoDemanda" TEXT NOT NULL,
    "procedimento" TEXT NOT NULL,
    "analise" TEXT NOT NULL,
    "conclusao" TEXT NOT NULL,
    "referencias" TEXT NOT NULL,
    "status" "StatusLaudo" NOT NULL DEFAULT 'RASCUNHO_IA',
    "dataDevolutiva" TIMESTAMP(3),
    "arquivoUrl" TEXT,
    "iaUtilizada" BOOLEAN NOT NULL DEFAULT false,
    "iaRevisadaPeloProf" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Laudo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Convenio" (
    "id" TEXT NOT NULL,
    "clinicaId" TEXT NOT NULL,
    "nomeOperadora" TEXT NOT NULL,
    "codigoPrestador" TEXT,

    CONSTRAINT "Convenio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfissionalConvenio" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "convenioId" TEXT NOT NULL,

    CONSTRAINT "ProfissionalConvenio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TabelaValorConvenio" (
    "id" TEXT NOT NULL,
    "convenioId" TEXT NOT NULL,
    "codigoTUSS" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "TabelaValorConvenio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profissional_email_key" ON "Profissional"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PerfilDeAtuacao_profissionalId_key" ON "PerfilDeAtuacao"("profissionalId");

-- AddForeignKey
ALTER TABLE "Profissional" ADD CONSTRAINT "Profissional_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfilDeAtuacao" ADD CONSTRAINT "PerfilDeAtuacao_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paciente" ADD CONSTRAINT "Paciente_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paciente" ADD CONSTRAINT "Paciente_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paciente" ADD CONSTRAINT "Paciente_convenioId_fkey" FOREIGN KEY ("convenioId") REFERENCES "Convenio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anexo" ADD CONSTRAINT "Anexo_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teste" ADD CONSTRAINT "Teste_criadoPorProfissionalId_fkey" FOREIGN KEY ("criadoPorProfissionalId") REFERENCES "Profissional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TabelaNormativa" ADD CONSTRAINT "TabelaNormativa_testeId_fkey" FOREIGN KEY ("testeId") REFERENCES "Teste"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AplicacaoDeTeste" ADD CONSTRAINT "AplicacaoDeTeste_sessaoId_fkey" FOREIGN KEY ("sessaoId") REFERENCES "Sessao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AplicacaoDeTeste" ADD CONSTRAINT "AplicacaoDeTeste_testeId_fkey" FOREIGN KEY ("testeId") REFERENCES "Teste"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Laudo" ADD CONSTRAINT "Laudo_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Laudo" ADD CONSTRAINT "Laudo_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convenio" ADD CONSTRAINT "Convenio_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "Clinica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfissionalConvenio" ADD CONSTRAINT "ProfissionalConvenio_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfissionalConvenio" ADD CONSTRAINT "ProfissionalConvenio_convenioId_fkey" FOREIGN KEY ("convenioId") REFERENCES "Convenio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TabelaValorConvenio" ADD CONSTRAINT "TabelaValorConvenio_convenioId_fkey" FOREIGN KEY ("convenioId") REFERENCES "Convenio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

