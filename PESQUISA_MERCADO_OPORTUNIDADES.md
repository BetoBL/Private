# NeuroLogic: Pesquisa de Mercado & Oportunidades de Diferenciação

**Data**: 2026-10-06  
**Status**: Análise de concorrentes e conformidade regulatória

---

## EXECUTIVO: O QUE FALTA NO MERCADO

### Líderes Atuais (Gestão Clínica)
- **PsicoManager** (5.0★): Agenda, prontuário, IA para evoluções, app do paciente, convênios
- **GestorPsi**: Gestão clínica + prontuário + pagamentos
- **Clinora**: Agenda + cadastro + controle de salas
- **Corpora**: Agenda + prontuário + cobrança

### Especialistas em Testes (Avaliação)
- **AvalPsico**: 6.000+ psicólogos; 90% mais rápido (>30 testes)
- **Cognitiva Laudos**: Neuropsicologia específica; laudo automático em DOCX
- **Nesplora (VR)**: Realidade virtual para avaliação ecológica (ibérica, top-of-mind)
- **PontoAzul IA**: WISC-IV com 98.7% precisão

### Gap de Mercado Identificado
❌ **Nenhum concorrente integra gestão administrativa + avaliação neuropsicológica de forma fluida**
- Sistemas administrativos não fazem avaliação
- Plataformas de testes não gerenciam clínica
- IA gerada é robótica e genérica (não customizada por perfil do psicólogo)
- Suporte a múltiplos informantes é manual/confuso

✅ **NeuroLogic está bem posicionado para preencher essa lacuna**

---

## PARTE 1: CONFORMIDADE REGULATÓRIA (OBRIGATÓRIO)

### ✅ Checklist LGPD para Prontuários de Saúde

**Classificação de Dados**
- [ ] Dados de saúde são "sensíveis" — proteção reforçada obrigatória
- [ ] Multa ANPD máxima: 2% do faturamento (limitado R$50M)
- [ ] Guarda mínima: 5 anos após último atendimento

**Requisitos Técnicos**
- [ ] Servidores no Brasil (verificar Render.com compliance)
- [ ] Criptografia ponta-a-ponta para dados em trânsito
- [ ] Backup automático (testado regularmente)
- [ ] Controle de acesso por perfil (admin, profissional, recepção)
- [ ] Trilha de auditoria completa (quem acessou, quando, o quê)
- [ ] Isolamento de dados entre clínicas (não pode haver cross-access)
- [ ] Consentimento explícito do paciente para coleta/uso

### ✅ Checklist CFP (Conselho Federal de Psicologia)

**Resolução CFP nº 06/2019** — Laudo Psicológico Obrigatório
- [ ] 6 seções fixas: Identificação, Demanda, Procedimento, Análise, Conclusão, Referências
- [ ] Todas as laudas numeradas e rubricadas (penúltima página)
- [ ] Assinatura eletrônica/ICP-Brasil válida
- [ ] Formato: DOCX ou PDF aceitável
- [ ] Exportação deve respeitar estrutura

**Resolução CFP nº 09/2024** — TDICs (Tecnologias Digitais incluindo IA)
- [ ] **Campo "Consentimento TDIC"** obrigatório no cadastro do paciente
- [ ] Consentimento informado: explicar quais tecnologias/IA serão usadas
- [ ] IA é **apoio apenas**, nunca decisão final
- [ ] **Profissional deve revisar todo output de IA antes de usar**
- [ ] Registrar no prontuário: "IA utilizada para geração de análise"
- [ ] **Bloqueio na UI**: Não permitir exportar laudo até profissional confirmar "Revisei e aprovo esta análise"

**Resolução CFP nº 09/2018 + nº 31/2022** — Testes Psicológicos
- [ ] Apenas testes **SATEPSI-aprovados** podem ser usados
- [ ] Correção deve ser fiel ao manual técnico (sem atalhos)
- [ ] Responsabilidade técnica: sempre do psicólogo (sistema é ferramenta)

**Resolução CFP nº 11/2018 + nº 09/2024** — Telepsicologia (se aplicável)
- [ ] Sala virtual com criptografia ponta-a-ponta
- [ ] Não armazenar áudio/vídeo de sessão
- [ ] Plataformas aprovadas: Jitsi, Doxy.me, integradas com segurança comprovada
- [ ] IPs registrados/validados no Brasil obrigatório

---

## PARTE 2: OPORTUNIDADES DE DIFERENCIAÇÃO

### 1️⃣ **Gestão de Bateria + Cronograma de Sessões** (Alto Diferencial)

**Status no NeuroLogic**: Parcialmente pronto (Tipos de Atendimento criados hoje)

**O que Concorrentes Não Fazem**
- AvalPsico: Teste isolado (não pensa em 4–6 sessões como processo)
- Cognitiva Laudos: Laudo por teste (não integrado com agenda)
- Gestão clínica: Não sabem quais testes usar para TDAH vs TEA

