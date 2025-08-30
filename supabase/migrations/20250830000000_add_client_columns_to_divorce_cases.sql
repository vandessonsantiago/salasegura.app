-- Add missing client columns to divorce_cases table
-- Migration: 20250830000000_add_client_columns_to_divorce_cases.sql

-- Add cliente_nome column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'divorce_cases' AND column_name = 'cliente_nome') THEN
    ALTER TABLE divorce_cases ADD COLUMN cliente_nome TEXT;
  END IF;
END $$;

-- Add cliente_email column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'divorce_cases' AND column_name = 'cliente_email') THEN
    ALTER TABLE divorce_cases ADD COLUMN cliente_email TEXT;
  END IF;
END $$;

-- Add cliente_telefone column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'divorce_cases' AND column_name = 'cliente_telefone') THEN
    ALTER TABLE divorce_cases ADD COLUMN cliente_telefone TEXT;
  END IF;
END $$;

-- Add service_data column if it doesn't exist (JSONB for flexible data storage)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'divorce_cases' AND column_name = 'service_data') THEN
    ALTER TABLE divorce_cases ADD COLUMN service_data JSONB;
  END IF;
END $$;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_divorce_cases_cliente_email ON divorce_cases(cliente_email);
CREATE INDEX IF NOT EXISTS idx_divorce_cases_cliente_telefone ON divorce_cases(cliente_telefone);
