# BFP — Bateria Fatorial de Personalidade

> Extraído de material fornecido pela psicóloga (uso legítimo, restrito à clínica). **Não redistribuir os PDFs de origem** — só os dados normativos estruturados abaixo, que são compilações factuais (números), não texto autoral.
> Fontes: "Escores percentilísticos_BFP.pdf" (Tabelas 45–59, p.107–121) e "Interpretação BFP.pdf" (p.124–148), ambos de Nunes, Hutz & Nunes — manual técnico da BFP.
> Qualidade de digitalização: **boa** em ambos os arquivos, texto nítido, nenhuma tabela ilegível. Uma inconsistência editorial do próprio manual está sinalizada abaixo (não é erro de leitura).

## Estrutura do instrumento

5 fatores (mapeiam ao Big Five), cada um com 3–4 facetas/subescalas:

| Fator | Sigla | Facetas |
|---|---|---|
| Neuroticismo | N | N1 Vulnerabilidade, N2 Instabilidade emocional, N3 Passividade/Falta de energia, N4 Depressão |
| Extroversão | E | E1 Comunicação, E2 Altivez, E3 Dinamismo, E4 Interações sociais |
| Socialização | S | S1 Amabilidade, S2 Pró-sociabilidade, S3 Confiança nas pessoas |
| Realização | R | R1 Competência, R2 Ponderação/Prudência, R3 Empenho/Comprometimento |
| Abertura | A | A1 Abertura a ideias, A2 Liberalismo, A3 Busca por novidades |

**⚠️ Inconsistência no manual de origem:** a seção de interpretação (p.128, p.140) chama N3 duas vezes de forma diferente — no cabeçalho da seção é "Passividade / Falta de Energia" (usado consistentemente em todo o texto, inclusive comparando com R1), mas um parágrafo isolado na p.133 se refere a "Ansiedade (N3)". Tratamos "Passividade / Falta de Energia" como o nome correto (é o usado no cabeçalho da seção dedicada e reforçado por contraste explícito com R1/Competência), mas vale confirmar com a psicóloga antes de finalizar o catálogo, já que ela pode ter uma versão de manual sem essa errata.

Escore de cada facela/fator = média dos itens (escala Likert 1–7). Percentil é obtido por tabela normativa (abaixo), não por fórmula fechada — a norma é empírica (amostra de padronização), então o motor de cálculo precisa fazer *lookup* na tabela mais próxima (interpolação linear entre pontos percentílicos adjacentes é o método usual para esse tipo de norma).

## Classificação por faixa (Tabela 65, p.125)

Aplica-se ao percentil já calculado, para qualquer fator ou faceta:

| Percentil | Faixa |
|---|---|
| até 14 | Muito Baixo |
| 15–29 | Baixo |
| 30–70 | Médio |
| 71–85 | Alto |
| > 85 | Muito Alto |

## Recomendação metodológica do próprio manual (p.124)

Para uso em **contexto clínico** (nosso caso), o manual recomenda explicitamente avaliar as **facetas/subescalas**, não só o escore geral do fator — o resultado geral pode mascarar combinações distintas de subfatores. Também reforça (múltiplas vezes) que nenhuma faceta deve ser usada como fonte única para diagnóstico. Vale refletir isso na UI do laudo (mostrar sempre facetas, não só os 5 totais) e no prompt de IA (instruir para não tirar conclusão fechada de um único fator).

## Normas — 3 grupos disponíveis

O manual fornece 3 tabelas normativas por fator: **Amostra Geral**, **Sexo Masculino**, **Sexo Feminino**. Isso mapeia direto ao `criterio: "sexo"` do schema (`TabelaNormativa.criterio`), com valores `"geral" | "masculino" | "feminino"`.

Estatísticas descritivas (n válido, média, DP, mín, máx) de cada tabela foram omitidas abaixo por não serem necessárias ao motor de cálculo (só a coluna de percentis é usada para o lookup) — estão preservadas nas imagens capturadas caso precise auditar depois.

### Amostra Geral

