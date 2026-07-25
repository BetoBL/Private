# ETDAH-PAIS — Escala de Avaliação de Comportamentos Infantojuvenis no TDAH em Ambiente Familiar (Versão para Pais)

> Extraído de material fornecido pela psicóloga (uso legítimo, restrito à clínica). **Não redistribuir o PDF de origem** — só os dados estruturados abaixo.
> Fonte: "ETDAH PAIS E-BOOK 1 (18).pdf" (Benczik, Edyleine Bellini Peroni. *ETDAH-PAIS: Escala de Avaliação de Comportamentos Infantojuvenis no Transtorno de Déficit de Atenção/Hiperatividade em Ambiente Familiar — Versão para Pais: Manual*. São Paulo: Memnon, 2018. ISBN 978-85-7954-136-0. 70 páginas, todas lidas). Normatização e validação brasileira, coleta de dados em 2014.
> Qualidade de digitalização: excelente (PDF gerado digitalmente, texto nítido, sem nenhuma ambiguidade).

## Estrutura do instrumento

Escala de **rastreio** (não substitui avaliação diagnóstica completa) de comportamentos relacionados ao TDAH, respondida pelos **pais/responsáveis** (não pela criança) sobre o comportamento dela em **ambiente familiar**. Público-alvo: crianças e adolescentes de **2 a 17 anos**. Autoaplicável pelos pais (basta que sejam alfabetizados), individual ou coletiva, ~15 minutos.

**58 itens** distribuídos em **4 fatores**:

| Fator | Nome | Nº itens |
|---|---|---|
| 1 | Regulação Emocional (RE) | 19 |
| 2 | Hiperatividade/Impulsividade (HI) | 13 |
| 3 | Comportamento Adaptativo (CA) | 14 |
| 4 | Atenção (A) | 12 |

Escala de resposta Likert de 6 pontos, sobre a frequência do comportamento **nos últimos 6 meses**: Nunca (1), Muito Pouco (2), Pouco (3), Geralmente (4), Frequentemente (5), Muito Frequentemente (6). Nenhum item pode ficar em branco.

## Correção — fórmula (`algoritmoCorrecao`)

Escore bruto de cada fator = **soma simples** dos valores assinalados nos itens daquele fator, **com uma inversão importante**:

> **Todos os itens do Fator 3 (Comportamento Adaptativo) e o item 1 do Fator 4 (Atenção) — "É independente para realizar as suas tarefas de casa" — são de conteúdo positivo (protetivo) e devem ter a pontuação invertida** antes de somar, porque nos demais itens/fatores a pontuação alta sempre indica pior funcionamento (mais prejuízo), e nesses itens específicos o sentido é o oposto.

Tabela de inversão (aplicar só aos itens do Fator 3 e ao item 1 do Fator 4; os demais itens usam a pontuação assinalada diretamente):

| Resposta assinalada | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Pontuação (após inversão) | 6 | 5 | 4 | 3 | 2 | 1 |

Escore Geral = soma dos 4 escores brutos dos fatores (RE + HI + CA + A).

**Regra geral de interpretação: escore alto = pior (mais prejuízo) em todos os fatores e no Escore Geral**, já com a inversão aplicada.

## Percentil e classificação
Consultar a `TabelaNormativa` apropriada (por sexo+faixa etária, ou a amostra geral — ver abaixo) usando o escore bruto de cada fator e o Escore Geral. Classificação (igual em todas as tabelas): 1-20=Inferior, 25-40=Média Inferior, 45-60=Média, 65-80=Média Superior, 85-99=Superior.

## Definição clínica de cada fator (útil para tooltip/prompt de IA)

