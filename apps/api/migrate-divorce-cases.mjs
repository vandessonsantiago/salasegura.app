import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lphpcjccvfgmlxygclmt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwaHBjamNjdmZnbWx4eWdjbG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA2MDAzNCwiZXhwIjoyMDcxNjM2MDM0fQ.x_wkqY9Z0DgwYqX3Lp7og0HnqPaX__F2ATWLWuuy5Nk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeMigration() {
  console.log('🔧 Executando migração: Adicionando colunas cliente_nome, cliente_email, cliente_telefone e service_data à tabela divorce_cases...');

  try {
    // SQL para adicionar as colunas faltantes
    const migrationSQL = `
      -- Add cliente_nome column if it doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'divorce_cases' AND column_name = 'cliente_nome') THEN
          ALTER TABLE divorce_cases ADD COLUMN cliente_nome TEXT;
        END IF;
      END $$;

      -- Add cliente_email column if it doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'divorce_cases' AND column_name = 'cliente_email') THEN
          ALTER TABLE divorce_cases ADD COLUMN cliente_email TEXT;
        END IF;
      END $$;

      -- Add cliente_telefone column if it doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'divorce_cases' AND column_name = 'cliente_telefone') THEN
          ALTER TABLE divorce_cases ADD COLUMN cliente_telefone TEXT;
        END IF;
      END $$;

      -- Add service_data column if it doesn't exist (JSONB for flexible data storage)
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'divorce_cases' AND column_name = 'service_data') THEN
          ALTER TABLE divorce_cases ADD COLUMN service_data JSONB;
        END IF;
      END $$;

      -- Create indexes for the new columns
      CREATE INDEX IF NOT EXISTS idx_divorce_cases_cliente_email ON divorce_cases(cliente_email);
      CREATE INDEX IF NOT EXISTS idx_divorce_cases_cliente_telefone ON divorce_cases(cliente_telefone);
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
        .from('divorce_cases')
        .select('id, cliente_nome, cliente_email, cliente_telefone, service_data')
        .limit(1);

      if (testQuery.error && (testQuery.error.message.includes('cliente_email') || testQuery.error.message.includes('cliente_nome'))) {
        console.log('❌ As colunas ainda não existem. Você precisa executar a migração manualmente no painel do Supabase.');

        console.log('\n📋 SQL para executar no painel do Supabase:');
        console.log('```sql');
        console.log(migrationSQL);
        console.log('```');

        console.log('\n🔗 Passos para executar no Supabase:');
        console.log('1. Acesse https://supabase.com/dashboard/project/lphpcjccvfgmlxygclmt');
        console.log('2. Vá para "SQL Editor"');
        console.log('3. Cole e execute o SQL acima');
        console.log('4. Após executar, teste o fluxo de divórcio novamente');

        return;
      } else {
        console.log('✅ Colunas já existem ou foram adicionadas com sucesso!');
      }
    } else {
      console.log('✅ Migração executada com sucesso via RPC!');
    }

    // Verificar se as colunas foram adicionadas
    console.log('🔍 Verificando se as colunas foram adicionadas...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'divorce_cases')
      .in('column_name', ['cliente_nome', 'cliente_email', 'cliente_telefone', 'service_data']);

    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError);
    } else {
      console.log('📊 Colunas encontradas na tabela divorce_cases:', columns.map(c => c.column_name));
    }

  } catch (error) {
    console.error('❌ Erro geral na migração:', error);
  }
}

// Executar a migração
executeMigration();