| Percentil | N1 | N2 | N3 | N4 | **Neuroticismo** | E1 | E2 | E3 | E4 | **Extroversão** | S1 | S2 | S3 | **Socialização** | R1 | R2 | R3 | **Realização** | A1 | A2 | A3 | **Abertura** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5 | 1,57 | 1,50 | 1,50 | 1,00 | **1,66** | 2,00 | 2,00 | 3,00 | 2,83 | **2,87** | 3,92 | 3,71 | 3,00 | **3,97** | 3,50 | 2,75 | 3,00 | **3,50** | 2,90 | 3,14 | 2,83 | **3,54** |
| 10 | 1,86 | 1,83 | 1,83 | 1,14 | **1,92** | 2,50 | 2,29 | 3,40 | 3,33 | **3,19** | 4,42 | 4,25 | 3,38 | **4,35** | 3,90 | 3,25 | 3,29 | **3,85** | 3,30 | 3,57 | 3,33 | **3,78** |
| 15 | 2,14 | 2,17 | 2,17 | 1,25 | **2,13** | 3,00 | 2,57 | 3,80 | 3,67 | **3,44** | 4,73 | 4,57 | 3,63 | **4,57** | 4,20 | 3,75 | 3,57 | **4,11** | 3,50 | 3,71 | 3,50 | **3,95** |
| 20 | 2,33 | 2,33 | 2,33 | 1,38 | **2,30** | 3,17 | 2,71 | 4,00 | 3,86 | **3,62** | 4,92 | 4,86 | 3,88 | **4,74** | 4,43 | 4,00 | 3,86 | **4,30** | 3,70 | 4,00 | 3,75 | **4,08** |
| 25 | 2,57 | 2,50 | 2,50 | 1,50 | **2,45** | 3,50 | 2,86 | 4,20 | 4,14 | **3,77** | 5,09 | 5,00 | 4,13 | **4,88** | 4,60 | 4,00 | 4,00 | **4,46** | 3,90 | 4,14 | 4,00 | **4,18** |
| 30 | 2,71 | 2,83 | 2,67 | 1,63 | **2,59** | 3,67 | 3,09 | 4,20 | 4,29 | **3,89** | 5,25 | 5,19 | 4,25 | **4,99** | 4,80 | 4,25 | 4,17 | **4,58** | 4,00 | 4,29 | 4,00 | **4,30** |
| 35 | 2,89 | 3,00 | 2,83 | 1,75 | **2,73** | 3,83 | 3,17 | 4,40 | 4,43 | **4,02** | 5,42 | 5,38 | 4,38 | **5,10** | 4,90 | 4,50 | 4,29 | **4,70** | 4,10 | 4,43 | 4,23 | **4,39** |
| 40 | 3,11 | 3,25 | 3,00 | 1,83 | **2,87** | 4,00 | 3,33 | 4,60 | 4,57 | **4,15** | 5,50 | 5,50 | 4,50 | **5,21** | 5,00 | 4,75 | 4,57 | **4,83** | 4,30 | 4,57 | 4,33 | **4,48** |
| 45 | 3,29 | 3,33 | 3,20 | 2,00 | **3,00** | 4,17 | 3,43 | 4,60 | 4,71 | **4,25** | 5,58 | 5,63 | 4,63 | **5,29** | 5,14 | 4,75 | 4,71 | **4,94** | 4,40 | 4,71 | 4,50 | **4,56** |
| 50 | 3,44 | 3,50 | 3,40 | 2,00 | **3,12** | 4,33 | 3,57 | 4,80 | 4,86 | **4,38** | 5,73 | 5,75 | 4,75 | **5,39** | 5,29 | 5,00 | 4,86 | **5,03** | 4,60 | 4,86 | 4,67 | **4,65** |
| 55 | 3,57 | 3,83 | 3,60 | 2,14 | **3,25** | 4,50 | 3,71 | 5,00 | 5,00 | **4,48** | 5,83 | 5,88 | 5,00 | **5,49** | 5,40 | 5,25 | 5,00 | **5,13** | 4,70 | 5,00 | 4,83 | **4,73** |
| 60 | 3,78 | 4,00 | 3,80 | 2,29 | **3,39** | 4,67 | 3,86 | 5,00 | 5,17 | **4,58** | 5,92 | 6,00 | 5,13 | **5,57** | 5,50 | 5,25 | 5,14 | **5,24** | 4,80 | 5,14 | 5,00 | **4,82** |
| 65 | 3,89 | 4,25 | 4,00 | 2,50 | **3,54** | 4,83 | 4,00 | 5,20 | 5,33 | **4,68** | 6,08 | 6,13 | 5,13 | **5,65** | 5,60 | 5,50 | 5,29 | **5,33** | 5,00 | 5,29 | 5,00 | **4,91** |
| 70 | 4,11 | 4,50 | 4,17 | 2,63 | **3,68** | 5,00 | 4,14 | 5,40 | 5,50 | **4,80** | 6,17 | 6,25 | 5,25 | **5,75** | 5,70 | 5,50 | 5,43 | **5,43** | 5,10 | 5,43 | 5,17 | **5,03** |
| 75 | 4,33 | 4,67 | 4,33 | 2,88 | **3,86** | 5,17 | 4,43 | 5,60 | 5,67 | **4,93** | 6,26 | 6,29 | 5,50 | **5,85** | 5,86 | 5,75 | 5,57 | **5,54** | 5,30 | 5,57 | 5,33 | **5,16** |
| 80 | 4,56 | 5,00 | 4,60 | 3,17 | **4,05** | 5,33 | 4,57 | 5,80 | 5,83 | **5,07** | 6,36 | 6,50 | 5,63 | **5,94** | 6,00 | 6,00 | 5,71 | **5,65** | 5,50 | 5,71 | 5,50 | **5,29** |
| 85 | 4,86 | 5,25 | 4,83 | 3,50 | **4,25** | 5,67 | 4,83 | 5,80 | 6,00 | **5,24** | 6,50 | 6,57 | 5,75 | **6,05** | 6,10 | 6,25 | 5,86 | **5,78** | 5,70 | 6,00 | 5,67 | **5,47** |
| 90 | 5,14 | 5,67 | 5,00 | 3,88 | **4,52** | 6,00 | 5,14 | 6,20 | 6,29 | **5,44** | 6,64 | 6,75 | 6,00 | **6,18** | 6,29 | 6,50 | 6,14 | **5,95** | 6,00 | 6,14 | 6,00 | **5,66** |
| 95 | 5,67 | 6,17 | 5,50 | 4,63 | **4,94** | 6,33 | 5,57 | 6,40 | 6,57 | **5,72** | 6,82 | 7,00 | 6,25 | **6,35** | 6,50 | 6,75 | 6,43 | **6,18** | 6,30 | 6,43 | 6,17 | **5,90** |

