'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Loading from '../loading';
import { Header, Main, Footer, MainRef } from '@/components/layout';
import UserMenu from '../components/UserMenu';
import Hero from '../components/Hero';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const mainRef = useRef<MainRef>(null);
  const [footerMessage, setFooterMessage] = useState<string>('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
  }, [user, loading, router]);

  // Função para Footer enviar mensagem para Main
  const handleFooterMessage = (message: string) => {
    console.log('🔄 Dashboard: Footer enviando mensagem para Main:', message);
    const timestampedMessage = `${message}|${Date.now()}`;
    setFooterMessage(timestampedMessage);
  };

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return <Loading />;
  }

  // Se não estiver logado, não mostrar dashboard
  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header 
        showUserMenu={true}
        UserMenuComponent={UserMenu}
      />
      <Main 
        ref={mainRef} 
        mode="dashboard"
        HeroComponent={Hero}
        initialMessage={footerMessage}
        onNewMessage={() => {}}
      />
      <Footer 
        onSendMessage={handleFooterMessage}
        placeholder="Pergunte sobre divórcio, pensão alimentícia, guarda..."
      />
    </div>
  );
}
