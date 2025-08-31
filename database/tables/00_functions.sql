-- =====================================================
-- FUNCTION: update_updated_at_column
-- Description: Function to automatically update updated_at timestamp
-- Dependencies: None
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';
