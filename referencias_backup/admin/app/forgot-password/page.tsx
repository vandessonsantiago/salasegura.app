'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon } from '@phosphor-icons/react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Erro ao enviar email de recuperação');
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <CheckCircleIcon size={64} className="text-green-500 mx-auto mb-4" weight="fill" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Email Enviado!</h1>
            <p className="text-gray-600 mb-6">
              Enviamos um link de recuperação para <strong>{email}</strong>. 
              Verifique sua caixa de entrada e siga as instruções.
            </p>
            <Link
              href="/admin"
              className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700"
            >
              Voltar ao Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Recuperar Senha</h1>
          <p className="text-gray-600">Digite seu email para receber um link de recuperação</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-gray-200 rounded-full px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="Digite seu email"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Enviando...' : 'Enviar Link de Recuperação'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/admin"
            className="text-teal-600 hover:text-teal-700 text-sm"
          >
            ← Voltar ao Login
          </Link>
        </div>
      </div>
    </div>
  );
}
