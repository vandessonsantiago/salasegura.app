'use client';

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import ChatContainer, { ChatContainerRef } from '@/components/chat/ChatContainer';
import { ChatSession } from '@/hooks/useChatStorage';

interface MainProps {
  // Common props
  onNewMessage?: (message: string) => void;
  triggerMessage?: string;
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

  // Log when chatStarted changes
  useEffect(() => {
    console.log('Chat started:', chatStarted);
  }, [chatStarted]);

  const handleChatStart = (started: boolean) => {
    setChatStarted(started);
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
    console.log('Loading session:', session.id);
    setChatStarted(true);
    
    // Use setTimeout to ensure ChatContainer is rendered
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.loadSession(session);
      }
    }, 0);
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
      <div className="w-full max-w-full sm:max-w-2xl md:max-w-2xl lg:max-w-5xl mx-auto flex items-center justify-center min-h-full">
        {/* Hero - só mostrar quando chat não iniciou */}
        {!chatStarted && mode === 'dashboard' && HeroComponent && <HeroComponent />}
        {!chatStarted && (!HeroComponent || mode !== 'dashboard') && <div>Hero não configurado</div>}
        
        {/* ChatContainer - sempre renderizado */}
        <ChatContainer
          ref={chatContainerRef}
          onChatStart={handleChatStart}
          chatType={mode === 'dashboard' ? 'juridico' : 'conversao'}
          triggerMessage={triggerMessage}
          isActive={chatStarted}
        />
      </div>
    </main>
  );
});

Main.displayName = 'Main';

export default Main;
