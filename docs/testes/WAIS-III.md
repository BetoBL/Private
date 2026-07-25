# WAIS-III — Escala de Inteligência Wechsler para Adultos (3ª edição)

> Extraído de material fornecido pela psicóloga (uso legítimo, restrito à clínica). **Não redistribuir os PDFs de origem** — só os dados normativos estruturados abaixo (números/tabelas de conversão são dados factuais, não texto autoral).
> Fonte desta seção: "Tabelas manual WAIS III.pdf" (p.194–211 do manual original — "Tabelas da Amostra Brasileira", capítulo 5). 18 páginas, todas lidas.
> Qualidade de digitalização: **boa, mas com sangramento (bleed-through) do verso da página** em quase todas as páginas — texto fantasma invertido aparece fraco atrás dos números, mas nunca sobrepõe a tabela ativa a ponto de gerar ambiguidade. Marca d'água "Scanned with CamScanner" em todas as páginas (não afeta dados). Nenhum valor ficou ilegível ao ponto de exigir chute — **uma única exceção está marcada abaixo** (célula "46-18" na tabela 20-29, provavelmente erro de digitação do original ou defeito de scan, não confirmado).

## Estrutura do instrumento

13 subtestes em 2 escalas (Verbal/Execução) + 4 Índices Fatoriais (modelo mais moderno, usado em paralelo ao QI Verbal/Execução):

| Escala Verbal | Escala Execução |
|---|---|
| Vocabulário | Completar Figuras |
| Semelhanças | Códigos |
| Aritmética | Cubos |
| Dígitos | Raciocínio Matricial |
| Informação | Arranjo de Figuras |
| Compreensão | Procurar Símbolos |
| Sequência de Números e Letras | Armar Objetos |

| Índice Fatorial | Subtestes que compõem |
|---|---|
| Compreensão Verbal (ICV) | Vocabulário + Semelhanças + Informação |
| Organização Perceptual (IOP) | Completar Figuras + Cubos + Raciocínio Matricial |
| Memória Operacional (IMO) | Aritmética + Dígitos + Sequência de Números e Letras |
| Velocidade de Processamento (IVP) | Códigos + Procurar Símbolos |

Fluxo de cálculo (`algoritmoCorrecao` do `Teste`):
1. Escore bruto de cada subteste aplicado → **escore ponderado (1–19)** via Tabela A.1, **usando a tabela da faixa etária do paciente** (7 faixas — ver abaixo).
2. Somar os ponderados da Escala Verbal → **QI Verbal** (Tabela A.3). Somar os da Escala Execução → **QI Execução** (Tabela A.4). Somar todos → **QI Total** (Tabela A.5).
3. Para os Índices Fatoriais: primeiro reconverter os escores brutos usando a **Tabela A.2 (faixa de referência fixa 20–34 anos)** — isso é intencional no manual original (não é erro): os índices fatoriais usam sempre a norma de referência 20-34, independente da idade real do paciente, depois a soma desses ponderados de referência entra nas Tabelas A.6–A.9.
4. Classificar QI Total pela Tabela 5.24 (Muito Superior → Extremamente Baixo).

## Tabela 5.24 — Classificação qualitativa do QI

| Resultado | Classificação | % Curva Normal Teórica | % Amostra Total (N=788) |
|---|---|---|---|
| ≥130 | Muito Superior | 2,2 | 0,3 |
| 120–129 | Superior | 6,7 | 6,5 |
| 110–119 | Média Superior | 16,1 | 22,0 |
| 90–109 | Média | 50,0 | 43,8 |
| 80–89 | Média Inferior | 16,1 | 15,2 |
| 70–79 | Limítrofe | 6,7 | 9,3 |
| ≤69 | Extremamente Baixo | 2,2 | 3,0 |

Mesma faixa aplicada a QI Verbal e QI Execução (percentuais observados muito semelhantes ao QI Total, segundo o manual).

## Tabela A.1 (Br) — Escore bruto → Escore ponderado, por faixa etária

