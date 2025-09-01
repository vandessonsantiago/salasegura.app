import { Request, Response } from 'express';
import { AgendamentoService, ClienteData } from '../services/AgendamentoService';

// Tipo para request autenticado
type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email: string;
  };
};

export class AgendamentoController {
  /**
   * Criar novo agendamento
   */
  static async criarAgendamento(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Usuário não autenticado' });
        return;
      }

      const { data, horario, valor, descricao } = req.body;

      if (!data || !horario || !valor || !descricao) {
        res.status(400).json({
          success: false,
          error: 'data, horario, valor e descricao são obrigatórios'
        });
        return;
      }

      const resultado = await AgendamentoService.criarAgendamento(
        userId,
        data,
        horario,
        valor,
        descricao
      );

      if (!resultado.success) {
        res.status(400).json({
          success: false,
          error: resultado.error || 'Erro ao criar agendamento'
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: resultado.agendamento
      });
    } catch (error) {
      console.error('Erro no controlador criarAgendamento:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Processar pagamento do agendamento
   */
  static async processarPagamento(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Usuário não autenticado' });
        return;
      }

      const { agendamentoId, cliente } = req.body;

      if (!agendamentoId || !cliente) {
        res.status(400).json({
          success: false,
          error: 'agendamentoId e cliente são obrigatórios'
        });
        return;
      }

      const clienteData: ClienteData = {
        name: cliente.name,
        email: cliente.email,
        cpfCnpj: cliente.cpfCnpj,
        phone: cliente.phone
      };

      const resultado = await AgendamentoService.processarPagamento(
        agendamentoId,
        clienteData
      );

      if (!resultado.success) {
        res.status(400).json({
          success: false,
          error: resultado.error || 'Erro ao processar pagamento'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          qrCodePix: resultado.qrCodePix,
          copyPastePix: resultado.copyPastePix
        }
      });
    } catch (error) {
      console.error('Erro no controlador processarPagamento:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Buscar agendamento do usuário
   */
  static async buscarAgendamentoUsuario(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Usuário não autenticado' });
        return;
      }

      const resultado = await AgendamentoService.buscarAgendamentoUsuario(userId);

      console.log('🔍 [API] Resultado da busca:', {
        success: resultado.success,
        hasAgendamento: !!resultado.agendamento,
        agendamentoKeys: resultado.agendamento ? Object.keys(resultado.agendamento) : null,
        google_meet_link: resultado.agendamento?.google_meet_link,
        calendar_event_id: resultado.agendamento?.calendar_event_id,
        status: resultado.agendamento?.status,
        payment_status: resultado.agendamento?.payment_status
      });

      if (!resultado.success) {
        res.status(404).json({
          success: false,
          error: resultado.error || 'Agendamento não encontrado'
        });
        return;
      }

      res.json({
        success: true,
        data: resultado.agendamento
      });

      console.log('📤 [API] Response enviada:', {
        success: true,
        dataKeys: resultado.agendamento ? Object.keys(resultado.agendamento) : null,
        googleMeetLink: resultado.agendamento?.google_meet_link,
        calendarEventId: resultado.agendamento?.calendar_event_id,
        status: resultado.agendamento?.status,
        paymentStatus: resultado.agendamento?.payment_status
      });
    } catch (error) {
      console.error('Erro no controlador buscarAgendamentoUsuario:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Confirmar agendamento (chamado pelo webhook)
   */
  static async confirmarAgendamento(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { agendamentoId } = req.body;

      if (!agendamentoId) {
        res.status(400).json({
          success: false,
          error: 'agendamentoId é obrigatório'
        });
        return;
      }

      const resultado = await AgendamentoService.confirmarAgendamento(agendamentoId);

      if (!resultado.success) {
        res.status(400).json({
          success: false,
          error: resultado.error || 'Erro ao confirmar agendamento'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Agendamento confirmado com sucesso'
      });
    } catch (error) {
      console.error('Erro no controlador confirmarAgendamento:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Cancelar agendamento
   */
  static async cancelarAgendamento(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Usuário não autenticado' });
        return;
      }

      const { agendamentoId } = req.body;

      if (!agendamentoId) {
        res.status(400).json({
          success: false,
          error: 'agendamentoId é obrigatório'
        });
        return;
      }

      const resultado = await AgendamentoService.cancelarAgendamento(agendamentoId, userId);

      if (!resultado.success) {
        res.status(400).json({
          success: false,
          error: resultado.error || 'Erro ao cancelar agendamento'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Agendamento cancelado com sucesso'
      });
    } catch (error) {
      console.error('Erro no controlador cancelarAgendamento:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}
