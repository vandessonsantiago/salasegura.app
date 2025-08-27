import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL e SUPABASE_SECRET_KEY são necessários');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  try {
    console.log('🔍 VERIFICANDO TABELAS EXISTENTES NO BANCO...\n');

    // Query para listar todas as tabelas do schema public
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (error) {
      console.error('❌ Erro ao consultar tabelas:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.log('📋 Nenhuma tabela encontrada no schema public.');
      return;
    }

    console.log('📊 TABELAS ENCONTRADAS:');
    console.log('='.repeat(50));

    // Classificar tabelas
    const essential_tables = [
      'users', 'user_profiles', 'agendamentos', 'payments',
      'conversions', 'checklist_sessions', 'checklist_items',
      'app_settings', 'asaas_webhook_config', 'asaas_webhook_logs', 'webhook_logs'
    ];

    const optional_tables = ['_prisma_migrations', 'user_sessions', 'activity_logs'];

    data.forEach((row, index) => {
      const tableName = row.table_name;

      if (essential_tables.includes(tableName)) {
        console.log(`${index + 1}. ✅ ${tableName} (ESSENCIAL)`);
      } else if (optional_tables.includes(tableName)) {
        console.log(`${index + 1}. ❌ ${tableName} (OPCIONAL)`);
      } else {
        console.log(`${index + 1}. ❓ ${tableName} (DESCONHECIDA)`);
      }
    });

    console.log('\n📋 RESUMO:');
    console.log(`   • Total de tabelas: ${data.length}`);
    console.log(`   • Tabelas essenciais: ${data.filter(row => essential_tables.includes(row.table_name)).length}`);
    console.log(`   • Tabelas opcionais: ${data.filter(row => optional_tables.includes(row.table_name)).length}`);
    console.log(`   • Tabelas desconhecidas: ${data.filter(row => !essential_tables.includes(row.table_name) && !optional_tables.includes(row.table_name)).length}`);

    console.log('\n🎯 RECOMENDAÇÕES:');
    console.log('   ✅ Mantenha todas as tabelas marcadas com ESSENCIAL');
    console.log('   ❌ Considere remover tabelas marcadas com OPCIONAL');
    console.log('   ❓ Verifique tabelas marcadas com DESCONHECIDA');

    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('   1. Se estiver satisfeito, execute o script de limpeza');
    console.log('   2. Ou execute seus scripts principais (supabase_schema.sql, etc.)');

  } catch (error) {
    console.error('❌ ERRO GERAL:', error.message);
    process.exit(1);
  }
}

async function cleanupTables() {
  try {
    console.log('🧹 INICIANDO LIMPEZA SELETIVA...\n');

    const tablesToRemove = ['_prisma_migrations', 'user_sessions', 'activity_logs'];

    for (const tableName of tablesToRemove) {
      console.log(`🔍 Verificando tabela: ${tableName}`);

      // Verificar se a tabela existe
      const { data: tableExists, error: checkError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
        console.log(`⚠️  Erro ao verificar ${tableName}: ${checkError.message}`);
        continue;
      }

      if (!tableExists) {
        console.log(`ℹ️  Tabela ${tableName} não existe (pulando)`);
        continue;
      }

      // Tentar remover a tabela
      try {
        const { error: dropError } = await supabase.rpc('drop_table_if_exists', {
          table_name: tableName
        });

        if (dropError) {
          console.log(`⚠️  Não foi possível remover ${tableName} via RPC: ${dropError.message}`);

          // Tentar abordagem alternativa com SQL bruto
          const { error: rawError } = await supabase
            .from('_temp_exec')
            .select('*')
            .eq('query', `DROP TABLE IF EXISTS ${tableName} CASCADE`);

          if (rawError) {
            console.log(`❌ Erro ao tentar remover ${tableName}: ${rawError.message}`);
          } else {
            console.log(`✅ Tabela ${tableName} removida com sucesso`);
          }
        } else {
          console.log(`✅ Tabela ${tableName} removida com sucesso`);
        }
      } catch (err) {
        console.log(`⚠️  Erro ao remover ${tableName}: ${err.message}`);
      }
    }

    console.log('\n🎉 LIMPEZA FINALIZADA!');
    console.log('📋 Execute novamente o script de verificação para ver o resultado.');

  } catch (error) {
    console.error('❌ ERRO GERAL:', error.message);
    process.exit(1);
  }
}

// Executar verificação por padrão
const action = process.argv[2];

if (action === 'cleanup') {
  cleanupTables();
} else {
  checkTables();
}
