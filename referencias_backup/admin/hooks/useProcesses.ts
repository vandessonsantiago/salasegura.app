/**
 * @deprecated Este hook foi substituído por useProcessesBackend.ts
 * Use useProcessesBackend para gestão de processos via backend
 * 
 * TODO: Remover após confirmação de que não há dependências
 */

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { api } from '../lib/api';

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Process {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CreateProcessData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

export function useProcesses() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const fetchProcesses = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const data = await api.fetchWithAuth('/api/v1/processes', token);
      setProcesses(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching processes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch processes');
    } finally {
      setLoading(false);
    }
  };

  const createProcess = async (processData: CreateProcessData) => {
    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const newProcess = await api.fetchWithAuth('/api/v1/processes', token, {
        method: 'POST',
        body: JSON.stringify(processData)
      });

      setProcesses(prev => [...prev, newProcess]);
      return newProcess;
    } catch (err) {
      console.error('Error creating process:', err);
      throw err;
    }
  };

  const updateProcess = async (id: string, updates: Partial<Process>) => {
    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const updatedProcess = await api.fetchWithAuth(`/api/v1/processes/${id}`, token, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      setProcesses(prev => prev.map(p => p.id === id ? updatedProcess : p));
      return updatedProcess;
    } catch (err) {
      console.error('Error updating process:', err);
      throw err;
    }
  };

  const deleteProcess = async (id: string) => {
    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      await api.fetchWithAuth(`/api/v1/processes/${id}`, token, {
        method: 'DELETE'
      });

      setProcesses(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting process:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchProcesses();
  }, []);

  return {
    processes,
    loading,
    error,
    createProcess,
    updateProcess,
    deleteProcess,
    refetch: fetchProcesses
  };
}
