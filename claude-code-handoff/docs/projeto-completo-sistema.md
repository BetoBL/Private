# Projeto Completo — Sistema de Apoio a Avaliação Neuropsicológica

> Este documento complementa o `sistema-laudos-neuropsicologicos-briefing.md` já entregue. Ele detalha o escopo ampliado que você trouxe: multiclínica, multiprofissional, convênios/TISS, perfil de atuação configurável por IA, prontuário do paciente, e a decisão de arquitetura modular.

---

## 1. Visão do produto

Um sistema de uso **diário** do psicólogo — não só "gerador de laudo" — que acompanha o ciclo completo: cadastro → agenda → sessões → correção de testes → síntese assistida por IA → laudo → devolutiva → faturamento (particular ou convênio).

**Diferencial competitivo real** frente a AvalPsico e Cognitiva Laudos:
1. **Motor de testes híbrido**: catálogo fixo e curado (testes SATEPSI mais usados) + um motor **aberto**, onde qualquer profissional cadastra seu próprio instrumento e tabela normativa. Isso os concorrentes não têm — eles são fechados no catálogo deles.
2. **Perfil de Atuação do Profissional** — um "system prompt" clínico configurável (ver seção 4), que faz a IA escrever a Análise/Conclusão no estilo, referencial teórico e vocabulário de cada profissional, ao invés de um texto genérico "robótico".
3. **Modular** — cada clínica/profissional liga só o que quer usar (agenda, convênio, IA de síntese, etc.), então tanto serve para uma psicóloga autônoma quanto para uma clínica com vários profissionais de perfis diferentes.
4. **Multiclínica/multiprofissional desde o desenho do banco de dados** — pensado para ser vendido como produto (SaaS), não só uma ferramenta interna da psicóloga.

---

## 2. Personas

| Persona | Necessidade principal |
|---|---|
| **Psicóloga autônoma** (nosso primeiro caso de uso) | Reduzir tempo de correção e redação do laudo, sem perder o "jeito dela" de escrever |
| **Clínica com vários profissionais** | Padronizar cadastro, agenda e faturamento; cada profissional com seu próprio perfil de atuação e testes |
| **Administrativo/financeiro da clínica** | Controlar convênios, valores contratados, emissão de medições/guias |
| **Paciente/responsável** | Vivenciar um processo acolhedor, com uma "porta de entrada" que transmita cuidado, não burocracia |

---

## 3. Estrutura de módulos

**Núcleo (sempre ativo):**
- Autenticação e permissões (multiusuário, multiclínica)
- Cadastro de Paciente (ficha completa)
- Cadastro de Profissional e Clínica
- Motor de Testes (correção fixo + aberto)
- Geração de Laudo (conforme Resolução CFP 06/2019)

**Módulos opcionais (o profissional ativa se quiser):**
- Agenda integrada (sessões de avaliação + outros tipos de atendimento do profissional)
- Convênios e Faturamento (TISS)
- Motor de Síntese com IA (Perfil de Atuação)
- Anexos/prontuário estendido (fotos, documentos, laudos externos, exames)
- Portal do paciente (acompanhar agendamentos, receber laudo digital)
- Relatórios gerenciais para a clínica (produtividade, faturamento por convênio)

### 3.1 Cadastros detalhados

**Clínica**
- Razão social, CNPJ, endereço, telefone, logo, cores da marca (para personalizar o laudo/portal)

**Profissional**
- Nome, foto, CRP, telefone, endereço particular, formação/especializações, quais convênios atende, assinatura digital/certificado, **Perfil de Atuação** (seção 4)

**Convênio**
- Nome da operadora (Amil, etc.), código de prestador, serviços contratados (ex: consulta, avaliação psicológica, cada sessão), tabela de valores por procedimento (código TUSS), regras de autorização prévia

**Paciente**
- Dados pessoais, responsável legal (se menor), contato, convênio vinculado, **foto**, histórico (anamnese estruturada), anexos (documentos, laudos de outros profissionais, exames médicos), linha do tempo de sessões e testes aplicados

---

## 4. Perfil de Atuação do Profissional (o grande diferencial)

Ideia: assim como você configura minha "memória" para eu responder alinhado ao seu jeito de trabalhar, o profissional configura um perfil que orienta a IA na hora de gerar o **rascunho** de Análise e Conclusão do laudo. Sugestão de campos:

