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
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export class ChatService {
  static async sendMessage(message: string, chatHistory: ChatMessage[]): Promise<ChatResponse> {
    try {
      console.log('🚀 Enviando mensagem para API:', { message, historyLength: chatHistory.length });
      
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          chatHistory: chatHistory.map(msg => ({
            id: msg.id,
            type: msg.type,
            content: msg.content,
            timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp
          }))
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatResponse = await response.json();
      console.log('✅ Resposta recebida da API:', { 
        responseLength: data.response.length, 
        hasConversion: !!data.conversionData 
      });
      
      return data;
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      throw new Error('Falha na comunicação com o servidor');
    }
  }

  static async getStatus(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`);
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
