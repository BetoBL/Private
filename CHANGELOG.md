# Changelog

## [2026-10-08 - Madrugada] Três formas de criar modelo, testes por modelo e editor "mala direta"

- **Lista de modelos:** três botões lado a lado (Montar no editor / Ler um laudo em Word / Usar meu Word com marcadores), cada um com uma frase explicando. O modelo da Letícia deixou de ter o botão "Ver e criar a partir dele".
- **Testes do modelo** (nova aba): cada modelo tem a sua lista de testes (copiável de um Tipo de Atendimento); o editor de documento e a aba Blocos e itens só oferecem esses testes (`EstruturaModelo.testes`).
- **Editor de documento** (nova seção `documento`, aba "Documento"): texto com **negrito**, # título, ## subtítulo, - item, campos `{{...}}` e blocos `[[tabela:...]]`, `[[grafico:...]]` e `[[linha:TESTE|c:campo]]` (resultado individual) inseridos com um clique pela paleta, com visualização dos campos destacados. No laudo o paciente pode ajustar o texto; tabela/gráfico só saem se o teste foi aplicado. Busca (máx. 40 itens) nos resultados individuais.
- A Tabela 1 só é reservada quando o modelo traz a tabela de classificação. 122 testes passam.

## [2026-10-08 - Madrugada] Anamnese como sessão no Iniciar Atendimento

- `Sessao.tipo` (AVALIACAO | ANAMNESE, migration `sessao_tipo_anamnese`). No Iniciar Atendimento, a opção "Incluir a sessão de anamnese" cria uma sessão própria, com horário próprio (padrão: 1 h antes da 1ª sessão), no mesmo dia ou em outro; entra na Agenda como "Anamnese — tipo" e participa da checagem de conflito de horário. Na ficha do paciente aparece com a etiqueta "Anamnese" e atalho para a aba Anamnese.

## [2026-10-08 - Madrugada] Modelos de Laudo (cadastro, editor, importação de Word, modelo Word da clínica)

- **Novo cadastro "Modelos de Laudo"** (menu): lista, editor e "Salvar como". Os modelos do SISTEMA são somente leitura (API devolve 403 ao tentar alterar/apagar); quem quer mudar algo grava uma cópia com **outro nome** (nome repetido ou igual a um do sistema é recusado), que passa a ser da pessoa (ou da clínica, para o administrador) e pode virar o **padrão** (`Profissional.modeloLaudoPadraoId` / `Clinica.modeloLaudoPadraoId`). Apagar = desativar; laudos que já usam o modelo continuam saindo com ele.
- **6 modelos do sistema** (`lib/laudo/modelos.ts`, sincronizados na subida da API): Laudo neuropsicológico completo (o da Letícia, textos palavra por palavra, agora como dados do modelo e não mais fixos no código), Laudo, Relatório e Parecer psicológicos (estrutura CFP, Res. 06/2019 e Manual Orientativo 2025 — textos de redação própria), Declaração e Atestado.
- **Editor** (`EditorModeloLaudo.tsx`): estrutura (seções em ordem, títulos, textos fixos, texto por paciente, avisos, identificação com campos por paciente), **domínios** (renomear, reordenar, ocultar, criar, introdução própria), **blocos e itens** (tabela/gráfico/quadro de resultados e linhas de resultado de qualquer teste colocados em qualquer domínio; biblioteca em `GET /modelos-laudo/biblioteca`) e **modelo Word**.
- **Marcadores `{{paciente.nome}}`** etc. (16, ver `MARCADORES`) em textos do modelo e no Word da clínica.
- **Importar de um Word** (`importarWord.ts`): títulos viram seções (tipo reconhecido pelo nome), campos comuns viram marcadores, testes e domínios citados são detectados; tela de revisão antes de salvar. Não lê imagens/gráficos/desenho de tabelas (avisado na tela).
- **Modelo Word da clínica** (`modeloWord.ts`, jszip): .docx com marcadores `{{...}}` e `{{secao.<id>}}`; o sistema preenche (inclui cabeçalho/rodapé). Serve a documentos de texto; o laudo com tabelas/gráficos usa a estrutura do modelo.
- **Laudo**: seletor de modelo na criação e na barra; as seções seguem o modelo escolhido; `Laudo.modeloId` e `Laudo.secoesExtras`. Revisão de IA só é exigida quando houve rascunho de IA (declaração/atestado não passam por IA). Numeração agora sem buraco quando "Sugestões" fica vazia (antes "Referências" era sempre 10).
- Migrations `adiciona_modelo_laudo` e `modelo_laudo_padrao_no_dono`. 121 testes passam. **PDF no servidor: não feito** (exige LibreOffice no servidor; hoje o PDF sai do Word).


## [2026-10-08 - Noite] Caso de demonstração do laudo na produção

