-- =====================================================
-- TABLE: checklist_sessions
-- Description: Checklist sessions table
-- Dependencies: users
-- =====================================================

CREATE TABLE IF NOT EXISTS checklist_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text,
  title text NOT NULL,
  progress integer DEFAULT 0,
  total_items integer DEFAULT 0,
  template_version integer DEFAULT 2,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT checklist_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT checklist_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for checklist_sessions table
CREATE INDEX IF NOT EXISTS idx_checklist_sessions_user_id ON checklist_sessions(user_id);

-- RLS Policies for checklist_sessions table
ALTER TABLE checklist_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own checklist sessions" ON checklist_sessions FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert their own checklist sessions" ON checklist_sessions FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update their own checklist sessions" ON checklist_sessions FOR UPDATE USING (auth.uid()::text = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_checklist_sessions_updated_at BEFORE UPDATE ON checklist_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
