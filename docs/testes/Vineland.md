# Vineland-3 — Escalas de Comportamento Adaptativo Vineland (Terceira Edição)

> Extraído de material fornecido pela psicóloga (uso legítimo, restrito à clínica). **Não redistribuir o PDF de origem** — só os dados estruturados abaixo.
> Fonte: "Manual Vineland1.pdf" (Sparrow, S. S.; Cicchetti, D. V.; Saulnier, C. A. *Vineland-3: Escalas de Comportamento Adaptativo Vineland*, 3ª ed., Manual. São Paulo: Pearson Clinical Brasil / Casapsi, 2019. ISBN 978-85-8040-903-1. 354p., tradução Isis Vitta, adaptação brasileira Andrea Lane Edde e Camilla Zugman). Dados normativos © 2016 NCS Pearson, Inc.
> Qualidade de digitalização: boa, texto nítido.

## ⚠️ Achado crítico: as tabelas normativas NÃO estão neste PDF

Diferente de todos os outros manuais já documentados (RAVLT, WAIS-III, WASI, SCARED, BFP), **os Apêndices B, C, D e E — que contêm exatamente as tabelas de conversão escore bruto → escore padronizado/percentil — não foram impressos neste manual**. Cada um traz apenas uma página com a frase:

> "O Apêndice [B/C/D/E] está disponível como um recurso online para o Vineland-3."

Confirmado também no corpo do texto (Cap. 3, p.44): *"Os escores brutos dos subdomínios podem ser convertidos para escores de escala-v com o auxílio das Tabelas de Normas, nos Apêndices B a E. As Tabelas de Normas foram separadas do manual para reduzir seu peso e aumentar sua durabilidade, portanto, esses apêndices estão disponíveis on-line na Vineland-3."*

Ou seja: a Pearson distribui as tabelas normativas separadamente, num portal online (provavelmente Q-global ou similar, mediante código de acesso vinculado à compra do kit). **Sem outro arquivo/acesso da psicóloga, não há como popular `TabelaNormativa` para o Vineland** — só é possível modelar a estrutura do `Teste`, os itens e as fórmulas de escore (que não dependem da norma em si).

Além disso, este manual é a versão brasileira mas as normas em si (Apêndice B-E, quando obtidas) são apresentadas como **"Normas Americanas"** — o manual não indica uma padronização brasileira própria como fez o RAVLT/WAIS-III/WASI/BFP/SCARED.

## Estrutura do instrumento

3 formulários de aplicação (Tabela 1.1), cada um com versão **Extensiva** (mais itens, mais detalhada) e versão de **Níveis de Domínio** (mais rápida, só escores de domínio, sem subdomínio):

| Formulário | Quem preenche | Idades (Extensivo) | Idades (Níveis de Domínio) |
|---|---|---|---|
| Entrevista | Profissional entrevista um respondente (não lê os itens, faz perguntas abertas) | Nascimento a 90+ | 3 a 90+ |
| Pais/Cuidadores | Pai/cuidador preenche sozinho (itens com redação mais simples que a Entrevista) | Nascimento a 90+ | 3 a 90+ |
| Professores | Professor/cuidador de creche preenche | 3 a 21 | 3 a 21 |

4 domínios centrais + 2 opcionais, com subdomínios (Tabela 1.2/1.3):

| Domínio | Subdomínio | Idade de aplicação | Definição |
|---|---|---|---|
| Comunicação | Receptivo | Todas | Atender, compreender e responder a informações dadas por outros |
| | Expressivo | Todas | Utilizar palavras e sentenças para se expressar verbalmente |
| | Escrito | 3+ | Utilizar habilidades de leitura e escrita |
| Habilidades Cotidianas | Pessoal | Todas | Autossuficiência em alimentação, vestir-se, banho, higiene |
| | Doméstico (Numérico no Form. Professores) | 3+ | Tarefas domésticas / conceitos numéricos na prática |
| | Comunidade (Comunidade Escolar no Form. Professores) | 3+ | Funcionar no mundo fora de casa / expectativas do ambiente escolar |
| Socialização | Relacionamentos Interpessoais | Todas | Responder e relacionar-se com outros, manter amizades |
| | Brincadeira e Lazer | Todas | Envolver-se em atividades divertidas com outros |
| | Habilidades de Enfrentamento | 2+ | Controle comportamental/emocional em situações envolvendo outras pessoas |
| Habilidades Motoras (**opcional**) | Coordenação Motora Grossa | Nascimento a 9 anos | Uso de pernas/braços para movimento e coordenação |
| | Coordenação Motora Fina | Nascimento a 9 anos | Uso de mãos/dedos para manipular objetos |
| Comportamento Mal Adaptado (**opcional**) | Internalizante | 3+ | Comportamentos problemáticos de natureza emocional |
| | Externalizante | 3+ | Comportamentos problemáticos de atuação |
| | Itens Críticos | 3+ | Comportamentos mais severos; não formam constructo único, não são pontuados como escala |

