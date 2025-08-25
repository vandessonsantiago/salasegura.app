'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowUp, ChatCircle } from 'phosphor-react';
import { useChatStorage, ChatMessage } from '@/hooks/useChatStorage';
import { useIntelligentChat } from '@/hooks/useIntelligentChat';
import ChatMessageComponent from './ChatMessageComponent';
import TypingAnimation from './TypingAnimation';
import ThinkingAnimation from './ThinkingAnimation';

interface IntelligentChatInputProps {
  title?: string;
  placeholder?: string;
  showIcon?: boolean;
  className?: string;
}

export default function IntelligentChatInput({
  title = "Como posso te ajudar?",
  placeholder = "Digite sua pergunta...",
  showIcon = true,
  className = ""
}: IntelligentChatInputProps) {
  const [message, setMessage] = useState('');
  const [chatStarted, setChatStarted] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { 
    currentSession, 
    createSession, 
    updateSession 
  } = useChatStorage();

  const {
    isThinking,
    isTyping,
    pendingMessage,
    sendMessage,
    completeTyping,
    reset
  } = useIntelligentChat();

  // Auto-scroll para a última mensagem
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 50);
    }
  };

  // Scroll automático quando há mudanças
  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages, isThinking, isTyping]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    // Criar sessão se não existir
    let sessionId = currentSession?.id;
    if (!sessionId) {
      sessionId = createSession(message);
      setChatStarted(true);
    }

    // Adicionar mensagem do usuário
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    const updatedMessages = [...(currentSession?.messages || []), userMessage];
    updateSession(sessionId, updatedMessages);

    // Limpar input
    setMessage('');

    // Enviar para chat inteligente
    const assistantMessage = await sendMessage(message.trim(), updatedMessages);
    
    if (assistantMessage) {
      // A mensagem será adicionada quando a animação terminar
    }
  };

  const handleTypingComplete = () => {
    const completedMessage = completeTyping();
    if (completedMessage && currentSession?.id) {
      const updatedMessages = [...currentSession.messages, completedMessage];
      updateSession(currentSession.id, updatedMessages);
    }
  };

  const handleTypingProgress = () => {
    scrollToBottom();
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Chat Header */}
      {!chatStarted && title && (
        <div className="flex items-center justify-center gap-2 mb-4">
          {showIcon && <ChatCircle size={20} weight="regular" className="text-gray-600" />}
          <p className="text-lg font-medium text-gray-700">{title}</p>
        </div>
      )}

      {/* Chat Messages Container */}
      {chatStarted && currentSession && (
        <div className="mb-4">
          <div
            ref={chatContainerRef}
            className="max-h-96 overflow-y-auto bg-white rounded-lg border border-gray-200 p-4 space-y-4"
          >
            {/* Mensagens existentes */}
            {currentSession.messages.map((msg) => (
              <ChatMessageComponent key={msg.id} message={msg} />
            ))}

            {/* Animação de pensando */}
            {isThinking && <ThinkingAnimation />}

            {/* Animação de digitação */}
            {isTyping && pendingMessage && (
              <div className="flex gap-3 mb-4 justify-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <ChatCircle size={16} className="text-teal-600" />
                  </div>
                </div>
                <div className="max-w-[80%]">
                  <div className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800">
                    <div className="text-sm">
                      <TypingAnimation
                        text={pendingMessage.content}
                        speed={30}
                        onComplete={handleTypingComplete}
                        onProgress={handleTypingProgress}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative max-w-xl mx-auto">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          disabled={isThinking || isTyping}
          className="w-full bg-gray-200 text-gray-900 px-4 py-3 pr-12 rounded-full placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!message.trim() || isThinking || isTyping}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowUp size={16} weight="bold" className="text-white" />
        </button>
      </form>

      {/* Status indicator */}
      {(isThinking || isTyping) && (
        <div className="text-center text-xs text-gray-500 mt-2">
          {isThinking ? 'Processando sua mensagem...' : 'Digitando resposta...'}
        </div>
      )}
    </div>
  );
}
