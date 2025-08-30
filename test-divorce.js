// Script para testar a API de casos de divórcio
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDivorceCases() {
  try {
    console.log('🔍 Testando casos de divórcio no banco...');

    // Buscar todos os casos
    const { data: cases, error } = await supabase
      .from('divorce_cases')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Erro ao buscar casos:', error);
      return;
    }

    console.log('📋 Casos encontrados:', cases?.length || 0);
    cases?.forEach((case_, index) => {
      console.log(`${index + 1}. ID: ${case_.id}`);
      console.log(`   Status: ${case_.status}`);
      console.log(`   Cliente: ${case_.cliente_nome || 'N/A'}`);
      console.log(`   Payment ID: ${case_.payment_id || 'N/A'}`);
      console.log(`   Criado: ${case_.created_at}`);
      console.log('---');
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testDivorceCases();
