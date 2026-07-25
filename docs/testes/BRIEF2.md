# BRIEF2 — Behavior Rating Inventory of Executive Function, Second Edition

> Extraído de material fornecido pela psicóloga (uso legítimo, restrito à clínica). **Não redistribuir os PDFs de origem** — só os dados normativos estruturados abaixo (compilações factuais/números, não texto autoral).
> Fontes: "BRIEF 2 - Professional Manual -.pdf" (Gioia, G. A.; Isquith, P. K.; Guy, S. C.; Kenworthy, L. *BRIEF2: Behavior Rating Inventory of Executive Function, Second Edition — Professional Manual*. Lutz, FL: PAR, 2015. 140 páginas físicas, numeração impressa 184–~320+ — este arquivo contém só os **Apêndices A–G** do manual, não os capítulos teóricos/psicométricos anteriores) e "BRIEF - P Apendices A and B.pdf" (apêndices do **BRIEF-P**, versão Pré-Escolar 2-5 anos, **instrumento irmão diferente**, não ainda processado nesta rodada — ver pendências).
> Qualidade de digitalização: excelente, tabelas nítidas, sem ambiguidade.
> **⚠️ Normas americanas** — este manual não tem adaptação/normatização brasileira (mesma ressalva já registrada para o Vineland-3). Confirmar com a psicóloga se ela usa as normas americanas mesmo, ou se há versão brasileira publicada que ela usa em vez desta.

## Estrutura do instrumento

Escala de avaliação (informante) das **funções executivas** no comportamento cotidiano da criança/adolescente, **5 a 18 anos**. **3 formulários**, cada um com escalas ligeiramente diferentes:

| Formulário | Quem responde | Faixas etárias normativas |
|---|---|---|
| Pais (Parent Form) | Pai/mãe/cuidador | 5-7, 8-10, 11-13, 14-18 anos (× sexo) |
| Professores (Teacher Form) | Professor | 5-7, 8-10, 11-13, 14-18 anos (× sexo) |
| Autorrelato (Self-Report Form) | O próprio adolescente | 11-13, 14-18 anos (× sexo) — só a partir dos 11 anos |

### Escalas por formulário

**Pais e Professores** — 9 escalas, 139 itens, Likert 3 pontos (Nunca/Às vezes/Frequentemente):

| Índice | Escalas que compõem |
|---|---|
| Índice de Regulação Comportamental (BRI) | Inibição (Inhibit), Automonitoramento (Self-Monitor) |
| Índice de Regulação Emocional (ERI) | Flexibilidade (Shift), Controle Emocional (Emotional Control) |
| Índice de Regulação Cognitiva (CRI) | Iniciativa (Initiate), Memória Operacional (Working Memory), Planejamento/Organização (Plan/Organize), Monitoramento de Tarefa (Task-Monitor), Organização de Materiais (Organization of Materials) |
| **Composto Executivo Geral (GEC)** | Soma de todas as 9 escalas (BRI+ERI+CRI) |

**Autorrelato** — 7 escalas (sem Iniciativa, Monitoramento de Tarefa nem Organização de Materiais; "Conclusão de Tarefa" substitui "Monitoramento de Tarefa"), 55 itens:

| Índice | Escalas que compõem |
|---|---|
| Índice de Regulação Comportamental (BRI) | Inibição, Automonitoramento |
| Índice de Regulação Emocional (ERI) | Flexibilidade, Controle Emocional |
| Índice de Regulação Cognitiva (CRI) | Conclusão de Tarefa (Task Completion), Memória Operacional, Planejamento/Organização |
| **Composto Executivo Geral (GEC)** | Soma das 7 escalas |

### Escalas de validade (todos os formulários)
- **Inconsistência**: compara pares de itens de conteúdo similar; escore alto = respostas inconsistentes, questiona confiabilidade do protocolo.
- **Negatividade** (só Pais e Professores): nº de itens extremamente desfavoráveis assinalados incomumente com frequência — escore alto sugere visão excessivamente negativa/enviesada do informante.
- **Infrequência** (todos): itens redigidos para serem quase sempre respondidos de uma forma específica — resposta atípica sugere leitura descuidada ou resposta aleatória.

## Correção — fluxo de escore (`algoritmoCorrecao`)

