# Modelo de laudo da MentEssence (análise de 08/10/2026)

Fonte: laudo real da psicóloga (Word + PDF, 13 páginas), guardado só em `Manuais/` e fora do repositório de dados. **Nenhum dado de paciente deve ser copiado para este documento.**

## 1. Estrutura (10 seções)

| # | Seção | Conteúdo | De onde vem no sistema |
|---|---|---|---|
| — | Título + parágrafo CFP | "Laudo psicológico com enfoque neuropsicológico", citando as Res. CFP 06/2019 e 09/2018 | fixo |
| 1 | Identificação | 1.1 profissional (autora, formação, e-mail); 1.2 paciente (nome, CPF, idade, nascimento) | cadastro do profissional e do paciente |
| 2 | Demanda | 1 parágrafo | digitado |
| 3 | Dados de anamnese | ~7 parágrafos | anamnese do paciente + edição |
| 4 | Observação clínica | 1 parágrafo | digitado |
| 5 | Instrumentos clínicos | lista com **nome em negrito + descrição de 1 linha**; 5.1 complementares (observação, anamnese, BAI, BDI-II, BFP, SRS-2) | testes lançados + descrição padrão por teste |
| 6 | Referencial teórico e metodológico | texto fixo (Miotto, Lezak etc.) + **Tabela 1** de classificação por percentil | fixo (modelo) |
| 7 | Análise dos resultados | 7.1 Funções intelectuais · 7.2 Linguagem · 7.3 Memória · 7.4 Funções executivas · 7.5 Funções atencionais · 7.6 Visuoconstrução e praxia · 7.7 Aspectos emocionais · 7.8 Aspectos psicoafetivos · "Outras escalas" | resultados dos testes + texto |
| 8 | Conclusão | síntese, hipótese diagnóstica com CID | digitado / rascunho de IA |
| 9 | Sugestões e encaminhamentos | lista de "Recomenda-se…" | digitado |
| — | Fecho | local e data, assinatura (imagem), nome, especialidade, CRP; 2 avisos (sigilo/uso e validade de 5 anos / fidedignidade de ~1 ano) | cadastro + texto fixo |
| 10 | Referências bibliográficas | uma por teste usado | **por teste** (já existe `referenciaBibliografica`) |

Identidade visual (cabeçalho e rodapé em todas as páginas): logotipo ME + "Seu equilíbrio cognitivo começa aqui!", marca-d'água do cérebro ao fundo, rodapé com endereço, WhatsApp, Instagram, quebra-cabeça laranja e número da página. Cores: cinza `#737373` e laranja `#E8691E`; tabelas com cabeçalho pêssego. Fonte do corpo: sans-serif ~11 pt, justificado, entrelinha 1,5.

## 2. Padrão de apresentação dos resultados (o mais importante)

- **Por domínio, uma linha por resultado:** `- Rótulo: Teste – subteste percentil NN% Classificação.` Percentil e classificação em **negrito**; quando o resultado está **abaixo da média** (classificação "Média inferior" ou pior) o trecho vai em **vermelho**.
- Cada domínio abre com um parágrafo-definição fixo (ex.: "A memória semântica é um tipo de memória de longo prazo…") e fecha, quando cabe, com uma frase-síntese ("Isadora não apresenta dificuldades…" / "apresenta dificuldades em…").
- Escala de classificação (Miotto, 2017), Tabela 1: Muito superior >98 · Superior 97–91 · Média superior 90–75 · Dentro da média 74–25 · Média inferior 24–9 · Limítrofe 8–3 · Deficitário <2. Os cortes ">98" e "<2" estão corretos como estão (o laudo usa o sinal). **A conferir com ela:** o percentil exatamente 98 e o exatamente 2 (e valores com decimais, como 2,5 ou 8,5) não caem em nenhuma faixa escrita. **Nomes:** a Tabela 1 usa "Média superior / Dentro da média / Média inferior", e o texto usa "Médio Superior / Médio / Médio Inferior" (p. 6, 7 e 8); a Tabela 2 (p. 5) usa "Média Superior" e "Média".
- **Mapa teste → domínio observado** (base para configurar o sistema): WAIS-III índices → Funções intelectuais; Vocabulário, Semelhanças, Informação → Linguagem; Dígitos e Sequência de Números e Letras → Memória operacional; Informação, Vocabulário, Compreensão → Memória semântica; RAVLT → Memória episódica verbal; FDT inibição/flexibilidade, Raciocínio Matricial, Compreensão (julgamento social) → Funções executivas; BPA (concentrada, dividida, alternada) → Funções atencionais; Cubos → Visuoconstrução; BAI, BDI-II → Aspectos emocionais; BFP → Aspectos psicoafetivos; SRS-2 → Outras escalas. O mesmo subteste aparece em mais de um domínio.

