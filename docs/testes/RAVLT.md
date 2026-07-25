# RAVLT — Teste de Aprendizagem Auditivo-Verbal de Rey

> Extraído de material fornecido pela psicóloga (uso legítimo, restrito à clínica). **Não redistribuir o PDF de origem** — só os dados normativos estruturados abaixo (compilações factuais/números, não texto autoral).
> Fonte: "RAVLT - Manual de Aplicação e Correção COMPLETO 2018.pdf" (Paula, J. J. de; Malloy-Diniz, L. F. *RAVLT: Teste de Aprendizagem Auditivo-Verbal de Rey — Livro de Instruções*. São Paulo: Vetor Editora, 1ª ed., 2018, Coleção RAVLT v.1). 54 páginas, todas lidas.
> Qualidade de digitalização: **boa**, texto nítido e sem ambiguidade em nenhuma tabela. Numeração impressa do livro salta de forma não-linear em relação às páginas físicas do PDF (o volume tem várias páginas de capa/rosto/agradecimentos sem numeração impressa) — não afeta a leitura dos dados, só o índice de páginas.
> Este manual é só o **Volume 1 (Livro de instruções)** — não inclui a folha de aplicação com as palavras reais das Listas A/B e dos distratores (ver Pendências).

## Estrutura do instrumento

Teste de memória episódica verbal por repetição de lista de palavras. Público-alvo: 6 a 92 anos, aplicação individual, ~30-45 min (mais um intervalo de ~20 min sem tarefas verbais entre a etapa A6 e a A7).

Sequência de aplicação:
1. **A1–A5**: a mesma Lista A (15 substantivos dissílabos concretos de alta frequência, critério Pinheiro 1994) é lida em voz alta 5 vezes seguidas; após cada leitura, evocação livre imediata (tentativas A1 a A5).
2. **B1**: uma Lista B de interferência (também 15 substantivos, mesmo critério de construção) é lida uma vez, seguida de evocação livre (tentativa B1).
3. **A6**: logo após B1, sem reapresentação da Lista A, pede-se evocação livre da Lista A (evocação imediata pós-interferência).
4. **A7**: após um intervalo de ~20 minutos preenchido com outras atividades (não verbais), pede-se evocação livre da Lista A novamente, sem relê-la (evocação tardia).
5. **Reconhecimento**: lê-se uma lista de 50 palavras (15 da Lista A + 15 da Lista B + 20 distratores) e o sujeito diz "sim"/"não" para cada uma, indicando se pertencia à Lista A.

Os 20 distratores do reconhecimento são classificados como: `SA` (semanticamente semelhante à Lista A), `SB` (semanticamente semelhante à Lista B), `FA` (foneticamente semelhante à Lista A), `FB` (foneticamente semelhante à Lista B) — a folha de aplicação registra cada resposta com esse código, mas a proporção exata entre as 4 categorias não é detalhada no livro de instruções.

Pontuação bruta em cada tentativa (A1–A7, B1) = nº de palavras corretas ditas (repetições não contam, não há penalização por intrusões na pontuação-padrão, mas intrusões/falsos positivos podem ser anotados para análise qualitativa).

## Correção — fórmulas (`algoritmoCorrecao`)

Todas calculadas a partir dos totais brutos de cada tentativa; nenhuma delas depende de tabela normativa para ser calculada (a norma entra só depois, para converter em percentil):

| Índice | Fórmula |
|---|---|
| Reconhecimento | `(acertos entre as 50 palavras: hits na Lista A + rejeições corretas das 35 não-A) − 35` |
| Escore Total | `A1 + A2 + A3 + A4 + A5` |
| ALT (Aprendizagem ao Longo das Tentativas / LOT) | `Escore Total − (5 × A1)` |
| Velocidade de Esquecimento | `A7 / A6` |
| Interferência Proativa | `B1 / A1` |
| Interferência Retroativa | `A6 / A5` |

Notas de leitura da fórmula de Reconhecimento: o "total de distratores" (35) é a soma dos 15 itens da Lista B + 20 distratores puros — ou seja, tudo que **não** é da Lista A. Por isso o escore pode ficar negativo (ex.: sujeito que diz "sim" para tudo tem 15 hits + 0 rejeições corretas − 35 = −20); os valores observados nas tabelas normativas variam de −3 a 15.

