-- =====================================================
-- SCRIPT FINAL PARA ATUALIZAR TABELAS EXISTENTES NO SUPABASE
-- Execute este script no SQL Editor do Supabase Dashboard
-- =====================================================

-- 1. ATUALIZAR TABELA USERS
-- =====================================================

-- Remover constraint antiga e adicionar nova (incluir 'host')
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('user', 'admin', 'lawyer', 'host'));

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Allow insert for new users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

-- Recriar políticas corrigidas
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Allow insert for new users" ON public.users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::text = auth.uid()::text AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all users" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::text = auth.uid()::text AND role = 'admin'
        )
    );

-- 2. ATUALIZAR TABELA ROOMS E ROOM_PARTICIPANTS
-- =====================================================

-- Remover políticas existentes das salas
DROP POLICY IF EXISTS "Users can view own rooms" ON public.rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON public.rooms;
DROP POLICY IF EXISTS "Users can update own rooms" ON public.rooms;

-- Recriar políticas das salas
CREATE POLICY "Users can view own rooms" ON public.rooms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.room_participants 
            WHERE room_id::text = rooms.id::text AND user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can create rooms" ON public.rooms
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own rooms" ON public.rooms
    FOR UPDATE USING (created_by::text = auth.uid()::text);

-- Política adicional para permitir inserção via API (sem autenticação)
CREATE POLICY "Allow API insert rooms" ON public.rooms
    FOR INSERT WITH CHECK (true);

-- Remover políticas existentes dos participantes
DROP POLICY IF EXISTS "Users can view room participants" ON public.room_participants;
DROP POLICY IF EXISTS "Users can join rooms" ON public.room_participants;
DROP POLICY IF EXISTS "Users can update own participation" ON public.room_participants;

-- Recriar políticas dos participantes (sem recursão)
CREATE POLICY "Users can view room participants" ON public.room_participants
    FOR SELECT USING (true);

CREATE POLICY "Users can join rooms" ON public.room_participants
    FOR INSERT WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update own participation" ON public.room_participants
    FOR UPDATE USING (user_id::text = auth.uid()::text);

-- 3. ATUALIZAR TABELA PROCESSES
-- =====================================================

-- Adicionar coluna room_id se não existir
ALTER TABLE public.processes ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view room processes" ON public.processes;
DROP POLICY IF EXISTS "Users can create room processes" ON public.processes;
DROP POLICY IF EXISTS "Users can update own processes" ON public.processes;
DROP POLICY IF EXISTS "Users can delete own processes" ON public.processes;
DROP POLICY IF EXISTS "Admins can view all processes" ON public.processes;
DROP POLICY IF EXISTS "Admins can update all processes" ON public.processes;
DROP POLICY IF EXISTS "Admins can delete all processes" ON public.processes;

-- Recriar políticas corrigidas
CREATE POLICY "Users can view room processes" ON public.processes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.room_participants 
            WHERE room_id::text = processes.room_id::text AND user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can create room processes" ON public.processes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.room_participants 
            WHERE room_id::text = processes.room_id::text AND user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can update own processes" ON public.processes
    FOR UPDATE USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can delete own processes" ON public.processes
    FOR DELETE USING (user_id::text = auth.uid()::text);

CREATE POLICY "Admins can view all processes" ON public.processes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::text = auth.uid()::text AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all processes" ON public.processes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::text = auth.uid()::text AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete all processes" ON public.processes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::text = auth.uid()::text AND role = 'admin'
        )
    );

-- 4. ATUALIZAR FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Função para criar perfil de usuário automaticamente (com verificação de duplicação)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se o usuário já existe antes de inserir
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
        INSERT INTO public.users (id, email, first_name, last_name, role)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
            COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
            'user'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rooms_updated_at ON public.rooms;
CREATE TRIGGER update_rooms_updated_at 
    BEFORE UPDATE ON public.rooms 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_processes_updated_at ON public.processes;
CREATE TRIGGER update_processes_updated_at 
    BEFORE UPDATE ON public.processes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. CRIAR ÍNDICES (se não existirem)
-- =====================================================

-- Índices para rooms
CREATE INDEX IF NOT EXISTS idx_rooms_created_by ON public.rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_rooms_invite_code ON public.rooms(invite_code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);

-- Índices para room_participants
CREATE INDEX IF NOT EXISTS idx_room_participants_room_id ON public.room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON public.room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_role ON public.room_participants(role);

-- Índices para processes
CREATE INDEX IF NOT EXISTS idx_processes_room_id ON public.processes(room_id);
CREATE INDEX IF NOT EXISTS idx_processes_user_id ON public.processes(user_id);
CREATE INDEX IF NOT EXISTS idx_processes_status ON public.processes(status);
CREATE INDEX IF NOT EXISTS idx_processes_created_at ON public.processes(created_at);

-- 6. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se as tabelas foram criadas corretamente
SELECT 'users' as table_name, COUNT(*) as row_count FROM public.users
UNION ALL
SELECT 'rooms' as table_name, COUNT(*) as row_count FROM public.rooms
UNION ALL
SELECT 'room_participants' as table_name, COUNT(*) as row_count FROM public.room_participants
UNION ALL
SELECT 'processes' as table_name, COUNT(*) as row_count FROM public.processes;

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Verificar triggers criados
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
