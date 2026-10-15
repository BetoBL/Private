# Pacote de revisão para a Letícia

**Para:** Letícia, psicóloga responsável técnica. **De:** equipe de desenvolvimento do MentEssence.

Este documento reúne **todos os textos clínicos que o sistema mostra a pacientes e profissionais** e que precisam da sua leitura antes de usarmos com pacientes reais. Nada aqui foi publicado ainda. Para cada bloco, o que pedimos é simples: **aprovar, ou escrever o ajuste** (o texto que você mandar entra como está).

Como marcar: ao lado de cada bloco há `[ ] Aprovado` e `[ ] Ajustar`. Se for ajustar, escreva a mudança logo abaixo.

## O que mais importa (leia primeiro)

1. **Aviso de segurança** do Diário e o comportamento do alerta de risco (seção 3). É o ponto mais sensível.
2. **Escalas** (seção 1): conferir se a versão em português e as faixas de interpretação são as que você usa.
3. **Textos do Diário** (seção 2): linguagem de todas as perguntas que o paciente responde no dia a dia.
4. Anamneses (seção 4) e modelos de evolução (seção 5).

Regras do sistema que valem para tudo: o resultado das escalas é **triagem, não diagnóstico**; o **paciente nunca vê a pontuação**; só o profissional responsável (ou o administrador) lê as respostas.

---

## 1. Escalas de triagem

O paciente recebe um link, responde no celular e o profissional vê a pontuação e a faixa. Em todas, conferir: **fonte e versão**, **enunciado**, **opções de resposta**, **faixas**.

### 1.1 Questionário sobre a Saúde do Paciente (PHQ-9) (PHQ-9)

- **Mede:** Depressão
- **Uso:** Adultos
- **Tempo:** 2 a 3 min. **Repetição sugerida:** Linha de base e depois mensal
- **Fonte indicada no sistema:** Kroenke, Spitzer e Williams (2001), Pfizer, uso livre. Versão em português do Brasil (Santos et al., 2013).
- **Instrução mostrada ao paciente:** Nas últimas 2 semanas, com que frequência você foi incomodado(a) por cada um dos problemas abaixo?
- **Opções de resposta (padrão):** 0 = Nenhuma vez; 1 = Vários dias; 2 = Mais da metade dos dias; 3 = Quase todos os dias
- **Faixas do total:** 0 a 4: Mínima | 5 a 9: Leve | 10 a 14: Moderada | 15 a 19: Moderadamente grave | 20 a 27: Grave
- **Linhas de corte no gráfico:** 5, 10, 15, 20
- **Alerta de risco:** qualquer resposta acima de 0 na(s) pergunta(s) 9 avisa o profissional.
- **Pergunta final (funcionalidade):** Se você marcou algum dos problemas, quanta dificuldade eles causaram para trabalhar, cuidar das coisas em casa ou conviver com as pessoas?

**Perguntas:**

1. Pouco interesse ou pouco prazer em fazer as coisas
2. Sentir-se "para baixo", deprimido(a) ou sem perspectiva
3. Dificuldade para pegar no sono ou permanecer dormindo, ou dormir mais do que o costume
4. Sentir-se cansado(a) ou com pouca energia
5. Falta de apetite ou comer demais
6. Sentir-se mal consigo mesmo(a), ou achar que você é um fracasso, ou que decepcionou sua família ou a si mesmo(a)
7. Dificuldade para se concentrar nas coisas, como ler o jornal ou ver televisão
8. Lentidão para se movimentar ou falar, a ponto de outras pessoas perceberem, ou o oposto: estar tão agitado(a) ou inquieto(a) que você fica andando de um lado para o outro muito mais do que de costume
9. Pensar em se ferir de alguma maneira ou que seria melhor estar morto(a)

`[ ] Aprovado`   `[ ] Ajustar` → 

### 1.2 Transtorno de Ansiedade Generalizada (GAD-7) (GAD-7)