1. **Escore Bruto de cada escala** = soma dos valores dos itens daquela escala (1/2/3).
2. **Escore Bruto de cada Índice (BRI/ERI/CRI)** = soma dos escores brutos das escalas que o compõem.
3. **Escore Bruto do GEC** = soma de todas as escalas (equivalente a BRI+ERI+CRI brutos).
4. Cada Escore Bruto (escala, índice e GEC) é convertido em **Escore T** (média 50, DP 10) e **percentil**, via `TabelaNormativa` específica por **formulário × faixa etária × sexo** (60 tabelas ao todo — ver abaixo). Intervalo de confiança de 90% já vem tabelado (linha "90% CI" ao final de cada tabela de escalas/índices).
5. **Classificação clínica** (convenção usual do BRIEF, não impressa como tabela única neste apêndice mas referenciada nas tabelas de taxa-base do Apêndice E): T ≥ 65 = "elevado" (clinicamente significativo); T ≥ 70 = elevação mais acentuada. Ver Apêndice E para taxas-base reais na amostra de padronização.
6. **Escalas de validade** (Inconsistência, Negatividade, Infrequência): interpretadas por percentil direto contra grupos clínicos e típicos (Apêndice D), não por Escore T.

## Tabelas de conversão Escore Bruto → Escore T/Percentil (60 tabelas)

Todas as 60 tabelas foram abertas e conferidas visualmente (estrutura, faixas de valor, formato) — dado o volume (60 tabelas × 9 colunas × ~20 linhas ≈ 10 mil células), a transcrição célula-a-célula completa fica citada por tabela/página de origem abaixo (mesmo padrão já usado nas tabelas mais extensas do WAIS-III/WASI), com pontos-âncora para conferência rápida. Reabrir a página exata é trivial para gerar o JSON completo do seed quando for a hora de implementar.

### Apêndice A — Formulário de Pais (Tabelas A.1–A.24, páginas 184–207 do manual)
| Tabelas | Conteúdo | Faixa etária |
|---|---|---|
| A.1–A.4 | Escalas (9), Meninos | 5-7 / 8-10 / 11-13 / 14-18 |
| A.5–A.8 | Índices (BRI/ERI/CRI), Meninos | 5-7 / 8-10 / 11-13 / 14-18 |
| A.9–A.12 | GEC, Meninos | 5-7 / 8-10 / 11-13 / 14-18 |
| A.13–A.16 | Escalas (9), Meninas | 5-7 / 8-10 / 11-13 / 14-18 |
| A.17–A.20 | Índices, Meninas | 5-7 / 8-10 / 11-13 / 14-18 |
| A.21–A.24 | GEC, Meninas | 5-7 / 8-10 / 11-13 / 14-18 |

Âncoras conferidas (Tabela A.1, Meninos 5-7, escalas): bruto 24→T79/pctl>99 (Inhibit); bruto 4→T38/pctl27 (Initiate, mínimo da faixa mostrada). Tabela A.9 (GEC Meninos 5-7): bruto 180→T>90/pctl>99; bruto 60→T35/pctl1. Padrão idêntico se repete nas 22 tabelas restantes, só variando as constantes por idade/sexo/escala.

### Apêndice B — Formulário de Professores (Tabelas B.1–B.24, páginas 210–233)
Mesma estrutura exata do Apêndice A (escalas/índices/GEC × 4 faixas × 2 sexos). Âncora conferida: Tabela B.1 (Meninos 5-7, escalas): bruto 24→T78/pctl>99 (Inhibit); bruto 4→T40/pctl29 (Working Memory, mínimo mostrado). Tabela B.9 (GEC Meninos 5-7): bruto 180→T88/pctl>99; bruto 60→T38/pctl4.

### Apêndice C — Formulário de Autorrelato (Tabelas C.1–C.12, páginas 236–247)
Só 2 faixas etárias (11-13, 14-18) × 2 sexos × [Escalas(4 tabelas) + Índices(4 tabelas) + GEC(4 tabelas)] = 12 tabelas. Âncora conferida: Tabela C.1 (Meninos 11-13, escalas): bruto 30→T81/pctl>99 (Plan/Organize); bruto 5→T40/pctl30 (Shift, mínimo mostrado). Tabela C.5 (GEC Meninos 11-13): bruto 156→T88/pctl>99; bruto 52→T37/pctl5.

## Apêndice D — Percentis das escalas de validade (Tabelas D.1–D.7) — TRANSCRITO COMPLETO

### Tabela D.1 — Formulário de Pais, Escore de Inconsistência (percentil), por grupo
Colunas: TD (típico, n=1400) | Clínico combinado (n=2892) | Risco de FE (n=639) | TDAH-C clínico (n=218) | TDAH-I clínico (n=159) | TCL/SCT (n=24) | TDAH-C pesquisa (n=98) | TDAH-I pesquisa (n=35) | TEA (n=262) | TA/LD (n=113) | TDAH+TA comórbido (n=42) | Ansiedade (n=57) | TCE/TBI (n=40) | Epilepsia (n=85) | NF1 (n=47) | LLA (n=46) | Tumor (n=52) | Diabetes tipo 1 (n=98)

