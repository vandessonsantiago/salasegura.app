'use client';

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useChatStorage, ChatMessage, ChatSession } from '@/hooks/useChatStorage';
import { ChatService } from '@/services/chatService';
import { MessageBlock, TypingAnimation, ThinkingAnimation } from '@/components/ui';

interface ChatContainerProps {
  onChatStart?: (started: boolean) => void;
  chatType?: 'juridico' | 'conversao';
  triggerMessage?: string; // Nova prop para disparar mensagens
}

export interface ChatContainerRef {
  handleNewMessage: (message: string) => void;
  resetChat: () => void;
  loadSession: (session: ChatSession) => void;
  startChat: (message: string) => void;
}

const ChatContainer = forwardRef<ChatContainerRef, ChatContainerProps>(({ onChatStart, triggerMessage, chatType = 'conversao' }, ref) => {
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
    console.log('🔔 useEffect isChatStarted mudou:', isChatStarted);
    if (onChatStart) {
      onChatStart(isChatStarted);
    }
  }, [isChatStarted, onChatStart]);

  // Controle simples: quando triggerMessage muda, processa a mensagem
  const lastTriggerRef = useRef<string>('');
  useEffect(() => {
    if (triggerMessage && triggerMessage !== lastTriggerRef.current) {
      lastTriggerRef.current = triggerMessage;
      const cleanMessage = triggerMessage.includes('|') ? triggerMessage.split('|')[0] : triggerMessage;
      
      console.log('🎯 Nova triggerMessage:', { triggerMessage, cleanMessage, isChatStarted });
      
      if (!isChatStarted) {
        console.log('🚀 Iniciando chat com:', cleanMessage);
        handleStartChat(cleanMessage);
      } else {
        console.log('💬 Enviando nova mensagem:', cleanMessage);
        handleNewMessage(cleanMessage);
      }
    }
  }, [triggerMessage]);

  // Função para lidar com o término da animação de digitação
  // Fallback para garantir renderização da resposta
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

  // Fallback: se animação não terminar em 30s, força renderização
  useEffect(() => {
    if (isTyping && pendingMessage) {
      const timeout = setTimeout(() => {
        if (isTyping && pendingMessage) {
          handleTypingComplete();
        }
      }, 30000); // 30 segundos
      return () => clearTimeout(timeout);
    }
  }, [isTyping, pendingMessage]);

  const handleTypingProgress = () => {
    scrollToBottom();
  };

  // Função para lidar com submissão do formulário de contato
  const handleContactFormSubmit = async (contactData: { name: string; email: string; whatsapp: string }) => {
    try {
  const { apiEndpoint } = await import('@/lib/api');
  const response = await fetch(apiEndpoint('/conversions'), {
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
    console.log('🔄 Estado atual isChatStarted:', isChatStarted);
    setIsChatStarted(true);
    console.log('✅ setIsChatStarted(true) chamado');
    if (onChatStart) {
      onChatStart(true);
    }
    // Criar nova sessão
    const sessionId = createSession(message);
    setCurrentSessionId(sessionId);
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    setChatMessages([userMessage]);
    setIsThinking(true);
    console.log('📝 Estados iniciais definidos, iniciando API call...');
    try {
      console.log('🤖 Chamando API real...');
      let response;
      if (chatType === 'juridico') {
        const { DashboardChatService } = await import('@/services/dashboardChatService');
        response = await DashboardChatService.sendMessage(message, []);
      } else {
        response = await ChatService.sendMessage(message, []);
      }
      console.log('📦 Resposta completa da API:', response);
      console.log('📝 Campo response:', response.response);
      console.log('📊 Tipo do response:', typeof response.response);
      
      let assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.response,
        timestamp: new Date()
      };
      console.log('💬 Mensagem do assistente criada:', assistantMessage);
      
      if (chatType === 'conversao' && 'conversionData' in response) {
        assistantMessage = {
          ...assistantMessage,
          conversionData: (response as any).conversionData
        };
      }
      console.log('🔄 Definindo pendingMessage...');
      setPendingMessage(assistantMessage);
      setIsThinking(false);
      setIsTyping(true);
      console.log('✅ Estados atualizados: isThinking=false, isTyping=true');
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
    const cleanMessage = message.includes('|') ? message.split('|')[0] : message;
    if (!cleanMessage.trim() || !currentSessionId) return;
    console.log('💬 Nova mensagem:', cleanMessage);
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: cleanMessage,
      timestamp: new Date()
    };
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    updateSession(currentSessionId, updatedMessages);
    setIsThinking(true);
    try {
      console.log('🤖 Chamando API real para nova mensagem...');
      let response;
      if (chatType === 'juridico') {
        const { DashboardChatService } = await import('@/services/dashboardChatService');
        response = await DashboardChatService.sendMessage(message, chatMessages);
      } else {
        response = await ChatService.sendMessage(message, chatMessages);
      }
      let assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.response,
        timestamp: new Date()
      };
      if (chatType === 'conversao' && 'conversionData' in response) {
        assistantMessage = {
          ...assistantMessage,
          conversionData: (response as any).conversionData
        };
      }
      setPendingMessage(assistantMessage);
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
  };  const resetChat = () => {
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

  // Expor handleNewMessage, resetChat, loadSession e startChat via ref
  useImperativeHandle(ref, () => ({
    handleNewMessage,
    resetChat,
    loadSession,
    startChat: handleStartChat
  }));

  if (!isChatStarted) {
    console.log('❌ Chat não iniciado, exibindo div vazio');
    // Estado inicial - Vazio
    return (
      <div className="flex-1">
        {/* Espaço vazio - aguardando primeira mensagem */}
      </div>
    );
  }

  console.log('✅ Chat iniciado, renderizando interface:', { 
    chatMessagesLength: chatMessages.length, 
    isThinking, 
    isTyping, 
    hasPendingMessage: !!pendingMessage 
  });

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
          {(() => {
            console.log('🔍 Verificando condições para TypingAnimation:', {
              isTyping,
              pendingMessage: !!pendingMessage,
              pendingMessageType: typeof pendingMessage?.content,
              pendingMessageContent: pendingMessage?.content?.substring(0, 50) + '...',
              contentTrim: pendingMessage?.content?.trim()?.length
            });
            return isTyping && pendingMessage && typeof pendingMessage.content === 'string' && pendingMessage.content.trim();
          })() && pendingMessage && (
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
