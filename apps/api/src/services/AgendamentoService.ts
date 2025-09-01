import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { supabaseAdmin as supabase } from '../lib/supabase';
import { PaymentService } from './PaymentService';
import { CalendarService } from './CalendarService';

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
  service_type?: string;
  service_data?: any;
  created_at?: string;
  updated_at?: string;
}

// Interface para dados do cliente
export interface ClienteData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
}

export class AgendamentoService {
  /**
   * Cria um novo agendamento (simplificado)
   */
  static async criarAgendamento(
    userId: string,
    data: string,
    horario: string,
    valor: number,
    descricao: string
  ): Promise<{ success: boolean; agendamento?: AgendamentoData; error?: string }> {
    try {
      // Verificar se usuário já tem agendamento ativo
      const { data: existingAgendamento } = await supabase
        .from('agendamentos')
        .select('id, status')
        .eq('user_id', userId)
        .neq('status', 'Cancelado')
        .single();

      if (existingAgendamento) {
        return { success: false, error: 'Usuário já possui um agendamento ativo' };
      }

      const agendamentoId = randomUUID();

      const agendamentoData: Partial<AgendamentoData> = {
        id: agendamentoId,
        user_id: userId,
        data: data,
        horario: horario,
        status: 'Pendente',
        payment_status: 'pending',
        valor: valor,
        descricao: descricao,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: insertedData, error } = await supabase
        .from('agendamentos')
        .insert([agendamentoData])
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
   * Cria um novo agendamento básico (usado pelo checkout)
   */
  static async criarAgendamentoBasico(
    userId: string,
    tipo: string,
    valor: number,
    descricao: string,
    serviceData?: any,
    data?: string,
    horario?: string
  ): Promise<{ success: boolean; agendamento?: AgendamentoData; error?: string }> {
    try {
      console.log("🎯 [AGENDAMENTO] Criando agendamento básico:", {
        userId,
        tipo,
        valor,
        descricao,
        data,
        horario,
        hasServiceData: !!serviceData
      });

      const agendamentoId = randomUUID();

      const agendamentoData: Partial<AgendamentoData> = {
        id: agendamentoId,
        user_id: userId,
        data: data,
        horario: horario,
        status: 'Pendente',
        payment_status: 'pending',
        valor: valor,
        descricao: descricao,
        service_type: tipo, // 🔧 CORREÇÃO: Definir o tipo do serviço
        // Incluir dados do cliente se fornecidos no serviceData
        cliente_nome: serviceData?.clienteNome,
        cliente_email: serviceData?.clienteEmail,
        cliente_telefone: serviceData?.clienteTelefone,
        // Incluir dados do calendário se fornecidos
        calendar_event_id: serviceData?.calendarEventId,
        google_meet_link: serviceData?.googleMeetLink,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: insertedData, error } = await supabase
        .from('agendamentos')
        .insert([agendamentoData])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar agendamento básico:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Agendamento básico criado com sucesso:', insertedData.id);
      return { success: true, agendamento: insertedData as AgendamentoData };
    } catch (error) {
      console.error('❌ Erro inesperado ao criar agendamento básico:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Atualiza agendamento com dados do pagamento
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
      console.log("🔄 [AGENDAMENTO] Atualizando agendamento com dados do pagamento:", {
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', agendamentoId);

      if (error) {
        console.error('❌ Erro ao atualizar agendamento com dados do pagamento:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Agendamento atualizado com dados do pagamento');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro inesperado ao atualizar agendamento:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Atualiza agendamento com dados do cliente
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
      console.log("👤 [AGENDAMENTO] Atualizando dados do cliente:", {
        agendamentoId,
        nome: clienteData.nome,
        email: clienteData.email
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
        console.error('❌ Erro ao atualizar dados do cliente:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Dados do cliente atualizados');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro inesperado ao atualizar dados do cliente:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Atualiza agendamento com dados do calendário
   */
  static async atualizarComDadosCalendario(
    agendamentoId: string,
    calendarData: {
      calendar_event_id: string;
      google_meet_link: string;
      google_meet_link_type: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("📅 [AGENDAMENTO] Atualizando dados do calendário:", {
        agendamentoId,
        calendar_event_id: calendarData.calendar_event_id,
        google_meet_link: calendarData.google_meet_link
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
        console.error('❌ Erro ao atualizar dados do calendário:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Dados do calendário atualizados');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro inesperado ao atualizar dados do calendário:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Processa pagamento do agendamento
   */
  static async processarPagamento(
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
          payment_status: 'PENDING',
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
   * Confirma agendamento e cria evento no calendário
   */
  static async confirmarAgendamento(agendamentoId: string): Promise<{ success: boolean; error?: string }> {
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
          status: 'Confirmado',
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
   * Busca agendamento do usuário
   */
  static async buscarAgendamentoUsuario(userId: string): Promise<{ success: boolean; agendamento?: AgendamentoData; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'Cancelado')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log('🔍 [SERVICE] Query result:', {
        hasData: !!data,
        hasError: !!error,
        errorCode: error?.code,
        dataKeys: data ? Object.keys(data) : null,
        google_meet_link: data?.google_meet_link,
        calendar_event_id: data?.calendar_event_id,
        status: data?.status,
        payment_status: data?.payment_status
      });

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        return { success: false, error: error.message };
      }

      return { success: true, agendamento: data as AgendamentoData };
    } catch (error) {
      console.error('❌ Erro ao buscar agendamento:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Cancela agendamento
   */
  static async cancelarAgendamento(agendamentoId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({
          status: 'Cancelado',
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
}
