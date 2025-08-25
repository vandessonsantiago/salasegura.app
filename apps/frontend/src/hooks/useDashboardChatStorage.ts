'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardChatMessage } from './useDashboardChat';

export interface DashboardChatSession {
  id: string;
  title: string;
  messages: DashboardChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const DASHBOARD_STORAGE_KEY = 'salasegura_dashboard_chat_sessions';

export function useDashboardChatStorage() {
  const [sessions, setSessions] = useState<DashboardChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<DashboardChatSession | null>(null);

  // Carregar sessões do localStorage
  useEffect(() => {
    const stored = localStorage.getItem(DASHBOARD_STORAGE_KEY);
    if (stored) {
      try {
        const parsedSessions = JSON.parse(stored).map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setSessions(parsedSessions);
      } catch (error) {
        console.error('Erro ao carregar sessões:', error);
      }
    }
  }, []);

  // Salvar sessões no localStorage
  const saveSessions = useCallback((updatedSessions: DashboardChatSession[]) => {
    localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(updatedSessions));
    setSessions(updatedSessions);
  }, []);

  // Criar nova sessão
  const createSession = useCallback((initialMessage?: string): string => {
    const newSession: DashboardChatSession = {
      id: Date.now().toString(),
      title: initialMessage ? 
        (initialMessage.length > 30 ? initialMessage.substring(0, 30) + '...' : initialMessage) :
        'Nova Consulta',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedSessions = [newSession, ...sessions];
    saveSessions(updatedSessions);
    setCurrentSession(newSession);
    
    return newSession.id;
  }, [sessions, saveSessions]);

  // Atualizar sessão
  const updateSession = useCallback((sessionId: string, messages: DashboardChatMessage[]) => {
    const updatedSessions = sessions.map(session => 
      session.id === sessionId 
        ? { ...session, messages, updatedAt: new Date() }
        : session
    );
    
    saveSessions(updatedSessions);
    
    // Atualizar sessão atual se for a mesma
    if (currentSession?.id === sessionId) {
      setCurrentSession(prev => prev ? { ...prev, messages, updatedAt: new Date() } : null);
    }
  }, [sessions, currentSession, saveSessions]);

  // Selecionar sessão
  const selectSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
    }
  }, [sessions]);

  // Deletar sessão
  const deleteSession = useCallback((sessionId: string) => {
    const updatedSessions = sessions.filter(session => session.id !== sessionId);
    saveSessions(updatedSessions);
    
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
    }
  }, [sessions, currentSession, saveSessions]);

  // Limpar todas as sessões
  const clearAllSessions = useCallback(() => {
    localStorage.removeItem(DASHBOARD_STORAGE_KEY);
    setSessions([]);
    setCurrentSession(null);
  }, []);

  return {
    sessions,
    currentSession,
    createSession,
    updateSession,
    selectSession,
    deleteSession,
    clearAllSessions,
    setCurrentSession
  };
}