Interpretação de cada índice (resumo do Quadro 3 do manual, útil para tooltip/prompt de IA):
- **A1** = memória de curto prazo verbal (capacidade de reter uma exposição única).
- **A2–A5** = curva de aprendizagem (só usadas para compor Escore Total/ALT, não interpretadas isoladamente).
- **B1** = memória de curto prazo para conteúdo novo (mede o mesmo construto que A1, mas serve de base para a Interferência Proativa).
- **A6** = evocação imediata pós-interferência (memória de curto prazo episódica, "quanto sobrou" logo após a lista B).
- **A7** = evocação tardia (memória de longo prazo episódica, após ~20min).
- **Reconhecimento** = mais sensível a déficit de recuperação vs. codificação: se o desempenho na evocação livre é ruim mas o reconhecimento é bom, o problema é de recuperação (não de armazenamento); se ambos são ruins, o déficit é de armazenamento.
- **Escore Total / ALT** = medidas globais de aprendizagem (quanto maior, melhor).
- **Velocidade de Esquecimento** (A7/A6), quanto **menor**, mais esquecimento entre curto e longo prazo — útil no rastreio de quadros demenciais (Alzheimer).
- **Interferência Proativa** (B1/A1): escores mais altos = conteúdo aprendido antes facilita o aprendizado do novo (bom sinal).
- **Interferência Retroativa** (A6/A5): escores mais baixos = o novo conteúdo (Lista B) prejudicou mais a recuperação do conteúdo antigo (Lista A).

## Guia de interpretação dos percentis (Tabela 1, aplica-se a qualquer medida do RAVLT)

| Percentil | Interpretação geral | Interpretação clínica |
|---|---|---|
| < 5 | Desempenho inferior | Déficit clínico |
| 5–25 | Desempenho médio inferior | Possível déficit |
| 25–50 | Desempenho médio | Típico |
| 50–75 | Desempenho médio | Típico |
| 75–95 | Desempenho médio superior | Típico |
| > 95 | Desempenho superior | Típico |

> O manual reforça que não há guia consensual de nomenclatura entre autores — esta é só a sugestão adotada neste manual. Também recomenda, opcionalmente, o **Escore Z** = `(valor do paciente − média da faixa etária) / DP da faixa etária`, usando média/DP das tabelas abaixo.

## Efeito de sexo e escolaridade (relevante para decidir critério da `TabelaNormativa`)

- **Sexo**: efeito desprezível (r² ≤ 1% em todas as variáveis, Tabela 13, n=1458) → a norma **não é estratificada por sexo** (`criterio: "idade"` apenas, sem sexo).
- **Escolaridade** (só analisada em adultos, por causa da colinearidade forte idade×escolaridade em crianças/adolescentes, r=0,904): efeito moderado em algumas etapas (Tabela 14, n=1148) — o manual menciona que "uma segunda correção (idade × escolaridade) foi realizada em algumas faixas etárias específicas", mas **não especifica quais faixas nem os valores dessa correção** nas páginas de dados normativos (Tabelas 15–26 abaixo trazem só o critério de idade). Ver pendência.

## Tabelas normativas (Tabelas 15–26) — percentil por faixa etária

Cada tabela traz, para os percentis 5/25/50/75/95 + Média + DP: `A1 A2 A3 A4 A5 B1 A6 A7 Reconhecimento EscoreTotal ALT VelocidadeEsquecimento InterferênciaProativa InterferênciaRetroativa`. N total da amostra = 1.458 (5 macrorregiões brasileiras).

### Tabela 15 — 6 a 8 anos (n=96)