- **Fator 1 — Regulação Emocional**: capacidade de regular/modular emoções e lidar com frustração. Escore alto = labilidade emocional, temperamento explosivo, hipersensibilidade, humor instável, dificuldade em relacionamentos interpessoais, comportamento opositor. Escore baixo = regulação emocional adequada, estabilidade de humor, empatia.
- **Fator 2 — Hiperatividade/Impulsividade**: inquietação e agitação comportamental, impulsividade. Escore alto = ritmo acelerado, excesso de movimentação, prejuízo no sistema inibitório, comportamento inconsequente/imprudente, rigidez mental (persiste numa ideia, pouca flexibilização). Escore baixo = atividade motora dentro do esperado, autocontrole, prudência, flexibilidade.
- **Fator 3 — Comportamento Adaptativo**: adaptação a regras/normas, hierarquia, habilidades de vida diária. **Único fator com pontuação invertida** (todos os itens são redigidos de forma protetiva). Escore alto (após inversão) = comportamento pouco prudente, dificuldade em compreender regras/situações sociais, imaturidade social, tendência a quebrar regras, prejuízo de automonitoramento. Escore baixo = controle cognitivo, maturidade e julgamento social adequados, responsabilidade, capacidade de seguir regras.
- **Fator 4 — Atenção**: dificuldades atencionais — atenção a detalhes, foco, atenção sustentada, distração, procrastinação, dependência para concluir tarefas de casa. Escore alto = prejuízo em iniciativa, persistência no esforço, memória de trabalho, atenção sustentada; consistente com os sintomas de Desatenção do DSM-5. Escore baixo = boa capacidade atencional, persistência, engajamento, responsabilidade.

## Tabela 29 — Normas para a amostra geral (N=203, sem separar sexo/idade)

| Percentil | Classificação | Escore Geral | Fator 1 (RE) | Fator 2 (HI) | Fator 3 (CA) | Fator 4 (A) |
|---|---|---|---|---|---|---|
| 1 | Inferior | 72 | 20 | 15,04 | 18 | 12 |
| 5 | Inferior | 101 | 25 | 18,2 | 25,2 | 15 |
| 10 | Inferior | 107 | 28,4 | 21 | 32 | 17 |
| 15 | Inferior | 115 | 30 | 23 | 35 | 19 |
| 20 | Inferior | 121 | 31 | 24,8 | 37 | 21 |
| 25 | Média Inferior | 129 | 33 | 26 | 40 | 22 |
| 30 | Média Inferior | 133 | 35 | 27 | 42 | 23 |
| 35 | Média Inferior | 139 | 36,4 | 28 | 44 | 24,4 |
| 40 | Média Inferior | 144 | 38 | 29 | 46 | 26 |
| 45 | Média | 148 | 40 | 30 | 48 | 27 |
| 50 | Média | 153 | 42 | 32 | 49 | 29 |
| 55 | Média | 159 | 45 | 34 | 51,2 | 30 |
| 60 | Média | 166 | 47 | 35 | 53 | 32 |
| 65 | Média Superior | 170 | 49 | 37 | 54 | 34 |
| 70 | Média Superior | 177 | 51 | 40 | 55 | 35 |
| 75 | Média Superior | 187 | 53 | 42 | 57 | 36 |
| 80 | Média Superior | 193 | 56 | 44 | 60 | 39 |
| 85 | Superior | 207 | 61 | 48,8 | 61 | 41 |
| 90 | Superior | 218 | 67,8 | 55,6 | 65 | 45,6 |
| 95 | Superior | 238 | 77,8 | 65,8 | 68,8 | 50,8 |
| 99 | Superior | 266 | 94,68 | 74 | 74 | 64 |
| Média | | 159 | 45,7 | 35,7 | 48,3 | 30,6 |
| Mediana | | 156 | 43,5 | 33 | 48,65 | 29,5 |
| DP | | 47,58 | 18,26 | 15,20 | 14,14 | 12,64 |
| Mín | | 72 | 20 | 15 | 18 | 12 |
| Máx | | 266 | 94,68 | 74 | 74 | 64 |

## Tabelas 30-33 — Normas para o sexo Feminino, por faixa etária

