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

// Ajuste de porta: backend padrão roda em 3001 (ver appConfig.port)

async function authFetch(path: string, token: string, init?: RequestInit) {
  const base = CHECKLIST_BASE; // http://.../api/v1/checklist
  const url = path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(init?.headers || {})
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
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
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await authFetch('/sessions', token);
      setSessions(data.sessions || []);
    } catch (e: any) {
      setError('Erro ao carregar sessões');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadSession = useCallback(async (sessionId: string) => {
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      const data = await authFetch(`/sessions/${sessionId}`, token);
      setCurrentSession(data.session);
      return data.session;
    } catch (e: any) {
      setError('Erro ao carregar sessão');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createSession = useCallback(async () => {
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      const data = await authFetch('/sessions', token, { method: 'POST', body: JSON.stringify({}) });
      const session = data.session as ChecklistSessionWithItems;
      // Atualiza lista e sessão atual
      setSessions(prev => [session, ...prev]);
      setCurrentSession(session);
      return session;
    } catch (e: any) {
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
        body: JSON.stringify({ checked })
      });
      const updated = data.session as ChecklistSessionWithItems;
      setCurrentSession(updated);
      setSessions(prev => prev.map(s => s.id === updated.id ? { ...s, progress: updated.progress, total_items: updated.total_items } : s));
      return true;
    } catch (e) {
      return false;
    }
  }, [token]);

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
