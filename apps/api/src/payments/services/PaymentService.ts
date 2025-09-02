// MÓDULO PAYMENTS - SERVIÇO DE PAGAMENTOS

import { supabaseAdmin } from '../../lib/supabase';
import { AsaasService } from './AsaasService';
import {
  ClienteData,
  PaymentResponse,
  AsaasPaymentData,
  PaymentStatusUpdate,
  PaymentStatus
} from '../types/payment.types';

export class PaymentService {
  /**
   * Cria cliente no Asaas e retorna o ID
   */
  static async criarClienteAsaas(cliente: ClienteData): Promise<string> {
    const result = await AsaasService.criarClienteAsaas(cliente);

    if (!result.success || !result.customerId) {
      throw new Error(result.error || 'Erro ao criar cliente no Asaas');
    }

    return result.customerId;
  }

  /**
   * Processa pagamento completo (cliente + cobrança)
   */
  static async processarPagamentoAsaas(
    cliente: ClienteData,
    valor: number,
    descricao: string,
    dueDate?: string
  ): Promise<PaymentResponse> {
    try {
      console.log('[PAYMENT] Iniciando processamento de pagamento');

      // 1. Criar cliente no Asaas
      const customerId = await this.criarClienteAsaas(cliente);
      console.log('[PAYMENT] Cliente criado:', customerId);

      // 2. Preparar dados do pagamento
      const paymentData: AsaasPaymentData = {
        customer: customerId,
        billingType: 'PIX',
        value: valor,
        dueDate: dueDate || new Date().toISOString().split('T')[0],
        description: descricao,
      };

      // 3. Processar pagamento
      const result = await AsaasService.processarPagamentoAsaas(paymentData);

      if (result.success && result.paymentId) {
        // 4. Salvar no banco de dados
        await this.salvarPagamento({
          id: result.paymentId,
          customer_id: cliente.email, // ou userId se disponível
          value: valor,
          description: descricao,
          status: 'PENDING',
          payment_method: 'PIX',
          asaas_customer_id: customerId,
        });
      }

      return result;

    } catch (error: any) {
      console.error('[PAYMENT] Erro no processamento:', error);
      return {
        success: false,
        error: error.message || 'Erro interno no processamento do pagamento'
      };
    }
  }

  /**
   * Salva informações do pagamento no banco de dados
   */
  private static async salvarPagamento(paymentData: {
    id: string;
    customer_id: string;
    value: number;
    description: string;
    status: PaymentStatus;
    payment_method: string;
    asaas_customer_id: string;
  }): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('payments')
        .insert({
          id: paymentData.id,
          customer_id: paymentData.customer_id,
          value: paymentData.value,
          description: paymentData.description,
          status: paymentData.status,
          payment_method: paymentData.payment_method,
          asaas_customer_id: paymentData.asaas_customer_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('[PAYMENT] Erro ao salvar pagamento:', error);
        throw error;
      }

      console.log('[PAYMENT] Pagamento salvo com sucesso:', paymentData.id);

    } catch (error) {
      console.error('[PAYMENT] Erro ao salvar no banco:', error);
      // Não lança erro para não quebrar o fluxo principal
    }
  }

  /**
   * Atualiza status de um pagamento
   */
  static async updatePaymentStatus(paymentId: string, status: PaymentStatus): Promise<boolean> {
    try {
      console.log('[PAYMENT] Atualizando status:', paymentId, 'para:', status);

      // 1. Atualizar no Asaas (se necessário)
      if (status === 'RECEIVED') {
        await AsaasService.atualizarStatusPagamento(paymentId, status);
      }

      // 2. Atualizar no banco de dados
      const { error } = await supabaseAdmin
        .from('payments')
        .update({
          status: status,
          updated_at: new Date().toISOString(),
          ...(status === 'RECEIVED' && { payment_date: new Date().toISOString() })
        })
        .eq('id', paymentId);

      if (error) {
        console.error('[PAYMENT] Erro ao atualizar status no banco:', error);
        return false;
      }

      console.log('[PAYMENT] Status atualizado com sucesso');
      return true;

    } catch (error) {
      console.error('[PAYMENT] Erro ao atualizar status:', error);
      return false;
    }
  }

  /**
   * Busca informações de um pagamento
   */
  static async getPaymentById(paymentId: string): Promise<any> {
    try {
      const { data, error } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (error) {
        console.error('[PAYMENT] Erro ao buscar pagamento:', error);
        return null;
      }

      return data;

    } catch (error) {
      console.error('[PAYMENT] Erro ao buscar pagamento:', error);
      return null;
    }
  }

  /**
   * Lista pagamentos de um usuário
   */
  static async getPaymentsByUser(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[PAYMENT] Erro ao listar pagamentos:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('[PAYMENT] Erro ao listar pagamentos:', error);
      return [];
    }
  }
}
