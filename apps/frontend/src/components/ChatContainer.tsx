'use client';

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useChatStorage, ChatMessage, ChatSession } from '@/hooks/useChatStorage';
import { ChatService } from '@/services/chatService';
import MessageBlock from './MessageBlock';
import TypingAnimation from './TypingAnimation';
import ThinkingAnimation from './ThinkingAnimation';

interface ChatContainerProps {
  onChatStart?: (started: boolean) => void;
  initialMessage?: string;
}

export interface ChatContainerRef {
  handleNewMessage: (message: string) => void;
  resetChat: () => void;
  loadSession: (session: ChatSession) => void;
}

const ChatContainer = forwardRef<ChatContainerRef, ChatContainerProps>(({ onChatStart, initialMessage }, ref) => {
  const [isChatStarted, setIsChatStarted] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<ChatMessage | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { createSession, updateSession } = useChatStorage();

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
  }, [chatMessages, isThinking, isTyping]);

  // Notificar componente pai sobre mudança de estado
  useEffect(() => {
    if (onChatStart) {
      onChatStart(isChatStarted);
    }
  }, [isChatStarted, onChatStart]);

  // Processar mensagem inicial se fornecida
  useEffect(() => {
    if (initialMessage && initialMessage.trim() && !isChatStarted) {
      handleStartChat(initialMessage);
    }
  }, [initialMessage, isChatStarted]);

  // Função para lidar com o término da animação de digitação
  const handleTypingComplete = () => {
    console.log('🎬 handleTypingComplete chamado');
    console.log('📝 pendingMessage:', pendingMessage);
    
    if (pendingMessage) {
      const updatedMessages = [...chatMessages, pendingMessage];
      setChatMessages(updatedMessages);
      setPendingMessage(null);
      setIsTyping(false);
      
      // Salvar sessão atualizada
      if (currentSessionId) {
        updateSession(currentSessionId, updatedMessages);
      }
    }
  };

  const handleTypingProgress = () => {
    scrollToBottom();
  };

  // Função para lidar com submissão do formulário de contato
  const handleContactFormSubmit = async (contactData: { name: string; email: string; whatsapp: string }) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/conversions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      });

      if (!response.ok) {
        throw new Error('Erro ao processar conversão');
      }

      const result = await response.json();
      console.log('🎯 Resultado da conversão:', result);

      // Adicionar mensagem de confirmação no chat
      const confirmationMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `🎉 Perfeito, ${contactData.name.split(' ')[0]}! Redirecionando você para completar seu cadastro...\n\n� Você será levado para a página segura de criação da senha.`,
        timestamp: new Date()
      };

      const updatedMessages = [...chatMessages, confirmationMessage];
      setChatMessages(updatedMessages);

      if (currentSessionId) {
        updateSession(currentSessionId, updatedMessages);
      }

      // Redirecionar para a página de registro com o token
      if (result.redirectUrl) {
        console.log('🚀 Redirecionando para:', result.redirectUrl);
        setTimeout(() => {
          window.location.href = result.redirectUrl;
        }, 2000); // Aguardar 2 segundos para mostrar a mensagem
      }

    } catch (error) {
      console.error('Erro ao processar formulário:', error);
      
      // Adicionar mensagem de erro no chat
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Ops! Ocorreu um erro ao processar seus dados. Por favor, tente novamente em alguns instantes.',
        timestamp: new Date()
      };

      const updatedMessages = [...chatMessages, errorMessage];
      setChatMessages(updatedMessages);

      if (currentSessionId) {
        updateSession(currentSessionId, updatedMessages);
      }
    }
  };

  const handleStartChat = async (message: string) => {
    console.log('🚀 Iniciando chat com mensagem:', message);
    setIsChatStarted(true);
    
    // Criar nova sessão
    const sessionId = createSession(message);
    setCurrentSessionId(sessionId);
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    
    // Adicionar mensagem do usuário imediatamente
    setChatMessages([userMessage]);
    setIsThinking(true);
    
    try {
      console.log('🤖 Chamando API real...');
      
      // Chamar API real
      const response = await ChatService.sendMessage(message, []);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.response,
        timestamp: new Date(),
        conversionData: response.conversionData || undefined
      };
      
      // Armazenar a mensagem temporariamente para usar na animação
      setPendingMessage(assistantMessage);
      
      // Transição: parar pensamento e iniciar digitação
      setIsThinking(false);
      setIsTyping(true);
      
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      setIsThinking(false);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleNewMessage = async (message: string) => {
    if (!message.trim() || !currentSessionId) return;

    console.log('💬 Nova mensagem:', message);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);

    // Salvar sessão atualizada
    updateSession(currentSessionId, updatedMessages);

    // Iniciar animação de pensamento
    setIsThinking(true);

    try {
      console.log('🤖 Chamando API real para nova mensagem...');
      
      // Chamar API real com histórico completo
      const response = await ChatService.sendMessage(message, chatMessages);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.response,
        timestamp: new Date(),
        conversionData: response.conversionData || undefined
      };
      
      // Armazenar a mensagem temporariamente para usar na animação
      setPendingMessage(assistantMessage);
      
      // Transição: parar pensamento e iniciar digitação
      setIsThinking(false);
      setIsTyping(true);
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setIsThinking(false);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleRestartChat = () => {
    setIsChatStarted(false);
    setChatMessages([]);
    setIsThinking(false);
    setIsTyping(false);
    setPendingMessage(null);
    setCurrentSessionId(null);
  };

  const resetChat = () => {
    handleRestartChat();
  };

  const loadSession = (session: ChatSession) => {
    console.log('🔄 Carregando sessão:', session);
    setIsChatStarted(true);
    setChatMessages(session.messages);
    setCurrentSessionId(session.id);
    setIsThinking(false);
    setIsTyping(false);
    setPendingMessage(null);
  };

  // Expor handleNewMessage, resetChat e loadSession via ref
  useImperativeHandle(ref, () => ({
    handleNewMessage,
    resetChat,
    loadSession
  }));

  if (!isChatStarted) {
    // Estado inicial - Vazio
    return (
      <div className="flex-1">
        {/* Espaço vazio - aguardando primeira mensagem */}
      </div>
    );
  }

  // Estado do chat ativo - Exibir mensagens
  return (
    <div className="flex-1 flex flex-col">
      {/* Header do chat com opção de reiniciar */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Conversa</h3>
        <button
          onClick={handleRestartChat}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Nova conversa
        </button>
      </div>

      {/* Container do chat com scroll */}
      <div className="flex-1 flex flex-col relative z-10">
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto bg-white rounded-lg border border-gray-200 p-4 space-y-4 max-h-[60vh]"
        >
          {/* Mensagens existentes */}
          {chatMessages.map((msg) => (
            <MessageBlock 
              key={msg.id} 
              message={msg}
              onContactSubmit={handleContactFormSubmit}
            />
          ))}

          {/* Animação de pensando */}
          {isThinking && <ThinkingAnimation />}

          {/* Animação de digitação */}
          {isTyping && pendingMessage && (
            <div className="flex gap-3 mb-4 justify-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                  <span className="text-xs">🤖</span>
                </div>
              </div>
              <div className="max-w-[80%]">
                <div className="px-4 py-3 rounded-lg text-gray-900 w-full leading-relaxed">
                  <div className="whitespace-pre-line">
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
    </div>
  );
});

ChatContainer.displayName = 'ChatContainer';

export default ChatContainer;

// Hook personalizado para integração com footer
export function useChatContainer() {
  const [chatStarted, setChatStarted] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string>('');

  const sendMessageToChat = (message: string) => {
    setPendingMessage(message);
  };

  return {
    chatStarted,
    sendMessageToChat,
    pendingMessage,
    onChatStart: setChatStarted
  };
}
