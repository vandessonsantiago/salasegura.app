'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

export interface ChatSession {
  id: string;
  title: string;
  flow: string;
  created_at: string;
  updated_at: string;
  chat_messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function useAdminChatStorage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Carregar sessões do banco de dados
  const loadSessions = useCallback(async () => {
    if (!user?.access_token) return;

    setLoading(true);
    try {
      const response = await api.fetchWithAuth('/api/v1/chat-sessions', user.access_token, {
        method: 'GET'
      });

      setSessions(response.sessions || []);
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.access_token]);

  // Carregar sessões na inicialização
  useEffect(() => {
    if (user?.access_token) {
      loadSessions();
    }
  }, [loadSessions, user?.access_token]);

  // Criar nova sessão
  const createSession = useCallback(async (title: string, initialMessage?: string): Promise<string | null> => {
    if (!user?.access_token) return null;

    try {
      const response = await api.fetchWithAuth('/api/v1/chat-sessions', user.access_token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          flow: 'admin',
          initialMessage
        }),
      });

      // Recarregar sessões
      await loadSessions();
      return response.session.id;
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      return null;
    }
  }, [user?.access_token, loadSessions]);

  // Adicionar mensagem à sessão
  const addMessageToSession = useCallback(async (sessionId: string, role: 'user' | 'assistant', content: string) => {
    if (!user?.access_token) return false;

    try {
      const response = await api.fetchWithAuth(`/api/v1/chat-sessions/${sessionId}/messages`, user.access_token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role,
          content
        }),
      });

      // Recarregar sessões para atualizar a lista
      await loadSessions();
      return true;
    } catch (error) {
      console.error('Erro ao adicionar mensagem:', error);
      return false;
    }
  }, [user?.access_token, loadSessions]);

  // Deletar sessão
  const deleteSession = useCallback(async (sessionId: string) => {
    if (!user?.access_token) return false;

    try {
      const response = await api.fetchWithAuth(`/api/v1/chat-sessions/${sessionId}`, user.access_token, {
        method: 'DELETE'
      });

      // Recarregar sessões
      await loadSessions();
      return true;
    } catch (error) {
      console.error('Erro ao deletar sessão:', error);
      return false;
    }
  }, [user?.access_token, loadSessions]);

  // Buscar sessões
  const searchSessions = useCallback((query: string): ChatSession[] => {
    if (!query.trim()) return sessions;
    
    const lowercaseQuery = query.toLowerCase();
    return sessions.filter(session => 
      session.title.toLowerCase().includes(lowercaseQuery) ||
      session.chat_messages.some(msg => 
        msg.content.toLowerCase().includes(lowercaseQuery)
      )
    );
  }, [sessions]);

  // Gerar título da sessão
  const generateSessionTitle = (initialMessage: string): string => {
    const words = initialMessage.split(' ').slice(0, 5);
    return words.join(' ') + (initialMessage.split(' ').length > 5 ? '...' : '');
  };

  // Carregar mensagens de uma sessão específica
  const getSessionMessages = useCallback(async (sessionId: string): Promise<ChatMessage[]> => {
    if (!user?.access_token) return [];

    try {
      const response = await api.fetchWithAuth(`/api/v1/chat-sessions/${sessionId}/messages`, user.access_token, {
        method: 'GET'
      });

      return response.messages || [];
    } catch (error) {
      console.error('Erro ao carregar mensagens da sessão:', error);
      return [];
    }
  }, [user?.access_token]);

  return {
    sessions,
    loading,
    createSession,
    addMessageToSession,
    deleteSession,
    searchSessions,
    generateSessionTitle,
    loadSessions,
    getSessionMessages
  };
}
