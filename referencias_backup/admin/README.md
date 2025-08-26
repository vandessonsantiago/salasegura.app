# Frontend Admin - Sala Segura

## 📋 Descrição

Aplicação administrativa da Sala Segura, plataforma de gerenciamento para o Advogado Vandesson Santiago. Interface privada para gestão de processos, usuários e acompanhamento de casos.

## 🎯 Funcionalidades Principais

### **1. Sistema de Autenticação**
- **Componente**: `LoginForm.tsx`
- **Funcionalidade**: Login seguro com validação
- **Integração**: Backend API (`/api/v1/auth/*`)
- **Recursos**:
  - Validação de credenciais
  - Persistência de sessão
  - Logout seguro

### **2. Dashboard de Processos**
- **Componente**: `Dashboard.tsx`
- **Funcionalidade**: Gestão completa de processos jurídicos
- **Integração**: Backend API (`/api/v1/processes`)
- **Recursos**:
  - CRUD de processos
  - Filtros por status e prioridade
  - Acompanhamento em tempo real

### **3. Registro de Usuários**
- **Componente**: `RegisterPage.tsx`
- **Funcionalidade**: Criação de contas via token de conversão
- **Integração**: Backend API (`/api/v1/auth/create-user`)
- **Recursos**:
  - Validação de token de acesso
  - Criação automática de conta
  - Redirecionamento para dashboard

### **4. Gestão de Salas**
- **Componente**: `RoomPage.tsx`
- **Funcionalidade**: Visualização de salas e processos
- **Integração**: Backend API (`/api/v1/rooms`)
- **Recursos**:
  - Listagem de salas
  - Processos por sala
  - Detalhes de casos

## 🖼️ Wireframes e Telas

### **Tela de Login**
```
┌─────────────────────────────────────┐
│                                     │
│        Acesse sua conta             │
│  Faça login para acessar a          │
│  plataforma administrativa          │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  Email: [________________]          │
│  Senha: [________________]          │
│                                     │
│  [Entrar]                          │
│                                     │
└─────────────────────────────────────┘
```

### **Dashboard Principal**
```
┌─────────────────────────────────────┐
│ Sala Segura              [👤 Menu] │
├─────────────────────────────────────┤
│                                     │
│  Dashboard                          │
│  Bem-vindo, João Silva!             │
│                                     │
│  [Novo Processo]                    │
│                                     │
│  Processos (3)                      │
│  ┌─────────────────────────────────┐ │
│  │ Divórcio Consensual            │ │
│  │ Status: Em Andamento           │ │
│  │ Prioridade: Alta               │ │
│  │ [Editar] [Excluir]             │ │
│  └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### **Formulário de Registro**
```
┌─────────────────────────────────────┐
│        Criar Conta                  │
│  Complete seu cadastro na Sala      │
│  Segura                             │
├─────────────────────────────────────┤
│                                     │
│  [Dados da Conversão]               │
│  Nome: João Silva                   │
│  Email: joao@teste.com              │
│                                     │
│  Senha: [________________]          │
│  Confirmar Senha: [________________] │
│                                     │
│  [Criar Conta]                      │
│                                     │
└─────────────────────────────────────┘
```

### **Gestão de Processos**
```
┌─────────────────────────────────────┐
│  Processos                          │
├─────────────────────────────────────┤
│                                     │
│  [Novo Processo]                    │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │ Título: [________________]      │ │
│  │ Descrição: [________________]   │ │
│  │ Prioridade: [Baixa ▼]          │ │
│  │ [Criar] [Cancelar]              │ │
│  └─────────────────────────────────┘ │
│                                     │
│  Lista de Processos:                │
│  • Divórcio Consensual (Alta)      │
│  • Guarda Compartilhada (Média)    │
│  • Inventário (Baixa)              │
│                                     │
└─────────────────────────────────────┘
```

## 🔧 Arquitetura Técnica

### **Estrutura de Arquivos**
```
apps/admin/
├── app/
│   ├── components/           # Componentes React
│   │   ├── Dashboard.tsx         # Dashboard principal
│   │   ├── LoginForm.tsx         # Formulário login
│   │   ├── UserMenu.tsx          # Menu usuário
│   │   └── AdminHeroCta.tsx      # CTA administrativo
│   ├── hooks/                # Hooks customizados
│   │   ├── useAuthBackend.ts     # Autenticação (novo)
│   │   ├── useProcessesBackend.ts # Processos (novo)
│   │   ├── useAuth.ts            # Autenticação (obsoleto)
│   │   └── useProcesses.ts       # Processos (obsoleto)
│   ├── lib/                  # Utilitários
│   │   ├── api.ts               # Cliente API
│   │   └── supabase.ts          # Config Supabase
│   ├── register/             # Páginas de registro
│   └── room/                 # Páginas de salas
├── middleware.ts            # Middleware Next.js
└── package.json            # Dependências
```

### **APIs Integradas**
- **Autenticação**: `POST /api/v1/auth/login` (Backend)
- **Logout**: `POST /api/v1/auth/logout` (Backend)
- **Sessão**: `GET /api/v1/auth/session` (Backend)
- **Criar Usuário**: `POST /api/v1/auth/create-user` (Backend)
- **Processos**: `GET/POST/PUT/DELETE /api/v1/processes` (Backend)
- **Salas**: `GET /api/v1/rooms` (Backend)
- **Conversões**: `GET /api/v1/conversions/:token` (Backend)

## 📊 Status dos Componentes

### **✅ Ativos e Funcionando (Migrados)**
- [x] `useAuthBackend.ts` - Hook de autenticação (novo)
- [x] `useProcessesBackend.ts` - Hook de processos (novo)
- [x] `Dashboard.tsx` - Dashboard principal
- [x] `LoginForm.tsx` - Formulário de login
- [x] `UserMenu.tsx` - Menu do usuário
- [x] `RegisterPage.tsx` - Página de registro
- [x] `RoomPage.tsx` - Página de salas
- [x] `api.ts` - Cliente API

### **🔧 Configuração**
- **Autenticação**: Context API com Supabase Auth
- **Estado**: Gerenciamento global via Context
- **APIs**: Integração com `services/sala-segura-api`
- **Persistência**: LocalStorage para tokens

### **🗑️ Removidos (Migração)**
- [x] APIs locais migradas para backend
- [x] Configurações duplicadas
- [x] Hooks obsoletos (useAuth.ts, useProcesses.ts)
- [x] Componentes não utilizados (AdminHeroCta.tsx)

## 🚀 Como Executar

```bash
# Instalar dependências
pnpm install

# Executar em desenvolvimento
pnpm run dev

# Build para produção
pnpm run build
```

## 🔗 URLs

- **Desenvolvimento**: http://localhost:3001
- **Produção**: https://admin-salasegura.vandessonsantiago.com

## 🔐 Segurança

### **Autenticação**
- Tokens JWT via Supabase
- Validação de sessão no backend
- Logout automático em inatividade

### **Autorização**
- Controle de acesso por rota
- Validação de tokens em todas as APIs
- Middleware de proteção

## 📝 Notas de Desenvolvimento

### **Migrações Realizadas**
1. **Hooks de Autenticação**: Migrados para usar backend
2. **Hooks de Processos**: Migrados para usar backend
3. **APIs**: Centralizadas no backend
4. **Configurações**: Simplificadas

### **Melhorias Implementadas**
- Autenticação centralizada
- Gestão de estado otimizada
- Interface responsiva
- Performance melhorada

## 📞 Suporte

Para dúvidas técnicas ou problemas, entre em contato com a equipe de desenvolvimento.
