# Estudo Sintropia.psi: App do paciente, ciclo completo (15/10/2026)

Teste feito com uma **paciente fictícia** ("Humberto Silva - Teste", criada pelo botão "Testar como paciente") e a conta Google do usuário no app do paciente. Nada de paciente real. Um check-in de teste (Ansiedade, 2/5) foi enviado; nenhuma escala foi respondida.

## Entrada do paciente (sintropia.me/paciente, depois /sistema_paciente)
1. Login com **Google** (ou cadastro). Também "Instalar app" (PWA) e abas "Cadastre-se / Sou psicóloga".
2. Tela **"Falta só um passo"**: confirmar nome completo e telefone (com código do país). "Leva menos de 1 minuto".
3. Tela **"Minhas conexões"**: lista de psicólogas vinculadas (ativas/total), campo **"Conectar nova psicóloga"** (colar o código de vínculo → "Ativar código"), aparência (cor: sistema/claro/escuro; movimento: sistema/completo/reduzido), "Deslogar". Um paciente pode ter **várias psicólogas** e escolher qual dirige o espaço; dá para reativar vínculos antigos.
4. Sem conexão: aviso "Conexão necessária: escolha sua conexão ativa" e o espaço fica em espera.

## O que o paciente vê depois de conectar
- **Início**: saudação ("Olá, Fulano / Conexão ativa com [psicólogo]"); **faixa de dias** (calendário horizontal, mês no topo) ; cartão **"Check-in do dia: Preencher o clima de agora"** (botão "Fazer check-in"); depois de responder vira **"Seu clima de hoje foi acolhido"** com emoção, intensidade, hora e "Ver resumo de hoje"; cartão de **escala pendente** (ex.: GAD-7) com botão Abrir.
- **Menu inferior com 4 abas**: Início; **Escalas** (lista por data de todas as escalas para preencher, com ícone de play); **Espaço vinculado** (conexão ativa: card "Seu espaço de cuidado está ativo" com atalhos Gerenciar conexão / Ver hoje / Ver documentos; documentos "enviados e recebidos por data"); **Biblioteca** (material compartilhado pelo psicólogo; ícone de pasta).
- **Escala (ex.: GAD-7)**: página longa com instruções gerais, perguntas numeradas, opções numéricas 0 a 3 em botões; enviar no fim.

## Cartão Diário no app do paciente (5 etapas + revisão, cor da tela segue a emoção)
1. **Clima emocional: "O que apareceu agora?"** (escolha a emoção que mais se aproxima deste momento): 19 emoções em cartões com ícones de clima (sol, chuva, tempestade, vento, nublado) e rádio.
2. **Intensidade: "Quanto isso está presente?"**: 0 a 5 (Quase nada, Leve, Perceptível, Presente, Forte, Muito forte).
3. **Contexto: "Onde isso apareceu?"**: Algo aconteceu; Veio do corpo; Veio de um pensamento; Relação com alguém; Ambiente/trabalho/estudo; Não sei; mais nota curta opcional.
4. **Cuidado possível: "O que você conseguiu tentar?"**: "O que você tentou primeiro?" (6 opções), "Alguma ação ajudou?" (11 ações, múltipla), "Isso ajudou?" (Não / Um pouco / Ajudou / Ajudou muito), nota opcional.
5. **Fechamento: "O que você leva deste momento?"**: 5 frases + chave **"Levar para a sessão"** + "Uma última nota para você".
6. **Revisão: "Seu registro está pronto"**: data do check-in, resumo, aviso "Seu registro fica no seu cuidado; as respostas são enviadas somente quando você confirma", botão Enviar registro.
7. **Final: "Registro acolhido"** ("Obrigado por perceber e registrar este momento. Você não precisa resolver tudo agora."), com o registro do dia.
- (Nesta configuração não apareceram as etapas "Mochila" e "Impulso" do modelo padrão; o psicólogo escolhe o que aparece por paciente.)

