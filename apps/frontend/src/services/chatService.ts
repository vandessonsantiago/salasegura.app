interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ConversionData {
  shouldConvert: boolean;
  contactData: {
    email: string;
    whatsapp: string;
  };
  timestamp?: string;
}

interface ChatResponse {
  response: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  conversionData: ConversionData | null;
  conversationId?: string;
  showAccessForm?: boolean;
  componentToShow?: string;
}

// Versão da API: v1
import { apiEndpoint } from '@/lib/api';
const CHAT_ENDPOINT = apiEndpoint('/chat');

export class ChatService {
  static async sendMessage(message: string, chatHistory: ChatMessage[], token?: string, conversationId?: string): Promise<ChatResponse> {
    try {
      console.log('🚀 Enviando mensagem para API:', { message, historyLength: chatHistory.length });
      
  // Backend expõe rota POST /api/v1/chat
  const headers: Record<string,string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(CHAT_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message,
          chatHistory: chatHistory.map(msg => ({
            id: msg.id,
            type: msg.type,
            content: msg.content,
            timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp
          })),
          ...(conversationId && { conversationId })
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatResponse = await response.json();
      console.log('✅ Resposta recebida da API:', { 
        responseLength: data.response.length, 
        hasConversion: !!data.conversionData,
        showAccessForm: data.showAccessForm,
        componentToShow: data.componentToShow
      });
      
      // Mapear os novos campos para conversionData se necessário
      let finalConversionData = data.conversionData;
      if (data.showAccessForm && data.componentToShow === 'ContactForm' && !finalConversionData) {
        finalConversionData = {
          shouldConvert: true,
          contactData: {
            email: '',
            whatsapp: ''
          },
          timestamp: new Date().toISOString()
        };
      }
      
      return {
        ...data,
        conversionData: finalConversionData
      };
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      throw new Error('Falha na comunicação com o servidor');
    }
  }

  static async getStatus(): Promise<any> {
    try {
  const response = await fetch(CHAT_ENDPOINT);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      throw error;
    }
  }
}

export type { ChatMessage, ConversionData, ChatResponse };
