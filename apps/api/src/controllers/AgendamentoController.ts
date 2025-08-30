import { Request, Response } from 'express';
import { AgendamentoService } from '../services/AgendamentoService';

// Tipo para request autenticado
type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email: string;
  };
};

export class AgendamentoController {
  /**
   * Criar agendamento básico
   */
  static async criarAgendamentoBasico(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Usuário não autenticado' });
        return;
      }

      const { serviceType, valor, descricao, serviceData } = req.body;

      if (!serviceType || !valor || !descricao) {
        res.status(400).json({
          success: false,
          error: 'serviceType, valor e descricao são obrigatórios'
        });
        return;
      }

      const resultado = await AgendamentoService.criarAgendamentoBasico(
        userId,
        serviceType,
        valor,
        descricao,
        serviceData
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
      console.error('Erro no controlador criarAgendamentoBasico:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Buscar agendamento por ID
   */
  static async buscarAgendamento(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ success: false, error: 'ID do agendamento é obrigatório' });
        return;
      }

      const resultado = await AgendamentoService.buscarAgendamento(id);

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
    } catch (error) {
      console.error('Erro no controlador buscarAgendamento:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Listar agendamentos do usuário
   */
  static async listarAgendamentosUsuario(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Usuário não autenticado' });
        return;
      }

      const resultado = await AgendamentoService.listarAgendamentosUsuario(userId);

      if (!resultado.success) {
        res.status(400).json({
          success: false,
          error: resultado.error || 'Erro ao listar agendamentos'
        });
        return;
      }

      res.json({
        success: true,
        data: resultado.agendamentos
      });
    } catch (error) {
      console.error('Erro no controlador listarAgendamentosUsuario:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Atualizar dados do cliente no agendamento
   */
  static async atualizarDadosCliente(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nome, email, telefone } = req.body;

      if (!id || !nome || !email || !telefone) {
        res.status(400).json({
          success: false,
          error: 'ID, nome, email e telefone são obrigatórios'
        });
        return;
      }

      const resultado = await AgendamentoService.atualizarComDadosCliente(id, {
        nome,
        email,
        telefone
      });

      if (!resultado.success) {
        res.status(400).json({
          success: false,
          error: resultado.error || 'Erro ao atualizar dados do cliente'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Dados do cliente atualizados com sucesso'
      });
    } catch (error) {
      console.error('Erro no controlador atualizarDadosCliente:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}
