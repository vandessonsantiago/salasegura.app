import { Request, Response } from 'express';
import { AgendamentoService } from '../services/AgendamentoService';
import { AgendamentoApiResponse, AgendamentoListResponse, CreateAgendamentoRequest, UpdateAgendamentoRequest } from '../types/agendamentos.types';

export class AgendamentoController {
  /**
   * Buscar todos os agendamentos do usuário
   */
  static async getUserAgendamentos(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        const response: AgendamentoApiResponse = {
          success: false,
          error: {
            message: 'Usuário não autenticado',
            statusCode: 401
          }
        };
        res.status(401).json(response);
        return;
      }

      const { page, limit, status, payment_status, service_type, date_from, date_to } = req.query;

      const filters = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        status: status as 'pending' | 'confirmed' | 'cancelled' | 'completed' | undefined,
        payment_status: payment_status as 'pending' | 'paid' | 'failed' | 'refunded' | undefined,
        service_type: service_type as string,
        date_from: date_from as string,
        date_to: date_to as string
      };

      const result = await AgendamentoService.getAgendamentosByUserId(userId, filters);

      if (!result.success) {
        const response: AgendamentoApiResponse = {
          success: false,
          error: {
            message: result.error || 'Erro ao buscar agendamentos',
            statusCode: 500
          }
        };
        res.status(500).json(response);
        return;
      }

      const response: AgendamentoApiResponse<AgendamentoListResponse> = {
        success: true,
        data: result.data
      };

      res.json(response);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      const response: AgendamentoApiResponse = {
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
   * Criar novo agendamento
   */
  static async createAgendamento(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        const response: AgendamentoApiResponse = {
          success: false,
          error: {
            message: 'Usuário não autenticado',
            statusCode: 401
          }
        };
        res.status(401).json(response);
        return;
      }

      const agendamentoData: CreateAgendamentoRequest = req.body;

      // Validação básica
      if (!agendamentoData.data || !agendamentoData.horario || !agendamentoData.valor || !agendamentoData.descricao) {
        const response: AgendamentoApiResponse = {
          success: false,
          error: {
            message: 'Data, horário, valor e descrição são obrigatórios',
            statusCode: 400
          }
        };
        res.status(400).json(response);
        return;
      }

      const result = await AgendamentoService.createAgendamento(userId, {
        user_id: userId,
        ...agendamentoData
      });

      if (!result.success) {
        const response: AgendamentoApiResponse = {
          success: false,
          error: {
            message: result.error || 'Erro ao criar agendamento',
            statusCode: 400
          }
        };
        res.status(400).json(response);
        return;
      }

      const response: AgendamentoApiResponse = {
        success: true,
        data: result.agendamento
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      const response: AgendamentoApiResponse = {
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
   * Buscar agendamento específico
   */
  static async getAgendamento(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        const response: AgendamentoApiResponse = {
          success: false,
          error: {
            message: 'Usuário não autenticado',
            statusCode: 401
          }
        };
        res.status(401).json(response);
        return;
      }

      const { id } = req.params;

      const result = await AgendamentoService.getAgendamentoById(id, userId);

      if (!result.success) {
        const statusCode = result.error === 'Agendamento não encontrado' ? 404 : 500;
        const response: AgendamentoApiResponse = {
          success: false,
          error: {
            message: result.error || 'Erro ao buscar agendamento',
            statusCode
          }
        };
        res.status(statusCode).json(response);
        return;
      }

      const response: AgendamentoApiResponse = {
        success: true,
        data: result.agendamento
      };

      res.json(response);
    } catch (error) {
      console.error('Erro ao buscar agendamento:', error);
      const response: AgendamentoApiResponse = {
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
   * Atualizar agendamento
   */
  static async updateAgendamento(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        const response: AgendamentoApiResponse = {
          success: false,
          error: {
            message: 'Usuário não autenticado',
            statusCode: 401
          }
        };
        res.status(401).json(response);
        return;
      }

      const { id } = req.params;
      const updateData: UpdateAgendamentoRequest = req.body;

      const result = await AgendamentoService.updateAgendamento(id, userId, updateData);

      if (!result.success) {
        const response: AgendamentoApiResponse = {
          success: false,
          error: {
            message: result.error || 'Erro ao atualizar agendamento',
            statusCode: 400
          }
        };
        res.status(400).json(response);
        return;
      }

      const response: AgendamentoApiResponse = {
        success: true,
        data: result.agendamento
      };

      res.json(response);
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      const response: AgendamentoApiResponse = {
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
   * Deletar agendamento
   */
  static async deleteAgendamento(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        const response: AgendamentoApiResponse = {
          success: false,
          error: {
            message: 'Usuário não autenticado',
            statusCode: 401
          }
        };
        res.status(401).json(response);
        return;
      }

      const { id } = req.params;

      const result = await AgendamentoService.deleteAgendamento(id, userId);

      if (!result.success) {
        const response: AgendamentoApiResponse = {
          success: false,
          error: {
            message: result.error || 'Erro ao deletar agendamento',
            statusCode: 400
          }
        };
        res.status(400).json(response);
        return;
      }

      const response: AgendamentoApiResponse = {
        success: true,
        data: { message: 'Agendamento deletado com sucesso' }
      };

      res.json(response);
    } catch (error) {
      console.error('Erro ao deletar agendamento:', error);
      const response: AgendamentoApiResponse = {
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
   * Buscar agendamento do usuário (último ativo)
   */
  static async buscarAgendamentoUsuario(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        const response: AgendamentoApiResponse = {
          success: false,
          error: {
            message: 'Usuário não autenticado',
            statusCode: 401
          }
        };
        res.status(401).json(response);
        return;
      }

      const result = await AgendamentoService.getUserAgendamento(userId);

      const response: AgendamentoApiResponse = {
        success: true,
        data: result.agendamento
      };

      res.json(response);
    } catch (error) {
      console.error('Erro ao buscar agendamento do usuário:', error);
      const response: AgendamentoApiResponse = {
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
   * Processar pagamento do agendamento
   */
  static async processarPagamento(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { cliente } = req.body;

      if (!cliente || !cliente.name || !cliente.email || !cliente.cpfCnpj) {
        const response: AgendamentoApiResponse = {
          success: false,
          error: {
            message: 'Dados do cliente são obrigatórios',
            statusCode: 400
          }
        };
        res.status(400).json(response);
        return;
      }

      const result = await AgendamentoService.processPayment(id, cliente);

      if (!result.success) {
        const response: AgendamentoApiResponse = {
          success: false,
          error: {
            message: result.error || 'Erro ao processar pagamento',
            statusCode: 400
          }
        };
        res.status(400).json(response);
        return;
      }

      const response: AgendamentoApiResponse = {
        success: true,
        data: {
          qrCodePix: result.qrCodePix,
          copyPastePix: result.copyPastePix
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      const response: AgendamentoApiResponse = {
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
   * Confirmar agendamento
   */
  static async confirmarAgendamento(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await AgendamentoService.confirmAgendamento(id);

      if (!result.success) {
        const response: AgendamentoApiResponse = {
          success: false,
          error: {
            message: result.error || 'Erro ao confirmar agendamento',
            statusCode: 400
          }
        };
        res.status(400).json(response);
        return;
      }

      const response: AgendamentoApiResponse = {
        success: true,
        data: { message: 'Agendamento confirmado com sucesso' }
      };

      res.json(response);
    } catch (error) {
      console.error('Erro ao confirmar agendamento:', error);
      const response: AgendamentoApiResponse = {
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
   * Cancelar agendamento
   */
  static async cancelarAgendamento(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        const response: AgendamentoApiResponse = {
          success: false,
          error: {
            message: 'Usuário não autenticado',
            statusCode: 401
          }
        };
        res.status(401).json(response);
        return;
      }

      const { id } = req.params;

      const result = await AgendamentoService.cancelAgendamento(id, userId);

      if (!result.success) {
        const response: AgendamentoApiResponse = {
          success: false,
          error: {
            message: result.error || 'Erro ao cancelar agendamento',
            statusCode: 400
          }
        };
        res.status(400).json(response);
        return;
      }

      const response: AgendamentoApiResponse = {
        success: true,
        data: { message: 'Agendamento cancelado com sucesso' }
      };

      res.json(response);
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      const response: AgendamentoApiResponse = {
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
