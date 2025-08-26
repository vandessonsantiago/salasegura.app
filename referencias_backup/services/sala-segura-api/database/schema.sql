-- Criação da tabela processes para a Sala Segura API
-- Execute este script no SQL Editor do Supabase

-- Habilitar extensão uuid-ossp se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela processes
CREATE TABLE IF NOT EXISTS public.processes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_processes_user_id ON public.processes(user_id);
CREATE INDEX IF NOT EXISTS idx_processes_status ON public.processes(status);
CREATE INDEX IF NOT EXISTS idx_processes_created_at ON public.processes(created_at);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_processes_updated_at ON public.processes;
CREATE TRIGGER update_processes_updated_at
    BEFORE UPDATE ON public.processes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Configurar RLS (Row Level Security)
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;

-- Criar política para usuários verem apenas seus próprios processos
CREATE POLICY "Users can view their own processes" ON public.processes
    FOR SELECT USING (auth.uid()::text = user_id);

-- Criar política para usuários criarem seus próprios processos
CREATE POLICY "Users can create their own processes" ON public.processes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Criar política para usuários atualizarem seus próprios processos
CREATE POLICY "Users can update their own processes" ON public.processes
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Criar política para usuários deletarem seus próprios processos
CREATE POLICY "Users can delete their own processes" ON public.processes
    FOR DELETE USING (auth.uid()::text = user_id);

-- Inserir dados de exemplo (opcional)
INSERT INTO public.processes (title, description, priority, status, user_id) VALUES
    ('Divórcio Consensual', 'Processo de divórcio consensual para casal sem filhos', 'high', 'pending', 'example-user-id'),
    ('Acordo de Guarda', 'Negociação de acordo de guarda compartilhada', 'medium', 'in_progress', 'example-user-id'),
    ('Inventário Extrajudicial', 'Processo de inventário extrajudicial', 'low', 'completed', 'example-user-id')
ON CONFLICT DO NOTHING;
