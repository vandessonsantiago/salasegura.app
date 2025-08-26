'use client';

import { useState, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
}

export function useDashboardChat() {
  const { user } = useAuth();
  const [state, setState] = useState<ChatState>({
    messages: [],
    loading: false,
    error: null
  });

  const sendMessage = useCallback(async (content: string, currentChatHistory: ChatMessage[]): Promise<ChatMessage | null> => {
    if (!content.trim()) return null;

    // Verificar se o usuário está autenticado
    if (!user?.access_token) {
      console.log('❌ Usuário não autenticado ou sem token');
      console.log('👤 User object:', user);
      setState(prev => ({
        ...prev,
        error: 'Usuário não autenticado. Faça login novamente.'
      }));
      return null;
    }

    console.log('✅ Token encontrado:', user.access_token.substring(0, 20) + '...');

    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    try {
      console.log('📡 Enviando mensagem para API...');
      const response = await api.fetchWithAuth('/api/v1/dashboard-chat', user.access_token, {
        method: 'POST',
        body: JSON.stringify({ 
          message: content,
          chatHistory: currentChatHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      });

      console.log('📡 Resposta da API:', response);

      if (response.success && response.reply) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: response.reply,
          role: 'assistant',
          timestamp: new Date()
        };

        setState(prev => ({
          ...prev,
          loading: false
        }));

        // Retornar a mensagem para que o componente possa controlar quando adicionar
        return assistantMessage;
      } else {
        throw new Error(response.error || 'Erro ao processar mensagem');
      }
    } catch (error) {
      console.error('❌ Erro no chat:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      return null;
    }
  }, [user?.access_token]);

  const addUserMessage = useCallback((message: ChatMessage) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message]
    }));
  }, []);

  const addAssistantMessage = useCallback((message: ChatMessage) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message]
    }));
  }, []);

  const clearChat = useCallback(() => {
    setState({
      messages: [],
      loading: false,
      error: null
    });
  }, []);

  const editMessage = useCallback((messageId: string, newContent: string) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(msg => 
        msg.id === messageId ? { ...msg, content: newContent } : msg
      )
    }));
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.filter(msg => msg.id !== messageId)
    }));
  }, []);

  return {
    messages: state.messages,
    loading: state.loading,
    error: state.error,
    sendMessage,
    addUserMessage,
    addAssistantMessage,
    clearChat,
    editMessage,
    deleteMessage
  };
}
