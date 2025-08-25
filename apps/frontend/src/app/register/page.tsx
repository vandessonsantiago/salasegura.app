'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface ConversionData {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  status: string;
  createdAt: string;
}

function RegisterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [conversionData, setConversionData] = useState<ConversionData | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setError('Token de acesso não fornecido. Esta página só pode ser acessada via chat.');
      setIsValidating(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/conversions/${token}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Token inválido ou expirado');
        setIsValidating(false);
        return;
      }

      setConversionData(data.conversion);
      setIsValidating(false);
    } catch (error) {
      setError('Erro ao validar token');
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

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
      // Criar usuário via API (usando Service Role Key - sem verificação de email)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const signupResponse = await fetch(`${apiUrl}/conversions/${token}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: password
        }),
      });

      const signupData = await signupResponse.json();

      if (!signupResponse.ok || !signupData.success) {
        const errorMessage = signupData.error?.toLowerCase() || '';
        const isEmailExists = errorMessage.includes('already registered') || 
                             errorMessage.includes('already exists') ||
                             errorMessage.includes('already been registered') ||
                             errorMessage.includes('user with this email address has already been registered') ||
                             errorMessage.includes('email already') ||
                             errorMessage.includes('already been');
        
        if (isEmailExists) {
          setError('email_exists');
        } else {
          setError(signupData.error || 'Erro ao criar conta');
        }
        setIsLoading(false);
        return;
      }

      console.log('✅ Conta criada com sucesso via API!');
      
      // Redirecionar para login para que o usuário faça login normalmente
      router.push('/login?message=account_created');
      
    } catch (error: any) {
      console.log('🔍 Erro capturado:', error);
      
      const errorMessage = error.message?.toLowerCase() || '';
      const isEmailExists = errorMessage.includes('already registered') || 
                           errorMessage.includes('already exists') ||
                           errorMessage.includes('already been registered') ||
                           errorMessage.includes('user with this email address has already been registered') ||
                           errorMessage.includes('email already') ||
                           errorMessage.includes('already been');
      
      if (isEmailExists) {
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
            <div className="text-4xl mb-4">⚠️</div>
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
                        href="/login" 
                        className="text-teal-600 hover:text-teal-700 underline font-medium"
                      >
                        → Fazer login com este email
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
      <RegisterContent />
    </Suspense>
  );
}