import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações do Supabase
const supabaseUrl = 'https://lphpcjccvfgmlxygclmt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwaHBjamNjdmZnbWx4eWdjbG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA2MDAzNCwiZXhwIjoyMDcxNjM2MDM0fQ.x_wkqY9Z0DgwYqX3Lp7og0HnqPaX__F2ATWLWuuy5Nk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runUpdateScript() {
  try {
    console.log('🔄 Executando atualizações das tabelas de chat...');

    // 1. Verificar se a coluna title existe, se não existir, adicioná-la
    console.log('📝 Verificando coluna title...');
    const { data: titleCheck, error: titleError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'chat_conversations')
      .eq('column_name', 'title')
      .eq('table_schema', 'public');

    if (titleError) {
      console.error('❌ Erro ao verificar coluna title:', titleError);
    } else if (!titleCheck || titleCheck.length === 0) {
      console.log('➕ Adicionando coluna title...');
      // Usar SQL raw através do Supabase
      const { error: addTitleError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE public.chat_conversations ADD COLUMN title TEXT NULL;'
      });
      if (addTitleError) {
        console.warn('⚠️ Erro ao adicionar coluna title:', addTitleError.message);
      } else {
        console.log('✅ Coluna title adicionada com sucesso');
      }
    } else {
      console.log('✅ Coluna title já existe');
    }

    // 2. Verificar se o trigger existe, se não existir, criá-lo
    console.log('🔧 Verificando trigger update_updated_at...');
    const { data: triggerCheck, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name')
      .eq('trigger_name', 'update_chat_conversations_updated_at')
      .eq('event_object_table', 'chat_conversations')
      .eq('event_object_schema', 'public');

    if (triggerError) {
      console.error('❌ Erro ao verificar trigger:', triggerError);
    } else if (!triggerCheck || triggerCheck.length === 0) {
      console.log('➕ Criando trigger update_updated_at...');
      const { error: triggerCreateError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TRIGGER update_chat_conversations_updated_at
          BEFORE UPDATE ON public.chat_conversations
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        `
      });
      if (triggerCreateError) {
        console.warn('⚠️ Erro ao criar trigger:', triggerCreateError.message);
      } else {
        console.log('✅ Trigger criado com sucesso');
      }
    } else {
      console.log('✅ Trigger já existe');
    }

    // 3. Verificar se o índice existe, se não existir, criá-lo
    console.log('🔍 Verificando índice idx_chat_conversations_user_id...');
    const { data: indexCheck, error: indexError } = await supabase
      .from('pg_indexes')
      .select('indexname')
      .eq('tablename', 'chat_conversations')
      .eq('indexname', 'idx_chat_conversations_user_id')
      .eq('schemaname', 'public');

    if (indexError) {
      console.error('❌ Erro ao verificar índice:', indexError);
    } else if (!indexCheck || indexCheck.length === 0) {
      console.log('➕ Criando índice idx_chat_conversations_user_id...');
      const { error: indexCreateError } = await supabase.rpc('exec_sql', {
        sql: 'CREATE INDEX idx_chat_conversations_user_id ON public.chat_conversations USING btree (user_id);'
      });
      if (indexCreateError) {
        console.warn('⚠️ Erro ao criar índice:', indexCreateError.message);
      } else {
        console.log('✅ Índice criado com sucesso');
      }
    } else {
      console.log('✅ Índice já existe');
    }

    // 4. Verificar estrutura final da tabela
    console.log('🔍 Verificando estrutura final da tabela...');
    const { data: structure, error: structError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'chat_conversations')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (structError) {
      console.error('❌ Erro ao verificar estrutura:', structError);
    } else {
      console.log('📊 Estrutura da tabela chat_conversations:');
      console.table(structure);
    }

    console.log('🎉 Atualização das tabelas concluída!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

runUpdateScript();
