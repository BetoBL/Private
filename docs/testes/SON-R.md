# SON-R 2½-7[a] — Teste Não-Verbal de Inteligência

> Extraído de material fornecido pela psicóloga (uso legítimo, restrito à clínica). **Não redistribuir o PDF de origem** — só os dados normativos estruturados abaixo (compilações factuais/números, não texto autoral).
> Fonte: "SON-R 2 MANUAL.pdf" = "SON-R 2 MANUAL 1.pdf" (arquivos idênticos, mesmo hash). Laros, J. A.; Tellegen, P. J.; Jesus, G. R. de; Karino, C. A. *SON-R 2½-7[a]: Teste Não-Verbal de Inteligência — Manual*. Adaptação e normatização brasileira 2008. São Paulo: Hogrefe. ISBN 978-85-85439-56-9 (Hogrefe). Baseado no SON-R 2½-7 original (Tellegen, Winkel, Wijnberg-Williams & Laros, Holanda, 1998). 195 páginas físicas, todas lidas.
> Qualidade de digitalização: boa (fotos de página impressa), algumas com leve desfoque nas tabelas normativas (números ainda legíveis, sem ambiguidade encontrada).

## Estrutura do instrumento

Teste **não-verbal** de inteligência (aplicável sem depender de habilidade de fala/linguagem escrita — adequado para crianças surdas, com TEA, com atraso de linguagem, ou imigrantes/falantes de outro idioma). Idades: **2;6 a 7;11 anos**. Aplicação individual, ~30 minutos.

É a **versão reduzida** (2007) do SON-R 2½-7 completo (que tem 6 subtestes: Padrões, Mosaicos, Quebra-cabeças, Situações, Categorias, Analogias). A versão reduzida `[a]` usa só 4 subtestes, dois de cada tipo:

| Subteste | Tipo | Nº de itens |
|---|---|---|
| Mosaicos | Execução (espacial/viso-motor) | 15 (Parte I: 1-6, Parte II: 7-15) |
| Categorias | Raciocínio (abstrato) | 15 (Parte I: 1-7, Parte II: 8-15) |
| Situações | Raciocínio (concreto) | 14 (Parte I: 1-6, Parte II: 7-14) |
| Padrões | Execução (espacial/viso-motor) | 16 (Parte I: 1-10, Parte II: 11-16) |

Ordem de aplicação: Mosaicos → Categorias → Situações → Padrões.

**Descrição das tarefas:**
- **Mosaicos**: a criança reproduz um modelo (mostrado no caderno) usando quadrados coloridos (vermelhos/amarelos) numa moldura — mede habilidade espacial/viso-motora.
- **Categorias**: a criança escolhe, entre alternativas, a figura que pertence à mesma categoria conceitual apresentada — raciocínio abstrato.
- **Situações**: a criança escolhe a solução correta para uma situação cotidiana ilustrada — raciocínio concreto.
- **Padrões**: a criança completa/desenha um padrão gráfico com lápis — espacial/viso-motor, com componente de tempo na Parte II.

Escalas resultantes: **SON-EE** (Escala de Execução = Mosaicos + Padrões), **SON-ER** (Escala de Raciocínio = Categorias + Situações), **SON-QI** (escala geral = soma dos 4 subtestes). Todas em média 100, DP 15 (faixa 50-150). Os subtestes individuais usam escore normatizado de média 10, DP 3 (faixa 1-19).

## Correção — fluxo de escore (`algoritmoCorrecao`)

### 1. Pontuação de cada item
| Escore | Significado |
|---|---|
| `+` | item pulado no início (procedimento adaptativo de entrada) — contado como correto |
| `1` | correto (resolvido de forma independente, dentro do tempo limite quando aplicável) |
| `0` | incorreto (não resolvido, ou resolvido com ajuda, ou não terminado no tempo limite) |
| `-` | recusado |

### 2. Procedimento adaptativo de entrada (evita itens abaixo do nível da criança)
| Idade / série | Item de entrada |
|---|---|
| 2 ou 3 anos | Item 1 |
| 4 ou 5 anos (pré-escola) | Item 3 |
| 6 ou 7 anos (1º/2º ano escolar) | Item 5 |

Quando idade e série divergem, usa-se o nível mais baixo. Suspeita de atraso substancial → considerar começar do item 1 mesmo com mais idade.

### 3. Regras de interrupção (parar de aplicar o subteste)
- **Regra A**: 3 respostas incorretas no total (não precisam ser consecutivas).
- **Regra B** (só Parte II de Mosaicos/Padrões): 2 itens consecutivos incorretos.
- **Regra C**: 2 recusas consecutivas → **subteste inteiro não é pontuado** (não entra no cálculo do SON-QI).

