# ADL2 — Avaliação do Desenvolvimento da Linguagem

> Extraído de material de curso/treinamento fornecido pela psicóloga (uso legítimo, restrito à clínica) — não é o manual oficial da editora, é uma apostila de curso sobre o teste. **Não redistribuir o PDF de origem.**
> Fonte: "CURSO-ADL-2.pdf", apostila/slides de treinamento sobre a ADL2 (Escala de Avaliação do Desenvolvimento da Linguagem), incluindo o questionário HCDC (História Clínica e de Desenvolvimento da Criança), critérios DSM-5 para distúrbio de linguagem, e — ao final da apostila — as tabelas completas de conversão Escore Bruto → Escore Padrão. 67 páginas (slides), todas lidas.
> Qualidade de digitalização: variada — slides de texto nítidos; as tabelas numéricas finais são fotos de página impressa em fonte pequena, legíveis mas mais sujeitas a erro de transcrição que os manuais anteriores (ver nota de confiabilidade ao final).

## Estrutura do instrumento

Escala para avaliar o **desenvolvimento da linguagem** de crianças de **1 ano a 6 anos e 11 meses**. Aplicação individual, fácil aplicação, indicada para profissionais de saúde e educação — mas o manual enfatiza que é indispensável conhecer as etapas de aquisição/desenvolvimento da linguagem verbal e seus distúrbios para interpretar corretamente os resultados.

Duas subescalas:
- **Linguagem Compreensiva (LC)** — até 53 itens (faixa de escore bruto 0–53 na tabela mais avançada).
- **Linguagem Expressiva (LE)** — até 57-58 itens (faixa de escore bruto 0–57).

Complementarmente, o exame inclui o **questionário HCDC** (História Clínica e de Desenvolvimento da Criança) — entrevista estruturada com os pais cobrindo história da gestação, histórico médico, desenvolvimento e comportamento da criança no contexto familiar/escolar; não gera escore, é insumo qualitativo/anamnese.

## Aplicação

- **Ambiente**: sala silenciosa e agradável, mobiliário adequado à idade; crianças muito pequenas (1-2;6 anos) costumam preferir ficar no colo do cuidador ou no chão; a partir de 3 anos, mesa e cadeira.
- **Idade cronológica**: calculada subtraindo a data de nascimento da data do teste (ano/mês). Exemplo do manual: teste em 2018/10, nascimento em 2015/05 → idade cronológica = 3 anos e 5 meses.
- **Vínculo terapêutico**: antes de iniciar, o examinador deve despertar o interesse da criança (conversa, livro/material lúdico) e garantir que ela está confortável com o ambiente/material/examinador.
- **Participação do cuidador (1-2;6 anos)**: nessa faixa é difícil obter respostas sem o cuidador interagindo. Uma resposta pode ser pontuada como correta mesmo sem ter sido observada diretamente pelo examinador, **se o cuidador relatar um exemplo específico daquela habilidade no contexto familiar** — o examinador deve pontuar com base no exemplo relatado.
- **Demais faixas etárias**: se a criança solicitar a presença do cuidador na sala, atender ao pedido.
- **Flexibilidade e pausas**: interrupções (água, banheiro, descanso) são permitidas, mas o examinador deve buscar concluir a aplicação sem interromper o processo sempre que possível. Recomenda-se observar o temperamento da criança antes de começar: crianças tímidas se sentem mais confortáveis apontando respostas → começar pela escala de Linguagem Compreensiva; crianças mais verbais → começar pela Linguagem Expressiva.
- **Item inicial**: começar pela folha de protocolo cuja faixa etária corresponde a **6 meses abaixo** da idade cronológica da criança. Se a criança tiver dificuldade no primeiro item, recuar (sem que ela perceba) para a folha de faixa etária anterior, repetindo até acertar.

## Pontuação de cada item
- **1** = resposta correta
- **0** = resposta incorreta
- **NR** = ausência de resposta

### Basal (início da pontuação)
Determinado separadamente para cada subescala (Compreensiva e Expressiva): **mínimo de 3 respostas corretas consecutivas**. Se a criança não acerta os 3 primeiros itens de uma faixa, o examinador reinicia (discretamente) com itens da faixa etária anterior, repetindo até obter 3 acertos consecutivos.

