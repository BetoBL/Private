// Verificação ponta a ponta do FDT: monta a MESMA `conversao` que o seed grava na TabelaNormativa
// e roda o motor de cálculo em cima dela, sem tocar no banco. Mesmo princípio de
// verificar-wisc4-motor.ts.
//
// Uso: npx tsx scripts/verificar-fdt-motor.ts
import { FDT_CAMPOS_DERIVADOS, FDT_FAIXAS_ETARIAS, campoErros, campoTempo } from "../apps/api/prisma/fdt-normas";
import { calcularResultado, escolherTabelaNormativa, type ConversaoNormativa } from "../apps/api/src/lib/motorCalculo";

const erros: string[] = [];
function checar(condicao: boolean, mensagem: string) {
  if (!condicao) erros.push(mensagem);
}

const TABELAS = FDT_FAIXAS_ETARIAS.map((faixa) => ({
  criterio: "idade",
  faixaMin: faixa.faixaMin,
  faixaMax: faixa.faixaMax,
  faixaLabel: faixa.faixaLabel,
  conversao: {
    tipo: "percentil_por_campo",
    faixasPorCampo: faixa.faixasPorCampo,
    camposDerivados: FDT_CAMPOS_DERIVADOS,
  } as ConversaoNormativa,
}));

console.log("Verificando FDT: normas -> conversao -> motor\n");

// --- 1. Cobertura estrutural: 9 faixas, sem sobreposição nem buraco entre 6 e 76+ ---
checar(TABELAS.length === 9, `esperava 9 faixas etárias, achei ${TABELAS.length}`);
const ordenadas = [...TABELAS].sort((a, b) => a.faixaMin - b.faixaMin);
for (let i = 1; i < ordenadas.length; i++) {
  checar(
    ordenadas[i].faixaMin === ordenadas[i - 1].faixaMax + 1,
    `buraco/sobreposição entre "${ordenadas[i - 1].faixaLabel}" (até ${ordenadas[i - 1].faixaMax}) e "${ordenadas[i].faixaLabel}" (de ${ordenadas[i].faixaMin})`
  );
}
console.log(`  9 faixas, ${ordenadas[0].faixaMin} a ${ordenadas[ordenadas.length - 1].faixaMax} (76+ representado como teto 999)`);

// --- 2. Seleção de tabela por idade escolhe a faixa certa, incluindo a aberta (76+) ---
for (const idade of [7, 10, 60, 76, 90]) {
  const tabela = escolherTabelaNormativa({ idadeAnos: idade }, TABELAS);
  checar(!!tabela && idade >= tabela.faixaMin && idade <= tabela.faixaMax, `idade ${idade} não caiu em nenhuma faixa (achou "${tabela?.faixaLabel}")`);
  console.log(`  idade ${idade} -> ${tabela?.faixaLabel}`);
}

// --- 3. Caso real: criança de 7 anos, todos os tempos rápidos (deve classificar bem) ---
const tabela7 = escolherTabelaNormativa({ idadeAnos: 7 }, TABELAS)!;
const entrada7 = {
  [campoTempo("leitura")]: 10,
  [campoTempo("contagem")]: 12,
  [campoTempo("escolha")]: 20,
  [campoTempo("alternancia")]: 30,
  [campoErros("leitura")]: 0,
  [campoErros("contagem")]: 0,
  [campoErros("escolha")]: 0,
  [campoErros("alternancia")]: 0,
};
const r7 = calcularResultado(entrada7, tabela7.conversao);
checar(r7.modo === "por_campo", "esperado modo por_campo");
if (r7.modo === "por_campo") {
  const inib = r7.porCampo[campoTempo("inibicao")];
  const flex = r7.porCampo[campoTempo("flexibilidade")];
  checar(inib.valorBruto === 20 - 12, `inibição esperada 8 (20-12), veio ${inib.valorBruto}`);
  checar(flex.valorBruto === 30 - 20, `flexibilidade esperada 10 (30-20), veio ${flex.valorBruto}`);
  console.log(
    `\n  7 anos, tempos rápidos: Leitura=${r7.porCampo[campoTempo("leitura")].faixa?.classificacao} (${r7.porCampo[campoTempo("leitura")].faixa?.percentil}), ` +
      `Inibição=${inib.valorBruto}s -> ${inib.faixa?.classificacao} (${inib.faixa?.percentil}), ` +
      `Flexibilidade=${flex.valorBruto}s -> ${flex.faixa?.classificacao} (${flex.faixa?.percentil})`
  );
}

// --- 4. Sem lançar um tempo-fonte: Inibição/Flexibilidade voltam "não calculado", não subtraem 0 ---
const entradaIncompleta = { [campoTempo("leitura")]: 10, [campoTempo("escolha")]: 20 }; // falta contagem/alternancia
const rIncompleta = calcularResultado(entradaIncompleta, tabela7.conversao);
if (rIncompleta.modo === "por_campo") {
  checar(rIncompleta.porCampo[campoTempo("inibicao")].valorBruto === null, "sem tempoContagem, Inibição deveria ser null (não subtrair 0)");
  checar(rIncompleta.porCampo[campoTempo("flexibilidade")].valorBruto === null, "sem tempoAlternancia, Flexibilidade deveria ser null (não subtrair 0)");
  console.log(`\n  sem contagem/alternância: Inibição=${rIncompleta.porCampo[campoTempo("inibicao")].valorBruto}, Flexibilidade=${rIncompleta.porCampo[campoTempo("flexibilidade")].valorBruto}`);
}

// --- 5. Cada subteste de cada faixa cobre bruto 0 em diante sem buraco (reaproveita a guarda já feita no parser, aqui só confere que chegou inteira no seed) ---
for (const tabela of TABELAS) {
  for (const [campo, faixas] of Object.entries(tabela.conversao.faixasPorCampo ?? {})) {
    checar(faixas.length > 0, `${tabela.faixaLabel}/${campo}: 0 faixas (deveria ter ao menos 1)`);
    const semMax = faixas.filter((f) => f.max === undefined);
    checar(semMax.length === 1, `${tabela.faixaLabel}/${campo}: esperava exatamente 1 faixa em aberto (sem max), achei ${semMax.length}`);
  }
}
console.log(`\n  ${TABELAS.length * Object.keys(TABELAS[0].conversao.faixasPorCampo ?? {}).length} tabelas bruto->percentil conferidas (1 faixa aberta cada)`);

if (erros.length > 0) {
  console.error(`\n${erros.length} ERRO(S):`);
  for (const e of erros) console.error(`  ! ${e}`);
  process.exit(1);
}
console.log("\nOK — todas as checagens passaram.");
