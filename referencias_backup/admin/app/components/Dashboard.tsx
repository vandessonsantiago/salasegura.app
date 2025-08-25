'use client';

import { useAuth } from '../../contexts/AuthContext';
import DashboardChat from './DashboardChat';
import AdminHeader from './AdminHeader';
import { useState } from 'react';
import { ChatSession } from '../../hooks/useAdminChatStorage';

export default function Dashboard() {
  console.log('🚀 Dashboard component iniciado');
  const { user, loading: authLoading } = useAuth();
  const [isChatStarted, setIsChatStarted] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);

  console.log('🎯 Dashboard renderizando, authLoading:', authLoading);
  
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  const handleBackToStart = () => {
    setIsChatStarted(false);
    setSelectedSession(null);
  };

  const handleLoadSession = (session: ChatSession) => {
    console.log('📂 Carregando sessão:', session);
    setIsChatStarted(true);
    setSelectedSession(session);
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <AdminHeader 
        isChatStarted={isChatStarted}
        onBackToStart={handleBackToStart}
        onLoadSession={handleLoadSession}
      />
      <DashboardChat 
        isChatStarted={isChatStarted}
        onChatStart={() => setIsChatStarted(true)}
        selectedSession={selectedSession}
      />
    </div>
  );
}
