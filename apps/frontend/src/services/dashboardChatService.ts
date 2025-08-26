interface DashboardChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface DashboardChatResponse {
  response: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Versão da API: v1
// Dashboard chat usa mesma API base; ajustar para 3001 a não ser que exista segundo servidor.
import { apiEndpoint } from '@/lib/api';

const DASHBOARD_CHAT_ENDPOINT = apiEndpoint('/dashboard-chat');

export class DashboardChatService {
  static async sendMessage(message: string, chatHistory: DashboardChatMessage[]): Promise<DashboardChatResponse> {
    try {
      // Obter token de autenticação do Supabase
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Usuário não autenticado');
      }

      // Formatar histórico para o formato esperado pela API
      const formattedHistory = chatHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      console.log('📤 Enviando mensagem para dashboard chat:', {
        message,
        historyLength: formattedHistory.length
      });

  // Backend expõe rota POST /api/v1/dashboard-chat
  const response = await fetch(DASHBOARD_CHAT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          message,
          history: formattedHistory
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('❌ Erro na resposta da API:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData?.error || `Erro na API: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Resposta recebida do dashboard chat:', data);

      return {
        response: data.response,
        usage: data.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        }
      };
    } catch (error) {
      console.error('❌ Erro no DashboardChatService:', error);
      throw error;
    }
  }
}

export type { DashboardChatMessage, DashboardChatResponse };