Notas de modelagem:
- Habilidades Motoras **não entra** no escore geral (CCA) na Vineland-3 (entrava até os 6 anos na Vineland-II) — mudança deliberada para alinhar com o critério AAIDD 2010 de Deficiência Intelectual, que exige déficit em habilidades conceituais/sociais/**práticas**, não motoras.
- Formulário de Níveis de Domínio só dá escore por **domínio** (não por subdomínio) — é uma amostragem dos itens dos subdomínios relevantes, mais rápido de aplicar.
- Tempos de aplicação (Tabela 1.4): Entrevista Extensivo 3-9 anos ~35-40min; Pais/Cuidadores Extensivo 3-9 anos ~20-25min; Professores Extensivo 3-9 anos ~15-20min. Domínios opcionais somam mais alguns minutos cada.

## Correção — fluxo de escore (`algoritmoCorrecao`)

Cada item é pontuado **2 / 1 / 0** (Sempre ou quase sempre / Às vezes / Nunca — nomenclatura varia um pouco por formulário), com caixa de "Estimado" quando o respondente não presenciou o comportamento diretamente.

### 1. Escore bruto do subdomínio (regra de base e teto)
- **Entrevista**: base = 2+ grupos de 4 itens consecutivos com escore 2; teto = 4+ itens consecutivos com escore 0.
- **Pais/Cuidadores e Professores**: base = 5+ itens consecutivos com escore 2; teto = 5+ itens consecutivos com escore 0.
- Escore bruto = (item mais alto da base × 2) + soma dos pontos entre base e teto. Itens abaixo da base contam como 2; itens acima do teto contam como 0 (mesmo que tenham sido de fato respondidos com outro valor durante a aplicação — usado só para fins de pontuação normativa, não para plano de intervenção, onde se usa o escore real do item).
- **Formulário de Níveis de Domínio**: sem regra de base/teto — todos os itens da seção são respondidos e simplesmente somados.

### 2. % de Itens Estimados (validade da seção)
`% Est = (nº itens estimados / nº itens respondidos) × 100`

| % Est | Interpretação |
|---|---|
| < 15% | validade da seção provavelmente não está comprometida |
| 15–25% | interpretar os escores da seção com cautela |
| > 25% | não interpretar os escores da seção |

### 3. Escore bruto → Escore de escala-v (por subdomínio)
Via tabela normativa por idade (Apêndices B/C/D — **indisponíveis, ver acima**). Escala-v: média 15, DP 3, faixa 1–24 (mais ampla abaixo da média — até 4⅔ DP abaixo — que acima, só 3 DP acima — refletindo o uso do teste majoritariamente para detectar déficit).

### 4. Escore de escala-v → Escore padronizado de domínio
Somar os escores de escala-v dos subdomínios de cada domínio → tabela normativa (Apêndices B.3/C.3/D.3, **indisponíveis**) → escore padronizado (média 100, DP 15, faixa 20–140) + rank percentil + intervalo de confiança (85%/90%/95%, recomendado 90%).

### 5. CCA (Composto de Comportamento Adaptativo)
`CCA = soma dos escores padronizados de Comunicação + Habilidades Cotidianas + Socialização` → tabela normativa → escore padronizado geral (média 100, DP 15). **Habilidades Motoras não entra no CCA.**

### 6. Domínio de Comportamento Mal Adaptado (opcional)
Seções Internalizante e Externalizante: soma bruta → escore de escala-v (Apêndices E.1/E.2/E.3, **indisponíveis**), média 15, DP 3. Itens Críticos: não formam escala, qualquer item com escore 1 ou 2 é reportado individualmente (comportamento presente).

Descritores qualitativos do Comportamento Mal Adaptado: 1–17 = dentro da média; 18–20 = elevado; 21–24 = clinicamente significativo.

### Análises complementares (ipsativas)
- **Pontos Fortes/Fracos**: compara cada escore padronizado de domínio (ou escala-v de subdomínio) com a média dos domínios (ou subdomínios) do próprio examinado — não com a norma. Usa valores críticos tabelados (Apêndices B.4/C.4/D.4, **indisponíveis**) por nível de significância (0,10 ou 0,05).
- **Comparação de Diferenças entre Pares**: compara cada escore de domínio/subdomínio com todos os outros do mesmo examinado, também contra valor crítico tabelado.
- **Equivalência de Idade (EI)**: idade em que o escore bruto do examinado é a mediana normativa — tem "apelo de senso comum" mas o manual alerta fortemente contra uso isolado (relação errática entre escore bruto e EI, mudanças de 1 ponto bruto podem mover a EI muito mais em idades altas que em baixas).
- **Escala de Valores de Crescimento (EVC)**: escala de intervalos iguais (Rasch/TRI) por subdomínio, faixa 10–197, usada só para medir progresso longitudinal no **mesmo formulário** (não comparável entre subdomínios nem entre formulários diferentes).

## Descritores qualitativos (Tabela 4.1 — não depende de norma brasileira, é convenção do próprio manual)

| Nível Adaptativo | Escala-v (subdomínios) | Escore Padronizado (domínio/CCA) |
|---|---|---|
| Alto | 21 a 24 | 130 a 140 |
| Moderadamente alto | 18 a 20 | 115 a 129 |
| Adequado | 13 a 17 | 86 a 114 |
| Moderadamente baixo | 10 a 12 | 71 a 85 |
| Baixo | 1 a 9 | 20 a 70 |

> O próprio manual alerta: pontos de corte são semiarbitrários, não baseados em evidência, e não consideram erro de medida — o intervalo de confiança de um escore de 72 provavelmente se sobrepõe às faixas "Baixo" e "Moderadamente baixo" vizinhas. Não incluído nas páginas de relatório de pontuação oficiais; usar com cautela na UI.

## Uso diagnóstico (útil para o prompt de IA do laudo)

- **Atraso de Desenvolvimento** (DSM-5, <5 anos, quando testagem de QI padronizada não é viável): escores baixos em qualquer domínio ou no CCA contribuem para o diagnóstico; não há padrão específico de subdomínio.
- **Deficiência Intelectual** (critério AAIDD 2010): exige déficit de ~2 DP abaixo da média tanto no QI quanto no comportamento adaptativo (domínios centrais ou CCA) — não usa Habilidades Motoras para esse critério.
- **Transtorno do Espectro Autista**: subdomínios mais relevantes são Receptivo/Expressivo (Comunicação) e Relacionamentos Interpessoais/Brincadeira e Lazer (Socialização); os padrões restritos/repetitivos do TEA **não** são bem capturados como déficit adaptativo, mas aparecem nos Itens Críticos do Comportamento Mal Adaptado (movimentos estereotipados, fala repetitiva, interesses fixos, hiper/hiporreatividade sensorial). A Vineland por si só não é indicativa definitiva de TEA — precisa combinar com outras medidas.
- Regra geral do manual: os resultados da Vineland-3 **nunca devem ser usados isoladamente** — sempre combinar com histórico, entrevista, outros testes e observação direta.

## Pendências / próximos passos

- [ ] **Bloqueador principal**: obter as Tabelas de Normas (Apêndices B, C, D, E) — recurso online da Pearson, provavelmente vinculado ao código de acesso do kit físico que a psicóloga comprou. Sem isso, não é possível popular `TabelaNormativa` nem os valores críticos de ponto forte/fraco. Perguntar a ela se tem acesso a esse portal (Q-global ou similar) ou um PDF/arquivo separado com essas tabelas.
- [ ] Confirmar se as normas obtidas são de fato só americanas (sem adaptação brasileira), como o rótulo dos apêndices sugere ("Normas Americanas") — isso é relevante para a comunicação ética ao paciente/no laudo (resultado comparado a amostra americana, não brasileira).
- [ ] O Apêndice A (Conteúdo do item, p.213-288 do manual) lista o texto completo de todos os itens de todos os formulários/subdomínios — não transcrito integralmente aqui (são ~400 itens por formulário); suficiente por ora ter a estrutura de domínios/subdomínios acima. Reler o Apêndice A quando for implementar a tela de lançamento item-a-item.
- [ ] Este documento cobre estrutura, fluxo de escore e descritores — pronto para modelar o `Teste` (algoritmoCorrecao) e o schema do formulário de itens; a `TabelaNormativa` fica bloqueada até resolver a pendência acima.
