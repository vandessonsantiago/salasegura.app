'use client';

import ChatInput from '@/app/components/ChatInput';

interface LandingFooterProps {
  onSendMessage?: (message: string) => void;
}

export default function LandingFooter({ onSendMessage }: LandingFooterProps = {}) {
  const handleSendMessage = (message: string) => {
    console.log('📤 LandingFooter enviando:', message);
    if (onSendMessage) {
      onSendMessage(message);
    }
  };

  return (
    <footer className="p-4 flex-shrink-0 bg-white border-t border-gray-100">
      <div className="mb-3">
        <ChatInput 
          onSendMessage={handleSendMessage}
          showIcon={false}
          placeholder="Digite sua pergunta..."
        />
      </div>
      
      {/* Legal Text */}
      <p className="text-xs text-gray-500 text-center">
        &copy; {new Date().getFullYear()} Sala Segura™. Todos os direitos reservados.
      </p>
    </footer>
  );
}
