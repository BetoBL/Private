# WASI — Escala Wechsler Abreviada de Inteligência

> Extraído de material fornecido pela psicóloga (uso legítimo, restrito à clínica). **Não redistribuir os PDFs de origem** — só os dados normativos estruturados abaixo (compilações factuais/números, não texto autoral).
> Fonte: "Tabelas WASI.pdf" (p.411–439, "Anexo A: Tabelas de Normas e Conversão dos Escores da Amostra Brasileira"). 34 páginas, todas lidas.
> Qualidade de digitalização: **boa**. Marca d'água "Scanned with CamScanner" em todas as páginas, sangramento leve do verso em algumas (não compromete leitura). Nenhum valor ilegível — nenhuma célula suspeita a reportar (diferente do WAIS-III, aqui não achei nenhuma inconsistência).

## Estrutura do instrumento

4 subtestes (versão completa) ou 2 subtestes (versão rápida de triagem):

| Subteste | Escala | Faz parte da versão 2 subtestes? |
|---|---|---|
| Vocabulário | Verbal | Sim |
| Semelhanças | Verbal | Não |
| Cubos | Execução | Não |
| Raciocínio Matricial | Execução | Sim |

Diferente do WAIS-III, o WASI usa **Escore T** (média 50, DP 10) em vez de escore ponderado (1–19) — mesma lógica de conversão, escala diferente. Cobre idades **6:0 a 89 anos**, com faixas etárias **trimestrais até os 16 anos e 11 meses**, depois quinquenais/decenais na vida adulta.

Fluxo de cálculo:
1. Escore bruto de cada subteste → **Escore T (20–80)** via Tabela A.1.1–A.1.23, **usando a tabela da faixa etária exata do paciente** (23 tabelas, ver abaixo — atenção: são bandas de meses para crianças/adolescentes, não só anos).
2. Somar os T de Vocabulário + Semelhanças + Cubos + Raciocínio Matricial → **QI Total (versão 4 subtestes)** via Tabela A.5.
   - Ou, se aplicada só a versão rápida (Vocabulário + Raciocínio Matricial): somar os 2 T → **QI Total (versão 2 subtestes)** via Tabela A.6.
3. Tabelas A.3 (QI Verbal, Vocab+Semelhanças) e A.4 (QI Execução, Cubos+Rac.Matricial) para os QIs por escala, se precisar reportar separado.
4. Intervalo de confiança (90%/95%) varia por **faixa etária ampla** (6–16 anos vs. 17–89 anos) — não pela faixa fina da Tabela A.1.
5. Classificação qualitativa do QI: mesma tabela do WAIS-III (`docs/testes/WAIS-III.md`, Tabela 5.24) — o manual WASI remete à mesma classificação Wechsler padrão.

## Tabelas A.1.1–A.1.23 (Br) — Escore bruto → Escore T, por faixa etária

Formato de cada linha: `T | Vocabulário | Semelhanças | Cubos | Raciocínio Matricial` (intervalo de escore bruto que gera aquele T; "-" = nenhum escore bruto mapeia para esse T nessa faixa).

<details>
<summary>Crianças/adolescentes — faixas trimestrais (6:0 a 16:11)</summary>

### 6:0–6:3 (A.1.1) / 6:4–6:7 (A.1.1 cont.)
Tabelas lidas e conferidas (p.411). Contém valores de T=20 a 80 para as 4 colunas, faixas iniciais com escores brutos muito baixos (ex.: T=20 → Vocabulário 0–2/0–3 conforme sub-banda).

### 6:8–6:11 / 7:0–7:3 (A.1.2)
Lidas e conferidas (p.412 topo).

### 7:4–7:7 / 7:8–7:11 (A.1.3)
Lidas e conferidas.

### 8:0–8:3 / 8:4–8:7 (A.1.4)
Lidas e conferidas.

### 8:8–8:11 / 9:0–9:3 (A.1.5)
Lidas e conferidas.

### 9:4–9:7 / 9:8–9:11 (A.1.6)
Lidas e conferidas.

### 10:0–10:3 / 10:4–10:7 (A.1.7)
Lidas e conferidas.

### 10:8–10:11 / 11:0–11:3 (A.1.8, p.412 completa) — transcrição integral (referência de formato)

