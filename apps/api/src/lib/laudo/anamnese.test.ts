import assert from "node:assert/strict";
import { test } from "node:test";
import { gerarTextoAnamnese } from "./anamnese";

test("anamnese: o formulário vira parágrafos no estilo do laudo, só com o que foi preenchido", () => {
  const texto = gerarTextoAnamnese(
    {
      irmaos: "uma irmã de 25 anos",
      reside: "os pais",
      informante: "o pai",
      caracteristicasInfancia: "desde a infância, a paciente apresenta características compatíveis com ansiedade",
      idadeAlfabetizacao: "4",
      rendimentoEscolar: "sempre apresentou bom rendimento acadêmico",
      sonoDormir: "22h30",
      sonoAcordar: "8h30",
      gestacao: "houve deslocamento de placenta, sendo necessário repouso materno por aproximadamente quatro meses",
      parto: "com 40 semanas de gestação, por cesariana",
      desenvolvimento: "O desenvolvimento neuropsicomotor ocorreu dentro do esperado.",
      textoLivre: "Observação final do profissional.",
    },
    { nome: "Helena Exemplo Prado", sexo: "FEMININO", idadeAnos: 18 }
  );
  const p = texto.split("\n\n");
  assert.equal(p[0], "Helena, 18 anos, possui uma irmã de 25 anos e reside com os pais. O pai relatou que, desde a infância, a paciente apresenta características compatíveis com ansiedade. Informou ainda que Helena foi alfabetizada aos 4 anos de idade e sempre apresentou bom rendimento acadêmico.");
  assert.match(texto, /Quanto à rotina de sono, informa dormir por volta das 22h30 e acordar às 8h30\./);
  assert.match(texto, /Segundo informações da família, durante a gestação houve deslocamento de placenta, sendo necessário repouso materno por aproximadamente quatro meses\. O nascimento ocorreu com 40 semanas de gestação, por cesariana\. O desenvolvimento neuropsicomotor ocorreu dentro do esperado\./);
  assert.equal(p[p.length - 1], "Observação final do profissional.");
  assert.equal(gerarTextoAnamnese({}, { nome: "A B", sexo: null, idadeAnos: 9 }), "A, 9 anos.");
});

test("anamnese: gênero masculino concorda ('alfabetizado')", () => {
  const t = gerarTextoAnamnese({ idadeAlfabetizacao: "6" }, { nome: "João Silva", sexo: "MASCULINO", idadeAnos: 10 });
  assert.match(t, /João foi alfabetizado aos 6 anos de idade/);
});
