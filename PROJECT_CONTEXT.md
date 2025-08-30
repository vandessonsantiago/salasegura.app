# Projeto SalaSegura - Guia de Contexto para Copilot/Grok

## 📋 Visão Geral do Projeto

**SalaSegura** é uma plataforma jurídica digital que oferece serviços de assessoria jurídica online, com foco em divórcios express e agendamentos de consultas jurídicas. O sistema integra pagamentos PIX via Asaas e utiliza uma arquitetura moderna com Next.js, Supabase e TypeScript.

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: Next.js 15.5.0 (App Router)
- **Linguagem**: TypeScript 5.8.2
- **Styling**: Tailwind CSS 4.1.12
- **UI Components**: Componentes customizados com Phosphor Icons
- **State Management**: React Context API
- **Forms**: Manipulação direta com React Hooks

### Backend/API
- **Runtime**: Node.js com TypeScript
- **Framework**: Express.js (servidor customizado)
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Pagamentos**: Asaas API (PIX)

### Ferramentas de Desenvolvimento
- **Gerenciador de Pacotes**: pnpm (workspaces)
- **Linting**: ESLint com configurações customizadas
- **Type Checking**: TypeScript
- **Build Tool**: Turborepo para monorepo
- **Versionamento**: Git

## 📁 Estrutura do Projeto

```
salasegura/
├── apps/
│   ├── frontend/          # Aplicação Next.js
│   │   ├── src/
│   │   │   ├── app/       # App Router do Next.js
│   │   │   │   ├── dashboard/
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── components/ # Componentes React
│   │   │   │   ├── layout/
│   │   │   │   ├── modals/
│   │   │   │   ├── payments/
│   │   │   │   └── ui/
│   │   │   ├── contexts/   # Context Providers
│   │   │   ├── hooks/      # Custom Hooks
│   │   │   ├── lib/        # Utilitários
│   │   │   ├── services/   # Serviços externos
│   │   │   └── utils/      # Funções utilitárias
│   │   └── public/         # Assets estáticos
│   └── api/                # API Backend
│       ├── src/
│       └── dist/
├── packages/               # Pacotes compartilhados
│   ├── auth/              # Configurações de auth
│   ├── config-eslint/     # Config ESLint
│   ├── config-typescript/ # Config TypeScript
│   ├── logger/            # Sistema de logging
│   └── ui/                # Componentes UI compartilhados
├── supabase/              # Migrations e configurações DB
└── tools/                 # Scripts utilitários
```

## 🎨 Padrões de Codificação

### TypeScript
- **Strict Mode**: Sempre habilitado
- **Type Annotations**: Obrigatórias para parâmetros e retornos
- **Interfaces**: Preferidas sobre types para objetos complexos
- **Generics**: Utilizados quando apropriado
- **Enums**: Evitados, preferir union types

### React/Next.js
- **Componentes**: Função com arrow function
- **Hooks**: Custom hooks para lógica reutilizável
- **Props**: Interface definida para cada componente
- **Event Handlers**: Prefixo `handle` (ex: `handleSubmit`)
- **State**: useState com tipos explícitos
- **Effects**: useEffect com dependências corretas

### Estilo de Código
```typescript
// ✅ BOM: Interface clara, tipos explícitos
interface User {
  id: string;
  name: string;
  email: string;
}

const handleUserUpdate = (user: User): void => {
  // implementação
};

// ✅ BOM: Componente com props tipadas
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary'
}) => {
  // implementação
};
```

### Nomenclatura
- **Componentes**: PascalCase (ex: `UserProfile`)
- **Hooks**: camelCase com prefixo `use` (ex: `useAuth`)
- **Funções**: camelCase (ex: `formatCurrency`)
- **Variáveis**: camelCase (ex: `userData`)
- **Constantes**: SCREAMING_SNAKE_CASE (ex: `API_BASE_URL`)
- **Arquivos**: kebab-case (ex: `user-profile.tsx`)

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js 18+
- pnpm
- Git

### Instalação e Execução

```bash
# Clonar repositório
git clone <repository-url>
cd salasegura

# Instalar dependências
pnpm install

# Executar em desenvolvimento
pnpm run dev

# Ou executar serviços individualmente
pnpm --filter frontend run dev    # Frontend (porta 3000)
pnpm --filter api run dev         # API (porta 8001)
```

### Comandos Úteis

