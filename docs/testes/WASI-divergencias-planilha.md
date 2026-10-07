# WASI — diferenças entre a planilha da Leticia e o sistema (07/10/2026)

O sistema implementa o comportamento CORRETO; a planilha tem estes defeitos (para mostrar à Leticia):

1. **Idade mental de Cubos e Semelhanças trocadas (AB4/AC4 e AB5/AC5):** o Cubos (CB) lê a coluna de idade equivalente do SM (LD) e o SM lê a do CB (LE). Isso afeta a idade mental do QI Verbal, do QI de Execução e do QIT-4. O QIT-2 (VC + RM) não é afetado. O "teste-idade" de cada subteste (coluna O) usa as colunas certas.
2. **Observações de não interpretabilidade (U25/U26):** as frases "Comp. Verbal/Org. Perceptual preservada" e "é uma dificuldade" nunca aparecem, porque a fórmula testa antes `L="Não"` e responde só a primeira frase; além disso comparam ESCORE T com 12 e 8 (limites de pontos ponderados). O sistema novo mostra a 1ª frase e acrescenta as outras comparando os PONDERADOS.
3. **Média dos QIs (N25/N26):** com só um dos QIs calculado a planilha soma um só valor e divide por 2 (média falsa). O sistema só calcula com os dois.
4. **Aspas:** os avisos do QIT-4/QIT-2 saem com duas apóstrofes (''QIT-4'') em vez de aspas.
5. **Habilidades compartilhadas com 1 subteste (23 das 56):** não têm fórmula de Força/Fraqueza (coluna K em branco). O sistema também não interpreta essas.
6. **Subteste não lançado:** a planilha calcula médias e habilidades com o que houver (divisão por 4 fixa); o sistema só calcula com os 4 subtestes.
7. **Valor crítico/Facilidade-Dificuldade individual/Raro:** a planilha mostra "não há dados" (colunas P-T vazias); o sistema não os calcula.
