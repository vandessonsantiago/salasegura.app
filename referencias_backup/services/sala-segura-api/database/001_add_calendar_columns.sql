-- Migration: add calendar_event_id and google_meet_link to agendamentos
-- Safe to run multiple times (uses IF NOT EXISTS where supported)

BEGIN;

-- Add columns if they do not exist
ALTER TABLE IF EXISTS agendamentos
  ADD COLUMN IF NOT EXISTS calendar_event_id VARCHAR(255);

ALTER TABLE IF EXISTS agendamentos
  ADD COLUMN IF NOT EXISTS google_meet_link TEXT;

-- Create index for calendar_event_id to speed up lookups/deletes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_agendamentos_calendar_event_id' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_agendamentos_calendar_event_id ON agendamentos(calendar_event_id);
  END IF;
END$$;

COMMIT;

-- Notes:
-- 1) You can run this in the Supabase SQL editor or with psql against your database.
-- 2) If your DB uses a different schema than 'public', adjust the index check accordingly.
-- 3) The repository already contains a `database/agendamentos.sql` that defines these columns; this migration is intended
--    for existing databases that were created before those columns were added.