| Percentil | A1 | A2 | A3 | A4 | A5 | B1 | A6 | A7 | Reconh. | Escore Total | ALT | Vel.Esquec. | Interf.Proativa | Interf.Retroativa |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5 | 2 | 3 | 4 | 4 | 4 | 2 | 3 | 3 | -2 | 19 | -4 | 0,67 | 0,50 | 0,50 |
| 25 | 3 | 5 | 5 | 6 | 7 | 3 | 5 | 6 | 8 | 26 | 6 | 0,89 | 0,75 | 0,71 |
| 50 | 4 | 6 | 7 | 8 | 8 | 4 | 7 | 7 | 10 | 33 | 12 | 1,00 | 1,00 | 0,88 |
| 75 | 5 | 7 | 9 | 10 | 10 | 5 | 8 | 9 | 15 | 40 | 16 | 1,20 | 1,29 | 1,00 |
| 95 | 8 | 10 | 12 | 13 | 13 | 7 | 13 | 13 | 15 | 52 | 23 | 1,75 | 2,00 | 1,25 |
| Média | 4,5 | 6,0 | 7,0 | 7,9 | 8,4 | 4,3 | 7,2 | 7,6 | 10,3 | 33,7 | 11,2 | 1,09 | 1,09 | 0,87 |
| DP | 1,9 | 2,1 | 2,5 | 2,8 | 2,8 | 1,6 | 2,7 | 2,7 | 6,9 | 9,9 | 8,2 | 0,37 | 0,55 | 0,24 |

### Tabela 16 — 9 a 11 anos (n=119)

| Percentil | A1 | A2 | A3 | A4 | A5 | B1 | A6 | A7 | Reconh. | Escore Total | ALT | Vel.Esquec. | Interf.Proativa | Interf.Retroativa |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5 | 3 | 4 | 3 | 4 | 5 | 3 | 4 | 4 | 2 | 24 | -1 | 0,75 | 0,50 | 0,56 |
| 25 | 4 | 6 | 6 | 8 | 8 | 4 | 7 | 7 | 11 | 32 | 8 | 0,90 | 0,71 | 0,73 |
| 50 | 5 | 7 | 9 | 9 | 10 | 5 | 9 | 9 | 14 | 40 | 13 | 1,00 | 0,86 | 0,85 |
| 75 | 7 | 9 | 11 | 11 | 12 | 6 | 11 | 11 | 15 | 46 | 19 | 1,11 | 1,20 | 1,00 |
| 95 | 8 | 11 | 13 | 14 | 14 | 8 | 12 | 13 | 15 | 58 | 26 | 1,33 | 2,00 | 1,38 |
| Média | 5,4 | 7,1 | 8,2 | 9,2 | 10,0 | 5,0 | 8,7 | 8,7 | 11,7 | 39,9 | 12,8 | 1,03 | 1,00 | 0,91 |
| DP | 1,8 | 2,2 | 2,8 | 2,8 | 2,7 | 1,5 | 2,7 | 2,7 | 5,5 | 10,1 | 8,1 | 0,25 | 0,46 | 0,38 |

### Tabela 17 — 12 a 14 anos (n=55)

| Percentil | A1 | A2 | A3 | A4 | A5 | B1 | A6 | A7 | Reconh. | Escore Total | ALT | Vel.Esquec. | Interf.Proativa | Interf.Retroativa |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5 | 4 | 4 | 4 | 3 | 6 | 3 | 5 | 5 | 0 | 28 | -2 | 0,60 | 0,50 | 0,60 |
| 25 | 5 | 6 | 7 | 9 | 10 | 4 | 9 | 7 | 12 | 39 | 7 | 0,89 | 0,73 | 0,80 |
| 50 | 6 | 8 | 10 | 10 | 11 | 6 | 10 | 10 | 15 | 46 | 13 | 1,00 | 0,88 | 0,90 |
| 75 | 8 | 10 | 12 | 12 | 13 | 7 | 11 | 12 | 15 | 51 | 20 | 1,11 | 1,13 | 1,00 |
| 95 | 9 | 12 | 14 | 15 | 14 | 9 | 13 | 14 | 15 | 59 | 25 | 1,40 | 1,50 | 1,22 |
| Média | 6,3 | 8,1 | 9,5 | 10,0 | 10,9 | 5,6 | 9,6 | 9,6 | 12,5 | 44,8 | 13,3 | 1,01 | 0,92 | 0,91 |
| DP | 1,7 | 2,6 | 2,9 | 2,7 | 2,5 | 1,7 | 2,2 | 3,0 | 5,0 | 9,6 | 7,8 | 0,29 | 0,28 | 0,29 |

### Tabela 18 — 15 a 17 anos (n=40)

