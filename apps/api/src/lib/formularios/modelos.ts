// Formulários e anamneses: modelos do sistema (nossos, em linguagem simples) + modelos próprios de cada profissional.
// Uma resposta guarda uma CÓPIA das perguntas (snapshot), então editar o modelo depois não muda o que já foi respondido.

export type TipoPergunta = "texto" | "escolha" | "multipla" | "escala" | "sim_nao" | "data";
export interface Pergunta { id: string; tipo: TipoPergunta; rotulo: string; ajuda?: string; opcoes?: string[]; min?: number; max?: number; obrigatoria?: boolean }
export interface ModeloSistema { chave: string; nome: string; descricao: string; tipo: "ANAMNESE" | "FORMULARIO"; paraQuem: string[]; perguntas: Pergunta[] }

const t = (id: string, rotulo: string, ajuda?: string): Pergunta => ({ id, tipo: "texto", rotulo, ...(ajuda ? { ajuda } : {}) });
const e = (id: string, rotulo: string, opcoes: string[]): Pergunta => ({ id, tipo: "escolha", rotulo, opcoes });
const sn = (id: string, rotulo: string): Pergunta => ({ id, tipo: "sim_nao", rotulo });
const esc = (id: string, rotulo: string, min: number, max: number, ajuda?: string): Pergunta => ({ id, tipo: "escala", rotulo, min, max, ...(ajuda ? { ajuda } : {}) });

const TODOS = ["PSICOLOGO", "NEUROPSICOLOGO", "MEDICO", "FISIOTERAPEUTA", "TERAPEUTA_OCUPACIONAL", "FONOAUDIOLOGO", "NUTRICIONISTA", "OUTRO"];

