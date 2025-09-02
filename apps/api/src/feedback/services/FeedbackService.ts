import { supabaseAdmin } from '../../lib/supabase';
import { Feedback, FeedbackInsert, FeedbackUpdate, FeedbackStats, FeedbackListResponse, FeedbackFilters } from '../types/feedback.types';

export class FeedbackService {
  /**
   * Criar um novo feedback
   */
  static async createFeedback(feedbackData: FeedbackInsert): Promise<Feedback> {
    const { data, error } = await supabaseAdmin
      .from('feedback')
      .insert(feedbackData)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar feedback: ${error.message}`);
    }

    return data;
  }

  /**
   * Buscar feedback por ID
   */
  static async getFeedbackById(id: number): Promise<Feedback | null> {
    const { data, error } = await supabaseAdmin
      .from('feedback')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Erro ao buscar feedback: ${error.message}`);
    }

    return data;
  }

  /**
   * Buscar feedback por user_id com paginação e filtros
   */
  static async getFeedbackByUserId(
    userId: string,
    options: FeedbackFilters = {}
  ): Promise<{
    feedback: Feedback[];
    total: number;
  }> {
    const { page = 1, limit = 10, status, type } = options;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('feedback')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Erro ao buscar feedback do usuário: ${error.message}`);
    }

    return {
      feedback: data || [],
      total: count || 0
    };
  }

  /**
   * Atualizar feedback
   */
  static async updateFeedback(id: number, updates: FeedbackUpdate): Promise<Feedback> {
    const { data, error } = await supabaseAdmin
      .from('feedback')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar feedback: ${error.message}`);
    }

    return data;
  }

  /**
   * Deletar feedback
   */
  static async deleteFeedback(id: number): Promise<void> {
    const { error } = await supabaseAdmin
      .from('feedback')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao deletar feedback: ${error.message}`);
    }
  }

  /**
   * Buscar estatísticas de feedback do usuário
   */
  static async getFeedbackStats(userId: string): Promise<FeedbackStats> {
    const { data, error } = await supabaseAdmin
      .from('feedback')
      .select('status, type')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
    }

    const stats = {
      total: data.length,
      pending: 0,
      reviewed: 0,
      resolved: 0,
      problems: 0,
      suggestions: 0
    };

    data.forEach(item => {
      // Contar por status
      if (item.status === 'pending') stats.pending++;
      else if (item.status === 'reviewed') stats.reviewed++;
      else if (item.status === 'resolved') stats.resolved++;

      // Contar por tipo
      if (item.type === 'problem') stats.problems++;
      else if (item.type === 'suggestion') stats.suggestions++;
    });

    return stats;
  }

  /**
   * Buscar feedback recente (últimos 30 dias)
   */
  static async getRecentFeedback(userId: string, days: number = 30): Promise<Feedback[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);

    const { data, error } = await supabaseAdmin
      .from('feedback')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar feedback recente: ${error.message}`);
    }

    return data || [];
  }
}
