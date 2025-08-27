# Sala Segura - Sistema Jurídi## 🚨 Solução de Problemas Comuns

### Erro: "null value in column 'id' violates not-null constraint"
- **Causa**: Problema na geração de UUID
- **Solução**: Scripts atualizados usam função `generate_uuid()` robusta

### Erro: "null value in column 'updated_at' violates not-null constraint"
- **Causa**: Campo `updated_at` não especificado na inserção
- **Solução**: Scripts corrigidos especificam todos os campos obrigatórios

### Erro: "trigger already exists"
- **Causa**: Triggers existentes de execuções anteriores
- **Solução**: Scripts usam `DROP TRIGGER IF EXISTS` antes de criar

### Ordem de Execução Corrigida:
```sql
-- 1. Schema principal (com correções aplicadas)
\i supabase_schema.sql

-- 2. Configuração do webhook
\i webhook_config.sql

-- 3. Teste de integração
\i test_integration.sql

-- 4. Verificação
\i system_check.sql
```

### Se ainda houver problemas:
```sql
-- Use o script de limpeza como último recurso
\i database_cleanup.sql
\i supabase_schema.sql
```

## 🚀 Configuração Inicial para gestão jurídica com integração de pagamentos, agendamentos e checklists.

## 🏗️ Arquitetura

- **Backend**: Express.js + TypeScript
- **Frontend**: Next.js + React + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Payments**: Asaas
- **Calendar**: Google Calendar API
- **AI**: OpenAI Integration

## 📁 Estrutura do Projeto

```
├── apps/
│   ├── api/                 # Backend Express.js
│   └── frontend/            # Frontend Next.js
├── packages/                # Pacotes compartilhados
│   ├── auth/               # Configurações de autenticação
│   ├── config-eslint/      # Configurações ESLint
│   ├── config-typescript/  # Configurações TypeScript
│   ├── jest-presets/       # Configurações Jest
│   ├── logger/             # Logger compartilhado
│   └── ui/                 # Componentes UI
└── supabase/               # Scripts SQL do Supabase
```

## � Solução de Problemas

### Erro: "trigger already exists"

Se você encontrar erros como `trigger "update_users_updated_at" for relation "users" already exists`, execute:

```sql
-- Opção 1: Script de limpeza (remove tudo e recria)
\i database_cleanup.sql
\i supabase_schema.sql

-- Opção 2: Scripts atualizados (compatíveis com re-execução)
\i supabase_schema.sql
\i webhook_config.sql
\i test_integration.sql
```

### Ordem de Execução dos Scripts

```sql
#### Executar Scripts SQL

1. **Acesse o SQL Editor do Supabase**
2. **Execute os scripts na seguinte ordem:**

   ```sql
   -- 1. Schema principal
   \i supabase_schema.sql

   -- 2. Configuração do webhook
   \i webhook_config.sql

   -- 3. Teste de integração
   \i test_integration.sql

   -- 4. Verificação (opcional)
   \i system_check.sql
   ```

#### Scripts Disponíveis

- **`supabase_schema.sql`** - Cria todas as tabelas e estrutura
- **`webhook_config.sql`** - Configura webhook Asaas
- **`test_integration.sql`** - Testa a integração completa
- **`database_cleanup.sql`** - Limpa tudo (use com cuidado!)
- **`system_check.sql`** - Verifica se tudo foi configurado
```

### Verificação de Execução

```sql
-- Verificar se tudo foi criado corretamente
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verificar triggers
SELECT
    event_object_table,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY event_object_table;

-- Verificar políticas RLS
SELECT
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

#### Ou execute via linha de comando:

```bash
# Conectar ao Supabase via psql (substitua as credenciais)
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -f supabase_schema.sql
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -f webhook_config.sql
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -f test_integration.sql
```

### 3. Configurar Variáveis de Ambiente

#### API (.env)
```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Asaas
ASAAS_API_KEY=your_asaas_api_key
ASAAS_WEBHOOK_URL=https://your-domain.com/api/asaas-webhook

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Google Calendar
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALENDAR_ID=your_calendar_id@group.calendar.google.com

# JWT
JWT_SECRET=your_jwt_secret
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Configurar Webhook no Asaas

1. **Acesse o painel do Asaas**: https://www.asaas.com/
2. **Vá para Configurações > Integrações > Webhooks**
3. **Clique em "Novo Webhook"**
4. **Configure:**
   - **URL**: `https://your-domain.com/api/asaas-webhook`
   - **Eventos**: Selecione todos os eventos de pagamento
   - **Status**: Ativo
5. **Salve e copie o Webhook ID gerado**
6. **Execute no SQL Editor do Supabase:**

