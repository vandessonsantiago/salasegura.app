import { Router, Request, Response } from 'express';
import { updatePaymentStatus } from '../services/PaymentService';

const router: Router = Router();

// Webhook do Asaas para atualização de status de pagamento
router.post('/', async (req: Request, res: Response) => {
  try {
    // O Asaas envia eventos de pagamento via POST
    const { event, payment } = req.body;
    // Exemplo: event = 'PAYMENT_RECEIVED', payment = { id, status, ... }
    if (!payment?.id || !event) {
      return res.status(400).json({ error: 'Dados do webhook inválidos' });
    }

    // Atualiza status do pagamento no Supabase
    await updatePaymentStatus(payment.id, payment.status);

    // Buscar registro de pagamento para obter agendamento_id
    const { supabaseAdmin } = require('../lib/supabase');
    const { data: paymentRecord, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('agendamento_id')
      .eq('asaas_id', payment.id)
      .single();

    if (paymentError) {
      console.error('Erro ao buscar pagamento para atualizar agendamento:', paymentError);
    }

    // Se houver agendamento_id, atualizar status do agendamento
    if (paymentRecord && paymentRecord.agendamento_id) {
      const agendamentoStatus = payment.status === 'RECEIVED' || payment.status === 'CONFIRMED' ? 'CONFIRMED' : payment.status;
      const { error: agendamentoError } = await supabaseAdmin
        .from('agendamentos')
        .update({ status: agendamentoStatus })
        .eq('id', paymentRecord.agendamento_id);
      if (agendamentoError) {
        console.error('Erro ao atualizar status do agendamento:', agendamentoError);
      }
    }

    // Retorna sucesso para o Asaas
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro no webhook Asaas:', error);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
});

export default router;