### Tabela 30 — Feminino, 2 a 5 anos
| Percentil | Escore Geral | Fator 1 | Fator 2 | Fator 3 | Fator 4 |
|---|---|---|---|---|---|
| 1 | 106 | 23 | 21 | 20 | 13 |
| 5 | 107 | 23,9 | 21 | 20,7 | 13 |
| 10 | 116 | 32,6 | 21,6 | 29 | 13,4 |
| 15 | 119,3 | 35,3 | 24,3 | 37 | 15,9 |
| 20 | 127,4 | 36 | 25,4 | 37 | 18,8 |
| 25 | 130,5 | 36,5 | 27,5 | 38 | 20 |
| 30 | 133,6 | 38,8 | 29 | 40,2 | 20,6 |
| 35 | 136,8 | 40,7 | 29,7 | 44,5 | 21 |
| 40 | 139,6 | 41,8 | 30,8 | 46 | 23,4 |
| 45 | 151,7 | 44,7 | 32,8 | 46 | 24 |
| 50 | 155 | 47 | 34 | 47 | 25 |
| 55 | 160,4 | 49,4 | 34,1 | 48,1 | 26,2 |
| 60 | 173,8 | 53 | 35,2 | 51 | 28,2 |
| 65 | 180,3 | 53 | 37,8 | 59 | 29,3 |
| 70 | 191,2 | 53 | 42 | 59,8 | 30 |
| 75 | 196,5 | 53,5 | 53,5 | 61 | 31 |
| 80 | 209 | 57,6 | 67,4 | 63,4 | 35,6 |
| 85 | 217 | 62,1 | 72,5 | 66,4 | 48,5 |
| 90 | 244,2 | 65,4 | 74 | 71,8 | 53 |
| 95 | 252,8 | 76,8 | 74 | 78,4 | 53 |
| Média | 162,4 | 46,2 | 39,3 | 48,2 | 27,1 |
| DP | 44,21 | 13,64 | 18,41 | 15,92 | 12,22 |
| Mín/Máx | 106 / 252 | 23 / 76,8 | 21 / 74 | 20 / 78,4 | 13 / 53 |

### Tabela 31 — Feminino, 6 a 9 anos
| Percentil | Escore Geral | Fator 1 | Fator 2 | Fator 3 | Fator 4 |
|---|---|---|---|---|---|
| 1 | 88 | 23 | 18 | 21 | 15 |
| 5 | 95,65 | 24,8 | 18,45 | 22,35 | 16,35 |
| 10 | 107,7 | 29,7 | 19,9 | 26,7 | 18 |
| 15 | 112,8 | 32,05 | 23,7 | 28,35 | 22 |
| 20 | 124,4 | 34,8 | 25 | 29 | 22,8 |
| 25 | 128 | 36,75 | 27 | 34,5 | 24 |
| 30 | 134,5 | 42,5 | 27 | 40,2 | 24 |
| 35 | 137,2 | 44,15 | 27,15 | 43,45 | 26 |
| 40 | 144 | 45 | 29,2 | 47,2 | 26 |
| 45 | 145,55 | 45 | 30 | 49 | 26,05 |
| 50 | 162 | 45,5 | 30,5 | 50,5 | 27 |
| 55 | 169,9 | 46,95 | 32,9 | 54,85 | 27 |
| 60 | 176 | 49,4 | 34 | 55,8 | 29,6 |
| 65 | 185 | 54,7 | 34 | 57 | 32 |
| 70 | 187 | 55 | 43 | 57 | 32,3 |
| 75 | 190,75 | 57,25 | 46,75 | 58,5 | 33 |
| 80 | 192,8 | 61 | 50,6 | 60,2 | 35 |
| 85 | 196 | 65 | 53 | 61 | 35 |
| 90 | 210,6 | 65,6 | 53,3 | 65,3 | 37,2 |
| 95 | 227,55 | 77,05 | 58,75 | 71,3 | 43,4 |
| Média | 155,7 | 46 | 34,11 | 46,6 | 27,5 |
| DP | 39,74 | 14,30 | 12,45 | 15,15 | 7,23 |
| Mín/Máx | 88 / 227,5 | 23 / 77,05 | 18 / 58,7 | 21 / 71,3 | 15 / 43,4 |

### Tabela 32 — Feminino, 10 a 13 anos
| Percentil | Escore Geral | Fator 1 | Fator 2 | Fator 3 | Fator 4 |
|---|---|---|---|---|---|
| 1 | 80 | 20 | 14 | 15 | 12 |
| 5 | 86,6 | 22,2 | 16,2 | 16,65 | 12 |
| 10 | 97,4 | 27,2 | 18,2 | 26,1 | 13,2 |
| 15 | 101 | 29 | 20 | 30,25 | 16,95 |
| 20 | 106 | 30 | 20,2 | 33,2 | 19,4 |
| 25 | 116,5 | 30 | 21,75 | 35,5 | 21 |
| 30 | 122,8 | 36,3 | 22,6 | 38,9 | 21 |
| 35 | 128,7 | 38,7 | 24,85 | 42,7 | 21,85 |
| 40 | 134,8 | 39 | 25 | 43,4 | 23,4 |
| 45 | 139 | 40,9 | 25 | 44 | 24,95 |
| 50 | 142,5 | 41 | 26 | 46,5 | 25 |
| 55 | 145,4 | 43,2 | 27,05 | 49 | 26,2 |
| 60 | 156 | 48,2 | 28,6 | 49,6 | 32,4 |
| 65 | 159,45 | 49 | 29,15 | 53 | 34,15 |
| 70 | 176 | 51,1 | 30 | 53,7 | 35 |
| 75 | 190 | 52,75 | 32 | 55,5 | 37 |
| 80 | 194,6 | 55,8 | 38,2 | 57 | 38,6 |
| 85 | 198,75 | 65,5 | 44,05 | 58,7 | 46,4 |
| 90 | 208,3 | 76,5 | 46,9 | 60 | 52,6 |
| 95 | 238,65 | 83,7 | 57,7 | 70,35 | 59,6 |
| Média | 146 | 44 | 28,3725 | 43,9525 | 28,635 |
| DP | 43,83 | 16,99 | 10,95 | 14,55 | 13,26 |
| Mín/Máx | 80 / 238,6 | 20 / 83,7 | 14 / 57,7 | 15 / 70,3 | 12 / 59,6 |

