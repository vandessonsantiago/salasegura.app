-- =====================================================
-- TABLE: chat_conversations
-- Description: Chat conversations table
-- Dependencies: users
-- =====================================================

CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text,
  title text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_conversations_pkey PRIMARY KEY (id),
  CONSTRAINT chat_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for chat_conversations table
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);

-- RLS Policies for chat_conversations table
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat conversations" ON chat_conversations FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert their own chat conversations" ON chat_conversations FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update their own chat conversations" ON chat_conversations FOR UPDATE USING (auth.uid()::text = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON chat_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
