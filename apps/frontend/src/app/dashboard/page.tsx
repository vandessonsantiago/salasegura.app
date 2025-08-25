'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import Loading from '../loading';
import Header from '../components/Header';
import Main, { MainRef } from '../components/Main';
import Footer from '../components/Footer';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const mainRef = useRef<MainRef>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
  }, [user, loading, router]);

  // Função para Footer enviar mensagem para Main
  const handleFooterMessage = (message: string) => {
    console.log('🔄 Dashboard: Footer enviando mensagem para Main:', message);
    if (mainRef.current) {
      mainRef.current.sendMessage(message);
    }
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
      <Header />
      <Main ref={mainRef} isDashboard={true} />
      <Footer onSendMessage={handleFooterMessage} />
    </div>
  );
}
