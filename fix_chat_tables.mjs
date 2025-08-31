import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lphpcjccvfgmlxygclmt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwaHBjamNjdmZnbWx4eWdjbG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA2MDAzNCwiZXhwIjoyMDcxNjM2MDM0fQ.x_wkqY9Z0DgwYqX3Lp7og0HnqPaX__F2ATWLWuuy5Nk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFixTableStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela chat_messages...');

    // Verificar se a tabela existe
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'chat_messages')
      .eq('table_schema', 'public');

    if (tableError) {
      console.error('❌ Erro ao verificar tabelas:', tableError);
      return;
    }

    if (!tables || tables.length === 0) {
      console.log('📝 Tabela chat_messages não existe, criando...');

      // Criar a tabela
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS chat_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          conversation_id UUID NOT NULL,
          sender VARCHAR(32) NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      if (createError) {
        console.error('❌ Erro ao criar tabela:', createError);
      } else {
        console.log('✅ Tabela chat_messages criada com sucesso');
      }
    } else {
      console.log('✅ Tabela chat_messages existe');

      // Verificar colunas
      const { data: columns, error: columnError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'chat_messages')
        .eq('table_schema', 'public')
        .order('ordinal_position');

      if (columnError) {
        console.error('❌ Erro ao verificar colunas:', columnError);
        return;
      }

      console.log('📊 Colunas atuais:', columns);

      // Verificar se a coluna sender existe
      const senderColumn = columns?.find(col => col.column_name === 'sender');
      if (!senderColumn) {
        console.log('➕ Coluna sender não existe, adicionando...');

        const addColumnSQL = 'ALTER TABLE chat_messages ADD COLUMN sender VARCHAR(32) NOT NULL DEFAULT \'user\';';
        const { error: addError } = await supabase.rpc('exec_sql', { sql: addColumnSQL });
        if (addError) {
          console.error('❌ Erro ao adicionar coluna sender:', addError);
        } else {
          console.log('✅ Coluna sender adicionada com sucesso');
        }
      } else {
        console.log('✅ Coluna sender existe:', senderColumn);
      }

      // Verificar se a coluna conversation_id tem a FK
      const convIdColumn = columns?.find(col => col.column_name === 'conversation_id');
      if (convIdColumn) {
        console.log('🔗 Verificando foreign key para conversation_id...');

        const { data: constraints, error: fkError } = await supabase
          .from('information_schema.table_constraints')
          .select('constraint_name, constraint_type')
          .eq('table_name', 'chat_messages')
          .eq('table_schema', 'public');

        const hasFK = constraints?.some(c => c.constraint_type === 'FOREIGN KEY');
        if (!hasFK) {
          console.log('➕ Adicionando foreign key...');

          const addFKSQL = 'ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE;';
          const { error: fkAddError } = await supabase.rpc('exec_sql', { sql: addFKSQL });
          if (fkAddError) {
            console.error('❌ Erro ao adicionar FK:', fkAddError);
          } else {
            console.log('✅ Foreign key adicionada com sucesso');
          }
        } else {
          console.log('✅ Foreign key já existe');
        }
      }
    }

    // Verificar estrutura final
    const { data: finalColumns, error: finalError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'chat_messages')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (finalError) {
      console.error('❌ Erro ao verificar estrutura final:', finalError);
    } else {
      console.log('📊 Estrutura final da tabela chat_messages:');
      console.table(finalColumns);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkAndFixTableStructure();
