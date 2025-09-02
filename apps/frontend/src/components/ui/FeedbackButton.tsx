'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FeedbackService, FeedbackData } from '@/services/feedbackService';
import { useToast } from './ToastProvider';

export default function FeedbackButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'problem' | 'suggestion' | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, session } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setFeedbackType(null);
        setMessage('');
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isModalOpen]);

  const handleSubmit = async () => {
    if (!message.trim() || !feedbackType || !session?.access_token) return;

    setIsSubmitting(true);

    try {
      const feedbackData: FeedbackData = {
        type: feedbackType,
        message: message.trim(),
      };

      await FeedbackService.submitFeedback(feedbackData, session.access_token);

      showSuccessToast('Feedback enviado!', 'Obrigado pela sua contribuição.');

      // Resetar estado
      setIsModalOpen(false);
      setFeedbackType(null);
      setMessage('');
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      showErrorToast('Erro ao enviar feedback', 'Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setFeedbackType(null);
    setMessage('');
  };

  // Só mostrar o botão se o usuário estiver autenticado
  if (!user || !session) {
    return null;
  }

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-4 right-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 z-50 group flex items-center space-x-2"
        title="Feedback"
      >
        <svg
          className="w-5 h-5 group-hover:scale-110 transition-transform duration-200 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <span className="text-sm font-medium whitespace-nowrap">Feedback</span>
      </button>

      {/* Overlay */}
      {isModalOpen && (
        <div
          className="fixed inset-0 backdrop-blur-sm z-40"
          style={{ backgroundColor: 'rgba(17, 24, 39, 0.3)' }}
          onClick={handleClose}
        />
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed bottom-4 right-4 bg-white p-6 rounded-lg shadow-2xl z-50 max-w-sm border border-gray-200 animate-in slide-in-from-bottom-2 duration-300">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {!feedbackType ? (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Como podemos ajudar?</h3>
              <button
                onClick={() => setFeedbackType('problem')}
                className="w-full mb-3 p-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors border border-red-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span>Resolver um problema</span>
              </button>
              <button
                onClick={() => setFeedbackType('suggestion')}
                className="w-full p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors border border-green-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>Sugerir uma solução</span>
              </button>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                {feedbackType === 'problem' ? 'Descreva o problema' : 'Sua sugestão'}
              </h3>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                rows={4}
                placeholder="Digite aqui..."
              />
              <div className="flex justify-between space-x-3">
                <button
                  onClick={() => setFeedbackType(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!message.trim() || isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {isSubmitting && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span>{isSubmitting ? 'Enviando...' : 'Enviar'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