### Tabela 33 — Feminino, 14 a 17 anos
| Percentil | Escore Geral | Fator 1 | Fator 2 | Fator 3 | Fator 4 |
|---|---|---|---|---|---|
| 1 | 72 | 25 | 16 | 18 | 12 |
| 5 | 72 | 25 | 16 | 18 | 12 |
| 10 | 78,3 | 25 | 16 | 18,7 | 12 |
| 15 | 87,05 | 25,55 | 16,55 | 21,75 | 13,1 |
| 20 | 95,2 | 26,4 | 18,6 | 24,4 | 14 |
| 25 | 102,25 | 27,5 | 21 | 27,5 | 14,75 |
| 30 | 109,2 | 29,4 | 21,1 | 35,1 | 17 |
| 35 | 110,9 | 32,8 | 21,95 | 35,95 | 17 |
| 40 | 111,8 | 33 | 23,6 | 36 | 21 |
| 45 | 115,25 | 33,65 | 24 | 36,65 | 22 |
| 50 | 117 | 35 | 24 | 37,5 | 23 |
| 55 | 118,05 | 36 | 25,75 | 38,7 | 24 |
| 60 | 122 | 36,2 | 29 | 40,2 | 24,4 |
| 65 | 130,8 | 37 | 29,1 | 41,05 | 26,15 |
| 70 | 144,4 | 37 | 30,8 | 41,9 | 28,7 |
| 75 | 147,5 | 37,75 | 32,5 | 45 | 30,5 |
| 80 | 149,2 | 39,2 | 33,6 | 46,6 | 33,4 |
| 85 | 157,2 | 40 | 35,35 | 49,25 | 35,9 |
| 90 | 169,6 | 46,3 | 37,9 | 54,7 | 38,2 |
| Média | 116,3 | 33,04 | 24,88 | 35,10 | 22,06 |
| DP | 28,45 | 6,13 | 6,95 | 10,93 | 8,42 |
| Mín/Máx | 72 / 169,6 | 25 / 46,3 | 16 / 37 | 18 / 54,7 | 12 / 38,2 |

## Tabelas 34-37 — Normas para o sexo Masculino, por faixa etária

### Tabela 34 — Masculino, 2 a 5 anos
| Percentil | Escore Geral | Fator 1 | Fator 2 | Fator 3 | Fator 4 |
|---|---|---|---|---|---|
| 1 | 115 | 30 | 23 | 38 | 19 |
| 5 | 115 | 30 | 23 | 38 | 19 |
| 10 | 115 | 30,8 | 24,6 | 38 | 20,6 |
| 15 | 136,7 | 31 | 25,6 | 44,3 | 21 |
| 20 | 151,4 | 33,4 | 25,6 | 47 | 21 |
| 25 | 156,5 | 37 | 26 | 47,5 | 22,5 |
| 30 | 159,2 | 39 | 28 | 48,8 | 24,4 |
| 35 | 161,3 | 39,3 | 32,5 | 50,6 | 25 |
| 40 | 162,6 | 40 | 36,6 | 52,4 | 25,2 |
| 45 | 165,1 | 40,3 | 39,1 | 54,1 | 26,1 |
| 50 | 166 | 43 | 40 | 55 | 27 |
| 55 | 167,8 | 46,6 | 40,9 | 55 | 29,7 |
| 60 | 168 | 47 | 45 | 55,8 | 31,6 |
| 65 | 169,4 | 48,4 | 46,7 | 56,7 | 32,7 |
| 70 | 171,2 | 49,6 | 47,6 | 57,6 | 33,6 |
| 75 | 174,5 | 50,5 | 50 | 59 | 34,5 |
| 80 | 183 | 52,6 | 52,8 | 61,6 | 35,4 |
| 85 | 196,5 | 55,6 | 54,6 | 64,9 | 36,3 |
| 90 | 211,2 | 57,2 | 58,6 | 67,4 | 37,2 |
| Média | 160,3 | 42,2 | 37,9 | 52,2 | 27,5 |
| DP | 25,61 | 8,83 | 11,84 | 8,63 | 6,21 |
| Mín/Máx | 115 / 211 | 30 / 57 | 23 / 58 | 38 / 67 | 19 / 37 |

