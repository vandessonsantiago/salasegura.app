import Link from "next/link";
import { useState } from "react";
import Logo from "@/components/Logo";
import MessageModal from "@/components/MessageModal";
import { ChatSession } from "@/hooks/useChatStorage";

interface LandingHeaderProps {
  onResetChat?: () => void;
  onLoadSession?: (session: ChatSession) => void;
}

export default function LandingHeader({ onResetChat, onLoadSession }: LandingHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogoClick = () => {
    if (onResetChat) {
      onResetChat();
    }
  };

  const handleLoadSession = (session: ChatSession) => {
    if (onLoadSession) {
      onLoadSession(session);
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button onClick={handleLogoClick} className="focus:outline-none">
                <Logo />
              </button>
            </div>
            <div className="flex space-x-4 items-center">
              {/* Ícone para abrir modal de conversas */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-gray-700 hover:text-teal-600 p-2 rounded-md transition-colors"
                title="Ver conversas salvas"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
              
              <Link
                href="/login"
                className="text-gray-700 hover:text-teal-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Entrar
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Modal de conversas */}
      <MessageModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLoadSession={handleLoadSession}
      />
    </>
  );
}
