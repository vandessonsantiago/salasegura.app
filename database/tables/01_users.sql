-- =====================================================
-- TABLE: users
-- Description: Foundation table for user accounts
-- Dependencies: None
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
  id text NOT NULL,
  email text NOT NULL UNIQUE,
  name text,
  avatar_url text,
  phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- RLS Policies for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid()::text = id);

-- Trigger for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
