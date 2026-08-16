# WISC-IV — Escala Wechsler de Inteligência para Crianças (4ª edição)

> Extraído de material fornecido pela psicóloga (uso legítimo, restrito à clínica). **Não redistribuir os PDFs de origem** — só os dados normativos estruturados abaixo (números/tabelas de conversão são dados factuais, não texto autoral).
> Fonte: "Wisc IV - Manual de Aplicação.pdf" (versão "-compactado" usada para leitura, mesmo conteúdo em tamanho de arquivo menor) — **Manual de Instruções para Aplicação e Avaliação**, adaptação brasileira 2013 (5ª reimpressão 2014), Casa do Psicólogo/Pearson. Responsáveis técnicos: Fabián Javier Marín Rueda, Ana Paula Porto Noronha, Fermino Fernandes Sisto, Acácia Aparecida Angeli dos Santos, Nelimar Ribeiro de Castro. 311 páginas totais.
> Qualidade de digitalização: **boa**, scan nítido, sem bleed-through relevante nas páginas lidas até agora. PDF é **imagem escaneada, sem camada de texto** (`pdftotext` não extrai nada) — leitura feita renderizando páginas com `pdftoppm` e lendo visualmente.
> **Status desta leitura: tabelas normativas do Anexo A completas; Anexo B parcial (cobre a análise de discrepância mais usada); capítulos de aplicação (2 e 3) ainda não lidos.** Lidos e conferidos: Sumário completo, Capítulo 1 (estrutura, abreviações, composição dos índices, substituições), Capítulo 4 (fluxo de cálculo completo), **todo o Anexo A** — Tabelas A.1.1-A.1.33 (bruto→ponderado, 33 faixas etárias), A.2-A.7 (índices/QI), A.8.1-A.8.11 (escores de processo), A.9 (teste-idade) — e **Anexo B parcial**: B.1-B.6 (discrepância entre índices, entre todos os pares de subtestes, pares específicos, subteste vs. média do perfil, dispersão intersubtestes). Dados estruturados em JSON (ver seção "Arquivos de dados" abaixo). **Ainda não lidos**: Capítulo 2 (orientações gerais de aplicação, ~30p), Capítulo 3 completo (instruções de aplicação/pontuação subteste a subteste, p.55–200 — importante se o objetivo for aplicar o teste, não só corrigir), B.2 por faixa de habilidade (só a versão "Amostra Geral" foi feita), B.7-B.10 (frequência de UDIOD/UDIOI e discrepâncias entre escores de processo — uso clínico raro).
>
> **Arquivos de dados** (`docs/testes/`): `WISC-IV-tabelas-A1.json` (bruto→ponderado por subteste/faixa), `WISC-IV-tabelas-A2-A7.json` (soma dos ponderados→composto/percentil/IC, mais a soma pró-rata), `WISC-IV-tabelas-A8.json` (escores de processo), `WISC-IV-tabela-A9.json` (teste-idade), `WISC-IV-tabelas-B.json` (discrepância B.1-B.6). Todos com leitura visual célula a célula (não OCR cru) e notas de confiança/pendência inline.
>
> **No catálogo**: o WISC-IV está no seed (`apps/api/prisma/seed.ts` + `wisc4-normas.ts`), com as duas etapas de cálculo ligadas ao motor. Ver "Integração no catálogo" no fim deste documento para o que está e o que **não** está automatizado.

## Estrutura do instrumento

15 subtestes (10 principais + 5 suplementares) em 4 Índices Fatoriais + QI Total. Diferente do WAIS-III, o WISC-IV **não tem mais QI Verbal/Execução** — foi substituído inteiramente pelo modelo de 4 índices.

| Índice | Subtestes principais | Suplementar(es) |
|---|---|---|
| Compreensão Verbal (ICV) | Semelhanças, Vocabulário, Compreensão | Informação, Raciocínio com Palavras |
| Organização Perceptual (IOP) | Cubos, Conceitos Figurativos, Raciocínio Matricial | Completar Figuras |
| Memória Operacional (IMO) | Dígitos, Sequência de Números e Letras | Aritmética |
| Velocidade de Processamento (IVP) | Código, Procurar Símbolos | Cancelamento |

