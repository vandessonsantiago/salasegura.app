// MÓDULO PAYMENTS - SERVIÇO DE INTEGRAÇÃO ASAAS

import axios from 'axios';
import { AsaasConfig, ClienteData, AsaasCustomerResponse, AsaasPaymentData, PaymentResponse } from '../types/payment.types';

export class AsaasService {
  private static readonly CONFIG: AsaasConfig = {
    BASE_URL: "https://api-sandbox.asaas.com/v3",
    API_KEY: process.env.ASAAS_API_KEY || "",
  };

  /**
   * Cria cliente no Asaas
   */
  static async criarClienteAsaas(cliente: ClienteData): Promise<AsaasCustomerResponse> {
    try {
      console.log('[ASAAS] Criando cliente:', cliente.name);

      const customerData: any = {
        name: cliente.name,
        email: cliente.email,
        cpfCnpj: cliente.cpfCnpj,
      };

      if (cliente.phone && cliente.phone.trim() !== "") {
        customerData.phone = cliente.phone;
      }

      const response = await axios.post(
        `${this.CONFIG.BASE_URL}/customers`,
        customerData,
        {
          headers: {
            'Content-Type': 'application/json',
            'access_token': this.CONFIG.API_KEY,
          },
        }
      );

      console.log('[ASAAS] Cliente criado com sucesso:', response.data.id);
      return { success: true, customerId: response.data.id };

    } catch (error: any) {
      console.error('[ASAAS] Erro ao criar cliente:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.description || 'Erro ao criar cliente no Asaas'
      };
    }
  }

  /**
   * Processa pagamento no Asaas
   */
  static async processarPagamentoAsaas(
    paymentData: AsaasPaymentData
  ): Promise<PaymentResponse> {
    try {
      console.log('[ASAAS] Processando pagamento:', paymentData);

      const response = await axios.post(
        `${this.CONFIG.BASE_URL}/payments`,
        paymentData,
        {
          headers: {
            'Content-Type': 'application/json',
            'access_token': this.CONFIG.API_KEY,
          },
        }
      );

      console.log('[ASAAS] Pagamento criado:', response.data.id);

      // Buscar QR Code do PIX
      const qrCodeResponse = await this.buscarQrCodePix(response.data.id);

      return {
        success: true,
        paymentId: response.data.id,
        qrCodePix: qrCodeResponse.qrCode,
        copyPastePix: qrCodeResponse.copyPaste,
        pixExpiresAt: response.data.pix?.expirationDate,
      };

    } catch (error: any) {
      console.error('[ASAAS] Erro ao processar pagamento:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.description || 'Erro ao processar pagamento'
      };
    }
  }

  /**
   * Busca QR Code do PIX para um pagamento
   */
  private static async buscarQrCodePix(paymentId: string): Promise<{ qrCode?: string; copyPaste?: string }> {
    try {
      const response = await axios.get(
        `${this.CONFIG.BASE_URL}/payments/${paymentId}/pixQrCode`,
        {
          headers: {
            'access_token': this.CONFIG.API_KEY,
          },
        }
      );

      return {
        qrCode: response.data.encodedImage,
        copyPaste: response.data.payload,
      };

    } catch (error: any) {
      console.error('[ASAAS] Erro ao buscar QR Code PIX:', error.response?.data || error.message);
      return {};
    }
  }

  /**
   * Busca informações de um pagamento
   */
  static async buscarPagamento(paymentId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.CONFIG.BASE_URL}/payments/${paymentId}`,
        {
          headers: {
            'access_token': this.CONFIG.API_KEY,
          },
        }
      );

      return response.data;

    } catch (error: any) {
      console.error('[ASAAS] Erro ao buscar pagamento:', error.response?.data || error.message);
      throw new Error('Erro ao buscar informações do pagamento');
    }
  }

  /**
   * Atualiza status de um pagamento
   */
  static async atualizarStatusPagamento(paymentId: string, status: string): Promise<boolean> {
    try {
      console.log('[ASAAS] Atualizando status do pagamento:', paymentId, 'para:', status);

      await axios.post(
        `${this.CONFIG.BASE_URL}/payments/${paymentId}/receiveInCash`,
        {},
        {
          headers: {
            'access_token': this.CONFIG.API_KEY,
          },
        }
      );

      return true;

    } catch (error: any) {
      console.error('[ASAAS] Erro ao atualizar status:', error.response?.data || error.message);
      return false;
    }
  }
}
