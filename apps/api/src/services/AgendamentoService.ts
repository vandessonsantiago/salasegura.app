import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { supabaseAdmin as supabase } from '../lib/supabase';

// Tipo para request autenticado
type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email: string;
  };
};

// Interface para dados de agendamento
export interface AgendamentoData {
  id?: string;
  user_id: string;
  data?: string;
  horario?: string;
  status: string;
  payment_id?: string;
  payment_status: string;
  valor: number;
  descricao: string;
  cliente_nome?: string;
  cliente_email?: string;
  cliente_telefone?: string;
  qr_code_pix?: string;
  copy_paste_pix?: string;
  pix_expires_at?: string;
  calendar_event_id?: string;
  google_meet_link?: string;
  google_meet_link_type?: string;
  service_type?: string; // Opcional por enquanto
  service_data?: any; // Opcional por enquanto
  created_at?: string;
  updated_at?: string;
}

export class AgendamentoService {
  /**
   * Cria um agendamento básico com dados mínimos
   * Este método deve ser chamado ANTES do checkout
   */
  static async criarAgendamentoBasico(
    userId: string,
    serviceType: string,
    valor: number,
    descricao: string,
    serviceData?: any,
    dataAgendamento?: string,
    horarioAgendamento?: string
  ): Promise<{ success: boolean; agendamento?: AgendamentoData; error?: string }> {
    try {
      const agendamentoId = randomUUID();

      // Usar valores padrão se data/horário não forem fornecidos
      const dataFinal = dataAgendamento || new Date().toISOString().split('T')[0]; // Data de hoje
      const horarioFinal = horarioAgendamento || '09:00:00'; // 9:00 como padrão

      // Por enquanto, não incluir service_type e service_data na inserção
      // até que a migração seja executada
      const agendamentoData: any = {
        id: agendamentoId,
        user_id: userId,
        data: dataFinal,
        horario: horarioFinal,
        status: 'pending_payment',
        payment_status: 'pending',
        valor: valor,
        descricao: descricao,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Adicionar service_type e service_data apenas se as colunas existirem
      // Isso será verificado dinamicamente ou através de uma flag
      if (process.env.AGENDAMENTOS_HAS_SERVICE_COLUMNS === 'true') {
        agendamentoData.service_type = serviceType;
        agendamentoData.service_data = serviceData;
      }

      console.log('🏗️ [AGENDAMENTO] Criando agendamento básico:', {
        id: agendamentoId,
        user_id: userId,
        data: dataAgendamento,
        horario: horarioAgendamento,
        service_type: serviceType,
        valor: valor,
        hasServiceColumns: process.env.AGENDAMENTOS_HAS_SERVICE_COLUMNS === 'true'
      });

      const { data, error } = await supabase
        .from('agendamentos')
        .insert([agendamentoData])
        .select()
        .single();

      console.log('🔍 [AGENDAMENTO] Resultado da inserção no Supabase:', {
        hasData: !!data,
        hasError: !!error,
        dataId: data?.id,
        errorMessage: error?.message,
        errorDetails: error
      });

      if (error) {
        console.error('❌ [AGENDAMENTO] Erro ao criar agendamento básico:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [AGENDAMENTO] Agendamento básico criado com sucesso:', data.id);
      return { success: true, agendamento: data as AgendamentoData };
    } catch (error) {
      console.error('❌ [AGENDAMENTO] Erro inesperado ao criar agendamento básico:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Atualiza o agendamento com dados do cliente
   * Chamado durante o preenchimento do formulário de checkout
   */
  static async atualizarComDadosCliente(
    agendamentoId: string,
    clienteData: {
      nome: string;
      email: string;
      telefone: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📝 [AGENDAMENTO] Atualizando agendamento com dados do cliente:', {
        agendamentoId,
        clienteData
      });

      const { error } = await supabase
        .from('agendamentos')
        .update({
          cliente_nome: clienteData.nome,
          cliente_email: clienteData.email,
          cliente_telefone: clienteData.telefone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agendamentoId);

      if (error) {
        console.error('❌ [AGENDAMENTO] Erro ao atualizar dados do cliente:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [AGENDAMENTO] Dados do cliente atualizados com sucesso');
      return { success: true };
    } catch (error) {
      console.error('❌ [AGENDAMENTO] Erro inesperado ao atualizar dados do cliente:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Atualiza o agendamento com data e horário
   * Chamado quando o usuário seleciona um slot disponível
   */
  static async atualizarComDataHorario(
    agendamentoId: string,
    dataHorario: {
      data: string;
      horario: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📅 [AGENDAMENTO] Atualizando agendamento com data e horário:', {
        agendamentoId,
        dataHorario
      });

      const { error } = await supabase
        .from('agendamentos')
        .update({
          data: dataHorario.data,
          horario: dataHorario.horario,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agendamentoId);

      if (error) {
        console.error('❌ [AGENDAMENTO] Erro ao atualizar data e horário:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [AGENDAMENTO] Data e horário atualizados com sucesso');
      return { success: true };
    } catch (error) {
      console.error('❌ [AGENDAMENTO] Erro inesperado ao atualizar data e horário:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Atualiza o agendamento com dados do pagamento e PIX
   * Chamado APÓS o checkout ser processado com sucesso
   */
  static async atualizarComDadosPagamento(
    agendamentoId: string,
    paymentData: {
      paymentId: string;
      paymentStatus: string;
      qrCodePix: string;
      copyPastePix: string;
      pixExpiresAt: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('💳 [AGENDAMENTO] Atualizando agendamento com dados do pagamento:', {
        agendamentoId,
        paymentId: paymentData.paymentId,
        paymentStatus: paymentData.paymentStatus
      });

      const { error } = await supabase
        .from('agendamentos')
        .update({
          payment_id: paymentData.paymentId,
          payment_status: paymentData.paymentStatus,
          qr_code_pix: paymentData.qrCodePix,
          copy_paste_pix: paymentData.copyPastePix,
          pix_expires_at: paymentData.pixExpiresAt,
          status: ['RECEIVED', 'CONFIRMED', 'PAID', 'COMPLETED', 'APPROVED'].includes(paymentData.paymentStatus) ? 'confirmed' : 'pending_payment',
          updated_at: new Date().toISOString(),
        })
        .eq('id', agendamentoId);

      if (error) {
        console.error('❌ [AGENDAMENTO] Erro ao atualizar dados do pagamento:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [AGENDAMENTO] Dados do pagamento atualizados com sucesso');
      return { success: true };
    } catch (error) {
      console.error('❌ [AGENDAMENTO] Erro inesperado ao atualizar dados do pagamento:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Busca um agendamento por ID
   */
  static async buscarAgendamento(
    agendamentoId: string
  ): Promise<{ success: boolean; agendamento?: AgendamentoData; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('id', agendamentoId)
        .single();

      if (error) {
        console.error('❌ [AGENDAMENTO] Erro ao buscar agendamento:', error);
        return { success: false, error: error.message };
      }

      return { success: true, agendamento: data as AgendamentoData };
    } catch (error) {
      console.error('❌ [AGENDAMENTO] Erro inesperado ao buscar agendamento:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Lista agendamentos do usuário
   */
  static async listarAgendamentosUsuario(
    userId: string
  ): Promise<{ success: boolean; agendamentos?: AgendamentoData[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [AGENDAMENTO] Erro ao listar agendamentos:', error);
        return { success: false, error: error.message };
      }

      return { success: true, agendamentos: data as AgendamentoData[] };
    } catch (error) {
      console.error('❌ [AGENDAMENTO] Erro inesperado ao listar agendamentos:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Atualiza o agendamento com dados do calendário Google
   * Chamado após a criação do evento no Google Calendar
   */
  static async atualizarComDadosCalendario(
    agendamentoId: string,
    calendarData: {
      calendar_event_id: string;
      google_meet_link?: string;
      google_meet_link_type?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📅 [AGENDAMENTO] Atualizando agendamento com dados do calendário:', {
        agendamentoId,
        calendarData
      });

      const { error } = await supabase
        .from('agendamentos')
        .update({
          calendar_event_id: calendarData.calendar_event_id,
          google_meet_link: calendarData.google_meet_link,
          google_meet_link_type: calendarData.google_meet_link_type,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agendamentoId);

      if (error) {
        console.error('❌ [AGENDAMENTO] Erro ao atualizar dados do calendário:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [AGENDAMENTO] Dados do calendário atualizados com sucesso');
      return { success: true };
    } catch (error) {
      console.error('❌ [AGENDAMENTO] Erro inesperado ao atualizar dados do calendário:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }
}
