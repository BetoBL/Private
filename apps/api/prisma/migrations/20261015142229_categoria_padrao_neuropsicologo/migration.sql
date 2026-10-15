-- O sistema nasceu para neuropsicologia: quem já existe continua vendo testes e laudos.
-- Novos profissionais escolhem o tipo no cadastro.
ALTER TABLE "Profissional" ALTER COLUMN "categoria" SET DEFAULT 'NEUROPSICOLOGO';
UPDATE "Profissional" SET "categoria" = 'NEUROPSICOLOGO' WHERE "categoria" = 'PSICOLOGO';