QI Total = soma dos pontos ponderados **dos 10 subtestes principais** (não é média nem soma dos 4 índices — o manual frisa isso explicitamente).

Abreviações (Tabela 1): CB=Cubos, SM=Semelhanças, DG=Dígitos, CN=Conceitos Figurativos, CD=Código, VC=Vocabulário, SNL=Sequência de Números e Letras, RM=Raciocínio Matricial, CO=Compreensão, PS=Procurar Símbolos (principais) · CF=Completar Figuras, CA=Cancelamento, IN=Informação, AR=Aritmética, RP=Raciocínio com Palavras (suplementares).

Escores de processo (pontuações intermediárias de 3 subtestes, não entram nos índices): CUSB (Cubos sem Bônus de tempo), DIOD/DIOI (Dígitos Ordem Direta/Inversa), UDIOD/UDIOI (Sequência Maior de Dígitos Ordem Direta/Inversa), CAA/CAE (Cancelamento Aleatório/Estruturado).

Em relação ao WISC-III: excluídos Arranjo de Figuras, Armar Objetos e Labirintos (para reduzir ênfase em desempenho cronometrado). Novos: Conceitos Figurativos, Sequência de Números e Letras, Raciocínio Matricial, Cancelamento e Raciocínio com Palavras (medem raciocínio fluido e memória de trabalho — linha teórica trazida do WAIS-III/WPPSI-III).

## Substituições aceitáveis (Tabela 5)

| Subteste principal | Pode ser substituído por |
|---|---|
| Semelhanças, Vocabulário ou Compreensão | Informação **ou** Raciocínio com Palavras |
| Cubos, Conceitos Figurativos ou Raciocínio Matricial | Completar Figuras |
| Dígitos ou Sequência de Números e Letras | Aritmética |
| Código ou Procurar Símbolos | Cancelamento |

Regras: só 1 substituição por índice; no máximo 2 substituições (em índices diferentes) para poder derivar o QI Total. Recomendação do manual: aplicar rotineiramente Aritmética e Cancelamento como "seguro" para IMO/IVP.

## Fluxo de cálculo (5 passos, Cap. 4 "Normas de Correção e Interpretação")

1. **Idade cronológica**: data de aplicação − data de nascimento, sempre considerando mês = 30 dias, **sem arredondar** (11 anos 3 meses 24 dias fica exatamente nessa faixa, mesmo que "quase 12").
2. **Total de pontos brutos por subteste** → converter em **ponto ponderado (1–19)** via **Tabela A.1.x correspondente à faixa etária da criança** (Anexo A) — 33 tabelas, uma por faixa de 4 meses, de 6:0–6:3 até 16:8–16:11. Cada tabela traz as 15 colunas de subtestes (10 principais + 5 suplementares) lado a lado.
3. **Somar os ponderados** dos subtestes principais de cada índice (ICV/IOP: 3 subtestes cada; IMO/IVP: 2 cada) e dos 10 principais para o QI Total.
4. **Converter cada soma em Ponto Composto** via Tabelas A.2 (ICV), A.3 (IOP), A.4 (IMO), A.5 (IVP), A.6 (QIT) — essas tabelas **não são por faixa etária** (a normalização por idade já aconteceu no passo 2); cada uma também traz Rank Percentil e Intervalo de Confiança 90%/95%.
5. **Perfis de pontuação**: plotar ponderados e compostos nos gráficos do Protocolo de Registro (opcional, mas facilita leitura clínica).

> Nota importante encontrada nas Figuras 17–19 (exemplos de protocolo preenchido): os exemplos do manual **usam as tabelas normativas americanas**, não as brasileiras — é só para ilustrar o preenchimento do protocolo. Para uso real, sempre usar as tabelas do Anexo A deste mesmo manual (marcadas "*Br: Amostra Brasileira").

