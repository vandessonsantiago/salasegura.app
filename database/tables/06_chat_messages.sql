-- =====================================================
-- TABLE: chat_messages
-- Description: Chat messages table
-- Dependencies: chat_conversations
-- =====================================================

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id)
);

-- Indexes for chat_messages table
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);

-- RLS Policies for chat_messages table
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat messages" ON chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM chat_conversations WHERE id = conversation_id AND user_id = auth.uid()::text)
);
CREATE POLICY "Users can insert their own chat messages" ON chat_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM chat_conversations WHERE id = conversation_id AND user_id = auth.uid()::text)
);

-- Trigger for updated_at
CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
