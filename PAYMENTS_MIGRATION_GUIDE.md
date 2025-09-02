# 🔧 GUIA TÉCNICO - MIGRAÇÃO PAYMENTS

## 🎯 **PARA DESENVOLVEDORES**

Este guia técnico detalha como migrar o código existente para usar o novo módulo `payments`. Siga estes passos para uma migração segura e gradual.

**Data:** 01 de setembro de 2025
**Versão:** 1.0
**Público:** Desenvolvedores

---

## 📋 **PRÉ-REQUISITOS**

### **Conhecimento Necessário:**
- ✅ TypeScript avançado
- ✅ Express.js e middlewares
- ✅ Padrões de arquitetura modular
- ✅ Integração com APIs externas

### **Ambiente Preparado:**
- ✅ Node.js 18+
- ✅ TypeScript 5+
- ✅ Build funcionando
- ✅ Testes básicos passando

---

## 🚀 **MIGRAÇÃO PASSO A PASSO**

### **Passo 1: Atualizar Imports**

#### **Arquivo: `src/services/WebhookService.ts`**
```typescript
// ❌ ANTES
import { PaymentService } from './PaymentService';

// ✅ DEPOIS
import { PaymentService } from '../payments/services/PaymentService';
```

#### **Arquivo: `src/agendamentos/services/AgendamentoService.ts`**
```typescript
// ❌ ANTES
import { PaymentService } from '../../services/PaymentService';

// ✅ DEPOIS
import { PaymentService } from '../../payments/services/PaymentService';
```

#### **Arquivo: `src/routes/checkout.ts`**
```typescript
// ❌ ANTES
import { CheckoutService } from '../services/CheckoutService';

// ✅ DEPOIS
import { CheckoutService } from '../payments/services/CheckoutService';
```

### **Passo 2: Verificar Compatibilidade de Interfaces**

#### **ClienteData - Verificar Campos:**
```typescript
// Novo módulo (payment.types.ts)
export interface ClienteData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string; // Campo opcional
}

// Antigo módulo - deve ser compatível
export interface ClienteData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string; // ✅ Compatível
}
```

#### **CheckoutData - Verificar Campos:**
```typescript
// Novo módulo
export interface CheckoutData {
  cliente: ClienteData;
  valor: number;
  descricao: string;
  serviceType: string;
  serviceData?: any;
  data?: string;
  horario?: string;
  userId?: string;
  calendarEventId?: string;
  googleMeetLink?: string;
}
```

### **Passo 3: Atualizar Chamadas de Métodos**

#### **PaymentService.processarPagamentoAsaas()**
```typescript
// ❌ ANTES (antigo)
const result = await PaymentService.processarPagamentoAsaas(
  cliente,
  valor,
  descricao,
  dueDate
);

// ✅ DEPOIS (novo)
const result = await PaymentService.processarPagamentoAsaas(
  cliente,
  valor,
  descricao,
  dueDate
);
// ✅ Interface mantida igual
```

#### **CheckoutService.processarCheckoutCompleto()**
```typescript
// ❌ ANTES (antigo)
const result = await CheckoutService.processarCheckoutCompleto(
  req,
  checkoutData
);

// ✅ DEPOIS (novo)
const result = await CheckoutService.processarCheckoutCompleto(
  req,
  checkoutData
);
// ✅ Interface mantida igual
```

---

## 🧪 **TESTES DURANTE MIGRAÇÃO**

### **Teste 1: Compilação**
```bash
# Verificar se não há erros TypeScript
npm run build

# Verificar tipos específicos
npx tsc --noEmit --skipLibCheck
```

### **Teste 2: Funcionalidades Críticas**
```typescript
// Testar processamento de pagamento
const paymentResult = await PaymentService.processarPagamentoAsaas(
  clienteTest,
  150.00,
  "Teste Pagamento"
);
expect(paymentResult.success).toBe(true);

// Testar checkout completo
const checkoutResult = await CheckoutService.processarCheckoutCompleto(
  req,
  checkoutData
);
expect(checkoutResult.success).toBe(true);
```

### **Teste 3: Webhook Asaas**
```typescript
// Simular webhook
const webhookResult = await PaymentService.updatePaymentStatus(
  "pay_123",
  "RECEIVED"
);
expect(webhookResult).toBe(true);
```

---

## 🔧 **RESOLUÇÃO DE PROBLEMAS**

