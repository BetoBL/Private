# Estudo Sintropia.psi: como o motor de escalas funciona (15/10/2026)

Método: abri "Visualizar" de 20 escalas (metadados e formato) e testei o ciclo completo com duas delas (GAD-7 e DASS-21) numa paciente fictícia. **Os textos das perguntas não foram copiados** (cada escala tem autoria/licença; conferir uma a uma antes de usar).

## 1. Ficha de cada escala na biblioteca (metadados que o motor guarda)
Nome, **construto/tema** (um ou mais), **faixa de uso** (ex.: Adultos), **frequência sugerida** (texto), **nota clínica** ("Triagem, não diagnóstico"), tags (Autoaplicável/Informante, nº de itens, tempo estimado), **escala de resposta** (referência para todas as perguntas ou por item), instruções gerais, lista de itens. A prévia mostra "como o paciente verá" e é somente leitura.

| Escala | Itens | Tema | Frequência sugerida |
|---|---|---|---|
| PHQ-9 | 10 (9 + item funcional) | Depressão | linha de base + mensal |
| GAD-7 | 7 | Ansiedade | (ver ciclo abaixo) |
| DASS-21 | 21 | Estresse (depressão, ansiedade e estresse) | linha de base + quinzenal ou mensal |
| PCL-5 | 20 | TEPT | linha de base + reavaliação em 4 a 6 semanas |
| WHOQOL-BREF | 26 | Qualidade de vida | linha de base + reavaliação periódica |
| AUDIT | 10 | Uso de substâncias | linha de base + reavaliação conforme risco |
| HADS | 14 | Ansiedade e depressão | linha de base + conforme necessidade clínica |
| EPDS | 10 | Depressão (perinatal) | linha de base + conforme cuidado perinatal |
| CES-D | 20 | Depressão | linha de base + mensal |
| OCI-R | 18 | TOC | linha de base + conforme sintomas |
| SRQ-20 | 20 | Ansiedade, depressão, monitoramento | linha de base + conforme necessidade |
| MHI-5 | 5 | Monitoramento clínico, qualidade de vida | linha de base + periódica |
| ASRS-18 | 18 | TDAH | linha de base + mensal |
| SNAP-IV | 26 | TDAH (informante) | linha de base + mensal |
| SWLS | 5 | Qualidade de vida | linha de base + periódica |
| RSES (Rosenberg) | 10 | Autoestima | linha de base + mensal |
| PANAS | 20 | Monitoramento, regulação emocional | conforme objetivo clínico |
| DERS | 36 | Estresse, regulação emocional | conforme objetivo terapêutico |
| AAQ-II | 7 | Flexibilidade psicológica, ACT | conforme processo ACT |
| CORE-OM | 34 | Monitoramento clínico | linha de base + mensal |

Padrão: **toda escala tem a nota "Triagem, não diagnóstico"**; a frequência sugerida é texto livre por escala (linha de base + reavaliação).

## 2. Solicitar ao paciente (ação do psicólogo)
Botão **Solicitar** abre: **"Quando o paciente deverá responder?"** (Hoje, Amanhã, Semana que vem, Escolher data) e **"Frequência de monitoramento"** (Apenas uma vez, Todo dia, 3x por semana, 2x por semana, Toda semana, 2x por mês, Todo mês) e **Enviar solicitação**. Uma mesma escala pode ser enviada várias vezes (cada envio = uma tarefa; contadores "N envios, N concluídos, N pendentes"). Só funciona com paciente conectado ao app.

## 3. No app do paciente
Tarefa na tela inicial e na aba Escalas (por data). Página única: instruções gerais + perguntas numeradas, uma resposta por pergunta (4 opções no DASS-21 e no GAD-7), botão **Enviar respostas**, tela "Parabéns! Sua tarefa foi concluída". **O paciente não vê pontuação nem interpretação.**

## 4. No painel do psicólogo (Monitoramento > paciente > Escalas > Enviados)
- Cartão da escala (construto, uso, tags, "Triagem, não diagnóstico", contadores) com **Visualizar / Solicitar / Respostas**.
- **Respostas**: lista de envios com filtros (Todas, Concluídas, Pendentes, Expiradas, **Apagadas**), lixeira por envio, **Ver respostas** (21 itens respondidos, item por item com a resposta marcada e a escala de referência) e **Baixar respostas em PDF**.
- **Gráfico de histórico**: no GAD-7, uma linha de pontuação com faixas coloridas, **pontos de corte (5, 10, 15)** e **linha normativa (10)**; no DASS-21, **um gráfico por subescala** (0 a 42) com as três séries (Depressão, Ansiedade, Estresse).
- **Análise LUMA (IA)** gerada sozinha: resumo cronológico por data e subescala (com faixa), tendência por domínio (com a ressalva de que um único registro não permite tendência), mudanças clinicamente relevantes, **implicações clínicas** (nível sintomático, risco e segurança, comorbidades, monitoramento) e recomendações (instrumentos complementares, avaliar risco, reavaliar, coordenar cuidado), com observação final de provisoriedade.

## 5. Pontuação verificada (importante para o nosso motor)
Respondi o DASS-21 com um padrão conhecido e conferi a conta: o sistema **soma os itens de cada subescala e multiplica por 2** (versão reduzida do DASS), e classifica por **faixas de gravidade por subescala**. Conferi: Depressão = soma dos itens 3, 5, 10, 13, 16, 17, 21 (=6) → 12 (**Leve**); Ansiedade = itens 2, 4, 7, 9, 15, 19, 20 (=11) → 22 (**Extremamente severo**); Estresse = itens 1, 6, 8, 11, 12, 14, 18 (=13) → 26 (**Severo**). Isso bate com as faixas publicadas do DASS-21. No GAD-7, 21/21 foi classificado "Ansiedade grave (pontuação máxima)" com cortes 5/10/15. Ou seja, **cada escala tem: itens, mapeamento item→subescala, regra de soma/multiplicador, faixas de classificação, pontos de corte para o gráfico e (às vezes) linha normativa**.

## 6. O que isso diz para o nosso motor
Modelo de dados sugerido:
- **Escala**: código, nome, construto(s), faixa etária/uso, tipo (autoaplicável ou informante), tempo, instrução, nota clínica, frequência sugerida, **fonte e licença**, versão.
- **Item**: texto, ordem, subescala, se é invertido, escala de resposta (global ou por item).
- **Regra de pontuação**: por subescala (soma/média, multiplicador, itens invertidos), **faixas** (rótulo + intervalo + cor) e **pontos de corte**; sinalizar itens críticos (ex.: ideação suicida no PHQ-9) para **alerta de risco ao profissional**.
- **Solicitação**: escala, paciente, prazo, **recorrência**, status (pendente, concluída, expirada, apagada), respostas, pontuações calculadas, data.
- **Resultado**: gráfico por escala ou subescala ao longo do tempo (com cortes), análise por IA **opcional e revisável**, PDF.
- Regras de produto: paciente não vê pontuação; sempre "triagem, não diagnóstico"; soft delete ("apagadas" ficam visíveis como filtro).
- **Direitos**: PHQ-9, GAD-7, AUDIT (OMS), PCL-5 (governo dos EUA) e DASS-21 têm uso livre; WHOQOL-BREF (OMS), HADS, CORE-OM, PANAS, DERS e outras têm termos próprios. Só incluir no NeuroLogic o que tiver licença clara e versão validada em português.
