-- Add template_version column to checklist_sessions
ALTER TABLE "public"."checklist_sessions" ADD COLUMN IF NOT EXISTS "template_version" INTEGER NOT NULL DEFAULT 1;
