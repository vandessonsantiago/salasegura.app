const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL ou SUPABASE_ANON_KEY não encontrados');
  console.log('SUPABASE_URL:', supabaseUrl);
  console.log('SUPABASE_ANON_KEY:', supabaseKey ? 'Presente' : 'Ausente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumns() {
  try {
    console.log('🔄 Adicionando colunas service_type e service_data à tabela agendamentos...');

    // Primeiro, vamos verificar se as colunas já existem
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'agendamentos')
      .eq('table_schema', 'public');

    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError);
      return;
    }

    const existingColumns = columns.map(col => col.column_name);
    console.log('📋 Colunas existentes:', existingColumns);

    const hasServiceType = existingColumns.includes('service_type');
    const hasServiceData = existingColumns.includes('service_data');

    console.log('🔍 service_type existe:', hasServiceType);
    console.log('🔍 service_data existe:', hasServiceData);

    if (!hasServiceType || !hasServiceData) {
      console.log('⚠️ Colunas faltando, tentando adicionar...');

      // Tentar adicionar as colunas usando uma função RPC
      const { error } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE public.agendamentos
              ADD COLUMN IF NOT EXISTS service_type TEXT,
              ADD COLUMN IF NOT EXISTS service_data JSONB;`
      });

      if (error) {
        console.error('❌ Erro ao adicionar colunas via RPC:', error);

        // Tentar abordagem alternativa - verificar se podemos fazer update
        console.log('🔄 Tentando abordagem alternativa...');

        // Vamos tentar fazer um select simples para ver se conseguimos acessar a tabela
        const { data: testData, error: testError } = await supabase
          .from('agendamentos')
          .select('id')
          .limit(1);

        if (testError) {
          console.error('❌ Erro ao acessar tabela agendamentos:', testError);
        } else {
          console.log('✅ Tabela agendamentos acessível, mas colunas podem estar faltando');
        }
      } else {
        console.log('✅ Colunas adicionadas com sucesso via RPC!');
      }
    } else {
      console.log('✅ Todas as colunas já existem!');
    }

  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

addColumns();