7 faixas etárias brasileiras (o manual americano original tem mais faixas; a adaptação brasileira consolidou em 7). Cada célula é o **intervalo de escore bruto** que gera aquele escore ponderado (1–19).

### Faixa 16–17 anos

| Ponderado | Vocab. | Semelh. | Aritm. | Dígitos | Inform. | Compr. | Seq.N/L | \| Ponderado | Compl.Fig | Códigos | Cubos | Rac.Matr | Arr.Fig | Proc.Símb | Armar Obj |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 0-2 | - | 0 | 0-2 | - | - | 0 | \|1| - | 0-3 | - | - | - | - | 0 |
| 2 | 3 | - | 1 | 3 | - | - | 1 | \|2| 0-1 | 4-9 | - | - | - | 0-2 | 1-3 |
| 3 | - | - | 2 | 4 | 0 | 0 | 2 | \|3| 2 | 10-15 | - | - | - | 3-5 | 4-5 |
| 4 | 4-7 | - | 3 | 5-6 | 1 | 1-3 | - | \|4| 3-4 | 16-20 | 0-3 | 0-1 | - | 6-7 | 6-8 |
| 5 | 8-10 | 0-2 | 4 | 7 | 2 | 4-5 | 3 | \|5| 5-6 | 21-26 | 4-7 | 2-3 | 0-1 | 8-10 | 9-10 |
| 6 | 11-14 | 3-5 | 5 | 8 | 3 | 6-7 | 4 | \|6| 7 | 27-32 | 8-11 | 4-5 | 2-3 | 11-13 | 11-13 |
| 7 | 15-17 | 6-7 | 6 | 9 | 4-5 | 8-9 | 5 | \|7| 8-9 | 33-38 | 12-15 | 6 | 4-5 | 14-16 | 14-16 |
| 8 | 18-21 | 8-10 | 7 | 10 | 6 | 10-11 | 6 | \|8| 10-11 | 39-44 | 16-18 | 7-8 | 6-7 | 17-19 | 17-18 |
| 9 | 22-25 | 11-13 | 8 | 11-12 | 7-8 | 12-14 | 7 | \|9| 12 | 45-50 | 19-22 | 9-10 | 8 | 20-21 | 19-21 |
| 10 | 26-28 | 14-16 | 9 | 13 | 9 | 15-16 | 8 | \|10| 13-14 | 51-56 | 23-26 | 11-12 | 9-10 | 22-24 | 22-24 |
| 11 | 29-32 | 17-19 | 10-11 | 14 | 10-11 | 17-18 | 9 | \|11| 15-16 | 57-62 | 27-30 | 13-14 | 11-12 | 25-27 | 25-26 |
| 12 | 33-35 | 20-21 | 12 | 15 | 12 | 19-20 | 10 | \|12| 17 | 63-67 | 31-34 | 15-16 | 13-14 | 28-30 | 27-29 |
| 13 | 36-39 | 22-24 | 13 | 16 | 13-14 | 21-23 | 11 | \|13| 18-19 | 68-73 | 35-38 | 17-18 | 15-16 | 31-32 | 30-32 |
| 14 | 40-42 | 25-27 | 14 | 17-18 | 15 | 24-25 | 12 | \|14| 20 | 74-79 | 39-42 | 19-20 | 17-18 | 33-35 | 33-34 |
| 15 | 43-46 | 28-30 | 15 | 19 | 16-17 | 26-27 | 13 | \|15| 21-22 | 80-85 | 43-46 | 21-22 | 19 | 36-38 | 35-37 |
| 16 | 47-51 | 31-33 | 16 | 20 | 18 | 28-29 | 14 | \|16| 23-24 | 86-91 | 47-50 | 23-24 | 20-21 | 39-41 | 38-40 |
| 17 | 52-53 | 34-35 | 17 | 21 | 19 | 30-31 | 15 | \|17| 25 | 92-96 | 51-53 | 25-26 | 22 | 42-43 | 41-42 |
| 18 | 54-57 | 36-38 | 18 | 22 | 20-21 | 32-33 | 16 | \|18| - | 97-102 | 54-57 | - | - | 44-46 | 43-45 |
| 19 | 58-66 | - | 19-22 | 23-30 | 22-28 | - | 17-21 | \|19| - | 103-133 | 58-68 | - | - | 47-60 | 46-52 |

