import Link from "next/link";
import { useState } from "react";
import { Logo, MessageModal } from "@/components/ui";
import { ChatSession } from "@/hooks/useChatStorage";

interface HeaderProps {
  // Landing page props
  onResetChat?: () => void;
  onLoadSession?: (session: ChatSession) => void;
  // Dashboard props  
  showUserMenu?: boolean;
  UserMenuComponent?: React.ComponentType;
  onResetDashboard?: () => void; // Nova prop para resetar dashboard
  // Common props
  className?: string;
}

export default function Header({ 
  onResetChat, 
  onLoadSession, 
  showUserMenu = false,
  UserMenuComponent,
  onResetDashboard,
  className = ""
}: HeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogoClick = () => {
    if (onResetChat) {
      onResetChat();
    } else if (onResetDashboard) {
      onResetDashboard();
    }
  };

  const handleLoadSession = (session: ChatSession) => {
    console.log('Loading session from header:', session.id);
    if (onLoadSession) {
      onLoadSession(session);
    }
  };

  return (
    <>
      <header className={`bg-white shadow-sm ${onResetChat ? 'sticky top-0 z-50' : 'border-b border-gray-100'} ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              {(onResetChat || onResetDashboard) ? (
                <button onClick={handleLogoClick} className="focus:outline-none">
                  <Logo />
                </button>
              ) : (
                <Logo />
              )}
            </div>
            
            <div className="flex space-x-4 items-center">
              {/* Ícone para abrir o modal de conversas salvas */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-gray-700 hover:text-teal-600 p-2 rounded-md transition-colors"
                title="Ver conversas salvas"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>

              {/* Modal para conversas salvas */}
              <MessageModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onLoadSession={handleLoadSession}
              />

              {/* Dashboard actions */}
              {showUserMenu && UserMenuComponent && (
                <div className="flex gap-4 ml-auto">
                  <UserMenuComponent />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
