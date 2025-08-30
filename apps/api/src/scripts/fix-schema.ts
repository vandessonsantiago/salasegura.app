import { supabaseAdmin } from '../lib/supabase';

async function checkSchema() {
  try {
    console.log('� Verificando schema da tabela divorce_cases...');

    // Verificar colunas existentes
    const { data: columns, error } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'divorce_cases')
      .eq('table_schema', 'public');

    if (error) {
      console.error('❌ Erro ao consultar schema:', error);
      return;
    }

    console.log('📋 Colunas encontradas:');
    columns?.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
    });

    // Verificar se tabela webhook_logs existe
    const { data: webhookTables } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'webhook_logs')
      .eq('table_schema', 'public');

    console.log('📋 Tabela webhook_logs existe:', webhookTables && webhookTables.length > 0 ? '✅ Sim' : '❌ Não');

  } catch (error) {
    console.error('❌ Erro ao verificar schema:', error);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  checkSchema();
}

export { checkSchema };
