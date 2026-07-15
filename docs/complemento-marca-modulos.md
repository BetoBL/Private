# Complemento ao Projeto — Marca, Módulo de Trânsito/CNH, Referencial Teórico e "Atmosfera"

## 1. Sobre a logo (MentEssence — Neuropsicologia & Avaliação)

Recebi e visualizei o arquivo. É um monograma minimalista em preto e branco, combinando as iniciais **M/E** de forma estilizada, com o nome **MentEssence** e o subtítulo **"Neuropsicologia & Avaliação"**. É um logo limpo, moderno, sério — sem cor definida, o que na verdade é ótimo: dá liberdade total para eu construir uma paleta que converse com a marca sem competir com ela.

### Paleta oficial (extraída diretamente do arquivo da logo, não mais uma suposição)

Você mandou o print com as cores reais, e extraí os valores exatos direto do arquivo:

| Papel | Cor | Hex | Por quê |
|---|---|---|---|
| Acento primário (marca) | Laranja MentEssence | `#E66A1F` | A cor de identidade real do logo (nome + subtítulo) |
| Acento primário — hover/ativo | Laranja profundo | `#C25716` | Variação mais escura para estados ativos/hover, mantendo a mesma cor |
| Secundário / neutro de apoio | Cinza MentEssence | `#737373` | O cinza exato do monograma e dos ícones (cérebro, quebra-cabeça) |
| Tinta (texto, sidebar) | Carvão quase preto | `#262624` | Neutro escuro que ecoa o peso visual do monograma, sem ser preto puro |
| Fundo | Papel quente | `#F5F3EC` | Neutro acolhedor, não branco hospitalar |
| Superfícies/cards | Névoa neutra | `#E7E4DD` | Separa seções sem introduzir uma terceira cor |
| Alerta/urgência (uso raro) | Vermelho terroso | `#A83232` | Precisa ser visualmente distinto do laranja de marca para não confundir "ativo" com "alerta" |

Já atualizei os dois protótipos HTML (`mockup-tela-inicial.html` e `prototipo-navegavel.html`) com essas cores reais — o laranja agora é o acento principal (botões, navegação ativa, destaques), e o cinza vira a cor de apoio para elementos secundários (badges de convênio, textos de meta-informação), no lugar do verde-sálvia/argila que eu tinha especulado antes.

Montei um **mockup da tela inicial** com essa direção (arquivo `mockup-tela-inicial.html` — abra no navegador ou visualize aqui no chat). Ele já mostra: a saudação acolhedora, o "Cantinho do Café" (seção 4) e os módulos como cartões — para você já ter algo visual pra mostrar pra ela e "encantar", como você pediu.

---

## 2. Módulo de Trânsito/CNH (Detran) — o que descobri

Você mencionou que ela está se credenciando para isso — pesquisei o marco regulatório específico, que é **diferente** do laudo neuropsicológico comum:

- A perícia psicológica de trânsito é regida pela **Resolução CFP nº 01/2019** (normas e procedimentos da perícia psicológica no contexto do trânsito) e pela **Resolução CONTRAN nº 927/2022** (credenciamento de entidades, atualizada por normas mais recentes de 2025 — o CFP confirmou em dez/2025 que a avaliação psicológica continua obrigatória para a CNH).
- Só pode atuar quem tem **Título de Especialista em Psicologia do Tráfego** (reconhecido pelo CFP) ou a capacitação equivalente — ou seja, é uma credencial pessoal da psicóloga, não algo que o sistema resolve.
- A **entrevista psicológica é obrigatória** e tem função própria (não é só aplicar teste).
- A psicóloga tem autonomia para escolher os testes, desde que aprovados pelo SATEPSI — geralmente usa-se testes de atenção, personalidade e traços de impulsividade/agressividade (ex: os que já aparecem no catálogo do AvalPsico para "Laudo de Trânsito": Palográfico, testes de atenção, etc.).
- O resultado não é um "Laudo Psicológico" nos 6 itens da Resolução 06/2019 — é um **parecer estruturado no formulário RENACH**, com resultado padronizado: **apto / apto com restrições / inapto temporário / inapto permanente**.
- Existe processo de recurso (Junta Psicológica) se o candidato discordar do resultado.