- **Formação e abordagem teórica** (ex: neuropsicologia cognitivo-comportamental, psicanálise, etc.) — influencia o referencial citado
- **Tom de escrita preferido** (mais técnico/acadêmico vs. mais acessível ao leigo)
- **Estrutura de frase padrão** que costuma usar em conclusões (ex: sempre trazer prejuízo funcional antes da hipótese diagnóstica)
- **Vocabulário e expressões recorrentes** (glossário pessoal — extraído automaticamente se ela subir laudos antigos como exemplo, algo como "aprendizado por exemplos")
- **Regras de prudência clínica** (ex: nunca fechar diagnóstico fora de TDAH/TEA sem encaminhar para avaliação médica complementar)
- **Modelo(s) de laudo de referência** — ela sobe 2-3 laudos que já usou, e o sistema aprende a estrutura textual

Esse perfil fica **versionado e editável pelo próprio profissional a qualquer momento** — é basicamente uma ferramenta interna de "auto-ajuste" da IA, sem precisar mexer em código.

---

## 5. Faturamento e convênios (Amil e outras operadoras)

Pesquisei isso agora: não existe uma "API da Amil" pública e proprietária — o que existe é o **padrão TISS** (Troca de Informação de Saúde Suplementar), definido pela ANS e **obrigatório para todas as operadoras**, incluindo a Amil. Na prática:

- O prestador (clínica/profissional) gera **guias em XML no formato TISS** (guia de consulta, SP/SADT, honorários) e envia pelo **portal do prestador da própria operadora** ou por integração eletrônica.
- Existem versões do padrão (hoje TISS 4.02/4.03) e cada guia tem estrutura fixa definida pela ANS — não dá para inventar formato próprio.
- Existem empresas especializadas (ex: TISSXML, Amplimed) que oferecem **APIs que geram e validam o XML TISS a partir de um JSON simples**, evitando que vocês implementem o padrão inteiro do zero. Recomendo tratar essa camada como um **serviço terceirizado plugável** no módulo de faturamento, em vez de implementar o parser TISS na unha — é um padrão grande e sujeito a mudanças frequentes da ANS.
- Fluxo esperado no sistema: Atendimento realizado → sistema monta a guia (dados do paciente, procedimento/código TUSS, valor contratado) → converte para XML TISS (via serviço próprio ou terceirizado) → envia à operadora → recebe autorização/demonstrativo de pagamento/glosa e atualiza o financeiro.

Isso vale a pena ser um módulo **posterior ao MVP** — é peça de infraestrutura financeira, não o core da proposta de valor (o motor de testes + IA de síntese).

---

## 6. Identidade visual sugerida

Área da psicologia/saúde mental costuma trabalhar com paletas que transmitem **calma, confiança e acolhimento**, evitando cores muito "clínicas" (branco/azul frio puro, que lembra hospital) ou muito "corporativas" (azul royal genérico). Sugestões de direção (a validar com a logo que você vai me mandar):

- **Tons de verde-azulado/teal** (ex: `#2E7D6B`, `#4FA98A`) — associado a equilíbrio emocional e crescimento; é a mesma direção que a Cognitiva Laudos usa (`#00A2AD`)
- **Areia/bege quente** como neutro de fundo, no lugar de branco puro — mais acolhedor
- Um **tom terroso ou lilás suave** como cor de destaque/CTA, remetendo a cuidado sem ser infantil
- Tipografia arredondada e humana para textos voltados ao paciente; mais neutra/técnica nas telas do profissional

Para a **tela inicial** (a "porta de entrada" que você mencionou), pensar numa mensagem curta e humana antes de qualquer formulário — ex: uma ilustração simples (mãos, uma pessoa sendo acompanhada, um caminho) com uma frase de acolhimento, antes de "começar cadastro". Quando você mandar a logo da psicóloga, ajusto a paleta para casar com a marca dela.

---

## 7. Diagramas

Preparei 4 diagramas (arquivos `.mermaid` na pasta `diagramas/`):

