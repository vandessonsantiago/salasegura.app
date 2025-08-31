-- =====================================================
-- TABLE: agendamentos
-- Description: Appointments and scheduling table
-- Dependencies: users, payments
-- =====================================================

CREATE TABLE IF NOT EXISTS agendamentos (
  id text NOT NULL,
  user_id text,
  data date NOT NULL,
  horario time NOT NULL,
  status text DEFAULT 'pending'::text,
  payment_id text,
  payment_status text DEFAULT 'pending'::text,
  valor decimal(10,2) DEFAULT 99.00,
  descricao text,
  cliente_nome text,
  cliente_email text,
  cliente_telefone text,
  qr_code_pix text,
  copy_paste_pix text,
  pix_expires_at timestamp with time zone,
  calendar_event_id text,
  google_meet_link text,
  google_meet_link_type text DEFAULT 'string'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  service_data jsonb DEFAULT '{}',
  service_type text,
  CONSTRAINT agendamentos_pkey PRIMARY KEY (id),
  CONSTRAINT agendamentos_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT agendamentos_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES payments(asaas_id),
  -- 🔧 CORREÇÃO: Adicionar constraints únicos para prevenir duplicatas
  CONSTRAINT agendamentos_unique_user_date_time UNIQUE (user_id, data, horario),
  CONSTRAINT agendamentos_unique_payment_id UNIQUE (payment_id)
);

-- Indexes for agendamentos table
CREATE INDEX IF NOT EXISTS idx_agendamentos_user_id ON agendamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_horario ON agendamentos(data, horario);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_agendamentos_payment_id ON agendamentos(payment_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente_email ON agendamentos(cliente_email);

-- RLS Policies for agendamentos table
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agendamentos" ON agendamentos FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert their own agendamentos" ON agendamentos FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update their own agendamentos" ON agendamentos FOR UPDATE USING (auth.uid()::text = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_agendamentos_updated_at BEFORE UPDATE ON agendamentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
