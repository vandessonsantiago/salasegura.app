import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const handleLogoClick = () => {
    // Sempre navegar para a página inicial (main hero)
    router.push('/');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleLoadSession = (session: ChatSession) => {
    console.log('🔄 Header.handleLoadSession chamado:', {
      sessionId: session.id,
      sessionTitle: session.title,
      messageCount: session.messages.length,
      hasOnLoadSession: !!onLoadSession
    });
    if (onLoadSession) {
      console.log('📤 Header: Chamando onLoadSession...');
      onLoadSession(session);
      console.log('✅ Header: onLoadSession chamado com sucesso');
    } else {
      console.log('❌ Header: onLoadSession não definido - verifique se foi passado como prop');
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
                className="text-gray-700 hover:text-teal-600 p-2 rounded-md transition-colors hover:bg-gray-50"
                title="Ver conversas salvas"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              {/* Botão Entrar - só mostrar se não estiver no dashboard */}
              {!showUserMenu && (
                <button
                  onClick={handleLogin}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  Entrar
                </button>
              )}

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