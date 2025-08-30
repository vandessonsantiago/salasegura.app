-- Remove problematic check constraint from divorce_cases table
-- Migration: 20250829000003_remove_divorce_cases_check_constraint.sql

-- Remove the problematic check constraint if it exists
DO $$
BEGIN
    -- Try to drop the constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'divorce_cases_type_check'
        AND table_name = 'divorce_cases'
    ) THEN
        ALTER TABLE divorce_cases DROP CONSTRAINT divorce_cases_type_check;
    END IF;

    -- Also try to drop any status check constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'divorce_cases_status_check'
        AND table_name = 'divorce_cases'
    ) THEN
        ALTER TABLE divorce_cases DROP CONSTRAINT divorce_cases_status_check;
    END IF;
END $$;