### Sexo Masculino

| Percentil | N1 | N2 | N3 | N4 | **Neuroticismo** | E1 | E2 | E3 | E4 | **Extroversão** | S1 | S2 | S3 | **Socialização** | R1 | R2 | R3 | **Realização** | A1 | A2 | A3 | **Abertura** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5 | 1,43 | 1,33 | 1,50 | 1,00 | **1,59** | 2,17 | 2,00 | 3,12 | 2,83 | **2,89** | 3,45 | 3,14 | 2,88 | **3,62** | 3,42 | 2,75 | 2,71 | **3,34** | 2,90 | 3,00 | 2,83 | **3,46** |
| 10 | 1,71 | 1,75 | 1,83 | 1,14 | **1,81** | 2,50 | 2,43 | 3,40 | 3,29 | **3,20** | 4,08 | 3,75 | 3,25 | **4,00** | 3,90 | 3,50 | 3,14 | **3,80** | 3,30 | 3,43 | 3,33 | **3,70** |
| 15 | 2,00 | 2,00 | 2,17 | 1,29 | **1,99** | 2,83 | 2,67 | 3,80 | 3,57 | **3,40** | 4,35 | 4,13 | 3,50 | **4,25** | 4,30 | 3,75 | 3,57 | **4,08** | 3,49 | 3,57 | 3,50 | **3,89** |
| 20 | 2,14 | 2,17 | 2,33 | 1,38 | **2,15** | 3,17 | 2,83 | 4,00 | 3,83 | **3,56** | 4,64 | 4,38 | 3,68 | **4,43** | 4,50 | 4,00 | 3,71 | **4,30** | 3,70 | 3,86 | 3,67 | **4,01** |
| 25 | 2,33 | 2,33 | 2,50 | 1,50 | **2,29** | 3,50 | 3,00 | 4,20 | 4,00 | **3,69** | 4,82 | 4,57 | 3,88 | **4,58** | 4,60 | 4,25 | 4,00 | **4,49** | 3,90 | 4,00 | 4,00 | **4,12** |
| 30 | 2,44 | 2,50 | 2,67 | 1,63 | **2,45** | 3,67 | 3,14 | 4,20 | 4,17 | **3,83** | 5,00 | 4,75 | 4,00 | **4,69** | 4,80 | 4,50 | 4,14 | **4,61** | 4,00 | 4,14 | 4,00 | **4,24** |
| 35 | 2,67 | 2,75 | 3,00 | 1,75 | **2,60** | 3,83 | 3,29 | 4,40 | 4,33 | **3,96** | 5,08 | 4,88 | 4,25 | **4,82** | 4,90 | 4,50 | 4,29 | **4,73** | 4,20 | 4,29 | 4,31 | **4,33** |
| 40 | 2,86 | 3,00 | 3,17 | 1,86 | **2,73** | 4,00 | 3,43 | 4,60 | 4,50 | **4,08** | 5,18 | 5,00 | 4,38 | **4,90** | 5,00 | 4,75 | 4,43 | **4,84** | 4,30 | 4,43 | 4,50 | **4,42** |
| 45 | 3,00 | 3,17 | 3,33 | 2,00 | **2,91** | 4,17 | 3,50 | 4,60 | 4,67 | **4,20** | 5,33 | 5,25 | 4,50 | **5,00** | 5,20 | 5,00 | 4,57 | **4,92** | 4,40 | 4,57 | 4,50 | **4,52** |
| 50 | 3,14 | 3,33 | 3,50 | 2,13 | **3,02** | 4,17 | 3,57 | 4,80 | 4,83 | **4,33** | 5,45 | 5,38 | 4,63 | **5,10** | 5,30 | 5,00 | 4,71 | **5,01** | 4,60 | 4,71 | 4,67 | **4,58** |
| 55 | 3,33 | 3,50 | 3,67 | 2,17 | **3,14** | 4,33 | 3,71 | 4,80 | 5,00 | **4,44** | 5,55 | 5,50 | 4,75 | **5,19** | 5,40 | 5,25 | 4,86 | **5,11** | 4,70 | 4,86 | 4,83 | **4,69** |
| 60 | 3,44 | 3,67 | 3,83 | 2,38 | **3,27** | 4,67 | 3,86 | 5,00 | 5,14 | **4,53** | 5,64 | 5,63 | 4,88 | **5,28** | 5,50 | 5,50 | 5,00 | **5,24** | 4,89 | 5,00 | 5,00 | **4,78** |
| 65 | 3,67 | 4,00 | 4,00 | 2,50 | **3,39** | 4,67 | 4,00 | 5,20 | 5,17 | **4,62** | 5,75 | 5,75 | 5,00 | **5,38** | 5,60 | 5,50 | 5,14 | **5,32** | 5,00 | 5,14 | 5,00 | **4,89** |
| 70 | 3,86 | 4,17 | 4,17 | 2,75 | **3,57** | 4,83 | 4,14 | 5,40 | 5,33 | **4,72** | 5,91 | 5,88 | 5,13 | **5,49** | 5,70 | 5,75 | 5,29 | **5,41** | 5,13 | 5,29 | 5,17 | **5,01** |
| 75 | 4,00 | 4,33 | 4,33 | 3,00 | **3,71** | 5,00 | 4,29 | 5,40 | 5,50 | **4,86** | 6,08 | 6,00 | 5,25 | **5,60** | 5,86 | 5,75 | 5,33 | **5,51** | 5,30 | 5,57 | 5,33 | **5,12** |
| 80 | 4,29 | 4,67 | 4,67 | 3,25 | **3,91** | 5,33 | 4,57 | 5,60 | 5,71 | **4,98** | 6,18 | 6,14 | 5,50 | **5,73** | 6,00 | 6,00 | 5,57 | **5,63** | 5,50 | 5,71 | 5,50 | **5,30** |
| 85 | 4,56 | 4,83 | 4,83 | 3,61 | **4,10** | 5,50 | 4,71 | 5,80 | 5,86 | **5,16** | 6,33 | 6,38 | 5,63 | **5,86** | 6,13 | 6,25 | 5,71 | **5,81** | 5,80 | 5,86 | 5,67 | **5,51** |
| 90 | 4,89 | 5,33 | 5,00 | 3,88 | **4,39** | 5,83 | 5,00 | 6,00 | 6,14 | **5,36** | 6,50 | 6,57 | 5,88 | **6,01** | 6,29 | 6,50 | 6,00 | **5,97** | 6,10 | 6,14 | 5,97 | **5,77** |
| 95 | 5,33 | 6,00 | 5,50 | 4,70 | **4,89** | 6,33 | 5,43 | 6,40 | 6,50 | **5,60** | 6,73 | 6,80 | 6,13 | **6,19** | 6,57 | 7,00 | 6,29 | **6,19** | 6,30 | 6,57 | 6,17 | **5,94** |

