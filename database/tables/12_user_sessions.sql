-- =====================================================
-- TABLE: user_sessions
-- Description: User session management
-- Dependencies: users
-- =====================================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text,
  session_token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT user_sessions_user_id_session_token_key UNIQUE (user_id, session_token)
);

-- Indexes for user_sessions table
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- RLS Policies for user_sessions table
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON user_sessions FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert their own sessions" ON user_sessions FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update their own sessions" ON user_sessions FOR UPDATE USING (auth.uid()::text = user_id);

-- Trigger for updated_at (não aplicável pois não tem campo updated_at)
-- CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
