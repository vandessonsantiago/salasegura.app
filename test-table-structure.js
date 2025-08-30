const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAgendamentosTable() {
  console.log('🔍 Testando estrutura da tabela agendamentos...');

  try {
    // Tentar fazer uma consulta simples para ver se a tabela existe
    const { data, error } = await supabase
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

    const { data: insertData, error: insertError } = await supabase
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
      await supabase
        .from('agendamentos')
        .delete()
        .eq('id', testData.id);
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

testAgendamentosTable();

async function testAgendamentosTable() {
  console.log('🔍 Testando estrutura da tabela agendamentos...');

  try {
    // Tentar fazer uma consulta simples para ver se a tabela existe
    const { data, error } = await supabase
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

    const { data: insertData, error: insertError } = await supabase
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
      await supabase
        .from('agendamentos')
        .delete()
        .eq('id', testData.id);
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

testAgendamentosTable();
