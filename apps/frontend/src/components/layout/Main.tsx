'use client';

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import ChatContainer, { ChatContainerRef } from '@/components/chat/ChatContainer';
import { ChatSession } from '@/hooks/useChatStorage';

interface MainProps {
  // Common props
  onNewMessage?: (message: string) => void;
  triggerMessage?: string; // Renomeado de initialMessage
  onTriggerMessageProcessed?: () => void; // Callback para limpar triggerMessage
  className?: string;

  // Mode configuration
  mode: 'landing' | 'dashboard';

  // Hero component for dashboard (when chat hasn't started)
  HeroComponent?: React.ComponentType;

  // Callback for chat reset
  onChatReset?: (reset: boolean) => void;
}

export interface MainRef {
  resetChat: () => void;
  loadSession: (session: ChatSession) => void;
}

const Main = forwardRef<MainRef, MainProps>(({
  onNewMessage,
  triggerMessage,
  onTriggerMessageProcessed,
  className = "",
  mode,
  HeroComponent,
  onChatReset
}, ref) => {
  const [chatStarted, setChatStarted] = useState(false);
  const [chatReset, setChatReset] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const chatContainerRef = useRef<ChatContainerRef>(null);

  // Log quando chatStarted muda
  useEffect(() => {
    console.log('🎨 Main: chatStarted mudou para:', chatStarted);
  }, [chatStarted]);

  // Log quando chatReset muda
  useEffect(() => {
    console.log('🔄 Main: chatReset mudou para:', chatReset);
  }, [chatReset]);

  // Log quando isLoadingSession muda
  useEffect(() => {
    console.log('📦 Main: isLoadingSession mudou para:', isLoadingSession);
  }, [isLoadingSession]);

  const handleChatStart = (started: boolean) => {
    console.log('🔔 [DEBUG] Main.handleChatStart chamado:', {
      started,
      currentChatStarted: chatStarted,
      currentChatReset: chatReset,
      isLoadingSession,
      hasOnNewMessage: !!onNewMessage
    });
    setChatStarted(started);
    // Quando o chat inicia, resetar o estado de reset (apenas se não for uma sessão sendo carregada)
    if (started && !chatReset) {
      setChatReset(false);
    }
    console.log('✅ [DEBUG] Main.handleChatStart: chatStarted definido como', started, '- chatReset definido como', started && !chatReset ? false : chatReset);
    if (onNewMessage) {
      onNewMessage(started ? 'Chat iniciado' : '');
    }
  };

  const handleChatReset = (reset: boolean) => {
    console.log('🔄 [DEBUG] Main.handleChatReset chamado:', {
      reset,
      currentChatReset: chatReset,
      currentChatStarted: chatStarted,
      isLoadingSession
    });
    setChatReset(reset);
    console.log('✅ [DEBUG] Main.handleChatReset: chatReset definido como', reset, '- chatStarted permanece', chatStarted);
    if (onChatReset) {
      onChatReset(reset);
    }
  };

  const handleTriggerMessageProcessed = () => {
    console.log('🧹 [DEBUG] Main.handleTriggerMessageProcessed: limpando triggerMessage');
    if (onTriggerMessageProcessed) {
      onTriggerMessageProcessed();
    }
  };

  const resetChat = () => {
    console.log('🔄 [DEBUG] Main.resetChat chamado - estado atual:', {
      chatStarted,
      chatReset,
      isLoadingSession,
      hasChatContainerRef: !!chatContainerRef.current
    });
    if (chatContainerRef.current) {
      chatContainerRef.current.resetChat();
      setChatStarted(false);
      console.log('✅ [DEBUG] Main.resetChat: chatContainerRef.current.resetChat() chamado e chatStarted definido como false');
    } else {
      console.log('❌ [DEBUG] Main.resetChat: chatContainerRef.current é null');
    }
  };

  const loadSession = (session: ChatSession) => {
    console.log('🔄 Main.loadSession chamado:', {
      sessionId: session.id,
      sessionTitle: session.title,
      messageCount: session.messages.length,
      chatStarted,
      hasChatContainerRef: !!chatContainerRef.current,
      chatReset
    });
    
    // Forçar renderização do ChatContainer
    setIsLoadingSession(true);
    
    // Pequeno delay para garantir que o componente seja renderizado
    setTimeout(() => {
      if (chatContainerRef.current) {
        console.log('📤 Main chamando chatContainerRef.current.loadSession...');
        chatContainerRef.current.loadSession(session);
        setChatStarted(true);
        setChatReset(false);
        setIsLoadingSession(false);
        console.log('✅ Main.loadSession: chatStarted definido como true, chatReset definido como false');
      } else {
        console.log('❌ Main.loadSession: chatContainerRef.current é null mesmo após delay');
        setIsLoadingSession(false);
      }
    }, 100);
  };

  useImperativeHandle(ref, () => ({
    resetChat,
    loadSession
  }));

  // Agora é muito mais simples - sem useEffect, só passa a prop
  const baseClasses = "flex-1 overflow-y-auto p-2 sm:p-4";
  const modeClasses = mode === 'landing' ? "relative z-10" : "";

  return (
    <main className={`${baseClasses} ${modeClasses} ${className}`}>
      <div className="w-full max-w-full sm:max-w-2xl md:max-w-2xl lg:max-w-5xl mx-auto flex flex-col items-center justify-center min-h-full">
        {/* Hero - só mostrar quando chat não iniciou E não foi resetado */}
        {!chatStarted && !chatReset && mode === 'dashboard' && HeroComponent && (
          <div className="flex-1 flex items-center justify-center w-full">
            <HeroComponent />
          </div>
        )}
        {!chatStarted && !chatReset && (!HeroComponent || mode !== 'dashboard') && (
          <div className="flex-1 flex items-center justify-center w-full">
            <div>Hero não configurado</div>
          </div>
        )}

        {/* ChatContainer - mostrar sempre para processar triggerMessage */}
        <div className="w-full">
          <ChatContainer
            ref={chatContainerRef}
            onChatStart={handleChatStart}
            onChatReset={handleChatReset}
            onTriggerMessageProcessed={handleTriggerMessageProcessed}
            chatType={mode === 'dashboard' ? 'juridico' : 'conversao'}
            triggerMessage={triggerMessage}
            loadSession={loadSession}
          />
        </div>
      </div>
    </main>
  );
});

Main.displayName = 'Main';

export default Main;