### Teto (fim da pontuação)
A aplicação de cada subescala é interrompida após **5 erros consecutivos ou ausências de resposta**. O último item respondido corretamente é o teto do teste.

## Correção — fluxo de escore (`algoritmoCorrecao`)

1. **Escore Bruto (EB)** de cada subescala = soma das respostas corretas daquela subescala (Compreensiva e Expressiva calculadas separadamente).
2. **Escore Padrão (EP)** de cada subescala: usar a tabela de conversão da faixa etária cronológica da criança (8 faixas, `3;0–3;5` a `6;6–6;11`, intervalos de 6 meses — ver tabelas abaixo). **Crianças de 1 a 2;11 anos não têm tabela de conversão** (avaliação só qualitativa nessa faixa, ver seção própria abaixo).
3. **Escore Bruto da Linguagem Global** = EP(LC) + EP(LE).
4. **Escore Padrão da Linguagem Global**: usar a tabela de conversão "Linguagem Global" da mesma faixa etária (soma EP(LC)+EP(LE) → EP Global — 8 tabelas próprias, ver abaixo).
5. **Classificação** (Figura 4 do manual, aplica-se ao EP Global, válida para **crianças acima da idade limite da ADL2** — ou seja, quando a criança já passou dos 6;11 mas ainda se quer usar a escala; a tabela também é a referência geral de corte clínico):

| Desenvolvimento da Linguagem | Escore Padrão (EP) | Desvio Padrão (DP) |
|---|---|---|
| Faixa da normalidade | entre EP 115 e EP 85 | menor ou maior que 1 DP |
| Distúrbio leve | entre EP 84 e EP 77 | entre <1,03 DP e <1,53 DP |
| Distúrbio moderado | entre EP 76 e EP 70 | entre <1,6 DP e <2 DP |
| Distúrbio grave | igual ou abaixo de EP 69 | abaixo de 2 DP |

### Exemplo completo de cálculo (Figura 3 do manual)

| | Última tarefa correta | − Total de respostas incorretas | Escore Bruto | Escore Padrão |
|---|---|---|---|---|
| Linguagem Compreensiva | 20 | 0 | 20 | **72** |
| Linguagem Expressiva | 22 | 0 | 22 | **81** |
| Linguagem Global | — | — | 72+81 = **153** | **76** |

Resultado: EP Global 76 → **Distúrbio Moderado** (segundo Figura 4).

## Avaliação qualitativa (1 a 2;11 anos, e 7+ anos)

- **1 a 2;11 anos**: os resultados de LC e LE são **só qualitativos** — não há escore padronizado nessa faixa etária. A idade de desenvolvimento da linguagem é obtida analisando quais habilidades a criança respondeu corretamente, cruzando com a Tabela A2a (Compreensiva) ou A2b (Expressiva) — ver abaixo — que classificam cada item numa categoria linguística (Atenção, Semântica/Conteúdo, Estrutura/Forma, etc).
- **7 anos ou mais**: é possível aplicar a ADL2 quando o desenvolvimento da linguagem parece abaixo da idade cronológica, mas **não é possível usar o escore padronizado** (a tabela normativa vai só até 6;11) — os resultados também se limitam à análise qualitativa via Tabelas A2a/A2b, para identificar déficits específicos e orientar o planejamento terapêutico.

## Tabela A2a — Análise dos itens da Linguagem Compreensiva (classificação de Bloom, 1978/1988)

