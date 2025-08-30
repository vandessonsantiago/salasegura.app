-- Create webhook_logs table for tracking Asaas webhook events
-- Migration: 20250829000006_create_webhook_logs_table.sql

CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asaas_event TEXT NOT NULL,
  payment_id TEXT,
  payload JSONB,
  status TEXT DEFAULT 'received',
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies for webhook_logs
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read webhook logs (for debugging)
CREATE POLICY "Users can view webhook logs" ON public.webhook_logs
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow service role to insert webhook logs
CREATE POLICY "Service role can insert webhook logs" ON public.webhook_logs
    FOR INSERT WITH CHECK (auth.role() = 'service_role');
