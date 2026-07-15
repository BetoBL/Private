# CLAUDE.md — Sistema de Apoio à Avaliação Neuropsicológica

Este arquivo é o briefing de contexto para o Claude Code. Leia por completo antes de gerar código. Os documentos de referência completos (decisões de produto, diagramas DFD/fluxograma) estão em `/docs`.

## O que é o produto

Sistema web para psicólogos(as) que realizam avaliação neuropsicológica (processo de várias sessões semanais ao longo de ~1 mês, aplicando testes psicológicos, depois integrando os resultados em um Laudo Psicológico formal). O sistema:

1. Cadastra clínica, profissionais e pacientes.
2. Permite ao profissional lançar os resultados de testes aplicados manualmente (o sistema NÃO aplica o teste, só corrige/organiza).
3. Calcula escores (bruto → normativo → percentil/classificação) usando as tabelas normativas de cada teste.
4. Usa a API da Anthropic para gerar um RASCUNHO de Análise e Conclusão do laudo, cruzando os resultados de todos os testes da bateria + a anamnese + um "Perfil de Atuação" configurável por profissional (ver seção Perfil de Atuação).
5. Monta o laudo final respeitando a estrutura obrigatória da Resolução CFP nº 06/2019: **Identificação, Descrição da demanda, Procedimento, Análise, Conclusão, Referências**.
6. (Módulos posteriores, não MVP) agenda, convênios/faturamento TISS, portal do paciente.

## Conformidade regulatória sobre uso de IA (crítico — pesquisado nesta rodada)

- **Resolução CFP nº 09/2024** regulamenta o exercício da Psicologia mediado por Tecnologias Digitais (TDICs) — exige que a(o) psicóloga(o) **informe ao paciente quais recursos tecnológicos são usados**, incluindo IA, para garantir sigilo. Isso deve virar um campo de consentimento no cadastro do paciente (`Paciente.consentimentoTDIC`, já no schema).
- O **CFP publicou uma Cartilha específica sobre IA na Psicologia (dez/2025)**: reforça que a IA pode ser usada como apoio, mas (a) a responsabilidade técnica é sempre do profissional, (b) todo output de IA deve ser tratado como **rascunho**, nunca conteúdo final sem revisão humana, (c) recomenda-se registrar no prontuário que IA foi usada como apoio.
- Implicações de produto: o `Laudo` tem os campos `iaUtilizada` e `iaRevisadaPeloProf` — a finalização/exportação do laudo **deve ser bloqueada** enquanto `iaRevisadaPeloProf` for `false`. Isso não é só boa prática, é proteção ética/legal para o profissional que usar o sistema.

## Referências de mercado (o que os concorrentes brasileiros já fazem bem — vale incorporar)

Pesquisei os sistemas de gestão de clínica de psicologia mais estabelecidos no Brasil (PsicoManager — líder desde 2015, Amplimed, GestãoDS, Clinora). Padrões que aparecem em praticamente todos e que vale replicar desde o MVP:
- Lembretes automáticos de sessão (WhatsApp/e-mail) para reduzir falta de paciente
- Anexação de documentos/exames diretamente no prontuário (já previsto no model `Anexo`)
- Controle de acesso por nível de usuário (admin da clínica vs profissional vs recepção)
- Emissão de nota fiscal por sessão — relevante porque **psicólogos não podem ser MEI** no Brasil (atividade intelectual), então o módulo financeiro de uma clínica real eventualmente precisa emitir NFS-e, não só a guia de convênio. Vale deixar espaço no schema para isso na V3, mas não é prioridade do MVP.
- Ênfase forte em LGPD (criptografia, backup, minimização de dados) em todo o marketing desses produtos — é claramente o que o mercado usa como argumento de confiança, então nossa comunicação (e a arquitetura real) deve espelhar isso.

## Regra de negócio inegociável

O sistema **nunca decide um diagnóstico sozinho**. A IA só produz rascunho de texto para revisão humana. O profissional sempre valida/edita/assina antes de o laudo virar documento final. Isso deve ficar explícito na UI (ex: rascunho marcado visualmente como "não revisado" até o profissional confirmar).

## Stack sugerida (ajustável — o usuário já usa este stack em outros projetos)

