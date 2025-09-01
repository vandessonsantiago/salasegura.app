import OpenAI from 'openai';
import { UserContext } from '../types/ai.types';
import { CacheService } from './CacheService';
import { MetricsService } from './MetricsService';

export class ChatAIService {
  private static openai: OpenAI | null = null;

  static initialize() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey.length > 20 && apiKey.startsWith('sk-')) {
      this.openai = new OpenAI({ apiKey });
      console.log('✅ [AI] OpenAI inicializado com sucesso');
    } else {
      console.warn('⚠️ [AI] Chave da API OpenAI não configurada');
    }
  }

  static async generateResponse(
    message: string,
    userContext: UserContext | null = null
  ): Promise<string> {
    const startTime = Date.now();
    let cached = false;

    try {
      // Verificar cache para mensagens similares
      const cacheKey = this.generateCacheKey(message, userContext);
      const cachedResponse = await CacheService.get(cacheKey);

      if (cachedResponse) {
        console.log('✅ [AI] Resposta obtida do cache');
        cached = true;

        await MetricsService.trackInteraction({
          userId: userContext?.userProfile?.id,
          message,
          response: cachedResponse,
          processingTime: Date.now() - startTime,
          hasUserContext: !!userContext,
          cached: true
        });

        return cachedResponse;
      }

      // Gerar resposta com IA
      const response = await this.generateAIResponse(message, userContext);

      // Salvar no cache (exceto para usuários com contexto personalizado)
      if (!userContext || userContext.activeAppointments.length === 0) {
        await CacheService.set(cacheKey, response, 1800000); // 30 minutos
      }

      // Rastrear métricas
      await MetricsService.trackInteraction({
        userId: userContext?.userProfile?.id,
        message,
        response,
        processingTime: Date.now() - startTime,
        hasUserContext: !!userContext,
        cached: false
      });

      return response;

    } catch (error) {
      console.error('❌ [AI] Erro na geração de resposta:', error);

      // Rastrear erro
      await MetricsService.trackError(error, {
        userId: userContext?.userProfile?.id,
        message,
        hasUserContext: !!userContext
      });

      return this.getFallbackResponse(message, userContext);
    }
  }

  private static buildContextualPrompt(message: string, userContext: UserContext | null): string {
    const basePrompt = `Você é Vandesson Santiago, advogado especialista em Direito de Família brasileiro.`;

    if (userContext) {
      console.log('🤖 [AI] Construindo prompt contextual:', {
        hasUserContext: !!userContext,
        userProfile: userContext.userProfile,
        userName: userContext.userProfile?.name,
        appointmentsCount: userContext.activeAppointments?.length || 0,
        casesCount: userContext.divorceCases?.length || 0
      });

      return `${basePrompt}

CONTEXTO DO USUÁRIO:
- Nome: ${userContext.userProfile?.name || 'Não informado'}
- Agendamentos ativos: ${userContext.activeAppointments?.length || 0}
- Casos de divórcio: ${userContext.divorceCases?.length || 0}

INSTRUÇÕES IMPORTANTES:
- SEMPRE use o nome do usuário na saudação (exemplo: "Olá, Vandesson!")
- Se o usuário perguntar sobre seu processo de divórcio E você souber que ele tem casos ativos, mencione isso especificamente
- Se o usuário tiver agendamentos ativos, mencione isso de forma útil e específica
- Seja pessoal, amigável e profissional
- Use as informações do contexto para dar respostas mais personalizadas

REFERÊNCIAS LEGAIS:
- SEMPRE inclua referências legais específicas e relevantes ao final das respostas
- Cite leis, códigos e legislação aplicável de forma clara e acessível
- Use formato: "💡 Base Legal: [Lei específica] - [breve explicação do que trata]"
- Exemplos:
  * Para divórcio: "💡 Base Legal: Lei 11.441/2007 - Regula o divórcio consensual extrajudicial"
  * Para guarda: "💡 Base Legal: Estatuto da Criança e do Adolescente (Lei 8.069/1990) - Protege direitos das crianças"
  * Para pensão: "💡 Base Legal: Código Civil (Arts. 1.694-1.710) - Regula obrigação alimentar"
- Mantenha as referências concisas mas informativas
- Só cite legislação diretamente relevante ao assunto discutido

Pergunta: ${message}`;
    }

    return `${basePrompt}\n\nPergunta: ${message}`;
  }

  private static getFallbackResponse(message: string, userContext: UserContext | null): string {
    const userName = userContext?.userProfile?.name || 'cliente';
    const appointmentsCount = userContext?.activeAppointments?.length || 0;
    const casesCount = userContext?.divorceCases?.length || 0;

    if (userContext && (appointmentsCount > 0 || casesCount > 0)) {
      let response = `Olá, ${userName}! `;

      if (casesCount > 0 && message.toLowerCase().includes('divórcio')) {
        response += `Vejo que você tem ${casesCount} caso(s) de divórcio em andamento. `;
      }

      if (appointmentsCount > 0) {
        response += `Você também tem ${appointmentsCount} agendamento(s) ativo(s). `;
      }

      response += 'Como posso ajudar com sua questão jurídica hoje?';
      return response;
    }

    return 'Olá! Sou o advogado Vandesson Santiago, especialista em direito de família. Como posso ajudar com sua questão jurídica hoje?';
  }

  static isAvailable(): boolean {
    return !!this.openai;
  }

  private static generateCacheKey(message: string, userContext: UserContext | null): string {
    // Gerar chave baseada no conteúdo da mensagem e contexto geral
    const baseKey = message.toLowerCase().trim().substring(0, 100);
    const contextKey = userContext ? 'authenticated' : 'anonymous';
    return `chat:${contextKey}:${baseKey}`;
  }

  private static async generateAIResponse(message: string, userContext: UserContext | null): Promise<string> {
    if (!this.openai) {
      console.warn('⚠️ [AI] OpenAI não disponível, usando resposta de fallback');
      return this.getFallbackResponse(message, userContext);
    }

    const prompt = this.buildContextualPrompt(message, userContext);

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      max_tokens: 400,
      temperature: 0.6,
    });

    const response = completion.choices[0]?.message?.content ||
      'Desculpe, não consegui processar sua mensagem.';

    console.log('✅ [AI] Resposta gerada com sucesso');
    return response;
  }
}
