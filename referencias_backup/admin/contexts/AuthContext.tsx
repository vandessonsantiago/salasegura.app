'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  createdAt?: string;
  access_token?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isSignedIn: boolean;
  signIn: (email: string, password: string) => Promise<{ success?: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar sessão atual
  const checkSession = async () => {
    try {
      setLoading(true);
      
      const tokenData = localStorage.getItem('supabase.auth.token');
      if (!tokenData) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Tentar fazer parse do token se for JSON
      let token: string;
      try {
        const parsed = JSON.parse(tokenData);
        token = parsed.access_token || tokenData;
      } catch {
        token = tokenData;
      }

      // Verificar se o token é válido antes de fazer a requisição
      if (!token || token === 'null' || token === 'undefined') {
        setUser(null);
        localStorage.removeItem('supabase.auth.token');
        setLoading(false);
        return;
      }

      const response = await api.fetchWithAuth('/api/v1/auth/session', token);
      
      if (response.success && response.user) {
        const userData: User = {
          id: response.user.id,
          email: response.user.email,
          firstName: response.user.user_metadata?.first_name,
          lastName: response.user.user_metadata?.last_name,
          role: response.user.role,
          createdAt: response.user.created_at,
          access_token: token
        };
        
        setUser(userData);
        setError(null);
      } else {
        throw new Error('Sessão inválida');
      }
    } catch (err) {
      console.log('🔍 Sessão expirada ou inválida, removendo token');
      setUser(null);
      localStorage.removeItem('supabase.auth.token');
      // Não definir erro para sessões expiradas, apenas logar
      if (err instanceof Error && err.message.includes('401')) {
        console.log('✅ Token expirado removido, usuário não autenticado');
      } else {
        setError(err instanceof Error ? err.message : 'Erro ao verificar sessão');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔐 Tentando fazer login com:', email);
      
      const data = await api.fetch('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      console.log('📡 Resposta da API:', data);

      if (data.success && data.session) {
        localStorage.setItem('supabase.auth.token', JSON.stringify(data.session));
        console.log('💾 Token salvo no localStorage');
        
        const userData: User = {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.user_metadata?.first_name,
          lastName: data.user.user_metadata?.last_name,
          role: data.user.role,
          createdAt: data.user.created_at,
          access_token: data.session.access_token
        };
        
        console.log('👤 Definindo usuário:', userData);
        setUser(userData);
        
        console.log('✅ Login realizado com sucesso');
        return { success: true };
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      console.error('❌ Erro no login:', errorMessage);
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const tokenData = localStorage.getItem('supabase.auth.token');
      if (tokenData) {
        let token: string;
        try {
          const parsed = JSON.parse(tokenData);
          token = parsed.access_token || tokenData;
        } catch {
          token = tokenData;
        }
        
        await api.fetchWithAuth('/api/v1/auth/logout', token, {
          method: 'POST'
        });
      }
    } catch (err) {
      console.error('Error during sign out:', err);
    } finally {
      localStorage.removeItem('supabase.auth.token');
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    isSignedIn: !!user,
    signIn,
    signOut,
    refetch: checkSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}