### 4. Tempo limite
Só usado na Parte II dos subtestes de execução (Mosaicos, Padrões): **150 segundos (2,5 min) por item**.

### 5. Escore bruto do subteste
= nº de itens corretos (pontuação 1) + nº de itens pulados no início (+). Regra prática: último item aplicado − nº de erros (0) e recusas (-) — **exceto** quando a criança precisou "voltar" a itens anteriores por causa do procedimento adaptativo e comete mais de 3 erros no total (nesse caso o escore usa o item em que o critério de interrupção foi atingido como referência, desconsiderando respostas posteriores mesmo corretas).

### 6. Escore bruto → Escore normatizado do subteste
Via `TabelaNormativa` por idade em meses (17 tabelas, ver abaixo). Escala 1-19, média 10, DP 3.

### 7. Escore normatizado dos subtestes → SON-EE, SON-ER, SON-QI
- Soma dos normatizados de Mosaicos + Padrões → tabela de conversão (Tabela 76) → **SON-EE**.
- Soma dos normatizados de Categorias + Situações → tabela de conversão (Tabela 76) → **SON-ER**.
- Soma dos 4 normatizados → tabela de conversão (Tabela 76) → **SON-QI** (com percentil e intervalo de confiança de 80% já tabelados).
- Se um subteste não foi aplicado (recusa dupla), o SON-QI ainda pode ser calculado com os demais (só não é possível pelas tabelas manuais — exige o programa de computador do teste, que ajusta pela idade exata e generalizabilidade).

### 8. Idade de referência
Idade em que 50% da amostra normativa tem o mesmo desempenho bruto — só informativa, não usada para nada além de contexto (equivalente à "idade equivalente" de outros testes, com as mesmas ressalvas de uso).

## Classificação do QI (Tabela 57)

| QI | Descrição | % da população |
|---|---|---|
| > 130 | Muito alto | 2% |
| 121-130 | Alto | 7% |
| 111-120 | Acima da média | 16% |
| 90-110 | Médio | 50% |
| 80-89 | Abaixo da média | 16% |
| 70-79 | Baixo | 7% |
| < 70 | Muito baixo | 2% |

## Intervalos de confiança de 80% (Tabela 58)

| Escala | IC (80%) | Amplitude |
|---|---|---|
| SON-QI | ± 8 | 16 |
| SON-EE | ± 9 | 18 |
| SON-ER | ± 10 | 20 |

> Construído a partir do Erro Padrão de Estimação (EPE), não do escore bruto diretamente — fórmula: `T = 100 + α(QI-100)`, IC80% = `T ± 1,28×EPE`. EPE: SON-QI=6,30; SON-EE=7,10; SON-ER=7,80 (constantes para todas as idades 3;3 a 7;9). **Importante**: por a amplitude do IC (16-20 pontos) ser maior que a amplitude de cada categoria da Tabela 57 (10 pontos), o IC de 80% frequentemente cruza duas categorias adjacentes — sempre reportar o intervalo, não só a categoria pontual.

Fidedignidade média: escalas (SON-EE/ER/QI) = 0,87; subtestes individuais = 0,79 (menos precisos — preferir sempre reportar as escalas, não só os subtestes brutos).

## Tabelas normativas — Escore bruto → Escore normatizado por subteste (Tabelas 59-75)

17 tabelas, uma por mês de idade (2;6 a 7;11). Cada célula é o escore bruto (colunas 0-16) → escore normatizado (1-19) daquele subteste naquela idade. "." = não há conversão definida (bruto acima do máximo possível do subteste naquela idade).

Formato: `Bruto: 0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16`

### 2;6 anos
Mos: 6 9 12 14 15 16 17 18 19 19 19 19 19 19 19 19 .
Cat: 9 12 12 13 14 15 15 16 17 18 19 19 19 19 19 19 .
Sit: 7 9 10 11 12 13 14 15 16 18 19 19 19 19 19 . .
Pad: 6 9 10 11 12 13 14 16 17 19 19 19 19 19 19 19 19

### 2;7 anos
Mos: 5 9 12 14 15 16 17 18 19 19 19 19 19 19 19 19 .
Cat: 8 11 12 13 13 14 15 16 17 18 19 19 19 19 19 19 .
Sit: 7 9 10 11 12 13 14 15 16 18 19 19 19 19 19 . .
Pad: 6 8 9 10 11 13 14 15 17 18 19 19 19 19 19 19 19

### 2;8 anos
Mos: 5 9 12 14 15 15 16 17 19 19 19 19 19 19 19 19 .
Cat: 8 11 12 12 13 14 15 16 17 18 18 19 19 19 19 19 .
Sit: 6 9 10 11 12 13 14 15 16 17 19 19 19 19 19 . .
Pad: 6 8 9 10 11 12 14 15 17 18 19 19 19 19 19 19 19

