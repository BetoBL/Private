# WISC-IV — divergências entre as tabelas do Excel da psicóloga e as do sistema

Conferência automática feita em 06/10/2026: para as 33 faixas etárias × 15 subtestes × todos os escores brutos possíveis (26.184 combinações), comparamos o ponderado que a planilha devolveria (consulta `LOOKUP` nas colunas da aba `WISC-NORMAS`) com o ponderado das tabelas A.1 do sistema (`docs/testes/WISC-IV-tabelas-A1.json`, transcritas do manual).

**Resultado: 26.172 iguais e 12 divergentes.** As duas fontes dizem transcrever a MESMA tabela impressa do manual, então cada divergência é candidata a erro de digitação em UMA das duas. Conferir contra a página física do manual (Anexo A, Tabela A.1 da faixa indicada).

| Faixa | Subteste | Bruto | Sistema (manual transcrito) | Excel (planilha) |
|---|---|---|---|---|
| 12:8-12:11 | Informação (IN) | 28 | 18 | 17 |
| 13:0-13:3 | Seq. Números e Letras (SNL) | 8 | 4 | 3 |
| 13:0-13:3 | Raciocínio Matricial (RM) | 10 | 4 | 3 |
| 13:0-13:3 | Compreensão (CO) | 11 | 4 | 3 |
| 13:0-13:3 | Procurar Símbolos (PS) | 8 | 4 | 3 |
| 13:0-13:3 | Completar Figuras (CF) | 14 | 4 | 3 |
| 13:0-13:3 | Cancelamento (CA) | 43 | 4 | 3 |
| 13:0-13:3 | Informação (IN) | 12 | 4 | 3 |
| 13:0-13:3 | Aritmética (AR) | 15 | 4 | 3 |
| 13:0-13:3 | Raciocínio com Palavras (RP) | 8 | 4 | 3 |
| 14:4-14:7 | Aritmética (AR) | 32 | 17 | 16 |
| 15:0-15:3 | Semelhanças (SM) | 38 | 17 | 18 |

Observação: 9 das 12 estão na faixa 13:0-13:3, todas na fronteira entre os ponderados 3 e 4 — padrão de uma linha deslocada em uma das duas fontes para essa faixa. Decisão pendente: qual valor vale (a planilha é a referência de resultado, mas aqui ela contradiz o manual transcrito). Gerado por script de conferência (não versionado); refazer se as tabelas mudarem.

## Pontos onde o resultado real do Excel é incerto (colunas fora de ordem)

A consulta da planilha (`LOOKUP`) assume colunas em ordem crescente (busca binária). Em três colunas de `WISC-NORMAS` a coluna do escore bruto NÃO está em ordem, então o que o Excel realmente devolve depende do caminho da busca e não dá para garantir só pela leitura dos dados:

| Faixa | Subteste | Coluna | Linhas fora de ordem |
|---|---|---|---|
| 7:0-7:3 | Cubos (CB) | CB | CB122 (22 depois de 23) |
| 8:0-8:3 | Cubos (CB) | FB | FB113-115, FB120-122, FB127-128 (21 a 28 depois de 29) |
| 12:8-12:11 | Informação (IN) | TN | TN170-174 (29 a 33 depois de 38) |

A divergência "Informação, 12:8-12:11, bruto 28" da tabela acima cai nesta última coluna. **Pedir à Leticia casos reais com estes valores** (Cubos 7:0 e 8:0 com brutos entre ~20 e 30; Informação 12:8 com brutos ~28 a 38) para ver o ponderado que o Excel de fato mostra.

## Atualização (06/10/2026): colunas desordenadas e a busca binária do Excel

O gerador agora reproduz a busca binária do LOOKUP nas colunas desordenadas de WISC-NORMAS (FB = Cubos 8:0, CB = Cubos 7:0,
TN = Informação 12:8). Varredura exaustiva (23.031 combinações faixa × subteste × bruto): 0 diferenças contra a planilha.
Efeito prático: **Cubos aos 8:0–8:3 com bruto 21–24 dá ponderado 10 na planilha**, enquanto a tabela A.1 do manual dá 11/12.
Pergunta para a Leticia: confirmar se os valores digitados em FB113–128 estão certos (ordem 29, depois 21–28 sugere erro de digitação).

## Defeito: valor crítico IMO − IVP (6:0 a 6:4, 90%, base "Nível de Habilidade")

