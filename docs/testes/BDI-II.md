# BDI-II — Inventário de Depressão de Beck, 2ª ed.

> Sem tabela normativa por idade/sexo — é a soma total (0-63) classificada por pontos de corte
> fixos. Sem material-fonte próprio no acervo; os cortes vieram de busca na literatura em
> 05/10/2026 (`WebSearch`), verificados antes de usar.

## Estrutura

21 itens de autorrelato, cada um 0-3, soma total 0-63.

## Pontos de corte — adaptação brasileira ≠ manual americano original

| Faixa (Brasil — usada) | Faixa (EUA — não usada) | Classificação |
|---|---|---|
| 0-11 | 0-13 | Sintomas Mínimos |
| 12-19 | 14-19 | Sintomas Leves |
| 20-35 | 20-28 | Sintomas Moderados |
| 36-63 | 29-63 | Sintomas Graves |

**Achado da busca, decisão do usuário (05/10/2026): usar a coluna Brasil.** A adaptação brasileira
(CUNHA, J. A. *Manual da versão em português das escalas Beck*. São Paulo: Casa do Psicólogo,
2001 — mesma editora do WAIS-III/WISC-IV já usados no catálogo) usa pontos de corte DIFERENTES do
manual americano original (BECK, A. T.; STEER, R. A.; BROWN, G. K. *Manual for the Beck Depression
Inventory-II*. San Antonio, TX: Psychological Corporation, 1996) — a faixa "Moderado" é bem mais
larga (20-35 contra 20-28) e "Grave" só começa em 36 (contra 29). Consistente com a preferência já
estabelecida no projeto por norma brasileira sempre que ela existir (ver WAIS-III.md, WISC-IV.md).

**O placeholder anterior usava os cortes AMERICANOS** (0-13/14-19/20-28/29-63) — trocado nesta
rodada pelos da adaptação brasileira.

## Integração no catálogo

`apps/api/prisma/seed.ts`, sigla `BDI-II`, `isPlaceholder: false`. 1 única `TabelaNormativa`
(`criterio: "geral"`).