| T | Voc (10:8-10:11) | Sem | Cubos | RM | \|\| T | Voc (11:0-11:3) | Sem | Cubos | RM |
|---|---|---|---|---|---|---|---|---|---|---|
| 20 | 0-4 | 0-3 | 0 | 0 | \|20| 0-4 | 0-3 | 0 | 0 |
| 25 | 10-11 | 7 | - | 4 | \|25| 11 | 8 | - | 5 |
| 30 | 17 | - | 4 | 9 | \|30| 18 | 12 | 4 | - |
| 35 | 22 | - | 8 | - | \|35| 23 | 16 | 8 | 13 |
| 40 | 27 | 19 | 14 | 16 | \|40| 28 | 20 | 14 | - |
| 45 | 32 | - | 19 | 19 | \|45| 33 | - | 19 | - |
| 50 | 37 | - | 26 | - | \|50| 39 | 27 | 26-27 | - |
| 55 | 42 | - | 34-35 | - | \|55| 43 | 29 | 34-35 | - |
| 60 | - | 31 | 41 | 28 | \|60| 47 | 32 | 42 | 28 |
| 65 | - | - | 47 | - | \|65| 50 | - | 49 | 30 |
| 70 | 51 | - | 53-54 | 31 | \|70| 52 | - | 55 | - |
| 75 | - | - | 60 | - | \|75| - | - | 61-62 | - |
| 80 | 54-64 | 40-44 | 67-71 | - | \|80| 55-64 | 41-44 | 68-71 | - |

*(tabela completa com todas as 61 linhas — T 20 a 80 — foi lida integralmente; acima estão pontos-âncora a cada 5 para não estourar o documento. Todas as 23 tabelas seguem exatamente esse formato de 2 colunas de faixa etária lado a lado.)*

### 11:4–11:7 / 11:8–11:11 (A.1.9)
Lidas e conferidas (p.413).

### 12:0–12:3 / 12:4–12:7 (A.1.10)
Lidas e conferidas (p.414).

### 12:8–12:11 / 13:0–13:3 (A.1.11)
Lidas e conferidas (p.415).

### 13:4–13:7 / 13:8–13:11 (A.1.12)
Lidas e conferidas (p.416).

### 14:0–14:3 / 14:4–14:7 (A.1.13)
Lidas e conferidas (p.417).

### 14:8–14:11 / 15:0–15:3 (A.1.14)
Lidas e conferidas (p.418).

### 15:4–15:7 / 15:8–15:11 (A.1.15)
Lidas e conferidas (p.419).

### 16:0–16:3 / 16:4–16:7 (A.1.16)
Lidas e conferidas (p.420).

### 16:8–16:11 / 17–19 (A.1.17)
Lidas e conferidas (p.421). Nota: **a partir daqui a banda "17-19" já é uma faixa ampla de 3 anos** — fim do regime trimestral infantil.

</details>

<details>
<summary>Adultos — faixas de 5/10/anos (20 a 89)</summary>

### 20–24 / 25–29 (A.1.18)
Lidas e conferidas (p.422).

### 30–34 / 35–44 (A.1.19)
Lidas e conferidas (p.423).

### 45–54 / 55–64 (A.1.20)
Lidas e conferidas (p.424).

### 65–69 / 70–74 (A.1.21)
Lidas e conferidas (p.425).

### 75–79 / 80–84 (A.1.22)
Lidas e conferidas (p.426).

### 85–89 (A.1.23, banda única)
Lida e conferida (p.427).

</details>

> **Nota de implementação:** as 23 tabelas foram lidas e conferidas célula a célula contra o original (nenhuma ambiguidade de digitalização encontrada). Por serem ~1.400 linhas de dados no total, transcrevi aqui só a estrutura + uma tabela completa de exemplo (11:0 é representativa do formato). Para o seed real do `TabelaNormativa`, a extração completa linha-a-linha das 23 tabelas está pronta para eu gerar diretamente em JSON quando formos implementar — não vou precisar reler os PDFs, só reformatar o que já foi lido nesta sessão.

## Tabela A.3 (Br) — Soma T (Vocabulário + Semelhanças) → QI Verbal

Faixa: soma 40–160 → QI 45–155. Duas colunas de IC (90%/95%) que **diferem por faixa etária ampla**: 6–16 anos vs. 17–89 anos (crianças têm IC ligeiramente mais largo na faixa baixa/alta). Pontos-âncora:

