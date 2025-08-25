'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
// Removido: @supabase/supabase-js não mais utilizado após migração para backend
// const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Room {
  id: string;
  title: string;
  status: string;
  invite_code: string;
  created_at: string;
  participants: Array<{
    id: string;
    role: string;
    status: string;
    users: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
  }>;
}

interface Process {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
}

export default function RoomDashboard() {
  const params = useParams();
  const roomId = params.id as string;
  
  const [room, setRoom] = useState<Room | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    checkAuthAndLoadRoom();
  }, [roomId]);

  const checkAuthAndLoadRoom = async () => {
    try {
      setLoading(true);
      
      // Verificar se o usuário está autenticado via backend
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Usuário não autenticado');
        setLoading(false);
        return;
      }

      const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/session`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!sessionResponse.ok) {
        setError('Sessão inválida');
        setLoading(false);
        return;
      }

      const userData = await sessionResponse.json();
      setUser(userData);

      // Carregar dados da sala
      await loadRoom();
      await loadProcesses();
      
    } catch (err) {
      console.error('Error loading room:', err);
      setError('Erro ao carregar sala');
    } finally {
      setLoading(false);
    }
  };

  const loadRoom = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/rooms/${roomId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar sala');
      }

      const roomData = await response.json();
      setRoom(roomData);
    } catch (err) {
      console.error('Error loading room:', err);
      setError('Erro ao carregar dados da sala');
    }
  };

  const loadProcesses = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/rooms/${roomId}/processes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const processesData = await response.json();
        setProcesses(processesData);
      }
    } catch (err) {
      console.error('Error loading processes:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
      localStorage.removeItem('auth_token');
      window.location.href = '/';
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const copyInviteCode = async () => {
    if (room?.invite_code) {
      try {
        await navigator.clipboard.writeText(room.invite_code);
        alert('Código de convite copiado!');
      } catch (err) {
        console.error('Error copying invite code:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando sala...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Sala não encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                {room.title}
              </h1>
              <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                {room.status}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Coluna 1: Informações da Sala */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Informações da Sala
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Código de Convite
                    </label>
                    <div className="mt-1 flex items-center">
                      <input
                        type="text"
                        value={room.invite_code}
                        readOnly
                        className="flex-1 bg-gray-200 rounded-full px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400"
                      />
                      <button
                        onClick={copyInviteCode}
                        className="ml-2 px-3 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Participantes
                    </label>
                    <div className="mt-1">
                      {room.participants?.map((participant) => (
                        <div key={participant.id} className="flex items-center justify-between py-2">
                          <span className="text-sm text-gray-900">
                            {participant.users.first_name} {participant.users.last_name}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            participant.role === 'host' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {participant.role === 'host' ? 'Anfitrião' : 'Convidado'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Criada em
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(room.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna 2: Processos */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Processos ({processes.length})
                    </h2>
                    <button className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700">
                      Novo Processo
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  {processes.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-4xl mb-4">📋</div>
                      <p className="text-gray-600 mb-4">
                        Nenhum processo criado ainda
                      </p>
                      <p className="text-sm text-gray-500">
                        Comece criando o primeiro processo para organizar o divórcio
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {processes.map((process) => (
                        <div key={process.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {process.title}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {process.description}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                process.priority === 'high' 
                                  ? 'bg-red-100 text-red-800'
                                  : process.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {process.priority}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                process.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : process.status === 'in_progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {process.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

