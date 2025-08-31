-- =====================================================
-- SUPABASE MIGRATION: Add unique constraints to agendamentos table
-- Description: Prevent duplicate appointments and payment_ids
-- Execute this script in Supabase SQL Editor
-- Date: 2025-08-31
-- =====================================================

-- Step 1: Create backup of current data (optional but recommended)
CREATE TABLE IF NOT EXISTS agendamentos_backup AS
SELECT * FROM agendamentos;

-- Step 2: Log current state
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
        SELECT user_id, data, horario, COUNT(*)
        FROM agendamentos
        WHERE user_id IS NOT NULL
        GROUP BY user_id, data, horario
        HAVING COUNT(*) > 1
    ) duplicates;

    RAISE NOTICE 'Duplicate user/date/time combinations: %', duplicate_user_date_time_count;

    -- Check for duplicates by payment_id
    SELECT COUNT(*) INTO duplicate_payment_id_count
    FROM (
        SELECT payment_id, COUNT(*)
        FROM agendamentos
        WHERE payment_id IS NOT NULL
        GROUP BY payment_id
        HAVING COUNT(*) > 1
    ) duplicates;

    RAISE NOTICE 'Duplicate payment_ids: %', duplicate_payment_id_count;
END $$;

-- Step 3: Clean up duplicate user/date/time combinations
-- Keep the most recent agendamento for each user/date/time
DELETE FROM agendamentos a1
WHERE a1.id NOT IN (
    SELECT DISTINCT ON (user_id, data, horario) id
    FROM agendamentos
    WHERE user_id IS NOT NULL
    ORDER BY user_id, data, horario, created_at DESC
);

-- Step 4: Clean up duplicate payment_ids
-- Keep the most recent agendamento for each payment_id
DELETE FROM agendamentos a1
WHERE a1.payment_id IS NOT NULL
    AND a1.id NOT IN (
        SELECT DISTINCT ON (payment_id) id
        FROM agendamentos
        WHERE payment_id IS NOT NULL
        ORDER BY payment_id, created_at DESC
    );

-- Step 5: Add unique constraints
ALTER TABLE agendamentos
ADD CONSTRAINT agendamentos_unique_user_date_time UNIQUE (user_id, data, horario);

ALTER TABLE agendamentos
ADD CONSTRAINT agendamentos_unique_payment_id UNIQUE (payment_id);

-- Step 6: Add performance indexes for the unique constraints
CREATE INDEX IF NOT EXISTS idx_agendamentos_user_date_time ON agendamentos(user_id, data, horario);
CREATE INDEX IF NOT EXISTS idx_agendamentos_payment_id_unique ON agendamentos(payment_id);

-- Step 7: Log completion
DO $$
DECLARE
    final_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO final_count FROM agendamentos;
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Final agendamentos count: %', final_count;
    RAISE NOTICE 'Unique constraints added:';
    RAISE NOTICE '  - agendamentos_unique_user_date_time';
    RAISE NOTICE '  - agendamentos_unique_payment_id';
    RAISE NOTICE 'Duplicate prevention is now active!';
END $$;
