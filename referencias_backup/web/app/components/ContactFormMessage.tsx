'use client';

import { useState } from 'react';

interface ContactFormMessageProps {
  onSubmit: (data: { name: string; email: string; whatsapp: string }) => void;
}

export default function ContactFormMessage({ onSubmit }: ContactFormMessageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
            📋 Formulário de Contato
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300">
            Para continuar com o processo e criar seu acesso personalizado à Sala Segura, preencha os dados abaixo:
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="name" className="block text-xs font-medium text-green-800 dark:text-green-200 mb-1">
            Nome Completo *
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full bg-white dark:bg-gray-800 border border-green-300 dark:border-green-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Digite seu nome completo"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-medium text-green-800 dark:text-green-200 mb-1">
            E-mail *
          </label>
          <input
            type="email"
            id="email"
            required
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full bg-white dark:bg-gray-800 border border-green-300 dark:border-green-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="seu@email.com"
          />
        </div>

        <div>
          <label htmlFor="whatsapp" className="block text-xs font-medium text-green-800 dark:text-green-200 mb-1">
            WhatsApp *
          </label>
          <input
            type="tel"
            id="whatsapp"
            required
            value={formData.whatsapp}
            onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
            className="w-full bg-white dark:bg-gray-800 border border-green-300 dark:border-green-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="(11) 99999-9999"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium text-sm"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Formulário'}
          </button>
        </div>
      </form>
    </div>
  );
}