| Percentil | A1 | A2 | A3 | A4 | A5 | B1 | A6 | A7 | Reconh. | Escore Total | ALT | Vel.Esquec. | Interf.Proativa | Interf.Retroativa |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5 | 4 | 4 | 4 | 6 | 7 | 3 | 5 | 6 | 4 | 34 | 2 | 0,79 | 0,54 | 0,64 |
| 25 | 5 | 7 | 8 | 10 | 10 | 4 | 9 | 9 | 11 | 41 | 13 | 0,90 | 0,69 | 0,82 |
| 50 | 6 | 8 | 10 | 11 | 11 | 5 | 10 | 11 | 13 | 46 | 17 | 1,00 | 0,86 | 0,93 |
| 75 | 7 | 9 | 11 | 13 | 14 | 6 | 13 | 12 | 15 | 53 | 21 | 1,11 | 1,06 | 1,00 |
| 95 | 8 | 11 | 13 | 14 | 14 | 9 | 14 | 14 | 15 | 58 | 26 | 1,35 | 1,42 | 1,23 |
| Média | 6,1 | 8,1 | 9,6 | 11,1 | 11,6 | 5,4 | 10,6 | 10,5 | 12,6 | 46,4 | 16,1 | 1,01 | 0,91 | 0,93 |
| DP | 1,4 | 2,2 | 2,4 | 2,4 | 2,3 | 1,7 | 2,5 | 2,9 | 3,1 | 8,6 | 7,3 | 0,25 | 0,27 | 0,17 |

### Tabela 19 — 18 a 20 anos (n=157)

| Percentil | A1 | A2 | A3 | A4 | A5 | B1 | A6 | A7 | Reconh. | Escore Total | ALT | Vel.Esquec. | Interf.Proativa | Interf.Retroativa |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5 | 4 | 6 | 8 | 8 | 8 | 4 | 6 | 6 | -1 | 36 | 6 | 0,75 | 0,56 | 0,63 |
| 25 | 6 | 8 | 10 | 10 | 11 | 5 | 9 | 9 | 5 | 46 | 12 | 0,91 | 0,73 | 0,82 |
| 50 | 7 | 9 | 11 | 12 | 12 | 6 | 12 | 11 | 13 | 52 | 18 | 1,00 | 0,89 | 0,92 |
| 75 | 8 | 11 | 13 | 14 | 14 | 7 | 13 | 13 | 15 | 58 | 22 | 1,10 | 1,10 | 1,00 |
| 95 | 10 | 13 | 14 | 15 | 15 | 9 | 15 | 15 | 15 | 65 | 29 | 1,33 | 1,50 | 1,18 |
| Média | 6,8 | 9,5 | 11,0 | 11,8 | 12,2 | 6,3 | 11,1 | 11,0 | 10,0 | 51,4 | 17,3 | 1,00 | 0,96 | 0,96 |
| DP | 1,7 | 2,2 | 2,2 | 2,4 | 2,4 | 1,8 | 2,5 | 2,7 | 5,7 | 8,7 | 7,3 | 0,20 | 0,33 | 0,68 |

### Tabela 20 — 21 a 30 anos (n=252)

| Percentil | A1 | A2 | A3 | A4 | A5 | B1 | A6 | A7 | Reconh. | Escore Total | ALT | Vel.Esquec. | Interf.Proativa | Interf.Retroativa |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5 | 4 | 5 | 6 | 7 | 8 | 3 | 6 | 6 | 1 | 34 | 5 | 0,75 | 0,50 | 0,63 |
| 25 | 5 | 7 | 9 | 10 | 11 | 4 | 9 | 9 | 11 | 44 | 13 | 0,91 | 0,68 | 0,80 |
| 50 | 7 | 9 | 11 | 12 | 13 | 6 | 11 | 11 | 13 | 50 | 17 | 1,00 | 0,86 | 0,91 |
| 75 | 8 | 10 | 12 | 13 | 14 | 7 | 13 | 13 | 14 | 56 | 21 | 1,09 | 1,00 | 1,00 |
| 95 | 9 | 12 | 14 | 15 | 15 | 9 | 15 | 15 | 15 | 63 | 27 | 1,33 | 1,50 | 1,10 |
| Média | 6,5 | 8,9 | 10,4 | 11,4 | 12,2 | 5,7 | 10,9 | 10,7 | 11,4 | 49,3 | 16,8 | 1,00 | 0,92 | 0,89 |
| DP | 1,7 | 2,2 | 2,4 | 2,4 | 2,2 | 1,8 | 2,6 | 2,7 | 4,7 | 8,6 | 6,5 | 0,27 | 0,37 | 0,17 |

