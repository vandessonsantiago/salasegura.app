-- Desabilitar RLS temporariamente para a tabela conversions
-- Isso permite acesso total com Service Role Key

ALTER TABLE conversions DISABLE ROW LEVEL SECURITY;

-- OU se quiser manter RLS, criar uma política que permite tudo para service role:
-- CREATE POLICY "Service role can do everything" ON conversions
-- FOR ALL USING (true)
-- WITH CHECK (true);