- **Caso fictício "Helena Exemplo Prado" criado na produção** (`apps/api/prisma/exemplo-laudo.ts`, copiado da base local): paciente com anamnese preenchida pelo formulário, 1 sessão com 8 testes lançados (WAIS-III, RAVLT, FDT, BPA, BFP, SRS-2 adultos, BAI, BDI-II) e o laudo completo (análise por domínio, interpretações, hipótese, conclusão e sugestões). Pertence a um profissional de DEMONSTRAÇÃO sem acesso (`demonstracao@mentessence.invalid`, senha aleatória), visível ao administrador. Para refazer: `--refazer`.
- **Tipo de atendimento "Avaliação neuropsicológica de adulto (modelo)"** criado com esses 8 testes.
- **Timbrado da clínica**: só foram preenchidos os campos que estavam vazios (logotipo, marca-d'água, frase, WhatsApp, Instagram); nada existente foi alterado.
- Pesquisa de modelos padrão: o Manual Orientativo do CFP (2025), Apêndice 3, traz as estruturas oficiais de declaração, atestado, relatório (psicológico e multiprofissional), laudo e parecer.

## [2026-10-08 - Tarde] Textos originais, anamnese por formulário e espaços por paciente

- **Textos-padrão do laudo devolvidos à redação original da psicóloga** (palavra por palavra): antes, 19 dos 39 textos-padrão tinham sido reescritos por mim sem aviso (definições de funções executivas e atencionais, visuoconstrução, memória episódica, BAI, BDI-II, BFP, referencial, descrição dos instrumentos e seus nomes). Agora 41 de 42 são idênticos; o 42º é o aviso de IA (exigência do CFP). Cada definição de função executiva/atencional voltou a vir seguida da sua linha de resultado. Possíveis deslizes dela (ex.: "As Escala", "quantitativa") ficam como estão e foram listados em `PERGUNTAS-PARA-LETICIA.md`, seção 10.
- **Formulário de anamnese novo** (`FormularioAnamnese.tsx`, aba Anamnese da ficha): 8 seções (contexto familiar, motivo e histórico, escolaridade, saúde, perfil/atenção/humor, rotina, gestação e desenvolvimento, histórico familiar) + texto livre. `POST /laudos/:id/montar-anamnese` junta os campos em parágrafos (`lib/laudo/anamnese.ts`, concordância de gênero, idade na data da avaliação); o texto continua editável no laudo.
- **Espaços por paciente no laudo:** interpretação clínica por domínio (`Laudo.interpretacoes`, token `[[interpretacao:domínio]]`; sobrevive a "montar de novo"), hipótese diagnóstica própria (`Laudo.hipoteseDiagnostica`, "Hipótese Diagnóstica:" em negrito no fim da conclusão) e título do profissional no fecho (`Profissional.tituloLaudo`; "Autora" quando começa com "Psicóloga").
- Migration `adiciona_interpretacoes_hipotese_e_titulo_laudo`. 114 testes passam.

## [2026-10-08] Laudo no modelo completo da MentEssence

- **Novo laudo (substitui o simples):** 10 seções (identificação, demanda, anamnese, observação clínica, instrumentos, referencial com a tabela de classificação, análise por domínio, conclusão, sugestões e referências), papel timbrado e fecho com assinatura. Exportação em Word (`gerarDocxCompleto.ts`; o gerador antigo foi removido) e pré-visualização em HTML (`GET /laudos/:id/previa`, via `mammoth`).
- **Montagem automática** (`lib/laudo/{dominios,montar,classificacao,descricoes}.ts`, `POST /laudos/:id/montar-estrutura`): lista de instrumentos com descrição clínica, análise por domínio com linhas "percentil NN% Classificação" (negrito; vermelho abaixo da média), parágrafos-definição, frase-síntese em funções executivas e atencionais, tabelas (WAIS-III, BAI, BDI-II, SRS-2) e referências por teste. Mapa teste→domínio em `dominios.ts` (WAIS-III, RAVLT, FDT, BPA, BFP, BAI, BDI-II, SRS-2). Sem IA: os números vêm do cálculo dos testes. A IA continua opcional e só redige a conclusão (não apaga mais a análise montada).
- **Gráficos como imagem no Word** (`graficoSvg.ts`, `@resvg/resvg-js`, fonte Noto Sans embutida em `assets/fonts`): índices WAIS-III (cor por barra, ±7,5 fixo, valor na base), curva RAVLT (Paciente × Média) e os gráficos do Excel de FDT, BPA, BFP e SRS-2.
- **Identidade visual vem do cadastro** (sistema comercial): clínica (logotipo, marca-d'água, frase do cabeçalho, WhatsApp, Instagram, endereço) e profissional (assinatura), com envio de imagem reduzida no navegador (`UploadImagem`). Campos novos: `Clinica.marcaDaguaUrl/slogan/instagram/whatsapp`, `Profissional.assinaturaUrl` (fora das listas; rota própria), `Paciente.cpf`, `Laudo.anamnese/observacaoClinica`. `express.json` com limite de 4 MB.
- **Tela do laudo refeita** (`ComposicaoLaudo.tsx`): navegação por seções com indicador de preenchimento, checklist do papel timbrado, barra de ações (montar, rascunho de IA, pré-visualizar, baixar em Word), chips para inserir/remover tabelas e gráficos, barra de formatação (negrito, marcador, título de domínio) e finalização com revisão obrigatória.
- Decisões com a psicóloga (avisar): nomes de classificação padronizados pela Tabela 1; barra de erro fixa ±7,5; legenda do gráfico do RAVLT. Pergunta aberta: percentil exatamente 98/2. Ver `docs/testes/PERGUNTAS-PARA-LETICIA.md`, seções 8 e 9.
- Pendente: PDF direto no servidor (hoje: Word → PDF pelo próprio Word), mapa de domínios para WISC-IV/WASI e demais testes, textos-definição configuráveis por clínica, anamnese preenchida a partir da ficha do paciente.

## [2026-10-07 - Noite 2] CBCL pré-escolar: gráficos próprios e marcação de provisório

- **Achado**: a aba "CBCL-Pre" da planilha é uma CÓPIA da aba do CBCL 6–18 (título "Escolar 6-18 ano", usa `CBCL-Normas` com cortes <12/≥12 anos e várias linhas de total marcadas "EM CONSTRUÇÃO — faltam tabelas"). Os 24 gráficos dela apontam para a aba do CBCL 6–18. Ou seja, o CBCL pré-escolar do catálogo calculava criança de 1,5 a 5 anos com norma de escolar. → **Adicionar à lista de defeitos da Leticia.**
- **CBCL-PRE agora é PROVISÓRIO** (selo na tela + aviso na descrição, via `PROVISORIOS` em `planilhas-seed.ts`) até a planilha ter as normas de 1,5 a 5 anos.
- **Gráficos próprios** (`spec.graficosProprios` no construtor, `graficosIgnorarExcel`): 2 perfis de T-score por escala (CBCL cuidadores 1–3 e C-TRF 1–4) para o CBCL-PRE, já que nenhum gráfico do Excel serve. Os do Excel foram desligados nesse teste.
- Religar os gráficos copiados às células da própria aba foi testado e DESCARTADO (endereços não correspondem às escalas). Vineland Extensivo Pais (2) e Professores (4) seguem de fora pelo mesmo motivo.
- Esclarecimento: CBCL 6–18 tem os 13 gráficos; Vineland Extensivo Entrevista 18/18, Pais 16/18, Professores 18/22.

## [2026-10-07 - Noite] Modelos antigos concluídos, gráficos e tabelas como no Excel

- **BFP, RAVLT, SCARED, SRS-2 (Adultos/Escolar/Pré-escolar) e E-TDAH Pais** passam para o motor de planilha, item a item, com as **duas formas de lançar** (botão "Item a item / Só os totais"). O teste `duas-formas.test.ts` confirma que os dois dão o mesmo resultado (exceção: falso positivo do RAVLT, que só vem da lista S/N de reconhecimento, como na planilha).
- **Gráficos do Excel** (`scripts/extrair-graficos-xlsm.mjs` + `GraficosPlanilha.tsx`): lê as definições dos gráficos da planilha (linha, barras vertical/horizontal/combinadas, radar, pizza) e desenha em SVG a partir das mesmas células. Ligado em TODAS as 55 definições (`graficos: true` nas specs). Gráficos cuja série aponta para outra aba (CBCL, CBCL-PRE, Vineland Extensivo) são ignorados na construção e aparecem no log — pendente.
- **Tabelas por blocos** (`spec.blocos`): linhas, colunas e linha de cabeçalho da aba, como o desenho da planilha. Aplicado a BFP, RAVLT, SCARED, SRS-2 e E-TDAH Pais; os demais testes mantêm a tabela automática.
- **Motor**: entradas com `letras`, `portas` (célula-porta por coluna), `porta` por campo, `datas` (data da sessão por informante), `cabecalhos`, `modo:"totais"`.
- **Catálogo**: SCARED-AUTORRELATO/PAIS, SRS-2-* e BRIEF2-PAIS saem do seed e são removidos do banco por `atualizar-wechsler.ts` SE não tiverem lançamento (senão ficam, com aviso).
- Corrigido: regex sem barra invertida (`\d`) no cabeçalho de colunas, aplicado por heredoc.
- Não publicado no Render.

## [2026-10-07] Financeiro (fase 1): cobranças, baixa e resumo

- **Modelo `Cobranca`** (migration `20261007202348_adiciona_cobranca`): paciente, sessão (opcional), convênio (vazio = particular), descrição, valor, vencimento, status (ABERTA/PAGA/CANCELADA), valor pago, data e forma do pagamento. Cancelar não apaga.
- **Rota `/financeiro`**: listar (filtros de mês, status, paciente, convênio/particular), `/resumo?mes=` (a receber no mês, atrasado de qualquer mês, recebido no mês, em aberto por origem), criar, editar, `/:id/baixa`, `/:id/reabrir` e cancelar. ADMIN vê a clínica toda; os demais, só os próprios pacientes. Excluir sessão com cobrança agora é bloqueado (409).
- **Tela "Financeiro"** no menu: cartões do mês, filtros, lançar/editar, dar baixa (valor menor que o cobrado aparece como "diferença: desconto ou glosa"), reabrir e cancelar. Ao escolher o paciente sugere o convênio dele.
- Próximos passos combinados com o usuário: emissão de NFS-e pelo Emissor Nacional (portar do Infinity; clínica é Simples Nacional; outros municípios ficam para depois de 01/11/2026) e geração do XML TISS (guia SP/SADT) para convênios, a começar pela Amil. Envio direto à Amil depende de acesso técnico que ela libere ao credenciamento (códigos de prestador ainda não disponíveis).

## [2026-10-07] Construção: BRIEF-2 no motor, telas genéricas melhores, reavaliação

- **BRIEF-2 pelo motor de planilha** (`BRIEF2`, aba "BRIEF-2"): 63 itens × 8 informantes (3 cuidadores, 4 professores, auto-relato), respostas N/A/F, 9 escalas clínicas, 4 índices (IRC/IRE/IRCog/IEG) e 3 escalas de validade, com T-score, percentil, IC e classificação. Gerado por `scripts/gerar-brief2-spec.mjs`. Substitui o antigo `BRIEF2-PAIS` no seed (só pais, sem índices). Conferido por caso manual (8 itens × "A" = 16 pontos brutos em Inibição); a aba não tem protocolo de exemplo em cache, então NÃO foi comparado com o Excel — pedir casos reais à Leticia. Observação: com idade ≥ 11 a coluna do auto-relato aparece com zeros mesmo sem respostas (o Excel faz o mesmo).
- **Motor**: entradas com `letras` (a tela envia 1/2/3 e a célula recebe a letra), `portas` (célula do informante preenchida sozinha quando a coluna tem resposta) e `cabecalhos` (nome das colunas na tela).
- **Telas genéricas (`TestePlanilha.tsx`)**: células com o mesmo rótulo na mesma linha viram uma linha com um campo por informante; formulários distintos (colunas separadas) viram seções; mais de 30 linhas viram blocos recolhíveis ("Itens 001 a 030") que abrem sozinhos quando parcialmente preenchidos; rótulos não são mais cortados; tabelas de resultado escondem linhas e colunas sem valor. CBCL: de 1006 campos soltos para 3 formulários em blocos.
- **Reavaliação** (`ComparacaoReavaliacao.tsx`, na ficha do paciente): botão "comparar com <data> (reavaliação)" no lançamento quando há aplicação anterior do mesmo teste e do mesmo informante; mostra antes, depois e diferença.
- **Removida** a página de prévia de desenvolvimento (`PreviewWais3` e o gancho em `App.tsx`).
- Não publicado: falta aprovação do usuário para atualizar o Render.

## [2026-10-06 - Noite 6] WISC-IV: módulo de cálculo (backend)

- **`apps/api/src/lib/wisc4.ts`** (novo, 93/93 testes na suíte; 12 dedicados ao WISC-IV) + tipo `wisc4_planilha` no `motorCalculo` (recebe `dataNascimento`/`dataReferencia` no contexto; as rotas de aplicação passam as duas datas): idade em dias da planilha (anos×365 + meses×30 + dias) → faixa de 4 meses; bruto → ponderado + Z, ponto composto, percentil e classificação (por ponderado); somas por índice com os substitutos da planilha (Completar Figuras→IOP, Cancelamento→IVP, Aritmética→IMO, só se falta UM principal; Informação e Raciocínio com Palavras não substituem); ICV/IOP/IMO/IVP/QIT + **GAI e CPI** com composto, percentil, IC 90/95 e classificação por COMPOSTO; análise avançada igual à do WAIS-III com as constantes do WISC (valor crítico por idade 6-16, raro: ICV 14 / IOP 13,5 / IMO 15 / IVP 17, QIT/GAI/CPI interpretáveis se amplitude < 23, avisos da planilha). No WISC-IV a coluna **Recurso/Preocupação FUNCIONA** na planilha (os rótulos abreviados "Fac. Norm."/"Fac. Indiv." coincidem), então foi reproduzida — isso confirma que a do WAIS-III é um defeito (rótulos longos não coincidem) e que a intenção do autor era ter a coluna. Diferença deliberada: índice só calcula com todos os subtestes.
- Teste-guarda: as tabelas da planilha × a A.1 do manual transcrita divergem EXATAMENTE nas 12 combinações conhecidas (`docs/testes/WISC-IV-divergencias-planilha.md`); qualquer mudança em uma das fontes quebra o teste.
- **Ainda NÃO integrado ao catálogo/seed nem ao front**: o WISC-IV que o usuário vê continua o antigo. Pendências: abas do front (reaproveitar componentes do WAIS-III), idade mental estimada, análise intraindividual/ipsativa, discrepâncias de subtestes, facilidades/dificuldades, escores de processo, clusters (7 + hipóteses + sugestões de intervenção) e habilidades; validar tudo com os casos reais da Leticia antes de trocar o catálogo.

## [2026-10-06 - Noite 5] WISC-IV: mapeamento, conferência das normas e gerador

- **Mapa da aba WISC-IV** (hidden/protegida; 2.241 células, 1.600 fórmulas, 10 gráficos): conversão bruto→ponderado de 15 subtestes (com Z, composto, percentil, classificação, idade mental estimada); somas por índice com substitutos (Completar Figuras→IOP, Cancelamento→IVP, Aritmética→IMO, só se falta um principal); ICV/IOP/IMO/IVP/QIT + **GAI e CPI** (que o sistema ainda não tem) + análise avançada (mesma lógica do WAIS-III: interpretável <5, D/F normativa <85/<115, média dos 4 índices, valor crítico por idade em anos 6-16 + "todas", raro: ICV 14, IOP 13,5, IMO 15, IVP 17; QIT/GAI/CPI interpretáveis se amplitude <23); análise intraindividual (lista suspensa de teste + "maior diferença negativa"); comparação de discrepâncias (6 pares de índices + ~16 de subtestes); facilidades/dificuldades por subteste (média do QIT); escores de processo (Cubos sem bônus, Dígitos OD/OI) e frequência acumulada da maior sequência; clusters (7, com Gs-P), comparações clínicas (inclui GAI×CPI), hipóteses e **sugestões de intervenção**; habilidades compartilhadas (mesma matriz do WAIS). Classificação dos ÍNDICES por composto (≥130, 120, 110, 90, 80, 70), diferente do WAIS (que usa percentil).
- **A planilha vem SEM paciente de exemplo no WISC-IV** (sem data de aplicação): não há valores em cache para usar de gabarito. A Leticia vai enviar casos reais; testar com eles.
- **Idade do WISC**: a planilha usa dias = anos×365 + meses×30 + dias (mês de 30 dias) e escolhe a faixa de 4 meses (33 faixas, 6:0 a 16:11, limiares 2190 a 6080 dias); o sistema ainda usa meses de calendário (pendência conhecida em docs/testes/WISC-IV.md) — seguir a planilha ao integrar.
- **Conferência automática das normas** (26.184 combinações faixa×subteste×bruto): 26.172 iguais, 12 divergentes entre o Excel e a tabela A.1 transcrita do manual; 9 delas na faixa 13:0-13:3. Lista em `docs/testes/WISC-IV-divergencias-planilha.md`, mais 3 colunas do Excel fora de ordem (Cubos 7:0 e 8:0; Informação 12:8) onde o resultado real é incerto — pedir casos reais.
- **`scripts/gerar-wisc4-planilha.mjs`** (novo) gera `docs/testes/WISC-IV-planilha.json`: 33 faixas × 15 subtestes, tabelas soma→composto/percentil/IC90/IC95 de ICV, IOP, IMO, IVP, QIT, GAI e CPI, valores críticos por idade e limites de raro. NÃO integrado ainda ao motor/seed (o WISC-IV do catálogo continua o antigo). Próximos passos: módulo de cálculo `wisc4.ts`, testes com os casos da Leticia, front com as abas (reaproveitando os componentes do WAIS-III).

## [2026-10-06 - Noite 4] Migrations aplicadas no Render

- Com autorização do usuário, `prisma migrate deploy` aplicou no Postgres do Render as migrations `20261006230951_adiciona_atendimento_telepsicologia_normativas` e `20261006235000_adiciona_convenio_paciente_e_agenda_sessao` (histórico estava limpo: 7 aplicadas + as 2 novas; `migrate status` = up to date). Só criam tabelas/colunas/índices; nenhum dado alterado.
- Falta para produção: deploy do código (a pasta do projeto não é um repositório git; confirmar de onde o Render faz o deploy) e atualizar o WAIS-III do catálogo em produção SEM rodar o seed (o seed apaga lançamentos).

## [2026-10-06 - Noite 3] Leitura da planilha Excel legada (WAIS-III / WISC-IV)

- **`scripts/exportar-para-colar.ps1`**: lê direto os XMLs do `.xlsm` (zip) em PowerShell puro — valores, fórmulas, mesclagens, larguras de coluna, formatação condicional e XML bruto de desenhos/gráficos. NÃO usa Excel, não executa macros e funciona com abas ocultas/protegidas. Gera texto gzip+base64 em partes (`P 1`, `P 2`…) para colar no chat quando não há como levar arquivos entre máquinas. Roda em ~4 s. Testado em `planilha-da-psicologa.xlsm` (128 abas): WAIS-III = 1.798 células (1.289 fórmulas), 4 gráficos, 274 regras de formatação condicional; WISC-IV = 2.241 células (1.600 fórmulas), 10 gráficos. Ambas as abas são `hidden` + protegidas (só macros as exibem).
- `scripts/exportar-telas-excel.ps1` (via Excel COM, PNG/PDF): FUNCIONA SÓ para abas visíveis; nas ocultas/protegidas devolve gráficos vazios. Mantido apenas como referência; preferir o script acima.
- A planilha da outra máquina é a MESMA desta (informado pelo usuário); lá só não tem o bloqueio de ativação por serial. Decisão: NÃO contornar a ativação/licença da planilha (produto de terceiros); a leitura de conteúdo não depende disso.
- **WAIS-III etapa 1 — cálculo no backend (feito, 47/47 testes):** `scripts/gerar-wais3-planilha.mjs` transforma as abas WAIS-III/WAIS-NORMAS do Excel em `docs/testes/WAIS-III-planilha.json` (8 faixas etárias × 14 subtestes bruto→ponderado; tabelas soma→composto/percentil/IC90/IC95 para ICV, IOP, IMO, IVP, QIT, QIV, QIE e GAI). `apps/api/src/lib/wais3.ts` calcula espelhando a planilha (faixa etária por DIAS de vida; substituições: SNL só se Dígitos faltar, Procurar Símbolos só se Códigos faltar, Armar Objetos no lugar de UM titular faltante; classificação por PERCENTIL como na planilha). `motorCalculo.calcularResultado` ganhou `contexto.idadeDias` e o tipo `wais3_planilha`; `aplicacoesDeTeste.routes` passa a idade em dias. Os 13 ponderados e os 8 índices do paciente de exemplo batem exatamente com os valores em cache da planilha. Diferença deliberada: índice só é calculado com TODOS os subtestes (a planilha soma o que houver).
- **WAIS-III etapa 1 — seed e telas (feito):** `prisma/wais3-normas.ts` + seed: 14 campos de entrada (brutos, na ordem da planilha), 8 calculados, uma única TabelaNormativa (a faixa etária sai dos dias de vida, dentro do cálculo). O seed passou a limpar `NormativaCustomizada` do catálogo fixo antes de recriá-lo (senão a FK bloqueava). Novo `POST /aplicacoes-teste/calcular` (calcula SEM gravar, mesmo caminho do salvar) para o resultado ao vivo. Testado de ponta a ponta na API com os dados da planilha (13/13 checagens: idade 12.754 dias, 8 índices idênticos, salvar = calcular). Front, SEM biblioteca nova (SVG + CSS): `TesteWaisIII.tsx` com as abas 1 (brutos com ponderado ao vivo e barra de progresso), 2 (perfil de ponderados animado — `components/graficos/PerfilPonderados.tsx` — + tabela) e 3 (índices e QIs com IC 90/95% — `EscalaIndices.tsx`); abas 4-8 marcadas "em breve" com a descrição do que virão a ser. `lib/wechsler.ts` (zonas, cores, regras do que falta lançar), `lib/useContagem.ts` (número que conta), animações em `index.css` respeitando `prefers-reduced-motion`. Prints headless (Edge) das 3 abas conferidos visualmente.
- **WAIS-III — paridade com o print da planilha (feito, 52/52 testes):** o usuário comparou com o Excel e faltavam colunas/linhas. Agora: por subteste Z-score = (pond.−10)/3, ponto composto = Z·15+100, percentil = NORM.S.DIST(Z)·100 (3 decimais guardados; tela mostra 1) e classificação pelo PONDERADO (≥16 Muito Sup., ≥14 Sup., ≥12 Média Sup., ≥8 Média, ≥6 Média Inf., ≥4 Limítrofe, resto Deficitário); quadro Soma/TOTAL, M.P.P. (soma ÷ nº de subtestes), diferença maior−menor e "homogêneo" SIM/NÃO (<5) para ICV/IOP/IMO/IVP; cabeçalho com nome, escolaridade, sexo, datas e idade "34a, 11m, 1d" (`formatarIdadeCompleta`). CORREÇÃO: as zonas de cor do perfil eram invenção minha (Média = 8-12); passaram a seguir a classificação da planilha (Média = 8-11). Colchetes "Escala Verbal / Escala de Execução" no gráfico. Diferença deliberada: a planilha plota Armar Objetos vazio como 0 no gráfico; aqui não plota o que não foi lançado. Valores conferidos contra o print (ex.: Códigos z −1,333 / 80,0 / 9,1 / Média Inferior; Procurar Símbolos 0,667 / 110,0 / 74,8 / Média Superior).
- **WAIS-III aba 3 (análise avançada) + aba 4 (gráficos) — feito, 55/55 testes:** `wais3.ts` ganhou `analisarAvancado` (colunas K-S da planilha): interpretável (diferença maior−menor ponderado < 5), D/F normativa (composto < 85 dificuldade; < 115 média; senão facilidade), média dos 4 índices, diferença, valor crítico por faixa de idade (anos completos; tabela WAIS-NORMAS 721-733: 16, 18, 20, 25, 30, 35, 45, 55, 65, 70, 75, 80, 85), D/F individual (|dif| ≥ valor crítico), Raro (|dif| > limite constante do índice: ICV 15,5; IOP 14,8; IMO 15,8; IVP 17,7) / Não raro (> valor crítico), e QI Total/GAI interpretáveis (amplitude entre índices < 23) com os avisos da planilha. O gerador passou a extrair `valoresCriticos` e `limitesRaro` (JSON regenerado; é preciso re-semear o banco: `prisma db seed` no dev; em produção o TabelaNormativa precisa ser atualizado). NÃO reproduzida: coluna "Recurso/Preocupação" — a fórmula compara com rótulos abreviados ("Fac. Norm.") que nunca coincidem com os das colunas L/P, então na planilha ela nunca mostra nada (pergunta para a Leticia). Conferido contra o print: ICV +5,25/5,6; IOP −2,75/6,9; IMO −2,75/6,4; IVP NÃO interpretável. Front: seção "Análise avançada" na aba 3 e aba 4 com os gráficos Facilidade×Dificuldade (normativa, com IC), (individual, diferença × valor crítico × limite de raro) e Perfil dos pontos compostos (`graficos/FacilidadeDificuldade.tsx`).
- **WAIS-III aba 4 (determinação por subteste) + aba 5 (comparação entre discrepâncias) — feito, 61/61 testes:** o gerador extrai as Tabelas B.1 (valor crítico por faixa de idade/nível/amostra, WAIS-NORMAS 361-378), B.2 (frequência acumulada por tamanho da diferença, 391-431) e B.3 (valor crítico e limites de frequência por subteste em 6 modos de média, 441-494). `wais3.ts` devolve `extras.determinacao` (médias verbal/execução/geral, recomendação pela regra da célula B25 e as linhas de TODOS os 6 modos, com níveis 0,05 e 0,15) e `extras.discrepancias` (7 comparações QIV−QIE, ICV−IOP, ICV−IMO, IOP−IVP, ICV−IVP, IOP−IMO, IMO−IVP × nível × amostra "habilidade"/"geral"); o front alterna modo/nível/amostra sem nova chamada. Diferença deliberada: a planilha deixa o modo da média numa lista suspensa (no exemplo estava "14 subtestes" com 13 lançados, e a própria recomendação dizia 13); o sistema já abre no modo RECOMENDADO e deixa trocar. O nível de significância segue o seletor de IC (95% = 0,05; 90% = 0,15), como a planilha (E88). Conferido contra os prints: médias 9,29/9,00/9,15; valor crítico do Vocabulário no modo 14 = 2,67 (modo 13 = 2,64); discrepâncias 7/8,31, 8/9,74, 8/11, −3/14,39, 5/14,09, 0/11,38, −3/15,27. `ResultadoCalculado` (por_campo) ganhou `extras`. É preciso re-semear o banco após mudar o JSON (`prisma db seed` no dev; em produção atualizar a TabelaNormativa do WAIS-III).
- **WAIS-III aba 6 (clusters) — feito, 67/67 testes:** gerador extrai as tabelas próprias de cada cluster (WAIS-NORMAS 601-655: soma → composto/IC95/percentil), os valores críticos clínicos (constantes J177:J182) e a biblioteca de 12 hipóteses da aba `WISC-NORMAS` (A851..A962; agora o gerador aceita um 4º argumento com a extração dessa aba). `wais3.ts` devolve `extras.clusters` (8 clusters: diferença maior−menor, interpretável < 5, soma, composto, IC95, percentil, classificação por percentil ≥97,72/90,88/75/25/9/2) e as 6 comparações clínicas (raro se |dif| ≥ valor crítico) com a hipótese correspondente. Conferido contra o print (ex.: Gf soma 28 → 96, 88-104, p39; Gc-LM 22 → 105, 99-111, p63; comparações 5/21, 6/24, 5/24, −3/17, 13/24, 13/17). Front: gráfico de escala dos 8 clusters, tabela detalhada, comparações com barra × valor crítico e cartões de hipótese (`ClustersWais3.tsx`).
- **DEFEITO DA PLANILHA, NÃO REPRODUZIDO (hipóteses de cluster):** a fórmula do texto (B186:V186) testa M177…M182, que contém sempre o NOME do cluster ("Gf"), nunca ">"/"<"; por isso ela cai sempre no ramo "menor" e mostra o texto do sentido OPOSTO ao da comparação (no exemplo, Gf 96 > Gv 91 aparece o texto de "Gv > Gf"), e nunca mostra "Não interpretável". No 6º par, a biblioteca lista "Gf-verbal > Gc-LTM" antes de "Gc-LTM > Gf-verbal" (ordem inversa à da comparação). O sistema escolhe o texto pelo TÍTULO do sentido real (maior > menor), só com os dois clusters interpretáveis e diferença ≠ 0. Pergunta registrada para a Leticia.
- **WAIS-III aba 7 (escores de processo) — feito:** entradas novas (`digitosSpamDireta`, `digitosSpamInversa`, `digitosPontosDireta`, `digitosPontosInversa`; não são subtestes e ficam fora do cálculo de ponderados). `extras.processo`: maior sequência (porcentagem cumulativa só com as duas ordens, média/DP da faixa, Z, ponderado = Z×3+10, percentil, classificação pelo Z) e diferença OD−OI (frequência acumulada, Z = (média − diferença)/DP — sinal invertido como na planilha —, percentil, classificação) + aviso quando OD+OI ≠ total de Dígitos. Tabelas B.6/B.7 (WAIS-NORMAS 556-568 e 577-591). A célula B584 da planilha tem o texto "74,,1" (erro de digitação); lida como 74,1 e registrada em `avisos` do gerador. Front: `ProcessoWais3.tsx` com campos, medidor de Z e salvar.
- **WAIS-III aba 8 (habilidades compartilhadas) — feito (81/81 testes):** 82 habilidades × 14 subtestes (Kaufman & Lichtenberger, 2002, p. 456), marca P/N/0 pela diferença da média (≥+1 P, ≤−1 N), contagens e interpretação Força/Fraqueza conforme o nº de subtestes da habilidade (todos iguais; ou k de n, k = 2/3/4/4/4/4 para n = 3…8, com no máximo um neutro/oposto). Média geral ou verbal/execução (recomendada pela regra B25). O resultado do exemplo coincide com o print: Forças = 13, 24, 32, 70, 75, 79, 80; Fraqueza = 53. Front: `HabilidadesWais3.tsx` (mapa de calor agrupado, resumo de forças/fraquezas, filtro).
- **DEFEITOS DA PLANILHA, NÃO REPRODUZIDOS (habilidades compartilhadas):** (1) subteste NÃO lançado é marcado "P" — a fórmula compara "" com número e dá VERDADEIRO; no exemplo o Armar Objetos (não lançado) vira "P" nas 24 habilidades em que entra, inflando contagens e interpretações; o sistema deixa sem marca e só interpreta a habilidade quando TODOS os subtestes dela foram lançados; (2) a interpretação da habilidade 77 (Persistência) aponta para a linha 26 e nunca mostra nada; o sistema aplica a regra de n = 4. Perguntas registradas para a Leticia.
- **WAIS-III COMPLETO:** as 8 abas do Excel (brutos, ponderados, índices/QIs + análise avançada, facilidades/dificuldades + determinação por subteste, discrepâncias, clusters, escores de processo, habilidades) estão no sistema. Removido o estado "em breve" das abas. Para o banco de produção: re-semear/atualizar a TabelaNormativa do WAIS-III (JSON gerado por `scripts/gerar-wais3-planilha.mjs <wais> <normas> <saida> <wisc-normas>`).
- **Telas da planilha guardadas** em `docs/referencia-excel-legado/wais3/` (8 prints + `LEIAME.md` com o que cada um mostra e o estado de cada etapa): conversão/perfil, compostos + análise avançada, gráficos facilidade×dificuldade, discrepâncias, escores de processo, clusters (com textos de hipóteses) e habilidades compartilhadas (82 habilidades × 14 subtestes, Kaufman & Lichtenberger 2002). Servem de gabarito para as abas 4-8.
- **Página temporária de prévia** `pages/PreviewWais3.tsx` (rota `/preview-wais3`, só em `import.meta.env.DEV`; cria paciente/sessão e abre o componente real). Remover quando o WAIS-III estiver completo.
- Mapa do WAIS-III na planilha: brutos E10:E22 → pontos ponderados (via aba `WAIS-NORMAS`, ~1.735 referências) → soma por índice (ICV/IOP/IMO/IVP) → ponto composto, percentil, IC 95% e classificação → QI Verbal/Execução/Total e GAI → análise avançada (valor crítico, diferenças) → habilidades compartilhadas (29+). Os valores em cache da planilha (paciente de exemplo) servem de gabarito de teste.

## [2026-10-06 - Noite 2] Aviso de "salvo" e plurais corretos

- **Aviso discreto de gravação** (`lib/aviso.ts` + `components/Avisos.tsx`, montado em `main.tsx`): pílula escura no rodapé, some sozinha (2,6 s + 40 ms/caractere, máx. 6 s), `role="status"`, sem bloquear cliques. As 9 telas que tinham faixa verde de sucesso passaram a usar `useAviso()` (mesma assinatura de `useState`): a mensagem específica ("Dados salvos.", "Evento criado.") vira toast. Gravações sem mensagem própria (POST/PATCH/PUT/DELETE ok no `request`, `enviarEventoAgenda`, `enviarAtendimento`) recebem "Salvo"/"Removido" automático, sem duplicar quando a tela já avisou. Fora do automático: `/auth/*`, gerar rascunho IA, humor, salas virtuais. Erros continuam em faixa vermelha.
- **Plurais**: `lib/plural.ts` (`sessoes`, `testes`, `campos`, `instrumentos`, `laudos`, `faltamCampos`). Removidos todos os plurais montados com `? "s" : ""`/`"es"` e o "sessão(ões)" do Painel do Dia; "Falta 1 campo" no singular. Varredura: nenhum "Sessãos" restante em código, SQL, docs ou banco local.
- Verificado: tsc limpo; lógica do toast (sem duplicar) e do helper testadas em Node. NÃO verificado visualmente no navegador.

## [2026-10-06 - Noite] Agenda ligada ao atendimento, plano de saúde e convênios aceitos

### Iniciar Atendimento -> Agenda (antes só criava linhas soltas em Sessao)
- `POST /atendimentos` agora cria, numa transação, a Sessao E o EventoAgenda de cada sessão (título "Tipo — Sessão i/N", tipo "avaliacao", ligados por `EventoAgenda.sessaoId`). Agenda e sessões são do profissional RESPONSÁVEL pelo paciente (não de quem está logado — recepção/colega pode agendar). Não-admin só agenda para pacientes próprios.
- Aceita o cronograma já ajustado (`sessoes: [{dataHora}]`), `intervaloDias`, `duracaoMinutos`, `forcar`. Conflito de horário devolve 409 com a lista e não cria nada; `forcar: true` agenda mesmo assim.
- Editar o horário do evento na Agenda move também `Sessao.dataHora`.
- Campo com nome quebrado `dataPrimeiraSeSSão` renomeado para `dataPrimeiraSessao`.
- Tela: cronograma editável sessão a sessão (data da 1ª, intervalo, duração), aviso de conflito com "Agendar mesmo assim", e botões "Ver na Agenda" / "Abrir ficha" no lugar do redirecionamento automático.

### Plano de saúde do paciente
- Paciente: `convenioNumeroCarteira`, `convenioPlano`, `convenioValidade`, `convenioTitular` (+ `convenioId` que já existia mas não tinha tela). Bloco "Plano de saúde" na ficha, aviso de carteirinha vencida.
- `convenioId` agora é validado como sendo da MESMA clínica (antes qualquer UUID passava). PATCH parcial não apaga os campos do plano (cuidado com `.transform` em campo opcional: virava null).

### Convênios aceitos pela clínica
- Nova rota `/convenios` (GET todos leem; POST/PATCH/DELETE só ADMIN; apagar = desativar, `Convenio.ativo`; nome único por clínica). Seção "Convênios aceitos" em Cadastro · Clínica.

### Tipos de Atendimento
- Botão "Ver" mostra os testes (sigla + nome) do tipo, ao lado de Editar/Deletar. Plural corrigido ("sessões").

### Migration nova (aditiva): `20261006235000_adiciona_convenio_paciente_e_agenda_sessao`
- ADD COLUMN (Convenio.ativo default true; EventoAgenda.sessaoId; 4 colunas no Paciente) + 2 índices únicos + 1 FK. Aplicada só no Postgres local. Junto com a de 20261006230951, AINDA NÃO aplicada no Render.
- Verificado: 18 checagens novas na API + caminho padrão, 38/38 testes unitários, tsc limpo. NÃO verificado no navegador.

### Registrado para depois (a pedido)
- Controle financeiro: NFs, data e pagamento (e faturamento por convênio, que agora tem os dados do plano).

## [2026-10-06 - Continuação] Fase 8: Normativas Customizadas UI

### ✅ Nova Página: CadastroNormativas
- **apps/web/src/pages/CadastroNormativas.tsx** (novo):
  - CRUD completo para normativas customizadas
  - Formulário: Teste + Nome + Descrição + Fonte + Critério + Conversão JSON
  - Suporte para critério: idade, idade+sexo, escolaridade
  - Placeholder para upload CSV (feature flag: "Fazer upload CSV")

### ✅ Integração Menu
- **Layout.tsx**: Nova linha "Cadastro · Normativas" entre "Tipos de Atendimento" e "Perfil de Atuação"
- **App.tsx**: Nova rota `/normativas` com `CadastroNormativas`

### Lógica de envio + motor de cálculo (concluído)
- **CadastroNormativas.tsx** reescrita: listar, criar, editar, desativar; JSON da conversão validado antes de enviar; faixa de idade (anos/meses), sexo e rótulo. Botão "upload CSV" removido (não fazia nada).
- **api.ts**: `NormativaCustomizada`, `NormativaCustomizadaInput` e 4 funções de CRUD.
- **normativasCustomizadas.routes.ts**: `conversao` agora validada (`tipo` + `faixas`/`faixasPorCampo` não vazios); duplicata (clínica+teste+critério+rótulo) devolve 409 em vez de 500; PATCH aceita `ativo` (reativar).
- **motorCalculo.ts**: novo `escolherNormativaCustomizada` — seleção ESTRITA (só se cobre idade e sexo; a mais específica vence; nunca "a mais próxima"). Sem cobertura, cai na norma padrão.
- **aplicacoesDeTeste.routes.ts**: `recalcular` recebe `clinicaId` e dá precedência à normativa customizada ativa que cobre o paciente, em POST e PATCH.
- **motorCalculo.test.ts**: +5 testes (38/38 passando). `tsc` limpo em api e web.
- **Correção**: `tiposAtendimento.ts` usava `req.user` (inexistente → 500 em toda chamada); agora `req.profissional`.
- `prisma generate` rodado (client estava sem os modelos novos).

### Migration + teste ponta a ponta (06/10/2026)
- **Migration criada**: `20261006230951_adiciona_atendimento_telepsicologia_normativas` — só 3 CREATE TABLE + índices + FKs, nada altera tabela existente. Gerada e aplicada num Postgres LOCAL descartável (embedded-postgres, porta 5544, UTF8, fora do repo); o Render NÃO foi tocado.
- **Smoke test na API (banco local, seed completo)**: 38/39 checagens OK. Cobriu lançamento padrão, precedência da normativa customizada (coberto usa a custom, não coberto cai na padrão), 400 em conversao inválida, 409 em duplicata, desativar/reativar, PATCH recalculando, os 8 testes novos (BDI-II, AQ-50, FDT, 5x SRS-2) lançando com resultado calculado, Tipos de Atendimento, Iniciar Atendimento (3 sessões) e Sala Virtual. A "falha" restante era critério errado do teste: criar 2ª sala para a mesma sessão devolve a existente (200, idempotente, intencional).
- Rótulos legíveis do FDT confirmados na API: "Inibição (calculado: tempo Escolha − tempo Contagem)" e "Flexibilidade (…)".
- NÃO verificado: a interface no navegador (sem browser nesta sessão).

### PENDENTE
- **Aplicar a migration no Render** (`prisma migrate deploy` com a DATABASE_URL de produção) — só com ok explícito do usuário. Enquanto não for aplicada, um deploy do código novo quebra TODO lançamento de teste (a consulta de normativas customizadas vai falhar).
- O resultado calculado não registra qual normativa foi usada (auditoria).
- `TipoAtendimento` ainda é apagado de verdade (sem campo `ativo`).

---

## [2026-10-06 - Final Session] Fase 5: IA Customizada por Perfil + Documentação Completa

### ✅ Melhoria de UX: Perfil de Atuação
- **PerfilAtuacao.tsx**: Adicionada seção visual explicando impacto da IA
  - Card com ícone 🤖 mostrando que perfil é injetado no prompt
  - Lista dos 4 campos e seus impactos
  - Educação contínua do profissional

### ✅ Documentação Completa
- **ARQUITETURA_IA_CUSTOMIZADA.md** (novo):
  - Fluxo end-to-end de customização
  - Exemplos práticos (abordagem psicanalítica vs. neurocientífica)
  - Responsabilidade técnica (CFP 09/2024)
  - Roadmap futuro (A/B testing, histórico, customização por domínio)

### Status: Sistema Completo
- ✅ Perfil customiza análise/conclusão via Claude Opus
- ✅ Validação de revisão antes de exportar (CFP compliance)
- ✅ Educação visual do profissional
- ✅ Arquitetura documentada para time

### Próximas Prioridades (Não implementadas hoje)
1. **Importação de Normativas** — Usuário upload normas customizadas
2. **Telepsicologia integrada** — Sala virtual + prontuário + testes
3. **Feedback de qualidade** — IA aprende com correções do profissional

---

## [2026-10-06 - Fase 4 Completa] Auto-Criação de Sessões por Tipo de Atendimento

### ✅ Nova Página: Iniciar Atendimento
- **IniciarAtendimento.tsx** (novo):
  - Workflow em 3 passos: Paciente → Tipo → Data Primeira Sessão
  - Seletor de pacientes com dados resumidos
  - Seletor de tipos com # de sessões e testes
  - Preview visual do cronograma (7 dias entre sessões)
  - Feedback de sucesso com redirecionamento automático
- **Integração**:
  - Novo link no menu lateral: "Iniciar Atendimento"
  - Rota `/iniciar-atendimento` adicionada

### ✅ Backend: Rota de Atendimentos
- **atendimentos.routes.ts** (novo):
  - POST `/atendimentos` — Inicia atendimento com tipo
  - Cria N sessões automaticamente (baseado em `tipo.numeroSessoes`)
  - Espaçamento de 7 dias entre sessões
  - Data sugerida padrão: +7 dias se não fornecer
  - Validação de paciente e tipo de atendimento por clínica

### ✅ API Client
- **api.ts**: Adicionada função `iniciarAtendimento()`

### Fluxo Completo
```
1. Profissional acessa "Iniciar Atendimento"
2. Seleciona paciente + tipo (ex: "Avaliação de TDAH")
3. Sistema cria 3 sessões automaticamente:
   - Sessão 1: hoje + 7 dias
   - Sessão 2: hoje + 14 dias
   - Sessão 3: hoje + 21 dias
4. Redirecionado para ficha do paciente (cronograma visível)
```

### Tecnologia
- Backend: Express router com Prisma (transação segura)
- Frontend: Multi-passo workflow com preview
- Validação: Sempre verifica clinicaId do paciente/tipo

---

## [2026-10-06 - Fase 3] Conformidade CFP + Diferenciação de Dashboard

### ✅ Bloqueio de Exportação (CFP nº 09/2024 - Compliance)
- **ComposicaoLaudo.tsx**: 
  - Desabilitado botão "Baixar DOCX" até `iaRevisadaPeloProf = true`
  - Melhorada mensagem de revisão com box educativo sobre CFP 09/2024
  - Tooltip explicativo quando botões estão desabilitados
  - Backend já validava bloqueio em rota GET `/laudos/:id/exportar-docx`

### ✅ Consentimento TDIC Educativo (CFP nº 09/2024 - Inovação)
- **FichaPaciente.tsx**:
  - Redesenho completo da seção de Consentimento TDIC com card visual
  - Explica 2 tecnologias: IA + Armazenamento em Nuvem
  - Educação do paciente sobre o papel do profissional
  - Registra data de consentimento quando aceito

### ✅ Dashboard Cruzado de Resultados (Diferencial Competitivo)
- **Nova Aba**: "Dashboard" na ficha do paciente (entre "Linha do tempo" e "Laudos")
- **DashboardResultados.tsx** (novo componente):
  - Gráfico de barras comparando resultados de múltiplos testes
  - Cores por desempenho: sage (esperado), clay (acima), ember (abaixo)
  - Tabela de detalhes com classificação + escore-T/percentil
  - Aviso sobre responsabilidade clínica na interpretação
  - Responsivo e visual-first

### Arquitetura
- Backend: Sem mudanças (bloqueio já existia)
- Frontend: +1 componente, +1 aba, melhorias UX em 2 páginas
- Conformidade: Atende Resolução CFP 09/2024 (TDICs)

---

## [2026-10-06 - 22:30] Tipos de Atendimento - Fase 2 Completa + Deploy com Sucesso

### Correções
- **tiposAtendimento.ts**: Removido import incorreto de middleware `autenticacao`; middleware de autenticação agora aplicado via `exigirAutenticacao` no server.ts

### Deploy Status
- ✅ Banco de dados: Migration concluída
- ✅ Seed: 21 testes + 14 tipos de atendimento prontos
- ✅ API: Rodando em localhost:3333 — GET/POST/PATCH/DELETE funcionando
- ✅ Frontend: Rodando em localhost:5173 — página acessível

## [2026-10-06 - Early] Tipos de Atendimento - Fase 2 Completa

### Backend
- **Modelo Prisma**: Adicionado modelo `TipoAtendimento` com campos `nome`, `descricao`, `numeroSessoes`, `testeIds` (array de IDs de testes) e timestamps
- **API Routes**: Implementadas rotas CRUD completas em `/tipos-atendimento` (GET, POST, PATCH, DELETE) com autenticação e verificação de clinicaId
- **Seed Data**: Criado arquivo `tipos-atendimento-seed.ts` com 14 tipos padrão (Neuropsicologia: 6, Psicologia Clínica: 5, Outros: 3)

### Frontend
- **Nova Página**: `CadastroTiposAtendimento.tsx` com:
  - Listagem de tipos existentes com indicadores de sessões e testes
  - Formulário inline para criar/editar tipos
  - Seletor de testes em checkboxes (carregados dinamicamente)
  - Validação de campos obrigatórios (nome, numeroSessoes)
  - Feedback de sucesso/erro ao usuário
- **API Client**: Adicionadas funções `listTiposAtendimento()`, `createTipoAtendimento()`, `updateTipoAtendimento()`, `deleteTipoAtendimento()` em `api.ts`
- **Navegação**: Adicionado link "Cadastro · Tipos de Atendimento" no menu lateral do Layout

### Próximos Passos (Fase 3)
- Integração de tipo de atendimento ao fluxo de criação de sessões/atendimentos
- Auto-criação de N sessões quando tipo é selecionado
- Pré-seleção de testes no formulário de aplicação baseado na associação de tipo
- Implementação da lógica de auto-sessão no backend

## Noite 7 — WISC-IV: fidelidade à busca binária do Excel
- gerar-wisc4-planilha.mjs emula a busca binária do LOOKUP (colunas desordenadas); varredura de 23.031 combinações = 0 diferenças; comparador com 3 sementes (500 casos) = tudo igual; teste-guarda agora com 16 divergências conhecidas vs. A.1 (4 novas de Cubos 8:0). Suíte 93/93.

## Noite 7 (cont.) — WISC-IV: discrepâncias de índices e de subtestes
- Novo scripts/gerar-wisc4-discrepancias.mjs (roda DEPOIS do gerar-wisc4-planilha.mjs; este reescreve o JSON): lê as fórmulas das linhas 70-75 e 78-93 e extrai valores críticos por idade (código L64) e frequências acumuladas por sinal/nível do QIT.
- wisc4.ts: extras.discrepanciasIndices (6 pares) e extras.discrepanciasSubtestes (16 pares), com opções confiança 90/95% e base Amostra Geral/Nível de Habilidade.
- comparar-wisc4.ts compara também essas colunas com as 4 combinações de opções: 3 sementes × 500 casos = tudo igual (≈61 mil campos por semente). Suíte 94/94.
- Achado: WISC-NORMAS!G302 é texto na planilha (defeito) — não reproduzido; registrado em WISC-IV-divergencias-planilha.md.

## Noite 7 (cont.) — WISC-IV: facilidades/dificuldades e escores de processo
- Novo scripts/gerar-wisc4-processo.mjs (roda depois dos outros 2 geradores): extrai as tabelas das linhas 100-109 (valor crítico por código L100 + regras de frequência) e 116-140 (CUSB/DIOD/DIOI/CAA/CAE, maior sequência de dígitos, diferença UDIOD-UDIOI, comparações). Reproduz a busca binária do Excel nas tabelas.
- wisc4.ts: extras.facilidades, extras.comparacoesProcesso, extras.diferencaUdio; porCampo ganha cusb/diod/dioi/caa/cae/udiod/udioi.
- comparar-wisc4.ts cobre tudo isso: 4 sementes × 500 casos (~82 mil campos cada) = tudo igual. Suíte 95/95. 5 defeitos novos da planilha registrados em WISC-IV-divergencias-planilha.md (não reproduzidos).
- Ordem dos geradores: gerar-wisc4-planilha → gerar-wisc4-discrepancias → gerar-wisc4-processo (cada um reescreve o JSON).

## Noite 7 (cont.) — WISC-IV: clusters, comparações clínicas, hipóteses e sugestões
- Novo scripts/gerar-wisc4-clusters.mjs (4º gerador; ordem: planilha → discrepancias → processo → clusters): 8 clusters com tabela soma→composto/IC95/percentil (busca binária do Excel), 6 comparações clínicas (valores críticos 21/24/24/17/24/17), textos de hipótese e sugestão.
- wisc4.ts: extras.clusters, extras.comparacoesClinicas, extras.gaiCpi. Classificação do cluster por composto (como os índices).
- comparar-wisc4.ts cobre tudo: 3 sementes × 500 casos (~95 mil campos) = tudo igual; suíte 96/96. Defeitos novos (hipótese Gc-LM×Gf-verbal invertida, empate, subteste=0) em WISC-IV-divergencias-planilha.md.

## Noite 7 (cont.) — WISC-IV: habilidades compartilhadas
- Novo scripts/gerar-wisc4-habilidades.mjs (5º gerador, sempre depois dos outros): 82 habilidades com subtestes e regra de interpretação lidos das fórmulas.
- wisc4.ts: extras.habilidades {medias, itens} — marca P/N/0 pela diferença para a média do índice (±1), interpretação só com todos os subtestes.
- comparar-wisc4.ts: 6 sementes × 500 casos (~150 mil campos) = tudo igual. Suíte 97/97. Defeitos novos registrados (RM em $G$95 em 4 habilidades; regra de Fraqueza quebrada em 50 das 82).

## Noite 7 (cont.) — WISC-IV: idade mental e análise intraindividual (backend completo)
- Novo scripts/gerar-wisc4-idade-mental.mjs (6º gerador): tabelas bruto → meses (busca binária) e limites "<"/">" por subteste.
- wisc4.ts: extras.idadeMental {subtestes, indices, total, avisos} e extras.intraindividual {itens, medias, maiorPositiva, maiorNegativa}.
- comparar-wisc4.ts: 4 sementes × 500 casos (~190 mil campos) = tudo igual; suíte 98/98. Com isso o BACKEND do WISC-IV espelha toda a planilha; falta o front e a troca do catálogo.

## Noite 7 (fim) — WISC-IV integrado: catálogo, API e telas
- Catálogo: WISC-IV do seed agora usa a planilha (prisma/wisc4-planilha.ts; 1 tabela normativa 6–16 anos, 22 campos de entrada incl. escores de processo, 7 calculados: ICV, IOP, IMO, IVP, QIT, GAI, CPI). O WISC-IV antigo (tabelas A.1 por faixa, "ponderado_e_composto_por_campo") deixou de ser usado.
- API: POST /aplicacoes-teste/calcular aceita confianca ("90%"/"95%") e base ("Amostra Geral"/"Nível de Habilidade"); acima de 16 anos o WISC-IV não calcula (extras.foraDaFaixa).
- Front: components/TesteWiscIV.tsx (9 abas: Brutos, Ponderados, Índices e QIs, Discrepâncias, Facilidades + intraindividual, Clusters com hipóteses/sugestões, Processo, Habilidades com destaque de teste, Idade mental), lib/wisc4.ts, ligado em LancamentoTeste.tsx. pages/PreviewWais3.tsx aceita ?teste=wisc (temporária, só DEV).
- Verificado ponta a ponta no banco local (e2e: calcular 90/95 × base, salvar, adulto fora da faixa) e por prints das abas. NÃO feito: deploy em produção/Render (WISC-IV e WAIS-III precisam do seed/atualização dirigida; não rodar o seed completo em produção).

## 07/10/2026 — Script de atualização do WAIS-III/WISC-IV para produção (preparado, NÃO executado no Render)
- apps/api/prisma/atualizar-wechsler.ts: atualiza só Teste + TabelaNormativa do WAIS-III e do WISC-IV, sem apagar lançamentos; padrão = simulação, `--aplicar` grava em transação. seed.ts agora exporta TESTES_PLACEHOLDER e só roda main() quando executado direto.
- Testado no banco local (simulação, aplicar, simulação, e2e do WISC-IV = ok). Antes de usar em produção: conferir DATABASE_URL (o .env aponta para o Render) e os lançamentos antigos de WISC-IV.

## 07/10/2026 — Deploy no Render
- Push para BetoBL/Private (master). Serviços criados pela API do Render na conta "Bora Luxar": neurologic-api (web, starter, https://neurologic-api.onrender.com, srv-db31s1u7bikc73bd2d10) e neurologic-web (site estático, https://neurologic-web.onrender.com, srv-db31s2k9v7es73am2tlg), ligados ao banco existente neurologic-db pela URL interna. autoDeploy ligado: todo push na master publica.
- /health = 200; SPA responde nas rotas internas; CORS ok.
- WAIS-III e WISC-IV do banco de produção atualizados com prisma/atualizar-wechsler.ts (0 lançamentos afetados). Produção tem 2 profissionais e 4 pacientes reais: não rodar o seed completo.
- render.yaml: build com `npm install --include=dev` (o tsc é devDependency).

## 07/10/2026 — WASI espelhando a planilha (local, ainda NÃO publicado)
- Novas ferramentas: scripts/extrair-abas-xlsm.mjs (lê qualquer aba do .xlsm direto do arquivo; funciona com o arquivo aberto no Excel porque usa cópia) e scripts/gerar-wasi-planilha.mjs / comparar-wasi.ts.
- apps/api/src/lib/wasi.ts + docs/testes/WASI-planilha.json: escore T por 45 faixas etárias, Z/composto/percentil/ponderado, QI Verbal/Execução/QIT-4/QIT-2 com IC 90/95, interpretabilidade, habilidades (56), intraindividual, idade mental. Comparador contra a planilha avaliada: 3 sementes × 300 casos (~55 mil campos) sem divergência; suíte 102/102.
- Catálogo: WASI do seed trocado (era só classificação de QI digitado) por 4 campos brutos + 4 calculados; atualizar-wechsler.ts agora cobre WAIS-III, WISC-IV e WASI.
- Tela TesteWasi.tsx (5 abas). Defeitos da planilha em docs/testes/WASI-divergencias-planilha.md.
- Próximo no menu: WISC-IV-REAV (reavaliação) e depois o restante da lista (ver memória project_neurologic_menu_planilha).

## 07/10/2026 — Motor de planilha (decisão: testes simples rodam as fórmulas da própria planilha)
- Avaliador de fórmulas agora é fonte única em apps/api/src/lib/planilha/avaliador.ts (+COUNTIFS, COUNT, COUNTBLANK, AVERAGE, NORM.DIST, STANDARDIZE, MATCH, RANK.EQ, CHAR, CONCAT, TODAY, NOW); scripts/avaliador-planilha.mjs só reexporta (rodar com tsx).
- Novo: lib/planilha/motor.ts (tipo de conversão "planilha", ResultadoCalculado modo "planilha"), scripts/construir-teste-planilha.ts, scripts/mapear-aba.mjs, prisma/planilhas-seed.ts, TestePlanilha.tsx (tela genérica), docs/testes/planilha/LEIAME.md.
- API: conversões de tabela normativa ficam em cache na memória (o cálculo ao vivo não relê centenas de KB a cada tecla); nome/sexo/escolaridade do paciente chegam ao motor.
- Piloto: D2-R (36 entradas, 41 saídas, 291 KB). atualizar-wechsler.ts agora cria/atualiza também os testes de planilha.

## 07/10/2026 (noite) — 45 testes pelo motor de planilha (local; NÃO publicados)
- Lotes (docs/testes/planilha/lotes): 2 = AC, AC-15, Corsi, TOL, TFV, Go/No-Go, Fig. Rey; 3 = BVMT-R, HVLT-R, Hayling, PED-VR, PROLEC, THCP, TDE-II, Nomeação, PA, Token, 7Fig-7Pal, Wisconsin; 4 = BAMS, BDEFS, E-TDAH (AD, CriAd, 2), IEP, QEDP, SDQ, SNAP-IV, EPQ-J; 5 = BRIEF-P, CBCL, CBCL-Pre, Neupsilin-Inf, NEPSY-II, Pfister, PEP-R, Vineland-3 (6 formas); + D2-R, Stroop e Trilhas (specs manuais). Total: 45 testes (~30 MB de definições).
- Ferramentas: scripts/rascunho-spec-planilha.mjs (rascunho automático de spec), scripts/lote-planilha.mjs (rascunho + construção + fumaça em lote), construir-teste-planilha.ts mais rápido (índice por endereço) e sem dado de paciente/profissional nas definições (valores em cache zerados; ID-Usuário excluída).
- Varredura ponta a ponta no banco local: todos respondem 200 em < 250 ms. Os specs são RASCUNHOS automáticos: rótulos, agrupamento e tabelas de resultado precisam de revisão por teste (principalmente questionários grandes) e validação com casos reais da Leticia.

## 07/10/2026 — Tela cheia do teste (local; não publicado)
- Nova rota /teste-completo (pages/TesteCompleto.tsx, fora da sidebar): abre o teste numa sessão em tela cheia, com abas/gráficos/cálculo ao vivo, carregando o lançamento salvo (?aplicacaoId=) ou deixando escolher o teste. Ficha do paciente → linha do tempo: botões "Abrir tela completa" e "+ Lançar teste nesta sessão (tela completa)". O lançamento de sempre (/testes) fica como está.
- Correção: o "Salvar" de /testes gravava campo em branco como 0 (subteste não aplicado virava zero) e não gravava as opções (ex.: tabela normativa). Agora grava só o preenchido, com as opções.
- API: GET /testes sem as conversões (34 MB → 2,8 MB) + gzip (≈350 KB) — corrigiu "Failed to fetch" no Render (já publicado).

## 07/10/2026 (tarde) — Substituição dos testes antigos pelo motor de planilha (em andamento, local)
- Extrator marca as células DESBLOQUEADAS da planilha protegida (u:true) = células de digitação; o construtor nunca leva valor delas para a definição. Motivo: a planilha traz um protocolo de exemplo preenchido (respostas de itens). Definições regeneradas sem esses valores; as já publicadas (commits 9f509bd/a882fe5, produção) ainda têm os valores de exemplo → republicar para limpar.
- Disco encheu (13 GB em pastas temporárias do extrator): scripts agora apagam seus temporários.
- lote6 (BPA, FDT, BFP, RAVLT, SCARED, SRS-2 adultos/escolar/pré, E-TDAH Pais) gerado. BPA e FDT aplicados no banco LOCAL (mesma sigla = substitui; entradas equivalentes às antigas, FDT confere com a coluna "percentil manual"). BFP, RAVLT, SCARED, SRS-2 e E-TDAH Pais passam de total digitado para item a item: aguardam decisão do usuário. atualizar-wechsler.ts aceita SO_SIGLAS=BPA,FDT.