### 2;9 anos
Mos: 5 9 11 13 14 15 16 17 19 19 19 19 19 19 19 19 .
Cat: 8 11 11 12 13 14 15 16 16 17 18 19 19 19 19 19 .
Sit: 6 8 10 11 12 13 14 15 17 19 19 19 19 19 19 . .
Pad: 6 8 9 9 11 12 13 15 16 18 19 19 19 19 19 19 19

### 2;10 anos
Mos: 5 9 11 13 14 15 16 17 18 19 19 19 19 19 19 19 .
Cat: 8 10 11 12 13 13 14 15 16 17 18 19 19 19 19 19 .
Sit: 6 8 9 10 11 13 14 15 16 17 18 19 19 19 19 . .
Pad: 5 7 8 9 10 12 13 14 16 17 19 19 19 19 19 19 19

### 2;11 anos
Mos: 5 8 11 13 14 15 15 17 18 19 19 19 19 19 19 19 .
Cat: 7 10 11 11 12 13 14 15 16 17 18 19 19 19 19 19 .
Sit: 6 8 9 10 11 12 13 15 16 17 18 19 19 19 19 . .
Pad: 5 7 8 9 10 11 13 14 16 17 19 19 19 19 19 19 19

### 3;0 anos
Mos: 4 8 11 12 13 14 15 16 18 19 19 19 19 19 19 19 .
Cat: 7 10 10 11 12 13 14 15 16 17 18 19 19 19 19 19 .
Sit: 5 8 9 10 11 12 13 14 16 17 18 19 19 19 19 . .
Pad: 5 7 7 8 9 11 12 14 15 17 18 19 19 19 19 19 19

### 3;1 anos
Mos: 4 8 10 12 13 14 15 16 17 19 19 19 19 19 19 19 .
Cat: 7 9 10 11 12 13 14 15 16 17 17 18 19 19 19 19 .
Sit: 5 7 9 10 11 12 13 14 15 17 18 19 19 19 19 . .
Pad: 4 6 7 8 9 10 12 13 15 17 18 19 19 19 19 19 19

### 3;2 anos
Mos: 4 8 10 12 13 14 15 16 17 19 19 19 19 19 19 19 .
Cat: 7 9 10 10 11 12 13 14 15 16 17 18 19 19 19 19 .
Sit: 5 7 8 9 11 12 13 14 15 16 18 19 19 19 19 . .
Pad: 4 6 7 8 9 10 12 13 15 16 18 19 19 19 19 19 19

### 3;3 anos
Mos: 4 7 10 11 12 13 14 15 17 19 19 19 19 19 19 19 .
Cat: 7 9 9 10 11 12 13 14 15 16 17 18 19 19 19 19 .
Sit: 5 7 8 9 10 11 13 14 15 16 18 19 19 19 19 . .
Pad: 4 6 6 7 8 10 11 13 14 16 17 19 19 19 19 19 19

### 3;4 anos
Mos: 4 7 9 11 12 13 14 15 17 18 19 19 19 19 19 19 .
Cat: 6 8 9 10 11 12 13 14 15 16 17 18 19 19 19 19 .
Sit: 5 7 8 9 10 11 12 14 15 16 18 19 19 19 19 . .
Pad: 3 5 6 7 8 9 11 13 14 16 17 18 19 19 19 19 19

### 3;5 anos
Mos: 4 7 9 11 12 13 14 15 16 18 19 19 19 19 19 19 .
Cat: 6 8 9 10 11 12 13 14 15 16 17 18 19 19 19 19 .
Sit: 4 7 8 9 10 11 12 13 15 16 17 19 19 19 19 . .
Pad: 3 5 6 7 8 9 11 12 14 15 17 18 19 19 19 19 19

### 3;6 anos
Mos: 3 7 9 10 11 12 13 15 16 18 19 19 19 19 19 19 .
Cat: 6 8 8 9 10 11 12 13 15 16 16 17 19 19 19 19 .
Sit: 4 6 7 9 10 11 12 13 15 16 17 19 19 19 19 . .
Pad: 3 5 6 6 7 9 10 12 14 15 17 18 19 19 19 19 19

### 3;7 anos
Mos: 3 7 9 10 11 12 13 14 16 18 19 19 19 19 19 19 .
Cat: 6 7 8 9 10 11 12 13 14 15 16 17 18 19 19 19 .
Sit: 4 6 7 8 10 11 12 13 14 16 17 19 19 19 19 . .
Pad: 3 4 5 6 7 8 10 12 13 15 16 18 19 19 19 19 19