**Implicação de design:** o módulo de Trânsito/CNH reaproveita o mesmo **motor de correção de testes** (a parte técnica que já desenhamos), mas usa um **template de documento diferente** do laudo padrão — precisa de um gerador de "Parecer/Formulário RENACH" específico, com os campos de aptidão exigidos. Como módulo separado e opcional, isso se encaixa bem na arquitetura modular que você já pediu.

Quanto a "o que os outros sistemas tiverem, complementamos" — concordo com sua abordagem: não vou tentar adivinhar o conteúdo clínico específico (isso é conhecimento dela), mas o sistema já nasce com esse módulo **estruturalmente pronto para receber** os testes e o template de parecer assim que ela definir o conteúdo. Fica registrado como pendência.

---

## 3. Referencial teórico para alimentar o sistema (pesquisa que você pediu)

Pesquisei quem são as referências mais citadas no Brasil especificamente sobre **como escrever laudo neuropsicológico** (não só aplicar teste). A obra mais relevante e usada como referência nacional é:

> **"Como Escrever um Laudo Neuropsicológico?"** — Coleção Neuropsicologia na Prática Clínica, organizada por **Leandro F. Malloy-Diniz e Paulo Mattos**, com autoria de **Nicolle Zimmermann, Renata Kochhann, Hosana Alves Gonçalves e Rochele Paz Fonseca** (Pearson Clinical Brasil). É um guia com exemplos práticos de laudos em diferentes contextos (escolar, hospitalar, envelhecimento, forense), incluindo trechos de laudos inadequados reescritos de forma mais técnica — exatamente o tipo de material que dá pra usar para **treinar o tom/estrutura padrão** que a IA sugere como ponto de partida, antes de ser personalizado pelo Perfil de Atuação de cada profissional.

Sugestão prática: quando formos implementar, posso usar os princípios dessa obra (não o texto literal, por questão de direitos autorais) para montar o **"Perfil de Atuação padrão"** que todo profissional novo recebe ao entrar no sistema — um bom ponto de partida, que ele depois refina com o próprio estilo. Se quiser, quando tivermos o laudo real da psicóloga, comparo o estilo dela com esse padrão para calibrar melhor.

---

## 4. Módulo "Atmosfera" — Cantinho do Café

Gostei muito dessa ideia — é o tipo de coisa que faz um sistema de uso diário parecer vivo, não só uma ferramenta de trabalho. Proposta de design, como **módulo opcional** que aparece na tela inicial:

**"Bom dia, [Nome]"** — cabeçalho acolhedor, com data e uma frase curta do dia.

**Mensagem do dia** — uma frase gerada (ou de um banco curado) reconhecendo o valor do trabalho da psicóloga, trocada diariamente. Importante: gerar isso com cuidado para não soar genérico/piegas — vale ter um banco de 60-90 mensagens escritas com qualidade (não geradas em massa) + um fallback de geração por IA quando o banco se esgotar, sempre com revisão de tom.

**Notícias do dia (curadoria, não geração)** — pequeno carrossel com 3-5 manchetes de saúde mental/psicologia/neurociência do dia, com imagem quando disponível e link para a fonte original. Do ponto de vista técnico:
- Buscar via um agregador de notícias (ex: NewsAPI, ou RSS de fontes como CFP, portais de saúde/psicologia) rodando um job diário no backend.
- **Importante (direito autoral):** mostrar só manchete + resumo curto original (2-3 frases, nunca copiando o texto da fonte) + imagem (quando a fonte permitir) + link — nunca reproduzir o artigo inteiro dentro do sistema.

**Toggle "Modo silencioso"** — para quem não quiser esse módulo ligado (nem todo profissional vai querer, como você mesmo apontou sobre módulos opcionais).

Isso é 100% compatível com a arquitetura modular que já desenhamos — é só mais um módulo que se liga/desliga por profissional.

---

## 5. Próximos passos

- Mockup da tela inicial pronto (ver arquivo) — me diga o que muda antes de levarmos pra ela.
- Módulo de Trânsito/CNH: registrado como módulo futuro, aguardando o conteúdo técnico dela.
- Quando tiver o laudo real da psicóloga, cruzo com a referência bibliográfica citada acima para calibrar o Perfil de Atuação padrão.
