'use client';

import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import ChatContainer, { ChatContainerRef } from './ChatContainer';
import { ChatSession } from '@/hooks/useChatStorage';

interface LandingMainProps {
  onNewMessage?: (message: string) => void;
  initialMessage?: string;
}

export interface LandingMainRef {
  resetChat: () => void;
  loadSession: (session: ChatSession) => void;
}

const LandingMain = forwardRef<LandingMainRef, LandingMainProps>(({ onNewMessage, initialMessage }, ref) => {
  const [chatStarted, setChatStarted] = useState(false);
  const [lastInitialMessage, setLastInitialMessage] = useState<string>('');
  const chatContainerRef = useRef<ChatContainerRef>(null);

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
      setLastInitialMessage(''); // Limpar última mensagem para evitar reprocessamento
    }
  };

  const loadSession = (session: ChatSession) => {
    if (chatContainerRef.current) {
      chatContainerRef.current.loadSession(session);
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
      console.log('🎯 LandingMain processando mensagem:', initialMessage);
      
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
      } else if (chatContainerRef.current) {
        // Se chat já iniciou, enviar como nova mensagem
        chatContainerRef.current.handleNewMessage(actualMessage);
        setLastInitialMessage(initialMessage);
      }
    }
  }, [initialMessage, chatStarted, lastInitialMessage]);

  return (
    <main className="flex-1 overflow-y-auto p-2 sm:p-4 relative z-10">
      <div className="w-full max-w-full sm:max-w-md lg:max-w-5xl mx-auto flex items-center justify-center min-h-full">
        <ChatContainer 
          ref={chatContainerRef}
          onChatStart={handleChatStart}
          initialMessage={chatStarted ? undefined : (lastInitialMessage.includes('|') ? lastInitialMessage.split('|')[0] : lastInitialMessage)}
        />
      </div>
    </main>
  );
});

LandingMain.displayName = 'LandingMain';

export default LandingMain;
