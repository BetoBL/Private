# Perguntas e defeitos da planilha para a Leticia

Lista para levar à psicóloga. Os defeitos de conta do WAIS-III, WISC-IV e WASI estão em `WISC-IV-divergencias-planilha.md` e `WASI-divergencias-planilha.md`. Aqui ficam os achados da migração dos demais testes (07/10/2026).

## 1. CBCL pré-escolar (1,5 a 5 anos) — precisa de resposta antes de usar

A aba "CBCL-Pre" é uma **cópia da aba do CBCL 6–18**: o título ainda diz "Escolar 6-18 ano", ela calcula com as normas de 6 a 18 anos (cortes <12 e ≥12 anos), e vários totais estão marcados "EM CONSTRUÇÃO — faltam tabelas". Os 24 gráficos dela apontam para a aba do CBCL 6–18. Hoje o teste está no sistema como **provisório**.

Perguntas:
1. Ela usa o CBCL 1½–5? Pode enviar as **tabelas de norma** dele (T-score e percentil por idade e sexo)?
2. Quais **escalas** ela quer? No pré-escolar são outras: reatividade emocional, ansiedade/depressão, queixas somáticas, retraimento, problemas de sono, problemas de atenção e comportamento agressivo.
3. Qual **item entra em qual escala**? A planilha copiou a distribuição do 6–18.
4. Como calcular os totais **Internalizante, Externalizante e Geral**?

## 2. BRIEF-2 — precisa de casos reais

- A aba não traz protocolo de exemplo, então o cálculo **não foi comparado com o Excel**. Só foi conferido por conta manual (8 itens respondidos "A" dão 16 pontos brutos em Inibição). Pedir 2 ou 3 protocolos reais com o resultado do Excel (um de criança, um de adolescente com auto-relato).
- Os itens **18, 36 e 54** só aparecem nas escalas de validade e não têm texto na planilha. Confirmar a redação.
- Com 11 anos ou mais, a coluna do auto-relato mostra zeros mesmo sem respostas (o Excel faz o mesmo). Isso é o esperado?

## 3. Vineland-3 Extensivo — gráficos colados de outras abas

Nas abas de Pais e de Professores há gráficos copiados de outros formulários, ainda apontando para a aba original (2 em Pais, 4 em Professores, intitulados "Entrevista" e "Cuidador"). Cada formulário já tem os próprios gráficos corretos. No sistema ficaram só os corretos. Pode apagar os colados na planilha.

## 4. RAVLT

- As **intrusões** (palavras fora da lista) são digitadas como texto na planilha. No sistema entra só a **quantidade** de intrusões por tentativa. Ela precisa registrar as palavras?
- O **falso positivo** só é calculado pela lista de reconhecimento (S/N). Lançando apenas os totais, ele não aparece. Confirmar que é assim mesmo na planilha.

## 5. SCARED e E-TDAH

- No SCARED a planilha traz só o número do item, sem o texto. No sistema aparece "Item 1", "Item 2" etc. Ela quer o texto de cada item na tela? (O texto do instrumento precisa vir dela.)

## 6. Boston

O Boston não é uma aba separada na planilha. Ele faz parte da **Nomeação (Seabra)** ou é um teste à parte que ela usa? Se for à parte, precisamos da aba.

## 7. Prioridade

Do menu da planilha, quais testes ela usa de verdade? Serve só para ordenar o refinamento das telas (nenhum teste deixa de existir por isso).

## 8. Modelo de laudo (08/10/2026)

Itens levantados na leitura do laudo-modelo (páginas do PDF entre parênteses). São detalhes, não erros graves:

1. **Gráfico 2, curva do RAVLT (p. 7):** a legenda diz "Percentil %", mas os valores plotados são o **número de palavras evocadas** (5, 7, 8, 13, 12…). Qual é a intenção: manter "Percentil %" ou trocar por "Número de palavras evocadas"? *(marcado para conversar com ela)*
2. **Gráfico 1, índices do WAIS-III (p. 5, embaixo):** as "hastes" finas no topo de cada barra são barras de erro, todas do mesmo tamanho (±7,5 pontos) para qualquer índice. O sistema calcula o intervalo de confiança de cada índice. Ela prefere o IC real (90% ou 95%) ou manter o tamanho fixo?
3. **Tabela 1, classificação por percentil (p. 4):** os cortes ">98" e "<2" estão certos. As faixas escritas são inteiras, então o percentil **exatamente 98** e o **exatamente 2** (e valores com decimais, como 8,5 ou 90,5) não pertencem a nenhuma. Como o sistema deve classificar esses casos?
4. **Nomes das classificações:** a Tabela 1 usa "Média superior / Dentro da média / Média inferior" e o texto do laudo usa "Médio Superior / Médio / Médio Inferior" (p. 6: Dígitos e SNL, Informação; p. 7: RAVLT A6 "33% Médio", FDT "70% Médio", Raciocínio Matricial; p. 8: Compreensão, BPA concentrada). A Tabela 2 (p. 5) usa "Média Superior" e "Média". Qual padrão o sistema deve gerar?
5. **Gráficos padrão e textos-definição:** quais gráficos novos entram por padrão (BFP, FDT, BPA, SRS-2)? Os textos que definem cada domínio (funções executivas, atenção etc.) podem virar blocos padrão editáveis?

## 9. Avisos para ela (decididos em 08/10/2026; não precisam de resposta, só comunicar)

- **Nomes das classificações:** o sistema escreve sempre pelo vocabulário da Tabela 1 do laudo dela ("Muito superior à média", "Superior à média", "Média superior", "Dentro da média", "Média inferior", "Limítrofe", "Deficitário"), no texto e nas tabelas. Isso troca o "Médio Superior / Médio / Médio Inferior" que aparecia no texto. Cada profissional pode escolher, no Perfil de Atuação, o sistema de Guilmette (2020) no lugar do Miotto.
- **Barra de erro do gráfico dos índices do WAIS-III:** fica **fixa em ±7,5**, como no laudo dela.
- **Legenda do gráfico da curva do RAVLT:** o sistema usa "Curva de aprendizagem do RAVLT – número de palavras evocadas" (os valores plotados são a contagem de palavras). *Falta só ela confirmar que é isso (item 1 da seção 8).*
- **Ainda para perguntar:** como classificar o percentil exatamente 98 e o exatamente 2 (item 3 da seção 8). Enquanto isso, o sistema classifica 98 como "Muito superior à média" (como no laudo dela) e abaixo de 3 como "Deficitário".