- **Mede:** Ansiedade
- **Uso:** Adultos
- **Tempo:** 2 min. **Repetição sugerida:** Linha de base e depois mensal
- **Fonte indicada no sistema:** Spitzer, Kroenke, Williams e Löwe (2006), Pfizer, uso livre. Versão em português do Brasil.
- **Instrução mostrada ao paciente:** Nas últimas 2 semanas, com que frequência você foi incomodado(a) por cada um dos problemas abaixo?
- **Opções de resposta (padrão):** 0 = Nenhuma vez; 1 = Vários dias; 2 = Mais da metade dos dias; 3 = Quase todos os dias
- **Faixas do total:** 0 a 4: Mínima | 5 a 9: Leve | 10 a 14: Moderada | 15 a 21: Grave
- **Linhas de corte no gráfico:** 5, 10, 15
- **Pergunta final (funcionalidade):** Se você marcou algum dos problemas, quanta dificuldade eles causaram para trabalhar, cuidar das coisas em casa ou conviver com as pessoas?

**Perguntas:**

1. Sentir-se nervoso(a), ansioso(a) ou muito tenso(a)
2. Não ser capaz de impedir ou de controlar as preocupações
3. Preocupar-se muito com diversas coisas
4. Dificuldade para relaxar
5. Ficar tão agitado(a) que se torna difícil permanecer sentado(a)
6. Ficar facilmente aborrecido(a) ou irritado(a)
7. Sentir medo como se algo horrível fosse acontecer

`[ ] Aprovado`   `[ ] Ajustar` → 

### 1.3 Escala de Depressão, Ansiedade e Estresse (DASS-21) (DASS-21)

- **Mede:** Depressão, ansiedade e estresse
- **Uso:** Adultos
- **Tempo:** 5 a 10 min. **Repetição sugerida:** Linha de base e depois quinzenal ou mensal
- **Fonte indicada no sistema:** Lovibond e Lovibond (1995), uso livre. Versão em português de Vignola e Tucci (2014).
- **Instrução mostrada ao paciente:** Leia cada afirmação e marque quanto ela se aplicou a você durante a última semana.
- **Opções de resposta (padrão):** 0 = Não se aplicou de maneira alguma; 1 = Aplicou-se em algum grau, ou por pouco tempo; 2 = Aplicou-se em um grau considerável, ou por uma boa parte do tempo; 3 = Aplicou-se muito, ou na maioria do tempo
- **Grupo Depressão** (perguntas 3, 5, 10, 13, 16, 17, 21; valor × 2): 0 a 9: Normal | 10 a 13: Leve | 14 a 20: Moderada | 21 a 27: Severa | 28 a 42: Extremamente severa
- **Grupo Ansiedade** (perguntas 2, 4, 7, 9, 15, 19, 20; valor × 2): 0 a 7: Normal | 8 a 9: Leve | 10 a 14: Moderada | 15 a 19: Severa | 20 a 42: Extremamente severa
- **Grupo Estresse** (perguntas 1, 6, 8, 11, 12, 14, 18; valor × 2): 0 a 14: Normal | 15 a 18: Leve | 19 a 25: Moderada | 26 a 33: Severa | 34 a 42: Extremamente severa
- **Alerta de risco:** qualquer resposta acima de 0 na(s) pergunta(s) 21 avisa o profissional.

**Perguntas:**

1. Achei difícil me acalmar.
2. Senti minha boca seca.
3. Não consegui vivenciar nenhum sentimento positivo.
4. Tive dificuldade em respirar em alguns momentos (por exemplo, respiração ofegante ou falta de ar sem ter feito esforço físico).
5. Achei difícil ter iniciativa para fazer as coisas.
6. Tive a tendência de reagir de forma exagerada às situações.
7. Senti tremores (por exemplo, nas mãos).
8. Senti que estava sempre nervoso(a).
9. Preocupei-me com situações em que eu pudesse entrar em pânico e parecer ridículo(a).
10. Senti que não tinha nada a desejar.
11. Senti-me agitado(a).
12. Achei difícil relaxar.
13. Senti-me depressivo(a) e sem ânimo.
14. Fui intolerante com as coisas que me impediam de continuar o que eu estava fazendo.
15. Senti que ia entrar em pânico.
16. Não consegui me entusiasmar com nada.
17. Senti que não tinha valor como pessoa.
18. Senti que estava um pouco emotivo(a) ou sensível demais.
19. Percebi meu coração alterado mesmo sem ter feito esforço físico (por exemplo, batimentos mais rápidos ou falhando).
20. Senti medo sem motivo.
21. Senti que a vida não tinha sentido.

`[ ] Aprovado`   `[ ] Ajustar` → 

