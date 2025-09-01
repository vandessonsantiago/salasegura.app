'use client';

import { useState, useEffect } from 'react';
import { ChatMessage } from '@/hooks/useChatStorage';
import ReactMarkdown from 'react-markdown';
import ContactFormMessage from '../forms/ContactFormMessage';

interface MessageBlockProps {
  message: ChatMessage;
  onEdit?: (id: string, newContent: string) => void;
  onRefresh?: (id: string) => void;
  onCopy?: (content: string) => void;
  onContactSubmit?: (data: { name: string; email: string; whatsapp: string }) => void;
}

export default function MessageBlock({ 
  message, 
  onEdit, 
  onRefresh, 
  onCopy,
  onContactSubmit
}: MessageBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showActions, setShowActions] = useState(false); // Começar escondido

  // Esconder ícones após 5 segundos (aumentei o tempo)
  useEffect(() => {
    if (showActions) {
      const timer = setTimeout(() => {
        setShowActions(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showActions]); // Dependência em showActions em vez de message.id

  // Esconder ícones após 5 segundos (aumentei o tempo)
  useEffect(() => {
    if (showActions) {
      const timer = setTimeout(() => {
        setShowActions(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showActions]); // Dependência em showActions em vez de message.id

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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div 
      className={`flex w-full mb-4 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div 
        className={`relative max-w-[80%] px-4 py-3 rounded-lg shadow-sm ${
          message.type === 'user' 
            ? 'bg-teal-600 text-white rounded-br-sm' 
            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
        }`}
        onMouseEnter={() => {
          setShowActions(true);
        }}
        onMouseLeave={(e) => {
          // Verificar se o mouse não está nos botões de ação
          const rect = e.currentTarget.getBoundingClientRect();
          const mouseY = e.clientY;
          const isNearActions = mouseY > rect.bottom - 10 && mouseY < rect.bottom + 40;
          
          if (!isNearActions) {
            setShowActions(false);
          }
        }}
      >
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full bg-white text-gray-900 px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
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
          <div className="whitespace-pre-line">
            {message.type === 'assistant' ? (
              <ReactMarkdown
                components={{
                  // Parágrafos com espaçamento reduzido
                  // Parágrafos sem espaçamento
                  p: ({node, ...props}) => <p className="mb-0 leading-relaxed" {...props} />,
                  
                  // Texto em negrito
                  strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                  
                  // Texto em itálico
                  em: ({node, ...props}) => <em className="italic text-gray-700" {...props} />,
                  
                  // Listas sem espaçamento
                  ul: ({node, ...props}) => <ul className="mb-0 space-y-0" {...props} />,
                  
                  // Listas ordenadas sem espaçamento
                  ol: ({node, ...props}) => <ol className="mb-0 space-y-0" {...props} />,
                  
                  // Items de lista sem espaçamento
                  li: ({node, ...props}) => <li className="mb-0" {...props} />,
                  
                  // Links
                  a: ({node, ...props}) => (
                    <a 
                      className="text-teal-600 hover:text-teal-800 underline font-medium" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      {...props} 
                    />
                  ),
                  
                  // Títulos sem espaçamento
                  h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-0 mt-0" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-0 mt-0" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-base font-bold mb-0 mt-0" {...props} />,
                  h4: ({node, ...props}) => <h4 className="text-sm font-bold mb-0 mt-0" {...props} />,                  // Código inline
                  code: ({node, ...props}) => (
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800" {...props} />
                  ),
                  
                  // Blocos de código
                  pre: ({node, ...props}) => (
                    <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto mb-2" {...props} />
                  )
                }}
              >{message.content}</ReactMarkdown>
            ) : (
              message.content
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-xs mt-1 ${
          message.type === 'user' ? 'text-gray-200' : 'text-gray-500'
        }`}>
          {formatTime(message.timestamp)}
        </div>

        {/* Ícones de ação */}
        {showActions && (
          <div 
            className={`absolute -bottom-10 flex gap-1 z-10 ${
              message.type === 'user' ? 'right-0' : 'left-0'
            }`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
          >
          {message.type === 'user' ? (
            // Ícones para mensagens do usuário (parte inferior direita)
            <button
              onClick={handleEdit}
              onMouseEnter={() => setShowActions(true)}
              className="p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 hover:text-gray-900 rounded-md shadow-sm border border-gray-200 transition-all duration-200"
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
                onMouseEnter={() => setShowActions(true)}
                className="p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-md shadow-sm border border-gray-200 transition-all duration-200"
                title="Copiar mensagem"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => onRefresh?.(message.id)}
                onMouseEnter={() => setShowActions(true)}
                className="p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-md shadow-sm border border-gray-200 transition-all duration-200"
                title="Refazer resposta"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}

      {/* Botões interativos para email já cadastrado */}
      {message.conversionData?.emailExists && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.open('/login', '_blank')}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Fazer Login
            </button>
            <button
              onClick={() => window.open('/login?action=reset', '_blank')}
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
        <div className="flex justify-center mt-6 w-full">
          <div className="w-full max-w-lg">
            <ContactFormMessage onSubmit={onContactSubmit} />
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
