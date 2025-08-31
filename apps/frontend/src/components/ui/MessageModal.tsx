'use client';

import { useState, useEffect } from "react";
import { useChatStorage, ChatSession } from "@/hooks/useChatStorage";
import { useAuth } from '@/contexts/AuthContext';
import { useAuthenticatedChatStorage, AuthChatConversation } from '@/hooks/useAuthenticatedChatStorage';
import { useToast } from './ToastProvider';
import ConfirmDialog from './ConfirmDialog';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSession?: (session: ChatSession) => void;
}

export default function MessageModal({ isOpen, onClose, onLoadSession }: MessageModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { user, session } = useAuth();
  const isAuthenticated = !!user && !!session?.access_token;
  const authChat = useAuthenticatedChatStorage(session?.access_token || "");
  const { error: showError, success: showSuccess } = useToast();

  const {
    sessions: localSessions,
    searchSessions: searchLocalSessions,
    deleteSession: deleteLocalSession,
    clearAllSessions: clearAllLocalSessions
  } = useChatStorage();

  const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [isClearingAll, setIsClearingAll] = useState(false);

  // Estados para o dialog de confirmação
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });

  // Filtrar sessões baseado na busca
  useEffect(() => {
    console.log('🔄 [DEBUG] MessageModal useEffect executado:', {
      isOpen,
      isAuthenticated,
      searchQuery,
      refreshTrigger,
      isLoadingConversations,
      hasAuthChat: !!authChat
    });

    if (isOpen && !isLoadingConversations) {
      if (isAuthenticated) {
        setIsLoadingConversations(true);
        let isMounted = true;
        const fetchConversations = async () => {
          try {
            console.log('📡 [DEBUG] MessageModal: Iniciando busca de conversas...');
            const conversations = await authChat.fetchConversations();
            console.log('✅ [DEBUG] MessageModal: Conversas encontradas:', conversations.length);
            if (isMounted) {
              // Buscar contagem de mensagens para cada conversa (limitando para evitar muitas requisições)
              const maxConversations = 10; // Limitar para evitar muitas requisições
              const limitedConversations = conversations.slice(0, maxConversations);

              const conversationsWithMessageCount = await Promise.allSettled(
                limitedConversations.map(async (conversation: AuthChatConversation) => {
                  try {
                    // Usar fetchMessages ao invés de fetchMessageCount para obter dados completos
                    const messages = await authChat.fetchMessages(conversation.id);
                    return {
                      id: conversation.id,
                      title: conversation.title || `Conversa iniciada em ${new Date(conversation.created_at).toLocaleString()}`,
                      messages: messages || [],
                      flow: 'free' as ChatSession['flow'],
                      createdAt: new Date(conversation.created_at),
                      updatedAt: new Date(conversation.updated_at),
                    };
                  } catch (error) {
                    console.error(`Erro ao buscar mensagens da conversa ${conversation.id}:`, error);
                    // Fallback: retornar conversa sem mensagens
                    return {
                      id: conversation.id,
                      title: conversation.title || `Conversa iniciada em ${new Date(conversation.created_at).toLocaleString()}`,
                      messages: [],
                      flow: 'free' as ChatSession['flow'],
                      createdAt: new Date(conversation.created_at),
                      updatedAt: new Date(conversation.updated_at),
                    };
                  }
                })
              );

              // Processar resultados, mantendo apenas os fulfilled
              const processedConversations = conversationsWithMessageCount
                .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
                .map(result => result.value);

              const filtered = processedConversations.filter((conversation: { title: string }) =>
                conversation.title.toLowerCase().includes(searchQuery.toLowerCase())
              );
              setFilteredSessions(filtered);
            }
          } catch (error) {
            console.error('Erro ao buscar conversas:', error);
          } finally {
            if (isMounted) {
              setIsLoadingConversations(false);
            }
          }
        };
        fetchConversations();
        return () => {
          isMounted = false;
          setIsLoadingConversations(false);
        };
      } else {
        const filtered = searchLocalSessions(searchQuery);
        setFilteredSessions(filtered);
      }
    }
  }, [isOpen, isAuthenticated, searchQuery, refreshTrigger]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleLoadSession = async (session: ChatSession) => {
    console.log('🔄 MessageModal.handleLoadSession chamado:', {
      sessionId: session.id,
      sessionTitle: session.title,
      messageCount: session.messages.length,
      isAuthenticated,
      hasOnLoadSession: !!onLoadSession
    });

    if (isAuthenticated && session.id) {
      try {
        // Sempre buscar mensagens frescas do backend para garantir dados atualizados
        console.log('📡 MessageModal: Buscando mensagens atualizadas do backend para conversationId:', session.id);
        const messages = await authChat.fetchMessages(session.id);
        console.log('📨 MessageModal: Mensagens recebidas do backend:', {
          messageCount: messages.length,
          firstMessage: messages[0] ? {
            id: messages[0].id,
            role: messages[0].role,
            content: messages[0].content?.substring(0, 50)
          } : null
        });

        const loadedSession: ChatSession = {
          ...session,
          messages: messages.map((msg: any) => ({
            id: msg.id,
            type: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content,
            timestamp: new Date(msg.created_at)
          }))
        };
        console.log('✅ MessageModal: sessão carregada com mensagens processadas:', {
          sessionId: loadedSession.id,
          messageCount: loadedSession.messages.length,
          firstProcessedMessage: loadedSession.messages[0] ? {
            id: loadedSession.messages[0].id,
            type: loadedSession.messages[0].type,
            content: loadedSession.messages[0].content?.substring(0, 50)
          } : null
        });

        if (onLoadSession) {
          console.log('📤 MessageModal: Chamando onLoadSession...');
          onLoadSession(loadedSession);
          console.log('✅ MessageModal: onLoadSession chamado com sucesso');
          onClose();
        } else {
          console.error('❌ MessageModal: onLoadSession não está definido!');
        }
      } catch (error) {
        console.error('❌ MessageModal: Erro ao carregar mensagens:', error);
        // Fallback: tentar usar mensagens existentes ou vazias
        const fallbackSession = {
          ...session,
          messages: session.messages || []
        };
        if (onLoadSession) {
          onLoadSession(fallbackSession);
          console.log('✅ MessageModal: onLoadSession chamado (fallback)');
          onClose();
        }
      }
    } else {
      // Para sessões locais, usar como está
      console.log('✅ MessageModal: sessão local carregada');
      if (onLoadSession) {
        onLoadSession(session);
        console.log('✅ MessageModal: onLoadSession chamado (local)');
        onClose();
      }
    }
  };

  // Função helper para mostrar dialog de confirmação
  const showConfirmDialog = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'info' = 'warning') => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
      type
    });
  };

  const handleConfirmDialogClose = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();

    const performDelete = async () => {
      if (isAuthenticated) {
        try {
          setDeletingConversationId(sessionId);
          const deleteSuccess = await authChat.deleteConversation(sessionId);
          if (deleteSuccess) {
            // Forçar refresh das conversas
            setRefreshTrigger(prev => prev + 1);
            showSuccess('Conversa excluída', 'A conversa foi removida com sucesso.');
          } else {
            showError('Erro ao excluir conversa', 'Tente novamente.');
          }
        } catch (err) {
          console.error('Erro ao excluir conversa:', err);
          showError('Erro ao excluir conversa', 'Tente novamente.');
        } finally {
          setDeletingConversationId(null);
        }
      } else {
        deleteLocalSession(sessionId);
      }
    };

    showConfirmDialog(
      'Excluir Conversa',
      'Tem certeza que deseja excluir esta conversa? Esta ação não pode ser desfeita.',
      performDelete,
      'danger'
    );
  };

  const clearAllSessions = async () => {
    const performClearAll = async () => {
      if (isAuthenticated) {
        try {
          setIsClearingAll(true);
          const deleteSuccess = await authChat.deleteAllConversations();
          if (deleteSuccess) {
            // Forçar refresh das conversas
            setRefreshTrigger(prev => prev + 1);
            showSuccess('Conversas limpas', 'Todas as conversas foram removidas com sucesso.');
          } else {
            showError('Erro ao limpar conversas', 'Tente novamente.');
          }
        } catch (error) {
          console.error('Erro ao limpar conversas do banco de dados:', error);
          showError('Erro ao limpar conversas', 'Tente novamente.');
        } finally {
          setIsClearingAll(false);
        }
      } else {
        clearAllLocalSessions();
        showSuccess('Conversas limpas', 'Todas as conversas locais foram removidas.');
      }
    };

    showConfirmDialog(
      'Limpar Todas as Conversas',
      'Tem certeza que deseja limpar todas as conversas? Esta ação não pode ser desfeita.',
      performClearAll,
      'danger'
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(2px)'
      }}
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl">
        {/* Search Bar */}
        <div className="relative mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar..."
            className="w-full bg-gray-200 text-gray-900 px-4 py-3 pr-12 rounded-full placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Conversas Salvas</h2>
          {(localSessions.length > 0 || (isAuthenticated && filteredSessions.length > 0)) && (
            <button
              onClick={clearAllSessions}
              disabled={isClearingAll}
              className="text-red-500 hover:text-red-700 text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isClearingAll ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Limpando...
                </>
              ) : (
                'Limpar Tudo'
              )}
            </button>
          )}
        </div>

        {/* History Section */}
        <div className="max-h-96 overflow-y-auto">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-gray-500">
                {searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa salva'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => handleLoadSession(session)}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer relative group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900 text-sm">
                      {session.title}
                    </h3>
                    <button
                      onClick={(e) => handleDeleteSession(e, session.id)}
                      disabled={deletingConversationId === session.id}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity disabled:opacity-50"
                    >
                      {deletingConversationId === session.id ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-gray-600 text-xs mb-2">
                    {session.messages.length} mensagens
                  </p>
                  <p className="text-gray-500 text-xs">
                    {formatDate(session.updatedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog de Confirmação */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={() => {
          confirmDialog.onConfirm();
          handleConfirmDialogClose();
        }}
        onCancel={handleConfirmDialogClose}
        type={confirmDialog.type}
      />
    </div>
  );
}
