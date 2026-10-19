# Estudo Sintropia.psi: Agenda e Financeiro (15/10/2026)

## Agendamentos (menu): Calendário | Agendar Sessão
**Calendário** (tela cheia): botão **+ Sessão**; navegação de período (anterior/próximo/Hoje), seletor de data; modos **Agenda** (lista), **Mês, Semana, Dia**; **Calendário** (esconde o painel lateral), **Férias**, **Bloqueio**. Grade com faixa de horas; sessão aparece como bloco colorido com horário e nome.
Painel lateral direito:
- **Semana clínica**: período, próxima sessão, cards "hoje" e "pacientes no período", **ocupação** (% da agenda, ex.: 3%), "dia em foco" com lista do dia.
- **Leitura da semana: Ritmo clínico**: sessões clínicas, **dia de maior demanda**, **janelas livres** (intervalos de 60 min em dias úteis; configurável: início 08:00, fim 20:00, janela em minutos; botão "como o cálculo funciona" e "ver"), horas clínicas (ex.: 1,8 h), composição (pacientes no período).

**Agendar sessão** (modal; abas "Agendar Sessão" e "Bloquear Horário"):
- Paciente (busca), Data, Hora, Duração (padrão 1h), Tipo (**Presencial** ou **Online**).
- **Recorrência**: Evento único ou Recorrente: **Semanal, Quinzenal, A cada 4 semanas**; fim da recorrência: **"Manter recorrente"** (mantém sempre as próximas 12 datas e amplia quando acabar) ou **"Definir fim"** (por data ou número de sessões).
- Detalhes: Cor (ex.: Lavanda), Notas, **Google Meet** (recurso premium: gera o link do Meet na sessão).
- Botão **Criar sessão**. Existe também **Sincronizar** (Google Agenda) na home.

## Financeiro (menu superior), com 3 abas + "Outros" (Biblioteca, Pacotes)
### Controle de pagamentos
- Seletor de mês (início e fim do período). Alternador **"Quanto entrou"** (por data de recebimento) / **"Quanto gerei"** (por data da sessão ou início da mensalidade/pacote; inclui pagamentos futuros).
- Cards: "Quanto gerei" e "A receber no período".
- Lista "Pacientes no financeiro" (busca e filtro "Mostrar na lista: Todos os pacientes"); ao escolher um paciente aparecem **os combinados, pendências e sessões do período**.
### Extrato do consultório
- "Movimentações do período": sessões e pacotes pela data da sessão ou período do pacote; filtros **Tudo / Recebido / A receber**; **Baixar extrato**; **Ações em lote** (marcar sessões ou adicionar todas a receber).
### Central financeira (visão de gestão; despesas do consultório)
- Período sincronizado, **Selecionar período**, **Exportar XLSX**, **Atualizar recorrências**, **Nova despesa**; leitura por moeda (BRL, "moedas nunca são somadas").
- Cards: Resultado previsto (receitas menos despesas), Receitas no período (e quanto a receber), Despesas previstas (e quanto ainda em aberto), Acompanhamento (atraso).
- 4 abas: **Análise, Despesas, Tags, Recorrências**.
  - Análise: "Resultado e previsão de caixa" (considera só valores pagos; compromisso %, recorrente, atrasado); "Receitas x despesas" (recebida, a receber, paga, a pagar); gráfico de linhas dos últimos 6 meses (receita, despesa, resultado); distribuição por categoria de despesa.
  - Despesas: lista com filtros **Todas / Abertas / Atrasadas / Pagas / Parciais** e busca; detalhe da despesa em painel lateral; **cadastro rápido**: Descrição, Valor (BRL), Fornecedor, Vencimento, Categoria, Meio de pagamento (A definir), Paciente (sem paciente = despesa geral), Tag sugerida (ex.: Dedutível), **Recorrência** (liga/desliga), Observação.
  - Categorias de despesa (grupo): Aluguel/sala (Estrutura), Software e ferramentas, Marketing, Supervisão/intervisão (Clínica), Materiais clínicos (Clínica), Internet e telefone (Estrutura), Transporte (Operacional), Equipe/terceiros (Operacional), Cursos e eventos (Clínica), Escritório (Estrutura), Outros.
  - **Tags inteligentes**: biblioteca de tags (Recorrente, Dedutível, Online, Consultório, Crescimento, Paciente, Sugerida); personalizar nome, descrição curta, cor e símbolo; a Central sugere uma tag pela categoria, fornecedor ou paciente, e a tag só vale quando o profissional confirma.
  - Recorrências: custos fixos do consultório; compras em andamento (parcelamentos).
### Outros > Pacotes (Gestão de Pacotes)
- Tipos: **Mensais, Por sessões, Créditos** (contagem por tipo). A criação é feita no menu do paciente > Financeiro (configuração da cobrança). Texto do tour: mensalidade, pacote de N sessões (marcar como recebido), extrato e central.
### Outros > Biblioteca
(a conferir: biblioteca de documentos financeiros?)

## Observações para nós
- Ideias do que eles têm e nós já temos/planejamos: cobrança por paciente, baixa, resumo (feito em 07/10), NFS-e.
- Ideias novas: alternar "quanto entrou" x "quanto gerei"; ocupação da agenda e janelas livres; categorias de despesa e tags inteligentes; pacotes (mensal, sessões, créditos); exportar XLSX; recorrência de sessões com "manter recorrente".