### 1.4 Teste de Identificação de Transtornos por Uso de Álcool (AUDIT) (AUDIT)

- **Mede:** Uso de álcool
- **Uso:** Adultos
- **Tempo:** 3 min. **Repetição sugerida:** Linha de base e depois conforme o risco
- **Fonte indicada no sistema:** Organização Mundial da Saúde (Babor et al., 2001), uso livre. Versão em português do Brasil.
- **Instrução mostrada ao paciente:** As perguntas a seguir são sobre o seu consumo de bebidas alcoólicas nos últimos 12 meses. Responda com sinceridade: só o seu profissional lê as respostas.
- **Opções de resposta (padrão):** 0 = Nunca; 1 = Menos de uma vez por mês; 2 = Mensalmente; 3 = Semanalmente; 4 = Todos ou quase todos os dias
- **Faixas do total:** 0 a 7: Baixo risco | 8 a 15: Uso de risco | 16 a 19: Uso nocivo | 20 a 40: Provável dependência
- **Linhas de corte no gráfico:** 8, 16, 20

**Perguntas:**

1. Com que frequência você consome bebidas alcoólicas?
   - opções desta pergunta: 0 = Nunca; 1 = Uma vez por mês ou menos; 2 = 2 a 4 vezes por mês; 3 = 2 a 3 vezes por semana; 4 = 4 ou mais vezes por semana
2. Nos dias em que você bebe, quantas doses costuma consumir?
   - opções desta pergunta: 0 = 1 ou 2; 1 = 3 ou 4; 2 = 5 ou 6; 3 = 7 a 9; 4 = 10 ou mais
3. Com que frequência você toma 6 ou mais doses em uma única ocasião?
4. Nos últimos 12 meses, com que frequência você achou que não conseguiria parar de beber depois de começar?
5. Nos últimos 12 meses, com que frequência você deixou de fazer o que era esperado de você por causa da bebida?
6. Nos últimos 12 meses, com que frequência você precisou beber pela manhã para se sentir bem depois de ter bebido muito no dia anterior?
7. Nos últimos 12 meses, com que frequência você sentiu culpa ou remorso depois de beber?
8. Nos últimos 12 meses, com que frequência você não conseguiu se lembrar do que aconteceu na noite anterior por causa da bebida?
9. Alguma vez você ou outra pessoa se machucou ou foi prejudicada por causa de você ter bebido?
   - opções desta pergunta: 0 = Não; 2 = Sim, mas não nos últimos 12 meses; 4 = Sim, nos últimos 12 meses
10. Algum parente, amigo, médico ou outro profissional de saúde já se preocupou com o seu modo de beber ou sugeriu que você parasse?
   - opções desta pergunta: 0 = Não; 2 = Sim, mas não nos últimos 12 meses; 4 = Sim, nos últimos 12 meses

`[ ] Aprovado`   `[ ] Ajustar` → 

### 1.5 Lista de Verificação de Sintomas de Estresse Pós-Traumático (PCL-5) (PCL-5)

- **Mede:** Estresse pós-traumático
- **Uso:** Adultos
- **Tempo:** 5 a 10 min. **Repetição sugerida:** Linha de base e reavaliação em 4 a 6 semanas
- **Fonte indicada no sistema:** Weathers et al. (2013), Centro Nacional de TEPT dos EUA, uso livre. Versão em português do Brasil.
- **Instrução mostrada ao paciente:** Abaixo há uma lista de problemas que as pessoas às vezes têm depois de uma experiência muito estressante. Pensando nessa experiência, marque o quanto cada problema incomodou você no último mês.
- **Opções de resposta (padrão):** 0 = Nada; 1 = Um pouco; 2 = Moderadamente; 3 = Bastante; 4 = Extremamente
- **Faixas do total:** 0 a 30: Abaixo do ponto de corte | 31 a 80: Acima do ponto de corte (31 ou mais)
- **Grupo Revivência** (perguntas 1, 2, 3, 4, 5) (só soma, sem faixa)
- **Grupo Evitação** (perguntas 6, 7) (só soma, sem faixa)
- **Grupo Humor e pensamentos** (perguntas 8, 9, 10, 11, 12, 13, 14) (só soma, sem faixa)
- **Grupo Alerta e reatividade** (perguntas 15, 16, 17, 18, 19, 20) (só soma, sem faixa)
- **Linhas de corte no gráfico:** 31

