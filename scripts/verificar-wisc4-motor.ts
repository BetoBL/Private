// Verificação ponta a ponta do WISC-IV: monta a MESMA `conversao` que o seed grava na
// TabelaNormativa e roda o motor de cálculo em cima dela, sem tocar no banco.
//
// Uso: npx tsx scripts/verificar-wisc4-motor.ts
//
// O caso central se auto-confere: escolhe, para cada subteste, um escore bruto que converte em
// ponto ponderado 10 (a média da escala). Os 10 principais somam 30/30/20/20 nos índices e 100 no
// QIT — e as Tabelas A.2-A.6 dizem que essas somas dão composto ~100 e percentil ~50. Ou seja: se
// a inversão das tabelas A.1.x ou a derivação dos índices estiver errada, o resultado sai do 100.
import {
  WISC4_FAIXAS_ETARIAS,
  WISC4_INDICES,
  WISC4_PRINCIPAIS,
  WISC4_SUPLEMENTARES,
} from "../apps/api/prisma/wisc4-normas";
import { calcularResultado, escolherTabelaNormativa, type ConversaoNormativa } from "../apps/api/src/lib/motorCalculo";

const erros: string[] = [];
function checar(condicao: boolean, mensagem: string) {
  if (!condicao) erros.push(mensagem);
}

// Reproduz o formato que seed.ts grava em TabelaNormativa.conversao.
function conversaoDaFaixa(faixa: (typeof WISC4_FAIXAS_ETARIAS)[number]): ConversaoNormativa {
  return {
    tipo: "ponderado_e_composto_por_campo",
    faixasPorCampo: {
      ...faixa.faixasPorSubteste,
      ...Object.fromEntries(WISC4_INDICES.map((i) => [i.chave, i.faixas])),
    },
    camposDerivados: Object.fromEntries(
      WISC4_INDICES.map((i) => [i.chave, { somaDe: i.fontes, campoValor: "ponderado", exigeTodasFontes: true }])
    ),
  } as unknown as ConversaoNormativa;
}

console.log("Verificando WISC-IV: normas -> conversao -> motor\n");

// --- 1. Cobertura estrutural ---

checar(WISC4_FAIXAS_ETARIAS.length === 33, `esperado 33 faixas etárias, veio ${WISC4_FAIXAS_ETARIAS.length}`);
checar(WISC4_PRINCIPAIS.length === 10, `esperado 10 subtestes principais, veio ${WISC4_PRINCIPAIS.length}`);
checar(WISC4_SUPLEMENTARES.length === 5, `esperado 5 suplementares, veio ${WISC4_SUPLEMENTARES.length}`);
checar(WISC4_INDICES.length === 5, `esperado 5 índices (4 fatoriais + QIT), veio ${WISC4_INDICES.length}`);

const primeira = WISC4_FAIXAS_ETARIAS[0];
const ultima = WISC4_FAIXAS_ETARIAS[WISC4_FAIXAS_ETARIAS.length - 1];
checar(primeira.faixaMin === 72, `1ª faixa deveria começar em 72 meses (6:0), veio ${primeira.faixaMin}`);
checar(ultima.faixaMax === 203, `última faixa deveria terminar em 203 meses (16:11), veio ${ultima.faixaMax}`);

// Nenhum buraco nem sobreposição entre as 33 faixas de 4 meses.
for (let i = 1; i < WISC4_FAIXAS_ETARIAS.length; i++) {
  const anterior = WISC4_FAIXAS_ETARIAS[i - 1];
  const atual = WISC4_FAIXAS_ETARIAS[i];
  checar(
    atual.faixaMin === anterior.faixaMax + 1,
    `descontinuidade entre ${anterior.faixaLabel} (até ${anterior.faixaMax}) e ${atual.faixaLabel} (de ${atual.faixaMin})`
  );
}

// Todas as 33 faixas têm os 15 subtestes.
for (const faixa of WISC4_FAIXAS_ETARIAS) {
  for (const sub of [...WISC4_PRINCIPAIS, ...WISC4_SUPLEMENTARES]) {
    const faixasDoSub = faixa.faixasPorSubteste[sub];
    checar(
      Array.isArray(faixasDoSub) && faixasDoSub.length > 0,
      `faixa ${faixa.faixaLabel}: subteste "${sub}" sem tabela de conversão`
    );
  }
}

// --- 2. Seleção da tabela por idade em meses (o mesmo caminho da rota de aplicação) ---

const alvo = escolherTabelaNormativa(
  { idadeAnos: 8, idadeMeses: 101 }, // 8 anos e 5 meses
  WISC4_FAIXAS_ETARIAS.map((f) => ({ criterio: "idade_meses", faixaMin: f.faixaMin, faixaMax: f.faixaMax, ...f }))
);
checar(alvo?.faixaLabel === "8:4-8:7", `idade 101 meses deveria cair em 8:4-8:7, caiu em ${alvo?.faixaLabel}`);

// --- 3. Caso auto-conferente: todo subteste no ponderado 10 -> composto ~100, percentil ~50 ---

const faixaTeste = WISC4_FAIXAS_ETARIAS.find((f) => f.faixaLabel === "8:4-8:7")!;
const conversao = conversaoDaFaixa(faixaTeste);

