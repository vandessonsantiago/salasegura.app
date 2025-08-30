import { supabaseAdmin as supabase } from '../lib/supabase';
import { randomUUID } from 'crypto';

// Interface para dados do cliente
export interface ClienteData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
}

// Interface para dados do caso de divórcio
export interface DivorceCaseData {
  id?: string;
  user_id: string;
  type: string;
  status: string;
  payment_id?: string;
  valor: number;
  qr_code_pix?: string;
  copy_paste_pix?: string;
  pix_expires_at?: string;
  cliente_nome?: string;
  cliente_email?: string;
  cliente_telefone?: string;
  service_data?: any;
  created_at?: string;
  updated_at?: string;
}

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
          cliente_telefone: cliente.phone,
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

      const { error } = await supabase
        .from('divorce_cases')
        .update({
          payment_id: paymentData.paymentId,
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
}
