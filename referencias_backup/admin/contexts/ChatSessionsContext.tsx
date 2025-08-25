'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAdminChatStorage, ChatSession } from '../hooks/useAdminChatStorage';

interface ChatSessionsContextType {
  sessions: ChatSession[];
  loading: boolean;
  refreshSessions: () => Promise<void>;
  deleteSession: (sessionId: string) => Promise<boolean>;
  hasSessions: boolean;
}

const ChatSessionsContext = createContext<ChatSessionsContextType | undefined>(undefined);

export function ChatSessionsProvider({ children }: { children: ReactNode }) {
  const { sessions, loading, loadSessions, deleteSession: deleteSessionHook } = useAdminChatStorage();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshSessions = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadSessions();
    } finally {
      setIsRefreshing(false);
    }
  }, [loadSessions]);

  const deleteSession = useCallback(async (sessionId: string) => {
    const success = await deleteSessionHook(sessionId);
    if (success) {
      await refreshSessions();
    }
    return success;
  }, [deleteSessionHook, refreshSessions]);

  const hasSessions = sessions.length > 0;

  return (
    <ChatSessionsContext.Provider
      value={{
        sessions,
        loading: loading || isRefreshing,
        refreshSessions,
        deleteSession,
        hasSessions
      }}
    >
      {children}
    </ChatSessionsContext.Provider>
  );
}

export function useChatSessions() {
  const context = useContext(ChatSessionsContext);
  if (context === undefined) {
    throw new Error('useChatSessions must be used within a ChatSessionsProvider');
  }
  return context;
}