**Perguntas:**

1. Lembranças repetidas, perturbadoras e indesejadas da experiência estressante.
2. Sonhos repetidos e perturbadores com a experiência estressante.
3. De repente, sentir ou agir como se a experiência estressante estivesse acontecendo de novo (como se você estivesse realmente de volta lá).
4. Ficar muito chateado(a) quando algo lembrou você da experiência estressante.
5. Ter reações físicas fortes quando algo lembrou você da experiência (por exemplo, coração acelerado, dificuldade para respirar, suor).
6. Evitar lembranças, pensamentos ou sentimentos ligados à experiência estressante.
7. Evitar pessoas ou coisas que lembrem a experiência estressante (por exemplo, pessoas, lugares, conversas, atividades, objetos ou situações).
8. Dificuldade para lembrar de partes importantes da experiência estressante.
9. Ter crenças negativas fortes sobre você, outras pessoas ou o mundo (por exemplo, "há algo de errado comigo", "não se pode confiar em ninguém", "o mundo é completamente perigoso").
10. Culpar a si mesmo(a) ou a outra pessoa pela experiência estressante ou pelo que aconteceu depois dela.
11. Ter sentimentos negativos fortes, como medo, horror, raiva, culpa ou vergonha.
12. Perder o interesse em atividades de que você costumava gostar.
13. Sentir-se distante ou isolado(a) das outras pessoas.
14. Dificuldade de sentir emoções positivas (por exemplo, não conseguir sentir felicidade ou amor pelas pessoas próximas).
15. Comportamento irritável, explosões de raiva ou agir de forma agressiva.
16. Correr riscos demais ou fazer coisas que poderiam machucar você.
17. Ficar "superalerta", vigilante ou em guarda.
18. Sentir-se sobressaltado(a) ou assustar-se com facilidade.
19. Dificuldade para se concentrar.
20. Dificuldade para pegar no sono ou continuar dormindo.

`[ ] Aprovado`   `[ ] Ajustar` → 

### 1.6 Índice de Bem-Estar da OMS (WHO-5) (WHO-5)

- **Mede:** Bem-estar
- **Uso:** Adultos
- **Tempo:** 1 min. **Repetição sugerida:** Linha de base e depois mensal
- **Fonte indicada no sistema:** Organização Mundial da Saúde (1998), uso livre. Versão em português.
- **Instrução mostrada ao paciente:** Marque, para cada frase, a opção mais próxima de como você se sentiu nas últimas duas semanas.
- **Opções de resposta (padrão):** 5 = O tempo todo; 4 = A maior parte do tempo; 3 = Mais da metade do tempo; 2 = Menos da metade do tempo; 1 = De vez em quando; 0 = Nunca
- **Cálculo:** soma das respostas × 4
- **Faixas do total:** 0 a 28: Muito baixo (rastrear depressão) | 29 a 49: Baixo | 50 a 100: Adequado
- **Linhas de corte no gráfico:** 28, 50

**Perguntas:**

1. Eu me senti alegre e de bom humor.
2. Eu me senti calmo(a) e relaxado(a).
3. Eu me senti ativo(a) e com energia.
4. Eu acordei me sentindo renovado(a) e descansado(a).
5. Meu dia a dia tem sido preenchido por coisas que me interessam.

`[ ] Aprovado`   `[ ] Ajustar` → 

### 1.7 Escala de Satisfação com a Vida (SWLS) (SWLS)

- **Mede:** Satisfação com a vida
- **Uso:** Adultos
- **Tempo:** 1 min. **Repetição sugerida:** Linha de base e depois periódica
- **Fonte indicada no sistema:** Diener, Emmons, Larsen e Griffin (1985), uso livre. Versão em português.
- **Instrução mostrada ao paciente:** Marque o quanto você concorda com cada afirmação, pensando na sua vida de modo geral.
- **Opções de resposta (padrão):** 1 = Discordo totalmente; 2 = Discordo; 3 = Discordo um pouco; 4 = Nem concordo nem discordo; 5 = Concordo um pouco; 6 = Concordo; 7 = Concordo totalmente
- **Faixas do total:** 0 a 9: Extremamente insatisfeito(a) | 10 a 14: Insatisfeito(a) | 15 a 19: Ligeiramente insatisfeito(a) | 20 a 20: Neutro | 21 a 25: Ligeiramente satisfeito(a) | 26 a 30: Satisfeito(a) | 31 a 35: Extremamente satisfeito(a)
- **Linhas de corte no gráfico:** 20

