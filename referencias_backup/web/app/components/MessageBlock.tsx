'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ContactFormMessage from './ContactFormMessage';

interface MessageBlockProps {
  message: {
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    conversionData?: {
      shouldConvert?: boolean;
      emailExists?: boolean;
      userEmail?: string;
      userName?: string;
      contactData?: any;
    };
  };
  onEdit?: (id: string, newContent: string) => void;
  onRefazer?: (id: string) => void;
  onCopy?: (content: string) => void;
  onContactSubmit?: (data: { name: string; email: string; whatsapp: string }) => void;
}

export default function MessageBlock({ 
  message, 
  onEdit, 
  onRefazer, 
  onCopy,
  onContactSubmit
}: MessageBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showActions, setShowActions] = useState(true); // Começa visível

  // Esconder ícones após 3 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowActions(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [message.id]); // Reset timer quando a mensagem muda

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      onCopy?.(message.content);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const handleEdit = () => {
    if (isEditing) {
      onEdit?.(message.id, editContent);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div 
      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} group mb-16`}
    >
      <div 
        className={`relative px-4 py-3 rounded-lg ${
          message.type === 'user' 
            ? 'bg-teal-600 text-white max-w-xs lg:max-w-md' 
            : 'text-gray-900 dark:text-white w-full leading-relaxed'
        }`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              rows={Math.max(2, editContent.split('\n').length)}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="px-3 py-1 bg-teal-600 text-white text-sm rounded hover:bg-teal-700 transition-colors"
              >
                Salvar
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="whitespace-pre-line">{message.content}</div>
        )}

        {/* Botões interativos para email já cadastrado */}
        {message.conversionData?.emailExists && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.open(`${process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'}/admin`, '_blank')}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Fazer Login
              </button>
              <button
                onClick={() => window.open(`${process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'}/forgot-password`, '_blank')}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Recuperar Senha
              </button>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
              🔒 Seus dados estão seguros e sua conta continua ativa
            </div>
          </div>
        )}

        {/* Formulário de contato integrado na mensagem */}
        {message.conversionData?.shouldConvert && !message.conversionData?.emailExists && onContactSubmit && (
          <div className="mt-4">
            <ContactFormMessage onSubmit={onContactSubmit} />
          </div>
        )}

        {/* Ícones de ação */}
        {showActions && (
          <div className={`absolute -bottom-8 flex gap-1 z-10 ${
            message.type === 'user' ? 'right-0' : 'left-0'
          }`}>
          {message.type === 'user' ? (
            // Ícones para mensagens do usuário (parte inferior direita)
            <button
              onClick={handleEdit}
              className="p-1.5 bg-white dark:bg-gray-800 bg-opacity-90 hover:bg-opacity-100 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-md shadow-sm border border-gray-200 dark:border-gray-600 transition-all duration-200"
              title="Editar mensagem"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          ) : (
            // Ícones para mensagens do assistente (parte inferior esquerda)
            <>
              <button
                onClick={handleCopy}
                className="p-1.5 bg-white dark:bg-gray-800 bg-opacity-90 hover:bg-opacity-100 rounded-md shadow-sm border border-gray-200 dark:border-gray-600 transition-all duration-200"
                title="Copiar mensagem"
              >
                <Image
                  src="/icon-copy.svg"
                  alt="Copiar"
                  width={14}
                  height={14}
                  className="w-3.5 h-3.5 dark:invert dark:brightness-0 dark:contrast-200"
                />
              </button>
              <button
                onClick={() => onRefazer?.(message.id)}
                className="p-1.5 bg-white dark:bg-gray-800 bg-opacity-90 hover:bg-opacity-100 rounded-md shadow-sm border border-gray-200 dark:border-gray-600 transition-all duration-200"
                title="Refazer resposta"
              >
                <Image
                  src="/icon-reload.svg"
                  alt="Refazer"
                  width={14}
                  height={14}
                  className="w-3.5 h-3.5 dark:invert dark:brightness-0 dark:contrast-200"
                />
              </button>
            </>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