### Sexo Feminino

| Percentil | N1 | N2 | N3 | N4 | **Neuroticismo** | E1 | E2 | E3 | E4 | **Extroversão** | S1 | S2 | S3 | **Socialização** | R1 | R2 | R3 | **Realização** | A1 | A2 | A3 | **Abertura** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 5 | 1,57 | 1,50 | 1,50 | 1,00 | **1,70** | 2,00 | 2,00 | 3,00 | 2,83 | **2,84** | 4,17 | 4,00 | 3,00 | **4,22** | 3,50 | 2,75 | 3,00 | **3,58** | 2,90 | 3,20 | 2,83 | **3,61** |
| 10 | 2,00 | 2,00 | 1,83 | 1,14 | **1,98** | 2,50 | 2,29 | 3,40 | 3,33 | **3,21** | 4,64 | 4,57 | 3,50 | **4,56** | 3,90 | 3,25 | 3,43 | **3,86** | 3,30 | 3,57 | 3,33 | **3,81** |
| 15 | 2,29 | 2,25 | 2,17 | 1,25 | **2,20** | 3,00 | 2,57 | 3,80 | 3,71 | **3,47** | 4,92 | 4,86 | 3,75 | **4,75** | 4,20 | 3,75 | 3,71 | **4,11** | 3,58 | 3,86 | 3,50 | **3,98** |
| 20 | 2,56 | 2,50 | 2,33 | 1,38 | **2,38** | 3,17 | 2,71 | 4,00 | 4,00 | **3,67** | 5,09 | 5,13 | 4,00 | **4,92** | 4,41 | 4,00 | 3,86 | **4,30** | 3,70 | 4,00 | 3,79 | **4,11** |
| 25 | 2,71 | 2,67 | 2,50 | 1,50 | **2,53** | 3,50 | 2,86 | 4,20 | 4,14 | **3,81** | 5,27 | 5,25 | 4,14 | **5,03** | 4,60 | 4,00 | 4,14 | **4,45** | 3,90 | 4,29 | 4,00 | **4,22** |
| 30 | 2,89 | 3,00 | 2,67 | 1,63 | **2,66** | 3,67 | 3,00 | 4,20 | 4,33 | **3,93** | 5,42 | 5,43 | 4,38 | **5,15** | 4,80 | 4,25 | 4,29 | **4,57** | 4,00 | 4,43 | 4,00 | **4,33** |
| 35 | 3,00 | 3,17 | 2,83 | 1,75 | **2,81** | 3,83 | 3,14 | 4,40 | 4,50 | **4,05** | 5,55 | 5,57 | 4,50 | **5,26** | 4,90 | 4,50 | 4,43 | **4,68** | 4,10 | 4,57 | 4,23 | **4,41** |
| 40 | 3,22 | 3,33 | 3,00 | 1,80 | **2,94** | 4,00 | 3,29 | 4,60 | 4,67 | **4,17** | 5,67 | 5,71 | 4,63 | **5,35** | 5,00 | 4,50 | 4,57 | **4,82** | 4,30 | 4,71 | 4,33 | **4,50** |
| 45 | 3,43 | 3,50 | 3,18 | 2,00 | **3,06** | 4,17 | 3,43 | 4,60 | 4,83 | **4,27** | 5,75 | 5,86 | 4,75 | **5,43** | 5,12 | 4,75 | 4,71 | **4,95** | 4,40 | 4,71 | 4,50 | **4,58** |
| 50 | 3,57 | 3,75 | 3,40 | 2,00 | **3,18** | 4,33 | 3,57 | 4,80 | 5,00 | **4,39** | 5,83 | 5,88 | 4,88 | **5,51** | 5,25 | 5,00 | 4,86 | **5,04** | 4,56 | 4,86 | 4,67 | **4,67** |
| 55 | 3,71 | 4,00 | 3,60 | 2,14 | **3,32** | 4,50 | 3,71 | 5,00 | 5,00 | **4,50** | 5,92 | 6,00 | 5,00 | **5,59** | 5,40 | 5,00 | 5,00 | **5,14** | 4,70 | 5,00 | 4,83 | **4,75** |
| 60 | 3,89 | 4,17 | 3,67 | 2,29 | **3,47** | 4,67 | 3,86 | 5,00 | 5,29 | **4,61** | 6,00 | 6,13 | 5,13 | **5,67** | 5,50 | 5,25 | 5,14 | **5,24** | 4,80 | 5,14 | 5,00 | **4,84** |
| 65 | 4,11 | 4,33 | 4,00 | 2,50 | **3,60** | 4,83 | 4,00 | 5,20 | 5,34 | **4,72** | 6,17 | 6,25 | 5,25 | **5,76** | 5,60 | 5,50 | 5,29 | **5,33** | 4,90 | 5,29 | 5,00 | **4,92** |
| 70 | 4,29 | 4,61 | 4,17 | 2,63 | **3,73** | 5,00 | 4,14 | 5,40 | 5,57 | **4,84** | 6,25 | 6,29 | 5,38 | **5,83** | 5,70 | 5,50 | 5,43 | **5,43** | 5,10 | 5,43 | 5,17 | **5,04** |
| 75 | 4,44 | 4,83 | 4,33 | 2,88 | **3,92** | 5,33 | 4,43 | 5,60 | 5,71 | **4,96** | 6,36 | 6,43 | 5,50 | **5,92** | 5,86 | 5,75 | 5,67 | **5,55** | 5,30 | 5,57 | 5,33 | **5,16** |
| 80 | 4,67 | 5,00 | 4,50 | 3,14 | **4,13** | 5,50 | 4,57 | 5,80 | 5,86 | **5,10** | 6,45 | 6,57 | 5,63 | **6,01** | 5,90 | 6,00 | 5,83 | **5,66** | 5,50 | 5,71 | 5,50 | **5,29** |
| 85 | 5,00 | 5,50 | 4,83 | 3,50 | **4,32** | 5,67 | 4,86 | 6,00 | 6,00 | **5,28** | 6,55 | 6,63 | 5,88 | **6,11** | 6,10 | 6,25 | 6,00 | **5,77** | 5,70 | 6,00 | 5,67 | **5,45** |
| 90 | 5,33 | 5,75 | 5,00 | 4,00 | **4,59** | 6,00 | 5,14 | 6,20 | 6,29 | **5,49** | 6,72 | 6,86 | 6,00 | **6,23** | 6,20 | 6,50 | 6,17 | **5,95** | 5,90 | 6,14 | 6,00 | **5,63** |
| 95 | 5,71 | 6,25 | 5,67 | 4,57 | **4,98** | 6,44 | 5,57 | 6,40 | 6,57 | **5,77** | 6,83 | 7,00 | 6,25 | **6,38** | 6,50 | 6,75 | 6,50 | **6,18** | 6,30 | 6,43 | 6,33 | **5,89** |

