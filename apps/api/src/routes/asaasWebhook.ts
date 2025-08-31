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
    const { data: existingLogs } = await supabaseAdmin
      .from('webhook_logs')
      .select('id, status, created_at')
      .eq('payment_id', payment.id)
      .eq('event_type', event)
      .order('created_at', { ascending: false })
      .limit(5);

    // Se já existe um log processado para este evento, ignorar
    const alreadyProcessed = existingLogs?.some((log: any) => log.status === 'processed');
    if (alreadyProcessed) {
      console.log(`⚠️ Webhook já processado anteriormente: ${event} para ${payment.id}`);
      return res.status(200).json({
        success: true,
        message: 'Webhook já processado anteriormente'
      });
    }

    // Se há múltiplos logs 'received' recentes (últimos 5 minutos), pode ser duplicação
    const recentReceivedLogs = existingLogs?.filter((log: any) => {
      const logTime = new Date(log.created_at);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return log.status === 'received' && logTime > fiveMinutesAgo;
    }) || [];

    if (recentReceivedLogs.length > 0) {
      console.log(`⚠️ Webhook possivelmente duplicado detectado: ${event} para ${payment.id} (${recentReceivedLogs.length} logs recentes)`);
      // Ainda processa, mas loga o possível duplicado
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
    // Primeiro, encontrar o registro de pagamento pelo asaas_id
    const { data: webhookPaymentRecord } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('asaas_id', payment.id)
      .single();

    await supabaseAdmin
      .from('webhook_logs')
      .insert({
        event_type: event,
        payment_id: webhookPaymentRecord?.id || null, // Usar o UUID interno, não o asaas_id
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

    // Se houver agendamento_id, atualizar status do agendamento/caso
    if (agendamentoId) {
      // Primeiro determinar se é agendamento ou divórcio
      let serviceType = 'agendamento';
      let tableName = 'agendamentos';

      // Verificar se existe na tabela divorce_cases
      const { data: divorceCheck } = await supabaseAdmin
        .from('divorce_cases')
        .select('id')
        .eq('id', agendamentoId)
        .single();

      if (divorceCheck) {
        serviceType = 'divorcio';
        tableName = 'divorce_cases';
        console.log(`🏛️ Webhook detectou caso de divórcio: ${agendamentoId}`);
      } else {
        console.log(`📅 Webhook detectou agendamento: ${agendamentoId}`);
      }

      // Reconhecer todos os status válidos do Asaas que indicam pagamento concluído
      const completedStatuses = ['RECEIVED', 'CONFIRMED', 'PAID', 'COMPLETED', 'APPROVED'];
      const recordStatus = completedStatuses.includes(payment.status)
        ? 'CONFIRMED'
        : payment.status;

      const { error: updateError } = await supabaseAdmin
        .from(tableName)
        .update({
          status: recordStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', agendamentoId);

      if (updateError) {
        console.error(`❌ Erro ao atualizar ${serviceType}:`, updateError);
      } else {
        console.log(`✅ ${serviceType} ${agendamentoId} atualizado para ${recordStatus}`);

        // Se o agendamento/caso foi confirmado, criar evento no Google Calendar
        if (recordStatus === 'CONFIRMED') {
          try {
            // Primeiro tentar buscar na tabela agendamentos
            let agendamento = null;
            serviceType = 'agendamento';

            const { data: agendamentoData, error: agendamentoFetchError } = await supabaseAdmin
              .from('agendamentos')
              .select('*')
              .eq('id', agendamentoId)
              .single();

            if (agendamentoData) {
              agendamento = agendamentoData;
              serviceType = 'agendamento';
            } else {
              // Se não encontrou em agendamentos, tentar buscar em divorce_cases
              console.log(`🔄 Agendamento não encontrado, tentando buscar em divorce_cases: ${agendamentoId}`);
              const { data: divorceData, error: divorceFetchError } = await supabaseAdmin
                .from('divorce_cases')
                .select('*')
                .eq('id', agendamentoId)
                .single();

              if (divorceData) {
                agendamento = divorceData;
                serviceType = 'divorcio';
                console.log(`✅ Caso de divórcio encontrado: ${agendamentoId}`);
              } else {
                console.error('❌ Erro ao buscar dados do agendamento/divórcio para criar evento:', agendamentoFetchError || divorceFetchError);
              }
            }

            if (agendamento) {
              console.log(`📅 Criando evento no Google Calendar para ${serviceType} ${paymentRecord.agendamento_id}`);

              // Adaptar campos baseado no tipo de serviço
              const eventData = {
                date: serviceType === 'agendamento' ? agendamento.data : null, // Divórcios podem não ter data específica
                time: serviceType === 'agendamento' ? agendamento.horario : '09:00', // Horário padrão para divórcios
                summary: serviceType === 'agendamento'
                  ? `Consulta - ${agendamento.cliente_nome}`
                  : `Divórcio Express - ${agendamento.cliente_nome}`,
                description: serviceType === 'agendamento'
                  ? (agendamento.descricao || 'Consulta de alinhamento inicial')
                  : (agendamento.descricao || 'Processo de divórcio express'),
                attendees: [agendamento.cliente_email],
                durationMinutes: serviceType === 'agendamento' ? 45 : 60 // Duração diferente para divórcios
              };

              // Só criar evento se tiver data (para agendamentos) ou para divórcios sem data específica
              if (eventData.date || serviceType === 'divorcio') {
                const { eventId, meetLink } = await createCalendarEvent(eventData);

                console.log(`🔍 Debug Google Calendar:`, {
                  eventId,
                  meetLink,
                  hasEventId: !!eventId,
                  hasMeetLink: !!meetLink,
                  meetLinkLength: meetLink?.length,
                  isEmptyString: meetLink === "",
                  agendamentoId: agendamentoId,
                  serviceType: serviceType
                });

                // Atualizar o registro com dados do Google Calendar
                if (eventId || meetLink) {
                  const updateData: any = {
                    calendar_event_id: eventId,
                    updated_at: new Date().toISOString()
                  };

                  if (meetLink) {
                    updateData.google_meet_link = meetLink;
                  }

                  const tableToUpdate = serviceType === 'agendamento' ? 'agendamentos' : 'divorce_cases';
                  const { error: updateCalendarError } = await supabaseAdmin
                    .from(tableToUpdate)
                    .update(updateData)
                    .eq('id', agendamentoId);

                  if (updateCalendarError) {
                    console.error(`❌ Erro ao atualizar ${tableToUpdate} com dados do Google Calendar:`, updateCalendarError);
                  } else {
                    console.log(`✅ ${tableToUpdate} atualizado com dados do Google Calendar`);
                  }
                }
              } else {
                console.log(`⚠️ Pulando criação de evento: ${serviceType} sem data definida`);
              }
            }
          } catch (calendarError) {
            console.error('❌ Erro ao criar evento no Google Calendar:', calendarError);
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
          event_type: req.body?.event || 'unknown',
          payment_id: req.body?.payment?.id || 'unknown',
          payload: req.body || {},
          status: 'error'
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
