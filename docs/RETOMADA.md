# Retomada do trabalho (NeuroLogic / MentEssence)

Atualizado em **21/10/2026**, antes de o computador ser reiniciado. Este arquivo diz onde paramos, o que foi feito em cada conversa e o que falta. Leia primeiro a seção "Onde paramos".

## Onde paramos

**Último pedido do usuário (21/10):** redesenhar a entrada de dados dos testes. Cada teste deve abrir uma **área própria, bonita e chamativa**, com entrada de dados, **gráficos que aparecem vazios e são alimentados ao vivo** conforme se digita, e espaço para **comentários** sobre o teste e sobre **como lançar os dados**. Ideia: dar outra cara ao sistema.

**O que já está feito disso (commit `4e13053`, só local, NÃO publicado):**
- "Estúdio do teste" para os ~45 testes do motor de planilha (ex.: D2-R): cabeçalho de destaque com anel de progresso, painel "Resultados ao vivo" (perfil em barras, gráficos do Excel em esqueleto desde o início, tabelas), caixa de comentários e aba "Como lançar os dados".
- Migration nova **`aplicacao_comentarios`** (coluna `comentarios` em `AplicacaoDeTeste`). Existe só no banco local; **falta aplicar no Render** ao publicar.

**Próximos passos combinados/propostos:**
1. O usuário avalia o estúdio do D2-R (estilo do cabeçalho; quer ver outro teste, como RAVLT ou Stroop?).
2. Levar o mesmo estúdio aos testes com tela própria (**WAIS-III, WISC-IV, WASI**, que têm abas) e aos de campo único (**BDI-II**, BAI etc., hoje só um campo).
3. Publicar: aplicar `aplicacao_comentarios` no Render (`env -u DATABASE_URL npx prisma migrate deploy` em `apps/api`, conferindo o host) e `git push origin master`.

**Pendências do usuário (não dependem de código):**
- Enviar `docs/revisao-leticia/PACOTE-REVISAO.md` à Letícia (textos clínicos, escalas, Diário, anamneses e o **termo de consentimento**, que também precisa do jurídico).
- Configurar no Render as variáveis `RESEND_API_KEY`, `EMAIL_REMETENTE` e `WEB_URL` se quiser o aviso de sofrimento intenso também por e-mail.
- Testar em produção: `https://neurologic-web.onrender.com` (sair e entrar, Ctrl+Shift+R).

## O que está publicado em produção (Render)

Último push publicado: **`873ce41`** (20/10/2026). Banco de produção em dia até a migration `agenda_sessao_detalhes`. Site: `https://neurologic-web.onrender.com`; API: `https://neurologic-api.onrender.com` (deploy automático a cada push na `master` de `BetoBL/Private`).

## Histórico por data

**15/10/2026**
- Estudo do Sintropia (concorrente, só observado): notas em `docs/estudo-sintropia/`.
- Fase 1 do prontuário multiprofissional: evolução da sessão (modelos LIVRE, SOAP, FOCO, DBT, CONSULTA, REABILITACAO), continuidade do cuidado, PDF, categoria do profissional.
- Agenda recorrente, escalas de triagem (PHQ-9, GAD-7, DASS-21), Diário v2, formulários e anamneses.
- Escalas novas: AUDIT, PCL-5, WHO-5, SWLS (total 7). Pacote de revisão para a Letícia gerado do código (`apps/api/gerar-pacote-revisao.ts`).
- Aviso ao profissional quando o paciente registra sofrimento intenso (Painel do dia; e-mail só com as variáveis do Resend).
- Paciente "com laudo" x acompanhamento (campo `fazLaudo`; os já cadastrados viraram "com laudo"), com aba "Laudo" agrupando Anamnese, Linha do tempo, Dashboard e Laudos.
- Resumo por IA: "Gerar evolução com IA" (a partir das anotações da sessão) e "Resumo do caso"; exigem o consentimento do paciente (CFP 09/2024). Modelo configurável por `MODELO_IA` (padrão `claude-sonnet-5-5`).
- Perfil completo do paciente (cartões e edição), botão e cartão de Anamnese, aba Sessões, janela "Agendar sessão", ambiente da sessão em tela cheia, aba Financeiro na ficha, painel inicial novo, botões em pílula.
- **Publicado** em 15 a 16/10 (11 migrations no Render).

