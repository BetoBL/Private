# FDT — Teste dos Cinco Dígitos (Five Digit Test)

> **FONTE ÚNICA, SEM CONFERÊNCIA CRUZADA.** Diferente do BRIEF2/WISC-IV, não temos o manual do FDT
> em PDF no acervo (`Manuais/` não tem nenhum arquivo FDT) — a única fonte normativa disponível é a
> aba `FDT - NORMAS` do Excel legado da psicóloga (`Diego de Melo.xlsm`), transcrita em 05/10/2026
> por `scripts/extrair-normas-fdt.mjs` para `FDT-tabelas.json`. Ver [[project_neurologic_riscos_normas]]
> (memória do usuário) — "verificado" aqui quer dizer só "lido certo da planilha dela", não
> "conferido contra o manual impresso" como BRIEF2/WISC-IV.
>
> Referência do instrumento (não a fonte dos dados): SEDÓ, M. A. *Five Digit Test (FDT): manual*.
> Madrid: TEA Ediciones, 2007.

## Estrutura do instrumento

4 etapas, todas com dígitos impressos em folha (não itens falados):

1. **Leitura** — ler os dígitos em voz alta o mais rápido possível.
2. **Contagem** — contar quantos símbolos há em cada linha (não ler o valor do dígito).
3. **Escolha** — misto de Leitura/Contagem por linha; mede **inibição**.
4. **Alternância** — alterna o critério dentro da mesma linha; mede **flexibilidade cognitiva**.

Cada etapa produz **tempo (segundos)** e **nº de erros**. Duas medidas interpretativas adicionais
são calculadas por SUBTRAÇÃO do tempo bruto (não têm contagem de erro própria):

```
Inibição      = tempo(Escolha) - tempo(Contagem)
Flexibilidade = tempo(Alternância) - tempo(Escolha)
```

A lógica: Escolha soma, ao tempo-base de ler/contar, o custo de **inibir** a leitura automática
quando é preciso contar; Alternância soma, ao tempo de Escolha, o custo de **alternar** o critério.
Subtrair isola esse custo extra.

## Normas — 9 faixas etárias, sem estratificação por sexo

| Faixa | Rótulo | N |
|---|---|---|
| 6-8 anos | Tabela 6.3 | 44 |
| 9-10 anos | Tabela 6.4 | 129 |
| 11-12 anos | Tabela 6.5 | 59 |
| 13-15 anos | Tabela 6.6 | 46 |
| 16-18 anos | Tabela 6.7 | 44 |
| 19-34 anos | Tabela 6.8 | 349 |
| 35-59 anos | Tabela 6.9 | 261 |
| 60-75 anos | Tabela 6.10 | 146 |
| 76+ anos | Tabela 6.11 | 55 |

(Existe também a Tabela 6.2, estatística descritiva da amostra inteira N=1033 — média/DP/percentis
5/25/50/75/95 só, sem matriz de classificação por bruto. Não usada no catálogo: não serve para
classificar um paciente individual, só para checagem de sanidade das 9 faixas.)

Cada faixa classifica, **cada um dos 6 tempos** (Leitura/Contagem/Escolha/Alternância/Inibição/
Flexibilidade) e **cada um dos 4 erros** (Leitura/Contagem/Escolha/Alternância), numa tabela
bruto → faixa de percentil própria — 10 tabelas por faixa etária, 90 no total.

### Layout da planilha de origem (documentado para quem for reconferir)

Cada faixa etária é um bloco de colunas, com duas seções empilhadas nas MESMAS colunas:

- **TEMPO**: o rótulo de percentil fica na 1ª coluna do PRÓPRIO bloco, repetido em toda linha.
- **ERROS**: o rótulo de percentil fica SÓ na coluna 0 da aba inteira, compartilhada por todas as
  faixas etárias ao mesmo tempo (os blocos de ERROS não repetem o rótulo na própria coluna). Essa
  assimetria é real na planilha, não bug de leitura — documentada em `extrair-normas-fdt.mjs`.

Em cada seção, o bruto (segundos ou nº de erros) é literalmente o valor da célula, subindo 1 a 1 a
cada linha; um subteste fica em branco nas linhas em que seu próprio valor já passou da faixa de
percentil atual (outro subteste mais lento ainda está subindo nessa faixa). Por subteste, a
sequência de valores não-vazios é sempre contígua (sem buraco), mesmo que a linha da planilha pule.
Um `"x"` manual marca o fim dos dados de cada coluna — tratado como fim-de-leitura, não como erro.

