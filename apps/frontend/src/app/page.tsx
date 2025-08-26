"use client"

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Header, Main, Footer, MainRef } from "@/components/layout";
import { ChatSession } from "@/hooks/useChatStorage";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [footerMessage, setFooterMessage] = useState<string>('');
  const mainRef = useRef<MainRef>(null);

  // Se o usuário já está logado, redirecionar para o dashboard
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Função para Footer enviar mensagem para Main
  const handleFooterMessage = (message: string) => {
    console.log('🔄 Página recebeu mensagem do footer:', message);
    // Usar timestamp para garantir que seja uma nova mensagem
    setFooterMessage(`${message}|${Date.now()}`);
  };

  // Função para resetar chat (quando clica no logo)
  const handleResetChat = () => {
    console.log('🔄 Resetando chat');
    // Limpar mensagem do footer para evitar reativação
    setFooterMessage('');
    if (mainRef.current) {
      mainRef.current.resetChat();
    }
  };

  // Função para carregar sessão do modal
  const handleLoadSession = (session: ChatSession) => {
    console.log('🔄 Carregando sessão:', session);
    if (mainRef.current) {
      mainRef.current.loadSession(session);
    }
  };

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  // Se usuário está logado, não mostrar landing page
  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header 
        onResetChat={handleResetChat}
        onLoadSession={handleLoadSession}
      />
      <Main 
        ref={mainRef}
        mode="landing"
        triggerMessage={footerMessage}
        onNewMessage={() => {}}
      />
      <Footer 
        onSendMessage={handleFooterMessage}
        placeholder="Digite sua pergunta..."
      />
    </div>
  );
}