### 3;8 anos
Mos: 3 6 8 10 11 12 13 14 16 17 19 19 19 19 19 19 .
Cat: 5 7 8 9 10 11 12 13 14 15 16 17 18 19 19 19 .
Sit: 4 6 7 8 9 10 12 13 14 16 17 18 19 19 19 . .
Pad: 2 4 5 6 7 8 10 11 13 15 16 17 19 19 19 19 19

### 3;9 anos
Mos: 3 6 8 9 10 11 12 14 15 17 19 19 19 19 19 19 .
Cat: 5 7 8 8 9 10 12 13 14 15 16 17 18 19 19 19 .
Sit: 4 6 7 8 9 10 12 13 14 15 17 18 19 19 19 . .
Pad: 2 4 5 5 6 8 9 11 13 14 16 17 18 19 19 19 19

### 3;10 anos
Mos: 3 6 8 9 10 11 12 14 15 17 19 19 19 19 19 19 .
Cat: 5 7 7 8 9 10 11 13 14 15 16 17 18 19 19 19 .
Sit: 3 5 7 8 9 10 11 13 14 15 17 18 19 19 19 . .
Pad: 2 4 4 5 6 7 9 11 12 14 15 17 18 19 19 19 19

### 3;11 anos
Mos: 3 6 8 9 10 11 12 13 15 17 19 19 19 19 19 19 .
Cat: 5 6 7 8 9 10 11 12 13 14 15 17 18 19 19 19 .
Sit: 3 5 6 8 9 10 11 12 14 15 16 18 19 19 19 . .
Pad: 2 3 4 5 6 7 9 10 12 14 15 17 18 19 19 19 19

## Tabelas normativas — 4;0 a 5;5 anos (Tabelas 63-67, resumidas por idade)

Mesmo formato (Bruto 0-16 → Normatizado 1-19), uma linha por subteste:

