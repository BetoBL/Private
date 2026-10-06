# SRS-2 — Escala de Responsividade Social, 2ª edição

> **FONTE ÚNICA, SEM CONFERÊNCIA CRUZADA.** Não temos o manual do SRS-2 em PDF no acervo
> (`Manuais/` não tem nenhum arquivo SRS-2) — a única fonte normativa é a aba `SRS2-Normas` do
> Excel legado da psicóloga (`Diego de Melo.xlsm`), transcrita em 05/10/2026 por
> `scripts/extrair-normas-srs2.mjs` para `SRS-2-tabelas.json`. Ver [[project_neurologic_riscos_normas]]
> (memória do usuário) — mesma ressalva do FDT.
>
> Referência do instrumento: CONSTANTINO, J. N.; GRUBER, C. P. *Social Responsiveness Scale,
> Second Edition (SRS-2): manual*. Torrance, CA: Western Psychological Services, 2012.

## Estrutura do instrumento — 5 formulários, não 5 faixas etárias

Diferente do FDT (1 teste, 9 faixas etárias da MESMA pergunta), o SRS-2 tem **5 questionários
diferentes**, cada um respondido por uma pessoa diferente sobre o paciente. Por isso cada
formulário virou um `Teste` SEPARADO no catálogo (`instrumento: "SRS-2"` compartilhado —
mesmo padrão já usado em BRIEF2-PAIS / SCARED-PAIS+AUTORRELATO):

| Sigla | Formulário | Respondente |
|---|---|---|
| SRS-2-PRE-ESCOLAR | Pré-Escolar (ambos os sexos) | pais/cuidadores |
| SRS-2-ESCOLAR-MASCULINO | Idade Escolar — Sexo Masculino | pais/professores |
| SRS-2-ESCOLAR-FEMININO | Idade Escolar — Sexo Feminino | pais/professores |
| SRS-2-AUTORRELATO | Adulto — Autorrelato | o próprio paciente |
| SRS-2-HETERORRELATO | Adulto — Heterorrelato | outra pessoa sobre o paciente |

Cada formulário tem **5 brutos de entrada** (4 subescalas de intervenção + 1 escala DSM-5) e
**2 escalas calculadas por soma**:

- Percepção Social, Cognição Social, Comunicação Social, Motivação Social (as "Subescalas de
  Intervenção" — 4 insumos independentes).
- Padrões Restritos e Repetitivos (RRB — 5º insumo independente, medido por itens próprios, não é
  soma de nada).
- **Comunicação e Interação Social (SCI)** = soma das 4 subescalas de intervenção — **calculada**,
  não lançada.
- **Pontuação SRS-2 Total** = soma das 4 subescalas + RRB — **calculada**, não lançada.

Confirmado numericamente na extração (não por suposição): o bruto máximo tabulado de SCI no
formulário Pré-Escolar (159) bate exatamente com a soma dos máximos das 4 subescalas
(24+36+66+33=159); o máximo de Total (195) bate com 159+36 (máximo do RRB). Por isso SCI e Total
são `camposDerivados` (soma) no motor, não campos de lançamento.

## Normas — tabela simples bruto → percentil + escore T (sem banda, diferente do FDT)

Cada subescala/escala tem sua própria tabela, uma linha por bruto (0, 1, 2, ...), com percentil e
escore T dados diretamente — mesmo formato do BRIEF2, mais simples que o FDT (que agrupa em
faixas de percentil). O bruto para cada campo é limitado pelo teto psicométrico da subescala (nº
de itens × pontuação máxima por item) — diferente do FDT, aqui NÃO fica em aberto: o último bruto
tabulado é o teto real, não um corte de amostra.

**Achados da extração, documentados aqui por não serem auto-evidentes:**

- **Formulário Autorrelato tem linhas fora de ordem na planilha dela** (ex.: bruto 1 impresso
  antes do 0; 23 antes do 22, em várias subescalas). O extrator reordena por bruto antes de validar
  contiguidade — confirmado que, uma vez reordenado, a sequência fica completa sem buraco nem
  duplicata. Não é erro de leitura, é a ordem física das linhas na planilha dela.
- **SCI e Total saturam num teto universal de 195** (teórico de todos os 65 itens do SRS-2
  completo) em todos os 5 formulários — bem além do teto real de cada formulário individual. A
  partir de um certo bruto (ex.: ~122 no formulário Idade Escolar Masculino), percentil e escore T
  simplesmente se repetem até a linha 195. Isso é inofensivo (nenhum paciente real atinge esse
  bruto nem precisa — o valor já está no teto da escala desde muito antes), mas explica por que o
  "máximo tabulado" de SCI/Total não bate exatamente com a soma dos máximos das subescalas que os
  compõem nos formulários Idade Escolar — a tabela deles continua bem além do que a soma algum dia
  alcançaria.
- **Idade Escolar Masculino/Feminino**: a soma dos máximos das 4 subescalas + RRB (196 e 198) passa
  1-3 pontos do teto tabulado (195). Na prática, só o paciente que atingir o bruto MÁXIMO possível
  simultaneamente em TODAS as 5 subescalas cairia nesse ponto cego (fora de qualquer faixa, sem
  classificação) — cenário extremo e improvável, mas registrado aqui para não ser redescoberto como
  "bug" depois.

## Classificação por escore T

Mesmos pontos de corte já usados no placeholder anterior (preservados, não são invenção desta
transcrição): T≤59 "Dentro dos limites normais", 60-65 "Nível Leve", 66-75 "Nível Moderado", ≥76
"Nível Severo". Aplicada a CADA subescala/escala individualmente (`classificacaoDoEscoreT` em
`srs2-normas.ts`), não só ao Total.

## Arquivos de dados

- `docs/testes/SRS-2-tabelas.json` — as tabelas dos 5 formulários, geradas por
  `scripts/extrair-normas-srs2.mjs` (não editar à mão; regerar a partir da planilha se algo mudar).
- `apps/api/prisma/srs2-normas.ts` — lê o JSON e expõe `SRS2_FORMULARIOS` (já em `FaixaConversao[]`)
  e `SRS2_CAMPOS_DERIVADOS` (a soma de SCI/Total).

## Integração no catálogo

Seed em `apps/api/prisma/seed.ts`: 5 `Teste` (um por formulário), cada um com **1 única**
`TabelaNormativa` (`criterio: "unico"` — sem estratificação por idade dentro do formulário; a
"idade" já está implícita em qual formulário o clínico escolhe aplicar). 5 campos de entrada;
Comunicação e Interação Social / Pontuação Total calculadas via `camposDerivados` (soma,
`campoValor: "valorBruto"`, `exigeTodasFontes: true` — mesma extensão do motor feita para o FDT,
sem mudança nenhuma nela). Verificação ponta a ponta em `scripts/verificar-srs2-motor.ts`.

## Pendências / próximos passos

- [ ] **Sem manual em PDF**: se o acervo ganhar o manual do SRS-2 (Constantino & Gruber, 2012),
      cruzar `SRS-2-tabelas.json` contra ele é o próximo passo natural.
- [ ] Confirmar com a psicóloga se os formulários Idade Escolar Masculino/Feminino têm REALMENTE
      o ponto cego de 1-3 brutos acima do teto tabulado (195) que a extração encontrou, ou se é
      uma omissão dela ao montar a planilha.
