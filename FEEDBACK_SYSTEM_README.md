# Sistema de Feedback - Sala Segura

## Visão Geral

O sistema de feedback ## Como Usar

### 1. Executar Migração no Supabase

#### Opção A: SQL Editor (Recomendado)
1. Acesse seu [Supabase Dashboard](https://supabase.com)
2. Navegue para **SQL Editor**
3. Copie e cole o conteúdo do arquivo `database/supabase_feedback_migration.sql`
4. Clique em **Run** para executar a migração

#### Opção B: Script Local (se PostgreSQL estiver configurado)
```bash
cd database
./run_feedback_migration.sh
```

### 3. Verificar Migração
Execute as queries do arquivo `database/verify_feedback_migration.sql` no SQL Editor do Supabase para confirmar que tudo foi criado corretamente.uários autenticados enviem feedback diretamente para o banco de dados. O feedback é vinculado ao `user_id` do usuário e inclui funcionalidades de moderação e acompanhamento.

## Funcionalidades

### ✅ Implementado
- **Frontend**: Componente React `FeedbackButton` com modal interativo
- **Backend**: API REST completa com autenticação
- **Banco de Dados**: Tabela `feedback` com RLS (Row Level Security)
- **Tipos de Feedback**: Problemas e Sugestões
- **Status Tracking**: Pendente, Revisado, Resolvido
- **Integração**: Vinculado ao sistema de autenticação existente

### 🎯 Características
- **Segurança**: Apenas usuários autenticados podem enviar feedback
- **Privacidade**: Cada usuário vê apenas seu próprio feedback
- **Moderação**: Sistema de status para acompanhar resolução
- **Validação**: Validação de entrada no frontend e backend
- **UI/UX**: Interface moderna com animações e feedback visual

## Estrutura do Banco de Dados

### Tabela `feedback`
```sql
CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('problem', 'suggestion')),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Índices
- `idx_feedback_user_id` - Para consultas por usuário
- `idx_feedback_type` - Para filtrar por tipo
- `idx_feedback_status` - Para filtrar por status
- `idx_feedback_created_at` - Para ordenação por data

### Row Level Security (RLS)
- Usuários podem ver apenas seu próprio feedback
- Usuários podem inserir apenas seu próprio feedback
- Políticas de segurança baseadas em `auth.uid()`

## API Endpoints

### `POST /api/v1/feedback`
Criar um novo feedback
```json
{
  "type": "problem" | "suggestion",
  "message": "Descrição do feedback"
}
```

### `GET /api/v1/feedback`
Buscar feedback do usuário autenticado
- Query params: `page`, `limit`, `status`, `type`

### `GET /api/v1/feedback/:id`
Buscar feedback específico

### `PATCH /api/v1/feedback/:id/status`
Atualizar status do feedback
```json
{
  "status": "pending" | "reviewed" | "resolved"
}
```

## Como Usar

### 1. Executar Migração
```bash
cd database
./run_feedback_migration.sh
```

### 2. Verificar Funcionamento
1. Faça login na aplicação
2. Clique no botão "Feedback" no canto inferior direito
3. Selecione o tipo de feedback
4. Digite sua mensagem
5. Clique em "Enviar"

### 3. Monitorar Feedback (Admin)
Como administrador, você pode:
- Ver todos os feedbacks no banco de dados
- Atualizar status dos feedbacks
- Filtrar por tipo, status ou usuário

## Arquitetura Modular

### 🎯 Padrão de Organização
O sistema de feedback foi implementado seguindo uma arquitetura modular inspirada no módulo IA, garantindo:

#### Estrutura Consistente
```
apps/api/src/{module}/
├── services/          # Lógica de negócio
├── types/            # Tipos TypeScript específicos
├── utils/            # Utilitários e helpers
├── __tests__/        # Testes unitários
└── index.ts          # Exportações principais
```

#### Benefícios da Abordagem
- **Desacoplamento**: Cada módulo é independente
- **Manutenibilidade**: Código organizado por funcionalidade
- **Reutilização**: Serviços podem ser importados por outros módulos
- **Testabilidade**: Estrutura preparada para testes unitários
- **Escalabilidade**: Fácil adição de novos recursos

### 📦 Módulos Planejados
Esta arquitetura será replicada para:
- ✅ **Feedback**: Implementado
- 🔄 **Agendamentos**: Próximo
- 🔄 **Divórcio**: Em planejamento
- 🔄 **Pagamentos**: Em planejamento
- 🔄 **Checklists**: Em planejamento

### Backend - Nova Estrutura Modular
- `apps/api/src/feedback/` - **Novo módulo dedicado**
  - `services/FeedbackService.ts` - Lógica de negócio
  - `services/FeedbackController.ts` - Controladores da API
  - `services/FeedbackRoutes.ts` - Definição das rotas
  - `types/feedback.types.ts` - Tipos TypeScript específicos
  - `index.ts` - Exportações principais
  - `README.md` - Documentação do módulo
- `database/migrations/20250901_create_feedback_table.sql` - Migração da tabela
- `database/supabase_feedback_migration.sql` - Migração para Supabase
- `database/verify_feedback_migration.sql` - Queries de verificação
- `database/run_feedback_migration.sh` - Script de execução

### Frontend (Mantido)
- `apps/frontend/src/services/feedbackService.ts` - Serviço para chamadas API
- `apps/frontend/src/components/ui/FeedbackButton.tsx` - Componente atualizado

## Próximos Passos

### Melhorias Sugeridas
1. **Dashboard Admin**: Interface para visualizar e gerenciar todos os feedbacks
2. **Notificações**: Sistema de notificações para novos feedbacks
3. **Estatísticas**: Dashboard com métricas de feedback
4. **Categorização**: Sistema de tags/categorias para melhor organização
5. **Anexos**: Suporte para anexar imagens ou arquivos
6. **Templates**: Templates pré-definidos para tipos comuns de feedback

### Monitoramento
- Logs de erro em produção
- Métricas de uso do sistema de feedback
- Alertas para feedbacks críticos

## Solução de Problemas

### Erro: "foreign key constraint cannot be implemented - Key columns are of incompatible types"
**Sintomas:** Erro ao executar migração com `user_id UUID` vs `users.id text`

**Solução:**
1. A coluna `id` da tabela `users` é do tipo `text` (não `UUID`)
2. Migração corrigida para usar `user_id text` em vez de `user_id UUID`
3. Arquivo correto: `database/supabase_feedback_migration.sql`

### Erro: "Connection refused" no PostgreSQL local
**Sintomas:** Script local falha ao conectar ao banco

**Solução:**
1. Use o **Supabase Dashboard** para executar a migração
2. Vá para SQL Editor e execute `database/supabase_feedback_migration.sql`
3. Ou configure PostgreSQL local com as credenciais corretas

### Verificação da Migração
Execute estas queries no SQL Editor do Supabase para verificar:

```sql
-- Verificar se tabela foi criada
SELECT * FROM information_schema.tables
WHERE table_name = 'feedback';

-- Verificar políticas RLS
SELECT * FROM pg_policies
WHERE tablename = 'feedback';

-- Testar inserção (substitua pelo seu user_id)
INSERT INTO feedback (user_id, type, message)
VALUES ('your-user-id-here', 'suggestion', 'Test feedback');
```

## Segurança

- ✅ Autenticação obrigatória
- ✅ Validação de entrada
- ✅ RLS habilitado
- ✅ Sanitização de dados
- ✅ Rate limiting recomendado para produção
