'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { CHECKLIST_BASE } from '@/lib/api';

// Tipos alinhados ao backend
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
  title: string;
  completed: boolean;
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

// Ajuste de porta: backend padrão roda em 8001 (ver appConfig.port)

async function authFetch(path: string, token: string, init?: RequestInit) {
  const base = CHECKLIST_BASE; // http://.../api/v1/checklist
  const url = path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
  console.log('🌐 authFetch:', { url, method: init?.method || 'GET', hasToken: !!token });
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(init?.headers || {})
    }
  });
  console.log('📡 Resposta recebida:', { status: res.status, ok: res.ok });
  if (!res.ok) {
    const text = await res.text();
    console.error('❌ Erro na resposta:', { status: res.status, text });
    throw new Error(text || res.statusText);
  }
  const json = await res.json();
  console.log('✅ Dados recebidos:', json);
  return json;
}

export function ChecklistProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChecklistSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChecklistSessionWithItems | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Obter sessão de auth do supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token || null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const loadSessions = useCallback(async () => {
    console.log('🔍 ChecklistContext.loadSessions chamado, token:', !!token);
    if (!token) {
      console.log('❌ Nenhum token disponível');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      console.log('📡 Fazendo requisição para /sessions...');
      const data = await authFetch('/sessions', token);
      console.log('✅ Resposta recebida:', data);
      setSessions(data.sessions || []);
      console.log('📋 Sessões atualizadas:', (data.sessions || []).length);
    } catch (e: any) {
      console.error('❌ Erro ao carregar sessões:', e);
      setError('Erro ao carregar sessões');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadSession = useCallback(async (sessionId: string) => {
    console.log('🔍 ChecklistContext.loadSession chamado:', { sessionId, token: !!token });
    if (!token) {
      console.log('❌ Nenhum token disponível');
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      console.log('📡 Fazendo requisição para /sessions/' + sessionId + '...');
      const data = await authFetch(`/sessions/${sessionId}`, token);
      console.log('✅ Sessão carregada:', data.session?.id, 'itens:', data.session?.items?.length);
      setCurrentSession(data.session);
      return data.session;
    } catch (e: any) {
      console.error('❌ Erro ao carregar sessão:', e);
      // Se a sessão não for encontrada, não definir erro para permitir fallback
      if (e.message?.includes('not found') || e.message?.includes('404')) {
        console.log('⚠️ Sessão não encontrada (404), retornando null');
        return null;
      }
      setError('Erro ao carregar sessão');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createSession = useCallback(async () => {
    console.log('🔍 ChecklistContext.createSession chamado, token:', !!token);
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      console.log('📡 Fazendo requisição POST para /sessions...');
      const data = await authFetch('/sessions', token, { method: 'POST', body: JSON.stringify({}) });
      console.log('✅ Sessão criada:', data.session);
      const session = data.session as ChecklistSessionWithItems;
      // Atualiza lista e sessão atual
      setSessions(prev => [session, ...prev]);
      setCurrentSession(session);
      return session;
    } catch (e: any) {
      console.error('❌ Erro ao criar sessão:', e);
      setError('Erro ao criar sessão');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updateItem = useCallback(async (sessionId: string, itemId: string, checked: boolean) => {
    if (!token) return false;

    try {
      const data = await authFetch(`/sessions/${sessionId}/items/${itemId}`, token, {
        method: 'PUT',
        body: JSON.stringify({ completed: checked })
      });

      const updated = data.session as ChecklistSessionWithItems;

      // Atualizar apenas a sessão atual se for a mesma que está sendo editada
      if (currentSession?.id === sessionId) {
        setCurrentSession(updated);
      }

      // Atualizar a lista de sessões apenas com as informações básicas
      setSessions(prev => prev.map(s =>
        s.id === updated.id
          ? { ...s, progress: updated.progress, total_items: updated.total_items, updated_at: updated.updated_at }
          : s
      ));

      return true;
    } catch (e) {
      console.error('Erro ao atualizar item:', e);
      return false;
    }
  }, [token, currentSession]);

  const deleteSession = useCallback(async (sessionId: string) => {
    if (!token) return false;
    try {
      await authFetch(`/sessions/${sessionId}`, token, { method: 'DELETE' });
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSession?.id === sessionId) setCurrentSession(null);
      return true;
    } catch (e) {
      return false;
    }
  }, [token, currentSession]);

  const clearError = useCallback(() => setError(null), []);
  const refreshSessions = useCallback(loadSessions, [loadSessions]);

  useEffect(() => {
    if (token) {
      loadSessions();
    } else {
      setSessions([]);
      setCurrentSession(null);
    }
  }, [token, loadSessions]);

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

  return <ChecklistContext.Provider value={value}>{children}</ChecklistContext.Provider>;
}

export function useChecklist() {
  const ctx = useContext(ChecklistContext);
  if (!ctx) throw new Error('useChecklist must be used within a ChecklistProvider');
  return ctx;
}
