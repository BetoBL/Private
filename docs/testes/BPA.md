# BPA — Bateria Psicológica para Avaliação da Atenção

> Extraído de material fornecido pela psicóloga (uso legítimo, restrito à clínica). **Não redistribuir o PDF de origem** — só os dados normativos estruturados abaixo (compilações factuais/números, não texto autoral).
> Fonte: "bpa manual (1).pdf" (Fabián Javier Marín Rueda — capítulo sobre a BPA, provavelmente extraído de uma coletânea/livro maior sobre testes de atenção. Numeração impressa 60-71). 12 páginas físicas, todas lidas.
> Qualidade de digitalização: boa, texto nítido, todas as tabelas legíveis sem ambiguidade.
> **Nota de escopo**: este arquivo é um recorte que começa direto em "Normas de Aplicação" (p.60) — não inclui a seção anterior de descrição/fundamentação teórica do teste nem o conteúdo visual dos estímulos de cada subteste (só a lógica de aplicação/correção e as tabelas normativas completas, que é o que importa para o motor de cálculo).

## Estrutura do instrumento

Bateria de **3 testes de atenção** (papel-e-lápis, tarefas de cancelamento/marcação de figuras), aplicável dos **6 anos até 80+ anos**, de ambos os sexos e diferentes escolaridades. Aplicação individual ou coletiva (até 10 crianças por sala, recomendado 2 aplicadores nesse caso).

| Teste | Sigla | Tempo de aplicação | Mede |
|---|---|---|---|
| Atenção Concentrada | AC | 2 minutos | capacidade de manter o foco numa tarefa monótona/repetitiva |
| Atenção Dividida | AD | 4 minutos | capacidade de atender a múltiplos estímulos simultaneamente |
| Atenção Alternada | AA | 2 minutos e 30 segundos | capacidade de alternar o foco entre diferentes critérios/tarefas |

**Ordem de aplicação obrigatória**: AC → AD → AA (nessa ordem sempre, pois foi assim que os dados normativos foram coletados — alterar a ordem invalida a comparação com a norma). Material: manual, folhas de resposta (uma por subteste: AC, AD, AA), caneta preta/azul para o examinando, caneta vermelha para correção, cronômetro, **crivos de correção** (gabarito vazado, um por subteste) e folha de interpretação.

Cada subteste tem uma fase de treino (para garantir que o examinando entendeu a tarefa) antes da fase de resposta cronometrada.

## Correção — fórmula (`algoritmoCorrecao`)

A correção usa um **crivo** (gabarito com os quadrados que indicam as figuras que deveriam ter sido marcadas), sobreposto à folha de resposta:

1. **Acertos (A)** = figuras marcadas que estão dentro dos quadrados do crivo.
2. **Erros (E)** = figuras marcadas que estão fora dos quadrados do crivo.
3. **Omissões (O)** = figuras que deveriam ter sido marcadas e não foram — contadas **só até a última figura que o examinando alcançou** dentro do tempo (não até o fim da folha).

Fórmula de pontos por subteste:
```
P = A − (E + O)
```

Atenção Geral (medida combinada):
```
Atenção Geral = P(AC) + P(AD) + P(AA)
```

> Cuidado ao implementar: erros e omissões são somados **uma vez só** antes de subtrair dos acertos — não descontar as omissões duas vezes (erro comum de implementação, citado explicitamente no manual). Quando a pontuação bruta cair exatamente entre dois percentis da tabela normativa, usar o **percentil menor** (regra de arredondamento conservadora).

## Normas — dois critérios disponíveis (`TabelaNormativa.criterio`)

Amostra de padronização: N=1.759, coletada em 2011. Duas variáveis normativas oferecidas (a validação de critério mostrou ambas relevantes): **idade** (6 faixas) e **escolaridade** (5 categorias) — usar o critério mais adequado ao caso (a tabela por idade é a mais geral-purpose; a por escolaridade é útil quando escolaridade diverge muito do esperado para a idade, ex. EJA).

