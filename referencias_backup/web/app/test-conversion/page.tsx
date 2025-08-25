'use client';

import { useState } from 'react';

interface ContactData {
  name: string;
  email: string;
  whatsapp: string;
}

export default function TestConversionPage() {
  const [formData, setFormData] = useState<ContactData>({
    name: '',
    email: '',
    whatsapp: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const response = await fetch(`${apiUrl}/api/v1/conversions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setResult(data);
      
    } catch (error) {
      setError('Erro de conexão');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">🧪 Teste de Conversão</h1>
          <p className="text-gray-600">Teste a verificação de email já cadastrado</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-gray-200 rounded-full px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="Digite seu nome completo"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              E-mail *
            </label>
            <input
              type="email"
              id="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full bg-gray-200 rounded-full px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp *
            </label>
            <input
              type="tel"
              id="whatsapp"
              required
              value={formData.whatsapp}
              onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
              className="w-full bg-gray-200 rounded-full px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="(11) 99999-9999"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Enviando...' : 'Testar Conversão'}
          </button>
        </form>

        {/* Resultado */}
        {result && (
          <div className="mt-6 p-4 rounded-lg border">
            {result.emailExists ? (
              <div className="bg-yellow-50 border-yellow-200 text-yellow-800">
                <h3 className="font-semibold mb-2">📧 Email Já Cadastrado!</h3>
                <p className="mb-3">{result.message}</p>
                <div className="space-y-2 text-sm">
                  <p><strong>Email:</strong> {result.user.email}</p>
                  <p><strong>Nome:</strong> {result.user.name}</p>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-sm">
                    <a href={`${process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'}/admin`} className="text-teal-600 hover:text-teal-700 underline font-medium">
                      → Fazer login com este email
                    </a>
                  </p>
                  <p className="text-sm">
                    <a href={`${process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'}/forgot-password`} className="text-teal-600 hover:text-teal-700 underline font-medium">
                      → Esqueceu sua senha? Recuperar acesso
                    </a>
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border-green-200 text-green-800">
                <h3 className="font-semibold mb-2">✅ Conversão Criada!</h3>
                <p className="mb-3">{result.message}</p>
                <div className="space-y-2 text-sm">
                  <p><strong>Token:</strong> {result.accessToken}</p>
                  <p><strong>URL:</strong> {result.redirectUrl}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Dados de teste */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">🧪 Dados para Teste:</h3>
          <div className="space-y-2 text-sm">
            <p><strong>Email já cadastrado:</strong> aldilenecarvalhosantiago@gmail.com</p>
            <p><strong>Email novo:</strong> novo@exemplo.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
