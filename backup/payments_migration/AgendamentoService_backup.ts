import { randomUUID } from 'crypto';
import { supabaseAdmin as supabase } from '../../lib/supabase';
import { PaymentService } from '../../payments/services/PaymentService';
import { CalendarService } from '../../services/CalendarService';
import {
  AgendamentoData,
  AgendamentoInsert,
  AgendamentoUpdate,
  AgendamentoStats,
  AgendamentoListResponse,
  ClienteData,
  AgendamentoFilters
} from '../types/agendamentos.types';

export class AgendamentoService {
  /**
   * Criar um novo agendamento
   */
  static async createAgendamento(
    userId: string,
    agendamentoData: AgendamentoInsert
  ): Promise<{ success: boolean; agendamento?: AgendamentoData; error?: string }> {
    try {
      // Verificar se usuário já tem agendamento ativo
      const { data: existingAgendamento } = await supabase
        .from('agendamentos')
        .select('id, status')
        .eq('user_id', userId)
        .neq('status', 'cancelled')
        .single();

      if (existingAgendamento) {
        return { success: false, error: 'Usuário já possui um agendamento ativo' };
      }

      const agendamentoId = randomUUID();

      const newAgendamento: Partial<AgendamentoData> = {
        id: agendamentoId,
        ...agendamentoData,
        status: 'pending',
        payment_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: insertedData, error } = await supabase
        .from('agendamentos')
        .insert([newAgendamento])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar agendamento:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Agendamento criado com sucesso:', insertedData.id);
      return { success: true, agendamento: insertedData as AgendamentoData };
    } catch (error) {
      console.error('❌ Erro inesperado ao criar agendamento:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Buscar agendamentos do usuário
   */
  static async getAgendamentosByUserId(
    userId: string,
    filters: AgendamentoFilters = {}
  ): Promise<{ success: boolean; data?: AgendamentoListResponse; error?: string }> {
    try {
      let query = supabase
        .from('agendamentos')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // Aplicar filtros
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.payment_status) {
        query = query.eq('payment_status', filters.payment_status);
      }
      if (filters.service_type) {
        query = query.eq('service_type', filters.service_type);
      }
      if (filters.date_from) {
        query = query.gte('data', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('data', filters.date_to);
      }

      // Paginação
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: agendamentos, error, count } = await query;

      if (error) {
        console.error('❌ Erro ao buscar agendamentos:', error);
        return { success: false, error: error.message };
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      const response: AgendamentoListResponse = {
        agendamentos: agendamentos as AgendamentoData[],
        pagination: {
          page,
          limit,
          total,
          totalPages
        },
        stats: await this.getAgendamentoStats(userId)
      };

      return { success: true, data: response };
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar agendamentos:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Buscar agendamento específico
   */
  static async getAgendamentoById(
    agendamentoId: string,
    userId: string
  ): Promise<{ success: boolean; agendamento?: AgendamentoData; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('id', agendamentoId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Agendamento não encontrado' };
        }
        return { success: false, error: error.message };
      }

      return { success: true, agendamento: data as AgendamentoData };
    } catch (error) {
      console.error('❌ Erro ao buscar agendamento:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Atualizar agendamento
   */
  static async updateAgendamento(
    agendamentoId: string,
    userId: string,
    updateData: AgendamentoUpdate
  ): Promise<{ success: boolean; agendamento?: AgendamentoData; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agendamentoId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, agendamento: data as AgendamentoData };
    } catch (error) {
      console.error('❌ Erro ao atualizar agendamento:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Deletar agendamento
   */
  static async deleteAgendamento(
    agendamentoId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', agendamentoId)
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao deletar agendamento:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Buscar agendamento do usuário (último ativo)
   */
  static async getUserAgendamento(
    userId: string
  ): Promise<{ success: boolean; agendamento?: AgendamentoData; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        return { success: false, error: error.message };
      }

      return { success: true, agendamento: data as AgendamentoData };
    } catch (error) {
      console.error('❌ Erro ao buscar agendamento do usuário:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Processar pagamento do agendamento
   */
  static async processPayment(
    agendamentoId: string,
    cliente: ClienteData
  ): Promise<{ success: boolean; error?: string; qrCodePix?: string; copyPastePix?: string }> {
    try {
      // Buscar agendamento
      const { data: agendamento, error: fetchError } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('id', agendamentoId)
        .single();

      if (fetchError || !agendamento) {
        return { success: false, error: 'Agendamento não encontrado' };
      }

      // Processar pagamento
      const paymentResult = await PaymentService.processarPagamentoAsaas(
        cliente,
        agendamento.valor,
        agendamento.descricao,
        agendamentoId,
        agendamento.user_id
      );

      if (!paymentResult.success) {
        return { success: false, error: paymentResult.error };
      }

      // Atualizar agendamento com dados do pagamento
      const { error: updateError } = await supabase
        .from('agendamentos')
        .update({
          payment_id: paymentResult.paymentId,
          payment_status: 'pending',
          qr_code_pix: paymentResult.qrCodePix,
          copy_paste_pix: paymentResult.copyPastePix,
          pix_expires_at: paymentResult.pixExpiresAt,
          cliente_nome: cliente.name,
          cliente_email: cliente.email,
          cliente_telefone: cliente.phone || '',
          updated_at: new Date().toISOString(),
        })
        .eq('id', agendamentoId);

      if (updateError) {
        console.error('❌ Erro ao atualizar agendamento com dados do pagamento:', updateError);
        return { success: false, error: updateError.message };
      }

      return {
        success: true,
        qrCodePix: paymentResult.qrCodePix,
        copyPastePix: paymentResult.copyPastePix
      };
    } catch (error: any) {
      console.error('❌ Erro ao processar pagamento:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Confirmar agendamento e criar evento no calendário
   */
  static async confirmAgendamento(
    agendamentoId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Buscar agendamento
      const { data: agendamento, error: fetchError } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('id', agendamentoId)
        .single();

      if (fetchError || !agendamento) {
        return { success: false, error: 'Agendamento não encontrado' };
      }

      // Atualizar status
      const { error: updateError } = await supabase
        .from('agendamentos')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', agendamentoId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Criar evento no Google Calendar
      const eventData = {
        date: agendamento.data,
        time: agendamento.horario,
        summary: `Consulta - ${agendamento.cliente_nome}`,
        description: agendamento.descricao || 'Consulta de alinhamento inicial',
        attendees: [agendamento.cliente_email],
        durationMinutes: 45
      };

      await CalendarService.criarEventoAgendamento(agendamentoId, eventData);

      return { success: true };
    } catch (error: any) {
      console.error('❌ Erro ao confirmar agendamento:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancelar agendamento
   */
  static async cancelAgendamento(
    agendamentoId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', agendamentoId)
        .eq('user_id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao cancelar agendamento:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Obter estatísticas dos agendamentos
   */
  static async getAgendamentoStats(userId: string): Promise<AgendamentoStats> {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('status, valor')
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Erro ao buscar estatísticas:', error);
        return {
          total: 0,
          pending: 0,
          confirmed: 0,
          completed: 0,
          cancelled: 0,
          totalRevenue: 0
        };
      }

      const stats = data.reduce(
        (acc, agendamento) => {
          acc.total++;
          const status = agendamento.status as keyof AgendamentoStats;
          if (status in acc) {
            (acc[status] as number)++;
          }
          if (agendamento.status === 'completed') {
            acc.totalRevenue += agendamento.valor || 0;
          }
          return acc;
        },
        {
          total: 0,
          pending: 0,
          confirmed: 0,
          completed: 0,
          cancelled: 0,
          totalRevenue: 0
        } as AgendamentoStats
      );

      return stats;
    } catch (error) {
      console.error('❌ Erro ao calcular estatísticas:', error);
      return {
        total: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        totalRevenue: 0
      };
    }
  }

  // Método legado para compatibilidade - será removido em futuras versões
  static async criarAgendamento(
    userId: string,
    data: string,
    horario: string,
    valor: number,
    descricao: string
  ) {
    return this.createAgendamento(userId, {
      user_id: userId,
      data,
      horario,
      valor,
      descricao
    });
  }

  static async buscarAgendamentoUsuario(userId: string) {
    return this.getUserAgendamento(userId);
  }

  // Métodos adicionais para compatibilidade com checkout
  static async criarAgendamentoBasico(
    userId: string,
    tipo: string,
    valor: number,
    descricao: string,
    serviceData?: any,
    data?: string,
    horario?: string
  ) {
    const agendamentoData: AgendamentoInsert = {
      user_id: userId,
      data: data || '',
      horario: horario || '',
      valor,
      descricao,
      service_type: tipo,
      service_data: serviceData,
      cliente_nome: serviceData?.clienteNome,
      cliente_email: serviceData?.clienteEmail,
      cliente_telefone: serviceData?.clienteTelefone,
      calendar_event_id: serviceData?.calendarEventId,
      google_meet_link: serviceData?.googleMeetLink
    };

    return this.createAgendamento(userId, agendamentoData);
  }

  static async atualizarComDadosPagamento(
    agendamentoId: string,
    paymentData: {
      paymentId: string;
      paymentStatus: string;
      qrCodePix: string;
      copyPastePix: string;
      pixExpiresAt: string;
    }
  ) {
    const updateData: AgendamentoUpdate = {
      payment_id: paymentData.paymentId,
      payment_status: paymentData.paymentStatus as 'pending' | 'paid' | 'failed' | 'refunded',
      qr_code_pix: paymentData.qrCodePix,
      copy_paste_pix: paymentData.copyPastePix,
      pix_expires_at: paymentData.pixExpiresAt
    };

    return this.updateAgendamento(agendamentoId, '', updateData);
  }

  static async atualizarComDadosCliente(
    agendamentoId: string,
    clienteData: {
      nome: string;
      email: string;
      telefone: string;
    }
  ) {
    const updateData: AgendamentoUpdate = {
      cliente_nome: clienteData.nome,
      cliente_email: clienteData.email,
      cliente_telefone: clienteData.telefone
    };

    return this.updateAgendamento(agendamentoId, '', updateData);
  }

  static async atualizarComDadosCalendario(
    agendamentoId: string,
    calendarData: {
      calendar_event_id: string;
      google_meet_link: string;
      google_meet_link_type: string;
    }
  ) {
    const updateData: AgendamentoUpdate = {
      calendar_event_id: calendarData.calendar_event_id,
      google_meet_link: calendarData.google_meet_link,
      google_meet_link_type: calendarData.google_meet_link_type
    };

    return this.updateAgendamento(agendamentoId, '', updateData);
  }
}
