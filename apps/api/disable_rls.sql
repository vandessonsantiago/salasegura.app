-- SQL para desabilitar RLS
ALTER TABLE public.agendamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions DISABLE ROW LEVEL SECURITY;

-- Verificar se funcionou
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('agendamentos', 'conversions');
