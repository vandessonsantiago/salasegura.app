import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessários');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function disableRLS() {
  console.log('🔧 Desabilitando RLS na tabela agendamentos...');
  
  // Tentar executar SQL direto
  const { data, error } = await supabase
    .from('agendamentos')
    .select('*')
    .limit(1);

  if (error && error.code === '42501') {
    console.log('❌ Confirmado: problema de permissão RLS');
    console.log('📋 Execute manualmente no Supabase SQL Editor:');
    console.log('   ALTER TABLE public.agendamentos DISABLE ROW LEVEL SECURITY;');
    console.log('   ALTER TABLE public.conversions DISABLE ROW LEVEL SECURITY;');
    process.exit(1);
  } else if (error) {
    console.error('❌ Outro erro:', error);
    process.exit(1);
  }

  console.log('✅ Tabela acessível! RLS pode já estar desabilitado.');
}

disableRLS();
