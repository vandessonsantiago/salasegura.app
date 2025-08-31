-- =====================================================
-- SUPABASE MIGRATION (SAFE VERSION): Add unique constraints to agendamentos table
-- Description: Safe version that doesn't delete data automatically
-- Execute this script in Supabase SQL Editor
-- Date: 2025-08-31
-- =====================================================

-- Step 1: Check for existing duplicates (this will help you decide what to do)
DO $$
DECLARE
    total_count INTEGER;
    duplicate_user_date_time_count INTEGER;
    duplicate_payment_id_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM agendamentos;
    RAISE NOTICE 'Total agendamentos: %', total_count;

    -- Check for duplicates by user/date/time
    SELECT COUNT(*) INTO duplicate_user_date_time_count
    FROM (
        SELECT user_id, data, horario, COUNT(*) as count
        FROM agendamentos
        WHERE user_id IS NOT NULL
        GROUP BY user_id, data, horario
        HAVING COUNT(*) > 1
    ) duplicates;

    RAISE NOTICE 'Duplicate user/date/time combinations found: %', duplicate_user_date_time_count;

    -- Check for duplicates by payment_id
    SELECT COUNT(*) INTO duplicate_payment_id_count
    FROM (
        SELECT payment_id, COUNT(*) as count
        FROM agendamentos
        WHERE payment_id IS NOT NULL
        GROUP BY payment_id
        HAVING COUNT(*) > 1
    ) duplicates;

    RAISE NOTICE 'Duplicate payment_ids found: %', duplicate_payment_id_count;

    -- Show some examples of duplicates
    IF duplicate_user_date_time_count > 0 THEN
        RAISE NOTICE 'Examples of user/date/time duplicates:';
        FOR duplicate_record IN
            SELECT user_id, data, horario, COUNT(*) as count,
                   array_agg(id ORDER BY created_at DESC) as ids
            FROM agendamentos
            WHERE user_id IS NOT NULL
            GROUP BY user_id, data, horario
            HAVING COUNT(*) > 1
            LIMIT 5
        LOOP
            RAISE NOTICE '  User: %, Date: %, Time: %, Count: %, IDs: %',
                        duplicate_record.user_id, duplicate_record.data,
                        duplicate_record.horario, duplicate_record.count,
                        duplicate_record.ids;
        END LOOP;
    END IF;

    IF duplicate_payment_id_count > 0 THEN
        RAISE NOTICE 'Examples of payment_id duplicates:';
        FOR duplicate_record IN
            SELECT payment_id, COUNT(*) as count,
                   array_agg(id ORDER BY created_at DESC) as ids
            FROM agendamentos
            WHERE payment_id IS NOT NULL
            GROUP BY payment_id
            HAVING COUNT(*) > 1
            LIMIT 5
        LOOP
            RAISE NOTICE '  Payment ID: %, Count: %, IDs: %',
                        duplicate_record.payment_id, duplicate_record.count,
                        duplicate_record.ids;
        END LOOP;
    END IF;
END $$;

-- Step 2: If you want to proceed with automatic cleanup, uncomment the following blocks:

-- /*
-- CLEANUP BLOCK 1: Remove duplicate user/date/time combinations
-- Keeps the most recent agendamento for each combination
DELETE FROM agendamentos a1
WHERE a1.id NOT IN (
    SELECT DISTINCT ON (user_id, data, horario) id
    FROM agendamentos
    WHERE user_id IS NOT NULL
    ORDER BY user_id, data, horario, created_at DESC
);

-- CLEANUP BLOCK 2: Remove duplicate payment_ids
-- Keeps the most recent agendamento for each payment_id
DELETE FROM agendamentos a1
WHERE a1.payment_id IS NOT NULL
    AND a1.id NOT IN (
        SELECT DISTINCT ON (payment_id) id
        FROM agendamentos
        WHERE payment_id IS NOT NULL
        ORDER BY payment_id, created_at DESC
    );
-- */

-- Step 3: Add unique constraints (only if no duplicates remain)
-- ALTER TABLE agendamentos
-- ADD CONSTRAINT agendamentos_unique_user_date_time UNIQUE (user_id, data, horario);

-- ALTER TABLE agendamentos
-- ADD CONSTRAINT agendamentos_unique_payment_id UNIQUE (payment_id);

-- Step 4: Add performance indexes
-- CREATE INDEX IF NOT EXISTS idx_agendamentos_user_date_time ON agendamentos(user_id, data, horario);
-- CREATE INDEX IF NOT EXISTS idx_agendamentos_payment_id_unique ON agendamentos(payment_id);

-- Step 5: Final verification
DO $$
DECLARE
    final_count INTEGER;
    constraints_added BOOLEAN := false;
BEGIN
    SELECT COUNT(*) INTO final_count FROM agendamentos;
    RAISE NOTICE 'Final agendamentos count: %', final_count;

    -- Check if constraints were added
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'agendamentos'
        AND constraint_name = 'agendamentos_unique_user_date_time'
    ) INTO constraints_added;

    IF constraints_added THEN
        RAISE NOTICE '✅ Unique constraints successfully added!';
        RAISE NOTICE 'Duplicate prevention is now active!';
    ELSE
        RAISE NOTICE '⚠️  Constraints not yet added. Please run cleanup first.';
    END IF;
END $$;
