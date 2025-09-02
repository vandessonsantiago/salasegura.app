# 🚨 PLANO DE ROLLBACK - MIGRAÇÃO PAYMENTS

## 🎯 **VISÃO GERAL**

Este documento define o plano de rollback para a migração do módulo payments. Em caso de problemas críticos durante a migração, este plano garante que o sistema possa ser restaurado rapidamente para o estado anterior funcional.

**Data de Criação:** 01 de setembro de 2025
**Versão:** 1.0
**Responsável:** DevOps/SRE Team

---

## ⚠️ **CRITÉRIOS PARA ROLLBACK**

### **Cenários que Acionam Rollback Imediato:**
- ❌ **Quebra crítica de pagamentos** (>50% de falhas)
- ❌ **Downtime do sistema** (>5 minutos)
- ❌ **Perda de dados** (qualquer perda)
- ❌ **Erro de segurança** (exposição de dados)
- ❌ **Performance crítica** (>10x degradação)

### **Cenários que Podem Ser Monitorados:**
- ⚠️ **Degradação de performance** (2-5x mais lento)
- ⚠️ **Aumento de erros** (10-30% de falhas)
- ⚠️ **Incompatibilidade parcial** (algumas funcionalidades)

---

## 🔄 **ESTRATÉGIAS DE ROLLBACK**

### **Estratégia 1: Rollback de Código (Preferida)**
**Tempo Estimado:** 15-30 minutos
**Risco:** 🟢 Baixo
**Disponibilidade:** 99.9%

#### **Passos:**
1. **Git Reset:** Reverter para commit anterior
   ```bash
   git reset --hard HEAD~1
   git push --force-with-lease
   ```

2. **Deploy Automático:** CI/CD faz deploy da versão anterior
3. **Verificação:** Testar endpoints críticos
4. **Comunicação:** Notificar stakeholders

### **Estratégia 2: Feature Flags (Backup)**
**Tempo Estimado:** 5-10 minutos
**Risco:** 🟢 Baixo
**Disponibilidade:** 99.5%

#### **Implementação:**
```typescript
// Em app.ts
const USE_NEW_PAYMENTS = process.env.USE_NEW_PAYMENTS === 'true';

// Rotas condicionais
if (USE_NEW_PAYMENTS) {
  app.use('/api/v1/payments', PaymentRoutes);
} else {
  app.use('/checkout', oldCheckoutRoutes);
}
```

#### **Passos de Rollback:**
1. **Desabilitar Flag:** `USE_NEW_PAYMENTS=false`
2. **Restart Aplicação:** PM2 ou Docker
3. **Verificar Funcionamento**
4. **Monitorar por 24h**

---

## 📋 **CHECKLIST DE ROLLBACK**

### **Pré-Rollback:**
- [ ] **Backup Confirmado:** Banco de dados e arquivos
- [ ] **Versão Anterior:** Commit identificado
- [ ] **Comunicação:** Stakeholders notificados
- [ ] **Equipe:** Plantão SRE ativado

### **Durante Rollback:**
- [ ] **Git Reset:** Executado com sucesso
- [ ] **Deploy:** Aplicação reiniciada
- [ ] **Testes:** Endpoints críticos verificados
- [ ] **Monitoramento:** Métricas normalizadas

### **Pós-Rollback:**
- [ ] **Validação:** Sistema funcionando normalmente
- [ ] **Análise:** Causa raiz identificada
- [ ] **Plano:** Correção preparada
- [ ] **Comunicação:** Status atualizado

---

## 🛠️ **FERRAMENTAS E SCRIPTS**

### **Scripts de Rollback Automatizado:**