## O que o psicólogo recebe (Monitoramento > paciente > Cartão diário)
- Painel **"Respostas do Cartão diário"**: cartão ativo, **última resposta** (emoção, intensidade, barra de dias com registro "1/7 dias"), **sinais do último registro** (etiquetas), "Levar para a sessão", botões **Abrir respostas** e **Editar cartão do [paciente]**.
- **Leitura clínica** automática: "1 Pedido para sessão" + frase-resumo ("Quando Veio do corpo, aparece Ansiedade; o peso do dia ainda precisa ser nomeado; o cuidado testado foi Respiração"; "Essa pequena confirmar tudo em sessão antes de chamar de padrão"), com indicadores: registros, intensidade média, sessão (pedidos), cuidado.
- **Mapa emocional** (gráfico por dia, pontos rosa = pedido para sessão), **Leitura da composição** (emoção central e % de cada emoção, contexto, cuidado, pedido), período 7d/30d/90d.
- **Roteiro para sessão** ("Comece pelo pedido do paciente"): focos selecionáveis (Pedido do paciente, Contexto registrado, Cuidado tentado, Tema emocional) que abrem o registro vinculado; cada foco traz uma sugestão de como abrir a conversa.
- **Registros respondidos**: lista de cards por dia; abrindo mostra **as escolhas exatas** (emoção, intensidade, contexto, peso do dia, cuidado, impulso, fechamento, sessão: "Paciente pediu conversa em sessão").
- **Apoio LUMA (IA)**: "Leitura inicial" com **perguntas** sugeridas para a sessão e **ações**; botão "Gerar leitura" (a IA só entra depois de haver dados).
- Visão Monitoramento: contadores (pacientes, conectados, com atividade, escalas pendentes), fila de acompanhamento ("Registro hoje").

## Pontos de atenção (importante)
- **Parecença com o nosso Diário:** várias frases e a estrutura do que implementamos na fase 1 são **muito próximas** deste fluxo: a ordem das etapas, os títulos ("O que apareceu agora?", "Onde isso apareceu?", "O que você conseguiu tentar?", "O que você leva deste momento?"), as 6 opções de contexto, as 5 frases de fechamento, a pergunta "Isso ajudou?" com as mesmas 4 respostas, o texto de revisão ("Seu registro fica no seu cuidado...") e "Levar para a sessão". Isso foi montado a partir dos vídeos de tela. **Recomendado reescrever/criar versão própria desses textos e opções (com a Letícia)**, para o NeuroLogic ter identidade própria e evitar cópia de conteúdo de terceiros. Não é só visual: textos e opções contam.
- Escalas: licenciamento a conferir caso a caso.
- A IA deles só gera leitura depois de existirem dados reais e sempre como apoio, sem diagnóstico.

---
# Complemento (15/10/2026, 2ª rodada de testes com a paciente fictícia)

## Editar cartão do paciente (psicólogo) = personalização por paciente
- Botão **Editar cartão de [paciente]** abre o editor do modelo daquele paciente. Cabeçalho: nome do modelo, "8/8 etapas visíveis", versão publicada (Publicado 1), "Sem rascunho"; **Usar modelo salvo ou cartão de outro paciente**; **Salvar como modelo** com nome para reutilizar.
- **8 etapas**, cada uma com: ordem (arrastar ou setas), nome da etapa no app, **texto de apoio para o paciente** (editável), resumo do conteúdo e botão **Ocultar**. Etapas: 1 Emoção (19 emoções + 5 climas), 2 Intensidade (0 a 5), 3 Contexto (6 opções), 4 **Mochila** (9 pesos do dia), 5 Cuidado (6 cuidados, 11 ações), 6 **Impulso** (5 impulsos, 3 ações), 7 Fechamento (5 sínteses), 8 **Histórico** ("leitura pessoal da semana e mês no app do paciente"; etapa estrutural). Existe a área "Ocultas no app".
- **Itens de resposta**: "O que aparece e o que fica oculto no app": no modelo padrão, **79 itens no app e 20 ocultos**. Cada grupo (Emoções principais, Climas, Contextos, Vulnerabilidades/mochila, Categorias de cuidado, Ações e habilidades, Habilidades de treino, Isso ajudou?, Impulsos, Ação do impulso, Fechamentos) permite **reordenar, ocultar e reativar cada opção**. Ex.: das 19 emoções, 15 aparecem e 4 ficam ocultas por padrão (Confiança, Dúvida, Injustiça, Gratidão).
- Botões: **Descartar**, **Salvar para este paciente**, **Publicar**. "Publicar muda apenas os próximos preenchimentos."
- Testado: reativar "Confiança" e publicar mostrou "Configuração publicada para os próximos preenchimentos". Publicar NÃO libera um novo check-in no mesmo dia.

