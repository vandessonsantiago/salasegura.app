# API - SalaSegura

API backend do projeto SalaSegura construída com Node.js, Express e TypeScript.

## 🏗️ Estrutura do Projeto

```
src/
├── config/               # Configurações (banco de dados, variáveis de ambiente)
│   ├── app.ts           # Configurações da aplicação
│   └── database.ts      # Configurações do banco de dados
├── controllers/          # Lógica de controle (manipula requisições e respostas)
│   ├── healthController.ts
│   └── messageController.ts
├── models/              # Modelos de dados e interfaces
│   └── index.ts
├── routes/              # Definição de rotas da API
│   ├── index.ts         # Rotas principais
│   ├── healthRoutes.ts
│   └── messageRoutes.ts
├── services/            # Lógica de negócios
│   ├── healthService.ts
│   └── messageService.ts
├── middleware/          # Middlewares (autenticação, validação, etc.)
│   ├── errorHandler.ts
│   └── requestLogger.ts
├── __tests__/           # Testes
│   └── server.test.ts
├── app.ts              # Configuração do Express
└── index.ts            # Arquivo principal da aplicação
```

## 🚀 Como usar

### Desenvolvimento
```bash
pnpm run dev
```

### Build
```bash
pnpm run build
```

### Testes
```bash
pnpm run test
```

## 📡 Endpoints

### Health Check
- `GET /api/health/status` - Status da aplicação

### Mensagens
- `GET /api/message/:name` - Retorna saudação personalizada

### Endpoints Legados (para compatibilidade)
- `GET /status` - Redireciona para `/api/health/status`
- `GET /message/:name` - Redireciona para `/api/message/:name`

## 🔧 Configuração

As configurações são gerenciadas através de variáveis de ambiente no arquivo `.env`:

- `PORT` - Porta do servidor (padrão: 3001)
- `NODE_ENV` - Ambiente (development/production)
- `LOG_LEVEL` - Nível de log

## 🧪 Testes

Os testes estão localizados em `src/__tests__/` e podem ser executados com:

```bash
pnpm run test
```

## 📦 Scripts Disponíveis

- `dev` - Inicia servidor em modo desenvolvimento com watch
- `build` - Compila TypeScript para JavaScript
- `start` - Inicia servidor em modo produção
- `test` - Executa testes
- `lint` - Executa linting
- `check-types` - Verifica tipos TypeScript
