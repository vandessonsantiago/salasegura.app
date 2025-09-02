// MÓDULO PAYMENTS - CONTROLADOR

import { Request, Response } from 'express';
import { CheckoutService } from '../services/CheckoutService';
import { PaymentService } from '../services/PaymentService';

// Tipo para request autenticado
type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email: string;
  };
};

export class PaymentController {
  /**
   * Processa checkout completo
   */
  static async processarCheckout(req: AuthenticatedRequest, res: Response) {
    try {
      const { customer, value, description, serviceType, serviceData, data, horario, calendarEventId, googleMeetLink } = req.body;

      // Validar dados obrigatórios
      if (!customer || !value || !description || !serviceType) {
        return res.status(400).json({
          success: false,
          error: 'Dados obrigatórios não fornecidos'
        });
      }

      // Preparar dados do checkout
      const checkoutData = {
        cliente: {
          name: customer.name,
          email: customer.email,
          cpfCnpj: customer.cpfCnpj,
          phone: customer.phone,
        },
        valor: value,
        descricao: description,
        serviceType: serviceType,
        serviceData: serviceData,
        data: data,
        horario: horario,
        userId: req.user?.id,
        calendarEventId: calendarEventId,
        googleMeetLink: googleMeetLink,
      };

      // Processar checkout
      const result = await CheckoutService.processarCheckoutCompleto(req, checkoutData);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('[PAYMENT-CONTROLLER] Erro no processamento do checkout:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Lista pagamentos do usuário
   */
  static async listarPagamentos(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado'
        });
      }

      const payments = await PaymentService.getPaymentsByUser(userId);

      res.json({
        success: true,
        data: payments
      });

    } catch (error) {
      console.error('[PAYMENT-CONTROLLER] Erro ao listar pagamentos:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Busca informações de um pagamento específico
   */
  static async buscarPagamento(req: AuthenticatedRequest, res: Response) {
    try {
      const { paymentId } = req.params;

      if (!paymentId) {
        return res.status(400).json({
          success: false,
          error: 'ID do pagamento não fornecido'
        });
      }

      const payment = await PaymentService.getPaymentById(paymentId);

      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Pagamento não encontrado'
        });
      }

      res.json({
        success: true,
        data: payment
      });

    } catch (error) {
      console.error('[PAYMENT-CONTROLLER] Erro ao buscar pagamento:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Atualiza status de um pagamento (webhook)
   */
  static async atualizarStatusPagamento(req: Request, res: Response) {
    try {
      const { paymentId, status } = req.body;

      if (!paymentId || !status) {
        return res.status(400).json({
          success: false,
          error: 'Dados obrigatórios não fornecidos'
        });
      }

      const success = await PaymentService.updatePaymentStatus(paymentId, status as any);

      if (success) {
        res.json({
          success: true,
          message: 'Status atualizado com sucesso'
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Erro ao atualizar status'
        });
      }

    } catch (error) {
      console.error('[PAYMENT-CONTROLLER] Erro ao atualizar status:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}