1. **`fluxograma-jornada-completa.mermaid`** — o fluxo ponta a ponta: cadastro → sessões semanais → correção → síntese IA → laudo → devolutiva → faturamento.
2. **`dfd-nivel0-contexto.mermaid`** — DFD de contexto: o sistema como uma caixa única e as entidades externas (paciente, profissional, admin, operadora de convênio).
3. **`dfd-nivel1-processos.mermaid`** — DFD nível 1: os 6 macroprocessos (cadastros, agenda, motor de correção, motor de integração/IA, laudos, faturamento) e os data stores.
4. **`dfd-motor-correcao-teste-template.mermaid`** — **importante**: em vez de desenhar um DFD para cada um dos 100+ testes (o que seria repetir a mesma estrutura 100 vezes), desenhei um **template genérico e parametrizável**, porque todo teste segue o mesmo padrão de processamento: registrar escore bruto → localizar norma → converter em percentil/escore padronizado → classificar → gerar gráfico. Esse template é **instanciado** para cada teste (WISC usa a norma do WISC, RAVLT usa a norma do RAVLT, um teste customizado usa a tabela que o profissional cadastrar). Se depois vocês quiserem o detalhamento específico de 2-3 testes-chave (ex: o fluxo exato do WISC-IV com seus 10 subtestes, ou de uma escala de TDAH), aí sim vale desenhar um DFD específico — me avise quais testes ela mais usa e eu detalho esses.

---

## 8. Roadmap sugerido

**MVP (validar o fluxo ponta a ponta com 1 profissional, 1 clínica, 1 bateria)**
- Cadastro de paciente + profissional (single-tenant primeiro)
- Motor de correção com 5-8 testes fixos (os que a psicóloga mais usa)
- Geração de laudo nos 6 itens da Resolução 06/2019, exportando DOCX
- Perfil de Atuação básico (texto livre + 1-2 exemplos de laudo)
- Síntese assistida por IA (rascunho de Análise/Conclusão)

**V2**
- Motor de testes aberto (profissional cadastra teste próprio)
- Multiclínica/multiprofissional completo
- Agenda integrada
- Anexos/prontuário estendido

**V3**
- Convênios e faturamento (TISS), começando por geração de guia e controle manual de envio
- Portal do paciente
- Integração eletrônica direta com operadoras (via serviço terceirizado de TISS)
- Venda como produto SaaS multi-tenant (billing, planos, etc.)

---

## 9. Modelo de dados — visão de alto nível

Entidades principais (detalhamento técnico no material para o Claude Code):

`Clinica` → tem muitos `Profissional`
`Profissional` → tem um `PerfilDeAtuacao`, atende vários `Paciente`, atende vários `Convenio`
`Paciente` → pertence a uma `Clinica`, tem muitas `Sessao`, um `Convenio` (opcional), muitos `Anexo`
`Sessao` → referencia `Paciente`, `Profissional`, tem muitas `AplicacaoDeTeste`
`Teste` (catálogo fixo ou custom) → tem `TabelaNormativa`, pertence a um `Dominio` (atenção, memória, etc.)
`AplicacaoDeTeste` → referencia `Sessao` + `Teste`, guarda escores brutos e resultado calculado
`Laudo` → referencia `Paciente` + `Profissional`, agrega resultados de várias `AplicacaoDeTeste`, guarda as 6 seções da Resolução 06/2019
`Convenio` → pertence a `Clinica`, tem `TabelaDeValores` (procedimento/TUSS/valor)
`Guia` (faturamento) → referencia `Sessao`/`Laudo` + `Convenio`, status (pendente/enviada/paga/glosada)

---

## 10. Sobre sua pergunta: começar aqui no chat ou já ir para o Claude Code?

**Recomendação: comece aqui (o que já estamos fazendo) para fechar o desenho, e mude para o Claude Code assim que for começar a escrever código de verdade.**

Por quê:
- Aqui no chat é ótimo para **iterar rápido em texto, diagramas e decisões de escopo** sem custo de setup, e dá pra gerar arquivos/diagramas como os que acabei de fazer — isso vira a "fonte da verdade" do projeto.
- O **Claude Code** é a ferramenta certa para a fase de **implementação**: ele roda comandos, cria e edita múltiplos arquivos de um projeto real, instala dependências, roda testes, faz commits — coisas que esse ambiente de chat não faz tão bem para um projeto grande e contínuo.
- O caminho mais eficiente: eu preparo aqui um **pacote de handoff** (já fiz: este documento + diagramas +, a seguir, um `CLAUDE.md` com o briefing técnico + um schema de banco inicial). Você abre esse pacote de arquivos no Claude Code (ou `claude code` na pasta do projeto) e ele já começa sabendo exatamente o que construir, sem você ter que reexplicar tudo.
- Continuamos usando o chat para as decisões de produto/negócio (como agora), e o Claude Code para execução técnica dia a dia.

A seguir vou montar esse pacote de handoff (`CLAUDE.md` + schema inicial) para você já abrir direto no Claude Code.
