import { Request, Response } from 'express';
import { ApiResponse } from '../../models';
import { Feedback, FeedbackInsert } from '../types/feedback.types';
import { FeedbackService } from '../services/FeedbackService';

export class FeedbackController {
  /**
   * Criar um novo feedback
   */
  static async createFeedback(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { type, message }: { type: 'problem' | 'suggestion'; message: string } = req.body;

      // Validação dos dados
      if (!type || !message) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Tipo e mensagem são obrigatórios',
            statusCode: 400
          }
        };
        res.status(400).json(response);
        return;
      }

      if (!['problem', 'suggestion'].includes(type)) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Tipo deve ser "problem" ou "suggestion"',
            statusCode: 400
          }
        };
        res.status(400).json(response);
        return;
      }

      if (message.trim().length < 10) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Mensagem deve ter pelo menos 10 caracteres',
            statusCode: 400
          }
        };
        res.status(400).json(response);
        return;
      }

      // Criar feedback usando o serviço
      const feedbackData: FeedbackInsert = {
        user_id: user.id,
        type,
        message: message.trim(),
        status: 'pending'
      };

      const feedback = await FeedbackService.createFeedback(feedbackData);

      const response: ApiResponse<Feedback> = {
        success: true,
        data: feedback
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Erro ao criar feedback:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Erro interno do servidor',
          statusCode: 500
        }
      };
      res.status(500).json(response);
    }
  }

  /**
   * Buscar feedback do usuário autenticado
   */
  static async getUserFeedback(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { page = 1, limit = 10, status, type } = req.query;

      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 10));

      // Buscar feedback usando o serviço
      const { feedback, total } = await FeedbackService.getFeedbackByUserId(user.id, {
        page: pageNum,
        limit: limitNum,
        status: status as 'pending' | 'reviewed' | 'resolved' | undefined,
        type: type as 'problem' | 'suggestion' | undefined
      });

      const response: ApiResponse<{
        feedback: Feedback[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        }
      }> = {
        success: true,
        data: {
          feedback,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum)
          }
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Erro ao buscar feedback:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Erro interno do servidor',
          statusCode: 500
        }
      };
      res.status(500).json(response);
    }
  }

  /**
   * Buscar um feedback específico
   */
  static async getFeedbackById(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;

      const feedback = await FeedbackService.getFeedbackById(parseInt(id));

      if (!feedback || feedback.user_id !== user.id) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Feedback não encontrado',
            statusCode: 404
          }
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<Feedback> = {
        success: true,
        data: feedback
      };

      res.json(response);
    } catch (error) {
      console.error('Erro ao buscar feedback:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Erro interno do servidor',
          statusCode: 500
        }
      };
      res.status(500).json(response);
    }
  }

  /**
   * Atualizar status do feedback (apenas para o próprio usuário)
   */
  static async updateFeedbackStatus(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { id } = req.params;
      const { status }: { status: 'pending' | 'reviewed' | 'resolved' } = req.body;

      if (!status || !['pending', 'reviewed', 'resolved'].includes(status)) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Status deve ser "pending", "reviewed" ou "resolved"',
            statusCode: 400
          }
        };
        res.status(400).json(response);
        return;
      }

      // Primeiro verificar se o feedback existe e pertence ao usuário
      const existingFeedback = await FeedbackService.getFeedbackById(parseInt(id));

      if (!existingFeedback || existingFeedback.user_id !== user.id) {
        const response: ApiResponse = {
          success: false,
          error: {
            message: 'Feedback não encontrado',
            statusCode: 404
          }
        };
        res.status(404).json(response);
        return;
      }

      // Atualizar o feedback
      const updatedFeedback = await FeedbackService.updateFeedback(parseInt(id), { status });

      const response: ApiResponse<Feedback> = {
        success: true,
        data: updatedFeedback
      };

      res.json(response);
    } catch (error) {
      console.error('Erro ao atualizar feedback:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          message: 'Erro interno do servidor',
          statusCode: 500
        }
      };
      res.status(500).json(response);
    }
  }
}