```bash
# Verificar tipos TypeScript
pnpm --filter frontend run check-types

# Lint do código
pnpm --filter frontend run lint

# Build de produção
pnpm --filter frontend run build

# Limpar cache
rm -rf apps/frontend/.next
```

## 🔧 Funcionalidades Principais

### 1. Sistema de Autenticação
- Login/cadastro com Supabase Auth
- Proteção de rotas
- Gerenciamento de sessão

### 2. Checkout PIX
- Integração com Asaas API
- Máscara automática CPF/telefone
- Preenchimento automático de dados
- Verificação de status de pagamento

### 3. Agendamentos
- Sistema de agendamento de consultas
- Calendário integrado
- Notificações

### 4. Divórcios Express
- Processo simplificado de divórcio
- Formulários dinâmicos
- Acompanhamento de status

### 5. Dashboard
- Visão geral do usuário
- Histórico de serviços
- Gestão de pagamentos

### 6. Chat Inteligente
- Assistente virtual conversacional no landing page
- Lógica inteligente de detecção de intenção de conversão
- Respostas contextuais sobre serviços da plataforma
- Sistema de qualificação de leads (coleta email/telefone)
- Animação de digitação para melhor UX
- Histórico de conversas armazenado localmente
- Detecção automática de palavras-chave para conversão

### 7. Sistema de Checklist para Divórcio
- Checklist específico para divórcio consensual em cartório
- Verificação de documentos essenciais antes do cartório
- Categorias organizadas: elegibilidade, documentos pessoais, filhos, patrimônio, tributação
- Acompanhamento de progresso com indicador visual
- Sessões persistidas no banco de dados
- Modal interativo com explicações detalhadas
- Validação de prontidão para Escritura Pública

## 📊 Fluxos de Trabalho Comuns

### Criando um Novo Componente
1. Criar arquivo em `apps/frontend/src/components/`
2. Definir interface para props
3. Implementar componente com TypeScript
4. Exportar componente
5. Importar e usar no componente pai

### Adicionando uma Nova Página
1. Criar pasta em `apps/frontend/src/app/`
2. Criar `page.tsx` com componente React
3. Adicionar layout se necessário
4. Configurar rota dinâmica se aplicável

### Implementando um Novo Hook
1. Criar arquivo em `apps/frontend/src/hooks/`
2. Usar prefixo `use` no nome
3. Definir tipos de retorno
4. Implementar lógica reutilizável
5. Documentar uso do hook

## 🔐 Configurações Importantes

### Variáveis de Ambiente
```env
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# API (.env)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ASAAS_API_KEY=your_asaas_api_key
```

### Supabase
- **URL**: Configurada nas variáveis de ambiente
- **Tabelas principais**:
  - `users` - Usuários do sistema
  - `agendamentos` - Agendamentos de consultas
  - `payments` - Pagamentos PIX
  - `divorce_cases` - Casos de divórcio

## 🐛 Debugging e Logs

### Níveis de Log
- **ERROR**: Erros críticos que quebram funcionalidade
- **WARN**: Avisos importantes
- **INFO**: Informações relevantes (pagamentos, auth)
- **DEBUG**: Detalhes técnicos (removidos em produção)

### Console Logs
- Usar prefixos emoji para identificação rápida
- Evitar logs excessivos em produção
- Logs de erro sempre em inglês
- Mensagens em português para UX

## 📈 Boas Práticas

### Performance
- Usar `React.memo` para componentes pesados
- Lazy loading para rotas
- Otimização de imagens
- Minimizar re-renders

### Segurança
- Validar inputs no frontend e backend
- Sanitizar dados antes de enviar
- Usar HTTPS em produção
- Proteger rotas sensíveis

### Acessibilidade
- Usar semântica HTML correta
- Labels em formulários
- Contraste de cores adequado
- Navegação por teclado

## 🎯 Metas e Prioridades

1. **Alta Prioridade**: Estabilidade do checkout PIX
2. **Média Prioridade**: Melhorar UX/UI
3. **Baixa Prioridade**: Novos recursos (chat, notificações)

## 📞 Suporte e Contato

Para dúvidas sobre o projeto:
- Verificar documentação inline no código
- Consultar issues no repositório
- Revisar commits recentes para contexto

---

**Última atualização**: Agosto 2025
**Mantido por**: Equipe SalaSegura</content>
<parameter name="filePath">/Users/vandessonsantiago/Documents/salasegura/.cursorrules
