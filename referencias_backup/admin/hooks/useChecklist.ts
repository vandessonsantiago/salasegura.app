'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
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

export function useChecklist() {
  const [sessions, setSessions] = useState<ChecklistSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChecklistSessionWithItems | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Carregar sessões do usuário
  const loadSessions = useCallback(async () => {
    if (!user?.access_token) return;

    setLoading(true);
    try {
      const response = await api.fetchWithAuth('/api/v1/checklist/sessions', user.access_token, {
        method: 'GET'
      });

      setSessions(response.sessions || []);
    } catch (error) {
      console.error('Erro ao carregar sessões do checklist:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.access_token]);

  // Criar nova sessão
  const createSession = useCallback(async (title?: string) => {
    if (!user?.access_token) return null;

    setLoading(true);
    try {
      const response = await api.fetchWithAuth('/api/v1/checklist/sessions', user.access_token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
      });

      const newSession = response.session;
      setSessions(prev => [newSession, ...prev]);
      
      // Carregar a sessão completa com itens
      await loadSession(newSession.id);
      
      return newSession;
    } catch (error) {
      console.error('Erro ao criar sessão do checklist:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.access_token, loadSessions]);

  // Carregar sessão específica com itens
  const loadSession = useCallback(async (sessionId: string) => {
    if (!user?.access_token) return null;

    setLoading(true);
    try {
      const response = await api.fetchWithAuth(`/api/v1/checklist/sessions/${sessionId}`, user.access_token, {
        method: 'GET'
      });

      setCurrentSession(response.session);
      return response.session;
    } catch (error) {
      console.error('Erro ao carregar sessão do checklist:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.access_token]);

  // Atualizar item do checklist
  const updateItem = useCallback(async (sessionId: string, itemId: string, checked: boolean) => {
    if (!user?.access_token || !currentSession) return false;

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
      console.error('Erro ao atualizar item do checklist:', error);
      return false;
    }
  }, [user?.access_token, currentSession]);

  // Deletar sessão
  const deleteSession = useCallback(async (sessionId: string) => {
    if (!user?.access_token) return false;

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
      console.error('Erro ao deletar sessão do checklist:', error);
      return false;
    }
  }, [user?.access_token, currentSession]);

  // Carregar sessões quando o usuário mudar
  useEffect(() => {
    if (user?.access_token) {
      loadSessions();
    }
  }, [user?.access_token, loadSessions]);

  return {
    sessions,
    currentSession,
    loading,
    createSession,
    loadSession,
    updateItem,
    deleteSession,
    loadSessions
  };
}