export const MODELOS_SISTEMA: ModeloSistema[] = [
  {
    chave: "ANAMNESE_GERAL", nome: "Anamnese geral de saúde", descricao: "Queixa, história de saúde, hábitos e expectativas. Serve para qualquer área.", tipo: "ANAMNESE", paraQuem: TODOS,
    perguntas: [
      t("queixa", "O que traz você ao atendimento?", "Pode escrever do seu jeito."), t("inicio", "Desde quando isso acontece e como tem evoluído?"),
      t("tratamentos", "Já fez algum tratamento para isso? Como foi?"), t("saude", "Tem alguma condição de saúde ou já passou por cirurgias?"),
      t("medicamentos", "Usa medicamentos ou suplementos? Quais, e em que dose?"), t("alergias", "Tem alergias?"),
      t("familia", "Existe algo de saúde que se repete na sua família?"), esc("sono", "Como você avalia o seu sono?", 1, 5, "1 = muito ruim, 5 = muito bom"),
      e("atividade", "Com que frequência pratica atividade física?", ["Nunca", "Às vezes", "1 a 2 vezes por semana", "3 vezes ou mais por semana"]),
      e("alcool", "Consumo de álcool", ["Não bebo", "Ocasionalmente", "Com frequência"]), sn("tabaco", "Você fuma?"),
      t("apoio", "Com quem você pode contar no dia a dia?"), t("expectativa", "O que você espera deste atendimento?"), t("mais", "Quer contar mais alguma coisa?"),
    ],
  },
  {
    chave: "ANAMNESE_PSICOLOGICA", nome: "Anamnese psicológica (adulto)", descricao: "Motivo da busca, história emocional, rede de apoio, rotina e objetivos.", tipo: "ANAMNESE", paraQuem: ["PSICOLOGO", "NEUROPSICOLOGO"],
    perguntas: [
      t("motivo", "O que fez você buscar ajuda agora?"), t("incomoda", "O que mais tem incomodado você ultimamente?"), t("curso", "Desde quando você se sente assim? Mudou ao longo do tempo?"),
      esc("impacto", "O quanto isso atrapalha trabalho, estudos ou relações?", 0, 10, "0 = nada, 10 = muito"), esc("humor", "Como tem estado o seu humor nas últimas semanas?", 1, 5, "1 = muito baixo, 5 = muito bom"),
      e("sono", "Seu sono", ["Durmo bem", "Demoro a dormir", "Acordo várias vezes", "Durmo pouco", "Durmo demais"]),
      sn("terapia", "Já fez psicoterapia ou acompanhamento psiquiátrico antes?"), t("terapia_detalhe", "Se sim, conte como foi e o que ajudou ou não."),
      t("medicacao", "Usa algum medicamento? Quais?"), t("eventos", "Houve algum acontecimento marcante na sua vida que queira compartilhar?", "Compartilhe só o que se sentir à vontade."),
      t("apoio", "Quem faz parte da sua rede de apoio?"), t("familia_saude", "Alguém da família passou por questões emocionais ou de saúde mental?"),
      e("substancias", "Uso de álcool ou outras substâncias", ["Não uso", "Ocasionalmente", "Com frequência", "Prefiro conversar pessoalmente"]),
      t("forcas", "Quais são as suas qualidades e o que costuma ajudar você nos dias difíceis?"), t("objetivo", "O que você gostaria de mudar ou alcançar com o acompanhamento?"),
    ],
  },
  {
    chave: "ANAMNESE_INFANTIL", nome: "Anamnese infantil (responsável)", descricao: "Gestação, desenvolvimento, escola, rotina e comportamento, respondida por quem cuida da criança.", tipo: "ANAMNESE", paraQuem: TODOS,
    perguntas: [
      t("informante", "Quem está respondendo e qual a sua relação com a criança?"), t("motivo", "O que levou você a buscar atendimento para a criança?"),
      t("gestacao", "Como foram a gestação e o parto?", "Intercorrências, tempo de gestação, tipo de parto."), t("marcos", "Como foi o desenvolvimento: quando sentou, andou e falou as primeiras palavras?"),
      t("saude", "Doenças, internações, alergias ou uso de medicamentos?"), t("escola", "Em que ano escolar está? Como são o desempenho e a adaptação?"),
      t("rotina", "Como é a rotina de um dia comum (horários, telas, brincadeiras)?"), e("sono", "Sono da criança", ["Dorme bem", "Demora a dormir", "Acorda à noite", "Dorme pouco"]),
      t("alimentacao", "Como é a alimentação?"), t("comportamento", "Como a criança se comporta em casa e fora de casa?"),
      t("relacoes", "Como ela se relaciona com familiares e outras crianças?"), t("familia", "Quem mora na casa e como é a dinâmica da família?"),
      t("expectativa", "O que você espera do atendimento?"),
    ],
  },
  {
    chave: "ANAMNESE_REABILITACAO", nome: "Anamnese de reabilitação", descricao: "Queixa funcional, dor, histórico de lesões e objetivos. Para fisioterapia, terapia ocupacional e fonoaudiologia.", tipo: "ANAMNESE", paraQuem: ["FISIOTERAPEUTA", "TERAPEUTA_OCUPACIONAL", "FONOAUDIOLOGO", "MEDICO", "OUTRO"],
    perguntas: [
      t("queixa", "Qual é a sua principal queixa?"), t("local", "Em que parte do corpo ou em que função você sente a dificuldade?"), t("inicio", "Quando começou e como foi (trauma, esforço, gradual)?"),
      esc("dor", "Intensidade da dor nos últimos dias", 0, 10, "0 = sem dor, 10 = a pior possível"), t("piora", "O que piora e o que alivia?"),
      t("lesoes", "Cirurgias, fraturas ou lesões anteriores?"), t("exames", "Fez exames ou usa algum aparelho de apoio?"), t("rotina", "Quais atividades do dia a dia ficaram mais difíceis?"),
      t("trabalho", "Qual é a sua rotina de trabalho e de atividade física?"), t("objetivo", "O que você quer voltar a conseguir fazer?"),
    ],
  },
  {
    chave: "ANAMNESE_MEDICA", nome: "Anamnese médica (primeira consulta)", descricao: "Queixa, história, antecedentes, medicamentos, hábitos e expectativas, respondida pelo paciente antes da consulta.", tipo: "ANAMNESE", paraQuem: ["MEDICO"],
    perguntas: [
      t("queixa", "O que o trouxe à consulta?", "Conte com suas palavras."), t("inicio", "Quando começou e como tem evoluído?"), t("piora", "O que piora e o que melhora?"),
      t("doencas", "Tem alguma doença diagnosticada, cirurgia ou internação anterior?"), t("familia", "Alguma doença importante na família (pais, irmãos, avós)?"),
      t("medicamentos", "Quais medicamentos e suplementos usa hoje (nome e dose)?"), t("alergias", "Tem alergia a medicamentos, alimentos ou outros?"),
      e("sono", "Como tem dormido?", ["Bem", "Razoável", "Mal"]), e("atividade", "Atividade física por semana", ["Nenhuma", "1 a 2 vezes", "3 ou mais vezes"]),
      e("alcool", "Consumo de álcool", ["Não bebo", "Social", "Frequente"]), e("tabaco", "Tabagismo", ["Nunca fumei", "Ex-fumante", "Fumo atualmente"]),
      t("expectativa", "O que espera desta consulta?"),
    ],
  },
  {
    chave: "ANAMNESE_PSIQUIATRICA", nome: "Anamnese psiquiátrica", descricao: "Queixa emocional, sintomas, tratamentos anteriores, uso de substâncias e rede de apoio, respondida antes da consulta.", tipo: "ANAMNESE", paraQuem: ["MEDICO"],
    perguntas: [
      t("queixa", "O que o trouxe à consulta?"), t("inicio", "Desde quando se sente assim e o que aconteceu por volta dessa época?"),
      esc("humor", "Como tem estado seu humor nas últimas 2 semanas", 0, 10, "0 = muito mal, 10 = muito bem"), esc("ansiedade", "Nível de ansiedade nas últimas 2 semanas", 0, 10, "0 = nenhuma, 10 = intensa"),
      e("sono", "Como tem dormido?", ["Bem", "Dificuldade para pegar no sono", "Acordo no meio da noite", "Durmo demais"]), t("apetite_energia", "Como estão apetite, energia e concentração?"),
      sn("pensamentos_morte", "Tem tido pensamentos de que a vida não vale a pena ou de se machucar?"),
      t("tratamentos", "Já fez acompanhamento psicológico ou psiquiátrico? Usou medicações (quais, com que resultado)?"), t("medicamentos", "Que medicamentos usa hoje (nome e dose)?"),
      e("alcool", "Consumo de álcool", ["Não bebo", "Social", "Frequente"]), t("outras_substancias", "Usa tabaco ou outras substâncias?"),
      t("familia", "Alguém na família teve depressão, ansiedade, outro transtorno ou tratamento psiquiátrico?"), t("rede", "Com quem conta no dia a dia?"), t("expectativa", "O que espera do tratamento?"),
    ],
  },
  {
    chave: "ANAMNESE_NUTRICIONAL", nome: "Anamnese nutricional", descricao: "Objetivo, rotina alimentar, hábitos e histórico de saúde.", tipo: "ANAMNESE", paraQuem: ["NUTRICIONISTA", "MEDICO", "OUTRO"],
    perguntas: [
      t("objetivo", "Qual é o seu objetivo com o acompanhamento nutricional?"), t("rotina", "Descreva como é um dia comum de refeições."), e("refeicoes", "Quantas refeições faz por dia?", ["1 a 2", "3", "4 a 5", "6 ou mais"]),
      t("restricoes", "Restrições, alergias ou alimentos de que não gosta?"), e("agua", "Quanta água bebe por dia?", ["Menos de 1 litro", "1 a 2 litros", "Mais de 2 litros"]),
      e("atividade", "Atividade física", ["Nenhuma", "1 a 2 vezes por semana", "3 vezes ou mais por semana"]), esc("sono", "Qualidade do sono", 1, 5), t("peso", "Como tem sido o seu peso ao longo do tempo?"),
      t("saude", "Condições de saúde ou medicamentos em uso?"), t("suplementos", "Usa suplementos ou chás?"),
    ],
  },
  {
    chave: "TERMO_CONSENTIMENTO", nome: "Termo de consentimento do atendimento", descricao: "Combinados do atendimento, sigilo, dados e recursos de apoio. Texto-base: revise com a responsável técnica e o jurídico antes de usar.", tipo: "FORMULARIO", paraQuem: TODOS,
    perguntas: [
      { ...t("responsavel", "Nome de quem assina (o paciente ou o responsável legal)"), obrigatoria: true },
      { ...sn("combinados", "Fui informado(a) sobre como funciona o atendimento: duração, frequência, valores, faltas e cancelamentos."), obrigatoria: true },
      { ...sn("sigilo", "Entendo que o sigilo profissional é garantido, com as exceções previstas em lei (por exemplo, risco à vida ou determinação judicial)."), obrigatoria: true },
      { ...sn("lgpd", "Concordo com o armazenamento seguro dos meus dados no prontuário eletrônico, conforme a LGPD."), obrigatoria: true },
      sn("tecnologia", "Autorizo o uso de recursos tecnológicos de apoio, como inteligência artificial, sempre revisados pelo profissional."),
      sn("gravacao", "Autorizo a gravação das sessões para fins de registro clínico (opcional)."),
      t("obs", "Observações ou dúvidas"),
    ],
  },
  {
    chave: "TRIAGEM_INICIAL", nome: "Triagem inicial", descricao: "Primeiro contato: motivo, urgência, horários e contato de emergência.", tipo: "FORMULARIO", paraQuem: TODOS,
    perguntas: [
      { ...t("motivo", "O que levou você a procurar atendimento agora?"), obrigatoria: true }, e("urgencia", "Como você avalia a urgência?", ["Posso aguardar", "Gostaria de começar logo", "Preciso de atendimento com urgência"]),
      sn("ja_fez", "Já fez algum tipo de acompanhamento antes?"), t("como_conheceu", "Como conheceu o atendimento?"), t("horarios", "Quais dias e horários são melhores para você?"),
      e("formato", "Prefere atendimento", ["Presencial", "Online", "Tanto faz"]), t("medicamentos", "Usa algum medicamento ou faz outro tratamento?"), t("emergencia", "Contato de emergência (nome, telefone e vínculo)"),
    ],
  },
  {
    chave: "SATISFACAO", nome: "Pesquisa de satisfação", descricao: "Como o paciente avalia o atendimento. Útil a cada alguns meses.", tipo: "FORMULARIO", paraQuem: TODOS,
    perguntas: [
      esc("acolhimento", "Eu me senti acolhido(a) nos atendimentos", 0, 10, "0 = nada, 10 = totalmente"), esc("clareza", "Entendo bem o que estamos trabalhando", 0, 10), esc("progresso", "Percebo avanços desde que comecei", 0, 10),
      esc("recomendaria", "Recomendaria o atendimento a alguém que precisa", 0, 10), t("funciona", "O que está funcionando bem?"), t("melhorar", "O que poderia melhorar?"),
    ],
  },
  {
    chave: "CHECKIN_SEMANAL", nome: "Check-in da semana", descricao: "Um retrato rápido da semana, para o paciente responder antes da sessão.", tipo: "FORMULARIO", paraQuem: TODOS,
    perguntas: [
      esc("humor", "Como foi o seu humor nesta semana?", 1, 5, "1 = muito difícil, 5 = muito bom"), esc("sono", "Como foi o seu sono?", 1, 5), esc("energia", "Como esteve a sua energia?", 1, 5),
      t("ajudou", "O que ajudou nesta semana?"), t("pesou", "O que pesou nesta semana?"), t("sessao", "O que você gostaria de tratar na próxima sessão?"), sn("dificil", "Houve algum momento muito difícil que você queira contar?"),
    ],
  },
  {
    chave: "REGISTRO_SONO", nome: "Registro de sono", descricao: "Hábitos e qualidade do sono, para acompanhar por alguns dias.", tipo: "FORMULARIO", paraQuem: TODOS,
    perguntas: [
      t("dormiu", "Que horas foi dormir?"), e("demora", "Quanto tempo demorou para dormir?", ["Menos de 15 minutos", "15 a 30 minutos", "30 a 60 minutos", "Mais de 1 hora"]),
      e("despertares", "Quantas vezes acordou durante a noite?", ["Nenhuma", "1 vez", "2 ou 3 vezes", "4 ou mais vezes"]), t("acordou", "Que horas acordou?"), esc("qualidade", "Qualidade do sono", 1, 5),
      sn("cafeina", "Tomou café, chá preto ou energético depois das 16h?"), sn("tela", "Usou celular ou TV na hora de dormir?"), sn("alcool", "Bebeu álcool ontem à noite?"),
    ],
  },
  {
    chave: "QUESTIONARIO_ESCOLA", nome: "Questionário para a escola", descricao: "Observações do professor ou da escola sobre a criança ou o adolescente.", tipo: "FORMULARIO", paraQuem: ["PSICOLOGO", "NEUROPSICOLOGO", "TERAPEUTA_OCUPACIONAL", "FONOAUDIOLOGO", "OUTRO"],
    perguntas: [
      t("quem", "Nome e função de quem responde"), t("aprendizagem", "Como é o desempenho nas atividades de leitura, escrita e matemática?"), t("atencao", "Como é a atenção e a concentração em sala?"),
      t("comportamento", "Como é o comportamento em sala e no recreio?"), t("relacoes", "Como são as relações com colegas e professores?"), t("autonomia", "Como é a autonomia nas tarefas e na organização do material?"),
      t("apoios", "Há adaptações ou apoios já oferecidos?"), t("obs", "Outras observações"),
    ],
  },
];

