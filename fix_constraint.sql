-- Simple script to remove the problematic constraint
-- Execute this directly in Supabase SQL Editor

-- Remove the problematic check constraint
ALTER TABLE divorce_cases DROP CONSTRAINT IF EXISTS divorce_cases_type_check;

-- Optional: Add a new constraint with allowed values
-- ALTER TABLE divorce_cases ADD CONSTRAINT divorce_cases_type_check CHECK (type IN ('express', 'traditional', 'contested'));
