# 📋 PLANO DE MIGRAÇÃO - MÓDULO PAYMENTS

## 🎯 **VISÃO GERAL**

Este documento detalha o plano completo de migração dos serviços de pagamento antigos para o novo módulo `payments` modularizado. A migração é **crítica** e deve ser executada com extremo cuidado para evitar interrupções no serviço.

**Data de Início:** 01 de setembro de 2025
**Status Atual:** ✅ Módulo `payments` criado e testado
**Responsável:** Equipe de Desenvolvimento

---

## 🔍 **CONTEXTO DA MIGRAÇÃO**

### **Problemas Identificados:**
1. **Duplicação de Código:** `CheckoutService` e `PaymentService` antigos têm funcionalidades sobrepostas
2. **Arquivo Não Utilizado:** `SpecializedCheckoutServices.ts` não é usado em lugar nenhum
3. **Falta de Modularidade:** Serviços antigos misturam responsabilidades (integração + negócio + orquestração)
4. **Manutenibilidade:** Código difícil de manter e testar

### **Solução Implementada:**
✅ Novo módulo `payments` criado com arquitetura modular:
- `AsaasService` - Integração com API Asaas
- `PaymentService` - Lógica de negócio
- `CheckoutService` - Orquestração por tipo de serviço
- `PaymentController` - Controladores REST
- `PaymentRoutes` - Definição de rotas

---

## 📊 **ANÁLISE DE IMPACTO**

### **Arquivos Afetados:**

#### **1. Serviços a Serem Migrados:**
- ❌ `src/services/CheckoutService.ts` (494 linhas)
- ❌ `src/services/PaymentService.ts` (182 linhas)
- ❌ `src/services/SpecializedCheckoutServices.ts` (182 linhas) - **NÃO UTILIZADO**

#### **2. Arquivos que Fazem Import:**
```typescript
// Webhook (usa PaymentService.updatePaymentStatus)
src/services/WebhookService.ts

// Agendamento (usa PaymentService.processarPagamentoAsaas)
src/agendamentos/services/AgendamentoService.ts

// Rotas (usa CheckoutService)
src/routes/checkout.ts
```

#### **3. Dependências Externas:**
- ✅ API Asaas (PIX)
- ✅ Supabase (banco de dados)
- ✅ Google Calendar
- ✅ Sistema de autenticação

---

## 🚀 **PLANO DE MIGRAÇÃO - FASES**

### **FASE 1: ✅ CONCLUÍDA - CRIAÇÃO DO NOVO MÓDULO**

**Status:** ✅ Finalizada em 01/09/2025

**Atividades Realizadas:**
- ✅ Criar estrutura modular `payments/`
- ✅ Implementar `AsaasService` (integração Asaas)
- ✅ Implementar `PaymentService` (lógica negócio)
- ✅ Implementar `CheckoutService` (orquestração)
- ✅ Criar `PaymentController` (controladores)
- ✅ Criar `PaymentRoutes` (rotas)
- ✅ Definir tipos em `payment.types.ts`
- ✅ Criar documentação `README.md`
- ✅ Testar build e compilação

**Resultado:** Módulo `payments` funcional e testado.

---

### **FASE 2: 🔄 EM ANDAMENTO - MIGRAÇÃO GRADUAL**

**Status:** Próxima fase a ser executada

#### **Etapa 2.1: Atualizar Imports (Baixo Risco)**
**Prioridade:** 🔴 Alta
**Risco:** 🟢 Baixo
**Tempo Estimado:** 2-3 horas

**Arquivos a Atualizar:**
```typescript
// 1. WebhookService.ts
- DE: import { PaymentService } from './PaymentService';
+ PARA: import { PaymentService } from '../payments/services/PaymentService';

// 2. AgendamentoService.ts
- DE: import { PaymentService } from '../../services/PaymentService';
+ PARA: import { PaymentService } from '../../payments/services/PaymentService';

// 3. checkout.ts (rotas)
- DE: import { CheckoutService } from '../services/CheckoutService';
+ PARA: import { CheckoutService } from '../payments/services/CheckoutService';
```

