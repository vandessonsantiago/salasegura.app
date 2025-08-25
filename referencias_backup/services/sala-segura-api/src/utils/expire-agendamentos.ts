import { supabase } from '../config/supabase';

interface Agendamento {
  id: string;
  data: string;
  horario: string;
  cliente_nome: string;
  payment_id: string;
}

/**
 * Script para cancelar agendamentos expirados
 * Pode ser executado via cronjob ou manualmente
 */
export async function expireAgendamentos() {
  try {
    console.log('🕐 Iniciando verificação de agendamentos expirados...');
    
    // Buscar agendamentos PENDING que expiraram
    const { data: expiredAgendamentos, error } = await supabase
      .from('agendamentos')
      .select('id, data, horario, cliente_nome, payment_id')
      .eq('status', 'PENDING')
      .eq('payment_status', 'PENDING')
      .lt('pix_expires_at', new Date().toISOString());

    if (error) {
      console.error('❌ Erro ao buscar agendamentos expirados:', error);
      return;
    }

    if (!expiredAgendamentos || expiredAgendamentos.length === 0) {
      console.log('✅ Nenhum agendamento expirado encontrado');
      return;
    }

    console.log(`📋 Encontrados ${expiredAgendamentos.length} agendamentos expirados`);

    // Atualizar status para EXPIRED
    const { error: updateError } = await supabase
      .from('agendamentos')
      .update({
        status: 'EXPIRED',
        payment_status: 'EXPIRED',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'PENDING')
      .eq('payment_status', 'PENDING')
      .lt('pix_expires_at', new Date().toISOString());

    if (updateError) {
      console.error('❌ Erro ao atualizar agendamentos expirados:', updateError);
      return;
    }

    console.log(`✅ ${expiredAgendamentos.length} agendamentos marcados como expirados`);
    
    // Log dos agendamentos expirados
    expiredAgendamentos.forEach((agendamento: Agendamento) => {
      console.log(`📅 Agendamento expirado: ${agendamento.data} às ${agendamento.horario} - Cliente: ${agendamento.cliente_nome}`);
    });

  } catch (error) {
    console.error('❌ Erro ao executar expiração de agendamentos:', error);
  }
}

// Executar se chamado diretamente (CommonJS)
if (require.main === module) {
  expireAgendamentos()
    .then(() => {
      console.log('✅ Script de expiração concluído');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro no script de expiração:', error);
      process.exit(1);
    });
}