- Backend: Node.js + Express (ou Fastify) + TypeScript
- ORM/DB: Prisma + PostgreSQL
- Frontend: React + TypeScript, Tailwind CSS
- IA: API da Anthropic (`@anthropic-ai/sdk`), modelo `claude-sonnet-4-6` para a etapa de síntese de laudo
- Autenticação: JWT, multiusuário/multi-tenant (clínica → profissionais)
- Deploy alvo: Render (padrão que o usuário já usa nos outros projetos dele)

## Estrutura de pastas sugerida

```
/apps
  /api          -> backend Node/Express + Prisma
  /web          -> frontend React
/packages
  /shared-types -> tipos TypeScript compartilhados (ex: enums de domínio de teste)
/docs           -> documentos de produto e diagramas (copiar os .mermaid e .md deste handoff)
/prisma
  schema.prisma -> ver schema inicial em prisma/schema.prisma neste pacote
```

## Modelo de dados (ponto de partida — ver prisma/schema.prisma)

Entidades centrais: `Clinica`, `Profissional`, `PerfilDeAtuacao`, `Paciente`, `Convenio`, `Sessao`, `Teste` (catálogo fixo + custom), `TabelaNormativa`, `AplicacaoDeTeste`, `Laudo`.

Pontos de atenção no schema:
- `Teste` precisa suportar tanto instrumentos do catálogo fixo (seed inicial) quanto testes cadastrados por um `Profissional` específico (campo `criadoPorProfissionalId` nullable + `escopo: 'FIXO' | 'CUSTOM'`).
- `TabelaNormativa` deve ser flexível o suficiente para representar diferentes tipos de norma (por idade, por escolaridade, por sexo, por região) — sugestão: armazenar como JSON estruturado + faixas (`faixaMin`, `faixaMax`, `criterio`, `percentilOuEscore`), para não precisar alterar o schema a cada teste novo.
- `AplicacaoDeTeste.escoresBrutos` pode ser JSON (estrutura varia por teste).
- `Laudo` guarda as 6 seções da Resolução 06/2019 como campos de texto (rich text/markdown), mais um campo de status (`RASCUNHO_IA`, `EM_REVISAO`, `FINALIZADO`, `ENTREGUE`).
- `PerfilDeAtuacao` (1:1 com `Profissional`) guarda: abordagem teórica, tom de escrita, regras de prudência clínica, e uma referência a laudos-exemplo (para few-shot na chamada da IA).

## Fluxo da chamada de IA (síntese do laudo)

Ao gerar o rascunho de Análise/Conclusão, montar o prompt com:
1. Anamnese/descrição da demanda do paciente
2. Lista de testes aplicados + resultados já calculados (percentis, classificações — não escores brutos)
3. Conteúdo do `PerfilDeAtuacao` do profissional responsável
4. Instrução explícita: gerar apenas rascunho técnico, sem afirmar diagnóstico fechado sem ressalva, sempre citando que cabe validação do profissional
5. Formato de saída: JSON estruturado com campos `analise` e `conclusao` (facilita popular o formulário de edição no frontend)

Nunca enviar dados de identificação sensíveis desnecessários (CPF, endereço) no prompt — só o necessário para a análise clínica.

## O que construir primeiro (ordem sugerida para o MVP)

1. Schema Prisma + migrações + seed com 5-8 testes fixos (a definir quais, aguardando lista da psicóloga)
2. CRUD de Paciente, Profissional, Clínica (single-tenant simplificado primeiro)
3. Tela de lançamento de resultado de teste (uma tela genérica dirigida por metadado do `Teste`, não uma tela por teste)
4. Motor de cálculo (bruto → norma → percentil → classificação) como função pura testável isoladamente
5. Tela de composição do laudo (6 seções), com botão "gerar rascunho com IA" chamando o backend
6. Exportação do laudo em DOCX

## Referências de produto (ler antes de codar)

- `docs/sistema-laudos-neuropsicologicos-briefing.md`
- `docs/projeto-completo-sistema.md`
- `docs/diagramas/*.mermaid`

## Pendências que ainda vão chegar (não travar o design nelas, mas deixar espaço)

- Lista definitiva de testes que a psicóloga usa (vai definir o seed inicial do catálogo fixo)
- Um laudo real dela (anonimizado) como exemplo de estilo
- Logo/identidade visual da clínica dela
