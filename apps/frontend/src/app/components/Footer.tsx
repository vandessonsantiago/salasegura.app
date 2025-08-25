import IntelligentChatInput from '@/components/IntelligentChatInput';

export default function Footer() {
  return (
    <footer className="p-4 flex-shrink-0 bg-white border-t border-gray-100">
      <div className="mb-3">
        <IntelligentChatInput />
      </div>
      
      {/* Legal Text */}
      <p className="text-xs text-gray-500 text-center">
        &copy; {new Date().getFullYear()} Sala Segura™. Todos os direitos reservados.
      </p>
    </footer>
  );
}
