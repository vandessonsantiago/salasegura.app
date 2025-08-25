'use client';

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import Hero from './Hero';
import DashboardChat, { DashboardChatRef } from '@/components/shared/DashboardChat';
import { DashboardChatSession } from '@/hooks/useDashboardChatStorage';

interface DashboardMainProps {
  onNewMessage?: (message: string) => void;
  initialMessage?: string;
}

export interface DashboardMainRef {
  resetChat: () => void;
  loadSession: (session: DashboardChatSession) => void;
}

const DashboardMain = forwardRef<DashboardMainRef, DashboardMainProps>(({ onNewMessage, initialMessage }, ref) => {
  const [chatStarted, setChatStarted] = useState(false);
  const [lastInitialMessage, setLastInitialMessage] = useState<string>('');
  const dashboardChatRef = useRef<DashboardChatRef>(null);

  const handleChatStart = (started: boolean) => {
    setChatStarted(started);
    if (onNewMessage) {
      onNewMessage(started ? 'Chat iniciado' : '');
    }
  };

  const resetChat = () => {
    if (dashboardChatRef.current) {
      dashboardChatRef.current.resetChat();
      setChatStarted(false);
      setLastInitialMessage(''); 
    }
  };

  const loadSession = (session: DashboardChatSession) => {
    setChatStarted(true);
  };

  // Expor funções via ref
  useImperativeHandle(ref, () => ({
    resetChat,
    loadSession
  }));

  // Processar novas mensagens do footer
  useEffect(() => {
    if (initialMessage && initialMessage.trim() && initialMessage !== lastInitialMessage) {
      console.log('🎯 DashboardMain processando mensagem:', initialMessage);
      
      // Extrair mensagem (remover timestamp se presente)
      const actualMessage = initialMessage.includes('|') 
        ? initialMessage.split('|')[0] 
        : initialMessage;
      
      // Verificar se a mensagem não está vazia
      if (!actualMessage.trim()) {
        return;
      }
      
      if (!chatStarted) {
        // Se chat não iniciou, usar como mensagem inicial
        setLastInitialMessage(initialMessage);
        setChatStarted(true);
      } else if (dashboardChatRef.current) {
        // Se chat já iniciou, enviar como nova mensagem
        dashboardChatRef.current.sendInitialMessage(actualMessage);
        setLastInitialMessage(initialMessage);
      }
    }
  }, [initialMessage, chatStarted, lastInitialMessage]);

  return (
    <main className="flex-1 overflow-y-auto p-2 sm:p-4">
      <div className="w-full max-w-full sm:max-w-md lg:max-w-5xl mx-auto flex items-center justify-center min-h-full">
        {!chatStarted ? (
          <Hero />
        ) : (
          <DashboardChat 
            ref={dashboardChatRef}
            initialMessage={chatStarted ? (lastInitialMessage.includes('|') ? lastInitialMessage.split('|')[0] : lastInitialMessage) : undefined}
            onChatStart={handleChatStart}
          />
        )}
      </div>
    </main>
  );
});

DashboardMain.displayName = 'DashboardMain';

export default DashboardMain;