**16/10/2026**
- Check-in de teste no Sintropia (Tristeza 5): etapa Mochila; sem aviso de segurança do lado deles.
- Publicação completa conferida em produção.

**19 e 20/10/2026**
- Regra do usuário: fazer os check-ins de teste do Sintropia (paciente de teste, sessão logada no Chrome) em lotes de até 4 dias, até ~28/10. Já feitos: 16 (Tristeza 5), 17 (Ansiedade 2), 18 (Alegria 4), 19 (Raiva 3), 20 (Medo 4). Resultado e regras de quando cada etapa aparece: `docs/estudo-sintropia/04-cartao-diario.md`.
- Diário com etapas automáticas: "O que pesou" só com emoção difícil e intensidade 4 ou 5; "Vontades" só se o paciente disser que veio vontade de agir; perguntas próprias para emoções boas; cartão "Seu dia de hoje"; 3 modos por etapa (Automático, Sempre, Nunca).
- Painel do dia com saudação e resumo num bloco só (IA não cumprimenta mais).
- **Publicado** em 20/10 (`873ce41`).

**21/10/2026**
- Estúdio do teste, primeira versão (ver "Onde paramos"). Commit `4e13053`.

## Como subir o ambiente local depois de reiniciar

O banco de teste, a API e o site locais caem com o reinício. Tudo foi guardado em **`C:\Projetos\_dev-local-neurologic\`** (fora do repositório):
- `iniciar-ambiente-local.ps1`: sobe o banco (porta 5544), a API (3333) e o site (5173). Na primeira vez roda `npm install` na pasta `pg`.
- `pg\dados`: o banco local (cópia feita em 21/10/2026, com os pacientes de teste, as sessões e o que foi lançado).
- `ferramentas\`: o robô de capturas de tela (`cdp.cjs`, usa o Edge) e os scripts de teste ponta a ponta.

Depois abra `http://localhost:5173` e entre com **`dev@mentessence.local` / `dev12345`** (só existe no banco local). Pacientes de teste úteis: "Marina Teste IA" (perfil completo, evoluções, cobranças), "Paciente Laudo", "Helena Exemplo Prado".

Atenção: o `.env` de `apps/api` aponta para a **produção**. Para rodar localmente use sempre `DATABASE_URL="postgresql://postgres:postgres@localhost:5544/neurologic_local"` (o script já faz isso). Migrations locais: `npx prisma migrate dev`; em produção: `env -u DATABASE_URL npx prisma migrate deploy`, conferindo antes o host (Render, `neurologic_db`).

## Regras de trabalho combinadas

- Escrever tudo no `CHANGELOG.md` e commitar com caminhos explícitos; publicar (migrations + push) **só com o OK do usuário**, pedindo a cada vez.
- Não rodar `prisma format` (reescreve o schema inteiro). Não rodar o seed completo em produção.
- Textos clínicos (laudo, escalas, anamneses, termos) são da psicóloga: não reescrever sem avisar; o que muda vai para a Letícia revisar.
- Paridade com a planilha Excel: conferir item a item antes de dizer que um teste está pronto.
- Resultado das escalas é triagem, não diagnóstico; o paciente nunca vê a pontuação.

## Ainda não feito (ideias já discutidas)

Transcrição da videochamada alimentando a sessão; lousa; biblioteca compartilhada com o paciente; estudo de caso; geração automática de cobrança ao finalizar a sessão; WhatsApp (precisa de provedor); login do paciente por Google; agenda em visão de mês e dia; criar a sala de vídeo ao agendar; formulário "Cadastro e faturamento" ainda é um bloco à parte no mesmo padrão visual; testes restantes do menu da planilha fora do motor (BRIEF-2, Boston, ABAS-3 etc.).
