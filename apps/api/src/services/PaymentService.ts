import { supabaseAdmin } from '../lib/supabase';
import axios from 'axios';
import { randomUUID } from 'crypto';

// Interface para dados do cliente
export interface ClienteData {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
}

// Interface para resposta do pagamento
export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  qrCodePix?: string;
  copyPastePix?: string;
  pixExpiresAt?: string;
  error?: string;
}

export class PaymentService {
  private static readonly ASAAS_CONFIG = {
    BASE_URL: "https://api-sandbox.asaas.com/v3",
    API_KEY: process.env.ASAAS_API_KEY || "",
  };

  /**
   * Cria cliente no Asaas
   */
  static async criarClienteAsaas(cliente: ClienteData): Promise<string> {
    try {
      const customerData: any = {
        name: cliente.name,
        email: cliente.email,
        cpfCnpj: cliente.cpfCnpj,
      };

      if (cliente.phone && cliente.phone.trim() !== "") {
        customerData.phone = cliente.phone;
      }

      const response = await axios.post(
        `${this.ASAAS_CONFIG.BASE_URL}/customers`,
        customerData,
        {
          headers: {
            'Content-Type': 'application/json',
            'access_token': this.ASAAS_CONFIG.API_KEY,
          },
        }
      );

      return response.data.id;
    } catch (error: any) {
      console.error('❌ Erro ao criar cliente no Asaas:', error.response?.data);
      throw new Error(`Falha ao criar cliente: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  /**
   * Cria cobrança PIX no Asaas
   */
  static async criarCobrancaPix(
    customerId: string,
    valor: number,
    descricao: string,
    referenceId: string,
    userId?: string
  ): Promise<PaymentResponse> {
    try {
      const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const response = await axios.post(
        `${this.ASAAS_CONFIG.BASE_URL}/payments`,
        {
          customer: customerId,
          billingType: 'PIX',
          value: valor,
          dueDate,
          description: descricao,
          externalReference: referenceId,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'access_token': this.ASAAS_CONFIG.API_KEY,
          },
        }
      );

      const paymentId = response.data.id;

      // Obter dados do PIX
      const pixResponse = await axios.get(
        `${this.ASAAS_CONFIG.BASE_URL}/payments/${paymentId}/pixQrCode`,
        {
          headers: {
            'access_token': this.ASAAS_CONFIG.API_KEY,
          },
        }
      );

      const pixData = pixResponse.data;

      // Salvar na tabela payments
      const paymentRecordId = randomUUID();
      await supabaseAdmin
        .from('payments')
        .insert({
          id: paymentRecordId,
          asaas_id: paymentId,
          status: 'PENDING',
          valor: valor,
          user_id: userId || 'ac963a9a-57b0-4996-8d2b-1d70faf5564d',
          agendamento_id: referenceId,
          created_at: new Date().toISOString(),
        });

      return {
        success: true,
        paymentId: paymentId, // ✅ Agora retorna o asaas_id correto
        qrCodePix: pixData.encodedImage,
        copyPastePix: pixData.payload,
        pixExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
    } catch (error: any) {
      console.error('❌ Erro ao criar cobrança PIX:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.description || error.message,
      };
    }
  }

  /**
   * Processa pagamento completo (cliente + cobrança PIX)
   */
  static async processarPagamentoAsaas(
    cliente: ClienteData,
    valor: number,
    descricao: string,
    referenceId: string,
    userId?: string
  ): Promise<PaymentResponse> {
    try {
      console.log("💰 [PAYMENT] Processando pagamento no Asaas...");

      // 1. Criar cliente
      const customerId = await this.criarClienteAsaas(cliente);
      console.log("✅ [PAYMENT] Cliente criado:", customerId);

      // 2. Criar cobrança PIX
      const result = await this.criarCobrancaPix(customerId, valor, descricao, referenceId, userId);
      console.log("✅ [PAYMENT] Cobrança PIX criada");

      return result;
    } catch (error: any) {
      console.error('❌ [PAYMENT] Erro no processamento:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Atualiza status do pagamento
   */
  static async updatePaymentStatus(paymentId: string, status: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('payments')
      .update({ status })
      .eq('asaas_id', paymentId);

    if (error) {
      throw new Error('Erro ao atualizar status: ' + error.message);
    }
  }
}
