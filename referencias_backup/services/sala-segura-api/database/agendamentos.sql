-- Tabela de Agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  horario TIME NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED')),
  payment_id VARCHAR(255),
  payment_status VARCHAR(20) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'OVERDUE', 'REFUNDED')),
  valor DECIMAL(10,2) NOT NULL,
  descricao TEXT NOT NULL,
  cliente_nome VARCHAR(255) NOT NULL,
  cliente_email VARCHAR(255) NOT NULL,
  cliente_telefone VARCHAR(20) NOT NULL,
  qr_code_pix TEXT,
  copy_paste_pix TEXT,
  pix_expires_at TIMESTAMP WITH TIME ZONE,
  calendar_event_id VARCHAR(255),
  google_meet_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_agendamentos_user_id ON agendamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_agendamentos_payment_id ON agendamentos(payment_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_created_at ON agendamentos(created_at);
CREATE INDEX IF NOT EXISTS idx_agendamentos_calendar_event_id ON agendamentos(calendar_event_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_agendamentos_updated_at 
  BEFORE UPDATE ON agendamentos 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver seus próprios agendamentos
CREATE POLICY "Users can view own agendamentos" ON agendamentos
  FOR SELECT USING (auth.uid() = user_id);

-- Política: usuários só podem inserir seus próprios agendamentos
CREATE POLICY "Users can insert own agendamentos" ON agendamentos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: usuários só podem atualizar seus próprios agendamentos
CREATE POLICY "Users can update own agendamentos" ON agendamentos
  FOR UPDATE USING (auth.uid() = user_id);

-- Política: usuários só podem deletar seus próprios agendamentos
CREATE POLICY "Users can delete own agendamentos" ON agendamentos
  FOR DELETE USING (auth.uid() = user_id);

-- Função para cancelar agendamentos expirados (24h sem pagamento)
CREATE OR REPLACE FUNCTION cancel_expired_agendamentos()
RETURNS void AS $$
BEGIN
  UPDATE agendamentos 
  SET 
    status = 'EXPIRED',
    payment_status = 'EXPIRED',
    updated_at = NOW()
  WHERE 
    status = 'PENDING' 
    AND payment_status = 'PENDING'
    AND pix_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Agendar execução da função para cancelar agendamentos expirados (a cada hora)
-- SELECT cron.schedule('cancel-expired-agendamentos', '0 * * * *', 'SELECT cancel_expired_agendamentos();');
