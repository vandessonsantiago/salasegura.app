# Backend API - Sala Segura

## 📋 Descrição

API centralizada da Sala Segura, plataforma de Direito de Família. Serviço backend que gerencia todas as operações de negócio, autenticação e integração com IA.

## 🎯 Funcionalidades Principais

### **1. Chat com IA**
- **Rota**: `POST /api/v1/chat`
- **Funcionalidade**: Integração com OpenAI GPT-4o-mini
- **Recursos**:
  - Detecção automática de conversão
  - Respostas contextualizadas
  - Histórico de conversas
  - System prompts personalizados

### **2. Sistema de Conversões**
- **Rota**: `POST /api/v1/conversions`
- **Funcionalidade**: Captura e gestão de leads
- **Recursos**:
  - Validação de dados
  - Geração de tokens únicos
  - Integração com Supabase
  - Redirecionamento automático

### **3. Autenticação e Usuários**
- **Rotas**: `/api/v1/auth/*`
- **Funcionalidade**: Gestão completa de autenticação
- **Recursos**:
  - Login/Logout
  - Criação de usuários
  - Validação de sessões
  - Tokens JWT

### **4. Gestão de Processos**
- **Rota**: `/api/v1/processes`
- **Funcionalidade**: CRUD de processos jurídicos
- **Recursos**:
  - Criação, leitura, atualização, exclusão
  - Filtros por status e prioridade
  - Validação de permissões
  - Integração com banco de dados

### **5. Gestão de Salas**
- **Rota**: `/api/v1/rooms`
- **Funcionalidade**: Organização de casos por salas
- **Recursos**:
  - Listagem de salas
  - Processos por sala
  - Metadados de casos

## 🔧 Arquitetura Técnica

### **Estrutura de Arquivos**
```
services/sala-segura-api/
├── src/
│   ├── routes/              # Rotas da API
│   │   ├── auth.ts             # Autenticação
│   │   ├── chat.ts             # Chat com IA
│   │   ├── conversions.ts      # Conversões
│   │   ├── processes.ts        # Processos
│   │   ├── rooms.ts            # Salas
│   │   └── user.ts             # Usuários
│   ├── config/              # Configurações
│   │   └── supabase.ts         # Cliente Supabase
│   ├── middleware/           # Middlewares
│   │   └── auth.ts             # Autenticação
│   ├── types/               # Tipos TypeScript
│   │   └── index.ts            # Definições
│   └── index.ts             # Entry point
├── database/               # Scripts SQL
│   ├── schema.sql             # Schema principal
│   ├── users.sql              # Tabela usuários
│   ├── processes.sql          # Tabela processos
│   ├── rooms.sql              # Tabela salas
│   └── conversions.sql        # Tabela conversões
└── package.json            # Dependências
```

### **Tecnologias Utilizadas**
- **Framework**: Express.js
- **Banco de Dados**: Supabase (PostgreSQL)
- **IA**: OpenAI GPT-4o-mini
- **Autenticação**: Supabase Auth
- **Validação**: Express middleware
- **Segurança**: Helmet, CORS, Rate Limiting

## 📊 APIs Disponíveis

### **Chat e IA**
```
POST /api/v1/chat
{
  "message": "string",
  "chatHistory": "array"
}
```

### **Conversões**
```
POST /api/v1/conversions
{
  "name": "string",
  "email": "string", 
  "whatsapp": "string"
}

GET /api/v1/conversions/:token
```

### **Autenticação**
```
POST /api/v1/auth/login
{
  "email": "string",
  "password": "string"
}

POST /api/v1/auth/logout
{
  "access_token": "string"
}

GET /api/v1/auth/session
Headers: Authorization: Bearer <token>

POST /api/v1/auth/create-user
{
  "email": "string",
  "password": "string",
  "user_metadata": "object"
}
```

### **Processos**
```
GET /api/v1/processes
POST /api/v1/processes
PUT /api/v1/processes/:id
DELETE /api/v1/processes/:id
```

### **Salas**
```
GET /api/v1/rooms
GET /api/v1/rooms/:id
GET /api/v1/rooms/:id/processes
```

### **Usuários**
```
GET /api/v1/user/profile
```

## 📊 Status dos Componentes

### **✅ Ativos e Funcionando**
- [x] `auth.ts` - Rotas de autenticação
- [x] `chat.ts` - Chat com IA
- [x] `conversions.ts` - Gestão de conversões
- [x] `processes.ts` - CRUD de processos
- [x] `rooms.ts` - Gestão de salas
- [x] `user.ts` - Perfil de usuários
- [x] `supabase.ts` - Configuração do banco
- [x] `middleware/auth.ts` - Middleware de autenticação

### **🗑️ Removidos (Migração)**
- [x] APIs duplicadas do frontend
- [x] Configurações obsoletas

### **🔧 Configuração**
- **Banco de Dados**: Supabase PostgreSQL
- **Autenticação**: Supabase Auth com JWT
- **IA**: OpenAI GPT-4o-mini
- **Segurança**: CORS, Rate Limiting, Helmet

### **🗑️ Removidos (Migração)**
- [x] APIs duplicadas do frontend
- [x] Configurações obsoletas
- [x] Middleware de recursão infinita (corrigido)

## 🚀 Como Executar

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar em produção
npm start
```

## 🔗 URLs

- **Desenvolvimento**: http://localhost:3002
- **Produção**: https://sala-segura-api.vandessonsantiago.com
- **Health Check**: `/health`
- **Documentação**: `/api/v1`

## 🔐 Segurança

### **Autenticação**
- Tokens JWT via Supabase
- Validação em todas as rotas protegidas
- Refresh tokens automático

### **Rate Limiting**
- 1000 requests/15min (desenvolvimento)
- 100 requests/15min (produção)

### **CORS**
- Configurado para domínios específicos
- Credenciais habilitadas
- Headers customizados

### **Validação**
- Validação de entrada em todas as rotas
- Sanitização de dados
- Tratamento de erros centralizado

## 📊 Banco de Dados

### **Tabelas Principais**
- **users**: Usuários do sistema
- **processes**: Processos jurídicos
- **rooms**: Salas de casos
- **conversions**: Conversões de leads

### **Relacionamentos**
- Usuários → Processos (1:N)
- Salas → Processos (1:N)
- Conversões → Usuários (1:1)

## 📝 Notas de Desenvolvimento

### **Migrações Realizadas**
1. **APIs do Frontend**: Migradas para backend
2. **Autenticação**: Centralizada
3. **Banco de Dados**: Estruturado
4. **Segurança**: Implementada

### **Melhorias Implementadas**
- Arquitetura monolítica bem estruturada
- APIs RESTful consistentes
- Tratamento de erros robusto
- Performance otimizada

## 📞 Suporte

Para dúvidas técnicas ou problemas, entre em contato com a equipe de desenvolvimento.
# Deploy fix