### Tabela 21 — 31 a 40 anos (n=158)

| Percentil | A1 | A2 | A3 | A4 | A5 | B1 | A6 | A7 | Reconh. | Escore Total | ALT | Vel.Esquec. | Interf.Proativa | Interf.Retroativa |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5 | 4 | 5 | 6 | 7 | 8 | 2 | 6 | 6 | -2 | 35 | 6 | 0,75 | 0,50 | 0,58 |
| 25 | 5 | 7 | 9 | 10 | 11 | 4 | 9 | 9 | 10 | 43 | 14 | 0,86 | 0,67 | 0,80 |
| 50 | 6 | 9 | 10 | 11 | 12 | 5 | 11 | 11 | 13 | 49 | 18 | 0,93 | 0,86 | 0,91 |
| 75 | 7 | 10 | 12 | 13 | 14 | 6 | 12 | 12 | 14 | 54 | 23 | 1,08 | 1,00 | 0,93 |
| 95 | 9 | 12 | 14 | 15 | 15 | 8 | 14 | 14 | 15 | 60 | 29 | 1,29 | 1,50 | 1,18 |
| Média | 6,1 | 8,7 | 10,3 | 11,4 | 12,2 | 5,3 | 10,8 | 10,3 | 11,1 | 48,6 | 17,9 | 0,97 | 0,91 | 0,94 |
| DP | 1,6 | 2,0 | 2,1 | 2,1 | 2,2 | 1,6 | 2,4 | 2,4 | 4,7 | 8,0 | 7,0 | 0,19 | 0,33 | 0,74 |

### Tabela 22 — 41 a 50 anos (n=116)

| Percentil | A1 | A2 | A3 | A4 | A5 | B1 | A6 | A7 | Reconh. | Escore Total | ALT | Vel.Esquec. | Interf.Proativa | Interf.Retroativa |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5 | 4 | 5 | 5 | 6 | 7 | 3 | 5 | 5 | -3 | 29 | 5 | 0,71 | 0,40 | 0,54 |
| 25 | 5 | 7 | 8 | 9 | 10 | 4 | 8 | 7 | 8 | 40 | 12 | 0,85 | 0,67 | 0,73 |
| 50 | 6 | 8 | 11 | 11 | 12 | 5 | 10 | 10 | 12 | 49 | 16 | 1,00 | 0,80 | 0,86 |
| 75 | 7 | 10 | 11 | 14 | 12 | 6 | 11 | 14 | 14 | 53 | 22 | 1,10 | 1,00 | 0,97 |
| 95 | 9 | 12 | 14 | 15 | 15 | 8 | 14 | 14 | 15 | 61 | 27 | 1,38 | 1,50 | 1,13 |
| Média | 6,0 | 8,5 | 9,8 | 10,7 | 11,7 | 4,9 | 9,8 | 9,6 | 9,9 | 46,7 | 16,5 | 1,01 | 0,86 | 0,84 |
| DP | 1,6 | 2,0 | 2,5 | 2,7 | 2,6 | 1,6 | 2,8 | 2,8 | 5,6 | 9,6 | 7,3 | 0,34 | 0,31 | 0,18 |

### Tabela 23 — 51 a 60 anos (n=106)

| Percentil | A1 | A2 | A3 | A4 | A5 | B1 | A6 | A7 | Reconh. | Escore Total | ALT | Vel.Esquec. | Interf.Proativa | Interf.Retroativa |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5 | 3 | 5 | 5 | 7 | 8 | 2 | 5 | 4 | -2 | 31 | 4 | 0,80 | 0,40 | 0,45 |
| 25 | 5 | 6 | 8 | 9 | 10 | 4 | 7 | 8 | 10 | 37 | 12 | 0,90 | 0,63 | 0,67 |
| 50 | 6 | 8 | 10 | 11 | 12 | 5 | 10 | 10 | 13 | 47 | 15 | 1,00 | 0,80 | 0,84 |
| 75 | 7 | 10 | 11 | 12 | 13 | 6 | 12 | 12 | 14 | 53 | 19 | 1,11 | 1,00 | 1,00 |
| 95 | 9 | 12 | 14 | 15 | 15 | 8 | 14 | 14 | 15 | 61 | 26 | 1,38 | 1,40 | 1,08 |
| Média | 6,0 | 8,2 | 9,6 | 10,6 | 11,3 | 4,8 | 9,4 | 9,5 | 10,9 | 45,7 | 15,6 | 1,02 | 0,82 | 0,82 |
| DP | 1,9 | 2,3 | 2,5 | 2,4 | 2,3 | 1,7 | 3,1 | 3,2 | 5,2 | 9,7 | 7,4 | 0,19 | 0,29 | 0,19 |