## Regras observadas no app do paciente
- **Um check-in por dia.** Depois de responder, o cartão vira "Seu clima de hoje foi acolhido" e não há botão para outro. Selecionar outra data mostra "Sem tarefas nesta data. O profissional responsável não deixou pendências."
- Neste check-in (intensidade 2, ansiedade) as etapas **Mochila e Impulso não apareceram** (o app mostrou só Emoção, Intensidade, Contexto, Cuidado, Fechamento, Revisão), embora estivessem ativas no modelo: indicam **etapas condicionais**. NÃO confirmado o gatilho (suspeita: intensidade alta e/ou emoção/clima). PRECISA testar amanhã (16/10) com intensidade 4 ou 5 e com emoção como raiva/tristeza.
- O Mural do Humor e uma aba própria não apareceram no app por navegador (4 abas: Início, Escalas, Espaço vinculado, Biblioteca). Pode existir só no app nativo (a conferir).

## Escala no app (GAD-7)
- Cada escala solicitada vira um item em "Escalas" com data; a mesma escala pode ser enviada várias vezes (aqui: "5 envios, 1 concluído, 4 pendentes").
- Página única com instruções e 7 perguntas de 0 a 3, botão **Enviar Respostas**. Pontuação máxima (21) → o paciente vê só **"Parabéns! Sua tarefa foi concluída com sucesso!"** (sem nota e sem aviso de risco para o paciente).
- Visão do psicólogo (Monitoramento > paciente > Escalas > Enviados): cartão da escala com construto, uso, tags (Autoaplicável, itens, tempo, Adultos), aviso **"Triagem, não diagnóstica"**, contadores (envios, concluídos, pendentes, última data), botões **Visualizar**, **Solicitar** (enviar de novo) e **Respostas**; **gráfico "Histórico de pontuação"** com faixas coloridas (verde, amarelo, laranja, vermelho), **pontos de corte** (5, 10, 15), **linha normativa (10)** e a pontuação por data; **Análise LUMA** (IA) gerada sozinha: resumo (data, score 21/21, interpretação "Ansiedade Grave (pontuação máxima)"), evolução, implicações clínicas (nível sintomático, **risco e segurança: avaliação urgente de risco suicida**, comorbidades, monitorização) e **recomendações operacionais** (avaliação clínica detalhada, instrumentos complementares, revisar prontuário/medicação, rotina de reavaliação em 1 a 2 semanas, plano de segurança e contatos de emergência), mais tom e observações finais. 
- Observação de desenho: o risco aparece só para o psicólogo; o paciente não vê pontuação.

## Pendentes de teste (amanhã, 16/10, por causa do limite de 1 check-in/dia)
- Intensidade 4/5 e outras emoções: ver se aparecem Mochila e Impulso, aviso de segurança, mudança nas opções.
- Trocar o modelo do cartão da paciente de teste (Biblioteca > outro modelo) e comparar o app.
- Biblioteca compartilhada (psicólogo envia arquivo) e Documentos.
- Mural do Humor (provavelmente só no app nativo; verificar o menu do app).

## Revisita em 18/10/2026 (app do paciente de teste)
- **Início** = o "resumo do dia" do paciente: seletor de mês e faixa de 11 dias (o dia de hoje marcado), cartão **Check-in do dia** ("Preencher o clima de agora", selo Liberado ou Respondido hoje) e um cartão da data: **"Sem tarefas nesta data / Dia livre de pendências"**, com atalhos "Ver documentos" e "Gerenciar conexão". Não há um texto de resumo gerado por IA para o paciente.
- **Documentos** (2º ícone): lista por data de tarefas e escalas. Escala recorrente semanal (GAD-7) aparece **já listada para as próximas semanas** (22/10, 29/10, 05/11, 12/11) com "Escala para preencher"; as feitas ficam riscadas como "Concluída" (GAD-7 e DASS-21 de 15/10).
- **Conexão** (3º ícone): "Seu espaço de cuidado está ativo", com nome do profissional, atalho Hoje e Documentos.
- **Biblioteca** (4º ícone): materiais compartilhados pelo profissional (abrir, baixar, e "ainda não há registro de abertura").
- Ideia para nós: mostrar ao paciente as próximas escalas já programadas (hoje só criamos a próxima quando ele responde a anterior) e a faixa de dias no início.