**Perguntas:**

1. Na maioria dos aspectos, minha vida está próxima do meu ideal.
2. As condições da minha vida são excelentes.
3. Estou satisfeito(a) com a minha vida.
4. Até agora, consegui as coisas importantes que quero da vida.
5. Se pudesse viver a minha vida de novo, não mudaria quase nada.

`[ ] Aprovado`   `[ ] Ajustar` → 

---

## 2. Diário emocional do paciente

Versão do catálogo: v2-2026-10. O paciente registra uma emoção por vez, em etapas curtas. Os textos abaixo foram reescritos com linguagem própria; as emoções são agrupadas em famílias.

### 2.1 Famílias de emoções e frases de apoio

**Inquietação**: o corpo e a mente em alerta

- apoio: "Solte o ar devagar, mais longo do que o ar que entrou. Repita algumas vezes."
- apoio: "Olhe ao redor e diga em voz baixa três coisas que você vê agora."

**Confusão e cansaço**: pesado ou embaralhado por dentro

- apoio: "Escolha uma única coisa pequena para fazer agora. O resto pode esperar."
- apoio: "Beber água e apoiar os pés no chão já são cuidados."

**Leveza**: algo que faz bem

- apoio: "Vale registrar o que ajudou a chegar aqui: pode ser útil em dias mais difíceis."

**Peso e tristeza**: um peso, um vazio

- apoio: "Você não precisa resolver isso agora. Fique perto de algo ou de alguém que lhe faça bem."
- apoio: "Se puder, avise alguém de confiança de como você está."

**Raiva e irritação**: algo que incomoda ou pareceu injusto

- apoio: "Dê um tempo antes de responder ou agir. Afastar-se por alguns minutos é uma escolha válida."
- apoio: "Movimente o corpo: caminhar um pouco ajuda a baixar a intensidade."

**Distância**: desligado de si ou dos outros

- apoio: "Sinta o contato dos pés no chão e das mãos em algo firme."
- apoio: "Toque em um objeto com textura e descreva-a para si."

### 2.2 Emoções oferecidas

- **Inquietação:** Ansiedade, Medo, Tensão, Preocupação, Inquietação
- **Confusão e cansaço:** Confusão, Dúvida, Cansaço emocional, Sobrecarga
- **Leveza:** Alegria, Confiança, Esperança, Calma, Gratidão, Alívio, Orgulho
- **Peso e tristeza:** Tristeza, Desânimo, Solidão, Vazio, Vergonha, Culpa
- **Raiva e irritação:** Raiva, Irritação, Frustração, Injustiça
- **Distância:** Desligamento, Entorpecimento

### 2.3 Onde estava / o que estava acontecendo

- Um pensamento que não largava
- Uma sensação no corpo
- O lugar onde eu estava (casa, trabalho, estudo)
- Algo com uma pessoa
- Um fato específico do dia
- Não sei dizer

### 2.4 O que fez primeiro

- Tentei acalmar o corpo
- Tentei não agir no impulso
- Procurei apoio
- Só aguentei até passar
- Não consegui fazer nada

### 2.5 O que ajudou

- Respirei com calma
- Olhei e nomeei o que está ao meu redor
- Diminuí barulho, telas ou estímulos
- Parei antes de reagir
- Separei o que é fato do que é pensamento
- Falei comigo com gentileza
- Usei os sentidos (cheiro, toque, sabor)
- Mexi o corpo (caminhar, alongar)
- Cuidei de uma tarefa simples da rotina
- Procurei alguém
- Anotei o que me ajudou

### 2.6 Quanto ajudou

- Não fez diferença
- Aliviou um pouco
- Ajudou
- Foi um grande alívio

### 2.7 O que pesou no dia (etapa opcional)

- Dormi pouco ou mal
- Comi mal ou pulei refeições
- Corpo cansado ou com dor
- Muita coisa para dar conta
- Atrito com alguém
- Passei muito tempo sozinho(a)
- Dia sem rotina
- Mudança de saúde ou de medicação
- Lembrei de algo difícil
- Nenhum desses

