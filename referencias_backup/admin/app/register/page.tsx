'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { WarningIcon } from '@phosphor-icons/react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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

    console.log('🚀 Iniciando processo de registro...');
    console.log('📧 Email:', conversionData?.email);

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
      // Criar conta no Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: conversionData.email,
        password: password,
        options: {
          data: {
            name: conversionData.name,
            whatsapp: conversionData.whatsapp,
            conversion_id: conversionData.id
          }
        }
      });

      if (authError) {
        console.log('🔍 Erro do Supabase:', authError.message);
        console.log('🔍 Código do erro:', authError.status);
        console.log('🔍 Erro completo:', JSON.stringify(authError, null, 2));
        
        // Tratar erro específico de email já cadastrado
        const errorMessage = authError.message.toLowerCase();
        const isEmailExists = errorMessage.includes('already registered') || 
                             errorMessage.includes('already exists') ||
                             errorMessage.includes('already been registered') ||
                             errorMessage.includes('user with this email address has already been registered') ||
                             errorMessage.includes('email already') ||
                             errorMessage.includes('already been') ||
                             authError.status === 422; // Código comum para email já existente
        
        if (isEmailExists) {
          console.log('✅ Erro de email já cadastrado detectado');
          setError('email_exists');
        } else {
          console.log('❌ Erro não reconhecido, lançando erro original');
          throw authError;
        }
        setIsLoading(false);
        return;
      }

      // Redirecionar para o dashboard
      router.push('/admin');
      
    } catch (error: any) {
      console.log('🔍 Erro capturado no catch:', error);
      console.log('🔍 Mensagem do erro:', error.message);
      
      // Verificar se é erro de email já cadastrado mesmo no catch
      const errorMessage = error.message?.toLowerCase() || '';
      const isEmailExists = errorMessage.includes('already registered') || 
                           errorMessage.includes('already exists') ||
                           errorMessage.includes('already been registered') ||
                           errorMessage.includes('user with this email address has already been registered') ||
                           errorMessage.includes('email already') ||
                           errorMessage.includes('already been') ||
                           error.status === 422;
      
      if (isEmailExists) {
        console.log('✅ Erro de email já cadastrado detectado no catch');
        setError('email_exists');
      } else {
        setError(error.message || 'Erro ao criar conta');
      }
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
            <WarningIcon size={64} className="text-gray-500 mx-auto mb-4" weight="light" />
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
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              {error === 'email_exists' ? (
                <div>
                  <p className="mb-3">
                    <strong>Email já cadastrado!</strong> Este email já possui uma conta na Sala Segura.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <a 
                        href="/admin" 
                        className="text-teal-600 hover:text-teal-700 underline font-medium"
                      >
                        → Fazer login com este email
                      </a>
                    </p>
                    <p className="text-sm">
                      <a 
                        href="/forgot-password" 
                        className="text-teal-600 hover:text-teal-700 underline font-medium"
                      >
                        → Esqueceu sua senha? Recuperar acesso
                      </a>
                    </p>
                  </div>
                </div>
              ) : (
                error
              )}
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