**11 rótulos de percentil possíveis** (decisão do usuário, 05/10/2026: manter os 11 como rótulos
próprios, não mesclar o valor exato do percentil na faixa aberta vizinha):
`>95`, `95` (exato), `75-95`, `75` (exato), `50-75`, `50` (exato), `25-50`, `25` (exato), `5-25`,
`5` (exato), `<5`.

Um `classificacao` descritivo (Muito Superior/Superior/Médio/Inferior/Muito Baixo) é gerado a
partir desses 11 rótulos só para a cor/largura da barra do laudo (`ResultadoResumo.tsx` lê
`classificacao`, não `percentil`) — o rótulo de percentil exato continua disponível à parte, sem
perda de granularidade. Ver `classificacaoDoPercentil` em `fdt-normas.ts` para a regra exata de
quais dos 2 pontos de fronteira que tocam uma cauda aberta (95 e 5) entram na categoria mais
extrema.

**Anomalia encontrada na extração, não corrigida (é da fonte, não da leitura)**: Tabela 6.5
(11-12 anos), coluna Inibição, bruto pula de 263 para 265 (falta 265... o 264) — mesmo rótulo
(`< 5`) dos dois lados do buraco, então não afeta nenhuma fronteira de faixa. Registrado como aviso
pelo extrator, não erro.

## Arquivos de dados

- `docs/testes/FDT-tabelas.json` — as 90 tabelas bruto→percentil, geradas por
  `scripts/extrair-normas-fdt.mjs` (não editar à mão; regerar a partir da planilha se algo mudar).
- `apps/api/prisma/fdt-normas.ts` — lê o JSON e expõe `FDT_FAIXAS_ETARIAS` (já no formato
  `FaixaConversao[]` que o motor consome) e `FDT_CAMPOS_DERIVADOS` (a subtração de Inibição/
  Flexibilidade).

## Integração no catálogo

Seed em `apps/api/prisma/seed.ts`. 8 campos de entrada (tempo e erro de Leitura/Contagem/Escolha/
Alternância) — Inibição/Flexibilidade NÃO são lançadas, são calculadas.

**Extensão nova no motor para isto** (`apps/api/src/lib/motorCalculo.ts`): `camposDerivados` só
sabia SOMAR um campo de saída já convertido de outras fontes (ex.: WISC-IV soma `ponderado`). O FDT
precisa de SUBTRAÇÃO sobre o **bruto de entrada** (segundos), não sobre um campo de saída — a
faixa de Escolha só devolve um rótulo de percentil, não o segundo exato de volta. Duas adições
genéricas (não específicas do FDT, reaproveitáveis por qualquer teste futuro com a mesma
necessidade):

1. `operacao?: "soma" | "subtracao"` em `CampoDerivado` — `"subtracao"` é `fontes[0]` menos a soma
   das demais, e **sempre** exige todas as fontes (nunca subtrai 0 no lugar da que falta — mesmo
   risco de número plausível e errado que motivou `exigeTodasFontes` no WISC-IV).
2. `campoValor: "valorBruto"` — valor reservado que lê o bruto de ENTRADA da fonte direto, em vez
   de um campo de saída da faixa.

Testado em `apps/api/src/lib/motorCalculo.test.ts` (casos de soma continuam passando sem mudança;
novos casos cobrem subtração e o valor reservado). Verificação ponta a ponta do FDT em
`scripts/verificar-fdt-motor.ts`: monta a mesma `conversao` do seed e confere cobertura das 9
faixas sem buraco/sobreposição, seleção de tabela por idade (incluindo a faixa aberta 76+), a
subtração de Inibição/Flexibilidade com um caso real, e que toda fonte faltando devolve "não
calculado" em vez de subtrair 0.

**Direção do teste**: `direcao: "MAIOR_MELHOR"` continua correta mesmo com bruto = tempo (onde
MENOR é melhor) — o que a cor do laudo lê é a palavra da `classificacao` (`Superior` já significa
"bom" no sentido convencional, igual RAVLT/WAIS), não o sinal do bruto. Ver
`apps/web/src/lib/severidadeClassificacao.ts`.

## Pendências / próximos passos

- [ ] **Confirmar com a psicóloga a convenção do rótulo `"x"` e a anomalia de bruto 264 faltando**
      (Tabela 6.5/Inibição) — ambas tratadas por inferência razoável, não confirmadas com ela.
- [ ] **Sem manual em PDF**: se o acervo ganhar o manual do FDT (Sedó, 2007) no futuro, cruzar
      `FDT-tabelas.json` contra ele é o próximo passo natural — hoje esta é fonte única.
- [ ] Tabela 6.2 (amostra inteira) não é usada no catálogo — só serve de checagem de sanidade
      manual, se algum dia for preciso confirmar que uma das 9 faixas bate com o agregado.
