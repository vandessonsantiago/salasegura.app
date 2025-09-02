# MÓDULO PAYMENTS

## 📋 Visão Geral

O módulo `payments` é responsável por gerenciar todas as operações relacionadas a pagamentos e checkouts no sistema. Foi criado para substituir os serviços antigos (`CheckoutService`, `PaymentService`, `SpecializedCheckoutServices`) com uma arquitetura mais organizada e modular.

## 🏗️ Estrutura

```
payments/
├── services/
│   ├── AsaasService.ts      # Integração com Asaas (PIX)
│   ├── PaymentService.ts     # Lógica de negócio de pagamentos
│   └── CheckoutService.ts    # Orquestração de checkouts
├── controllers/
│   └── PaymentController.ts  # Controladores REST
├── routes/
│   └── PaymentRoutes.ts      # Definição das rotas
├── types/
│   └── payment.types.ts      # Tipos e interfaces
└── index.ts                  # Ponto de entrada
```

## 🔧 Serviços

### AsaasService
- **Responsabilidade**: Integração direta com a API do Asaas
- **Funcionalidades**:
  - Criação de clientes
  - Processamento de pagamentos PIX
  - Busca de QR Codes
  - Atualização de status

### PaymentService
- **Responsabilidade**: Lógica de negócio de pagamentos
- **Funcionalidades**:
  - Processamento completo de pagamentos
  - Salvamento no banco de dados
  - Consulta de pagamentos
  - Atualização de status

### CheckoutService
- **Responsabilidade**: Orquestração de checkouts por tipo de serviço
- **Funcionalidades**:
  - Checkout de agendamentos
  - Checkout de divórcios
  - Checkout de checklists
  - Operações pós-checkout (calendário, etc.)

## 🚀 API Endpoints

### POST /api/v1/payments/checkout
Processa checkout completo baseado no `serviceType`.

**Body:**
```json
{
  "customer": {
    "name": "João Silva",
    "email": "joao@email.com",
    "cpfCnpj": "12345678900",
    "phone": "11999999999"
  },
  "value": 150.00,
  "description": "Consulta Jurídica",
  "serviceType": "agendamento",
  "serviceData": {},
  "data": "2025-01-15",
  "horario": "14:00",
  "calendarEventId": "event123",
  "googleMeetLink": "https://meet.google.com/abc-defg-hij"
}
```

### GET /api/v1/payments/payments
Lista todos os pagamentos do usuário autenticado.

### GET /api/v1/payments/payments/:paymentId
Busca informações de um pagamento específico.

### POST /api/v1/payments/payments/status
Atualiza status de um pagamento (usado por webhooks).

## 🔄 Migração dos Serviços Antigos

### Serviços Substituídos:
- ❌ `CheckoutService.ts` (services/)
- ❌ `PaymentService.ts` (services/)
- ❌ `SpecializedCheckoutServices.ts` (services/)

### Arquivos Mantidos Temporariamente:
- ✅ `CheckoutService.ts` (services/) - Mantido para compatibilidade
- ✅ `PaymentService.ts` (services/) - Mantido para compatibilidade

## 📝 Próximos Passos

1. **Atualizar Imports**: Migrar gradualmente os imports nos arquivos que usam os serviços antigos
2. **Testes**: Criar testes unitários para o novo módulo
3. **Documentação**: Atualizar documentação da API
4. **Remoção**: Após migração completa, remover os arquivos antigos

## ⚠️ Considerações de Segurança

- Todas as rotas requerem autenticação (`authenticateToken`)
- Validação rigorosa de dados de entrada
- Logs detalhados para auditoria
- Tratamento adequado de erros sem exposição de dados sensíveis

## 🔗 Dependências

- `AsaasService` - Integração com API Asaas
- `AgendamentoService` - Para checkouts de agendamento
- `DivorceService` - Para checkouts de divórcio
- `supabase` - Persistência de dados
- `google-calendar` - Operações de calendário