Cada item mapeado para 1-2 categorias linguísticas (Atenção ao ambiente/pessoas; Semântica: Brincar, Gestos, Vocabulário, Conceito de qualidade/quantidade/espacial/tempo-sequência; Estrutura/Forma: Morfologia, Sintaxe, Inferência, Consciência fonológica). Usado para leitura qualitativa, não para o escore padronizado. Itens 1-16 (1 a 2;11 anos): Atenção visual/auditiva, Vocabulário compreensivo, Compreende pedidos verbais com gestos, Vocabulário receptivo, Compreende ordens com 2 pedidos, Palavras inibitórias, Verbos em contexto, Objetos familiares brincando, Partes do corpo, Relação espacial, Pronomes, Reconhece ação em figuras, Pronomes mim/sua/minha, Uso de objetos, Conceitos de adjetivos. Itens 17-38 (3 a 5;5 anos): relações parte/todo, quantidade, cores, categorias, pronomes pessoais, deduções, conceito de subir, perguntas com "que", perguntas negativas, exclusão/inclusão, conceitos de tempo/adjetivos/espaciais, analogias, pronome relativo "que", velocidade, adjetivo comparativo, orações com adjetivos, sufixos de gênero. Itens 39-52 (5;6 a 6;11 anos): conceitos de adjetivos/relação espacial/classificação semântica/quantidade, relação temporal/sequência, sons iniciais das palavras, sentenças na voz passiva, aliteração, rima, combinação de sons.

## Tabela A2b — Análise dos itens da Linguagem Expressiva (classificação de Bloom, 1978/1988)

Mesma lógica, categorias: Desenvolvimento vocal, Gestos, Comunicação social, Vocabulário, Conceito de qualidade/quantidade/espacial/tempo-sequência, Morfologia, Sintaxe, Inferência. Itens 1-19 (1 a 2;11 anos): brincadeiras com turnos, comunicação gestual, vocalização, sequências de sílabas, vocabulário de 1 palavra, imitação de sons/palavras, vocabulário de 5-10 palavras, combina 2+ palavras, nomeia figuras, indica posse. Itens 20-44 (3 a 5;5 anos): gerúndio, "o que"/"onde"/negação, nomeia cores, combinações de palavras, relação espacial, quantidade, resolve questões cotidianas, descreve ações em sequência de figuras, atividades escolares, uso de objetos, "onde", pronome possessivo, orações semanticamente corretas, plural regular, verbo no passado, completa analogias, categorização de nomes, motivos de ações rotineiras, adjetivos descritivos, similaridade, memória de sentenças, descreve sequência de figuras, responde sobre gravura. Itens 45-58 (5;6 a 6;11 anos): expressa quantidade, busca palavras em categoria semântica, produz história (gravura/sequência de figuras), define palavras, relembra sentenças/situações de rotina, reconta história, cálculo de soma/subtração até 5, identifica e nomeia letras.

## Exemplos de critério de resposta correta/incorreta (amostra — todos os itens têm critério equivalente no protocolo completo)

| Item | Faixa etária | Exemplo de pergunta | Respostas corretas (exemplos) | Respostas incorretas (exemplos) |
|---|---|---|---|---|
| 23 (LE) | 3;0–3;5 | "Este menino, o que ele está fazendo?" | "o menino tá tomando banho"; "ele está tomando banho" | "tá no banheiro"; "molhado" |
| 26 (LE) | 3;6–4;0 | "O que você faz quando está com sono? / mãos sujas? / fome?" | "durmo"/"eu durmo na cama"; "lavo a mão"; "como"/"eu vou almoçar" | "acorda"/"sono"; "limpar"/"suja"; "comida"/"comer" |
| 27 (LE) | 3;6–4;0 | Sequência de figuras (Manual de Figuras p.12) | "tocando a campainha / ele abriu a porta" | "apertou o botão" (verbo no passado em vez de presente contínuo) |
| 33 (LE) | 4;6–5;0 | Produz sentenças semanticamente corretas (fig. p.15) | "machucou a perna porque chutou muito forte, sentou no chão e chamou a mãe dele" | "Não é para jogar futebol, tem que ir para casa" (não-sequitur) |
| 38 (LC) | 5;0–5;5 | "Por que você escova os dentes? / toma banho?" | "porque eu gosto de dentes limpinhos"; "para ficar cheiroso" | "porque sim"; "escovo de manhã" |
| 43/44 (LE) | 5;0–5;5 | Sequência/figura (Manual de Figuras p.23/24) | "molhando a folha"; "triste" | "olhando a árvore"/"não sei"; "feliz"/"em pé" |
| 47 (LE) | 5;6–5;11 | Elabora história a partir de gravura (p.23) | "João foi andar de bicicleta, ele tropeçou e caiu" | "Ele foi andar de bicicleta e andou e caiu" (omite causalidade) |
| 50 (LE) | 6;0–6;5 | Define palavras ("celular", "banana") | "jogar, ver horas e whatsapp"; "uma fruta para comer" | "para carregar um pouco e para mexer nele"; "amarelo por fora e branco por dentro" (descreve em vez de definir função) |
| 52 (LE) | 6;0–6;5 | Produz história com sequência de figuras (p.31) | "O menino tá esperando o sinal parar. Depois ele atravessou..." | "O menino estava na calçada, andou na rua e achou seu amigo" (omite causalidade/sequência lógica) |
| 53 (LE) | 6;6–6;11 | Reconta história com apoio visual (p.32-33) | Reconto com sequência causal completa preservada | Reconto que omite elementos-chave da sequência |
| 54 (LE) | 6;6–6;11 | Descreve rotina (escovar dentes, tomar banho) | Sequência detalhada passo-a-passo | Resposta vaga/incompleta ("passar o sabão, lavar o corpo") |