> Nota de leitura: na linha do percentil 95 desta tabela, a coluna A5 mostra "8" no original — provavelmente erro de digitação do manual (deveria ser um valor ≥14, seguindo a progressão da coluna e comparando com as tabelas vizinhas). **Confirmar com a psicóloga antes de usar esse valor específico em produção**, mesma cautela já registrada para o WAIS-III.

### Tabela 24 — 61 a 70 anos (n=180)

| Percentil | A1 | A2 | A3 | A4 | A5 | B1 | A6 | A7 | Reconh. | Escore Total | ALT | Vel.Esquec. | Interf.Proativa | Interf.Retroativa |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5 | 3 | 5 | 6 | 7 | 8 | 2 | 4 | 5 | 3 | 30 | 6 | 0,78 | 0,50 | 0,55 |
| 25 | 5 | 6 | 8 | 9 | 10 | 4 | 8 | 8 | 9 | 40 | 13 | 0,90 | 0,67 | 0,74 |
| 50 | 5 | 8 | 9 | 10 | 11 | 5 | 10 | 10 | 11 | 44 | 17 | 1,00 | 0,83 | 0,86 |
| 75 | 6 | 9 | 10 | 12 | 13 | 5 | 11 | 11 | 13 | 49 | 20 | 1,10 | 1,00 | 0,93 |
| 95 | 8 | 11 | 12 | 13 | 14 | 7 | 13 | 14 | 15 | 58 | 27 | 1,38 | 1,40 | 1,04 |
| Média | 5,5 | 7,8 | 9,1 | 10,3 | 11,3 | 4,7 | 9,5 | 9,4 | 10,4 | 44,0 | 16,1 | 1,01 | 0,92 | 0,84 |
| DP | 1,6 | 1,9 | 2,0 | 1,9 | 2,0 | 1,4 | 2,6 | 2,6 | 3,8 | 7,6 | 6,1 | 0,24 | 0,61 | 0,16 |

### Tabela 25 — 71 a 79 anos (n=110)

| Percentil | A1 | A2 | A3 | A4 | A5 | B1 | A6 | A7 | Reconh. | Escore Total | ALT | Vel.Esquec. | Interf.Proativa | Interf.Retroativa |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5 | 3 | 5 | 5 | 5 | 7 | 1 | 3 | 4 | 1 | 25 | 4 | 0,25 | 0,46 | 0,73 |
| 25 | 4 | 6 | 7 | 8 | 9 | 3 | 7 | 7 | 6 | 35 | 10 | 0,60 | 0,73 | 0,88 |
| 50 | 5 | 7 | 8 | 9 | 10 | 4 | 8 | 8 | 7 | 39 | 14 | 0,80 | 0,80 | 1,00 |
| 75 | 6 | 8 | 9 | 11 | 12 | 5 | 10 | 9 | 10 | 44 | 18 | 1,00 | 0,91 | 1,11 |
| 95 | 8 | 10 | 11 | 13 | 14 | 7 | 12 | 12 | 14 | 55 | 24 | 1,75 | 1,11 | 1,50 |
| Média | 5,09 | 6,96 | 7,98 | 9,19 | 10,27 | 4,05 | 8,29 | 8,05 | 7,72 | 39,48 | 14,04 | 0,84 | 0,81 | 1,00 |
| DP | 1,46 | 1,74 | 1,99 | 2,30 | 2,16 | 1,75 | 2,37 | 2,39 | 3,99 | 8,23 | 5,70 | 0,39 | 0,19 | 0,29 |

