import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

console.log('🔧 Configurações carregadas:');
console.log('   SUPABASE_URL:', supabaseUrl ? '✅ Definido' : '❌ Não definido');
console.log('   SUPABASE_SECRET_KEY:', supabaseKey ? '✅ Definido' : '❌ Não definido');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Configurações incompletas. Verifique o arquivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n🔍 Testando conexão com Supabase...');

    // Teste simples: tentar fazer uma query na tabela information_schema
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5);

    if (error) {
      console.error('❌ Erro de conexão:', error.message);
      console.error('Código do erro:', error.code);
      return;
    }

    console.log('✅ Conexão bem-sucedida!');
    console.log('📊 Primeiras tabelas encontradas:');

    if (data && data.length > 0) {
      data.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.table_name}`);
      });
    } else {
      console.log('   Nenhuma tabela encontrada ainda.');
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

testConnection();