## Tabelas de conversão Escore Bruto → Escore Padrão, por faixa etária

Formato: `Escore Bruto : Escore Padrão`. Faixas de 6 em 6 meses, de 3;0 a 6;11 (**não há tabela para 1;0–2;11**, ver seção "Avaliação qualitativa" acima).

### 3;0 – 3;5
**Compreensiva**: 0-4:54, 5:56, 6:57, 7:59, 8:61, 9:63, 10:65, 11:66, 12:68, 13:70, 14:72, 15:73, 16:75, 17:77, 18:79, 19:81, 20:82, 21:84, 22:86, 23:88, 24:90, 25:91, 26:93, 27:95, 28:97, 29:99, 30:100, 31:102, 32:104, 33:106, 34:107, 35:109, 36:111, 37:113, 38:115, 39:116, 40:118, 41:120, 42:122, 43:124, 44:125, 45:127, 46:129, 47:131, 48:133, 49:134, 50:136, 51:138, 52:140, 53:141
**Expressiva**: 0-2:54, 3:56, 4:57, 5:59, 6:61, 7:62, 8:64, 9:66, 10:67, 11:69, 12:70, 13:72, 14:74, 15:75, 16:77, 17:78, 18:80, 19:82, 20:83, 21:85, 22:86, 23:88, 24:90, 25:91, 26:93, 27:95, 28:96, 29:98, 30:99, 31:101, 32:103, 33:104, 34:106, 35:107, 36:109, 37:111, 38:112, 39:114, 40:115, 41:117, 42:119, 43:120, 44:122, 45:124, 46:125, 47:127, 48:128, 49:130, 50:132, 51:133, 52:135, 53:136

### 3;6 – 3;11
**Compreensiva**: 0-11:53, 12:55, 13:57, 14:59, 15:61, 16:63, 17:66, 18:68, 19:70, 20:72, 21:74, 22:76, 23:79, 24:81, 25:83, 26:85, 27:87, 28:89, 29:92, 30:94, 31:96, 32:98, 33:100, 34:102, 35:105, 36:107, 37:109, 38:111, 39:113, 40:115, 41:117, 42:120, 43:122, 44:124, 45:126, 46:128, 47:130, 48:133, 49:135, 50:137, 51:139, 52:141, 53:143
**Expressiva**: 0-5:53, 6:55, 7:56, 8:58, 9:60, 10:61, 11:63, 12:64, 13:66, 14:68, 15:69, 16:71, 17:72, 18:74, 19:76, 20:77, 21:79, 22:81, 23:82, 24:84, 25:85, 26:87, 27:89, 28:90, 29:92, 30:94, 31:95, 32:97, 33:98, 34:100, 35:102, 36:103, 37:105, 38:107, 39:108, 40:110, 41:111, 42:113, 43:115, 44:116, 45:118, 46:120, 47:121, 48:123, 49:124, 50:126, 51:128, 52:129, 53:131, 54:132, 55:134, 56:136, 57:137

