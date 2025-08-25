'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ChatContextType {
  isChatStarted: boolean;
  setIsChatStarted: (started: boolean) => void;
  sendMessageToMain: (message: string) => void;
  onMessageFromFooter?: (message: string) => void;
  setOnMessageFromFooter: (handler: (message: string) => void) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isChatStarted, setIsChatStarted] = useState(false);
  const [onMessageFromFooter, setOnMessageFromFooter] = useState<((message: string) => void) | undefined>();

  const sendMessageToMain = (message: string) => {
    if (onMessageFromFooter) {
      onMessageFromFooter(message);
    }
  };

  return (
    <ChatContext.Provider 
      value={{
        isChatStarted,
        setIsChatStarted,
        sendMessageToMain,
        onMessageFromFooter,
        setOnMessageFromFooter
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}