### 2.8 Vontades difíceis (etapa opcional)

O que sentiu vontade de fazer:

- Vontade de me afastar de tudo
- Vontade de discutir ou me impor
- Vontade de comer, comprar ou fazer algo no automático
- Vontade de insistir com alguém
- Vontade de usar álcool ou outra substância
- Outra vontade
- Nenhuma vontade forte

E o que fez:

- Consegui segurar
- Comecei e parei no meio
- Acabei fazendo

### 2.9 Frases de fecho

- Hoje foi um passo e eu sigo
- Quero ficar de olho nisso
- Descobri algo que me ajuda
- Quero levar isso para a conversa
- Foi pesado e precisei de mais cuidado
- Outro

`[ ] Aprovado`   `[ ] Ajustar` → 

---

## 3. Aviso de segurança e alerta de risco

**Texto mostrado ao paciente** quando registra uma emoção de sofrimento (família baixa, distante ou inquieta) com intensidade 4 ou 5:

> **Aviso padrão (todo registro):** Este cartão não é um canal de emergência e o(a) profissional não o acompanha em tempo real.

> **Aviso com sofrimento intenso:** Se você estiver em sofrimento intenso ou pensando em se machucar, procure ajuda agora: ligue 188 (CVV, 24 horas, gratuito) ou 192 (SAMU), ou vá ao pronto-atendimento mais próximo.

**Como funciona o alerta:**

- **Diário:** o sistema só mostra o aviso ao paciente. **Hoje o profissional NÃO recebe alerta** por registro de sofrimento intenso (ele só vê a intensidade na ficha, quando abre).
- **Escalas:** qualquer resposta acima de 0 em pergunta crítica (PHQ-9, pergunta 9; DASS-21, pergunta 21) marca a escala com "atenção" na ficha do profissional e mostra ao paciente, ao concluir, a mensagem de cuidado com os contatos de ajuda.
- Contatos citados: **CVV 188** (24 h) e **SAMU 192**.

Perguntas para você:

1. O texto do aviso está adequado e acolhedor? Falta algum contato (CAPS, UPA da região)?
2. Intensidade 4 ou 5 em emoções de sofrimento é um bom critério para mostrar o aviso, ou prefere só 5?
3. O profissional deve ser avisado na hora (e-mail ou aviso no painel; **ainda não existe**) quando o paciente registrar sofrimento intenso, ou basta ver na ficha? Recomendamos construir esse aviso antes de usar com pacientes reais.

`[ ] Aprovado`   `[ ] Ajustar` → 

---

## 4. Anamneses e formulários

O profissional pode pedir ao paciente por link ou preencher na sessão. Cada modelo pode ser copiado e editado.

### 4.1 Anamnese geral de saúde

Queixa, história de saúde, hábitos e expectativas. Serve para qualquer área. (para: PSICOLOGO, NEUROPSICOLOGO, MEDICO, FISIOTERAPEUTA, TERAPEUTA_OCUPACIONAL, FONOAUDIOLOGO, NUTRICIONISTA, OUTRO)

1. O que traz você ao atendimento? _(dica: Pode escrever do seu jeito.)_
2. Desde quando isso acontece e como tem evoluído?
3. Já fez algum tratamento para isso? Como foi?
4. Tem alguma condição de saúde ou já passou por cirurgias?
5. Usa medicamentos ou suplementos? Quais, e em que dose?
6. Tem alergias?
7. Existe algo de saúde que se repete na sua família?
8. Como você avalia o seu sono? — escala de 1 a 5 _(dica: 1 = muito ruim, 5 = muito bom)_
9. Com que frequência pratica atividade física? — opções: Nunca / Às vezes / 1 a 2 vezes por semana / 3 vezes ou mais por semana
10. Consumo de álcool — opções: Não bebo / Ocasionalmente / Com frequência
11. Você fuma? — sim ou não
12. Com quem você pode contar no dia a dia?
13. O que você espera deste atendimento?
14. Quer contar mais alguma coisa?

`[ ] Aprovado`   `[ ] Ajustar` → 

### 4.2 Anamnese psicológica (adulto)

Motivo da busca, história emocional, rede de apoio, rotina e objetivos. (para: PSICOLOGO, NEUROPSICOLOGO)