```sql
UPDATE public.asaas_webhook_config
SET webhook_id = 'SEU_WEBHOOK_ID'
WHERE webhook_url = 'https://your-domain.com/api/asaas-webhook';
```

## 🏃‍♂️ Executar o Projeto

### Desenvolvimento

```bash
# Executar tudo (API + Frontend)
pnpm dev

# Apenas API
cd apps/api && pnpm dev

# Apenas Frontend
cd apps/frontend && pnpm dev
```

### Produção

```bash
# Build
pnpm build

# Start
pnpm start
```

## 📊 Scripts Disponíveis

### Scripts SQL

- **`supabase_schema.sql`**: Cria todas as tabelas essenciais
- **`webhook_config.sql`**: Configura webhook do Asaas
- **`test_integration.sql`**: Testa toda a integração

### Scripts do Projeto

```bash
# Desenvolvimento
pnpm dev              # Executa API + Frontend
pnpm dev:api          # Apenas API
pnpm dev:frontend     # Apenas Frontend

# Build
pnpm build            # Build de todos os projetos
pnpm build:api        # Build apenas da API
pnpm build:frontend   # Build apenas do Frontend

# Testes
pnpm test             # Executa todos os testes
pnpm test:api         # Testes da API
pnpm test:frontend    # Testes do Frontend

# Lint
pnpm lint             # Lint de todos os projetos
pnpm lint:fix         # Corrige problemas de lint
```

## 🔧 Funcionalidades

### ✅ Implementadas

- [x] **Autenticação Supabase**
- [x] **Sistema de Usuários**
- [x] **Conversões (Leads)**
- [x] **Checklists Jurídicos**
- [x] **Agendamentos**
- [x] **Integração Asaas (Pagamentos)**
- [x] **Webhooks Asaas**
- [x] **Google Calendar Integration**
- [x] **OpenAI Integration**
- [x] **Arquitetura Supabase-only**

### 🔄 Próximas Implementações

- [ ] **Dashboard Administrativo**
- [ ] **Relatórios**
- [ ] **Notificações**
- [ ] **Integração WhatsApp**

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

- **`users`**: Usuários do sistema
- **`user_profiles`**: Perfis dos usuários
- **`conversions`**: Leads/Conversões
- **`checklist_sessions`**: Sessões de checklist
- **`checklist_items`**: Itens dos checklists
- **`agendamentos`**: Agendamentos de consultas
- **`payments`**: Pagamentos via Asaas
- **`webhook_logs`**: Logs dos webhooks
- **`app_settings`**: Configurações do app
- **`activity_logs`**: Logs de atividade

### Índices e Performance

Todas as tabelas possuem índices otimizados para:
- Consultas por usuário
- Consultas por data/horário
- Consultas por status
- Full-text search

### Row Level Security (RLS)

Implementado em todas as tabelas para:
- Isolamento de dados por usuário
- Controle de acesso baseado em autenticação
- Segurança de dados sensíveis

## 🔍 Debugging

### Comandos Úteis para Debug

```sql
-- Ver todos os webhooks recebidos
SELECT * FROM webhook_logs ORDER BY processed_at DESC LIMIT 10;

-- Ver status de todos os pagamentos
SELECT p.*, a.cliente_nome, a.status as agendamento_status
FROM payments p
LEFT JOIN agendamentos a ON p.agendamento_id = a.id
ORDER BY p.created_at DESC;

-- Ver agendamentos com dados de pagamento
SELECT a.*, p.status as payment_status, p.asaas_id
FROM agendamentos a
LEFT JOIN payments p ON a.id = p.agendamento_id
WHERE a.user_id = 'SEU_USER_ID'
ORDER BY a.created_at DESC;

-- Ver logs de atividade
SELECT * FROM activity_logs
WHERE user_id = 'SEU_USER_ID'
ORDER BY created_at DESC LIMIT 20;
```

### Logs da Aplicação

```bash
# Ver logs da API
cd apps/api && pnpm logs

# Ver logs do Frontend
cd apps/frontend && pnpm logs
```

## 🚀 Deploy

### Vercel (Frontend)

```bash
# Deploy do Frontend
cd apps/frontend
vercel --prod
```

### Railway/Heroku (API)

```bash
# Build da API
cd apps/api
pnpm build

# Deploy
railway up
# ou
heroku create
git push heroku main
```

## 📝 Documentação Adicional

- [Supabase Docs](https://supabase.com/docs)
- [Asaas API Docs](https://www.asaas.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Express.js Docs](https://expressjs.com/)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato através de:
- **Email**: suporte@salasegura.com
- **WhatsApp**: +55 11 99999-9999
- **Issues**: [GitHub Issues](https://github.com/salasegura/issues)

---

**Sala Segura** - Transformando a justiça em algo acessível e eficiente.
