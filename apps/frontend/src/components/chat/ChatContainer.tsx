'use client';

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useChatStorage, ChatMessage, ChatSession } from '@/hooks/useChatStorage';
import { useAuthenticatedChatStorage } from '@/hooks/useAuthenticatedChatStorage';
import { ChatService } from '@/services/chatService';
import { MessageBlock, TypingAnimation, ThinkingAnimation } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user, session } = useAuth();
  const isAuthenticated = !!user && !!session?.access_token;
  // Always call the hook to preserve hooks order. The hook will perform requests only when a token is provided.
  const authChat = useAuthenticatedChatStorage(session?.access_token || '');

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
  const handleTypingComplete = async () => {
    console.log('🎬 handleTypingComplete chamado');
    console.log('📝 pendingMessage:', pendingMessage);
    if (pendingMessage) {
      const updatedMessages = [...chatMessages, pendingMessage];
      // Atualiza UI imediatamente
      setChatMessages(updatedMessages);
      setPendingMessage(null);
      setIsTyping(false);

      if (isAuthenticated && authChat && currentSessionId) {
        // Persistir no backend e usar retorno atualizado
        try {
          await authChat.addMessage(currentSessionId, pendingMessage.type, pendingMessage.content);
          const fresh = await authChat.fetchMessages(currentSessionId);
          if (fresh && fresh.length > 0) {
            setChatMessages(fresh.map((m: any) => ({
              id: m.id,
              type: m.sender === 'user' ? 'user' : 'assistant',
              content: m.content,
              timestamp: new Date(m.created_at)
            })));
          }
        } catch (err) {
          console.error('Erro ao persistir mensagem do assistente:', err);
        }
      } else if (currentSessionId) {
        // Persistir no localStorage
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

      if (isAuthenticated && authChat && currentSessionId) {
        await authChat.addMessage(currentSessionId, confirmationMessage.type, confirmationMessage.content);
        await authChat.fetchMessages(currentSessionId);
        setChatMessages(authChat.messages.map(m => ({
          id: m.id,
          type: m.sender === 'user' ? 'user' : 'assistant',
          content: m.content,
          timestamp: new Date(m.created_at)
        })));
      } else if (currentSessionId) {
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
      if (isAuthenticated && authChat && currentSessionId) {
        await authChat.addMessage(currentSessionId, errorMessage.type, errorMessage.content);
        await authChat.fetchMessages(currentSessionId);
        setChatMessages(authChat.messages.map(m => ({
          id: m.id,
          type: m.sender === 'user' ? 'user' : 'assistant',
          content: m.content,
          timestamp: new Date(m.created_at)
        })));
      } else if (currentSessionId) {
        updateSession(currentSessionId, updatedMessages);
      }
    }
  };

  // Iniciar chat (primeira mensagem)
  const handleStartChat = async (firstMessage: string) => {
    setIsChatStarted(true);

  // Create a temporary user message and show it instantly (UI-first).
  const tempUserMessage: ChatMessage = { id: Date.now().toString(), type: 'user', content: firstMessage, timestamp: new Date() };
  setChatMessages([tempUserMessage]);
  // show thinking while persistence / assistant generation happens
  setIsThinking(true);

    if (isAuthenticated && authChat) {
      // Persist conversation and message in the background. Don't block the UI.
      (async () => {
              try {
              const conversation = await authChat.createConversation();
              console.log('📤 createConversation response:', conversation);
          if (conversation && conversation.id) {
            setCurrentSessionId(conversation.id);
            try {
                  const added = await authChat.addMessage(conversation.id, 'user', firstMessage);
                  console.log('📤 addMessage response (start):', added);
                  if (added && added.id) {
                // Replace temp message with DB record
                setChatMessages([{ id: added.id, type: added.sender === 'user' ? 'user' : 'assistant', content: added.content, timestamp: new Date(added.created_at) }]);
              } else {
                // Fallback: fetch full messages and update if available
                    const updatedMessages = await authChat.fetchMessages(conversation.id);
                    console.log('📤 fetchMessages (start fallback) response:', updatedMessages);
                    if (updatedMessages && updatedMessages.length > 0) {
                      setChatMessages(updatedMessages.map((m: any) => ({ id: m.id, type: m.sender === 'user' ? 'user' : 'assistant', content: m.content, timestamp: new Date(m.created_at) })));
                    }
              }

              // After persisting user message (or fallback), call assistant to get response
              try {
                const assistantResp = await ChatService.sendMessage(firstMessage, [{ id: tempUserMessage.id, type: 'user', content: firstMessage, timestamp: tempUserMessage.timestamp }], session?.access_token, conversation.id);
                    console.log('📤 ChatService.sendMessage (start) response:', assistantResp);
                    setIsThinking(false);
                    setPendingMessage({ id: Date.now().toString() + '-assistant', type: 'assistant', content: assistantResp.response, timestamp: new Date(), conversionData: assistantResp.conversionData || undefined });
                setIsTyping(true);
                // Atualizar conversationId se retornado pela API
                if (assistantResp.conversationId && !currentSessionId) {
                  setCurrentSessionId(assistantResp.conversationId);
                }
              } catch (assistantErr) {
                console.error('Erro ao chamar ChatService (start, after add):', assistantErr);
                setIsThinking(false);
              }
            } catch (err) {
                  console.error('Erro ao persistir mensagem do usuário (start -> add):', err);
              // If persisting failed (e.g., auth returned HTML/401), fall back to calling ChatService so UX continues
              try {
                        const assistantResp = await ChatService.sendMessage(firstMessage, [{ id: tempUserMessage.id, type: 'user', content: firstMessage, timestamp: tempUserMessage.timestamp }], session?.access_token, conversation?.id);
                    console.log('📤 ChatService.sendMessage (start, on add failure) response:', assistantResp);
                    setIsThinking(false);
                    setPendingMessage({ id: Date.now().toString() + '-assistant', type: 'assistant', content: assistantResp.response, timestamp: new Date(), conversionData: assistantResp.conversionData || undefined });
                    setIsTyping(true);
                    // Atualizar conversationId se retornado pela API
                    if (assistantResp.conversationId && !currentSessionId) {
                      setCurrentSessionId(assistantResp.conversationId);
                    }
              } catch (assistantErr) {
                console.error('Erro ao chamar ChatService (start, on add failure):', assistantErr);
                setIsThinking(false);
              }
            }
          }
        } catch (err) {
          console.error('Erro ao criar conversa no backend:', err);
          console.log('🚨 createConversation error details:', err);
          // If creating conversation failed (often auth/HTML), fall back to calling ChatService so user sees assistant reply
          try {
            const assistantResp = await ChatService.sendMessage(firstMessage, [{ id: tempUserMessage.id, type: 'user', content: firstMessage, timestamp: tempUserMessage.timestamp }], session?.access_token, currentSessionId || undefined);
            console.log('📤 ChatService.sendMessage (start, on create failure) response:', assistantResp);
            setIsThinking(false);
            setPendingMessage({ id: Date.now().toString() + '-assistant', type: 'assistant', content: assistantResp.response, timestamp: new Date(), conversionData: assistantResp.conversionData || undefined });
            setIsTyping(true);
            // Atualizar conversationId se retornado pela API
            if (assistantResp.conversationId && !currentSessionId) {
              setCurrentSessionId(assistantResp.conversationId);
            }
          } catch (assistantErr) {
            console.error('Erro ao chamar ChatService (start, on create failure):', assistantErr);
            setIsThinking(false);
          }
        }
      })();
    } else {
      // LocalStorage (não autenticado)
      const sessionId = createSession(firstMessage); // Corrigido para usar 'firstMessage'
      setCurrentSessionId(sessionId);
      setIsThinking(true);
      try {
        // Chama o backend para obter resposta do assistente
        const response = await ChatService.sendMessage(firstMessage, [{ id: tempUserMessage.id, type: 'user', content: firstMessage, timestamp: tempUserMessage.timestamp }], session?.access_token);
        console.log('📤 ChatService.sendMessage (start unauth) response:', response);
        setIsThinking(false);
        setPendingMessage({ id: Date.now().toString() + '-assistant', type: 'assistant', content: response.response, timestamp: new Date(), conversionData: response.conversionData || undefined });
        setIsTyping(true);
      } catch (error) {
        console.error('Erro ChatService.sendMessage (start unauth):', error);
        setIsThinking(false);
        setPendingMessage({ id: Date.now().toString() + '-error', type: 'assistant', content: 'Desculpe, houve um erro ao processar sua mensagem. Tente novamente mais tarde.', timestamp: new Date() });
        setIsTyping(true);
      }
    }
  };

  // Enviar nova mensagem
  const handleNewMessage = async (message: string) => {
    if (isAuthenticated && authChat && currentSessionId) {
      // Exibe imediatamente a mensagem do usuário
  const userMessage: ChatMessage = { id: Date.now().toString(), type: 'user', content: message, timestamp: new Date() };
      setChatMessages(prev => [...prev, userMessage]);
      // Persiste no backend e atualiza a UI com o retorno (se houver)
      try {
        const added = await authChat.addMessage(currentSessionId, 'user', message);
        console.log('📤 addMessage response (new):', added);
        if (added && added.id) {
          // Substitui a mensagem temporária na lista
          setChatMessages(prev => prev.map(m => m.id === userMessage.id ? {
            id: added.id,
            type: added.sender === 'user' ? 'user' : 'assistant',
            content: added.content,
            timestamp: new Date(added.created_at)
          } : m));
        } else {
          // Fallback: tenta buscar mensagens completas
          const updatedMessages = await authChat.fetchMessages(currentSessionId);
          console.log('📤 fetchMessages (new fallback) response:', updatedMessages);
          if (updatedMessages && updatedMessages.length > 0) {
            setChatMessages(updatedMessages.map((m: any) => ({
              id: m.id,
              type: m.sender === 'user' ? 'user' : 'assistant',
              content: m.content,
              timestamp: new Date(m.created_at)
            })));
          }
        }
      } catch (err) {
        console.error('Erro ao persistir mensagem do usuário (new):', err);
      }
    } else {
      // LocalStorage (não autenticado)
      // Adiciona mensagem do usuário
      setChatMessages(prev => [...prev, { id: Date.now().toString(), type: 'user', content: message, timestamp: new Date() }]);
      setIsThinking(true);
      try {
        // Chama o backend para obter resposta do assistente
  const response = await ChatService.sendMessage(message, [...chatMessages, { id: Date.now().toString(), type: 'user', content: message, timestamp: new Date() }], session?.access_token, currentSessionId || undefined);
        console.log('📤 ChatService.sendMessage (new unauth) response:', response);
        setIsThinking(false);
        // Adiciona resposta do assistente
        setPendingMessage({
          id: Date.now().toString() + '-assistant',
          type: 'assistant',
          content: response.response,
          timestamp: new Date(),
          conversionData: response.conversionData || undefined
        });
        setIsTyping(true);
        // Atualizar conversationId se retornado pela API
        if (response.conversationId && !currentSessionId) {
          setCurrentSessionId(response.conversationId);
        }
        // Atualizar conversationId se retornado pela API
        if (response.conversationId && !currentSessionId) {
          setCurrentSessionId(response.conversationId);
        }
      } catch (error) {
        console.error('Erro ChatService.sendMessage (new unauth):', error);
        setIsThinking(false);
        setPendingMessage({
          id: Date.now().toString() + '-error',
          type: 'assistant',
          content: 'Desculpe, houve um erro ao processar sua mensagem. Tente novamente mais tarde.',
          timestamp: new Date()
        });
        setIsTyping(true);
      }
    }
  };

  // Reiniciar chat
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

  // Adicionando validação explícita para evitar inconsistências no fluxo de autenticação e mensagens
  useEffect(() => {
    if (isAuthenticated && !authChat) {
      console.warn('Usuário autenticado, mas authChat não está disponível. Verifique o token de acesso.');
    }
  }, [isAuthenticated, authChat]);

  // Garantindo que o estado de início do chat seja atualizado corretamente
  useEffect(() => {
    if (isChatStarted && chatMessages.length === 0) {
      console.warn('Chat marcado como iniciado, mas sem mensagens. Reiniciando estado.');
      setIsChatStarted(false);
    }
  }, [isChatStarted, chatMessages]);

  // Melhorando o fallback para mensagens pendentes
  const handlePendingMessageFallback = async () => {
    if (pendingMessage && !isThinking && !isTyping) {
      console.warn('Mensagem pendente detectada sem progresso. Forçando renderização.');
      await handleTypingComplete();
    }
  };
  useEffect(() => {
    handlePendingMessageFallback();
  }, [pendingMessage, isThinking, isTyping]);

  // Adicionando elemento visual para debug
  const DebugInfo = ({ context }: { context: string }) => (
    <div style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', padding: '10px', fontSize: '12px', zIndex: 1000 }}>
      <strong>Debug:</strong> {context}
    </div>
  );

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

          {/* Elemento de debug */}
          <DebugInfo context={isAuthenticated ? (chatType === 'juridico' ? 'Assistente Jurídico' : 'Conversão') : 'Fallback (Não autenticado)'} />
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
