# Database Tables Structure

Este diretório contém arquivos SQL organizados para cada tabela do banco de dados. Cada arquivo representa uma tabela específica e suas dependências.

## Estrutura dos Arquivos

- `00_functions.sql` - Funções auxiliares (devem ser executadas primeiro)
- `01_users.sql` - Tabela base de usuários
- `02_payments.sql` - Tabela de pagamentos
- `03_agendamentos.sql` - Tabela de agendamentos
- `04_divorce_cases.sql` - Tabela de casos de divórcio
- `05_chat_conversations.sql` - Tabela de conversas do chat
- `06_chat_messages.sql` - Tabela de mensagens do chat
- `07_checklist_sessions.sql` - Tabela de sessões de checklist
- `08_checklist_items.sql` - Tabela de itens de checklist
- `09_webhook_logs.sql` - Tabela de logs de webhook

## Ordem de Execução

Para criar o banco de dados do zero, execute os arquivos nesta ordem:

1. `00_functions.sql` - Cria as funções auxiliares
2. `01_users.sql` - Tabela base (sem dependências)
3. `02_payments.sql` - Depende de users
4. `03_agendamentos.sql` - Depende de users
5. `04_divorce_cases.sql` - Depende de users e payments
6. `05_chat_conversations.sql` - Depende de users
7. `06_chat_messages.sql` - Depende de chat_conversations
8. `07_checklist_sessions.sql` - Depende de users
9. `08_checklist_items.sql` - Depende de checklist_sessions
10. `09_webhook_logs.sql` - Depende de payments

## Conteúdo de Cada Arquivo

Cada arquivo contém:
- **Criação da tabela** com todas as colunas e constraints
- **Índices** para otimização de performance
- **Políticas RLS** (Row Level Security) para controle de acesso
- **Triggers** para atualização automática do campo `updated_at`

## Desenvolvimento Incremental

Como solicitado, cada tabela foi criada com estrutura básica inicialmente. Vamos evoluir cada tabela de acordo com os requisitos específicos de cada serviço do projeto, um por um.

## Próximos Passos

1. Executar os arquivos na ordem correta
2. Testar cada tabela individualmente
3. Adicionar campos específicos conforme necessário para cada serviço
4. Criar relacionamentos adicionais se necessário
5. Implementar constraints de negócio específicas