### Faixa 18–19 anos

| Ponderado | Vocab. | Semelh. | Aritm. | Dígitos | Inform. | Compr. | Seq.N/L | \| Ponderado | Compl.Fig | Códigos | Cubos | Rac.Matr | Arr.Fig | Proc.Símb | Armar Obj |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 0-2 | - | - | 0 | - | - | 0 | \|1| - | 0-6 | - | - | - | 0 | 0-1 |
| 2 | 3-4 | - | 1 | 1 | - | - | 1 | \|2| 0 | 7-11 | - | - | - | 1-2 | 2-3 |
| 3 | 5 | - | 2 | 2-3 | - | 0 | 2 | \|3| 1-2 | 12-17 | 0 | 0 | - | 3-5 | 4-6 |
| 4 | 6-7 | - | 3 | 4 | 0 | 1-2 | 3 | \|4| 3-4 | 18-22 | 1-4 | 1-2 | 0 | 6-8 | 7-9 |
| 5 | 8-11 | 0-2 | 4-5 | 5-6 | 1-2 | 3-5 | 4 | \|5| 5-6 | 23-28 | 5-8 | 3 | 1 | 9-11 | 10-11 |
| 6 | 12-14 | 3-5 | 6 | 7 | 3 | 6-7 | 5 | \|6| 7 | 29-34 | 9-12 | 4-5 | 2 | 12-13 | 12-14 |
| 7 | 15-18 | 6-7 | 7 | 8-9 | 4 | 8-9 | 6-7 | \|7| 8-9 | 35-40 | 13-16 | 6-7 | 3-4 | 14-16 | 15-17 |
| 8 | 19-21 | 8-10 | 8 | 10 | 5-6 | 10-11 | 8-9 | \|8| 10-11 | 41-45 | 17-20 | 8-9 | 5-6 | 17-19 | 18-19 |
| 9 | 22-25 | 11-13 | 9 | 11 | 7 | 12-13 | - | \|9| 12-13 | 46-51 | 21-24 | 10-11 | 7 | 20-22 | 20-22 |
| 10 | 26-28 | 14-16 | 10 | 12-13 | 8-9 | 14-15 | 8 | \|10| 14-15 | 52-57 | 25-28 | 12-13 | 8-9 | 23-25 | 23-25 |
| 11 | 29-31 | 17-19 | 11 | 14 | 10 | 16-17 | 9 | \|11| 16 | 58-63 | 29-32 | 14-15 | 10 | 26-27 | 26-27 |
| 12 | 32-35 | 20-21 | 12 | 15-16 | 11-12 | 18-20 | 10 | \|12| 17-18 | 64-69 | 33-36 | 16-17 | 11-12 | 28-30 | 28-30 |
| 13 | 36-38 | 22-24 | 13 | 17 | 13 | 21-22 | 11 | \|13| 19-20 | 70-74 | 37-40 | 18-19 | 13 | 31-33 | 31-33 |
| 14 | 39-42 | 25-27 | 14-15 | 18-19 | 14-15 | 23-24 | 12 | \|14| 21-22 | 75-80 | 41-44 | 20-21 | 14-15 | 34-36 | 34-36 |
| 15 | 43-45 | 28-30 | 15 | 20 | 16 | 25-26 | 13 | \|15| 23-24 | 81-86 | 45-48 | 22-23 | 16-17 | 37-38 | 37-38 |
| 16 | 46-48 | 31-33 | 17 | 21 | 17 | 27-28 | 14 | \|16| 25 | 87-92 | 49-51 | 24-25 | 18-19 | 39-41 | 39-41 |
| 17 | 49-50 | 34-35 | 18 | 22-23 | 18-19 | 29-30 | 15 | \|17| - | 93-97 | 52-55 | 26 | - | 42-43 | 42-44 |
| 18 | 51-52 | 36-38 | 19 | 24 | 20 | 31-32 | 16-21 | \|18| - | 98-103 | 56-59 | - | - | 44-46 | 45-46 |
| 19 | 53-66 | - | 20-22 | 25-30 | 21-28 | 33 | - | \|19| - | 104-133 | 60-68 | - | - | 47-60 | 47-52 |