## Descrição das facetas (resumo, não é o texto do manual)

Uso: tooltip/ajuda ao lançar resultado, e contexto para o prompt de IA do laudo.

- **N1 Vulnerabilidade** — fragilidade emocional, baixa autoestima, medo de rejeição, dependência de aprovação alheia.
- **N2 Instabilidade emocional** — irritabilidade, oscilação de humor, impulsividade sob desconforto, baixa tolerância à frustração.
- **N3 Passividade/Falta de energia** — procrastinação, dificuldade de iniciar/concluir tarefas, necessidade de estímulo externo.
- **N4 Depressão** — expectativa negativa de futuro, desesperança, sensação de incapacidade diante de dificuldades.
- **E1 Comunicação** — facilidade para falar em público, iniciar conversas, expressar opiniões.
- **E2 Altivez** — autopercepção grandiosa, necessidade de atenção, tendência a se vangloriar.
- **E3 Dinamismo** — iniciativa, envolvimento simultâneo em várias atividades, colocar ideias em prática rapidamente.
- **E4 Interações sociais** — busca ativa por contato social, gregarismo, conforto em grupo.
- **S1 Amabilidade** — atenção e cuidado com as necessidades alheias, empatia.
- **S2 Pró-sociabilidade** — respeito a regras/leis sociais, baixa propensão a comportamento de risco ou manipulação.
- **S3 Confiança nas pessoas** — crença na boa intenção alheia (escore muito alto pode indicar ingenuidade; muito baixo, desconfiança patológica/ciúme).
- **R1 Competência** — autopercepção de capacidade, clareza de objetivos, disposição a sacrifício por metas.
- **R2 Ponderação/Prudência** — reflexão antes de agir/falar, controle de impulsividade não-emocional (diferente de N2).
- **R3 Empenho/Comprometimento** — dedicação, perfeccionismo, revisão cuidadosa antes de entregar trabalho.
- **A1 Abertura a ideias** — curiosidade intelectual, interesse por arte/filosofia/temas abstratos.
- **A2 Liberalismo** — relativização de valores morais/sociais, baixo dogmatismo.
- **A3 Busca por novidades** — preferência por variedade/novidade, baixa tolerância a rotina.