### Tabela 35 — Masculino, 6 a 9 anos
| Percentil | Escore Geral | Fator 1 | Fator 2 | Fator 3 | Fator 4 |
|---|---|---|---|---|---|
| 1 | 102 | 22 | 21 | 34 | 15 |
| 5 | 106,2 | 23,75 | 21,7 | 34,35 | 15,7 |
| 10 | 114,7 | 28,4 | 23 | 35 | 17 |
| 15 | 117,6 | 30 | 24,1 | 37 | 18,1 |
| 20 | 129 | 30 | 26 | 38,6 | 20 |
| 25 | 132,75 | 30,75 | 28,25 | 41,75 | 21,5 |
| 30 | 136,7 | 33,3 | 29,1 | 44,1 | 23,7 |
| 35 | 143 | 36,45 | 30 | 46,35 | 30,45 |
| 40 | 145,4 | 37 | 30 | 48 | 31 |
| 45 | 151,15 | 37 | 32,3 | 48,15 | 31,3 |
| 50 | 152,5 | 41 | 34 | 49 | 33,5 |
| 55 | 153,85 | 45 | 34 | 49 | 34 |
| 60 | 165,2 | 45 | 35,4 | 51 | 34,4 |
| 65 | 172,05 | 47,75 | 37,55 | 52,65 | 37,65 |
| 70 | 178,8 | 50,9 | 42,5 | 54 | 39,9 |
| 75 | 203,25 | 54 | 44,25 | 57 | 41 |
| 80 | 214,8 | 61,8 | 46,8 | 60 | 44 |
| 85 | 218,85 | 64,9 | 50,85 | 66,75 | 45,9 |
| 90 | 219,9 | 69 | 61 | 67,3 | 46,6 |
| 95 | 253,85 | 85,9 | 62,95 | 71,25 | 48 |
| Média | 160,6 | 43,7 | 35,7 | 49,3 | 31,4 |
| DP | 42,48 | 16,67 | 12,23 | 11,11 | 10,97 |
| Mín/Máx | 102 / 253,8 | 22 / 85,9 | 21 / 62,9 | 34 / 71,2 | 15 / 48 |

### Tabela 36 — Masculino, 10 a 13 anos
| Percentil | Escore Geral | Fator 1 | Fator 2 | Fator 3 | Fator 4 |
|---|---|---|---|---|---|
| 1 | 104 | 25 | 15 | 27 | 15 |
| 5 | 104,9 | 25 | 21 | 32 | 16,3 |
| 10 | 120,6 | 26,3 | 24,8 | 37,8 | 19,6 |
| 15 | 127,3 | 29,2 | 26,9 | 41 | 21 |
| 20 | 134,2 | 30,9 | 28 | 44,4 | 22,6 |
| 25 | 148 | 32,2 | 28,5 | 46 | 27,5 |
| 30 | 149,8 | 34 | 30 | 49 | 28 |
| 35 | 153,1 | 34,8 | 32 | 51 | 29,1 |
| 40 | 155,6 | 36,1 | 35 | 51,4 | 30 |
| 45 | 163,1 | 39,2 | 35 | 52,7 | 31 |
| 50 | 165 | 42 | 36 | 53 | 36 |
| 55 | 168,5 | 43 | 39,3 | 54 | 36 |
| 60 | 175,6 | 47,6 | 40 | 54,6 | 37,2 |
| 65 | 186,3 | 50 | 41 | 57,7 | 39,9 |
| 70 | 195 | 51 | 41,2 | 59,2 | 42 |
| 75 | 207 | 55,2 | 43,5 | 60 | 42,5 |
| 80 | 222,8 | 60 | 51,2 | 60 | 43 |
| 85 | 235 | 61 | 56,3 | 64 | 49 |
| 90 | 247,8 | 69 | 66,4 | 65,4 | 50,4 |
| 95 | 258,1 | 78 | 68,4 | 70 | 62,2 |
| Média | 171,1 | 45,5 | 38,0 | 51,5 | 33,9 |
| DP | 45,13 | 17,49 | 14,00 | 11,05 | 12,28 |
| Mín/Máx | 104 / 258 | 25 / 86,1 | 15 / 68 | 27 / 70 | 15 / 62,2 |

