# 📅 Tabela de Agendamentos - Supabase

## 🗄️ Estrutura da Tabela

A tabela `agendamentos` foi criada para persistir todos os agendamentos de consultas dos usuários.

### 📋 Campos da Tabela

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | ID único do agendamento (gerado automaticamente) |
| `user_id` | UUID | ID do usuário (referência para auth.users) |
| `data` | DATE | Data do agendamento |
| `horario` | TIME | Horário do agendamento |
| `status` | VARCHAR(20) | Status do agendamento (PENDING, CONFIRMED, CANCELLED) |
| `payment_id` | VARCHAR(255) | ID do pagamento no Asaas |
| `payment_status` | VARCHAR(20) | Status do pagamento (PENDING, CONFIRMED, CANCELLED) |
| `valor` | DECIMAL(10,2) | Valor da consulta |
| `descricao` | TEXT | Descrição do agendamento |
| `cliente_nome` | VARCHAR(255) | Nome do cliente |
| `cliente_email` | VARCHAR(255) | Email do cliente |
| `cliente_telefone` | VARCHAR(20) | Telefone do cliente |
| `qr_code_pix` | TEXT | QR Code PIX (base64) |
| `copy_paste_pix` | TEXT | Código PIX para copiar e colar |
| `pix_expires_at` | TIMESTAMP | Data de expiração do PIX |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de última atualização |

## 🔐 Segurança (RLS)

A tabela possui Row Level Security (RLS) habilitado com as seguintes políticas:

- **SELECT**: Usuários só podem ver seus próprios agendamentos
- **INSERT**: Usuários só podem inserir agendamentos para si mesmos
- **UPDATE**: Usuários só podem atualizar seus próprios agendamentos
- **DELETE**: Usuários só podem deletar seus próprios agendamentos

## ⚡ Performance

Índices criados para otimizar consultas:

- `idx_agendamentos_user_id` - Busca por usuário
- `idx_agendamentos_status` - Filtros por status
- `idx_agendamentos_payment_id` - Busca por ID do pagamento
- `idx_agendamentos_created_at` - Ordenação por data de criação

## 🔄 Funcionalidades Automáticas

### Trigger de Atualização
- Campo `updated_at` é atualizado automaticamente a cada modificação

### Cancelamento Automático
- Função `cancel_expired_agendamentos()` cancela agendamentos após 24h sem pagamento
- Pode ser agendada para executar a cada hora via cron

## 🚀 Como Executar

1. **Acesse o Supabase Dashboard**
2. **Vá para SQL Editor**
3. **Execute o arquivo `agendamentos.sql`**

```sql
-- Copie e cole o conteúdo do arquivo agendamentos.sql
-- Execute no SQL Editor do Supabase
```

## 📡 Endpoints da API

### Frontend → Backend
- `GET /api/v1/agendamentos` - Listar agendamentos do usuário
- `POST /api/v1/agendamentos` - Criar novo agendamento
- `PUT /api/v1/agendamentos/:id` - Atualizar agendamento
- `DELETE /api/v1/agendamentos/:id` - Deletar agendamento
- `PUT /api/v1/agendamentos/payment-status/:payment_id` - Atualizar status do pagamento

### Webhook Asaas → Backend
- `POST /api/v1/webhook` - Receber notificações de pagamento

## 🔄 Fluxo de Dados

1. **Frontend** cria agendamento → **Backend** salva no Supabase
2. **Asaas** processa pagamento → **Webhook** atualiza status
3. **Frontend** sincroniza com backend periodicamente
4. **Fallback** para localStorage se backend estiver indisponível

## 🛠️ Manutenção

### Verificar Agendamentos Expirados
```sql
SELECT * FROM agendamentos 
WHERE status = 'PENDING' 
AND payment_status = 'PENDING'
AND created_at < NOW() - INTERVAL '24 hours';
```

### Cancelar Agendamentos Expirados Manualmente
```sql
SELECT cancel_expired_agendamentos();
```

### Estatísticas
```sql
SELECT 
  status,
  COUNT(*) as total
FROM agendamentos 
GROUP BY status;
```