Classificação por percentil (igual nas 8 tabelas): 1-20=Inferior, 25-40=Médio Inferior, 50=Médio, 60-75=Médio Superior, 80-99=Superior. Pontuação satura em -120 a 120 nos subtestes individuais (Atenção Geral não satura no mesmo valor, ver tabelas).

### Tabela 23 — Atenção Concentrada (AC), por faixa etária

| Percentil | 6-10 anos | 11-17 anos | 18-25 anos | 26-30 anos | 31-50 anos | 51+ anos | Todas idades |
|---|---|---|---|---|---|---|---|
| 1 | -15 | 15 | 51 | 32 | 15 | -9 | 15 |
| 10 | 22 | 40 | 70 | 68 | 47 | 32 | 43 |
| 20 | 34 | 50 | 81 | 77 | 66 | 45 | 59 |
| 25 | 36 | 55 | 84 | 80 | 72 | 48 | 67 |
| 30 | 37 | 59 | 87 | 83 | 77 | 52 | 71 |
| 40 | 41 | 69 | 92 | 88 | 84 | 61 | 81 |
| 50 | 44 | 74 | 97 | 95 | 91 | 70 | 87 |
| 60 | 48 | 80 | 103 | 99 | 98 | 79 | 94 |
| 70 | 52 | 88 | 107 | 105 | 104 | 86 | 102 |
| 75 | 55 | 93 | 110 | 107 | 106 | 89 | 104 |
| 80 | 59 | 96 | 114 | 110 | 109 | 94 | 107 |
| 90 | 66 | 108 | 118 | 115 | 116 | 107 | 116 |
| 99 | 108 | 120 | 120 | 120 | 120 | 120 | 120 |
| Média | 45,22 | 73,41 | 95,42 | 91,85 | 86,21 | 68,57 | 82,90 |
| DP | 18,60 | 25,41 | 17,92 | 19,09 | 26,31 | 29,32 | 26,93 |
| Mín | -18 | -3 | 4 | 28 | -29 | -86 | -86 |
| Máx | 112 | 120 | 120 | 120 | 120 | 120 | 120 |
| N | 115 | 235 | 591 | 196 | 358 | 264 | 1759 |

### Tabela 24 — Atenção Dividida (AD), por faixa etária

| Percentil | 6-10 anos | 11-17 anos | 18-25 anos | 26-30 anos | 31-50 anos | 51+ anos | Todas idades |
|---|---|---|---|---|---|---|---|
| 1 | -69 | -46 | 26 | -3 | -48 | -64 | -37 |
| 10 | 6 | 12 | 58 | 39 | 23 | -8 | 21 |
| 20 | 19 | 32 | 70 | 52 | 38 | 12 | 37 |
| 25 | 22 | 38 | 73 | 59 | 44 | 16 | 44 |
| 30 | 27 | 42 | 76 | 62 | 50 | 23 | 50 |
| 40 | 32 | 47 | 82 | 68 | 60 | 31 | 61 |
| 50 | 36 | 54 | 87 | 74 | 67 | 40 | 70 |
| 60 | 42 | 62 | 94 | 80 | 74 | 46 | 78 |
| 70 | 51 | 72 | 98 | 90 | 83 | 59 | 86 |
| 75 | 53 | 77 | 100 | 92 | 86 | 63 | 90 |
| 80 | 56 | 80 | 104 | 94 | 90 | 68 | 94 |
| 90 | 64 | 94 | 110 | 103 | 98 | 80 | 103 |
| 99 | 95 | 113 | 118 | 117 | 116 | 108 | 117 |
| Média | 35,48 | 52,74 | 85,27 | 72,49 | 62,54 | 38,06 | 64,54 |
| DP | 26,33 | 33,14 | 20,91 | 25,22 | 32,12 | 34,38 | 33,56 |
| Mín | -74 | -69 | -15 | -20 | -103 | -91 | -103 |
| Máx | 96 | 114 | 120 | 120 | 118 | 115 | 120 |
| N | 115 | 235 | 591 | 196 | 358 | 264 | 1759 |

