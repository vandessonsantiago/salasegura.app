-- =====================================================
-- MIGRATION: Add unique constraints to agendamentos table
-- Description: Prevent duplicate appointments and payment_ids
-- Date: 2025-08-31
-- =====================================================

-- First, clean up any existing duplicates (if any)
-- This will keep the most recent agendamento for each user/date/time combination
DELETE FROM agendamentos a1
WHERE a1.id NOT IN (
  SELECT DISTINCT ON (user_id, data, horario) id
  FROM agendamentos
  ORDER BY user_id, data, horario, created_at DESC
);

-- Clean up duplicate payment_ids (keep the most recent)
DELETE FROM agendamentos a1
WHERE a1.payment_id IS NOT NULL
  AND a1.id NOT IN (
    SELECT DISTINCT ON (payment_id) id
    FROM agendamentos
    WHERE payment_id IS NOT NULL
    ORDER BY payment_id, created_at DESC
  );

-- Now add the unique constraints
ALTER TABLE agendamentos
ADD CONSTRAINT agendamentos_unique_user_date_time UNIQUE (user_id, data, horario);

ALTER TABLE agendamentos
ADD CONSTRAINT agendamentos_unique_payment_id UNIQUE (payment_id);

-- Add index for better performance on the unique constraints
CREATE INDEX IF NOT EXISTS idx_agendamentos_user_date_time ON agendamentos(user_id, data, horario);
CREATE INDEX IF NOT EXISTS idx_agendamentos_payment_id_unique ON agendamentos(payment_id);

-- Log the migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Unique constraints added to agendamentos table';
END $$;
