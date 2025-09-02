#!/bin/bash

# 🚀 SCRIPT DE MIGRAÇÃO AUTOMATIZADA - MÓDULO PAYMENTS
# Data: 01 de setembro de 2025
# Versão: 1.0

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função de log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se estamos no diretório correto
check_directory() {
    if [ ! -f "package.json" ] || [ ! -d "apps/api/src" ]; then
        error "Diretório incorreto. Execute este script na raiz do projeto."
        exit 1
    fi
    success "Diretório correto detectado"
}

# Backup dos arquivos originais
backup_files() {
    log "Criando backup dos arquivos..."

    mkdir -p backup/payments_migration

    # Arquivos que serão modificados
    files_to_backup=(
        "apps/api/src/services/WebhookService.ts"
        "apps/api/src/agendamentos/services/AgendamentoService.ts"
        "apps/api/src/routes/checkout.ts"
        "apps/api/src/routes/index.ts"
        "apps/api/src/app.ts"
    )

    for file in "${files_to_backup[@]}"; do
        if [ -f "$file" ]; then
            cp "$file" "backup/payments_migration/$(basename "$file" .ts)_backup.ts"
            success "Backup criado: $file"
        else
            warning "Arquivo não encontrado: $file"
        fi
    done
}

# Atualizar imports no WebhookService
update_webhook_service() {
    log "Atualizando WebhookService.ts..."

    file="apps/api/src/services/WebhookService.ts"

    if [ ! -f "$file" ]; then
        warning "Arquivo WebhookService.ts não encontrado, pulando..."
        return
    fi

    # Atualizar import
    sed -i.bak 's|import { PaymentService } from '\''./PaymentService'\'';|import { PaymentService } from '\''../payments/services/PaymentService'\'';|g' "$file"

    success "WebhookService.ts atualizado"
}

# Atualizar imports no AgendamentoService
update_agendamento_service() {
    log "Atualizando AgendamentoService.ts..."

    file="apps/api/src/agendamentos/services/AgendamentoService.ts"

    if [ ! -f "$file" ]; then
        warning "Arquivo AgendamentoService.ts não encontrado, pulando..."
        return
    fi

    # Atualizar import
    sed -i.bak 's|import { PaymentService } from '\''../../services/PaymentService'\'';|import { PaymentService } from '\''../../payments/services/PaymentService'\'';|g' "$file"

    success "AgendamentoService.ts atualizado"
}

# Atualizar imports nas rotas de checkout
update_checkout_routes() {
    log "Atualizando checkout.ts routes..."

    file="apps/api/src/routes/checkout.ts"

    if [ ! -f "$file" ]; then
        warning "Arquivo checkout.ts não encontrado, pulando..."
        return
    fi

    # Atualizar import
    sed -i.bak 's|import { CheckoutService } from '\''../services/CheckoutService'\'';|import { CheckoutService } from '\''../payments/services/CheckoutService'\'';|g' "$file"

    success "checkout.ts atualizado"
}

# Registrar novas rotas
update_routes_index() {
    log "Atualizando routes/index.ts..."

    file="apps/api/src/routes/index.ts"

    if [ ! -f "$file" ]; then
        warning "Arquivo routes/index.ts não encontrado, pulando..."
        return
    fi

    # Adicionar import do PaymentRoutes
    if ! grep -q "PaymentRoutes" "$file"; then
        sed -i.bak 's|import { DivorceRoutes } from "../divorce";|import { DivorceRoutes } from "../divorce";\nimport { PaymentRoutes } from "../payments";|g' "$file"
        success "Import PaymentRoutes adicionado"
    else
        success "Import PaymentRoutes já existe"
    fi

    # Registrar rota
    if ! grep -q "PaymentRoutes" "$file"; then
        sed -i.bak 's|router.use("/divorcio", DivorceRoutes);|router.use("/divorcio", DivorceRoutes);\nrouter.use("/payments", PaymentRoutes);|g' "$file"
        success "Rota /payments registrada"
    else
        success "Rota /payments já registrada"
    fi
}

# Verificar build
check_build() {
    log "Verificando build..."

    cd apps/api

    if npm run build 2>/dev/null; then
        success "Build passou com sucesso!"
        cd ../..
        return 0
    else
        error "Build falhou! Verifique os erros acima."
        cd ../..
        return 1
    fi
}

# Testes básicos
run_basic_tests() {
    log "Executando testes básicos..."

    # Verificar se os módulos podem ser importados
    node -e "
    try {
        const { PaymentService } = require('./apps/api/src/payments');
        const { CheckoutService } = require('./apps/api/src/payments');
        const { AsaasService } = require('./apps/api/src/payments');
        console.log('✅ Todos os módulos podem ser importados');
    } catch (error) {
        console.error('❌ Erro ao importar módulos:', error.message);
        process.exit(1);
    }
    "

    if [ $? -eq 0 ]; then
        success "Testes básicos passaram!"
    else
        error "Testes básicos falharam!"
        return 1
    fi
}

# Menu principal
show_menu() {
    echo
    echo "========================================"
    echo "🚀 MIGRAÇÃO MÓDULO PAYMENTS"
    echo "========================================"
    echo
    echo "Escolha uma opção:"
    echo "1) Executar migração completa"
    echo "2) Apenas atualizar imports"
    echo "3) Apenas verificar build"
    echo "4) Criar backup"
    echo "5) Sair"
    echo
    read -p "Opção: " choice
}

# Migração completa
full_migration() {
    log "🚀 INICIANDO MIGRAÇÃO COMPLETA"

    check_directory
    backup_files
    update_webhook_service
    update_agendamento_service
    update_checkout_routes
    update_routes_index

    echo
    if check_build && run_basic_tests; then
        success "🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!"
        echo
        warning "📋 PRÓXIMOS PASSOS:"
        echo "1. Teste as funcionalidades críticas manualmente"
        echo "2. Execute os testes de integração"
        echo "3. Faça deploy em staging"
        echo "4. Monitore por 24h antes do deploy em produção"
    else
        error "❌ MIGRAÇÃO FALHOU! Verifique os erros acima."
        echo
        warning "🔄 PARA FAZER ROLLBACK:"
        echo "1. Execute: git checkout HEAD~1"
        echo "2. Ou restaure os arquivos do diretório backup/"
    fi
}

# Apenas atualizar imports
update_imports_only() {
    log "🔄 ATUALIZANDO APENAS IMPORTS"

    check_directory
    backup_files
    update_webhook_service
    update_agendamento_service
    update_checkout_routes

    if check_build; then
        success "✅ Imports atualizados com sucesso!"
    else
        error "❌ Erro ao atualizar imports!"
    fi
}

# Apenas verificar build
build_only() {
    log "🔍 VERIFICANDO BUILD"

    check_directory

    if check_build; then
        success "✅ Build está funcionando!"
    else
        error "❌ Build com problemas!"
    fi
}

# Apenas backup
backup_only() {
    log "📦 CRIANDO BACKUP"

    check_directory
    backup_files
    success "✅ Backup criado em backup/payments_migration/"
}

# Loop principal
while true; do
    show_menu

    case $choice in
        1)
            full_migration
            break
            ;;
        2)
            update_imports_only
            ;;
        3)
            build_only
            ;;
        4)
            backup_only
            ;;
        5)
            log "Saindo..."
            exit 0
            ;;
        *)
            error "Opção inválida!"
            ;;
    esac

    echo
    read -p "Pressione Enter para continuar..."
done
