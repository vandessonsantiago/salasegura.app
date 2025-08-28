-- =====================================================
-- DATABASE CLEANUP SCRIPTS - VERSÃO CORRIGIDA
-- =====================================================

-- ✅ CORRIGIDO: Erro de referência ambígua resolvido
-- ✅ CORRIGIDO: Scripts duplicados removidos
-- ✅ CORRIGIDO: Lógica mais segura implementada

-- Este arquivo contém dois scripts:
-- 1. VERIFICAÇÃO: Mostra quais tabelas existem (execute primeiro)
-- 2. LIMPEZA: Remove tabelas não essenciais (execute depois)

-- ⚠️  IMPORTANTE:
-- - Execute a VERIFICAÇÃO primeiro para ver o que você tem
-- - Só execute a LIMPEZA se estiver satisfeito com as tabelas opcionais
-- - As tabelas essenciais NUNCA serão removidas

-- =====================================================
-- 1. SCRIPT DE VERIFICAÇÃO - APENAS MOSTRA TABELAS EXISTENTES
-- =====================================================

DO $$
DECLARE
    table_record RECORD;
    table_count INTEGER := 0;
    essential_tables TEXT[] := ARRAY[
        'users', 'user_profiles', 'agendamentos', 'payments',
        'conversions', 'checklist_sessions', 'checklist_items',
        'app_settings', 'asaas_webhook_config', 'asaas_webhook_logs', 'webhook_logs'
    ];
    optional_tables TEXT[] := ARRAY['_prisma_migrations', 'user_sessions', 'activity_logs'];
BEGIN
    RAISE NOTICE '📊 VERIFICAÇÃO DE TABELAS EXISTENTES:';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';

    FOR table_record IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        table_count := table_count + 1;

        -- Verificar se é tabela essencial ou opcional
        IF table_record.tablename = ANY(essential_tables) THEN
            RAISE NOTICE '%d. ✅ % (ESSENCIAL)', table_count, table_record.tablename;
        ELSIF table_record.tablename = ANY(optional_tables) THEN
            RAISE NOTICE '%d. ❌ % (OPCIONAL)', table_count, table_record.tablename;
        ELSE
            RAISE NOTICE '%d. ❓ % (DESCONHECIDA)', table_count, table_record.tablename;
        END IF;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '📋 Você tem % tabelas no total', table_count;
    RAISE NOTICE '';
    RAISE NOTICE '🎯 RECOMENDAÇÕES:';
    RAISE NOTICE '   ✅ Mantenha todas as tabelas marcadas com ESSENCIAL';
    RAISE NOTICE '   ❌ Considere remover tabelas marcadas com OPCIONAL';
    RAISE NOTICE '   ❓ Verifique tabelas marcadas com DESCONHECIDA';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Execute o script de limpeza se quiser remover as opcionais';
END $$;

-- =====================================================
-- =====================================================
-- =====================================================
-- 2. SCRIPT DE LIMPEZA - REMOVE TABELAS NÃO ESSENCIAIS
-- =====================================================
-- =====================================================
-- =====================================================

-- ⚠️  ATENÇÃO: Este script remove tabelas não essenciais!
-- Execute apenas se estiver satisfeito com a verificação acima

DO $$
DECLARE
    table_name_to_check TEXT;
    table_count INTEGER := 0;
    table_record RECORD;
    tables_to_remove TEXT[] := ARRAY['_prisma_migrations', 'user_sessions', 'activity_logs'];
BEGIN
    RAISE NOTICE '🧹 INICIANDO LIMPEZA SELETIVA...';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';

    -- Mostrar tabelas atuais antes da limpeza
    RAISE NOTICE '📊 TABELAS ATUAIS ANTES DA LIMPEZA:';
    RAISE NOTICE '==========================================';

    FOR table_record IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        table_count := table_count + 1;
        RAISE NOTICE '%d. %', table_count, table_record.tablename;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '🎯 VERIFICANDO TABELAS PARA REMOÇÃO...';
    RAISE NOTICE '==========================================';

    FOREACH table_name_to_check IN ARRAY tables_to_remove
    LOOP
        IF EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = table_name_to_check
        ) THEN
            EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', table_name_to_check);
            RAISE NOTICE '✅ Tabela % removida', table_name_to_check;
        ELSE
            RAISE NOTICE 'ℹ️  Tabela % não existe (pulando)', table_name_to_check;
        END IF;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '🎯 REMOVENDO ÍNDICES DESNECESSÁRIOS...';
    RAISE NOTICE '==========================================';

    -- Remover índices relacionados às tabelas removidas
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_logs') THEN
        DROP INDEX IF EXISTS idx_activity_logs_user_id;
        DROP INDEX IF EXISTS idx_activity_logs_created_at;
        RAISE NOTICE '✅ Índices de activity_logs removidos';
    END IF;

    -- Mostrar tabelas restantes
    RAISE NOTICE '📊 TABELAS RESTANTES APÓS LIMPEZA:';
    RAISE NOTICE '==========================================';

    table_count := 0;
    FOR table_record IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        table_count := table_count + 1;
        RAISE NOTICE '%d. %', table_count, table_record.tablename;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '🎉 LIMPEZA FINALIZADA COM SUCESSO!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 RESUMO DA LIMPEZA:';
    RAISE NOTICE '   ✅ Tabelas não essenciais removidas com segurança';
    RAISE NOTICE '   ✅ Todas as tabelas essenciais preservadas';
    RAISE NOTICE '   ✅ Índices relacionados removidos';
    RAISE NOTICE '   ✅ Sistema mais limpo e eficiente';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 PRÓXIMOS PASSOS:';
    RAISE NOTICE '   1. Execute seus scripts principais (supabase_schema.sql, etc.)';
    RAISE NOTICE '   2. Teste a integração com test_integration.sql';
    RAISE NOTICE '   3. Configure webhooks no Asaas';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- FIM DOS SCRIPTS DE LIMPEZA
-- =====================================================

-- 🎯 RESUMO:
-- Execute primeiro o Script 1 (verificação) para ver suas tabelas
-- Depois execute o Script 2 (limpeza) se quiser remover opcionais
-- Suas tabelas essenciais estarão sempre seguras!

-- Criar tabela para armazenar casos de divórcio
CREATE TABLE IF NOT EXISTS divorce_cases (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'draft',
    type TEXT NOT NULL CHECK (type IN ('extrajudicial', 'judicial')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice para melhorar consultas por usuário
CREATE INDEX IF NOT EXISTS idx_divorce_cases_user_id ON divorce_cases (user_id);

-- Índice para melhorar consultas por status
CREATE INDEX IF NOT EXISTS idx_divorce_cases_status ON divorce_cases (status);
