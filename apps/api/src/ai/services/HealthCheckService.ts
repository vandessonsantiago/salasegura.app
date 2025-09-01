import { ChatAIService } from './ChatAIService';
import { UserContextService } from './UserContextService';
import { LegalService } from '../../legal/services/LegalService';
import { CacheService } from './CacheService';
import { MetricsService } from './MetricsService';
import { FeatureFlags } from '../../config/features';

export class HealthCheckService {
  static async getAIStatus(): Promise<any> {
    const startTime = Date.now();

    try {
      const status = {
        service: 'Sala Segura AI System',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        features: FeatureFlags.getAllFlags(),
        components: {
          openai: {
            available: ChatAIService.isAvailable(),
            status: ChatAIService.isAvailable() ? 'operational' : 'degraded'
          },
          cache: {
            enabled: FeatureFlags.isEnabled('CACHE_SYSTEM'),
            size: CacheService.getStats().size,
            status: 'operational'
          },
          metrics: {
            enabled: FeatureFlags.isEnabled('METRICS_TRACKING'),
            status: 'operational'
          },
          legal_service: {
            enabled: FeatureFlags.isEnabled('LEGAL_CONTEXT'),
            topics_available: LegalService.getAllTopics().length,
            status: 'operational'
          },
          user_context: {
            enabled: FeatureFlags.isEnabled('USER_CONTEXT'),
            status: 'operational'
          }
        },
        system_health: {
          ai_ready: FeatureFlags.isAISystemReady(),
          optimization_ready: FeatureFlags.isOptimizationReady(),
          monitoring_ready: FeatureFlags.isMonitoringReady(),
          overall_status: this.getOverallStatus()
        },
        performance: {
          response_time: Date.now() - startTime,
          memory_usage: process.memoryUsage(),
          cache_stats: CacheService.getStats()
        }
      };

      return status;
    } catch (error) {
      console.error('❌ [HEALTH] Erro no health check:', error);
      return {
        service: 'Sala Segura AI System',
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        uptime: process.uptime()
      };
    }
  }

  static async getMetricsStatus(): Promise<any> {
    try {
      const metrics = await MetricsService.getMetricsSummary();
      const performance = await MetricsService.getPerformanceMetrics();

      return {
        timestamp: new Date().toISOString(),
        metrics,
        performance,
        cache_stats: CacheService.getStats()
      };
    } catch (error) {
      console.error('❌ [HEALTH] Erro ao obter métricas:', error);
      return {
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static async testAIServices(): Promise<any> {
    const results = {
      timestamp: new Date().toISOString(),
      tests: [] as any[]
    };

    // Teste 1: OpenAI connectivity
    try {
      const openaiAvailable = ChatAIService.isAvailable();
      results.tests.push({
        test: 'OpenAI Connectivity',
        status: openaiAvailable ? 'pass' : 'fail',
        details: openaiAvailable ? 'API key configured and accessible' : 'API key not configured'
      });
    } catch (error) {
      results.tests.push({
        test: 'OpenAI Connectivity',
        status: 'error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Teste 2: Legal knowledge base
    try {
      const topics = LegalService.getAllTopics();
      results.tests.push({
        test: 'Legal Knowledge Base',
        status: topics.length > 0 ? 'pass' : 'fail',
        details: `${topics.length} topics available`
      });
    } catch (error) {
      results.tests.push({
        test: 'Legal Knowledge Base',
        status: 'error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Teste 3: Cache system
    try {
      const cacheStats = CacheService.getStats();
      results.tests.push({
        test: 'Cache System',
        status: 'pass',
        details: `${cacheStats.size} items cached`
      });
    } catch (error) {
      results.tests.push({
        test: 'Cache System',
        status: 'error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Teste 4: Sample AI response
    if (FeatureFlags.isEnabled('AI_CHAT')) {
      try {
        const testMessage = 'Olá, sou um teste do sistema de saúde';
        const response = await ChatAIService.generateResponse(testMessage, null);
        results.tests.push({
          test: 'AI Response Generation',
          status: response && response.length > 0 ? 'pass' : 'fail',
          details: `Response length: ${response?.length || 0} characters`
        });
      } catch (error) {
        results.tests.push({
          test: 'AI Response Generation',
          status: 'error',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  private static getOverallStatus(): string {
    if (FeatureFlags.isAISystemReady() && FeatureFlags.isOptimizationReady()) {
      return 'healthy';
    } else if (FeatureFlags.isEnabled('AI_CHAT')) {
      return 'degraded';
    } else {
      return 'maintenance';
    }
  }

  static async cleanup(): Promise<void> {
    try {
      // Limpar cache expirado
      CacheService.clearExpired();

      // Resetar métricas se necessário (diariamente)
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        console.log('🧹 [HEALTH] Resetando métricas diárias');
        MetricsService.reset();
      }

      console.log('✅ [HEALTH] Limpeza de manutenção concluída');
    } catch (error) {
      console.warn('⚠️ [HEALTH] Erro na limpeza de manutenção:', error);
    }
  }
}