### **Erro: "Cannot find module"**
```typescript
// ❌ Problema
import { PaymentService } from './PaymentService';

// ✅ Solução
import { PaymentService } from '../payments/services/PaymentService';
```

### **Erro: "Property does not exist"**
```typescript
// ❌ Problema
await PaymentService.metodoQueNaoExiste();

// ✅ Solução - Verificar documentação
// Métodos disponíveis:
// - processarPagamentoAsaas()
// - updatePaymentStatus()
// - getPaymentById()
// - getPaymentsByUser()
```

### **Erro: "Type mismatch"**
```typescript
// ❌ Problema
const cliente = {
  name: "João",
  email: "joao@email.com",
  cpfCnpj: "12345678900",
  phone: null // ❌ null não é aceito
};

// ✅ Solução
const cliente = {
  name: "João",
  email: "joao@email.com",
  cpfCnpj: "12345678900",
  phone: undefined // ✅ undefined é aceito
};
```

---

## 📊 **MONITORAMENTO PÓS-MIGRAÇÃO**

### **Métricas a Acompanhar:**
```typescript
// Tempo de resposta das APIs
const startTime = Date.now();
// ... chamada da API
const responseTime = Date.now() - startTime;
expect(responseTime).toBeLessThan(2000); // < 2s

// Taxa de sucesso
const successRate = (successfulCalls / totalCalls) * 100;
expect(successRate).toBeGreaterThan(95); // > 95%
```

### **Logs a Verificar:**
```typescript
// Logs do AsaasService
console.log('[ASAAS] Cliente criado:', customerId);
console.log('[ASAAS] Pagamento processado:', paymentId);

// Logs do PaymentService
console.log('[PAYMENT] Pagamento salvo:', paymentId);
console.log('[PAYMENT] Status atualizado:', paymentId);

// Logs do CheckoutService
console.log('[CHECKOUT] Checkout iniciado');
console.log('[CHECKOUT] Operações concluídas');
```

---

## 🔄 **ROLLBACK EM CASO DE PROBLEMAS**

### **Rollback Rápido:**
```bash
# 1. Reverter imports
git checkout HEAD~1 -- src/services/WebhookService.ts
git checkout HEAD~1 -- src/agendamentos/services/AgendamentoService.ts
git checkout HEAD~1 -- src/routes/checkout.ts

# 2. Commit e push
git commit -m "Rollback: Reverter imports payments"
git push
```

### **Rollback Completo:**
```bash
# Usar script de rollback
./scripts/rollback-payments.sh
```

---

## 📚 **RECURSOS ADICIONAIS**

### **Documentação:**
- [README Módulo Payments](../payments/README.md)
- [Plano de Migração](PAYMENTS_MIGRATION_PLAN.md)
- [Checklist de Migração](PAYMENTS_MIGRATION_CHECKLIST.md)

### **Códigos de Exemplo:**
```typescript
// Exemplo completo de uso
import { CheckoutService, CheckoutData } from '../payments';

const checkoutData: CheckoutData = {
  cliente: {
    name: "João Silva",
    email: "joao@email.com",
    cpfCnpj: "12345678900",
    phone: "11999999999"
  },
  valor: 150.00,
  descricao: "Consulta Jurídica",
  serviceType: "agendamento",
  userId: "user123"
};

const result = await CheckoutService.processarCheckoutCompleto(req, checkoutData);
```

---

## ❓ **PERGUNTAS FREQUENTES**

### **P: Posso usar os dois módulos simultaneamente?**
**R:** Sim, durante a migração. Os módulos antigos serão mantidos até a migração completa.

### **P: E se eu encontrar um erro não documentado?**
**R:** Pare imediatamente, documente o erro, e entre em contato com o Tech Lead.

### **P: Como testar apenas uma parte do sistema?**
**R:** Use feature flags ou faça deploy em staging primeiro.

### **P: Qual é o prazo para migração completa?**
**R:** 4 semanas, com possibilidade de extensão se necessário.

---

## 📞 **SUPORTE**

| Tipo de Problema | Contato | SLA |
|------------------|---------|-----|
| **Erro crítico** | Tech Lead | < 15 min |
| **Dúvida técnica** | Dev Team | < 2h |
| **Problema funcional** | QA Team | < 4h |
| **Questão de negócio** | Product Owner | < 24h |

---

**📅 Última Atualização:** 01 de setembro de 2025
**👤 Autor:** Equipe de Desenvolvimento
**📋 Status:** ✅ Aprovado para uso
