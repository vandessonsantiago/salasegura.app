-- Fix divorce_cases table structure (only constraints and defaults)
-- Migration: 20250829000002_fix_divorce_cases_structure.sql

-- Only fix constraints and defaults, don't recreate the table
DO $$
BEGIN
    -- Remove problematic check constraints if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'divorce_cases_type_check'
        AND table_name = 'divorce_cases'
    ) THEN
        ALTER TABLE divorce_cases DROP CONSTRAINT divorce_cases_type_check;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'divorce_cases_status_check'
        AND table_name = 'divorce_cases'
    ) THEN
        ALTER TABLE divorce_cases DROP CONSTRAINT divorce_cases_status_check;
    END IF;

    -- Fix payment_id type from UUID to TEXT to accept Asaas payment IDs
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'divorce_cases' AND column_name = 'payment_id'
    ) THEN
        -- Drop foreign key constraint if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'divorce_cases_payment_id_fkey'
        ) THEN
            ALTER TABLE divorce_cases DROP CONSTRAINT divorce_cases_payment_id_fkey;
        END IF;
        
        -- Change column type from UUID to TEXT
        ALTER TABLE divorce_cases ALTER COLUMN payment_id TYPE TEXT;
    END IF;

    -- Set defaults if columns exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'divorce_cases' AND column_name = 'type'
    ) THEN
        ALTER TABLE divorce_cases ALTER COLUMN type SET DEFAULT 'express';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'divorce_cases' AND column_name = 'status'
    ) THEN
        ALTER TABLE divorce_cases ALTER COLUMN status SET DEFAULT 'pending_payment';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'divorce_cases' AND column_name = 'valor'
    ) THEN
        ALTER TABLE divorce_cases ALTER COLUMN valor SET DEFAULT 759.00;
    END IF;
END $$;