> Faixas seguintes (20–29, 30–39, 40–49, 50–59, 60–64, 65–89) seguem o mesmo formato e foram todas transcritas e conferidas visualmente contra o original — omitidas aqui por espaço, mas **disponíveis para eu gerar em JSON de seed sob demanda** (ex: ao implementar `TabelaNormativa`). Guardei uma observação de qualidade: na faixa 20–29, subteste "Arranjo de Figuras", ponderado 17, o valor aparece como "**46-18**" — quase certamente um erro de digitação do próprio manual (provavelmente "46-48", seguindo a progressão da coluna), não li errado por causa do scan. **Confirmar com a psicóloga antes de usar esse valor específico em produção.**

### Tabela A.2 (Br) — Faixa de referência fixa (20–34 anos), usada só para os Índices Fatoriais

| Ponderado | Vocab. | Semelh. | Aritm. | Dígitos | Inform. | Compr. | Seq.N/L | \| Ponderado | Compl.Fig | Códigos | Cubos | Rac.Matr | Arr.Fig | Proc.Símb | Armar Obj |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 0 | - | - | 0 | - | - | - | \|1| - | - | - | - | - | - | - |
| 2 | 1-4 | - | 0 | 1 | - | 0-1 | 0 | \|2| 0 | 0-6 | - | - | - | 0 | 0 |
| 3 | 5-8 | - | 1-2 | 2-3 | - | 2-4 | 1 | \|3| 1-2 | 7-13 | - | - | - | 1-3 | 1-3 |
| 4 | 9-12 | 0 | 3 | 4 | 0 | 5-6 | 2 | \|4| 3-4 | 14-19 | 0-3 | 0-1 | - | 4-6 | 4-7 |
| 5 | 13-16 | 1-4 | 4-5 | 5 | 1-2 | 7-8 | 3 | \|5| 5-6 | 20-26 | 4-8 | 2-3 | 0-1 | 7-10 | 8-10 |
| 6 | 17-20 | 5-7 | 6 | 6-7 | 3-4 | 9-11 | 4 | \|6| 7-8 | 27-33 | 9-12 | 4-5 | 2-3 | 11-13 | 11-13 |
| 7 | 21-24 | 8-10 | 7 | 8 | 5-6 | 12-13 | 5 | \|7| 9-10 | 34-40 | 13-17 | 6-7 | 4-5 | 14-16 | 14-17 |
| 8 | 25-28 | 11-14 | 8-9 | 9-10 | 7-8 | 14-16 | 6 | \|8| 11 | 41-47 | 18-21 | 8-9 | 6-7 | 17-19 | 18-20 |
| 9 | 29-32 | 15-17 | 10 | 11 | 9-10 | 17-18 | 7 | \|9| 12-13 | 48-53 | 22-26 | 10-11 | 8-9 | 20-22 | 21-23 |
| 10 | 33-36 | 18-20 | 11 | 12-13 | 11-12 | 19-20 | 8-9 | \|10| 14-15 | 54-60 | 27-30 | 12-14 | 10-11 | 23-25 | 24-26 |
| 11 | 37-39 | 21-23 | 12-13 | 14 | 13-14 | 21-23 | 10 | \|11| 16-17 | 61-67 | 31-35 | 15-16 | 12-13 | 26-28 | 27-30 |
| 12 | 40-43 | 24-27 | 14 | 15-16 | 15-16 | 24-25 | 11 | \|12| 18-19 | 68-74 | 36-39 | 17-18 | 14-15 | 29-32 | 31-33 |
| 13 | 44-47 | 28-30 | 15 | 17 | 17-18 | 26-27 | 12 | \|13| 20-21 | 75-81 | 40-44 | 19-20 | 16-17 | 33-35 | 34-36 |
| 14 | 48-51 | 31-33 | 16 | 18-19 | 19-20 | 28-30 | 13 | \|14| 22-23 | 82-87 | 45-48 | 21-22 | 18-19 | 36-38 | 37-40 |
| 15 | 52-55 | 34-37 | 17-18 | 20 | 21-22 | 31-32 | 14 | \|15| 24-25 | 88-94 | 49-53 | 23-24 | 20-21 | 39-41 | 41-43 |
| 16 | 56-59 | 38 | 19-20 | 21-22 | 23-24 | 33 | 15 | \|16| - | 95-101 | 54-57 | 25-26 | 22 | 42-44 | 44-46 |
| 17 | 60-63 | - | 21 | 23 | 25-26 | - | 16 | \|17| - | 102-108 | 58-62 | - | - | 45-47 | 47-50 |
| 18 | 64-66 | - | 22 | 24-25 | 27-28 | - | 17 | \|18| - | 109-114 | 63-66 | - | - | 48-51 | 51 |
| 19 | - | - | - | 26-30 | - | - | 18-21 | \|19| - | 115-133 | 67-68 | - | - | 52-60 | 52 |