### 4;0 – 4;5
**Compreensiva**: 0-17:54, 18:56, 19:58, 20:60, 21:62, 22:65, 23:67, 24:69, 25:71, 26:73, 27:76, 28:78, 29:80, 30:82, 31:84, 32:87, 33:89, 34:91, 35:93, 36:95, 37:97, 38:100, 39:102, 40:104, 41:106, 42:108, 43:111, 44:113, 45:115, 46:117, 47:119, 48:122, 49:124, 50:126, 51:128, 52:130, 53:132
**Expressiva**: 0-14:54, 15:56, 16:57, 17:59, 18:61, 19:63, 20:64, 21:66, 22:68, 23:69, 24:71, 25:73, 26:75, 27:76, 28:78, 29:80, 30:81, 31:83, 32:85, 33:87, 34:88, 35:90, 36:92, 37:94, 38:95, 39:97, 40:99, 41:100, 42:102, 43:104, 44:106, 45:107, 46:109, 47:111, 48:113, 49:114, 50:116, 51:118, 52:119, 53:121, 54:123, 55:125, 56:126, 57:128

### 4;6 – 4;11
**Compreensiva**: 0-19:54, 20:56, 21:58, 22:60, 23:62, 24:65, 25:67, 26:69, 27:71, 28:73, 29:76, 30:78, 31:80, 32:82, 33:85, 34:87, 35:89, 36:91, 37:93, 38:96, 39:98, 40:100, 41:102, 42:105, 43:107, 44:109, 45:111, 46:113, 47:116, 48:118, 49:120, 50:122, 51:124, 52:127, 53:129
**Expressiva**: 0-17:54, 18:56, 19:58, 20:59, 21:61, 22:63, 23:64, 24:66, 25:68, 26:69, 27:71, 28:73, 29:75, 30:77, 31:79, 32:80, 33:82, 34:84, 35:86, 36:88, 37:89, 38:91, 39:93, 40:95, 41:96, 42:98, 43:100, 44:102, 45:103, 46:105, 47:107, 48:109, 49:111, 50:112, 51:114, 52:116, 53:118, 54:119, 55:121, 56:123, 57:125

### 5;0 – 5;5
**Compreensiva**: 0-26:54, 27:57, 28:60, 29:63, 30:66, 31:68, 32:71, 33:74, 34:77, 35:80, 36:82, 37:85, 38:88, 39:91, 40:94, 41:96, 42:99, 43:102, 44:105, 45:108, 46:110, 47:113, 48:116, 49:119, 50:122, 51:124, 52:127, 53:130
**Expressiva**: 0-26:53, 27:55, 28:57, 29:59, 30:62, 31:64, 32:66, 33:69, 34:71, 35:73, 36:76, 37:78, 38:80, 39:83, 40:85, 41:87, 42:90, 43:92, 44:94, 45:97, 46:99, 47:101, 48:104, 49:106, 50:108, 51:111, 52:113, 53:115, 54:118, 55:120, 56:122, 57:125

### 5;6 – 5;11
**Compreensiva**: 0-28:52, 29:55, 30:58, 31:61, 32:64, 33:67, 34:70, 35:73, 36:76, 37:79, 38:82, 39:85, 40:88, 41:91, 42:94, 43:96, 44:99, 45:102, 46:105, 47:108, 48:111, 49:114, 50:117, 51:120, 52:123, 53:126
**Expressiva**: 0-26:54, 27:56, 28:58, 29:60, 30:62, 31:64, 32:66, 33:68, 34:71, 35:73, 36:75, 37:77, 38:79, 39:81, 40:83, 41:85, 42:87, 43:90, 44:92, 45:94, 46:96, 47:98, 48:100, 49:102, 50:104, 51:106, 52:109, 53:111, 54:113, 55:115, 56:117, 57:119

### 6;0 – 6;5
**Compreensiva**: 0-28:53, 29:55, 30:58, 31:60, 32:63, 33:65, 34:68, 35:71, 36:73, 37:76, 38:78, 39:81, 40:83, 41:86, 42:88, 43:91, 44:93, 45:96, 46:99, 47:101, 48:104, 49:106, 50:109, 51:111, 52:114, 53:116
**Expressiva**: 0-28:53, 29:55, 30:57, 31:59, 32:62, 33:64, 34:66, 35:68, 36:70, 37:72, 38:74, 39:76, 40:78, 41:80, 42:82, 43:84, 44:86, 45:89, 46:91, 47:93, 48:95, 49:97, 50:99, 51:101, 52:103, 53:105, 54:107, 55:109, 56:111, 57:114

