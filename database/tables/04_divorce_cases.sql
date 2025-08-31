-- =====================================================
-- TABLE: divorce_cases
-- Description: Divorce service cases table
-- Dependencies: users, payments
-- =====================================================

CREATE TABLE IF NOT EXISTS divorce_cases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text,
  type text NOT NULL DEFAULT 'traditional'::text,
  status text NOT NULL DEFAULT 'pending_payment'::text,
  payment_id uuid,
  valor decimal(10,2) NOT NULL DEFAULT 759.00,
  cliente_nome text,
  cliente_email text,
  cliente_telefone text,
  cliente_cpf text,
  conjuge_nome text,
  conjuge_email text,
  conjuge_telefone text,
  conjuge_cpf text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  qr_code_pix text,
  copy_paste_pix text,
  pix_expires_at timestamp with time zone,
  service_data jsonb DEFAULT '{}',
  CONSTRAINT divorce_cases_pkey PRIMARY KEY (id),
  CONSTRAINT divorce_cases_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT divorce_cases_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES payments(id),
  CONSTRAINT divorce_cases_type_check CHECK (type IN ('traditional', 'express', 'consensual')),
  CONSTRAINT divorce_cases_status_check CHECK (status IN ('pending_payment', 'payment_received', 'in_progress', 'completed', 'cancelled'))
);

-- Indexes for divorce_cases table
CREATE INDEX IF NOT EXISTS idx_divorce_cases_user_id ON divorce_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_divorce_cases_cliente_email ON divorce_cases(cliente_email);
CREATE INDEX IF NOT EXISTS idx_divorce_cases_cliente_telefone ON divorce_cases(cliente_telefone);
CREATE INDEX IF NOT EXISTS idx_divorce_cases_status ON divorce_cases(status);
CREATE INDEX IF NOT EXISTS idx_divorce_cases_payment_id ON divorce_cases(payment_id);

-- RLS Policies for divorce_cases table
ALTER TABLE divorce_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own divorce cases" ON divorce_cases FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert their own divorce cases" ON divorce_cases FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update their own divorce cases" ON divorce_cases FOR UPDATE USING (auth.uid()::text = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_divorce_cases_updated_at BEFORE UPDATE ON divorce_cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
