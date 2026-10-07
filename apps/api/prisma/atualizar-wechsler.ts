// Atualiza SÓ o WAIS-III, o WISC-IV e o WASI do catálogo fixo (campos, descrição e tabela normativa) para a versão da planilha,
// SEM apagar lançamentos (o seed completo apaga AplicacaoDeTeste do catálogo fixo — nunca rode o seed em produção).
// Nenhuma tabela aponta para TabelaNormativa por chave estrangeira, então trocar a tabela não mexe nos lançamentos antigos;
// ao reabrir um lançamento antigo, o resultado salvo continua o mesmo até alguém recalcular.
//
// Uso:
//   npx tsx prisma/atualizar-wechsler.ts            → SIMULAÇÃO (só mostra o que mudaria e quantos lançamentos existem)
//   npx tsx prisma/atualizar-wechsler.ts --aplicar  → grava (dentro de uma transação)
// Confira DATABASE_URL antes: o .env da API aponta para o banco de PRODUÇÃO.
import { EscopoTeste, PrismaClient } from "@prisma/client";
import { carregarTestesPlanilha } from "./planilhas-seed";
import { TESTES_PLACEHOLDER } from "./seed";

const prisma = new PrismaClient();
// Wechsler + todos os testes do motor de planilha (docs/testes/planilha). Cria o que ainda não existe no banco.
const TODAS = ["WAIS-III", "WISC-IV", "WASI", ...carregarTestesPlanilha().map((p) => p.sigla)];
// SO_SIGLAS=BPA,FDT limita a atualização a esses testes (útil para publicar aos poucos)
const filtro = (process.env.SO_SIGLAS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const SIGLAS = filtro.length ? TODAS.filter((s) => filtro.includes(s)) : TODAS;

async function main() {
  const aplicar = process.argv.includes("--aplicar");
  const host = (process.env.DATABASE_URL ?? "").replace(/^.*@/, "").replace(/\/.*$/, "");
  console.log(`Banco: ${host || "(DATABASE_URL não definida)"} — modo ${aplicar ? "APLICAR" : "simulação"}`);

  for (const sigla of SIGLAS) {
    const novo = TESTES_PLACEHOLDER.find((t) => t.sigla === sigla);
    if (!novo) throw new Error(`${sigla} não está no seed`);
    const atual = await prisma.teste.findFirst({ where: { sigla, escopo: EscopoTeste.FIXO }, include: { tabelasNormativas: true } });
    if (!atual) {
      console.log(`- ${sigla}: não existe no banco → ${aplicar ? "criando" : "seria criado"}.`);
      if (aplicar) {
        await prisma.teste.create({
          data: {
            nome: novo.nome, sigla, dominio: novo.dominio, escopo: EscopoTeste.FIXO, descricao: novo.descricao, algoritmoCorrecao: novo.algoritmoCorrecao as never,
            referenciaBibliografica: novo.referenciaBibliografica, isPlaceholder: novo.isPlaceholder ?? true, direcao: novo.direcao ?? "NEUTRO", instrumento: novo.instrumento,
            tabelasNormativas: { create: novo.tabelasNormativas.map((f) => ({ criterio: f.criterio, faixaMin: f.faixaMin, faixaMax: f.faixaMax, faixaLabel: f.faixaLabel, sexo: f.sexo, conversao: f.conversao as never })) },
          },
        });
        console.log(`  ✓ ${sigla} criado.`);
      }
      continue;
    }
    const lancamentos = await prisma.aplicacaoDeTeste.count({ where: { testeId: atual.id } });
    const customizadas = await prisma.normativaCustomizada.count({ where: { testeId: atual.id } });
    console.log(`- ${sigla}: ${atual.tabelasNormativas.length} tabela(s) normativa(s) hoje → ${novo.tabelasNormativas.length}; ${lancamentos} lançamento(s) existente(s); ${customizadas} normativa(s) customizada(s).`);
    if (!aplicar) continue;
    await prisma.$transaction(async (tx) => {
      await tx.teste.update({
        where: { id: atual.id },
        data: {
          nome: novo.nome,
          dominio: novo.dominio,
          descricao: novo.descricao,
          algoritmoCorrecao: novo.algoritmoCorrecao as never,
          referenciaBibliografica: novo.referenciaBibliografica,
          isPlaceholder: novo.isPlaceholder ?? true,
          direcao: novo.direcao ?? "NEUTRO",
        },
      });
      await tx.tabelaNormativa.deleteMany({ where: { testeId: atual.id } });
      await tx.tabelaNormativa.createMany({
        data: novo.tabelasNormativas.map((f) => ({ testeId: atual.id, criterio: f.criterio, faixaMin: f.faixaMin, faixaMax: f.faixaMax, faixaLabel: f.faixaLabel, sexo: f.sexo, conversao: f.conversao as never })),
      });
    });
    console.log(`  ✓ ${sigla} atualizado.`);
  }
  if (!aplicar) console.log("\nSimulação concluída. Para gravar: npx tsx prisma/atualizar-wechsler.ts --aplicar");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
