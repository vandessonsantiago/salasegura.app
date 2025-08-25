# Configuração das Tabelas de Chat Sessions - Sala Segura API

## 🗄️ Estrutura das Tabelas

### 📋 Tabela `chat_sessions`:
- `id` (UUID): Identificador único da sessão
- `user_id` (UUID): ID do usuário (referência para auth.users)
- `title` (TEXT): Título da sessão
- `flow` (TEXT): Tipo de fluxo (admin, web, etc.)
- `created_at` (TIMESTAMP): Data de criação
- `updated_at` (TIMESTAMP): Data de última atualização

### 📋 Tabela `chat_messages`:
- `id` (UUID): Identificador único da mensagem
- `session_id` (UUID): ID da sessão (referência para chat_sessions)
- `role` (TEXT): Role da mensagem (user, assistant)
- `content` (TEXT): Conteúdo da mensagem
- `timestamp` (TIMESTAMP): Data/hora da mensagem

## 🚀 Como Executar o Script

### 1. Acesse o Supabase Dashboard
- Vá para [supabase.com](https://supabase.com)
- Acesse seu projeto
- Vá para **SQL Editor**

### 2. Execute o Script
- Copie o conteúdo do arquivo `chat_sessions.sql`
- Cole no SQL Editor
- Clique em **Run**

### 3. Verificar a Criação
- Vá para **Table Editor**
- Verifique se as tabelas `chat_sessions` e `chat_messages` foram criadas
- Confirme se os índices foram criados

## 🔒 Segurança (RLS)

As tabelas estão configuradas com **Row Level Security**:
- Usuários só podem acessar suas próprias sessões
- Mensagens são vinculadas às sessões do usuário
- CASCADE DELETE: ao deletar sessão, mensagens são deletadas automaticamente

## 🔄 Fluxo de Funcionamento

1. **Primeira Mensagem**: Usuário envia primeira mensagem
2. **Sessão Criada**: Sistema cria nova sessão com título gerado
3. **Mensagem Salva**: Primeira mensagem é salva na sessão
4. **Resposta IA**: Resposta da IA é salva na mesma sessão
5. **Histórico**: Todas as mensagens subsequentes são salvas
6. **Persistência**: Sessões ficam disponíveis para consulta

## ⚠️ Importante

- Execute o script apenas **UMA VEZ**
- Não execute novamente se as tabelas já existirem
- O trigger `update_updated_at_column` atualiza automaticamente o `updated_at`
- Índices foram criados para performance

## 🧪 Teste da API

Após criar as tabelas, teste a API:

```bash
# Criar sessão (requer autenticação)
curl -X POST http://localhost:3002/api/v1/chat-sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "title": "Teste de Sessão",
    "flow": "admin",
    "initialMessage": "Olá, como posso ajudar?"
  }'

# Listar sessões (requer autenticação)
curl -X GET http://localhost:3002/api/v1/chat-sessions \
  -H "Authorization: Bearer SEU_TOKEN"

# Adicionar mensagem (requer autenticação)
curl -X POST http://localhost:3002/api/v1/chat-sessions/SESSION_ID/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "role": "assistant",
    "content": "Olá! Como posso ajudá-lo?"
  }'
```

## 📊 Estrutura do Banco

```sql
-- Relacionamentos
chat_sessions.user_id -> auth.users.id
chat_messages.session_id -> chat_sessions.id

-- Índices para performance
idx_chat_sessions_user_id
idx_chat_sessions_created_at
idx_chat_messages_session_id
idx_chat_messages_timestamp

-- Trigger automático
update_chat_sessions_updated_at
```

## 🎯 Funcionalidades Implementadas

- ✅ Criação automática de sessões
- ✅ Salvamento de mensagens
- ✅ Histórico de conversas
- ✅ Busca por título/conteúdo
- ✅ Exclusão de sessões
- ✅ Atualização automática de timestamps
