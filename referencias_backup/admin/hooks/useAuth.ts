/**
 * @deprecated Este hook foi substituído por useAuthBackend.ts
 * Use useAuthBackend para autenticação via backend
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

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  createdAt: string;
  access_token?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    // Verificar sessão atual
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
          setError(error.message);
          setLoading(false);
          return;
        }

        if (session?.user && session.access_token) {
          await fetchUserProfile(session.access_token);
        } else {
          setUser(null);
          setLoading(false);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error in getSession:', err);
        setLoading(false);
      }
    };

    getSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user && session.access_token) {
          await fetchUserProfile(session.access_token);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (token: string) => {
    try {
      setLoading(true);
      const userData = await api.fetchWithAuth('/api/v1/user/profile', token);
      setUser({ ...userData, access_token: token });
      setError(null);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      // Não definir erro para 429, apenas logar
      if (err instanceof Error && err.message.includes('429')) {
        console.log('Rate limit atingido, tentando novamente em breve...');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch user profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return { error: error.message };
      }

      if (data.user) {
        await fetchUserProfile(data.session.access_token);
        return { success: true };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (error) {
        setError(error.message);
        return { error: error.message };
      }

      if (data.user && data.session?.access_token) {
        await fetchUserProfile(data.session.access_token);
        return { success: true };
      } else if (data.user) {
        // Usuário criado mas precisa confirmar email
        setUser(null);
        setLoading(false);
        return { success: true, message: 'Verifique seu email para confirmar a conta' };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
      }
    } catch (err) {
      console.error('Error during sign out:', err);
    }
  };

  const isSignedIn = !!user;

  return {
    user,
    loading,
    error,
    isSignedIn,
    signIn,
    signUp,
    signOut,
    refetch: () => supabase.auth.getSession().then(({ data }) => 
      data.session ? fetchUserProfile(data.session.access_token) : null
    )
  };
}