**Implementação Proposta**
```
[Tipo de Atendimento: "Avaliação de TDAH"]
  ├─ Duração: 3 sessões
  ├─ Testes obrigatórios: WISC-IV, ETDAH-PAIS, BRIEF2-PAIS
  └─ Ao clicar "Iniciar Atendimento"
     └─ Sistema cria automaticamente:
        • Sessão 1: "Aplicação de WISC-IV" (90 min)
        • Sessão 2: "Entrevista com pais + ETDAH" (60 min)
        • Sessão 3: "Análise + Discussão de resultados" (60 min)
```

### 2️⃣ **Síntese Assistida por IA (Fluida, Customizada)** (Alto Diferencial)

**Problema com Concorrentes**
- AvalPsico: Gera texto genérico/robótico ("Paciente apresentou pontuação...")
- Cognitiva Laudos: Template fixo, sem personalidade do profissional
- Nenhum sistema lê o "Perfil de Atuação" do psicólogo antes de gerar

**Implementação Proposta**
```
Profissional define (uma vez) em "Perfil de Atuação":
  • Abordagem teórica: "Cognitivo-comportamental com viés psicodinâmico"
  • Tom de escrita: "Científico mas acessível para família"
  • Regras de prudência: "Sempre destacar potencialidades da criança"
  • Vocabulário recorrente: "neurodesenvolvimento", "recursos adaptativos"

Quando gera síntese:
  → Sistema injeta essas configurações no prompt de IA
  → Resultado: Laudo com "voz" do profissional, não genérico
```

**Benefício**: Diferencial competitivo direto contra AvalPsico/Cognitiva

### 3️⃣ **Suporte Multi-Informante Nativo** (Médio-Alto Diferencial)

**Status no NeuroLogic**: Começado (DadosRespondente em AplicacaoDeTeste)

**Problema Identificado**
- Muitos testes têm múltiplas versões (SCARED-PAIS, SCARED-AUTORRELATO, SRS-2-ESCOLAR-M, SRS-2-ESCOLAR-F)
- Concorrentes: Cada respondente é aplicação separada (confuso)
- NeuroLogic: Já reconhece instrumento comum (ex: SCARED é instrumento, PAIS é respondente)

**Implementação Proposta**
```
Aplicação de "Avaliação de Ansiedade":
  Sessão 1:
    ├─ SCARED (Respondente: Mãe) — escores brutos inseridos
    ├─ SCARED (Respondente: Criança) — escores brutos inseridos
    └─ BAI (Respondente: Criança) — escores brutos inseridos

Resultado:
  → Gráfico comparativo: Mãe vs Criança (discrepâncias evidentes)
  → Interpretação: "Mãe relata maior ansiedade que criança percebe..."
```

### 4️⃣ **Dashboard de Resultados Cruzados** (Médio Diferencial)

**Ausente em Todos os Concorrentes**

**Implementação Proposta**
```
Após 3 sessões de "Avaliação de TDAH" completa:

Dashboard mostra:
  • Eixo vertical: Funções executivas (BRIEF-2)
  • Eixo horizontal: QI geral (WISC-IV)
  • Bolhas: Tamanho = tempo de reação no WISC, cor = impulsividade (BRIEF)
  • Anotação clínica: "Filho(a) pode estar compensando com estratégias verbais"

PDF final: Gráfico que substitui páginas de tabelas (visual > textual)
```

### 5️⃣ **Consentimento TDIC Estruturado com Educação do Paciente** (Médio Diferencial)

**Conforme Resolução CFP nº 09/2024**

**Implementação Proposta**
```
Quando paciente entra no sistema (Painel do Cliente):

  ┌─────────────────────────────────────────────────────┐
  │ 📋 Tecnologias Usadas Nesta Avaliação               │
  ├─────────────────────────────────────────────────────┤
  │                                                       │
  │ ✓ Inteligência Artificial (Claude 3)                │
  │   → Usada para: Gerar análise/síntese dos testes    │
  │   → Você sabia: Psicólogo SEMPRE revisa antes usar  │
  │                                                       │
  │ ✓ Armazenamento em Nuvem (AWS/Render)               │
  │   → Seus dados são criptografados e seguros         │
  │   → Backup automático a cada 6 horas                │
  │                                                       │
  │ □ Concordo em usar essas tecnologias                │
  │   [Refusar]  [Concordo - Salvar]                    │
  │                                                       │
  └─────────────────────────────────────────────────────┘
```

---

## PARTE 3: PRIORIDADES DE IMPLEMENTAÇÃO

### Curto Prazo (Próx. 2–4 semanas)

**1. Bloquear Exportação de Laudo sem Revisão IA** (CFP Compliance)
```
Status: EM PROGRESSO (fase 2 pronta, fase 3 = implementar)

Pseudocódigo:
  if (laudo.statusIA === "GERADO") {
    botaoExportar.disabled = true
    tooltip: "Revise a análise gerada por IA antes de exportar"
  }
  
  if (profissional.clica("Revisei e aprovo")) {
    laudo.statusIA = "REVISADO_PROFISSIONAL"
    botaoExportar.disabled = false
  }
```