1. O que fez você buscar ajuda agora?
2. O que mais tem incomodado você ultimamente?
3. Desde quando você se sente assim? Mudou ao longo do tempo?
4. O quanto isso atrapalha trabalho, estudos ou relações? — escala de 0 a 10 _(dica: 0 = nada, 10 = muito)_
5. Como tem estado o seu humor nas últimas semanas? — escala de 1 a 5 _(dica: 1 = muito baixo, 5 = muito bom)_
6. Seu sono — opções: Durmo bem / Demoro a dormir / Acordo várias vezes / Durmo pouco / Durmo demais
7. Já fez psicoterapia ou acompanhamento psiquiátrico antes? — sim ou não
8. Se sim, conte como foi e o que ajudou ou não.
9. Usa algum medicamento? Quais?
10. Houve algum acontecimento marcante na sua vida que queira compartilhar? _(dica: Compartilhe só o que se sentir à vontade.)_
11. Quem faz parte da sua rede de apoio?
12. Alguém da família passou por questões emocionais ou de saúde mental?
13. Uso de álcool ou outras substâncias — opções: Não uso / Ocasionalmente / Com frequência / Prefiro conversar pessoalmente
14. Quais são as suas qualidades e o que costuma ajudar você nos dias difíceis?
15. O que você gostaria de mudar ou alcançar com o acompanhamento?

`[ ] Aprovado`   `[ ] Ajustar` → 

### 4.3 Anamnese infantil (responsável)

Gestação, desenvolvimento, escola, rotina e comportamento, respondida por quem cuida da criança. (para: PSICOLOGO, NEUROPSICOLOGO, MEDICO, FISIOTERAPEUTA, TERAPEUTA_OCUPACIONAL, FONOAUDIOLOGO, NUTRICIONISTA, OUTRO)

1. Quem está respondendo e qual a sua relação com a criança?
2. O que levou você a buscar atendimento para a criança?
3. Como foram a gestação e o parto? _(dica: Intercorrências, tempo de gestação, tipo de parto.)_
4. Como foi o desenvolvimento: quando sentou, andou e falou as primeiras palavras?
5. Doenças, internações, alergias ou uso de medicamentos?
6. Em que ano escolar está? Como são o desempenho e a adaptação?
7. Como é a rotina de um dia comum (horários, telas, brincadeiras)?
8. Sono da criança — opções: Dorme bem / Demora a dormir / Acorda à noite / Dorme pouco
9. Como é a alimentação?
10. Como a criança se comporta em casa e fora de casa?
11. Como ela se relaciona com familiares e outras crianças?
12. Quem mora na casa e como é a dinâmica da família?
13. O que você espera do atendimento?

`[ ] Aprovado`   `[ ] Ajustar` → 

### 4.4 Anamnese de reabilitação

Queixa funcional, dor, histórico de lesões e objetivos. Para fisioterapia, terapia ocupacional e fonoaudiologia. (para: FISIOTERAPEUTA, TERAPEUTA_OCUPACIONAL, FONOAUDIOLOGO, MEDICO, OUTRO)

1. Qual é a sua principal queixa?
2. Em que parte do corpo ou em que função você sente a dificuldade?
3. Quando começou e como foi (trauma, esforço, gradual)?
4. Intensidade da dor nos últimos dias — escala de 0 a 10 _(dica: 0 = sem dor, 10 = a pior possível)_
5. O que piora e o que alivia?
6. Cirurgias, fraturas ou lesões anteriores?
7. Fez exames ou usa algum aparelho de apoio?
8. Quais atividades do dia a dia ficaram mais difíceis?
9. Qual é a sua rotina de trabalho e de atividade física?
10. O que você quer voltar a conseguir fazer?

`[ ] Aprovado`   `[ ] Ajustar` → 

### 4.5 Anamnese nutricional

Objetivo, rotina alimentar, hábitos e histórico de saúde. (para: NUTRICIONISTA, MEDICO, OUTRO)

1. Qual é o seu objetivo com o acompanhamento nutricional?
2. Descreva como é um dia comum de refeições.
3. Quantas refeições faz por dia? — opções: 1 a 2 / 3 / 4 a 5 / 6 ou mais
4. Restrições, alergias ou alimentos de que não gosta?
5. Quanta água bebe por dia? — opções: Menos de 1 litro / 1 a 2 litros / Mais de 2 litros
6. Atividade física — opções: Nenhuma / 1 a 2 vezes por semana / 3 vezes ou mais por semana
7. Qualidade do sono — escala de 1 a 5
8. Como tem sido o seu peso ao longo do tempo?
9. Condições de saúde ou medicamentos em uso?
10. Usa suplementos ou chás?

