import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lphpcjccvfgmlxygclmt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwaHBjamNjdmZnbWx4eWdjbG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA2MDAzNCwiZXhwIjoyMDcxNjM2MDM0fQ.x_wkqY9Z0DgwYqX3Lp7og0HnqPaX__F2ATWLWuuy5Nk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testColumns() {
  console.log('🔍 Testando se as colunas existem...');
  try {
    const { data, error } = await supabase
      .from('divorce_cases')
      .select('id, cliente_nome, cliente_email, cliente_telefone, service_data')
      .limit(1);

    if (error) {
      console.log('❌ Erro ao consultar colunas:', error.message);
      return false;
    } else {
      console.log('✅ Colunas existem! Dados de teste:', data);
      return true;
    }
  } catch (err) {
    console.log('❌ Erro geral:', err.message);
    return false;
  }
}

testColumns();
