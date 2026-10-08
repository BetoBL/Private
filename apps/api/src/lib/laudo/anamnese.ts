// Formulário de anamnese → texto do laudo (seção 3). Dois caminhos juntos: os campos geram os parágrafos e o profissional
// ainda escreve o que quiser em "textoLivre" (vai por último) e edita tudo no laudo.
// Campos "narrativos" entram como o profissional escreveu (é a voz dele); só os dados curtos usam frase-modelo.
export interface AnamneseForm {
  // legado (mantido): queixaPrincipal = motivo da busca; os demais seguem lidos
  queixaPrincipal?: string;
  historicoEscolar?: string;
  historicoMedico?: string;
  historicoFamiliar?: string;
  // contexto
  informante?: string; // "O pai", "A mãe", "A própria paciente"
  irmaos?: string; // "uma irmã de 25 anos"
  reside?: string; // "os pais"
  caracteristicasInfancia?: string; // histórico da queixa desde a infância (frase que segue "relatou que, …")
  // escola
  idadeAlfabetizacao?: string; // "4"
  rendimentoEscolar?: string; // "sempre apresentou bom rendimento acadêmico"
  escolaridadeAtual?: string; // "Concluiu o Ensino Médio no ano anterior, tendo estudado na ETEC …"
  planosFuturos?: string; // "pretende ingressar no curso de Nutrição"
  // saúde
  acompanhamentoPrevio?: string;
  medicacao?: string;
  diagnosticosClinicos?: string;
  sintomasFisicos?: string;
  // perfil
  perfilSocial?: string;
  atencaoRelato?: string;
  humor?: string;
  habilidadesSociais?: string;
  // rotina
  sonoDormir?: string; // "22h30"
  sonoAcordar?: string; // "8h30"
  atividadesFisicas?: string;
  outrasAtividades?: string;
  alimentacao?: string;
  // gestação e desenvolvimento
  gestacao?: string; // "houve deslocamento de placenta, sendo necessário repouso materno por aproximadamente quatro meses"
  parto?: string; // "com 40 semanas de gestação, por cesariana"
  amamentacao?: string;
  desenvolvimento?: string; // "O desenvolvimento neuropsicomotor ocorreu dentro do esperado, iniciando a marcha e a linguagem por volta dos 11 meses de idade."
  // extras
  textoLivre?: string;
}

const t = (s?: string) => (s ?? "").trim();
const fim = (s: string) => (/[.!?]$/.test(s) ? s : `${s}.`);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function gerarTextoAnamnese(f: AnamneseForm, pac: { nome: string; sexo: "MASCULINO" | "FEMININO" | null; idadeAnos: number }): string {
  const nome = pac.nome.split(" ")[0];
  const fem = pac.sexo !== "MASCULINO";
  const o = fem ? "a" : "o";
  const frases = (...partes: Array<string | false | undefined>) => partes.filter((p): p is string => !!p && p.trim() !== "").join(" ");
  const paragrafos: string[] = [];

  // 1) contexto familiar, histórico da queixa, escola e motivo da busca
  const contexto = `${nome}, ${pac.idadeAnos} anos${t(f.irmaos) ? `, possui ${t(f.irmaos)}` : ""}${t(f.reside) ? ` e reside com ${t(f.reside)}` : ""}.`;
  const alfa = t(f.idadeAlfabetizacao) ? `foi alfabetizad${o} aos ${t(f.idadeAlfabetizacao)} anos de idade` : "";
  const escola = [alfa, t(f.rendimentoEscolar)].filter(Boolean).join(" e ");
  paragrafos.push(
    frases(
      contexto,
      t(f.caracteristicasInfancia) && `${cap(t(f.informante) || "O informante")} relatou que${/^(desde|durante|quando|ainda|atualmente|segundo)\b/i.test(t(f.caracteristicasInfancia)) ? "," : ""} ${t(f.caracteristicasInfancia).replace(/\.$/, "")}.`,
      escola && `Informou ainda que ${nome} ${escola.replace(/\.$/, "")}.`,
      t(f.queixaPrincipal) && `${fem ? "A paciente" : "O paciente"} buscou a avaliação neuropsicológica com o objetivo de ${t(f.queixaPrincipal).replace(/\.$/, "")}.`,
      t(f.acompanhamentoPrevio) && fim(t(f.acompanhamentoPrevio)),
      t(f.escolaridadeAtual) && fim(t(f.escolaridadeAtual).replace(/\.$/, "") + (t(f.planosFuturos) ? `, e ${t(f.planosFuturos).replace(/\.$/, "")}` : "")),
      !t(f.escolaridadeAtual) && t(f.planosFuturos) && fim(cap(t(f.planosFuturos))),
      t(f.historicoEscolar) && fim(t(f.historicoEscolar))
    )
  );

  // 2) perfil, atenção, ansiedade e saúde
  paragrafos.push(
    frases(
      t(f.perfilSocial) && fim(t(f.perfilSocial)),
      t(f.atencaoRelato) && fim(t(f.atencaoRelato)),
      t(f.sintomasFisicos) && fim(t(f.sintomasFisicos)),
      t(f.medicacao) && fim(t(f.medicacao)),
      t(f.diagnosticosClinicos) && fim(t(f.diagnosticosClinicos)),
      t(f.historicoMedico) && fim(t(f.historicoMedico))
    )
  );

  // 3) sono e rotina
  paragrafos.push(
    frases(
      t(f.sonoDormir) && t(f.sonoAcordar) ? `Quanto à rotina de sono, informa dormir por volta das ${t(f.sonoDormir)} e acordar às ${t(f.sonoAcordar)}.` : t(f.sonoDormir) ? `Informa dormir por volta das ${t(f.sonoDormir)}.` : t(f.sonoAcordar) ? `Informa acordar às ${t(f.sonoAcordar)}.` : "",
      t(f.atividadesFisicas) && fim(t(f.atividadesFisicas)),
      t(f.outrasAtividades) && fim(t(f.outrasAtividades))
    )
  );

  // 4) humor
  paragrafos.push(frases(t(f.humor) && fim(t(f.humor))));

  // 5) gestação, parto e desenvolvimento
  paragrafos.push(
    frases(
      t(f.gestacao) && `Segundo informações da família, durante a gestação ${t(f.gestacao).replace(/\.$/, "")}.`,
      t(f.parto) && `O nascimento ocorreu ${t(f.parto).replace(/\.$/, "")}.`,
      t(f.amamentacao) && fim(t(f.amamentacao)),
      t(f.desenvolvimento) && fim(t(f.desenvolvimento))
    )
  );

  // 6) alimentação
  paragrafos.push(frases(t(f.alimentacao) && fim(t(f.alimentacao))));

  // 7) habilidades sociais e histórico familiar
  paragrafos.push(frases(t(f.habilidadesSociais) && fim(t(f.habilidadesSociais)), t(f.historicoFamiliar) && fim(t(f.historicoFamiliar))));

  // 8) o que o profissional quiser acrescentar
  paragrafos.push(t(f.textoLivre));

  return paragrafos.filter((p) => p.trim() !== "").join("\n\n");
}
