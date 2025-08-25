'use client';

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import ChatContainer, { ChatContainerRef } from '@/components/chat/ChatContainer';
import { DashboardChat, DashboardChatRef } from '@/components/chat';
import { ChatSession } from '@/hooks/useChatStorage';
import { DashboardChatSession } from '@/hooks/useDashboardChatStorage';

interface MainProps {
  // Common props
  onNewMessage?: (message: string) => void;
  initialMessage?: string;
  className?: string;
  
  // Mode configuration
  mode: 'landing' | 'dashboard';
  
  // Hero component for dashboard (when chat hasn't started)
  HeroComponent?: React.ComponentType;
}

export interface MainRef {
  resetChat: () => void;
  loadSession: (session: ChatSession | DashboardChatSession) => void;
}

const Main = forwardRef<MainRef, MainProps>(({ 
  onNewMessage, 
  initialMessage, 
  className = "",
  mode,
  HeroComponent
}, ref) => {
  const [chatStarted, setChatStarted] = useState(mode === 'landing'); // Landing sempre mostra chat
  const [lastInitialMessage, setLastInitialMessage] = useState<string>('');
  
  // Refs específicos para cada tipo de chat
  const chatContainerRef = useRef<ChatContainerRef>(null);
  const dashboardChatRef = useRef<DashboardChatRef>(null);

  const handleChatStart = (started: boolean) => {
    setChatStarted(started);
    if (onNewMessage) {
      onNewMessage(started ? 'Chat iniciado' : '');
    }
  };

  const resetChat = () => {
    if (mode === 'landing' && chatContainerRef.current) {
      chatContainerRef.current.resetChat();
      setChatStarted(false);
      setLastInitialMessage('');
    } else if (mode === 'dashboard' && dashboardChatRef.current) {
      dashboardChatRef.current.resetChat();
      setChatStarted(false);
      setLastInitialMessage('');
    }
  };

  const loadSession = (session: ChatSession | DashboardChatSession) => {
    if (mode === 'landing' && chatContainerRef.current) {
      chatContainerRef.current.loadSession(session as ChatSession);
      setChatStarted(true);
    } else if (mode === 'dashboard') {
      setChatStarted(true);
    }
  };

  // Expor funções via ref
  useImperativeHandle(ref, () => ({
    resetChat,
    loadSession
  }));

  // Processar novas mensagens do footer
  useEffect(() => {
    if (initialMessage && initialMessage.trim() && initialMessage !== lastInitialMessage) {
      console.log(`🎯 ${mode}Main processando mensagem:`, initialMessage);
      
      // Extrair mensagem (remover timestamp se presente)
      const actualMessage = initialMessage.includes('|') 
        ? initialMessage.split('|')[0] 
        : initialMessage;
      
      // Verificar se a mensagem não está vazia
      if (!actualMessage.trim()) {
        return;
      }
      
      if (mode === 'landing') {
        if (!chatStarted) {
          setLastInitialMessage(initialMessage);
        } else if (chatContainerRef.current) {
          chatContainerRef.current.handleNewMessage(actualMessage);
          setLastInitialMessage(initialMessage);
        }
      } else if (mode === 'dashboard') {
        if (!chatStarted) {
          setLastInitialMessage(initialMessage);
          setChatStarted(true);
        } else if (dashboardChatRef.current) {
          dashboardChatRef.current.sendInitialMessage(actualMessage);
          setLastInitialMessage(initialMessage);
        }
      }
    }
  }, [initialMessage, chatStarted, lastInitialMessage, mode]);

  const baseClasses = "flex-1 overflow-y-auto p-2 sm:p-4";
  const modeClasses = mode === 'landing' ? "relative z-10" : "";
  
  return (
    <main className={`${baseClasses} ${modeClasses} ${className}`}>
      <div className="w-full max-w-full sm:max-w-md lg:max-w-5xl mx-auto flex items-center justify-center min-h-full">
        {mode === 'landing' ? (
          <ChatContainer 
            ref={chatContainerRef}
            onChatStart={handleChatStart}
            initialMessage={chatStarted ? undefined : (lastInitialMessage.includes('|') ? lastInitialMessage.split('|')[0] : lastInitialMessage)}
          />
        ) : (
          !chatStarted ? (
            HeroComponent ? <HeroComponent /> : <div>Dashboard Hero não configurado</div>
          ) : (
            <DashboardChat 
              ref={dashboardChatRef}
              initialMessage={chatStarted ? (lastInitialMessage.includes('|') ? lastInitialMessage.split('|')[0] : lastInitialMessage) : undefined}
              onChatStart={handleChatStart}
            />
          )
        )}
      </div>
    </main>
  );
});

Main.displayName = 'Main';

export default Main;
