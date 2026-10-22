# Arquitetura: IA Customizada por Perfil do Profissional

**Data**: 2026-10-06  
**Status**: Implementada e documentada

---

## Visão Geral

O NeuroLogic permite que cada profissional configure seu "Perfil de Atuação", que personaliza automaticamente como a IA Claude gera rascunhos de laudos. Isso torna cada laudo "assinado" pela voz do profissional, não genérico.

---

## Fluxo Completo

### 1. Profissional Configura Seu Perfil
**Local**: Página "Meu Perfil de Atuação" (`/perfil-atuacao`)

**Campos configuráveis**:
- **Abordagem teórica** (ex: "Neuropsicologia cognitivo-comportamental")
- **Tom de escrita** (ex: "Técnico, mas acessível ao leigo")
- **Regras de prudência clínica** (ex: "Nunca diagnosticar TEA sem encaminhamento médico")
- **Vocabulário recorrente** (ex: "Funcionamento executivo"; "Perfil cognitivo")

**Opções rápidas (presets)**: Cada campo tem sugestões clicáveis; o profissional pode combinar ou digitar livremente.

**Onde fica armazenado**: Tabela `PerfilDeAtuacao` (chave `profissionalId`)

---

### 2. Profissional Gera Rascunho de Laudo
**Local**: Página "Laudo Psicológico" (`/laudo`) → Botão "✦ Gerar rascunho com IA"

**O que acontece internamente**:

1. **Backend** (`/laudos/:id/gerar-rascunho`) lê:
   - `laudo.pacienteId` → dados do paciente
   - `PerfilDeAtuacao` do profissional
   - Todas as aplicações de teste desse paciente

2. **Função** `gerarRascunhoLaudo()` em `src/lib/gerarRascunhoLaudo.ts`:
   - Monta um **system prompt** que injeta o perfil:
     ```
     [System prompt padrão de laudo]
     ...
     - Abordagem teórica do profissional: {abordagemTeorica}
     - Tom de escrita preferido: {tomDeEscrita}
     - Regras de prudência: {regrasDePrudencia}
     - Vocabulário recorrente: {vocabularioRecorrente}
     ```
   - Monta um **user prompt** com dados clínicos
   - Chama Claude Opus 4.8 com output format JSON

3. **Claude gera análise + conclusão** que:
   - Respeitam a abordagem teórica do profissional
   - Usam o tom preferido
   - Incorporam as regras de prudência automaticamente
   - Empregam o vocabulário recorrente

4. **Resultado** salvo em `Laudo.analise` + `Laudo.conclusao`

---

### 3. Profissional Revisa e Aprova
**Local**: Mesma página de laudo

**Workflow**:
- ✓ Profissional marca `☑️ Revisei o rascunho de IA`
- ✓ Pode editar análise/conclusão inline se quiser
- ✓ Clica "Finalizar" ou "Baixar DOCX" (ambos bloqueados até revisar)

---

## Exemplos Práticos

### Cenário 1: Abordagem Psicanalítica
```
Perfil:
- Abordagem: "Psicanálise relacional com ênfase em defesas"
- Tom: "Caloroso e narrativo, valorizando o vínculo"
- Regra: "Sempre sugerir acompanhamento terapêutico paralelo"
- Vocabulário: "mecanismos de defesa", "funcionamento relacional"

Rascunho gerado (exemplo):
"A avaliação evidencia mecanismos de defesa ativos, 
particularmente negação em relação aos desafios atentivos. 
Recomenda-se acompanhamento terapêutico paralelo para elaboração 
desses aspectos relacionais."
```

### Cenário 2: Abordagem Técnica Neurocientífica
```
Perfil:
- Abordagem: "Neuropsicologia baseada em evidências"
- Tom: "Técnico e formal, com citações de literatura"
- Regra: "Sempre mencionar limitações de normas adaptadas"
- Vocabulário: "córtices pré-frontais", "redes neurais", "índices fatoriais"

Rascunho gerado (exemplo):
"Os índices fatoriais de Organização Perceptual (Índice OP: 85, 
percentil 16) sugerem comprometimento nas redes de processamento 
visuoespacial. Nota-se limitação nas normas utilizadas para essa 
faixa etária. Recomenda-se reavaliação em 12 meses."
```

---

## Responsabilidade Técnica

**Importante**: A IA é sempre **apoio**, nunca decisão final.

Conforme **Resolução CFP nº 09/2024** (TDICs):
- O profissional é **responsável** pelo laudo
- O rascunho é **revisado e aprovado** manualmente
- Qualquer alteração feita após IA é **responsabilidade do profissional**
- O sistema registra: "Análise gerada por IA, revisada por [profissional]"

---

## Arquitetura Técnica

### Frontend
- **PerfilAtuacao.tsx**: UI para configuração (campos + presets)
- **ComposicaoLaudo.tsx**: Botão de geração + checkbox de revisão

### Backend
- **gerarRascunhoLaudo.ts**: Monta prompts e chama Claude
- **laudos.routes.ts**: Rota POST `/laudos/:id/gerar-rascunho`
- **anthropic.ts**: SDK da Anthropic para chamar Claude

### Banco de Dados
- **PerfilDeAtuacao**: Armazena configurações do profissional
  - `profissionalId` (unique)
  - `abordagemTeorica`
  - `tomDeEscrita`
  - `regrasDePrudencia`
  - `vocabularioRecorrente`
  - `sistemaClassificacaoPercentil` (enum)
  - `respostas` (JSON das perguntas pessoais)

---

## Modelo de IA

**Versão**: Claude Opus 4.8 (modelo mais poderoso para análise técnica)

**Output**: JSON estruturado
```json
{
  "analise": "Texto longo da análise clínica",
  "conclusao": "Texto da conclusão com hipóteses diagnósticas"
}
```

**Effort**: `high` (reasoning complexo para análise integrada)

---

## Limitações Conhecidas & Roadmap

### Hoje
✅ Perfil customiza análise + conclusão
✅ Sugestões de presets para mais fácil uso
✅ Validação que profissional revisou

### Futuro
- [ ] A/B testing: Comparar 2 variações de análise (mesmos dados, perfis diferentes)
- [ ] Histórico de variações: Guardar rascunhos anteriores da IA para comparação
- [ ] Customização por domínio: Regras diferentes para TDAH vs. TEA vs. Depressão
- [ ] Feedback de qualidade: Profissional marca "Esta IA acertou" vs. "Precisa melhorar"

---

## Como Usar

1. **Configure seu perfil** (uma vez):
   - Vá para "Meu Perfil de Atuação"
   - Preencha abordagem + tom + regras + vocabulário
   - Salve

2. **Use ao gerar laudos**:
   - Crie/abra um laudo
   - Clique "✦ Gerar rascunho com IA"
   - Revise e edite conforme necessário
   - Marque "Revisei o rascunho de IA"
   - Finalize ou exporte

---

## Referências

- **Resolução CFP nº 09/2024**: Regulamentação de TDICs (Tecnologias Digitais de Informação e Comunicação)
- **Resolução CFP nº 06/2019**: Estrutura obrigatória do Laudo Psicológico
- **Cartilha CFP sobre IA (dez/2025)**: Responsabilidades ao usar IA

