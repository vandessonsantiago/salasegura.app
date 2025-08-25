-- Criar tabela de salas seguras
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invite_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de participantes das salas
CREATE TABLE IF NOT EXISTS public.room_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('host', 'guest')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se existirem)
DROP POLICY IF EXISTS "Users can view own rooms" ON public.rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON public.rooms;
DROP POLICY IF EXISTS "Users can update own rooms" ON public.rooms;
DROP POLICY IF EXISTS "Users can view room participants" ON public.room_participants;
DROP POLICY IF EXISTS "Users can join rooms" ON public.room_participants;
DROP POLICY IF EXISTS "Users can update own participation" ON public.room_participants;

-- Políticas para salas
-- Usuários podem ver apenas salas onde participam
CREATE POLICY "Users can view own rooms" ON public.rooms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.room_participants 
            WHERE room_id = rooms.id AND user_id = auth.uid()
        )
    );

-- Usuários podem criar salas
CREATE POLICY "Users can create rooms" ON public.rooms
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Usuários podem atualizar apenas salas que criaram
CREATE POLICY "Users can update own rooms" ON public.rooms
    FOR UPDATE USING (created_by = auth.uid());

-- Políticas para participantes
-- Usuários podem ver participantes das salas onde participam
CREATE POLICY "Users can view room participants" ON public.room_participants
    FOR SELECT USING (true);

-- Usuários podem se juntar a salas via código de convite
CREATE POLICY "Users can join rooms" ON public.room_participants
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar seu próprio status
CREATE POLICY "Users can update own participation" ON public.room_participants
    FOR UPDATE USING (user_id = auth.uid());

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_rooms_updated_at ON public.rooms;
CREATE TRIGGER update_rooms_updated_at 
    BEFORE UPDATE ON public.rooms 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_rooms_created_by ON public.rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_rooms_invite_code ON public.rooms(invite_code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);
CREATE INDEX IF NOT EXISTS idx_room_participants_room_id ON public.room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON public.room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_role ON public.room_participants(role);