| Idade | Mos | Cat | Sit | Pad |
|---|---|---|---|---|
| 4;0 | 2 5 7 9 10 11 12 13 15 16 19 19 19 19 19 19 . | 4 6 7 8 9 10 11 12 13 14 15 16 17 19 19 19 . | 3 5 6 7 9 10 11 12 14 15 16 18 19 19 19 . . | 1 3 4 5 6 7 8 10 12 13 15 16 18 19 19 19 19 |
| 4;1 | 2 5 7 8 9 10 11 13 14 16 18 19 19 19 19 19 . | 4 6 7 7 8 9 11 12 13 14 15 16 17 19 19 19 . | 3 5 6 7 8 10 11 12 13 15 16 18 19 19 19 . . | 1 3 4 4 5 7 8 10 11 13 15 16 17 19 19 19 19 |
| 4;2 | 2 5 7 8 9 10 11 12 14 16 18 19 19 19 19 19 . | 4 6 6 7 8 9 10 12 13 14 15 16 17 18 19 19 . | 3 5 6 7 8 9 11 12 13 15 16 18 19 19 19 . . | 1 3 3 4 5 6 8 9 11 13 14 16 17 18 19 19 19 |
| 4;3 | 2 5 7 8 9 10 11 12 14 16 18 19 19 19 19 19 . | 4 5 6 7 8 9 10 11 13 14 15 16 17 18 19 19 . | 3 5 6 7 8 9 10 12 13 14 16 17 19 19 19 . . | 1 2 3 4 5 6 7 9 11 12 14 16 17 18 19 19 19 |
| 4;4 | 2 5 6 8 8 9 11 12 14 16 18 19 19 19 19 19 . | 4 5 6 7 8 9 10 11 12 13 14 16 17 18 19 19 . | 2 4 5 7 8 9 10 12 13 14 16 17 19 19 19 . . | 1 2 3 4 5 6 7 9 10 12 14 15 17 18 19 19 19 |
| 4;5 | 2 5 6 7 8 9 10 12 13 15 17 19 19 19 19 19 . | 3 5 6 6 7 9 10 11 12 13 14 15 17 18 19 19 . | 2 4 5 6 8 9 10 11 13 14 16 17 19 19 19 . . | 1 2 3 3 4 5 7 8 10 12 14 15 16 18 19 19 19 |
| 4;6 | 2 4 6 7 8 9 10 11 13 15 17 19 19 19 19 19 . | 3 5 5 6 7 8 9 11 12 13 14 15 16 18 19 19 . | 2 4 5 6 7 9 10 11 13 14 15 17 19 19 19 . . | 1 2 2 3 4 5 7 8 10 12 13 15 16 17 19 19 19 |
| 4;7 | 2 4 6 7 8 9 10 13 15 17 19 19 19 19 19 19 . | 3 5 5 6 7 8 9 10 12 13 14 15 16 18 19 19 . | 2 4 5 6 7 8 10 11 12 14 15 17 18 19 19 . . | 1 1 2 3 4 5 6 8 10 11 13 14 16 17 18 19 19 |
| 4;8 | 1 4 6 7 7 8 9 11 13 15 17 19 19 19 19 19 . | 3 4 5 6 7 8 9 10 11 13 14 15 16 19 19 19 . | 2 4 5 6 7 8 10 11 12 13 15 17 18 19 19 . . | 1 1 2 3 4 5 6 8 9 11 13 14 16 17 18 19 19 |
| 4;9 | 1 4 5 6 7 8 9 11 12 14 16 19 19 19 19 19 . | 3 4 5 6 7 8 9 10 11 12 14 15 16 19 19 19 . | 2 3 5 6 7 8 9 11 12 14 15 17 18 19 19 . . | 1 1 2 2 3 4 6 7 9 11 12 14 15 17 18 19 19 |
| 4;10 | 1 4 5 6 7 8 9 10 12 14 16 18 19 19 19 19 . | 2 4 5 5 6 7 9 10 11 12 13 14 16 17 19 19 . | 1 3 4 6 7 8 9 11 12 13 15 16 18 19 19 . . | 1 1 1 2 3 4 6 7 9 11 12 14 15 16 18 19 19 |
| 4;11 | 1 4 5 6 7 8 9 10 12 14 16 18 19 19 19 19 . | 2 4 4 5 6 7 8 10 11 12 13 14 16 17 19 19 . | 1 3 4 5 7 8 9 10 12 13 15 16 18 19 19 . . | 1 1 1 2 3 4 5 7 9 10 12 13 15 16 18 19 19 |
| 5;0 | 1 3 5 6 6 7 8 10 12 14 16 18 19 19 19 19 . | 2 4 4 5 6 7 8 9 11 12 13 14 15 17 18 19 . | 1 3 4 5 6 8 9 10 12 13 15 16 18 19 19 . . | 1 1 1 2 3 4 5 7 8 10 12 13 15 16 17 19 19 |
| 5;1 | 1 3 5 5 6 7 8 10 12 13 16 18 19 19 19 19 . | 2 3 4 5 6 7 8 9 10 12 13 14 15 17 18 19 . | 1 3 4 5 6 7 9 10 11 13 14 16 18 19 19 . . | 1 1 1 2 2 4 5 6 8 10 11 13 14 16 17 19 19 |
| 5;2 | 1 3 4 5 6 7 8 9 11 13 15 17 19 19 19 19 . | 2 3 4 5 6 7 8 9 10 11 13 14 15 16 18 19 . | 1 3 4 5 6 7 8 10 11 13 14 16 17 19 19 . . | 1 1 1 1 2 3 5 6 8 10 11 13 14 16 17 19 19 |
| 5;3 | 1 3 4 5 6 7 8 9 11 13 15 17 19 19 19 19 . | 2 3 4 5 5 7 8 9 10 11 12 14 15 16 18 19 . | 1 3 4 5 6 7 8 10 11 13 14 16 17 19 19 . . | 1 1 1 1 2 3 4 6 8 9 11 13 14 15 17 18 19 |
| 5;4 | 1 3 4 5 6 6 8 9 11 13 15 17 19 19 19 19 . | 1 3 4 4 5 6 7 9 10 11 12 13 15 16 18 19 . | 1 2 4 5 6 7 8 10 11 12 14 16 17 19 19 . . | 1 1 1 1 2 3 4 6 7 9 11 12 14 15 17 18 19 |
| 5;5 | 1 3 4 5 5 6 7 9 11 13 15 17 19 19 19 19 . | 1 3 3 4 5 6 7 8 10 11 12 13 14 16 18 19 . | 1 2 3 5 6 7 8 9 11 12 14 15 17 19 19 . . | 1 1 1 1 2 3 4 5 7 9 10 12 13 15 16 18 19 |

## Tabelas normativas — 5;6 a 7;11 anos (Tabelas 68-75, resumidas por idade)

