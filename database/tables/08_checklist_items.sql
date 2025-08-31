-- =====================================================
-- TABLE: checklist_items
-- Description: Checklist items table
-- Dependencies: checklist_sessions
-- =====================================================

CREATE TABLE IF NOT EXISTS checklist_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid,
  item_id text NOT NULL,
  category text,
  text text,
  title text,
  completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT checklist_items_pkey PRIMARY KEY (id),
  CONSTRAINT checklist_items_session_id_fkey FOREIGN KEY (session_id) REFERENCES checklist_sessions(id)
);

-- Indexes for checklist_items table
CREATE INDEX IF NOT EXISTS idx_checklist_items_session_id ON checklist_items(session_id);

-- RLS Policies for checklist_items table
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own checklist items" ON checklist_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM checklist_sessions WHERE id = session_id AND user_id = auth.uid()::text)
);
CREATE POLICY "Users can insert their own checklist items" ON checklist_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM checklist_sessions WHERE id = session_id AND user_id = auth.uid()::text)
);
CREATE POLICY "Users can update their own checklist items" ON checklist_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM checklist_sessions WHERE id = session_id AND user_id = auth.uid()::text)
);

-- Trigger for updated_at
CREATE TRIGGER update_checklist_items_updated_at BEFORE UPDATE ON checklist_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