**Somas Pró-rata** (Tabela A.7): só permitidas para ICV e IOP (nunca IMO/IVP/QIT), e só quando pelo menos 2 dos 3 pontos ponderados do índice são válidos. Fórmula: soma dos 2 válidos × 3/2, arredondado — resultado já tabelado. Devem ser evitadas sempre que houver suplementar disponível; manual pede para marcar "PRO" na margem do protocolo quando usadas.

**Pontuação 0**: se a criança zera 2 dos 3 subtestes de um índice (ICV/IOP) ou os 2 do IMO/IVP (incluindo substituições), aquele índice **e o QI Total ficam invalidados** — não é "habilidade zero", é "não foi possível medir".

## Escores de processo (Cubos, Dígitos, Cancelamento)

Convertidos via **Tabela A.8.1 a A.8.11** — aqui as faixas etárias são **por ano completo** (6:0–6:11, 7:0–7:11, ..., 16:0–16:11 = 11 tabelas), não por 4 meses como a A.1.x. Cada tabela cobre simultaneamente CUSB, DIOD, DIOI, CAA e CAE. UDIOD/UDIOI usam ponto bruto direto (sem conversão em ponderado) e são comparados via frequência acumulada (Tabela B.7), não via ponto ponderado.

Análises de discrepância disponíveis usando escores de processo: CB vs. CUSB, DIOD vs. DIOI, CAA vs. CAE, UDIOD vs. UDIOI (Tabelas B.8/B.9/B.10 no Anexo B).

> Nenhuma tabela de **classificação qualitativa** (tipo "Muito Superior/Superior/Média..." como a Tabela 5.24 do WAIS-III) foi encontrada neste manual até agora — pode estar só no Manual Técnico da adaptação brasileira (citado várias vezes como documento separado e complementar a este). As categorias Wechsler-padrão são conhecidas e podem ser usadas, mas **não foram confirmadas nas tabelas brasileiras deste PDF** — não usar sem checar o Manual Técnico ou confirmar com a psicóloga.

## Anexo B — Tabelas de valor crítico e frequência acumulada — PARCIAL (B.1-B.6 completas)

Usadas na "Página de Análise" do protocolo para julgar se uma discrepância (entre índices, entre subtestes, subteste vs. média do perfil, entre escores de processo) é estatisticamente significativa e/ou rara na amostra normativa. **Não são necessárias para calcular QI Total ou os 4 Índices** — só para a camada de interpretação de discrepância. Dados em `docs/testes/WISC-IV-tabelas-B.json`.

- **B.1** ✅ — valor crítico (0,15/0,05) para diferença entre os 4 Índices, por faixa etária + amostra geral.
- **B.2** ✅ (só "Amostra Geral") — % acumulada da amostra obtendo cada tamanho de discrepância entre índices. O manual também repete essa tabela por faixa de habilidade (QI<70 até QI≥120, p.272-276) — **não transcrito**.
- **B.3** ✅ — matriz completa 15×15 de valor crítico entre todos os pares de subtestes.
- **B.4** ✅ — % acumulada para 7 pares de subtestes específicos pré-selecionados pelo manual (DG-SNL, CD-PS, SM-CN, DG-AR, SNL-AR, CD-CA, PS-CA).
- **B.5** ✅ — valor crítico + % acumulada de cada subteste vs. média do seu agrupamento (ICV, IOP, geral de 10).
- **B.6** ✅ — % acumulada da dispersão (max-min) dentro de agrupamentos de subtestes.
- **B.7-B.10** ❌ não transcritas — frequência de UDIOD/UDIOI por faixa etária (B.7, p.281), discrepância UDIOD×UDIOI (B.8), e discrepâncias entre escores de processo CB×CUSB/DIOD×DIOI/CAA×CAE (B.9/B.10, ~p.282-284). Métricas de uso clínico bem mais raro; retomar aqui se precisar delas.

## Extração das tabelas do Anexo A — COMPLETA