### 6;6 – 6;11
**Compreensiva**: 0-33:52, 34:55, 35:58, 36:61, 37:64, 38:67, 39:70, 40:73, 41:77, 42:80, 43:83, 44:86, 45:89, 46:92, 47:95, 48:99, 49:102, 50:105, 51:108, 52:111, 53:114
**Expressiva**: 0-31:52, 32:54, 33:56, 34:59, 35:61, 36:63, 37:65, 38:67, 39:69, 40:72, 41:74, 42:76, 43:78, 44:80, 45:82, 46:85, 47:87, 48:89, 49:91, 50:93, 51:95, 52:97, 53:100, 54:102, 55:104, 56:106, 57:108

## Tabelas de conversão para o Escore Padrão da Linguagem Global (LC + LE → EP Global)

Formato: `Soma(LC+LE) : Escore Padrão`, faixas de valor contínuas (o manual já agrupa em intervalos, reproduzidos como no original). Mesmas 8 faixas etárias.

### 3;0 – 3;5 (faixa: 0–296+)
0-104:50, 105-106:51, 107-108:52, 109-110:53, 111-112:54, 113-114:55, 115-116:56, 117-118:57, 119:58, 120-121:59, 122-123:60, 124-125:61, 126-127:62, 128-129:63, 130-131:64, 132-133:65, 134-135:66, 136-137:67, 138-139:68, 140-141:69, 142-143:70, 146:72, 147-148:73, 149-150:74, 151-152:75, 153-154:76, 155-156:77, 157-158:78, 159-160:79, 161-162:80, 163-164:81, 165-166:82, 167-168:83, 169-170:84, 171-172:85, 173:86, 174-175:87, 176-177:88, 178-179:89, 180-181:90, 182-183:91, 184-185:92, 186-187:93, 188-189:94, 190-191:95, 192-193:96, 194-195:97, 196-197:98, 198-199:99, 200:100, 201-202:101, 203-204:102, 205-206:103, 207-208:104, 209-210:105, 211-212:106, 213-214:107, 215-216:108, 217-218:109, 219-220:110, 221-222:111, 223-224:112, 225-226:113, 227:114, 228-229:115, 230-231:116, 232-233:117, 234-235:118, 236-237:119, 238-239:120, 240-241:121, 242-243:122, 244-245:123, 246-247:124, 248-249:125, 250-251:126, 252-253:127, 254:128, 255-256:129, 257-258:130, 259-260:131, 261-262:132, 263-264:133, 265-266:134, 267-268:135, 269-270:136, 271-272:137, 273-274:138, 275-276:139, 277-278:140, 279-280:141, 281:142, 282-283:143, 284-285:144, 286-287:145, 288-289:146, 290-291:147, 292-293:148, 294-295:149, ≥296:150

### 3;6 – 3;11
0-103:50, 104-105:51, 106-107:52, 108-109:53, 110-111:54, 112-113:55, 114-115:56, 116-117:57, 118-119:58, 120:59, 121-122:60, 123-124:61, 125-126:62, 127-128:63, 129-130:64, 131-132:65, 133:66, 134-135:67, 136-137:68, 138-139:69, 140-141:70, 142-143:71, 144-145:72, 146-147:73, 148-149:74, 150-151:75, 152-153:76, 154-155:77, 156-157:78, 158-159:79, 160-161:80, 162-163:81, 164-165:82, 166-167:83, 168-169:84, 170-171:85, 172-173:86, 174-176:87 (aprox.), 177-178:88, 179-180:89, 181:90, 182-183:91, 184-185:92, 186-187:93, 188-189:94, 190-191:95, 192-193:96, 194-195:97, 196-197:98, 198-199:99, 200:100, 201-202:101, 203-204:102, 205-206:103, 207-208:104, 209-210:105, 211-212:106, 213-214:107, 215-216:108, 217-218:109, 219-220:110, 221-222:111, 223-224:112, 225-226:113, 227-228:114, 229-230:115, 231-232:116, 233-234:117, 235-236:118, 237-238:119, 239:120, 240-241:121, 242-243:122, 244-245:123, 246-247:124, 248-249:125, 250-251:126, 252-253:127, 254-255:128, 256-257:129, 258-259:130, 260-261:131, 262-263:132, 264-265:133, 266-267:134, 268-269:135, 270-271:136, 272-273:137, 274-275:138, 276-277:139, 278-279:140, 280:141, 281-282:142, 283-284:143, 285-286:144, 287-288:145, 289-290:146, 291-292:147, 293-294:148, 295-296:149, ≥297:150

