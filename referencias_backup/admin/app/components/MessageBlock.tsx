'use client';

import { useState, useEffect } from 'react';
import { constants } from '../constants';

interface MessageBlockProps {
  message: {
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  };
  onEdit?: (id: string, newContent: string) => void;
  onRefazer?: (id: string) => void;
  onCopy?: (content: string) => void;
}

export default function MessageBlock({ 
  message, 
  onEdit, 
  onRefazer, 
  onCopy
}: MessageBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showActions, setShowActions] = useState(true);

  // Esconder ícones após 3 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowActions(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [message.id]);

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
      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} group mb-16`}
    >
      <div 
        className={`relative px-4 py-3 rounded-lg ${
          message.type === 'user' 
            ? 'bg-gray-800 text-white max-w-xs lg:max-w-md' 
            : 'text-gray-900 w-full leading-relaxed'
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
              className="w-full bg-white text-gray-900 px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-gray-500 resize-none"
              rows={Math.max(2, editContent.split('\n').length)}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="px-3 py-1 bg-gray-800 text-white text-sm rounded hover:bg-gray-900 transition-colors"
              >
                {constants.actions.save}
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
              >
                {constants.actions.cancel}
              </button>
            </div>
          </div>
        ) : (
          <div className="whitespace-pre-line">{message.content}</div>
        )}

        {/* Timestamp */}
        <div className={`text-xs mt-1 ${
          message.type === 'user' ? 'text-gray-300' : 'text-gray-500'
        }`}>
          {formatTime(message.timestamp)}
        </div>

        {/* Ícones de ação */}
        {showActions && (
          <div className={`absolute -bottom-8 flex gap-1 z-10 ${
            message.type === 'user' ? 'right-0' : 'left-0'
          }`}>
          {message.type === 'user' ? (
            // Ícones para mensagens do usuário (parte inferior direita)
            <button
              onClick={handleEdit}
              className="p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-700 hover:text-gray-900 rounded-md shadow-sm border border-gray-200 transition-all duration-200"
              title={constants.actions.edit}
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
                className="p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-md shadow-sm border border-gray-200 transition-all duration-200"
                title={constants.actions.copy}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => onRefazer?.(message.id)}
                className="p-1.5 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-md shadow-sm border border-gray-200 transition-all duration-200"
                title={constants.actions.refazer}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
