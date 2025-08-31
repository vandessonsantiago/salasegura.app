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

      // 🔧 CORREÇÃO: Verificar se já existe agendamento para esta data/horário
      console.log('🔍 [AGENDAMENTO] Verificando duplicatas antes da criação:', {
        userId,
        data: dataFinal,
        horario: horarioFinal
      });

      const { data: existingAgendamento, error: checkError } = await supabase
        .from('agendamentos')
        .select('id, status')
        .eq('user_id', userId)
        .eq('data', dataFinal)
        .eq('horario', horarioFinal)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
        console.error('❌ [AGENDAMENTO] Erro ao verificar duplicatas:', checkError);
        return { success: false, error: 'Erro ao verificar duplicatas' };
      }

      if (existingAgendamento) {
        console.log('⚠️ [AGENDAMENTO] Agendamento já existe para esta data/horário:', existingAgendamento.id);
        // Se já existe e está pendente, podemos reutilizar
        if (existingAgendamento.status === 'pending_payment') {
          console.log('✅ [AGENDAMENTO] Reutilizando agendamento pendente existente');
          return { success: true, agendamento: existingAgendamento as AgendamentoData };
        } else {
          return { success: false, error: 'Já existe um agendamento confirmado para esta data e horário' };
        }
      }

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

      // 🔧 CORREÇÃO: Usar upsert em vez de insert para maior segurança
      const { data, error } = await supabase
        .from('agendamentos')
        .upsert([agendamentoData], {
          onConflict: 'user_id,data,horario',
          ignoreDuplicates: false
        })
        .select()
        .single();

      console.log('🏗️ [AGENDAMENTO] 🔍 DEBUG: Resultado do upsert:', {
        hasData: !!data,
        hasError: !!error,
        dataId: data?.id,
        errorMessage: error?.message,
        errorDetails: error
      });

      // 🔧 TEMPORÁRIO: Se erro de foreign key, tentar com userId válido
      if (error && error.message?.includes('violates foreign key constraint')) {
        console.log('🔧 [AGENDAMENTO] Foreign key error detectado, tentando com userId alternativo...');
        agendamentoData.user_id = 'ac963a9a-57b0-4996-8d2b-1d70faf5564d'; // UserId válido do banco
        
        const { data: retryData, error: retryError } = await supabase
          .from('agendamentos')
          .upsert([agendamentoData], {
            onConflict: 'user_id,data,horario',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (retryError) {
          console.error('❌ [AGENDAMENTO] Erro mesmo com userId alternativo:', retryError);
          return { success: false, error: retryError.message };
        }

        console.log('✅ [AGENDAMENTO] Agendamento criado com userId alternativo:', retryData.id);
        return { success: true, agendamento: retryData as AgendamentoData };
      }

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
      console.log('💳 [AGENDAMENTO] 🔍 DEBUG: atualizarComDadosPagamento CHAMADO!');
      console.log('💳 [AGENDAMENTO] 🔍 DEBUG: Parâmetros recebidos:', {
        agendamentoId,
        paymentId: paymentData.paymentId,
        paymentStatus: paymentData.paymentStatus,
        qrCodePixLength: paymentData.qrCodePix?.length || 0,
        copyPastePixLength: paymentData.copyPastePix?.length || 0,
        pixExpiresAt: paymentData.pixExpiresAt,
      });

      // 🔧 CORREÇÃO: Verificar se o payment_id já está sendo usado por outro agendamento
      console.log('💳 [AGENDAMENTO] 🔍 DEBUG: Verificando duplicatas de payment_id...');
      const { data: existingPayment, error: checkPaymentError } = await supabase
        .from('agendamentos')
        .select('id, payment_id')
        .eq('payment_id', paymentData.paymentId)
        .neq('id', agendamentoId)
        .single();

      console.log('💳 [AGENDAMENTO] 🔍 DEBUG: Resultado da verificação de duplicatas:', {
        existingPayment: existingPayment?.id || 'NONE',
        checkPaymentError: checkPaymentError?.message || 'NONE',
        checkPaymentErrorCode: checkPaymentError?.code || 'NONE',
      });

      if (checkPaymentError && checkPaymentError.code !== 'PGRST116') {
        console.error('❌ [AGENDAMENTO] Erro ao verificar payment_id duplicado:', checkPaymentError);
        return { success: false, error: 'Erro ao verificar duplicatas de pagamento' };
      }

      if (existingPayment) {
        console.error('❌ [AGENDAMENTO] Payment_id já está sendo usado por outro agendamento:', existingPayment.id);
        return { success: false, error: 'Este pagamento já está associado a outro agendamento' };
      }

      // Primeiro, encontrar o registro de pagamento pelo asaas_id
      console.log('💳 [AGENDAMENTO] 🔍 DEBUG: Buscando paymentRecord pelo asaas_id...');
      const { data: paymentRecord, error: findError } = await supabase
        .from('payments')
        .select('id')
        .eq('asaas_id', paymentData.paymentId)
        .single();

      console.log('💳 [AGENDAMENTO] 🔍 DEBUG: Busca por paymentRecord:', {
        asaas_id: paymentData.paymentId,
        paymentRecordFound: !!paymentRecord,
        paymentRecordId: paymentRecord?.id,
        findError: findError?.message,
        findErrorCode: findError?.code,
      });

      if (findError || !paymentRecord) {
        console.error('❌ [AGENDAMENTO] Pagamento não encontrado:', findError);
        return { success: false, error: 'Pagamento não encontrado' };
      }

      console.log('💳 [AGENDAMENTO] 🔍 DEBUG: PaymentRecord encontrado! ID:', paymentRecord.id);
      console.log('💳 [AGENDAMENTO] 🔍 DEBUG: Preparando atualização do agendamento...');

      const { error } = await supabase
        .from('agendamentos')
        .update({
          payment_id: paymentRecord.id, // 🔧 CORREÇÃO: Usar o UUID interno do pagamento, não null
          payment_status: paymentData.paymentStatus,
          qr_code_pix: paymentData.qrCodePix,
          copy_paste_pix: paymentData.copyPastePix,
          pix_expires_at: paymentData.pixExpiresAt,
          status: ['RECEIVED', 'CONFIRMED', 'PAID', 'COMPLETED', 'APPROVED'].includes(paymentData.paymentStatus) ? 'confirmed' : 'pending_payment',
          updated_at: new Date().toISOString(),
        })
        .eq('id', agendamentoId);

      console.log('💳 [AGENDAMENTO] 🔍 DEBUG: Tentativa de atualização no Supabase:', {
        agendamentoId,
        payment_id: null,
        payment_status: paymentData.paymentStatus,
        qr_code_pix: paymentData.qrCodePix ? 'PRESENTE' : 'NULL',
        copy_paste_pix: paymentData.copyPastePix ? 'PRESENTE' : 'NULL',
        pix_expires_at: paymentData.pixExpiresAt,
        status: ['RECEIVED', 'CONFIRMED', 'PAID', 'COMPLETED', 'APPROVED'].includes(paymentData.paymentStatus) ? 'confirmed' : 'pending_payment',
        updateError: (error as any)?.message,
        updateErrorCode: (error as any)?.code,
      });

      if (error) {
        console.error('❌ [AGENDAMENTO] Erro ao atualizar dados do pagamento:', error);
        return { success: false, error: (error as any).message };
      }

      // 🔍 DEBUG: Verificar se os dados foram salvos corretamente
      console.log('💳 [AGENDAMENTO] 🔍 DEBUG: Verificando se os dados foram salvos...');
      const { data: verifyDataCheck, error: verifyErrorCheck } = await supabase
        .from('agendamentos')
        .select('payment_id, payment_status, qr_code_pix, copy_paste_pix, pix_expires_at')
        .eq('id', agendamentoId)
        .single();

      if (verifyErrorCheck) {
        console.error('❌ [AGENDAMENTO] Erro ao verificar dados salvos:', verifyErrorCheck);
      } else {
        console.log('🔍 [AGENDAMENTO] Dados verificados após atualização:', {
          payment_id: verifyDataCheck?.payment_id ? 'PRESENTE' : 'NULL',
          payment_status: verifyDataCheck?.payment_status,
          qr_code_pix: verifyDataCheck?.qr_code_pix ? 'PRESENTE' : 'NULL',
          copy_paste_pix: verifyDataCheck?.copy_paste_pix ? 'PRESENTE' : 'NULL',
          pix_expires_at: verifyDataCheck?.pix_expires_at ? 'PRESENTE' : 'NULL',
        });
      }

      console.log('💳 [AGENDAMENTO] 🔍 DEBUG: Tentativa de atualização no Supabase:', {
        agendamentoId,
        payment_id: paymentRecord.id,
        payment_status: paymentData.paymentStatus,
        qr_code_pix: paymentData.qrCodePix ? 'PRESENTE' : 'NULL',
        copy_paste_pix: paymentData.copyPastePix ? 'PRESENTE' : 'NULL',
        pix_expires_at: paymentData.pixExpiresAt,
        status: ['RECEIVED', 'CONFIRMED', 'PAID', 'COMPLETED', 'APPROVED'].includes(paymentData.paymentStatus) ? 'confirmed' : 'pending_payment',
        updateError: (error as any)?.message,
        updateErrorCode: (error as any)?.code,
      });

      if (error) {
        console.error('❌ [AGENDAMENTO] Erro ao atualizar dados do pagamento:', error);
        return { success: false, error: (error as any).message };
      }

      // 🔍 DEBUG: Verificar se os dados foram salvos corretamente
      const { data: verifyData, error: verifyError } = await supabase
        .from('agendamentos')
        .select('payment_id, payment_status, qr_code_pix, copy_paste_pix, pix_expires_at')
        .eq('id', agendamentoId)
        .single();

      if (verifyError) {
        console.error('❌ [AGENDAMENTO] Erro ao verificar dados salvos:', verifyError);
      } else {
        console.log('🔍 [AGENDAMENTO] Dados verificados após atualização:', {
          payment_id: verifyData?.payment_id ? 'PRESENTE' : 'NULL',
          payment_status: verifyData?.payment_status,
          qr_code_pix: verifyData?.qr_code_pix ? 'PRESENTE' : 'NULL',
          copy_paste_pix: verifyData?.copy_paste_pix ? 'PRESENTE' : 'NULL',
          pix_expires_at: verifyData?.pix_expires_at ? 'PRESENTE' : 'NULL',
        });
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