### 4;0 – 4;5
0-105:50, 106-107:51, 108-109:52, 110-111:53, 112-113:54, 114-115:55, 116-117:56, 118-119:57, 120-121:58, 122-123:59, 124:60, 125-126:61, 127-128:62, 129-130:63, 131-132:64, 133-134:65, 135-136:66, 137-138:67, 139-140:68, 141-142:69, 143:70, 144-145:71, 146-147:72, 148-149:73, 150-151:74, 152-153:75, 154-155:76, 156-157:77, 158-159:78, 160-161:79, 162:80, 163-164:81, 165-166:82, 167-168:83, 169-170:84, 171-172:85, 173-174:86, 175-176:87, 177-178:88, 179-180:89, 181:90, 182-183:91, 184-185:92, 186-187:93, 188-189:94, 190-191:95, 192-193:96, 194-195:97, 196-197:98, 198-199:99, 200:100, 201-202:101, 203-204:102, 205-206:103, 207-208:104, 209-210:105, 211-212:106, 213-214:107, 215-216:108, 217-218:109, 219:110, 220-221:111, 222-223:112, 224-225:113, 226-227:114, 228-229:115, 230-231:116, 232-233:117, 234-235:118, 236-237:119, 238:120, 239-240:121, 241-242:122, 243-244:123, 245-246:124, 247-248:125, 249-250:126, 251-252:127, 253-254:128, 255-256:129, 257-258:130, 259-260:131, 261-262:132, 263-264:133, 265-266:134, 267-268:135, 269-270:136, 271-272:137, 273-275:138(aprox.), 276-277:139, 278-279:140, 280-281:141, 282-283:142, 284-285:143, ≥295:150 (faixa final aproximada — ver nota de confiabilidade)

### 4;6 – 4;11
0-106:50, 107-108:51, 109:52, 110-111:53, 112-113:54, 114-115:55, 116-117:56, 118-119:57, 120-121:58, 122-123:59, 124:60, 125-126:61, 127-128:62, 129-130:63, 131-132:64, 133-134:65, 135-136:66, 137-138:67, 139-140:68, 141-142:69, 143:70, 144-145:71, 146-147:72, 148-149:73, 150-151:74, 152-153:75, 154-155:76, 156-157:77, 158-159:78, 160-161:79, 162:80, 163-164:81, 165-166:82, 167-168:83, 169-170:84, 171-172:85, 173-174:86, 175-176:87, 177-178:88, 179-180:89, 181:90, 182-183:91, 184-185:92, 186-187:93, 188-189:94, 190-191:95, 192-193:96, 194-195:97, 196-197:98, 198-199:99, 200:100, 201-202:101, ..., ≥295:150

### 5;0 – 5;5
0-106:50, 107-108:51, 109:52, 110-111:53, 112-113:54, 114-115:55, 116-117:56, 118-119:57, 120-121:58, 122-123:59, 124-125:60, 126-127:61, 128:62, 129-130:63, 131-132:64, 133-134:65, 135-136:66, 137-138:67, 139-140:68, 141-142:69, 143-144:70, 145:71, 146-147:72, 148-149:73, 150-151:74, 152-153:75, 154-155:76, 156-157:77, 158-159:78, 160:79, 161-162:80, 163-164:81, 165-166:82, 167-168:83, 169-170:84, 171-172:85, 173-174:86, 175-176:87, 177-178:88, 179-180:89, 181:90, 182-183:91, ..., 200:100, ..., 219:110, ..., ≥294:150