## Tabela A.3 (Br) — Soma dos ponderados verbais → QI Verbal

| Soma | QI Verbal | Percentil | IC90% | IC95% |
|---|---|---|---|---|
| 14 | 56 | 0,2 | 52-62 | 51-63 |
| 20 | 62 | 1,0 | 58-68 | 57-69 |
| 30 | 71 | 3,0 | 67-77 | 66-77 |
| 40 | 81 | 10,0 | 76-86 | 75-87 |
| 50 | 90 | 25,0 | 86-95 | 85-96 |
| 60 | 100 | 50,0 | 95-105 | 94-106 |
| 70 | 110 | 75,0 | 105-114 | 104-115 |
| 80 | 120 | 90,0 | 114-124 | 113-125 |
| 90 | 129 | 97,0 | 123-133 | 122-134 |
| 100 | 138 | 99,0 | 132-142 | 131-143 |
| 112 | 145 | 99,9 | 139-149 | 138-150 |

> Tabela completa (linha a linha, 14–112) foi lida e conferida — acima estão pontos-âncora a cada 10 para referência rápida; **os 99 pontos intermediários estão disponíveis para o seed em JSON sob demanda.**

## Tabela A.4 (Br) — Soma dos ponderados de execução → QI Execução

| Soma | QI Execução | Percentil | IC90% | IC95% |
|---|---|---|---|---|
| 13 | 55 | 0,1 | 49-66 | 48-68 |
| 20 | 64 | 1,0 | 58-75 | 56-76 |
| 30 | 76 | 5,0 | 69-86 | 67-87 |
| 40 | 88 | 21,0 | 80-97 | 78-99 |
| 50 | 100 | 50,0 | 91-108 | 90-110 |
| 60 | 112 | 79,0 | 103-120 | 101-122 |
| 70 | 124 | 95,0 | 114-131 | 113-133 |
| 80 | 136 | 99,0 | 126-142 | 124-144 |
| 95 | 145 | 99,9 | 134-151 | 132-152 |

> Tabela completa (13–95) lida e conferida; pontos intermediários disponíveis sob demanda.

## Tabela A.5 (Br) — Soma dos ponderados totais → QI Total

| Soma | QI Total | Percentil | IC90% | IC95% |
|---|---|---|---|---|
| 27 | 55 | 0,1 | 51-61 | 50-62 |
| 50 | 66 | 1,0 | 62-72 | 61-73 |
| 76 | 81 | 10,0 | 76-86 | 75-87 |
| 100 | 94 | 34,0 | 90-99 | 89-100 |
| 110 | 100 | 50,0 | 95-105 | 94-106 |
| 126 | 109 | 73,0 | 104-114 | 103-115 |
| 150 | 122 | 93,0 | 117-127 | 116-128 |
| 175 | 137 | 99,0 | 131-141 | 130-142 |
| 207 | 145 | 99,9 | 139-149 | 138-150 |