**Testes Necessários:**
- ✅ Webhook de pagamento Asaas
- ✅ Criação de agendamentos
- ✅ Processamento de checkout

#### **Etapa 2.2: Migrar Rotas para Novo Módulo (Médio Risco)**
**Prioridade:** 🟡 Média
**Risco:** 🟡 Médio
**Tempo Estimado:** 4-6 horas

**Atividades:**
- Atualizar `src/routes/index.ts` para incluir `PaymentRoutes`
- Migrar endpoints existentes para usar novo controlador
- Manter compatibilidade com rotas antigas (fallback)
- Testar todos os endpoints

**Rotas a Migrar:**
```typescript
// Rotas atuais em checkout.ts
POST /checkout/completo
POST /checkout/processar
GET  /checkout/status/:id

// Novas rotas no módulo payments
POST /api/v1/payments/checkout
GET  /api/v1/payments/payments
GET  /api/v1/payments/payments/:id
POST /api/v1/payments/payments/status
```

#### **Etapa 2.3: Atualizar app.ts (Alto Risco)**
**Prioridade:** 🔴 Alta
**Risco:** 🔴 Alto
**Tempo Estimado:** 2-3 horas

**Atividades:**
- Registrar novas rotas do módulo payments
- Manter rotas antigas para compatibilidade
- Testar todas as rotas existentes

---

### **FASE 3: 🧪 TESTES E VALIDAÇÃO**

**Status:** A ser executada após Fase 2

#### **Etapa 3.1: Testes Unitários**
**Prioridade:** 🟡 Média
**Risco:** 🟢 Baixo

**Atividades:**
- Criar testes para `AsaasService`
- Criar testes para `PaymentService`
- Criar testes para `CheckoutService`
- Criar testes para `PaymentController`

#### **Etapa 3.2: Testes de Integração**
**Prioridade:** 🔴 Alta
**Risco:** 🟡 Médio

**Cenários a Testar:**
- ✅ Checkout completo de agendamento
- ✅ Checkout completo de divórcio
- ✅ Processamento de pagamento PIX
- ✅ Webhook de confirmação de pagamento
- ✅ Consulta de pagamentos do usuário
- ✅ Atualização de status de pagamento

#### **Etapa 3.3: Testes de Regressão**
**Prioridade:** 🔴 Alta
**Risco:** 🔴 Alto

**Atividades:**
- Testar todas as funcionalidades existentes
- Verificar compatibilidade backward
- Validar performance
- Testar casos de erro

---

### **FASE 4: 🗑️ LIMPEZA E FINALIZAÇÃO**

**Status:** A ser executada após Fase 3

#### **Etapa 4.1: Remover Arquivos Antigos**
**Prioridade:** 🟢 Baixa
**Risco:** 🟡 Médio

**Arquivos a Remover:**
- ❌ `src/services/CheckoutService.ts` (após migração completa)
- ❌ `src/services/PaymentService.ts` (após migração completa)
- ❌ `src/services/SpecializedCheckoutServices.ts` (já identificado como não usado)

#### **Etapa 4.2: Atualizar Documentação**
**Prioridade:** 🟢 Baixa
**Risco:** 🟢 Baixo

**Atividades:**
- Atualizar README principal do projeto
- Documentar novos endpoints da API
- Criar guias de migração para desenvolvedores

#### **Etapa 4.3: Deploy e Monitoramento**
**Prioridade:** 🔴 Alta
**Risco:** 🔴 Alto

**Atividades:**
- Deploy gradual (feature flags)
- Monitoramento de erros e performance
- Rollback plan preparado
- Comunicação com stakeholders

---

## ⚠️ **PLANOS DE CONTINGÊNCIA**

### **Cenário 1: Erro Durante Migração**
**Ação:** Reverter imediatamente para versão anterior
**Tempo:** 15-30 minutos
**Responsável:** DevOps/SRE

### **Cenário 2: Problemas de Performance**
**Ação:** Implementar cache e otimização
**Tempo:** 2-4 horas
**Responsável:** Equipe de Desenvolvimento