`[ ] Aprovado`   `[ ] Ajustar` → 

---

## 5. Modelos de evolução (registro da sessão)

Cada sessão é registrada em um modelo. Há também um campo de **anotações privadas** que só quem escreveu consegue ler. Conferir nome, campos e dicas de preenchimento.

### 5.1 Anotação livre

Só as duas folhas: suas anotações e a evolução do prontuário.


`[ ] Aprovado`   `[ ] Ajustar` → 

### 5.2 SOAP

Relato, observações, avaliação e plano, em quatro campos.

- **S · Subjetivo**: O que o paciente relatou e como viveu o período.
- **O · Objetivo**: O que você observou ou mediu na sessão.
- **A · Avaliação**: Sua leitura do quadro a partir de S e O.
- **P · Plano**: Condutas, combinados e próximos passos.

`[ ] Aprovado`   `[ ] Ajustar` → 

### 5.3 Sessão com foco

Contexto, foco do encontro e agenda de pontos a tratar.

- **Contexto breve**: Em que momento o paciente chega hoje.
- **Foco da sessão**: O objetivo clínico do encontro, em uma frase.
- **Pontos da sessão** (lista): Itens que você quer percorrer hoje.

`[ ] Aprovado`   `[ ] Ajustar` → 

### 5.4 DBT

Alvos, análise em cadeia, habilidades e compromisso.

- **Alvos prioritários**: Hierarquia dos alvos trabalhados.
- **Análise em cadeia**: Vulnerabilidades, gatilho, elos e consequências.
- **Habilidades e intervenções**: O que foi ensinado, praticado ou reforçado.
- **Compromisso e prática**: Combinados e prática entre sessões.

`[ ] Aprovado`   `[ ] Ajustar` → 

### 5.5 Consulta clínica

Queixa, história, exame, hipótese e conduta.

- **Queixa principal**: Motivo da consulta nas palavras do paciente.
- **História atual**: Evolução do quadro, tratamentos e respostas.
- **Exame**: Achados do exame físico ou funcional.
- **Hipótese diagnóstica**: Impressão clínica e diagnósticos diferenciais.
- **Conduta**: Prescrições, pedidos de exames e orientações.

`[ ] Aprovado`   `[ ] Ajustar` → 

### 5.6 Sessão de reabilitação

Avaliação funcional, conduta, resposta do paciente e orientações.

- **Avaliação funcional**: Como o paciente está hoje (dor, mobilidade, função).
- **Conduta aplicada**: Técnicas e exercícios realizados.
- **Resposta do paciente**: Como reagiu durante e depois da sessão.
- **Orientações para casa**: O que ele deve fazer até o próximo encontro.

`[ ] Aprovado`   `[ ] Ajustar` → 

### 5.x Quais modelos cada profissão vê

- **Psicólogo(a)** (CRP): Anotação livre, SOAP, Sessão com foco, DBT
- **Neuropsicólogo(a)** (CRP): Anotação livre, SOAP, Sessão com foco, DBT
- **Médico(a)** (CRM): Anotação livre, Consulta clínica, SOAP
- **Fisioterapeuta** (CREFITO): Anotação livre, Sessão de reabilitação, SOAP
- **Terapeuta ocupacional** (CREFITO): Anotação livre, Sessão de reabilitação, SOAP
- **Fonoaudiólogo(a)** (CRFa): Anotação livre, Sessão de reabilitação, SOAP
- **Nutricionista** (CRN): Anotação livre, Consulta clínica, SOAP
- **Outro profissional da saúde** (Registro profissional): Anotação livre, SOAP

---

## 6. Pontos que dependem de você ou do jurídico

- Texto de **consentimento para gravação** de videochamada (ainda não definido; precisa de revisão jurídica e sua).
- Confirmar se podemos usar as escalas acima **sem pedir permissão** aos autores (indicamos uso livre; a confirmação é sua).
- Perguntas já em aberto de outros instrumentos: BRIEF-2, FDT e SRS-2 (lista separada).