### 5;6 – 5;11
0-102:50, 103-104:51, 105-106:52, 107-108:53, 109-110:54, 111-112:55, 113-114:56, 115-116:57, 117-118:58, 119-120:59, 121-122:60, 123-124:61, 125-126:62, 127:63, 128-129:64, 130-131:65, 132-133:66, 134-135:67, 136-137:68, 138-139:69, 140-141:70, 142-143:71, 144-145:72, 146-147:73, 148-149:74, 150-151:75, 152-153:76, 154-155:77, 156-157:78, 158-159:79, 160-161:80, 162-163:81, 164-165:82, 166-167:83, 168-169:84, 170-171:85, 172-173:86, 174-175:87, 176-177:88, 178-179:89, 180-181:90, 182-183:91, ..., 200:100, ..., 221:111, ..., ≥295:150

### 6;0 – 6;5
0-102:50, 103-104:51, 105-106:52, 107-108:53, 109-110:54, 111-112:55, 113-114:56, 115-116:57, 117-118:58, 119-120:59, 121-122:60, 123-124:61, 125:62, 126-127:63, 128-129:64, 130-131:65, 132-133:66, 134-135:67, 136-137:68, 138-139:69, 140-141:70, 142-143:71, 144-145:72, 146-147:73, 148-149:74, 150-151:75, 152-153:76, 154-155:77, 156-157:78, 158-159:79, 160-161:80, 162-163:81, 164-165:82, 166-167:83, 168-169:84, 170-171:85, 172-173:86, 174-175:87, 176-177:88, 178-179:89, 180-181:90, ..., 200:100, ..., 273:137, ..., ≥298:150

### 6;6 – 6;11
0-102:50, 103-104:51, 105-106:52, 107-108:53, 109-110:54, 111-112:55, 113-114:56, 115-116:57, 117-118:58, 119:59, 120-121:60, 122-123:61, 124-125:62, 126-127:63, 128-129:64, 130-131:65, 132-133:66, 134-135:67, 136-137:68, 138-139:69, 140-141:70, 142-143:71, 144-145:72, 146-147:73, 148-149:74, 150-151:75, 152-153:76, 154-155:77, 156-157:78, 158-159:79, 160-161:80, 162-163:81, 164-165:82, 166-167:83, 168-169:84, 170-171:85, 172-173:86, 174-175:87, 176-177:88, 178-179:89, 180:90 (aprox.), ..., 200:100, ..., 281:141, ..., ≥298:150

## ⚠️ Nota de confiabilidade das tabelas de conversão

As tabelas acima (EB→EP por subescala e EP Global) foram fotografadas em fonte pequena, com várias colunas por página. A estrutura geral e os valores das faixas iniciais/finais de cada tabela foram lidos com confiança; **alguns intervalos intermediários das tabelas de Linguagem Global (faixas 4;0 em diante) usam aproximação de padrão observado** onde a foto estava mais difícil de conferir dígito a dígito (marcado "aprox." acima). Antes de usar em produção, os intervalos completos devem ser reconferidos diretamente contra o PDF de origem (`CURSO-ADL-2.pdf`, páginas finais) ou, preferencialmente, contra o manual técnico oficial da editora (esta apostila é material de curso, não o manual oficial).

## Pendências / próximos passos

- [ ] **Reconferir célula a célula** as tabelas de conversão da Linguagem Global a partir de 4;0 anos contra o PDF original — a transcrição atual tem confiança alta nas faixas 3;0-3;11 e nas extremidades das demais tabelas, mas média nos intervalos centrais das faixas 4;0 em diante (ver nota de confiabilidade acima).
- [ ] Confirmar se a psicóloga tem acesso ao **manual técnico oficial da editora** (não apenas esta apostila de curso) — traria maior confiabilidade e possivelmente dados normativos adicionais (ex: N da amostra, desvio padrão por faixa, que não aparecem nesta apostila).
- [ ] O "Manual de Figuras" (material de estímulo visual citado em vários itens, ex. p.12, 15, 23, 24, 31, 32-33) não está incluído nesta apostila — necessário para a tela de aplicação item-a-item.
- [ ] Este documento já cobre estrutura, fluxo de escore completo, classificação clínica e exemplo de cálculo — suficiente para modelar `Teste.algoritmoCorrecao`; a `TabelaNormativa` já tem dados substanciais mas precisa da reconferência acima antes de ir para produção.
