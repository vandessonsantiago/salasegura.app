'use client';

import { useChatSessions } from '../../contexts/ChatSessionsContext';
import Logo from './Logo';
import UserMenu from './UserMenu';
import AdminMessageModal from './AdminMessageModal';
import { useState } from 'react';
import { ChatSession } from '../../hooks/useAdminChatStorage';

interface AdminHeaderProps {
  isChatStarted: boolean;
  onBackToStart: () => void;
  onLoadSession?: (session: ChatSession) => void;
}

export default function AdminHeader({ isChatStarted, onBackToStart, onLoadSession }: AdminHeaderProps) {
  const { hasSessions } = useChatSessions();
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              {isChatStarted ? (
                // Logo pequeno como gatilho para voltar ao início
                <button
                  onClick={onBackToStart}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <Logo />
                </button>
              ) : (
                // Logo normal
                <Logo />
              )}
            </div>
            
            {/* Icons no canto superior direito */}
            <div className="flex gap-4 ml-auto">
              {/* Ícone de histórico - aparece apenas quando há sessões */}
              {hasSessions && (
                <button 
                  onClick={() => setIsMessageModalOpen(true)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
              )}
              
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Modal de histórico */}
      <AdminMessageModal 
        isOpen={isMessageModalOpen} 
        onClose={() => setIsMessageModalOpen(false)}
        onLoadSession={onLoadSession}
      />
    </>
  );
}
