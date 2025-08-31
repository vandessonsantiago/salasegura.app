'use client';

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import ChatContainer, { ChatContainerRef } from '@/components/chat/ChatContainer';
import { ChatSession } from '@/hooks/useChatStorage';

interface MainProps {
  // Common props
  onNewMessage?: (message: string) => void;
  triggerMessage?: string; // Renomeado de initialMessage
  className?: string;
  
  // Mode configuration
  mode: 'landing' | 'dashboard';
  
  // Hero component for dashboard (when chat hasn't started)
  HeroComponent?: React.ComponentType;
}

export interface MainRef {
  resetChat: () => void;
  loadSession: (session: ChatSession) => void;
}

const Main = forwardRef<MainRef, MainProps>(({ 
  onNewMessage, 
  triggerMessage, 
  className = "",
  mode,
  HeroComponent
}, ref) => {
  const [chatStarted, setChatStarted] = useState(false);
  const chatContainerRef = useRef<ChatContainerRef>(null);

  // Log quando chatStarted muda
  useEffect(() => {
    console.log('🎨 Main: chatStarted mudou para:', chatStarted);
  }, [chatStarted]);

  const handleChatStart = (started: boolean) => {
    console.log('🔔 Main.handleChatStart chamado:', { started, currentChatStarted: chatStarted });
    setChatStarted(started);
    console.log('✅ Main.handleChatStart: chatStarted definido como', started);
    if (onNewMessage) {
      onNewMessage(started ? 'Chat iniciado' : '');
    }
  };

  const resetChat = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.resetChat();
      setChatStarted(false);
    }
  };

  const loadSession = (session: ChatSession) => {
    console.log('🔄 Main.loadSession chamado:', { session, chatStarted, hasChatContainerRef: !!chatContainerRef.current });
    if (chatContainerRef.current) {
      console.log('📤 Main chamando chatContainerRef.current.loadSession');
      chatContainerRef.current.loadSession(session);
      setChatStarted(true);
      console.log('✅ Main.loadSession: chatStarted definido como true');
    } else {
      console.log('❌ Main.loadSession: chatContainerRef.current é null');
    }
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
        {/* Hero - só mostrar quando chat não iniciou */}
        {!chatStarted && mode === 'dashboard' && HeroComponent && (
          <div className="flex-1 flex items-center justify-center w-full">
            <HeroComponent />
          </div>
        )}
        {!chatStarted && (!HeroComponent || mode !== 'dashboard') && (
          <div className="flex-1 flex items-center justify-center w-full">
            <div>Hero não configurado</div>
          </div>
        )}
        
        {/* ChatContainer - sempre renderizado para processar triggerMessage */}
        <div className="w-full">
          <ChatContainer 
            ref={chatContainerRef}
            onChatStart={handleChatStart}
            chatType={mode === 'dashboard' ? 'juridico' : 'conversao'}
            triggerMessage={triggerMessage}
          />
        </div>
      </div>
    </main>
  );
});

Main.displayName = 'Main';

export default Main;
