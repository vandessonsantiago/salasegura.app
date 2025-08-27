import { Router, Request, Response } from 'express';
import { updatePaymentStatus } from '../services/PaymentService';

const router: Router = Router();

// Webhook do Asaas para atualização de status de pagamento
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('🔄 Webhook Asaas recebido:', JSON.stringify(req.body, null, 2));

    // O Asaas envia eventos de pagamento via POST
    const { event, payment } = req.body;

    // Validação básica
    if (!payment?.id || !event) {
      console.error('❌ Webhook inválido - faltando payment.id ou event');
      return res.status(400).json({ error: 'Dados do webhook inválidos' });
    }

    console.log(`📡 Processando webhook: ${event} para pagamento ${payment.id}`);

    // Log do webhook no banco para auditoria
    const { supabaseAdmin } = require('../lib/supabase');
    await supabaseAdmin
      .from('webhook_logs')
      .insert({
        asaas_event: event,
        payment_id: payment.id,
        payload: req.body,
        status: 'received'
      })
      .then(({ error }: { error: any }) => {
        if (error) console.error('Erro ao salvar log do webhook:', error);
      });

    // Atualiza status do pagamento no Supabase
    try {
      await updatePaymentStatus(payment.id, payment.status);
      console.log(`✅ Status do pagamento ${payment.id} atualizado para ${payment.status}`);
    } catch (error) {
      console.error(`❌ Erro ao atualizar status do pagamento ${payment.id}:`, error);
      return res.status(500).json({ error: 'Erro ao atualizar status do pagamento' });
    }

    // Buscar registro de pagamento para obter agendamento_id
    const { data: paymentRecord, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('agendamento_id, user_id')
      .eq('asaas_id', payment.id)
      .single();

    if (paymentError) {
      console.error('❌ Erro ao buscar pagamento para atualizar agendamento:', paymentError);
      // Mesmo com erro, continua o processamento
    }

    // Se houver agendamento_id, atualizar status do agendamento
    if (paymentRecord && paymentRecord.agendamento_id) {
      const agendamentoStatus = payment.status === 'RECEIVED' || payment.status === 'CONFIRMED'
        ? 'CONFIRMED'
        : payment.status;

      const { error: agendamentoError } = await supabaseAdmin
        .from('agendamentos')
        .update({
          status: agendamentoStatus,
          payment_status: payment.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentRecord.agendamento_id);

      if (agendamentoError) {
        console.error('❌ Erro ao atualizar status do agendamento:', agendamentoError);
      } else {
        console.log(`✅ Agendamento ${paymentRecord.agendamento_id} atualizado para ${agendamentoStatus}`);
      }
    }

    // Marcar log como processado
    await supabaseAdmin
      .from('webhook_logs')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString()
      })
      .eq('payment_id', payment.id)
      .eq('status', 'received');

    // Retorna sucesso para o Asaas
    console.log(`✅ Webhook ${event} processado com sucesso para pagamento ${payment.id}`);
    res.status(200).json({
      success: true,
      message: 'Webhook processado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro geral no webhook Asaas:', error);

    // Log do erro
    const { supabaseAdmin } = require('../lib/supabase');
    await supabaseAdmin
      .from('webhook_logs')
      .insert({
        asaas_event: req.body?.event || 'unknown',
        payment_id: req.body?.payment?.id || 'unknown',
        payload: req.body || {},
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Erro desconhecido'
      })
      .then(({ error: logError }: { error: any }) => {
        if (logError) console.error('Erro ao salvar log de erro:', logError);
      });

    res.status(500).json({
      error: 'Erro ao processar webhook',
      details: error instanceof Error ? error.message : 'Erro interno'
    });
  }
});

export default router;
