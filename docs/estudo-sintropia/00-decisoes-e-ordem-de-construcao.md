# Sintropia.psi → NeuroLogic: decisões e ordem de construção

Base: 11 documentos de estudo desta pasta (15/10/2026), feitos em modo leitura, com uma paciente fictícia. Objetivo do usuário: **módulo de consultório para qualquer profissional, com uma área própria do psicólogo junto com os laudos**, e **mudar a cara do sistema** (só a mecânica é inspiração).

## 1. O que o Sintropia é (em uma frase)
Um sistema de consultório centrado em **sessão → evolução → continuidade**, com um **app do paciente** (check-ins diários e escalas) que devolve ao psicólogo **leituras prontas para a próxima sessão**, e uma IA (a "LUMA") que **só rascunha e sempre para revisão**. Não tem nada de avaliação neuropsicológica nem laudo: nesse ponto o NeuroLogic é diferente e mais forte.

## 2. Princípios que adotamos
1. **Copiamos a mecânica, nunca o conteúdo.** Textos de anamneses, cartas, escalas licenciadas, mensagens, nomes de produto e visual são deles ou de terceiros. Fazemos os nossos, com revisão da Letícia.
2. **Motor genérico + bibliotecas de conteúdo trocáveis** (etapas e grupos de opções por tema; escalas com regra de pontuação; modelos de sessão e de estudo de caso por abordagem).
3. **IA sempre como rascunho revisável**; nada vai ao prontuário sem o profissional aprovar; "triagem, não diagnóstico"; paciente não vê pontuação.
4. **O paciente decide o que compartilha** (o que fica privado, o que vai ao psicólogo); consentimento e transparência de acesso.
5. **Tudo apagável/editável** (regra do usuário): apagar = desativar com histórico recuperável (como a lixeira e o filtro "apagadas" deles).

## 3. Matriz: o que fazer, para quem, e onde estamos
Legenda de público: **Todos** = qualquer consultório (psicólogo, médico, fisio, etc.); **Psi** = área do psicólogo; **Neuro** = nosso diferencial.

| # | Funcionalidade (Sintropia) | NeuroLogic hoje | Público | Valor | Esforço | Fase |
|---|---|---|---|---|---|---|
| 1 | **Evolução e anotações da sessão** (2 folhas: privada + prontuário; barra inteligente) | só "observações" na sessão | Todos | Muito alto | Médio | **1** |
| 2 | **Modelos de sessão** (livre, estruturada/bússola, SOAP, DBT) + **continuidade do cuidado** (planos de ação, tópicos para a próxima sessão) | não temos | Todos (SOAP) / Psi | Alto | Médio | **1** |
| 3 | **Prontuário geral** (reunir evoluções selecionadas num documento) + **PDF** | não temos | Todos | Alto | Baixo | **1** |
| 4 | **Agenda** com recorrência (semanal, quinzenal, 4 semanas, "manter recorrente"), bloqueio, férias, janelas livres, ocupação | agenda existe; recorrência a conferir | Todos | Alto | Médio | **1** |
| 5 | **Financeiro**: controle por paciente, extrato, "quanto entrou × quanto gerei", **pacotes** (mensal, por sessões, créditos), despesas por categoria, tags, exportar XLSX, recibo | cobranças, baixa, resumo, NFS-e | Todos | Alto | Médio | **2** |
| 6 | **Cartão Diário** em motor genérico (etapas + bibliotecas por tema, DBT com comportamentos-alvo, personalização por paciente, leitura clínica para a sessão) | fase 1 publicada (padrão único) | Psi | Muito alto | Médio | **2** |
| 7 | **Escalas de triagem** (envio, prazo/recorrência, pontuação por subescala, faixas, gráficos, análise opcional) | não temos (só testes neuropsi presenciais) | Psi (e Todos: PHQ-9, GAD-7) | Muito alto | Alto | **2** |
| 8 | **App do paciente** (login Google, código de conexão, check-in, escalas, biblioteca, documentos) | só link sem login para o Diário | Psi (e Todos) | Muito alto | Alto | **3** (você pediu para o final) |
| 9 | **Anamnese/Forms**: biblioteca de modelos, copiar e editar, **enviar por link**, resposta com IA | anamnese como sessão com ficha | Todos | Alto | Médio | **2** |
| 10 | **Resumo longitudinal por IA** (síntese, evolução, padrões, pontos de atenção, perguntas para a próxima sessão) | resumo do dia | Psi/Todos | Alto | Médio | **3** |
| 11 | **Estudo de caso por abordagem** (13 modelos; liberado após 2 sessões; versões; IA rascunha) | não temos | Psi | Médio | Alto | **4** |
| 12 | **Lousa** (42 modelos de mapa; "preparar anotação" com revisão; PDF/imagem) | não temos | Psi | Médio | Alto | **4** |
| 13 | **Notas / caderno / post-its / lembretes** | não temos | Todos | Médio | Baixo | **3** |
| 14 | **Lembretes e cobranças por WhatsApp** (pago) | não temos | Todos | Alto (reduz faltas) | Médio (depende de API) | **3** |
| 15 | **Supervisão** (convite, escolher o que compartilhar, identidade protegida, acesso auditado) | não temos | Psi | Médio | Alto | **5** |
| 16 | **Página pública do profissional** (SintroLink) + agendamento | não temos | Todos | Médio | Médio | **5** |
| 17 | **Migração de sessões antigas por IA** (PDF/Word/imagens → sessões) | importação de laudo Word (outro fim) | Todos | Médio | Alto | **5** |
| 18 | **Mensagem do dia**, baralho de conversa, Sintroflix | não | — | Baixo | — | **Não fazer** |
| 19 | **Ritmo da clínica** (estatísticas: presença, dias, horários, recorrência) | painel do dia | Todos | Médio | Baixo | **3** |
| 20 | **Equipe/secretária** com permissões, marca da clínica, segurança em 2 etapas, trilha de atividades | admin/profissional existem; secretária a confirmar | Todos | Alto | Médio | **2–3** |
| 21 | **Videochamada** com gravação, transcrição e resumo | feita (falta transcrição) | Todos | Alto | Médio | em andamento |
| 22 | **Laudos, testes neuropsicológicos, correção, modelos de laudo, NFS-e** | **feito** | **Neuro** | — | — | nosso diferencial |