### Tabela 25 — Atenção Alternada (AA), por faixa etária

| Percentil | 6-10 anos | 11-17 anos | 18-25 anos | 26-30 anos | 31-50 anos | 51+ anos | Todas idades |
|---|---|---|---|---|---|---|---|
| 1 | 0 | -27 | 47 | 29 | -1 | -60 | 0 |
| 10 | 25 | 39 | 75 | 62 | 40 | 23 | 40 |
| 20 | 31 | 48 | 86 | 72 | 58 | 38 | 56 |
| 25 | 36 | 53 | 91 | 77 | 64 | 41 | 63 |
| 30 | 37 | 58 | 95 | 81 | 71 | 47 | 69 |
| 40 | 40 | 65 | 103 | 87 | 80 | 56 | 79 |
| 50 | 44 | 73 | 108 | 94 | 87 | 63 | 88 |
| 60 | 47 | 83 | 112 | 98 | 95 | 71 | 96 |
| 70 | 51 | 90 | 116 | 104 | 101 | 80 | 105 |
| 75 | 56 | 95 | 117 | 108 | 105 | 84 | 109 |
| 80 | 58 | 100 | 118 | 111 | 108 | 88 | 112 |
| 90 | 64 | 108 | 120 | 116 | 114 | 98 | 118 |
| 99 | 109 | 120 | 120 | 120 | 120 | 119 | 120 |
| Média | 44,34 | 72,63 | 102,12 | 90,30 | 81,99 | 60,75 | 82,78 |
| DP | 16,67 | 27,58 | 18,07 | 21,09 | 28,25 | 33,51 | 30,39 |
| Mín | 0 | -39 | 5 | 20 | -46 | -119 | -119 |
| Máx | 113 | 120 | 120 | 120 | 120 | 120 | 120 |
| N | 115 | 235 | 591 | 196 | 358 | 264 | 1759 |

### Tabela 26 — Atenção Geral (AC+AD+AA), por faixa etária

| Percentil | 6-10 anos | 11-17 anos | 18-25 anos | 26-30 anos | 31-50 anos | 51+ anos | Todas idades |
|---|---|---|---|---|---|---|---|
| 1 | -41 | -2 | 158 | 106 | 11 | -80 | 8 |
| 5 | 44 | 83 | 206 | 164 | 83 | 30 | 86 |
| 10 | 66 | 111 | 226 | 182 | 111 | 70 | 115 |
| 15 | 76 | 129 | 235 | 199 | 143 | 87 | 138 |
| 20 | 91 | 146 | 247 | 211 | 175 | 104 | 160 |
| 25 | 100 | 156 | 255 | 222 | 184 | 113 | 178 |
| 30 | 109 | 165 | 263 | 227 | 201 | 124 | 197 |
| 35 | 115 | 177 | 270 | 235 | 219 | 134 | 215 |
| 40 | 120 | 187 | 276 | 243 | 231 | 153 | 227 |
| 45 | 123 | 195 | 283 | 251 | 239 | 161 | 236 |
| 50 | 127 | 204 | 288 | 262 | 247 | 171 | 247 |
| 55 | 133 | 213 | 294 | 267 | 255 | 179 | 256 |
| 60 | 136 | 225 | 299 | 274 | 265 | 194 | 265 |
| 65 | 141 | 232 | 305 | 280 | 270 | 210 | 273 |
| 70 | 147 | 241 | 310 | 289 | 278 | 223 | 283 |
| 75 | 150 | 248 | 316 | 296 | 288 | 234 | 291 |
| 80 | 160 | 256 | 322 | 304 | 297 | 244 | 301 |
| 85 | 166 | 266 | 330 | 309 | 305 | 254 | 310 |
| 90 | 180 | 279 | 336 | 318 | 316 | 266 | 320 |
| 95 | 207 | 295 | 342 | 337 | 330 | 280 | 334 |
| 99 | 260 | 324 | 354 | 347 | 345 | 323 | 347 |
| Média | 125,03 | 198,79 | 282,81 | 254,64 | 230,75 | 167,38 | 230,25 |
| DP | 48,15 | 66,96 | 43,60 | 53,25 | 76,71 | 82,61 | 79,74 |
| Mín | -48 | -84 | 119 | 69 | -10 | -209 | -209 |
| Máx | 263 | 331 | 356 | 355 | 351 | 349 | 356 |
| N | 115 | 235 | 591 | 196 | 358 | 264 | 1759 |

