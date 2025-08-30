-- Fix agendamentos table RLS policies
-- Migration: 20250829000005_create_agendamentos_table.sql

-- Add missing columns to agendamentos table
ALTER TABLE public.agendamentos
ADD COLUMN IF NOT EXISTS service_type TEXT,
ADD COLUMN IF NOT EXISTS service_data JSONB;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Users can insert their own agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Users can update their own agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Users can delete their own agendamentos" ON public.agendamentos;

-- Create new policies with proper casting
CREATE POLICY "Users can view their own agendamentos" ON public.agendamentos
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own agendamentos" ON public.agendamentos
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own agendamentos" ON public.agendamentos
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own agendamentos" ON public.agendamentos
    FOR DELETE USING (auth.uid()::text = user_id::text);
