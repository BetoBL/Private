# SCARED — Screen for Child Anxiety Related Emotional Disorders

> Extraído de material fornecido pela psicóloga (uso legítimo, restrito à clínica). **Não redistribuir o PDF de origem**; abaixo só os dados estruturados necessários para o motor de correção.
> Fonte: "SCARED - Protocolo.pdf", 5 páginas, todas lidas. Documento é um **protocolo de aplicação/pontuação** (formulário + folha de normas), não um manual longo — leitura rápida e completa.
> Qualidade de digitalização: **excelente** (PDF gerado digitalmente, não escaneado — sem nenhuma ambiguidade).
> Referência bibliográfica (citar em `Teste.referenciaBibliografica`): Isolan, L., Salum, G. A., Osowski, A. T., Amaro, E., & Manfro, G. G. (2011). Psychometric properties of the Screen for Child Anxiety Related Emotional Disorders (SCARED) in Brazilian children and adolescents. *Journal of Anxiety Disorders, 25*, 741–748. (Instrumento original: Birmaher et al., 1999, JAACAP.)

## Estrutura do instrumento

Escala de rastreio de ansiedade, **41 itens**, escala Likert 0–2 (0=nunca/raramente, 1=algumas vezes, 2=frequentemente). **Duas versões paralelas** com os mesmos itens (texto ajustado em 1ª/3ª pessoa):
- **Pais/Cuidadores** — versão informante.
- **Autorrelato** — criança/adolescente responde sobre si, **9 a 18 anos**.

5 subescalas + escore total:

| Subescala | Sigla | Itens | Nº itens | Escore bruto máx. |
|---|---|---|---|---|
| Pânico / Sintomas Somáticos | P/SS | 1, 6, 9, 12, 15, 18, 19, 22, 24, 27, 30, 34, 38 | 13 | 26 |
| Ansiedade Generalizada | A.G. | 5, 7, 14, 21, 23, 28, 33, 35, 37 | 9 | 18 |
| Ansiedade de Separação | A.Se. | 4, 8, 13, 16, 20, 25, 29, 31 | 8 | 16 |
| Fobia Social | F.Sc | 3, 10, 26, 32, 39, 40, 41 | 7 | 14 |
| Evitação Escolar | E.E. | 2, 11, 17, 36 | 4 | 8 |
| **TOTAL** | — | todos | 41 | 82 |

## Correção — duas lógicas diferentes por versão (importante)

### Versão Pais/Cuidadores: percentual + ponto de corte fixo
`X% = (escore bruto da subescala × 100) / escore bruto máximo da subescala`

Classificação = comparação direta contra **nota de corte fixa** (mesma nota de corte, independente de idade/sexo):

| Subescala | Nota de corte (escore bruto) |
|---|---|
| Pânico/Sintomas Somáticos | ≥ 7 → clínico |
| Ansiedade Generalizada | ≥ 9 → clínico |
| Ansiedade de Separação | ≥ 5 → clínico |
| Fobia Social | ≥ 8 → clínico |
| Evitação Escolar | ≥ 3 → clínico |
| TOTAL | ≥ 25 → clínico |

(Notas de corte vêm do estudo original de Birmaher et al., 1999 — a folha as reproduz como "usar notas de corte" para a versão de pais.)

### Versão Autorrelato: Z-score + percentil, por grupo normativo (idade × sexo)
Aqui **não** se usa ponto de corte fixo — o protocolo pede Escore Bruto → Média/DP do grupo normativo → Z-score → Percentil → Classificação (bandas do gráfico: <10, 10–25, 25–75, 75–90, >90 percentil).

**Tabela de normas brasileiras (Porto Alegre-RS, N=2410, Isolan et al. 2011)** — média ± desvio padrão do escore bruto, por subescala, cruzando **grupo etário** (Criança / Adolescente) × **sexo**:

| Subescala | Menino (criança) | Menina (criança) | Menino (adolesc.) | Menina (adolesc.) |
|---|---|---|---|---|
| Total | 22,60 ± 10,45 | 26,55 ± 12,21 | 19,73 ± 10,41 | 25,69 ± 12,17 |
| Pânico/Somático | 4,16 ± 3,80 | 5,36 ± 4,69 | 3,29 ± 3,40 | 5,34 ± 4,58 |
| Ansiedade Generalizada | 7,24 ± 3,57 | 8,03 ± 3,70 | 7,51 ± 3,73 | 8,87 ± 3,78 |
| Ansiedade de Separação | 4,98 ± 2,65 | 6,03 ± 3,22 | 3,55 ± 2,36 | 4,78 ± 2,86 |
| Fobia Social | 4,98 ± 2,83 | 5,74 ± 2,92 | 4,43 ± 2,95 | 5,46 ± 3,20 |
| Evitação Escolar | 1,24 ± 1,19 | 1,39 ± 1,30 | 0,94 ± 1,14 | 1,24 ± 1,21 |

> O protocolo não define explicitamente o corte etário Criança/Adolescente em anos (o estudo de origem tipicamente usa ~8–12 vs. 13–18, mas **isso não está escrito no PDF fornecido** — confirmar com a psicóloga ou localizar o artigo completo do Isolan et al. 2011 antes de codificar a faixa exata no `TabelaNormativa`). Cálculo: `Z = (escoreBruto - média) / DP`; percentil via distribuição normal padrão a partir do Z.

Tabela adicional (Table 1, índices de ajuste do modelo fatorial) foi capturada na imagem mas não tem uso prático para o motor de cálculo — omitida aqui.

## Pendências / próximos passos

- [ ] Confirmar com a psicóloga a faixa etária exata de corte "Criança" vs. "Adolescente" usada nas normas (não especificada no protocolo).
- [ ] Confirmar se ela usa a versão Pais, Autorrelato, ou ambas na prática (a versão Pais usa lógica de correção totalmente diferente — corte fixo, não Z-score/percentil — então a UI de lançamento precisa diferenciar).
- [ ] Este documento já está pronto para virar seed de `TabelaNormativa` (critério `"idade+sexo"` para a versão autorrelato; regra fixa para a versão pais, talvez nem precise de `TabelaNormativa`, só de uma constante em `algoritmoCorrecao`).
