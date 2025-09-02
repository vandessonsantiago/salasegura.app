import { supabaseAdmin } from '../lib/supabase';
import { PaymentService } from './PaymentService';
import { createCalendarEvent } from './google-calendar';

export interface WebhookPayload {
  event: string;
  payment: {
    id: string;
    status: string;
  };
}

export class WebhookService {
  /**
   * Processa webhook do Asaas
   */
  static async processarWebhookAsaas(payload: WebhookPayload): Promise<{ success: boolean; message: string }> {
    try {
      const { event, payment } = payload;

      console.log(`📡 Processando webhook: ${event} para pagamento ${payment.id}`);

      // Verificar se webhook já foi processado
      if (await this.webhookJaProcessado(payment.id, event)) {
        return { success: true, message: 'Webhook já processado anteriormente' };
      }

      // Só processar eventos relevantes
      if (!this.eventoRelevante(event)) {
        return { success: true, message: 'Evento não relevante, ignorado' };
      }

      // Log do webhook
      await this.logWebhook(payload);

      // Atualizar status do pagamento
      await PaymentService.updatePaymentStatus(payment.id, payment.status);

      // Processar agendamento/divórcio
      await this.processarEntidade(payment.id, payment.status);

      // Marcar como processado
      await this.marcarComoProcessado(payment.id, event);

      return { success: true, message: 'Webhook processado com sucesso' };
    } catch (error: any) {
      console.error('❌ Erro no processamento do webhook:', error);
      await this.logErroWebhook(payload, error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Verifica se webhook já foi processado
   */
  private static async webhookJaProcessado(paymentId: string, event: string): Promise<boolean> {
    const { data: existingLogs } = await supabaseAdmin
      .from('webhook_logs')
      .select('id, status')
      .eq('payment_id', paymentId)
      .eq('event_type', event)
      .eq('status', 'processed')
      .limit(1);

    return !!(existingLogs && existingLogs.length > 0);
  }

  /**
   * Verifica se evento é relevante
   */
  private static eventoRelevante(event: string): boolean {
    const relevantEvents = [
      'PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', 'PAYMENT_OVERDUE',
      'PAYMENT_DELETED', 'PAYMENT_PENDING', 'PAYMENT_CREATED'
    ];
    return relevantEvents.includes(event);
  }

  /**
   * Log do webhook no banco
   */
  private static async logWebhook(payload: WebhookPayload): Promise<void> {
    const { data: paymentRecord } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('asaas_id', payload.payment.id)
      .single();

    await supabaseAdmin
      .from('webhook_logs')
      .insert({
        event_type: payload.event,
        payment_id: paymentRecord?.id || null,
        payload: payload,
        status: 'received'
      });
  }

  /**
   * Processa entidade (agendamento ou divórcio)
   */
  private static async processarEntidade(paymentId: string, status: string): Promise<void> {
    // Buscar agendamento_id
    const { data: paymentRecord } = await supabaseAdmin
      .from('payments')
      .select('agendamento_id')
      .eq('asaas_id', paymentId)
      .single();

    if (!paymentRecord?.agendamento_id) return;

    const agendamentoId = paymentRecord.agendamento_id;

    // Determinar tipo de serviço
    const serviceType = await this.determinarTipoServico(agendamentoId);
    const tableName = serviceType === 'divorcio' ? 'divorce_cases' : 'agendamentos';

    // Atualizar status
    await this.atualizarStatusEntidade(tableName, agendamentoId, status);

    // Se confirmado, criar evento no Google Calendar (apenas para agendamentos)
    if (this.pagamentoConfirmado(status) && serviceType === 'agendamento') {
      await this.criarEventoCalendario(agendamentoId);
    }
  }

  /**
   * Determina tipo de serviço
   */
  private static async determinarTipoServico(entidadeId: string): Promise<'agendamento' | 'divorcio'> {
    const { data: divorceCheck } = await supabaseAdmin
      .from('divorce_cases')
      .select('id')
      .eq('id', entidadeId)
      .single();

    return divorceCheck ? 'divorcio' : 'agendamento';
  }

  /**
   * Atualiza status da entidade
   */
  private static async atualizarStatusEntidade(tableName: string, entidadeId: string, status: string): Promise<void> {
    const recordStatus = this.pagamentoConfirmado(status) ? 'payment_received' : status;

    const { error } = await supabaseAdmin
      .from(tableName)
      .update({
        status: recordStatus,
        payment_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', entidadeId);

    if (error) {
      console.error(`❌ Erro ao atualizar ${tableName}:`, error);
    } else {
      console.log(`✅ ${tableName} ${entidadeId} atualizado para ${recordStatus}`);
    }
  }

  /**
   * Verifica se pagamento foi confirmado
   */
  private static pagamentoConfirmado(status: string): boolean {
    const completedStatuses = ['RECEIVED', 'CONFIRMED', 'PAID', 'COMPLETED', 'APPROVED'];
    return completedStatuses.includes(status);
  }

  /**
   * Cria evento no Google Calendar
   */
  private static async criarEventoCalendario(agendamentoId: string): Promise<void> {
    try {
      const { data: agendamento } = await supabaseAdmin
        .from('agendamentos')
        .select('*')
        .eq('id', agendamentoId)
        .single();

      if (!agendamento) return;

      const eventData = {
        date: agendamento.data,
        time: agendamento.horario,
        summary: `Consulta - ${agendamento.cliente_nome}`,
        description: agendamento.descricao || 'Consulta de alinhamento inicial',
        attendees: [agendamento.cliente_email],
        durationMinutes: 45
      };

      const { eventId, meetLink } = await createCalendarEvent(eventData);

      console.log('🔍 [WEBHOOK] Resultado do createCalendarEvent:', {
        agendamentoId,
        eventId,
        meetLink,
        meetLinkType: typeof meetLink,
        meetLinkLength: meetLink?.length,
        hasEventId: !!eventId,
        hasMeetLink: !!meetLink
      });

      if (eventId || meetLink) {
        const updateData: any = {
          calendar_event_id: eventId,
          updated_at: new Date().toISOString()
        };

        if (meetLink) {
          updateData.google_meet_link = meetLink;
          console.log('🔍 [WEBHOOK] Adicionando google_meet_link aos dados de atualização:', meetLink);
        }

        const { error: updateError } = await supabaseAdmin
          .from('agendamentos')
          .update(updateData)
          .eq('id', agendamentoId);

        if (updateError) {
          console.error('❌ [WEBHOOK] Erro ao atualizar agendamento:', updateError);
        } else {
          console.log('✅ [WEBHOOK] Agendamento atualizado com dados do Google Calendar:', {
            agendamentoId,
            eventId,
            meetLink: updateData.google_meet_link
          });
        }
      } else {
        console.log('⚠️ [WEBHOOK] Nenhum eventId ou meetLink retornado do createCalendarEvent');
      }
    } catch (error) {
      console.error('❌ Erro ao criar evento no Google Calendar:', error);
    }
  }

  /**
   * Marca webhook como processado
   */
  private static async marcarComoProcessado(paymentId: string, event: string): Promise<void> {
    await supabaseAdmin
      .from('webhook_logs')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString()
      })
      .eq('payment_id', paymentId)
      .eq('event_type', event)
      .eq('status', 'received');
  }

  /**
   * Log de erro do webhook
   */
  private static async logErroWebhook(payload: WebhookPayload, error: any): Promise<void> {
    try {
      await supabaseAdmin
        .from('webhook_logs')
        .insert({
          event_type: payload.event || 'unknown',
          payment_id: payload.payment?.id || 'unknown',
          payload: payload,
          status: 'error'
        });
    } catch (logError) {
      console.error('Erro ao salvar log de erro:', logError);
    }
  }
}
