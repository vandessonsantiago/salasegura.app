'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loading from '../loading';
import Header from '../components/Header';
import Main from '../components/Main';
import Footer from '../components/Footer';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
  }, [user, loading, router]);

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
      <Main />
      <Footer />
    </div>
  );
}