## Caso de validação (do próprio manual, p.146–148)

Usar como fixture de teste do motor de cálculo (não é dado real de paciente — nome fictício "Juliana", 17 anos, sexo feminino):

| Faceta/Fator | Escore bruto | Percentil (norma feminina) | Faixa |
|---|---|---|---|
| N1 Vulnerabilidade | 3,11 | >35 | Médio |
| N2 Instabilidade | 4,50 | >65 | Médio |
| N3 Passividade | 3,00 | 40 | Médio |
| N4 Depressão | 1,75 | 35 | Médio |
| Neuroticismo | 3,09 | >45 | Médio |
| E1 Comunicação | 6,00 | 90 | Muito alto |
| E2 Altivez | 4,57 | 80 | Alto |
| E3 Dinamismo | 6,00 | 85 | Alto |
| E4 Interações sociais | 5,57 | 70 | Médio |
| Extroversão | 5,54 | >90 | Muito alto |
| S1 Amabilidade | 5,17 | >20 | Baixo |
| S2 Pró-sociabilidade | 5,62 | >35 | Médio |
| S3 Confiança nas pessoas | 3,62 | >10 | Muito Baixo |
| Socialização | 4,81 | >15 | Baixo |
| R1 Competência | 5,50 | 60 | Médio |
| R2 Ponderação | 5,00 | 50 | Médio |
| R3 Empenho | 5,86 | >80 | Alto |
| Realização | 5,45 | >70 | Alto |
| A1 Abertura a ideias | 4,60 | >50 | Médio |
| A2 Liberalismo | 4,71 | 45 | Médio |
| A3 Busca por novidades | 4,33 | 40 | Médio |
| Abertura | 4,55 | >40 | Médio |

Bom fixture porque cobre: percentil exato (ex: R2=50), percentil "maior que" um ponto de tabela (ex: N1=">35", quando o bruto cai entre dois pontos percentílicos), e as 5 faixas de classificação todas representadas.

## Pendências / próximos passos

- [ ] Confirmar com a psicóloga o nome correto de N3 (ver inconsistência acima)
- [ ] Definir junto a ela: BFP entra no catálogo fixo (`escopo: FIXO`) e substitui algum placeholder atual?
- [ ] Estruturar `algoritmoCorrecao` do `Teste` (itens → facela, fórmula = média simples 1–7)
- [ ] Seed das 3× `TabelaNormativa` (geral/masculino/feminino) com os dados acima em `conversao` (JSON)
