'use client';

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { ChatMessage, ChatSession, useChatStorage } from '@/hooks/useChatStorage';
import { useAuthenticatedChatStorage } from '@/hooks/useAuthenticatedChatStorage';
import { ChatService } from '@/services/chatService';
import { MessageBlock, TypingAnimation, ThinkingAnimation } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

interface ChatContainerProps {
  onChatStart?: (started: boolean) => void;
  chatType?: 'juridico' | 'conversao';
  triggerMessage?: string; // Nova prop para disparar mensagens
  isActive?: boolean; // Nova prop para controlar se o chat está ativo
}

export interface ChatContainerRef {
  handleNewMessage: (message: string) => void;
  resetChat: () => void;
  loadSession: (session: ChatSession) => void;
  startChat: (message: string) => void;
}

const ChatContainer = forwardRef<ChatContainerRef, ChatContainerProps>(({ onChatStart, triggerMessage, chatType = 'conversao', isActive = true }, ref) => {
  const [isChatStarted, setIsChatStarted] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<ChatMessage | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Log quando o componente é montado
  useEffect(() => {
    console.log('🎯 ChatContainer montado');
    return () => {
      console.log('💀 ChatContainer desmontado');
    };
  }, []);

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

  // Notify parent about chat state changes
  useEffect(() => {
    if (!isLoadingSessionRef.current && onChatStart) {
      onChatStart(isChatStarted);
    }
  }, [isChatStarted, onChatStart]);

  // Handle triggerMessage
  const lastTriggerRef = useRef<string>('');
  const isLoadingSessionRef = useRef(false);
  const processingMessageRef = useRef(false);
  const conversationCreatedRef = useRef(false);
  const savingMessageRef = useRef(false);
  
  useEffect(() => {
    console.log('🔍 ChatContainer useEffect triggerMessage:', { triggerMessage, isChatStarted, isProcessing: processingMessageRef.current, conversationCreated: conversationCreatedRef.current });
    
    if (triggerMessage && triggerMessage !== lastTriggerRef.current && !isLoadingSessionRef.current && !processingMessageRef.current) {
      console.log('✅ Processando triggerMessage:', triggerMessage);
      processingMessageRef.current = true;
      lastTriggerRef.current = triggerMessage;
      const cleanMessage = triggerMessage.includes('|') ? triggerMessage.split('|')[0] : triggerMessage;
      
      console.log('🎯 Mensagem limpa:', cleanMessage);
      
      if (!isChatStarted) {
        console.log('🚀 Iniciando chat...');
        handleStartChat(cleanMessage).finally(() => {
          processingMessageRef.current = false;
        });
      } else {
        console.log('💬 Enviando mensagem...');
        handleNewMessage(cleanMessage).finally(() => {
          processingMessageRef.current = false;
        });
      }
    } else {
      console.log('❌ triggerMessage não processado:', { 
        hasTrigger: !!triggerMessage, 
        isNew: triggerMessage !== lastTriggerRef.current, 
        isLoading: isLoadingSessionRef.current,
        isProcessing: processingMessageRef.current,
        conversationCreated: conversationCreatedRef.current
      });
    }
  }, [triggerMessage]);

  // Handle typing completion
  const handleTypingComplete = async () => {
    console.log('🔄 handleTypingComplete called', {
      hasPendingMessage: !!pendingMessage,
      pendingMessageId: pendingMessage?.id,
      currentSessionId,
      isAuthenticated,
      hasAuthChat: !!authChat,
      isSaving: savingMessageRef.current,
      timestamp: new Date().toISOString()
    });

    if (pendingMessage && !savingMessageRef.current) {
      savingMessageRef.current = true;
      
      console.log('💾 Saving assistant message to DB:', {
        conversationId: currentSessionId,
        type: pendingMessage.type,
        contentLength: pendingMessage.content.length,
        contentPreview: pendingMessage.content.substring(0, 100)
      });

      const updatedMessages = [...chatMessages, pendingMessage];
      setChatMessages(updatedMessages);
      setPendingMessage(null);
      setIsTyping(false);

      // Only persist if we have a session and the message isn't already in the loaded session
      // AND if this message wasn't already saved by ChatService
      if (isAuthenticated && authChat && currentSessionId && !pendingMessage.conversionData) {
        try {
          console.log('📤 Calling authChat.addMessage...');
          const result = await authChat.addMessage(currentSessionId, pendingMessage.type, pendingMessage.content);
          console.log('✅ Assistant message saved to DB:', result);
          // Don't fetch messages here to avoid duplication
        } catch (err) {
          console.error('❌ Error persisting assistant message:', err);
        }
      } else if (currentSessionId) {
        updateSession(currentSessionId, updatedMessages);
      }
      
      savingMessageRef.current = false;
    } else {
      console.log('⚠️ handleTypingComplete called but no pendingMessage or already saving');
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
        // Don't fetch messages here to avoid overwriting existing messages
        // await authChat.fetchMessages(currentSessionId);
        // setChatMessages(authChat.messages.map(m => ({
        //   id: m.id,
        //   type: m.role === 'user' ? 'user' : 'assistant',
        //   content: m.content,
        //   timestamp: new Date(m.created_at)
        // })));
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
        // Don't fetch messages here to avoid overwriting existing messages
        // await authChat.fetchMessages(currentSessionId);
        // setChatMessages(authChat.messages.map(m => ({
        //   id: m.id,
        //   type: m.role === 'user' ? 'user' : 'assistant',
        //   content: m.content,
        //   timestamp: new Date(m.created_at)
        // })));
      } else if (currentSessionId) {
        updateSession(currentSessionId, updatedMessages);
      }
    }
  };

  // Iniciar chat (primeira mensagem)
  const handleStartChat = async (firstMessage: string) => {
    console.log('🚀 handleStartChat iniciado:', { firstMessage, isAuthenticated, hasAuthChat: !!authChat, conversationCreated: conversationCreatedRef.current });
    
    // Prevent multiple conversation creation
    if (conversationCreatedRef.current) {
      console.log('⚠️ Conversa já criada, pulando criação...');
      return;
    }
    
    setIsChatStarted(true);
    conversationCreatedRef.current = true;

  // Create a temporary user message and show it instantly (UI-first).
  const tempUserMessage: ChatMessage = { id: Date.now().toString(), type: 'user', content: firstMessage, timestamp: new Date() };
  setChatMessages([tempUserMessage]);
  console.log('📝 Mensagem temporária criada:', tempUserMessage);
  // show thinking while persistence / assistant generation happens
  setIsThinking(true);

    if (isAuthenticated && authChat) {
      console.log('🔐 Usuário autenticado, tentando persistir...');
      // Persist conversation and message in the background. Don't block the UI.
      (async () => {
              try {
              console.log('🏗️ Criando conversa...');
              const conversation = await authChat.createConversation(`Conversa: ${firstMessage.substring(0, 30)}...`);
              console.log('📤 createConversation response:', conversation);
          if (conversation && conversation.id) {
            console.log('✅ Conversa criada com ID:', conversation.id);
            setCurrentSessionId(conversation.id);
            try {
                  console.log('💾 Salvando primeira mensagem...');
                  const added = await authChat.addMessage(conversation.id, 'user', firstMessage);
                  console.log('📤 addMessage response (start):', added);
                  
                  if (added && added.id) {
                    console.log('✅ Mensagem salva com sucesso, atualizando UI...');
                // Replace temp message with DB record - FORCE user type for user messages
                setChatMessages([{ id: added.id, type: 'user', content: added.content, timestamp: new Date(added.created_at) }]);
              } else {
                console.log('❌ Falha ao salvar mensagem, tentando buscar mensagens existentes...');
                // Fallback: fetch full messages and update if available
                    const updatedMessages = await authChat.fetchMessages(conversation.id);
                    console.log('📤 fetchMessages (start fallback) response:', updatedMessages);
                    if (updatedMessages && updatedMessages.length > 0) {
                      console.log('✅ Mensagens encontradas no fallback, atualizando UI...');
                      setChatMessages(updatedMessages.map((m: any) => ({ id: m.id, type: m.role === 'user' ? 'user' : 'assistant', content: m.content, timestamp: new Date(m.created_at) })));
                    } else {
                      console.log('❌ Nenhuma mensagem encontrada no fallback');
                    }
              }

              // After persisting user message (or fallback), call assistant to get response
              try {
                const assistantResp = await ChatService.sendMessage(firstMessage, [{ id: tempUserMessage.id, type: 'user', content: firstMessage, timestamp: tempUserMessage.timestamp }], session?.access_token, conversation.id);
                    console.log('📤 ChatService.sendMessage (start) response:', assistantResp);
                    setIsThinking(false);
                    setPendingMessage({ 
                      id: Date.now().toString() + '-assistant', 
                      type: 'assistant', 
                      content: assistantResp.response, 
                      timestamp: new Date(), 
                      conversionData: assistantResp.conversionData || undefined
                    });
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
                    setPendingMessage({ 
                      id: Date.now().toString() + '-assistant', 
                      type: 'assistant', 
                      content: assistantResp.response, 
                      timestamp: new Date(), 
                      conversionData: assistantResp.conversionData || undefined
                    });
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
            setPendingMessage({ 
              id: Date.now().toString() + '-assistant', 
              type: 'assistant', 
              content: assistantResp.response, 
              timestamp: new Date(), 
              conversionData: assistantResp.conversionData || undefined
            });
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
        if (added && added.id) {
          // Substitui a mensagem temporária na lista - FORCE user type for user messages
          setChatMessages(prev => prev.map(m => m.id === userMessage.id ? {
            id: added.id,
            type: 'user', // Sempre 'user' para mensagens do usuário
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
              type: m.role === 'user' ? 'user' : 'assistant',
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

  // Reiniciar chat (interface apenas, preserva conversa no banco)
  const handleRestartChat = () => {
    console.log('🔄 Reiniciando chat (interface) - permitindo nova conversa');
    
    // Resetar apenas o estado da interface, mantendo a conversa salva
    setIsChatStarted(false);
    setChatMessages([]);
    setIsThinking(false);
    setIsTyping(false);
    setPendingMessage(null);
    
    // Resetar currentSessionId para permitir nova conversa
    setCurrentSessionId(null);
    
    // Resetar flag para permitir criação de nova conversa
    conversationCreatedRef.current = false;
    
    // Resetar flags de controle
    processingMessageRef.current = false;
    lastTriggerRef.current = '';
    savingMessageRef.current = false;
    
    // Notificar parent sobre mudança de estado
    if (onChatStart) {
      onChatStart(false);
    }
    
    console.log('✅ Chat reiniciado - pronto para nova conversa');
  };  const resetChat = () => {
    console.log('🔄 Resetando chat (interface) - permitindo nova conversa');
    
    // Mesmo comportamento do handleRestartChat
    setIsChatStarted(false);
    setChatMessages([]);
    setIsThinking(false);
    setIsTyping(false);
    setPendingMessage(null);
    
    // Resetar currentSessionId para permitir nova conversa
    setCurrentSessionId(null);
    
    // Resetar flag para permitir criação de nova conversa
    conversationCreatedRef.current = false;
    
    // Resetar flags de controle
    processingMessageRef.current = false;
    lastTriggerRef.current = '';
    savingMessageRef.current = false;
    
    // Notificar parent sobre mudança de estado
    if (onChatStart) {
      onChatStart(false);
    }
    
    console.log('✅ Chat resetado - pronto para nova conversa');
  };

  const loadSession = (session: ChatSession) => {
    console.log('Loading session in ChatContainer:', session.id);
    
    // Prevent triggerMessage processing during session loading
    isLoadingSessionRef.current = true;
    
    setIsChatStarted(true);
    conversationCreatedRef.current = true; // Mark as conversation already exists
    setChatMessages(session.messages);
    setCurrentSessionId(session.id);
    setIsThinking(false);
    setIsTyping(false);
    setPendingMessage(null);
    savingMessageRef.current = false;
    
    // Notify parent
    if (onChatStart) {
      onChatStart(true);
    }
    
    // Release the flag after a short delay
    setTimeout(() => {
      isLoadingSessionRef.current = false;
    }, 100);
  };

  // Expor handleNewMessage, resetChat, loadSession e startChat via ref
  useImperativeHandle(ref, () => {
    console.log('🔗 ChatContainer useImperativeHandle chamado');
    return {
      handleNewMessage,
      resetChat,
      loadSession,
      startChat: handleStartChat
    };
  });

  // Adicionando validação explícita para evitar inconsistências no fluxo de autenticação e mensagens
  useEffect(() => {
    if (isAuthenticated && !authChat) {
      console.warn('Usuário autenticado, mas authChat não está disponível. Verifique o token de acesso.');
    }
  }, [isAuthenticated, authChat]);

  // Garantindo que o estado de início do chat seja atualizado corretamente
  useEffect(() => {
    // Removido: não devemos resetar o chat se não há mensagens quando carregando uma sessão
    // Isso estava causando problemas no carregamento de sessões salvas
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

  if (!isChatStarted || !isActive) {
    console.log('❌ Chat não iniciado ou não ativo, exibindo div vazio', { isChatStarted, isActive });
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
          className="text-sm text-teal-600 hover:text-teal-700 underline transition-colors"
          title="Limpar chat atual e iniciar uma nova conversa (conversa anterior ficará salva)"
        >
          🆕 Nova conversa
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
