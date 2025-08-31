-- =====================================================
-- TABLE: payments
-- Description: Core payment tracking table
-- Dependencies: users
-- =====================================================

-- =====================================================
-- TABLE: payments
-- Description: Core payment tracking table
-- Dependencies: users
-- =====================================================

CREATE TABLE IF NOT EXISTS payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  asaas_id text NOT NULL UNIQUE,
  status text NOT NULL,
  valor numeric(10,2),
  user_id text,
  agendamento_id text,
  divorce_case_id uuid,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT payments_divorce_case_id_fkey FOREIGN KEY (divorce_case_id) REFERENCES divorce_cases(id)
);

-- Indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_asaas_id ON payments(asaas_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_divorce_case_id ON payments(divorce_case_id);

-- RLS Policies for payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments" ON payments FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert their own payments" ON payments FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
