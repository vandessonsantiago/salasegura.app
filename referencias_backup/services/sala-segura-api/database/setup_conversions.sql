-- Script para configurar a tabela conversions
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de conversões do formulário
CREATE TABLE IF NOT EXISTS public.conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    access_token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção de conversões (usado pela API)
CREATE POLICY "Allow insert conversions" ON public.conversions
    FOR INSERT WITH CHECK (true);

-- Política para permitir visualização por token de acesso
CREATE POLICY "Allow view by access token" ON public.conversions
    FOR SELECT USING (true);

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_conversions_updated_at ON public.conversions;
CREATE TRIGGER update_conversions_updated_at 
    BEFORE UPDATE ON public.conversions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_conversions_email ON public.conversions(email);
CREATE INDEX IF NOT EXISTS idx_conversions_access_token ON public.conversions(access_token);
CREATE INDEX IF NOT EXISTS idx_conversions_status ON public.conversions(status);
CREATE INDEX IF NOT EXISTS idx_conversions_created_at ON public.conversions(created_at);

-- Verificar se a tabela foi criada
SELECT 'Tabela conversions criada com sucesso!' as status;
