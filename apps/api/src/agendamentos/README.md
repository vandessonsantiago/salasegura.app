# 📅 Módulo Agendamentos

## 📋 Visão Geral

O módulo de agendamentos gerencia todo o ciclo de vida dos agendamentos de consulta, desde a criação até a confirmação, incluindo integração com pagamentos e calendário.

## 🏗️ Arquitetura

```
agendamentos/
├── controllers/
│   └── AgendamentoController.ts    # Controladores da API
├── services/
│   └── AgendamentoService.ts       # Lógica de negócio
├── types/
│   └── agendamentos.types.ts       # Tipos TypeScript
├── routes/
│   └── AgendamentoRoutes.ts        # Definições de rotas
├── index.ts                        # Exportações do módulo
└── README.md                       # Esta documentação
```

## 🔧 Funcionalidades

### ✅ Implementadas

- **CRUD Completo**: Criar, ler, atualizar e deletar agendamentos
- **Autenticação**: Controle de acesso por usuário
- **Paginação**: Suporte a paginação e filtros
- **Integração de Pagamento**: Processamento via Asaas
- **Calendário Google**: Criação automática de eventos
- **Status Management**: Controle de estados do agendamento
- **Validações**: Validações de dados e regras de negócio

### 📊 Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/agendamentos` | Listar agendamentos do usuário |
| POST | `/api/agendamentos` | Criar novo agendamento |
| GET | `/api/agendamentos/:id` | Buscar agendamento específico |
| PUT | `/api/agendamentos/:id` | Atualizar agendamento |
| DELETE | `/api/agendamentos/:id` | Deletar agendamento |
| GET | `/api/agendamentos/user/meu-agendamento` | Agendamento ativo do usuário |
| POST | `/api/agendamentos/:id/processar-pagamento` | Processar pagamento |
| POST | `/api/agendamentos/:id/confirmar` | Confirmar agendamento |
| POST | `/api/agendamentos/:id/cancelar` | Cancelar agendamento |

### 🎯 Estados do Agendamento

- `pending`: Agendamento criado, aguardando pagamento
- `confirmed`: Pagamento confirmado, evento criado no calendário
- `completed`: Consulta realizada
- `cancelled`: Agendamento cancelado

### 💰 Estados do Pagamento

- `pending`: Aguardando processamento
- `paid`: Pagamento aprovado
- `failed`: Pagamento rejeitado
- `refunded`: Pagamento reembolsado

## 🔗 Integrações

### 💳 Sistema de Pagamentos (Asaas)
- Geração de QR Code PIX
- Processamento automático
- Webhooks para confirmação

### 📅 Google Calendar
- Criação automática de eventos
- Google Meet integrado
- Sincronização de status

### 🔒 Row Level Security (RLS)
- Isolamento de dados por usuário
- Políticas de segurança no banco

## 📊 Filtros e Busca

### Parâmetros de Query

- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10, máximo: 50)
- `status`: Filtrar por status do agendamento
- `payment_status`: Filtrar por status do pagamento
- `service_type`: Filtrar por tipo de serviço
- `date_from`: Data inicial (YYYY-MM-DD)
- `date_to`: Data final (YYYY-MM-DD)

### Exemplo de Uso

```typescript
GET /api/agendamentos?page=1&limit=10&status=confirmed&date_from=2024-01-01
```

## 🛡️ Validações

### Criação de Agendamento
- Data e horário obrigatórios
- Valor deve ser maior que zero
- Descrição obrigatória
- Usuário não pode ter agendamento ativo

### Atualização
- Apenas o dono pode alterar
- Status deve ser válido
- Campos opcionais podem ser atualizados

## 📈 Estatísticas

O módulo fornece estatísticas automáticas:

```typescript
{
  total: 15,
  pending: 3,
  confirmed: 8,
  completed: 4,
  cancelled: 0,
  totalRevenue: 2500.00
}
```

## 🔄 Compatibilidade

### Métodos Legados
Para manter compatibilidade com código existente:

```typescript
// Método antigo ainda funciona
AgendamentoService.criarAgendamento(userId, data, horario, valor, descricao)

// Novo método recomendado
AgendamentoService.createAgendamento(userId, agendamentoData)
```

## 🚀 Próximos Passos

- [ ] Implementar notificações por email
- [ ] Adicionar lembretes automáticos
- [ ] Dashboard administrativo
- [ ] Relatórios avançados
- [ ] Integração com outros calendários

## 📝 Notas de Desenvolvimento

- Todas as operações são assíncronas
- Erros são tratados e retornados de forma consistente
- Logs detalhados para debugging
- TypeScript com tipagem completa
- Testes unitários recomendados