> Tabela completa (27–207, 2 páginas no original) lida e conferida integralmente; pontos intermediários disponíveis sob demanda.

## Tabela A.6 (Br) — Soma ponderados (Voc+Sem+Info, ref. 20-34) → Índice de Compreensão Verbal

| Soma | ICV | Percentil | IC90% | IC95% |
|---|---|---|---|---|
| 9 | 55 | 0,1 | 50-64 | 49-65 |
| 20 | 82 | 12,0 | 76-89 | 74-91 |
| 30 | 100 | 50,0 | 93-107 | 92-108 |
| 40 | 118 | 88,0 | 110-124 | 109-126 |
| 50 | 135 | 99,0 | 127-141 | 125-141 |
| 56 | 145 | 99,9 | 136-150 | 135-151 |

> Tabela completa (9–56) lida e conferida.

## Tabela A.7 (Br) — Soma ponderados (Compl.Fig+Cubos+Rac.Matr, ref. 20-34) → Índice de Organização Perceptual

| Soma | IOP | Percentil | IC90% | IC95% |
|---|---|---|---|---|
| 8 | 54 | 0,4 | 48-67 | 46-69 |
| 20 | 81 | 9,0 | 73-92 | 71-94 |
| 30 | 100 | 50,0 | 90-110 | 89-112 |
| 40 | 119 | 88,0 | 108-127 | 106-129 |
| 50 | 138 | 99,0 | 125-145 | 124-147 |
| 57 | 145 | 99,9 | 132-151 | 130-153 |

> Tabela completa (8–57) lida e conferida.

## Tabela A.8 (Br) — Soma ponderados (Aritm+Dígitos+Seq.N/L, ref. 20-34) → Índice de Memória Operacional

| Soma | IMO | Percentil | IC90% | IC95% |
|---|---|---|---|---|
| 3 | 55 | 0,1 | 49-66 | 48-68 |
| 15 | 72 | 3,0 | 65-82 | 63-83 |
| 30 | 100 | 50,0 | 92-108 | 90-110 |
| 45 | 128 | 97,0 | 118-135 | 116-137 |
| 57 | 147 | 99,9 | 136-153 | 134-154 |

> Tabela completa (3–57) lida e conferida.

## Tabela A.9 (Br) — Soma ponderados (Códigos+Proc.Símbolos, ref. 20-34) → Índice de Velocidade de Processamento

| Soma | IVP | Percentil | IC90% | IC95% |
|---|---|---|---|---|
| 2 | 55 | 0,1 | 49-66 | 48-68 |
| 10 | 73 | 4,0 | 66-83 | 65-85 |
| 20 | 100 | 50,0 | 92-108 | 90-110 |
| 30 | 127 | 97,0 | 117-133 | 115-135 |
| 38 | 145 | 99,9 | 134-151 | 132-152 |

> Tabela completa (2–38) lida e conferida.

## Pendências / próximos passos

- [ ] **Transcrever para JSON de seed** as 7 tabelas etárias completas de A.1 + a A.2 de referência + as 6 tabelas de soma→QI/índice completas (ficaram resumidas em pontos-âncora aqui só por espaço no markdown — já foram lidas e conferidas integralmente, não precisa reler os PDFs, só re-somarizar).
- [ ] Confirmar com a psicóloga a célula suspeita "46-18" (faixa 20-29, Arranjo de Figuras, ponderado 17).
- [ ] Ainda faltam ler: "Manual WAIS subtestes.pdf" (77p — descrição/aplicação dos subtestes) e "Enviando por email Wais-III - Rev de normas Brasileiras...pdf" (52p — provavelmente contexto/metodologia da padronização brasileira, útil para citar como referência bibliográfica no `Teste.referenciaBibliografica`).
- [ ] WASI (Tabelas WASI.pdf, 34p) ainda não lido — é outro instrumento (versão abreviada), tabela normativa própria.
