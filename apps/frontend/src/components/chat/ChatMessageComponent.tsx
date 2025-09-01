'use client';

import { ChatMessage } from '@/hooks/useChatStorage';
import { User, Robot } from 'phosphor-react';

interface ChatMessageProps {
  message: ChatMessage;
  isTyping?: boolean;
}

export default function ChatMessageComponent({ message, isTyping = false }: ChatMessageProps) {
  const isUser = message.type === 'user';

  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
            <Robot size={16} className="text-teal-600" />
          </div>
        </div>
      )}
      
      <div className={`max-w-[80%] ${isUser ? 'order-1' : 'order-2'}`}>
        <div
          className={`px-4 py-2 rounded-lg ${
            isUser
              ? 'bg-teal-600 text-white ml-auto'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          <div className="text-sm whitespace-pre-wrap">
            {message.content}
          </div>
          
        </div>
        
        <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {message.timestamp.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 order-2">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <User size={16} className="text-gray-600" />
          </div>
        </div>
      )}
    </div>
  );
}
