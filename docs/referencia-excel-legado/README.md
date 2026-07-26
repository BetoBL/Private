# Referência visual: sistema Excel legado da psicóloga (Leticia Jose Pereira)

Extraído em 2026-07-26 de 5 gravações de tela enviadas pelo usuário
(`OneDrive/Sistemas - Claude - BKP/NeuroLogic - BKP/Videos Sistema/`, ~32 min
no total), mostrando o sistema real "V.3.3.9V.VIN" que ela usa hoje em
produção — uma planilha Excel gigante com uma aba por teste, mais um menu e
uma aba de relatórios consolidados. **Este Excel não gera o laudo narrativo**
(texto de Análise/Conclusão) — ele só corrige/organiza escores, exatamente
o escopo que o CLAUDE.md já define para o nosso backend. O valor real aqui é
a convenção visual/estrutural que ela já validou na prática: como apresentar
resultado de teste com tabela + gráfico.

As imagens numeradas nesta pasta são still frames das gravações (via
ffmpeg), escolhidas por serem as mais ilustrativas de cada padrão. Índice:

## 1. Estrutura geral do sistema

- **`03-menu-principal-catalogo-completo-testes.jpg`** — Menu Principal:
  lista completa de todos os testes que ela usa hoje (~70 instrumentos),
  organizados em 4 colunas alfabéticas. Também confirma as categorias do
  ribbon: Eficiência Intelectual/Multi Domínios, Funções Executivas, Atenção
  e Memória, Linguagem e VisuoConstrução, Habilidades Acadêmicas,
  Inventários, Personalidade, Relatórios, ADM. Útil como checklist ao
  priorizar quais testes documentar/implementar a seguir — vários aqui
  ainda não existem no nosso catálogo (BAMS, Blocos de Corsi, Boston,
  D2-R, EPQ-J, Go/No Go, Hayling, HVLT-R, NEPSY2, Neupsilin-Infantil,
  Prova de Aritmética-Seabra, PED-VR, PEP-R, Pfister, PROLEC, STROOP,
  TDE-2, THCP, TOKEN, Torre de Londres, Trilhas, Wisconsin-48 cartas,
  WISC-4, EP/QEDP-Inventário de Estilos Parentais).

- Cada aba de teste segue o mesmo esqueleto: cabeçalho com nome do teste +
  ícones de atalho (Menu Inicial / Cadastro de Pacientes / Protocolo
  Geral), faixa roxa "Psicólogo(a) Responsável" + CRP, bloco azul com dados
  do paciente (Nome, Escolaridade, Sexo, Tabela Normativa, Data de
  Aplicação, Data de Nascimento, Idade Cronológica, Idade Para Cálculo),
  e uma faixa amarela de aviso "não esqueça de preencher a Data de
  Aplicação" — sempre com uma variação bem-humorada/regional do aviso
  ("Ôôôxe...", "Eeeeeeitaaaa...", "...né?!", "Boralá?"). Vale manter esse
  tom acolhedor como inspiração para mensagens de validação no frontend
  (sem copiar literalmente).

## 2. Tabela de resultado por teste (padrão universal)

Colunas recorrentes em praticamente toda aba de resultado (variam um pouco
por teste): **Pontos Brutos, Percentil do estudo, Média, Desvio Padrão,
Z-Score, Pontos Ponderados, Percentil, Classificação**. Ver
`06-wais3-perfil-pontos-ponderados-subtestes.jpg` e
`04-pedra-de-rosetta-conversor-universal-escores.jpg`.

- **`04-pedra-de-rosetta-conversor-universal-escores.jpg`** — aba
  "Conversor - Z-Score" (apelidada "PEDRA DE ROSETTA"): uma calculadora
  universal que converte livremente entre Z-Score, T-Score, Pontos
  Ponderados, Percentil e Pontos Compostos a partir de Bruto+Média+Desvio
  Padrão. Nota de rodapé: **"Para 'Classificação' optou-se pelo sistema
  utilizado nas escalas Wechsler (WISC e WAIS)"** — confirma que a
  classificação Wechsler (`WECHSLER_CLASSIFICACAO_FAIXAS` já implementada
  em `apps/api/prisma/seed.ts`) é o padrão dela para testes com essa
  origem.

## 3. Sistema de classificação por percentil — ACHADO IMPORTANTE

- **`08-ac15-classificacao-guilmette-citacao.jpg`** e
  **`10-ped-vr-citacao-completa-guilmette-2020.jpg`** — a coluna de
  classificação por percentil aparece rotulada **"Classificação
  (Guilmette)"**, com a citação completa no rodapé:

  > Thomas J. Guilmette, Jerry J. Sweet, Nancy Hebben, Deborah Koltai,
  > E. Mark Mahone, Brenda J. Spiegler, Kirk Stucky, Michael Westerveld &
  > Conference Participants (2020). American Academy of Clinical
  > Neuropsychology consensus conference statement on uniform labeling of
  > performance test scores, The Clinical Neuropsychologist, 34:3, 437-453,
  > DOI: 10.1080/13854046.2020.1722244

  **Ação pendente**: `apps/api/src/lib/gerarDocxLaudo.ts` hoje cita uma
  tabela estática "Miotto (2017)" para a classificação por percentil. A
  psicóloga usa a referência **Guilmette et al. (2020)** (consenso
  AACN), não Miotto. Precisa revisar/trocar essa citação e conferir se as
  faixas percentílicas batem com o consenso AACN antes de considerar
  aquilo correto. Não é urgente (o laudo já funciona), mas é uma
  inconsistência de citação que pode comprometer a credibilidade técnica
  do documento final.

