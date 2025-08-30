-- Migration: Fix divorce_cases schema and add missing tables
-- Date: 2025-08-30

-- 1. Remover foreign key constraint que impede alteração do tipo
ALTER TABLE public.divorce_cases
DROP CONSTRAINT IF EXISTS divorce_cases_payment_id_fkey;

-- 2. Alterar payment_id de UUID para TEXT para aceitar IDs do Asaas
ALTER TABLE public.divorce_cases
ALTER COLUMN payment_id TYPE TEXT;

-- 3. Adicionar coluna payment_status se não existir
ALTER TABLE public.divorce_cases
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'PENDING';

-- 4. Criar tabela webhook_logs se não existir
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    asaas_event TEXT NOT NULL,
    payment_id TEXT NOT NULL,
    payload JSONB,
    status TEXT DEFAULT 'received',
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Criar índices para webhook_logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_payment_id ON public.webhook_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON public.webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON public.webhook_logs(created_at);

-- 6. Atualizar registros existentes com payment_status padrão
UPDATE public.divorce_cases
SET payment_status = 'PENDING'
WHERE payment_status IS NULL;