## 4. Ordem de construção sugerida
**Fase 1: o coração do consultório (evolução)**
Evolução e anotações da sessão, modelos de sessão (livre, estruturada, SOAP, DBT), continuidade do cuidado, prontuário geral e PDF, e a agenda com recorrência. É a lacuna maior: hoje a sessão só guarda uma observação.

**Fase 2: acompanhamento entre sessões (o módulo do paciente, versão por link)**
Cartão Diário em motor genérico (temas e personalização), escalas de triagem com pontuação e gráfico, anamnese com biblioteca e envio por link, financeiro avançado (pacotes), equipe e permissões. Tudo ainda **sem login do paciente** (link seguro), como já fizemos no Diário.

**Fase 3: IA revisável, app do paciente com login e comunicação**
Resumo longitudinal e "perguntas para a próxima sessão", login do paciente (Google/e-mail) e código de conexão, biblioteca compartilhada, notas/caderno, lembretes por WhatsApp, estatísticas da clínica.

**Fase 4: ferramentas clínicas avançadas (psicólogo)**
Estudo de caso por abordagem, Lousa.

**Fase 5: crescimento**
Supervisão, página pública e agendamento, migração por IA.

*Dentro de cada fase, entregamos em pedaços testáveis; nada vai para produção sem a sua aprovação, e os textos clínicos passam pela Letícia.*

## 5. A "área do psicólogo junto com os laudos"
Proposta de organização do menu (para você decidir, já na linha do que combinamos para Configurações):
- **Atendimento**: Agenda, Sessões e evolução, Prontuário, Pacientes.
- **Acompanhamento** (psicólogo): Diário, Escalas, Anamnese e formulários, Estudo de caso, Lousa.
- **Avaliação** (neuro): Testes, Aplicações, Laudos, Modelos de laudo (já existe).
- **Financeiro**: Cobranças, Pacotes, Notas fiscais.
- **Configurações**: clínica, equipe e permissões, dados fiscais, modelos.
O profissional escolhe o **perfil de atuação** (já existe "Perfil de atuação") e o menu mostra só o que ele usa: assim o mesmo sistema serve clínica geral, psicólogo clínico e neuropsicólogo.

## 6. Mudar a cara do sistema (o que evitar da identidade deles)
Evitar: paleta roxo/rosa em degradê e vidro fosco, nomes de produto ("Sintro...", "LUMA", "Cartão Diário padrão", "Bússola"), estrutura e rótulos idênticos, textos de fechamento e de revisão, ícones de clima. Manter: a **arquitetura de funcionamento** (etapas, bibliotecas, regras). Já fizemos o Diário mais leve com ícones; a identidade final do NeuroLogic (nome, cores, tom) é decisão sua e entra antes da Fase 2.

## 7. Riscos e cuidados
- **Cópia de conteúdo**: o Diário fase 1 ficou textualmente muito parecido com o Cartão Diário deles. **Reescrever** títulos, opções e textos (com a Letícia) antes de usar com pacientes reais.
- **Licenças de escalas**: usar só as de uso livre ou licenciadas; versão validada em português; guardar fonte e versão.
- **LGPD e dado sensível**: consentimento, finalidade, retenção; **não pedir agenda/contatos do paciente** no login (eles pedem; não vamos); acesso auditado; criptografia.
- **Risco e segurança**: itens críticos das escalas (ex.: ideação suicida) geram alerta **ao profissional** e orientação de emergência ao paciente (CVV 188, SAMU 192), sem diagnóstico automático.
- **IA**: sempre rascunho, nunca decisão; registrar que foi gerado por IA e quem revisou (como já fazemos nos laudos).
- **Custo**: IA, WhatsApp e armazenamento têm custo por uso; planos por clínica (como o plano de vídeo).

## 8. Decisões que preciso de você
1. **Aprovar a ordem das fases** (ou trocar prioridades). Minha sugestão: Fase 1 primeiro (evolução da sessão).
2. **Nome e identidade** do módulo e do sistema (mesmo que provisórios).
3. **Quem é o público inicial**: só psicólogos e neuropsicólogos, ou já qualquer consultório (isso decide o peso do SOAP, do financeiro e do menu por perfil).
4. **Escalas iniciais** (sugestão: PHQ-9, GAD-7, DASS-21, PCL-5, AUDIT, WHOQOL-BREF, mais as que a Letícia usa).
5. **Login do paciente**: Google + e-mail/senha; confirmar que **não** pediremos acesso a agenda e contatos.
6. **IA**: usar a mesma da plataforma (já usamos para laudos e painel) e definir o orçamento mensal por clínica.

## 9. O que ainda falta estudar (e não bloqueia a Fase 1)
- Check-in com **intensidade alta** (aviso de segurança, etapas condicionais Mochila/Impulso): **teste marcado para 16/10**.
- **Biblioteca compartilhada** e **Mural do Humor** do lado do paciente.
- Aba "Atividades" (trilha de alterações) e a Central de novidades.
- Outras escalas (perguntas e pontuação) conforme formos incluindo.
- O teste gratuito deles acaba em ~28/10/2026: o que for necessário ver tem que ser visto até lá.
