-- Recriar todas as tabelas do projeto Sala Segura
-- Script para restaurar o banco de dados após reset

-- 1. Criar tabela users (base)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Criar tabela payments (depende de users)
CREATE TABLE IF NOT EXISTS payments (
  id uuid default gen_random_uuid() primary key,
  asaas_id text not null,
  status text not null,
  valor numeric,
  user_id text references users(id),
  agendamento_id text,
  created_at timestamp default now()
);

-- 3. Criar tabela agendamentos (depende de users e payments)
CREATE TABLE IF NOT EXISTS agendamentos (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  data DATE NOT NULL,
  horario TIME NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  valor DECIMAL(10,2) DEFAULT 99.00,
  descricao TEXT,
  cliente_nome TEXT,
  cliente_email TEXT,
  cliente_telefone TEXT,
  qr_code_pix TEXT,
  copy_paste_pix TEXT,
  pix_expires_at TIMESTAMPTZ,
  calendar_event_id TEXT,
  google_meet_link TEXT,
  google_meet_link_type TEXT DEFAULT 'string',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Criar tabelas de chat
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Criar tabelas de checklist
CREATE TABLE IF NOT EXISTS checklist_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES checklist_sessions(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, item_id)
);

-- 6. Criar tabela divorce_cases (depende de users)
CREATE TABLE IF NOT EXISTS divorce_cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  type TEXT NOT NULL DEFAULT 'traditional',
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

-- 7. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_agendamentos_user_id ON agendamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_horario ON agendamentos(data, horario);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_checklist_sessions_user_id ON checklist_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_session_id ON checklist_items(session_id);
CREATE INDEX IF NOT EXISTS idx_divorce_cases_user_id ON divorce_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_divorce_cases_status ON divorce_cases(status);

-- 8. Habilitar RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE divorce_cases ENABLE ROW LEVEL SECURITY;

-- 9. Criar políticas RLS
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Users can view their own agendamentos" ON agendamentos FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert their own agendamentos" ON agendamentos FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update their own agendamentos" ON agendamentos FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own payments" ON payments FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert their own payments" ON payments FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own chat conversations" ON chat_conversations FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert their own chat conversations" ON chat_conversations FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update their own chat conversations" ON chat_conversations FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own chat messages" ON chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM chat_conversations WHERE id = conversation_id AND user_id = auth.uid()::text)
);
CREATE POLICY "Users can insert their own chat messages" ON chat_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM chat_conversations WHERE id = conversation_id AND user_id = auth.uid()::text)
);

CREATE POLICY "Users can view their own checklist sessions" ON checklist_sessions FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert their own checklist sessions" ON checklist_sessions FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update their own checklist sessions" ON checklist_sessions FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view their own checklist items" ON checklist_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM checklist_sessions WHERE id = session_id AND user_id = auth.uid()::text)
);
CREATE POLICY "Users can insert their own checklist items" ON checklist_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM checklist_sessions WHERE id = session_id AND user_id = auth.uid()::text)
);
CREATE POLICY "Users can update their own checklist items" ON checklist_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM checklist_sessions WHERE id = session_id AND user_id = auth.uid()::text)
);

CREATE POLICY "Users can view their own divorce cases" ON divorce_cases FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert their own divorce cases" ON divorce_cases FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update their own divorce cases" ON divorce_cases FOR UPDATE USING (auth.uid()::text = user_id);

-- 10. Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. Criar triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agendamentos_updated_at BEFORE UPDATE ON agendamentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON chat_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_checklist_sessions_updated_at BEFORE UPDATE ON checklist_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_checklist_items_updated_at BEFORE UPDATE ON checklist_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_divorce_cases_updated_at BEFORE UPDATE ON divorce_cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
