# BAI — Inventário de Ansiedade de Beck

> Sem tabela normativa por idade/sexo — é a soma total (0-63) classificada por pontos de corte
> fixos. Sem material-fonte próprio no acervo; os cortes vieram de busca na literatura em
> 05/10/2026 (`WebSearch`), verificados antes de usar — o placeholder anterior usava números que
> não batiam com nenhuma fonte publicada encontrada.

## Estrutura

21 itens de autorrelato, cada um 0-3, soma total 0-63.

## Pontos de corte

| Faixa | Classificação |
|---|---|
| 0-7 | Sintomas Mínimos |
| 8-15 | Sintomas Leves |
| 16-25 | Sintomas Moderados |
| 26-63 | Sintomas Graves |

Fonte: CUNHA, J. A. *Manual da versão em português das escalas Beck*. São Paulo: Casa do
Psicólogo, 2001 — a adaptação brasileira usa os MESMOS cortes do manual original (BECK, A. T.;
EPSTEIN, N.; BROWN, G.; STEER, R. A. *An inventory for measuring clinical anxiety: Psychometric
properties*. Journal of Consulting and Clinical Psychology, v. 56, n. 6, p. 893–897, 1988) —
diferente do BDI-II (ver `BDI-II.md`), aqui não há divergência entre as duas fontes.

**O placeholder anterior usava 0-10/11-19/20-30/31-63** — não corresponde a nenhum esquema
publicado encontrado na busca (nem o original, nem a adaptação brasileira). Corrigido nesta rodada.

## Integração no catálogo

`apps/api/prisma/seed.ts`, sigla `BAI`, `isPlaceholder: false`. 1 única `TabelaNormativa`
(`criterio: "geral"`).