### Tabela 26 — 80 anos ou mais (n=69)

| Percentil | A1 | A2 | A3 | A4 | A5 | B1 | A6 | A7 | Reconh. | Escore Total | ALT | Vel.Esquec. | Interf.Proativa | Interf.Retroativa |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5 | 2 | 4 | 5 | 6 | 7 | 0 | 4 | 4 | -2 | 24 | 5 | 0,64 | 0,00 | 0,45 |
| 25 | 3 | 5 | 6 | 7 | 8 | 2 | 6 | 6 | 3 | 31 | 11 | 0,75 | 0,57 | 0,67 |
| 50 | 4 | 6 | 7 | 8 | 10 | 3 | 8 | 7 | 6 | 34 | 13 | 0,89 | 0,80 | 0,78 |
| 75 | 5 | 7 | 7 | 9 | 11 | 4 | 9 | 8 | 9 | 36 | 17 | 1,00 | 1,00 | 0,89 |
| 95 | 6 | 9 | 10 | 11 | 13 | 6 | 11 | 10 | 14 | 47 | 22 | 1,20 | 1,50 | 1,13 |
| Média | 4,1 | 6,0 | 6,9 | 7,9 | 9,6 | 3,2 | 7,5 | 6,7 | 5,8 | 34,5 | 13,9 | 0,91 | 0,81 | 0,79 |
| DP | 1,4 | 1,5 | 1,7 | 1,6 | 2,1 | 1,7 | 2,2 | 2,0 | 5,4 | 6,3 | 5,5 | 0,23 | 0,41 | 0,22 |

## Fixture de validação (caso clínico do manual, p.58 — não é dado real de paciente)

"L.T.M.", masculino, 69 anos, nível escolar médio, hipótese de transtorno neurocognitivo maior (Alzheimer). Bom fixture porque cobre déficit consistente em quase todas as medidas, incluindo o índice de reconhecimento não compensando a evocação livre ruim (padrão típico de déficit de armazenamento, não só de recuperação):

| RAVLT | Pontuação | Percentil (norma 61-70 anos) |
|---|---|---|
| A1 | 5 | Entre 25 e 50 |
| A2 | 6 | 25 |
| A3 | 6 | 5 |
| A4 | 7 | 5 |
| A5 | 6 | <5 |
| B1 | 5 | Entre 50 e 75 |
| A6 | 4 | 5 |
| A7 | 2 | <5 |
| Reconhecimento | 1 | <5 |
| Escore Total | 30 | 5 |
| ALT | 5 | <5 |

## Pendências / próximos passos

- [ ] **As listas de palavras reais (Lista A, Lista B, 20 distratores com suas categorias SA/SB/FA/FB) não estão neste volume** — este é só o "Livro de instruções" (Volume 1 da Coleção RAVLT); as palavras ficam na Folha de Aplicação (produto separado da Vetor Editora). Preciso obter esse material com a psicóloga antes de codificar a UI de aplicação do teste (ela pode digitar as respostas livremente sem a lista pré-cadastrada, mas isso limita validação/autocomplete).
- [ ] Confirmar com a psicóloga quais faixas etárias específicas recebem o ajuste adicional por escolaridade (o manual menciona que existe, Tabela 14, mas não detalha quais faixas nem os valores da correção nas páginas normativas — as Tabelas 15–26 acima usam só o critério de idade).
- [x] Duas células (Tabela 22 P75: A7; Tabela 23 P95: A5/B1) geraram leituras divergentes entre duas transcrições independentes da tabela fotografada — resolvidas por uma terceira releitura focada; valores acima já corrigidos e conferem com a progressão monotônica esperada em cada coluna.
- [ ] Este documento já está pronto para virar seed de `TabelaNormativa` (`criterio: "idade"`, 12 faixas, sem estratificação por sexo) e de `algoritmoCorrecao` do `Teste` (as 6 fórmulas do quadro acima).
- [ ] O catálogo atual (`apps/api/prisma/seed.ts`) hoje só computa A5+A7 para o RAVLT — [[project_laudo_real_referencia_isadora]] já apontava essa lacuna (o laudo real reporta A1, B1, A6, A7 + curva de aprendizagem separadamente). Este documento fecha a lacuna com os dados normativos reais.
