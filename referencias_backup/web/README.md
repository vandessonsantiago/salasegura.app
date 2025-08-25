# Frontend Web - Sala Segura

## 📋 Descrição

Aplicação frontend principal da Sala Segura, plataforma de Direito de Família do Advogado Vandesson Santiago. Interface pública para conversão de leads e atendimento via IA.

## 🎯 Funcionalidades Principais

### **1. Chat com IA**
- **Componente**: `AlignmentMeeting.tsx`
- **Funcionalidade**: Chat interativo com GPT-4 para orientações jurídicas
- **Integração**: Backend API (`/api/v1/chat`)
- **Recursos**:
  - Detecção automática de intenção de conversão
  - Respostas contextualizadas (com/sem filhos)
  - Histórico de conversas persistido
  - Edição de mensagens

### **2. Sistema de Conversão**
- **Componente**: `ContactForm.tsx`
- **Funcionalidade**: Formulário de captura de leads
- **Integração**: Backend API (`/api/v1/conversions`)
- **Recursos**:
  - Validação de dados
  - Geração de token de acesso único
  - Redirecionamento para registro

### **3. Interface de Usuário**
- **Tema**: Suporte a modo claro/escuro
- **Responsivo**: Design mobile-first
- **Acessibilidade**: Componentes otimizados

## 🖼️ Wireframes e Telas

### **Tela Principal**
```
┌─────────────────────────────────────┐
│ [⚙️] [💬]                          │
├─────────────────────────────────────┤
│                                     │
│        [Avatar]                     │
│    Sala Segura | Método             │
│      Novo Pacto                     │
│                                     │
│    por VANDESSON SANTIAGO           │
│                                     │
│  Orientações humanizadas para       │
│  sua jornada de separação.          │
│                                     │
│  [Primeiros Passos] [Suporte] [SAC] │
│                                     │
├─────────────────────────────────────┤
│ [Mensagem...] [➤]                   │
│ Ao enviar mensagens...              │
└─────────────────────────────────────┘
```

### **Chat Interface**
```
┌─────────────────────────────────────┐
│ [←] Sala Segura                    │
├─────────────────────────────────────┤
│                                     │
│  👤 Olá! Como posso ajudar?         │
│                                     │
│  👤 Estou passando por um divórcio  │
│     e tenho filhos menores...       │
│                                     │
│  🤖 Entendo sua situação...         │
│     [Formulário de Contato]         │
│                                     │
├─────────────────────────────────────┤
│ [Mensagem...] [➤]                   │
└─────────────────────────────────────┘
```

### **Formulário de Conversão**
```
┌─────────────────────────────────────┐
│        Criar Conta                  │
│  Complete seu cadastro na Sala      │
│  Segura                             │
├─────────────────────────────────────┤
│                                     │
│  Nome: [________________]           │
│  Email: [________________]          │
│  WhatsApp: [________________]       │
│                                     │
│  [Criar Conta]                      │
│                                     │
└─────────────────────────────────────┘
```

## 🔧 Arquitetura Técnica

### **Estrutura de Arquivos**
```
apps/web/
├── app/
│   ├── components/           # Componentes React
│   │   ├── AlignmentMeeting.tsx  # Chat principal
│   │   ├── ContactForm.tsx       # Formulário conversão
│   │   ├── MessageModal.tsx      # Histórico mensagens
│   │   └── SettingsModal.tsx     # Configurações
│   ├── hooks/                # Hooks customizados
│   │   ├── useChat.ts           # Lógica do chat
│   │   └── useChatStorage.ts    # Armazenamento
│   ├── constants.ts          # Strings centralizadas
│   └── layout.tsx            # Layout principal
├── public/                   # Assets estáticos
└── package.json             # Dependências
```

### **APIs Integradas**
- **Chat**: `POST /api/v1/chat` (Backend)
- **Conversões**: `POST /api/v1/conversions` (Backend)
- **Validação**: `GET /api/v1/conversions/:token` (Backend)

## 📊 Status dos Componentes

### **✅ Ativos e Funcionando**
- [x] `AlignmentMeeting.tsx` - Chat principal com IA
- [x] `ContactForm.tsx` - Formulário de conversão
- [x] `MessageModal.tsx` - Histórico de mensagens
- [x] `SettingsModal.tsx` - Configurações de tema
- [x] `useChat.ts` - Hook do chat (integração com backend)
- [x] `useChatStorage.ts` - Hook de armazenamento local
- [x] `constants.ts` - Strings centralizadas em português

### **🔧 Configuração**
- **API Backend**: Integração com `services/sala-segura-api`
- **Idioma**: Apenas português (simplificado)
- **Tema**: Claro/Escuro/Sistema
- **Armazenamento**: LocalStorage para histórico

### **🗑️ Removidos (Migração)**
- [x] `LanguageContext.tsx` - Contexto multi-idioma
- [x] `translations.ts` - Traduções
- [x] `api/chat/route.ts` - API local (migrada para backend)
- [x] `api/conversions/route.ts` - API local (migrada para backend)

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

- **Desenvolvimento**: http://localhost:3000
- **Produção**: https://salasegura.vandessonsantiago.com

## 📝 Notas de Desenvolvimento

### **Migrações Realizadas**
1. **API Chat**: Migrada do frontend para backend
2. **API Conversões**: Migrada do frontend para backend
3. **Multi-idioma**: Removido, mantido apenas português
4. **Configurações**: Centralizadas em `constants.ts`

### **Melhorias Implementadas**
- Respostas contextualizadas do agente
- Detecção automática de conversão
- Interface simplificada e focada
- Performance otimizada

## 📞 Suporte

Para dúvidas técnicas ou problemas, entre em contato com a equipe de desenvolvimento.
