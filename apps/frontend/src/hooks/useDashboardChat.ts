'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { apiEndpoint } from '@/lib/api';

export interface DashboardChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface DashboardChatResponse {
  success: boolean;
  reply: string;
  timestamp: string;
  error?: string;
}

export function useDashboardChat() {
  const [isThinking, setIsThinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<DashboardChatMessage | null>(null);

  // API call para chat sobre divórcio
  const sendMessage = useCallback(async (
    message: string, 
    chatHistory: DashboardChatMessage[]
  ): Promise<DashboardChatMessage | null> => {
    setIsThinking(true);
    
    try {
  const dashboardChatUrl = apiEndpoint('/dashboard-chat');
      
      // Obter token da sessão do Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }
      
      // Preparar histórico no formato esperado pela API
      const formattedHistory = chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

  const response = await fetch(dashboardChatUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message,
          chatHistory: formattedHistory
        })
      });

      if (!response.ok) {
        throw new Error('Falha na comunicação com a API');
      }

      const data: DashboardChatResponse = await response.json();
      
      if (!data.success && data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: DashboardChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date()
      };

      // Preparar mensagem para animação de digitação
      setPendingMessage(assistantMessage);
      setIsThinking(false);
      setIsTyping(true);

      return assistantMessage;
    } catch (error) {
      setIsThinking(false);
      console.error('Erro ao enviar mensagem:', error);
      
      const errorMessage: DashboardChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente em alguns instantes.',
        timestamp: new Date()
      };

      setPendingMessage(errorMessage);
      setIsTyping(true);
      
      return errorMessage;
    }
  }, []);

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
