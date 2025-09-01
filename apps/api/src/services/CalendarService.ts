import { supabaseAdmin } from '../lib/supabase';
import { createCalendarEvent } from './google-calendar';

export interface CalendarEventData {
  date: string;
  time: string;
  summary: string;
  description: string;
  attendees: string[];
  durationMinutes: number;
}

export class CalendarService {
  /**
   * Cria evento no Google Calendar para agendamento
   */
  static async criarEventoAgendamento(
    agendamentoId: string,
    eventData: CalendarEventData
  ): Promise<{ success: boolean; eventId?: string; meetLink?: string; error?: string }> {
    try {
      console.log(`📅 Criando evento no Google Calendar para agendamento ${agendamentoId}`);

      const { eventId, meetLink } = await createCalendarEvent(eventData);

      if (eventId || meetLink) {
        const updateData: any = {
          calendar_event_id: eventId,
          updated_at: new Date().toISOString()
        };

        if (meetLink) {
          updateData.google_meet_link = meetLink;
          updateData.google_meet_link_type = 'google_meet';
        }

        const { error } = await supabaseAdmin
          .from('agendamentos')
          .update(updateData)
          .eq('id', agendamentoId);

        if (error) {
          console.error('❌ Erro ao atualizar agendamento com dados do calendário:', error);
          return { success: false, error: error.message };
        }

        console.log('✅ Agendamento atualizado com dados do Google Calendar');
        return { success: true, eventId, meetLink };
      }

      return { success: false, error: 'Falha ao criar evento no Google Calendar' };
    } catch (error: any) {
      console.error('❌ Erro ao criar evento no Google Calendar:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Atualiza evento no Google Calendar
   */
  static async atualizarEventoAgendamento(
    agendamentoId: string,
    eventData: Partial<CalendarEventData>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Buscar dados atuais do agendamento
      const { data: agendamento, error: fetchError } = await supabaseAdmin
        .from('agendamentos')
        .select('calendar_event_id, data, horario, cliente_nome, cliente_email, descricao')
        .eq('id', agendamentoId)
        .single();

      if (fetchError || !agendamento) {
        return { success: false, error: 'Agendamento não encontrado' };
      }

      if (!agendamento.calendar_event_id) {
        return { success: false, error: 'Evento do calendário não encontrado' };
      }

      // Usar dados do parâmetro ou manter os atuais
      const updatedEventData = {
        date: eventData.date || agendamento.data,
        time: eventData.time || agendamento.horario,
        summary: eventData.summary || `Consulta - ${agendamento.cliente_nome}`,
        description: eventData.description || agendamento.descricao || 'Consulta de alinhamento inicial',
        attendees: eventData.attendees || [agendamento.cliente_email],
        durationMinutes: eventData.durationMinutes || 45
      };

      // Aqui seria chamada a função de atualização do Google Calendar
      // Por enquanto, apenas log
      console.log('📅 Atualizando evento no Google Calendar:', updatedEventData);

      return { success: true };
    } catch (error: any) {
      console.error('❌ Erro ao atualizar evento no Google Calendar:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove evento do Google Calendar
   */
  static async removerEventoAgendamento(agendamentoId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: agendamento, error: fetchError } = await supabaseAdmin
        .from('agendamentos')
        .select('calendar_event_id')
        .eq('id', agendamentoId)
        .single();

      if (fetchError || !agendamento?.calendar_event_id) {
        return { success: false, error: 'Evento do calendário não encontrado' };
      }

      // Aqui seria chamada a função de remoção do Google Calendar
      // Por enquanto, apenas log
      console.log(`🗑️ Removendo evento ${agendamento.calendar_event_id} do Google Calendar`);

      // Limpar dados do calendário no agendamento
      const { error: updateError } = await supabaseAdmin
        .from('agendamentos')
        .update({
          calendar_event_id: null,
          google_meet_link: null,
          google_meet_link_type: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', agendamentoId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ Erro ao remover evento do Google Calendar:', error);
      return { success: false, error: error.message };
    }
  }
}