### Tabela 27 — Atenção Concentrada (AC), por escolaridade

| Percentil | EJA | Fund. Regular | Fund. Adultos | Ensino Médio | Ensino Superior |
|---|---|---|---|---|---|
| 1 | -8 | 9 | 42 | 28 | 49 |
| 10 | 22 | 34 | 58 | 61 | 71 |
| 20 | 33 | 40 | 63 | 71 | 81 |
| 25 | 36 | 43 | 66 | 76 | 84 |
| 30 | 38 | 45 | 70 | 80 | 87 |
| 40 | 45 | 53 | 78 | 85 | 93 |
| 50 | 50 | 60 | 84 | 90 | 98 |
| 60 | 56 | 69 | 88 | 96 | 104 |
| 70 | 68 | 78 | 93 | 102 | 107 |
| 75 | 73 | 82 | 98 | 104 | 111 |
| 80 | 79 | 88 | 105 | 108 | 114 |
| 90 | 88 | 101 | 115 | 115 | 118 |
| 99 | 106 | 120 | 120 | 120 | 120 |
| Média | 53,07 | 63,30 | 83,28 | 88,51 | 95,84 |
| DP | 24,89 | 26,95 | 21,04 | 20,89 | 18,43 |
| Mín | -10 | -18 | 42 | 4 | -29 |
| Máx | 110 | 120 | 120 | 120 | 120 |
| N | 194 | 283 | 98 | 373 | 758 |

### Tabela 28 — Atenção Dividida (AD), por escolaridade

| Percentil | EJA | Fund. Regular | Fund. Adultos | Ensino Médio | Ensino Superior |
|---|---|---|---|---|---|
| 1 | -66 | -50 | -26 | -34 | -3 |
| 10 | -12 | 9 | 20 | 26 | 47 |
| 20 | 12 | 23 | 36 | 44 | 62 |
| 25 | 16 | 28 | 43 | 48 | 68 |
| 30 | 23 | 33 | 47 | 57 | 72 |
| 40 | 31 | 40 | 55 | 64 | 78 |
| 50 | 38 | 46 | 60 | 72 | 84 |
| 60 | 44 | 52 | 66 | 78 | 90 |
| 70 | 58 | 58 | 74 | 85 | 96 |
| 75 | 63 | 62 | 76 | 87 | 98 |
| 80 | 70 | 68 | 79 | 92 | 102 |
| 90 | 88 | 83 | 93 | 100 | 108 |
| 99 | 106 | 110 | 118 | 115 | 118 |
| Média | 37,56 | 44,34 | 58,11 | 65,96 | 80,58 |
| DP | 36,81 | 30,94 | 26,97 | 30,52 | 24,97 |
| Mín | -91 | -74 | -26 | -52 | -103 |
| Máx | 112 | 114 | 118 | 120 | 120 |
| N | 194 | 283 | 98 | 373 | 758 |

### Tabela 29 — Atenção Alternada (AA), por escolaridade