export const modeloDoSistema = (chave: string) => MODELOS_SISTEMA.find((m) => m.chave === chave);

// Valida e limpa a lista de perguntas de um modelo próprio.
export function validarPerguntas(entrada: unknown): { perguntas: Pergunta[]; erros: string[] } {
  const erros: string[] = [];
  if (!Array.isArray(entrada) || entrada.length === 0) return { perguntas: [], erros: ["Inclua pelo menos uma pergunta."] };
  if (entrada.length > 80) return { perguntas: [], erros: ["No máximo 80 perguntas."] };
  const tipos: TipoPergunta[] = ["texto", "escolha", "multipla", "escala", "sim_nao", "data"];
  const ids = new Set<string>(), saida: Pergunta[] = [];
  entrada.forEach((raw, i) => {
    const p = raw as Partial<Pergunta>; const n = i + 1;
    if (!p || typeof p !== "object") { erros.push(`Pergunta ${n}: inválida.`); return; }
    const rotulo = typeof p.rotulo === "string" ? p.rotulo.trim() : "";
    if (!rotulo || rotulo.length > 400) { erros.push(`Pergunta ${n}: escreva o enunciado (até 400 caracteres).`); return; }
    if (!p.tipo || !tipos.includes(p.tipo)) { erros.push(`Pergunta ${n}: tipo inválido.`); return; }
    const id = typeof p.id === "string" && /^[a-z0-9_]{1,40}$/.test(p.id) && !ids.has(p.id) ? p.id : `p${n}`;
    ids.add(id);
    const q: Pergunta = { id, tipo: p.tipo, rotulo, ...(p.ajuda && typeof p.ajuda === "string" && p.ajuda.trim() ? { ajuda: p.ajuda.trim().slice(0, 300) } : {}), ...(p.obrigatoria ? { obrigatoria: true } : {}) };
    if (p.tipo === "escolha" || p.tipo === "multipla") {
      const o = Array.isArray(p.opcoes) ? p.opcoes.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean) : [];
      if (o.length < 2 || o.length > 20) { erros.push(`Pergunta ${n}: informe de 2 a 20 opções.`); return; }
      q.opcoes = o.map((x) => x.slice(0, 120));
    }
    if (p.tipo === "escala") {
      const min = Number.isInteger(p.min) ? (p.min as number) : 0, max = Number.isInteger(p.max) ? (p.max as number) : 10;
      if (min < 0 || max > 10 || min >= max) { erros.push(`Pergunta ${n}: escala inválida (use valores de 0 a 10, com mínimo menor que o máximo).`); return; }
      q.min = min; q.max = max;
    }
    saida.push(q);
  });
  return { perguntas: saida, erros };
}

