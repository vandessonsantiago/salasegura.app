'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,  // Habilitar refresh automático
      persistSession: true,    // Persistir sessão após login
      detectSessionInUrl: true
    }
  }
);

function RegisterPageContent() {
  console.log('🎯 Componente RegisterPage renderizado');
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  console.log('🎫 Token capturado:', token);
  
  const [conversionData, setConversionData] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    console.log('🚀 Página de registro carregada, token:', token);
    validateToken();
  }, [token]);

  const validateToken = async () => {
    console.log('🔍 Validando token:', token);
    
    if (!token) {
      console.log('❌ Token não fornecido');
      setError('Token de acesso não fornecido');
      setIsValidating(false);
      return;
    }

    try {
      console.log('🌐 Fazendo requisição para:', `${process.env.NEXT_PUBLIC_API_URL}/api/v1/conversions/${token}`);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/conversions/${token}`);
      const data = await response.json();
      
      console.log('📡 Resposta da API:', data);

      if (!response.ok) {
        console.log('❌ Erro na resposta:', data.error);
        setError(data.error || 'Token inválido');
        setIsValidating(false);
        return;
      }

      console.log('✅ Token válido, dados:', data.conversion);
      setConversionData(data.conversion);
      setIsValidating(false);
    } catch (error) {
      console.log('❌ Erro ao validar token:', error);
      setError('Erro ao validar token');
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validações
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setIsLoading(false);
      return;
    }

    if (!conversionData) {
      setError('Dados de conversão não encontrados');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔐 Criando conta via backend...');
      console.log('📧 Email:', conversionData.email);
      console.log('👤 Nome:', conversionData.name);
      console.log('🆔 Conversion ID:', conversionData.id);
      
      // Criar conta via backend (sem confirmação de email)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: conversionData.email,
          password: password,
          user_metadata: {
            name: conversionData.name,
            whatsapp: conversionData.whatsapp,
            conversion_id: conversionData.id
          }
        })
      });

      const data = await response.json();
      console.log('📡 Resposta do backend:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar conta');
      }

      console.log('✅ Conta criada com sucesso!');
      console.log('👤 Usuário criado:', data.user);
      
      // Fazer login no frontend
      console.log('🔐 Fazendo login no frontend...');
      
      // Fazer login usando o mesmo cliente que o useAuth
      const loginSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
          }
        }
      );
      
      const { data: signInData, error: signInError } = await loginSupabase.auth.signInWithPassword({
        email: conversionData.email,
        password: password
      });
      
      if (signInError) {
        console.log('❌ Erro ao fazer login:', signInError);
        setError('Conta criada, mas erro ao fazer login: ' + signInError.message);
        setIsLoading(false);
        return;
      }
      
      console.log('✅ Login realizado com sucesso!');
      console.log('👤 Dados da sessão:', signInData);
      
      // Aguardar um pouco para garantir que a sessão foi persistida
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🔄 Redirecionando para /admin...');
      router.push('/admin');
      
    } catch (error: any) {
      console.log('❌ Erro ao criar conta:', error);
      setError(error.message || 'Erro ao criar conta');
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validando acesso...</p>
        </div>
      </div>
    );
  }

  if (error && !conversionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <div className="text-gray-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Criar Conta</h1>
          <p className="text-gray-600">Complete seu cadastro na Sala Segura</p>
        </div>

        {conversionData && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-800">
              <strong>Nome:</strong> {conversionData.name}<br/>
              <strong>Email:</strong> {conversionData.email}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Senha *
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full bg-gray-200 rounded-full px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Senha *
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full bg-gray-200 rounded-full px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="Confirme sua senha"
            />
          </div>

          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">{error}</p>
                  {error.includes('Verifique seu email') && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => router.push('/admin')}
                        className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Ir para Login
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Ao criar sua conta, você concorda com nossos termos de uso e política de privacidade.
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}