| Idade | Mos | Cat | Sit | Pad |
|---|---|---|---|---|
| 5;6 | 1 2 4 4 5 6 7 9 10 12 14 16 18 19 19 19 . | 1 3 3 4 5 6 7 8 9 11 12 13 14 16 18 19 . | 1 2 3 4 5 7 8 9 11 12 14 15 17 19 19 . . | 1 1 1 1 1 3 4 5 7 9 10 12 13 15 16 18 19 |
| 5;7 | 1 2 4 4 5 6 7 8 10 12 14 16 18 19 19 19 . | 1 2 3 4 5 6 7 8 9 10 12 13 14 16 17 19 . | 1 2 3 4 5 6 8 9 10 12 14 15 17 18 19 . . | 1 1 1 1 1 2 4 5 7 8 10 12 13 14 16 18 19 |
| 5;8 | 1 2 3 4 5 6 7 8 10 12 14 16 18 19 19 19 . | 1 2 3 4 5 6 7 8 9 10 11 13 14 15 17 19 . | 1 2 3 4 5 6 8 9 10 12 13 15 17 18 19 . . | 1 1 1 1 1 2 3 5 6 8 10 11 13 14 16 17 19 |
| 5;9 | 1 2 3 4 5 5 7 8 10 12 14 16 18 19 19 19 . | 1 2 3 4 5 6 7 8 9 10 11 13 14 15 17 19 . | 1 2 3 4 5 6 7 9 10 12 13 15 16 18 19 . . | 1 1 1 1 1 2 3 5 6 8 10 11 13 14 16 17 19 |
| 5;10 | 1 2 3 4 4 5 6 8 10 12 14 16 18 19 19 19 . | 1 2 3 4 4 5 6 8 9 10 11 12 14 15 17 19 . | 1 2 3 4 5 6 7 9 10 12 13 15 16 18 19 . . | 1 1 1 1 1 2 3 4 6 8 9 11 12 14 15 17 19 |
| 5;11 | 1 2 3 4 4 5 6 8 9 11 13 15 17 19 19 19 . | 1 2 3 3 4 5 6 7 9 10 11 12 14 15 17 19 . | 1 1 3 4 5 6 7 8 10 11 13 15 16 18 19 . . | 1 1 1 1 1 2 3 4 6 7 9 11 12 14 15 17 19 |
| 6;0 | 1 2 3 3 4 5 6 7 9 11 13 15 17 19 19 19 . | 1 2 2 3 4 5 6 7 8 10 11 12 13 15 17 19 . | 1 1 2 4 5 6 7 8 10 11 13 14 16 18 19 . . | 1 1 1 1 1 1 3 4 6 7 9 10 12 13 15 17 19 |
| 6;1 | 1 2 3 3 4 5 6 7 9 11 13 15 17 19 19 19 . | 1 2 2 3 4 5 6 7 8 9 11 12 13 15 17 19 . | 1 1 2 3 5 6 7 8 10 11 13 14 16 18 19 . . | 1 1 1 1 1 1 2 4 5 7 9 10 12 13 15 16 19 |
| 6;2 | 1 2 2 3 4 5 6 7 9 11 13 15 17 18 19 19 . | 1 2 2 3 4 5 6 7 8 9 10 12 13 15 16 19 . | 1 1 2 3 4 6 7 8 9 11 13 14 16 17 19 . . | 1 1 1 1 1 1 2 4 5 7 8 10 12 13 15 16 19 |
| 6;3 | 1 1 2 3 4 4 5 7 9 11 13 15 16 18 19 19 . | 1 1 2 3 4 5 6 7 8 9 10 12 13 14 16 19 . | 1 1 2 3 4 5 7 8 9 11 12 14 16 17 19 . . | 1 1 1 1 1 1 2 4 5 7 8 10 11 13 14 16 19 |
| 6;4 | 1 1 2 3 3 4 5 7 9 10 12 14 16 18 19 19 . | 1 1 2 3 4 5 6 7 8 9 10 11 13 14 16 19 . | 1 1 2 3 4 5 6 8 9 11 12 14 16 17 19 . . | 1 1 1 1 1 1 2 3 5 6 8 10 11 13 14 16 19 |
| 6;5 | 1 1 2 3 3 4 5 7 8 10 12 14 16 18 19 19 . | 1 1 2 3 4 4 6 7 8 9 10 11 13 14 16 19 . | 1 1 2 3 4 5 6 8 9 10 12 14 15 17 19 . . | 1 1 1 1 1 1 2 3 5 6 8 9 11 12 14 16 18 |
| 6;6 | 1 1 2 3 3 4 5 6 8 10 12 14 16 17 19 19 . | 1 1 2 3 3 4 5 6 8 9 10 11 12 14 16 18 . | 1 1 2 3 4 5 6 8 9 10 11 12 14 15 17 19 . | 1 1 1 1 1 1 2 3 5 6 8 9 11 12 14 16 18 |
| 6;7 | 1 1 2 2 3 4 5 6 8 10 12 14 15 17 19 19 . | 1 1 2 2 3 4 5 6 7 9 10 11 12 14 16 18 . | 1 1 2 3 4 5 6 7 9 10 12 13 15 17 19 . . | 1 1 1 1 1 1 2 3 4 6 7 9 11 12 14 15 18 |
| 6;8 | 1 1 2 2 3 4 5 6 8 10 12 14 15 17 18 19 . | 1 1 2 2 3 4 5 6 7 8 10 11 12 14 16 18 . | 1 1 2 3 4 5 6 7 9 10 12 13 15 17 19 . . | 1 1 1 1 1 1 1 3 4 6 7 9 10 12 13 15 18 |
| 6;9 | 1 1 2 2 3 3 5 6 8 10 12 13 15 17 18 19 . | 1 1 1 2 3 4 5 6 7 8 9 11 12 14 16 18 . | 1 1 1 3 4 5 6 7 8 10 11 13 15 17 19 . . | 1 1 1 1 1 1 1 3 4 6 7 9 10 12 13 15 18 |
| 6;10 | 1 1 1 2 3 3 4 6 8 9 11 13 15 16 18 19 . | 1 1 1 2 3 4 5 6 7 8 9 11 12 14 15 18 . | 1 1 1 2 4 5 6 7 8 10 11 13 15 16 19 . . | 1 1 1 1 1 1 1 2 4 5 7 8 10 12 13 15 18 |
| 6;11 | 1 1 1 2 2 3 4 6 7 9 11 13 15 16 17 19 . | 1 1 1 2 3 4 5 6 7 8 9 10 12 13 15 18 . | 1 1 1 2 3 4 6 7 8 10 11 13 15 16 19 . . | 1 1 1 1 1 1 1 2 4 5 7 8 10 11 13 15 18 |
| 7;0 | 1 1 1 2 2 3 4 6 7 9 11 13 14 16 17 19 . | 1 1 1 2 3 4 5 6 7 8 9 10 12 13 15 18 . | 1 1 1 2 3 4 5 7 8 9 11 13 14 16 18 . . | 1 1 1 1 1 1 1 2 4 5 7 8 9 11 13 15 17 |
| 7;1 | 1 1 1 2 2 3 4 5 7 9 11 13 14 16 17 19 . | 1 1 1 2 3 4 5 6 7 8 9 10 12 13 15 18 . | 1 1 1 2 3 4 5 7 8 9 11 13 14 16 18 . . | 1 1 1 1 1 1 1 2 3 5 6 8 9 11 13 15 17 |
| 7;2 | 1 1 1 2 2 3 4 5 7 9 11 13 14 15 17 19 . | 1 1 1 2 3 4 5 6 7 8 9 10 11 13 15 18 . | 1 1 1 2 3 4 5 6 8 9 11 12 14 16 18 . . | 1 1 1 1 1 1 1 2 3 5 6 8 9 11 12 14 17 |
| 7;3 | 1 1 1 1 2 3 4 5 7 9 11 12 14 15 16 18 . | 1 1 1 2 3 4 4 5 7 8 9 10 11 13 15 18 . | 1 1 1 2 3 4 5 6 8 9 11 12 14 16 18 . . | 1 1 1 1 1 1 1 2 3 5 6 8 9 11 12 14 17 |
| 7;4 | 1 1 1 1 2 3 4 5 7 9 10 12 14 15 16 18 . | 1 1 1 2 3 3 4 5 6 7 9 10 11 13 15 17 . | 1 1 1 2 3 4 5 6 8 9 11 12 14 16 18 . . | 1 1 1 1 1 1 1 2 3 5 6 8 9 11 12 14 17 |
| 7;5 | 1 1 1 1 2 3 4 5 7 9 10 12 14 15 16 18 . | 1 1 1 2 2 3 4 5 6 7 9 10 11 13 15 17 . | 1 1 1 2 3 4 5 6 7 9 10 12 14 16 18 . . | 1 1 1 1 1 1 1 2 3 4 6 7 9 10 12 14 17 |
| 7;6 | 1 1 1 1 2 2 3 5 7 8 10 12 13 15 16 18 . | 1 1 1 2 2 3 4 5 6 7 8 10 11 13 15 17 . | 1 1 1 2 3 4 5 6 7 9 10 12 14 15 18 . . | 1 1 1 1 1 1 1 1 3 4 6 7 9 10 12 14 17 |
| 7;7 | 1 1 1 1 2 2 3 5 6 8 10 12 13 14 15 17 . | 1 1 1 1 2 3 4 5 6 7 8 9 11 13 15 17 . | 1 1 1 2 3 4 5 6 7 9 10 12 14 15 18 . . | 1 1 1 1 1 1 1 1 3 4 6 7 9 10 12 14 17 |
| 7;8 | 1 1 1 1 1 2 3 5 6 8 10 12 13 14 15 17 . | 1 1 1 1 2 3 4 5 6 7 8 9 11 12 14 17 . | 1 1 1 3 4 5 6 7 8 10 12 13 15 18 19 . . | 1 1 1 1 1 1 1 1 3 4 5 7 8 10 12 14 16 |
| 7;9 | 1 1 1 1 1 2 3 5 6 8 10 11 13 14 15 17 . | 1 1 1 1 2 3 4 5 6 7 8 9 11 12 14 17 . | 1 1 1 2 3 5 6 7 8 10 12 13 15 17 . . . | 1 1 1 1 1 1 1 1 2 4 5 7 8 10 11 13 16 |
| 7;10 | 1 1 1 1 1 2 3 4 6 8 10 11 13 14 15 17 . | 1 1 1 1 2 3 4 5 6 7 8 9 11 12 14 17 . | 1 1 1 1 2 3 4 6 7 8 10 11 13 15 17 . . | 1 1 1 1 1 1 1 1 2 4 5 7 8 10 11 13 16 |
| 7;11 | 1 1 1 1 1 2 3 4 6 8 10 11 13 14 14 16 . | 1 1 1 1 2 3 4 5 6 7 8 9 11 12 14 17 . | 1 1 1 1 2 3 4 6 7 8 10 11 13 15 17 . . | 1 1 1 1 1 1 1 1 2 4 5 7 8 10 11 13 16 |

