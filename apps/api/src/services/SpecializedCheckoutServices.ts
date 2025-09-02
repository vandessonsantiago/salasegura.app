import { Request, Response } from 'express';
import { CheckoutService, CheckoutData, CheckoutResponse } from './CheckoutService';
import { DivorceService } from '../divorce';
import { AgendamentoService } from '../agendamentos';

// Tipo para request autenticado
type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email: string;
  };
};

/**
 * Serviço especializado para checkout de divórcios
 * Herda funcionalidades do CheckoutService mas usa DivorceService
 */
export class DivorceCheckoutService {
  /**
   * Processa checkout específico para divórcios
   */
  static async processarCheckoutDivorcio(
    req: AuthenticatedRequest,
    checkoutData: CheckoutData
  ): Promise<CheckoutResponse> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      console.log('🚀 [DIVORCE-CHECKOUT] Iniciando processo de checkout para divórcio');
      console.log('📊 [DIVORCE-CHECKOUT] Dados recebidos:', {
        userId,
        serviceType: checkoutData.serviceType,
        valor: checkoutData.valor
      });

      // PASSO 1: Criar caso de divórcio
      console.log('🏗️ [DIVORCE-CHECKOUT] Passo 1: Criando caso de divórcio...');
      const divorceResult = await DivorceService.criarCasoDivorcio(
        userId,
        checkoutData.cliente,
        checkoutData.valor,
        checkoutData.descricao,
        checkoutData.serviceData
      );

      if (!divorceResult.success || !divorceResult.caseId) {
        console.error('❌ [DIVORCE-CHECKOUT] Falha ao criar caso de divórcio:', divorceResult.error);
        return { success: false, error: divorceResult.error || 'Erro ao criar caso de divórcio' };
      }

      console.log('✅ [DIVORCE-CHECKOUT] Caso criado com sucesso:', divorceResult.caseId);

      // PASSO 2: Processar pagamento
      console.log('💰 [DIVORCE-CHECKOUT] Passo 2: Processando pagamento...');
      const paymentResult = await CheckoutService.processarPagamentoAsaas(
        checkoutData.cliente,
        checkoutData.valor,
        checkoutData.descricao,
        divorceResult.caseId!
      );

      if (!paymentResult.success) {
        console.error('❌ [DIVORCE-CHECKOUT] Falha no processamento do pagamento:', paymentResult.error);
        return { success: false, error: paymentResult.error || 'Erro no processamento do pagamento' };
      }

      // PASSO 3: Atualizar caso com dados do pagamento
      console.log('📝 [DIVORCE-CHECKOUT] Passo 3: Atualizando caso com dados do pagamento...');
      await DivorceService.atualizarComDadosPagamento(divorceResult.caseId!, {
        paymentId: paymentResult.paymentId!,
        qrCodePix: paymentResult.qrCodePix!,
        copyPastePix: paymentResult.copyPastePix!,
        pixExpiresAt: paymentResult.pixExpiresAt!,
      });

      console.log('✅ [DIVORCE-CHECKOUT] Checkout de divórcio processado com sucesso');

      return {
        success: true,
        agendamentoId: divorceResult.caseId,
        paymentId: paymentResult.paymentId,
        qrCodePix: paymentResult.qrCodePix,
        copyPastePix: paymentResult.copyPastePix,
        pixExpiresAt: paymentResult.pixExpiresAt,
      };
    } catch (error) {
      console.error('❌ [DIVORCE-CHECKOUT] Erro inesperado:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
  }
}

/**
 * Serviço especializado para checkout de agendamentos
 * Herda funcionalidades do CheckoutService mas usa AgendamentoService
 */
export class AppointmentCheckoutService {
  /**
   * Processa checkout específico para agendamentos
   */
  static async processarCheckoutAgendamento(
    req: AuthenticatedRequest,
    checkoutData: CheckoutData
  ): Promise<CheckoutResponse> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      console.log('🚀 [APPOINTMENT-CHECKOUT] Iniciando processo de checkout para agendamento');
      console.log('📊 [APPOINTMENT-CHECKOUT] Dados recebidos:', {
        userId,
        serviceType: checkoutData.serviceType,
        valor: checkoutData.valor,
        data: checkoutData.data,
        horario: checkoutData.horario
      });

      // PASSO 1: Criar agendamento
      console.log('📅 [APPOINTMENT-CHECKOUT] Passo 1: Criando agendamento...');
      const agendamentoResult = await AgendamentoService.criarAgendamentoBasico(
        userId,
        'agendamento',
        checkoutData.valor,
        checkoutData.descricao,
        checkoutData.serviceData,
        checkoutData.data,
        checkoutData.horario
      );

      if (!agendamentoResult.success || !agendamentoResult.agendamento) {
        console.error('❌ [APPOINTMENT-CHECKOUT] Falha ao criar agendamento:', agendamentoResult.error);
        return { success: false, error: agendamentoResult.error || 'Erro ao criar agendamento' };
      }

      console.log('✅ [APPOINTMENT-CHECKOUT] Agendamento criado com sucesso:', agendamentoResult.agendamento.id);

      // PASSO 2: Processar pagamento
      console.log('💰 [APPOINTMENT-CHECKOUT] Passo 2: Processando pagamento...');
      const paymentResult = await CheckoutService.processarPagamentoAsaas(
        checkoutData.cliente,
        checkoutData.valor,
        checkoutData.descricao,
        agendamentoResult.agendamento.id!
      );

      if (!paymentResult.success) {
        console.error('❌ [APPOINTMENT-CHECKOUT] Falha no processamento do pagamento:', paymentResult.error);
        return { success: false, error: paymentResult.error || 'Erro no processamento do pagamento' };
      }

      // PASSO 3: Atualizar agendamento com dados do pagamento
      console.log('📝 [APPOINTMENT-CHECKOUT] Passo 3: Atualizando agendamento com dados do pagamento...');
      await AgendamentoService.atualizarComDadosPagamento(agendamentoResult.agendamento.id!, {
        paymentId: paymentResult.paymentId!,
        paymentStatus: 'PENDING',
        qrCodePix: paymentResult.qrCodePix!,
        copyPastePix: paymentResult.copyPastePix!,
        pixExpiresAt: paymentResult.pixExpiresAt!,
      });

      console.log('✅ [APPOINTMENT-CHECKOUT] Checkout de agendamento processado com sucesso');

      return {
        success: true,
        agendamentoId: agendamentoResult.agendamento.id,
        paymentId: paymentResult.paymentId,
        qrCodePix: paymentResult.qrCodePix,
        copyPastePix: paymentResult.copyPastePix,
        pixExpiresAt: paymentResult.pixExpiresAt,
      };
    } catch (error) {
      console.error('❌ [APPOINTMENT-CHECKOUT] Erro inesperado:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro interno' };
    }
  }
}
