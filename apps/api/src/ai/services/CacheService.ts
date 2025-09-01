export class CacheService {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  static async get(key: string): Promise<any | null> {
    const cached = this.cache.get(key);

    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  static async set(key: string, data: any, ttl: number = 3600000): Promise<void> {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  static async getCachedLegalInfo(topic: string, subtopic?: string): Promise<any | null> {
    const key = `legal:${topic}:${subtopic || 'general'}`;
    return this.get(key);
  }

  static async setCachedLegalInfo(topic: string, data: any, subtopic?: string): Promise<void> {
    const key = `legal:${topic}:${subtopic || 'general'}`;
    this.set(key, data, 86400000); // 24 horas
  }

  static async getCachedUserContext(userId: string): Promise<any | null> {
    const key = `user_context:${userId}`;
    return this.get(key);
  }

  static async setCachedUserContext(userId: string, context: any): Promise<void> {
    const key = `user_context:${userId}`;
    this.set(key, context, 1800000); // 30 minutos
  }

  static async getCachedChatResponse(message: string, userContext: any): Promise<string | null> {
    const contextKey = userContext ? 'authenticated' : 'anonymous';
    const key = `chat:${contextKey}:${message.toLowerCase().trim().substring(0, 100)}`;
    return this.get(key);
  }

  static async setCachedChatResponse(message: string, userContext: any, response: string): Promise<void> {
    // Só cachear respostas para usuários não autenticados ou sem contexto específico
    if (userContext && (userContext.activeAppointments?.length > 0 || userContext.divorceCases?.length > 0)) {
      return; // Não cachear respostas personalizadas
    }

    const contextKey = userContext ? 'authenticated' : 'anonymous';
    const key = `chat:${contextKey}:${message.toLowerCase().trim().substring(0, 100)}`;
    this.set(key, response, 1800000); // 30 minutos
  }

  static clear(): void {
    this.cache.clear();
  }

  static clearExpired(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }
  }

  static getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}
