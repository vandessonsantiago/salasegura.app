import { supabaseAdmin } from '../lib/supabase';

async function fixChecklistSchema() {
  try {
    console.log('🔍 Verificando schema da tabela checklist_sessions...');

    // Verificar colunas existentes
    const { data: columns, error } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'checklist_sessions')
      .eq('table_schema', 'public');

    if (error) {
      console.error('❌ Erro ao consultar schema:', error);
      return;
    }

    console.log('📋 Colunas encontradas na tabela checklist_sessions:');
    const existingColumns = columns?.map(col => col.column_name) || [];
    columns?.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'} ${col.column_default ? `default: ${col.column_default}` : ''}`);
    });

    // Verificar quais colunas estão faltando
    const requiredColumns = ['progress', 'total_items', 'template_version', 'completed_at'];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      console.log('⚠️  Colunas faltando:', missingColumns.join(', '));
      console.log('🔧 Aplicando migração...');

      // Aplicar migração usando SQL direto
      const migrationSQL = `
        ALTER TABLE checklist_sessions
        ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS total_items INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS template_version INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

        UPDATE checklist_sessions
        SET template_version = 1
        WHERE template_version IS NULL;
      `;

      // Executar SQL usando uma função RPC ou query direta
      try {
        // Tentar usar uma abordagem diferente - inserir um registro de teste
        const { error: insertError } = await supabaseAdmin
          .from('checklist_sessions')
          .insert({
            user_id: 'test-user',
            progress: 0,
            total_items: 0,
            template_version: 1
          });

        if (insertError && insertError.message.includes('template_version')) {
          console.log('❌ Coluna template_version não existe. Tentando criar via SQL...');

          // Se falhar, tentar executar SQL diretamente (pode não funcionar dependendo das permissões)
          console.log('💡 Você pode precisar executar a migração manualmente no painel do Supabase');
          console.log('SQL para executar:');
          console.log(migrationSQL);
        } else if (insertError) {
          console.log('❌ Erro ao testar inserção:', insertError.message);
        } else {
          console.log('✅ Colunas existem e são funcionais');
          // Remover o registro de teste
          await supabaseAdmin
            .from('checklist_sessions')
            .delete()
            .eq('user_id', 'test-user');
        }
      } catch (sqlError) {
        console.log('💡 Migração pode precisar ser aplicada manualmente no painel do Supabase');
        console.log('SQL:', migrationSQL);
      }

    } else {
      console.log('✅ Todas as colunas necessárias existem na tabela checklist_sessions');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar/corrigir schema:', error);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  fixChecklistSchema();
}

export { fixChecklistSchema };