**2. Implementar Campo "Consentimento TDIC"** (CFP 09/2024)
- Adicionar `consentimentoTDIC` + `consentimentoTDICData` ao modelo Paciente (já existe)
- UI no cadastro: "Você autoriza o uso de IA nesta avaliação?"
- Rastreio: Registrar no prontuário quando TDIC é aceito/recusado

**3. Dashboard Visual de Múltiplos Testes** (Diferencial)
- Ler `resultadoCalculado` de todas as aplicações de uma sessão
- Renderizar gráfico de comparação (eixos x/y, tamanho de bolha)

### Médio Prazo (Próx. 4–8 semanas)

**4. Auto-Criação de Sessões por Tipo** (Fase 3 Original)
```
Quando usuário seleciona "Tipo de Atendimento: Avaliação de TDAH":
  → Backend: await criarSessoes(tipoId, numeroSessoes=3)
  → Criar 3 sessões com datas sugeridas (ex: +7, +14, +21 dias)
  → UI: Mostrar cronograma ao profissional para confirmar/editar
```

**5. Perfil de Atuação → Geração de IA Customizada** (Diferencial Alto)
- Ler `perfilDeAtuacao` do profissional ao gerar síntese
- Passar ao prompt de Claude: abordagem teórica, tom, regras de prudência
- Resultado: Laudo com "voz" do profissional, não genérico

**6. Integração Telepsicologia** (Opcional, Crescimento)
- Sala virtual segura (Jitsi/Doxy.me) + prontuário + testes no mesmo lugar
- Atender Resolução CFP 11/2018 + 09/2024

### Longo Prazo (2+ meses)

**7. Realidade Virtual (Inspiration)** (Nesplora Strategy)
- Avaliar integração com VR para testes de atenção/memória ecológica
- Prototipo: Adultos fazendo tarefa virtual (atenção dividida) enquanto sistema rastreia erros

**8. Integração com Normativas Online** (Escalabilidade)
- Permitir upload de novas normas (não travado em BD fixo)
- Usuário pode definir próprias normas para testes customizados

---

## PARTE 4: CHECKLIST DE CONFORMIDADE (IMPLEMENTAR JÁ)

### ✅ LGPD
- [ ] Auditoria de segurança do Render.com (dados em Brasil)
- [ ] Testar restore de backup completo (recuperação de dados)
- [ ] Documentar política de retenção (5 anos pós-atendimento)
- [ ] Implementar trilha de auditoria granular (quem acessou cada registro)

### ✅ CFP
- [ ] Campo `consentimentoTDIC` visível e obrigatório
- [ ] Bloquear exportação de laudo com IA não revisada
- [ ] Documentar no prontuário: "Análise gerada por IA, revisada por [profissional]"
- [ ] Testar exportação em DOCX conforme Resolução 06/2019
- [ ] Suporte a assinatura eletrônica ICP-Brasil (verificar biblioteca)

### ✅ SATEPSI
- [ ] Listar apenas testes aprovados no seletor
- [ ] Respeitar manual técnico na correção (validar contra AvalPsico como referência)

---

## PARTE 5: BENCHMARKING — O QUE COPIAR DE LÍDERES

| Recurso | PsicoManager | AvalPsico | Cognitiva Laudos | Nesplora | NeuroLogic deve ter |
|---------|--------------|-----------|------------------|----------|---------------------|
| Notificações WhatsApp | ✅ | ❌ | ❌ | ❌ | 📌 Considerado |
| Anexação de documentos | ✅ | ❌ | ✅ | ❌ | ✅ Já feito |
| Múltiplos respondentes | Básico | Básico | Básico | ✅ | ✅ **Melhorado** |
| Geração automática de laudo | Evoluções | ✅ | ✅ | ❌ | ✅ Com estilo |
| Perfil do psicólogo | ❌ | ❌ | ❌ | ❌ | ✅ **Diferencial** |
| Dashboard cruzado | ❌ | ❌ | ❌ | ❌ | ✅ **Diferencial** |
| Consentimento TDIC | ❌ | ❌ | ❌ | ❌ | ✅ **Inovação CFP** |
| Cronograma de sessões | Básico | ❌ | ❌ | ❌ | ✅ **Diferencial** |

---

## CONCLUSÃO

**NeuroLogic está bem posicionado para:**

1. **Integração**: Único sistema que pensa em gestão clínica + avaliação como processo (não silos)
2. **Conformidade**: Pode ser pioneiro em implementar Consentimento TDIC de forma educativa (CFP 09/2024)
3. **Personalização**: Perfil de Atuação → IA customizada (vs. genérico de concorrentes)
4. **Diferenciais Técnicos**: Dashboard cruzado, multi-informante nativo, cronograma automático

**Risco**: AvalPsico/Cognitiva Laudos podem replicar rápido se não agir na diferenciação

**Recomendação**: Focar em Fases 3–4 nas **Features de Diferencial Alto** (auto-sessão, IA customizada, dashboard)

---

**Próxima Reunião**: Priorizar Fase 3 com base neste mapeamento