### Tabela 37 — Masculino, 14 a 17 anos
| Percentil | Escore Geral | Fator 1 | Fator 2 | Fator 3 | Fator 4 |
|---|---|---|---|---|---|
| 1 | 84 | 20 | 16 | 20 | 15 |
| 5 | 84,45 | 20 | 16,1 | 20,6 | 15,05 |
| 10 | 94,6 | 20,5 | 18,2 | 32,2 | 16,1 |
| 15 | 109,15 | 25 | 20,15 | 34 | 17 |
| 20 | 112,4 | 25,8 | 21,2 | 34 | 17,4 |
| 25 | 124 | 29,25 | 23 | 35,25 | 19,75 |
| 30 | 130,3 | 30,3 | 26,3 | 39,3 | 22 |
| 35 | 131 | 31,35 | 27,35 | 41,05 | 23,4 |
| 40 | 132,2 | 32,4 | 28 | 43 | 26 |
| 45 | 136,7 | 33 | 28 | 43 | 26 |
| 50 | 141,5 | 33 | 29,5 | 46,5 | 27 |
| 55 | 143 | 36,3 | 32,65 | 51,1 | 29,1 |
| 60 | 143 | 39,6 | 35,2 | 52,6 | 31,8 |
| 65 | 145,6 | 44,55 | 36 | 53 | 33,65 |
| 70 | 162,4 | 49,8 | 36,7 | 53 | 34 |
| 75 | 173,5 | 52,5 | 37 | 53 | 34 |
| 80 | 188,6 | 55,4 | 38,6 | 53,8 | 36,4 |
| 85 | 192 | 56 | 39,85 | 59,1 | 38,7 |
| 90 | 192 | 71,3 | 41,8 | 60,9 | 40,8 |
| 95 | 235,7 | 108,15 | 42 | 65,75 | 41 |
| Média | 142,8 | 40,7 | 29,7 | 44,6 | 27,2 |
| DP | 39,03 | 21,08 | 8,57 | 12,61 | 8,80 |
| Mín/Máx | 84 / 235,7 | 20 / 108,1 | 16 / 42 | 20 / 65,75 | 15 / 41 |

## Fixture de validação (caso "Caio" do manual, p.62-65 — não é dado real de paciente)

Menino, 10 anos, escola particular, comportamento típico de TDAH combinado. Bom fixture porque exercita a inversão de escore do Fator 3 e cobre um perfil clínico completo:

| Fator | Pontos Brutos | Percentil (masc. 10-13) | Classificação |
|---|---|---|---|
| RE (Fator 1) | 89 | 99 | Superior |
| HI (Fator 2) | 61 | 85 | Superior |
| CA (Fator 3, já invertido) | 60 | 75 | Média Superior |
| A (Fator 4) | 26 | 25 | Média Inferior |
| Escore Geral | 219 | 80 | Média Superior |

## Pendências / próximos passos

- [ ] Este documento já está pronto para virar seed de `TabelaNormativa` — 9 tabelas (`criterio: "sexo+idade"`, 4 faixas etárias × 2 sexos, mais a amostra geral como fallback) e `algoritmoCorrecao` (soma simples com inversão nos itens do Fator 3 + item 1 do Fator 4).
- [ ] O texto completo dos 58 itens (redação exata de cada afirmação) não foi transcrito aqui — só a lógica de fatores/inversão e as definições clínicas. Reler a folha de aplicação (arquivo digital separado, mencionado na Ficha Síntese como não incluso neste manual) quando for implementar a tela de lançamento item-a-item.
- [ ] Confirmar com a psicóloga se ela usa também a versão ETDAH para Professores ou a versão Adolescentes/Adultos (ETDAH-AD, mesma autora) — mencionadas nas referências bibliográficas como instrumentos irmãos, mas não enviadas nesta rodada.