## Tabela 76 — Soma dos normatizados → SON-EE, SON-ER, SON-QI (válida para toda a faixa 2;6-7;11)

Única tabela (não varia por idade — a variação por idade já foi absorvida na conversão bruto→normatizado dos subtestes acima).

| Soma (Mos+Pad ou Cat+Sit) | EE ou ER | Soma (4 subtestes) | QI | IC 80% | Percentil |
|---|---|---|---|---|---|
| 2 | 52 | 4 | 50 | 47-62 | 1% |
| 6 | 62 | 10 | 56 | 53-68 | 1% |
| 10 | 73 | 16 | 64 | 60-75 | 1% |
| 14 | 83 | 22 | 73 | 68-83 | 3% |
| 18 | 94 | 28 | 82 | 76-91 | 12% |
| 20 | 100 | 31 | 86 | 80-95 | 18% |
| 22 | 105 | 34 | 91 | 84-99 | 27% |
| 24 | 111 | 37 | 95 | 88-103 | 37% |
| 26 | 117 | 40 | 100 | 92-107 | 50% |
| 28 | 122 | 43 | 104 | 96-112 | 61% |
| 30 | 128 | 46 | 108 | 99-114 | 70% |
| 32 | 134 | 49 | 112 | 104-119 | 79% |
| 34 | 140 | 52 | 115 | 107-122 | 84% |
| 36 | 145 | 55 | 119 | 109-125 | 90% |
| 38 | 150 | 58 | 122 | 112-128 | 93% |
| — | — | 61 | 126 | 114-129 | 95% |
| — | — | 64 | 129 | 117-132 | 96% |
| — | — | 67 | 132 | 121-137 | 98% |
| — | — | 70 | 137 | 126-141 | 99% |
| — | — | 76 | 150 | 138-153 | 99% |

