import { supabaseAdmin as supabase } from '../../lib/supabase';
import { randomUUID } from 'crypto';
import {
  ClienteData,
  DivorceCaseData,
  DivorceCaseInsert,
  DivorceCaseUpdate,
  DivorceApiResponse,
  DivorceListResponse,
  DivorceFilters
} from '../types/divorce.types';

export class DivorceService {
  /**
   * Cria um caso de divórcio básico
   */
  static async criarCasoDivorcio(
    userId: string,
    cliente: ClienteData,
    valor: number,
    descricao: string,
    serviceData?: any
  ): Promise<{ success: boolean; caseId?: string; error?: string }> {
    try {
      // Verificar se já existe um caso recente para este usuário com os mesmos dados
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { data: existingCase } = await supabase
        .from('divorce_cases')
        .select('id, created_at')
        .eq('user_id', userId)
        .eq('cliente_email', cliente.email)
        .eq('valor', valor)
        .gte('created_at', fiveMinutesAgo)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingCase) {
        console.log('⚠️ [DIVORCE] Caso duplicado detectado, retornando caso existente:', existingCase.id);
        return { success: true, caseId: existingCase.id };
      }

      const caseId = randomUUID();

      console.log('🏗️ [DIVORCE] Criando caso de divórcio:', {
        id: caseId,
        user_id: userId,
        cliente: cliente.name,
        valor: valor
      });

      const { data, error } = await supabase
        .from('divorce_cases')
        .insert({
          id: caseId,
          user_id: userId,
          type: 'express',
          status: 'pending_payment',
          valor: valor,
          cliente_nome: cliente.name,
          cliente_email: cliente.email,
          cliente_telefone: cliente.phone || "", // 🔧 CORREÇÃO: Usar string vazia se phone for undefined
          service_data: serviceData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ [DIVORCE] Erro ao criar caso:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [DIVORCE] Caso criado com sucesso:', data.id);
      return { success: true, caseId: data.id };

    } catch (error) {
      console.error('❌ [DIVORCE] Erro inesperado ao criar caso:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Atualiza caso de divórcio com dados de pagamento
   */
  static async atualizarComDadosPagamento(
    caseId: string,
    paymentData: {
      paymentId: string;
      qrCodePix: string;
      copyPastePix: string;
      pixExpiresAt: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 [DIVORCE] Atualizando caso com dados PIX:', caseId);

      // Primeiro, encontrar o registro de pagamento pelo asaas_id
      const { data: paymentRecord, error: findError } = await supabase
        .from('payments')
        .select('id')
        .eq('asaas_id', paymentData.paymentId)
        .single();

      if (findError || !paymentRecord) {
        console.error('❌ [DIVORCE] Pagamento não encontrado:', findError);
        return { success: false, error: 'Pagamento não encontrado' };
      }

      // Agora atualizar o caso com o ID interno do pagamento (UUID)
      const { error } = await supabase
        .from('divorce_cases')
        .update({
          payment_id: paymentRecord.id, // Usar o UUID interno, não o asaas_id
          qr_code_pix: paymentData.qrCodePix,
          copy_paste_pix: paymentData.copyPastePix,
          pix_expires_at: paymentData.pixExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', caseId);

      if (error) {
        console.error('❌ [DIVORCE] Erro ao atualizar dados PIX:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [DIVORCE] Dados PIX atualizados com sucesso');
      return { success: true };

    } catch (error) {
      console.error('❌ [DIVORCE] Erro inesperado ao atualizar dados PIX:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Busca caso de divórcio por ID
   */
  static async buscarCasoPorId(
    caseId: string
  ): Promise<{ success: boolean; case?: DivorceCaseData; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('divorce_cases')
        .select('*')
        .eq('id', caseId)
        .single();

      if (error) {
        console.error('❌ [DIVORCE] Erro ao buscar caso:', error);
        return { success: false, error: error.message };
      }

      return { success: true, case: data };

    } catch (error) {
      console.error('❌ [DIVORCE] Erro inesperado ao buscar caso:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Lista casos de divórcio do usuário
   */
  static async listarCasosUsuario(
    userId: string
  ): Promise<{ success: boolean; cases?: DivorceCaseData[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('divorce_cases')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [DIVORCE] Erro ao listar casos:', error);
        return { success: false, error: error.message };
      }

      return { success: true, cases: data };

    } catch (error) {
      console.error('❌ [DIVORCE] Erro inesperado ao listar casos:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  // ==========================================
  // MÉTODOS DE COMPATIBILIDADE (LEGACY SUPPORT)
  // ==========================================

  /**
   * Método de compatibilidade - cria caso básico de divórcio
   * Mantido para compatibilidade com código existente
   */
  static async criarCasoDivorcioBasico(
    userId: string,
    cliente: ClienteData,
    valor: number,
    serviceData?: any
  ): Promise<{ success: boolean; caseId?: string; error?: string }> {
    return this.criarCasoDivorcio(userId, cliente, valor, 'Divórcio Express', serviceData);
  }

  /**
   * Método de compatibilidade - atualiza caso com dados do cliente
   */
  static async atualizarComDadosCliente(
    caseId: string,
    clienteData: Partial<ClienteData>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 [DIVORCE] Atualizando caso com dados do cliente:', caseId);

      const updateData: Partial<DivorceCaseUpdate> = {};

      if (clienteData.name) updateData.cliente_nome = clienteData.name;
      if (clienteData.email) updateData.cliente_email = clienteData.email;
      if (clienteData.phone !== undefined) updateData.cliente_telefone = clienteData.phone || '';

      const { error } = await supabase
        .from('divorce_cases')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', caseId);

      if (error) {
        console.error('❌ [DIVORCE] Erro ao atualizar dados do cliente:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [DIVORCE] Dados do cliente atualizados com sucesso');
      return { success: true };

    } catch (error) {
      console.error('❌ [DIVORCE] Erro inesperado ao atualizar dados do cliente:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Método de compatibilidade - atualiza caso com dados do calendário
   */
  static async atualizarComDadosCalendario(
    caseId: string,
    calendarData: {
      scheduledDate?: string;
      scheduledTime?: string;
      notes?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 [DIVORCE] Atualizando caso com dados do calendário:', caseId);

      const { error } = await supabase
        .from('divorce_cases')
        .update({
          service_data: calendarData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', caseId);

      if (error) {
        console.error('❌ [DIVORCE] Erro ao atualizar dados do calendário:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ [DIVORCE] Dados do calendário atualizados com sucesso');
      return { success: true };

    } catch (error) {
      console.error('❌ [DIVORCE] Erro inesperado ao atualizar dados do calendário:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Método de compatibilidade - processa pagamento para caso de divórcio
   */
  static async processPayment(
    caseId: string,
    cliente: ClienteData
  ): Promise<{ success: boolean; paymentData?: any; error?: string }> {
    try {
      console.log('💰 [DIVORCE] Processando pagamento para caso:', caseId);

      // Buscar dados do caso
      const caseResult = await this.buscarCasoPorId(caseId);
      if (!caseResult.success || !caseResult.case) {
        return { success: false, error: 'Caso não encontrado' };
      }

      // Aqui seria integrada a lógica de processamento de pagamento
      // Por enquanto, retorna sucesso para compatibilidade
      console.log('✅ [DIVORCE] Pagamento processado com sucesso (simulado)');
      return { success: true, paymentData: { status: 'processed' } };

    } catch (error) {
      console.error('❌ [DIVORCE] Erro ao processar pagamento:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Método de compatibilidade - busca caso do usuário
   */
  static async getUserDivorce(userId: string): Promise<{ success: boolean; case?: DivorceCaseData; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('divorce_cases')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ [DIVORCE] Erro ao buscar caso do usuário:', error);
        return { success: false, error: error.message };
      }

      return { success: true, case: data };

    } catch (error) {
      console.error('❌ [DIVORCE] Erro inesperado ao buscar caso do usuário:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }
}
