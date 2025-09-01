// Feature flags para controle gradual do sistema de IA
export const FEATURES = {
  // Sistema de IA principal
  AI_CHAT: process.env.ENABLE_AI_CHAT === 'true' || true, // Habilitado por padrão em desenvolvimento
  LEGAL_CONTEXT: process.env.ENABLE_LEGAL_CONTEXT === 'true' || true,
  USER_CONTEXT: process.env.ENABLE_USER_CONTEXT === 'true' || true,

  // Otimizações
  CACHE_SYSTEM: process.env.ENABLE_CACHE === 'true' || true,
  METRICS_TRACKING: process.env.ENABLE_METRICS === 'true' || true,

  // Recursos avançados
  ADVANCED_LEGAL_SEARCH: process.env.ENABLE_ADVANCED_LEGAL_SEARCH === 'true' || false,
  PERSONALIZED_SUGGESTIONS: process.env.ENABLE_PERSONALIZED_SUGGESTIONS === 'true' || true,
  CONVERSATION_MEMORY: process.env.ENABLE_CONVERSATION_MEMORY === 'true' || true,

  // Monitoramento
  HEALTH_CHECKS: process.env.ENABLE_HEALTH_CHECKS === 'true' || true,
  PERFORMANCE_MONITORING: process.env.ENABLE_PERFORMANCE_MONITORING === 'true' || true,
};

// Funções auxiliares para feature flags
export class FeatureFlags {
  static isEnabled(feature: keyof typeof FEATURES): boolean {
    return FEATURES[feature];
  }

  static getAllFlags(): typeof FEATURES {
    return { ...FEATURES };
  }

  static getEnabledFeatures(): string[] {
    return Object.entries(FEATURES)
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature);
  }

  static getDisabledFeatures(): string[] {
    return Object.entries(FEATURES)
      .filter(([, enabled]) => !enabled)
      .map(([feature]) => feature);
  }

  // Método para verificar se todos os recursos principais estão habilitados
  static isAISystemReady(): boolean {
    return this.isEnabled('AI_CHAT') &&
           this.isEnabled('LEGAL_CONTEXT') &&
           this.isEnabled('USER_CONTEXT');
  }

  // Método para verificar se o sistema de otimização está ativo
  static isOptimizationReady(): boolean {
    return this.isEnabled('CACHE_SYSTEM') &&
           this.isEnabled('METRICS_TRACKING');
  }

  // Método para verificar se o monitoramento está ativo
  static isMonitoringReady(): boolean {
    return this.isEnabled('HEALTH_CHECKS') &&
           this.isEnabled('PERFORMANCE_MONITORING');
  }
}