// Confere as respostas contra as perguntas (snapshot). Devolve respostas limpas e a lista de problemas.
export function validarRespostasFormulario(perguntas: Pergunta[], respostas: unknown, exigirObrigatorias: boolean): { respostas: Record<string, string | string[] | number | boolean>; erros: string[] } {
  const entrada = respostas && typeof respostas === "object" && !Array.isArray(respostas) ? (respostas as Record<string, unknown>) : {};
  const limpo: Record<string, string | string[] | number | boolean> = {}, erros: string[] = [];
  for (const p of perguntas) {
    const v = entrada[p.id];
    const vazio = v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
    if (vazio) { if (exigirObrigatorias && p.obrigatoria) erros.push(`Responda: ${p.rotulo}`); continue; }
    switch (p.tipo) {
      case "texto": if (typeof v !== "string" || v.length > 8000) erros.push(`"${p.rotulo}": texto inválido ou longo demais.`); else limpo[p.id] = v.trim(); break;
      case "escolha": if (typeof v !== "string" || !p.opcoes?.includes(v)) erros.push(`"${p.rotulo}": opção inválida.`); else limpo[p.id] = v; break;
      case "multipla": if (!Array.isArray(v) || v.some((x) => typeof x !== "string" || !p.opcoes?.includes(x))) erros.push(`"${p.rotulo}": opção inválida.`); else limpo[p.id] = v as string[]; break;
      case "escala": if (typeof v !== "number" || !Number.isInteger(v) || v < (p.min ?? 0) || v > (p.max ?? 10)) erros.push(`"${p.rotulo}": valor fora da escala.`); else limpo[p.id] = v; break;
      case "sim_nao": if (typeof v !== "boolean") erros.push(`"${p.rotulo}": responda sim ou não.`); else limpo[p.id] = v; break;
      case "data": if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) erros.push(`"${p.rotulo}": data inválida.`); else limpo[p.id] = v; break;
    }
  }
  return { respostas: limpo, erros };
}
