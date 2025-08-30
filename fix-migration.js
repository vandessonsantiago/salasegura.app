const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🔧 Aplicando correções no schema...');

    // SQL para aplicar as correções
    const migrationSQL = `
      -- Remover foreign key constraint
      ALTER TABLE public.divorce_cases DROP CONSTRAINT IF EXISTS divorce_cases_payment_id_fkey;

      -- Alterar payment_id para TEXT
      ALTER TABLE public.divorce_cases ALTER COLUMN payment_id TYPE TEXT;

      -- Adicionar payment_status
      ALTER TABLE public.divorce_cases ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'PENDING';

      -- Criar tabela webhook_logs
      CREATE TABLE IF NOT EXISTS public.webhook_logs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        asaas_event TEXT NOT NULL,
        payment_id TEXT NOT NULL,
        payload JSONB,
        status TEXT DEFAULT 'received',
        processed_at TIMESTAMP WITH TIME ZONE,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Criar índices
      CREATE INDEX IF NOT EXISTS idx_webhook_logs_payment_id ON public.webhook_logs(payment_id);
      CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON public.webhook_logs(status);
      CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON public.webhook_logs(created_at);

      -- Atualizar registros existentes
      UPDATE public.divorce_cases SET payment_status = 'PENDING' WHERE payment_status IS NULL;
    `;

    console.log('📝 Executando SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Erro na migração:', error);

      // Tentar abordagem alternativa usando informações do schema
      console.log('🔄 Tentando abordagem alternativa...');

      // Verificar se conseguimos pelo menos ler a tabela
      const { data: testData, error: testError } = await supabase
        .from('divorce_cases')
        .select('*')
        .limit(1);

      if (testError) {
        console.error('❌ Erro ao acessar tabela divorce_cases:', testError);
      } else {
        console.log('✅ Tabela divorce_cases acessível');
        console.log('📊 Dados de teste:', testData);
      }
    } else {
      console.log('✅ Migração aplicada com sucesso!');
      console.log('📊 Resultado:', data);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

applyMigration();
