import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lphpcjccvfgmlxygclmt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwaHBjamNjdmZnbWx4eWdjbG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA2MDAzNCwiZXhwIjoyMDcxNjM2MDM0fQ.x_wkqY9Z0DgwYqX3Lp7og0HnqPaX__F2ATWLWuuy5Nk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeMigration() {
  console.log('🔧 Executando migração: Adicionando colunas service_type e service_data à tabela agendamentos...');

  try {
    // SQL para adicionar as colunas faltantes
    const migrationSQL = `
      ALTER TABLE public.agendamentos
      ADD COLUMN IF NOT EXISTS service_type TEXT,
      ADD COLUMN IF NOT EXISTS service_data JSONB;
    `;

    console.log('📝 SQL a ser executado:', migrationSQL);

    // Usar rpc para executar SQL (se disponível) ou tentar uma abordagem alternativa
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Erro ao executar migração via RPC:', error);

      // Tentar abordagem alternativa: verificar se as colunas existem fazendo uma consulta de teste
      console.log('🔄 Tentando abordagem alternativa...');

      // Tentar fazer uma consulta que usa essas colunas para ver se existem
      const testQuery = await supabase
        .from('agendamentos')
        .select('id, service_type, service_data')
        .limit(1);

      if (testQuery.error && testQuery.error.message.includes('service_data')) {
        console.log('❌ As colunas ainda não existem. Você precisa executar a migração manualmente no painel do Supabase.');

        console.log('\n📋 SQL para executar no painel do Supabase:');
        console.log('```sql');
        console.log(migrationSQL);
        console.log('```');

        console.log('\n🔗 Passos para executar no Supabase:');
        console.log('1. Acesse https://supabase.com/dashboard/project/lphpcjccvfgmlxygclmt');
        console.log('2. Vá para "SQL Editor"');
        console.log('3. Cole e execute o SQL acima');
        console.log('4. Após executar, atualize AGENDAMENTOS_HAS_SERVICE_COLUMNS=true no .env');
        console.log('5. Reinicie o servidor');

        return false;
      } else {
        console.log('✅ As colunas já existem ou foram adicionadas com sucesso!');
        return true;
      }
    }

    console.log('✅ Migração executada com sucesso via RPC:', data);
    return true;

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return false;
  }
}

async function testColumns() {
  console.log('\n🧪 Testando se as colunas existem...');

  try {
    // Tentar inserir um registro de teste
    const testData = {
      id: 'migration-test-' + Date.now(),
      user_id: 'test-user',
      status: 'pending_payment',
      payment_status: 'pending',
      valor: 1.00,
      descricao: 'Teste de migração',
      service_type: 'test',
      service_data: { migration: true },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('agendamentos')
      .insert([testData])
      .select();

    if (error) {
      console.error('❌ Erro no teste de inserção:', error);
      return false;
    }

    console.log('✅ Teste de inserção bem-sucedido:', data[0].id);

    // Limpar o registro de teste
    await supabase
      .from('agendamentos')
      .delete()
      .eq('id', testData.id);

    console.log('🧹 Registro de teste removido');
    return true;

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando migração do banco de dados...\n');

  const migrationSuccess = await executeMigration();

  if (migrationSuccess) {
    console.log('\n🎉 Migração concluída com sucesso!');
    console.log('📝 Lembre-se de atualizar o .env:');
    console.log('   AGENDAMENTOS_HAS_SERVICE_COLUMNS=true');
    console.log('🔄 E reiniciar o servidor');
  } else {
    console.log('\n⚠️  Migração pode precisar ser executada manualmente');
  }

  // Testar as colunas independentemente
  await testColumns();
}

main();
