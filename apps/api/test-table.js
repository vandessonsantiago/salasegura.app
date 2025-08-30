import { supabaseAdmin } from './dist/lib/supabase.cjs';

async function addMissingColumns() {
  console.log('🔧 Adicionando colunas faltantes à tabela agendamentos...');

  try {
    // Executar SQL para adicionar as colunas faltantes
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.agendamentos
        ADD COLUMN IF NOT EXISTS service_type TEXT,
        ADD COLUMN IF NOT EXISTS service_data JSONB;
      `
    });

    if (error) {
      console.error('❌ Erro ao adicionar colunas:', error);
      return false;
    }

    console.log('✅ Colunas adicionadas com sucesso');
    return true;

  } catch (error) {
    console.error('❌ Erro inesperado ao adicionar colunas:', error);
    return false;
  }
}

async function testAgendamentosTable() {
  console.log('🔍 Testando estrutura da tabela agendamentos...');

  // Primeiro, tentar adicionar as colunas faltantes
  const columnsAdded = await addMissingColumns();

  try {
    // Tentar fazer uma consulta simples para ver se a tabela existe
    const { data, error } = await supabaseAdmin
      .from('agendamentos')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Erro ao consultar tabela agendamentos:', error);
      return;
    }

    console.log('✅ Tabela agendamentos existe');
    console.log('📊 Estrutura dos dados:', data);

    // Tentar inserir um registro de teste com as colunas service_type e service_data
    const testData = {
      id: 'test-' + Date.now(),
      user_id: 'test-user',
      status: 'pending_payment',
      payment_status: 'pending',
      valor: 99.00,
      descricao: 'Teste de agendamento',
      service_type: 'divorcio',
      service_data: { test: true },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('🧪 Tentando inserir dados de teste:', testData);

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('agendamentos')
      .insert([testData])
      .select();

    if (insertError) {
      console.error('❌ Erro ao inserir dados de teste:', insertError);
      console.error('🔍 Detalhes do erro:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
    } else {
      console.log('✅ Inserção de teste bem-sucedida:', insertData);

      // Limpar o registro de teste
      await supabaseAdmin
        .from('agendamentos')
        .delete()
        .eq('id', testData.id);
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

testAgendamentosTable();
