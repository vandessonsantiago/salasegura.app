// MÓDULO PAYMENTS - SERVIÇO DE CHECKOUT

import { Request } from 'express';
import { supabaseAdmin as supabase } from '../../lib/supabase';
import { AgendamentoService, AgendamentoData } from '../../agendamentos';
import { DivorceService } from '../../divorce';
import { PaymentService } from './PaymentService';
import { createCalendarEvent, updateCalendarEvent } from '../../services/google-calendar';
import {
  CheckoutData,
  CheckoutResponse,
  ServiceType
} from '../types/payment.types';

// Tipo para request autenticado
type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email: string;
  };
};

export class CheckoutService {
  /**
   * Método principal que processa o checkout completo baseado no serviceType
   */
  static async processarCheckoutCompleto(
    req: AuthenticatedRequest,
    checkoutData: CheckoutData
  ): Promise<CheckoutResponse> {
    try {
      console.log("🎯 [CHECKOUT] 🔍 DEBUG: processarCheckoutCompleto INICIADO");
      console.log("📋 [CHECKOUT] Service Type:", checkoutData.serviceType);
      console.log("👤 [CHECKOUT] User ID:", checkoutData.userId);

      // Roteamento baseado no serviceType
      switch (checkoutData.serviceType as ServiceType) {
        case 'divorcio':
          return await this.processarCheckoutDivorcio(req, checkoutData);
        case 'agendamento':
          return await this.processarCheckoutAgendamento(req, checkoutData);
        case 'checklist':
          return await this.processarCheckoutChecklist(req, checkoutData);
        default:
          // Fallback para agendamento (compatibilidade)
          console.log("⚠️ [CHECKOUT] ServiceType não reconhecido, usando agendamento como fallback");
          return await this.processarCheckoutAgendamento(req, checkoutData);
      }
    } catch (error) {
      console.error('❌ [CHECKOUT] Erro inesperado no processo consolidado:', error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  /**
   * Processa checkout específico para divórcios
   */
  private static async processarCheckoutDivorcio(
    req: AuthenticatedRequest,
    checkoutData: CheckoutData
  ): Promise<CheckoutResponse> {
    try {
      console.log("🏛️ [DIVORCIO] Processando checkout de divórcio...");

      // 1. Criar caso de divórcio na tabela divorce_cases
      const divorceResult = await DivorceService.criarCasoDivorcio(
        checkoutData.userId || req.user?.id || '',
        checkoutData.cliente,
        checkoutData.valor,
        checkoutData.descricao,
        checkoutData.serviceData
      );

      if (!divorceResult.success || !divorceResult.caseId) {
        console.error('❌ [DIVORCIO] Falha ao criar caso de divórcio:', divorceResult.error);
        return { success: false, error: divorceResult.error || 'Erro ao criar caso de divórcio' };
      }

      console.log('✅ [DIVORCIO] Caso de divórcio criado:', divorceResult.caseId);

      // 2. Processar pagamento
      const paymentResult = await PaymentService.processarPagamentoAsaas(
        checkoutData.cliente,
        checkoutData.valor,
        checkoutData.descricao
      );

      if (!paymentResult.success) {
        console.error('❌ [DIVORCIO] Falha no processamento do pagamento:', paymentResult.error);
        return { success: false, error: paymentResult.error || 'Erro no processamento do pagamento' };
      }

      console.log('✅ [DIVORCIO] Pagamento processado:', paymentResult.paymentId);

      // 3. Atualizar caso de divórcio com ID do pagamento
      await DivorceService.atualizarComDadosPagamento(divorceResult.caseId!, {
        paymentId: paymentResult.paymentId!,
        qrCodePix: paymentResult.qrCodePix!,
        copyPastePix: paymentResult.copyPastePix!,
        pixExpiresAt: paymentResult.pixExpiresAt!,
      });

      return {
        success: true,
        agendamentoId: divorceResult.caseId,
        paymentId: paymentResult.paymentId,
        qrCodePix: paymentResult.qrCodePix,
        copyPastePix: paymentResult.copyPastePix,
        pixExpiresAt: paymentResult.pixExpiresAt,
      };

    } catch (error) {
      console.error('❌ [DIVORCIO] Erro inesperado:', error);
      return { success: false, error: 'Erro interno no processamento do divórcio' };
    }
  }

  /**
   * Processa checkout específico para agendamentos
   */
  private static async processarCheckoutAgendamento(
    req: AuthenticatedRequest,
    checkoutData: CheckoutData
  ): Promise<CheckoutResponse> {
    try {
      console.log("📅 [AGENDAMENTO] Processando checkout de agendamento...");

      // 1. Criar agendamento
      const agendamentoResult = await AgendamentoService.criarAgendamentoBasico(
        checkoutData.userId || req.user?.id || '',
        'agendamento',
        checkoutData.valor,
        checkoutData.descricao,
        {
          clienteNome: checkoutData.cliente.name,
          clienteEmail: checkoutData.cliente.email,
          clienteTelefone: checkoutData.cliente.phone,
          calendarEventId: checkoutData.calendarEventId,
          googleMeetLink: checkoutData.googleMeetLink,
        },
        checkoutData.data,
        checkoutData.horario
      );

      if (!agendamentoResult.success || !agendamentoResult.agendamento) {
        console.error('❌ [AGENDAMENTO] Falha ao criar agendamento:', agendamentoResult.error);
        return { success: false, error: agendamentoResult.error || 'Erro ao criar agendamento' };
      }

      console.log('✅ [AGENDAMENTO] Agendamento criado:', agendamentoResult.agendamento.id);

      // 2. Processar pagamento
      const paymentResult = await PaymentService.processarPagamentoAsaas(
        checkoutData.cliente,
        checkoutData.valor,
        checkoutData.descricao
      );

      if (!paymentResult.success) {
        console.error('❌ [AGENDAMENTO] Falha no processamento do pagamento:', paymentResult.error);
        return { success: false, error: paymentResult.error || 'Erro no processamento do pagamento' };
      }

      console.log('✅ [AGENDAMENTO] Pagamento processado:', paymentResult.paymentId);

      // 3. Atualizar agendamento com ID do pagamento
      await AgendamentoService.atualizarComDadosPagamento(agendamentoResult.agendamento.id!, {
        paymentId: paymentResult.paymentId!,
        paymentStatus: 'PENDING',
        qrCodePix: paymentResult.qrCodePix!,
        copyPastePix: paymentResult.copyPastePix!,
        pixExpiresAt: paymentResult.pixExpiresAt!,
      });

      // 4. Executar operações pós-checkout (calendário, etc.)
      await this.executarOperacoesPosCheckout(agendamentoResult.agendamento.id!, checkoutData);

      return {
        success: true,
        agendamentoId: agendamentoResult.agendamento.id,
        paymentId: paymentResult.paymentId,
        qrCodePix: paymentResult.qrCodePix,
        copyPastePix: paymentResult.copyPastePix,
        pixExpiresAt: paymentResult.pixExpiresAt,
      };

    } catch (error) {
      console.error('❌ [AGENDAMENTO] Erro inesperado:', error);
      return { success: false, error: 'Erro interno no processamento do agendamento' };
    }
  }

  /**
   * Processa checkout específico para checklist (placeholder)
   */
  private static async processarCheckoutChecklist(
    req: AuthenticatedRequest,
    checkoutData: CheckoutData
  ): Promise<CheckoutResponse> {
    try {
      console.log("📋 [CHECKLIST] Processando checkout de checklist...");

      // Por enquanto, apenas processa o pagamento
      // TODO: Implementar lógica específica do checklist quando necessário

      const paymentResult = await PaymentService.processarPagamentoAsaas(
        checkoutData.cliente,
        checkoutData.valor,
        checkoutData.descricao
      );

      if (!paymentResult.success) {
        console.error('❌ [CHECKLIST] Falha no processamento do pagamento:', paymentResult.error);
        return { success: false, error: paymentResult.error || 'Erro no processamento do pagamento' };
      }

      return {
        success: true,
        paymentId: paymentResult.paymentId,
        qrCodePix: paymentResult.qrCodePix,
        copyPastePix: paymentResult.copyPastePix,
        pixExpiresAt: paymentResult.pixExpiresAt,
      };

    } catch (error) {
      console.error('❌ [CHECKLIST] Erro inesperado:', error);
      return { success: false, error: 'Erro interno no processamento do checklist' };
    }
  }

  /**
   * Executa operações pós-checkout (calendário, notificações, etc.)
   */
  private static async executarOperacoesPosCheckout(
    agendamentoId: string,
    checkoutData: CheckoutData
  ): Promise<void> {
    try {
      console.log('🔄 [CHECKOUT] Executando operações pós-checkout...');

      // Operações de calendário se houver dados
      if (checkoutData.calendarEventId && checkoutData.googleMeetLink) {
        console.log('📅 [CHECKOUT] Atualizando evento do calendário...');
        await updateCalendarEvent({
          eventId: checkoutData.calendarEventId!,
          summary: `Consulta Jurídica - ${checkoutData.cliente.name}`,
          description: `Cliente: ${checkoutData.cliente.name}\nEmail: ${checkoutData.cliente.email}\nServiço: ${checkoutData.descricao}\nGoogle Meet: ${checkoutData.googleMeetLink}`,
        });
      }

      console.log('✅ [CHECKOUT] Operações pós-checkout concluídas');

    } catch (error) {
      console.error('❌ [CHECKOUT] Erro nas operações pós-checkout:', error);
      // Não lança erro para não quebrar o fluxo principal
    }
  }
}