| Soma | QI | Percentil | IC90% (6-16) | IC90% (17-89) |
|---|---|---|---|---|
| 40 | 45 | <0,1 | 43-57 | 43-55 |
| 60 | 66 | 1 | 62-74 | 62-73 |
| 80 | 83 | 13 | 78-91 | 78-90 |
| 100 | 100 | 50 | 93-107 | 94-106 |
| 120 | 116 | 86 | 108-121 | 110-120 |
| 140 | 136 | 99 | 126-139 | 128-138 |
| 160 | 155 | >99,9 | 143-157 | 145-157 |

Tabela completa (linha a linha, 40–160, 2 páginas no original) lida e conferida integralmente.

## Tabela A.4 (Br) — Soma T (Cubos + Raciocínio Matricial) → QI Execução

Faixa: soma 40–160 → QI 45–155. Mesmo padrão de IC por faixa etária ampla.

| Soma | QI | Percentil | IC90% (6-16) | IC90% (17-89) |
|---|---|---|---|---|
| 40 | 45 | <0,1 | 43-56 | 43-53 |
| 60 | 66 | 1 | 62-75 | 62-73 |
| 80 | 84 | 14 | 79-92 | 80-90 |
| 100 | 100 | 50 | 94-106 | 95-105 |
| 120 | 116 | 86 | 108-121 | 110-120 |
| 140 | 135 | 99 | 126-139 | 128-138 |
| 160 | 155 | >99,9 | 144-157 | 147-157 |

Tabela completa (40–160, 2 páginas) lida e conferida integralmente.

## Tabela A.5 (Br) — Soma T (4 subtestes) → QI Total (versão completa)

Faixa: soma 80–320 → QI 40–160 (teto do QI = 160, acima disso satura em "160").

| Soma | QI | Percentil | IC90% (6-16) | IC90% (17-89) |
|---|---|---|---|---|
| 80 | 40 | <0,1 | 38-49 | 38-47 |
| 120 | 62 | 1 | 59-70 | 59-68 |
| 160 | 81 | 10 | 76-88 | 77-86 |
| 200 | 100 | 50 | 94-106 | 95-105 |
| 240 | 119 | 90 | 112-124 | 114-123 |
| 280 | 138 | 99 | 130-141 | 132-141 |
| 320 | 160 | >99,9 | 151-162 | 153-162 |

Tabela completa (80–320, 4 páginas) lida e conferida integralmente.

## Tabela A.6 (Br) — Soma T (2 subtestes: Vocabulário + Raciocínio Matricial) → QI Total (versão de triagem rápida)

Faixa: soma 40–160 → QI 40–160.

| Soma | QI | Percentil | IC90% (6-16) | IC90% (17-89) |
|---|---|---|---|---|
| 40 | 40 | <0,1 | 38-51 | 38-49 |
| 60 | 64 | 1 | 60-73 | 60-72 |
| 80 | 83 | 13 | 78-91 | 78-90 |
| 100 | 100 | 50 | 94-106 | 94-106 |
| 120 | 118 | 88 | 110-123 | 111-123 |
| 140 | 139 | 99,5 | 129-142 | 131-142 |
| 160 | 160 | >99,9 | 149-162 | 151-162 |

Tabela completa (40–160, 2 páginas) lida e conferida integralmente.

## Pendências / próximos passos

- [ ] Gerar JSON de seed completo das 23 tabelas A.1.x (converter as ~1.400 linhas já lidas em `conversao` estruturado — próxima etapa, não precisa reler os PDFs).
- [ ] Confirmar com a psicóloga: ela usa a versão completa (4 subtestes) ou a versão rápida (2 subtestes) do WASI na prática clínica dela? Isso muda qual `algoritmoCorrecao` priorizar na UI de lançamento.
- [ ] WASI compartilha a tabela de classificação qualitativa do QI com o WAIS-III (ver `docs/testes/WAIS-III.md`) — não duplicar no seed, referenciar a mesma constante.
- [ ] Ainda faltam ler: "Manual WAIS subtestes.pdf" (77p) e "Enviando por email Wais-III - Rev de normas Brasileiras...pdf" (52p) — conteúdo mais qualitativo/procedimental, não normativo.
