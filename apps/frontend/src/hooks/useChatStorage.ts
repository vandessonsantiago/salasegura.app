'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  conversionData?: {
    shouldConvert?: boolean;
    emailExists?: boolean;
    userEmail?: string;
    userName?: string;
    contactData?: any;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  flow: 'free' | 'conversion' | 'support';
  createdAt: Date;
  updatedAt: Date;
}

const STORAGE_KEY = 'sala-segura-chats';
const STORAGE_EVENT = 'sala-segura-storage-updated';

export function useChatStorage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);

  // Carregar sessões do localStorage
  const loadSessions = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const sessionsWithDates = parsed.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setSessions(sessionsWithDates);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
      setSessions([]);
    }
  }, []);

  // Salvar sessões no localStorage
  const saveSessions = useCallback((updatedSessions: ChatSession[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
      // Disparar evento customizado para sincronização
      window.dispatchEvent(new CustomEvent(STORAGE_EVENT));
    } catch (error) {
      console.error('Erro ao salvar sessões:', error);
    }
  }, []);

  // Criar nova sessão
  const createSession = useCallback((firstMessage?: string): string => {
    const sessionId = Date.now().toString();
    const title = firstMessage 
      ? firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '')
      : 'Nova conversa';
    
    const newSession: ChatSession = {
      id: sessionId,
      title,
      messages: [],
      flow: 'free',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    setCurrentSession(newSession);
    saveSessions(updatedSessions);
    
    return sessionId;
  }, [sessions, saveSessions]);

  // Atualizar sessão
  const updateSession = useCallback((sessionId: string, messages: ChatMessage[]) => {
    const updatedSessions = sessions.map(session => {
      if (session.id === sessionId) {
        return {
          ...session,
          messages,
          updatedAt: new Date()
        };
      }
      return session;
    });

    setSessions(updatedSessions);
    
    // Atualizar sessão atual se for a mesma
    const updatedCurrentSession = updatedSessions.find(s => s.id === sessionId);
    if (currentSession?.id === sessionId && updatedCurrentSession) {
      setCurrentSession(updatedCurrentSession);
    }
    
    saveSessions(updatedSessions);
  }, [sessions, currentSession, saveSessions]);

  // Deletar sessão
  const deleteSession = useCallback((sessionId: string) => {
    const updatedSessions = sessions.filter(session => session.id !== sessionId);
    setSessions(updatedSessions);
    
    // Se a sessão atual foi deletada, limpar
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
    }
    
    saveSessions(updatedSessions);
  }, [sessions, currentSession, saveSessions]);

  // Selecionar sessão
  const selectSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    setCurrentSession(session || null);
  }, [sessions]);

  // Buscar sessões por query
  const searchSessions = useCallback((query: string): ChatSession[] => {
    if (!query.trim()) {
      return sessions;
    }
    
    const lowerQuery = query.toLowerCase();
    return sessions.filter(session => 
      session.title.toLowerCase().includes(lowerQuery) ||
      session.messages.some(message => 
        message.content.toLowerCase().includes(lowerQuery)
      )
    );
  }, [sessions]);

  // Limpar todas as sessões
  const clearAllSessions = useCallback(() => {
    setSessions([]);
    setCurrentSession(null);
    saveSessions([]);
  }, [saveSessions]);

  // Carregar sessões na inicialização
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Escutar mudanças de storage
  useEffect(() => {
    const handleStorageUpdate = () => {
      loadSessions();
    };

    window.addEventListener(STORAGE_EVENT, handleStorageUpdate);
    return () => {
      window.removeEventListener(STORAGE_EVENT, handleStorageUpdate);
    };
  }, [loadSessions]);

  return {
    sessions,
    currentSession,
    createSession,
    updateSession,
    deleteSession,
    selectSession,
    loadSessions,
    searchSessions,
    clearAllSessions
  };
}