## 3. Tabelas do laudo

| Tabela | Colunas | Formatação |
|---|---|---|
| 1 Classificação (Miotto) | Classificação, Percentil % | cabeçalho pêssego |
| 2 Índices fatoriais WAIS-III | Instrumento (ICV, IOP, IMO, IVP, QIT), Pontos, Percent %, Classificação | título mesclado; **linha do QIT em pêssego com amarelo** |
| 3 / 4 BAI e BDI-II | nome da escala, escore, classificação (1 linha) | escore e classificação em vermelho/amarelo |
| 5 SRS-2 | Fator, T-Score, Classificação (7 linhas) | **linha do total em pêssego com amarelo** |

## 4. Gráficos (só 2 no laudo)

Ambos são gráficos do Excel **colados com vínculo** ao arquivo da paciente (por isso trazem o caminho do Drive).

| Gráfico | Tipo e formato | Dados | Origem no Excel | No nosso sistema |
|---|---|---|---|---|
| 1 — Índices fatoriais WAIS-III | colunas, 8 barras com **cor diferente por barra**, rótulo do valor na base, eixo 40–160, **barra de erro fixa de ±7,5**, sem legenda | ICV, IOP, IMO, IVP, QI Verbal, QI Execução, GAI, QI Total | aba WAIS-III, células AJ30:AL37 | já temos os índices e os ICs reais; o gráfico deve ser refeito com IC real por índice (aprovação dela) |
| 2 — Curva de aprendizagem RAVLT | linhas: Paciente (amarelo `#FFC000`, marcador redondo) e Média (azul-marinho); eixo −10 a 20; legenda embaixo | A1…A5, Interf, Pós Int, Tardia, Rec (9 pontos) | aba RAVLT, G65:I74 | já extraímos o mesmo gráfico (também com ±1 e ±2 DP); ela usa só Paciente e Média |

Observações: (a) a legenda do gráfico 2 diz "Percentil %", mas os valores são **número de palavras**; (b) a barra de erro de ±7,5 é fixa, não o intervalo de confiança de cada índice; (c) o **BFP não tem gráfico** no laudo (o "desenho" do Word é só uma moldura laranja em volta do texto interpretativo), embora a aba tenha 11; (d) FDT, BPA, BAI, BDI-II, SRS-2 entram só como texto ou tabela.

## 5. Onde os gráficos novos entram

| Seção do laudo | Gráfico novo sugerido | Fonte |
|---|---|---|
| 7.1 Funções intelectuais | barras dos índices WAIS-III (com IC real); WISC-IV e WASI no mesmo modelo | módulos WAIS/WISC/WASI |
| 7.3 Memória | curva do RAVLT (Paciente × Média ± DP); efeito de posição (pizza) | RAVLT |
| 7.4 Funções executivas | perfil FDT (percentil por condição) | FDT |
| 7.5 Funções atencionais | perfil BPA (percentil das 4 atenções) | BPA |
| 7.8 Psicoafetivos | **BFP: perfil por fator e radares**, que hoje ela não coloca | BFP |
| Outras escalas | SRS-2: perfil dos T-scores por subescala e discrepância entre respondentes; SCARED, E-TDAH, BRIEF-2 por informante | motor de planilha |

## 6. O que o sistema tem hoje e o que falta

Hoje: tela `ComposicaoLaudo` com as 6 seções mínimas da Res. CFP 06/2019, rascunho de Análise e Conclusão por IA, trava de revisão humana, exportação em DOCX **simples** (sem papel timbrado, sem tabelas de resultado, sem gráficos).

Falta para chegar ao modelo dela: (1) as 10 seções e a ordem acima; (2) cabeçalho/rodapé/marca-d'água e assinatura da clínica; (3) lista de instrumentos com descrição padrão por teste; (4) mapa teste→domínio configurável e geração automática das linhas "percentil NN% Classificação" (negrito, vermelho abaixo da média) com a escala dela; (5) tabelas 1–5; (6) gráficos como imagem no DOCX/PDF (gerar PNG a partir do mesmo SVG da tela); (7) referências automáticas por teste; (8) exportar também em PDF.

## 7. Perguntas para ela

1. Corrigir a Tabela 1 (percentis 98 e 2 sem faixa) e padronizar "Média superior / Dentro da média / Média inferior" no texto.
2. A legenda do gráfico 2 deveria dizer "Número de palavras evocadas"?
3. Barra de erro do gráfico 1: usar o intervalo de confiança real de cada índice (90% ou 95%)?
4. Quais gráficos novos ela quer por padrão (BFP, FDT, BPA, SRS-2)?
5. Os textos-definição de cada domínio (7.1 a 7.6) podem virar blocos padrão editáveis?
