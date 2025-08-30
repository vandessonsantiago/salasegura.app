-- Fix payment_id type to accept Asaas payment IDs
-- Migration: 20250829000004_fix_payment_id_type.sql

-- Alter payment_id column from UUID to TEXT to accept Asaas payment IDs
ALTER TABLE divorce_cases ALTER COLUMN payment_id TYPE TEXT;

-- Update foreign key constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'divorce_cases_payment_id_fkey'
  ) THEN
    ALTER TABLE divorce_cases DROP CONSTRAINT divorce_cases_payment_id_fkey;
  END IF;
END $$;

-- Add comment explaining the change
COMMENT ON COLUMN divorce_cases.payment_id IS 'Payment ID from Asaas (not a UUID reference)';