// Para cada subteste principal, um escore bruto que a Tabela A.1.x converte em ponderado 10.
const brutosMedianos: Record<string, number> = {};
for (const sub of WISC4_PRINCIPAIS) {
  const faixaPonderado10 = (faixaTeste.faixasPorSubteste[sub] as Array<{ min: number; ponderado: number }>).find(
    (f) => f.ponderado === 10
  );
  checar(faixaPonderado10 !== undefined, `faixa 8:4-8:7: subteste "${sub}" não tem ponderado 10`);
  if (faixaPonderado10) brutosMedianos[sub] = faixaPonderado10.min;
}

const medio = calcularResultado(brutosMedianos, conversao);
if (medio.modo !== "por_campo") throw new Error("esperado modo por_campo");

for (const sub of WISC4_PRINCIPAIS) {
  checar(
    medio.porCampo[sub]?.faixa?.ponderado === 10,
    `"${sub}": bruto ${brutosMedianos[sub]} deveria dar ponderado 10, deu ${medio.porCampo[sub]?.faixa?.ponderado}`
  );
}

// ICV/IOP = 3 subtestes x 10 = 30; IMO/IVP = 2 x 10 = 20; QIT = 10 x 10 = 100.
// Compostos esperados lidos direto das Tabelas A.2-A.6 do manual.
const ESPERADO: Record<string, { soma: number; composto: number; percentil: string }> = {
  icv: { soma: 30, composto: 101, percentil: "53" },
  iop: { soma: 30, composto: 100, percentil: "50" },
  imo: { soma: 20, composto: 100, percentil: "50" },
  ivp: { soma: 20, composto: 100, percentil: "50" },
  qit: { soma: 100, composto: 100, percentil: "50" },
};

for (const [chave, esperado] of Object.entries(ESPERADO)) {
  const r = medio.porCampo[chave];
  checar(r?.valorBruto === esperado.soma, `${chave}: soma dos ponderados ${r?.valorBruto}, esperado ${esperado.soma}`);
  checar(
    r?.faixa?.composto === esperado.composto,
    `${chave}: composto ${r?.faixa?.composto}, esperado ${esperado.composto} (Tabela A.2-A.6)`
  );
  checar(
    r?.faixa?.percentil === esperado.percentil,
    `${chave}: percentil ${r?.faixa?.percentil}, esperado ${esperado.percentil}`
  );
  checar(typeof r?.faixa?.ic95 === "string", `${chave}: sem IC95`);
}

console.log("  perfil todo-ponderado-10 (faixa 8:4-8:7):");
for (const chave of Object.keys(ESPERADO)) {
  const r = medio.porCampo[chave];
  console.log(
    `    ${chave.toUpperCase().padEnd(4)} soma ${String(r?.valorBruto).padStart(3)} -> composto ${r?.faixa?.composto}, percentil ${r?.faixa?.percentil}, IC95 ${r?.faixa?.ic95}`
  );
}

// --- 4. Subteste principal faltando: índice afetado não pode virar número ---

const { ps: _omitido, ...semProcurarSimbolos } = brutosMedianos;
const incompleto = calcularResultado(semProcurarSimbolos, conversao);
if (incompleto.modo !== "por_campo") throw new Error("esperado modo por_campo");

checar(incompleto.porCampo.ivp.valorBruto === null, `IVP sem PS deveria ser null, veio ${incompleto.porCampo.ivp.valorBruto}`);
checar(incompleto.porCampo.ivp.faixa === null, "IVP sem PS deveria ficar sem faixa");
checar(incompleto.porCampo.qit.valorBruto === null, `QIT sem PS deveria ser null, veio ${incompleto.porCampo.qit.valorBruto}`);
// ICV e IOP não dependem de PS — têm que continuar calculando normalmente.
checar(incompleto.porCampo.icv.faixa?.composto === 101, "ICV não depende de PS e deveria continuar calculado");
checar(incompleto.porCampo.iop.faixa?.composto === 100, "IOP não depende de PS e deveria continuar calculado");
console.log("\n  sem lançar PS: IVP e QIT voltam 'não calculado'; ICV e IOP seguem calculados.");

// --- 5. Extremos da escala, nas duas pontas ---

const minimos = Object.fromEntries(WISC4_PRINCIPAIS.map((s) => [s, 0]));
const noPiso = calcularResultado(minimos, conversao);
if (noPiso.modo !== "por_campo") throw new Error("esperado modo por_campo");
checar(
  typeof noPiso.porCampo.qit.faixa?.composto === "number",
  "bruto 0 em todos os principais deveria produzir um QIT (o piso da escala), não faixa null"
);
console.log(
  `  todos os brutos em 0: QIT soma ${noPiso.porCampo.qit.valorBruto} -> composto ${noPiso.porCampo.qit.faixa?.composto}, percentil ${noPiso.porCampo.qit.faixa?.percentil}`
);

if (erros.length > 0) {
  console.error(`\n${erros.length} ERRO(S):`);
  for (const e of erros) console.error(`  ! ${e}`);
  process.exit(1);
}
console.log("\nOK — todas as checagens passaram.");
