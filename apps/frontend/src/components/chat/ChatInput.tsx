import { ArrowUp, ChatCircle } from 'phosphor-react';

interface ChatInputProps {
  title?: string;
  placeholder?: string;
  onSendMessage?: (message: string) => void;
  showIcon?: boolean;
}

export default function ChatInput({
  title = "Como posso te ajudar?",
  placeholder = "Digite sua pergunta...",
  onSendMessage,
  showIcon = true
}: ChatInputProps) {
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const message = formData.get('message') as string;
    
    console.log('📝 ChatInput.handleSubmit:', { message, hasOnSendMessage: !!onSendMessage });
    
    if (message.trim() && onSendMessage) {
      console.log('📤 ChatInput chamando onSendMessage...');
      onSendMessage(message);
      e.currentTarget.reset();
    } else {
      console.log('❌ ChatInput: mensagem vazia ou onSendMessage não definido');
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Chat Header */}
      {title && (
        <div className="flex items-center justify-center gap-2 mb-3">
          {showIcon && <ChatCircle size={20} weight="regular" className="text-gray-600" />}
          <p className="text-lg font-medium text-gray-700">{title}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          name="message"
          placeholder={placeholder}
          className="w-full bg-gray-200 text-gray-900 px-4 py-3 pr-12 rounded-full placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center hover:bg-teal-700 transition-colors"
        >
          <ArrowUp size={16} weight="bold" className="text-white" />
        </button>
      </form>
    </div>
  );
}
