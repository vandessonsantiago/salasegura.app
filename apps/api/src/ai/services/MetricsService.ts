import { supabaseAdmin } from '../../lib/supabase';

export class MetricsService {
  private static metrics = {
    totalInteractions: 0,
    totalProcessingTime: 0,
    averageProcessingTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    legalQueries: 0,
    authenticatedUsers: 0,
    anonymousUsers: 0,
    errors: 0,
    topTopics: {} as Record<string, number>,
    hourlyStats: [] as Array<{ hour: string; interactions: number; avgTime: number }>
  };
  private static saveInterval = 50; // Salvar a cada 50 interações
  private static interactionCount = 0;

  static async trackInteraction(data: {
    userId?: string;
    message: string;
    response: string;
    legalContext?: any;
    processingTime: number;
    hasUserContext: boolean;
    cached?: boolean;
  }): Promise<void> {
    try {
      console.log('📊 [METRICS] Rastreando interação:', {
        userId: data.userId || 'anonymous',
        messageLength: data.message.length,
        responseLength: data.response.length,
        processingTime: data.processingTime,
        hasLegalContext: !!data.legalContext,
        hasUserContext: data.hasUserContext,
        cached: data.cached
      });

      // Atualizar métricas básicas
      this.metrics.totalInteractions++;
      this.metrics.totalProcessingTime += data.processingTime;
      this.metrics.averageProcessingTime = this.metrics.totalProcessingTime / this.metrics.totalInteractions;

      // Cache stats
      if (data.cached) {
        this.metrics.cacheHits++;
      } else {
        this.metrics.cacheMisses++;
      }

      // User type stats
      if (data.userId) {
        this.metrics.authenticatedUsers++;
      } else {
        this.metrics.anonymousUsers++;
      }

      // Legal queries
      if (data.legalContext) {
        this.metrics.legalQueries++;
        const topic = data.legalContext.topic;
        this.metrics.topTopics[topic] = (this.metrics.topTopics[topic] || 0) + 1;
      }

      // Hourly stats
      this.updateHourlyStats(data.processingTime);

      // Salvar periodicamente no banco
      this.interactionCount++;
      if (this.interactionCount >= this.saveInterval) {
        this.saveMetricsToDatabase();
        this.interactionCount = 0;
      }

    } catch (error) {
      console.warn('⚠️ [METRICS] Erro ao rastrear métricas:', error);
      this.metrics.errors++;
    }
  }

  private static updateHourlyStats(processingTime: number): void {
    const now = new Date();
    const hourKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}`;

    const existingStat = this.metrics.hourlyStats.find(stat => stat.hour === hourKey);
    if (existingStat) {
      existingStat.interactions++;
      existingStat.avgTime = (existingStat.avgTime * (existingStat.interactions - 1) + processingTime) / existingStat.interactions;
    } else {
      this.metrics.hourlyStats.push({
        hour: hourKey,
        interactions: 1,
        avgTime: processingTime
      });
    }

    // Manter apenas últimas 24 horas
    if (this.metrics.hourlyStats.length > 24) {
      this.metrics.hourlyStats.shift();
    }
  }

  private static async saveMetricsToDatabase(): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('metrics')
        .insert({
          total_interactions: this.metrics.totalInteractions,
          total_processing_time: this.metrics.totalProcessingTime,
          average_processing_time: this.metrics.averageProcessingTime,
          cache_hits: this.metrics.cacheHits,
          cache_misses: this.metrics.cacheMisses,
          legal_queries: this.metrics.legalQueries,
          authenticated_users: this.metrics.authenticatedUsers,
          anonymous_users: this.metrics.anonymousUsers,
          errors: this.metrics.errors,
          top_topics: this.metrics.topTopics,
          hourly_stats: this.metrics.hourlyStats
        });

      if (error) {
        console.warn('⚠️ [METRICS] Erro ao salvar métricas no banco:', error);
      } else {
        console.log('📊 [METRICS] Métricas salvas no banco de dados');
      }
    } catch (error) {
      console.warn('⚠️ [METRICS] Erro ao salvar métricas:', error);
    }
  }

  static async loadMetricsFromDatabase(): Promise<void> {
    try {
      const { data, error } = await supabaseAdmin
        .from('metrics')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1);

      if (error) {
        console.warn('⚠️ [METRICS] Erro ao carregar métricas do banco:', error);
        return;
      }

      if (data && data.length > 0) {
        const latest = data[0];
        this.metrics = {
          totalInteractions: latest.total_interactions || 0,
          totalProcessingTime: latest.total_processing_time || 0,
          averageProcessingTime: latest.average_processing_time || 0,
          cacheHits: latest.cache_hits || 0,
          cacheMisses: latest.cache_misses || 0,
          legalQueries: latest.legal_queries || 0,
          authenticatedUsers: latest.authenticated_users || 0,
          anonymousUsers: latest.anonymous_users || 0,
          errors: latest.errors || 0,
          topTopics: latest.top_topics || {},
          hourlyStats: latest.hourly_stats || []
        };
        console.log('📊 [METRICS] Métricas carregadas do banco de dados');
      }
    } catch (error) {
      console.warn('⚠️ [METRICS] Erro ao carregar métricas:', error);
    }
  }

  static async trackError(error: any, context: any): Promise<void> {
    try {
      console.error('❌ [METRICS] Erro rastreado:', {
        error: error.message,
        context,
        timestamp: new Date().toISOString()
      });

      // Salvar erro detalhado no banco
      await supabaseAdmin
        .from('metrics_errors')
        .insert({
          error_message: error.message,
          error_context: context,
          user_id: context?.userId || null
        });

      this.metrics.errors++;
    } catch (trackError) {
      console.warn('⚠️ [METRICS] Erro ao rastrear erro:', trackError);
    }
  }

  static async getMetricsSummary(): Promise<any> {
    const cacheHitRate = this.metrics.totalInteractions > 0 ?
      (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100 : 0;

    return {
      totalInteractions: this.metrics.totalInteractions,
      averageProcessingTime: Math.round(this.metrics.averageProcessingTime),
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      legalQueries: this.metrics.legalQueries,
      authenticatedUsers: this.metrics.authenticatedUsers,
      anonymousUsers: this.metrics.anonymousUsers,
      errors: this.metrics.errors,
      topTopics: Object.entries(this.metrics.topTopics)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([topic, count]) => ({ topic, count })),
      hourlyStats: this.metrics.hourlyStats.slice(-6), // Últimas 6 horas
      timestamp: new Date().toISOString()
    };
  }

  static async getPerformanceMetrics(): Promise<any> {
    return {
      averageResponseTime: this.metrics.averageProcessingTime,
      totalRequests: this.metrics.totalInteractions,
      errorRate: this.metrics.totalInteractions > 0 ?
        (this.metrics.errors / this.metrics.totalInteractions) * 100 : 0,
      cacheEfficiency: {
        hits: this.metrics.cacheHits,
        misses: this.metrics.cacheMisses,
        hitRate: this.metrics.totalInteractions > 0 ?
          (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100 : 0
      },
      userEngagement: {
        authenticated: this.metrics.authenticatedUsers,
        anonymous: this.metrics.anonymousUsers,
        legalFocus: this.metrics.legalQueries
      }
    };
  }

  static async initialize(): Promise<void> {
    await this.loadMetricsFromDatabase();
    console.log('📊 [METRICS] Serviço de métricas inicializado');
  }

  static reset(): void {
    this.metrics = {
      totalInteractions: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      legalQueries: 0,
      authenticatedUsers: 0,
      anonymousUsers: 0,
      errors: 0,
      topTopics: {},
      hourlyStats: []
    };
  }
}