`WISC-NORMAS!G302` (10,36) está gravada como TEXTO. Na aba WISC-IV, `ABS(diferença) >= texto` é sempre falso no Excel, então esse
caso mostra "Não" (e frequência vazia) mesmo com diferença grande (ex.: 17 pontos). O sistema novo compara números e mostra "Sim".
Pergunta para a Leticia: confirmar que a célula deve ser numérica. (Também são texto as células B501:O501, que são só " ".)

## Defeitos achados nas facilidades/dificuldades e nos escores de processo (06/10/2026)

O sistema novo implementa o comportamento CORRETO; a planilha erra assim:
1. **Facilidades, Conceitos Figurativos (CN), níveis 3/4:** o limite está digitado "4,33" (vírgula) e o Excel lê como 4 mais um argumento extra. A frequência acumulada fica errada para diferenças entre 4 e 4,33. Também há "=2%" no lugar de "2%".
2. **CUSB (Cubos sem bônus), F116:** na faixa de 3405 a 3524 dias a tabela de busca é o intervalo bidimensional IB:IG (o certo é a coluna IB).
3. **CAA (Cancelamento aleatório), F119:** na faixa de 4865 a 4984 dias a chave é o intervalo bidimensional ME:MJ (o certo é ME).
4. **Comparações CB×CUSB e DIOD×DIOI (K138/K139):** a fórmula compara a diferença com um RÓTULO ("CUSB"/"DIOI"), então sempre usa a coluna "negativa" da frequência, mesmo com diferença positiva.
5. **Linha 139 (DIOD−DIOI):** só aparece se as maiores sequências (UDIOD/UDIOI) foram digitadas, embora o cálculo use DIOD/DIOI.

## Defeitos achados nos clusters (06/10/2026)
1. **Hipótese Gc-LM × Gf-verbal (V185):** a fórmula mostra o texto A952 ("raciocínio adequado, informação insuficiente", que descreve Gc-LM MENOR) quando Gc-LM é MAIOR (">"). A sugestão (V188) usa o sentido certo, mas fica vazia quando Gc-LM é maior, embora J962 exista. O sistema novo usa o texto pelo sentido real.
2. **Empate (diferença 0):** a planilha mostra o texto do sentido "<" (a fórmula devolve 0 em vez de vazio); o sistema novo não mostra hipótese.
3. **Subteste não lançado:** a planilha conta como 0 nos clusters (pode marcar "NÃO interpretável" ou calcular com soma falsa); o sistema novo só calcula o cluster com todos os subtestes.
4. A comparação GAI × CPI tem só a diferença (sem coluna "Raro/Não Raro" na planilha).

## Defeitos achados nas habilidades compartilhadas (06/10/2026)
1. **Coluna do RM em 4 habilidades (65, 69, 76 e 82):** as células AO128, AO132, AO139 e AO145 apontam para `$G$95` (em branco) em vez de AA67, então o RM conta sempre como "Neutro" nelas. O sistema novo usa o RM de verdade.
2. **Regra "quase todos negativos" em 50 das 82 habilidades:** a fórmula da coluna AW tem condições repetidas ou trocadas (ex.: `AY=0` no lugar de `AX=0`, ou `AZ=0,AZ=1`), que nunca se cumprem. Resultado: essas habilidades nunca aparecem como "Fraqueza" por "quase todos" (só quando TODOS os subtestes são negativos). A regra de "Força" está correta. O sistema novo aplica a mesma regra nos dois sentidos.

## Defeitos achados na análise intraindividual e na idade mental (06/10/2026)
1. **Maior diferença positiva/negativa (AX59:AY60):** a planilha só funciona com os 15 subtestes lançados (texto vazio menos número dá erro, e LARGE/SMALL propagam o erro). O sistema novo usa os subtestes lançados.
2. **Maior diferença NEGATIVA (AY60):** o VLOOKUP usa o intervalo deslocado AA61:AB75 (o certo é AA60:AB74): se o menor for o SM dá #N/A, e em empate com outro subteste do mesmo índice devolve o outro.
3. **Idade mental:** a planilha pode mostrar "5a, 12m" (ROUND do mês); o sistema novo passa para o ano seguinte. A linha "TOTAL" AG20 (fórmula gigante de substituições) não alimenta nada visível (a idade mental estimada usa AG21 = média de todos os subtestes) e não foi reproduzida.
