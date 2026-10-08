import type { AnamneseData } from "../lib/api";

// Formulário de anamnese organizado pelos assuntos que entram no texto do laudo (seção 3). Cada campo é uma frase curta na voz do
// profissional; o laudo junta tudo em parágrafos ("Montar a partir da ficha") e o resultado continua editável lá.
type Campo = { chave: keyof AnamneseData; rotulo: string; dica?: string; exemplo: string; longo?: boolean; largura?: "meio" | "inteiro" | "curto" };
type Secao = { titulo: string; ajuda: string; campos: Campo[] };

const SECOES: Secao[] = [
  {
    titulo: "Quem informa e contexto familiar",
    ajuda: "Abre o primeiro parágrafo: “Nome, 18 anos, possui … e reside com …”.",
    campos: [
      { chave: "informante", rotulo: "Quem prestou as informações", exemplo: "O pai", largura: "curto" },
      { chave: "irmaos", rotulo: "Irmãos", dica: "completa “possui …”", exemplo: "uma irmã de 25 anos", largura: "meio" },
      { chave: "reside", rotulo: "Com quem reside", dica: "completa “reside com …”", exemplo: "os pais", largura: "meio" },
    ],
  },
  {
    titulo: "Motivo e histórico da queixa",
    ajuda: "Frases que continuam o texto: “… buscou a avaliação com o objetivo de …” e “O pai relatou que …”.",
    campos: [
      { chave: "queixaPrincipal", rotulo: "Motivo da busca pela avaliação", dica: "completa “com o objetivo de …”", exemplo: "compreender melhor seus sintomas ansiosos e investigar seu perfil cognitivo e nível intelectual", longo: true },
      { chave: "caracteristicasInfancia", rotulo: "O que o informante relata desde a infância", dica: "completa “relatou que …”", exemplo: "desde a infância, a paciente apresenta características compatíveis com ansiedade, destacando-se elevada autocrítica e perfeccionismo", longo: true },
      { chave: "acompanhamentoPrevio", rotulo: "Acompanhamento psicológico ou psiquiátrico anterior", exemplo: "Informou ter realizado acompanhamento psicológico aos 8 anos de idade, não estando em acompanhamento atualmente.", longo: true },
    ],
  },
  {
    titulo: "Escolaridade",
    ajuda: "“Foi alfabetizada aos 4 anos de idade e …”, depois a escolaridade atual e o que pretende fazer.",
    campos: [
      { chave: "idadeAlfabetizacao", rotulo: "Idade de alfabetização (anos)", exemplo: "4", largura: "curto" },
      { chave: "rendimentoEscolar", rotulo: "Rendimento escolar", dica: "continua “foi alfabetizada … e …”", exemplo: "sempre apresentou bom rendimento acadêmico", largura: "meio" },
      { chave: "escolaridadeAtual", rotulo: "Escolaridade atual / escola", exemplo: "Concluiu o Ensino Médio no ano anterior, tendo estudado na ETEC de Mogi das Cruzes", longo: true },
      { chave: "planosFuturos", rotulo: "Planos (curso, profissão)", dica: "acrescentado depois da escolaridade, com “, e …”", exemplo: "pretende ingressar no curso de Nutrição", largura: "meio" },
      { chave: "historicoEscolar", rotulo: "Outras informações escolares", exemplo: "Dificuldades de aprendizagem, reprovações, mudanças de escola…", longo: true },
    ],
  },
  {
    titulo: "Saúde",
    ajuda: "Diagnósticos, medicações e sintomas físicos relatados.",
    campos: [
      { chave: "diagnosticosClinicos", rotulo: "Diagnósticos clínicos", exemplo: "Possui diagnóstico de asma, realizando uso de bombinha quando necessário.", longo: true },
      { chave: "medicacao", rotulo: "Medicações em uso", exemplo: "Nega uso de medicação psiquiátrica.", longo: true },
      { chave: "sintomasFisicos", rotulo: "Sintomas físicos (ansiedade e outros)", exemplo: "Em situações de ansiedade, refere sintomas físicos como dores de estômago, tremores nas mãos e episódios de náusea.", longo: true },
      { chave: "historicoMedico", rotulo: "Outras informações de saúde", exemplo: "Relatou histórico de intolerância à lactose.", longo: true },
    ],
  },
  {
    titulo: "Perfil, atenção e humor",
    ajuda: "Como a pessoa se descreve e o que relata sobre atenção, humor e convívio.",
    campos: [
      { chave: "perfilSocial", rotulo: "Como se descreve / amizades", exemplo: "Descreve-se como uma pessoa mais tímida, embora relate facilidade para estabelecer amizades.", longo: true },
      { chave: "atencaoRelato", rotulo: "Atenção e estudo", exemplo: "Refere perceber episódios de desatenção, porém relata que sempre dedicou tempo aos estudos quando encontrava dificuldades.", longo: true },
      { chave: "humor", rotulo: "Humor e energia", exemplo: "Relata dificuldade em permanecer parada por longos períodos, além de episódios de tristeza, desânimo e percepção de baixa imunidade.", longo: true },
      { chave: "habilidadesSociais", rotulo: "Habilidades sociais", exemplo: "Quanto às habilidades sociais, relata desconforto com apresentações orais em contexto acadêmico.", longo: true },
    ],
  },
  {
    titulo: "Rotina",
    ajuda: "Sono, atividades físicas, outras atividades e alimentação.",
    campos: [
      { chave: "sonoDormir", rotulo: "Costuma dormir às", exemplo: "22h30", largura: "curto" },
      { chave: "sonoAcordar", rotulo: "Costuma acordar às", exemplo: "8h30", largura: "curto" },
      { chave: "atividadesFisicas", rotulo: "Atividades físicas e outras atividades", exemplo: "Mantém rotina regular de atividades físicas, realizando musculação e aulas de balé aos sábados.", longo: true },
      { chave: "alimentacao", rotulo: "Hábitos alimentares atuais", exemplo: "Relata não apreciar carne e refere sentir pouca fome.", longo: true },
    ],
  },
  {
    titulo: "Gestação e desenvolvimento",
    ajuda: "“Segundo informações da família, durante a gestação …. O nascimento ocorreu ….”",
    campos: [
      { chave: "gestacao", rotulo: "Gestação", dica: "completa “durante a gestação …”", exemplo: "houve deslocamento de placenta, sendo necessário repouso materno por aproximadamente quatro meses", longo: true },
      { chave: "parto", rotulo: "Nascimento", dica: "completa “O nascimento ocorreu …”", exemplo: "com 40 semanas de gestação, por cesariana", largura: "meio" },
      { chave: "amamentacao", rotulo: "Amamentação e introdução alimentar", exemplo: "Foi amamentada, porém apresentava desconforto importante após a ingestão do leite.", longo: true },
      { chave: "desenvolvimento", rotulo: "Desenvolvimento neuropsicomotor", exemplo: "O desenvolvimento neuropsicomotor ocorreu dentro do esperado, iniciando a marcha e a linguagem por volta dos 11 meses de idade.", longo: true },
    ],
  },
  {
    titulo: "Histórico familiar",
    ajuda: "Diagnósticos e queixas na família.",
    campos: [{ chave: "historicoFamiliar", rotulo: "Histórico familiar", exemplo: "No histórico familiar, há relatos de transtornos de ansiedade tanto na família materna quanto paterna.", longo: true }],
  },
  {
    titulo: "Texto livre",
    ajuda: "O que não couber nos campos acima. Vai no fim da anamnese, do jeito que você escrever.",
    campos: [{ chave: "textoLivre", rotulo: "Acrescentar ao texto da anamnese", exemplo: "Escreva em parágrafos. Linhas em branco separam os parágrafos no laudo.", longo: true }],
  },
];

