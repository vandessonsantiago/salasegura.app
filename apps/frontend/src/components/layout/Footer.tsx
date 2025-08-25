'use client';

import { ChatInput } from '@/components/chat';

interface FooterProps {
  onSendMessage?: (message: string) => void;
  placeholder?: string;
  className?: string;
}

export default function Footer({ 
  onSendMessage, 
  placeholder = "Digite sua pergunta...",
  className = ""
}: FooterProps) {
  const handleSendMessage = (message: string) => {
    console.log('📤 Footer enviando:', message);
    if (onSendMessage) {
      onSendMessage(message);
    }
  };

  return (
    <footer className={`p-4 flex-shrink-0 bg-white border-t border-gray-100 ${className}`}>
      <div className="mb-3">
        <ChatInput 
          onSendMessage={handleSendMessage}
          showIcon={false}
          placeholder={placeholder}
        />
      </div>
      
      {/* Legal Text */}
      <p className="text-xs text-gray-500 text-center">
        &copy; {new Date().getFullYear()} Sala Segura™. Todos os direitos reservados.
      </p>
    </footer>
  );
}
