import { Router, Request, Response } from 'express';
import { updatePaymentStatus } from '../services/PaymentService';
import { createCalendarEvent } from '../services/google-calendar';

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

    // Verificar se este webhook já foi processado (prevenir duplicatas)
    const { supabaseAdmin } = require('../lib/supabase');
    const { data: existingLog } = await supabaseAdmin
      .from('webhook_logs')
      .select('id, status')
      .eq('payment_id', payment.id)
      .eq('asaas_event', event)
      .eq('status', 'processed')
      .single();

    if (existingLog) {
      console.log(`⚠️ Webhook já processado anteriormente: ${event} para ${payment.id}`);
      return res.status(200).json({
        success: true,
        message: 'Webhook já processado anteriormente'
      });
    }

    // Só processar eventos relevantes de pagamento
    const relevantEvents = ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', 'PAYMENT_OVERDUE', 'PAYMENT_DELETED', 'PAYMENT_PENDING', 'PAYMENT_CREATED'];
    if (!relevantEvents.includes(event)) {
      console.log(`ℹ️ Evento não relevante ignorado: ${event}`);
      return res.status(200).json({
        success: true,
        message: 'Evento não relevante, ignorado'
      });
    }

    // Log do webhook no banco para auditoria
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

    // Se não encontrou na tabela payments, tentar buscar pelo payment_id no agendamento
    let agendamentoId = paymentRecord?.agendamento_id;
    
    if (!agendamentoId) {
      console.log(`🔍 Procurando agendamento diretamente pelo payment_id: ${payment.id}`);
      const { data: agendamento, error: agendamentoError } = await supabaseAdmin
        .from('agendamentos')
        .select('id, user_id')
        .eq('payment_id', payment.id)
        .single();
        
      if (agendamentoError) {
        console.error('❌ Erro ao buscar agendamento pelo payment_id:', agendamentoError);
      } else if (agendamento) {
        agendamentoId = agendamento.id;
        console.log(`✅ Agendamento encontrado: ${agendamentoId}`);
      }
    }

    // Se houver agendamento_id, atualizar status do agendamento
    if (agendamentoId) {
      // Reconhecer todos os status válidos do Asaas que indicam pagamento concluído
      const completedStatuses = ['RECEIVED', 'CONFIRMED', 'PAID', 'COMPLETED', 'APPROVED'];
      const agendamentoStatus = completedStatuses.includes(payment.status)
        ? 'CONFIRMED'
        : payment.status;

      const { error: agendamentoError } = await supabaseAdmin
        .from('agendamentos')
        .update({
          status: agendamentoStatus,
          payment_status: payment.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', agendamentoId);

      if (agendamentoError) {
        console.error('❌ Erro ao atualizar status do agendamento:', agendamentoError);
      } else {
        console.log(`✅ Agendamento ${agendamentoId} atualizado para ${agendamentoStatus}`);

        // Se o agendamento foi confirmado, criar evento no Google Calendar
        if (agendamentoStatus === 'CONFIRMED') {
          try {
            // Buscar dados do agendamento para criar o evento
            const { data: agendamento, error: agendamentoFetchError } = await supabaseAdmin
              .from('agendamentos')
              .select('*')
              .eq('id', agendamentoId)
              .single();

            if (agendamentoFetchError) {
              console.error('❌ Erro ao buscar dados do agendamento para criar evento:', agendamentoFetchError);
            } else if (agendamento) {
              console.log(`📅 Criando evento no Google Calendar para agendamento ${paymentRecord.agendamento_id}`);

              // Criar evento no Google Calendar
              const { eventId, meetLink } = await createCalendarEvent({
                date: agendamento.data,
                time: agendamento.horario,
                summary: `Consulta - ${agendamento.cliente_nome}`,
                description: agendamento.descricao || 'Consulta de alinhamento inicial',
                attendees: [agendamento.cliente_email],
                durationMinutes: 45
              });

              console.log(`🔍 Debug Google Calendar:`, {
                eventId,
                meetLink,
                hasEventId: !!eventId,
                hasMeetLink: !!meetLink,
                meetLinkLength: meetLink?.length,
                isEmptyString: meetLink === "",
                agendamentoId: agendamentoId
              });

              // Atualizar agendamento com o eventId e meetLink
              if (eventId || meetLink) {
                const updateData: any = { updated_at: new Date().toISOString() };
                if (eventId) updateData.calendar_event_id = eventId;
                // Sempre tentar salvar o meetLink, mesmo que seja vazio (para indicar que tentamos gerar)
                if (meetLink !== undefined) updateData.google_meet_link = meetLink;

                const { error: updateError } = await supabaseAdmin
                  .from('agendamentos')
                  .update(updateData)
                  .eq('id', agendamentoId);

                if (updateError) {
                  console.error('❌ Erro ao atualizar agendamento com dados do Google Calendar:', updateError);
                } else {
                  console.log(`✅ Agendamento ${agendamentoId} atualizado com evento do Google Calendar`);
                  if (meetLink) {
                    console.log(`🔗 Link do Google Meet: ${meetLink}`);
                  }
                }
              }
            }
          } catch (calendarError) {
            console.error('❌ Erro ao criar evento no Google Calendar:', calendarError);
            // Não falhar o webhook por causa do Google Calendar
          }
        }
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

    // Sempre retornar uma resposta para evitar looping
    try {
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
    } catch (logError) {
      console.error('Erro ao salvar log de erro do webhook:', logError);
    }

    // Sempre retornar 200 para evitar que o Asaas fique tentando reenviar
    res.status(200).json({
      success: false,
      message: 'Erro ao processar webhook, mas reconhecido',
      error: error instanceof Error ? error.message : 'Erro interno'
    });
  }
});

export default router;