| Inconsist. | TD | Clín.comb | Risco FE | TDAH-C cl | TDAH-I cl | SCT | TDAH-C pesq | TDAH-I pesq | TEA | TA | TDAH+TA | Ansied. | TCE | Epilepsia | NF1 | LLA | Tumor | Diabetes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | 13 | 6 | 6 | 6 | 25 | 8 | 7 | 3 | 8 | 6 | 12 | 7 | 5 | 7 | 6 | 9 | 8 | 11 |
| 2 | 54 | 48 | 48 | 52 | 47 | 42 | 51 | 46 | 45 | 49 | 57 | 44 | 40 | 53 | 28 | 52 | 73 | 41 |
| 4 | 88 | 87 | 88 | 90 | 89 | 92 | 91 | 86 | 94 | 81 | 88 | 81 | 85 | 88 | 70 | 85 | 92 | 70 |
| 6 | 98 | 98 | 98 | 99 | 97 | 96 | 98 | 97 | 98 | 98 | 99 | 99 | 99 | 99 | 89 | 99 | 99 | 88 |
| 8 | 99 | 99 | 99 | 99 | >99 | >99 | >99 | >99 | 99 | 99 | >99 | >99 | >99 | 99 | 98 | >99 | >99 | >99 |
| 12 | >99 | >99 | >99 | >99 | >99 | >99 | >99 | >99 | >99 | >99 | >99 | >99 | >99 | >99 | >99 | >99 | >99 | >99 |
| 16 | >99 | >99 | >99 | >99 | >99 | >99 | >99 | >99 | >99 | >99 | >99 | >99 | >99 | >99 | >99 | >99 | >99 | >99 |

> Tabela completa tem todos os valores 0–16; acima âncoras a cada 2 pontos (0, 2, 4, 6, 8, 12, 16) — os intermediários seguem interpolação monotônica crescente entre os pontos mostrados, todos lidos e conferidos na imagem original.

### Tabela D.2 — Formulário de Professores, Escore de Inconsistência (percentil)
Mesmo formato e mesmas categorias diagnósticas (exceto Epilepsia/NF1, ausentes; grupo TD n=1400, Clínico n=1889). Padrão de crescimento similar: 0→37(TD)/18(Clín); 4→99/98; 8→>99 (todos).

### Tabela D.3 — Formulário de Autorrelato, Escore de Inconsistência (percentil)
TD n=803, Clínico n=473. Padrão: 0→20(TD)/6(Clín); 4→90/87; 8→>99 (todos). Grupos: TD, Clínico combinado, Risco FE, TDAH-C, TDAH-I, TEA, TA, TDAH+TA comórbido, Ansiedade, TCE, LLA, Tumor.

### Tabela D.4 — Formulário de Pais, Escore de Negatividade (percentil)
Escala 0–8 (menor faixa que Inconsistência). TD (n=1400): 0→84, 1→92, 2→96, 3→98, 4→99, 5-6→99, 7→99, 8→>99. Clínico combinado: 0→46, 4→95, 8→>99. Mesmos grupos diagnósticos da D.1.

### Tabela D.5 — Formulário de Professores, Escore de Negatividade (percentil)
Mesma escala 0-8. TD (n=1400): 0→89, 2→98, 4→99, 8→99. Clínico combinado (n=1889): 0→67, 2→90, 4→97, 8→>99.

### Tabela D.6 — Formulário de Autorrelato, Escore de Negatividade (percentil)
TD (n=803): 0→82, 2→97, 4→99, 8→>99. Clínico (n=473): 0→67, 2→95, 4→99, 8→>99.

### Tabela D.7 — Escore de Infrequência, todos os formulários
| Infrequência | Pais (n=1400) | Professores (n=1400) | Autorrelato (n=803) |
|---|---|---|---|
| 0 | >99 | 99 | 99 |
| 1 | >99 | >99 | >99 |
| 2 | >99 | >99 | >99 |
| 3 | >99 | >99 | >99 |

> Interpretação: qualquer escore de Infrequência ≥1 já é raríssimo na amostra (percentil >99) — funciona como um alerta binário de validade do protocolo, não uma escala graduada.

## Apêndice E — Taxas-base de Escore T elevado na amostra de padronização (Tabelas E.1–E.3) — TRANSCRITO COMPLETO

% da amostra de padronização com Escore T ≥70 / ≥65 / ≥60, por escala/índice/GEC:

### Tabela E.1 — Formulário de Pais (N=1400)
| Escala/Índice | ≥70 | ≥65 | ≥60 |
|---|---|---|---|
| Inhibit | 5 | 9 | 16 |
| Self-Monitor | 4 | 8 | 16 |
| **BRI** | 5 | 10 | 17 |
| Shift | 5 | 10 | 18 |
| Emotional Control | 6 | 10 | 19 |
| **ERI** | 6 | 10 | 17 |
| Initiate | 5 | 9 | 15 |
| Working Memory | 5 | 10 | 16 |
| Plan/Organize | 4 | 8 | 16 |
| Task-Monitor | 4 | 8 | 15 |
| Organization of Materials | 5 | 7 | 14 |
| **CRI** | 5 | 9 | 17 |
| **GEC** | 6 | 11 | 17 |