As 311 páginas do manual são **imagem escaneada sem camada de texto**. Para as 33 tabelas A.1.x (bruto→ponderado por faixa etária) e as 11 tabelas A.8.x (escores de processo), uma sessão anterior (`WASI-tabelas-brutas.json`) documentou que transcrição visual manual célula-a-célula tem alto risco de erro por fadiga nesse volume de dados — a resposta inicial foi tentar OCR (Tesseract, `--psm 4`, páginas rotacionadas 90°) como atalho. Na prática, o OCR mostrou lacunas reais em várias tabelas (não só ruído cosmético), então a transcrição final foi feita **relendo a imagem original de cada uma das 44 tabelas diretamente** (multimodal), com o texto OCR servindo só de referência inicial — não como fonte de verdade.

**Resultado — dois arquivos JSON estruturados, ambos completos**:
- `docs/testes/WISC-IV-tabelas-A1.json` — as 33 faixas etárias (6:0-6:3 a 16:8-16:11) × 15 subtestes (10 principais + 5 suplementares) = ~9.400 valores, cada um conferido contra a imagem renderizada.
- `docs/testes/WISC-IV-tabelas-A8.json` — as 11 tabelas de escores de processo (CUSB/DIOD/DIOI/CAA/CAE), 33 faixas etárias (mesma granulação, já que cada página cobre 3 sub-faixas de 4 meses).

Texto OCR bruto (intermediário, não mais necessário para uso mas preservado por referência) continua em `docs/testes/wisc-iv-ocr-raw/`.

**Nível de confiança**: alto — leitura visual direta, não parse de OCR — mas por ser transcrição manual em volume alto, uma conferência amostral por um segundo revisor (idealmente a psicóloga responsável) é recomendada antes de uso em produção clínica real, mesma ressalva de praxe em `WASI-tabelas-brutas.json`.

## Extração das Tabelas A.2-A.7 — COMPLETA

Páginas impressas 251-255 (páginas 272-276 do PDF), renderizadas a 200dpi e lidas visualmente:

| Tabela | Conteúdo | Domínio |
|---|---|---|
| A.2 | ICV: soma dos ponderados → composto, percentil, IC 90/95 | somas 3–57 |
| A.3 | IOP: idem | somas 3–57 |
| A.4 | IMO: idem | somas 2–38 |
| A.5 | IVP: idem | somas 2–38 |
| A.6 | QIT: idem | somas 10–190 |
| A.7 | soma pró-rata (2 subtestes → equivalente de 3) | somas 2–38 |

Total: 365 linhas em `WISC-IV-tabelas-A2-A7.json`.

**Conferência**: como transcrição visual em volume não se auto-verifica, as tabelas passam por `scripts/validar-wisc-a2a7.mjs`, que checa (1) sequência das somas sem buraco, (2) monotonicidade de composto e percentil, (3) **coerência de cada percentil com a distribuição normal de média 100 e DP 15** — os compostos Wechsler são normalizados, então um dígito trocado no composto ou no percentil quebra essa relação, (4) IC95 nunca mais estreito que IC90 e composto dentro dos dois, (5) A.7 contra a própria fórmula do rodapé da tabela (soma × 3/2 arredondada) — bate nas 37 linhas.

O validador em si é testado por `scripts/mutar-wisc-a2a7.mjs`, que planta 6 erros conhecidos (dígito trocado, percentil errado, IC invertido, linha removida, ordem quebrada, pró-rata errado) e exige que todos sejam reprovados. Sem isso um validador que passa em tudo não provaria nada.

## Integração no catálogo

Seed em `apps/api/prisma/seed.ts`; normas carregadas por `apps/api/prisma/wisc4-normas.ts`, que **lê os JSON deste diretório** em vez de duplicar os ~9.400 valores num `.ts` gerado (duas cópias divergiriam na primeira correção).

As duas etapas do manual mapeiam assim no motor (`apps/api/src/lib/motorCalculo.ts`):

