'use client';

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { ChatCircle, ArrowUp, User } from 'phosphor-react';
import { useDashboardChat, DashboardChatMessage } from '@/hooks/useDashboardChat';
import { useDashboardChatStorage } from '@/hooks/useDashboardChatStorage';
import { TypingAnimation, ThinkingAnimation } from '@/components/ui';

interface DashboardChatProps {
  className?: string;
  initialMessage?: string;
  onChatStart?: (started: boolean) => void;
}

export interface DashboardChatRef {
  resetChat: () => void;
  sendInitialMessage: (message: string) => void;
  handleNewMessage: (message: string) => void;
}

const DashboardChat = forwardRef<DashboardChatRef, DashboardChatProps>(({
  className = "",
  initialMessage,
  onChatStart
}, ref) => {
  const [message, setMessage] = useState('');
  const [chatStarted, setChatStarted] = useState(false);
  const [processedInitialMessage, setProcessedInitialMessage] = useState<string>('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { 
    currentSession, 
    createSession, 
    updateSession 
  } = useDashboardChatStorage();

  const {
    isThinking,
    isTyping,
    pendingMessage,
    sendMessage,
    completeTyping
  } = useDashboardChat();

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

  // Processar mensagem inicial
  useEffect(() => {
    if (initialMessage && initialMessage.trim() && initialMessage !== processedInitialMessage) {
      console.log('🎯 DashboardChat processando mensagem inicial:', initialMessage);
      setProcessedInitialMessage(initialMessage);
      
      // Se não há sessão, criar e iniciar chat com mensagem inicial
      if (!currentSession && !chatStarted) {
        handleInitialMessage(initialMessage);
      }
    }
  }, [initialMessage, processedInitialMessage, currentSession, chatStarted]);

  const handleInitialMessage = async (initialMsg: string) => {
    if (!initialMsg.trim()) return;

    // Criar sessão
    const sessionId = createSession(initialMsg);
    setChatStarted(true);
    
    if (onChatStart) {
      onChatStart(true);
    }

    // Adicionar mensagem do usuário
    const userMessage: DashboardChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: initialMsg.trim(),
      timestamp: new Date()
    };

    updateSession(sessionId, [userMessage]);

    // Enviar para chat inteligente
    await sendMessage(initialMsg.trim(), [userMessage]);
  };

  const handleNewMessage = async (newMessage: string) => {
    if (!newMessage.trim()) return;

    // Criar sessão se não existir
    let sessionId = currentSession?.id;
    if (!sessionId) {
      sessionId = createSession(newMessage);
      setChatStarted(true);
      
      if (onChatStart) {
        onChatStart(true);
      }
    }

    // Adicionar mensagem do usuário
    const userMessage: DashboardChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: newMessage.trim(),
      timestamp: new Date()
    };

    const updatedMessages = [...(currentSession?.messages || []), userMessage];
    updateSession(sessionId, updatedMessages);

    // Enviar para chat inteligente
    await sendMessage(newMessage.trim(), updatedMessages);
  };

  // Expor funções via ref
  useImperativeHandle(ref, () => ({
    resetChat: () => {
      setChatStarted(false);
      setProcessedInitialMessage('');
      setMessage('');
      if (onChatStart) {
        onChatStart(false);
      }
    },
    sendInitialMessage: (msg: string) => {
      handleInitialMessage(msg);
    },
    handleNewMessage: (msg: string) => {
      handleNewMessage(msg);
    }
  }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await handleNewMessage(message);
    setMessage('');
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

  if (!chatStarted) {
    return (
      <div className={`w-full ${className} text-center py-8`}>
        <div className="flex items-center justify-center gap-2 mb-4">
          <ChatCircle size={48} weight="regular" className="text-gray-400" />
        </div>
        <p className="text-lg font-medium text-gray-700 mb-2">
          Consultas sobre Direito de Família
        </p>
        <p className="text-sm text-gray-500">
          Digite sua pergunta no campo abaixo sobre divórcio, pensão alimentícia, guarda de filhos, etc.
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Chat Messages Container */}
      <div className="mb-4">
        <div
          ref={chatContainerRef}
          className="h-96 overflow-y-auto bg-white rounded-lg border border-gray-200 p-4 space-y-4"
        >
          {/* Mensagens existentes */}
          {currentSession && currentSession.messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <ChatCircle size={16} className="text-teal-600" />
                  </div>
                </div>
              )}
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                <div className={`px-4 py-2 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <div className="text-sm whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
                <div className={`text-xs text-gray-500 mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="flex-shrink-0 order-1">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <User size={16} className="text-gray-600" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Animação de pensando */}
          {isThinking && <ThinkingAnimation />}

          {/* Animação de digitação */}
          {isTyping && pendingMessage && (
            <div className="flex gap-3 justify-start">
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

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
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
          {isThinking ? 'Analisando sua pergunta...' : 'Preparando resposta...'}
        </div>
      )}
    </div>
  );
});

DashboardChat.displayName = 'DashboardChat';

export default DashboardChat;
