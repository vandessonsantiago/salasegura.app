# Integração com CRM - Documentação

## 🎯 **HubSpot CRM (Recomendação Principal)**

### **Por que HubSpot?**

✅ **Gratuito** para até 2.000 contatos  
✅ **Automação nativa** de emails e sequências  
✅ **Integração fácil** com APIs  
✅ **Funnel de conversão** específico para serviços jurídicos  
✅ **Templates prontos** para advocacia  
✅ **Relatórios detalhados** de conversão  

### **Configuração**

1. **Criar conta no HubSpot:**
   - Acesse [hubspot.com](https://hubspot.com)
   - Crie uma conta gratuita
   - Configure seu pipeline de vendas

2. **Obter API Key:**
   - Vá em Settings > Account Setup > Integrations > API Keys
   - Crie uma nova API Key
   - Copie a chave (formato: `pat-...`)

3. **Configurar variáveis de ambiente:**
   ```bash
   # apps/web/.env.local
   HUBSPOT_API_KEY=pat-your-hubspot-api-key-here
   ```

4. **Configurar propriedades personalizadas:**
   - Vá em Settings > Properties
   - Crie as seguintes propriedades:
     - `sala_segura_access` (Single-line text)
     - `lead_status` (Single-line text)
     - `source` (Single-line text)

### **Funcionalidades Implementadas**

#### **1. Criação Automática de Contatos**
- Nome e sobrenome separados automaticamente
- Email e WhatsApp validados
- Cidade e estado capturados
- Origem marcada como "chat_website"

#### **2. Metadados de Conversão**
- `lifecyclestage`: "lead"
- `lead_status`: "novo_lead"
- `source`: "chat_website"
- `sala_segura_access`: "pendente"

#### **3. Notas Automáticas**
- Nota criada automaticamente com origem do lead
- Informações sobre interesse em divórcio
- Localização do prospect

## 🔄 **Fluxo de Integração**

```
Chat → Detecção de Intenção → Formulário → API /api/leads → HubSpot → Email Automático
```

### **1. Captura no Chat**
- Sistema detecta intenção de conversão
- Formulário aparece automaticamente
- Dados são validados em tempo real

### **2. Processamento via API**
- Endpoint: `POST /api/leads`
- Validação de dados
- Enriquecimento com metadados
- Integração com HubSpot

### **3. Criação no CRM**
- Contato criado automaticamente
- Nota adicionada sobre origem
- Pipeline configurado para follow-up

### **4. Automação de Email**
- Email de boas-vindas enviado
- Instruções para Sala Segura
- Agendamento de follow-up

## 📊 **Dados Capturados**

### **Informações Básicas**
- **Nome completo** (separado em firstname/lastname)
- **Email** (validado)
- **WhatsApp** (formatado)
- **Cidade** e **Estado**

### **Metadados de Conversão**
- **Origem**: "chat_website"
- **Campanha**: "divorcio_2024"
- **Status**: "novo_lead"
- **Sala Segura**: "pendente"

### **UTM Parameters**
- `utm_source`: "chat"
- `utm_medium`: "website"
- `utm_campaign`: "divorcio_2024"

## 🛠 **Implementação Técnica**

### **Arquivos Criados**
```
apps/web/
├── lib/crm-integration.ts          # Integração com HubSpot
├── app/api/leads/route.ts          # API para processar leads
├── app/components/ContactForm.tsx  # Formulário de contato
└── docs/CRM_INTEGRATION.md         # Esta documentação
```

### **Endpoints da API**

#### **POST /api/leads**
```typescript
// Request
{
  "name": "João Silva",
  "email": "joao@email.com",
  "whatsapp": "(11) 99999-9999",
  "city": "São Paulo",
  "state": "SP"
}

// Response
{
  "success": true,
  "contactId": "123456",
  "message": "Lead processado com sucesso",
  "nextSteps": [
    "Contato criado no CRM",
    "Email de boas-vindas enviado",
    "Acesso à Sala Segura será criado",
    "Follow-up agendado"
  ]
}
```

#### **GET /api/leads**
```typescript
// Response
{
  "status": "active",
  "integration": "HubSpot CRM",
  "features": [
    "Criação automática de contatos",
    "Validação de dados",
    "Log de conversões",
    "Metadados de origem"
  ],
  "timestamp": "2024-08-16T01:41:39.424Z"
}
```

## 📈 **Automações Sugeridas**

### **1. Email de Boas-vindas**
- Template personalizado
- Link para Sala Segura
- Informações sobre próximos passos
- Contato do advogado

### **2. Sequência de Follow-up**
- Email 1: Confirmação de recebimento
- Email 2: Documentos necessários
- Email 3: Agendamento de consulta
- WhatsApp: Contato direto

### **3. Notificações**
- Slack/Discord para novos leads
- Email para equipe
- Dashboard de conversões

## 🔧 **Configuração de Automação**

### **1. Workflow no HubSpot**
```
Novo Contato → Enviar Email de Boas-vindas → Agendar Follow-up → Notificar Equipe
```

### **2. Templates de Email**
- **Assunto**: "Bem-vindo à Sala Segura - Próximos Passos"
- **Conteúdo**: Personalizado com nome e instruções
- **CTA**: "Acessar Sala Segura"

### **3. Propriedades de Pipeline**
- **Estágio 1**: Novo Lead
- **Estágio 2**: Contato Realizado
- **Estágio 3**: Consulta Agendada
- **Estágio 4**: Cliente

## 📊 **Métricas e Relatórios**

### **KPIs Importantes**
- **Taxa de conversão** do chat
- **Tempo médio** até primeiro contato
- **Taxa de abertura** de emails
- **Conversão** para cliente

### **Relatórios Sugeridos**
- Leads por fonte
- Conversão por cidade/estado
- Performance do chat
- ROI da integração

## 🚀 **Próximos Passos**

### **1. Configuração Inicial**
- [ ] Criar conta no HubSpot
- [ ] Configurar API Key
- [ ] Testar integração
- [ ] Configurar automações

### **2. Otimização**
- [ ] A/B test de formulário
- [ ] Otimização de conversão
- [ ] Segmentação de leads
- [ ] Personalização de mensagens

### **3. Expansão**
- [ ] Integração com WhatsApp Business
- [ ] Sistema de agendamento
- [ ] Dashboard de analytics
- [ ] Integração com outros CRMs

## 🆘 **Suporte e Troubleshooting**

### **Problemas Comuns**

#### **1. API Key inválida**
```
Error: HubSpot API Error: 401 Unauthorized
```
**Solução**: Verificar se a API Key está correta e ativa

#### **2. Dados inválidos**
```
Error: Dados inválidos
```
**Solução**: Verificar validação dos campos no formulário

#### **3. Rate limit**
```
Error: HubSpot API Error: 429 Too Many Requests
```
**Solução**: Implementar retry com backoff exponencial

### **Logs e Monitoramento**
- Console logs para debugging
- Métricas de sucesso/erro
- Alertas para falhas críticas

## 📞 **Contato e Suporte**

Para dúvidas sobre a integração:
- **Email**: suporte@vandessonsantiago.com
- **WhatsApp**: (11) 99999-9999
- **Documentação**: Este arquivo

---

**Última atualização**: 16/08/2024  
**Versão**: 1.0.0  
**Status**: ✅ Implementado e Testado