const classeCampo = "w-full rounded-lg border border-mist bg-paper/60 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-sage-deep focus:bg-white";

export function FormularioAnamnese({ valor, onChange }: { valor: AnamneseData; onChange: (v: AnamneseData) => void }) {
  const set = (chave: keyof AnamneseData, v: string) => onChange({ ...valor, [chave]: v });
  return (
    <div className="space-y-4">
      {SECOES.map((s, i) => (
        <section key={s.titulo} className="rounded-2xl border border-mist bg-white p-5">
          <header className="mb-3 flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage-deep/10 text-xs font-bold text-sage-deep">{i + 1}</span>
            <div>
              <h3 className="font-serif text-base leading-tight text-ink">{s.titulo}</h3>
              <p className="mt-0.5 text-xs text-ink/55">{s.ajuda}</p>
            </div>
          </header>
          <div className="grid gap-3 sm:grid-cols-6">
            {s.campos.map((c) => (
              <label key={c.chave} className={`text-sm ${c.longo ? "sm:col-span-6" : c.largura === "curto" ? "sm:col-span-2" : "sm:col-span-3"}`}>
                <span className="mb-1 flex flex-wrap items-baseline gap-x-2 font-semibold text-ink/70">
                  {c.rotulo}
                  {c.dica && <span className="text-[11px] font-normal text-ink/45">{c.dica}</span>}
                </span>
                {c.longo ? (
                  <textarea className={classeCampo} rows={2} placeholder={`Ex.: ${c.exemplo}`} value={valor[c.chave] ?? ""} onChange={(e) => set(c.chave, e.target.value)} />
                ) : (
                  <input className={classeCampo} placeholder={`Ex.: ${c.exemplo}`} value={valor[c.chave] ?? ""} onChange={(e) => set(c.chave, e.target.value)} />
                )}
              </label>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
