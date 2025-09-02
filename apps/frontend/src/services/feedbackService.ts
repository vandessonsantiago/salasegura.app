import { apiEndpoint } from '@/lib/api';
import { logger } from '@/lib/logger';

export interface FeedbackData {
  type: 'problem' | 'suggestion';
  message: string;
}

export interface FeedbackResponse {
  id: number;
  user_id: string;
  type: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    statusCode: number;
  };
}

export class FeedbackService {
  private static readonly FEEDBACK_ENDPOINT = apiEndpoint('/feedback');

  /**
   * Enviar feedback para a API
   */
  static async submitFeedback(feedbackData: FeedbackData, token: string): Promise<FeedbackResponse> {
    try {
      logger.log('📝 Enviando feedback:', feedbackData);

      const response = await fetch(this.FEEDBACK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(feedbackData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<FeedbackResponse> = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Erro ao enviar feedback');
      }

      logger.log('✅ Feedback enviado com sucesso:', result.data);
      return result.data!;
    } catch (error) {
      logger.error('❌ Erro ao enviar feedback:', error);
      throw error;
    }
  }

  /**
   * Buscar feedback do usuário
   */
  static async getUserFeedback(
    token: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      type?: string;
    } = {}
  ): Promise<{
    feedback: FeedbackResponse[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const { page = 1, limit = 10, status, type } = options;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (status) params.append('status', status);
      if (type) params.append('type', type);

      const response = await fetch(`${this.FEEDBACK_ENDPOINT}?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<{
        feedback: FeedbackResponse[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }> = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Erro ao buscar feedback');
      }

      return result.data!;
    } catch (error) {
      logger.error('❌ Erro ao buscar feedback:', error);
      throw error;
    }
  }

  /**
   * Buscar feedback específico
   */
  static async getFeedbackById(id: number, token: string): Promise<FeedbackResponse> {
    try {
      const response = await fetch(`${this.FEEDBACK_ENDPOINT}/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<FeedbackResponse> = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Erro ao buscar feedback');
      }

      return result.data!;
    } catch (error) {
      logger.error('❌ Erro ao buscar feedback específico:', error);
      throw error;
    }
  }

  /**
   * Atualizar status do feedback
   */
  static async updateFeedbackStatus(
    id: number,
    status: 'pending' | 'reviewed' | 'resolved',
    token: string
  ): Promise<FeedbackResponse> {
    try {
      const response = await fetch(`${this.FEEDBACK_ENDPOINT}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<FeedbackResponse> = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Erro ao atualizar feedback');
      }

      return result.data!;
    } catch (error) {
      logger.error('❌ Erro ao atualizar status do feedback:', error);
      throw error;
    }
  }
}
