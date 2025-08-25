# Configuração da Tabela Conversions - Sala Segura API

## 🗄️ Estrutura da Tabela `conversions`

### 📋 Campos da Tabela:
- `id` (UUID): Identificador único da conversão
- `name` (TEXT): Nome completo do usuário
- `email` (TEXT): Email do usuário
- `whatsapp` (TEXT): Número do WhatsApp
- `status` (TEXT): Status da conversão (pending, completed, cancelled)
- `access_token` (TEXT): Token único para acesso ao registro
- `created_at` (TIMESTAMP): Data de criação
- `updated_at` (TIMESTAMP): Data de última atualização

## 🚀 Como Executar o Script

### 1. Acesse o Supabase Dashboard
- Vá para [supabase.com](https://supabase.com)
- Acesse seu projeto
- Vá para **SQL Editor**

### 2. Execute o Script
- Copie o conteúdo do arquivo `setup_conversions.sql`
- Cole no SQL Editor
- Clique em **Run**

### 3. Verificar a Criação
- Vá para **Table Editor**
- Verifique se a tabela `conversions` foi criada
- Confirme se as políticas RLS estão ativas

## 🔒 Segurança (RLS)

A tabela está configurada com **Row Level Security**:
- Permite inserção de conversões pela API
- Permite visualização por token de acesso
- Token único para cada conversão

## 🔄 Fluxo de Funcionamento

1. **Formulário Preenchido**: Usuário preenche o formulário no chat
2. **Dados Salvos**: API salva os dados na tabela `conversions`
3. **Token Gerado**: Sistema gera um token único de acesso
4. **Redirecionamento**: Usuário é redirecionado para `/admin/register?token=XXX`
5. **Validação**: Sistema valida o token e permite criação da conta
6. **Conta Criada**: Usuário cria senha e acessa a Sala Segura

## ⚠️ Importante

- Execute o script apenas **UMA VEZ**
- Não execute novamente se a tabela já existir
- O token de acesso é único e não pode ser reutilizado
- Após criação da conta, o status deve ser atualizado para 'completed'

## 🧪 Teste da API

Após criar a tabela, teste a API:

```bash
curl -X POST http://localhost:3002/api/v1/conversions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@teste.com", 
    "whatsapp": "(11) 99999-9999"
  }'
```

Deve retornar:
```json
{
  "success": true,
  "message": "Formulário enviado com sucesso!",
  "accessToken": "token_gerado",
  "redirectUrl": "http://localhost:3001/admin/register?token=token_gerado"
}
```