| Percentil | EJA | Fund. Regular | Fund. Adultos | Ensino Médio | Ensino Superior |
|---|---|---|---|---|---|
| 1 | -46 | -6 | 36 | 23 | 47 |
| 10 | 10 | 32 | 54 | 51 | 73 |
| 20 | 23 | 38 | 58 | 64 | 84 |
| 25 | 28 | 41 | 61 | 69 | 90 |
| 30 | 33 | 44 | 63 | 72 | 94 |
| 40 | 39 | 48 | 69 | 80 | 99 |
| 50 | 51 | 56 | 73 | 86 | 106 |
| 60 | 64 | 61 | 77 | 91 | 111 |
| 70 | 78 | 69 | 81 | 99 | 114 |
| 75 | 85 | 75 | 84 | 102 | 116 |
| 80 | 92 | 82 | 88 | 107 | 118 |
| 90 | 104 | 98 | 98 | 114 | 120 |
| 99 | 116 | 116 | 118 | 120 | 120 |
| Média | 53,88 | 58,63 | 73,70 | 83,63 | 100,60 |
| DP | 36,36 | 25,37 | 17,50 | 25,27 | 18,16 |
| Mín | -47 | -39 | 36 | -119 | 32 |
| Máx | 117 | 120 | 118 | 120 | 120 |
| N | 194 | 283 | 98 | 373 | 758 |

### Tabela 30 — Atenção Geral, por escolaridade

| Percentil | EJA | Fund. Regular | Fund. Adultos | Ensino Médio | Ensino Superior |
|---|---|---|---|---|---|
| 1 | -73 | -9 | 73 | 67 | 125 |
| 5 | 6 | 58 | 123 | 119 | 186 |
| 10 | 31 | 84 | 153 | 145 | 216 |
| 15 | 57 | 103 | 168 | 169 | 228 |
| 20 | 75 | 114 | 173 | 184 | 238 |
| 25 | 88 | 122 | 177 | 206 | 249 |
| 30 | 99 | 130 | 181 | 218 | 258 |
| 35 | 108 | 138 | 191 | 227 | 267 |
| 40 | 115 | 145 | 197 | 235 | 272 |
| 45 | 125 | 153 | 202 | 243 | 277 |
| 50 | 137 | 159 | 209 | 248 | 284 |
| 55 | 151 | 169 | 223 | 253 | 290 |
| 60 | 165 | 185 | 232 | 261 | 296 |
| 65 | 177 | 194 | 234 | 266 | 302 |
| 70 | 189 | 205 | 238 | 275 | 307 |
| 75 | 214 | 214 | 250 | 285 | 312 |
| 80 | 234 | 228 | 264 | 290 | 319 |
| 85 | 246 | 241 | 273 | 302 | 327 |
| 90 | 265 | 256 | 291 | 312 | 335 |
| 95 | 282 | 276 | 324 | 324 | 342 |
| 99 | 314 | 315 | 342 | 342 | 354 |
| Média | 144,39 | 166,28 | 215,09 | 238,10 | 277,02 |
| DP | 85,58 | 66,98 | 55,15 | 62,81 | 48,66 |
| Mín | -93 | -84 | 73 | -38 | 30 |
| Máx | 320 | 331 | 342 | 350 | 356 |
| N | 194 | 283 | 98 | 373 | 758 |

## Pendências / próximos passos

- [ ] Este arquivo é um recorte (começa em "Normas de Aplicação") — não tem a seção de descrição/fundamentação teórica nem o conteúdo visual dos estímulos de cada subteste (o que a folha de resposta mostra, quais figuras são alvo). Perguntar à psicóloga se ela tem o manual completo (capítulos anteriores) ou as folhas de resposta/crivos físicos, necessários para desenhar a tela de aplicação.
- [ ] Este documento já está pronto para virar seed de `TabelaNormativa` — duas variantes de critério (`"idade"` com 6 faixas, `"escolaridade"` com 5 categorias), ambas com as 4 medidas (AC, AD, AA, Atenção Geral) completas.
- [ ] Confirmar com a psicóloga qual critério (idade vs. escolaridade) ela usa por padrão na prática clínica dela, para decidir qual aparece primeiro na UI.
