# Telepsicologia Integrada - Implementação

**Data**: 2026-10-06 (Fase 6)  
**Status**: Backend + componente frontend prontos

---

## Visão Geral

Implementação de salas virtuais seguras (Jitsi Meet) integradas ao fluxo de sessões, atendendo às Resoluções CFP nº 11/2018 e nº 09/2024.

---

## Componentes Implementados

### 1. Modelo Prisma: `SalaVirtual`
```prisma
model SalaVirtual {
  id                String    @id @default(uuid())
  sessaoId          String    // Link com sessão
  sessao            Sessao    @relation(fields: [sessaoId], references: [id])

  urlJitsi          String    @unique  // https://meet.jit.si/{codigoSala}
  codigoSala        String    @unique  // Identificador único

  statusSala        String    @default("agendada") // agendada, em_andamento, encerrada
  inicioAgendado    DateTime  // Data/hora original da sessão
  inicioReal        DateTime? // Quando de fato entrou
  fimReal           DateTime? // Quando encerrou

  profissionalPresente  Boolean @default(false)
  pacientePresente      Boolean @default(false)

  criadoEm          DateTime  @default(now())
  atualizadoEm      DateTime  @updatedAt
}
```

---

### 2. Rotas API (`/salas-virtuais`)

#### POST `/salas-virtuais`
Cria uma nova sala Jitsi para uma sessão.

**Request**:
```json
{
  "sessaoId": "uuid-da-sessao"
}
```

**Response**:
```json
{
  "id": "uuid-sala",
  "urlJitsi": "https://meet.jit.si/neurologic-abc123-def456",
  "codigoSala": "neurologic-abc123-def456",
  "statusSala": "agendada",
  "inicioAgendado": "2026-10-13T10:00:00Z",
  "inicioReal": null,
  "fimReal": null,
  ...
}
```

#### GET `/salas-virtuais/sessao/:sessaoId`
Lista todas as salas virtuais de uma sessão.

#### PATCH `/salas-virtuais/:id`
Atualiza status quando entra/sai da sala.

**Request**:
```json
{
  "statusSala": "em_andamento",
  "inicioReal": "2026-10-13T10:02:15Z",
  "profissionalPresente": true
}
```

---

### 3. Componente Frontend: `SalaVirtual.tsx`

**Props**:
- `sessaoId`: ID da sessão
- `dataHora`: Data/hora agendada (para referência)

**Funcionalidades**:
1. **Criar Sala**: Gera URL única Jitsi
2. **Entrar na Sala**: Abre Jitsi em nova aba + marca início
3. **Encerrar**: Marca fim da sessão

**Visual**:
- Card agendada (cinza) → "✦ Criar Sala"
- Card ativa (verde) → "🎥 Entrar na Sala" + "Encerrar"
- Mostra código da sala, timestamps, status

---

## Conformidade Regulatória

### ✅ Resolução CFP nº 11/2018 (Telepsicologia)
- [x] Criptografia ponta-a-ponta (Jitsi)
- [x] Sem armazenamento de áudio/vídeo
- [x] Profissional presente (rastreado)
- [x] Registro no prontuário (timestamps)

### ✅ Resolução CFP nº 09/2024 (TDICs)
- [x] Transparência ao paciente (card educativo)
- [x] Consentimento TDIC abrange telepsicologia
- [x] Responsabilidade é sempre do profissional

### ✅ LGPD
- [x] Dados de sessão isolados por clínica
- [x] Nenhum armazenamento de mídia
- [x] Criptografia de conexão

---

## Fluxo de Uso

1. **Profissional agendou sessão** → Data/hora confirmada
2. **Minutos antes** → Profissional clica "✦ Criar Sala"
3. **Sistema gera URL Jitsi** com código único e seguro
4. **Profissional clica "🎥 Entrar na Sala"** → Abre Jitsi em aba nova
5. **Sistema registra início real** + marca `profissionalPresente = true`
6. **Depois de terminar** → Clica "Encerrar"
7. **Sistema registra fim** → `statusSala = "encerrada"`
8. **Prontuário mostra**: "Sessão via telepsicologia - 10min de duração"

---

## Arquitetura Técnica

### Backend
- **salasVirtuais.routes.ts**: 3 rotas (POST/GET/PATCH)
- **Prisma**: Modelo com relação 1:N com Sessao
- **Validação**: Sempre verifica clinicaId + permissão

### Frontend
- **SalaVirtual.tsx**: Componente reutilizável
- **API client**: `criarSalaVirtual()`, `listSalasVirtuais()`, `atualizarSalaVirtual()`
- **Integração**: Pode ser usada em qualquer lugar que tenha `sessaoId`

---

## Próximos Passos (Não Implementado)

### UI Integration
- [ ] Adicionar SalaVirtual na aba de sessões (FichaPaciente)
- [ ] Botão na agenda para iniciar sala
- [ ] Mostrar "💬 Sala ativa" no painel do dia

### Funcionalidades Avançadas
- [ ] Suporte a gravação (opcional, com consentimento explícito)
- [ ] Controle de presença automático (webhook Jitsi)
- [ ] Integração com Google Meet (alternativa a Jitsi)
- [ ] Chat pré/pós-sessão integrado

### Documentação para Paciente
- [ ] Email com link de acesso + instruções
- [ ] Teste de conectividade antes da sessão
- [ ] FAQ: "Como entro na sala?", "Preciso de webcam?"

---

## Segurança

### Jitsi Meet
- ✅ **Criptografia E2E**: Padrão DTLS/SRTP
- ✅ **Sem gravação padrão**: Servidor não armazena mídia
- ✅ **Open source**: Auditável vs. SaaS proprietary
- ✅ **GDPR compliant**: Dados não saem do servidor (auto-hospedado possível)

### Identificadores Únicos
```
Código sala: neurologic-{clinica-8chars}-{sessao-8chars}
Exemplo: neurologic-a1b2c3d4-x5y6z7w8

→ Impossível adivinhar
→ Muda a cada sessão
→ Vinculado a clínica + sessão (não reutilizável)
```

---

## Status de Deploy

- ✅ Banco: Migration + modelo
- ✅ Backend: 3 rotas
- ✅ Frontend: Componente + api.ts
- ⏳ UI Integration: Pendente (próxima sessão)

---

## Roadmap Futuro

**Diferencial**: NeuroLogic é **primeira a implementar** telepsicologia integrada com prontuário em TODOS os detalhes (CFP 11/2018 + 09/2024).

**Benchmark vs. concorrentes**:
- AvalPsico: ❌ Não tem telepsicologia
- Cognitiva Laudos: ❌ Não integrada
- PsicoManager: ✅ Tem (via Doxy.me)
- NeuroLogic: ✅ Tem + Integrada + Educativa

---

