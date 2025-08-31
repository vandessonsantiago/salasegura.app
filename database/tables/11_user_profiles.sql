-- =====================================================
-- TABLE: user_profiles
-- Description: Extended user profile information
-- Dependencies: users
-- =====================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text,
  bio text,
  company text,
  language text,
  location text,
  theme text,
  timezone text,
  website text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT user_profiles_user_id_key UNIQUE (user_id)
);

-- Indexes for user_profiles table
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- RLS Policies for user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid()::text = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
