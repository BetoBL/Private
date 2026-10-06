// Verificação ponta a ponta do SRS-2: monta a MESMA `conversao` que o seed grava por formulário e
// roda o motor de cálculo em cima dela, sem tocar no banco. Mesmo princípio de
// verificar-fdt-motor.ts / verificar-wisc4-motor.ts.
//
// Uso: npx tsx scripts/verificar-srs2-motor.ts
import { SRS2_CAMPOS_DERIVADOS, SRS2_FORMULARIOS, SRS2_SUBESCALAS } from "../apps/api/prisma/srs2-normas";
import { calcularResultado, type ConversaoNormativa } from "../apps/api/src/lib/motorCalculo";

const erros: string[] = [];
function checar(condicao: boolean, mensagem: string) {
  if (!condicao) erros.push(mensagem);
}

console.log("Verificando SRS-2: normas -> conversao -> motor\n");

checar(SRS2_FORMULARIOS.length === 5, `esperava 5 formulários, achei ${SRS2_FORMULARIOS.length}`);
for (const form of SRS2_FORMULARIOS) {
  console.log(`  ${form.sigla} (${form.label}) — ${Object.keys(form.faixasPorCampo).length} campos com tabela`);
  for (const chave of [...SRS2_SUBESCALAS, "restritosRepetitivos", "comunicacaoInteracaoSocial", "escoreTotal"]) {
    checar(!!form.faixasPorCampo[chave]?.length, `${form.sigla}/${chave}: sem tabela`);
    const faixas = form.faixasPorCampo[chave] ?? [];
    if (faixas.length > 0) checar(faixas[0].min === 0, `${form.sigla}/${chave}: 1º bruto não é 0`);
  }
}

// --- Caso real: Pré-Escolar, 4 subescalas lançadas + RRB -> SCI e Total somam certo ---
const preEscolar = SRS2_FORMULARIOS.find((f) => f.chave === "preEscolar")!;
const conversaoPreEscolar: ConversaoNormativa = {
  tipo: "percentil_por_campo",
  faixasPorCampo: preEscolar.faixasPorCampo,
  camposDerivados: SRS2_CAMPOS_DERIVADOS,
};
const entrada = { percepcaoSocial: 5, cognicaoSocial: 5, comunicacaoSocial: 5, motivacaoSocial: 5, restritosRepetitivos: 5 };
const r = calcularResultado(entrada, conversaoPreEscolar);
checar(r.modo === "por_campo", "esperado modo por_campo");
if (r.modo === "por_campo") {
  checar(r.porCampo.comunicacaoInteracaoSocial.valorBruto === 20, `SCI esperado 20 (4x5), veio ${r.porCampo.comunicacaoInteracaoSocial.valorBruto}`);
  checar(r.porCampo.escoreTotal.valorBruto === 25, `Total esperado 25 (20+5), veio ${r.porCampo.escoreTotal.valorBruto}`);
  console.log(
    `\n  Pré-Escolar, todas as subescalas=5: SCI=${r.porCampo.comunicacaoInteracaoSocial.valorBruto} -> ${r.porCampo.comunicacaoInteracaoSocial.faixa?.classificacao} (T=${r.porCampo.comunicacaoInteracaoSocial.faixa?.escoreT}), ` +
      `Total=${r.porCampo.escoreTotal.valorBruto} -> ${r.porCampo.escoreTotal.faixa?.classificacao} (T=${r.porCampo.escoreTotal.faixa?.escoreT})`
  );
}

// --- Sem lançar uma subescala: SCI/Total voltam "não calculado", nunca somam 0 no lugar dela ---
const entradaIncompleta = { percepcaoSocial: 5, cognicaoSocial: 5, comunicacaoSocial: 5 }; // falta motivacaoSocial e restritosRepetitivos
const rIncompleta = calcularResultado(entradaIncompleta, conversaoPreEscolar);
if (rIncompleta.modo === "por_campo") {
  checar(rIncompleta.porCampo.comunicacaoInteracaoSocial.valorBruto === null, "sem motivacaoSocial, SCI deveria ser null (não somar 0)");
  checar(rIncompleta.porCampo.escoreTotal.valorBruto === null, "sem motivacaoSocial/restritosRepetitivos, Total deveria ser null (não somar 0)");
  console.log(`\n  sem motivação/RRB: SCI=${rIncompleta.porCampo.comunicacaoInteracaoSocial.valorBruto}, Total=${rIncompleta.porCampo.escoreTotal.valorBruto}`);
}

if (erros.length > 0) {
  console.error(`\n${erros.length} ERRO(S):`);
  for (const e of erros) console.error(`  ! ${e}`);
  process.exit(1);
}
console.log("\nOK — todas as checagens passaram.");