### **Cenário 3: Incompatibilidade de API**
**Ação:** Manter rotas antigas como fallback
**Tempo:** 1-2 horas
**Responsável:** Equipe de Desenvolvimento

---

## 📈 **MÉTRICAS DE SUCESSO**

### **Funcionais:**
- ✅ Todos os checkouts processados corretamente
- ✅ Webhooks funcionando
- ✅ Consultas de pagamento retornando dados corretos
- ✅ Zero quebras de funcionalidades existentes

### **Técnicas:**
- ✅ Cobertura de testes > 80%
- ✅ Tempo de resposta < 2s para operações críticas
- ✅ Zero memory leaks
- ✅ Logs adequados para debugging

### **Business:**
- ✅ Zero impacto negativo no usuário
- ✅ Manutenibilidade do código melhorada
- ✅ Tempo de desenvolvimento reduzido para novas features

---

## 👥 **RESPONSABILIDADES**

### **Equipe de Desenvolvimento:**
- Implementação da migração
- Testes unitários e de integração
- Documentação técnica

### **DevOps/SRE:**
- Deploy e monitoramento
- Rollback procedures
- Alertas e métricas

### **QA:**
- Testes funcionais
- Testes de regressão
- Validação de cenários edge

### **Product Owner:**
- Validação de requisitos
- Aprovação de mudanças
- Comunicação com stakeholders

---

## 📅 **CRONOGRAMA DETALHADO**

| Fase | Etapa | Data Prevista | Status | Responsável |
|------|-------|---------------|--------|-------------|
| 1 | Criação Módulo | 01/09/2025 | ✅ Concluída | Dev Team |
| 2.1 | Atualizar Imports | 02/09/2025 | 🔄 Pendente | Dev Team |
| 2.2 | Migrar Rotas | 03/09/2025 | 🔄 Pendente | Dev Team |
| 2.3 | Atualizar app.ts | 04/09/2025 | 🔄 Pendente | Dev Team |
| 3.1 | Testes Unitários | 05/09/2025 | 🔄 Pendente | Dev Team |
| 3.2 | Testes Integração | 06/09/2025 | 🔄 Pendente | QA Team |
| 3.3 | Testes Regressão | 07/09/2025 | 🔄 Pendente | QA Team |
| 4.1 | Limpeza Código | 08/09/2025 | 🔄 Pendente | Dev Team |
| 4.2 | Documentação | 09/09/2025 | 🔄 Pendente | Dev Team |
| 4.3 | Deploy Produção | 10/09/2025 | 🔄 Pendente | DevOps |

---

## 🔍 **CHECKLIST DE VALIDAÇÃO**

### **Pré-Migração:**
- [ ] Backup completo do banco de dados
- [ ] Backup dos arquivos de configuração
- [ ] Ambiente de staging configurado
- [ ] Plano de rollback documentado
- [ ] Equipe de plantão definida

### **Durante Migração:**
- [ ] Testes automatizados passando
- [ ] Logs de erro monitorados
- [ ] Performance dentro dos parâmetros
- [ ] Comunicação com stakeholders

### **Pós-Migração:**
- [ ] Funcionalidades críticas testadas
- [ ] Métricas de negócio monitoradas
- [ ] Feedback dos usuários coletado
- [ ] Documentação atualizada

---

## 📞 **CONTATOS DE EMERGÊNCIA**

| Papel | Nome | Contato | Disponibilidade |
|-------|------|---------|----------------|
| Tech Lead | [Nome] | [Email/Phone] | 24/7 |
| DevOps | [Nome] | [Email/Phone] | 24/7 |
| Product Owner | [Nome] | [Email/Phone] | 08h-18h |

---

## 📝 **REGISTRO DE MUDANÇAS**

| Data | Autor | Mudança | Status |
|------|-------|---------|--------|
| 01/09/2025 | Sistema | Criação do plano de migração | ✅ Aprovado |
| 01/09/2025 | Dev Team | Módulo payments criado | ✅ Concluído |

---

**📋 Documento Vivo:** Este plano será atualizado conforme o progresso da migração.

**⚠️ Importante:** Qualquer mudança no plano deve ser documentada e aprovada pela equipe completa.
