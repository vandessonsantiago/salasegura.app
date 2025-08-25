'use client';

import { useState, useCallback } from 'react';
import { ChatMessage } from './useChatStorage';

export interface ConversionData {
  shouldConvert?: boolean;
  emailExists?: boolean;
  userEmail?: string;
  userName?: string;
  contactData?: any;
}

export interface ChatResponse {
  response: string;
  conversionData?: ConversionData;
  error?: string;
}

export function useIntelligentChat() {
  const [isThinking, setIsThinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<ChatMessage | null>(null);

  // Simular API de chat inteligente (substituir pela API real posteriormente)
  const simulateChatAPI = useCallback(async (message: string, chatHistory: ChatMessage[]): Promise<ChatResponse> => {
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Lógica simples para detectar intenção de conversão
    const lowerMessage = message.toLowerCase();
    const conversionKeywords = [
      'contato', 'email', 'telefone', 'falar', 'conversar', 
      'reunião', 'demonstração', 'demo', 'orçamento', 'preço',
      'comprar', 'contratar', 'serviço', 'ajuda', 'suporte'
    ];

    const shouldConvert = conversionKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );

    // Respostas baseadas no contexto
    let response = '';
    let conversionData: ConversionData | undefined;

    if (shouldConvert) {
      response = `Entendo que você gostaria de ter mais informações sobre nossos serviços. Para que eu possa te ajudar da melhor forma, preciso de alguns dados básicos. Pode me fornecer seu nome e email?`;
      conversionData = {
        shouldConvert: true,
        emailExists: false
      };
    } else if (lowerMessage.includes('olá') || lowerMessage.includes('oi')) {
      response = `Olá! Seja bem-vindo(a) ao Sala Segura! 👋\n\nSou seu assistente virtual e estou aqui para te ajudar. Posso esclarecer dúvidas sobre nossos serviços, agendar uma demonstração ou te conectar com nossa equipe.\n\nComo posso ajudar você hoje?`;
    } else if (lowerMessage.includes('serviços') || lowerMessage.includes('o que fazem')) {
      response = `O Sala Segura é uma plataforma completa de segurança digital que oferece:\n\n🔒 **Autenticação Segura** - Proteção avançada para suas contas\n🛡️ **Monitoramento 24/7** - Acompanhamento constante da sua segurança\n📱 **Interface Intuitiva** - Fácil de usar em qualquer dispositivo\n🔧 **Suporte Especializado** - Equipe técnica sempre disponível\n\nGostaria de saber mais detalhes sobre algum serviço específico?`;
    } else {
      response = `Interessante pergunta! Para te dar uma resposta mais precisa e personalizada, que tal conversarmos diretamente? Posso te conectar com um especialista da nossa equipe.`;
      conversionData = {
        shouldConvert: true,
        emailExists: false
      };
    }

    return { response, conversionData };
  }, []);

  // Enviar mensagem para chat inteligente
  const sendMessage = useCallback(async (
    message: string, 
    chatHistory: ChatMessage[]
  ): Promise<ChatMessage | null> => {
    setIsThinking(true);
    
    try {
      const apiResponse = await simulateChatAPI(message, chatHistory);
      
      if (apiResponse.error) {
        throw new Error(apiResponse.error);
      }

      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: apiResponse.response,
        timestamp: new Date(),
        conversionData: apiResponse.conversionData
      };

      // Preparar mensagem para animação de digitação
      setPendingMessage(assistantMessage);
      setIsThinking(false);
      setIsTyping(true);

      return assistantMessage;
    } catch (error) {
      setIsThinking(false);
      console.error('Erro ao enviar mensagem:', error);
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Desculpe, ocorreu um erro. Tente novamente em alguns instantes.',
        timestamp: new Date()
      };

      setPendingMessage(errorMessage);
      setIsTyping(true);
      
      return errorMessage;
    }
  }, [simulateChatAPI]);

  // Finalizar animação de digitação
  const completeTyping = useCallback(() => {
    setIsTyping(false);
    const message = pendingMessage;
    setPendingMessage(null);
    return message;
  }, [pendingMessage]);

  // Resetar estados
  const reset = useCallback(() => {
    setIsThinking(false);
    setIsTyping(false);
    setPendingMessage(null);
  }, []);

  return {
    isThinking,
    isTyping,
    pendingMessage,
    sendMessage,
    completeTyping,
    reset
  };
}