1. **bruto → ponderado**: `faixasPorCampo` por subteste, dentro de uma `TabelaNormativa` com `criterio: "idade_meses"` — 33 tabelas, uma por faixa de 4 meses (72 a 203 meses).
2. **soma dos ponderados → composto**: `camposDerivados`, somando o `ponderado` extraído da faixa de cada subteste principal e localizando o resultado nas faixas de A.2-A.6.

Verificação ponta a ponta em `scripts/verificar-wisc4-motor.ts`: monta a mesma `conversao` que o seed grava e roda o motor. O caso central se auto-confere — todo subteste no ponderado 10 tem que produzir composto ~100 e percentil ~50, que é o que as tabelas dizem; se a inversão das A.1.x ou a derivação dos índices estiver errada, o número sai do 100.

**Índice incompleto não vira número.** Os campos derivados usam `exigeTodasFontes: true`: se um subteste principal não for lançado, o índice afetado volta "não calculado" em vez de somar 0 no lugar do que falta. Sem isso, um QI Total com 9 dos 10 subtestes sairia plausível e errado, sem nada denunciando o erro no laudo. Na UI o campo aparece como "não calculado" em vez de barra a 50%.

**O que NÃO está automatizado** (cai no profissional, e o aviso está no `algoritmoCorrecao` do teste):

- **Substituição de subteste** (Tabela 5: Informação/Raciocínio com Palavras por um verbal, etc.). O motor não modela alternativas de fonte, então substituir deixa o índice sem valor.
- **Soma pró-rata** (A.7). O dado está no JSON e exposto em `WISC4_PRO_RATA`, mas não é aplicado sozinho: decidir usar pró-rata é julgamento clínico, e o manual manda evitar sempre que houver suplementar disponível.
- **Regra de invalidação por zeros** (2 de 3 subtestes zerados invalidam o índice e o QIT).
- **Escores de processo** (A.8). As tabelas usam faixa etária por ano completo, enquanto as A.1.x usam 4 meses — duas granularidades no mesmo teste, e uma `AplicacaoDeTeste` resolve uma tabela normativa só.
- **Análise de discrepância** (Anexo B). É camada de interpretação, não de cálculo.

**Idade em meses**: o manual manda calcular a idade cronológica com mês = 30 dias e sem arredondar; `calcularIdadeEmMeses` conta meses de calendário. As duas contas só divergem em casos de borda (criança a poucos dias de trocar de faixa de 4 meses).

**Fora da faixa 6;0–16;11**: `escolherTabelaNormativa` cai para a primeira tabela quando nenhuma faixa cobre a idade — comportamento global do motor, não específico do WISC-IV. Uma criança de 5 anos receberia as normas de 6:0-6:3 sem aviso.

## Pendências restantes

- [ ] Ler Capítulo 2 (Orientações Gerais sobre a Aplicação, p.23–53) e Capítulo 3 completo (Procedimentos de Aplicação e Avaliação por subteste, p.55–200) — necessário se o objetivo incluir gerar roteiro de aplicação, não só corrigir.
- [ ] **Conferência amostral por um segundo revisor** (idealmente a psicóloga responsável) das tabelas A.1.x antes de uso clínico real — o volume é alto (~9.400 valores) e a validação por script só cobre A.2-A.7, onde existe estrutura estatística para checar. As A.1.x não têm essa propriedade.
- [ ] Ler B.7-B.10 e B.2 por faixa de habilidade, se a análise de discrepância virar escopo.
- [ ] Confirmar se existe tabela de classificação qualitativa (Muito Superior→Extremamente Baixo) na adaptação brasileira — checar Manual Técnico separado, citado no texto mas não incluído neste PDF. **Enquanto não houver, o catálogo não emite `classificacao` para os compostos**: inventar os rótulos Wechsler-padrão seria atribuir ao manual algo não conferido nele. A classificação sai do percentil, pelo sistema escolhido no Perfil de Atuação (`src/lib/classificacaoPercentil.ts`).
