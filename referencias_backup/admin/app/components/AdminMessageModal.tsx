'use client';

import { useState, useEffect } from "react";
import { constants } from "../constants";
import { useChatSessions } from "../../contexts/ChatSessionsContext";
import { ChatSession } from "../../hooks/useAdminChatStorage";

interface AdminMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSession?: (session: ChatSession) => void;
}

export default function AdminMessageModal({ isOpen, onClose, onLoadSession }: AdminMessageModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { sessions, loading, refreshSessions, deleteSession } = useChatSessions();
  const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([]);

  // Filtrar sessões baseado na busca
  useEffect(() => {
    const filtered = searchSessions(searchQuery);
    setFilteredSessions(filtered);
    console.log('📋 Modal atualizado - Sessões:', sessions.length, 'Filtradas:', filtered.length);
  }, [searchQuery, sessions]);

  // Buscar sessões quando o modal é aberto
  useEffect(() => {
    if (isOpen) {
      console.log('🔄 Recarregando sessões com modal aberto');
      refreshSessions();
    }
  }, [isOpen, refreshSessions]);

  const searchSessions = (query: string): ChatSession[] => {
    if (!query.trim()) return sessions;
    
    const lowercaseQuery = query.toLowerCase();
    return sessions.filter(session => 
      session.title.toLowerCase().includes(lowercaseQuery) ||
      session.chat_messages.some(msg => 
        msg.content.toLowerCase().includes(lowercaseQuery)
      )
    );
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleLoadSession = (session: ChatSession) => {
    if (onLoadSession) {
      onLoadSession(session);
      onClose();
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (confirm(constants.messageModal.deleteConfirm)) {
      await deleteSession(sessionId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl">
        {/* Search Bar */}
        <div className="relative mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={constants.messageModal.searchPlaceholder}
            className="w-full bg-gray-200 text-gray-900 px-4 py-3 pr-12 rounded-full placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{constants.messageModal.title}</h2>
        </div>

        {/* History Section */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">{constants.messageModal.loading}</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-gray-500">
                {searchQuery ? constants.messageModal.noConversationsFound : constants.messageModal.noConversationsSaved}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => handleLoadSession(session)}
                  className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{session.title}</h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {session.chat_messages.length} mensagens
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(session.updated_at)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(e, session.id)}
                      className="text-red-500 hover:text-red-700 p-1 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            {constants.messageModal.close}
          </button>
        </div>
      </div>
    </div>
  );
}