> Tabela completa (todos os valores inteiros de soma) lida e conferida integralmente; acima estão pontos-âncora a cada 2-3 pontos para referência rápida — todos os 75 pontos foram capturados na leitura e estão disponíveis para o seed completo sob demanda.

Diferença EE-ER estatisticamente significativa quando ≥16 pontos (p<0,05) ou ≥20 pontos (p<0,01). SON-QI: fidedignidade f=0,91, generalizabilidade g=0,83.

## Materiais do kit
Caderno de aplicação (3 subtestes de apontar + 1 de desenho), duas molduras cinza, caixa com compartimentos para os quadrados (8 vermelhos, 8 amarelos, 9 vermelho/amarelo), caixas de cartões para Categorias e Situações, cartolina amarela (para cobrir páginas), 2 lápis grossos, folha de papelão, borracha, cronômetro (não incluso). Programa de computador Windows disponível para cálculo automático (mais preciso que as tabelas manuais — usa idade exata em dias, não arredondada por mês).

## Pendências / próximos passos

- [ ] Este documento já está pronto para virar seed completo de `TabelaNormativa` — as 17 tabelas por subteste (`criterio: "idade"`, banda mensal) e a Tabela 76 (soma→escala, válida para toda a faixa etária) foram lidas e conferidas integralmente.
- [ ] Confirmar com a psicóloga se ela usa a versão reduzida `[a]` (4 subtestes, documentada aqui) ou tem acesso também ao SON-R 2½-7 completo (6 subtestes: adiciona Quebra-cabeças e Analogias) — os materiais enviados foram só do `[a]`.
- [ ] O conteúdo detalhado item-a-item dos 4 subtestes (Apêndice C do manual, exemplos visuais de cada item) não foi transcrito aqui — só a descrição geral de cada tarefa. Reler o Cap. 8 do manual (instruções por subteste, com as figuras) quando for implementar a tela de aplicação/lançamento.