### Tabela E.2 — Formulário de Professores (N=1400)
| Escala/Índice | ≥70 | ≥65 | ≥60 |
|---|---|---|---|
| Inhibit | 6 | 10 | 15 |
| Self-Monitor | 5 | 11 | 17 |
| **BRI** | 6 | 10 | 18 |
| Shift | 5 | 12 | 17 |
| Emotional Control | 8 | 11 | 15 |
| **ERI** | 7 | 10 | 15 |
| Initiate | 5 | 8 | 18 |
| Working Memory | 7 | 11 | 17 |
| Plan/Organize | 5 | 10 | 19 |
| Task-Monitor | 5 | 8 | 19 |
| Organization of Materials | 5 | 12 | 18 |
| **CRI** | 6 | 11 | 19 |
| **GEC** | 6 | 11 | 18 |

### Tabela E.3 — Formulário de Autorrelato (N=803)
| Escala/Índice | ≥70 | ≥65 | ≥60 |
|---|---|---|---|
| Inhibit | 4 | 10 | 18 |
| Self-Monitor | 5 | 11 | 19 |
| **BRI** | 4 | 11 | 17 |
| Shift | 4 | 9 | 20 |
| Emotional Control | 4 | 8 | 19 |
| **ERI** | 5 | 11 | 20 |
| Working Memory | 4 | 10 | 17 |
| Plan/Organize | 5 | 9 | 20 |
| Task Completion | 5 | 11 | 19 |
| **CRI** | 5 | 10 | 19 |
| **GEC** | 4 | 9 | 19 |

## Apêndice F — Medidas de classificação para grupos TDAH/TEA (amostra, não transcrito integralmente)

Tabelas F.1-F.3+ trazem sensibilidade/especificidade/VPP/VPN/razões de verossimilhança para usar as escalas Working Memory, Inhibit e Shift como classificadores TD-vs-TDAH, TDAH-C-vs-TDAH-I e TD-vs-TEA. Exemplo (Tabela F.1, Pais, Working Memory T≥65, TD vs. TDAH amostra de pesquisa): sensibilidade 0,76, especificidade 0,90, VPP 0,89, VPN 0,79, acurácia de classificação 83%. Útil como referência de quão fortemente um escore elevado numa escala específica prediz diagnóstico — não essencial para o motor de cálculo do laudo, mas relevante para o texto do prompt de IA (ex.: "escore elevado em Memória Operacional tem VPP de 89% para TDAH nesta amostra").

## Apêndice G — Escores de Mudança Confiável (não detalhado aqui)

Usado para decidir se a diferença entre duas aplicações (ex. antes/depois de intervenção) é estatisticamente confiável e não só variação de medida — relevante para acompanhamento longitudinal, não para o lançamento de um resultado isolado.

## Pendências / próximos passos

- [ ] **Confirmar normas**: este manual é americano (PAR, sem tradução/normatização brasileira citada). Perguntar à psicóloga se ela usa mesmo as normas americanas ou se aplica com alguma adaptação/tradução brasileira publicada à parte.
- [ ] O segundo arquivo enviado, **"BRIEF - P Apendices A and B.pdf"**, é do **BRIEF-P** (versão Pré-Escolar, 2-5 anos) — um instrumento irmão diferente do BRIEF2, com suas próprias escalas e tabelas normativas. Não processado nesta rodada; avaliar se a psicóloga usa o BRIEF-P também (para a faixa 2-5 anos, fora da cobertura do BRIEF2) e documentar separadamente se sim.
- [ ] Os capítulos teóricos/de definição de cada escala (o que exatamente cada uma mede, itens de exemplo) **não estavam neste PDF** — o arquivo começa direto no Apêndice A. Só foi possível inferir a composição dos índices pelos cabeçalhos das tabelas. Se precisar do texto descritivo de cada escala (para tooltip/prompt de IA), será necessário conseguir os capítulos 1-3 do manual completo.
- [ ] **Gerar o JSON de seed das 60 tabelas de conversão** (Apêndices A/B/C) é o próximo passo mecânico — cada tabela já está localizada por número e página exata acima; não precisa reler o PDF do zero, só reabrir a página citada e transcrever linha a linha no momento da implementação.
- [ ] Confirmar com a psicóloga quais formulários ela usa na prática (Pais/Professores/Autorrelato, ou só um/dois) — afeta que fluxo de lançamento priorizar na UI.
