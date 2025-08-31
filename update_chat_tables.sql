-- Script SQL para atualizar a tabela chat_conversations
-- Execute este script no seu banco Supabase para sincronizar a estrutura

-- Verificar se a coluna title existe, se não existir, adicioná-la
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'chat_conversations'
        AND column_name = 'title'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.chat_conversations ADD COLUMN title TEXT NULL;
        RAISE NOTICE 'Coluna title adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna title já existe, pulando...';
    END IF;
END $$;

-- Verificar se a coluna role existe na tabela chat_messages, se não existir, renomear sender
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'chat_messages'
        AND column_name = 'role'
        AND table_schema = 'public'
    ) THEN
        -- Renomear coluna sender para role se ela existir
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'chat_messages'
            AND column_name = 'sender'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.chat_messages RENAME COLUMN sender TO role;
            RAISE NOTICE 'Coluna sender renomeada para role com sucesso';
        ELSE
            -- Se nenhuma das colunas existir, adicionar role
            ALTER TABLE public.chat_messages ADD COLUMN role VARCHAR(32) NOT NULL DEFAULT 'user';
            RAISE NOTICE 'Coluna role adicionada com sucesso';
        END IF;
    ELSE
        RAISE NOTICE 'Coluna role já existe, pulando...';
    END IF;
END $$;

-- Verificar se a foreign key constraint existe, se não existir, adicioná-la
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'chat_conversations_user_id_fkey'
        AND table_name = 'chat_conversations'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.chat_conversations
        ADD CONSTRAINT chat_conversations_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id);
        RAISE NOTICE 'Foreign key constraint adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Foreign key constraint já existe, pulando...';
    END IF;
END $$;

-- Verificar se o trigger existe, se não existir, criá-lo
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.triggers
        WHERE trigger_name = 'update_chat_conversations_updated_at'
        AND event_object_table = 'chat_conversations'
        AND event_object_schema = 'public'
    ) THEN
        CREATE TRIGGER update_chat_conversations_updated_at
            BEFORE UPDATE ON public.chat_conversations
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Trigger update_chat_conversations_updated_at criado com sucesso';
    ELSE
        RAISE NOTICE 'Trigger update_chat_conversations_updated_at já existe, pulando...';
    END IF;
END $$;

-- Verificar se o índice existe, se não existir, criá-lo
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'chat_conversations'
        AND indexname = 'idx_chat_conversations_user_id'
        AND schemaname = 'public'
    ) THEN
        CREATE INDEX idx_chat_conversations_user_id
        ON public.chat_conversations USING btree (user_id);
        RAISE NOTICE 'Índice idx_chat_conversations_user_id criado com sucesso';
    ELSE
        RAISE NOTICE 'Índice idx_chat_conversations_user_id já existe, pulando...';
    END IF;
END $$;

-- Verificar estrutura final da tabela
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'chat_conversations'
AND table_schema = 'public'
ORDER BY ordinal_position;
