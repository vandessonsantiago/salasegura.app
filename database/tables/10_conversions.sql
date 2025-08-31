-- =====================================================
-- TABLE: conversions
-- Description: Lead conversion tracking table
-- Dependencies: None
-- =====================================================

CREATE TABLE IF NOT EXISTS conversions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  whatsapp text NOT NULL,
  access_token text NOT NULL UNIQUE,
  status text DEFAULT 'pending',
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT conversions_pkey PRIMARY KEY (id),
  CONSTRAINT conversions_status_check CHECK (status IN ('pending', 'completed'))
);

-- Indexes for conversions table
CREATE INDEX IF NOT EXISTS idx_conversions_email ON conversions(email);
CREATE INDEX IF NOT EXISTS idx_conversions_access_token ON conversions(access_token);
CREATE INDEX IF NOT EXISTS idx_conversions_status ON conversions(status);

-- RLS Policies for conversions table (public access for lead capture)
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to conversions" ON conversions FOR SELECT USING (true);
CREATE POLICY "Allow public insert to conversions" ON conversions FOR INSERT WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_conversions_updated_at BEFORE UPDATE ON conversions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