- Importante: nem todo teste usa o mesmo sistema. `05-vineland3...` e o
  Boston Name Testing (não capturado em still isolado, mas visto na
  gravação) mostram **duas colunas de classificação lado a lado**
  ("Sistema Wechsler" e "Sistema Heaton") para o mesmo escore — ou seja,
  ela às vezes reporta a classificação em mais de um sistema
  simultaneamente, dependendo da convenção do teste original. Não assumir
  um sistema único global.

## 4. Gráficos — o pedido original do usuário

Ela usa 4 famílias de gráfico, escolhidas conforme o tipo de escore:

1. **Barra vertical com zonas coloridas horizontais ("semáforo")** — para
   escores de corte clínico (T-Score do BRIEF2/BRIEF-P) ou percentil
   (tarefas de linguagem/atenção). Zonas fixas (ex.: BRIEF2: vermelho
   ≥70 Clínico, laranja ≥65 Potencialmente Clínico, amarelo ≥60
   Moderadamente Clínico, branco <60 Não Clínico) desenhadas como fundo,
   com a barra do paciente sobreposta.
   Ver `01-brief2-grafico-indices-tscore-zonas-clinicas.jpg` e
   `02-fluencia-verbal-grafico-percentil-semaforo.jpg`.

2. **Perfil de subtestes em coluna com zonas coloridas** — usado nas
   escalas Wechsler (WAIS-III, WISC), eixo Y de pontos ponderados 0-19,
   zonas fixas (vermelho 0-4, amarelo 5-7, verde 8-15, azul 16-19), uma
   coluna por subteste agrupada por índice fatorial.
   Ver `06-wais3-perfil-pontos-ponderados-subtestes.jpg` e
   `07-wisc-perfil-subtestes-cores-zonas.jpg`.

3. **Linha/perfil de domínio com linhas de referência (não zonas
   coloridas)** — usado no Vineland-3: escore padrão 20-140, linha de
   média (100) e linhas tracejadas para 1/2/3 desvios-padrão, um gráfico
   por entrevista (permite comparar Entrevista 1/2/3 lado a lado).
   Ver `05-vineland3-grafico-dominios-desvio-padrao.jpg`.

4. **Radar/aranha para facetas de personalidade** — usado no BFP, um
   gráfico por domínio (ex. Extroversão, Socialização), eixos = facetas
   daquele domínio, múltiplas séries tracejadas permitindo sobrepor mais
   de uma medição/perfil no mesmo radar.
   Ver `09-bfp-grafico-radar-facetas.jpg`.

   Também existe um padrão adicional (visto em SNAP-IV e SRS-2, não
   copiado como still isolado): **linha simples com "nota de corte"
   tracejada horizontal** comparando o paciente contra o ponto de corte,
   uma linha por informante (Cuidador 1/2/3, Professor).

## 5. Aba "Relatórios" — tabela mestre consolidada

- **`11-relatorios-conversor-tabela-mestre-consolidada.jpg`** — a aba
  "Conversor" dentro de "Relatórios" puxa o resultado (Número Bruto,
  Ponder, Z-score, Percentil, Classificação) de **todos** os testes já
  aplicados ao paciente, organizados por domínio/seção (ATENÇÃO, MEMÓRIA,
  PERSONALIDADE, Habilidades Acadêmicas, etc.), cada seção com uma cor de
  fundo distinta, e uma barra de gradiente arco-íris (verde→azul, escala
  de cor condicional) ao lado de cada bloco como resumo visual rápido.
  Isso é essencially o "dashboard" que antecede a redação do laudo — dá
  uma pista forte de como poderia ser uma tela de "resumo da bateria" no
  nosso sistema, antes de entrar na composição do laudo propriamente.

## 6. Vineland-3 — detalhe metodológico não documentado ainda

- **`12-vineland3-analise-forcas-fraquezas-taxa-base.jpg`** — mostra a
  seção "Comportamento Mal Adaptativo" (Internalizante/Externalizante,
  com itens críticos) e "Análise das Forças e Fraquezas", que usa os
  conceitos de **Taxa de Base** e **Diferença de Pontuação Padrão vs.
  Valor Crítico** do manual do Vineland-3 para decidir se uma diferença
  entre domínios é "Clinicamente Significativa" (corte ≤15%) — isso vai
  além do que está em `docs/testes/Vineland.md` hoje (que já documenta a
  estrutura mas foca nos domínios/escores, não nessa análise de
  discrepância). Também confirma que ela roda até 4 entrevistas/aplicações
  do Vineland em paralelo no mesmo formulário, uma por informante/data.

## Como usar esta referência

Não é para copiar o design 1:1 — é para calibrar as decisões de UI/PDF do
nosso sistema (telas de lançamento de teste, resumo de bateria, exportação
DOCX) contra o que já funciona na prática clínica real dela. Quando for
desenhar a tela de resultado de um teste ou o gráfico de um laudo, reveja
a seção relevante acima antes de inventar um padrão novo do zero.
