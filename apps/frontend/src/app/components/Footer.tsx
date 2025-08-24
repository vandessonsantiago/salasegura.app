import ChatInput from './ChatInput';

export default function Footer() {
  const handleSendMessage = (message: string) => {
    console.log('Mensagem enviada:', message);
    // Aqui você pode implementar a lógica de envio da mensagem
  };

  return (
    <footer className="p-4 flex-shrink-0 bg-white border-t border-gray-100">
      <div className="mb-3">
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
      
      {/* Legal Text */}
      <p className="text-xs text-gray-500 text-center">
        &copy; {new Date().getFullYear()} Sala Segura™. Todos os direitos reservados.
      </p>
    </footer>
  );
}
