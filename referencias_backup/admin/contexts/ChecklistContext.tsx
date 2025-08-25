'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';

export interface ChecklistSession {
  id: string;
  user_id: string;
  title: string;
  progress: number;
  total_items: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  session_id: string;
  item_id: string;
  category: string;
  text: string;
  checked: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChecklistSessionWithItems extends ChecklistSession {
  items: ChecklistItem[];
}

interface ChecklistContextType {
  sessions: ChecklistSession[];
  currentSession: ChecklistSessionWithItems | null;
  loading: boolean;
  error: string | null;
  createSession: () => Promise<ChecklistSessionWithItems | null>;
  loadSession: (sessionId: string) => Promise<ChecklistSessionWithItems | null>;
  updateItem: (sessionId: string, itemId: string, checked: boolean) => Promise<boolean>;
  deleteSession: (sessionId: string) => Promise<boolean>;
  loadSessions: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  clearError: () => void;
}

const ChecklistContext = createContext<ChecklistContextType | undefined>(undefined);

export function ChecklistProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChecklistSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChecklistSessionWithItems | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();



  // Carregar todas as sessões do usuário
  const loadSessions = useCallback(async () => {
    if (!user?.access_token) {
      console.log('❌ Sem token para carregar sessões');
      return;
    }

    console.log('🔍 Carregando sessões do checklist...');
    console.log('🔑 Token usado:', user.access_token.substring(0, 20) + '...');
    setLoading(true);
    setError(null);
    try {
      const response = await api.fetchWithAuth('/api/v1/checklist/sessions', user.access_token, {
        method: 'GET'
      });

      console.log('✅ Sessões carregadas:', response.sessions?.length || 0);
      setSessions(response.sessions || []);
    } catch (error) {
      console.error('❌ Erro ao carregar sessões do checklist:', error);
      setError('Erro ao carregar sessões do checklist');
    } finally {
      setLoading(false);
    }
  }, [user?.access_token]);

  // Carregar sessão específica com itens
  const loadSession = useCallback(async (sessionId: string) => {
    if (!user?.access_token) {
      console.log('❌ Sem token para carregar sessão');
      return null;
    }

    console.log('🔍 Carregando sessão:', sessionId);
    setLoading(true);
    setError(null);
    try {
      const response = await api.fetchWithAuth(`/api/v1/checklist/sessions/${sessionId}`, user.access_token, {
        method: 'GET'
      });

      console.log('✅ Sessão carregada:', response.session?.items?.length || 0, 'itens');
      setCurrentSession(response.session);
      return response.session;
    } catch (error) {
      console.error('❌ Erro ao carregar sessão do checklist:', error);
      setError('Erro ao carregar sessão do checklist');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.access_token]);

  // Criar nova sessão
  const createSession = useCallback(async () => {
    if (!user?.access_token) {
      console.log('❌ Sem token para criar sessão');
      return null;
    }

    console.log('🔧 Criando nova sessão de checklist...');
    setLoading(true);
    setError(null);
    try {
      const response = await api.fetchWithAuth('/api/v1/checklist/sessions', user.access_token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: 'Checklist "Você está pronto(a) para o cartório?"' })
      });

      console.log('✅ Sessão criada:', response.session);
      const newSession = response.session;
      
      // Atualizar lista de sessões
      setSessions(prev => [newSession, ...prev]);
      
      // Carregar a sessão criada com itens
      const sessionWithItems = await loadSession(newSession.id);
      console.log('📋 Sessão carregada com itens:', sessionWithItems?.items?.length || 0, 'itens');
      
      return sessionWithItems;
    } catch (error) {
      console.error('❌ Erro ao criar sessão do checklist:', error);
      setError('Erro ao criar sessão do checklist');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.access_token, loadSession]);

  // Atualizar item do checklist
  const updateItem = useCallback(async (sessionId: string, itemId: string, checked: boolean) => {
    if (!user?.access_token) {
      console.log('❌ Sem token para atualizar item');
      return false;
    }
    
    if (!currentSession) {
      console.log('❌ Sem sessão atual para atualizar item');
      return false;
    }

    try {
      const response = await api.fetchWithAuth(`/api/v1/checklist/sessions/${sessionId}/items/${itemId}`, user.access_token, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ checked })
      });

      // Atualizar estado local
      setCurrentSession(prev => {
        if (!prev) return prev;
        
        const updatedItems = prev.items.map(item => 
          item.item_id === itemId ? { ...item, checked } : item
        );
        
        return {
          ...prev,
          items: updatedItems,
          progress: updatedItems.filter(item => item.checked).length
        };
      });

      // Atualizar lista de sessões
      setSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { 
                ...session, 
                progress: (currentSession?.items || []).filter(item => 
                  item.item_id === itemId ? checked : item.checked
                ).length
              }
            : session
        )
      );

      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar item do checklist:', error);
      return false;
    }
  }, [user?.access_token, currentSession]);

  // Deletar sessão
  const deleteSession = useCallback(async (sessionId: string) => {
    if (!user?.access_token) {
      console.log('❌ Sem token para deletar sessão');
      return false;
    }

    try {
      await api.fetchWithAuth(`/api/v1/checklist/sessions/${sessionId}`, user.access_token, {
        method: 'DELETE'
      });

      setSessions(prev => prev.filter(session => session.id !== sessionId));
      
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao deletar sessão do checklist:', error);
      return false;
    }
  }, [user?.access_token, currentSession]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh sessions
  const refreshSessions = useCallback(async () => {
    await loadSessions();
  }, [loadSessions]);

  // Carregar sessões quando o usuário mudar
  useEffect(() => {
    console.log('👤 Usuário mudou:', user?.id ? 'Autenticado' : 'Não autenticado');
    console.log('🔑 Token disponível:', !!user?.access_token);
    console.log('👤 User ID:', user?.id);
    
    if (user?.access_token) {
      console.log('🔑 Token disponível, carregando sessões...');
      loadSessions();
    } else {
      console.log('❌ Sem token, limpando sessões');
      setSessions([]);
      setCurrentSession(null);
    }
  }, [user?.access_token, loadSessions]);

  const value: ChecklistContextType = {
    sessions,
    currentSession,
    loading,
    error,
    createSession,
    loadSession,
    updateItem,
    deleteSession,
    loadSessions,
    refreshSessions,
    clearError
  };



  return (
    <ChecklistContext.Provider value={value}>
      {children}
    </ChecklistContext.Provider>
  );
}

export function useChecklist() {
  const context = useContext(ChecklistContext);
  if (context === undefined) {
    throw new Error('useChecklist must be used within a ChecklistProvider');
  }
  return context;
}

