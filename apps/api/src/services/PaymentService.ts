import { supabaseAdmin } from '../lib/supabase';

/**
 * Atualiza o status do pagamento no Supabase
 * @param paymentId string - ID do pagamento Asaas
 * @param status string - Novo status (ex: RECEIVED, CONFIRMED, PENDING)
 */
export async function updatePaymentStatus(paymentId: string, status: string) {
  // Exemplo: tabela 'payments' com colunas 'asaas_id' e 'status'
  const { error } = await supabaseAdmin
    .from('payments')
    .update({ status })
    .eq('asaas_id', paymentId);

  if (error) {
    throw new Error('Erro ao atualizar status no Supabase: ' + error.message);
  }
}
