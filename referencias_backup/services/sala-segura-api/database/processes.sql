-- Criar tabela de processos
CREATE TABLE IF NOT EXISTS public.processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se existirem)
DROP POLICY IF EXISTS "Users can view room processes" ON public.processes;
DROP POLICY IF EXISTS "Users can create room processes" ON public.processes;
DROP POLICY IF EXISTS "Users can update own processes" ON public.processes;
DROP POLICY IF EXISTS "Users can delete own processes" ON public.processes;
DROP POLICY IF EXISTS "Admins can view all processes" ON public.processes;
DROP POLICY IF EXISTS "Admins can update all processes" ON public.processes;
DROP POLICY IF EXISTS "Admins can delete all processes" ON public.processes;

-- Política para usuários verem apenas processos das salas onde participam
CREATE POLICY "Users can view room processes" ON public.processes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.room_participants 
            WHERE room_id = processes.room_id AND user_id = auth.uid()
        )
    );

-- Política para usuários criarem processos nas salas onde participam
CREATE POLICY "Users can create room processes" ON public.processes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.room_participants 
            WHERE room_id = processes.room_id AND user_id = auth.uid()
        )
    );

-- Política para usuários atualizarem apenas seus próprios processos
CREATE POLICY "Users can update own processes" ON public.processes
    FOR UPDATE USING (user_id = auth.uid());

-- Política para usuários deletarem apenas seus próprios processos
CREATE POLICY "Users can delete own processes" ON public.processes
    FOR DELETE USING (user_id = auth.uid());

-- Política para admins verem todos os processos
CREATE POLICY "Admins can view all processes" ON public.processes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Política para admins atualizarem todos os processos
CREATE POLICY "Admins can update all processes" ON public.processes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Política para admins deletarem todos os processos
CREATE POLICY "Admins can delete all processes" ON public.processes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_processes_updated_at ON public.processes;
CREATE TRIGGER update_processes_updated_at 
    BEFORE UPDATE ON public.processes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_processes_room_id ON public.processes(room_id);
CREATE INDEX IF NOT EXISTS idx_processes_user_id ON public.processes(user_id);
CREATE INDEX IF NOT EXISTS idx_processes_status ON public.processes(status);
CREATE INDEX IF NOT EXISTS idx_processes_created_at ON public.processes(created_at);
