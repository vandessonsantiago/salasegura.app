-- Tabela para sessões de checklist do usuário
CREATE TABLE IF NOT EXISTS checklist_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Checklist "Você está pronto(a) para o cartório?"',
  progress INTEGER NOT NULL DEFAULT 0,
  total_items INTEGER NOT NULL DEFAULT 20,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para itens do checklist
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES checklist_sessions(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL, -- ex: '1.1', '2.3', etc.
  category TEXT NOT NULL, -- elegibilidade, documentos, filhos, patrimonio, alimentos, procuração
  text TEXT NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, item_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_checklist_sessions_user_id ON checklist_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_sessions_created_at ON checklist_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checklist_items_session_id ON checklist_items(session_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_category ON checklist_items(category);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_checklist_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_checklist_sessions_updated_at 
    BEFORE UPDATE ON checklist_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_checklist_updated_at_column();

CREATE TRIGGER update_checklist_items_updated_at 
    BEFORE UPDATE ON checklist_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_checklist_updated_at_column();

-- Função para calcular progresso automaticamente
CREATE OR REPLACE FUNCTION update_checklist_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar progresso na sessão
    UPDATE checklist_sessions 
    SET 
        progress = (
            SELECT COUNT(*) 
            FROM checklist_items 
            WHERE session_id = NEW.session_id AND checked = TRUE
        ),
        updated_at = NOW()
    WHERE id = NEW.session_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar progresso quando item é modificado
CREATE TRIGGER update_checklist_progress_trigger
    AFTER INSERT OR UPDATE ON checklist_items
    FOR EACH ROW
    EXECUTE FUNCTION update_checklist_progress();
