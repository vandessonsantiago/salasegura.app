-- Create divorce_cases table
-- Migration: 20250829000000_create_divorce_cases_table.sql

-- Create divorce_cases table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS divorce_cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'express',
  status TEXT NOT NULL DEFAULT 'pending_payment',
  payment_id UUID REFERENCES payments(id),
  valor DECIMAL(10,2) NOT NULL DEFAULT 759.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  qr_code_pix TEXT,
  copy_paste_pix TEXT,
  pix_expires_at TIMESTAMPTZ
);

-- Add payment_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'divorce_cases' AND column_name = 'payment_id') THEN
    ALTER TABLE divorce_cases ADD COLUMN payment_id UUID REFERENCES payments(id);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_divorce_cases_user_id ON divorce_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_divorce_cases_status ON divorce_cases(status);
CREATE INDEX IF NOT EXISTS idx_divorce_cases_payment_id ON divorce_cases(payment_id);

-- Enable Row Level Security (RLS)
ALTER TABLE divorce_cases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own divorce cases" ON divorce_cases;
DROP POLICY IF EXISTS "Users can insert their own divorce cases" ON divorce_cases;
DROP POLICY IF EXISTS "Users can update their own divorce cases" ON divorce_cases;

-- Create RLS policies for divorce_cases
CREATE POLICY "Users can view their own divorce cases" ON divorce_cases
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own divorce cases" ON divorce_cases
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own divorce cases" ON divorce_cases
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_divorce_cases_updated_at ON divorce_cases;
CREATE TRIGGER update_divorce_cases_updated_at
  BEFORE UPDATE ON divorce_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