#### **rollback.sh**
```bash
#!/bin/bash

echo "🚨 INICIANDO ROLLBACK DE EMERGÊNCIA"

# 1. Confirmar rollback
read -p "Confirmar rollback? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Rollback cancelado"
    exit 1
fi

# 2. Git reset
echo "🔄 Fazendo git reset..."
git reset --hard HEAD~1

# 3. Push forçado
echo "📤 Fazendo push forçado..."
git push --force-with-lease

# 4. Deploy
echo "🚀 Fazendo deploy..."
npm run deploy

# 5. Health check
echo "🔍 Verificando saúde..."
curl -f https://api.salasegura.app/health || echo "❌ Health check falhou"

echo "✅ ROLLBACK CONCLUÍDO"
```

#### **health-check.sh**
```bash
#!/bin/bash

echo "🔍 VERIFICANDO SAÚDE DO SISTEMA"

# Endpoints críticos
endpoints=(
    "https://api.salasegura.app/health"
    "https://api.salasegura.app/checkout/status/123"
    "https://api.salasegura.app/agendamentos"
)

for endpoint in "${endpoints[@]}"; do
    if curl -f -s "$endpoint" > /dev/null; then
        echo "✅ $endpoint - OK"
    else
        echo "❌ $endpoint - FALHA"
        exit 1
    fi
done

echo "🎉 TODOS OS ENDPOINTS FUNCIONANDO"
```

---

## 📊 **MÉTRICAS DE MONITORAMENTO**

### **Durante Rollback:**
- **Disponibilidade:** > 99%
- **Tempo de Resposta:** < 2s
- **Taxa de Erro:** < 1%
- **Tempo Total:** < 30 minutos

### **Pós-Rollback:**
- **Monitoramento 24h:** Métricas normais
- **Testes Regressão:** 100% passando
- **Performance:** Baseline recuperada

---

## 👥 **ROLES E RESPONSABILIDADES**

| Role | Responsabilidade | Contato |
|------|------------------|---------|
| **Tech Lead** | Decisão de rollback | @tech-lead |
| **DevOps/SRE** | Execução técnica | @devops |
| **QA** | Validação pós-rollback | @qa-lead |
| **Product Owner** | Comunicação | @po |

---

## 📞 **COMUNICAÇÃO DE EMERGÊNCIA**

### **Canal Principal:** #incidentes (Slack)

### **Template de Comunicação:**
```
🚨 ROLLBACK EXECUTADO

Status: ✅/❌
Motivo: [Breve descrição]
Impacto: [Usuários afetados]
Tempo: [Duração do downtime]
Próximos Passos: [Plano de correção]
```

### **Stakeholders a Notificar:**
- [ ] Equipe de Desenvolvimento
- [ ] Product Owner
- [ ] Clientes (se necessário)
- [ ] Equipe de Suporte

---

## 📈 **LIÇÕES APRENDIDAS**

### **Pós-Mortem Template:**
1. **O que aconteceu?**
2. **Por que aconteceu?**
3. **Como foi detectado?**
4. **Como foi resolvido?**
5. **Como prevenir no futuro?**

### **Métricas de Melhoria:**
- Tempo médio de rollback
- Taxa de sucesso de rollback
- Tempo de detecção de problemas
- Efetividade do plano de contingência

---

## 🔄 **TESTES DE ROLLBACK**

### **Cenários a Testar:**
- [ ] Rollback completo de código
- [ ] Rollback via feature flags
- [ ] Rollback parcial (apenas payments)
- [ ] Rollback em produção

### **Frequência:**
- **Desenvolvimento:** Semanal
- **Staging:** Antes de cada deploy
- **Produção:** Após mudanças críticas

---

## 📋 **VALIDAÇÃO FINAL**

### **Critérios de Sucesso do Rollback:**
- [ ] Sistema restaurado em < 30 minutos
- [ ] Zero perda de dados
- [ ] Funcionalidades críticas funcionando
- [ ] Stakeholders informados
- [ ] Análise de causa raiz iniciada

---

**📅 Última Revisão:** 01 de setembro de 2025
**📋 Revisão Próxima:** Após primeiro rollback ou mensalmente
